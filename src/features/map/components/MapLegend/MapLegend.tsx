import React, { useState, memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface LegendItem {
  color: string;
  label: string;
  dashed?: boolean;
  thick?: boolean;
}

// CyclOSM legend - Bike Infrastructure
const INFRASTRUCTURE_LEGEND: LegendItem[] = [
  { color: '#0066FF', label: 'Cycleway', thick: true },
  { color: '#0066FF', label: 'Cycle Track' },
  { color: '#2196F3', label: 'Cycle Lane' },
  { color: '#9C27B0', label: 'Shared Lane' },
  { color: '#FF9800', label: 'Bike Shoulder' },
  { color: '#4CAF50', label: 'Two-way Bikes' },
  { color: '#E91E63', label: 'Bicycle Road' },
  { color: '#607D8B', label: 'Steps + Ramp', dashed: true },
  { color: '#FFC107', label: 'Cycle Street' },
];

// CyclOSM legend - Surface Types
const SURFACE_LEGEND: LegendItem[] = [
  { color: '#4CAF50', label: 'Paved' },
  { color: '#FF9800', label: 'Gravel' },
  { color: '#795548', label: 'Unpaved' },
  { color: '#9E9E9E', label: 'Unknown', dashed: true },
];

interface MapLegendProps {
  visible: boolean;
}

/**
 * Collapsible map legend showing CyclOSM color meanings
 * Only visible when cycling map style is active
 */
export const MapLegend = memo(function MapLegend({ visible }: MapLegendProps) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const renderLegendItem = (item: LegendItem) => (
    <View key={item.label} style={styles.item}>
      <View
        style={[
          styles.colorLine,
          { backgroundColor: item.color },
          item.dashed && styles.dashedLine,
          item.thick && styles.thickLine,
        ]}
      />
      <Text style={styles.label}>{item.label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {expanded ? (
        <View style={styles.panel}>
          {/* Header */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => setExpanded(false)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="map-legend"
              size={18}
              color={colors.primary[600]}
            />
            <Text style={styles.title}>Map Legend</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={colors.neutral[500]}
            />
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Infrastructure Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bike Infrastructure</Text>
              <View style={styles.items}>
                {INFRASTRUCTURE_LEGEND.map(renderLegendItem)}
              </View>
            </View>

            {/* Surface Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Surface Type</Text>
              <View style={styles.items}>
                {SURFACE_LEGEND.map(renderLegendItem)}
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExpanded(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="map-legend"
            size={22}
            color={colors.primary[600]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: spacing.lg,
    zIndex: 6,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  panel: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    ...shadows.md,
    minWidth: 160,
    maxHeight: 350,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  scrollContent: {
    maxHeight: 280,
  },
  section: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  items: {
    gap: 4,
    paddingBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  colorLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  thickLine: {
    height: 5,
  },
  dashedLine: {
    opacity: 0.6,
  },
  label: {
    fontSize: 11,
    color: colors.neutral[700],
  },
});

export default MapLegend;
