import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WeatherForecast } from '../types';
import {
  getWeatherIcon,
  formatTemperature,
  formatWindSpeed,
  getWindDirectionLabel,
  getCyclingScoreColor,
} from '../services/openMeteo.service';
import { colors } from '../../../shared/design/tokens';
import { widgetStyles as styles } from './WeatherWidget.styles';

// Re-export WeatherDetailCard for backwards compatibility
export { WeatherDetailCard } from './WeatherDetailCard';
export type { WeatherDetailCardProps } from './WeatherDetailCard';

export interface WeatherWidgetProps {
  weather: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  onPress?: () => void;
}

/**
 * Compact weather widget for map overlay
 */
export const WeatherWidget = memo(function WeatherWidget({
  weather,
  isLoading,
  error,
  onPress,
}: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Text style={styles.errorText}>Weather unavailable</Text>
      </TouchableOpacity>
    );
  }

  const { current, daily } = weather;
  const today = daily[0];
  const iconInfo = getWeatherIcon(current.weatherCode, current.isDay);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Current conditions */}
      <View style={styles.currentRow}>
        <Text style={styles.weatherIcon}>{iconInfo.icon}</Text>
        <Text style={styles.temperature}>
          {formatTemperature(current.temperature)}
        </Text>
      </View>

      {/* Wind */}
      <View style={styles.detailRow}>
        <Text style={styles.detailText}>
          {formatWindSpeed(current.windSpeed)} {getWindDirectionLabel(current.windDirection)}
        </Text>
      </View>

      {/* Cycling score */}
      {today && (
        <View style={styles.scoreRow}>
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getCyclingScoreColor(today.cyclingScore) },
            ]}
          >
            <Text style={styles.scoreText}>{today.cyclingScore}/5</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});
