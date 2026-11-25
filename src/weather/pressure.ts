import { currentHourIndex, type Forecast } from './api';
import { msg } from '../i18n';

export type PressureTrend = 'rising' | 'falling' | 'steady';

// The words shown for each trend (translated where shown).
msg('rising');
msg('falling');
msg('steady');

// Compare with this many hours earlier, like a barometer's 3-hour tendency.
const TREND_HOURS = 3;

// Smaller changes than this (in hPa) count as steady.
const TREND_THRESHOLD_HPA = 1;

/**
 * Whether air pressure is rising, falling or steady over the last 3 hours.
 * A falling barometer is the classic sign of the weather turning. Null when
 * there's no earlier value: the hourly data starts at midnight local time.
 */
export function pressureTrend(forecast: Forecast): PressureTrend | null {
  const index = currentHourIndex(forecast);
  if (index < TREND_HOURS) return null;

  const earlier = forecast.hourly.pressure_msl[index - TREND_HOURS];
  if (earlier == null) return null;

  const change = forecast.current.pressure_msl - earlier;
  if (change > TREND_THRESHOLD_HPA) return 'rising';
  if (change < -TREND_THRESHOLD_HPA) return 'falling';
  return 'steady';
}
