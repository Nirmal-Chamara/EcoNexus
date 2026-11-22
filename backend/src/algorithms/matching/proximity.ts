/**
 * proximity.ts
 *
 * Geospatial distance calculation and proximity decay scoring
 * for matching collectors to pickup requests.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates geodesic distance between two latitude/longitude points in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns true if the distance is within the specified radius threshold.
 */
export function isWithinRadius(distanceMeters: number, maxRadiusMeters: number): boolean {
  return distanceMeters <= maxRadiusMeters;
}

/**
 * Computes a normalized proximity score from 0 to 100.
 *
 * Collectors closer to 0m receive 100 points.
 * Scores decay smoothly toward 0 as distance approaches maxRadiusMeters.
 */
export function calculateProximityScore(
  distanceMeters: number,
  maxRadiusMeters: number = 25000
): number {
  if (distanceMeters <= 0) return 100;
  if (distanceMeters >= maxRadiusMeters) return 0;

  // Smooth quadratic decay curve
  const normalizedDistance = distanceMeters / maxRadiusMeters;
  const score = 100 * Math.pow(1 - normalizedDistance, 1.5);
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}
