import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  Card,
  Text,
  FAB,
  Chip,
  useTheme,
} from 'react-native-paper';
import { StatsHeader, ErrorBoundary } from '../../src/shared/components';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

type Mood = 'amazing' | 'good' | 'okay' | 'tired' | 'challenging';

const moodEmoji: Record<Mood, string> = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  tired: '😴',
  challenging: '😤',
};

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
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

  const stats = useMemo(() => [
    { value: entries.length, label: 'entries' },
    { value: entries.reduce((sum, e) => sum + e.photoCount, 0), label: 'photos' },
    { value: entries.reduce((sum, e) => sum + e.distanceKm, 0), label: 'km' },
  ], [entries]);

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatsHeader stats={stats} backgroundColor={JOURNAL_ACCENT} />

        <ScrollView style={styles.entriesList} contentContainerStyle={styles.entriesContent}>
          <Text variant="titleMedium" style={styles.entriesTitle}>
            Recent Entries
          </Text>

          {entries.map((entry) => (
            <Card
              key={entry.id}
              mode="elevated"
              style={styles.entryCard}
              onPress={() => router.push(`/journal/${entry.id}`)}
            >
              <Card.Content>
                <View style={styles.entryHeader}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {entry.date}
                  </Text>
                  {entry.mood && (
                    <Text style={styles.entryMood}>{moodEmoji[entry.mood]}</Text>
                  )}
                </View>

                <Text variant="titleMedium" style={styles.entryTitle}>
                  {entry.title}
                </Text>

                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  numberOfLines={2}
                >
                  {entry.preview}
                </Text>

                <View style={styles.entryFooter}>
                  {entry.photoCount > 0 && (
                    <Chip
                      icon="camera"
                      compact
                      mode="flat"
                      style={styles.chip}
                    >
                      {entry.photoCount} photos
                    </Chip>
                  )}
                  {entry.distanceKm > 0 && (
                    <Chip
                      icon="bike"
                      compact
                      mode="flat"
                      style={styles.chip}
                    >
                      {entry.distanceKm} km
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <FAB
          icon="plus"
          label="New Entry"
          style={[styles.fab, { backgroundColor: JOURNAL_ACCENT }]}
          color={colors.neutral[0]}
          onPress={() => router.push('/journal/create')}
        />
      </View>
    </ErrorBoundary>
  );
}

// Journal feature accent color
const JOURNAL_ACCENT = '#7E57C2';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  entriesTitle: {
    marginBottom: spacing.md,
  },
  entryCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryMood: {
    fontSize: 20,
  },
  entryTitle: {
    marginBottom: spacing.xs,
  },
  entryFooter: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.neutral[100],
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
