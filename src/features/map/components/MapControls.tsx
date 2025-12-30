import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from '../../../shared/components';
import { colors, spacing } from '../../../shared/design/tokens';

export interface MapControlsProps {
  showPOIs: boolean;
  show3DTerrain: boolean;
  show3DBuildings: boolean;
  onTogglePOIs: () => void;
  onToggle3DTerrain: () => void;
  onToggle3DBuildings: () => void;
  onOpenStylePicker: () => void;
}

/**
 * Map control buttons for toggling POIs, terrain, buildings, and map style
 */
export const MapControls = memo(function MapControls({
  showPOIs,
  show3DTerrain,
  show3DBuildings,
  onTogglePOIs,
  onToggle3DTerrain,
  onToggle3DBuildings,
  onOpenStylePicker,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      <IconButton
        icon="map-marker"
        onPress={onTogglePOIs}
        isActive={showPOIs}
        activeColor={colors.primary[500]}
        activeBackgroundColor={colors.primary[50]}
      />
      <IconButton
        icon="image-filter-hdr"
        onPress={onToggle3DTerrain}
        isActive={show3DTerrain}
        activeColor={colors.feature.terrain}
        activeBackgroundColor={colors.feature.terrainLight}
      />
      <IconButton
        icon="office-building"
        onPress={onToggle3DBuildings}
        isActive={show3DBuildings}
        activeColor={colors.feature.buildings}
        activeBackgroundColor={colors.feature.buildingsLight}
      />
      <IconButton
        icon="layers"
        onPress={onOpenStylePicker}
        activeColor={colors.feature.mapStyle}
        style={styles.styleButton}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: spacing.sm,
    gap: spacing.sm,
  },
  styleButton: {
    borderColor: colors.feature.mapStyle,
  },
});
