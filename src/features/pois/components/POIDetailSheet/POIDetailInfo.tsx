import React, { memo } from 'react';
import { View } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import { POIContactInfo, formatDistance } from '../../utils/poiTagParser';
import { infoStyles as styles } from './POIDetailSheet.styles';

export interface POIDetailInfoProps {
  distanceFromUser?: number;
  contactInfo: POIContactInfo;
}

/**
 * POI Detail info rows (distance, address, hours)
 */
export const POIDetailInfo = memo(function POIDetailInfo({
  distanceFromUser,
  contactInfo,
}: POIDetailInfoProps) {
  const theme = useTheme();
  const distance = formatDistance(distanceFromUser);

  return (
    <>
      {/* Distance */}
      {distance && (
        <>
          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Distance</Text>
            <Text variant="bodyMedium" style={styles.value}>{distance}</Text>
          </View>
          <Divider />
        </>
      )}

      {/* Address */}
      {contactInfo.address && (
        <>
          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Address</Text>
            <Text variant="bodyMedium" style={styles.value}>{contactInfo.address}</Text>
          </View>
          <Divider />
        </>
      )}

      {/* Opening Hours */}
      {contactInfo.openingHours && (
        <>
          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Hours</Text>
            <Text variant="bodyMedium" style={styles.value}>{contactInfo.openingHours}</Text>
          </View>
          <Divider />
        </>
      )}
    </>
  );
});
