// The last few forecasts shown, kept on this device so a place can still
// show its weather without a connection (with "No connection" and the time
// it's from). Opening the app itself with no connection at all would need
// a service worker (see BACKLOG.md).

import { readStored, writeStored } from '../storage';
import type { Forecast } from './api';

// Stored as nordic-weather:saved-forecasts = [{ key, forecast }, …], the
// newest first. A forecast is ~30 KB of JSON; a few fit easily.
const STORAGE_KEY = 'saved-forecasts';
const MAX_PLACES = 3;
// Older than this, even a 7-day forecast has little left to say.
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

interface SavedForecast {
  /** The place, as rounded for the request ("60.17,24.94"). */
  key: string;
  forecast: Forecast;
}

function loadAll(): SavedForecast[] {
  const saved = readStored(STORAGE_KEY);
  if (!Array.isArray(saved)) return [];
  // Damaged or from an older version: skipped.
  return (saved as Partial<SavedForecast>[]).filter(
    (entry): entry is SavedForecast =>
      typeof entry?.key === 'string' &&
      typeof entry.forecast?.fetchedAt === 'number' &&
      typeof entry.forecast.current?.temperature_2m === 'number',
  );
}

/** Keeps `forecast` for this place, replacing its older one. */
export function saveForecast(key: string, forecast: Forecast): void {
  const others = loadAll().filter((entry) => entry.key !== key);
  const all = [{ key, forecast }, ...others].slice(0, MAX_PLACES);
  // If the browser's storage is full, keep at least this place.
  if (!writeStored(STORAGE_KEY, all)) writeStored(STORAGE_KEY, all.slice(0, 1));
}

/** This place's saved forecast, marked `offline`, if there's a recent one. */
export function savedForecast(key: string): Forecast | undefined {
  const entry = loadAll().find((saved) => saved.key === key);
  if (!entry || Date.now() - entry.forecast.fetchedAt > MAX_AGE_MS) return undefined;
  return { ...entry.forecast, offline: true };
}
