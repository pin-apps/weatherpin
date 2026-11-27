// A finished flight as a link, so a friend sees the same flight:
//   #balloon=1.6017,2494.2026112714.500.red.81.snow.<path>[.<name>]
// version, launch place (centidegrees, ~1 km), launch hour (UTC), height (hPa), colour,
// hours in the air, how it ended, the path (a point every 3 hours and the
// landing, as centidegree steps in base64url) and the balloon's name.
// Nothing personal; it stays in the browser (a #hash is never sent to the
// server). The distance is worked out from the path, never read from the
// link, and a path that jumps further than any wind could carry it is
// refused, as is anything else odd: the link is then just ignored.

import {
  ENDINGS,
  MAX_HOURS,
  PATH_STEP_HOURS,
  distanceKm,
  normaliseLng,
  type Ending,
  type Point,
} from './flight';
import { LEVELS, type Level } from './winds';

export const COLOURS = ['red', 'blue', 'yellow', 'green'] as const;
export type Colour = (typeof COLOURS)[number];
export const NAME_MAX = 20;

export interface SharedFlight {
  start: Point;
  launch: number;
  level: Level;
  colour: Colour;
  hours: number;
  ending: Ending;
  /** A point every 3 hours from the launch, and the landing. */
  path: Point[];
  name?: string;
}

const PREFIX = '#balloon=';
const VERSION = '1';
// Faster than any wind it flies in (it's torn at 60 m/s), over 3 hours.
const MAX_STEP_KM = 70 * 3.6 * PATH_STEP_HOURS;

export function isBalloonLink(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

/** The link's #hash for a flight. */
export function balloonHash(flight: SharedFlight): string {
  const parts = [
    VERSION,
    `${Math.round(flight.start.lat * 100)},${Math.round(flight.start.lng * 100)}`,
    new Date(flight.launch).toISOString().slice(0, 13).replace(/\D/g, ''),
    String(flight.level),
    flight.colour,
    String(flight.hours),
    flight.ending,
    encodePath(flight.path),
  ];
  const name = cleanName(flight.name ?? '');
  if (name) parts.push(encodeURIComponent(name));
  return PREFIX + parts.join('.');
}

/** The flight in a #hash, or undefined if it isn't a sound one. */
export function readBalloonHash(hash: string): SharedFlight | undefined {
  if (!isBalloonLink(hash)) return undefined;
  const parts = hash.slice(PREFIX.length).split('.');
  // A name may hold dots of its own: everything after the path is the name.
  const [version, place, time, levelText, colour, hoursText, ending, pathText] = parts;
  if (version !== VERSION || parts.length < 8) return undefined;
  const [latCenti, lngCenti] = (place ?? '').split(',').map(Number);
  const [lat, lng] = [latCenti / 100, lngCenti / 100];
  const level = Number(levelText) as Level;
  const hours = Number(hoursText);
  const timeMatch = /^(\d{4})(\d\d)(\d\d)(\d\d)$/.exec(time ?? '');
  if (
    !Number.isInteger(latCenti) ||
    !Number.isInteger(lngCenti) ||
    !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ||
    !timeMatch ||
    !LEVELS.includes(level) ||
    !(COLOURS as readonly string[]).includes(colour) ||
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > MAX_HOURS ||
    !(ENDINGS as readonly string[]).includes(ending)
  ) {
    return undefined;
  }
  const [, y, mo, d, h] = timeMatch;
  const launch = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h));
  const path = decodePath(pathText ?? '');
  const expected = Math.floor(hours / PATH_STEP_HOURS) + 1 + (hours % PATH_STEP_HOURS ? 1 : 0);
  if (!path || path.length !== expected || Number.isNaN(launch)) return undefined;
  if (distanceKm(path[0], { lat, lng }) > 2) return undefined;
  for (let i = 1; i < path.length; i++) {
    if (Math.abs(path[i].lat) > 90 || distanceKm(path[i - 1], path[i]) > MAX_STEP_KM) {
      return undefined;
    }
  }
  let name: string | undefined;
  try {
    name = cleanName(decodeURIComponent(parts.slice(8).join('.')));
  } catch {
    return undefined;
  }
  return {
    start: { lat, lng },
    launch,
    level,
    colour: colour as Colour,
    hours,
    ending: ending as Ending,
    path,
    name: name || undefined,
  };
}

/** A name as shown: no control characters, no extra spaces, 20 at most. */
export function cleanName(name: string): string {
  return [
    ...name
      .replace(/\p{Cc}/gu, '')
      .replace(/\s+/g, ' ')
      .trim(),
  ]
    .slice(0, NAME_MAX)
    .join('')
    .trim();
}

// Path: steps of whole centidegrees (~1 km), each as a zigzag varint, all
// in base64url, so the link has no characters that chat apps break on.

function encodePath(path: readonly Point[]): string {
  const bytes: number[] = [];
  let lat = 0;
  let lng = 0;
  for (const point of path) {
    const nextLat = Math.round(point.lat * 100);
    const nextLng = Math.round(point.lng * 100);
    // The short way round across the date line.
    let dLng = nextLng - lng;
    if (dLng > 18000) dLng -= 36000;
    if (dLng < -18000) dLng += 36000;
    pushVarint(bytes, nextLat - lat);
    pushVarint(bytes, dLng);
    lat = nextLat;
    lng = nextLng;
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodePath(text: string): Point[] | undefined {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return undefined;
  let binary: string;
  try {
    binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return undefined;
  }
  const bytes = [...binary].map((char) => char.charCodeAt(0));
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const byte of bytes) {
    value |= (byte & 0x7f) << shift;
    shift += 7;
    if (shift > 28) return undefined;
    if (!(byte & 0x80)) {
      values.push(value & 1 ? -((value + 1) >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  if (shift !== 0 || values.length % 2 !== 0) return undefined;
  const path: Point[] = [];
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < values.length; i += 2) {
    lat += values[i];
    lng += values[i + 1];
    path.push({ lat: lat / 100, lng: normaliseLng(lng / 100) });
  }
  return path;
}

function pushVarint(bytes: number[], signed: number) {
  let value = signed < 0 ? -signed * 2 - 1 : signed * 2;
  while (value >= 0x80) {
    bytes.push((value & 0x7f) | 0x80);
    value = Math.floor(value / 128);
  }
  bytes.push(value);
}
