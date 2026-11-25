// The place the app opens at, if the user has chosen one ("Open the app
// here" in the weather panel). Saved on the device only, and only when the
// user asks; without one the app opens at the world map.

import type { PickedPoint } from './map';
import { samePlace } from './places/same-place';
import { onStoredChange, readStored, storageAvailable, writeStored } from './storage';
import { roundCoordinate } from './weather/api';

// Stored as nordic-weather:start-place = { version, place } (place: null
// once removed).
const STORAGE_KEY = 'start-place';
const STORAGE_VERSION = 1;

/** Whether a start place can be saved at all in this browser. */
export function startPlaceAvailable(): boolean {
  return storageAvailable();
}

export function loadStartPlace(): PickedPoint | undefined {
  const data = readStored(STORAGE_KEY) as { version?: number; place?: unknown } | undefined;
  if (data?.version !== STORAGE_VERSION) return undefined;
  const place = data.place as Partial<PickedPoint> | null | undefined;
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return undefined;
  return {
    lat: place.lat!,
    lng: place.lng!,
    ...(typeof place.name === 'string' ? { name: place.name } : {}),
  };
}

export function isStartPlace(point: { lat: number; lng: number }): boolean {
  const start = loadStartPlace();
  return start !== undefined && samePlace(start, point);
}

/**
 * Saves `point` as the start place, replacing any earlier one. Coordinates
 * are rounded to ~1 km, so a "My location" point doesn't store exactly
 * where the user is. False if the browser wouldn't save it.
 */
export function setStartPlace(point: PickedPoint): boolean {
  const place: PickedPoint = { lat: roundCoordinate(point.lat), lng: roundCoordinate(point.lng) };
  if (point.name) place.name = point.name;
  return writeStored(STORAGE_KEY, { version: STORAGE_VERSION, place });
}

export function clearStartPlace(): void {
  writeStored(STORAGE_KEY, { version: STORAGE_VERSION, place: null });
}

/** Calls `listener` whenever the start place changes, here or in another tab. */
export function onStartPlaceChange(listener: () => void): void {
  onStoredChange(STORAGE_KEY, listener);
}
