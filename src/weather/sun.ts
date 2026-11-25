import { formatClockTime, formatDuration } from '../format';
import { t } from '../i18n';

const SECONDS_PER_DAY = 24 * 60 * 60;

/**
 * Label/value rows describing the sun for one day.
 *
 * In polar night and midnight sun Open-Meteo still returns sunrise/sunset,
 * but as placeholder midnight times, so daylight_duration decides the case.
 * On transition days the sun can rise and set on different dates; a time
 * that isn't on `date` means there is no sunrise/sunset that day.
 */
export function describeSun(
  date: string,
  sunrise: string,
  sunset: string,
  daylightSeconds: number | null,
  tomorrowDaylightSeconds: number | null = null,
): [label: string, value: string][] {
  const isToday = (time: string) => time.startsWith(date);
  const sunTimes: [string, string][] = [
    [t('Sunrise'), isToday(sunrise) ? formatClockTime(sunrise) : t('No sunrise today')],
    [t('Sunset'), isToday(sunset) ? formatClockTime(sunset) : t('No sunset today')],
  ];

  // Without a daylight figure we can't tell polar days apart; show the times.
  if (daylightSeconds == null) {
    return sunTimes;
  }
  if (daylightSeconds <= 0) {
    return [[t('Sun'), t('Polar night – the sun does not rise today')]];
  }
  // Allow a minute of rounding in the API's figure.
  if (daylightSeconds >= SECONDS_PER_DAY - 60) {
    return [[t('Sun'), t('Midnight sun – the sun does not set today')]];
  }

  const change = daylightChange(daylightSeconds, tomorrowDaylightSeconds);
  const daylight = formatDuration(daylightSeconds) + (change ? ` · ${change}` : '');
  return [...sunTimes, [t('Daylight'), daylight]];
}

/**
 * How the day's length changes by tomorrow: "4 min shorter tomorrow".
 * Nothing when tomorrow is unknown or polar (no sunrise or sunset: a
 * change in minutes means nothing then).
 */
function daylightChange(today: number, tomorrow: number | null): string | undefined {
  if (tomorrow == null || tomorrow <= 0 || tomorrow >= SECONDS_PER_DAY - 60) return undefined;
  const minutes = Math.round((tomorrow - today) / 60);
  if (minutes === 0) return t('about the same tomorrow');
  return minutes > 0
    ? t('{minutes} min longer tomorrow', { minutes })
    : t('{minutes} min shorter tomorrow', { minutes: -minutes });
}
