import React, { memo, useCallback } from 'react';
import { View, Linking, Platform } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { POI } from '../../types';
import { getCategoryConfig } from '../../services/overpass.service';
import { POIContactInfo } from '../../utils/poiTagParser';
import { actionsStyles as styles } from './POIDetailSheet.styles';

export interface POIDetailActionsProps {
  poi: POI;
  contactInfo: POIContactInfo;
}

/**
 * POI action buttons (call, website, navigate)
 */
export const POIDetailActions = memo(function POIDetailActions({
  poi,
  contactInfo,
}: POIDetailActionsProps) {
  const { phone, website } = contactInfo;

  const openInMaps = useCallback(() => {
    const label = poi.name || getCategoryConfig(poi.category)?.name || 'POI';
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${poi.latitude},${poi.longitude}`,
      android: `geo:0,0?q=${poi.latitude},${poi.longitude}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  }, [poi]);

  const openWebsite = useCallback((url: string) => {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    Linking.openURL(fullUrl);
  }, []);

  const callPhone = useCallback((phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const theme = useTheme();

  return (
    <View style={styles.container}>
      {phone && (
        <Button
          mode="outlined"
          icon="phone"
          onPress={() => callPhone(phone)}
          style={styles.button}
          contentStyle={styles.buttonContent}
          compact
        >
          Call
        </Button>
      )}
      {website && (
        <Button
          mode="outlined"
          icon="web"
          onPress={() => openWebsite(website)}
          style={styles.button}
          contentStyle={styles.buttonContent}
          compact
        >
          Website
        </Button>
      )}
      <Button
        mode="contained"
        icon="navigation"
        onPress={openInMaps}
        style={[styles.button, styles.navigateButton]}
        contentStyle={styles.buttonContent}
        compact
      >
        Navigate
      </Button>
    </View>
  );
});
