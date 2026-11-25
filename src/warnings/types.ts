// Severe weather warnings from official services. Each source module turns
// its own format into these.

/** Colour level: as the issuer gives it, or mapped from its severity. */
export type WarningLevel = 'red' | 'orange' | 'yellow' | 'info';

export interface WeatherWarning {
  /** E.g. "Snowfall warning", "Winter Storm Warning", "Gale warning". */
  title: string;
  level: WarningLevel;
  /** When it starts, if the issuer says (some are issued ahead). */
  starts?: Date;
  /** When it ends (or expires), if the issuer says. */
  ends?: Date;
  description: string;
  /** What to do, if the issuer says. */
  instruction?: string;
  /** Where it applies, e.g. "San Francisco", so a nearby tap isn't puzzling. */
  area?: string;
  /** For a sea area (boats), not land. */
  marine?: boolean;
}

// More area names than this reads as noise: "A, B, C…".
const MAX_AREAS = 3;

/** Area names as one short line, without repeats. */
export function areaList(names: string[]): string | undefined {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) return undefined;
  const shown = unique.slice(0, MAX_AREAS).join(', ');
  return unique.length > MAX_AREAS ? `${shown}…` : shown;
}

export type WarningSource = 'eccc' | 'nws' | 'metno' | 'smhi' | 'fmi';

export const SOURCE_NAMES: Record<WarningSource, string> = {
  eccc: 'Environment and Climate Change Canada',
  nws: 'US National Weather Service',
  metno: 'MET Norway',
  smhi: 'SMHI',
  fmi: 'Finnish Meteorological Institute',
};

/** Where people can read all of the issuer's warnings. */
export const SOURCE_LINKS: Record<WarningSource, string> = {
  eccc: 'https://weather.gc.ca/warnings/index_e.html',
  nws: 'https://www.weather.gov/',
  metno: 'https://www.yr.no/en',
  smhi: 'https://www.smhi.se/en/weather/warnings-and-forecasts/warnings-and-advisories',
  // English; render/warnings.ts links FMI's page in the app's language.
  fmi: 'https://en.ilmatieteenlaitos.fi/warnings',
};

/** Most serious first. */
export const LEVEL_ORDER: WarningLevel[] = ['red', 'orange', 'yellow', 'info'];

export class WarningsError extends Error {}

/** fetch() with the same error handling for every source. */
export async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new WarningsError('Could not reach the warnings service.');
  }
  if (!response.ok) throw new WarningsError(`Warnings error (HTTP ${response.status}).`);
  try {
    return await response.json();
  } catch {
    throw new WarningsError('The warnings service returned unexpected data.');
  }
}

/** A date from the API, or undefined if it's missing or not a date. */
export function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time);
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
