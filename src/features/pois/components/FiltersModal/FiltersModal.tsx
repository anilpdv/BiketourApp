import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LocationTypeGrid } from './LocationTypeGrid';
import { PriceRangeSlider } from './PriceRangeSlider';
import { RatingChips } from './RatingChips';
import { FilterToggleSwitch } from './FilterToggleSwitch';
import { POICategory, POIFilterStateExtended } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: POIFilterStateExtended) => void;
  currentFilters: POIFilterStateExtended;
  resultCount: number;
}

export const FiltersModal = memo(function FiltersModal({
  visible,
  onClose,
  onApply,
  currentFilters,
  resultCount,
}: FiltersModalProps) {
  // Local state for filters while modal is open
  const [localFilters, setLocalFilters] =
    useState<POIFilterStateExtended>(currentFilters);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  const handleToggleCategory = (category: POICategory) => {
    setLocalFilters((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleClearFilters = () => {
    setLocalFilters({
      categories: [],
      maxDistance: 20,
      showOnMap: true,
      maxPrice: null,
      minRating: null,
      hasElectricity: null,
      hasWifi: null,
      isPetFriendly: null,
      isOpenNow: null,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.neutral[700]}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Location type grid */}
          <LocationTypeGrid
            selectedCategories={localFilters.categories}
            onToggleCategory={handleToggleCategory}
          />

          {/* Price range slider */}
          <PriceRangeSlider
            value={localFilters.maxPrice}
            onChange={(price) =>
              setLocalFilters((prev) => ({ ...prev, maxPrice: price }))
            }
          />

          {/* Rating chips */}
          <RatingChips
            selectedRating={localFilters.minRating}
            onSelect={(rating) =>
              setLocalFilters((prev) => ({ ...prev, minRating: rating }))
            }
          />

          {/* Toggle switches */}
          <View style={styles.togglesSection}>
            <FilterToggleSwitch
              label="Opening period"
              icon="clock-outline"
              value={localFilters.isOpenNow}
              onToggle={(value) =>
                setLocalFilters((prev) => ({ ...prev, isOpenNow: value }))
              }
            />
            <FilterToggleSwitch
              label="Electricity"
              icon="flash"
              value={localFilters.hasElectricity}
              onToggle={(value) =>
                setLocalFilters((prev) => ({ ...prev, hasElectricity: value }))
              }
            />
            <FilterToggleSwitch
              label="WiFi"
              icon="wifi"
              value={localFilters.hasWifi}
              onToggle={(value) =>
                setLocalFilters((prev) => ({ ...prev, hasWifi: value }))
              }
            />
            <FilterToggleSwitch
              label="Pet friendly"
              icon="paw"
              value={localFilters.isPetFriendly}
              onToggle={(value) =>
                setLocalFilters((prev) => ({ ...prev, isPetFriendly: value }))
              }
            />
          </View>
        </ScrollView>

        {/* Footer action bar */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            accessibilityRole="button"
            accessibilityLabel={`Show ${resultCount} locations`}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>
              Show {resultCount} locations
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  togglesSection: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
    ...shadows.lg,
  },
  clearButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  clearButtonText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  applyButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary[700],
  },
  applyButtonText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
});

export default FiltersModal;
