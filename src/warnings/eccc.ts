// Environment and Climate Change Canada warnings, from its MSC GeoMet OGC
// API: https://api.weather.gc.ca/collections/weather-alerts
// Free, no key, Open Government Licence – Canada. Areas are polygons; we ask
// for the ones touching a tiny box around the point.

import {
  areaList,
  fetchJson,
  parseDate,
  text,
  type WarningLevel,
  type WeatherWarning,
} from './types';

const URL_BASE = 'https://api.weather.gc.ca/collections/weather-alerts/items';
// ~100 m around the point.
const BOX = 0.001;

// Alerts stay in the feed for a while after they end.
const OVER = new Set(['ended', 'cancelled']);

interface EcccAlert {
  alert_name_en?: unknown;
  alert_type?: unknown;
  risk_colour_en?: unknown;
  status_en?: unknown;
  alert_text_en?: unknown;
  event_end_datetime?: unknown;
  expiration_datetime?: unknown;
  /** E.g. "City of Toronto". */
  feature_name_en?: unknown;
}

function level(colour: unknown): WarningLevel {
  return colour === 'red' || colour === 'orange' || colour === 'yellow' ? colour : 'info';
}

/** "snowfall warning" → "Snowfall warning" */
function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function fetchEcccWarnings(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherWarning[]> {
  const params = new URLSearchParams({
    f: 'json',
    bbox: [lng - BOX, lat - BOX, lng + BOX, lat + BOX].join(','),
    skipGeometry: 'true',
    limit: '50',
  });
  const data = (await fetchJson(`${URL_BASE}?${params}`, signal)) as {
    features?: { properties?: EcccAlert }[];
  };
  const now = Date.now();
  // Same alert listed for several areas: one box, naming each area.
  const seen = new Map<string, { warning: WeatherWarning; areas: string[] }>();
  for (const feature of data?.features ?? []) {
    const alert = feature?.properties;
    if (!alert || OVER.has(text(alert.status_en))) continue;
    const expires = parseDate(alert.expiration_datetime);
    if (expires && expires.getTime() < now) continue;
    const title = capitalise(text(alert.alert_name_en));
    const description = text(alert.alert_text_en);
    if (!title) continue;
    // One alert covers many areas; the point can sit in several of them.
    const key = `${title}\n${description}`;
    const area = text(alert.feature_name_en);
    const known = seen.get(key);
    if (known) {
      known.areas.push(area);
      continue;
    }
    seen.set(key, {
      warning: {
        title,
        level: level(alert.risk_colour_en),
        ends: parseDate(alert.event_end_datetime) ?? expires,
        description,
      },
      areas: [area],
    });
  }
  return [...seen.values()].map(({ warning, areas }) => ({ ...warning, area: areaList(areas) }));
}
