import { POICategory } from '../types';
import {
  CATEGORY_TO_GROUP,
  getCategoryGroupColor,
} from './poiGroupColors';

/**
 * POI Icon Configuration
 *
 * Uses Mapbox's built-in Maki icons which are available in all Mapbox styles.
 * These icons render as proper vector symbols rather than emojis.
 *
 * Available Maki icons: https://labs.mapbox.com/maki-icons/
 */

// Category colors (used for circle backgrounds)
// Vibrant, distinct colors grouped by category type
export const CATEGORY_COLORS: Record<POICategory, string> = {
  // Camping - Greens
  campsite: '#16A34A', // Vibrant Green
  motorhome_spot: '#22C55E', // Bright Green
  wild_camping: '#15803D', // Forest Green
  caravan_site: '#4ADE80', // Light Green
  picnic_site: '#059669', // Emerald
  // Services - Teals/Blues
  drinking_water: '#0EA5E9', // Sky Blue
  service_area: '#06B6D4', // Cyan
  toilet: '#0891B2', // Teal
  shower: '#14B8A6', // Teal
  laundry: '#0D9488', // Teal Dark
  // Accommodation - Purples
  hotel: '#8B5CF6', // Violet
  hostel: '#A78BFA', // Light Purple
  guest_house: '#7C3AED', // Purple
  shelter: '#6D28D9', // Deep Purple
  // Bike - Oranges
  bike_shop: '#F97316', // Orange
  bike_repair: '#EA580C', // Dark Orange
  // Food - Reds
  restaurant: '#DC2626', // Red
  supermarket: '#EF4444', // Light Red
  // Emergency - Red accents
  hospital: '#E53935', // Emergency Red
  pharmacy: '#43A047', // Green (medical)
  police: '#1E40AF', // Police Blue
};

// Map POI categories to Mapbox Maki icon names
// These are built into Mapbox styles and render as proper vector symbols
export const CATEGORY_TO_MAKI_ICON: Record<POICategory, string> = {
  campsite: 'campsite',
  drinking_water: 'drinking-water',
  bike_shop: 'bicycle',
  bike_repair: 'bicycle',
  hotel: 'lodging',
  hostel: 'lodging',
  guest_house: 'home',
  shelter: 'shelter',
  supermarket: 'grocery',
  restaurant: 'restaurant',
  // Camping categories
  motorhome_spot: 'car',
  service_area: 'fuel',
  wild_camping: 'park',
  caravan_site: 'campsite',
  picnic_site: 'picnic-site',
  toilet: 'toilet',
  shower: 'water',
  laundry: 'laundry',
  // Emergency categories
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  police: 'police',
};

// Map POI categories to OpenFreeMap sprite icon names
// These are image-based icons in the style sprite (not fonts)
export const CATEGORY_TO_SPRITE_ICON: Record<POICategory, string> = {
  campsite: 'campsite',
  drinking_water: 'water',
  bike_shop: 'bicycle',
  bike_repair: 'bicycle',
  hotel: 'lodging',
  hostel: 'lodging',
  guest_house: 'lodging',
  shelter: 'shelter',
  supermarket: 'grocery',
  restaurant: 'restaurant',
  // Camping categories
  motorhome_spot: 'car',
  service_area: 'fuel',
  wild_camping: 'park',
  caravan_site: 'campsite',
  picnic_site: 'picnic_site',
  toilet: 'toilets',
  shower: 'water',
  laundry: 'laundry',
  // Emergency categories
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  police: 'police',
};

// MaterialCommunityIcons names for UI components
export const CATEGORY_TO_VECTOR_ICON: Record<POICategory, string> = {
  campsite: 'tent',
  drinking_water: 'water',
  bike_shop: 'bicycle',
  bike_repair: 'tools',
  hotel: 'bed',
  hostel: 'bed-outline',
  guest_house: 'home',
  shelter: 'home-outline',
  supermarket: 'cart',
  restaurant: 'food-fork-drink',
  // Camping categories
  motorhome_spot: 'caravan',
  service_area: 'gas-station',
  wild_camping: 'tree',
  caravan_site: 'caravan',
  picnic_site: 'table-picnic',
  toilet: 'toilet',
  shower: 'shower-head',
  laundry: 'washing-machine',
  // Emergency categories
  hospital: 'hospital-box',
  pharmacy: 'pill',
  police: 'shield-account',
};

// Fallback emoji icons (used if vector icons unavailable)
export const CATEGORY_TO_EMOJI: Record<POICategory, string> = {
  campsite: '⛺',
  drinking_water: '💧',
  bike_shop: '🚲',
  bike_repair: '🔧',
  hotel: '🏨',
  hostel: '🛏️',
  guest_house: '🏠',
  shelter: '🏕️',
  supermarket: '🛒',
  restaurant: '🍽️',
  // Camping categories
  motorhome_spot: '🚐',
  service_area: '⛽',
  wild_camping: '🌲',
  caravan_site: '🚙',
  picnic_site: '🧺',
  toilet: '🚻',
  shower: '🚿',
  laundry: '🧺',
  // Emergency categories
  hospital: '🏥',
  pharmacy: '💊',
  police: '🚔',
};

// Category display names
export const CATEGORY_NAMES: Record<POICategory, string> = {
  campsite: 'Campsite',
  drinking_water: 'Drinking Water',
  bike_shop: 'Bike Shop',
  bike_repair: 'Repair Station',
  hotel: 'Hotel',
  hostel: 'Hostel',
  guest_house: 'Guest House',
  shelter: 'Shelter',
  supermarket: 'Supermarket',
  restaurant: 'Restaurant',
  // Camping categories
  motorhome_spot: 'Motorhome Spot',
  service_area: 'Service Area',
  wild_camping: 'Wild Camping',
  caravan_site: 'Caravan Site',
  picnic_site: 'Picnic Site',
  toilet: 'Toilet',
  shower: 'Shower',
  laundry: 'Laundry',
  // Emergency categories
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
  police: 'Police Station',
};

/**
 * Get the icon configuration for a POI category
 */
// Type for MaterialCommunityIcons name (using any to allow dynamic icon names)
type IconName = React.ComponentProps<typeof import('@expo/vector-icons').MaterialCommunityIcons>['name'];

export function getCategoryIcon(category: POICategory) {
  // Validate category exists in mappings (helps identify invalid data)
  if (__DEV__ && !CATEGORY_COLORS[category]) {
    console.warn(`[POI] Unknown category: "${category}" - using fallback styling`);
  }

  return {
    color: CATEGORY_COLORS[category] || '#666666',
    group: CATEGORY_TO_GROUP[category] || 'services',
    groupColor: getCategoryGroupColor(category),
    makiIcon: CATEGORY_TO_MAKI_ICON[category] || 'marker',
    spriteIcon: CATEGORY_TO_SPRITE_ICON[category] || 'marker',
    vectorIcon: (CATEGORY_TO_VECTOR_ICON[category] || 'map-marker') as IconName,
    emoji: CATEGORY_TO_EMOJI[category] || '📍',
    name: CATEGORY_NAMES[category] || category,
  };
}

/**
 * All POI categories in display order
 */
export const ALL_CATEGORIES: POICategory[] = [
  // Camping-focused (primary)
  'campsite',
  'motorhome_spot',
  'caravan_site',
  'wild_camping',
  // Services
  'service_area',
  'drinking_water',
  'toilet',
  'shower',
  'laundry',
  // Accommodation
  'hotel',
  'hostel',
  'guest_house',
  'shelter',
  // Bike
  'bike_shop',
  'bike_repair',
  // Food
  'restaurant',
  'supermarket',
  'picnic_site',
  // Emergency
  'hospital',
  'pharmacy',
  'police',
];
