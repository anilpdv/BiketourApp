/**
 * Opening Hours Parser
 * Parses OSM opening_hours format to determine current open status
 */

export interface OpeningHoursResult {
  isOpen: boolean;
  todayHours?: string;
  nextChange?: string;
  rawHours: string;
}

// Day mappings for OSM format
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse time string (e.g., "08:00") to minutes since midnight
 */
function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight
 */
function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Get current day index (0 = Sunday, 6 = Saturday)
 */
function getCurrentDayIndex(): number {
  return new Date().getDay();
}

/**
 * Parse day range (e.g., "Mo-Fr" or "Mo,We,Fr" or "Mo")
 * Returns array of day indices (0-6)
 */
function parseDayRange(dayStr: string): number[] {
  const days: number[] = [];

  // Handle ranges like "Mo-Fr"
  if (dayStr.includes('-')) {
    const parts = dayStr.split('-');
    if (parts.length === 2) {
      const startIdx = DAY_NAMES.indexOf(parts[0]);
      const endIdx = DAY_NAMES.indexOf(parts[1]);
      if (startIdx !== -1 && endIdx !== -1) {
        // Handle wrap-around (e.g., "Fr-Mo")
        let current = startIdx;
        while (true) {
          days.push(current);
          if (current === endIdx) break;
          current = (current + 1) % 7;
        }
      }
    }
  }
  // Handle comma-separated days like "Mo,We,Fr"
  else if (dayStr.includes(',')) {
    const parts = dayStr.split(',');
    for (const part of parts) {
      const idx = DAY_NAMES.indexOf(part.trim());
      if (idx !== -1) days.push(idx);
    }
  }
  // Single day like "Mo"
  else {
    const idx = DAY_NAMES.indexOf(dayStr);
    if (idx !== -1) days.push(idx);
  }

  return days;
}

/**
 * Parse time range (e.g., "08:00-18:00" or "08:00-12:00,13:00-17:00")
 * Returns array of [start, end] tuples in minutes
 */
function parseTimeRanges(timeStr: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const parts = timeStr.split(',');

  for (const part of parts) {
    const rangeParts = part.trim().split('-');
    if (rangeParts.length === 2) {
      const start = parseTime(rangeParts[0].trim());
      const end = parseTime(rangeParts[1].trim());
      if (start !== null && end !== null) {
        ranges.push([start, end]);
      }
    }
  }

  return ranges;
}

/**
 * Check if current time is within any of the time ranges
 */
function isWithinTimeRanges(currentMinutes: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    // Handle overnight ranges (e.g., 22:00-02:00)
    if (end < start) {
      if (currentMinutes >= start || currentMinutes < end) {
        return true;
      }
    } else {
      if (currentMinutes >= start && currentMinutes < end) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Format time ranges for display
 */
function formatTimeRanges(ranges: Array<[number, number]>): string {
  return ranges
    .map(([start, end]) => {
      const startHours = Math.floor(start / 60);
      const startMins = start % 60;
      const endHours = Math.floor(end / 60);
      const endMins = end % 60;
      const startStr = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
      const endStr = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      return `${startStr}-${endStr}`;
    })
    .join(', ');
}

/**
 * Find next status change time
 */
function findNextChange(
  currentMinutes: number,
  currentDay: number,
  isCurrentlyOpen: boolean,
  scheduleForDay: Map<number, Array<[number, number]>>
): string | undefined {
  // Look for next change in current day first
  const todayRanges = scheduleForDay.get(currentDay);
  if (todayRanges) {
    for (const [start, end] of todayRanges) {
      if (isCurrentlyOpen && end > currentMinutes) {
        const hours = Math.floor(end / 60);
        const mins = end % 60;
        return `Closes at ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
      if (!isCurrentlyOpen && start > currentMinutes) {
        const hours = Math.floor(start / 60);
        const mins = start % 60;
        return `Opens at ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    }
  }

  // Look at next days
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (currentDay + offset) % 7;
    const dayRanges = scheduleForDay.get(nextDay);
    if (dayRanges && dayRanges.length > 0) {
      const [start] = dayRanges[0];
      const hours = Math.floor(start / 60);
      const mins = start % 60;
      const dayName = offset === 1 ? 'tomorrow' : DAY_FULL_NAMES[nextDay];
      return `Opens ${dayName} at ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  }

  return undefined;
}

/**
 * Parse OSM opening_hours string
 * Supports common formats:
 * - "24/7"
 * - "Mo-Fr 08:00-18:00"
 * - "Mo-Sa 09:00-20:00; Su 10:00-18:00"
 * - "Mo-Fr 08:00-12:00,13:00-17:00"
 */
export function parseOpeningHours(osmHours: string | undefined): OpeningHoursResult | null {
  if (!osmHours) return null;

  const rawHours = osmHours.trim();

  // Handle 24/7
  if (rawHours === '24/7') {
    return {
      isOpen: true,
      todayHours: '24 hours',
      nextChange: undefined,
      rawHours,
    };
  }

  // Handle "closed" or "off"
  if (rawHours.toLowerCase() === 'closed' || rawHours.toLowerCase() === 'off') {
    return {
      isOpen: false,
      todayHours: 'Closed',
      rawHours,
    };
  }

  const currentMinutes = getCurrentMinutes();
  const currentDay = getCurrentDayIndex();

  // Build schedule map: day index -> time ranges
  const scheduleForDay = new Map<number, Array<[number, number]>>();

  // Split by semicolon for multiple rules
  const rules = rawHours.split(';');

  for (const rule of rules) {
    const trimmedRule = rule.trim();
    if (!trimmedRule) continue;

    // Try to match "Days Times" pattern
    // e.g., "Mo-Fr 08:00-18:00" or "Su 10:00-16:00"
    const match = trimmedRule.match(/^([A-Za-z,\-]+)\s+(.+)$/);
    if (match) {
      const dayPart = match[1];
      const timePart = match[2];
      const days = parseDayRange(dayPart);
      const timeRanges = parseTimeRanges(timePart);

      for (const day of days) {
        const existing = scheduleForDay.get(day) || [];
        scheduleForDay.set(day, [...existing, ...timeRanges]);
      }
    }
    // Handle time-only format (applies to all days)
    else {
      const timeRanges = parseTimeRanges(trimmedRule);
      if (timeRanges.length > 0) {
        for (let day = 0; day < 7; day++) {
          const existing = scheduleForDay.get(day) || [];
          scheduleForDay.set(day, [...existing, ...timeRanges]);
        }
      }
    }
  }

  // Check if currently open
  const todayRanges = scheduleForDay.get(currentDay);
  const isOpen = todayRanges ? isWithinTimeRanges(currentMinutes, todayRanges) : false;

  // Format today's hours
  const todayHours = todayRanges && todayRanges.length > 0
    ? formatTimeRanges(todayRanges)
    : 'Closed today';

  // Find next status change
  const nextChange = findNextChange(currentMinutes, currentDay, isOpen, scheduleForDay);

  return {
    isOpen,
    todayHours,
    nextChange,
    rawHours,
  };
}

/**
 * Get simplified open status text
 */
export function getOpenStatusText(result: OpeningHoursResult | null): string {
  if (!result) return '';
  return result.isOpen ? 'Open now' : 'Closed';
}

/**
 * Check if POI has valid opening hours
 */
export function hasOpeningHours(osmHours: string | undefined): boolean {
  return !!osmHours && osmHours.trim().length > 0;
}
