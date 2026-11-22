import {
  calculateDistanceMeters,
  calculateProximityScore,
  isWithinRadius,
} from '../algorithms/matching/proximity';
import {
  getVehicleDefaultCapacity,
  calculateRemainingCapacity,
  canAccommodateWeight,
  calculateCapacityScore,
} from '../algorithms/matching/capacity';
import {
  isCollectorEligible,
  filterEligibleCollectors,
  CollectorCandidate,
  PickupRequirement,
} from '../algorithms/matching/eligibility';
import {
  calculateMatchScore,
  rankCollectors,
} from '../algorithms/matching/scoring';

describe('Matching Algorithm Suite', () => {
  describe('Proximity Algorithm (proximity.ts)', () => {
    it('calculates geodesic distance accurately with Haversine', () => {
      // Colombo Fort to Dehiwala (~8.4 km)
      const distance = calculateDistanceMeters(6.9271, 79.8612, 6.8511, 79.8653);
      expect(distance).toBeGreaterThan(8000);
      expect(distance).toBeLessThan(9000);
    });

    it('returns 0 distance for identical coordinates', () => {
      const distance = calculateDistanceMeters(6.9271, 79.8612, 6.9271, 79.8612);
      expect(distance).toBe(0);
    });

    it('computes decay proximity scores properly', () => {
      expect(calculateProximityScore(0, 10000)).toBe(100);
      expect(calculateProximityScore(10000, 10000)).toBe(0);
      expect(calculateProximityScore(15000, 10000)).toBe(0);

      // At 5km of 10km (halfway), score should be between 30 and 45 due to non-linear decay
      const midScore = calculateProximityScore(5000, 10000);
      expect(midScore).toBeGreaterThan(25);
      expect(midScore).toBeLessThan(50);
    });

    it('correctly evaluates isWithinRadius', () => {
      expect(isWithinRadius(4999, 5000)).toBe(true);
      expect(isWithinRadius(5000, 5000)).toBe(true);
      expect(isWithinRadius(5001, 5000)).toBe(false);
    });
  });

  describe('Capacity Algorithm (capacity.ts)', () => {
    it('returns vehicle default capacities', () => {
      expect(getVehicleDefaultCapacity('TRUCK')).toBe(2500);
      expect(getVehicleDefaultCapacity('PICKUP')).toBe(850);
      expect(getVehicleDefaultCapacity('VAN')).toBe(500);
      expect(getVehicleDefaultCapacity('THREE_WHEELER')).toBe(250);
      expect(getVehicleDefaultCapacity('BICYCLE')).toBe(60);
      expect(getVehicleDefaultCapacity('UNKNOWN')).toBe(500);
    });

    it('calculates remaining payload capacity', () => {
      expect(calculateRemainingCapacity(850, 300)).toBe(550);
      expect(calculateRemainingCapacity(500, 600)).toBe(0);
    });

    it('validates canAccommodateWeight', () => {
      expect(canAccommodateWeight(500, 300, 150)).toBe(true); // 450 <= 500
      expect(canAccommodateWeight(500, 450, 100)).toBe(false); // 550 > 500
    });

    it('disqualifies overloaded vehicles with a 0 score', () => {
      expect(calculateCapacityScore(500, 450, 100)).toBe(0);
    });

    it('awards high score (90-100) for optimal utilization (60% to 95%)', () => {
      // 500 cap, 300 current, 100 new = 400 total (80% utilization)
      const score = calculateCapacityScore(500, 300, 100);
      expect(score).toBeGreaterThanOrEqual(90);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Eligibility Rules (eligibility.ts)', () => {
    const validCandidate: CollectorCandidate = {
      userId: 'col-1',
      name: 'Kamal Perera',
      vehicleType: 'PICKUP',
      vehicleCapacity: 850,
      isAvailable: true,
      accountStatus: 'ACTIVE',
      latitude: 6.9271,
      longitude: 79.8612,
      rating: 4.9,
      completedPickups: 38,
      activeStopsCount: 1,
      currentRouteLoadKg: 120,
    };

    const validPickup: PickupRequirement = {
      id: 'pick-1',
      wasteType: 'PLASTIC',
      estimatedWeight: 15,
      latitude: 6.93,
      longitude: 79.865,
    };

    it('accepts an active, available, qualified driver', () => {
      const result = isCollectorEligible(validCandidate, validPickup);
      expect(result.eligible).toBe(true);
    });

    it('rejects offline collectors', () => {
      const offline = { ...validCandidate, isAvailable: false };
      const result = isCollectorEligible(offline, validPickup);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('offline');
    });

    it('rejects collectors with suspended accounts', () => {
      const suspended = { ...validCandidate, accountStatus: 'SUSPENDED' };
      const result = isCollectorEligible(suspended, validPickup);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('not active');
    });

    it('rejects collectors without active GPS coordinates', () => {
      const noGps = { ...validCandidate, latitude: null, longitude: null };
      const result = isCollectorEligible(noGps, validPickup);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('GPS');
    });

    it('rejects cargo bicycles for heavy payloads (> 60 kg)', () => {
      const bike = { ...validCandidate, vehicleType: 'BICYCLE', vehicleCapacity: 60 };
      const heavyPickup = { ...validPickup, estimatedWeight: 80 };
      const result = isCollectorEligible(bike, heavyPickup);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('bicycle');
    });

    it('rejects bicycles for certified E-Waste or Hazard streams', () => {
      const bike = { ...validCandidate, vehicleType: 'BICYCLE' };
      const ewaste = { ...validPickup, wasteType: 'E_WASTE', estimatedWeight: 10 };
      const result = isCollectorEligible(bike, ewaste);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('E-Waste');
    });

    it('filters arrays with filterEligibleCollectors', () => {
      const list = [
        validCandidate,
        { ...validCandidate, userId: 'col-2', isAvailable: false },
      ];
      const eligible = filterEligibleCollectors(list, validPickup);
      expect(eligible.length).toBe(1);
      expect(eligible[0].userId).toBe('col-1');
    });
  });

  describe('Scoring & Ranking Engine (scoring.ts)', () => {
    const pickup: PickupRequirement = {
      id: 'pick-100',
      wasteType: 'PLASTIC',
      estimatedWeight: 10,
      latitude: 6.9271,
      longitude: 79.8612,
    };

    it('calculates comprehensive match score and flags recommended drivers', () => {
      // Driver right next to pickup, 4.9 rating, low stops
      const idealDriver: CollectorCandidate = {
        userId: 'col-ideal',
        name: 'Kamal Perera',
        vehicleType: 'VAN',
        vehicleCapacity: 500,
        isAvailable: true,
        accountStatus: 'ACTIVE',
        latitude: 6.9275, // ~50m away
        longitude: 79.8615,
        rating: 4.9,
        completedPickups: 50,
        activeStopsCount: 0,
        currentRouteLoadKg: 200,
      };

      const result = calculateMatchScore(idealDriver, pickup);
      expect(result.isEligible).toBe(true);
      expect(result.totalScore).toBeGreaterThanOrEqual(85);
      expect(result.recommended).toBe(true);
      expect(result.distanceMeters).toBeLessThan(100);
    });

    it('ranks collectors in descending order of match score', () => {
      const closeDriver: CollectorCandidate = {
        userId: 'col-close',
        name: 'Close Driver',
        vehicleType: 'VAN',
        vehicleCapacity: 500,
        isAvailable: true,
        accountStatus: 'ACTIVE',
        latitude: 6.928, // ~150m
        longitude: 79.862,
        rating: 4.8,
        completedPickups: 30,
      };

      const farDriver: CollectorCandidate = {
        userId: 'col-far',
        name: 'Far Driver',
        vehicleType: 'VAN',
        vehicleCapacity: 500,
        isAvailable: true,
        accountStatus: 'ACTIVE',
        latitude: 6.82, // ~12 km away
        longitude: 79.88,
        rating: 4.2,
        completedPickups: 10,
      };

      const offlineDriver: CollectorCandidate = {
        userId: 'col-offline',
        name: 'Offline Driver',
        vehicleType: 'TRUCK',
        vehicleCapacity: 2500,
        isAvailable: false,
        accountStatus: 'ACTIVE',
        latitude: 6.9271,
        longitude: 79.8612,
        rating: 5.0,
        completedPickups: 100,
      };

      const ranked = rankCollectors([farDriver, offlineDriver, closeDriver], pickup);

      // Offline driver should be filtered out
      expect(ranked.length).toBe(2);
      // Close driver should be ranked #1
      expect(ranked[0].collector.userId).toBe('col-close');
      expect(ranked[1].collector.userId).toBe('col-far');
      expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
    });
  });
});
