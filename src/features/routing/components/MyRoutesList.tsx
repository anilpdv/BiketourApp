import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSavedRoutesStore, RoutePreviewCard, CustomRouteSummary } from '../index';
import { LoadingSpinner, EmptyState, Button } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/design/tokens';

export function MyRoutesList() {
  const {
    routes: savedRoutes,
    isLoading,
    error,
    loadRoutes,
    deleteRoute,
    exportRoute,
    importRoute,
    openRoute,
  } = useSavedRoutesStore();

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleDeleteRoute = useCallback((route: CustomRouteSummary) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${route.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoute(route.id),
        },
      ]
    );
  }, [deleteRoute]);

  const handleExportRoute = useCallback(async (route: CustomRouteSummary) => {
    const success = await exportRoute(route.id);
    if (!success) {
      Alert.alert('Export Failed', 'Failed to export the route. Please try again.');
    }
  }, [exportRoute]);

  const handleImport = useCallback(async () => {
    try {
      const route = await importRoute();
      if (route) {
        Alert.alert('Import Successful', `"${route.name}" has been imported.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import the route.';
      Alert.alert('Import Failed', message);
    }
  }, [importRoute]);

  const handleOpenRoute = useCallback(async (route: CustomRouteSummary) => {
    const fullRoute = await openRoute(route.id);
    if (fullRoute) {
      router.push('/');
    } else {
      Alert.alert('Error', 'Failed to open route');
    }
  }, [openRoute]);

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Routes</Text>
          <Text style={styles.subtitle}>
            {savedRoutes.length} custom routes
          </Text>
        </View>
        <Button
          label="Import GPX"
          onPress={handleImport}
          variant="primary"
          size="sm"
          icon={<MaterialCommunityIcons name="import" size={16} color="#fff" />}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading routes..." />
      ) : savedRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="map-marker-path" size={48} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>No saved routes yet</Text>
          <Text style={styles.emptySubtitle}>Create a route on the map or import a GPX file</Text>
        </View>
      ) : (
        savedRoutes.map((route) => (
          <RoutePreviewCard
            key={route.id}
            route={route}
            onPress={handleOpenRoute}
            onExport={handleExportRoute}
            onDelete={handleDeleteRoute}
          />
        ))
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
