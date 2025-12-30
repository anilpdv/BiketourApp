import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getRouteConfig } from '../../src/features/routes/services/routeLoader.service';

const countryFlags: Record<string, string> = {
  NO: '🇳🇴', UK: '🇬🇧', IE: '🇮🇪', FR: '🇫🇷', ES: '🇪🇸', PT: '🇵🇹',
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', SK: '🇸🇰', HU: '🇭🇺', RS: '🇷🇸',
  BG: '🇧🇬', RO: '🇷🇴', NL: '🇳🇱',
};

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = getRouteConfig(id);

  if (!route) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    );
  }

  const flags = route.countries.map((c) => countryFlags[c] || c).join(' ');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: route.color }]}>
        <Text style={styles.routeNumber}>EuroVelo {route.euroVeloId}</Text>
        <Text style={styles.routeName}>{route.name}</Text>
        <Text style={styles.routeDescription}>{route.description}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{route.distance.toLocaleString()}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{route.countries.length}</Text>
          <Text style={styles.statLabel}>countries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { textTransform: 'capitalize' }]}>{route.difficulty}</Text>
          <Text style={styles.statLabel}>difficulty</Text>
        </View>
      </View>

      {/* Countries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Countries</Text>
        <Text style={styles.flagsText}>{flags}</Text>
      </View>

      {/* Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        {route.highlights.map((highlight, index) => (
          <View key={index} style={styles.highlightItem}>
            <Text style={styles.highlightBullet}>•</Text>
            <Text style={styles.highlightText}>{highlight}</Text>
          </View>
        ))}
      </View>

      {/* Best Season */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Season</Text>
        <View style={styles.seasonsRow}>
          {route.bestSeason.map((month) => (
            <View key={month} style={styles.seasonBadge}>
              <Text style={styles.seasonText}>{month}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Surface */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surface Types</Text>
        <View style={styles.surfaceRow}>
          {route.surface.map((type) => (
            <View key={type} style={styles.surfaceBadge}>
              <Text style={styles.surfaceText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: route.color }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.actionButtonText}>View on Map</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#666' },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  routeNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  routeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  routeDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginTop: -12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  flagsText: { fontSize: 24, letterSpacing: 4 },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  highlightBullet: {
    fontSize: 16,
    color: '#2196F3',
    marginRight: 8,
  },
  highlightText: { fontSize: 14, color: '#666', flex: 1 },
  seasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seasonBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seasonText: {
    fontSize: 12,
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  surfaceRow: { flexDirection: 'row', gap: 8 },
  surfaceBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  surfaceText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  actions: { padding: 16, marginBottom: 32 },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
