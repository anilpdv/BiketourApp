import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  List,
  Switch,
  Surface,
  Text,
  Divider,
  useTheme,
  IconButton,
  Button,
} from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';
import { usePOIDownloadStore } from '../../src/features/offline/store/poiDownloadStore';
import { formatBytes } from '../../src/features/offline/services/poiDownload.service';

export default function SettingsScreen() {
  const theme = useTheme();
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [showWeather, setShowWeather] = React.useState(true);
  const [showPOIs, setShowPOIs] = React.useState(true);

  // POI download store
  const {
    downloadedRegions,
    isLoadingRegions,
    totalPOIs,
    totalSizeBytes,
    loadDownloadedRegions,
    deleteRegion,
  } = usePOIDownloadStore();

  // Load downloaded regions on mount
  useEffect(() => {
    loadDownloadedRegions();
  }, [loadDownloadedRegions]);

  // Handle delete region with confirmation
  const handleDeleteRegion = useCallback((regionId: string, regionName: string) => {
    Alert.alert(
      'Delete Region',
      `Are you sure you want to delete "${regionName}"? This will remove all downloaded POIs for this area.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRegion(regionId),
        },
      ]
    );
  }, [deleteRegion]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.section} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Map Settings</List.Subheader>

          <List.Item
            title="Show Weather"
            description="Display weather widget on map"
            left={(props) => <List.Icon {...props} icon="weather-partly-cloudy" />}
            right={() => (
              <Switch
                value={showWeather}
                onValueChange={setShowWeather}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />

          <List.Item
            title="Show POIs"
            description="Display points of interest markers"
            left={(props) => <List.Icon {...props} icon="map-marker-multiple" />}
            right={() => (
              <Switch
                value={showPOIs}
                onValueChange={setShowPOIs}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Offline Data</List.Subheader>

          <List.Item
            title="Offline Mode"
            description="Use cached data only"
            left={(props) => <List.Icon {...props} icon="cloud-off-outline" />}
            right={() => (
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />

          <List.Item
            title="Download Route Data"
            description="~50 MB"
            left={(props) => <List.Icon {...props} icon="download" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.downloadItem}
          />
          <Divider />

          <List.Item
            title="Download Map Tiles"
            description="~500 MB per route"
            left={(props) => <List.Icon {...props} icon="map-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.downloadItem}
          />
        </List.Section>
      </Surface>

      {/* Downloaded POIs Section */}
      <Surface style={styles.section} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Downloaded POIs</List.Subheader>

          {/* Summary */}
          <List.Item
            title="Total Downloaded"
            description={`${totalPOIs.toLocaleString()} POIs • ${formatBytes(totalSizeBytes)}`}
            left={(props) => <List.Icon {...props} icon="database" />}
          />
          <Divider />

          {/* Loading indicator */}
          {isLoadingRegions && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={{ marginLeft: spacing.sm }}>Loading regions...</Text>
            </View>
          )}

          {/* Downloaded regions list */}
          {!isLoadingRegions && downloadedRegions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                No downloaded POI regions yet.{'\n'}
                Download POIs when you visit a new area.
              </Text>
            </View>
          )}

          {!isLoadingRegions && downloadedRegions.map((region) => (
            <React.Fragment key={region.id}>
              <List.Item
                title={region.name}
                description={`${region.poiCount.toLocaleString()} POIs • ${formatBytes(region.sizeBytes)} • ${region.radiusKm}km radius`}
                left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
                right={() => (
                  <IconButton
                    icon="delete-outline"
                    iconColor={theme.colors.error}
                    size={20}
                    onPress={() => handleDeleteRegion(region.id, region.name)}
                  />
                )}
              />
              <Divider />
            </React.Fragment>
          ))}
        </List.Section>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>About</List.Subheader>

          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
          <Divider />

          <List.Item
            title="Data Sources"
            description="OpenStreetMap, Open-Meteo"
            left={(props) => <List.Icon {...props} icon="database-outline" />}
          />
        </List.Section>
      </Surface>

      <View style={styles.footer}>
        <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
          BikeTour Europe
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Built for the journey of a lifetime
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  downloadItem: {
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
});
