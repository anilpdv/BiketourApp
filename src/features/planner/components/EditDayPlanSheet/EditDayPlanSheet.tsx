import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  useTheme,
  IconButton,
  Switch,
} from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DayPlan } from '../../types';
import { colors, spacing, borderRadius } from '../../../../shared/design/tokens';
import { isRestDay } from '../../utils/dayPlanUtils';

interface EditDayPlanSheetProps {
  visible: boolean;
  dayPlan: DayPlan | null;
  dayNumber: number;
  tripId: string;
  onDismiss: () => void;
  onSave: (dayPlanId: string, updates: Partial<DayPlan>) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (dayPlanId: string) => Promise<{ success: boolean; error?: string }>;
  onAddRestDay?: (afterDayPlanId: string) => Promise<{ success: boolean; error?: string }>;
  existingDates: string[];
  canDelete?: boolean;
}

export function EditDayPlanSheet({
  visible,
  dayPlan,
  dayNumber,
  tripId,
  onDismiss,
  onSave,
  onDelete,
  onAddRestDay,
  existingDates,
  canDelete = true,
}: EditDayPlanSheetProps) {
  const theme = useTheme();

  const [date, setDate] = useState('');
  const [targetKm, setTargetKm] = useState('');
  const [notes, setNotes] = useState('');
  const [isRest, setIsRest] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && dayPlan) {
      setDate(dayPlan.date);
      setTargetKm(dayPlan.targetKm.toString());
      setNotes(dayPlan.notes || '');
      setIsRest(isRestDay(dayPlan));
      setError('');
    }
  }, [visible, dayPlan]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, close picker after selection; on iOS spinner stays open until Done
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const otherDates = existingDates.filter((d) => d !== dayPlan?.date);
      if (otherDates.includes(dateString)) {
        setError('Another day already has this date');
        return;
      }
      setDate(dateString);
      setError('');
    }
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };

  const handleRestDayToggle = (value: boolean) => {
    setIsRest(value);
    if (value) {
      setTargetKm('0');
      if (!notes || notes === 'Rest day') setNotes('Rest day');
    } else {
      if (targetKm === '0') setTargetKm(dayPlan?.targetKm.toString() || '80');
      if (notes === 'Rest day') setNotes('');
    }
  };

  const handleSave = async () => {
    if (!dayPlan) return;
    const km = parseFloat(targetKm);
    if (isNaN(km) || km < 0) {
      setError('Please enter a valid distance');
      return;
    }
    setIsSaving(true);
    setError('');
    const updates: Partial<DayPlan> = {
      date,
      targetKm: km,
      notes,
      status: isRest ? 'skipped' : dayPlan.status === 'skipped' && !isRest ? 'planned' : dayPlan.status,
    };
    const result = await onSave(dayPlan.id, updates);
    setIsSaving(false);
    if (result.success) {
      onDismiss();
    } else {
      setError(result.error || 'Failed to save changes');
    }
  };

  const handleDelete = () => {
    if (!dayPlan || !onDelete) return;
    Alert.alert(
      'Delete Day',
      `Remove Day ${dayNumber}? This will shift subsequent days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            const result = await onDelete(dayPlan.id);
            setIsSaving(false);
            if (result.success) onDismiss();
            else setError(result.error || 'Failed to delete');
          },
        },
      ]
    );
  };

  const handleAddRestDayAfter = () => {
    if (!dayPlan || !onAddRestDay) return;
    Alert.alert(
      'Add Rest Day',
      `Add a rest day after Day ${dayNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            setIsSaving(true);
            const result = await onAddRestDay(dayPlan.id);
            setIsSaving(false);
            if (result.success) onDismiss();
            else setError(result.error || 'Failed to add rest day');
          },
        },
      ]
    );
  };

  if (!dayPlan) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>Edit Day {dayNumber}</Text>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>

          {/* Date - show button OR picker, not both */}
          {!showDatePicker ? (
            <TouchableOpacity
              style={[styles.dateRow, { borderColor: theme.colors.outline }]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.dateText}>{formatDate(date)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <Button mode="text" onPress={handleDatePickerDone} style={styles.datePickerDone}>
                  Done
                </Button>
              )}
            </View>
          )}

          {/* Rest Day Toggle */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="bed" size={20} color={isRest ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge">Rest Day</Text>
            </View>
            <Switch value={isRest} onValueChange={handleRestDayToggle} color={theme.colors.primary} />
          </View>

          {/* Distance */}
          {!isRest && (
            <TextInput
              label="Target Distance (km)"
              value={targetKm}
              onChangeText={(t) => { setTargetKm(t); setError(''); }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
            />
          )}

          {/* Notes */}
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Add Rest Day Link */}
          {onAddRestDay && (
            <TouchableOpacity style={styles.addRestLink} onPress={handleAddRestDayAfter}>
              <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontSize: 13 }}>Add rest day after</Text>
            </TouchableOpacity>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {canDelete && onDelete && (
              <Button mode="outlined" onPress={handleDelete} textColor={theme.colors.error} style={styles.deleteBtn} disabled={isSaving}>
                Delete
              </Button>
            )}
            <View style={styles.spacer} />
            <Button mode="outlined" onPress={onDismiss} disabled={isSaving}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving}>Save</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  dateText: {
    flex: 1,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  datePicker: {
    height: 150,
  },
  datePickerDone: {
    alignSelf: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  error: {
    color: '#f44336',
    fontSize: 13,
    marginBottom: 8,
  },
  addRestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  deleteBtn: {
    borderColor: '#f44336',
  },
  spacer: {
    flex: 1,
  },
});
