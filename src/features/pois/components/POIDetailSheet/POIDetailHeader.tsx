import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { POI, POICategory } from '../../types';
import { getCategoryConfig } from '../../services/overpass.service';
import { FavoriteButton } from '../FavoriteButton';
import { headerStyles as styles } from './POIDetailSheet.styles';

// Category icon mapping
const CATEGORY_ICONS: Record<POICategory, string> = {
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

export interface POIDetailHeaderProps {
  poi: POI;
  onClose: () => void;
}

/**
 * POI Detail header with icon, name, category, and close button
 */
export const POIDetailHeader = memo(function POIDetailHeader({
  poi,
  onClose,
}: POIDetailHeaderProps) {
  const config = getCategoryConfig(poi.category);
  const icon = CATEGORY_ICONS[poi.category] || '📍';

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config?.color || '#666' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {poi.name || config?.name || 'Unknown'}
        </Text>
        <Text style={styles.category}>{config?.name}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <FavoriteButton poi={poi} size="medium" />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
