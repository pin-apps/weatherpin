// US National Weather Service alerts: https://www.weather.gov/documentation/services-web-api
// Free, no key, public domain. Points outside the US are rejected (HTTP
// 400), so this is only asked for places in US time zones.

import {
  areaList,
  fetchJson,
  parseDate,
  text,
  type WarningLevel,
  type WeatherWarning,
} from './types';

const URL_BASE = 'https://api.weather.gov/alerts/active';

interface NwsAlert {
  event?: unknown;
  severity?: unknown;
  status?: unknown;
  messageType?: unknown;
  description?: unknown;
  instruction?: unknown;
  ends?: unknown;
  expires?: unknown;
  /** Zone names, separated by semicolons. */
  areaDesc?: unknown;
  geocode?: { UGC?: unknown };
}

// Marine zone codes start with one of these (land zones with a state:
// "CAZ006"; coastal waters: "PZZ530"). None is a state code.
const MARINE_PREFIXES = new Set([
  'AM',
  'AN',
  'GM',
  'LC',
  'LE',
  'LH',
  'LM',
  'LO',
  'LS',
  'PH',
  'PK',
  'PM',
  'PS',
  'PZ',
  'SL',
]);

/** Every zone of the alert is at sea (or on the Great Lakes). */
function isMarine(ugc: unknown): boolean {
  const zones = Array.isArray(ugc) ? ugc.map(text).filter(Boolean) : [];
  return zones.length > 0 && zones.every((zone) => MARINE_PREFIXES.has(zone.slice(0, 2)));
}

// NWS gives severity, not colours.
const LEVELS: Record<string, WarningLevel> = {
  Extreme: 'red',
  Severe: 'orange',
  Moderate: 'yellow',
  Minor: 'yellow',
};

export async function fetchNwsWarnings(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherWarning[]> {
  // The API takes at most 4 decimals.
  const point = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const data = (await fetchJson(`${URL_BASE}?point=${point}`, signal)) as {
    features?: { properties?: NwsAlert }[];
  };
  const warnings: WeatherWarning[] = [];
  for (const feature of data?.features ?? []) {
    const alert = feature?.properties;
    // Real alerts only (not tests or exercises), and not cancellations.
    if (!alert || alert.status !== 'Actual' || alert.messageType === 'Cancel') continue;
    const title = text(alert.event);
    if (!title) continue;
    warnings.push({
      title,
      level: LEVELS[text(alert.severity)] ?? 'info',
      ends: parseDate(alert.ends) ?? parseDate(alert.expires),
      description: text(alert.description),
      instruction: text(alert.instruction) || undefined,
      area: areaList(text(alert.areaDesc).split(';')),
      marine: isMarine(alert.geocode?.UGC),
    });
  }
  return warnings;
}
