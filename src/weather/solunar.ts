// Fishing times from the moon ("solunar" periods), as in the fishing
// calendars sold in Finland: a main period of about two hours around the
// moon's highest and lowest point (overhead and underfoot), and a shorter
// one around moonrise and moonset. A fishing tradition, not science; the
// panel says so.
//
// The moon's position uses the usual low-precision formulas (a few tenths
// of a degree), so the times are good to a few minutes. No request.

const RAD = Math.PI / 180;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** 1 January 2000, 12:00 UTC: day 0 of the formulas. */
const J2000 = Date.UTC(2000, 0, 1, 12);
/**
 * The moon's centre at rise and set: its parallax lifts it more than
 * refraction and its size, so a little above the geometric horizon.
 */
const RISE_ALTITUDE = 0.125;
/** Step for finding rises, sets and transits; times are interpolated. */
const STEP_MS = 10 * MINUTE_MS;

export interface FishingPeriod {
  /** UTC milliseconds. */
  start: number;
  end: number;
  /** Main (moon overhead or underfoot, ~2 h) or short (rise or set, ~1 h). */
  main: boolean;
}

interface MoonPlace {
  /** Height above the horizon, degrees. */
  altitude: number;
  /** Hour angle, degrees in (−180, 180]: 0 when highest, ±180 when lowest. */
  hourAngle: number;
}

/** Where the moon is for an observer at `utcMs`. */
export function moonPlace(lat: number, lng: number, utcMs: number): MoonPlace {
  const d = (utcMs - J2000) / DAY_MS;
  const meanLongitude = RAD * (218.316 + 13.176396 * d);
  const meanAnomaly = RAD * (134.963 + 13.064993 * d);
  const meanDistance = RAD * (93.272 + 13.22935 * d);
  const longitude = meanLongitude + RAD * 6.289 * Math.sin(meanAnomaly);
  const latitude = RAD * 5.128 * Math.sin(meanDistance);
  const obliquity = RAD * 23.4397;

  const rightAscension = Math.atan2(
    Math.sin(longitude) * Math.cos(obliquity) - Math.tan(latitude) * Math.sin(obliquity),
    Math.cos(longitude),
  );
  const declination = Math.asin(
    Math.sin(latitude) * Math.cos(obliquity) +
      Math.cos(latitude) * Math.sin(obliquity) * Math.sin(longitude),
  );
  const siderealTime = RAD * (280.16 + 360.9856235 * d) + lng * RAD;
  const hourAngle = siderealTime - rightAscension;
  const phi = lat * RAD;
  const altitude = Math.asin(
    Math.sin(phi) * Math.sin(declination) +
      Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const degrees = ((((hourAngle / RAD) % 360) + 540) % 360) - 180;
  return { altitude: altitude / RAD, hourAngle: degrees === -180 ? 180 : degrees };
}

/** Moment between two samples where `value` crosses `target` (linear). */
function crossing(t1: number, v1: number, t2: number, v2: number, target: number): number {
  return t1 + ((target - v1) / (v2 - v1)) * (t2 - t1);
}

/**
 * The fishing periods that end after `from` and start before `to`, in
 * time order: main ones around the moon's highest and lowest point, short
 * ones around moonrise and moonset (none when the moon stays up or down).
 */
export function fishingPeriods(
  lat: number,
  lng: number,
  from: number,
  to: number,
): FishingPeriod[] {
  const periods: FishingPeriod[] = [];
  const around = (moment: number, main: boolean) => {
    const half = (main ? 60 : 30) * MINUTE_MS;
    periods.push({ start: moment - half, end: moment + half, main });
  };
  // Start early enough to catch a period already under way.
  let time = from - 60 * MINUTE_MS;
  let previous = moonPlace(lat, lng, time);
  while (time < to + 60 * MINUTE_MS) {
    const next = time + STEP_MS;
    const place = moonPlace(lat, lng, next);
    const [a, b] = [previous.altitude, place.altitude];
    if ((a - RISE_ALTITUDE) * (b - RISE_ALTITUDE) < 0) {
      around(crossing(time, a, next, b, RISE_ALTITUDE), false);
    }
    const [h1, h2] = [previous.hourAngle, place.hourAngle];
    if (h1 < 0 && h2 >= 0) around(crossing(time, h1, next, h2, 0), true);
    // Underfoot: the hour angle wraps from +180 to −180.
    if (h1 > 90 && h2 < -90) around(crossing(time, h1, next, h2 + 360, 180), true);
    time = next;
    previous = place;
  }
  return periods
    .filter((period) => period.end > from && period.start < to)
    .sort((x, y) => x.start - y.start);
}
