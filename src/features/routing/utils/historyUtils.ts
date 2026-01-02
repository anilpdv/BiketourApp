/**
 * Routing History Utilities
 * Provides reusable history management and waypoint type assignment
 */

import { Waypoint, Coordinate, RouteHistoryEntry } from '../types';

const MAX_HISTORY_SIZE = 50;

/**
 * Creates a deep-cloned history entry for undo/redo
 */
export function createHistoryEntry(
  waypoints: Waypoint[],
  geometry: Coordinate[]
): RouteHistoryEntry {
  return {
    waypoints: JSON.parse(JSON.stringify(waypoints)),
    geometry: JSON.parse(JSON.stringify(geometry)),
    timestamp: Date.now(),
  };
}

/**
 * Push a new entry to history with proper truncation and size limiting
 * Returns the new history array and new history index
 */
export function pushToHistory(
  history: RouteHistoryEntry[],
  historyIndex: number,
  entry: RouteHistoryEntry,
  maxSize: number = MAX_HISTORY_SIZE
): { history: RouteHistoryEntry[]; historyIndex: number } {
  // Truncate any forward history (discard redo stack)
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(entry);

  // Limit history size
  if (newHistory.length > maxSize) {
    newHistory.shift();
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

/**
 * Assigns waypoint types based on position in array
 * First waypoint = 'start', last = 'end', middle = 'via'
 * Also updates order property
 */
export function assignWaypointTypes<T extends Pick<Waypoint, 'type' | 'order'>>(
  waypoints: T[]
): T[] {
  return waypoints.map((wp, index) => ({
    ...wp,
    type:
      index === 0
        ? ('start' as const)
        : index === waypoints.length - 1
        ? ('end' as const)
        : ('via' as const),
    order: index,
  }));
}

/**
 * Converts the last endpoint to a via point when adding a new endpoint
 * Used when adding a waypoint to convert previous end to via
 */
export function convertEndToVia<T extends Pick<Waypoint, 'type'>>(
  waypoints: T[]
): T[] {
  return waypoints.map((wp) =>
    wp.type === 'end' ? { ...wp, type: 'via' as const } : wp
  );
}

/**
 * Restore waypoints and geometry from a history entry (deep clone)
 */
export function restoreFromHistory(
  entry: RouteHistoryEntry
): { waypoints: Waypoint[]; geometry: Coordinate[] } {
  return {
    waypoints: JSON.parse(JSON.stringify(entry.waypoints)),
    geometry: JSON.parse(JSON.stringify(entry.geometry)),
  };
}
