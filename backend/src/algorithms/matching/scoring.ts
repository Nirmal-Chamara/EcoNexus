/**
 * scoring.ts
 *
 * Multi-criteria ranking and scoring engine for pairing collectors
 * with citizen waste pickup requests.
 */

import { calculateDistanceMeters, calculateProximityScore } from './proximity';
import {
  getVehicleDefaultCapacity,
  canAccommodateWeight,
  calculateCapacityScore,
} from './capacity';
import { CollectorCandidate, PickupRequirement, isCollectorEligible } from './eligibility';

export interface ScoreBreakdown {
  proximityScore: number;
  capacityScore: number;
  ratingScore: number;
  workloadScore: number;
}

export interface ScoredCollector {
  collector: CollectorCandidate;
  totalScore: number;
  distanceMeters: number;
  distanceKm: number;
  scores: ScoreBreakdown;
  isEligible: boolean;
  ineligibilityReason?: string;
  recommended: boolean;
}

// Configurable weights (sum = 1.0)
const WEIGHT_PROXIMITY = 0.45;
const WEIGHT_CAPACITY = 0.25;
const WEIGHT_RATING = 0.20;
const WEIGHT_WORKLOAD = 0.10;

/**
 * Computes an overall match score (0 to 100) for a collector and pickup pair.
 */
export function calculateMatchScore(
  collector: CollectorCandidate,
  pickup: PickupRequirement,
  maxRadiusMeters: number = 25000
): ScoredCollector {
  // 1. Eligibility check
  const eligibility = isCollectorEligible(collector, pickup);
  if (!eligibility.eligible) {
    return {
      collector,
      totalScore: 0,
      distanceMeters: 0,
      distanceKm: 0,
      scores: {
        proximityScore: 0,
        capacityScore: 0,
        ratingScore: 0,
        workloadScore: 0,
      },
      isEligible: false,
      ineligibilityReason: eligibility.reason,
      recommended: false,
    };
  }

  // 2. Proximity calculation
  const distance = calculateDistanceMeters(
    collector.latitude!,
    collector.longitude!,
    pickup.latitude,
    pickup.longitude
  );
  const proximityScore = calculateProximityScore(distance, maxRadiusMeters);

  // 3. Capacity calculation
  const maxCap = collector.vehicleCapacity || getVehicleDefaultCapacity(collector.vehicleType);
  const currentLoad = collector.currentRouteLoadKg || 0;
  const capacityScore = calculateCapacityScore(maxCap, currentLoad, pickup.estimatedWeight || 1);

  // 4. Rating & Reliability score (0 to 100)
  // Rating is on a 0.0 - 5.0 scale (e.g. 4.9 -> 98 points)
  const ratingScore = Math.min(100, Math.max(0, (collector.rating || 5.0) * 20));

  // 5. Workload balancing score (0 to 100)
  // Drivers with fewer active stops get higher preference to prevent route fatigue
  const activeStops = collector.activeStopsCount || 0;
  const workloadScore = Math.max(10, 100 - activeStops * 15);

  // Weighted total
  const rawTotal =
    proximityScore * WEIGHT_PROXIMITY +
    capacityScore * WEIGHT_CAPACITY +
    ratingScore * WEIGHT_RATING +
    workloadScore * WEIGHT_WORKLOAD;

  const totalScore = Math.round(rawTotal * 10) / 10;

  return {
    collector,
    totalScore,
    distanceMeters: distance,
    distanceKm: Math.round((distance / 1000) * 10) / 10,
    scores: {
      proximityScore,
      capacityScore,
      ratingScore,
      workloadScore,
    },
    isEligible: true,
    recommended: totalScore >= 70,
  };
}

/**
 * Ranks all collector candidates by match score in descending order.
 */
export function rankCollectors(
  collectors: CollectorCandidate[],
  pickup: PickupRequirement,
  maxRadiusMeters: number = 25000
): ScoredCollector[] {
  const scored = collectors.map((c) => calculateMatchScore(c, pickup, maxRadiusMeters));

  // Filter out ineligible and sort by total score descending
  return scored
    .filter((s) => s.isEligible && s.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}
