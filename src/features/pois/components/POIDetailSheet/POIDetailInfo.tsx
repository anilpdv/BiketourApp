import React, { memo } from 'react';
import { View, Text } from 'react-native';
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
  const distance = formatDistance(distanceFromUser);

  return (
    <>
      {/* Distance */}
      {distance && (
        <View style={styles.row}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>{distance}</Text>
        </View>
      )}

      {/* Address */}
      {contactInfo.address && (
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{contactInfo.address}</Text>
        </View>
      )}

      {/* Opening Hours */}
      {contactInfo.openingHours && (
        <View style={styles.row}>
          <Text style={styles.label}>Hours</Text>
          <Text style={styles.value}>{contactInfo.openingHours}</Text>
        </View>
      )}
    </>
  );
});
