import { currentLanguage, t } from '../i18n';
// Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
// Finds places (cities, towns, villages, postcodes), not street addresses.
// Data is based on GeoNames.
const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const MAX_RESULTS = 5;

// Place names don't change; cache longer than forecasts to save requests
// while typing back and forth.
const CACHE_TTL_MS = 60 * 60 * 1000;

/** The API sends fewer than 2 characters back empty, so don't ask. */
export const MIN_QUERY_LENGTH = 2;

export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  // The API leaves out fields that are empty, so these may be missing.
  country?: string;
  /** ISO 3166-1 alpha-2, e.g. "NO". */
  country_code?: string;
  /** First-level region, e.g. a state or county. */
  admin1?: string;
  /** GeoNames feature code, e.g. "PPLC" (capital) or "PCLI" (country). */
  feature_code?: string;
}

export class GeocodingError extends Error {}

interface CacheEntry {
  expiresAt: number;
  places: Place[];
}

const cache = new Map<string, CacheEntry>();

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const name = query.trim();
  if (name.length < MIN_QUERY_LENGTH) return [];

  const key = name.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  const params = new URLSearchParams({
    name,
    count: String(MAX_RESULTS),
    // Place and country names in the app's language ("Helsingfors" or
    // "Helsinki", "Norway" or "Norja").
    // GeoNames files Norwegian names under "no", not "nb".
    language: currentLanguage() === 'nb' ? 'no' : currentLanguage(),
    format: 'json',
  });

  let response: Response;
  try {
    response = await fetch(`${SEARCH_URL}?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new GeocodingError(t('Could not reach the place search. Check your connection.'));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { reason?: string } | null;
    throw new GeocodingError(body?.reason ?? `Place search error (HTTP ${response.status}).`);
  }

  // With no matches the API leaves out "results" entirely.
  const data = (await response.json()) as { results?: Place[] };
  const places = Array.isArray(data.results) ? data.results : [];

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, places });
  return places;
}

/** Secondary line for a place, e.g. "Minnesota, United States". */
export function describeRegion(place: Place): string {
  const parts = [place.admin1, place.country].filter(
    (part): part is string => Boolean(part) && part !== place.name,
  );
  // Avoid "Oslo, Oslo, Norway"-style repeats.
  return [...new Set(parts)].join(', ');
}

/** Short label for the panel title, e.g. "Oslo, Norway". */
export function placeLabel(place: Place): string {
  return place.country ? `${place.name}, ${place.country}` : place.name;
}

/** Flag emoji from a country code ("NO" → 🇳🇴); empty if there's no code. */
export function flagEmoji(countryCode?: string): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) return '';
  // Each letter maps to its "regional indicator" symbol; a pair renders as a flag.
  const REGIONAL_INDICATOR_A = 0x1f1e6;
  return [...countryCode.toUpperCase()]
    .map((letter) => String.fromCodePoint(REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65))
    .join('');
}

/** Map zoom that suits the kind of place: countries wide, towns close. */
export function zoomForPlace(place: Place): number {
  const code = place.feature_code ?? '';
  if (code.startsWith('PCL')) return 5; // country
  if (code === 'ADM1') return 7; // state / region
  return 10; // city, town, village, postcode
}
