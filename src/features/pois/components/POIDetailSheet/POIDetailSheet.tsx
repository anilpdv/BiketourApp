import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { usePOIStore } from '../../store/poiStore';
import { getPOIContactInfo } from '../../utils/poiTagParser';
import { POIPhotoGallery } from './POIPhotoGallery';
import { POIDetailInfo } from './POIDetailInfo';
import { POIDetailActions } from './POIDetailActions';
import { POIDetailNotes } from './POIDetailNotes';
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

    if (!poi) return null;

    const contactInfo = getPOIContactInfo(poi);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Surface style={styles.sheet} elevation={5}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <ScrollView
                style={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Photo Gallery with Header */}
                <POIPhotoGallery poi={poi} onClose={handleClose} />

                {/* Info Sections */}
                <POIDetailInfo
                  poi={poi}
                  distanceFromUser={poi.distanceFromUser}
                  contactInfo={contactInfo}
                />

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
            </Pressable>
          </Surface>
        </Pressable>
      </Modal>
    );
  }
);
