import {
  WeatherForecast,
  CurrentWeather,
  DailyForecast,
  WeatherCode,
  CyclingScore,
  WeatherIconInfo,
} from '../types';

// Open-Meteo API (free, no key required)
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

// Fetch weather for a location
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(`${OPEN_METEO_API}?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return parseWeatherResponse(data, latitude, longitude);
}

// Parse API response
function parseWeatherResponse(
  data: any,
  latitude: number,
  longitude: number
): WeatherForecast {
  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code as WeatherCode,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    windGusts: data.current.wind_gusts_10m,
    isDay: data.current.is_day === 1,
  };

  const daily: DailyForecast[] = data.daily.time.map(
    (date: string, i: number) => {
      const forecast: DailyForecast = {
        date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        apparentTempMax: data.daily.apparent_temperature_max[i],
        apparentTempMin: data.daily.apparent_temperature_min[i],
        precipitationSum: data.daily.precipitation_sum[i],
        precipitationProbability: data.daily.precipitation_probability_max[i],
        windSpeedMax: data.daily.wind_speed_10m_max[i],
        windGustsMax: data.daily.wind_gusts_10m_max[i],
        windDirection: data.daily.wind_direction_10m_dominant[i],
        weatherCode: data.daily.weather_code[i] as WeatherCode,
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
        uvIndexMax: data.daily.uv_index_max[i],
        cyclingScore: calculateCyclingScore(
          data.daily.weather_code[i],
          data.daily.temperature_2m_max[i],
          data.daily.wind_speed_10m_max[i],
          data.daily.precipitation_sum[i]
        ),
      };
      return forecast;
    }
  );

  return {
    latitude,
    longitude,
    timezone: data.timezone,
    fetchedAt: new Date(),
    current,
    daily,
  };
}

// Calculate cycling conditions score (1-5)
export function calculateCyclingScore(
  weatherCode: WeatherCode,
  tempMax: number,
  windSpeedMax: number,
  precipitationSum: number
): CyclingScore {
  let score = 5;

  // Weather code penalties
  if (weatherCode >= 95) score -= 3; // Thunderstorm
  else if (weatherCode >= 80) score -= 2; // Rain showers
  else if (weatherCode >= 61) score -= 2; // Rain
  else if (weatherCode >= 51) score -= 1; // Drizzle
  else if (weatherCode >= 45) score -= 1; // Fog

  // Temperature penalties
  if (tempMax < 5 || tempMax > 35) score -= 2;
  else if (tempMax < 10 || tempMax > 30) score -= 1;

  // Wind penalties
  if (windSpeedMax > 50) score -= 2;
  else if (windSpeedMax > 30) score -= 1;

  // Precipitation penalties
  if (precipitationSum > 10) score -= 1;

  return Math.max(1, Math.min(5, score)) as CyclingScore;
}

// Get weather description from code
export function getWeatherDescription(code: WeatherCode): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

// Get weather icon info
export function getWeatherIcon(code: WeatherCode, isDay: boolean = true): WeatherIconInfo {
  // Clear
  if (code === 0) {
    return isDay
      ? { icon: '☀️', label: 'Clear', color: '#FFB300' }
      : { icon: '🌙', label: 'Clear night', color: '#5C6BC0' };
  }
  // Partly cloudy
  if (code <= 3) {
    return isDay
      ? { icon: '⛅', label: 'Partly cloudy', color: '#90A4AE' }
      : { icon: '☁️', label: 'Cloudy', color: '#78909C' };
  }
  // Fog
  if (code <= 48) {
    return { icon: '🌫️', label: 'Foggy', color: '#B0BEC5' };
  }
  // Drizzle
  if (code <= 57) {
    return { icon: '🌧️', label: 'Drizzle', color: '#4FC3F7' };
  }
  // Rain
  if (code <= 67) {
    return { icon: '🌧️', label: 'Rain', color: '#29B6F6' };
  }
  // Snow
  if (code <= 77) {
    return { icon: '❄️', label: 'Snow', color: '#E1F5FE' };
  }
  // Rain showers
  if (code <= 82) {
    return { icon: '🌦️', label: 'Showers', color: '#4DD0E1' };
  }
  // Snow showers
  if (code <= 86) {
    return { icon: '🌨️', label: 'Snow showers', color: '#B3E5FC' };
  }
  // Thunderstorm
  return { icon: '⛈️', label: 'Thunderstorm', color: '#7E57C2' };
}

// Get cycling score description
export function getCyclingScoreDescription(score: CyclingScore): string {
  const descriptions: Record<CyclingScore, string> = {
    5: 'Excellent cycling conditions',
    4: 'Good cycling conditions',
    3: 'Fair cycling conditions',
    2: 'Poor cycling conditions',
    1: 'Not recommended for cycling',
  };
  return descriptions[score];
}

// Get cycling score color
export function getCyclingScoreColor(score: CyclingScore): string {
  const colors: Record<CyclingScore, string> = {
    5: '#4CAF50',
    4: '#8BC34A',
    3: '#FFC107',
    2: '#FF9800',
    1: '#F44336',
  };
  return colors[score];
}

// Format temperature
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`;
}

// Format wind speed
export function formatWindSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

// Get wind direction label
export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
