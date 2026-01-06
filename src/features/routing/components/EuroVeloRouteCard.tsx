import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EuroVeloRoute } from '../../routes/types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../shared/design/tokens';

// Country code to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  NO: '🇳🇴', UK: '🇬🇧', IE: '🇮🇪', FR: '🇫🇷', ES: '🇪🇸', PT: '🇵🇹',
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', SK: '🇸🇰', HU: '🇭🇺', RS: '🇷🇸',
  BG: '🇧🇬', RO: '🇷🇴', NL: '🇳🇱', BE: '🇧🇪', IT: '🇮🇹', SI: '🇸🇮',
  HR: '🇭🇷', PL: '🇵🇱', CZ: '🇨🇿', DK: '🇩🇰', SE: '🇸🇪', FI: '🇫🇮',
  EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', GR: '🇬🇷', TR: '🇹🇷', CY: '🇨🇾',
  RU: '🇷🇺', BY: '🇧🇾', UA: '🇺🇦', AL: '🇦🇱', ME: '🇲🇪', MK: '🇲🇰',
  MT: '🇲🇹', LI: '🇱🇮', LU: '🇱🇺', MC: '🇲🇨',
};

// Difficulty badge colors
const DIFFICULTY_COLORS = {
  easy: '#4CAF50',
  moderate: '#FF9800',
  difficult: '#F44336',
};

// Fallback gradient for when image fails
const FALLBACK_GRADIENT: [string, string] = ['#1a1a2e', '#16213e'];

interface EuroVeloRouteCardProps {
  route: EuroVeloRoute;
}

export const EuroVeloRouteCard = memo(function EuroVeloRouteCard({
  route,
}: EuroVeloRouteCardProps) {
  const [imageError, setImageError] = useState(false);
  const difficultyColor = DIFFICULTY_COLORS[route.difficulty];

  // Format distance with commas
  const formattedDistance = route.distance.toLocaleString();

  // Get country count
  const countryCount = route.countryCount || route.countries.length;

  // Get key cities path (first 3-4 cities separated by arrows)
  const citiesPath = route.keyCities?.slice(0, 4).join(' → ') || '';

  // Render the card content (used in both image and fallback cases)
  const renderCardContent = () => (
    <>
      {/* Gradient overlay for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      {/* Badges overlay */}
      <View style={styles.badgesContainer}>
        <View style={[styles.evBadge, { backgroundColor: route.color }]}>
          <Text style={styles.evBadgeText}>EV{route.euroVeloId}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{route.difficulty}</Text>
        </View>
      </View>

      {/* Text content at bottom */}
      <View style={styles.textContent}>
        <Text style={styles.routeName} numberOfLines={1}>
          {route.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {route.description}
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.cardWrapper}>
      <Link href={`/route/${route.id}`} asChild>
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {route.imageUrl && !imageError ? (
            <ImageBackground
              source={{ uri: route.imageUrl }}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
              onError={() => setImageError(true)}
            >
              {renderCardContent()}
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={FALLBACK_GRADIENT}
              style={[styles.heroImage, styles.heroImageStyle]}
            >
              {renderCardContent()}
            </LinearGradient>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="bike" size={16} color={colors.neutral[600]} />
            <Text style={styles.statValue}>{formattedDistance} km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="earth" size={16} color={colors.neutral[600]} />
            <Text style={styles.statValue}>{countryCount} countries</Text>
          </View>
          {route.unescoSites && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <MaterialCommunityIcons name="bank" size={16} color={colors.neutral[600]} />
                <Text style={styles.statValue}>{route.unescoSites} UNESCO</Text>
              </View>
            </>
          )}
        </View>

        {/* Key Cities Path */}
        {citiesPath && (
          <View style={styles.citiesRow}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={14}
              color={route.color}
            />
            <Text style={styles.citiesText} numberOfLines={1}>
              {citiesPath}
            </Text>
          </View>
        )}

        {/* Highlight Chips */}
        <View style={styles.highlightsRow}>
          {route.highlights.slice(0, 3).map((highlight, index) => (
            <View
              key={index}
              style={[styles.highlightChip, { backgroundColor: `${route.color}20` }]}
            >
              <Text style={[styles.highlightText, { color: route.color }]}>
                {highlight}
              </Text>
            </View>
          ))}
        </View>
        </Pressable>
      </Link>
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  heroContainer: {
    height: 160,
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  badgesContainer: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  evBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  evBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  routeName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.sm,
  },
  citiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  citiesText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  highlightChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.medium,
  },
});

export default EuroVeloRouteCard;
