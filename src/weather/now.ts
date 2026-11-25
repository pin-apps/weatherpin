// The weather right now at several places in one request (Open-Meteo takes
// comma-separated coordinates), for the temperatures in the favourites
// list. Small: only the current temperature and weather code.

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Same freshness as the full forecast's cache.
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface WeatherNow {
  /** °C */
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

interface Place {
  lat: number;
  lng: number;
}

interface CurrentResponse {
  current?: { temperature_2m?: unknown; weather_code?: unknown; is_day?: unknown };
}

const cache = new Map<string, { expiresAt: number; now: WeatherNow }>();

// About 1 km, like the place links; also the cache key.
const keyFor = ({ lat, lng }: Place) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

/**
 * The weather now at each place, in the same order (undefined where it
 * couldn't be read). Places cached in the last 10 minutes aren't asked for
 * again. Rejects only when the request itself fails.
 */
export async function fetchWeatherNow(
  places: Place[],
  signal?: AbortSignal,
): Promise<(WeatherNow | undefined)[]> {
  const fresh = (place: Place) => {
    const cached = cache.get(keyFor(place));
    return cached && cached.expiresAt > Date.now() ? cached.now : undefined;
  };
  const missing = [...new Set(places.filter((place) => !fresh(place)).map(keyFor))];

  if (missing.length > 0) {
    const params = new URLSearchParams({
      latitude: missing.map((key) => key.split(',')[0]).join(','),
      longitude: missing.map((key) => key.split(',')[1]).join(','),
      current: 'temperature_2m,weather_code,is_day',
      timezone: 'auto',
      temperature_unit: 'celsius',
    });
    const response = await fetch(`${FORECAST_URL}?${params}`, { signal });
    if (!response.ok) throw new Error(`Weather service error (HTTP ${response.status}).`);
    const data = (await response.json()) as CurrentResponse | CurrentResponse[];
    // One place comes back as an object, several as a list.
    const answers = Array.isArray(data) ? data : [data];
    missing.forEach((key, i) => {
      const current = answers[i]?.current;
      if (typeof current?.temperature_2m !== 'number') return;
      cache.set(key, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        now: {
          temperature: current.temperature_2m,
          weatherCode: typeof current.weather_code === 'number' ? current.weather_code : -1,
          isDay: current.is_day !== 0,
        },
      });
    });
  }
  return places.map(fresh);
}
