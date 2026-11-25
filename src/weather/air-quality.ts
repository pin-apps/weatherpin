// Open-Meteo Air Quality API: https://open-meteo.com/en/docs/air-quality-api
// Data from the Copernicus Atmosphere Monitoring Service (CAMS): a detailed
// European model plus a coarser (~45 km) global one, so it works worldwide.
import { roundCoordinate } from './api';
import { msg } from '../i18n';
import type { HourlyPollutants } from './national-aqi';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const FORECAST_DAYS = 5;

// Pollutants per hour, for the UK's and Canada's indices (national-aqi.ts).
const HOURLY_POLLUTANTS = [
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
] as const;

// Same as the forecast: the model updates far less often than this.
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Pollen types, in display order. Europe only, and only in season. */
export const POLLEN_TYPES = [
  ['birch_pollen', msg('Birch')],
  ['alder_pollen', msg('Alder')],
  ['grass_pollen', msg('Grass')],
  ['mugwort_pollen', msg('Mugwort')],
  ['ragweed_pollen', msg('Ragweed')],
  ['olive_pollen', msg('Olive')],
] as const;

export type PollenVariable = (typeof POLLEN_TYPES)[number][0];

const CURRENT_VARIABLES = [
  'european_aqi',
  'us_aqi',
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
  'dust',
  // Greenhouse gases: CO₂ in ppm, methane in µg/m³ (shown in ppm).
  'carbon_dioxide',
  'methane',
  ...POLLEN_TYPES.map(([variable]) => variable),
];

// Values are null where the model has no data (e.g. pollen outside Europe).
export type CurrentAirQuality = {
  /** Local time, e.g. "2026-11-16T16:00". */
  time: string;
  european_aqi: number | null;
  us_aqi: number | null;
  /** Concentrations in µg/m³. */
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogen_dioxide: number | null;
  // Optional: missing in saved answers from before they were asked for.
  sulphur_dioxide?: number | null;
  carbon_monoxide?: number | null;
  /** Desert dust, µg/m³. */
  dust?: number | null;
  /** ppm. */
  carbon_dioxide?: number | null;
  /** µg/m³. */
  methane?: number | null;
} & Record<PollenVariable, number | null>; // grains/m³

/**
 * Hourly forecast, local times; null where the model has no data. Pollen
 * (grains/m³) has data only in Europe.
 */
export type HourlyAirQuality = {
  time: string[];
  european_aqi: (number | null)[];
  us_aqi: (number | null)[];
} & HourlyPollutants &
  Partial<Record<PollenVariable, (number | null)[]>>;

export interface AirQuality {
  /** IANA time zone name, e.g. "Europe/Oslo" or "America/Toronto". */
  timezone: string;
  current: CurrentAirQuality;
  /** Missing only if the service changes; then there's no forecast. */
  hourly?: HourlyAirQuality;
  /** The UK's or Canada's index per hour, worked out once on arrival. */
  national?: (number | null)[];
}

export class AirQualityError extends Error {}

interface CacheEntry {
  expiresAt: number;
  airQuality: AirQuality;
}

const cache = new Map<string, CacheEntry>();

export async function fetchAirQuality(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AirQuality> {
  const roundedLat = roundCoordinate(lat);
  const roundedLng = roundCoordinate(lng);
  const key = `${roundedLat},${roundedLng}`;

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.airQuality;
  }

  const params = new URLSearchParams({
    latitude: String(roundedLat),
    longitude: String(roundedLng),
    current: CURRENT_VARIABLES.join(','),
    // Both indices: which one is shown depends on the time zone in the reply.
    // Pollen for its own forecast (Europe; elsewhere all null).
    // Pollutants for the UK's and Canada's indices.
    hourly: [
      'european_aqi',
      'us_aqi',
      ...HOURLY_POLLUTANTS,
      ...POLLEN_TYPES.map(([variable]) => variable),
    ].join(','),
    // As far as the models reach: about 4 days in Europe, 5 elsewhere.
    forecast_days: String(FORECAST_DAYS),
    // Yesterday too: the UK's index averages dust over the last 24 hours.
    past_days: '1',
    timezone: 'auto',
  });

  let response: Response;
  try {
    response = await fetch(`${AIR_QUALITY_URL}?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AirQualityError('Could not reach the air quality service.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { reason?: string } | null;
    throw new AirQualityError(body?.reason ?? `Air quality error (HTTP ${response.status}).`);
  }

  const airQuality = (await response.json()) as AirQuality;
  if (typeof airQuality.current?.time !== 'string') {
    throw new AirQualityError('The air quality service returned unexpected data.');
  }

  // The UK's and Canada's indices are worked out here, by code loaded only
  // for places there (national-aqi.ts).
  const scale = scaleFor(airQuality.timezone);
  const hourly = airQuality.hourly;
  if ((scale === 'uk' || scale === 'canada') && Array.isArray(hourly?.time)) {
    const { daqiSeries, aqhiSeries } = await import('./national-aqi');
    const series = scale === 'uk' ? daqiSeries : aqhiSeries;
    airQuality.national = series(hourly, hourly.time.length);
  }

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, airQuality });
  return airQuality;
}

// ── Index scales ────────────────────────────────────────────────────────────

export type AqiScale = 'european' | 'us' | 'uk' | 'canada';

// European time zones outside the "Europe/" prefix.
const OTHER_EUROPEAN_ZONES = new Set([
  'Atlantic/Reykjavik',
  'Atlantic/Faroe',
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Arctic/Longyearbyen',
  'Asia/Nicosia',
  'Asia/Famagusta',
]);

// Great Britain and Northern Ireland.
const UK_ZONES = new Set(['Europe/London', 'Europe/Belfast', 'GB']);

// Canada's time zones (current names, and the old "Canada/…" ones).
const CANADIAN_ZONES = new Set([
  'America/St_Johns',
  'America/Halifax',
  'America/Glace_Bay',
  'America/Moncton',
  'America/Goose_Bay',
  'America/Blanc-Sablon',
  'America/Toronto',
  'America/Montreal',
  'America/Nipigon',
  'America/Thunder_Bay',
  'America/Rainy_River',
  'America/Atikokan',
  'America/Iqaluit',
  'America/Pangnirtung',
  'America/Winnipeg',
  'America/Rankin_Inlet',
  'America/Resolute',
  'America/Regina',
  'America/Swift_Current',
  'America/Edmonton',
  'America/Cambridge_Bay',
  'America/Yellowknife',
  'America/Inuvik',
  'America/Creston',
  'America/Dawson_Creek',
  'America/Fort_Nelson',
  'America/Vancouver',
  'America/Whitehorse',
  'America/Dawson',
]);

/**
 * The index people know where the place is: the UK's own (DAQI) in the UK,
 * Canada's (AQHI) in Canada, the European AQI elsewhere in Europe, the US
 * AQI everywhere else (it's what most worldwide apps use). Decided by time
 * zone, which the API returns anyway.
 */
export function scaleFor(timezone: string): AqiScale {
  if (UK_ZONES.has(timezone)) return 'uk';
  if (CANADIAN_ZONES.has(timezone) || timezone.startsWith('Canada/')) return 'canada';
  return timezone.startsWith('Europe/') || OTHER_EUROPEAN_ZONES.has(timezone) ? 'european' : 'us';
}

/**
 * The index for every hour of `airQuality.hourly` (same order); null where
 * there's no data. The UK's and Canada's are worked out here.
 */
export function indexSeries(airQuality: AirQuality, scale: AqiScale): (number | null)[] {
  const hourly = airQuality.hourly;
  if (!hourly || !Array.isArray(hourly.time)) return [];
  switch (scale) {
    case 'european':
      return hourly.european_aqi ?? [];
    case 'us':
      return hourly.us_aqi ?? [];
    case 'uk':
    case 'canada':
      return airQuality.national ?? [];
  }
}

/** The index now, or null if there's none for this place. */
export function currentIndex(airQuality: AirQuality, scale: AqiScale): number | null {
  if (scale === 'european') return airQuality.current.european_aqi;
  if (scale === 'us') return airQuality.current.us_aqi;
  // The hour that holds the current time ("2026-11-15T14:15" → 14:00).
  const hour = airQuality.current.time.slice(0, 13);
  const index = airQuality.hourly?.time?.findIndex((time) => time.startsWith(hour)) ?? -1;
  return index === -1 ? null : (indexSeries(airQuality, scale)[index] ?? null);
}

/** The number as shown: whole, and Canada's above 10 as "10+". */
export function formatIndex(scale: AqiScale, value: number): string {
  if (scale === 'canada' && value > 10) return '10+';
  return String(Math.round(value));
}

export interface AqiLevel {
  /** 1 (best) to 6 (worst; 4 for the UK and Canada); for the badge colour. */
  level: number;
  label: string;
}

// Upper bound of each band, best first; anything higher is the last band.
const BANDS: Record<AqiScale, [number, string][]> = {
  // European Environment Agency, 2024 bands.
  european: [
    [20, msg('aqi|Good')],
    [40, msg('aqi|Fair')],
    [60, msg('aqi|Moderate')],
    [80, msg('aqi|Poor')],
    [100, msg('aqi|Very poor')],
    [Infinity, msg('aqi|Extremely poor')],
  ],
  // DEFRA's bands: 1–3, 4–6, 7–9, 10.
  uk: [
    [3, msg('daqi|Low')],
    [6, msg('daqi|Moderate')],
    [9, msg('daqi|High')],
    [Infinity, msg('daqi|Very high')],
  ],
  // Canada's risk categories: 1–3, 4–6, 7–10, 10+.
  canada: [
    [3, msg('aqhi|Low risk')],
    [6, msg('aqhi|Moderate risk')],
    [10, msg('aqhi|High risk')],
    [Infinity, msg('aqhi|Very high risk')],
  ],
  // US EPA bands.
  us: [
    [50, msg('usaqi|Good')],
    [100, msg('usaqi|Moderate')],
    [150, msg('usaqi|Unhealthy for sensitive groups')],
    [200, msg('usaqi|Unhealthy')],
    [300, msg('usaqi|Very unhealthy')],
    [Infinity, msg('usaqi|Hazardous')],
  ],
};

export const SCALE_NAMES: Record<AqiScale, string> = {
  european: msg('European AQI'),
  us: msg('US AQI'),
  uk: msg('UK DAQI'),
  canada: msg('Canada AQHI'),
};

export function aqiLevel(scale: AqiScale, value: number): AqiLevel {
  const bands = BANDS[scale];
  const index = bands.findIndex(([upTo]) => value <= upTo);
  return { level: index + 1, label: bands[index][1] };
}
