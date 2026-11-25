// Favourite places, kept on the device through ../storage (no cookies, no
// server), so favourites don't sync between devices.

import { samePlace } from '../places/same-place';
import { onStoredChange, readStored, storageAvailable, writeStored } from '../storage';

export interface Favourite {
  /** Place name from search, or coordinates for a clicked point. */
  name: string;
  /**
   * The user's own name for it ("Cabin"), if they renamed it. Shown in the
   * app only: links and page titles keep `name`.
   */
  label?: string;
  lat: number;
  /** Normalised to -180..180, like every point the map reports. */
  lng: number;
}

// Stored as nordic-weather:favourites = { version, places }.
const STORAGE_KEY = 'favourites';

// Versioned, so the format can change later without misreading old data.
const STORAGE_VERSION = 1;

/** Keeps the list short enough to scan in the search box. */
export const MAX_FAVOURITES = 20;

/** Long enough for "Grandma's summer cabin", short enough for a list row. */
export const MAX_LABEL_LENGTH = 40;

/** Whether favourites can be saved at all in this browser. */
export function favouritesAvailable(): boolean {
  return storageAvailable();
}

function isFavourite(value: unknown): value is Favourite {
  const place = value as Favourite;
  return (
    typeof place?.name === 'string' && Number.isFinite(place.lat) && Number.isFinite(place.lng)
  );
}

/** Only the fields we know, and a label only if it's usable text. */
function cleaned(place: Favourite): Favourite {
  const { name, lat, lng } = place;
  const label = typeof place.label === 'string' ? place.label.trim() : '';
  return label ? { name, lat, lng, label: label.slice(0, MAX_LABEL_LENGTH) } : { name, lat, lng };
}

/** What the app calls a favourite: the user's name for it, or the place's. */
export function displayName(place: Favourite): string {
  return place.label ?? place.name;
}

/**
 * Saved favourites in the user's order (new ones are added at the end).
 * Damaged or unknown data reads as empty.
 */
export function loadFavourites(): Favourite[] {
  const data = readStored(STORAGE_KEY) as { version?: number; places?: unknown } | undefined;
  if (data?.version !== STORAGE_VERSION || !Array.isArray(data.places)) return [];
  return data.places.filter(isFavourite).map(cleaned).slice(0, MAX_FAVOURITES);
}

/** The saved favourite at this point, if there is one. */
export function findFavourite(point: { lat: number; lng: number }): Favourite | undefined {
  return loadFavourites().find((place) => samePlace(place, point));
}

function saveFavourites(places: Favourite[]): boolean {
  return writeStored(STORAGE_KEY, { version: STORAGE_VERSION, places });
}

export function isSaved(point: { lat: number; lng: number }): boolean {
  return findFavourite(point) !== undefined;
}

export type AddResult = 'added' | 'already-saved' | 'full' | 'failed';

export function addFavourite(place: Favourite): AddResult {
  const places = loadFavourites();
  if (places.some((saved) => samePlace(saved, place))) return 'already-saved';
  if (places.length >= MAX_FAVOURITES) return 'full';
  // At the end: a list the user has arranged keeps its order.
  return saveFavourites([...places, cleaned(place)]) ? 'added' : 'failed';
}

export function removeFavourite(point: { lat: number; lng: number }): void {
  const places = loadFavourites();
  const remaining = places.filter((place) => !samePlace(place, point));
  if (remaining.length !== places.length) saveFavourites(remaining);
}

/** Puts a removed favourite back where it was (for "Undo"). */
export function restoreFavourite(place: Favourite, index: number): boolean {
  const places = loadFavourites();
  if (places.some((saved) => samePlace(saved, place))) return true;
  if (places.length >= MAX_FAVOURITES) return false;
  places.splice(Math.min(index, places.length), 0, cleaned(place));
  return saveFavourites(places);
}

/**
 * Gives a favourite the user's own name. An empty name, or the place's own
 * name, goes back to the place's name.
 */
export function renameFavourite(point: { lat: number; lng: number }, label: string): boolean {
  const places = loadFavourites();
  const index = places.findIndex((place) => samePlace(place, point));
  if (index === -1) return false;
  const { name, lat, lng } = places[index];
  const trimmed = label.trim();
  places[index] = cleaned(
    trimmed && trimmed !== name ? { name, lat, lng, label: trimmed } : { name, lat, lng },
  );
  return saveFavourites(places);
}

/** Moves a favourite one step up (-1) or down (+1) the list. */
export function moveFavourite(point: { lat: number; lng: number }, step: -1 | 1): boolean {
  const places = loadFavourites();
  const from = places.findIndex((place) => samePlace(place, point));
  const to = from + step;
  if (from === -1 || to < 0 || to >= places.length) return false;
  [places[from], places[to]] = [places[to], places[from]];
  return saveFavourites(places);
}

/** Calls `listener` whenever favourites change, here or in another tab. */
export function onFavouritesChange(listener: () => void): void {
  onStoredChange(STORAGE_KEY, listener);
}
