import { t } from '../i18n';
import { saveForecast, savedForecast } from './saved';
// Open-Meteo Forecast API: https://open-meteo.com/en/docs
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Responses are reused for a few minutes; the forecast updates far less often.
const CACHE_TTL_MS = 10 * 60 * 1000;

const CURRENT_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  // Gusts are what knock things over; the average alone understates storms.
  'wind_gusts_10m',
  // Snow in cm: precipitation counts it as melted water, which hides that
  // 3 mm of precipitation can be 3 cm of snow.
  'snowfall',
  'is_day',
  // Sea-level pressure: what forecasts and barometers quote. (Surface
  // pressure drops with altitude, so mountain towns would always look stormy.)
  'pressure_msl',
  // Pressure where the place is (not reduced to sea level): what a
  // surveying instrument's distance correction needs (weather/edm.ts).
  'surface_pressure',
  'uv_index',
] as const;

const HOURLY_VARIABLES = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'precipitation',
  'is_day',
  'pressure_msl',
  // For today's UV peak and when it is.
  'uv_index',
  // Wind in the hour strip.
  'wind_speed_10m',
  'wind_direction_10m',
  // Clear nights for stargazing and the northern lights (render/sky.ts).
  'cloud_cover',
] as const;

// Rain or snow starting or stopping in the next hours (see nowcast.ts).
const MINUTELY_15_VARIABLES = ['precipitation', 'snowfall'] as const;
// 4 hours of 15-minute steps: the 3 the app looks at, plus room for "now"
// falling inside the first one.
const MINUTELY_15_STEPS = 16;

const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'snowfall_sum',
  'sunrise',
  'sunset',
  'daylight_duration',
  'uv_index_max',
] as const;

export const FORECAST_DAYS = 7;

export interface CurrentWeather {
  /** Local time of the observation, e.g. "2026-11-15T14:00" (no offset). */
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  // Optional: the weather still shows if a model lacks them.
  /** Strongest gusts, in m/s (wind_speed_unit=ms). */
  wind_gusts_10m?: number | null;
  /** Snow in the last hour, in cm. */
  snowfall?: number | null;
  /** Direction the wind blows from, in degrees (0 = north). */
  wind_direction_10m: number;
  /** 1 during daylight, 0 at night. */
  is_day: number;
  /** Air pressure reduced to sea level, in hPa. */
  pressure_msl: number;
  /** Air pressure at ground level, in hPa; missing in forecasts saved before it was asked for. */
  surface_pressure?: number | null;
  // UV values are optional: the weather still shows if a model lacks them.
  /** UV index (WHO scale, no unit). */
  uv_index?: number | null;
}

// Hourly and daily values are parallel arrays indexed like `time`. Values can
// be null where a model has no data.
export interface HourlyForecast {
  /** Local times, e.g. "2026-11-15T14:00". */
  time: string[];
  temperature_2m: (number | null)[];
  weather_code: (number | null)[];
  precipitation_probability: (number | null)[];
  precipitation: (number | null)[];
  is_day: (number | null)[];
  pressure_msl: (number | null)[];
  uv_index?: (number | null)[];
  /** m/s, like every speed the app requests. */
  wind_speed_10m?: (number | null)[];
  /** Degrees the wind comes from (0 = north). */
  wind_direction_10m?: (number | null)[];
  /** Percent of the sky covered; missing in forecasts saved before it was asked for. */
  cloud_cover?: (number | null)[];
}

/** 15-minute steps from now: mm (and cm of snow) in each 15 minutes. */
export interface Minutely15Forecast {
  /** Local times, e.g. "2026-11-15T14:15". */
  time: string[];
  precipitation: (number | null)[];
  snowfall?: (number | null)[];
}

export interface DailyForecast {
  /** Local dates, e.g. "2026-11-15". */
  time: string[];
  weather_code: (number | null)[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  /** Snow over the day, in cm. */
  snowfall_sum?: (number | null)[];
  /** Local times. Placeholder midnight values in polar night/midnight sun. */
  sunrise: string[];
  sunset: string[];
  /** Seconds of daylight: 0 in polar night, 86400 in midnight sun. */
  daylight_duration: (number | null)[];
  /** Highest UV index of the day. */
  uv_index_max?: (number | null)[];
}

export interface Forecast {
  latitude: number;
  longitude: number;
  /** IANA time zone name, e.g. "Europe/Oslo". */
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  /**
   * Height of the point above sea level in metres, from a 90 m elevation
   * map (Copernicus DEM). Missing in copies saved before it was shown.
   */
  elevation?: number;
  current: CurrentWeather;
  hourly: HourlyForecast;
  /** Missing if the service leaves it out; the app then just doesn't say. */
  minutely_15?: Minutely15Forecast;
  daily: DailyForecast;
  /** When the app fetched it (ms since 1970, this device's clock). */
  fetchedAt: number;
  /** Shown from this device's copy: the weather service couldn't be reached. */
  offline?: boolean;
}

export class WeatherError extends Error {}

/**
 * Index in `hourly` of the hour that contains the current time, or -1.
 * Both values are local to the location, so comparing the "YYYY-MM-DDTHH"
 * prefix is enough.
 */
export function currentHourIndex(forecast: Forecast): number {
  const hourPrefix = forecast.current.time.slice(0, 13);
  return forecast.hourly.time.findIndex((time) => time.startsWith(hourPrefix));
}

interface CacheEntry {
  expiresAt: number;
  forecast: Forecast;
}

const cache = new Map<string, CacheEntry>();

// ~1 km precision: nearby clicks share a cache entry and a request.
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: CURRENT_VARIABLES.join(','),
    hourly: HOURLY_VARIABLES.join(','),
    minutely_15: MINUTELY_15_VARIABLES.join(','),
    forecast_minutely_15: String(MINUTELY_15_STEPS),
    daily: DAILY_VARIABLES.join(','),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
    // Metric units, requested explicitly rather than relying on defaults.
    temperature_unit: 'celsius',
    wind_speed_unit: 'ms',
    precipitation_unit: 'mm',
  });
  return `${FORECAST_URL}?${params}`;
}

export async function fetchForecast(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  // The quiz: not kept in the device's copy of recent weather (it'd show).
  { keep = true }: { keep?: boolean } = {},
): Promise<Forecast> {
  const roundedLat = roundCoordinate(lat);
  const roundedLng = roundCoordinate(lng);
  const key = `${roundedLat},${roundedLng}`;

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.forecast;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(roundedLat, roundedLng), { signal });
  } catch (error) {
    // Let aborts through untouched so callers can ignore them.
    if (signal?.aborted) throw error;
    // No connection: the weather saved here last time, if it's recent.
    const saved = savedForecast(key);
    if (saved) return saved;
    throw new WeatherError(t('Could not reach the weather service. Check your connection.'));
  }

  if (!response.ok) {
    // Open-Meteo explains 400 errors in a JSON "reason" field.
    const body = (await response.json().catch(() => null)) as { reason?: string } | null;
    throw new WeatherError(body?.reason ?? `Weather service error (HTTP ${response.status}).`);
  }

  const forecast = (await response.json()) as Forecast;
  if (
    typeof forecast.current?.temperature_2m !== 'number' ||
    !Array.isArray(forecast.hourly?.time) ||
    !Array.isArray(forecast.daily?.time)
  ) {
    throw new WeatherError(t('The weather service returned unexpected data.'));
  }

  forecast.fetchedAt = Date.now();
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, forecast });
  if (keep) saveForecast(key, forecast);
  return forecast;
}
