// RainViewer weather radar: https://www.rainviewer.com/api.html
// Free for personal, educational and small community use, no key. Credit
// RainViewer with a link. Since 2026 the free API gives the past ~2 hours
// (10-minute frames), no forecast frames, one colour scheme ("Universal
// Blue", 2) and zoom levels up to 7; above that we stretch zoom-7 tiles.
// It allows 100 requests per IP per minute: the newest frame shows at
// once; the history player (player.ts) loads the others slowly, on demand.

import L from 'leaflet';
import { RADAR_LAYER_OPTIONS, RadarError, type RadarFrame } from './frame';

const FRAMES_URL = 'https://api.rainviewer.com/public/weather-maps.json';

// The only tile host our CSP allows (img-src). The API names its host in
// each reply; anything else is refused rather than silently blocked.
const TILE_HOST = 'https://tilecache.rainviewer.com';

/** Highest zoom RainViewer serves for free. */
const MAX_NATIVE_ZOOM = 7;

// Tile size 256, colour scheme 2 (Universal Blue), smoothed, snow shown.
const TILE_SUFFIX = '/256/{z}/{x}/{y}/2/1_1.png';

interface FramesResponse {
  host?: unknown;
  radar?: { past?: { time?: unknown; path?: unknown }[] };
}

/** RainViewer's past ~2 hours of radar frames, oldest first (worldwide). */
export async function fetchRainViewerFrames(signal?: AbortSignal): Promise<RadarFrame[]> {
  let response: Response;
  try {
    response = await fetch(FRAMES_URL, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new RadarError('Could not reach the radar service.');
  }
  if (!response.ok) throw new RadarError(`Radar error (HTTP ${response.status}).`);

  const data = (await response.json().catch(() => null)) as FramesResponse | null;
  const past = data?.radar?.past;
  if (data?.host !== TILE_HOST || !Array.isArray(past)) {
    throw new RadarError('The radar service returned unexpected data.');
  }
  const frames = past
    .filter(
      (frame): frame is { time: number; path: string } =>
        typeof frame?.time === 'number' &&
        typeof frame.path === 'string' &&
        frame.path.startsWith('/'),
    )
    .sort((a, b) => a.time - b.time)
    .map((frame) => rainViewerFrame(frame.time, frame.path));
  if (frames.length === 0) throw new RadarError('The radar service returned unexpected data.');
  return frames;
}

function rainViewerFrame(time: number, path: string): RadarFrame {
  const tileUrl = `${TILE_HOST}${path}${TILE_SUFFIX}`;
  return {
    source: 'rainviewer',
    time: new Date(time * 1000),
    key: tileUrl,
    createLayer: () =>
      L.tileLayer(tileUrl, {
        ...RADAR_LAYER_OPTIONS,
        // Above zoom 7 Leaflet stretches the zoom-7 tiles.
        maxNativeZoom: MAX_NATIVE_ZOOM,
      }),
  };
}
