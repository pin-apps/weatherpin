// Road conditions in Finland from Fintraffic's Digitraffic road weather
// service (tie.digitraffic.fi, CC BY 4.0, no key, open to browsers): the
// road weather model's forecast for ~280 sections of the main roads, now
// and 2–12 hours ahead: normal, poor or extremely poor, and why (partly
// icy, slush…). The app takes the main road section nearest the point,
// within 30 km; farther away it says nothing.

import { msg } from '../i18n';

const BASE = 'https://tie.digitraffic.fi/api/weather/v1/forecast-sections-simple';
// Digitraffic asks clients to name themselves (no personal details).
const HEADERS = { 'Digitraffic-User': 'Weatherpin' };

const NEAR_KM = 30;
// Where the sections are barely changes; the forecasts every ~10 min.
const SECTIONS_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const FORECASTS_MAX_AGE_MS = 10 * 60 * 1000;

export interface RoadConditions {
  level: 'normal' | 'poor' | 'very-poor';
  /** A `msg()` text, e.g. "partly icy"; none for normal conditions. */
  reason?: string;
  /** The section, e.g. "Vt 4: Oulu - Kemi". */
  road: string;
  /** Fintraffic's traffic map at the place, road conditions layer on. */
  mapLink: string;
}

// Fintraffic's traffic situation map (liikennetilanne.fintraffic.fi): its
// own links open it at x/y (Web Mercator metres) and zoom, with layers by
// number; 4 is road conditions ("keli").
const TRAFFIC_MAP = 'https://liikennetilanne.fintraffic.fi/kartta/';
const ROAD_CONDITIONS_LAYER = 4;
const MAP_ZOOM = 10;
const EARTH_RADIUS_M = 6378137;

/** The traffic map at a point, showing road conditions. */
export function trafficMapLink(lat: number, lng: number): string {
  const x = Math.round((EARTH_RADIUS_M * lng * Math.PI) / 180);
  const y = Math.round(EARTH_RADIUS_M * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)));
  return `${TRAFFIC_MAP}?x=${x}&y=${y}&z=${MAP_ZOOM}&checkedLayers=${ROAD_CONDITIONS_LAYER}`;
}

interface Section {
  id: string;
  road: string;
  /** [lng, lat] points along the road. */
  line: [number, number][];
}

interface SectionForecast {
  time: string;
  overallRoadCondition?: string;
  forecastConditionReason?: Record<string, string | boolean>;
}

const LEVELS: Record<string, RoadConditions['level']> = {
  NORMAL_CONDITION: 'normal',
  POOR_CONDITION: 'poor',
  EXTREMELY_POOR_CONDITION: 'very-poor',
};

// Why conditions are poor, most important first.
const REASONS: [key: string, value: string | boolean, text: string][] = [
  ['freezingRainCondition', true, msg('freezing rain')],
  ['frictionCondition', 'VERY_SLIPPERY', msg('very slippery')],
  ['frictionCondition', 'SLIPPERY', msg('slippery')],
  ['roadCondition', 'ICY', msg('icy')],
  ['roadCondition', 'PARTLY_ICY', msg('partly icy')],
  ['roadCondition', 'SLUSH', msg('slush')],
  ['roadCondition', 'SNOW', msg('snow on the road')],
  ['roadCondition', 'FROST', msg('frost on the road')],
  ['precipitationCondition', 'HEAVY_SNOWFALL', msg('heavy snowfall')],
  ['precipitationCondition', 'SNOWFALL', msg('snowfall')],
  ['windCondition', 'STRONG', msg('strong wind')],
  ['roadCondition', 'WET', msg('wet road')],
];

let sections: { at: number; value: Promise<Section[]> } | undefined;
let forecasts: { at: number; value: Promise<Map<string, SectionForecast[]>> } | undefined;

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { headers: HEADERS, signal });
  if (!response.ok) throw new Error(`Digitraffic: HTTP ${response.status}`);
  return response.json();
}

/** Kept for a while and shared by every place; a failure isn't kept. */
function cached<T>(
  entry: { at: number; value: Promise<T> } | undefined,
  maxAge: number,
  load: () => Promise<T>,
  store: (entry: { at: number; value: Promise<T> } | undefined) => void,
): Promise<T> {
  if (entry && Date.now() - entry.at < maxAge) return entry.value;
  const value = load();
  store({ at: Date.now(), value });
  value.catch(() => store(undefined));
  return value;
}

function loadSections(): Promise<Section[]> {
  return cached(
    sections,
    SECTIONS_MAX_AGE_MS,
    async () => {
      const data = (await getJson(BASE)) as {
        features?: {
          id: string;
          geometry?: { coordinates?: number[][] };
          properties?: { description?: string };
        }[];
      };
      return (data.features ?? []).map((feature) => ({
        id: feature.id,
        road: feature.properties?.description ?? feature.id,
        line: (feature.geometry?.coordinates ?? []).map(
          ([lng, lat]) => [lng, lat] as [number, number],
        ),
      }));
    },
    (entry) => (sections = entry),
  );
}

function loadForecasts(): Promise<Map<string, SectionForecast[]>> {
  return cached(
    forecasts,
    FORECASTS_MAX_AGE_MS,
    async () => {
      const data = (await getJson(`${BASE}/forecasts`)) as {
        forecastSections?: { id: string; forecasts?: SectionForecast[] }[];
      };
      return new Map((data.forecastSections ?? []).map((s) => [s.id, s.forecasts ?? []]));
    },
    (entry) => (forecasts = entry),
  );
}

/** Distance in km from a point to a road, on a flat map around the point. */
function distanceKm(lat: number, lng: number, line: [number, number][]): number {
  const kmPerLat = 111.2;
  const kmPerLng = 111.2 * Math.cos((lat * Math.PI) / 180);
  const xy = ([pLng, pLat]: [number, number]) => [(pLng - lng) * kmPerLng, (pLat - lat) * kmPerLat];
  let best = Infinity;
  for (let i = 0; i < line.length; i++) {
    const [ax, ay] = xy(line[i]);
    const [bx, by] = i + 1 < line.length ? xy(line[i + 1]) : [ax, ay];
    // Nearest point of the segment a–b to the origin (the point).
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const along = length === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length));
    best = Math.min(best, Math.hypot(ax + along * dx, ay + along * dy));
  }
  return best;
}

function reasonOf(forecast: SectionForecast): string | undefined {
  const reasons = forecast.forecastConditionReason ?? {};
  return REASONS.find(([key, value]) => reasons[key] === value)?.[2];
}

const RANK = { normal: 0, poor: 1, 'very-poor': 2 };

/**
 * The worst road conditions now and in the next 12 hours on the main road
 * nearest the point, or null when no main road is within 30 km.
 */
export async function fetchRoadConditions(
  lat: number,
  lng: number,
): Promise<RoadConditions | null> {
  const [all, byId] = await Promise.all([loadSections(), loadForecasts()]);
  let nearest: Section | undefined;
  let nearestKm = NEAR_KM;
  for (const section of all) {
    const km = distanceKm(lat, lng, section.line);
    if (km <= nearestKm) {
      nearest = section;
      nearestKm = km;
    }
  }
  if (!nearest) return null;

  const mapLink = trafficMapLink(lat, lng);
  let worst: RoadConditions = { level: 'normal', road: nearest.road, mapLink };
  for (const forecast of byId.get(nearest.id) ?? []) {
    const level = LEVELS[forecast.overallRoadCondition ?? ''];
    if (level && RANK[level] > RANK[worst.level]) {
      worst = { level, reason: reasonOf(forecast), road: nearest.road, mapLink };
    }
  }
  return worst;
}
