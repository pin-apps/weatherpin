// Easter egg: searching "Santa" (or "joulupukki", "tomten", …) offers
// Santa's workshop at the Arctic Circle in Rovaniemi, and choosing it opens
// a workshop report above the real weather, made from that weather:
// sleigh flying conditions from the wind, reindeer visibility from fog and
// snow, and the days left to Christmas Eve. Only from that search, like
// the sauna one (sauna.ts): a link or a favourite shows the plain weather.
// Not listed in About. The report (santa-report.ts) loads on demand.

import type { PickedPoint } from './map';
import { t } from './i18n';

/** On the Arctic Circle by Rovaniemi, where Santa is said to receive visitors. */
const WORKSHOP = { lat: 66.5436, lng: 25.8473 };

/** Close enough to see the Arctic Circle line's surroundings. */
export const SANTA_ZOOM = 11;

// Searches that find him, lower case: English, Finnish, Swedish.
const SEARCHES = new Set([
  'santa',
  'santa claus',
  'father christmas',
  'joulupukki',
  'tomte',
  'tomten',
  'jultomte',
  'jultomten',
]);

/** The points opened from the Santa search (others show plain weather). */
const santaPoints = new WeakSet<PickedPoint>();

export function isSantaSearch(query: string): boolean {
  return SEARCHES.has(
    query
      .trim()
      .toLowerCase()
      .replace(/[!.]+$/, ''),
  );
}

/** A new point for the workshop, marked as opened from the Santa search. */
export function santaPoint(): PickedPoint {
  const point = { ...WORKSHOP, name: t("Santa's workshop, Rovaniemi") };
  santaPoints.add(point);
  return point;
}

export function isSantaPoint(point: PickedPoint): boolean {
  return santaPoints.has(point);
}
