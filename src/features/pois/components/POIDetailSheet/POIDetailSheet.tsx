import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Modal, Pressable, ScrollView } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { POI } from '../../types';
import { usePOIStore } from '../../store/poiStore';
import { getPOIContactInfo } from '../../utils/poiTagParser';
import { POIDetailHeader } from './POIDetailHeader';
import { POIDetailInfo } from './POIDetailInfo';
import { POIDetailActions } from './POIDetailActions';
import { POIDetailNotes } from './POIDetailNotes';
import { styles, descriptionStyles } from './POIDetailSheet.styles';

export interface POIDetailSheetRef {
  present: (poi: POI) => void;
  dismiss: () => void;
}

export interface POIDetailSheetProps {
  onClose?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Bottom sheet for POI details
 */
export const POIDetailSheet = forwardRef<POIDetailSheetRef, POIDetailSheetProps>(
  ({ onClose }, ref) => {
    const [poi, setPOI] = React.useState<POI | null>(null);
    const [visible, setVisible] = React.useState(false);
    const { isFavorite } = usePOIStore();
    const theme = useTheme();

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
          <Surface
            style={styles.sheet}
            elevation={5}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <POIDetailHeader poi={poi} onClose={handleClose} />

                {/* Info rows */}
                <POIDetailInfo
                  distanceFromUser={poi.distanceFromUser}
                  contactInfo={contactInfo}
                />

                {/* Action buttons */}
                <POIDetailActions poi={poi} contactInfo={contactInfo} />

                {/* Notes for favorited POIs */}
                {isFavorite(poi.id) && <POIDetailNotes poiId={poi.id} />}

                {/* Description */}
                {contactInfo.description && (
                  <Surface style={descriptionStyles.container} elevation={0}>
                    <Text variant="bodyMedium" style={descriptionStyles.text}>
                      {contactInfo.description}
                    </Text>
                  </Surface>
                )}
              </ScrollView>
            </Pressable>
          </Surface>
        </Pressable>
      </Modal>
    );
  }
);
