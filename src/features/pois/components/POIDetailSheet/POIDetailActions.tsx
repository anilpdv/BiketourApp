import React, { memo, useCallback } from 'react';
import { View, Linking, Share } from 'react-native';
import { Button } from 'react-native-paper';
import { POI } from '../../types';
import { getCategoryConfig } from '../../services/overpass.service';
import { POIContactInfo } from '../../utils/poiTagParser';
import { actionsStyles as styles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';
import { LabeledIconButton } from '../../../../shared/components';

export interface POIDetailActionsProps {
  poi: POI;
  contactInfo: POIContactInfo;
}

/**
 * POI action buttons with prominent Navigate and secondary icon buttons
 */
export const POIDetailActions = memo(function POIDetailActions({
  poi,
  contactInfo,
}: POIDetailActionsProps) {
  const { phone, website } = contactInfo;

  // Navigate using Google Maps directions
  const navigateInGoogleMaps = useCallback(() => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
    Linking.openURL(url);
  }, [poi]);

  const openWebsite = useCallback(() => {
    if (!website) return;
    let fullUrl = website;
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      fullUrl = `https://${website}`;
    }
    Linking.openURL(fullUrl);
  }, [website]);

  const callPhone = useCallback(() => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }, [phone]);

  const sharePOI = useCallback(async () => {
    const label = poi.name || getCategoryConfig(poi.category)?.name || 'POI';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`;

    try {
      await Share.share({
        title: label,
        message: `${label}\n${mapsUrl}`,
      });
    } catch (error) {
      // User cancelled or share failed
    }
  }, [poi]);

  return (
    <View style={styles.container}>
      {/* Primary Navigate Button - Opens Google Maps directions */}
      <Button
        mode="contained"
        icon="navigation-variant"
        onPress={navigateInGoogleMaps}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        labelStyle={styles.primaryButtonLabel}
        accessibilityLabel="Navigate in Google Maps"
        accessibilityRole="button"
      >
        Navigate
      </Button>

      {/* Secondary Icon Buttons - only show if relevant */}
      <View style={styles.secondaryRow}>
        {phone && (
          <LabeledIconButton
            icon="phone"
            label="Call"
            onPress={callPhone}
            color={colors.primary[500]}
            accessibilityLabel={`Call ${phone}`}
          />
        )}
        {website && (
          <LabeledIconButton
            icon="web"
            label="Website"
            onPress={openWebsite}
            color={colors.primary[500]}
            accessibilityLabel="Open website"
          />
        )}
        <LabeledIconButton
          icon="share-variant"
          label="Share"
          onPress={sharePOI}
          color={colors.primary[500]}
          accessibilityLabel="Share this location"
        />
      </View>
    </View>
  );
});
