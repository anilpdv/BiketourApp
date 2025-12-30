import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/shared/design/tokens';

type Mood = 'amazing' | 'good' | 'okay' | 'tired' | 'challenging';

const moodEmoji: Record<Mood, string> = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  tired: '😴',
  challenging: '😤',
};

export default function JournalScreen() {
  const [entries] = useState([
    {
      id: '1',
      date: '2025-12-29',
      title: 'First Day on the Rhine',
      preview: 'Started my journey in Basel. The weather was perfect...',
      photoCount: 3,
      mood: 'amazing' as Mood,
      distanceKm: 85,
    },
    {
      id: '2',
      date: '2025-12-28',
      title: 'Arriving in Switzerland',
      preview: 'Flew into Zurich and took the train to Basel...',
      photoCount: 5,
      mood: 'good' as Mood,
      distanceKm: 0,
    },
  ]);

  const stats = {
    totalEntries: entries.length,
    totalPhotos: entries.reduce((sum, e) => sum + e.photoCount, 0),
    totalKm: entries.reduce((sum, e) => sum + e.distanceKm, 0),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPhotos}</Text>
          <Text style={styles.statLabel}>photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalKm}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
      </View>

      <ScrollView style={styles.entriesList}>
        <Text style={styles.entriesTitle}>Recent Entries</Text>
        {entries.map((entry) => (
          <Link key={entry.id} href={`/journal/${entry.id}`} asChild>
            <TouchableOpacity style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{entry.date}</Text>
                {entry.mood && (
                  <Text style={styles.entryMood}>{moodEmoji[entry.mood]}</Text>
                )}
              </View>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryPreview}>{entry.preview}</Text>
              <View style={styles.entryFooter}>
                {entry.photoCount > 0 && (
                  <Text style={styles.entryPhotoCount}>
                    📷 {entry.photoCount} photos
                  </Text>
                )}
                {entry.distanceKm > 0 && (
                  <Text style={styles.entryDistance}>
                    🚴 {entry.distanceKm} km
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>

      <Link href="/journal/create" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New Entry</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// Journal feature accent color
const JOURNAL_ACCENT = '#7E57C2';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.xl,
    backgroundColor: JOURNAL_ACCENT,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  entriesList: {
    flex: 1,
    padding: spacing.lg,
  },
  entriesTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  entryCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[400],
  },
  entryMood: {
    fontSize: typography.fontSizes.xl,
  },
  entryTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  entryPreview: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  entryPhotoCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  entryDistance: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  addButton: {
    backgroundColor: JOURNAL_ACCENT,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
});
