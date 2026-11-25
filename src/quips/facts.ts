// What the weather excuses and small talk lines can talk about, worked out
// once from the forecast: each fact is there only when it's true ("gusts"
// only when it's gusty), already written in the user's units and language,
// so a line fits when its facts are there and is filled in from them.

import {
  formatClockTime,
  formatDuration,
  formatPercent,
  formatPrecipitation,
  formatSnow,
  formatTemperature,
  formatWindSpeed,
  windFrom,
} from '../format';
import { currentLanguage, type Language } from '../i18n';
import { currentHourIndex, type Forecast } from '../weather/api';
import { beerOutside } from '../weather/beer';
import { pressureTrend } from '../weather/pressure';
import { sunElevation } from '../weather/solar';
import { currentUnits } from '../units';
import { describeWeather } from '../weather/wmo';

/** A line in every language the app speaks (a missing one won't compile). */
export type Texts = Record<Language, string>;

export interface Line {
  /** Whether the line fits the weather. */
  when(facts: Facts): boolean;
  text: Texts;
}

/** Text facts fill {placeholders}; flags only decide which lines fit. */
export interface Facts {
  // Always there.
  temp: string;
  feels: string;
  weather: string;
  from: string;
  /** Tomorrow's weather and high. */
  tomorrow: string;
  tomorrowHigh: string;
  /** How a cold beer fares outside now (beer.ts): one of the three. */
  beerTime?: string;
  beerWarms: boolean;
  beerFreezes: boolean;
  beerStaysCold: boolean;
  // Only when true.
  gusts?: string;
  wind?: string;
  amount?: string;
  percent?: string;
  rainFrom?: string;
  snow?: string;
  thunderAt?: string;
  uv?: string;
  sunset?: string;
  daylight?: string;
  longer?: string;
  shorter?: string;
  colder?: string;
  warmer?: string;
  weekend?: string;
  humidity?: string;
  snowFrom?: string;
  sunrise?: string;
  sunsetAt?: string;
  raining: boolean;
  rainStopped: boolean;
  darkMorning: boolean;
  midnightSun: boolean;
  cool: boolean;
  mild: boolean;
  heat: boolean;
  feelsColder: boolean;
  clear: boolean;
  veryCold: boolean;
  freezing: boolean;
  hot: boolean;
  warmAndSunny: boolean;
  niceAndSunny: boolean;
  fog: boolean;
  grey: boolean;
  polarNight: boolean;
  pressureFalling: boolean;
}

const GUSTY = 10; // m/s
const WINDY = 8; // m/s
const RAIN_LIKELY = 60; // percent
const VERY_COLD = -10; // °C
const HOT = 28; // °C
const UV_HIGH = 6;
const HUMID = 90; // percent
const SHORT_DAY_HOURS = 8;
const BIG_CHANGE = 3; // °C, tomorrow's high against today's
const SECONDS_PER_DAY = 24 * 60 * 60;
const WARM = 25; // °C, summer heat to talk about
const MILD = [10, 18]; // °C
const FEELS_COLDER = 4; // °C, wind chill worth a word
const SUNSET_SOON_MS = 2 * 60 * 60 * 1000;
const THUNDER_CODES = new Set([95, 96, 99]);
const FOG_CODES = new Set([45, 48]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

const SATURDAY = 6;

/** The facts for this forecast. */
export function factsFor(forecast: Forecast): Facts {
  const now = forecast.current;
  const { hourly, daily } = forecast;
  const start = Math.max(currentHourIndex(forecast), 0);
  const hours = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => from + i).filter((i) => i < hourly.time.length);
  const next3 = hours(start, 3);
  const next12 = hours(start + 1, 12);
  const at = (array: (number | null)[] | undefined, list: number[]) =>
    list.map((i) => array?.[i] ?? 0);

  const lower = (text: string) => text.charAt(0).toLocaleLowerCase() + text.slice(1);
  const description = describeWeather(now.weather_code, now.is_day === 1).description;
  const raining = now.precipitation >= 0.1 && !SNOW_CODES.has(now.weather_code);
  const dry = now.precipitation < 0.1;
  const beer = beerOutside({
    air: now.temperature_2m,
    wind: now.wind_speed_10m,
    sunElevation: sunElevation(forecast.latitude, forecast.longitude, Date.now()),
    sunny: now.weather_code <= 2,
  });
  const facts: Facts = {
    temp: formatTemperature(now.temperature_2m),
    feels: formatTemperature(now.apparent_temperature),
    weather: lower(description),
    from: windFrom(now.wind_direction_10m),
    tomorrow: lower(describeWeather(daily.weather_code[1] ?? now.weather_code).description),
    tomorrowHigh: formatTemperature(daily.temperature_2m_max[1] ?? now.temperature_2m),
    beerTime: beer.kind === 'stays-cold' ? undefined : aboutTime(beer.minutes),
    beerWarms: beer.kind === 'warms',
    beerFreezes: beer.kind === 'freezes',
    beerStaysCold: beer.kind === 'stays-cold',
    raining,
    rainStopped: dry && [1, 2, 3].some((back) => (hourly.precipitation[start - back] ?? 0) >= 0.1),
    darkMorning: false,
    midnightSun: (daily.daylight_duration[0] ?? 0) >= SECONDS_PER_DAY - 60,
    cool: now.temperature_2m > 0 && now.temperature_2m < MILD[0],
    mild: dry && now.temperature_2m >= MILD[0] && now.temperature_2m < MILD[1],
    heat: now.temperature_2m >= WARM,
    feelsColder: now.apparent_temperature <= now.temperature_2m - FEELS_COLDER,
    clear: now.is_day === 1 && now.weather_code <= 1,
    veryCold: now.temperature_2m <= VERY_COLD,
    freezing: now.temperature_2m <= 0 && now.temperature_2m > VERY_COLD,
    hot: now.temperature_2m >= HOT,
    warmAndSunny: now.is_day === 1 && now.weather_code <= 1 && now.temperature_2m >= 18,
    niceAndSunny:
      now.is_day === 1 &&
      now.weather_code <= 1 &&
      now.temperature_2m >= 18 &&
      now.temperature_2m <= 26,
    fog: FOG_CODES.has(now.weather_code),
    grey: now.weather_code === 3,
    polarNight: daily.daylight_duration[0] === 0,
    pressureFalling: pressureTrend(forecast) === 'falling',
  };

  const gusts = now.wind_gusts_10m ?? 0;
  if (gusts >= GUSTY) facts.gusts = formatWindSpeed(gusts);
  if (now.wind_speed_10m >= WINDY) facts.wind = formatWindSpeed(now.wind_speed_10m);

  const amount = now.precipitation + at(hourly.precipitation, next3).reduce((a, b) => a + b, 0);
  if (amount >= 0.5) facts.amount = formatPrecipitation(amount);
  const chance = Math.max(0, ...at(hourly.precipitation_probability, next3));
  if (chance >= RAIN_LIKELY) facts.percent = formatPercent(chance);
  const rainHour = next12.find(
    (i) =>
      (hourly.precipitation_probability[i] ?? 0) >= RAIN_LIKELY &&
      !SNOW_CODES.has(hourly.weather_code[i] ?? -1),
  );
  if (!facts.raining && rainHour != null) facts.rainFrom = formatClockTime(hourly.time[rainHour]);
  const snowHour = next12.find((i) => SNOW_CODES.has(hourly.weather_code[i] ?? -1));
  if (!SNOW_CODES.has(now.weather_code) && snowHour != null) {
    facts.snowFrom = formatClockTime(hourly.time[snowHour]);
  }

  const snow = daily.snowfall_sum?.[0] ?? 0;
  if (snow > 0 && (SNOW_CODES.has(now.weather_code) || snow >= 1)) facts.snow = formatSnow(snow);

  const thunder = [start, ...next12].find((i) => THUNDER_CODES.has(hourly.weather_code[i] ?? -1));
  if (thunder != null) facts.thunderAt = formatClockTime(hourly.time[thunder]);

  const uv = Math.max(now.uv_index ?? 0, ...at(hourly.uv_index, next3));
  if (uv >= UV_HIGH) facts.uv = String(Math.round(uv));

  if ((now.relative_humidity_2m ?? 0) >= HUMID)
    facts.humidity = formatPercent(now.relative_humidity_2m);

  // The day's light: dark already, a short day, or the change by tomorrow.
  const [today, tomorrow] = daily.daylight_duration;
  const normalDay = (seconds: number | null | undefined): seconds is number =>
    seconds != null && seconds > 0 && seconds < SECONDS_PER_DAY - 60;
  if (normalDay(today)) {
    if (now.is_day === 0 && now.time > daily.sunset[0]) {
      facts.sunset = formatClockTime(daily.sunset[0]);
    }
    if (now.is_day === 0 && now.time < daily.sunrise[0]) {
      facts.darkMorning = true;
      facts.sunrise = formatClockTime(daily.sunrise[0]);
    }
    // The sun sets within 2 hours (local times, compared as wall clock).
    const untilSunset = Date.parse(`${daily.sunset[0]}Z`) - Date.parse(`${now.time}Z`);
    if (now.is_day === 1 && untilSunset > 0 && untilSunset <= SUNSET_SOON_MS) {
      facts.sunsetAt = formatClockTime(daily.sunset[0]);
    }
    if (today < SHORT_DAY_HOURS * 3600) facts.daylight = formatDuration(today);
    if (normalDay(tomorrow)) {
      const minutes = Math.round((tomorrow - today) / 60);
      if (minutes >= 1) facts.longer = String(minutes);
      if (minutes <= -1) facts.shorter = String(-minutes);
    }
  }

  // Tomorrow's high against today's, in the units shown.
  const [highToday, highTomorrow] = daily.temperature_2m_max;
  if (highToday != null && highTomorrow != null) {
    const change = highTomorrow - highToday;
    const degrees = Math.round(
      Math.abs(change) * (currentUnits().temperature === 'fahrenheit' ? 9 / 5 : 1),
    );
    if (change <= -BIG_CHANGE) facts.colder = String(degrees);
    if (change >= BIG_CHANGE) facts.warmer = String(degrees);
  }

  // The weekend ahead (not when it's already the weekend): Saturday's weather.
  const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
  const todayWeekday = weekday(daily.time[0]);
  if (todayWeekday !== SATURDAY && todayWeekday !== 0) {
    const saturday = daily.time.findIndex((date) => weekday(date) === SATURDAY);
    const code = daily.weather_code[saturday];
    if (saturday > 0 && code != null) {
      const text = describeWeather(code).description;
      facts.weekend = text.charAt(0).toLocaleLowerCase() + text.slice(1);
    }
  }
  return facts;
}

/** Every line that fits, filled in, in the app's language, in a random order. */
export function linesFor(lines: readonly Line[], forecast: Forecast): string[] {
  const facts = factsFor(forecast);
  const language = currentLanguage();
  const values = facts as unknown as Record<string, string | boolean | undefined>;
  const texts = lines
    .filter((line) => line.when(facts))
    .map((line) =>
      line.text[language].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
        typeof values[name] === 'string' ? (values[name] as string) : placeholder,
      ),
    );
  return shuffled(texts);
}

/** "about 20 min" (to 5 minutes) or "about 1.5 h" (to half an hour). */
function aboutTime(minutes: number): string {
  if (minutes < 57.5) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const hours = Math.round(minutes / 30) / 2;
  return `${new Intl.NumberFormat(currentUnits().dateLocale).format(hours)} h`;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
