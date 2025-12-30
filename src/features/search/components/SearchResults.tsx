import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SearchResult } from '../types';
import { useSearchStore } from '../store/searchStore';

// Place type icons
const PLACE_TYPE_ICONS: Record<string, string> = {
  city: '🏙️',
  town: '🏘️',
  village: '🏡',
  hamlet: '🏚️',
  suburb: '🏢',
  neighbourhood: '📍',
  country: '🌍',
  state: '🗺️',
  county: '📍',
  road: '🛣️',
  residential: '🏠',
  park: '🌳',
  river: '🌊',
  mountain: '⛰️',
  lake: '💧',
  default: '📍',
};

interface SearchResultsProps {
  onSelectResult: (result: SearchResult) => void;
  maxHeight?: number;
}

function SearchResultItem({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
}) {
  const icon = PLACE_TYPE_ICONS[result.placeType || 'default'] || PLACE_TYPE_ICONS.default;

  return (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onPress(result)}
      activeOpacity={0.7}
    >
      <Text style={styles.resultIcon}>{icon}</Text>
      <View style={styles.resultContent}>
        <Text style={styles.resultName} numberOfLines={1}>
          {result.name}
        </Text>
        <Text style={styles.resultAddress} numberOfLines={1}>
          {formatAddress(result)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatAddress(result: SearchResult): string {
  if (result.address) {
    const parts = [
      result.address.city,
      result.address.county,
      result.address.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
  // Fallback to display name without the first part (which is the name)
  const parts = result.displayName.split(',').slice(1, 4);
  return parts.join(',').trim();
}

export const SearchResults = memo(function SearchResults({
  onSelectResult,
  maxHeight = 300,
}: SearchResultsProps) {
  const { results, recentSearches, query, error, isSearching } = useSearchStore();

  const handleSelect = useCallback(
    (result: SearchResult) => {
      Keyboard.dismiss();
      onSelectResult(result);
    },
    [onSelectResult]
  );

  // Show nothing if searching or no query
  if (isSearching) {
    return null;
  }

  // Show error
  if (error) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // Show results
  if (results.length > 0) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultItem result={item} onPress={handleSelect} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Show "no results" if query exists
  if (query.length >= 2) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      </View>
    );
  }

  // Show recent searches if no query
  if (query.length === 0 && recentSearches.length > 0) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
        </View>
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultItem result={item} onPress={handleSelect} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 13,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
  },
});
