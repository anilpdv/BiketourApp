import { POICategory } from '../types';

/**
 * POI Category Group Colors
 * Groups related POI categories together with consistent colors
 */

// Group color definitions
export const CATEGORY_GROUP_COLORS = {
  camping: '#2D5016', // Forest Green
  services: '#0891B2', // Teal Blue
  accommodation: '#7C3AED', // Purple
  bike: '#EA580C', // Orange
  food: '#DC2626', // Crimson Red
  emergency: '#E53935', // Bright Red
} as const;

export type POIGroupKey = keyof typeof CATEGORY_GROUP_COLORS;

// Map each category to its parent group
export const CATEGORY_TO_GROUP: Record<POICategory, POIGroupKey> = {
  // Camping
  campsite: 'camping',
  motorhome_spot: 'camping',
  caravan_site: 'camping',
  wild_camping: 'camping',
  // Services
  service_area: 'services',
  toilet: 'services',
  shower: 'services',
  laundry: 'services',
  drinking_water: 'services',
  // Accommodation
  hotel: 'accommodation',
  hostel: 'accommodation',
  guest_house: 'accommodation',
  shelter: 'accommodation',
  // Bike
  bike_shop: 'bike',
  bike_repair: 'bike',
  // Food
  restaurant: 'food',
  supermarket: 'food',
  picnic_site: 'camping',
  // Emergency
  hospital: 'emergency',
  pharmacy: 'emergency',
  police: 'emergency',
};

/**
 * Get the group color for a POI category
 */
export function getCategoryGroupColor(category: POICategory): string {
  const group = CATEGORY_TO_GROUP[category];
  return CATEGORY_GROUP_COLORS[group] || '#666666';
}

/**
 * Get all categories in a specific group
 */
export function getCategoriesInGroup(group: POIGroupKey): POICategory[] {
  return (
    Object.entries(CATEGORY_TO_GROUP) as [POICategory, POIGroupKey][]
  )
    .filter(([_, g]) => g === group)
    .map(([cat]) => cat);
}
