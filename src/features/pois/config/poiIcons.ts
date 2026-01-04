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
export const CATEGORY_COLORS: Record<POICategory, string> = {
  // Existing categories
  campsite: '#228B22', // Forest Green
  drinking_water: '#1E90FF', // Dodger Blue
  bike_shop: '#FF6347', // Tomato
  bike_repair: '#FF8C00', // Dark Orange
  hotel: '#9370DB', // Medium Purple
  hostel: '#20B2AA', // Light Sea Green
  guest_house: '#DEB887', // Burlywood
  shelter: '#8B4513', // Saddle Brown
  supermarket: '#32CD32', // Lime Green
  restaurant: '#DC143C', // Crimson
  // Camping-focused categories
  motorhome_spot: '#6B5B95', // Purple
  service_area: '#45B7D1', // Teal
  wild_camping: '#2D5016', // Dark Green
  caravan_site: '#FF6B35', // Orange
  picnic_site: '#98D8C8', // Mint
  toilet: '#7A8B8B', // Gray
  shower: '#4ECDC4', // Cyan
  laundry: '#FFE66D', // Yellow
  // Emergency categories
  hospital: '#E53935', // Red
  pharmacy: '#43A047', // Green
  police: '#1565C0', // Blue
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
  picnic_site: 'bench',
  toilet: 'toilet',
  shower: 'shower-head',
  laundry: 'washing-machine',
  // Emergency categories
  hospital: 'hospital-box',
  pharmacy: 'pharmacy',
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
    vectorIcon: CATEGORY_TO_VECTOR_ICON[category] || 'map-marker',
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
