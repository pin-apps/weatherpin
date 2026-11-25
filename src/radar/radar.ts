// Rain radar layer, its on/off button (next to "My location") and the
// history bar (▶, a slider and the picture's time). The radar source
// follows the map view: Environment Canada (ECCC) over North America,
// where its mosaic of Canadian and US radars is sharper and more frequent;
// RainViewer everywhere else. The newest picture is shown and refreshed
// while the radar is on and the page is visible; the last ~2 hours play
// only when asked (player.ts, loaded then). The on/off choice is
// remembered on the device. Clicks pass through to the map.

import type L from 'leaflet';
import { formatTimeHere } from '../format';
import { readStored, writeStored } from '../storage';
import { ecccCoversView, ecccLayerFor, fetchEcccFrames } from './eccc';
import type { RadarFrame, RadarSource } from './frame';
import type { PlayerState, RadarPlayer } from './player';
import { fetchRainViewerFrames } from './rainviewer';
import { t } from '../i18n';

// Stored as nordic-weather:rain-radar = { version, on }.
const STORAGE_KEY = 'rain-radar';
const STORAGE_VERSION = 1;

/** How often each source has a new picture, so how often to look. */
const REFRESH_MS: Record<RadarSource, number> = {
  eccc: 6 * 60 * 1000,
  rainviewer: 10 * 60 * 1000,
};

const CREDITS: Record<RadarSource, string> = {
  eccc: '<a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a>',
  rainviewer: '<a href="https://www.rainviewer.com/">RainViewer</a>',
};

// Long enough to read, then the message gets out of the way.
const MESSAGE_DURATION_MS = 8000;

function storedOn(): boolean {
  const data = readStored(STORAGE_KEY) as { version?: number; on?: unknown } | undefined;
  return data?.version === STORAGE_VERSION && data.on === true;
}

/** The history bar's parts (index.html). */
export interface RadarBar {
  root: HTMLElement;
  play: HTMLButtonElement;
  slider: HTMLInputElement;
  time: HTMLElement;
}

export function setUpRainRadar(
  map: L.Map,
  button: HTMLButtonElement,
  message: HTMLElement,
  bar: RadarBar,
): void {
  let on = false;
  let layer: L.TileLayer | undefined;
  // The pictures of the last ~2 hours, oldest first; the newest is shown.
  let frames: RadarFrame[] = [];
  let credit: string | undefined;
  // What's being loaded or shown: the source, and for ECCC rain or snow.
  // Compared on every map move, so a view change during loading (e.g.
  // jumping to the start place) isn't missed.
  let wanted: string | undefined;
  let refreshTimer: number | undefined;
  let inFlight: AbortController | undefined;
  let messageTimer: number | undefined;
  let player: RadarPlayer | undefined;
  let playerLoading: Promise<RadarPlayer | undefined> | undefined;

  function showMessage(text: string) {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.hidden = false;
    messageTimer = window.setTimeout(() => {
      message.hidden = true;
      message.textContent = '';
    }, MESSAGE_DURATION_MS);
  }

  function setPressed(value: boolean) {
    on = value;
    button.setAttribute('aria-pressed', String(value));
    button.title = value ? t('Hide rain radar') : t('Show rain radar');
  }

  function sourceForView(): RadarSource {
    return ecccCoversView(map.getCenter(), map.getZoom()) ? 'eccc' : 'rainviewer';
  }

  /** The source for this view, with ECCC's rain or snow version. */
  function wantedForView(): string {
    const source = sourceForView();
    return source === 'eccc' ? ecccLayerFor(map.getCenter(), new Date()) : source;
  }

  function fetchFrames(source: RadarSource, signal: AbortSignal): Promise<RadarFrame[]> {
    return source === 'eccc'
      ? fetchEcccFrames(ecccLayerFor(map.getCenter(), new Date()), signal)
      : fetchRainViewerFrames(signal);
  }

  /** "Radar: RainViewer, 14:20" in the map's credits, for the picture shown. */
  function setCredit(frame: RadarFrame | undefined) {
    const control = map.attributionControl;
    if (credit) control?.removeAttribution(credit);
    credit = undefined;
    if (!frame) return;
    const name = frame.snow ? t('Snow radar') : t('Radar');
    credit = `${name}: ${CREDITS[frame.source]}, ${formatTimeHere(frame.time)}`;
    control?.addAttribution(credit);
  }

  function showFrames(next: RadarFrame[]) {
    const newest = next[next.length - 1];
    // Same newest picture as before: nothing to swap.
    if (frames.length > 0 && frames[frames.length - 1].key === newest.key) return;
    stopPlayer();
    const nextLayer = newest.createLayer();
    nextLayer.addTo(map);
    layer?.remove();
    layer = nextLayer;
    frames = next;
    setCredit(newest);
    updateBar({
      index: frames.length - 1,
      loadedFrom: frames.length - 1,
      playing: false,
      loading: false,
    });
  }

  // ---- The history bar -------------------------------------------------

  function minutesAgo(frame: RadarFrame): number {
    return Math.max(0, Math.round((Date.now() - frame.time.getTime()) / 60000));
  }

  function timeText(frame: RadarFrame, newest: boolean): string {
    const time = formatTimeHere(frame.time);
    return newest
      ? t('{time} · latest', { time })
      : t('{time} · {minutes} min ago', { time, minutes: minutesAgo(frame) });
  }

  function updateBar(state: PlayerState) {
    const frame = frames[state.index];
    bar.root.hidden = !on || frames.length < 2;
    if (!frame) return;
    bar.slider.max = String(frames.length - 1);
    bar.slider.value = String(state.index);
    const text = timeText(frame, state.index === frames.length - 1);
    bar.slider.setAttribute('aria-valuetext', text);
    const loaded = frames.length - state.loadedFrom;
    bar.time.textContent = state.loading
      ? `${text} · ${t('loading {loaded}/{total}', { loaded, total: frames.length })}`
      : text;
    bar.play.setAttribute('aria-pressed', String(state.playing));
    bar.play.setAttribute(
      'aria-label',
      state.playing ? t('Pause radar history') : t('Play radar history'),
    );
    bar.play.textContent = state.playing ? '⏸' : '▶';
  }

  /** The player, loaded the first time it's needed. */
  function ensurePlayer(): Promise<RadarPlayer | undefined> {
    if (player) return Promise.resolve(player);
    if (playerLoading) return playerLoading;
    const forFrames = frames;
    playerLoading = import('./player')
      .then(({ RadarPlayer }) => {
        // The pictures changed (or the radar went off) while it loaded.
        if (!on || frames !== forFrames || !layer) return undefined;
        player = new RadarPlayer({
          map,
          frames,
          newestLayer: layer,
          onChange: (state, frame) => {
            setCredit(frame);
            updateBar(state);
          },
        });
        return player;
      })
      .catch(() => undefined)
      .finally(() => (playerLoading = undefined));
    return playerLoading;
  }

  function stopPlayer() {
    if (!player) return;
    player.stop();
    player = undefined;
    const newest = frames[frames.length - 1];
    setCredit(newest);
    if (newest) {
      updateBar({
        index: frames.length - 1,
        loadedFrom: frames.length - 1,
        playing: false,
        loading: false,
      });
    }
  }

  bar.play.addEventListener('click', async () => {
    if (player && bar.play.getAttribute('aria-pressed') === 'true') {
      player.pause();
      return;
    }
    (await ensurePlayer())?.play();
  });

  bar.slider.addEventListener('input', async () => {
    const index = Number(bar.slider.value);
    (await ensurePlayer())?.pick(index);
  });

  // ---- Loading -----------------------------------------------------------

  /**
   * Fetches the pictures for the current view and shows the newest. If ECCC
   * fails, RainViewer (which also covers North America) stands in.
   */
  async function load() {
    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;
    const preferred = sourceForView();
    wanted = wantedForView();
    scheduleRefresh(preferred);
    const sources: RadarSource[] = preferred === 'eccc' ? ['eccc', 'rainviewer'] : ['rainviewer'];
    for (const source of sources) {
      try {
        const next = await fetchFrames(source, controller.signal);
        if (!controller.signal.aborted) showFrames(next);
        return;
      } catch {
        if (controller.signal.aborted) return;
      }
    }
    // Keep an older picture if there is one; otherwise switch back off.
    if (!layer) {
      turnOff();
      showMessage(t('Rain radar is unavailable right now. Try again later.'));
    }
  }

  function scheduleRefresh(source: RadarSource) {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => void load(), REFRESH_MS[source]);
  }

  function stopRefreshing() {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
    inFlight?.abort();
  }

  function turnOn() {
    setPressed(true);
    if (!document.hidden) void load();
  }

  function turnOff() {
    setPressed(false);
    stopRefreshing();
    stopPlayer();
    layer?.remove();
    layer = undefined;
    frames = [];
    setCredit(undefined);
    wanted = undefined;
    bar.root.hidden = true;
  }

  // Moving the map: back to the newest picture (the history would need all
  // its pictures again for the new view: only when ▶ is pressed again).
  map.on('movestart', () => stopPlayer());

  // Panned or zoomed into another source's area (or, in winter, across the
  // line between ECCC's rain and snow): switch.
  map.on('moveend', () => {
    if (on && !document.hidden && wanted && wanted !== wantedForView()) {
      void load();
    }
  });

  // No refreshing or playing while nobody can see the page (background tab,
  // phone screen off); one fresh look when it's visible again.
  document.addEventListener('visibilitychange', () => {
    if (!on) return;
    if (document.hidden) {
      stopRefreshing();
      stopPlayer();
    } else void load();
  });

  button.addEventListener('click', () => {
    if (on) turnOff();
    else turnOn();
    writeStored(STORAGE_KEY, { version: STORAGE_VERSION, on });
  });

  // Off unless the user turned it on before.
  if (storedOn()) turnOn();
  else setPressed(false);
}
