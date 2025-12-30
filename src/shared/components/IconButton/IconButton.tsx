import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import { IconButton as PaperIconButton, useTheme } from 'react-native-paper';
import { colors, sizes } from '../../design/tokens';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: string | ((props: { size: number; color: string }) => React.ReactNode);
  onPress: () => void;
  isActive?: boolean;
  activeColor?: string;
  activeBackgroundColor?: string;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

// Map size to Paper's size
const sizeMap: Record<IconButtonSize, number> = {
  sm: sizes.iconButton.sm,
  md: sizes.iconButton.md,
  lg: sizes.iconButton.lg,
};

// Icon font sizes for emoji rendering
const iconSizeMap: Record<IconButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

// Check if a string contains emoji characters
const isEmojiString = (str: string): boolean => {
  // Regex to detect common emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;
  return emojiRegex.test(str);
};

export function IconButton({
  icon,
  onPress,
  isActive = false,
  activeColor = colors.primary[500],
  activeBackgroundColor,
  size = 'md',
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const sizeValue = sizeMap[size];
  const iconFontSize = iconSizeMap[size];
  const defaultActiveBackground = activeBackgroundColor || `${activeColor}15`;

  // Determine how to render the icon
  const isStringIcon = typeof icon === 'string';
  const isEmoji = isStringIcon && isEmojiString(icon);

  // Render icon: emoji as Text, icon name passed directly to Paper (for MaterialCommunityIcons)
  const renderIcon = () => {
    if (!isStringIcon) {
      return icon; // It's a function, pass through
    }
    if (isEmoji) {
      return () => <Text style={{ fontSize: iconFontSize }}>{icon}</Text>;
    }
    return icon; // It's an icon name string, Paper will handle it
  };

  return (
    <PaperIconButton
      icon={renderIcon()}
      size={iconFontSize}
      onPress={onPress}
      disabled={disabled}
      mode={isActive ? 'contained' : 'outlined'}
      containerColor={
        isActive ? defaultActiveBackground : colors.neutral[0]
      }
      iconColor={isActive ? activeColor : colors.neutral[600]}
      style={[
        styles.base,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          borderColor: isActive ? activeColor : colors.neutral[200],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    margin: 0,
  },
});

export default IconButton;
