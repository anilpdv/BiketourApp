import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOfflineStore } from '../store/offlineStore';
import { formatBytes, OfflinePack, OfflinePackStatus } from '../services/offlineMap.service';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

/**
 * Unified list item type for displaying both downloaded and downloading packs
 */
type OfflineListItem = {
  name: string;
  status?: OfflinePackStatus;
};

interface OfflineManagerProps {
  onClose?: () => void;
}

export function OfflineManager({ onClose }: OfflineManagerProps) {
  const { packs, downloadingPacks, isLoading, error, loadPacks, deleteRegion, clearError } =
    useOfflineStore();

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handleDelete = (name: string) => {
    Alert.alert(
      'Delete Offline Region',
      `Are you sure you want to delete "${name}"? You will need to download it again for offline use.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRegion(name),
        },
      ]
    );
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'complete':
        return 'Downloaded';
      case 'active':
        return 'Downloading...';
      case 'inactive':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  const renderPack = ({ item }: { item: OfflineListItem }) => {
    const downloadStatus = downloadingPacks.get(item.name);
    const isDownloading = downloadStatus?.state === 'active';

    return (
      <View style={styles.packItem}>
        <View style={styles.packInfo}>
          <Text style={styles.packName}>{item.name}</Text>
          <Text style={styles.packStatus}>
            {isDownloading
              ? `Downloading: ${Math.round(downloadStatus.percentage)}%`
              : getStatusText(item.status?.state || 'complete')}
          </Text>
          {item.status && item.status.completedTileSize > 0 && (
            <Text style={styles.packSize}>
              Size: {formatBytes(item.status.completedTileSize)}
            </Text>
          )}
        </View>

        {isDownloading ? (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${downloadStatus.percentage}%` }]}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.name)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const downloadingList = Array.from(downloadingPacks.entries()).map(([name, status]) => ({
    name,
    status,
  }));

  const allItems: OfflineListItem[] = [...downloadingList, ...packs.filter(p => !downloadingPacks.has(p.name))];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Maps</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading offline regions...</Text>
        </View>
      ) : allItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No Offline Maps</Text>
          <Text style={styles.emptyText}>
            Download route regions for offline use when you're touring without internet
            access.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          renderItem={renderPack}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tip: Select a route and tap "Download for Offline" to save the map tiles for that
          region.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.primary[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.neutral[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: spacing.lg,
  },
  packItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  packInfo: {
    marginBottom: spacing.md,
  },
  packName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  packStatus: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  packSize: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.status.errorBg,
    borderRadius: borderRadius.sm,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.status.error,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.neutral[25],
  },
  footerText: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
});
