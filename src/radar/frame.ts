// What both radar sources hand to the radar layer: one radar picture.

import type L from 'leaflet';

export type RadarSource = 'rainviewer' | 'eccc';

export interface RadarFrame {
  source: RadarSource;
  /** Snow rates instead of rain (ECCC in winter); credited as snow radar. */
  snow?: boolean;
  /** When the radar picture was taken. */
  time: Date;
  /** Equal keys mean the same picture: nothing to swap. */
  key: string;
  /** A new Leaflet layer showing this picture (radar.ts adds the credit). */
  createLayer(): L.TileLayer;
}

export class RadarError extends Error {}

// Shared look: see-through, above the map tiles (zIndex 1), and a class the
// tests can find.
export const RADAR_LAYER_OPTIONS = {
  maxZoom: 19,
  opacity: 0.7,
  zIndex: 10,
  className: 'radar-tiles',
} as const;
