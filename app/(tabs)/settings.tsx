import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  List,
  Switch,
  Surface,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

export default function SettingsScreen() {
  const theme = useTheme();
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [showWeather, setShowWeather] = React.useState(true);
  const [showPOIs, setShowPOIs] = React.useState(true);

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
  footer: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
});
