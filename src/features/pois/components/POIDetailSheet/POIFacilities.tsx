import React, { memo, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { getPOIFacilities, POIFacility } from '../../utils/poiTagParser';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POIFacilitiesProps {
  poi: POI;
  maxVisible?: number;
}

/**
 * Enhanced facilities section with icons and fee indicators
 */
export const POIFacilities = memo(function POIFacilities({
  poi,
  maxVisible = 6,
}: POIFacilitiesProps) {
  const [showAll, setShowAll] = useState(false);
  const facilities = useMemo(() => getPOIFacilities(poi), [poi]);

  if (facilities.length === 0) return null;

  const visibleFacilities = facilities.slice(0, maxVisible);
  const hasMore = facilities.length > maxVisible;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="format-list-checks"
            size={20}
            color={colors.primary[500]}
            style={styles.headerIcon}
          />
          <Text style={styles.headerText}>Facilities</Text>
          {hasMore && (
            <Pressable onPress={() => setShowAll(true)} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.facilitiesGrid}>
          {visibleFacilities.map((facility) => (
            <FacilityItem key={facility.id} facility={facility} />
          ))}
        </View>
      </View>

      {/* View All Modal */}
      <FacilitiesModal
        visible={showAll}
        onClose={() => setShowAll(false)}
        facilities={facilities}
      />
    </>
  );
});

/**
 * Individual facility item with icon and optional fee indicator
 */
const FacilityItem = memo(function FacilityItem({
  facility,
  expanded = false,
}: {
  facility: POIFacility;
  expanded?: boolean;
}) {
  return (
    <View style={[styles.facilityItem, expanded && styles.facilityItemExpanded]}>
      <View style={styles.facilityIconContainer}>
        <MaterialCommunityIcons
          name={facility.icon}
          size={20}
          color={colors.secondary[600]}
        />
        {facility.fee !== undefined && (
          <View style={[styles.feeBadge, facility.fee ? styles.feeBadgePaid : styles.feeBadgeFree]}>
            <MaterialCommunityIcons
              name={facility.fee ? 'currency-eur' : 'check'}
              size={8}
              color={facility.fee ? colors.status.warning : colors.status.success}
            />
          </View>
        )}
      </View>
      <Text style={styles.facilityLabel} numberOfLines={expanded ? 2 : 1}>
        {facility.label}
      </Text>
      {facility.fee !== undefined && (
        <Text style={[styles.feeText, facility.fee ? styles.feeTextPaid : styles.feeTextFree]}>
          {facility.fee ? 'Paid' : 'Free'}
        </Text>
      )}
    </View>
  );
});

/**
 * Modal showing all facilities
 */
const FacilitiesModal = memo(function FacilitiesModal({
  visible,
  onClose,
  facilities,
}: {
  visible: boolean;
  onClose: () => void;
  facilities: POIFacility[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Surface style={modalStyles.container} elevation={5}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>All Facilities</Text>
              <Pressable onPress={onClose} style={modalStyles.closeButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.neutral[600]}
                />
              </Pressable>
            </View>
            <ScrollView
              style={modalStyles.scrollView}
              contentContainerStyle={modalStyles.content}
              showsVerticalScrollIndicator={false}
            >
              {facilities.map((facility) => (
                <FacilityItem key={facility.id} facility={facility} expanded />
              ))}
            </ScrollView>
          </Pressable>
        </Surface>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  viewAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeights.medium,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  facilityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  facilityItemExpanded: {
    width: '100%',
    padding: spacing.md,
  },
  facilityIconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[0],
  },
  feeBadgePaid: {
    backgroundColor: colors.status.warning + '30',
  },
  feeBadgeFree: {
    backgroundColor: colors.status.success + '30',
  },
  facilityLabel: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },
  feeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  feeTextPaid: {
    color: colors.status.warning,
  },
  feeTextFree: {
    color: colors.status.success,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    maxHeight: 400,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
