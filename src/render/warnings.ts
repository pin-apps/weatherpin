// Weather warnings in the panel: only official ones. A coloured box per
// warning at the top of the weather (tap to read it all); when there's none,
// a line that says why (none in effect, or not supported for this region,
// with where to look), and a status line in "More details". So "no warnings"
// is never confused with "couldn't check" or "not covered". The app makes
// no warnings of its own from the forecast.

import { el, iconEl } from '../dom';
import { formatDayTimeIn } from '../format';
import {
  SOURCE_LINKS,
  SOURCE_NAMES,
  type WarningSource,
  type WeatherWarning,
} from '../warnings/types';
import { warningSourceFor, type Warnings } from '../warnings/warnings';
import type { Forecast } from '../weather/api';
import { currentLanguage, t } from '../i18n';

/** What the panel knows about warnings for the place shown. */
export type WarningsState = Warnings | 'not-covered' | 'failed';

/**
 * The top of the weather: the official warnings, or, when there's none, a
 * line that says why (none in effect, or not supported here) with where to
 * look. So no box never reads as "all clear".
 */
export function renderWarnings(state: WarningsState, forecast: Forecast): HTMLElement {
  const section = el('section', 'warnings');
  section.setAttribute('aria-label', t('Weather warnings'));
  const official = typeof state === 'string' ? [] : state.warnings;
  for (const warning of official) {
    section.append(officialBox(warning, (state as Warnings).source, forecast.timezone));
  }
  if (official.length === 0) section.append(coverageLine(state, forecast.timezone));
  return section;
}

function officialBox(warning: WeatherWarning, source: WarningSource, timeZone: string) {
  // <details>: the title always shows, the full text on a tap; works with
  // keyboard and screen readers without any script.
  const box = el('details', `warning warning--${warning.level}`);
  const summary = el('summary', 'warning__summary');
  summary.append(iconEl('⚠', 'warning__icon'), el('span', 'warning__title', warning.title));
  // Issued ahead: "from Mon 00:00 until Mon 09:00", so it doesn't read as now.
  const ahead = warning.starts && +warning.starts > Date.now() ? warning.starts : undefined;
  const when = ahead
    ? warning.ends
      ? t('from {start} until {time}', {
          start: formatDayTimeIn(ahead, timeZone),
          time: formatDayTimeIn(warning.ends, timeZone),
        })
      : t('from {start}', { start: formatDayTimeIn(ahead, timeZone) })
    : warning.ends
      ? t('until {time}', { time: formatDayTimeIn(warning.ends, timeZone) })
      : undefined;
  if (when) summary.append(el('span', 'warning__until', ` · ${when}`));
  // Where it applies: a tap a few km away can be in another zone.
  if (warning.area) {
    summary.append(
      el(
        'span',
        'warning__area',
        warning.marine ? t('Sea area: {area}', { area: warning.area }) : warning.area,
      ),
    );
  }
  box.append(summary);

  // Issuers separate paragraphs with blank lines.
  for (const paragraph of warning.description.split(/\n\s*\n/)) {
    if (paragraph.trim()) box.append(el('p', 'warning__text', paragraph.trim()));
  }
  if (warning.instruction) {
    box.append(el('p', 'warning__instruction', warning.instruction));
  }
  box.append(issuedBy(source));
  return box;
}

/**
 * Why there's no warning box: "No official warnings in effect · MET Norway",
 * or "This app doesn't show warnings for this region. Official warnings:
 * MeteoAlarm" (no "yet": it promises nothing).
 */
function coverageLine(state: WarningsState, timeZone: string): HTMLElement {
  const line = el('p', 'warnings__coverage');
  const where = whereToLook(state, timeZone);
  let text: string;
  if (state === 'not-covered') {
    text = t("This app doesn't show warnings for this region. Official warnings:");
  } else if (state === 'failed') text = t("Official warnings couldn't be checked:");
  else text = t('No official warnings in effect ·');
  const link = el('a', undefined, where.name);
  link.href = where.href;
  line.append(`${text} `, link);
  return line;
}

const METEOALARM = { name: 'MeteoAlarm', href: 'https://meteoalarm.org/' };
// Time zones in Europe outside "Europe/…" (MeteoAlarm covers them too).
const ATLANTIC_EUROPE = new Set([
  'Atlantic/Reykjavik',
  'Atlantic/Faroe',
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
]);

/** The official service for the place, else MeteoAlarm in Europe, else WMO's. */
function whereToLook(state: WarningsState, timeZone: string): { name: string; href: string } {
  const source = typeof state === 'string' ? warningSourceFor(timeZone) : state.source;
  if (source) return { name: sourceName(source), href: sourceLink(source) };
  if (timeZone.startsWith('Europe/') || ATLANTIC_EUROPE.has(timeZone)) return METEOALARM;
  return { name: t('WMO severe weather'), href: 'https://severeweather.wmo.int/' };
}

/**
 * "Road weather: Fintraffic (Vt 4: Oulu - Kemi)", as its licence asks; the
 * link opens Fintraffic's traffic map there with road conditions shown.
 */
export function roadCredit(roads: { road: string; mapLink: string }, inline = false): HTMLElement {
  const line = el(
    inline ? 'span' : 'p',
    inline ? 'road-credit' : 'warning__source',
    `${t('Road weather:')} `,
  );
  const link = el('a', undefined, 'Fintraffic');
  link.href = roads.mapLink;
  line.append(link, ` (${roads.road})`);
  return line;
}

function issuedBy(source: WarningSource): HTMLElement {
  const line = el('p', 'warning__source', `${t('Issued by')} `);
  const link = el('a', undefined, sourceName(source));
  link.href = sourceLink(source);
  line.append(link);
  return line;
}

/** The issuer's name; FMI's in the app's language (it has official ones). */
function sourceName(source: WarningSource): string {
  return source === 'fmi' ? t('Finnish Meteorological Institute') : SOURCE_NAMES[source];
}

/** Where to read all of the source's warnings; FMI's in the app's language. */
function sourceLink(source: WarningSource): string {
  return source === 'fmi' ? FMI_WARNINGS[currentLanguage()] : SOURCE_LINKS[source];
}

// FMI's own warnings page, in the app's language.
const FMI_WARNINGS = {
  en: 'https://en.ilmatieteenlaitos.fi/warnings',
  fi: 'https://www.ilmatieteenlaitos.fi/varoitukset',
  sv: 'https://sv.ilmatieteenlaitos.fi/varningar',
  // No Norwegian pages: English.
  nb: 'https://en.ilmatieteenlaitos.fi/warnings',
} as const;

/** The "Weather warnings" line in More details. */
export function warningsStatus(state: WarningsState): string | HTMLElement {
  if (state === 'not-covered') return t('Not available for this area');
  if (state === 'failed') return t("Couldn't be checked right now");
  const count = state.warnings.length;
  const source = sourceName(state.source);
  if (count === 0) return `${t('None in effect')} · ${source}`;
  return `${t('{count} in effect (see top)', { count })} · ${source}`;
}
