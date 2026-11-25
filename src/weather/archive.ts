// Open-Meteo Historical Weather API: one past day at a place, from 1940 on
// (ERA5 reanalysis and its successors, ~5 days behind real time).
// https://open-meteo.com/en/docs/historical-weather-api

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/** The first day the archive has. */
export const FIRST_ARCHIVE_DAY = '1940-01-01';
/** The archive runs this many days behind the place's today. */
export const ARCHIVE_DELAY_DAYS = 6;

const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'rain_sum',
  'snowfall_sum',
  'wind_speed_10m_max',
  'sunshine_duration',
] as const;

/** One day's weather; a value is null where the archive has none. */
export interface PastDay {
  date: string;
  weatherCode: number | null;
  /** °C */
  high: number | null;
  low: number | null;
  /** mm (rain and melted snow) */
  precipitation: number | null;
  /** cm */
  snowfall: number | null;
  /** m/s */
  windMax: number | null;
  /** seconds */
  sunshine: number | null;
}

type DailyAnswer = Record<(typeof DAILY_VARIABLES)[number], (number | null)[]> & {
  time: string[];
};

export class ArchiveError extends Error {}

// Past days never change: kept for the visit (in memory only).
const cache = new Map<string, PastDay>();

export async function fetchPastDay(lat: number, lng: number, date: string): Promise<PastDay> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lng.toFixed(2),
    start_date: date,
    end_date: date,
    daily: DAILY_VARIABLES.join(','),
    timezone: 'auto',
    // Metric units, requested explicitly rather than relying on defaults.
    temperature_unit: 'celsius',
    wind_speed_unit: 'ms',
    precipitation_unit: 'mm',
  });
  let response: Response;
  try {
    response = await fetch(`${ARCHIVE_URL}?${params}`);
  } catch {
    throw new ArchiveError('network');
  }
  if (!response.ok) throw new ArchiveError(`HTTP ${response.status}`);
  const body = (await response.json().catch(() => null)) as { daily?: DailyAnswer } | null;
  const daily = body?.daily;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    throw new ArchiveError('unexpected');
  }
  const value = (name: (typeof DAILY_VARIABLES)[number]) => {
    const found = daily[name]?.[0];
    return typeof found === 'number' ? found : null;
  };
  const day: PastDay = {
    date,
    weatherCode: value('weather_code'),
    high: value('temperature_2m_max'),
    low: value('temperature_2m_min'),
    precipitation: value('precipitation_sum'),
    snowfall: value('snowfall_sum'),
    windMax: value('wind_speed_10m_max'),
    sunshine: value('sunshine_duration'),
  };
  // A day with no temperatures isn't in the archive yet: not kept.
  if (day.high !== null) cache.set(key, day);
  return day;
}

/** "2026-11-21" minus `years`: 29 Feb becomes 28 Feb in other years. */
export function yearsBefore(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = year - years;
  const lastDay = new Date(Date.UTC(target, month, 0)).getUTCDate();
  return isoDay(target, month, Math.min(day, lastDay));
}

/** "2026-11-21" minus `days` (calendar dates, no time zone involved). */
export function daysBefore(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days));
  return isoDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function isoDay(year: number, month: number, day: number): string {
  const pad = (value: number, length: number) => String(value).padStart(length, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}
