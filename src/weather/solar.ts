// Where the sun is in the sky, worked out in the browser (no request), for
// the Sky section: golden and blue hour, darkness for stargazing, the
// length of your shadow, and day length on other dates. NOAA's simplified
// formulas, good to a few hundredths of a degree: plenty for minutes.

const RAD = Math.PI / 180;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The sun's declination and right ascension (degrees) at `utcMs`. */
function sunPosition(utcMs: number): { declination: number; rightAscension: number; n: number } {
  // Days since 1 Jan 2000, 12:00 UTC.
  const n = utcMs / DAY_MS + 2440587.5 - 2451545.0;
  const meanLongitude = (280.46 + 0.9856474 * n) % 360;
  const meanAnomaly = (357.528 + 0.9856003 * n) * RAD;
  const longitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;
  return {
    declination: Math.asin(Math.sin(obliquity) * Math.sin(longitude)) / RAD,
    rightAscension:
      Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude)) / RAD,
    n,
  };
}

/** The sun's height above the horizon in degrees (negative below it). */
export function sunElevation(lat: number, lng: number, utcMs: number): number {
  const { declination, rightAscension, n } = sunPosition(utcMs);
  // Sidereal time at Greenwich, in degrees.
  const siderealTime = (((18.697374558 + 24.06570982441908 * n) % 24) + 24) * 15;
  const hourAngle = (siderealTime + lng - rightAscension) * RAD;
  const latitude = lat * RAD;
  const dec = declination * RAD;
  const sine =
    Math.sin(latitude) * Math.sin(dec) + Math.cos(latitude) * Math.cos(dec) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sine))) / RAD;
}

/**
 * Hours of daylight on a calendar date ("2026-12-21") at `lat`, sunrise to
 * sunset with the usual −0.833° (refraction and the sun's size).
 */
export function dayLengthHours(lat: number, isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const { declination } = sunPosition(Date.UTC(year, month - 1, day, 12));
  const latitude = lat * RAD;
  const dec = declination * RAD;
  const cosine =
    (Math.sin(-0.833 * RAD) - Math.sin(latitude) * Math.sin(dec)) /
    (Math.cos(latitude) * Math.cos(dec));
  if (cosine >= 1) return 0;
  if (cosine <= -1) return 24;
  return (2 * Math.acos(cosine)) / RAD / 15;
}

/** A stretch of time, in UTC milliseconds. */
export interface Span {
  start: number;
  end: number;
}

const STEP_MS = 2 * 60 * 1000;

/**
 * The stretches between `fromMs` and `toMs` when the sun's height is in
 * [low, high): e.g. golden hour (−4° to 6°). Found in 2-minute steps.
 */
export function spansWithElevation(
  lat: number,
  lng: number,
  fromMs: number,
  toMs: number,
  low: number,
  high: number,
): Span[] {
  const spans: Span[] = [];
  let start: number | null = null;
  for (let time = fromMs; time <= toMs; time += STEP_MS) {
    const elevation = sunElevation(lat, lng, time);
    const inside = elevation >= low && elevation < high;
    if (inside && start === null) start = time;
    if (!inside && start !== null) {
      spans.push({ start, end: time });
      start = null;
    }
  }
  if (start !== null) spans.push({ start, end: toMs });
  return spans;
}

/** The sun's highest point between `fromMs` and `toMs`, in degrees. */
export function highestElevation(lat: number, lng: number, fromMs: number, toMs: number): number {
  let highest = -90;
  for (let time = fromMs; time <= toMs; time += STEP_MS) {
    highest = Math.max(highest, sunElevation(lat, lng, time));
  }
  return highest;
}
