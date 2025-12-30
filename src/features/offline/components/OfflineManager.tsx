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
import { formatBytes } from '../services/offlineMap.service';

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

  const renderPack = ({ item }: { item: any }) => {
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
          {item.status?.completedTileSize > 0 && (
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

  const allItems = [...downloadingList, ...packs.filter(p => !downloadingPacks.has(p.name))];

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
          <ActivityIndicator size="large" color="#2196F3" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  packItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  packInfo: {
    marginBottom: 12,
  },
  packName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  packStatus: {
    fontSize: 14,
    color: '#666',
  },
  packSize: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
