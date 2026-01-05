import React, { memo, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { POIContactInfo, formatDistance } from '../../utils/poiTagParser';
import { formatCoordinates } from '../../utils/coordinateFormatter';
import { CopyableField, InfoField } from './CopyableField';
import { infoStyles as styles } from './POIDetailSheet.styles';
import { colors, spacing, borderRadius, typography } from '../../../../shared/design/tokens';

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
          name={icon as any}
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
 * Coordinate display with decimal/DMS toggle
 */
const CoordinateField = memo(function CoordinateField({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const [showDMS, setShowDMS] = useState(false);
  const coords = useMemo(() => formatCoordinates(lat, lon), [lat, lon]);

  return (
    <View style={[styles.row, styles.rowWithBorder]}>
      <Text style={styles.label}>Coordinates</Text>
      <Pressable
        style={coordStyles.container}
        onPress={() => setShowDMS(!showDMS)}
      >
        <View style={coordStyles.valueContainer}>
          <Text style={coordStyles.value} numberOfLines={2}>
            {showDMS ? coords.dms : coords.decimal}
          </Text>
          <View style={coordStyles.toggle}>
            <Text style={coordStyles.toggleText}>
              {showDMS ? 'DMS' : 'Decimal'}
            </Text>
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={14}
              color={colors.primary[500]}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
});

const coordStyles = StyleSheet.create({
  container: {
    flex: 2,
    alignItems: 'flex-end',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    textAlign: 'right',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  toggleText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary[500],
    fontWeight: typography.fontWeights.medium,
  },
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

  const hasLocationInfo = poi.name || distance || contactInfo.address;
  const hasContactInfo = contactInfo.phone || contactInfo.website;
  const hasHours = !!contactInfo.openingHours;
  const hasOperator = !!contactInfo.operator || !!contactInfo.siteCode;

  return (
    <>
      {/* Location Section */}
      {hasLocationInfo && (
        <InfoSection icon="map-marker" title="Location">
          {poi.name && (
            <CopyableField label="Name" value={poi.name} />
          )}
          <CoordinateField lat={poi.latitude} lon={poi.longitude} />
          {distance && (
            <InfoField label="Distance" value={distance} />
          )}
          {contactInfo.address && (
            <CopyableField label="Address" value={contactInfo.address} isLast={!hasOperator} />
          )}
          {contactInfo.operator && (
            <InfoField label="Operator" value={contactInfo.operator} />
          )}
          {contactInfo.siteCode && (
            <CopyableField label="Site Code" value={contactInfo.siteCode} isLast />
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
