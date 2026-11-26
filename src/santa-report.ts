// The Santa easter egg's report (santa.ts), loaded on demand by panel.ts:
// few ever see it, so it stays out of the start-up code.

import { el, iconEl } from './dom';
import { plural, t } from './i18n';
import type { Forecast } from './weather/api';

// Gusts (m/s) that make the sleigh ride bumpy, then too rough to fly.
const BUMPY_GUSTS = 10;
const STORMY_GUSTS = 17;

// WMO weather codes: fog, and snow (falling or showers).
const FOG = new Set([45, 48]);
const SNOW = new Set([71, 73, 75, 77, 85, 86]);

/** The workshop report, from the real weather there. */
export function renderSanta(forecast: Forecast): HTMLElement {
  const heading = el('h3', 'section-title', t("Santa's workshop"));
  heading.id = 'santa-title';
  heading.append(' ', iconEl('🎅', 'santa__icon'));

  const lines = el('ul', 'santa__lines');
  for (const text of [
    sleighLine(forecast),
    reindeerLine(forecast),
    elvesLine(forecast.current.time),
  ]) {
    lines.append(el('li', undefined, text));
  }

  const section = el('section', 'forecast-section santa');
  section.setAttribute('aria-labelledby', 'santa-title');
  section.append(heading, lines);
  return section;
}

function sleighLine(forecast: Forecast): string {
  const gusts = forecast.current.wind_gusts_10m ?? forecast.current.wind_speed_10m;
  if (gusts >= STORMY_GUSTS) return t('Sleigh flying conditions: stormy, reindeer on standby');
  if (gusts >= BUMPY_GUSTS) return t('Sleigh flying conditions: bumpy, hold on to the presents');
  return t('Sleigh flying conditions: excellent');
}

function reindeerLine(forecast: Forecast): string {
  const code = forecast.current.weather_code;
  if (FOG.has(code)) return t('Reindeer visibility: foggy, follow the bright red nose');
  if (SNOW.has(code)) return t('Reindeer visibility: snowy');
  return t('Reindeer visibility: good');
}

/**
 * Days to Christmas Eve (24 December, when Christmas is celebrated in
 * Finland), from the place's own date ("2026-11-15T14:00").
 */
export function daysToChristmasEve(localTime: string): number {
  const [year, month, day] = localTime.slice(0, 10).split('-').map(Number);
  const today = Date.UTC(year, month - 1, day);
  // Past this year's Christmas (after the 26th): next year's.
  const eveYear = month === 12 && day > 26 ? year + 1 : year;
  return Math.round((Date.UTC(eveYear, 11, 24) - today) / (24 * 60 * 60 * 1000));
}

function elvesLine(localTime: string): string {
  const days = daysToChristmasEve(localTime);
  // 24th to 26th: Christmas.
  if (days <= 0) return t('The elves are resting: merry Christmas!');
  return plural(
    days,
    'Elves: busy, {count} day to Christmas Eve',
    'Elves: busy, {count} days to Christmas Eve',
  );
}
