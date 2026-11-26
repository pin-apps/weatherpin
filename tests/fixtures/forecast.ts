// A made-up but realistic Open-Meteo forecast response (same shape as the
// real API), so tests never depend on live weather. Local times are Oslo's.

export type ForecastKind = 'normal' | 'polar-night';

const DAYS = 7;
const START_DATE = '2026-11-15';
/** Matches the frozen test clock: 13:05 UTC is 14:05 in Oslo (UTC+1). */
const CURRENT_TIME = `${START_DATE}T14:00`;

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const pad = (n: number) => String(n).padStart(2, '0');

// Cycles through a few weather codes so icons vary across hours and days.
const UV_BY_HOUR: Record<string, number> = {
  '09': 0.3,
  '10': 1.2,
  '11': 2.5,
  '12': 3.4,
  '13': 2.8,
  '14': 1.2,
};

const CODES = [0, 1, 2, 3, 61, 71, 95];

const CLEAR_NIGHT = new Set(
  ['15T22', '15T23', '16T00', '16T01'].map((hour) => `2026-11-${hour}:00`),
);

export function forecastFixture(kind: ForecastKind = 'normal') {
  const polar = kind === 'polar-night';

  const hourlyTime: string[] = [];
  for (let day = 0; day < DAYS; day++) {
    for (let hour = 0; hour < 24; hour++) {
      hourlyTime.push(`${addDays(START_DATE, day)}T${pad(hour)}:00`);
    }
  }
  const dates = Array.from({ length: DAYS }, (_, day) => addDays(START_DATE, day));

  return {
    latitude: polar ? 78.22 : 59.91,
    longitude: polar ? 15.65 : 10.75,
    timezone: polar ? 'Arctic/Longyearbyen' : 'Europe/Oslo',
    timezone_abbreviation: 'GMT+1',
    utc_offset_seconds: 3600,
    elevation: polar ? 9 : 23,
    current: {
      time: CURRENT_TIME,
      interval: 900,
      temperature_2m: polar ? -12.4 : 4.6,
      apparent_temperature: polar ? -19.8 : 1.2,
      relative_humidity_2m: 81,
      precipitation: 0.2,
      weather_code: 61,
      wind_speed_10m: 5.7,
      wind_direction_10m: 225,
      wind_gusts_10m: polar ? 14.0 : 11.2,
      // Snow falling only in the polar fixture (cm in the last hour).
      snowfall: polar ? 0.4 : 0,
      snow_depth: 0,
      is_day: polar ? 0 : 1,
      // 1.8 hPa below 3 hours earlier (hourly[11]): "falling".
      pressure_msl: 1003.6,
      // Oslo is ~20 m up: a little lower than at sea level.
      surface_pressure: 1001.2,
      uv_index: polar ? 0 : 1.2,
    },
    hourly: {
      time: hourlyTime,
      temperature_2m: hourlyTime.map(
        (_, i) => Math.round(4 + 3 * Math.sin(i / 4)) - (polar ? 16 : 0),
      ),
      weather_code: hourlyTime.map((_, i) => CODES[Math.floor(i / 3) % CODES.length]),
      precipitation_probability: hourlyTime.map((_, i) => (i % 5 === 0 ? 40 : 0)),
      precipitation: hourlyTime.map((_, i) => (i % 5 === 0 ? 0.4 : 0)),
      // Slowly falling pressure, 0.6 hPa per hour.
      pressure_msl: hourlyTime.map((_, i) => Math.round((1012 - i * 0.6) * 10) / 10),
      // Low winter UV around midday, peaking at 3.4 at 12:00 (1.2 at 14:00,
      // the current hour); none in polar night.
      uv_index: hourlyTime.map((time) => (polar ? 0 : (UV_BY_HOUR[time.slice(11, 13)] ?? 0))),
      // 14:00 (index 14): 5 m/s from 340° (NNW).
      wind_speed_10m: hourlyTime.map((_, i) => 3 + (i % 4)),
      wind_direction_10m: hourlyTime.map((_, i) => (200 + i * 10) % 360),
      // Cloudy, except a clear night from 22:00 to 02:00 (stargazing and
      // the northern lights, render/sky.ts).
      cloud_cover: hourlyTime.map((time): number => (CLEAR_NIGHT.has(time) ? 10 : 80)),
      is_day: hourlyTime.map((time) => {
        const hour = Number(time.slice(11, 13));
        return !polar && hour >= 9 && hour < 15 ? 1 : 0;
      }),
    },
    // From 14:00: rain now, stopping at 14:45 ("Rain stopping around 14:45").
    minutely_15: {
      time: Array.from({ length: 16 }, (_, i) => {
        const minutes = 14 * 60 + i * 15;
        return `${START_DATE}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
      }),
      precipitation: [0.2, 0.3, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((mm) =>
        polar ? 0 : mm,
      ),
      snowfall: Array.from({ length: 16 }, () => 0),
    },
    daily: {
      time: dates,
      weather_code: dates.map((_, i) => CODES[i % CODES.length]),
      temperature_2m_max: dates.map((_, i) => (polar ? -10 : 6) + (i % 3)),
      temperature_2m_min: dates.map((_, i) => (polar ? -18 : -1) + (i % 2)),
      // Heavy rain on days that also have a UV badge (and, on day 6, snow):
      // the widest 7-day rows (issue #47).
      precipitation_sum: dates.map((_, i) => [12.3, 0, 1.2, 0.7, 0, 30.4, 1.2][i]),
      // Snow on day 3 (2.1 cm) and day 6 (0.6 cm).
      snowfall_sum: dates.map((_, i) => [0, 0, 2.1, 0, 0, 0.6, 0][i]),
      // In polar night Open-Meteo sends placeholder midnight times.
      sunrise: dates.map((date) => `${date}T${polar ? '00:00' : '08:35'}`),
      sunset: dates.map((date) => `${date}T${polar ? '00:00' : '15:40'}`),
      // 7 h 05 min today, 4 min shorter each day (November in the north).
      daylight_duration: dates.map((_, i) => (polar ? 0 : 25_500 - i * 240)),
      // Rounded: 3, 1, 2, 5, 1, 6, 1. Badges from 3 up: days 1, 4 and 6.
      uv_index_max: dates.map((_, i) => (polar ? 0 : [3.4, 0.8, 2.4, 5.2, 1.0, 6.4, 0.5][i])),
    },
  };
}
