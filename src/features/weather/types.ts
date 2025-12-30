// WMO Weather interpretation codes
export type WeatherCode =
  | 0  // Clear sky
  | 1 | 2 | 3  // Mainly clear, partly cloudy, overcast
  | 45 | 48  // Fog
  | 51 | 53 | 55  // Drizzle
  | 56 | 57  // Freezing drizzle
  | 61 | 63 | 65  // Rain
  | 66 | 67  // Freezing rain
  | 71 | 73 | 75  // Snow
  | 77  // Snow grains
  | 80 | 81 | 82  // Rain showers
  | 85 | 86  // Snow showers
  | 95  // Thunderstorm
  | 96 | 99;  // Thunderstorm with hail

// Cycling conditions score (1-5, 5 being best)
export type CyclingScore = 1 | 2 | 3 | 4 | 5;

// Current weather conditions
export interface CurrentWeather {
  temperature: number;       // Celsius
  apparentTemperature: number;
  humidity: number;          // %
  windSpeed: number;         // km/h
  windDirection: number;     // degrees
  windGusts: number;         // km/h
  precipitation: number;     // mm
  weatherCode: WeatherCode;
  isDay: boolean;
}

// Daily forecast
export interface DailyForecast {
  date: string;              // ISO date string
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  precipitationSum: number;  // mm
  precipitationProbability: number; // %
  windSpeedMax: number;
  windGustsMax: number;
  windDirection: number;
  weatherCode: WeatherCode;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  cyclingScore: CyclingScore;
}

// Complete weather forecast
export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: Date;
  current: CurrentWeather;
  daily: DailyForecast[];
}

// Weather along route
export interface RouteWeather {
  routeId: string;
  forecasts: Array<{
    distanceKm: number;
    latitude: number;
    longitude: number;
    forecast: WeatherForecast;
  }>;
}

// Weather icon mapping
export interface WeatherIconInfo {
  icon: string;
  label: string;
  color: string;
}
