import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data - would come from store
  const entry = {
    id,
    date: '2025-12-29',
    title: 'First Day on the Rhine',
    content: `Started my journey in Basel today. The weather was absolutely perfect - clear skies and a gentle breeze.

The Rhine path was well-marked and mostly flat, making for easy cycling. Passed through several charming German villages and stopped for coffee at a riverside cafe.

The route follows the river closely, offering beautiful views throughout. Crossed into Germany around noon and the landscape changed subtly but noticeably.

Ended the day in Freiburg, a lovely university town with a stunning cathedral. Found a nice campsite just outside the city center.

Total distance: 85 km
Moving time: 4h 32m
Average speed: 18.7 km/h`,
    mood: 'amazing',
    distanceKm: 85,
    photoCount: 3,
  };

  const moodEmoji: Record<string, string> = {
    amazing: '🤩',
    good: '😊',
    okay: '😐',
    tired: '😴',
    challenging: '😤',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{entry.date}</Text>
        <Text style={styles.mood}>{moodEmoji[entry.mood]}</Text>
      </View>

      <Text style={styles.title}>{entry.title}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{entry.distanceKm}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{entry.photoCount}</Text>
          <Text style={styles.statLabel}>photos</Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.content}>{entry.content}</Text>
      </View>

      {/* Photo placeholder */}
      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  date: { fontSize: 14, color: '#888' },
  mood: { fontSize: 32 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#7E57C2',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  contentSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  photosSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: { fontSize: 32 },
});
