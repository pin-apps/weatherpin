// MET Norway warnings (MetAlerts): https://api.met.no/weatherapi/metalerts/2.0/documentation
// Free, no key, CC BY 4.0 (credit MET Norway). Covers Norway and Svalbard.

import { currentLanguage } from '../i18n';
import {
  areaList,
  fetchJson,
  parseDate,
  text,
  type WarningLevel,
  type WeatherWarning,
} from './types';

const URL_BASE = 'https://api.met.no/weatherapi/metalerts/2.0/current.json';

interface MetnoAlert {
  eventAwarenessName?: unknown;
  riskMatrixColor?: unknown;
  geographicDomain?: unknown;
  status?: unknown;
  description?: unknown;
  instruction?: unknown;
  consequences?: unknown;
  eventEndingTime?: unknown;
  /** E.g. "Agder". */
  area?: unknown;
}

function level(colour: unknown): WarningLevel {
  const name = text(colour).toLowerCase();
  return name === 'red' || name === 'orange' || name === 'yellow' ? name : 'info';
}

export async function fetchMetnoWarnings(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherWarning[]> {
  // MetAlerts writes its warnings in Norwegian ("no") or English.
  const lang = currentLanguage() === 'nb' ? 'no' : 'en';
  const params = new URLSearchParams({ lat: lat.toFixed(4), lon: lng.toFixed(4), lang });
  const data = (await fetchJson(`${URL_BASE}?${params}`, signal)) as {
    features?: { properties?: MetnoAlert; when?: { interval?: unknown[] } }[];
  };
  const warnings: WeatherWarning[] = [];
  for (const feature of data?.features ?? []) {
    const alert = feature?.properties;
    // Land warnings only: marine ones are for boats at sea.
    if (!alert || alert.status !== 'Actual' || alert.geographicDomain === 'marine') continue;
    const name = text(alert.eventAwarenessName);
    if (!name) continue;
    const consequences = text(alert.consequences);
    warnings.push({
      title: `${name} warning`,
      level: level(alert.riskMatrixColor),
      ends: parseDate(alert.eventEndingTime) ?? parseDate(feature.when?.interval?.[1]),
      description: [text(alert.description), consequences].filter(Boolean).join('\n\n'),
      instruction: text(alert.instruction) || undefined,
      area: areaList([text(alert.area)]),
    });
  }
  return warnings;
}
