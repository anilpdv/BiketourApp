/**
 * Shared Formatting Utilities
 * Consistent formatting for distances, durations, and other values
 */

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string like "500 m" or "2.5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format distance from kilometers for display
 * @param km - Distance in kilometers (can be undefined)
 * @returns Formatted string or null if undefined
 */
export function formatDistanceKm(km: number | undefined): string | null {
  if (km === undefined) return null;
  return formatDistance(km * 1000);
}

/**
 * Format duration for display
 * @param seconds - Duration in seconds
 * @returns Formatted string like "45 min" or "2h 30m"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
}
