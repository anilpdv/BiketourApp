import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

const COUNTRY_FLAGS: Record<string, string> = {
  NO: '🇳🇴', UK: '🇬🇧', IE: '🇮🇪', FR: '🇫🇷', ES: '🇪🇸', PT: '🇵🇹',
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', SK: '🇸🇰', HU: '🇭🇺', RS: '🇷🇸',
  BG: '🇧🇬', RO: '🇷🇴', NL: '🇳🇱', BE: '🇧🇪', IT: '🇮🇹', SI: '🇸🇮',
  HR: '🇭🇷', PL: '🇵🇱', CZ: '🇨🇿', DK: '🇩🇰', SE: '🇸🇪', FI: '🇫🇮',
  EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', GR: '🇬🇷', TR: '🇹🇷', CY: '🇨🇾',
};

const DIFFICULTY_COLORS = {
  easy: colors.secondary[500],
  moderate: colors.status.warning,
  difficult: colors.status.error,
};

export interface RouteConfig {
  id: string;
  euroVeloId: number;
  name: string;
  description: string;
  distance: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  color: string;
  countries: string[];
  highlights: string[];
}

interface RouteCardProps {
  route: RouteConfig;
}

export const RouteCard = memo(function RouteCard({ route }: RouteCardProps) {
  const theme = useTheme();
  const flags = route.countries.map((c) => COUNTRY_FLAGS[c] || c).join('');
  const difficultyColor = DIFFICULTY_COLORS[route.difficulty];

  return (
    <Link href={`/route/${route.id}`} asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Chip
                compact
                mode="flat"
                style={[styles.evBadge, { backgroundColor: route.color }]}
                textStyle={styles.evBadgeText}
              >
                EV{route.euroVeloId}
              </Chip>
              <Chip
                compact
                mode="flat"
                style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}
                textStyle={styles.difficultyText}
              >
                {route.difficulty}
              </Chip>
            </View>

            <Text variant="titleLarge" style={styles.name}>
              {route.name}
            </Text>

            <Text variant="bodyMedium" style={styles.description}>
              {route.description}
            </Text>

            <Text variant="bodyMedium" style={styles.info}>
              {route.distance.toLocaleString()} km • {flags}
            </Text>

            <View style={styles.highlights}>
              {route.highlights.slice(0, 3).map((h, i) => (
                <Chip
                  key={i}
                  compact
                  mode="flat"
                  style={styles.highlightChip}
                  textStyle={styles.highlightText}
                >
                  {h}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Link>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  evBadge: {
    borderRadius: borderRadius.lg,
  },
  evBadgeText: {
    color: colors.neutral[0],
    fontWeight: '700',
    fontSize: 12,
  },
  difficultyBadge: {
    borderRadius: borderRadius.md,
  },
  difficultyText: {
    color: colors.neutral[0],
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  name: {
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  info: {
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  highlightChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
  },
  highlightText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
});
