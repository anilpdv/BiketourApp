/**
 * Coordinate Formatter
 * Converts decimal coordinates to DMS (Degrees, Minutes, Seconds) format
 */

export interface FormattedCoordinates {
  decimal: string;
  dms: string;
  latDMS: string;
  lonDMS: string;
  latDecimal: string;
  lonDecimal: string;
}

/**
 * Convert decimal degrees to DMS components
 */
function decimalToDMS(decimal: number): { degrees: number; minutes: number; seconds: number } {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  return { degrees, minutes, seconds };
}

/**
 * Format a single coordinate to DMS string
 */
function formatSingleDMS(decimal: number, isLatitude: boolean): string {
  const { degrees, minutes, seconds } = decimalToDMS(decimal);
  const direction = isLatitude
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Convert decimal coordinates to DMS format
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @returns DMS formatted string like "48° 51' 24" N, 2° 21' 3" E"
 */
export function toDMS(lat: number, lon: number): string {
  const latDMS = formatSingleDMS(lat, true);
  const lonDMS = formatSingleDMS(lon, false);
  return `${latDMS}, ${lonDMS}`;
}

/**
 * Format coordinates in both decimal and DMS formats
 */
export function formatCoordinates(lat: number, lon: number): FormattedCoordinates {
  const latDMS = formatSingleDMS(lat, true);
  const lonDMS = formatSingleDMS(lon, false);
  const latDecimal = lat.toFixed(5);
  const lonDecimal = lon.toFixed(5);

  return {
    decimal: `${latDecimal}, ${lonDecimal}`,
    dms: `${latDMS}, ${lonDMS}`,
    latDMS,
    lonDMS,
    latDecimal,
    lonDecimal,
  };
}

/**
 * Format coordinates for display with labels
 */
export function formatCoordinatesWithLabels(lat: number, lon: number): {
  decimalDisplay: string;
  dmsDisplay: string;
} {
  const coords = formatCoordinates(lat, lon);
  return {
    decimalDisplay: `${coords.latDecimal}\n${coords.lonDecimal}`,
    dmsDisplay: `${coords.latDMS}\n${coords.lonDMS}`,
  };
}
