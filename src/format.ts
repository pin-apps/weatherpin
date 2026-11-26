// Display formatting. Values arrive in metric units (°C, m/s, mm, hPa) and
// are converted here to the units the user has chosen (src/units.ts). Times
// use the 12- or 24-hour clock of the browser's language.

import { currentLanguage, LANGUAGE_LOCALES } from './i18n';
import { currentUnits } from './units';

const finnish = () => currentLanguage() === 'fi';
const swedish = () => currentLanguage() === 'sv';
const norwegian = () => currentLanguage() === 'nb';

const COMPASS_POINTS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

// `|| 0` turns -0 into 0, so we never show "-0 °C".
function roundWhole(value: number): number {
  return Math.round(value) || 0;
}

// `|| 0` again, for "-0.0" from toFixed. Finnish, Swedish and Norwegian
// write a decimal comma.
function fixed(value: number, digits: number): string {
  const text = (Number(value.toFixed(digits)) || 0).toFixed(digits);
  return currentLanguage() === 'en' ? text : text.replace('.', ',');
}

/**
 * Finnish clock times from Intl come as "14.05"; the app writes "14:05"
 * everywhere (the hour strip, the graph), so make them match. Dates such
 * as "15.11." keep their dots.
 */
function colonTimes(text: string): string {
  return finnish() ? text.replace(/(\d{1,2})\.(\d{2})(?![.\d])/g, '$1:$2') : text;
}

/** First letter upper case: Finnish day names are lower case mid-sentence. */
function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTemperature(celsius: number): string {
  if (currentUnits().temperature === 'fahrenheit') {
    return `${roundWhole((celsius * 9) / 5 + 32)} °F`;
  }
  return `${roundWhole(celsius)} °C`;
}

export function formatWindSpeed(metresPerSecond: number): string {
  switch (currentUnits().wind) {
    case 'mph':
      return `${roundWhole(metresPerSecond * 2.23694)} mph`;
    case 'kmh':
      return `${roundWhole(metresPerSecond * 3.6)} km/h`;
    case 'ms':
      return `${fixed(metresPerSecond, 1)} m/s`;
    case 'kn':
      return `${roundWhole(metresPerSecond * 1.94384)} kn`;
    case 'bft':
      return `${beaufort(metresPerSecond)} Bft`;
  }
}

// Upper limits of Beaufort forces 0–11 in m/s (WMO); 12 above the last.
const BEAUFORT_LIMITS = [0.5, 1.6, 3.4, 5.5, 8, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];

/** Wind force on the Beaufort scale (0–12) from m/s. */
export function beaufort(metresPerSecond: number): number {
  const force = BEAUFORT_LIMITS.findIndex((limit) => metresPerSecond < limit);
  return force === -1 ? 12 : force;
}

export function formatPrecipitation(mm: number): string {
  // Inches need two decimals: 0.1 in is already 2.5 mm.
  if (currentUnits().precipitation === 'inch') return `${fixed(mm / 25.4, 2)} in`;
  // From 10 mm a decimal adds nothing but width: "30 mm", not "30.4 mm".
  return mm >= 10 ? `${roundWhole(mm)} mm` : `${fixed(mm, 1)} mm`;
}

/** Wave height from metres: "1.2 m", or "3.9 ft" with °F. */
export function formatWaveHeight(metres: number): string {
  if (currentUnits().temperature === 'fahrenheit') return `${fixed(metres * 3.28084, 1)} ft`;
  return `${fixed(metres, 1)} m`;
}

/**
 * Height above sea level: "1,234 m", or feet for those who use inches
 * ("4,049 ft"); whole numbers, the language's thousands separator.
 */
export function formatElevation(metres: number): string {
  const feet = currentUnits().precipitation === 'inch';
  const value = roundWhole(feet ? metres * 3.28084 : metres);
  const language = currentLanguage();
  const number = new Intl.NumberFormat(language === 'en' ? 'en' : LANGUAGE_LOCALES[language]);
  return `${number.format(value)} ${feet ? 'ft' : 'm'}`;
}

/**
 * Snow on the ground from Open-Meteo's metres: "23 cm", or inches for those
 * who use inches ("9.1 in", whole from 10 in).
 */
export function formatSnowDepth(metres: number): string {
  const cm = metres * 100;
  if (currentUnits().precipitation === 'inch') {
    const inches = cm / 2.54;
    return inches >= 10 ? `${roundWhole(inches)} in` : `${fixed(inches, 1)} in`;
  }
  return `${roundWhole(cm)} cm`;
}

/** Snow depth from Open-Meteo's cm: "2.1 cm", or "0.8 in" with °F. */
export function formatSnow(cm: number): string {
  if (currentUnits().precipitation === 'inch') return `${fixed(cm / 2.54, 1)} in`;
  return `${fixed(cm, 1)} cm`;
}

export function formatPressure(hPa: number): string {
  // Inches of mercury, as US forecasts show it, e.g. "29.92 inHg".
  if (currentUnits().pressure === 'inHg') return `${fixed(hPa * 0.02953, 2)} inHg`;
  if (currentUnits().pressure === 'mmHg') return `${roundWhole(hPa * 0.750062)} mmHg`;
  return `${roundWhole(hPa)} hPa`;
}

/** A measured value to a tenth: "21.3 °C" / "70.3 °F". */
export function formatTemperaturePrecise(celsius: number): string {
  if (currentUnits().temperature === 'fahrenheit') return `${fixed((celsius * 9) / 5 + 32, 1)} °F`;
  return `${fixed(celsius, 1)} °C`;
}

/** A measured pressure to a tenth of a hPa ("1008.4 hPa"), or "29.78 inHg". */
export function formatPressurePrecise(hPa: number): string {
  if (currentUnits().pressure === 'inHg') return `${fixed(hPa * 0.02953, 2)} inHg`;
  if (currentUnits().pressure === 'mmHg') return `${fixed(hPa * 0.750062, 1)} mmHg`;
  return `${fixed(hPa, 1)} hPa`;
}

/** A gas's share of the air: "456 ppm", "2.3 ppm". */
export function formatPpm(ppm: number, digits = 0): string {
  return `${fixed(ppm, digits)} ppm`;
}

/** Pollutant concentration, e.g. "5.7 µg/m³". */
export function formatConcentration(microgramsPerCubicMetre: number): string {
  return `${fixed(microgramsPerCubicMetre, 1)} µg/m³`;
}

export function formatPollen(grainsPerCubicMetre: number): string {
  return `${Math.round(grainsPerCubicMetre)} grains/m³`;
}

export function formatPercent(value: number): string {
  return `${roundWhole(value)} %`;
}

/** Compass name for a direction in degrees, e.g. 225 → "SW" (Swedish "SV"). */
export function compassDirection(degrees: number): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  const point = COMPASS_POINTS[index];
  // Swedish: öst (O) and väst (V); Norwegian: øst (Ø) and vest (V).
  if (swedish()) return point.replace(/E/g, 'O').replace(/W/g, 'V');
  if (norwegian()) return point.replace(/E/g, 'Ø').replace(/W/g, 'V');
  return point;
}

// Wind (or waves) "from" a direction. Finnish says it in one word, in the
// elative case ("lounaasta" = from the southwest), for 8 directions.
const FINNISH_FROM = [
  'pohjoisesta',
  'koillisesta',
  'idästä',
  'kaakosta',
  'etelästä',
  'lounaasta',
  'lännestä',
  'luoteesta',
];

/** "from SW", in Swedish "från SV", Norwegian "fra SV", Finnish "lounaasta". */
export function windFrom(degrees: number): string {
  if (finnish()) return FINNISH_FROM[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
  const from = swedish() ? 'från' : norwegian() ? 'fra' : 'from';
  return `${from} ${compassDirection(degrees)}`;
}

/** e.g. "59.91° N, 10.75° E" (Finnish "59,91° P, 10,75° I", Swedish "… Ö", Norwegian "… Ø") */
export function formatCoordinates(lat: number, lng: number): string {
  const [north, south, east, west] = finnish()
    ? ['P', 'E', 'I', 'L']
    : swedish()
      ? ['N', 'S', 'Ö', 'V']
      : norwegian()
        ? ['N', 'S', 'Ø', 'V']
        : ['N', 'S', 'E', 'W'];
  const latText = `${fixed(Math.abs(lat), 2)}° ${lat >= 0 ? north : south}`;
  const lngText = `${fixed(Math.abs(lng), 2)}° ${lng >= 0 ? east : west}`;
  return `${latText}, ${lngText}`;
}

/** Clock options: "14:05" or "2:05 PM", whichever the browser's language uses. */
function clockOptions(): Intl.DateTimeFormatOptions {
  return currentUnits().hour12
    ? { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' }
    : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
}

/**
 * A moment as a day and time in a place's time zone, e.g. "Wed 06:00" or
 * "Wed 6:00 AM". Falls back to the browser's zone if the name is unknown.
 */
export function formatDayTimeIn(date: Date, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', ...clockOptions() };
  try {
    return colonTimes(
      new Intl.DateTimeFormat(currentUnits().dateLocale, { ...options, timeZone }).format(date),
    );
  } catch {
    return colonTimes(new Intl.DateTimeFormat(currentUnits().dateLocale, options).format(date));
  }
}

/** A moment in the browser's own time zone, e.g. "14:20" or "2:20 PM". */
export function formatTimeHere(date: Date): string {
  return colonTimes(
    new Intl.DateTimeFormat(currentUnits().dateLocale, clockOptions()).format(date),
  );
}

/**
 * Current date and time in another time zone, e.g. "Sun 15 Nov, 14:05" or
 * "Sun, Nov 15, 2:05 PM". Falls back to a fixed UTC offset if the browser
 * doesn't know the zone name.
 */
export function formatLocalNow(timeZone: string, utcOffsetSeconds: number): string {
  const { dateLocale } = currentUnits();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...clockOptions(),
  };
  try {
    return capitalised(
      colonTimes(new Intl.DateTimeFormat(dateLocale, { ...options, timeZone }).format(new Date())),
    );
  } catch {
    const shifted = new Date(Date.now() + utcOffsetSeconds * 1000);
    return capitalised(
      colonTimes(
        new Intl.DateTimeFormat(dateLocale, { ...options, timeZone: 'UTC' }).format(shifted),
      ),
    );
  }
}

// Open-Meteo times (with timezone=auto) are local to the location and carry
// no offset, e.g. "2026-11-15T14:00". Read them as text rather than through
// new Date(), which would shift them into the browser's own time zone.

/** "2026-11-15T14:05" as a UTC Date, for formatting the wall-clock time. */
function wallClock(localIsoTime: string): Date {
  const hours = Number(localIsoTime.slice(11, 13));
  const minutes = Number(localIsoTime.slice(14, 16));
  return new Date(Date.UTC(2000, 0, 1, hours, minutes));
}

/** "2026-11-15T14:05" → "14:05", or "2:05 PM" with a 12-hour clock. */
export function formatClockTime(localIsoTime: string): string {
  if (!currentUnits().hour12) return localIsoTime.slice(11, 16);
  return new Intl.DateTimeFormat(currentUnits().dateLocale, {
    ...clockOptions(),
    timeZone: 'UTC',
  }).format(wallClock(localIsoTime));
}

/** An hour in the hourly forecast: "14:00", or the shorter "2 PM". */
export function formatHour(localIsoTime: string): string {
  if (!currentUnits().hour12) return localIsoTime.slice(11, 16);
  return new Intl.DateTimeFormat(currentUnits().dateLocale, {
    hour: 'numeric',
    hourCycle: 'h12',
    timeZone: 'UTC',
  }).format(wallClock(localIsoTime));
}

/** "2026-11-16" → "Mon" */
export function formatWeekday(localIsoDate: string): string {
  const [year, month, day] = localIsoDate.split('-').map(Number);
  // A calendar date has no time zone; format it in UTC so it can't shift.
  const date = new Date(Date.UTC(year, month - 1, day));
  const language = currentLanguage();
  const locale = language === 'en' ? 'en-GB' : LANGUAGE_LOCALES[language];
  return capitalised(
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date),
  );
}

/** "2026-11-18" → "Wednesday 18 Nov" (or "Wednesday, Nov 18" in US style). */
export function formatLongDay(localIsoDate: string): string {
  const [year, month, day] = localIsoDate.split('-').map(Number);
  return capitalised(
    new Intl.DateTimeFormat(currentUnits().dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: currentLanguage() === 'en' ? 'short' : 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day))),
  );
}

/** 14707 → "4 h 05 min" */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours} h ${minutes} min`;
}

/** Formats a value that may be missing, showing a dash instead. */
export function orDash(
  value: number | null | undefined,
  format: (value: number) => string,
): string {
  return value == null ? '–' : format(value);
}
