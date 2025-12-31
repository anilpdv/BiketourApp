import React, { memo, useCallback } from 'react';
import { View, Linking, Platform, Pressable, Share } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { getCategoryConfig } from '../../services/overpass.service';
import { POIContactInfo } from '../../utils/poiTagParser';
import { actionsStyles as styles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';

export interface POIDetailActionsProps {
  poi: POI;
  contactInfo: POIContactInfo;
}

interface IconButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

const ActionIconButton = memo(function ActionIconButton({
  icon,
  label,
  onPress,
  color = colors.neutral[600],
}: IconButtonProps) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <View style={styles.iconButtonCircle}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.iconButtonLabel}>{label}</Text>
    </Pressable>
  );
});

/**
 * POI action buttons with prominent Navigate and secondary icon buttons
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

  const openGoogleMaps = useCallback(() => {
    const label = poi.name || getCategoryConfig(poi.category)?.name || 'POI';
    // Use name + coordinates for better search results with reviews/photos
    const query = encodeURIComponent(`${label} ${poi.latitude},${poi.longitude}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  }, [poi]);

  return (
    <View style={styles.container}>
      {/* Primary Navigate Button */}
      <Button
        mode="contained"
        icon="navigation-variant"
        onPress={openInMaps}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        labelStyle={styles.primaryButtonLabel}
      >
        Navigate
      </Button>

      {/* Secondary Icon Buttons */}
      <View style={styles.secondaryRow}>
        {phone && (
          <ActionIconButton
            icon="phone"
            label="Call"
            onPress={callPhone}
            color={colors.primary[500]}
          />
        )}
        {website && (
          <ActionIconButton
            icon="web"
            label="Website"
            onPress={openWebsite}
            color={colors.primary[500]}
          />
        )}
        <ActionIconButton
          icon="google-maps"
          label="Maps"
          onPress={openGoogleMaps}
          color={colors.status.error}
        />
        <ActionIconButton
          icon="share-variant"
          label="Share"
          onPress={sharePOI}
        />
      </View>
    </View>
  );
});
