import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POIPriority, getCategoryGroupColor, getCategoryPriority } from '../../pois/config/poiGroupColors';
import { CATEGORY_TO_VECTOR_ICON, ALL_CATEGORIES } from '../../pois/config/poiIcons';
import { POICategory } from '../../pois/types';
import { colors } from '../../../shared/design/tokens';

// Priority levels for marker size hierarchy
const PRIORITIES: POIPriority[] = ['essential', 'important', 'secondary', 'optional'];

// Tiered shape system: droplets for high priority, circles with notch for lower priority
type MarkerShape = 'droplet' | 'circle';

interface MarkerSizeConfig {
  shape: MarkerShape;
  width: number;
  height: number;
  iconSize: number;
  borderWidth: number;
  // For droplet shape:
  pointerWidth?: number;
  pointerHeight?: number;
  // For circle shape:
  notchSize?: number;
}

// Marker size configurations by priority level
// Essential/Important: ORIGINAL big droplet pins (36×40, icon 22px)
// Secondary/Optional: Circles with small notch indicator
const MARKER_SIZES: Record<POIPriority, MarkerSizeConfig> = {
  // ORIGINAL big droplet sizes (from git history commit 681b2e6)
  essential: {
    shape: 'droplet',
    width: 36,
    height: 40,
    iconSize: 22,
    borderWidth: 2,
    pointerWidth: 8,
    pointerHeight: 10,
  },
  important: {
    shape: 'droplet',
    width: 36,
    height: 40,
    iconSize: 22,
    borderWidth: 2,
    pointerWidth: 8,
    pointerHeight: 10,
  },
  // Circles with small notch to indicate they're markers
  secondary: {
    shape: 'circle',
    width: 22,
    height: 22,
    iconSize: 12,
    borderWidth: 1,
    notchSize: 4,
  },
  optional: {
    shape: 'circle',
    width: 16,
    height: 16,
    iconSize: 9,
    borderWidth: 1,
    notchSize: 3,
  },
};

// ViewShot container sizes (extra space for shadows + notch)
const SHOT_SIZES: Record<POIPriority, { width: number; height: number }> = {
  essential: { width: 46, height: 60 },  // Big for original size + shadow
  important: { width: 46, height: 60 },  // Same as essential
  secondary: { width: 30, height: 34 },  // Circle + notch
  optional: { width: 24, height: 28 },
};

// Cluster counts to generate images for (exported for use in POILayer)
export const CLUSTER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 75, 99, '99+'] as const;

export type MarkerImagesMap = Record<string, { uri: string }>;

interface MarkerGeneratorProps {
  onImagesGenerated: (images: MarkerImagesMap) => void;
}

// Generate all category × priority combinations for marker naming
// Each category gets its own icon (unlike before where all 'rest' group got 'tent')
type MarkerVariant = { category: POICategory; priority: POIPriority; key: string };

function getMarkerVariants(): MarkerVariant[] {
  const variants: MarkerVariant[] = [];

  for (const category of ALL_CATEGORIES) {
    for (const priority of PRIORITIES) {
      variants.push({
        category,
        priority,
        key: `marker-${category}-${priority}`,
      });
    }
  }

  return variants;
}

/**
 * Hidden component that generates marker images for each category × priority
 * combination and cluster count images. Renders once, captures images, then unmounts.
 *
 * Generates: 21 categories × 4 priorities = 84 marker images + cluster images
 * Each category gets its own icon (campsite=tent, wild_camping=tree, shelter=home, etc.)
 */
export function MarkerImageGenerator({ onImagesGenerated }: MarkerGeneratorProps) {
  // Use Map instead of object to avoid Reanimated "tried to modify key" warnings
  // Maps are designed for dynamic key mutations, objects trigger warnings when serialized
  const viewShotRefs = useRef<Map<string, ViewShot | null>>(new Map());
  const [capturedCount, setCapturedCount] = useState(0);
  const imagesRef = useRef<Map<string, { uri: string }>>(new Map());

  // Get all marker variants (group × priority combinations)
  const markerVariants = getMarkerVariants();

  // Total images to generate: marker variants + cluster counts
  const totalImages = markerVariants.length + CLUSTER_COUNTS.length;

  // Stable ref setter to avoid Reanimated warnings from inline mutations
  const setViewShotRef = useCallback((key: string, ref: ViewShot | null) => {
    viewShotRefs.current.set(key, ref);
  }, []);

  const captureImage = useCallback(async (key: string) => {
    const ref = viewShotRefs.current.get(key);
    if (ref && ref.capture) {
      try {
        const uri = await ref.capture();
        imagesRef.current.set(key, { uri });
        setCapturedCount(prev => prev + 1);
      } catch (error) {
        console.warn(`[MarkerGen] Failed to capture ${key}:`, error);
        setCapturedCount(prev => prev + 1);
      }
    }
  }, []);

  useEffect(() => {
    // Capture all images after initial render
    const timer = setTimeout(() => {
      // Capture marker images (all category × priority variants)
      markerVariants.forEach(variant => captureImage(variant.key));
      // Capture cluster images
      CLUSTER_COUNTS.forEach(count => captureImage(`cluster-${count}`));
    }, 100);
    return () => clearTimeout(timer);
  }, [markerVariants, captureImage]);

  useEffect(() => {
    // When all captures are done, notify parent
    if (capturedCount === totalImages) {
      // Convert Map to object for consumers
      const imagesObject: MarkerImagesMap = {};
      imagesRef.current.forEach((value, key) => {
        imagesObject[key] = value;
      });
      console.log('[MarkerGen] All images generated:', imagesRef.current.size);
      onImagesGenerated(imagesObject);
    }
  }, [capturedCount, totalImages, onImagesGenerated]);

  return (
    <View style={styles.hiddenContainer}>
      {/* POI Marker images - one for each category × priority combination */}
      {markerVariants.map(({ category, priority, key }) => {
        const size = MARKER_SIZES[priority];
        const shotSize = SHOT_SIZES[priority];
        const color = getCategoryGroupColor(category); // Group color for visual consistency
        const icon = CATEGORY_TO_VECTOR_ICON[category]; // Category-specific icon!

        // All priorities now use unified droplet design, just different sizes
        // Essential/Important: large droplet (25×28)
        // Secondary: medium droplet (18×20)
        // Optional: small droplet (14×16)

        const isEssentialOrImportant = priority === 'essential' || priority === 'important';
        const isSecondary = priority === 'secondary';

        const bodyStyle = isEssentialOrImportant
          ? styles.originalPinBody
          : isSecondary
            ? styles.secondaryPinBody
            : styles.optionalPinBody;

        const pointerStyle = isEssentialOrImportant
          ? styles.originalPinPointer
          : isSecondary
            ? styles.secondaryPinPointer
            : styles.optionalPinPointer;

        const iconSize = isEssentialOrImportant ? 15 : isSecondary ? 11 : 9;
        const shotWidth = isEssentialOrImportant ? 35 : isSecondary ? 28 : 24;
        const shotHeight = isEssentialOrImportant ? 45 : isSecondary ? 35 : 28;

        return (
          <ViewShot
            key={key}
            ref={ref => setViewShotRef(key, ref)}
            options={{ format: 'png', quality: 1, result: 'data-uri' }}
            style={{ width: shotWidth, height: shotHeight, backgroundColor: 'transparent' }}
          >
            <View style={styles.markerContainer}>
              <View style={[bodyStyle, { backgroundColor: color }]}>
                <MaterialCommunityIcons
                  name={icon as any}
                  size={iconSize}
                  color={colors.neutral[0]}
                />
              </View>
              <View style={[pointerStyle, { borderTopColor: color }]} />
            </View>
          </ViewShot>
        );
      })}

      {/* Cluster count images */}
      {CLUSTER_COUNTS.map(count => (
        <ViewShot
          key={`cluster-${count}`}
          ref={ref => setViewShotRef(`cluster-${count}`, ref)}
          options={{ format: 'png', quality: 1, result: 'data-uri' }}
          style={styles.clusterShot}
        >
          <View style={styles.clusterCircle}>
            <Text style={styles.clusterText}>{count}</Text>
          </View>
        </ViewShot>
      ))}
    </View>
  );
}

/**
 * Hook to manage marker images generation
 */
export function useMarkerImages() {
  const [markerImages, setMarkerImages] = useState<MarkerImagesMap | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const handleImagesGenerated = useCallback((images: MarkerImagesMap) => {
    setMarkerImages(images);
    setIsGenerating(false);
  }, []);

  return {
    markerImages,
    isGenerating,
    MarkerGenerator: isGenerating ? (
      <MarkerImageGenerator onImagesGenerated={handleImagesGenerated} />
    ) : null,
  };
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    opacity: 0,
  },
  // EXACT original marker styles (from git commit 681b2e6)
  markerContainer: {
    alignItems: 'center',
  },
  originalPinBody: {
    width: 25,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  originalPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  // Secondary droplet (smaller)
  secondaryPinBody: {
    width: 18,
    height: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  secondaryPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  // Optional droplet (tiny)
  optionalPinBody: {
    width: 14,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  optionalPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  // Cluster styles
  clusterShot: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
  },
  clusterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
