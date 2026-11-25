// The weather as a postcard picture to share: "Greetings from HELSINKI!",
// the weather in a stamp with a postmark, today's high, low and rain, the
// next three days, the date there and the app's
// address. A past day from Weather on a day gets its own card ("Greetings
// from 1987", that date in the postmark, how today compares). Drawn on a
// canvas in the browser (1080×1080, square for chat apps); nothing is sent
// anywhere. The sky follows the weather: blue for
// sun, grey for rain or snow, deep blue with stars at night.

import {
  formatCoordinates,
  formatLocalNow,
  formatPercent,
  formatTemperature,
  formatWeekday,
} from './format';
import type { PickedPoint } from './map';
import type { Forecast } from './weather/api';
import { describeWeather } from './weather/wmo';
import { t } from './i18n';
import { currentUnits } from './units';

const SIZE = 1080;
const PAD = 72;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const INK = '#1b2a3a';
const APP_ADDRESS = 'weatherpin.app';

// Sky colours, top to bottom.
const SKIES = {
  sunny: ['#1e6fd9', '#7fc0ff'],
  cloudy: ['#4f6c8a', '#a3b8cc'],
  wet: ['#3f4d5a', '#8494a3'],
  fog: ['#6c7884', '#b9c3cc'],
  night: ['#081833', '#22407a'],
} as const;

// WMO codes: fog; rain, snow, showers and thunder.
const FOG = new Set([45, 48]);
const OVERCAST = 3;

function skyFor(code: number, isDay: boolean): keyof typeof SKIES {
  if (!isDay) return 'night';
  if (FOG.has(code)) return 'fog';
  if (code >= 51) return 'wet';
  if (code === OVERCAST) return 'cloudy';
  return 'sunny';
}

/** Draws the postcard and returns it as a PNG. */
export function drawPostcard(point: PickedPoint, forecast: Forecast): Promise<Blob> {
  const now = forecast.current;
  const condition = describeWeather(now.weather_code, now.is_day === 1);
  return paint(skyFor(now.weather_code, now.is_day === 1), (ctx, sky) => {
    drawStamp(ctx, condition.icon, formatTemperature(now.temperature_2m), sky);
    drawGreeting(ctx, point, t('Greetings from'));
    drawPostmark(ctx, point, now.time, now.is_day !== 1);
    drawNow(ctx, forecast);
    drawNextDays(ctx, forecast);
    drawFooter(ctx, forecast);
  });
}

/** A past day, as Weather on a day shows it (texts made there). */
export interface PastDayCard {
  /** "1987-03-14" */
  date: string;
  weatherCode: number | null;
  /** The day's high for the stamp, e.g. "-8 °C". */
  stamp: string;
  /** "Saturday 14 March 1987" */
  title: string;
  /** E.g. "Clear sky · high -8 °C · low -15 °C", "No rain or snow". */
  lines: string[];
  /** "Today: 3 °C / -1 °C, 11° warmer", if known. */
  today: string | null;
}

/**
 * The postcard of a past day: "Greetings from 1987", the town, that day's
 * weather in the stamp and its date in the postmark, then the day and how
 * today compares.
 */
export function drawPastDayPostcard(point: PickedPoint, day: PastDayCard): Promise<Blob> {
  const condition = describeWeather(day.weatherCode ?? -1);
  return paint(skyFor(day.weatherCode ?? -1, true), (ctx, sky) => {
    drawStamp(ctx, condition.icon, day.stamp, sky);
    drawGreeting(ctx, point, t('Greetings from {year}', { year: day.date.slice(0, 4) }));
    drawPostmark(ctx, point, day.date, false);
    const width = SIZE - PAD * 2;
    // Below the postmark, so the long date line stays clear of it.
    const top = POSTMARK.y + POSTMARK.radius + 64;
    text(ctx, day.title, PAD, top, fittingSize(ctx, day.title, width, 56, 32, 700), 700);
    day.lines.forEach((line, i) =>
      text(ctx, line, PAD, top + 62 + i * 54, fittingSize(ctx, line, width, 42, 26, 400)),
    );
    ctx.fillStyle = 'rgb(0 0 0 / 0.22)';
    ctx.fillRect(0, BAND_TOP, SIZE, SIZE - BAND_TOP);
    if (day.today) {
      text(
        ctx,
        day.today,
        PAD,
        BAND_TOP + 130,
        fittingSize(ctx, day.today, width, 48, 28, 600),
        600,
      );
    }
    text(ctx, `📍 ${APP_ADDRESS}`, SIZE - PAD, SIZE - PAD + 20, 36, 700, 'right');
  });
}

/** A 1080×1080 canvas with the sky painted, `draw` on top, as a PNG. */
function paint(
  sky: keyof typeof SKIES,
  draw: (ctx: CanvasRenderingContext2D, gradient: CanvasGradient) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('No canvas'));

  const background = ctx.createLinearGradient(0, 0, 0, SIZE);
  background.addColorStop(0, SKIES[sky][0]);
  background.addColorStop(1, SKIES[sky][1]);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (sky === 'night') drawStars(ctx);
  draw(ctx, background);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No picture'))), 'image/png'),
  );
}

/** White text with a soft shadow, readable on every sky. */
function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  weight = 400,
  align: CanvasTextAlign = 'left',
) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgb(0 0 0 / 0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** The largest size from `start` down to `min` at which `value` fits `width`. */
function fittingSize(
  ctx: CanvasRenderingContext2D,
  value: string,
  width: number,
  start: number,
  min: number,
  weight: number,
): number {
  for (let size = start; size > min; size -= 4) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(value).width <= width) return size;
  }
  return min;
}

// The stamp: top right, the weather icon and temperature.
const STAMP = { width: 250, height: 290 };
const STAMP_X = SIZE - PAD - STAMP.width;
const STAMP_Y = PAD;

function drawStamp(
  ctx: CanvasRenderingContext2D,
  icon: string,
  temperature: string,
  sky: CanvasGradient,
) {
  const { width, height } = STAMP;
  ctx.save();
  ctx.translate(STAMP_X, STAMP_Y);
  // Tilted a little, like a stamp stuck on by hand.
  ctx.translate(width / 2, height / 2);
  ctx.rotate(0.05);
  ctx.translate(-width / 2, -height / 2);
  ctx.shadowColor = 'rgb(0 0 0 / 0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Perforated edges: bites in the sky's own colours.
  ctx.save();
  ctx.translate(STAMP_X, STAMP_Y);
  ctx.translate(width / 2, height / 2);
  ctx.rotate(0.05);
  ctx.translate(-width / 2, -height / 2);
  ctx.fillStyle = sky;
  const hole = 7;
  const step = 22;
  for (let x = step / 2; x < width; x += step) {
    for (const y of [0, height]) circle(ctx, x, y, hole);
  }
  for (let y = step / 2; y < height; y += step) {
    for (const x of [0, width]) circle(ctx, x, y, hole);
  }
  // A thin inner frame, as on real stamps.
  ctx.strokeStyle = '#c9d4de';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.textAlign = 'center';
  ctx.font = `110px ${FONT}`;
  ctx.fillText(icon, width / 2, 150);
  ctx.fillStyle = INK;
  ctx.font = `700 ${fittingSize(ctx, temperature, width - 50, 64, 36, 700)}px ${FONT}`;
  ctx.fillText(temperature, width / 2, 240);
  ctx.restore();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** The town's name, or the coordinates for a point with no name. */
function townOf(point: PickedPoint): string {
  return point.name ? point.name.split(', ')[0] : formatCoordinates(point.lat, point.lng);
}

/** "Greetings from" and the place, big: e.g. HELSINKI, then "Finland". */
function drawGreeting(ctx: CanvasRenderingContext2D, point: PickedPoint, greeting: string) {
  const width = STAMP_X - PAD - 40;
  text(ctx, greeting, PAD, PAD + 50, fittingSize(ctx, greeting, width, 52, 32, 500), 500);

  // A named place: the town big, the rest ("Finland") under it.
  const rest = point.name ? point.name.split(', ').slice(1) : [];
  const name = townOf(point).toLocaleUpperCase();
  const size = fittingSize(ctx, name, width, 120, 64, 800);
  ctx.font = `800 ${size}px ${FONT}`;
  let baseline = PAD + 60 + size;
  if (ctx.measureText(name).width <= width) {
    text(ctx, name, PAD, baseline, size, 800);
  } else {
    // Still too long: two lines, smaller until the longer one fits; past
    // the smallest size, cut with "…" (never under the stamp).
    const lines = splitInTwo(name);
    const longer = lines[0].length >= lines[1].length ? lines[0] : lines[1];
    const lineSize = fittingSize(ctx, longer, width, size, 28, 800);
    ctx.font = `800 ${lineSize}px ${FONT}`;
    baseline = PAD + 60 + lineSize;
    for (const line of lines) {
      text(ctx, fitWithEllipsis(ctx, line, width), PAD, baseline, lineSize, 800);
      baseline += lineSize;
    }
    baseline -= lineSize;
  }
  if (rest.length > 0) {
    const country = rest.join(', ');
    text(ctx, country, PAD, baseline + 64, fittingSize(ctx, country, width, 44, 28, 500), 500);
  }
}

// The postmark: below the stamp's lower left corner, the date clear of the
// stamp's edge; wavy lines across the stamp's foot, under the temperature.
const POSTMARK = { x: STAMP_X - 10, y: STAMP_Y + STAMP.height + 20, radius: 84 };
// Dark ink by day; on the night sky a light one, else it disappears.
const INK_DAY = 'rgb(20 30 45 / 0.6)';
const INK_NIGHT = 'rgb(175 195 225 / 0.85)';

/** A round postmark with the town and the date there, like a real one. */
function drawPostmark(
  ctx: CanvasRenderingContext2D,
  point: PickedPoint,
  localIsoDate: string,
  night: boolean,
) {
  const { x, y, radius } = POSTMARK;
  const ink = night ? INK_NIGHT : INK_DAY;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;

  // Wavy cancellation lines from the ring out over the stamp's foot, level
  // so they stay below the temperature.
  ctx.lineWidth = 4;
  for (const lineY of [-48, -30, -12, 6]) {
    ctx.beginPath();
    for (let dx = radius + 8; dx <= SIZE - x; dx += 4) {
      const wave = Math.sin(dx / 14) * 5;
      if (dx === radius + 8) ctx.moveTo(dx, lineY + wave);
      else ctx.lineTo(dx, lineY + wave);
    }
    ctx.stroke();
  }

  // The ring and its words, tilted a little like a stamp pressed by hand.
  ctx.rotate(-0.12);
  ctx.lineWidth = 4;
  for (const r of [radius, radius - 24]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The town around the top of the ring, cut to fit half of it.
  ctx.font = `700 19px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let town = townOf(point).toLocaleUpperCase();
  const arc = Math.PI * (radius - 12) * 0.85;
  while (town.length > 1 && ctx.measureText(town).width > arc) town = town.slice(0, -1);
  arcText(ctx, town, radius - 12);

  ctx.font = `700 20px ${FONT}`;
  const [day, month, year] = postmarkDate(localIsoDate);
  ctx.fillText(day, 0, -20);
  ctx.fillText(month, 0, 2);
  ctx.fillText(year, 0, 24);

  ctx.restore();
}

/** `value` written along the top of a circle of `radius` around (0, 0). */
function arcText(ctx: CanvasRenderingContext2D, value: string, radius: number) {
  const letters = [...value];
  const widths = letters.map((letter) => ctx.measureText(letter).width + 2);
  const total = widths.reduce((sum, w) => sum + w, 0);
  let angle = -Math.PI / 2 - total / radius / 2;
  for (const [i, letter] of letters.entries()) {
    const half = widths[i] / radius / 2;
    angle += half;
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(letter, 0, -radius);
    ctx.restore();
    angle += half;
  }
}

/** The date of `localIsoTime` (or a date) as postmark lines: "20", "NOV", "2026". */
function postmarkDate(localIsoTime: string): [string, string, string] {
  const [year, month, day] = localIsoTime.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const name = new Intl.DateTimeFormat(currentUnits().dateLocale, {
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
  return [String(day), name.replace('.', '').toLocaleUpperCase(), String(year)];
}

/** `value` as is if it fits `width` in the current font, else cut with "…". */
function fitWithEllipsis(ctx: CanvasRenderingContext2D, value: string, width: number): string {
  if (ctx.measureText(value).width <= width) return value;
  let cut = value;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/**
 * A long name in two lines: at the space or hyphen nearest its middle; a
 * single word between syllables, with a hyphen ("KRISTIINAN-", "KAUPUNKI"),
 * never cut at a random letter, which reads as a misspelling.
 */
function splitInTwo(name: string): [string, string] {
  const middle = name.length / 2;
  const nearestMiddle = (breaks: number[]) =>
    breaks.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best));

  const spaces = [...name].flatMap((char, i) => (char === ' ' || char === '-' ? [i] : []));
  if (spaces.length > 0) {
    const at = nearestMiddle(spaces);
    return [name.slice(0, at + 1).trim(), name.slice(at + 1).trim()];
  }
  const syllables = syllableBreaks(name);
  if (syllables.length > 0) {
    const at = nearestMiddle(syllables);
    return [`${name.slice(0, at)}-`, name.slice(at)];
  }
  // No syllables found (e.g. Chinese or Japanese): the middle; a hyphen
  // only in scripts written with spaces between words.
  const at = Math.ceil(middle);
  const hyphen = SPACED_SCRIPT.test(name[at - 1]) && SPACED_SCRIPT.test(name[at]) ? '-' : '';
  return [`${name.slice(0, at)}${hyphen}`, name.slice(at)];
}

const SPACED_SCRIPT = /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}]/u;
const VOWELS = /[AEIOUYÆØŒАЕЁИОУЫЭЮЯІЇЄΑΕΗΙΟΥΩ]/;
const MIN_PART = 3;

/**
 * Where a word can break between syllables: before a consonant followed by
 * a vowel (KRIS-TII-NAN-KAU-PUN-KI), the Finnish rule, which suits most
 * names in Latin, Greek and Cyrillic letters well enough. Upper case.
 */
function syllableBreaks(word: string): number[] {
  // The base letter, so Ä, É, Ö… count as vowels.
  const base = (char: string) => char.normalize('NFD')[0].toLocaleUpperCase();
  const isVowel = (char: string) => VOWELS.test(base(char));
  const isConsonant = (char: string) => SPACED_SCRIPT.test(char) && !isVowel(char);
  const breaks: number[] = [];
  for (let i = MIN_PART; i <= word.length - MIN_PART; i++) {
    if (isConsonant(word[i]) && isVowel(word[i + 1]) && SPACED_SCRIPT.test(word[i - 1])) {
      breaks.push(i);
    }
  }
  return breaks;
}

const NOW_Y = 450;
const DAYS_TOP = 620;
// The past day's card: its darker band, with how today compares.
const BAND_TOP = 720;

/**
 * "Mainly clear", "Feels like 10 °C" and "Today 12 °C / 4 °C · rain 80 %",
 * in the middle.
 */
function drawNow(ctx: CanvasRenderingContext2D, forecast: Forecast) {
  const now = forecast.current;
  const condition = describeWeather(now.weather_code, now.is_day === 1);
  const width = SIZE - PAD * 2;
  const size = fittingSize(ctx, condition.description, width, 64, 40, 700);
  text(ctx, condition.description, PAD, NOW_Y, size, 700);
  text(
    ctx,
    t('Feels like {temp}', { temp: formatTemperature(now.apparent_temperature) }),
    PAD,
    NOW_Y + 64,
    44,
  );
  const today = todayLine(forecast);
  if (today) text(ctx, today, PAD, NOW_Y + 122, 40);
}

/** Today's high and low, and the chance of rain in its remaining hours. */
function todayLine(forecast: Forecast): string | null {
  const { daily, hourly, current } = forecast;
  const high = daily.temperature_2m_max[0];
  const low = daily.temperature_2m_min[0];
  if (high == null || low == null) return null;
  const temps = `${formatTemperature(high)} / ${formatTemperature(low)}`;
  const date = daily.time[0];
  const hourNow = current.time.slice(0, 13);
  const chances = hourly.time
    .map((time, i) => (time.startsWith(date) && time.slice(0, 13) >= hourNow ? i : -1))
    .filter((i) => i >= 0)
    .map((i) => hourly.precipitation_probability[i])
    .filter((chance): chance is number => chance != null);
  if (chances.length === 0) return t('Today {temps}', { temps });
  return t('Today {temps} · rain {percent}', {
    temps,
    percent: formatPercent(Math.max(...chances)),
  });
}

/** The next three days, on a darker band so they read on any sky. */
function drawNextDays(ctx: CanvasRenderingContext2D, forecast: Forecast) {
  const top = DAYS_TOP;
  ctx.fillStyle = 'rgb(0 0 0 / 0.22)';
  ctx.fillRect(0, top, SIZE, SIZE - top);

  const daily = forecast.daily;
  for (const [row, i] of [1, 2, 3].entries()) {
    if (daily.time[i] === undefined) continue;
    const y = top + 90 + row * 100;
    const day = i === 1 ? t('Tomorrow') : formatWeekday(daily.time[i]);
    const code = daily.weather_code[i];
    const high = daily.temperature_2m_max[i];
    const low = daily.temperature_2m_min[i];
    text(ctx, day, PAD, y, 44, 600);
    if (code != null) text(ctx, describeWeather(code, true).icon, PAD + 330, y, 48);
    if (high != null && low != null) {
      text(
        ctx,
        `${formatTemperature(high)} / ${formatTemperature(low)}`,
        SIZE - PAD,
        y,
        44,
        600,
        'right',
      );
    }
  }
}

/** The date and time there, and the app's address. */
function drawFooter(ctx: CanvasRenderingContext2D, forecast: Forecast) {
  const y = SIZE - PAD + 20;
  text(ctx, formatLocalNow(forecast.timezone, forecast.utc_offset_seconds), PAD, y, 34);
  text(ctx, `📍 ${APP_ADDRESS}`, SIZE - PAD, y, 36, 700, 'right');
}

/** Small stars for a night sky, always in the same places. */
function drawStars(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgb(255 255 255 / 0.7)';
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) circle(ctx, next() * SIZE, next() * DAYS_TOP, next() * 2 + 1);
}
