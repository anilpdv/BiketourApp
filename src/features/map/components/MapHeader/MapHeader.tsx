import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SearchBar } from '../../../search/components/SearchBar';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../../../shared/design/tokens';

interface MapHeaderProps {
  isListView: boolean;
  onToggleView: () => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
}

export const MapHeader = memo(function MapHeader({
  isListView,
  onToggleView,
  onSearchFocus,
  onSearchBlur,
}: MapHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.searchWrapper}>
        <SearchBar
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          placeholder="Search places..."
        />
      </View>

      <TouchableOpacity
        style={[styles.toggleButton, isListView && styles.toggleButtonActive]}
        onPress={onToggleView}
        accessibilityLabel={isListView ? 'Show map view' : 'Show list view'}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isListView ? 'map-outline' : 'format-list-bulleted'}
          size={20}
          color={isListView ? colors.primary[500] : colors.neutral[600]}
        />
        <Text
          style={[styles.toggleText, isListView && styles.toggleTextActive]}
        >
          {isListView ? 'Map' : 'List'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  searchWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    minWidth: 80,
    gap: spacing.xs,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  toggleButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  toggleText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  toggleTextActive: {
    color: colors.primary[500],
  },
});

export default MapHeader;
