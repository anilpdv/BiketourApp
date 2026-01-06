import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  List,
  RadioButton,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';
import { MapStyleOption } from '../hooks/useMapSettings';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

export interface MapStylePickerProps {
  visible: boolean;
  currentStyle: MapStyleKey;
  styleOptions: MapStyleOption[];
  onSelectStyle: (style: MapStyleKey) => void;
  onClose: () => void;
}

/**
 * Dialog for selecting map style (outdoors, streets, satellite, etc.)
 */
export const MapStylePicker = memo(function MapStylePicker({
  visible,
  currentStyle,
  styleOptions,
  onSelectStyle,
  onClose,
}: MapStylePickerProps) {
  const theme = useTheme();

  const handleSelect = (style: MapStyleKey) => {
    onSelectStyle(style);
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Map Style</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group value={currentStyle} onValueChange={(value) => handleSelect(value as MapStyleKey)}>
            {styleOptions.map((option) => {
              const isActive = option.key === currentStyle;
              return (
                <List.Item
                  key={option.key}
                  title={option.label}
                  left={() => (
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={24}
                      color={isActive ? colors.primary[700] : colors.neutral[600]}
                      style={styles.optionIcon}
                    />
                  )}
                  right={() => (
                    <RadioButton
                      value={option.key}
                      status={isActive ? 'checked' : 'unchecked'}
                    />
                  )}
                  onPress={() => handleSelect(option.key)}
                  style={[
                    styles.option,
                    isActive && styles.optionActive,
                  ]}
                  titleStyle={isActive ? styles.optionLabelActive : undefined}
                />
              );
            })}
          </RadioButton.Group>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
});

const styles = StyleSheet.create({
  dialog: {
    borderRadius: borderRadius.xl,
  },
  title: {
    textAlign: 'center',
  },
  option: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionActive: {
    backgroundColor: colors.primary[50],
  },
  optionIcon: {
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  optionLabelActive: {
    fontWeight: '700',
    color: colors.primary[700],
  },
});
