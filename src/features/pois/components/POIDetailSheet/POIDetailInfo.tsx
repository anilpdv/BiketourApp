import React, { memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { POIContactInfo, formatDistance } from '../../utils/poiTagParser';
import { CopyableField, InfoField } from './CopyableField';
import { infoStyles as styles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';

export interface POIDetailInfoProps {
  poi: POI;
  distanceFromUser?: number;
  contactInfo: POIContactInfo;
}

interface InfoSectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

const InfoSection = memo(function InfoSection({ icon, title, children }: InfoSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary[500]}
          style={styles.sectionIcon}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
});

/**
 * POI Detail info grouped into sections
 */
export const POIDetailInfo = memo(function POIDetailInfo({
  poi,
  distanceFromUser,
  contactInfo,
}: POIDetailInfoProps) {
  const distance = formatDistance(distanceFromUser);
  const coordinates = `${poi.latitude.toFixed(6)}, ${poi.longitude.toFixed(6)}`;

  const hasLocationInfo = poi.name || distance || contactInfo.address;
  const hasContactInfo = contactInfo.phone || contactInfo.website;
  const hasHours = !!contactInfo.openingHours;

  return (
    <>
      {/* Location Section */}
      {hasLocationInfo && (
        <InfoSection icon="map-marker" title="Location">
          {poi.name && (
            <CopyableField label="Name" value={poi.name} />
          )}
          <CopyableField label="Coordinates" value={coordinates} />
          {distance && (
            <InfoField label="Distance" value={distance} />
          )}
          {contactInfo.address && (
            <CopyableField label="Address" value={contactInfo.address} isLast />
          )}
        </InfoSection>
      )}

      {/* Contact Section */}
      {hasContactInfo && (
        <InfoSection icon="phone" title="Contact">
          {contactInfo.phone && (
            <CopyableField
              label="Phone"
              value={contactInfo.phone}
              isLast={!contactInfo.website}
            />
          )}
          {contactInfo.website && (
            <CopyableField label="Website" value={contactInfo.website} isLast />
          )}
        </InfoSection>
      )}

      {/* Hours Section */}
      {hasHours && (
        <InfoSection icon="clock-outline" title="Hours">
          <CopyableField label="Open" value={contactInfo.openingHours!} isLast />
        </InfoSection>
      )}
    </>
  );
});
