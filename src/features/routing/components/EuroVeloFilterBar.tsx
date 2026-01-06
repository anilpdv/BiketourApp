import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EuroVeloFilters } from '../../routes/hooks/useEuroVeloRoutes';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../shared/design/tokens';

// Country code to name mapping for display
const COUNTRY_NAMES: Record<string, string> = {
  NO: 'Norway', SE: 'Sweden', FI: 'Finland', DK: 'Denmark',
  DE: 'Germany', NL: 'Netherlands', BE: 'Belgium', LU: 'Luxembourg',
  FR: 'France', ES: 'Spain', PT: 'Portugal', IT: 'Italy',
  CH: 'Switzerland', AT: 'Austria', CZ: 'Czechia', PL: 'Poland',
  SK: 'Slovakia', HU: 'Hungary', SI: 'Slovenia', HR: 'Croatia',
  RS: 'Serbia', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece',
  TR: 'Turkey', CY: 'Cyprus', UK: 'United Kingdom', IE: 'Ireland',
  EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', RU: 'Russia',
  BY: 'Belarus', UA: 'Ukraine', AL: 'Albania', ME: 'Montenegro',
  MK: 'N. Macedonia', MT: 'Malta', LI: 'Liechtenstein', MC: 'Monaco',
};

// Difficulty configuration
const DIFFICULTIES: Array<{ key: 'easy' | 'moderate' | 'difficult'; label: string; color: string }> = [
  { key: 'easy', label: 'Easy', color: '#4CAF50' },
  { key: 'moderate', label: 'Moderate', color: '#FF9800' },
  { key: 'difficult', label: 'Difficult', color: '#F44336' },
];

// Distance range configuration
const DISTANCE_RANGES: Array<{ key: EuroVeloFilters['distanceRange']; label: string }> = [
  { key: 'short', label: '< 2000 km' },
  { key: 'medium', label: '2-5k km' },
  { key: 'long', label: '5-8k km' },
  { key: 'epic', label: '> 8000 km' },
];

interface EuroVeloFilterBarProps {
  filters: EuroVeloFilters;
  totalCount: number;
  filteredCount: number;
  availableCountries: string[];
  hasActiveFilters: boolean;
  onSearchChange: (query: string) => void;
  onToggleDifficulty: (difficulty: 'easy' | 'moderate' | 'difficult') => void;
  onSetDistanceRange: (range: EuroVeloFilters['distanceRange']) => void;
  onToggleCountry: (country: string) => void;
  onClearFilters: () => void;
}

export const EuroVeloFilterBar = memo(function EuroVeloFilterBar({
  filters,
  totalCount,
  filteredCount,
  availableCountries,
  hasActiveFilters,
  onSearchChange,
  onToggleDifficulty,
  onSetDistanceRange,
  onToggleCountry,
  onClearFilters,
}: EuroVeloFilterBarProps) {
  const [showCountryModal, setShowCountryModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.neutral[400]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          placeholderTextColor={colors.neutral[400]}
          value={filters.searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {filters.searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Difficulty Chips */}
        {DIFFICULTIES.map(({ key, label, color }) => {
          const isSelected = filters.difficulties.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: color },
              ]}
              onPress={() => onToggleDifficulty(key)}
            >
              {isSelected && (
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.chipDivider} />

        {/* Distance Range Chips */}
        {DISTANCE_RANGES.map(({ key, label }) => {
          const isSelected = filters.distanceRange === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
              onPress={() => onSetDistanceRange(isSelected ? 'all' : key)}
            >
              {isSelected && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={colors.primary[600]}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextPrimary,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.chipDivider} />

        {/* Country Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.countries.length > 0 && styles.filterChipSelected,
          ]}
          onPress={() => setShowCountryModal(true)}
        >
          <MaterialCommunityIcons
            name="earth"
            size={14}
            color={filters.countries.length > 0 ? colors.primary[600] : colors.neutral[600]}
          />
          <Text
            style={[
              styles.filterChipText,
              filters.countries.length > 0 && styles.filterChipTextPrimary,
            ]}
          >
            {filters.countries.length > 0
              ? `${filters.countries.length} selected`
              : 'Countries'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={14}
            color={filters.countries.length > 0 ? colors.primary[600] : colors.neutral[600]}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Results Count & Clear */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          Showing {filteredCount} of {totalCount} routes
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
            <MaterialCommunityIcons
              name="filter-remove"
              size={16}
              color={colors.primary[600]}
            />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Countries</Text>
            <TouchableOpacity
              onPress={() => setShowCountryModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.neutral[700]}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.countryGrid}>
              {availableCountries.map((countryCode) => {
                const isSelected = filters.countries.includes(countryCode);
                return (
                  <Pressable
                    key={countryCode}
                    style={[
                      styles.countryChip,
                      isSelected && styles.countryChipSelected,
                    ]}
                    onPress={() => onToggleCountry(countryCode)}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={colors.primary[600]}
                      />
                    )}
                    <Text
                      style={[
                        styles.countryChipText,
                        isSelected && styles.countryChipTextSelected,
                      ]}
                    >
                      {COUNTRY_NAMES[countryCode] || countryCode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalClearButton}
              onPress={() => {
                filters.countries.forEach(c => onToggleCountry(c));
              }}
            >
              <Text style={styles.modalClearButtonText}>Clear selection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowCountryModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[800],
  },
  filtersScroll: {
    marginBottom: spacing.sm,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  filterChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    fontWeight: typography.fontWeights.medium,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  filterChipTextPrimary: {
    color: colors.primary[600],
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.xs,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeights.medium,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  countryChipSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  countryChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },
  countryChipTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeights.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  modalClearButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalClearButtonText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
  modalDoneButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  modalDoneButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: '#fff',
  },
});

export default EuroVeloFilterBar;
