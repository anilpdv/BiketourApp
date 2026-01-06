import React, { memo, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MapStyleKey } from '../../../../shared/config/mapStyles.config';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 80;

// Map style preview configurations with gradient colors
const STYLE_PREVIEWS: Record<MapStyleKey, {
  label: string;
  colors: [string, string, string];
  icon: string;
}> = {
  outdoors: {
    label: 'Outdoors',
    colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
    icon: 'pine-tree',
  },
  streets: {
    label: 'Streets',
    colors: ['#607D8B', '#90A4AE', '#CFD8DC'],
    icon: 'city',
  },
  cyclosm: {
    label: 'Cycling',
    colors: ['#0066FF', '#2196F3', '#64B5F6'],
    icon: 'bicycle',
  },
  satellite: {
    label: 'Satellite',
    colors: ['#1B5E20', '#2E7D32', '#388E3C'],
    icon: 'satellite-variant',
  },
  topo: {
    label: 'Topo',
    colors: ['#795548', '#A1887F', '#D7CCC8'],
    icon: 'terrain',
  },
  terrain: {
    label: 'Terrain',
    colors: ['#5D4037', '#8D6E63', '#BCAAA4'],
    icon: 'image-filter-hdr',
  },
  natgeo: {
    label: 'NatGeo',
    colors: ['#FF9800', '#FFC107', '#FFEB3B'],
    icon: 'earth',
  },
  light: {
    label: 'Light',
    colors: ['#ECEFF1', '#F5F5F5', '#FAFAFA'],
    icon: 'white-balance-sunny',
  },
  dark: {
    label: 'Dark',
    colors: ['#212121', '#424242', '#616161'],
    icon: 'moon-waning-crescent',
  },
};

interface MapStyleSelectorProps {
  visible: boolean;
  currentStyle: MapStyleKey;
  onSelectStyle: (style: MapStyleKey) => void;
  onClose: () => void;
}

/**
 * Horizontal scrollable map style selector with image previews
 */
export const MapStyleSelector = memo(function MapStyleSelector({
  visible,
  currentStyle,
  onSelectStyle,
  onClose,
}: MapStyleSelectorProps) {
  const scrollRef = useRef<ScrollView>(null);
  const styles_keys = Object.keys(STYLE_PREVIEWS) as MapStyleKey[];

  const handleSelect = (style: MapStyleKey) => {
    onSelectStyle(style);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Map Style</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.neutral[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll */}
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={ITEM_WIDTH + spacing.md}
            decelerationRate="fast"
          >
            {styles_keys.map((styleKey) => {
              const preview = STYLE_PREVIEWS[styleKey];
              const isSelected = styleKey === currentStyle;

              return (
                <TouchableOpacity
                  key={styleKey}
                  style={[styles.itemContainer, isSelected && styles.itemSelected]}
                  onPress={() => handleSelect(styleKey)}
                  activeOpacity={0.8}
                >
                  {/* Preview Image (Gradient Placeholder) */}
                  <View style={styles.previewContainer}>
                    <LinearGradient
                      colors={preview.colors}
                      style={styles.preview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialCommunityIcons
                        name={preview.icon as any}
                        size={28}
                        color={styleKey === 'light' ? colors.neutral[600] : colors.neutral[0]}
                        style={styles.previewIcon}
                      />
                    </LinearGradient>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={22}
                          color={colors.primary[500]}
                        />
                      </View>
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    style={[styles.label, isSelected && styles.labelSelected]}
                    numberOfLines={1}
                  >
                    {preview.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Hint */}
          <Text style={styles.hint}>Swipe to see more styles</Text>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl + 20, // Extra padding for safe area
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  handle: {
    position: 'absolute',
    top: spacing.sm,
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemSelected: {
    // Selected styling handled by checkmark and label
  },
  previewContainer: {
    position: 'relative',
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIcon: {
    opacity: 0.9,
  },
  checkmark: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.neutral[0],
    borderRadius: 11,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.bold,
  },
  hint: {
    textAlign: 'center',
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[400],
    paddingBottom: spacing.md,
  },
});

export default MapStyleSelector;
