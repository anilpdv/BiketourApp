import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_GROUP_COLORS, POIGroupKey } from '../../pois/config/poiGroupColors';
import { colors } from '../../../shared/design/tokens';

// Group icons (representative icon for each group)
const GROUP_ICONS: Record<POIGroupKey, string> = {
  camping: 'tent',
  services: 'water',
  accommodation: 'bed',
  bike: 'bicycle',
  food: 'food-fork-drink',
  emergency: 'hospital-box',
};

// Cluster counts to generate images for (exported for use in POILayer)
export const CLUSTER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 75, 99, '99+'] as const;

export type MarkerImagesMap = Record<string, { uri: string }>;

interface MarkerGeneratorProps {
  onImagesGenerated: (images: MarkerImagesMap) => void;
}

/**
 * Hidden component that generates marker images for each group
 * and cluster count images. Renders once, captures images, then unmounts
 */
export function MarkerImageGenerator({ onImagesGenerated }: MarkerGeneratorProps) {
  // Use Map instead of object to avoid Reanimated "tried to modify key" warnings
  // Maps are designed for dynamic key mutations, objects trigger warnings when serialized
  const viewShotRefs = useRef<Map<string, ViewShot | null>>(new Map());
  const [capturedCount, setCapturedCount] = useState(0);
  const imagesRef = useRef<Map<string, { uri: string }>>(new Map());
  const groups = Object.keys(CATEGORY_GROUP_COLORS) as POIGroupKey[];

  // Total images to generate: groups + cluster counts
  const totalImages = groups.length + CLUSTER_COUNTS.length;

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
      // Capture marker images
      groups.forEach(group => captureImage(`marker-${group}`));
      // Capture cluster images
      CLUSTER_COUNTS.forEach(count => captureImage(`cluster-${count}`));
    }, 100);
    return () => clearTimeout(timer);
  }, [groups, captureImage]);

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
      {/* POI Marker images */}
      {groups.map(group => (
        <ViewShot
          key={`marker-${group}`}
          ref={ref => { viewShotRefs.current.set(`marker-${group}`, ref); }}
          options={{ format: 'png', quality: 1, result: 'data-uri' }}
          style={styles.markerShot}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.pinBody, { backgroundColor: CATEGORY_GROUP_COLORS[group] }]}>
              <MaterialCommunityIcons
                name={GROUP_ICONS[group] as any}
                size={22}
                color={colors.neutral[0]}
              />
            </View>
            <View style={[styles.pinPointer, { borderTopColor: CATEGORY_GROUP_COLORS[group] }]} />
          </View>
        </ViewShot>
      ))}

      {/* Cluster count images */}
      {CLUSTER_COUNTS.map(count => (
        <ViewShot
          key={`cluster-${count}`}
          ref={ref => { viewShotRefs.current.set(`cluster-${count}`, ref); }}
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
  markerShot: {
    width: 50,
    height: 60,
    backgroundColor: 'transparent',
  },
  markerContainer: {
    alignItems: 'center',
  },
  pinBody: {
    width: 36,
    height: 40,
    borderRadius: 8,
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
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
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
    borderWidth: 3,
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
