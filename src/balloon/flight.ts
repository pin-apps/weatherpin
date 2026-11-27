// A balloon's flight, worked out at once from the forecast winds: hour by
// hour it drifts with the wind at its height, for up to 5 days, unless the
// weather brings it down first (thunder, heavy snow or rain, a wind strong
// enough to tear it). The winds come from the nearest point asked for; a
// new point is asked for once the balloon is ~350 km away (winds at height
// change slowly), so a flight takes ~10–30 requests (30 at most: past that
// the last winds carry it on).

import { conditionsAt, fetchWinds, type Conditions, type Level, type Winds } from './winds';

export const MAX_HOURS = 120;
/** Points in a shared link: one every 3 hours (link.ts). */
export const PATH_STEP_HOURS = 3;

const HOUR_MS = 3600 * 1000;
const EARTH_KM = 6371;
const REFETCH_KM = 350;
const MAX_REQUESTS = 30;
const THUNDER_FROM = 95;
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const HEAVY_SNOW_MM = 2; // mm of water an hour
const HEAVY_RAIN_MM = 6;
const TEARING_WIND = 60; // m/s

/** How a flight ended. */
export type Ending = 'landed' | 'storm' | 'snow' | 'rain' | 'torn';
export const ENDINGS: readonly Ending[] = ['landed', 'storm', 'snow', 'rain', 'torn'];

export interface Point {
  lat: number;
  lng: number;
}

/** Where the balloon is at an hour of the flight, and what it meets there. */
export interface FlightHour extends Point {
  hour: number;
  conditions?: Conditions;
}

export interface Flight {
  start: Point;
  /** Launch time, a whole UTC hour (ms). */
  launch: number;
  level: Level;
  /** Hour 0 (the launch) to the landing, one per hour. */
  hours: FlightHour[];
  ending: Ending;
  requests: number;
}

/** The launch time for now: this whole UTC hour. */
export function launchHour(now = Date.now()): number {
  return Math.floor(now / HOUR_MS) * HOUR_MS;
}

/** Flies a balloon from `start` at `level`, launched at `launch`. */
export async function fly(
  start: Point,
  level: Level,
  launch: number,
  getWinds: (lat: number, lng: number) => Promise<Winds> = (lat, lng) =>
    fetchWinds(lat, lng, [level]),
): Promise<Flight> {
  let winds = await getWinds(start.lat, start.lng);
  let requests = 1;
  let position: Point = { ...start };
  const hours: FlightHour[] = [];
  let ending: Ending = 'landed';

  for (let hour = 0; hour <= MAX_HOURS; hour++) {
    if (distanceKm(position, winds) > REFETCH_KM && requests < MAX_REQUESTS) {
      winds = await getWinds(position.lat, position.lng);
      requests++;
    }
    const conditions = conditionsAt(winds, level, launch + hour * HOUR_MS);
    hours.push({ ...position, hour, conditions });
    if (!conditions || hour === MAX_HOURS) break;
    // Not in the first hours: a storm at the launch place isn't a flight.
    const brought = hour >= 2 ? broughtDown(conditions) : undefined;
    if (brought) {
      ending = brought;
      break;
    }
    position = destination(position, (conditions.windFrom + 180) % 360, conditions.windSpeed * 3.6);
  }
  return { start, launch, level, hours, ending, requests };
}

function broughtDown(c: Conditions): Ending | undefined {
  if ((c.groundCode ?? 0) >= THUNDER_FROM) return 'storm';
  if (c.windSpeed >= TEARING_WIND) return 'torn';
  const snowing = SNOW_CODES.has(c.groundCode ?? -1) || (c.groundTemperature ?? 5) <= 0;
  if (snowing && c.precipitation >= HEAVY_SNOW_MM) return 'snow';
  if (c.precipitation >= HEAVY_RAIN_MM) return 'rain';
  return undefined;
}

/** The point `km` away from `from` in direction `bearing` (degrees). */
export function destination(from: Point, bearing: number, km: number): Point {
  const rad = Math.PI / 180;
  const angle = km / EARTH_KM;
  const lat1 = from.lat * rad;
  const lng1 = from.lng * rad;
  const b = bearing * rad;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angle) + Math.cos(lat1) * Math.sin(angle) * Math.cos(b),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(angle) * Math.cos(lat1),
      Math.cos(angle) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / rad, lng: normaliseLng(lng2 / rad) };
}

/** Great-circle distance in km. */
export function distanceKm(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function normaliseLng(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/**
 * The flight as a link carries it: a point every 3 hours, and the landing.
 * Distances everywhere come from this path, so a shared flight reads the
 * same as at home.
 */
export function pathOf(flight: Flight): FlightHour[] {
  const last = flight.hours[flight.hours.length - 1];
  const path = flight.hours.filter((h) => h.hour % PATH_STEP_HOURS === 0);
  if (path[path.length - 1] !== last) path.push(last);
  return path;
}

/** The length of a path, in km. */
export function pathKm(path: readonly Point[]): number {
  let km = 0;
  for (let i = 1; i < path.length; i++) km += distanceKm(path[i - 1], path[i]);
  return km;
}
