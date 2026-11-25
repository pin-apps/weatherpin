// The warnings broker's answers for Finland (worker/fmi.ts), as the app
// sees them: the list, and each warning compact. Around the test clock
// (15 Nov 2026, 13:05 UTC).

import type { FmiWarning, FmiWarningList } from '../../worker/types';
import { GRID } from '../../worker/types';

/** A closed rectangle as a flat [lat, lng, …] ring in grid units, and its box. */
function area(south: number, west: number, north: number, east: number) {
  const [s, w, n, e] = [south, west, north, east].map((v) => Math.round(v * GRID));
  return {
    polygons: [[s, w, s, e, n, e, n, w, s, w]],
    box: [s, w, n, e] as [number, number, number, number],
  };
}

const texts = (event: string, fi: string, sv: string, areas: string[]) => ({
  en: { event, description: `${event} text.`, instruction: 'Take care.', areas },
  fi: { event: fi, description: `${fi} teksti.`, areas },
  sv: { event: sv, description: `${sv} text.`, areas },
});

/** Ids: a path under alerts.fmi.fi/cap, as the broker passes them on. */
export const FMI_IDS = {
  helsinkiWind: '2026/11-15/12-00-00Z/2.49.0.1.246.0.0.2026.1000000001.1.xml',
  helsinkiTomorrow: '2026/11-15/12-00-00Z/2.49.0.1.246.0.0.2026.1000000001.2.xml',
  lapland: '2026/11-15/12-00-00Z/2.49.0.1.246.0.0.2026.1000000001.3.xml',
  expired: '2026/11-15/12-00-00Z/2.49.0.1.246.0.0.2026.1000000001.4.xml',
  cancelled: '2026/11-15/12-00-00Z/2.49.0.1.246.0.0.2026.1000000001.5.xml',
} as const;

export const FMI_WARNINGS: Record<string, FmiWarning | { id: string; none: true }> = {
  [FMI_IDS.helsinkiWind]: {
    id: FMI_IDS.helsinkiWind,
    level: 'orange',
    onset: '2026-11-15T10:00:00+02:00',
    expires: '2026-11-16T06:00:00+02:00',
    texts: texts('Wind warning', 'Tuulivaroitus', 'Vindvarning', ['Helsinki', 'Espoo']),
    ...area(60.0, 24.5, 60.4, 25.4),
  },
  // Issued ahead: starts tomorrow night.
  [FMI_IDS.helsinkiTomorrow]: {
    id: FMI_IDS.helsinkiTomorrow,
    level: 'yellow',
    onset: '2026-11-16T00:00:00+02:00',
    expires: '2026-11-16T09:00:00+02:00',
    texts: texts('Traffic weather warning', 'Liikennesäävaroitus', 'Varning för trafikväder', [
      'Uusimaa',
    ]),
    ...area(59.8, 24.0, 60.6, 26.0),
  },
  // Far away: the list's box lets the app skip it without asking.
  [FMI_IDS.lapland]: {
    id: FMI_IDS.lapland,
    level: 'red',
    onset: '2026-11-15T10:00:00+02:00',
    expires: '2026-11-16T06:00:00+02:00',
    texts: texts('Snowfall warning', 'Lumisadevaroitus', 'Snöfallsvarning', ['Lappi']),
    ...area(66.0, 23.0, 69.0, 29.0),
  },
  // Already over (12:00 local = 10:00 UTC, before the test clock).
  [FMI_IDS.expired]: {
    id: FMI_IDS.expired,
    level: 'yellow',
    onset: '2026-11-15T06:00:00+02:00',
    expires: '2026-11-15T12:00:00+02:00',
    texts: texts('Old warning', 'Vanha varoitus', 'Gammal varning', ['Helsinki']),
    ...area(60.0, 24.5, 60.4, 25.4),
  },
  [FMI_IDS.cancelled]: { id: FMI_IDS.cancelled, none: true },
};

/** The list: every id; boxes for all but the expired one (as if not read yet). */
export function fmiListFixture(active: boolean): FmiWarningList {
  if (!active) return { updated: '2026-11-15T13:00:00.000Z', ids: [], boxes: {} };
  const boxes: FmiWarningList['boxes'] = {};
  for (const [id, warning] of Object.entries(FMI_WARNINGS)) {
    if (id === FMI_IDS.expired) continue;
    boxes[id] = 'box' in warning ? warning.box : null;
  }
  return { updated: '2026-11-15T13:00:00.000Z', ids: Object.keys(FMI_WARNINGS), boxes };
}
