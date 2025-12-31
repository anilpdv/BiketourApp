import React, { memo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { infoStyles as styles } from './POIDetailSheet.styles';

interface CopyableFieldProps {
  label: string;
  value: string;
  isLast?: boolean;
}

/**
 * A compact row component with copy functionality
 */
export const CopyableField = memo(function CopyableField({
  label,
  value,
  isLast = false,
}: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(value);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [value]);

  return (
    <View style={[styles.row, !isLast && styles.rowWithBorder]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
        <IconButton
          icon={copied ? 'check' : 'content-copy'}
          size={16}
          iconColor={copied ? theme.colors.primary : theme.colors.outline}
          onPress={handleCopy}
          style={styles.copyButton}
        />
      </View>
    </View>
  );
});

// Non-copyable field for display only (like distance)
interface InfoFieldProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export const InfoField = memo(function InfoField({
  label,
  value,
  isLast = false,
}: InfoFieldProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowWithBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
});
