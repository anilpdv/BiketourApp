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
import { Text, IconButton, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { usePOIPhotos } from '../../hooks/usePOIPhotos';
import { getCategoryConfig } from '../../services/overpass.service';
import { getCategoryIcon } from '../../config/poiIcons';
import { FavoriteButton } from '../FavoriteButton';
import { heroStyles, thumbnailStyles, headerStyles, loadingStyles } from './POIDetailSheet.styles';
import { colors, spacing } from '../../../../shared/design/tokens';
import { POIPhoto } from '../../types/googlePlaces.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
 * Hero photo gallery with thumbnails for POI detail sheet
 */
export const POIPhotoGallery = memo(function POIPhotoGallery({
  poi,
  onClose,
}: POIPhotoGalleryProps) {
  const { photos, isLoading, isConfigured } = usePOIPhotos(poi);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
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

  // With photos - hero + thumbnails
  return (
    <View>
      {/* Fullscreen viewer */}
      <FullscreenViewer
        photos={photos}
        initialIndex={activeIndex}
        visible={fullscreenVisible}
        onClose={() => setFullscreenVisible(false)}
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

          {/* Photo counter badge */}
          {photos.length > 1 && (
            <View style={heroStyles.photoCount}>
              <Text style={heroStyles.photoCountText}>
                {activeIndex + 1}/{photos.length}
              </Text>
            </View>
          )}

          {/* Tap to expand hint */}
          <View style={localStyles.expandHint}>
            <MaterialCommunityIcons name="fullscreen" size={20} color={colors.neutral[0]} />
          </View>
        </View>
      </Pressable>

      {/* Thumbnail strip */}
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
