import { POICategoryGroup, POICategory } from '../types';

/**
 * POI Category Groups
 * Organizes categories into logical groups for the UI
 */
export const POI_CATEGORY_GROUPS: POICategoryGroup[] = [
  {
    id: 'camping',
    name: 'Camping',
    icon: 'tent',
    categories: ['campsite', 'motorhome_spot', 'caravan_site', 'wild_camping'],
  },
  {
    id: 'services',
    name: 'Services',
    icon: 'wrench',
    categories: [
      'service_area',
      'toilet',
      'shower',
      'laundry',
      'drinking_water',
    ],
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: 'bed',
    categories: ['hotel', 'hostel', 'guest_house', 'shelter'],
  },
  {
    id: 'bike',
    name: 'Bike',
    icon: 'bicycle',
    categories: ['bike_shop', 'bike_repair'],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: 'silverware-fork-knife',
    categories: ['restaurant', 'supermarket', 'picnic_site'],
  },
];

/**
 * Location Type Grid
 * Primary location types displayed in 2x2 grid on filters modal
 * These are the main camping-focused categories
 */
export const LOCATION_TYPE_GRID: POICategoryGroup[] = [
  {
    id: 'campsite',
    name: 'Campsite',
    icon: 'tent',
    categories: ['campsite'],
  },
  {
    id: 'motorhome',
    name: 'Motorhome spot',
    icon: 'caravan',
    categories: ['motorhome_spot'],
  },
  {
    id: 'service',
    name: 'Service area',
    icon: 'gas-station',
    categories: ['service_area'],
  },
  {
    id: 'wild',
    name: 'Wild camping',
    icon: 'pine-tree',
    categories: ['wild_camping'],
  },
];

/**
 * Get all categories from a group
 */
export function getCategoriesFromGroup(groupId: string): POICategory[] {
  const group = POI_CATEGORY_GROUPS.find((g) => g.id === groupId);
  return group?.categories ?? [];
}

/**
 * Get group for a category
 */
export function getGroupForCategory(
  category: POICategory
): POICategoryGroup | undefined {
  return POI_CATEGORY_GROUPS.find((g) => g.categories.includes(category));
}

/**
 * Check if category is in the primary location grid
 */
export function isPrimaryCategory(category: POICategory): boolean {
  return LOCATION_TYPE_GRID.some((g) => g.categories.includes(category));
}
