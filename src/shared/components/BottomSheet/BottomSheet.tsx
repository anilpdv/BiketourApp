import React from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../design/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: 'auto' | number;
  showHandle?: boolean;
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height = 'auto',
  showHandle = true,
  style,
}: BottomSheetProps) {
  const sheetStyle = [
    styles.sheet,
    height !== 'auto' && { height, maxHeight: SCREEN_HEIGHT * 0.9 },
    style,
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={sheetStyle} onPress={(e) => e.stopPropagation()}>
          {showHandle && <View style={styles.handle} />}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['3xl'],
    maxHeight: SCREEN_HEIGHT * 0.9,
    ...shadows['2xl'],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
