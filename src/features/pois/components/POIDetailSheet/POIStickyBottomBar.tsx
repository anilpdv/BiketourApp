import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getPOITerrain, isCampingCategory } from '../../utils/poiTagParser';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POIStickyBottomBarProps {
  poi: POI;
  onNavigate?: () => void;
}

/**
 * Open directions to POI in Google Maps (consistent across platforms)
 */
function openDirections(lat: number, lon: number, name?: string) {
  const label = encodeURIComponent(name || 'POI');
  // Always use Google Maps for directions
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${label}`);
}

/**
 * Sticky bottom bar showing price and navigate button
 * Only visible for camping-type POIs with fee information
 */
export const POIStickyBottomBar = memo(function POIStickyBottomBar({
  poi,
  onNavigate,
}: POIStickyBottomBarProps) {
  const terrain = useMemo(() => getPOITerrain(poi), [poi]);

  // Only show for camping POIs with fee info
  const showPrice = isCampingCategory(poi.category) && terrain.feeAmount !== undefined;
  const isFree = terrain.fee === 'no';

  // If no price info and not free, just show navigate button
  const hasRelevantInfo = showPrice || isFree;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      openDirections(poi.latitude, poi.longitude, poi.name || undefined);
    }
  };

  // Always show navigate button for all POIs
  return (
    <View style={styles.container}>
      {/* Price section - only for camping POIs */}
      {hasRelevantInfo && (
        <View style={styles.priceSection}>
          {isFree ? (
            <>
              <MaterialCommunityIcons
                name="tag-check"
                size={20}
                color={colors.status.success}
              />
              <Text style={styles.freeText}>Free</Text>
            </>
          ) : showPrice && terrain.feeAmount ? (
            <>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.priceValue}>
                {terrain.feeAmount.toFixed(2)}
              </Text>
              <Text style={styles.priceCurrency}>/night</Text>
            </>
          ) : null}
        </View>
      )}

      {/* Navigate button */}
      <Button
        mode="contained"
        icon="navigation"
        onPress={handleNavigate}
        style={styles.navigateButton}
        contentStyle={styles.navigateButtonContent}
        labelStyle={styles.navigateButtonLabel}
      >
        Navigate
      </Button>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    ...shadows.lg,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  priceLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  priceValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  priceCurrency: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  freeText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.status.success,
  },
  navigateButton: {
    borderRadius: borderRadius.xl,
    marginLeft: 'auto',
  },
  navigateButtonContent: {
    height: 48,
    paddingHorizontal: spacing.md,
  },
  navigateButtonLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
});
