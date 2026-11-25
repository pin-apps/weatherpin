// The name of a tapped point ("Espoo, Finland"), from OpenStreetMap's
// Nominatim: https://nominatim.org/release-docs/latest/api/Reverse/
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// at most one request per second, no bulk use, credit OpenStreetMap. One
// lookup per tap, cached, and spaced out here. A name is extra: any
// failure just leaves the coordinates.

import { currentLanguage } from '../i18n';

const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Town level: "Espoo", not a street or a district.
const ZOOM = 10;

// The policy's limit, with a little room.
const MIN_INTERVAL_MS = 1100;

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  country?: string;
}

const cache = new Map<string, string | undefined>();
let lastRequestAt = 0;

/** "Espoo, Finland" for a point, or undefined (at sea, or on any failure). */
export async function placeNameAt(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const language = currentLanguage();
  // About 1 km, like the place links.
  const key = `${language}:${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);

  try {
    await waitForTurn(signal);
    lastRequestAt = Date.now();
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: lat.toFixed(5),
      lon: lng.toFixed(5),
      zoom: String(ZOOM),
      // All the place's own names (name:en, int_name…),
      // for when there's none in the app's language.
      namedetails: '1',
      // OpenStreetMap tags Norwegian names name:nb or name:no.
      'accept-language': language === 'nb' ? 'nb,no' : language,
    });
    const response = await fetch(`${REVERSE_URL}?${params}`, { signal });
    if (!response.ok) return undefined;
    const data = (await response.json()) as NominatimPlace;
    const name = nameFrom(data, language);
    cache.set(key, name);
    return name;
  } catch {
    return undefined;
  }
}

interface NominatimPlace {
  name?: string;
  address?: NominatimAddress;
  /** The place's names by tag: "name", "name:en", "int_name"… */
  namedetails?: Record<string, string>;
}

// Readable for the app's languages (all in Latin letters): letters, digits,
// marks, punctuation and spaces only.
const LATIN = /^[\p{Script=Latin}\p{M}\p{N}\p{P}\s]+$/u;

/**
 * The town (or the nearest named area) and the country, readable in the
 * app's language: where the local name is in another script (北京市), the
 * place's name in the app's language, in English or its international
 * name; failing those, the country alone (always translated).
 */
function nameFrom(data: NominatimPlace, language: string): string | undefined {
  const address = data.address;
  if (!address) return undefined;
  const local =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.municipality ??
    address.county ??
    data.name;
  // The other names belong to the place Nominatim returned: use them only
  // when that's the one named.
  const details = !local || local === data.name ? (data.namedetails ?? {}) : {};
  const place = [local, details[`name:${language}`], details['name:en'], details.int_name].find(
    (name): name is string => !!name && LATIN.test(name),
  );
  // Nominatim translates country names (accept-language).
  const country = address.country;
  if (!place) return country;
  return country && country !== place ? `${place}, ${country}` : place;
}

/** Waits until a second has passed since the last request (abortable). */
function waitForTurn(signal?: AbortSignal): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, wait);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    });
  });
}
