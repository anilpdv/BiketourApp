import { POICategory } from '../types';

/**
 * POI Category Group Colors - Cyclist Priority Design
 * Simplified 5-group system with visual hierarchy
 */

// New simplified color palette (4 main colors + gray for hidden)
export const CATEGORY_GROUP_COLORS = {
  services: '#0EA5E9', // Sky Blue - water, toilets, showers
  rest: '#16A34A', // Forest Green - camping + accommodation merged
  bike: '#F97316', // Bright Orange - bike shops, repair
  emergency: '#DC2626', // Alert Red - hospitals, pharmacies
  food: '#6B7280', // Neutral Gray - hidden by default
} as const;

export type POIGroupKey = keyof typeof CATEGORY_GROUP_COLORS;

// Priority levels for marker size hierarchy
export type POIPriority = 'essential' | 'important' | 'secondary' | 'optional';

// Map each category to its parent group
export const CATEGORY_TO_GROUP: Record<POICategory, POIGroupKey> = {
  // Services (Blue) - essential utilities
  drinking_water: 'services',
  toilet: 'services',
  shower: 'services',
  laundry: 'services',
  service_area: 'services',

  // Rest (Green) - camping + accommodation merged
  campsite: 'rest',
  motorhome_spot: 'rest',
  wild_camping: 'rest',
  caravan_site: 'rest',
  hotel: 'rest',
  hostel: 'rest',
  guest_house: 'rest',
  shelter: 'rest',
  picnic_site: 'rest',

  // Bike (Orange)
  bike_shop: 'bike',
  bike_repair: 'bike',

  // Emergency (Red)
  hospital: 'emergency',
  pharmacy: 'emergency',
  police: 'emergency',

  // Food (Gray - hidden by default)
  restaurant: 'food',
  supermarket: 'food',
};

// Priority mapping - determines marker size
// Bike touring priority: SLEEP first, then bike services, then amenities
export const CATEGORY_PRIORITY: Record<POICategory, POIPriority> = {
  // Essential - WHERE TO SLEEP (biggest markers)
  campsite: 'essential',
  wild_camping: 'essential',
  shelter: 'essential',

  // Important - BIKE SERVICES (medium markers)
  bike_shop: 'important',
  bike_repair: 'important',

  // Secondary - BASIC AMENITIES (small markers)
  drinking_water: 'secondary',
  toilet: 'secondary',
  shower: 'secondary',
  hotel: 'secondary',
  hostel: 'secondary',
  motorhome_spot: 'secondary',
  guest_house: 'secondary',
  caravan_site: 'secondary',
  laundry: 'secondary',
  service_area: 'secondary',

  // Optional - EVERYTHING ELSE (smallest markers)
  hospital: 'optional',
  pharmacy: 'optional',
  police: 'optional',
  restaurant: 'optional',
  supermarket: 'optional',
  picnic_site: 'optional',
};

// Categories hidden by default (user must enable via filter)
export const HIDDEN_BY_DEFAULT: POICategory[] = ['restaurant', 'supermarket'];

/**
 * Get the group color for a POI category
 */
export function getCategoryGroupColor(category: POICategory): string {
  const group = CATEGORY_TO_GROUP[category];
  return CATEGORY_GROUP_COLORS[group] || '#666666';
}

/**
 * Get priority level for a category
 */
export function getCategoryPriority(category: POICategory): POIPriority {
  return CATEGORY_PRIORITY[category] || 'secondary';
}

/**
 * Check if a category is hidden by default
 */
export function isHiddenByDefault(category: POICategory): boolean {
  return HIDDEN_BY_DEFAULT.includes(category);
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

/**
 * Get all categories with a specific priority
 */
export function getCategoriesByPriority(priority: POIPriority): POICategory[] {
  return (
    Object.entries(CATEGORY_PRIORITY) as [POICategory, POIPriority][]
  )
    .filter(([_, p]) => p === priority)
    .map(([cat]) => cat);
}
