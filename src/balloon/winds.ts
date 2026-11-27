// The winds a balloon rides: Open-Meteo's forecast at a pressure level
// (850 hPa ≈ 1.5 km, 700 ≈ 3 km, 500 ≈ 5.5 km), hour by hour for the next
// week at one point, plus the conditions there (temperature, cloud) and on
// the ground below (weather, temperature, precipitation). Times in UTC.
// One request per point; cached 10 minutes, so a second launch nearby (or
// at another height, asked for together at the launch place) is free.

export type Level = 850 | 700 | 500;
export const LEVELS: readonly Level[] = [850, 700, 500];

export interface Winds {
  lat: number;
  lng: number;
  /** UTC hours, "2026-11-27T14:00". */
  time: string[];
  hourly: Record<string, (number | null)[] | undefined>;
}

/** What the balloon meets at one hour at one place. */
export interface Conditions {
  /** m/s */
  windSpeed: number;
  /** Degrees the wind blows from. */
  windFrom: number;
  /** °C at the balloon's height. */
  temperature?: number;
  /** % of the sky at that height in cloud. */
  cloud?: number;
  /** The ground below: WMO weather code, °C, mm in the hour. */
  groundCode?: number;
  groundTemperature?: number;
  precipitation: number;
}

const HOUR_MS = 3600 * 1000;
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; winds: Promise<Winds> }>();

const levelVariables = (level: Level) =>
  ['wind_speed', 'wind_direction', 'temperature', 'cloud_cover'].map(
    (name) => `${name}_${level}hPa`,
  );

/** The winds at a point for these heights (one request, cached). */
export function fetchWinds(lat: number, lng: number, levels: readonly Level[]): Promise<Winds> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${levels.join('/')}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.winds;
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lng.toFixed(2),
    hourly: [
      ...levels.flatMap(levelVariables),
      'weather_code',
      'temperature_2m',
      'precipitation',
    ].join(','),
    wind_speed_unit: 'ms',
    timezone: 'GMT',
    forecast_days: '7',
  });
  const winds = fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Winds: HTTP ${response.status}`);
      return response.json() as Promise<{ hourly: Record<string, unknown[]> }>;
    })
    .then(({ hourly }) => ({
      lat,
      lng,
      time: (hourly.time ?? []) as string[],
      hourly: hourly as Winds['hourly'],
    }));
  cache.set(key, { at: Date.now(), winds });
  // A failure isn't kept: the next try asks again.
  winds.catch(() => cache.delete(key));
  return winds;
}

/** The conditions at `at` (ms, UTC) at this height; undefined past the data. */
export function conditionsAt(winds: Winds, level: Level, at: number): Conditions | undefined {
  const first = Date.parse(`${winds.time[0]}Z`);
  const index = Math.round((at - first) / HOUR_MS);
  if (!(index >= 0 && index < winds.time.length)) return undefined;
  const value = (name: string) => winds.hourly[name]?.[index] ?? undefined;
  const windSpeed = value(`wind_speed_${level}hPa`);
  const windFrom = value(`wind_direction_${level}hPa`);
  if (windSpeed == null || windFrom == null) return undefined;
  return {
    windSpeed,
    windFrom,
    temperature: value(`temperature_${level}hPa`),
    cloud: value(`cloud_cover_${level}hPa`),
    groundCode: value('weather_code'),
    groundTemperature: value('temperature_2m'),
    precipitation: value('precipitation') ?? 0,
  };
}
