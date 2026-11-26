// The top of the weather panel: the big temperature and an at-a-glance list
// (wind, rain, UV, air quality). Less-checked facts go in "More details" at
// the bottom of the panel, see renderMoreDetails.

import { el, estimateNote, hiddenText, iconEl } from '../dom';
import {
  formatClockTime,
  formatCoordinates,
  formatElevation,
  formatDayTimeIn,
  formatLocalNow,
  formatPercent,
  formatPrecipitation,
  formatPressure,
  formatPressurePrecise,
  formatSnow,
  formatSnowDepth,
  formatTemperature,
  formatTemperaturePrecise,
  formatTimeHere,
  formatWindSpeed,
  windFrom,
} from '../format';
import type { PickedPoint } from '../map';
import type { Forecast } from '../weather/api';
import { pressureTrend } from '../weather/pressure';
import { edmCorrectionPpm } from '../weather/edm';
import { sunProtectionWindow, todaysUvPeak, uvLevel } from '../weather/uv';
import { nowcast } from '../weather/nowcast';
import { frostHints } from '../weather/frost';
import type { RoadConditions } from '../roads/digitraffic';
import { whatToWear } from '../weather/wear';
import { describeWeather } from '../weather/wmo';
import { t } from '../i18n';
import { makeFoldable } from './fold';

/** "🧥 Jacket, umbrella": what to wear (screen readers hear the label). */
function wearLine(forecast: Forecast): HTMLElement {
  const { icon, text } = whatToWear(forecast);
  const line = el('p', 'current__wear');
  line.append(iconEl(icon, 'current__wear-icon'), hiddenText(t('What to wear:')), ` ${text}`);
  return line;
}

/** "Scrape the windscreen tomorrow morning" and the plants, on frosty nights. */
function frostLines(forecast: Forecast): HTMLElement[] {
  return frostHints(forecast).map((hint) => hintLine(hint));
}

/**
 * Finland: "🛣️ Poor road conditions: partly icy · Road weather: Fintraffic
 * (Vt 1: …)", from Fintraffic's road weather (added by panel.ts).
 */
export function roadConditionsLine(roads: RoadConditions, credit: HTMLElement): HTMLElement {
  const label =
    roads.level === 'very-poor' ? t('Very poor road conditions') : t('Poor road conditions');
  const text = roads.reason ? `${label}: ${t(roads.reason)}` : label;
  const line = hintLine({ icon: '🛣️', text }, 'current__roads');
  line.append(' · ', credit);
  return line;
}

function hintLine(
  { icon, text }: { icon: string; text: string },
  className = 'current__frost',
): HTMLElement {
  const line = el('p', className);
  line.append(iconEl(icon, 'current__wear-icon'), ` ${text}`);
  return line;
}

/** "Rain starting around 14:45", when there's something to say. */
function nowcastLine(forecast: Forecast): HTMLElement[] {
  const text = nowcast(forecast);
  return text ? [el('p', 'current__nowcast', text)] : [];
}

export function renderCurrent(forecast: Forecast): HTMLElement {
  const now = forecast.current;
  const condition = describeWeather(now.weather_code, now.is_day === 1);

  const summary = el('div', 'current__summary');
  summary.append(
    el('p', 'current__temp', formatTemperature(now.temperature_2m)),
    el('p', 'current__description', condition.description),
    el(
      'p',
      'current__feels',
      t('Feels like {temp}', { temp: formatTemperature(now.apparent_temperature) }),
    ),
    wearLine(forecast),
    ...frostLines(forecast),
    ...nowcastLine(forecast),
    updatedLine(forecast),
  );

  const headline = el('div', 'current__headline');
  headline.append(iconEl(condition.icon, 'current__icon'), summary);

  const section = el('section', 'current');
  section.setAttribute('aria-label', t('Current weather'));
  section.append(headline, renderGlance(forecast));
  return section;
}

function renderWind(speed: number, direction: number, gusts?: number | null): HTMLElement {
  // Arrow points where the wind blows *to*; the API gives where it comes from.
  // Set through the style property, which the CSP allows (unlike style="").
  const arrow = iconEl('↑', 'wind-arrow');
  arrow.style.transform = `rotate(${direction + 180}deg)`;

  const wind = el('span');
  wind.append(`${formatWindSpeed(speed)} ${windFrom(direction)} `, arrow);
  if (gusts != null) wind.append(` · ${t('gusts {speed}', { speed: formatWindSpeed(gusts) })}`);
  return wind;
}

/**
 * "[1 Low] · today's max 3 Moderate around 12:00", and on days that need it
 * a second line: "Sun protection 11:00–13:00".
 */
function renderUv(forecast: Forecast): string | HTMLElement {
  const uvIndex = forecast.current.uv_index;
  if (uvIndex == null) return '–';
  const now = uvLevel(uvIndex);
  const value = el('span');
  value.append(uvBadge(now.value, now.level, `${now.value} ${t(now.label)}`));

  // Only worth saying when today gets higher than now.
  const peak = todaysUvPeak(forecast);
  if (peak) {
    const max = uvLevel(peak.uvIndex);
    if (max.value > now.value) {
      value.append(
        ` · ${t("today's max {value} {level} around {time}", {
          value: max.value,
          level: t(max.label),
          time: formatClockTime(peak.time),
        })}`,
      );
    }
  }

  const protection = sunProtectionWindow(forecast);
  if (protection) {
    const from = formatClockTime(protection.from);
    const hours =
      protection.from === protection.to
        ? t('around {time}', { time: from })
        : `${from}–${formatClockTime(protection.to)}`;
    value.append(el('span', 'uv-protection', t('Sun protection {hours}', { hours })));
  }
  return value;
}

/** A small badge in the WHO colour of the level; the text says it too. */
export function uvBadge(value: number, level: number, text: string): HTMLElement {
  const badge = el('span', `uv uv--level-${level}`, text);
  badge.dataset.uv = String(value);
  return badge;
}

/** "3.0 mm", or with snow falling "3.0 mm · 2.1 cm snow". */
function renderPrecipitation(mm: number, snowCm?: number | null): string {
  const water = formatPrecipitation(mm);
  return snowCm != null && snowCm >= 0.1
    ? `${water} · ${t('{amount} snow', { amount: formatSnow(snowCm) })}`
    : water;
}

const TREND_ARROWS = { rising: '↑', falling: '↓', steady: '→' } as const;

function renderPressure(forecast: Forecast): HTMLElement {
  const pressure = el('span', undefined, formatPressure(forecast.current.pressure_msl));
  const trend = pressureTrend(forecast);
  if (trend) {
    // The arrow is decoration; the word carries the meaning.
    pressure.append(' ', iconEl(TREND_ARROWS[trend], 'pressure-trend'), ` ${t(trend)}`);
  }
  return pressure;
}

/**
 * "Atmospheric correction (EDM) +4 ppm" for surveying instruments, with the
 * temperature, ground-level pressure and humidity it comes from (some
 * instruments take those instead), and a plain warning that it's an
 * estimate. Null without ground-level pressure (an older saved forecast).
 */
function renderEdmRow(forecast: Forecast): HTMLElement | null {
  const now = forecast.current;
  if (now.surface_pressure == null) return null;
  const ppm = edmCorrectionPpm({
    temperature: now.temperature_2m,
    pressure: now.surface_pressure,
    humidity: now.relative_humidity_2m,
  });
  // The value beside its label like every row; the inputs and the warning
  // each get a full-width line below, so a long line never pushes the value
  // under the label on a phone.
  const inputs = [
    formatTemperaturePrecise(now.temperature_2m),
    t('{pressure} at ground level', { pressure: formatPressurePrecise(now.surface_pressure) }),
    formatPercent(now.relative_humidity_2m),
  ].join(' · ');
  const row = el('div', 'details__row details__row--estimate');
  row.append(
    el('dt', undefined, t('Atmospheric correction (EDM)')),
    el('dd', 'edm__value', `${ppm > 0 ? '+' : ''}${ppm} ppm`),
    el('dd', 'edm__inputs', t('Inputs: {values}', { values: inputs })),
    estimateNote(
      t('Estimate only, not a measurement.'),
      t(
        'Worked out from the weather forecast for this area, which can differ from the conditions at your instrument by several ppm. For survey work, measure temperature and pressure on site.',
      ),
      'dd',
    ),
  );
  return row;
}

/**
 * How fresh the weather is, in this device's time (wherever the place is):
 * "Updated 14:05". Without a connection, the saved weather says so:
 * "No connection · weather from Sun 14:05".
 */
function updatedLine(forecast: Forecast): HTMLElement {
  const fetched = new Date(forecast.fetchedAt);
  if (!forecast.offline) {
    return el('p', 'current__updated', t('Updated {time}', { time: formatTimeHere(fetched) }));
  }
  const sameDay = fetched.toDateString() === new Date().toDateString();
  const time = sameDay
    ? formatTimeHere(fetched)
    : formatDayTimeIn(fetched, Intl.DateTimeFormat().resolvedOptions().timeZone);
  return el(
    'p',
    'current__updated current__updated--offline',
    t('No connection · weather from {time}', { time }),
  );
}

/** Wind, rain, UV and air quality: what people check every time. */
function renderGlance(forecast: Forecast): HTMLElement {
  const now = forecast.current;
  // Filled in when the air quality arrives (a separate request).
  const airQuality = el('span', 'glance-aqi', t('Loading…'));
  return detailsList([
    [t('Wind'), renderWind(now.wind_speed_10m, now.wind_direction_10m, now.wind_gusts_10m)],
    [t('Precipitation'), renderPrecipitation(now.precipitation, now.snowfall)],
    // From 1 cm; "about": the model's value, not a measurement.
    ...(now.snow_depth != null && now.snow_depth >= 0.01
      ? [
          [
            t('Snow on the ground'),
            t('about {depth}', { depth: formatSnowDepth(now.snow_depth) }),
          ] as [string, string],
        ]
      : []),
    [t('UV index'), renderUv(forecast)],
    [t('Air quality'), airQuality],
  ]);
}

/** Facts people check now and then, at the bottom of the panel. */
export function renderMoreDetails(forecast: Forecast, point: PickedPoint): HTMLElement {
  const now = forecast.current;

  const localTime = el('span');
  localTime.append(
    el('span', 'local-time__value', formatLocalNow(forecast.timezone, forecast.utc_offset_seconds)),
    ` (${forecast.timezone_abbreviation})`,
  );

  const rows: [string, string | HTMLElement][] = [
    [t('Humidity'), formatPercent(now.relative_humidity_2m)],
    [t('Pressure'), renderPressure(forecast)],
    [t('Local time'), localTime],
    // Filled in when the warnings arrive (see render/warnings.ts).
    [t('Weather warnings'), el('span', 'warnings-status', t('Checking…'))],
    // A clicked point already has its coordinates as the panel title.
    ...(point.name
      ? [[t('Coordinates'), formatCoordinates(point.lat, point.lng)] as [string, string]]
      : []),
    ...(forecast.elevation !== undefined && Number.isFinite(forecast.elevation)
      ? [[t('Elevation'), formatElevation(forecast.elevation)] as [string, string]]
      : []),
  ];

  const heading = el('h3', 'section-title', t('More details'));
  heading.id = 'more-details-title';
  const section = el('section', 'forecast-section more-details');
  section.setAttribute('aria-labelledby', 'more-details-title');
  const list = detailsList(rows);
  // Right after Pressure, the value it most depends on.
  const edm = renderEdmRow(forecast);
  if (edm) list.insertBefore(edm, list.children[2] ?? null);
  section.append(heading, list);
  makeFoldable(section, heading, 'more-details');
  return section;
}

/**
 * The Sky section (sun, moon, golden hour…), filled in by render/sky.ts,
 * which loads on demand: here only its heading and an empty list.
 */
export function renderSkySection(forecast: Forecast): HTMLElement {
  const heading = el('h3', 'section-title', t('Sky'));
  heading.id = 'sky-title';
  const section = el('section', 'forecast-section sky');
  section.setAttribute('aria-labelledby', 'sky-title');
  section.append(heading, el('dl', 'details sky__list'));
  makeFoldable(section, heading, 'sky').textContent = nextSunEvent(forecast);
  return section;
}

const SECONDS_PER_DAY = 24 * 60 * 60;

/**
 * "Sunset 15:42": the next sunrise or sunset, for the folded Sky heading.
 * Nothing in polar night or midnight sun (no rise or set to name).
 */
function nextSunEvent(forecast: Forecast): string {
  const { sunrise, sunset, daylight_duration: daylight } = forecast.daily;
  const now = forecast.current.time;
  const hasSunrise = (day: number) =>
    daylight[day] != null && daylight[day]! > 0 && daylight[day]! < SECONDS_PER_DAY - 60;
  if (!hasSunrise(0)) return '';
  if (now < sunrise[0]) return `${t('Sunrise')} ${formatClockTime(sunrise[0])}`;
  if (now < sunset[0]) return `${t('Sunset')} ${formatClockTime(sunset[0])}`;
  return sunrise[1] && hasSunrise(1) ? `${t('Sunrise')} ${formatClockTime(sunrise[1])}` : '';
}

function detailsList(rows: [string, string | HTMLElement][]): HTMLElement {
  const list = el('dl', 'details');
  for (const [label, value] of rows) {
    const row = el('div', 'details__row');
    const dd = el('dd');
    dd.append(value);
    row.append(el('dt', undefined, label), dd);
    list.append(row);
  }
  return list;
}
