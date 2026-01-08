import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, SegmentedButtons, Text, IconButton, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { ExpenseSummary } from '../../../types';
import { CategoryPieChart } from './CategoryPieChart';
import { DailySpendingChart } from './DailySpendingChart';

interface ExpenseChartsProps {
  summary: ExpenseSummary;
  budget?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

type ChartType = 'category' | 'daily';

export function ExpenseCharts({
  summary,
  budget,
  isExpanded,
  onToggle,
}: ExpenseChartsProps) {
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('category');

  const rotation = useDerivedValue(() => {
    return isExpanded ? 180 : 0;
  }, [isExpanded]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${withTiming(rotation.value, { duration: 200 })}deg` }],
    };
  });

  return (
    <Card style={styles.card} mode="outlined">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="chart-pie"
            size={20}
            iconColor={theme.colors.primary}
          />
          <Text variant="titleSmall" style={styles.title}>
            Expense Charts
          </Text>
        </View>
        <Animated.View style={iconStyle}>
          <IconButton
            icon="chevron-down"
            size={20}
            onPress={onToggle}
          />
        </Animated.View>
      </View>

      {isExpanded && (
        <Card.Content style={styles.content}>
          <SegmentedButtons
            value={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
            buttons={[
              { value: 'category', label: 'By Category', icon: 'chart-pie' },
              { value: 'daily', label: 'By Day', icon: 'chart-bar' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.chartContainer}>
            {chartType === 'category' ? (
              <CategoryPieChart
                byCategory={summary.byCategory}
                currency={summary.currency}
              />
            ) : (
              <DailySpendingChart
                byDay={summary.byDay}
                currency={summary.currency}
                budget={budget}
              />
            )}
          </View>
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  content: {
    paddingTop: 0,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  chartContainer: {
    minHeight: 200,
  },
});
