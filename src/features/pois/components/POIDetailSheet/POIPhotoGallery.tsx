import React, { memo, useState, useRef } from 'react';
import {
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  FlatList,
  StatusBar,
  ViewToken,
} from 'react-native';
import { Text, IconButton, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { usePOIPhotos } from '../../hooks/usePOIPhotos';
import { getCategoryConfig } from '../../services/overpass.service';
import { getCategoryIcon } from '../../config/poiIcons';
import { FavoriteButton } from '../FavoriteButton';
import { heroStyles, thumbnailStyles, headerStyles, loadingStyles } from './POIDetailSheet.styles';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';
import { POIPhoto } from '../../types/googlePlaces.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_SPACING = 2;

interface POIPhotoGalleryProps {
  poi: POI;
  onClose: () => void;
}

interface FullscreenViewerProps {
  photos: POIPhoto[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * Fullscreen photo viewer with swipe navigation
 */
const FullscreenViewer = memo(function FullscreenViewer({
  photos,
  initialIndex,
  visible,
  onClose,
}: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={fullscreenStyles.container}>
        {/* Close button */}
        <View style={fullscreenStyles.header}>
          <IconButton
            icon="close"
            iconColor={colors.neutral[0]}
            size={28}
            onPress={onClose}
            style={fullscreenStyles.closeButton}
          />
          <View style={fullscreenStyles.counter}>
            <Text style={fullscreenStyles.counterText}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>

        {/* Photo carousel */}
        <FlatList
          ref={flatListRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Pressable style={fullscreenStyles.imageContainer} onPress={onClose}>
              <Image
                source={{ uri: item.uri }}
                style={fullscreenStyles.image}
                resizeMode="contain"
              />
            </Pressable>
          )}
        />

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <Pressable style={fullscreenStyles.leftArrow} onPress={goToPrevious}>
            <MaterialCommunityIcons name="chevron-left" size={48} color={colors.neutral[0]} />
          </Pressable>
        )}
        {currentIndex < photos.length - 1 && (
          <Pressable style={fullscreenStyles.rightArrow} onPress={goToNext}>
            <MaterialCommunityIcons name="chevron-right" size={48} color={colors.neutral[0]} />
          </Pressable>
        )}
      </View>
    </Modal>
  );
});

/**
 * Pagination dots component
 */
const PaginationDots = memo(function PaginationDots({
  total,
  activeIndex,
  onDotPress,
}: {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
}) {
  if (total <= 1) return null;

  // Limit visible dots to 5, with ellipsis for more
  const maxDots = 5;
  const showEllipsis = total > maxDots;

  let dots: (number | 'ellipsis')[] = [];
  if (!showEllipsis) {
    dots = Array.from({ length: total }, (_, i) => i);
  } else {
    // Show: first, ..., current-1, current, current+1, ..., last
    if (activeIndex < 2) {
      dots = [0, 1, 2, 'ellipsis', total - 1];
    } else if (activeIndex >= total - 2) {
      dots = [0, 'ellipsis', total - 3, total - 2, total - 1];
    } else {
      dots = [0, 'ellipsis', activeIndex, 'ellipsis', total - 1];
    }
  }

  return (
    <View style={paginationStyles.container}>
      {dots.map((dot, i) => (
        dot === 'ellipsis' ? (
          <View key={`ellipsis-${i}`} style={paginationStyles.ellipsis}>
            <Text style={paginationStyles.ellipsisText}>...</Text>
          </View>
        ) : (
          <Pressable
            key={dot}
            onPress={() => onDotPress?.(dot)}
            style={[
              paginationStyles.dot,
              dot === activeIndex && paginationStyles.dotActive,
            ]}
          />
        )
      ))}
    </View>
  );
});

/**
 * Grid view modal for all photos
 */
const GridViewModal = memo(function GridViewModal({
  photos,
  visible,
  onClose,
  onPhotoPress,
}: {
  photos: POIPhoto[];
  visible: boolean;
  onClose: () => void;
  onPhotoPress: (index: number) => void;
}) {
  const imageSize = (SCREEN_WIDTH - spacing.lg * 2 - GRID_SPACING * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={gridStyles.backdrop}>
        <Surface style={gridStyles.container} elevation={5}>
          <View style={gridStyles.header}>
            <Text style={gridStyles.title}>All Photos ({photos.length})</Text>
            <Pressable onPress={onClose} style={gridStyles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.neutral[600]}
              />
            </Pressable>
          </View>
          <ScrollView
            style={gridStyles.scrollView}
            contentContainerStyle={gridStyles.grid}
            showsVerticalScrollIndicator={false}
          >
            {photos.map((photo, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  onClose();
                  onPhotoPress(index);
                }}
                style={[
                  gridStyles.gridItem,
                  { width: imageSize, height: imageSize },
                ]}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={gridStyles.gridImage}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
});

/**
 * Hero photo gallery with thumbnails for POI detail sheet
 */
export const POIPhotoGallery = memo(function POIPhotoGallery({
  poi,
  onClose,
}: POIPhotoGalleryProps) {
  const { photos, isLoading, isConfigured } = usePOIPhotos(poi);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const theme = useTheme();
  const config = getCategoryConfig(poi.category);
  const iconConfig = getCategoryIcon(poi.category);

  const hasPhotos = isConfigured && photos.length > 0;

  const openFullscreen = (index: number) => {
    setActiveIndex(index);
    setFullscreenVisible(true);
  };

  // Header content (used in both photo and no-photo modes)
  const renderHeader = (isOverlay: boolean) => (
    <View style={isOverlay ? headerStyles.overlayContainer : headerStyles.container}>
      <View style={[headerStyles.iconContainer, { backgroundColor: iconConfig.color }]}>
        <MaterialCommunityIcons
          name={iconConfig.vectorIcon}
          size={24}
          color={colors.neutral[0]}
        />
      </View>
      <View style={headerStyles.textContainer}>
        <Text
          variant="titleLarge"
          style={[headerStyles.name, isOverlay && headerStyles.nameOverlay]}
          numberOfLines={2}
        >
          {poi.name || config?.name || 'Unknown'}
        </Text>
        <Text
          variant="bodyMedium"
          style={[headerStyles.category, isOverlay && headerStyles.categoryOverlay]}
        >
          {config?.name}
        </Text>
      </View>
      <View style={headerStyles.actionsContainer}>
        <FavoriteButton poi={poi} size="medium" />
      </View>
    </View>
  );

  // Loading state
  if (isLoading && isConfigured) {
    return (
      <View>
        <View style={loadingStyles.container}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        {renderHeader(false)}
      </View>
    );
  }

  // No photos - show compact header with icon
  if (!hasPhotos) {
    return (
      <View>
        <View style={heroStyles.noPhotoContainer}>
          <MaterialCommunityIcons
            name={iconConfig.vectorIcon}
            size={48}
            color={colors.neutral[400]}
            style={heroStyles.noPhotoIcon}
          />
          <Text variant="bodySmall" style={{ color: colors.neutral[400] }}>
            No photos available
          </Text>
        </View>
        {renderHeader(false)}
      </View>
    );
  }

  // With photos - hero + pagination dots + thumbnails
  return (
    <View>
      {/* Fullscreen viewer */}
      <FullscreenViewer
        photos={photos}
        initialIndex={activeIndex}
        visible={fullscreenVisible}
        onClose={() => setFullscreenVisible(false)}
      />

      {/* Grid view modal */}
      <GridViewModal
        photos={photos}
        visible={gridVisible}
        onClose={() => setGridVisible(false)}
        onPhotoPress={openFullscreen}
      />

      {/* Hero Image - tappable */}
      <Pressable onPress={() => openFullscreen(activeIndex)}>
        <View style={heroStyles.container}>
          <Image
            source={{ uri: photos[activeIndex]?.uri }}
            style={heroStyles.image}
            resizeMode="cover"
          />

          {/* Dark overlay for text readability */}
          <View style={[heroStyles.headerOverlay, localStyles.gradientOverlay]}>
            {renderHeader(true)}
          </View>

          {/* Photo counter badge with tap to open grid */}
          {photos.length > 1 && (
            <Pressable
              style={heroStyles.photoCount}
              onPress={(e) => {
                e.stopPropagation();
                setGridVisible(true);
              }}
            >
              <MaterialCommunityIcons name="image-multiple" size={12} color={colors.neutral[0]} />
              <Text style={heroStyles.photoCountText}>
                {photos.length}
              </Text>
            </Pressable>
          )}

          {/* Tap to expand hint */}
          <View style={localStyles.expandHint}>
            <MaterialCommunityIcons name="fullscreen" size={20} color={colors.neutral[0]} />
          </View>

          {/* Pagination dots at bottom */}
          {photos.length > 1 && (
            <View style={localStyles.paginationContainer}>
              <PaginationDots
                total={photos.length}
                activeIndex={activeIndex}
                onDotPress={setActiveIndex}
              />
            </View>
          )}
        </View>
      </Pressable>

      {/* Thumbnail strip with View All button */}
      {photos.length > 1 && (
        <View style={thumbnailStyles.container}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={thumbnailStyles.scrollContent}
          >
            {photos.map((photo, index) => (
              <Pressable key={index} onPress={() => setActiveIndex(index)}>
                <Image
                  source={{ uri: photo.uri }}
                  style={[
                    thumbnailStyles.thumbnail,
                    activeIndex === index && thumbnailStyles.thumbnailActive,
                  ]}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
            {/* View All button at end of thumbnails */}
            {photos.length > 3 && (
              <Pressable
                style={localStyles.viewAllThumb}
                onPress={() => setGridVisible(true)}
              >
                <MaterialCommunityIcons name="view-grid" size={20} color={colors.primary[600]} />
                <Text style={localStyles.viewAllText}>All</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const localStyles = StyleSheet.create({
  gradientOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  expandHint: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: spacing.xs,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewAllThumb: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary[600],
    fontWeight: typography.fontWeights.medium,
  },
});

const paginationStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.neutral[0],
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ellipsis: {
    width: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ellipsisText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
});

const gridStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: GRID_SPACING,
  },
  gridItem: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});

const fullscreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  counterText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  leftArrow: {
    position: 'absolute',
    left: spacing.sm,
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: spacing.xs,
  },
  rightArrow: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: spacing.xs,
  },
});
