import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import contentConfig from '../../src/shared/config/content.config.json';
import { EuroVeloRoute } from '../../src/features/routes/types';
import { colors, spacing, typography } from '../../src/shared/design/tokens';

// Country code to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  NO: '🇳🇴', SE: '🇸🇪', FI: '🇫🇮', DK: '🇩🇰', UK: '🇬🇧', IE: '🇮🇪',
  FR: '🇫🇷', ES: '🇪🇸', PT: '🇵🇹', IT: '🇮🇹', CH: '🇨🇭', DE: '🇩🇪',
  AT: '🇦🇹', NL: '🇳🇱', BE: '🇧🇪', LU: '🇱🇺', CZ: '🇨🇿', PL: '🇵🇱',
  SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮', HR: '🇭🇷', RS: '🇷🇸', RO: '🇷🇴',
  BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', CY: '🇨🇾', EE: '🇪🇪', LV: '🇱🇻',
  LT: '🇱🇹', BY: '🇧🇾', UA: '🇺🇦', RU: '🇷🇺', AL: '🇦🇱', ME: '🇲🇪',
  MK: '🇲🇰', MT: '🇲🇹', LI: '🇱🇮', MC: '🇲🇨',
};

// Country code to full name mapping
const COUNTRY_NAMES: Record<string, string> = {
  NO: 'Norway', SE: 'Sweden', FI: 'Finland', DK: 'Denmark',
  UK: 'United Kingdom', IE: 'Ireland', FR: 'France', ES: 'Spain',
  PT: 'Portugal', IT: 'Italy', CH: 'Switzerland', DE: 'Germany',
  AT: 'Austria', NL: 'Netherlands', BE: 'Belgium', LU: 'Luxembourg',
  CZ: 'Czechia', PL: 'Poland', SK: 'Slovakia', HU: 'Hungary',
  SI: 'Slovenia', HR: 'Croatia', RS: 'Serbia', RO: 'Romania',
  BG: 'Bulgaria', GR: 'Greece', TR: 'Turkey', CY: 'Cyprus',
  EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', BY: 'Belarus',
  UA: 'Ukraine', RU: 'Russia', AL: 'Albania', ME: 'Montenegro',
  MK: 'North Macedonia', MT: 'Malta', LI: 'Liechtenstein', MC: 'Monaco',
};

// Difficulty badge colors
const DIFFICULTY_COLORS = {
  easy: '#4CAF50',
  moderate: '#FF9800',
  difficult: '#F44336',
};

// Surface type icons
const SURFACE_ICONS: Record<string, string> = {
  asphalt: 'road',
  gravel: 'texture',
  dirt: 'terrain',
  paved: 'road-variant',
};

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Load route from content.config.json
  const route = useMemo(() => {
    return (contentConfig.routes as EuroVeloRoute[]).find(r => r.id === id);
  }, [id]);

  if (!route) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color={colors.neutral[400]} />
        <Text style={styles.errorText}>Route not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const countryCount = route.countryCount || route.countries.length;
  const difficultyColor = DIFFICULTY_COLORS[route.difficulty];
  const description = descriptionExpanded
    ? (route.fullDescription || route.description)
    : route.description;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView style={styles.container} bounces={false}>
        {/* Hero Image Section */}
        <ImageBackground
          source={{ uri: route.imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          >
            {/* Back Button */}
            <SafeAreaView edges={['top']} style={styles.heroHeader}>
              <TouchableOpacity
                style={styles.heroBackButton}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={[styles.evBadge, { backgroundColor: route.color }]}>
                <Text style={styles.evBadgeText}>EV{route.euroVeloId}</Text>
              </View>
              <Text style={styles.heroTitle}>{route.name}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="bike" size={20} color={route.color} />
            <Text style={styles.statValue}>{route.distance.toLocaleString()}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="earth" size={20} color={route.color} />
            <Text style={styles.statValue}>{countryCount}</Text>
            <Text style={styles.statLabel}>countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="bank" size={20} color={route.color} />
            <Text style={styles.statValue}>{route.unescoSites || 0}</Text>
            <Text style={styles.statLabel}>UNESCO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
            <Text style={[styles.statValue, { textTransform: 'capitalize' }]}>
              {route.difficulty}
            </Text>
            <Text style={styles.statLabel}>difficulty</Text>
          </View>
        </View>

        {/* Key Cities Path */}
        {route.keyCities && route.keyCities.length > 0 && (
          <View style={styles.citiesCard}>
            <MaterialCommunityIcons name="map-marker-path" size={18} color={route.color} />
            <Text style={styles.citiesText} numberOfLines={2}>
              {route.keyCities.join('  →  ')}
            </Text>
          </View>
        )}

        {/* Route Stages */}
        {route.stages && route.stages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Stages</Text>
            <View style={styles.stagesContainer}>
              {route.stages.map((stage, index) => (
                <View key={index} style={styles.stageItem}>
                  <View style={styles.stageTimeline}>
                    <View style={[styles.stageDot, { backgroundColor: route.color }]} />
                    {index < route.stages!.length - 1 && (
                      <View style={[styles.stageLine, { backgroundColor: `${route.color}40` }]} />
                    )}
                  </View>
                  <View style={styles.stageContent}>
                    <Text style={styles.stageName}>{stage.name}</Text>
                    <Text style={styles.stageRegion}>{stage.region}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            activeOpacity={0.7}
          >
            <Text
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : 3}
            >
              {description}
            </Text>
            {route.fullDescription && route.fullDescription !== route.description && (
              <Text style={[styles.readMore, { color: route.color }]}>
                {descriptionExpanded ? 'Show less' : 'Read more'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terrain Description */}
        {route.terrainDescription && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="terrain" size={18} color={route.color} />
              <Text style={styles.sectionTitle}>Terrain & Conditions</Text>
            </View>
            <Text style={styles.terrainText}>{route.terrainDescription}</Text>
          </View>
        )}

        {/* Countries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Countries</Text>
          <View style={styles.countriesGrid}>
            {route.countries.map((code) => (
              <View key={code} style={styles.countryChip}>
                <Text style={styles.countryFlag}>{COUNTRY_FLAGS[code] || '🏳️'}</Text>
                <Text style={styles.countryName}>{COUNTRY_NAMES[code] || code}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Highlights */}
        {route.highlights && route.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            {route.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <MaterialCommunityIcons
                  name="star"
                  size={16}
                  color={route.color}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Best Season */}
        {route.bestSeason && route.bestSeason.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Season</Text>
            <View style={styles.chipsRow}>
              {route.bestSeason.map((month) => (
                <View
                  key={month}
                  style={[styles.seasonChip, { backgroundColor: `${route.color}15` }]}
                >
                  <Text style={[styles.seasonText, { color: route.color }]}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Surface Types */}
        {route.surface && route.surface.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Surface Types</Text>
            <View style={styles.chipsRow}>
              {route.surface.map((type) => (
                <View key={type} style={styles.surfaceChip}>
                  <MaterialCommunityIcons
                    name={SURFACE_ICONS[type] || 'road'}
                    size={14}
                    color={colors.neutral[600]}
                  />
                  <Text style={styles.surfaceText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Practical Info */}
        {route.practicalInfo && (
          <View style={[styles.section, styles.practicalInfoSection]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Practical Tips</Text>
            </View>
            <Text style={styles.practicalInfoText}>{route.practicalInfo}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: route.color }]}
            onPress={() => router.push({
              pathname: '/(tabs)',
              params: { showRoute: route.euroVeloId.toString() }
            })}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="map" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View on Map</Text>
          </TouchableOpacity>

          {route.websiteUrl && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: route.color }]}
              onPress={() => Linking.openURL(route.websiteUrl!)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="web" size={20} color={route.color} />
              <Text style={[styles.secondaryButtonText, { color: route.color }]}>
                Official Website
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={route.color} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSizes.xl,
    color: colors.neutral[600],
  },
  backButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: typography.fontSizes.md,
    fontWeight: '600',
  },

  // Hero Section
  heroImage: {
    height: 280,
    width: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  evBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  evBadgeText: {
    color: '#fff',
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: -24,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  statValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Cities Path
  citiesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  citiesText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // Route Stages
  stagesContainer: {
    marginTop: -spacing.xs,
  },
  stageItem: {
    flexDirection: 'row',
    minHeight: 48,
  },
  stageTimeline: {
    width: 24,
    alignItems: 'center',
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  stageLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  stageContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  stageName: {
    fontSize: typography.fontSizes.md,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  stageRegion: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Terrain
  terrainText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 24,
  },

  // Practical Info
  practicalInfoSection: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  practicalInfoText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 24,
  },

  // Description
  descriptionText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  readMore: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
  },

  // Countries
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryName: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },

  // Highlights
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  highlightIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: 22,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  seasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  seasonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '500',
  },
  surfaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  surfaceText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },

  // Action Buttons
  actionsSection: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: typography.fontSizes.md,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: '600',
  },
});
