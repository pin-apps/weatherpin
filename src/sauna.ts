// Easter egg: searching "sauna" offers Saunalahti in Espoo (literally
// "Sauna Bay"), and choosing it opens a sauna report above the real
// weather. Only from that search: a link or a favourite to the same place
// shows the plain weather, so it stays a secret. Not listed in About. The
// report itself (sauna-report.ts) loads on demand: few ever see it.

import type { PickedPoint } from './map';
import { t } from './i18n';

/** Saunalahti, Espoo (GeoNames), on the Gulf of Finland. */
const SAUNALAHTI = { lat: 60.16312, lng: 24.62012 };

/** Close enough to see the shore. */
export const SAUNA_ZOOM = 12;

/** The points opened from the sauna search (others show plain weather). */
const saunaPoints = new WeakSet<PickedPoint>();

export function isSaunaSearch(query: string): boolean {
  return (
    query
      .trim()
      .toLowerCase()
      .replace(/[!.]+$/, '') === 'sauna'
  );
}

/** A new point for Saunalahti, marked as opened from the sauna search. */
export function saunaPoint(): PickedPoint {
  const point = { ...SAUNALAHTI, name: t('Saunalahti, Finland') };
  saunaPoints.add(point);
  return point;
}

export function isSaunaPoint(point: PickedPoint): boolean {
  return saunaPoints.has(point);
}
