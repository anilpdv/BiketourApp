/**
 * POI Category Configuration
 * OSM query mappings for each POI category
 */

import { POICategoryConfig } from '../types';

/**
 * POI category configurations with OSM queries
 * All categories are disabled by default - only explicitly selected categories are fetched
 */
export const POI_CATEGORIES: POICategoryConfig[] = [
  // Camping-focused categories (primary)
  {
    id: 'campsite',
    name: 'Campsites',
    icon: 'tent',
    color: '#228B22',
    osmQuery: 'tourism=camp_site',
    enabled: false,
  },
  {
    id: 'motorhome_spot',
    name: 'Motorhome Spots',
    icon: 'caravan',
    color: '#6B5B95',
    osmQuery: 'tourism=caravan_site',
    enabled: false,
  },
  {
    id: 'caravan_site',
    name: 'Caravan Sites',
    icon: 'rv-truck',
    color: '#FF6B35',
    osmQuery: 'tourism=caravan_site',
    enabled: false,
  },
  {
    id: 'wild_camping',
    name: 'Wild Camping',
    icon: 'pine-tree',
    color: '#2D5016',
    osmQuery: 'tourism=camp_pitch',
    enabled: false,
  },
  // Services categories
  {
    id: 'service_area',
    name: 'Service Areas',
    icon: 'gas-station',
    color: '#45B7D1',
    osmQuery: 'amenity=sanitary_dump_station',
    enabled: false,
  },
  {
    id: 'drinking_water',
    name: 'Drinking Water',
    icon: 'water',
    color: '#1E90FF',
    osmQuery: 'amenity=drinking_water',
    enabled: false,
  },
  {
    id: 'toilet',
    name: 'Toilets',
    icon: 'toilet',
    color: '#7A8B8B',
    osmQuery: 'amenity=toilets',
    enabled: false,
  },
  {
    id: 'shower',
    name: 'Showers',
    icon: 'shower',
    color: '#4ECDC4',
    osmQuery: 'amenity=shower',
    enabled: false,
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: 'washing-machine',
    color: '#FFE66D',
    osmQuery: 'shop=laundry',
    enabled: false,
  },
  // Accommodation categories
  {
    id: 'hotel',
    name: 'Hotels',
    icon: 'hotel',
    color: '#9370DB',
    osmQuery: 'tourism=hotel',
    enabled: false,
  },
  {
    id: 'hostel',
    name: 'Hostels',
    icon: 'bed',
    color: '#20B2AA',
    osmQuery: 'tourism=hostel',
    enabled: false,
  },
  {
    id: 'guest_house',
    name: 'Guest Houses',
    icon: 'home',
    color: '#DEB887',
    osmQuery: 'tourism=guest_house',
    enabled: false,
  },
  {
    id: 'shelter',
    name: 'Shelters',
    icon: 'shelter',
    color: '#8B4513',
    osmQuery: 'amenity=shelter',
    enabled: false,
  },
  // Bike categories
  {
    id: 'bike_shop',
    name: 'Bike Shops',
    icon: 'bicycle',
    color: '#FF6347',
    osmQuery: 'shop=bicycle',
    enabled: false,
  },
  {
    id: 'bike_repair',
    name: 'Repair Stations',
    icon: 'wrench',
    color: '#FF8C00',
    osmQuery: 'amenity=bicycle_repair_station',
    enabled: false,
  },
  // Food categories
  {
    id: 'restaurant',
    name: 'Restaurants',
    icon: 'utensils',
    color: '#DC143C',
    osmQuery: 'amenity=restaurant',
    enabled: false,
  },
  {
    id: 'supermarket',
    name: 'Supermarkets',
    icon: 'cart',
    color: '#32CD32',
    osmQuery: 'shop=supermarket',
    enabled: false,
  },
  {
    id: 'picnic_site',
    name: 'Picnic Sites',
    icon: 'table-picnic',
    color: '#98D8C8',
    osmQuery: 'leisure=picnic_table',
    enabled: false,
  },
  // Emergency categories
  {
    id: 'hospital',
    name: 'Hospitals',
    icon: 'hospital-box',
    color: '#E53935',
    osmQuery: 'amenity=hospital',
    enabled: false,
  },
  {
    id: 'pharmacy',
    name: 'Pharmacies',
    icon: 'pharmacy',
    color: '#43A047',
    osmQuery: 'amenity=pharmacy',
    enabled: false,
  },
  {
    id: 'police',
    name: 'Police Stations',
    icon: 'police-badge',
    color: '#1565C0',
    osmQuery: 'amenity=police',
    enabled: false,
  },
];

/**
 * Get category config by ID
 */
export function getCategoryConfig(categoryId: string): POICategoryConfig | undefined {
  return POI_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Get category configs by IDs
 */
export function getCategoryConfigs(categoryIds: string[]): POICategoryConfig[] {
  return POI_CATEGORIES.filter((c) => categoryIds.includes(c.id));
}
