import React, { forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { usePOIStore } from '../../store/poiStore';
import { getPOIContactInfo, isCampingCategory } from '../../utils/poiTagParser';
import { POIPhotoGallery } from './POIPhotoGallery';
import { POIQuickInfo } from './POIQuickInfo';
import { POIFacilities } from './POIFacilities';
import { POISurroundings } from './POISurroundings';
import { POITerrain } from './POITerrain';
import { POIDetailInfo } from './POIDetailInfo';
import { POIDetailActions } from './POIDetailActions';
import { POIDetailNotes } from './POIDetailNotes';
import { POIMiniMap } from './POIMiniMap';
import { POIStickyBottomBar } from './POIStickyBottomBar';
import { styles, descriptionStyles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';

export interface POIDetailSheetRef {
  present: (poi: POI) => void;
  dismiss: () => void;
}

export interface POIDetailSheetProps {
  onClose?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Bottom sheet for POI details with modern design
 */
export const POIDetailSheet = forwardRef<POIDetailSheetRef, POIDetailSheetProps>(
  ({ onClose }, ref) => {
    const [poi, setPOI] = React.useState<POI | null>(null);
    const [visible, setVisible] = React.useState(false);
    const { isFavorite } = usePOIStore();

    useImperativeHandle(ref, () => ({
      present: (newPOI: POI) => {
        setPOI(newPOI);
        setVisible(true);
      },
      dismiss: () => {
        setVisible(false);
        setPOI(null);
        onClose?.();
      },
    }));

    const handleClose = useCallback(() => {
      setVisible(false);
      setPOI(null);
      onClose?.();
    }, [onClose]);

    // Memoize extracted POI data to avoid recalculation on every render
    const contactInfo = useMemo(() => poi ? getPOIContactInfo(poi) : null, [poi]);

    // Check if we should show sticky bottom bar (for camping POIs with price info)
    const showStickyBar = useMemo(() => {
      if (!poi) return false;
      return isCampingCategory(poi.category);
    }, [poi]);

    if (!poi || !contactInfo) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop - absolute positioned behind sheet, handles close on tap */}
          <Pressable style={styles.backdrop} onPress={handleClose} />

          {/* Sheet - no touch interception, ScrollView works naturally */}
          <Surface style={styles.sheet} elevation={5}>
            <View style={styles.sheetContent}>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={[
                  styles.scrollContent,
                  showStickyBar && { paddingBottom: 120 }, // Extra padding for sticky bar
                ]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {/* Hero Photo Gallery with Header */}
                <POIPhotoGallery poi={poi} onClose={handleClose} />

                {/* Quick Info Bar (capacity, status, rating) */}
                <POIQuickInfo poi={poi} />

                {/* Facilities Section */}
                <POIFacilities poi={poi} />

                {/* Surroundings (for camping POIs) */}
                <POISurroundings poi={poi} />

                {/* Terrain Info (for camping POIs) */}
                <POITerrain poi={poi} />

                {/* Contact & Location Info */}
                <POIDetailInfo
                  poi={poi}
                  distanceFromUser={poi.distanceFromUser}
                  contactInfo={contactInfo}
                />

                {/* Mini Map Preview */}
                <POIMiniMap poi={poi} />

                {/* Action Buttons */}
                <POIDetailActions poi={poi} contactInfo={contactInfo} />

                {/* Notes for Favorited POIs */}
                {isFavorite(poi.id) && <POIDetailNotes poiId={poi.id} />}

                {/* Description */}
                {contactInfo.description && (
                  <View style={descriptionStyles.container}>
                    <View style={descriptionStyles.header}>
                      <MaterialCommunityIcons
                        name="text"
                        size={18}
                        color={colors.primary[500]}
                        style={descriptionStyles.headerIcon}
                      />
                      <Text style={descriptionStyles.headerText}>Description</Text>
                    </View>
                    <Text style={descriptionStyles.text}>
                      {contactInfo.description}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Sticky Bottom Bar (for camping POIs with price) */}
              {showStickyBar && <POIStickyBottomBar poi={poi} />}
            </View>
          </Surface>
        </View>
      </Modal>
    );
  }
);
