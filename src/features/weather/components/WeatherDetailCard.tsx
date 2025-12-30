import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WeatherForecast } from '../types';
import {
  getWeatherIcon,
  formatTemperature,
  formatWindSpeed,
  getCyclingScoreColor,
} from '../services/openMeteo.service';
import { detailStyles as styles } from './WeatherWidget.styles';

export interface WeatherDetailCardProps {
  weather: WeatherForecast;
  onClose: () => void;
}

/**
 * Expanded weather card showing 7-day forecast
 */
export const WeatherDetailCard = memo(function WeatherDetailCard({
  weather,
  onClose,
}: WeatherDetailCardProps) {
  const { current, daily } = weather;
  const iconInfo = getWeatherIcon(current.weatherCode, current.isDay);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weather Forecast</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Current conditions */}
      <View style={styles.currentSection}>
        <Text style={styles.bigIcon}>{iconInfo.icon}</Text>
        <View style={styles.currentInfo}>
          <Text style={styles.bigTemp}>
            {formatTemperature(current.temperature)}
          </Text>
          <Text style={styles.feelsLike}>
            Feels like {formatTemperature(current.apparentTemperature)}
          </Text>
        </View>
      </View>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>
            {formatWindSpeed(current.windSpeed)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{current.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Gusts</Text>
          <Text style={styles.detailValue}>
            {formatWindSpeed(current.windGusts)}
          </Text>
        </View>
      </View>

      {/* 7-day forecast */}
      <Text style={styles.forecastTitle}>7-Day Forecast</Text>
      <View style={styles.forecastList}>
        {daily.map((day, index) => {
          const dayIcon = getWeatherIcon(day.weatherCode, true);
          const date = new Date(day.date);
          const dayName =
            index === 0
              ? 'Today'
              : date.toLocaleDateString('en', { weekday: 'short' });

          return (
            <View key={day.date} style={styles.forecastDay}>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dayIcon}>{dayIcon.icon}</Text>
              <Text style={styles.dayTemp}>
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </Text>
              <View
                style={[
                  styles.dayScore,
                  { backgroundColor: getCyclingScoreColor(day.cyclingScore) },
                ]}
              >
                <Text style={styles.dayScoreText}>{day.cyclingScore}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});
