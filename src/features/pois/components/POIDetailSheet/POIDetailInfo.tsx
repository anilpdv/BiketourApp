import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { POIContactInfo } from '../../utils/poiTagParser';
import { CopyableField, InfoField } from './CopyableField';
import { infoStyles as styles } from './POIDetailSheet.styles';
import { colors, spacing, typography } from '../../../../shared/design/tokens';

export interface POIDetailInfoProps {
  poi: POI;
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
 * Parse OSM opening hours into readable format
 * e.g., "Mo-Fr 08:30-20:00; Sa 08:30-19:00; PH off" → array of day/time pairs
 */
function parseOpeningHours(hoursString: string): { day: string; hours: string }[] {
  if (!hoursString) return [];

  const dayMap: Record<string, string> = {
    'Mo': 'Monday',
    'Tu': 'Tuesday',
    'We': 'Wednesday',
    'Th': 'Thursday',
    'Fr': 'Friday',
    'Sa': 'Saturday',
    'Su': 'Sunday',
    'PH': 'Public Holidays',
  };

  const result: { day: string; hours: string }[] = [];
  const parts = hoursString.split(';').map(s => s.trim());

  for (const part of parts) {
    // Match patterns like "Mo-Fr 08:30-20:00" or "Sa 08:30-19:00" or "PH off"
    const match = part.match(/^([A-Za-z,-]+)\s*(.+)$/);
    if (match) {
      let [, days, time] = match;

      // Expand day ranges like "Mo-Fr" to "Mon - Fri"
      if (days.includes('-')) {
        const [start, end] = days.split('-');
        days = `${dayMap[start] || start} - ${dayMap[end] || end}`;
      } else {
        days = dayMap[days] || days;
      }

      // Format time
      if (time.toLowerCase() === 'off') {
        time = 'Closed';
      } else {
        time = time.replace('-', ' - ');
      }

      result.push({ day: days, hours: time });
    }
  }

  return result;
}

const hoursStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  day: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
  },
  hours: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[800],
  },
});

/**
 * POI Detail info grouped into sections
 * Simplified: Name, Coordinates, and Distance are now shown in the header
 */
export const POIDetailInfo = memo(function POIDetailInfo({
  poi,
  contactInfo,
}: POIDetailInfoProps) {
  // Parse opening hours for better display
  const parsedHours = useMemo(
    () => contactInfo.openingHours ? parseOpeningHours(contactInfo.openingHours) : [],
    [contactInfo.openingHours]
  );

  const hasLocationInfo = contactInfo.address || contactInfo.operator || contactInfo.siteCode;
  const hasContactInfo = contactInfo.phone || contactInfo.website;
  const hasHours = parsedHours.length > 0 || contactInfo.openingHours;

  return (
    <>
      {/* Location Section - Address and Operator only */}
      {hasLocationInfo && (
        <InfoSection icon="map-marker" title="Location">
          {contactInfo.address && (
            <CopyableField
              label="Address"
              value={contactInfo.address}
              isLast={!contactInfo.operator && !contactInfo.siteCode}
            />
          )}
          {contactInfo.operator && (
            <InfoField
              label="Operator"
              value={contactInfo.operator}
              isLast={!contactInfo.siteCode}
            />
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

      {/* Hours Section - Formatted display */}
      {hasHours && (
        <InfoSection icon="clock-outline" title="Hours">
          {parsedHours.length > 0 ? (
            parsedHours.map((item, index) => (
              <View key={index} style={hoursStyles.row}>
                <Text style={hoursStyles.day}>{item.day}</Text>
                <Text style={hoursStyles.hours}>{item.hours}</Text>
              </View>
            ))
          ) : (
            <CopyableField label="Hours" value={contactInfo.openingHours!} isLast />
          )}
        </InfoSection>
      )}
    </>
  );
});
