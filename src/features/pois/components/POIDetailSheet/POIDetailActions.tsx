import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
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

  return (
    <View style={styles.container}>
      {phone && (
        <TouchableOpacity style={styles.button} onPress={() => callPhone(phone)}>
          <Text style={styles.buttonIcon}>📞</Text>
          <Text style={styles.buttonText}>Call</Text>
        </TouchableOpacity>
      )}
      {website && (
        <TouchableOpacity style={styles.button} onPress={() => openWebsite(website)}>
          <Text style={styles.buttonIcon}>🌐</Text>
          <Text style={styles.buttonText}>Website</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.button, styles.navigateButton]}
        onPress={openInMaps}
      >
        <Text style={styles.buttonIcon}>🧭</Text>
        <Text style={[styles.buttonText, styles.navigateButtonText]}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
});
