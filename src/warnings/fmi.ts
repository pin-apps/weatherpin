// Finland's warnings from FMI, through the site's own broker (worker/):
// FMI's feed doesn't let browsers read it. The broker gives the list of
// warnings in effect, and each warning compact (texts in English, Finnish
// and Swedish, outlines on a 0.005° grid). The point never leaves the
// device: the app checks here which outlines hold it. Warnings already
// fetched stay in the browser's cache (they never change), and the list
// says where each one is, so far-away warnings aren't fetched at all.

import type { Box, FmiWarning, FmiWarningList } from '../../worker/types';
import { GRID } from '../../worker/types';
import { currentLanguage } from '../i18n';
import { areaList, fetchJson, parseDate, WarningsError, type WeatherWarning } from './types';

const API = '/api/fmi';
// Outlines are simplified to ~500 m: count a point that close as inside.
const MARGIN = 1;

function inBox([south, west, north, east]: Box, lat: number, lng: number): boolean {
  return (
    lat >= south - MARGIN && lat <= north + MARGIN && lng >= west - MARGIN && lng <= east + MARGIN
  );
}

/** Ray casting over a flat [lat, lng, lat, lng, …] ring (grid units). */
function inRing(ring: number[], lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [latI, lngI, latJ, lngJ] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
    if (latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) {
      inside = !inside;
    }
  }
  return inside;
}

/** True when one of the warning's areas holds the point (grid units). */
export function covers(warning: Pick<FmiWarning, 'box' | 'polygons'>, lat: number, lng: number) {
  const [y, x] = [lat * GRID, lng * GRID];
  if (!inBox(warning.box, y, x)) return false;
  return warning.polygons.some((ring) => inRing(ring, y, x));
}

function toWarning(fmi: FmiWarning): WeatherWarning | undefined {
  // FMI writes in Finnish, Swedish and English: Norwegian gets English.
  const language = currentLanguage();
  const text =
    (language === 'nb' ? undefined : fmi.texts[language]) ??
    fmi.texts.en ??
    Object.values(fmi.texts)[0];
  if (!text) return undefined;
  return {
    title: text.event,
    level: fmi.level,
    starts: parseDate(fmi.onset),
    ends: parseDate(fmi.expires),
    description: text.description,
    instruction: text.instruction,
    area: areaList(text.areas),
  };
}

/** FMI's warnings in effect, or coming, at a point. */
export async function fetchFmiWarnings(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherWarning[]> {
  const list = (await fetchJson(`${API}/warnings`, signal)) as FmiWarningList;
  if (!Array.isArray(list?.ids))
    throw new WarningsError('The warnings service returned unexpected data.');
  const [y, x] = [lat * GRID, lng * GRID];
  const wanted = list.ids.filter((id) => {
    const box = list.boxes?.[id];
    // Unknown box: not read by the broker yet, so ask for it.
    return box === undefined || (box !== null && inBox(box, y, x));
  });
  const warnings = await Promise.all(
    wanted.map(async (id) => (await fetchJson(`${API}/warning/${id}`, signal)) as FmiWarning),
  );
  const now = Date.now();
  return warnings
    .filter((fmi) => Array.isArray(fmi?.polygons) && fmi.box && covers(fmi, lat, lng))
    .map(toWarning)
    .filter(
      (warning): warning is WeatherWarning => !!warning && !(warning.ends && +warning.ends < now),
    );
}
