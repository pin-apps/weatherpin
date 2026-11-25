// Environment and Climate Change Canada (ECCC) radar, from its MSC GeoMet
// web map service: https://eccc-msc.github.io/open-data/msc-geomet/readme_en/
// Free, no key, Open Government Licence – Canada (credit ECCC). The mosaic
// combines Canadian and US radars (up to 180) at 1 km, every 6 minutes, for
// the past 3 hours. It comes in two versions from the same radars: rain
// rates (RADAR_1KM_RRAI, mm/h) and snow rates (RADAR_1KM_RSNO, cm/h); see
// ecccLayerFor for which one is shown.

import L from 'leaflet';
import { RADAR_LAYER_OPTIONS, RadarError, type RadarFrame } from './frame';

const WMS_URL = 'https://geo.weather.gc.ca/geomet';

export type EcccLayer = 'RADAR_1KM_RRAI' | 'RADAR_1KM_RSNO';

// Winter months (November to March, 0-based) and the latitude north of
// which winter precipitation is mostly snow: Canada and the northern US.
// Our own rule; ECCC only offers both versions "for the different seasons".
const SNOW_MONTHS = new Set([10, 11, 0, 1, 2]);
const SNOW_NORTH_OF = 40;

/** Snow rates in winter over the north, rain rates otherwise. */
export function ecccLayerFor(centre: { lat: number }, date: Date): EcccLayer {
  return SNOW_MONTHS.has(date.getMonth()) && centre.lat >= SNOW_NORTH_OF
    ? 'RADAR_1KM_RSNO'
    : 'RADAR_1KM_RRAI';
}

// The mosaic's real detail is ~1 km; closer in, Leaflet stretches zoom-10
// images instead of asking for more of the same.
const MAX_NATIVE_ZOOM = 10;

// Where the mosaic has radars: southern Canada and the US. Outside this
// (and at world-wide zoom) RainViewer is used. A rough box is enough: the
// mosaic is transparent where no radar reaches.
const COVERAGE = { south: 24, north: 67, west: -170, east: -52 };
/** Below this zoom the view is wider than North America. */
const MIN_ZOOM = 4;

/** Whether ECCC's radar covers this view of the map. */
export function ecccCoversView(centre: { lat: number; lng: number }, zoom: number): boolean {
  // The map repeats sideways; bring the centre back to -180..180.
  const lng = ((((centre.lng + 180) % 360) + 360) % 360) - 180;
  return (
    zoom >= MIN_ZOOM &&
    centre.lat >= COVERAGE.south &&
    centre.lat <= COVERAGE.north &&
    lng >= COVERAGE.west &&
    lng <= COVERAGE.east
  );
}

// The history: the last 2 hours, every other 6-minute picture (12 min).
const HISTORY_MS = 2 * 60 * 60 * 1000;
const STEP_MS = 12 * 60 * 1000;

/**
 * The times to show, oldest first, read from the capabilities: the time
 * dimension is "start/end/PT6M" (or a list of times). Asking for a time it
 * doesn't have returns an error instead of an image, so only times it
 * lists are used: the newest, then every other one back 2 hours.
 */
export function frameTimes(capabilities: string, layerName: EcccLayer): string[] {
  const doc = new DOMParser().parseFromString(capabilities, 'text/xml');
  for (const layer of Array.from(doc.getElementsByTagName('Layer'))) {
    const name = Array.from(layer.children).find((child) => child.localName === 'Name');
    if (name?.textContent !== layerName) continue;
    const dimension = Array.from(layer.children).find(
      (child) => child.localName === 'Dimension' && child.getAttribute('name') === 'time',
    );
    const text = dimension?.textContent?.trim() ?? '';
    let available: number[];
    if (text.includes('/')) {
      const [start, end, period] = text.split('/');
      const step = /^PT(\d+)M$/.exec(period ?? '')?.[1];
      const [from, to] = [Date.parse(start), Date.parse(end)];
      if (Number.isNaN(from) || Number.isNaN(to)) return [];
      if (!step) return [new Date(to).toISOString()];
      available = [];
      for (let time = to; time >= from; time -= Number(step) * 60 * 1000) available.push(time);
    } else {
      available = text
        .split(',')
        .map((time) => Date.parse(time.trim()))
        .filter((time) => !Number.isNaN(time))
        .sort((a, b) => b - a);
    }
    const newest = available[0];
    if (newest === undefined) return [];
    // Newest first: keep those at least a step apart, within 2 hours.
    const kept: number[] = [];
    for (const time of available) {
      if (newest - time > HISTORY_MS) break;
      if (kept.length === 0 || kept[kept.length - 1] - time >= STEP_MS) kept.push(time);
    }
    return kept.reverse().map((time) => new Date(time).toISOString().replace('.000Z', 'Z'));
  }
  return [];
}

/** ECCC's radar pictures of the last 2 hours, rain or snow, oldest first. */
export async function fetchEcccFrames(
  layerName: EcccLayer,
  signal?: AbortSignal,
): Promise<RadarFrame[]> {
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetCapabilities',
    // Only this layer's part of the capabilities: ~20 kB, not megabytes.
    layer: layerName,
  });
  let response: Response;
  try {
    response = await fetch(`${WMS_URL}?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new RadarError('Could not reach the radar service.');
  }
  if (!response.ok) throw new RadarError(`Radar error (HTTP ${response.status}).`);

  const times = frameTimes(await response.text(), layerName);
  if (times.length === 0) throw new RadarError('The radar service returned unexpected data.');
  return times.map((time) => ecccFrame(layerName, time));
}

function ecccFrame(layerName: EcccLayer, time: string): RadarFrame {
  return {
    source: 'eccc',
    snow: layerName === 'RADAR_1KM_RSNO',
    time: new Date(time),
    key: `${layerName} ${time}`,
    createLayer: () =>
      L.tileLayer.wms(WMS_URL, {
        ...RADAR_LAYER_OPTIONS,
        maxNativeZoom: MAX_NATIVE_ZOOM,
        layers: layerName,
        styles: '',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        // Extra options become request parameters: the picture's time.
        time,
      } as L.WMSOptions),
  };
}
