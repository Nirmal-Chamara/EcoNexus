/**
 * eligibility.ts
 *
 * Operational rules and compliance filters to ensure a collector
 * is certified and equipped for a specific pickup order.
 */

export interface CollectorCandidate {
  userId: string;
  name: string;
  vehicleType: string;
  vehicleCapacity: number;
  isAvailable: boolean;
  accountStatus: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  completedPickups: number;
  activeStopsCount?: number;
  currentRouteLoadKg?: number;
  acceptedStreams?: string[];
}

export interface PickupRequirement {
  id: string;
  wasteType: string;
  estimatedWeight: number;
  latitude: number;
  longitude: number;
  scheduledTime?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Checks if a collector candidate meets all strict operational criteria for a pickup.
 */
export function isCollectorEligible(
  collector: CollectorCandidate,
  pickup: PickupRequirement
): EligibilityResult {
  // 1. Availability check
  if (!collector.isAvailable) {
    return { eligible: false, reason: 'Collector is currently marked offline' };
  }

  // 2. Account standing check
  if (collector.accountStatus && collector.accountStatus !== 'ACTIVE') {
    return {
      eligible: false,
      reason: `Collector account is not active (status: ${collector.accountStatus})`,
    };
  }

  // 3. Location validity
  if (collector.latitude === null || collector.longitude === null) {
    return { eligible: false, reason: 'Collector has no active GPS broadcast location' };
  }

  const vType = (collector.vehicleType || '').toUpperCase().trim();
  const weight = Number(pickup.estimatedWeight) || 0;
  const wType = (pickup.wasteType || '').toUpperCase().trim();

  // 4. Weight limits per vehicle category
  if (weight > 60 && vType === 'BICYCLE') {
    return { eligible: false, reason: 'Cargo bicycle payload limit (60 kg) exceeded' };
  }

  if (weight > 250 && vType === 'THREE_WHEELER') {
    return { eligible: false, reason: 'Three-wheeler payload limit (250 kg) exceeded' };
  }

  // 5. Stream-specific vehicle safety rules
  if (wType.includes('E_WASTE') || wType.includes('E-WASTE') || wType.includes('HAZARD')) {
    if (vType === 'BICYCLE') {
      return { eligible: false, reason: 'Bicycle prohibited for certified E-Waste / Hazardous handling' };
    }
  }

  // 6. Configured accepted waste streams filter (if specified on collector profile)
  if (collector.acceptedStreams && collector.acceptedStreams.length > 0) {
    const isStreamAccepted = collector.acceptedStreams.some((s) =>
      wType.toLowerCase().includes(s.toLowerCase())
    );
    if (!isStreamAccepted) {
      return { eligible: false, reason: `Collector does not accept ${pickup.wasteType}` };
    }
  }

  return { eligible: true };
}

/**
 * Filters an array of collector candidates, retaining only eligible haulers.
 */
export function filterEligibleCollectors(
  collectors: CollectorCandidate[],
  pickup: PickupRequirement
): CollectorCandidate[] {
  return collectors.filter((c) => isCollectorEligible(c, pickup).eligible);
}
