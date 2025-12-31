import React, { memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POIAmenities as POIAmenitiesType, hasAmenities } from '../../utils/poiTagParser';
import { amenitiesStyles as styles } from './POIDetailSheet.styles';
import { colors } from '../../../../shared/design/tokens';

interface POIAmenitiesProps {
  amenities: POIAmenitiesType;
}

interface AmenityChipProps {
  icon: string;
  label: string;
  status: 'yes' | 'no' | 'limited';
}

const AmenityChip = memo(function AmenityChip({ icon, label, status }: AmenityChipProps) {
  const chipStyle = [
    styles.chip,
    status === 'yes' ? styles.chipYes : status === 'limited' ? styles.chipLimited : styles.chipNo,
  ];
  const textStyle = [
    styles.chipText,
    status === 'yes' ? styles.chipTextYes : status === 'limited' ? styles.chipTextLimited : styles.chipTextNo,
  ];
  const iconColor =
    status === 'yes'
      ? colors.secondary[600]
      : status === 'limited'
      ? colors.status.warning
      : colors.neutral[400];

  return (
    <View style={chipStyle}>
      <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      <Text style={textStyle}>{label}</Text>
    </View>
  );
});

/**
 * Displays POI amenities as color-coded chips
 */
export const POIAmenities = memo(function POIAmenities({ amenities }: POIAmenitiesProps) {
  if (!hasAmenities(amenities)) {
    return null;
  }

  const chips: AmenityChipProps[] = [];

  // Wheelchair access
  if (amenities.wheelchair) {
    const status = amenities.wheelchair === 'yes' ? 'yes' :
                   amenities.wheelchair === 'limited' ? 'limited' : 'no';
    chips.push({
      icon: 'wheelchair-accessibility',
      label: status === 'yes' ? 'Accessible' : status === 'limited' ? 'Limited Access' : 'Not Accessible',
      status,
    });
  }

  // WiFi / Internet
  if (amenities.internet) {
    const status = amenities.internet === 'yes' || amenities.internet === 'wlan' ? 'yes' :
                   amenities.internet === 'no' ? 'no' : 'limited';
    chips.push({
      icon: 'wifi',
      label: status === 'yes' ? 'WiFi' : status === 'limited' ? 'Limited WiFi' : 'No WiFi',
      status,
    });
  }

  // Shower
  if (amenities.shower) {
    chips.push({
      icon: 'shower',
      label: 'Showers',
      status: 'yes',
    });
  }

  // Electricity
  if (amenities.electricity) {
    chips.push({
      icon: 'flash',
      label: 'Power',
      status: 'yes',
    });
  }

  // Drinking water
  if (amenities.drinkingWater) {
    chips.push({
      icon: 'water',
      label: 'Water',
      status: 'yes',
    });
  }

  // Capacity
  if (amenities.capacity) {
    chips.push({
      icon: 'account-group',
      label: `${amenities.capacity} spots`,
      status: 'yes',
    });
  }

  // Pets
  if (amenities.pets) {
    const status = amenities.pets === 'yes' ? 'yes' :
                   amenities.pets === 'no' ? 'no' : 'limited';
    chips.push({
      icon: 'paw',
      label: status === 'yes' ? 'Pets OK' : status === 'no' ? 'No Pets' : 'Pets Limited',
      status,
    });
  }

  // Reservation
  if (amenities.reservation) {
    const status = amenities.reservation === 'required' ? 'limited' :
                   amenities.reservation === 'yes' ? 'yes' : 'yes';
    chips.push({
      icon: 'calendar-check',
      label: amenities.reservation === 'required' ? 'Reservation Required' : 'Reservations',
      status,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="star-circle"
          size={20}
          color={colors.primary[500]}
          style={styles.headerIcon}
        />
        <Text style={styles.headerText}>Amenities</Text>
      </View>
      <View style={styles.chipsContainer}>
        {chips.map((chip, index) => (
          <AmenityChip key={index} {...chip} />
        ))}
      </View>
    </View>
  );
});
