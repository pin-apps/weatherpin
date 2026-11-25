// The radar history player: plays the last ~2 hours of radar pictures as
// a loop, or shows the one picked on the slider. Loaded on demand (the
// first press of ▶ or touch of the slider), so the start-up code stays
// small.
//
// Gentle on the radar services: pictures load one at a time, newest first,
// each only once the previous one has its tiles, and never more than
// TILE_BUDGET tile requests a minute (RainViewer allows 100 per IP). The
// browser keeps the tiles, so loops cost nothing more. Every picture is a
// layer on the map, invisible until shown; radar.ts stops the player (and
// these layers go) when the map moves, the radar goes off or the page is
// hidden, so moving the map never sets off a burst of requests.

import type L from 'leaflet';
import type { RadarFrame } from './frame';
import { RADAR_LAYER_OPTIONS } from './frame';

/** Tile requests allowed per rolling minute (RainViewer: 100 per IP). */
const TILE_BUDGET = 80;
const MINUTE_MS = 60 * 1000;
/** A picture that doesn't finish loading in this long is skipped. */
const LOAD_TIMEOUT_MS = 15 * 1000;
/** Time per picture while playing, and the pause on the newest. */
const STEP_MS = 500;
const HOLD_NEWEST_MS = 1500;

export interface PlayerState {
  /** The picture shown (an index into the frames, oldest first). */
  index: number;
  /** Pictures from this index to the newest are loaded. */
  loadedFrom: number;
  playing: boolean;
  /** Still loading older pictures. */
  loading: boolean;
}

export interface PlayerOptions {
  map: L.Map;
  /** Oldest first; the newest is already on the map as `newestLayer`. */
  frames: RadarFrame[];
  newestLayer: L.TileLayer;
  /** Called with every change, to update the bar and the credit. */
  onChange(state: PlayerState, frame: RadarFrame): void;
}

export class RadarPlayer {
  private readonly map: L.Map;
  private readonly frames: RadarFrame[];
  private readonly layers: (L.TileLayer | undefined)[];
  private readonly onChange: PlayerOptions['onChange'];
  private index: number;
  private loadedFrom: number;
  private playing = false;
  private loading = false;
  private stopped = false;
  private timer: number | undefined;
  /** When recent tile requests started, for the budget. */
  private readonly tileStarts: number[] = [];
  /** A picture asked for on the slider, loaded before the others. */
  private wanted: number | undefined;

  constructor({ map, frames, newestLayer, onChange }: PlayerOptions) {
    this.map = map;
    this.frames = frames;
    this.onChange = onChange;
    this.layers = frames.map((_, i) => (i === frames.length - 1 ? newestLayer : undefined));
    this.index = frames.length - 1;
    this.loadedFrom = frames.length - 1;
    this.countTiles(newestLayer);
    void this.loadOlder();
  }

  play(): void {
    if (this.stopped || this.playing) return;
    this.playing = true;
    // From the start of what's loaded when at the newest; else from here.
    if (this.index === this.frames.length - 1) this.show(this.loadedFrom);
    this.schedule();
    this.report();
  }

  pause(): void {
    this.playing = false;
    window.clearTimeout(this.timer);
    this.report();
  }

  /** Shows a picture picked on the slider (loading it first if needed). */
  pick(index: number): void {
    if (this.stopped) return;
    this.pause();
    const target = Math.max(0, Math.min(this.frames.length - 1, index));
    if (target >= this.loadedFrom) {
      this.show(target);
    } else {
      this.wanted = target;
      this.report();
    }
  }

  /** Back to the newest picture only; the other layers go. */
  stop(): void {
    this.stopped = true;
    this.pause();
    this.show(this.frames.length - 1);
    this.layers.forEach((layer, i) => {
      if (layer && i !== this.frames.length - 1) layer.remove();
    });
  }

  private schedule() {
    const atNewest = this.index === this.frames.length - 1;
    this.timer = window.setTimeout(
      () => {
        if (!this.playing || this.stopped) return;
        const next = this.index + 1 < this.frames.length ? this.index + 1 : this.loadedFrom;
        this.show(next);
        this.schedule();
      },
      atNewest ? HOLD_NEWEST_MS : STEP_MS,
    );
  }

  private show(index: number) {
    if (index < this.loadedFrom) return;
    this.layers[this.index]?.setOpacity(0);
    this.index = index;
    this.layers[index]?.setOpacity(RADAR_LAYER_OPTIONS.opacity);
    this.report();
  }

  private report() {
    this.onChange(
      {
        index: this.index,
        loadedFrom: this.loadedFrom,
        playing: this.playing,
        loading: this.loading,
      },
      this.frames[this.index],
    );
  }

  private countTiles(layer: L.TileLayer) {
    layer.on('tileloadstart', () => this.tileStarts.push(Date.now()));
  }

  /** Waits until the last minute's tile requests leave room for `tiles`. */
  private async waitForBudget(tiles: number) {
    for (;;) {
      const now = Date.now();
      while (this.tileStarts.length > 0 && now - this.tileStarts[0] > MINUTE_MS) {
        this.tileStarts.shift();
      }
      if (this.tileStarts.length + tiles <= TILE_BUDGET || this.tileStarts.length === 0) return;
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      if (this.stopped) return;
    }
  }

  /** Loads the older pictures, newest first, one at a time. */
  private async loadOlder() {
    this.loading = true;
    // About as many tiles as fit the view (the newest picture's are loaded).
    let tilesPerPicture = tilesInView(this.map);
    while (!this.stopped && this.loadedFrom > 0) {
      // Newest first (a picture picked further back shows once reached).
      const target = this.loadedFrom - 1;
      await this.waitForBudget(tilesPerPicture);
      if (this.stopped) return;
      const before = this.tileStarts.length;
      const layer = this.frames[target].createLayer();
      layer.setOpacity(0);
      this.countTiles(layer);
      this.layers[target] = layer;
      await new Promise<void>((resolve) => {
        const done = window.setTimeout(resolve, LOAD_TIMEOUT_MS);
        layer.once('load', () => {
          window.clearTimeout(done);
          resolve();
        });
        layer.addTo(this.map);
      });
      if (this.stopped) {
        layer.remove();
        return;
      }
      tilesPerPicture = Math.max(1, this.tileStarts.length - before);
      this.loadedFrom = target;
      if (this.wanted !== undefined && this.wanted >= this.loadedFrom) {
        const wanted = this.wanted;
        this.wanted = undefined;
        this.show(wanted);
      } else {
        this.report();
      }
    }
    this.loading = false;
    this.report();
  }
}

/** How many 256-px tiles cover the map's view now (an upper bound). */
function tilesInView(map: L.Map): number {
  const bounds = map.getPixelBounds();
  if (!bounds.min || !bounds.max) return 1;
  const across = Math.floor(bounds.max.x / 256) - Math.floor(bounds.min.x / 256) + 1;
  const down = Math.floor(bounds.max.y / 256) - Math.floor(bounds.min.y / 256) + 1;
  return Math.max(1, across * down);
}
