// Open-Meteo Marine API: https://open-meteo.com/en/docs/marine-weather-api
// Waves, swell and sea temperature. Only sea has data, so the request asks
// for the nearest sea cell (`cell_selection=sea`): a tap on a harbour or a
// beach gets the sea next to it. Inland, or in waters the models don't
// cover (e.g. the inner Oslo fjord), every value is null: then there's no
// sea weather to show.
import { roundCoordinate } from './api';

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const CACHE_TTL_MS = 10 * 60 * 1000;

const CURRENT_VARIABLES = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'sea_surface_temperature',
] as const;

export interface Marine {
  current: {
    /** Local time, e.g. "2026-11-15T14:00". */
    time: string;
    /** Metres (significant height: the higher third of the waves). */
    wave_height: number | null;
    /** Degrees the waves come from. */
    wave_direction: number | null;
    /** Seconds between waves. */
    wave_period: number | null;
    swell_wave_height: number | null;
    /** °C */
    sea_surface_temperature: number | null;
  };
  hourly?: {
    time: string[];
    wave_height: (number | null)[];
  };
}

export class MarineError extends Error {}

const cache = new Map<string, { expiresAt: number; marine: Marine | null }>();

/** Sea weather near the point, or null where there's no sea data. */
export async function fetchMarine(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<Marine | null> {
  const roundedLat = roundCoordinate(lat);
  const roundedLng = roundCoordinate(lng);
  const key = `${roundedLat},${roundedLng}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.marine;

  const params = new URLSearchParams({
    latitude: String(roundedLat),
    longitude: String(roundedLng),
    current: CURRENT_VARIABLES.join(','),
    hourly: 'wave_height',
    // Today and tomorrow: enough for "highest in the next 24 hours".
    forecast_days: '2',
    timezone: 'auto',
    cell_selection: 'sea',
  });

  let response: Response;
  try {
    response = await fetch(`${MARINE_URL}?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new MarineError('Could not reach the sea weather service.');
  }
  if (!response.ok) throw new MarineError(`Sea weather error (HTTP ${response.status}).`);

  const data = (await response.json()) as Marine;
  if (typeof data.current?.time !== 'string') {
    throw new MarineError('The sea weather service returned unexpected data.');
  }
  const marine = data.current.wave_height == null ? null : data;
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, marine });
  return marine;
}

/** Highest waves from now on, over the next 24 hours, and when. */
export function highestWaves(marine: Marine): { height: number; time: string } | null {
  const hourly = marine.hourly;
  if (!hourly?.time || !hourly.wave_height) return null;
  const currentHour = marine.current.time.slice(0, 13);
  const start = hourly.time.findIndex((time) => time.slice(0, 13) >= currentHour);
  if (start === -1) return null;
  let best: { height: number; time: string } | null = null;
  for (let i = start; i < Math.min(start + 24, hourly.time.length); i++) {
    const height = hourly.wave_height[i];
    if (height != null && (best === null || height > best.height)) {
      best = { height, time: hourly.time[i] };
    }
  }
  return best;
}
