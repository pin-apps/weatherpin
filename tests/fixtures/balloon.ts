// The winds a balloon rides (src/balloon/winds.ts), made up: the same
// everywhere, from the west, faster the higher (850 hPa 15 m/s, 700 hPa
// 25 m/s, 500 hPa 35 m/s), overcast and dry below, so a flight goes due
// east for the whole 5 days. Hourly from midnight UTC on the test day.

const START = Date.UTC(2026, 10, 15);
const HOURS = 7 * 24;
const SPEED: Record<string, number> = { '850': 15, '700': 25, '500': 35 };
const TEMPERATURE: Record<string, number> = { '850': -8, '700': -18, '500': -30 };

export interface BalloonWindsOptions {
  /** A thunderstorm below from this hour of the data on (0 = midnight UTC on the test day). */
  thunderFrom?: number;
}

/** An answer to a winds request (`hourly=wind_speed_850hPa,…`). */
export function balloonWindsFixture(url: URL, options: BalloonWindsOptions = {}) {
  const asked = (url.searchParams.get('hourly') ?? '').split(',');
  const time = Array.from({ length: HOURS }, (_, i) =>
    new Date(START + i * 3600 * 1000).toISOString().slice(0, 16),
  );
  const every = (value: number | ((hour: number) => number)) =>
    time.map((_, hour) => (typeof value === 'function' ? value(hour) : value));
  const hourly: Record<string, unknown[]> = { time };
  for (const name of asked) {
    const level = /_(\d+)hPa$/.exec(name)?.[1];
    if (name.startsWith('wind_speed_') && level) hourly[name] = every(SPEED[level]);
    else if (name.startsWith('wind_direction_')) hourly[name] = every(270);
    else if (name.startsWith('temperature_') && level) hourly[name] = every(TEMPERATURE[level]);
    else if (name.startsWith('cloud_cover_')) hourly[name] = every(80);
    else if (name === 'weather_code') {
      const { thunderFrom } = options;
      hourly[name] = every((hour) => (thunderFrom != null && hour >= thunderFrom ? 95 : 3));
    } else if (name === 'temperature_2m') hourly[name] = every(2);
    else if (name === 'precipitation') hourly[name] = every(0);
  }
  return { latitude: Number(url.searchParams.get('latitude')), hourly };
}
