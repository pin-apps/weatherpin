// Frost hints under "What to wear", from the hourly forecast (no request):
// - "Scrape the windscreen tomorrow morning": a clear, calm night near or
//   below freezing, when frost forms on cars (from 15:00 until the morning).
// - "Frost tonight (−2 °C): bring the balcony plants in": a night at 0 °C or
//   below in spring and autumn, when plants are outside (from noon).
// Hints, not forecasts of frost itself: the limits are rules of thumb.

import { currentHourIndex, type Forecast } from './api';
import { formatTemperature } from '../format';
import { t } from '../i18n';

export interface FrostHint {
  icon: string;
  /** Translated. */
  text: string;
}

// Frost on a car: the air near freezing (glass cools below the air on a
// clear night), a clear sky (WMO codes 0 and 1) and little wind (it stirs
// warmer air down). Or a properly cold night whatever the sky.
const CAR_FROST_C = 1;
const CLEAR_CODES = 1;
const CALM_MS = 3;
const HARD_FROST_C = -3;
// Plants: the air at freezing.
const PLANT_FROST_C = 0;
// The morning ends at 09:00; the windscreen hint shows from 15:00, the
// plants one from noon.
const MORNING_END = 9;
const CAR_FROM_HOUR = 15;
const PLANTS_FROM_HOUR = 12;
// Months plants may be outside on a frosty night: spring and autumn in the
// north (April–June, September–October), six months later in the south.
const NORTH_PLANT_MONTHS = new Set([4, 5, 6, 9, 10]);

export function frostHints(forecast: Forecast): FrostHint[] {
  const hour = currentHourIndex(forecast);
  if (hour === -1) return [];
  const night = nightHours(forecast, hour);
  const hourNow = Number(forecast.current.time.slice(11, 13));
  const hints: FrostHint[] = [];

  if (
    (hourNow >= CAR_FROM_HOUR || hourNow < MORNING_END) &&
    night.some((i) => carFrost(forecast, i))
  ) {
    hints.push({
      icon: '🚗',
      text:
        hourNow < MORNING_END
          ? t('Frost on car windscreens this morning')
          : t('Scrape the windscreen tomorrow morning'),
    });
  }

  if (hourNow >= PLANTS_FROM_HOUR && plantSeason(forecast)) {
    const temps = night
      .map((i) => forecast.hourly.temperature_2m[i])
      .filter((temp): temp is number => temp != null);
    const coldest = Math.min(...temps);
    if (temps.length > 0 && coldest <= PLANT_FROST_C) {
      hints.push({
        icon: '🌱',
        text: t('Frost tonight ({temp}): bring the balcony plants in', {
          temp: formatTemperature(coldest),
        }),
      });
    }
  }
  return hints;
}

/** Indexes of the hours from now until the coming 09:00 (not included). */
function nightHours(forecast: Forecast, hour: number): number[] {
  const times = forecast.hourly.time;
  const indexes = [hour];
  for (let i = hour + 1; i < times.length; i++) {
    if (Number(times[i].slice(11, 13)) === MORNING_END) break;
    indexes.push(i);
  }
  return indexes;
}

/** Frost likely on a car at hour `i`: only hours of the night count. */
function carFrost(forecast: Forecast, i: number): boolean {
  const clock = Number(forecast.hourly.time[i].slice(11, 13));
  if (clock >= MORNING_END && clock < CAR_FROM_HOUR) return false;
  const temp = forecast.hourly.temperature_2m[i];
  if (temp == null) return false;
  if (temp <= HARD_FROST_C) return true;
  const code = forecast.hourly.weather_code[i];
  const wind = forecast.hourly.wind_speed_10m?.[i];
  return (
    temp <= CAR_FROST_C && code != null && code <= CLEAR_CODES && wind != null && wind < CALM_MS
  );
}

/** Spring or autumn where the place is, by its latitude. */
function plantSeason(forecast: Forecast): boolean {
  const month = Number(forecast.current.time.slice(5, 7));
  const northernMonth = forecast.latitude < 0 ? ((month + 5) % 12) + 1 : month;
  return NORTH_PLANT_MONTHS.has(northernMonth);
}
