// Links to a place: the page address follows the place in the panel, e.g.
// "#at=60.17,24.94&name=Helsinki", so it can be bookmarked or sent, and the
// browser's Back button goes to the previous place. In the hash, not the
// query: the hash never leaves the browser (no server logs).
//
// Coordinates are rounded to 2 decimals (~1 km), like the start place: a
// shared "My location" link must not give away the user's front door.

import type { PickedPoint } from './map';
import { normaliseLongitude } from './map';

const PRECISION = 2;
// A name from a link is shown as text only; this just keeps it sane.
const MAX_NAME_LENGTH = 100;

function round(value: number): number {
  const factor = 10 ** PRECISION;
  return Math.round(value * factor) / factor;
}

/** The hash for a place, e.g. "#at=60.17,24.94&name=Helsinki". */
export function placeHash(point: PickedPoint): string {
  const params = new URLSearchParams();
  params.set('at', `${round(point.lat)},${round(point.lng)}`);
  if (point.name) params.set('name', point.name.slice(0, MAX_NAME_LENGTH));
  // URLSearchParams writes "," as %2C and spaces as "+"; commas read better.
  return `#${params.toString().replace(/%2C/gi, ',')}`;
}

/** The place in a hash like placeHash's, or undefined if there isn't one. */
export function placeFromHash(hash: string): PickedPoint | undefined {
  if (!hash.startsWith('#at=')) return undefined;
  const params = new URLSearchParams(hash.slice(1));
  const match = /^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(params.get('at') ?? '');
  if (!match) return undefined;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  const point: PickedPoint = { lat: round(lat), lng: round(normaliseLongitude(lng)) };
  const name = params.get('name')?.trim().slice(0, MAX_NAME_LENGTH);
  if (name) point.name = name;
  return point;
}

/** The full address of a place, for sharing. */
export function placeUrl(point: PickedPoint): string {
  const url = new URL(window.location.href);
  url.hash = placeHash(point);
  return url.toString();
}
