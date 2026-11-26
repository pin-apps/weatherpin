// The Sky section's rows (loaded on demand, after the weather): sunrise and
// sunset, day length and the way to midwinter, golden and blue hour,
// stargazing tonight, the northern lights now, the moon, and your shadow.
// Rows show only when they say something: no stargazing when it's cloudy,
// no shadow at night. The sun's position is worked out here (solar.ts);
// times are the place's own clock.

import { el, estimateNote, iconEl } from '../dom';
import {
  formatClockTime,
  formatDuration,
  formatHour,
  formatPercent,
  formatTemperature,
} from '../format';
import { t } from '../i18n';
import type { PickedPoint } from '../map';
import { currentUnits } from '../units';
import { auroraChance } from '../weather/aurora';
import { beerOutside } from '../weather/beer';
import { rangeLoss } from '../weather/ev';
import { currentHourIndex, type Forecast } from '../weather/api';
import { moonPhase } from '../weather/moon';
import { pressureTrend } from '../weather/pressure';
import { fishingPeriods } from '../weather/solunar';
import { fishingText } from './fishing-texts';
import {
  dayLengthHours,
  highestElevation,
  spansWithElevation,
  sunElevation,
  type Span,
} from '../weather/solar';
import { describeSun } from '../weather/sun';

type Row = [label: string, value: string | HTMLElement];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SECONDS_PER_DAY = 24 * 60 * 60;

// The sun's height for each kind of light, in degrees.
const GOLDEN = { low: -4, high: 6 };
const BLUE = { low: -6, high: -4 };
/** Dark enough for stars (astronomical twilight starts at −18°; −12° will do). */
const STAR_DARK = -12;
/** Dark enough to see an aurora. */
const AURORA_DARK = -6;
const CLEAR_FOR_STARS = 25;
const CLEAR_FOR_AURORA = 50;
const MIN_STARGAZING_HOURS = 2;
/** The aurora is worth mentioning from this chance (percent). */
const AURORA_WORTH_IT = 10;
/** Closer to the equator, auroras are too rare to check for. */
const AURORA_LATITUDE = 45;
/** Day length changes too little in the tropics to count down. */
const TROPICS = 15;

/** Fills the Sky section's list for the place shown. */
export function fillSky(list: HTMLElement, forecast: Forecast, point: PickedPoint): void {
  const now = Date.now();
  const dayStart = localDayStart(forecast);
  const today = forecast.daily;
  const rows: Row[] = [
    // Index 0 is today in the location's own time zone.
    ...describeSun(
      today.time[0],
      today.sunrise[0],
      today.sunset[0],
      today.daylight_duration[0],
      today.daylight_duration[1] ?? null,
    ),
    ...midwinterRow(forecast, point),
    ...lightRows(forecast, point, dayStart, now),
    ...stargazingRow(forecast, point),
    [t('Moon'), renderMoon(point.lat)],
    ...shadowRow(point, now),
  ];
  list.replaceChildren(...rows.map(([label, value]) => detailsRow(label, value)));
  // After the moon, which it comes from.
  const fishing = fishingRow(forecast, point, now);
  const moonRow = list.querySelector('.moon')?.closest('.details__row');
  if (fishing) list.insertBefore(fishing, moonRow?.nextSibling ?? null);
  void addAurora(list, forecast, point, now);
}

function detailsRow(label: string, value: string | HTMLElement): HTMLElement {
  const row = el('div', 'details__row');
  const dd = el('dd');
  dd.append(value);
  row.append(el('dt', undefined, label), dd);
  return row;
}

/** UTC milliseconds of 00:00 today at the place. */
function localDayStart(forecast: Forecast): number {
  const [year, month, day] = forecast.daily.time[0].split('-').map(Number);
  return Date.UTC(year, month - 1, day) - forecast.utc_offset_seconds * 1000;
}

/** "14:52" on the place's clock for a UTC moment. */
function clockAt(utcMs: number, forecast: Forecast): string {
  const local = new Date(utcMs + forecast.utc_offset_seconds * 1000).toISOString();
  return formatClockTime(local.slice(0, 16));
}

/** "38 min" or "1 h 12 min". */
function shortDuration(minutes: number): string {
  return minutes < 60 ? `${minutes} min` : formatDuration(minutes * 60);
}

/** "21 Dec" in the app's language. */
function dayAndMonth(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat(currentUnits().dateLocale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * "Until midwinter: 1 h 12 min less daylight by 21 Dec", or after it
 * "Since midwinter: +38 min of daylight since 21 Dec". Midwinter is 21 June
 * south of the equator.
 */
function midwinterRow(forecast: Forecast, point: PickedPoint): Row[] {
  const daylight = forecast.daily.daylight_duration[0];
  const polar = daylight == null || daylight <= 0 || daylight >= SECONDS_PER_DAY - 60;
  if (Math.abs(point.lat) < TROPICS || polar) return [];

  const date = forecast.daily.time[0];
  const year = Number(date.slice(0, 4));
  const north = point.lat >= 0;
  const midwinterMonthDay = north ? '12-21' : '06-21';
  const midsummerMonthDay = north ? '06-21' : '12-21';
  const monthDay = date.slice(5);
  // Days get shorter from midsummer to midwinter.
  const shortening = north
    ? monthDay >= midsummerMonthDay && monthDay < midwinterMonthDay
    : monthDay >= midsummerMonthDay || monthDay < midwinterMonthDay;
  const midwinter = shortening
    ? `${monthDay > midwinterMonthDay ? year + 1 : year}-${midwinterMonthDay}`
    : `${monthDay >= midwinterMonthDay ? year : year - 1}-${midwinterMonthDay}`;

  const minutes = Math.round(
    Math.abs(dayLengthHours(point.lat, date) - dayLengthHours(point.lat, midwinter)) * 60,
  );
  if (minutes < 5) return [];
  const values = { duration: shortDuration(minutes), date: dayAndMonth(midwinter) };
  return shortening
    ? [[t('Until midwinter'), t('{duration} less daylight by {date}', values)]]
    : [[t('Since midwinter'), t('+{duration} of daylight since {date}', values)]];
}

/** Golden hour and blue hour: today's, from now on. */
function lightRows(forecast: Forecast, point: PickedPoint, dayStart: number, now: number): Row[] {
  const dayEnd = dayStart + DAY_MS;
  const rows: Row[] = [];
  const spansText = (spans: Span[]) =>
    spans
      .map((span) => `${clockAt(span.start, forecast)}–${clockAt(span.end, forecast)}`)
      .join(' · ');

  const highest = highestElevation(point.lat, point.lng, dayStart, dayEnd);
  if (highest >= GOLDEN.low && highest < GOLDEN.high) {
    // The sun never climbs out of golden light.
    rows.push([t('Golden hour'), t('All day (the sun stays low)')]);
  } else {
    const golden = upcoming(
      spansWithElevation(point.lat, point.lng, dayStart, dayEnd, GOLDEN.low, GOLDEN.high),
      now,
    );
    if (golden.length > 0) rows.push([t('Golden hour'), spansText(golden)]);
  }
  const blue = upcoming(
    spansWithElevation(point.lat, point.lng, dayStart, dayEnd, BLUE.low, BLUE.high),
    now,
  );
  if (blue.length > 0) rows.push([t('Blue hour'), spansText(blue)]);
  return rows;
}

/** The spans not over yet; spans cut at midnight are left out. */
function upcoming(spans: Span[], now: number): Span[] {
  return spans.filter((span) => span.end > now && span.end - span.start >= 4 * 60 * 1000);
}

/**
 * "Good 22:00–02:00: clear sky, thin moon": the longest clear, dark
 * stretch of 2 hours or more in the next 18 hours.
 */
function stargazingRow(forecast: Forecast, point: PickedPoint): Row[] {
  const clouds = forecast.hourly.cloud_cover;
  const first = currentHourIndex(forecast);
  if (!clouds || first < 0) return [];

  let best: { from: number; to: number } | undefined;
  let runStart: number | null = null;
  const last = Math.min(first + 18, forecast.hourly.time.length - 1);
  for (let i = first; i <= last + 1; i++) {
    const good = i <= last && isStarry(forecast, point, i);
    if (good && runStart === null) runStart = i;
    if (!good && runStart !== null) {
      if (!best || i - runStart > best.to - best.from) best = { from: runStart, to: i };
      runStart = null;
    }
  }
  if (!best || best.to - best.from < MIN_STARGAZING_HOURS) return [];

  const time = forecast.hourly.time;
  // The hour after the last good one ends the stretch.
  const endTime = time[best.to] ?? addHour(time[best.to - 1]);
  const lit = moonPhase(Date.now(), point.lat).litPercent;
  const moonlight = lit < 30 ? t('dark sky') : lit <= 70 ? t('some moonlight') : t('bright moon');
  return [
    [
      t('Stargazing'),
      t('Good {from}–{to}: clear sky, {moonlight}', {
        from: formatHour(time[best.from]),
        to: formatHour(endTime),
        moonlight,
      }),
    ],
  ];
}

function isStarry(forecast: Forecast, point: PickedPoint, index: number): boolean {
  const cloud = forecast.hourly.cloud_cover?.[index];
  if (cloud == null || cloud > CLEAR_FOR_STARS) return false;
  const middle = hourStart(forecast, forecast.hourly.time[index]) + HOUR_MS / 2;
  return sunElevation(point.lat, point.lng, middle) < STAR_DARK;
}

/** UTC milliseconds of a local hour such as "2026-11-15T22:00". */
function hourStart(forecast: Forecast, localIsoTime: string): number {
  return Date.parse(`${localIsoTime}:00Z`) - forecast.utc_offset_seconds * 1000;
}

function addHour(localIsoTime: string): string {
  return new Date(Date.parse(`${localIsoTime}:00Z`) + HOUR_MS).toISOString().slice(0, 16);
}

/** "🌒 Waxing crescent · 32 % lit", for now (the phase is the same everywhere). */
function renderMoon(latitude: number): HTMLElement {
  const moon = moonPhase(Date.now(), latitude);
  const value = el('span', 'moon');
  value.append(
    iconEl(moon.emoji, 'moon__emoji'),
    ` ${moon.name} · ${t('{percent} lit', { percent: formatPercent(moon.litPercent) })}`,
  );
  return value;
}

/** How many of the next fishing periods to list (about a day's worth). */
const FISHING_PERIODS = 4;

/**
 * "Fishing times 16:05–18:05 ★", then "Then 20:01–21:01 · 03:42–05:42 ★ …",
 * what the periods are, and the day's signs (near a full or new moon,
 * falling pressure): the fishing calendar's way, worded as tradition.
 */
function fishingRow(forecast: Forecast, point: PickedPoint, now: number): HTMLElement | null {
  const periods = fishingPeriods(point.lat, point.lng, now, now + DAY_MS).slice(0, FISHING_PERIODS);
  if (periods.length === 0) return null;
  const span = (period: (typeof periods)[number]) =>
    `${clockAt(period.start, forecast)}–${clockAt(period.end, forecast)}${period.main ? ' ★' : ''}`;
  const [first, ...later] = periods;

  const notes: string[] = [];
  if (later.length > 0) notes.push(fishingText('then', { times: later.map(span).join(' · ') }));
  notes.push(fishingText('legend'));
  const lit = moonPhase(now, point.lat).litPercent;
  if (lit >= 90) notes.push(fishingText('fullMoon'));
  else if (lit <= 10) notes.push(fishingText('newMoon'));
  if (pressureTrend(forecast) === 'falling') {
    notes.push(fishingText('falling'));
  }

  const row = el('div', 'details__row details__row--estimate fishing');
  row.append(
    el('dt', undefined, fishingText('label')),
    el('dd', 'fishing__next', span(first)),
    el('dd', 'fishing__detail', notes.join(' ')),
  );
  return row;
}

/** "10× your height": 1 / tan(the sun's height). Nothing at night. */
function shadowRow(point: PickedPoint, now: number): Row[] {
  const elevation = sunElevation(point.lat, point.lng, now);
  if (elevation <= 0) return [];
  const ratio = 1 / Math.tan((elevation * Math.PI) / 180);
  let value: string;
  if (elevation >= 75) value = t('Almost none (the sun is high)');
  else if (ratio > 20) value = t('Very long (the sun is low)');
  else {
    const number = new Intl.NumberFormat(currentUnits().dateLocale, {
      maximumFractionDigits: ratio < 2 ? 1 : 0,
    }).format(ratio);
    value = t('{ratio}× your height', { ratio: number });
  }
  return [[t('Your shadow'), value]];
}

/**
 * "Chance 35 % now · low in the north · NOAA", before the moon, when it's
 * dark and fairly clear far enough north or south, and the chance is worth
 * a look. Asked for only then (NOAA's grid is ~150 KB).
 */
async function addAurora(list: HTMLElement, forecast: Forecast, point: PickedPoint, now: number) {
  if (Math.abs(point.lat) < AURORA_LATITUDE) return;
  if (sunElevation(point.lat, point.lng, now) >= AURORA_DARK) return;
  const index = currentHourIndex(forecast);
  const cloud = index >= 0 ? forecast.hourly.cloud_cover?.[index] : undefined;
  if (cloud == null || cloud > CLEAR_FOR_AURORA) return;

  let chance;
  try {
    chance = await auroraChance(point.lat, point.lng);
  } catch {
    return;
  }
  if (chance.percent < AURORA_WORTH_IT || !list.isConnected) return;
  const north = point.lat >= 0;
  const parts = [t('Chance {percent} now', { percent: formatPercent(chance.percent) })];
  if (chance.lowOnHorizon) parts.push(north ? t('low in the north') : t('low in the south'));
  parts.push('NOAA');
  const row = detailsRow(north ? t('Northern lights') : t('Southern lights'), parts.join(' · '));
  row.classList.add('sky__aurora');
  // A weather badge (journey/, through main.ts).
  window.dispatchEvent(new Event('weatherpin:aurora'));
  const moonRow = list.querySelector('.moon')?.closest('.details__row');
  list.insertBefore(row, moonRow ?? null);
}

/**
 * "Beer outside" in More details, after Pressure (this module loads on
 * demand, so the row arrives with the Sky section): "🍺 Gets warm in about
 * 20 min (sunny, breezy)", "Stays cold out here", "Starts to freeze in
 * about 40 min". Just for fun (weather/beer.ts).
 */
export function fillBeer(moreDetails: HTMLElement, forecast: Forecast, point: PickedPoint): void {
  moreDetails.querySelector('.beer-outside')?.closest('.details__row')?.remove();
  const now = forecast.current;
  const beer = beerOutside({
    air: now.temperature_2m,
    wind: now.wind_speed_10m,
    sunElevation: sunElevation(point.lat, point.lng, Date.now()),
    sunny: now.weather_code <= 2,
  });
  let text: string;
  if (beer.kind === 'warms') {
    const conditions = [
      ...(beer.sun ? [t('beer|sunny')] : []),
      ...(beer.wind === 'windy'
        ? [t('beer|windy')]
        : beer.wind === 'breezy'
          ? [t('beer|breezy')]
          : []),
    ];
    text = t('Gets warm in about {time}', { time: aboutTime(beer.minutes) });
    if (conditions.length > 0) text += ` (${conditions.join(', ')})`;
  } else if (beer.kind === 'freezes') {
    text = t('Starts to freeze in about {time}', { time: aboutTime(beer.minutes) });
  } else text = t('Stays cold out here');

  const value = el('span', 'beer-outside');
  value.append(iconEl('🍺', 'beer-outside__icon'), ` ${text}`);
  const row = detailsRow(t('Beer outside'), value);
  // After Pressure (and the distance correction), before Local time.
  const localTime = moreDetails.querySelector('.local-time__value')?.closest('.details__row');
  (localTime?.parentElement ?? moreDetails).insertBefore(row, localTime ?? null);
  fillEvRange(row, forecast);
}

/**
 * "Electric car range" in More details, just before Beer outside, only from
 * +5 °C down: "🔋 20–40 % less", what it's typical for, and an estimate
 * note (weather/ev.ts). Filled with the beer row (same on-demand module).
 */
function fillEvRange(beerRow: HTMLElement, forecast: Forecast): void {
  beerRow.parentElement?.querySelector('.ev__value')?.closest('.details__row')?.remove();
  const temperature = forecast.current.temperature_2m;
  const loss = rangeLoss(temperature);
  if (!loss) return;
  const value = el('dd', 'ev__value');
  value.append(
    iconEl('🔋', 'ev__icon'),
    ` ${t('{low}–{high} % less', { low: loss.low, high: loss.high })}`,
  );
  const row = el('div', 'details__row details__row--estimate');
  row.append(
    el('dt', undefined, t('Electric car range')),
    value,
    el(
      'dd',
      'ev__detail',
      t(
        'Typical at {temp}. Less with a heat pump or a car warmed while plugged in; more on short trips.',
        { temp: formatTemperature(temperature) },
      ),
    ),
    estimateNote(t('Estimate from published tests, not your car.'), '', 'dd'),
  );
  beerRow.before(row);
}

/** "20 min" (to 5 minutes) or "1.5 h" (to half an hour). */
function aboutTime(minutes: number): string {
  if (minutes < 57.5) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const hours = Math.round(minutes / 30) / 2;
  return `${new Intl.NumberFormat(currentUnits().dateLocale).format(hours)} h`;
}
