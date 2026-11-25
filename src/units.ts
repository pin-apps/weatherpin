// Which units and clock the app shows. The weather is always fetched in
// metric units; src/format.ts converts for display, so switching is instant
// and cached forecasts stay valid.
//
// The user picks °C or °F. Wind, rain and pressure are Automatic (they
// follow °C/°F and the browser's region) unless the user chose one in
// Settings. Defaults (and the clock, which has no switch) come from the
// browser's language, e.g. "en-US" → °F and a 12-hour clock, "en-GB" → °C
// and 24 hours.

import { onStoredChange, readStored, writeStored } from './storage';
import { currentLanguage, LANGUAGE_LOCALES } from './i18n';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'ms' | 'kmh' | 'mph' | 'kn' | 'bft';
export type PrecipitationUnit = 'mm' | 'inch';
export type PressureUnit = 'hPa' | 'inHg' | 'mmHg';

/** Units the user chose over the automatic ones (missing: Automatic). */
export interface ChosenUnits {
  wind?: WindUnit;
  precipitation?: PrecipitationUnit;
  pressure?: PressureUnit;
}
export type ChosenKind = keyof ChosenUnits;

const UNIT_VALUES: Record<ChosenKind, readonly string[]> = {
  wind: ['ms', 'kmh', 'mph', 'kn', 'bft'],
  precipitation: ['mm', 'inch'],
  pressure: ['hPa', 'inHg', 'mmHg'],
};

export interface Units {
  temperature: TemperatureUnit;
  wind: WindUnit;
  precipitation: PrecipitationUnit;
  pressure: PressureUnit;
  /** 12-hour clock ("2:05 PM") instead of 24 hours ("14:05"). */
  hour12: boolean;
  /** English locale for dates, e.g. "en-US" gives "Sun, Nov 15". */
  dateLocale: string;
}

// Stored as nordic-weather:units = { version: 2, temperature, wind?,
// precipitation?, pressure? }. Version 1 had only the temperature.
const STORAGE_KEY = 'units';
const STORAGE_VERSION = 2;

// Countries where °F is the everyday unit.
const FAHRENHEIT_REGIONS = new Set(['US', 'PR', 'BS', 'BZ', 'KY', 'PW']);
// Wind in metres per second is the Nordic custom.
const METRES_PER_SECOND_REGIONS = new Set(['NO', 'SE', 'FI', 'DK', 'IS']);
// Road speeds and wind are in miles per hour in the UK, even with °C.
const MPH_REGIONS = new Set(['GB']);
// Month before day ("Nov 15").
const MONTH_FIRST_LOCALES: Record<string, string> = { US: 'en-US', CA: 'en-CA' };

/** The browser's preferred language, e.g. "en-CA". */
function browserLanguage(): string {
  return navigator.language || 'en-GB';
}

/**
 * The country part of the browser language, e.g. "CA" for "en-CA". A bare
 * language is guessed from its main country ("fi" → FI), except English,
 * which is spoken in too many places to guess.
 */
function browserRegion(): string | undefined {
  try {
    const locale = new Intl.Locale(browserLanguage());
    if (locale.region) return locale.region;
    return locale.language === 'en' ? undefined : locale.maximize().region;
  } catch {
    return undefined;
  }
}

function browserUses12HourClock(): boolean {
  try {
    const { hourCycle } = new Intl.DateTimeFormat(browserLanguage(), {
      hour: 'numeric',
    }).resolvedOptions();
    return hourCycle === 'h11' || hourCycle === 'h12';
  } catch {
    return false;
  }
}

function defaultTemperatureUnit(region: string | undefined): TemperatureUnit {
  return region && FAHRENHEIT_REGIONS.has(region) ? 'fahrenheit' : 'celsius';
}

interface Stored {
  temperature?: TemperatureUnit;
  chosen: ChosenUnits;
}

function stored(): Stored {
  const data = readStored(STORAGE_KEY) as Record<string, unknown> | undefined;
  if (data?.version !== 1 && data?.version !== STORAGE_VERSION) return { chosen: {} };
  const temperature =
    data.temperature === 'celsius' || data.temperature === 'fahrenheit'
      ? data.temperature
      : undefined;
  const chosen: Record<string, unknown> = {};
  for (const kind of Object.keys(UNIT_VALUES) as ChosenKind[]) {
    if (UNIT_VALUES[kind].includes(data[kind] as string)) chosen[kind] = data[kind];
  }
  return { temperature, chosen: chosen as ChosenUnits };
}

function unitsFor(temperature: TemperatureUnit, chosen: ChosenUnits): Units {
  const region = browserRegion();
  const language = currentLanguage();
  const fahrenheit = temperature === 'fahrenheit';
  let wind: WindUnit = 'kmh';
  if (fahrenheit || (region && MPH_REGIONS.has(region))) wind = 'mph';
  else if (region && METRES_PER_SECOND_REGIONS.has(region)) wind = 'ms';
  return {
    temperature,
    wind: chosen.wind ?? wind,
    precipitation: chosen.precipitation ?? (fahrenheit ? 'inch' : 'mm'),
    pressure: chosen.pressure ?? (fahrenheit ? 'inHg' : 'hPa'),
    // Finnish, Swedish and Norwegian: 24-hour clock and their own dates,
    // whatever the browser says.
    hour12: language === 'en' ? browserUses12HourClock() : false,
    dateLocale:
      language === 'en'
        ? ((region && MONTH_FIRST_LOCALES[region]) ?? 'en-GB')
        : LANGUAGE_LOCALES[language],
  };
}

// Kept in memory too, so the switches still work (for this visit) when the
// browser won't let us save them.
const saved = stored();
let temperatureUnit = saved.temperature ?? defaultTemperatureUnit(browserRegion());
let chosen = saved.chosen;
let current = unitsFor(temperatureUnit, chosen);

type Listener = () => void;
const listeners = new Set<Listener>();

export function currentUnits(): Units {
  return current;
}

/** The units the user chose (the rest are Automatic). */
export function chosenUnits(): ChosenUnits {
  return chosen;
}

/** What Automatic gives now, for the Settings hint ("m/s, mm, hPa"). */
export function automaticUnits(): Units {
  return unitsFor(temperatureUnit, {});
}

function apply() {
  current = unitsFor(temperatureUnit, chosen);
  writeStored(STORAGE_KEY, {
    version: STORAGE_VERSION,
    temperature: temperatureUnit,
    ...chosen,
  });
  listeners.forEach((listener) => listener());
}

/** °C or °F: the units left Automatic follow it, chosen ones stay. */
export function setTemperatureUnit(temperature: TemperatureUnit): void {
  if (temperature === temperatureUnit) return;
  temperatureUnit = temperature;
  apply();
}

/** A wind, rain or pressure unit, or 'auto' to follow °C/°F again. */
export function setUnit<K extends ChosenKind>(kind: K, unit: ChosenUnits[K] | 'auto'): void {
  const next: ChosenUnits = { ...chosen };
  if (unit === 'auto') delete next[kind];
  else next[kind] = unit;
  if (next[kind] === chosen[kind]) return;
  chosen = next;
  apply();
}

/** Calls `listener` whenever the units change, here or in another tab. */
export function onUnitsChange(listener: Listener): void {
  listeners.add(listener);
}

// Another tab switched units: follow it.
onStoredChange(STORAGE_KEY, () => {
  const latest = stored();
  const next = unitsFor(latest.temperature ?? temperatureUnit, latest.chosen);
  if (JSON.stringify(next) === JSON.stringify(current)) return;
  temperatureUnit = latest.temperature ?? temperatureUnit;
  chosen = latest.chosen;
  current = next;
  listeners.forEach((listener) => listener());
});
