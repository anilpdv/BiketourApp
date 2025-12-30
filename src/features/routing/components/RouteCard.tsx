import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

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
  const flags = route.countries.map((c) => COUNTRY_FLAGS[c] || c).join('');
  const difficultyColor = DIFFICULTY_COLORS[route.difficulty];

  return (
    <Link href={`/route/${route.id}`} asChild>
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={[styles.colorBadge, { backgroundColor: route.color }]}>
            <Text style={styles.colorBadgeText}>EV{route.euroVeloId}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>{route.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.name}>{route.name}</Text>
        <Text style={styles.description}>{route.description}</Text>
        <Text style={styles.info}>
          {route.distance.toLocaleString()} km • {flags}
        </Text>
        <View style={styles.highlights}>
          {route.highlights.slice(0, 3).map((h, i) => (
            <Text key={i} style={styles.highlightTag}>{h}</Text>
          ))}
        </View>
      </TouchableOpacity>
    </Link>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  colorBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  colorBadgeText: {
    color: colors.neutral[0],
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.md,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  difficultyText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  name: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  description: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  highlightTag: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
});
