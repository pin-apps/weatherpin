import { el, estimateNote } from '../dom';
import {
  formatClockTime,
  formatConcentration,
  formatPollen,
  formatPpm,
  formatWeekday,
  orDash,
} from '../format';
import { worstByDay } from '../weather/air-quality-days';
import { POLLEN_LEVEL_NAMES, pollenByDay, pollenLevel, type PollenLevel } from '../weather/pollen';
import {
  aqiLevel,
  currentIndex,
  formatIndex,
  POLLEN_TYPES,
  SCALE_NAMES,
  scaleFor,
  type AirQuality,
  type AqiScale,
} from '../weather/air-quality';
import { t } from '../i18n';
import { makeFoldable } from './fold';

/** The section with a placeholder; filled in when the data arrives. */
export function renderAirQualitySection(): HTMLElement {
  const heading = el('h3', 'section-title', t('Air quality'));
  heading.id = 'air-quality-title';

  const section = el('section', 'forecast-section air-quality');
  section.setAttribute('aria-labelledby', 'air-quality-title');
  section.append(heading, el('p', 'air-quality__status', t('Loading air quality…')));
  makeFoldable(section, heading, 'air-quality');
  return section;
}

/** Replaces the placeholder with a short note, e.g. when loading failed. */
export function showAirQualityMessage(section: HTMLElement, message: string) {
  section.querySelector('.air-quality__status')?.replaceChildren(message);
}

export function fillAirQuality(section: HTMLElement, airQuality: AirQuality) {
  const heading = section.querySelector('.section-title')!;
  // Folded, the heading still shows the index: "Air quality [19 Good]".
  const badge = glanceBadge(airQuality);
  section.querySelector('.fold__summary')?.replaceChildren(...(badge ? [badge.element] : []));
  section.replaceChildren(
    heading,
    renderBadge(airQuality),
    ...renderCalculatedNote(airQuality),
    // One note for the whole section, before any numbers: the index, the
    // values, the forecast and the gases all come from the same model.
    estimateNote(
      t(
        'Everything in this section comes from the CAMS forecast model, not from measuring stations.',
      ),
      t(
        'Values are averages for an area about 11 km across in Europe (40 km elsewhere); stations nearby can show different values.',
      ),
    ),
    renderPollutants(airQuality),
    ...renderPollen(airQuality),
    ...renderNextDays(airQuality),
    ...renderPollenDays(airQuality),
    // Last: not air quality, so apart from the index and its forecast.
    ...renderGreenhouseGases(airQuality),
    renderCredit(airQuality),
  );
}

/**
 * The small air quality badge in the at-a-glance list at the top of the
 * panel, e.g. "[22 Good] US AQI". The full section is further down.
 */
export function fillAirQualityGlance(target: HTMLElement, airQuality: AirQuality | undefined) {
  const badge = airQuality && glanceBadge(airQuality);
  if (!badge) {
    target.replaceChildren('–');
    return;
  }
  target.replaceChildren(badge.element, ` ${t(SCALE_NAMES[badge.scale])}`);
}

/** The small "[22 Good]" badge for the index now; undefined without one. */
function glanceBadge(
  airQuality: AirQuality,
): { element: HTMLElement; scale: AqiScale } | undefined {
  const scale = scaleFor(airQuality.timezone);
  const value = currentIndex(airQuality, scale);
  if (value == null) return undefined;
  const { level, label } = aqiLevel(scale, value);
  const element = el('span', `aqi aqi--small aqi--${scale} aqi--level-${level}`);
  element.append(
    el('span', 'aqi__value', formatIndex(scale, value)),
    el('span', 'aqi__label', t(label)),
  );
  return { element, scale };
}

function renderBadge(airQuality: AirQuality): HTMLElement {
  const scale = scaleFor(airQuality.timezone);
  const value = currentIndex(airQuality, scale);

  if (value == null) {
    return el('p', 'air-quality__status', t('No air quality index for this place.'));
  }

  // Colour shows the level at a glance; the words say it too, so colour is
  // never the only signal.
  const { level, label } = aqiLevel(scale, value);
  const badge = el('p', `aqi aqi--${scale} aqi--level-${level}`);
  badge.append(
    el('span', 'aqi__value', formatIndex(scale, value)),
    el('span', 'aqi__label', t(label)),
    el('span', 'aqi__scale', t(SCALE_NAMES[scale])),
  );
  return badge;
}

// The UK's and Canada's indices are worked out by the app from the
// pollutant forecast (weather/national-aqi.ts), not given by the service.
const CALCULATED: ReadonlySet<AqiScale> = new Set(['uk', 'canada']);

/** "Worked out from forecast data…", under a UK or Canadian index. */
function renderCalculatedNote(airQuality: AirQuality): HTMLElement[] {
  if (!CALCULATED.has(scaleFor(airQuality.timezone))) return [];
  return [
    el(
      'p',
      'air-quality__note',
      t('Worked out from forecast data; official readings can differ a little.'),
    ),
  ];
}

function renderPollutants(airQuality: AirQuality): HTMLElement {
  const now = airQuality.current;
  return detailsList([
    ['PM2.5', orDash(now.pm2_5, formatConcentration)],
    ['PM10', orDash(now.pm10, formatConcentration)],
    [t('Ozone (O₃)'), orDash(now.ozone, formatConcentration)],
    [t('Nitrogen dioxide (NO₂)'), orDash(now.nitrogen_dioxide, formatConcentration)],
    [t('Sulphur dioxide (SO₂)'), orDash(now.sulphur_dioxide, formatConcentration)],
    [t('Carbon monoxide (CO)'), orDash(now.carbon_monoxide, formatConcentration)],
    // Only when there is some: most places have none most days.
    ...(now.dust != null && now.dust >= 0.5
      ? [[t('Desert dust'), formatConcentration(now.dust)] as [string, string]]
      : []),
  ]);
}

/** Methane's molar mass, g/mol: µg/m³ → ppm at 25 °C (24.45 l/mol). */
const METHANE_G_PER_MOL = 16.04;

/**
 * CO₂ and methane in ppm, under their own heading so they don't read as air
 * quality (outdoors they aren't a health matter). Only when there's CO₂.
 */
function renderGreenhouseGases(airQuality: AirQuality): HTMLElement[] {
  const now = airQuality.current;
  if (now.carbon_dioxide == null) return [];
  const heading = el('h4', 'air-quality__subtitle', t('Greenhouse gases'));
  const rows: [string, string][] = [[t('Carbon dioxide (CO₂)'), formatPpm(now.carbon_dioxide)]];
  if (now.methane != null) {
    const ppm = (now.methane * 24.45) / METHANE_G_PER_MOL / 1000;
    rows.push([t('Methane (CH₄)'), formatPpm(ppm, 1)]);
  }
  return [
    heading,
    detailsList(rows),
    // Why they sit apart; the section's note above already says they're
    // model values.
    el('p', 'air-quality__aside', t('Not part of the air quality index.')),
  ];
}

/** Pollen rows, only for types actually in the air (Europe, in season). */
function renderPollen(airQuality: AirQuality): HTMLElement[] {
  const rows: [string, string][] = [];
  for (const [variable, name] of POLLEN_TYPES) {
    const grains = airQuality.current[variable];
    const level = grains != null ? pollenLevel(variable, grains) : null;
    if (level)
      rows.push([
        t('{name} pollen', { name: t(name) }),
        `${formatPollen(grains!)} · ${t(POLLEN_LEVEL_NAMES[level])}`,
      ]);
  }
  return rows.length > 0 ? [detailsList(rows)] : [];
}

/** Worst index per day, as far as the forecast reaches. */
function renderNextDays(airQuality: AirQuality): HTMLElement[] {
  const scale = scaleFor(airQuality.timezone);
  const days = worstByDay(airQuality, scale);
  if (days.length === 0) return [];

  const heading = el('h4', 'air-quality__subtitle', t('Next days'));
  heading.id = 'air-quality-days-title';
  const list = el('ol', 'aqi-days');
  list.setAttribute('aria-labelledby', 'air-quality-days-title');

  const today = airQuality.current.time.slice(0, 10);
  for (const day of days) {
    const { level, label } = aqiLevel(scale, day.worst);
    const badge = el('span', `aqi aqi--small aqi--${scale} aqi--level-${level}`);
    badge.append(
      el('span', 'aqi__value', formatIndex(scale, day.worst)),
      el('span', 'aqi__label', t(label)),
    );

    const item = el('li', 'aqi-days__item');
    item.append(
      el('span', 'aqi-days__day', day.date === today ? t('Today') : formatWeekday(day.date)),
      badge,
    );
    // Today is the day plans can still change for: say when it's worst.
    if (day.date === today) {
      item.append(
        el(
          'span',
          'aqi-days__when',
          t('worst around {time}', { time: formatClockTime(day.worstTime) }),
        ),
      );
    }
    list.append(item);
  }
  return [heading, list];
}

/**
 * Each pollen type's worst level per day, e.g. "Mon [Birch: High]
 * [Grass: Low]". Only in Europe in season (otherwise nothing at all).
 */
function renderPollenDays(airQuality: AirQuality): HTMLElement[] {
  const days = pollenByDay(airQuality);
  if (days.length === 0) return [];

  const heading = el('h4', 'air-quality__subtitle', t('Pollen forecast'));
  heading.id = 'pollen-days-title';
  const list = el('ol', 'pollen-days');
  list.setAttribute('aria-labelledby', 'pollen-days-title');

  const today = airQuality.current.time.slice(0, 10);
  for (const day of days) {
    const item = el('li', 'pollen-days__item');
    item.append(
      el('span', 'pollen-days__day', day.date === today ? t('Today') : formatWeekday(day.date)),
    );
    if (day.types.length === 0) {
      item.append(el('span', 'pollen-days__none', t('None')));
    }
    for (const { name, level } of day.types) item.append(pollenChip(name, level));
    list.append(item);
  }
  return [heading, list];
}

/** "Birch: High", with a mark in the level's colour (the word says it too). */
function pollenChip(name: string, level: PollenLevel): HTMLElement {
  return el(
    'span',
    `pollen-level pollen-level--${level}`,
    `${t(name)}: ${t(POLLEN_LEVEL_NAMES[level])}`,
  );
}

function renderCredit(airQuality: AirQuality): HTMLElement {
  // Copernicus asks for this notice wherever its data is shown; Open-Meteo
  // interpolates the data, hence "modified".
  const year = airQuality.current.time.slice(0, 4);
  return el(
    'p',
    'air-quality__credit',
    `Contains modified Copernicus Atmosphere Monitoring Service information ${year}. ` +
      'Neither the European Commission nor ECMWF is responsible for any use that may be ' +
      'made of the Copernicus information or data it contains.',
  );
}

function detailsList(rows: [string, string][]): HTMLElement {
  const list = el('dl', 'details');
  for (const [label, value] of rows) {
    const row = el('div', 'details__row');
    row.append(el('dt', undefined, label), el('dd', undefined, value));
    list.append(row);
  }
  return list;
}
