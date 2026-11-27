// "🍃 Weather haiku": a three-line poem about the weather there now, put
// together from haiku-lines.ts: an opening for the light or the season,
// then a middle and a closing line from the one weather group that fits
// best (thunder before snow before rain…), so the poem keeps to one
// subject. Loaded on demand with the card (quip-buttons.ts).

import { currentLanguage } from '../i18n';
import type { Forecast } from '../weather/api';
import { OPENINGS, VERSES, type Group, type Light, type Season } from './haiku-lines';

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const FOG_CODES = new Set([45, 48]);
const THUNDER_FROM = 95;
const WINDY = 8; // m/s
const GUSTY = 14; // m/s
const HARD_FROST = -10; // °C
const HOT = 28; // °C
const TWILIGHT_MINUTES = 90; // after sunrise / before sunset
const TROPICS = 23.5; // degrees: no seasons to speak of
const FULL_DAY = 24 * 60 * 60 - 60; // seconds

export interface Scene {
  light: Light;
  season?: Season;
  group: Group;
}

/** The weather group, light and season of the weather now. */
export function sceneFor(forecast: Forecast): Scene {
  return { light: lightOf(forecast), season: seasonOf(forecast), group: groupOf(forecast) };
}

function groupOf({ current: now }: Forecast): Group {
  const code = now.weather_code;
  if (code >= THUNDER_FROM) return 'thunder';
  if (SNOW_CODES.has(code) || (now.snowfall ?? 0) > 0) return 'snow';
  if (now.precipitation >= 0.1 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'rain';
  }
  if (FOG_CODES.has(code)) return 'fog';
  if (now.wind_speed_10m >= WINDY || (now.wind_gusts_10m ?? 0) >= GUSTY) return 'wind';
  if (now.temperature_2m <= HARD_FROST) return 'frost';
  if (now.temperature_2m >= HOT) return 'heat';
  if (code <= 1) return now.is_day === 1 ? 'clearDay' : 'clearNight';
  return 'grey';
}

function lightOf({ current: now, daily }: Forecast): Light {
  const daylight = daily.daylight_duration[0];
  if (daylight === 0) return 'polarNight';
  if (daylight != null && daylight >= FULL_DAY) return 'midnightSun';
  if (now.is_day !== 1) return 'night';
  // Local wall-clock times, compared as such.
  const minutes = (from: string, to: string) =>
    (Date.parse(`${to}Z`) - Date.parse(`${from}Z`)) / 60_000;
  if (daily.sunrise[0] && minutes(daily.sunrise[0], now.time) < TWILIGHT_MINUTES) return 'dawn';
  if (daily.sunset[0] && minutes(now.time, daily.sunset[0]) < TWILIGHT_MINUTES) return 'dusk';
  return 'day';
}

/** Meteorological seasons by the local month, flipped in the south. */
function seasonOf({ current: now, latitude }: Forecast): Season | undefined {
  if (Math.abs(latitude) < TROPICS) return undefined;
  const month = Number(now.time.slice(5, 7)) - 1;
  const shifted = latitude < 0 ? (month + 6) % 12 : month;
  const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn'];
  return seasons[Math.floor(((shifted + 1) % 12) / 3)];
}

/**
 * A round of poems, lines joined with newlines: one per middle line of the
 * group (so none repeats within the round), in a random order.
 */
export function haikuFor(forecast: Forecast): string[] {
  const scene = sceneFor(forecast);
  const language = currentLanguage();
  const openings = OPENINGS.filter(
    (opening) =>
      opening.light === scene.light || (opening.season != null && opening.season === scene.season),
  );
  const { middle, last } = VERSES[scene.group];
  const firsts = shuffled(openings);
  const lasts = shuffled([...last]);
  return shuffled([...middle]).map((line, i) =>
    [firsts[i % firsts.length], { text: line }, { text: lasts[i % lasts.length] }]
      .map(({ text }) => text[language])
      .join('\n'),
  );
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
