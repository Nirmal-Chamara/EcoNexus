/**
 * capacity.ts
 *
 * Vehicle payload capacity calculation and utilization scoring
 * for matching collectors to pickup orders.
 */

export const VEHICLE_CAPACITIES_KG: Record<string, number> = {
  TRUCK: 2500,
  PICKUP: 850,
  VAN: 500,
  THREE_WHEELER: 250,
  BICYCLE: 60,
};

/**
 * Returns the default maximum capacity in kg for a given vehicle type.
 */
export function getVehicleDefaultCapacity(vehicleType: string = 'VAN'): number {
  const norm = (vehicleType || '').toUpperCase().trim();
  return VEHICLE_CAPACITIES_KG[norm] || 500;
}

/**
 * Calculates remaining available payload capacity in kg.
 */
export function calculateRemainingCapacity(
  maxCapacityKg: number,
  currentLoadKg: number
): number {
  return Math.max(0, maxCapacityKg - currentLoadKg);
}

/**
 * Returns true if the vehicle can safely accept the additional weight
 * without exceeding maximum payload capacity.
 */
export function canAccommodateWeight(
  maxCapacityKg: number,
  currentLoadKg: number,
  requestWeightKg: number
): boolean {
  return currentLoadKg + requestWeightKg <= maxCapacityKg;
}

/**
 * Calculates a capacity fit score from 0 to 100.
 *
 * - Overloaded (> 100% capacity): 0 points.
 * - Optimal utilization (60% to 90% full after adding load): 90-100 points.
 * - Under-utilized (< 30% full with large truck for tiny order): lower score to prevent wasting heavy fleet on micro-pickups.
 */
export function calculateCapacityScore(
  maxCapacityKg: number,
  currentLoadKg: number,
  requestWeightKg: number
): number {
  if (maxCapacityKg <= 0) return 0;
  const totalLoad = currentLoadKg + requestWeightKg;

  // Immediate disqualification if payload exceeded
  if (totalLoad > maxCapacityKg) return 0;

  const utilizationRatio = totalLoad / maxCapacityKg; // 0.0 to 1.0

  if (utilizationRatio >= 0.6 && utilizationRatio <= 0.95) {
    // Sweet spot: 90 to 100 points
    return Math.round(90 + (utilizationRatio - 0.6) * (10 / 0.35));
  } else if (utilizationRatio < 0.6) {
    // Under-utilized: scales between 50 and 90
    return Math.round(50 + utilizationRatio * (40 / 0.6));
  } else {
    // Near maximum threshold (95% - 100%): 80 points
    return 80;
  }
}
