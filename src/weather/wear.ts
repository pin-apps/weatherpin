// "What to wear": one friendly line under "Feels like", e.g. "Jacket,
// umbrella (rain from about 15:00)" or "T-shirt, sunglasses and
// sunscreen". From the weather now and the next hours. The umbrella part
// answers "do I need an umbrella?" only when it's worth thinking about:
// rain now or within 12 hours (with when), or "no umbrella needed today"
// after rain or with a small chance of it; nothing on a dry day. A hint,
// not advice: the limits are a matter of taste.

import { formatClockTime } from '../format';
import { currentHourIndex, type Forecast } from './api';
import { NOWCAST_STEPS } from './nowcast';
import { msg, t } from '../i18n';

// By the "feels like" temperature (°C, whatever the units shown): the
// highest limit it's below decides; above them all, shorts.
const CLOTHES: [below: number, text: string, icon: string][] = [
  [-10, msg('Winter gear: hat and mittens'), '🧣'],
  [0, msg('Warm coat'), '🧥'],
  [10, msg('Jacket'), '🧥'],
  [18, msg('Light jacket or sweater'), '🧶'],
  [24, msg('T-shirt'), '👕'],
];
const SHORTS: [string, string] = [msg('Shorts weather'), '🩳'];

// Rain worth an umbrella: as nowcast.ts, 0.1 mm in 15 minutes (or now).
const WET_MM = 0.1;
// Too windy for an umbrella, and cold through a plain jacket: gusts from
// 10 m/s (36 km/h, 22 mph) or a steady 8 m/s.
const WINDY_GUSTS_MS = 10;
const WINDY_MS = 8;
// When sun protection is advised (WHO): UV 3 or more.
const SUNNY_UV = 3;
// Without 15-minute data, a likely shower in the hourly forecast.
const LIKELY_PERCENT = 60;
const HOURS_AHEAD = 3;
// Rain later today worth taking an umbrella for: likely, or a lot of it.
const UMBRELLA_HOURS = 12;
const HEAVY_HOUR_MM = 1;
// A chance of rain that makes people wonder (below it, nothing is said).
const MAYBE_PERCENT = 30;
// Snow in the hourly weather codes: not umbrella weather.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export interface WearHint {
  icon: string;
  /** Translated, e.g. "Jacket, umbrella". */
  text: string;
}

export function whatToWear(forecast: Forecast): WearHint {
  const now = forecast.current;
  const match = CLOTHES.find(([below]) => now.apparent_temperature < below);
  const [clothes, icon] = match ? [match[1], match[2]] : SHORTS;

  const extras: string[] = [];
  const windy = (now.wind_gusts_10m ?? 0) >= WINDY_GUSTS_MS || now.wind_speed_10m >= WINDY_MS;
  const { wet, snow } = precipitationAhead(forecast);
  if (snow) extras.push(t('waterproof boots'));
  const umbrella = snow ? undefined : umbrellaHint(forecast, wet, windy);
  if (umbrella) extras.push(umbrella);
  if (windy && !(wet && !snow)) extras.push(t('something windproof'));
  if (sunnyAhead(forecast)) extras.push(t('sunglasses and sunscreen'));

  return { icon, text: [t(clothes), ...extras].join(', ') };
}

/** Rain or snow now or in the next 3 hours. */
function precipitationAhead(forecast: Forecast): { wet: boolean; snow: boolean } {
  const now = forecast.current;
  let wet = now.precipitation >= WET_MM;
  let snow = (now.snowfall ?? 0) > 0;

  const steps = forecast.minutely_15;
  const start = steps?.time?.findIndex((time) => time >= now.time) ?? -1;
  if (steps?.precipitation && start !== -1) {
    const end = Math.min(start + NOWCAST_STEPS, steps.time.length);
    for (let i = start; i < end; i++) {
      if ((steps.precipitation[i] ?? 0) >= WET_MM) wet = true;
      if ((steps.snowfall?.[i] ?? 0) > 0) snow = true;
    }
    return { wet, snow };
  }

  // No 15-minute steps: a likely shower in the next hours.
  const hour = currentHourIndex(forecast);
  if (hour !== -1) {
    for (let i = hour; i < hour + HOURS_AHEAD; i++) {
      if ((forecast.hourly.precipitation_probability[i] ?? 0) >= LIKELY_PERCENT) wet = true;
    }
  }
  return { wet, snow };
}

/**
 * The umbrella part, or nothing on a dry day: "umbrella (raining until
 * about 14:45)", "umbrella (rain from about 15:00)", "umbrella for later
 * (rain from about 19:00)", "a hood (too windy for an umbrella)", or "no
 * umbrella needed today" when it rained earlier or rain is possible.
 */
function umbrellaHint(forecast: Forecast, wetSoon: boolean, windy: boolean): string | undefined {
  if (wetSoon) {
    if (windy) return t('a hood (too windy for an umbrella)');
    const { raining, from, until } = rainSteps(forecast);
    if (raining)
      return until ? t('umbrella (raining until about {time})', { time: until }) : t('umbrella');
    return from ? t('umbrella (rain from about {time})', { time: from }) : t('umbrella');
  }

  const hour = currentHourIndex(forecast);
  if (hour === -1) return undefined;
  const hourly = forecast.hourly;
  // Rain later: the first likely (or heavy) rainy hour in the next 12.
  for (let i = hour + 1; i <= hour + UMBRELLA_HOURS && i < hourly.time.length; i++) {
    if (SNOW_CODES.has(hourly.weather_code[i] ?? -1)) continue;
    const likely = (hourly.precipitation_probability[i] ?? 0) >= LIKELY_PERCENT;
    const heavy = (hourly.precipitation[i] ?? 0) >= HEAVY_HOUR_MM;
    if (likely || heavy) {
      return t('umbrella for later (rain from about {time})', {
        time: formatClockTime(hourly.time[i]),
      });
    }
  }
  // Dry ahead, but people may wonder: it rained in the last hours, or
  // there's some chance of it.
  const rainedEarlier = [1, 2, 3].some(
    (back) => (hourly.precipitation[hour - back] ?? 0) >= WET_MM,
  );
  const possible = hourly.precipitation_probability
    .slice(hour + 1, hour + UMBRELLA_HOURS + 1)
    .some((chance) => (chance ?? 0) >= MAYBE_PERCENT);
  return rainedEarlier || possible ? t('no umbrella needed today') : undefined;
}

/** From the 15-minute steps: raining now (and until when), or when it starts. */
function rainSteps(forecast: Forecast): { raining: boolean; from?: string; until?: string } {
  const now = forecast.current;
  const steps = forecast.minutely_15;
  const start = steps?.time?.findIndex((time) => time >= now.time) ?? -1;
  const wetAt = (i: number) => (steps?.precipitation?.[i] ?? 0) >= WET_MM;
  if (!steps?.precipitation || start === -1) return { raining: now.precipitation >= WET_MM };
  const end = Math.min(start + NOWCAST_STEPS, steps.time.length);
  const raining = now.precipitation >= WET_MM || wetAt(start);
  for (let i = start + 1; i < end; i++) {
    if (raining && !wetAt(i)) return { raining, until: formatClockTime(steps.time[i]) };
    if (!raining && wetAt(i)) return { raining, from: formatClockTime(steps.time[i]) };
  }
  return { raining };
}

/** UV 3 or more now or in the next 3 hours. */
function sunnyAhead(forecast: Forecast): boolean {
  if ((forecast.current.uv_index ?? 0) >= SUNNY_UV) return true;
  const hour = currentHourIndex(forecast);
  if (hour === -1) return false;
  for (let i = hour; i < hour + HOURS_AHEAD; i++) {
    if ((forecast.hourly.uv_index?.[i] ?? 0) >= SUNNY_UV) return true;
  }
  return false;
}
