// "Rain starting around 14:45" / "Rain stopping around 15:30": the next few
// hours in 15-minute steps (Open-Meteo's minutely_15; real 15-minute models
// in Europe and North America, spread from hourly values elsewhere, hence
// "around"). Nothing to say (dry, or rain all along) says nothing.

import { formatClockTime } from '../format';
import type { Forecast } from './api';
import { t } from '../i18n';

/** How far ahead to look: 3 hours of 15-minute steps. */
export const NOWCAST_STEPS = 12;

// Per 15 minutes: 0.1 mm is light rain (0.4 mm an hour); less is a few
// drops a forecast can't place to the quarter hour.
const WET_MM = 0.1;

export function nowcast(forecast: Forecast): string | null {
  const steps = forecast.minutely_15;
  if (!steps?.time?.length || !steps.precipitation) return null;
  // The step that holds "now" (both are local times, same format).
  const start = steps.time.findIndex((time) => time >= forecast.current.time);
  if (start === -1) return null;
  const end = Math.min(start + NOWCAST_STEPS, steps.time.length);

  const wet = (i: number) => (steps.precipitation[i] ?? 0) >= WET_MM;
  const snow = (i: number) => (steps.snowfall?.[i] ?? 0) > 0;

  for (let i = start + 1; i < end; i++) {
    if (wet(i) !== wet(start)) {
      const time = formatClockTime(steps.time[i]);
      if (wet(start)) {
        return snow(start)
          ? t('Snow stopping around {time}', { time })
          : t('Rain stopping around {time}', { time });
      }
      return snow(i)
        ? t('Snow starting around {time}', { time })
        : t('Rain starting around {time}', { time });
    }
  }
  return null;
}
