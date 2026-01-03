import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LOCATION_TYPE_GRID } from '../../config/poiCategories';
import { POICategory } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../shared/design/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = spacing.lg * 2;
const GRID_GAP = spacing.md;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING - GRID_GAP) / 2;

interface LocationTypeGridProps {
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
}

export const LocationTypeGrid = memo(function LocationTypeGrid({
  selectedCategories,
  onToggleCategory,
}: LocationTypeGridProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location type</Text>
      <View style={styles.grid}>
        {LOCATION_TYPE_GRID.map((locationType) => {
          const isSelected = locationType.categories.some((cat) =>
            selectedCategories.includes(cat)
          );

          return (
            <TouchableOpacity
              key={locationType.id}
              style={[styles.gridItem, isSelected && styles.gridItemSelected]}
              onPress={() => {
                // Toggle all categories in this location type
                locationType.categories.forEach((cat) => onToggleCategory(cat));
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${locationType.name}${isSelected ? ', selected' : ''}`}
            >
              <MaterialCommunityIcons
                name={locationType.icon as any}
                size={32}
                color={isSelected ? colors.secondary[600] : colors.neutral[500]}
              />
              <Text
                style={[
                  styles.gridLabel,
                  isSelected && styles.gridLabelSelected,
                ]}
              >
                {locationType.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  gridItemSelected: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[500],
  },
  gridLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  gridLabelSelected: {
    color: colors.secondary[700],
  },
});

export default LocationTypeGrid;
