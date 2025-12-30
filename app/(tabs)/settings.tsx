import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/shared/design/tokens';

export default function SettingsScreen() {
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [showWeather, setShowWeather] = React.useState(true);
  const [showPOIs, setShowPOIs] = React.useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Weather</Text>
            <Text style={styles.settingDescription}>Display weather widget on map</Text>
          </View>
          <Switch value={showWeather} onValueChange={setShowWeather} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show POIs</Text>
            <Text style={styles.settingDescription}>Display points of interest markers</Text>
          </View>
          <Switch value={showPOIs} onValueChange={setShowPOIs} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Data</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Text style={styles.settingDescription}>Use cached data only</Text>
          </View>
          <Switch value={offlineMode} onValueChange={setOfflineMode} />
        </View>

        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download Route Data</Text>
          <Text style={styles.downloadSize}>~50 MB</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download Map Tiles</Text>
          <Text style={styles.downloadSize}>~500 MB per route</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Data Sources</Text>
          <Text style={styles.aboutValue}>OpenStreetMap, Open-Meteo</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BikeTour Europe</Text>
        <Text style={styles.footerSubtext}>Built for the journey of a lifetime</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  section: {
    backgroundColor: colors.neutral[0],
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingLabel: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[800],
  },
  settingDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  downloadButtonText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[800],
  },
  downloadSize: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  aboutLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
  },
  aboutValue: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[800],
  },
  footer: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  footerText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  footerSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
});
