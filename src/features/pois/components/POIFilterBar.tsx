import React, { memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Badge, ActivityIndicator, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POICategory } from '../types';
import { POI_CATEGORIES } from '../services/overpass.service';
import { getCategoryIcon } from '../config/poiIcons';
import { colors, spacing } from '../../../shared/design/tokens';

interface POIFilterBarProps {
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
  poiCounts?: Partial<Record<POICategory, number>>;
  isLoading?: boolean;
}

function POIFilterBarComponent({
  selectedCategories,
  onToggleCategory,
  poiCounts = {},
  isLoading = false,
}: POIFilterBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {POI_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const count = poiCounts[category.id] || 0;
          const iconConfig = getCategoryIcon(category.id);

          return (
            <View key={category.id} style={styles.chipWrapper}>
              <Chip
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => onToggleCategory(category.id)}
                icon={() => (
                  <MaterialCommunityIcons
                    name={iconConfig.vectorIcon}
                    size={18}
                    color={category.color}
                  />
                )}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.neutral[0],
                    borderColor: isSelected ? category.color : colors.neutral[300],
                  },
                ]}
                textStyle={[
                  styles.chipText,
                  isSelected && { color: category.color, fontWeight: '600' },
                ]}
                selectedColor={category.color}
                showSelectedCheck={false}
                elevated={!isSelected}
                elevation={isSelected ? 0 : 1}
              >
                {category.name}
              </Chip>
              {count > 0 && (
                <Badge
                  size={18}
                  style={[
                    styles.badge,
                    { backgroundColor: isSelected ? category.color : colors.neutral[400] },
                  ]}
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </View>
          );
        })}
      </ScrollView>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

export const POIFilterBar = memo(POIFilterBarComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chipWrapper: {
    position: 'relative',
  },
  chip: {
    borderWidth: 2,
  },
  chipText: {
    color: colors.neutral[600],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});
