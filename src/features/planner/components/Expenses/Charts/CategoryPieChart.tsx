import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { ExpenseCategory } from '../../../types';
import { formatCurrency, CATEGORY_LABELS } from '../../../utils/expenseUtils';

interface CategoryPieChartProps {
  byCategory: Record<ExpenseCategory, number>;
  currency: string;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  accommodation: '#4CAF50',
  food: '#FF9800',
  transport: '#2196F3',
  repairs: '#9C27B0',
  other: '#607D8B',
};

const screenWidth = Dimensions.get('window').width;
const SIZE = Math.min(screenWidth - 64, 200);
const RADIUS = SIZE / 2;
const INNER_RADIUS = RADIUS * 0.6;

export function CategoryPieChart({ byCategory, currency }: CategoryPieChartProps) {
  const theme = useTheme();

  // Convert data for pie chart
  const data = Object.entries(byCategory)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      category: category as ExpenseCategory,
      label: CATEGORY_LABELS[category as ExpenseCategory],
      value,
      color: CATEGORY_COLORS[category as ExpenseCategory],
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No expenses to display
        </Text>
      </View>
    );
  }

  // Calculate arc segments
  let startAngle = 0;
  const arcs = data.map((item) => {
    const angle = (item.value / total) * 360;
    const arc = {
      ...item,
      startAngle,
      endAngle: startAngle + angle,
      percent: ((item.value / total) * 100).toFixed(0),
    };
    startAngle += angle;
    return arc;
  });

  // Calculate stroke dasharray for each segment
  const circumference = 2 * Math.PI * (RADIUS - 15);

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
            {arcs.map((arc, index) => {
              const dashLength = (arc.value / total) * circumference;
              const dashOffset = arcs
                .slice(0, index)
                .reduce((sum, a) => sum + (a.value / total) * circumference, 0);

              return (
                <Circle
                  key={arc.category}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS - 15}
                  stroke={arc.color}
                  strokeWidth={24}
                  fill="transparent"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={-dashOffset}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text variant="labelSmall" style={styles.totalLabel}>
            Total
          </Text>
          <Text variant="titleMedium" style={[styles.totalAmount, { color: theme.colors.primary }]}>
            {formatCurrency(total, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.category} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text variant="bodySmall" style={styles.legendLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text variant="bodySmall" style={styles.legendValue}>
              {formatCurrency(item.value, currency)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#666',
  },
  totalAmount: {
    fontWeight: '600',
  },
  legend: {
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    color: '#666',
  },
  legendValue: {
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
