import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  useTheme,
  IconButton,
} from 'react-native-paper';

interface BudgetSetupModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (budget: number, currency: string) => void;
  initialBudget?: number;
  initialCurrency?: string;
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
];

export function BudgetSetupModal({
  visible,
  onDismiss,
  onSave,
  initialBudget,
  initialCurrency = 'EUR',
}: BudgetSetupModalProps) {
  const theme = useTheme();
  const [budgetText, setBudgetText] = useState('');
  const [currency, setCurrency] = useState(initialCurrency);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setBudgetText(initialBudget ? initialBudget.toString() : '');
      setCurrency(initialCurrency);
      setError('');
    }
  }, [visible, initialBudget, initialCurrency]);

  const handleSave = () => {
    const budget = parseFloat(budgetText);
    if (isNaN(budget) || budget <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    onSave(budget, currency);
    onDismiss();
  };

  const handleClear = () => {
    onSave(0, currency);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              Set Trip Budget
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            Set a total budget for your trip to track spending and receive warnings when approaching the limit.
          </Text>

          <TextInput
            label="Budget Amount"
            value={budgetText}
            onChangeText={(text) => {
              setBudgetText(text);
              setError('');
            }}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Icon icon="currency-eur" />}
            error={!!error}
            style={styles.input}
          />
          {error && (
            <Text variant="bodySmall" style={styles.errorText}>
              {error}
            </Text>
          )}

          <Text variant="labelMedium" style={styles.currencyLabel}>
            Currency
          </Text>
          <SegmentedButtons
            value={currency}
            onValueChange={setCurrency}
            buttons={CURRENCIES}
            style={styles.segmentedButtons}
          />

          <View style={styles.actions}>
            {initialBudget && initialBudget > 0 && (
              <Button
                mode="outlined"
                onPress={handleClear}
                textColor={theme.colors.error}
                style={styles.clearButton}
              >
                Clear Budget
              </Button>
            )}
            <View style={styles.spacer} />
            <Button mode="outlined" onPress={onDismiss}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave}>
              Save
            </Button>
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
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    color: '#666',
    marginBottom: 20,
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 12,
  },
  currencyLabel: {
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  clearButton: {
    borderColor: '#f44336',
  },
  spacer: {
    flex: 1,
  },
});
