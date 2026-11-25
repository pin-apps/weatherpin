// SMHI warnings (Sweden): https://opendata.smhi.se/apidocs/IBWwarnings
// Free, no key, CC BY 4.0 (credit SMHI). The API has no point query: it
// lists every warning in Sweden with its area as GeoJSON, so the app takes
// the list (tens of KB, kept 5 min) and checks which areas hold the point.

import {
  areaList,
  fetchJson,
  parseDate,
  text,
  type WarningLevel,
  type WeatherWarning,
} from './types';

const WARNINGS_URL = 'https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json';

// One list for every point: warnings.ts caches per point, this per list.
const LIST_TTL_MS = 5 * 60 * 1000;

type Position = [number, number]; // [longitude, latitude]
type Ring = Position[];

interface Geometry {
  type?: unknown;
  coordinates?: unknown;
}

interface Area {
  type?: unknown;
  geometry?: Geometry;
  features?: { geometry?: Geometry }[];
}

interface Translated {
  en?: unknown;
  code?: unknown;
}

interface SmhiWarning {
  event?: Translated;
  warningAreas?: {
    warningLevel?: Translated;
    approximateEnd?: unknown;
    areaName?: { en?: unknown; sv?: unknown };
    affectedAreas?: { en?: unknown; sv?: unknown }[];
    descriptions?: { title?: Translated; text?: Translated }[];
    area?: Area;
  }[];
}

let list: { expiresAt: number; warnings: Promise<SmhiWarning[]> } | undefined;

// Shared by every point, so one tap's abort mustn't cancel it for the next
// (the caller ignores a result it no longer needs).
function warningList(): Promise<SmhiWarning[]> {
  if (list && list.expiresAt > Date.now()) return list.warnings;
  const warnings = fetchJson(WARNINGS_URL).then((data) =>
    Array.isArray(data) ? (data as SmhiWarning[]) : [],
  );
  list = { expiresAt: Date.now() + LIST_TTL_MS, warnings };
  // A failure mustn't stay cached.
  warnings.catch(() => (list = undefined));
  return warnings;
}

function level(code: unknown): WarningLevel {
  switch (code) {
    case 'RED':
      return 'red';
    case 'ORANGE':
      return 'orange';
    case 'YELLOW':
      return 'yellow';
    default:
      return 'info'; // MESSAGE: advice, e.g. a risk of water shortage
  }
}

export async function fetchSmhiWarnings(lat: number, lng: number): Promise<WeatherWarning[]> {
  const result: WeatherWarning[] = [];
  for (const warning of await warningList()) {
    const event = text(warning.event?.en);
    // Land warnings only, as for Norway: sea ones are for boats.
    if (!event || text(warning.event?.code).endsWith('_SEA')) continue;
    for (const area of warning.warningAreas ?? []) {
      if (!area.area || !areaContains(area.area, lng, lat)) continue;
      const warningLevel = level(area.warningLevel?.code);
      result.push({
        title: warningLevel === 'info' ? event : `${event} warning`,
        level: warningLevel,
        ends: parseDate(area.approximateEnd),
        description: (area.descriptions ?? [])
          .map((part) => [text(part.title?.en), text(part.text?.en)].filter(Boolean).join(': '))
          .filter(Boolean)
          .join('\n\n'),
        // English names where SMHI has them ("Skåne County").
        area:
          areaList((area.affectedAreas ?? []).map((name) => text(name.en) || text(name.sv))) ??
          areaList([text(area.areaName?.en) || text(area.areaName?.sv)]),
      });
      break; // One box per warning, even if its areas overlap.
    }
  }
  return result;
}

/** Whether a GeoJSON Feature or FeatureCollection covers the point. */
function areaContains(area: Area, lng: number, lat: number): boolean {
  const geometries = area.features?.map((feature) => feature.geometry) ?? [area.geometry];
  return geometries.some((geometry) => geometry && geometryContains(geometry, lng, lat));
}

function geometryContains(geometry: Geometry, lng: number, lat: number): boolean {
  if (!Array.isArray(geometry.coordinates)) return false;
  // Rivers come as lines: a tapped point is never exactly on one.
  if (geometry.type === 'Polygon') return polygonContains(geometry.coordinates as Ring[], lng, lat);
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as Ring[][]).some((polygon) => polygonContains(polygon, lng, lat));
  }
  return false;
}

/** Inside the outer ring and in none of the holes. */
function polygonContains([outer, ...holes]: Ring[], lng: number, lat: number): boolean {
  return (
    outer !== undefined &&
    ringContains(outer, lng, lat) &&
    !holes.some((hole) => ringContains(hole, lng, lat))
  );
}

/** Ray casting: an odd number of edge crossings means inside. */
function ringContains(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
