import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { CategoryPicker } from './CategoryPicker';
import { Expense, ExpenseCategory } from '../../types';

interface ExpenseFormProps {
  initialValues?: Partial<Expense>;
  tripPlanId: string;
  dayPlanId?: string;
  onSubmit: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
];

export function ExpenseForm({
  initialValues,
  tripPlanId,
  dayPlanId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialValues?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initialValues?.currency || 'EUR');
  const [category, setCategory] = useState<ExpenseCategory>(
    initialValues?.category || 'food'
  );
  const [description, setDescription] = useState(initialValues?.description || '');
  const [date, setDate] = useState(
    initialValues?.date || new Date().toISOString().split('T')[0]
  );
  const [country, setCountry] = useState(initialValues?.country || '');

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      tripPlanId,
      dayPlanId,
      amount: parsedAmount,
      currency,
      category,
      description: description.trim(),
      date,
      country: country.trim() || undefined,
    });
  };

  const isValid = parseFloat(amount) > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.amountRow}>
          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.amountInput}
            left={<TextInput.Icon icon="currency-eur" />}
          />
          <View style={styles.currencyPicker}>
            <Text variant="labelLarge" style={styles.currencyLabel}>
              Currency
            </Text>
            <SegmentedButtons
              value={currency}
              onValueChange={setCurrency}
              buttons={CURRENCIES}
              density="small"
            />
          </View>
        </View>

        <CategoryPicker
          selectedCategory={category}
          onCategoryChange={setCategory}
        />

        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Dinner at local restaurant"
        />

        <TextInput
          label="Date"
          value={date}
          onChangeText={setDate}
          mode="outlined"
          style={styles.input}
          placeholder="YYYY-MM-DD"
          left={<TextInput.Icon icon="calendar" />}
        />

        <TextInput
          label="Country (optional)"
          value={country}
          onChangeText={setCountry}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Germany, France"
          left={<TextInput.Icon icon="flag" />}
        />

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={onCancel} style={styles.button}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            loading={isLoading}
            style={styles.button}
          >
            {initialValues?.id ? 'Update' : 'Add Expense'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  amountRow: {
    marginBottom: 16,
  },
  amountInput: {
    marginBottom: 12,
  },
  currencyPicker: {
    marginTop: 8,
  },
  currencyLabel: {
    marginBottom: 8,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
