import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteListItem } from './RouteListItem';
import {
  getRouteName,
  getRouteColor,
  getRouteMetadata,
} from '../../services/routeLoader.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../shared/design/tokens';

export interface EuroVeloRoutesModalProps {
  visible: boolean;
  onClose: () => void;
  availableRouteIds: number[];
  enabledRouteIds: number[];
  loadedRouteIds: number[];
  isLoading: boolean;
  onToggleRoute: (euroVeloId: number) => void;
}

export const EuroVeloRoutesModal = memo(function EuroVeloRoutesModal({
  visible,
  onClose,
  availableRouteIds,
  enabledRouteIds,
  loadedRouteIds,
  isLoading,
  onToggleRoute,
}: EuroVeloRoutesModalProps) {
  const handleToggleRoute = useCallback(
    (euroVeloId: number) => {
      onToggleRoute(euroVeloId);
    },
    [onToggleRoute]
  );

  const activeCount = enabledRouteIds.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="bike-fast"
              size={24}
              color={colors.primary[600]}
            />
            <Text style={styles.headerTitle}>EuroVelo Routes</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.neutral[600]}
            />
          </TouchableOpacity>
        </View>

        {/* Active count badge */}
        {activeCount > 0 && (
          <View style={styles.activeCountContainer}>
            <Text style={styles.activeCountText}>
              {activeCount} route{activeCount !== 1 ? 's' : ''} selected
            </Text>
          </View>
        )}

        {/* Routes list */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {availableRouteIds.map((euroVeloId) => {
            const name = getRouteName(euroVeloId);
            const color = getRouteColor(euroVeloId, 'developed');
            const metadata = getRouteMetadata(euroVeloId);
            const isEnabled = enabledRouteIds.includes(euroVeloId);
            const isLoadingThis = isLoading && isEnabled && !loadedRouteIds.includes(euroVeloId);

            return (
              <RouteListItem
                key={euroVeloId}
                euroVeloId={euroVeloId}
                name={name}
                color={color}
                distance={metadata.distance}
                countries={metadata.countries}
                isEnabled={isEnabled}
                isLoading={isLoadingThis}
                onToggle={() => handleToggleRoute(euroVeloId)}
              />
            );
          })}
        </ScrollView>

        {/* Close button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneButtonText}>Done</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  closeButton: {
    padding: spacing.xs,
  },
  activeCountContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
  },
  activeCountText: {
    fontSize: typography.fontSizes.md,
    color: colors.primary[700],
    fontWeight: typography.fontWeights.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  doneButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
});
