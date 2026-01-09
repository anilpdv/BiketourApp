import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, shadows } from '../../../../shared/design/tokens';

interface DetailsCardProps {
  isCustomCategory: boolean;
  description: string;
  onDescriptionChange: (text: string) => void;
  date: string;
  showDatePicker: boolean;
  onDatePress: () => void;
  onDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onDatePickerDismiss: () => void;
  country: string;
  onCountryChange: (text: string) => void;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DetailsCard({
  isCustomCategory,
  description,
  onDescriptionChange,
  date,
  showDatePicker,
  onDatePress,
  onDateChange,
  onDatePickerDismiss,
  country,
  onCountryChange,
}: DetailsCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Details</Text>

      <View style={styles.card}>
        {isCustomCategory ? (
          <View style={styles.customCategoryRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="tag"
                size={20}
                color={colors.primary[500]}
              />
            </View>
            <RNTextInput
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="Category name (e.g., Souvenirs, Tips)"
              placeholderTextColor={colors.neutral[400]}
              style={styles.inputText}
            />
          </View>
        ) : (
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={colors.neutral[400]}
              />
            </View>
            <RNTextInput
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="What was it for? (optional)"
              placeholderTextColor={colors.neutral[400]}
              style={styles.inputText}
            />
          </View>
        )}

        <View style={styles.divider} />

        <Pressable onPress={onDatePress} style={styles.inputRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={colors.primary[500]}
            />
          </View>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.neutral[300]}
          />
        </Pressable>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.dateDoneBtn} onPress={onDatePickerDismiss}>
                <Text style={styles.dateDoneText}>Done</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.inputRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={20}
              color={colors.neutral[400]}
            />
          </View>
          <RNTextInput
            value={country}
            onChangeText={onCountryChange}
            placeholder="Country (optional)"
            placeholderTextColor={colors.neutral[400]}
            style={styles.inputText}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
    ...shadows.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  customCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[800],
    paddingVertical: 0,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[800],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: 48,
  },
  datePickerContainer: {
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingVertical: spacing.md,
  },
  dateDoneBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing['2xl'],
  },
  dateDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
});
