// Which warnings service covers a place, and asking it. Decided by the
// place's time zone (which the forecast gives): the services only cover
// their own country, and the US one rejects points outside the US. Each
// service's code is fetched only when a place in its country is shown (a
// visit needs one at most; this keeps the start-up code small).

import { LEVEL_ORDER, type WarningSource, type WeatherWarning } from './types';

// Warnings change faster than forecasts.
const CACHE_TTL_MS = 5 * 60 * 1000;

const CANADA_ZONES = new Set([
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
  'America/Iqaluit',
  'America/Pangnirtung',
  'America/Atikokan',
  'America/Winnipeg',
  'America/Rainy_River',
  'America/Resolute',
  'America/Rankin_Inlet',
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

const US_ZONES = new Set([
  'America/New_York',
  'America/Detroit',
  'America/Chicago',
  'America/Menominee',
  'America/Denver',
  'America/Boise',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Juneau',
  'America/Sitka',
  'America/Metlakatla',
  'America/Yakutat',
  'America/Nome',
  'America/Adak',
  'America/Puerto_Rico',
  'Pacific/Honolulu',
]);

// Prefixes for US zones named after states (Indiana, Kentucky, North Dakota).
const US_ZONE_PREFIXES = ['America/Indiana/', 'America/Kentucky/', 'America/North_Dakota/'];

const NORWAY_ZONES = new Set(['Europe/Oslo', 'Arctic/Longyearbyen']);

const SWEDEN_ZONES = new Set(['Europe/Stockholm']);

// Finland (and Åland): FMI, through the site's own broker (fmi.ts): FMI's
// feed doesn't let browsers read it.
const FINLAND_ZONES = new Set(['Europe/Helsinki', 'Europe/Mariehamn']);

/** Finland (and Åland), by time zone. */
export function inFinland(timezone: string): boolean {
  return FINLAND_ZONES.has(timezone);
}

/** The warnings service for a place in this time zone, if there is one. */
export function warningSourceFor(timezone: string): WarningSource | undefined {
  if (CANADA_ZONES.has(timezone)) return 'eccc';
  if (US_ZONES.has(timezone) || US_ZONE_PREFIXES.some((prefix) => timezone.startsWith(prefix))) {
    return 'nws';
  }
  if (NORWAY_ZONES.has(timezone)) return 'metno';
  if (SWEDEN_ZONES.has(timezone)) return 'smhi';
  if (FINLAND_ZONES.has(timezone)) return 'fmi';
  return undefined;
}

type Fetcher = (lat: number, lng: number, signal?: AbortSignal) => Promise<WeatherWarning[]>;

// A failed load (offline, a new version deployed) rejects like a failed
// request: the panel says the warnings couldn't be checked.
const FETCHERS: Record<WarningSource, () => Promise<Fetcher>> = {
  eccc: () => import('./eccc').then((module) => module.fetchEcccWarnings),
  nws: () => import('./nws').then((module) => module.fetchNwsWarnings),
  metno: () => import('./metno').then((module) => module.fetchMetnoWarnings),
  smhi: () => import('./smhi').then((module) => module.fetchSmhiWarnings),
  fmi: () => import('./fmi').then((module) => module.fetchFmiWarnings),
};

export interface Warnings {
  source: WarningSource;
  /** Most serious first; empty when none are in effect. */
  warnings: WeatherWarning[];
}

const cache = new Map<string, { expiresAt: number; result: Warnings }>();

/** Warnings in effect at a point; undefined where no service covers it. */
export async function fetchWarnings(
  lat: number,
  lng: number,
  timezone: string,
  signal?: AbortSignal,
): Promise<Warnings | undefined> {
  const source = warningSourceFor(timezone);
  if (!source) return undefined;

  const key = `${source}:${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const fetchFrom = await FETCHERS[source]();
  const warnings = await fetchFrom(lat, lng, signal);
  warnings.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const result = { source, warnings };
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
  return result;
}
