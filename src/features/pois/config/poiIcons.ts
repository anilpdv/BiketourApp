import { POICategory } from '../types';

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
};

// MaterialCommunityIcons names for UI components
export const CATEGORY_TO_VECTOR_ICON: Record<POICategory, string> = {
  campsite: 'tent',
  drinking_water: 'water',
  bike_shop: 'bicycle',
  bike_repair: 'wrench',
  hotel: 'bed',
  hostel: 'bunk-bed',
  guest_house: 'home',
  shelter: 'home-roof',
  supermarket: 'cart',
  restaurant: 'silverware-fork-knife',
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
};

/**
 * Get the icon configuration for a POI category
 */
export function getCategoryIcon(category: POICategory) {
  return {
    color: CATEGORY_COLORS[category] || '#666666',
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
  'campsite',
  'drinking_water',
  'bike_shop',
  'bike_repair',
  'hotel',
  'hostel',
  'guest_house',
  'shelter',
  'supermarket',
  'restaurant',
];
