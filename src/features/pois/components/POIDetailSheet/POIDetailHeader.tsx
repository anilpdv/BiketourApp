import React, { memo } from 'react';
import { View } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getCategoryConfig } from '../../services/overpass.service';
import { getCategoryIcon } from '../../config/poiIcons';
import { FavoriteButton } from '../FavoriteButton';
import { headerStyles as styles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';

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
  const theme = useTheme();
  const config = getCategoryConfig(poi.category);
  const iconConfig = getCategoryIcon(poi.category);

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.color }]}>
        <MaterialCommunityIcons
          name={iconConfig.vectorIcon}
          size={28}
          color={colors.neutral[0]}
        />
      </View>
      <View style={styles.textContainer}>
        <Text variant="titleLarge" style={styles.name} numberOfLines={2}>
          {poi.name || config?.name || 'Unknown'}
        </Text>
        <Text variant="bodyMedium" style={styles.category}>{config?.name}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <FavoriteButton poi={poi} size="medium" />
        <IconButton
          icon="close"
          mode="contained-tonal"
          size={20}
          onPress={onClose}
          style={styles.closeButton}
        />
      </View>
    </View>
  );
});
