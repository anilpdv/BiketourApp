import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  TextInput as RNTextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Expense, ExpenseCategory } from '../../types';
import { colors, spacing } from '../../../../shared/design/tokens';
import { CategorySelector } from './CategorySelector';
import { DetailsCard } from './DetailsCard';
import { SubmitBar } from './SubmitBar';

interface ExpenseFormProps {
  initialValues?: Partial<Expense>;
  tripPlanId: string;
  dayPlanId?: string;
  onSubmit: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;

const QUICK_AMOUNTS = [10, 25, 50, 100, 200];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20ac',
  USD: '$',
  GBP: '\u00a3',
  CHF: 'CHF',
};

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
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setDate(dateString);
    }
  };

  const isCustomCategory = category === 'other';
  const isValid = parseFloat(amount) > 0 && (!isCustomCategory || description.trim().length > 0);
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount Section */}
        <View style={styles.amountSection}>
          {/* Currency Selector */}
          <View style={styles.currencyRow}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyPill,
                  currency === curr && styles.currencyPillActive,
                ]}
                onPress={() => setCurrency(curr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyText,
                    currency === curr && styles.currencyTextActive,
                  ]}
                >
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <RNTextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.neutral[300]}
              selectionColor={colors.primary[500]}
            />
          </View>

          {/* Quick Amounts with Currency Symbols */}
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickPill,
                  amount === value.toString() && styles.quickPillActive,
                ]}
                onPress={() => handleQuickAmount(value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickPillText,
                    amount === value.toString() && styles.quickPillTextActive,
                  ]}
                >
                  {currencySymbol}{value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Section - Color-coded */}
        <CategorySelector selected={category} onSelect={setCategory} />

        {/* Details Section - Card wrapped */}
        <DetailsCard
          isCustomCategory={isCustomCategory}
          description={description}
          onDescriptionChange={setDescription}
          date={date}
          showDatePicker={showDatePicker}
          onDatePress={() => setShowDatePicker(true)}
          onDateChange={handleDateChange}
          onDatePickerDismiss={() => setShowDatePicker(false)}
          country={country}
          onCountryChange={setCountry}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Enhanced Submit Bar */}
      <SubmitBar
        isValid={isValid}
        isLoading={isLoading}
        amount={amount}
        currencySymbol={currencySymbol}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },

  // Amount Section
  amountSection: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  currencyPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  currencyPillActive: {
    backgroundColor: colors.primary[500],
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  currencyTextActive: {
    color: '#fff',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.neutral[800],
    marginRight: 4,
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.neutral[800],
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: '#fff',
    minWidth: 60,
    alignItems: 'center',
  },
  quickPillActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  quickPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  quickPillTextActive: {
    color: colors.primary[600],
  },
});
