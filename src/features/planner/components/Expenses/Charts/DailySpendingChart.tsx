import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { formatCurrency } from '../../../utils/expenseUtils';

interface DailySpendingChartProps {
  byDay: Record<string, number>;
  currency: string;
  budget?: number;
}

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 64;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export function DailySpendingChart({ byDay, currency, budget }: DailySpendingChartProps) {
  const theme = useTheme();

  // Convert data for bar chart and sort by date
  const data = Object.entries(byDay)
    .map(([date, amount]) => ({
      date,
      amount,
      label: formatShortDate(date),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Show last 7 days

  const maxAmount = Math.max(...data.map(d => d.amount), budget || 0) * 1.1;
  const dailyBudget = budget ? budget / Math.max(data.length, 1) : undefined;

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No daily spending data
        </Text>
      </View>
    );
  }

  // Calculate dimensions
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = (plotWidth / data.length) * 0.7;
  const barGap = (plotWidth / data.length) * 0.3;

  // Scale function
  const scaleY = (value: number) => {
    return plotHeight - (value / maxAmount) * plotHeight;
  };

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio) => {
          const value = maxAmount * ratio;
          const y = PADDING.top + scaleY(value);
          return (
            <G key={ratio}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="#eee"
                strokeDasharray="4,4"
              />
              <SvgText
                x={PADDING.left - 8}
                y={y + 4}
                fontSize={10}
                fill="#666"
                textAnchor="end"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const x = PADDING.left + index * (barWidth + barGap) + barGap / 2;
          const barHeight = (item.amount / maxAmount) * plotHeight;
          const y = PADDING.top + plotHeight - barHeight;

          return (
            <G key={item.date}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={theme.colors.primary}
                rx={4}
              />
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - PADDING.bottom + 16}
                fontSize={9}
                fill="#666"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </G>
          );
        })}

        {/* Daily budget line */}
        {dailyBudget && dailyBudget > 0 && (
          <Line
            x1={PADDING.left}
            y1={PADDING.top + scaleY(dailyBudget)}
            x2={CHART_WIDTH - PADDING.right}
            y2={PADDING.top + scaleY(dailyBudget)}
            stroke="#f44336"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
      </Svg>

      {dailyBudget && dailyBudget > 0 && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: theme.colors.primary }]} />
            <Text variant="bodySmall" style={styles.legendText}>Daily Spending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { borderColor: '#f44336' }]} />
            <Text variant="bodySmall" style={styles.legendText}>
              Avg Budget ({formatCurrency(dailyBudget, currency)})
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function formatShortDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLine: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendText: {
    color: '#666',
  },
});
