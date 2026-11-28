// "🚗 Drift here" (the ⋯ menu): a 20-second drift game on a small track,
// the road and the wind from the weather now at the place shown (the
// forecast already loaded: no request of its own). Loaded on demand with
// its CSS; the card is the #drift dialog in index.html (modal).

import './drift.css';
import { el } from '../dom';
import {
  formatCoordinates,
  formatPercent,
  formatTemperature,
  formatWindSpeed,
  windFrom,
} from '../format';
import type { PickedPoint } from '../map';
import { placeUrl } from '../place-link';
import { readStored, writeStored } from '../storage';
import { currentUnits } from '../units';
import type { Forecast } from '../weather/api';
import { draw, makeWeatherParticles, readColours, type Colours } from './draw';
import {
  GRIP,
  HEIGHT,
  WIDTH,
  finished,
  newWorld,
  secondsLeft,
  step,
  stepsDue,
  type Steer,
  type Surface,
  type World,
} from './physics';
import { roadFor, type Road } from './surface';
import { d, type TextName } from './texts';

const STORAGE_KEY = 'drift';
// A tap right as the run ends shouldn't start the next one.
const RESTART_DELAY_MS = 700;
// Wind worth mentioning, m/s.
const WINDY = 3;

const ON: Record<Surface, TextName> = {
  dry: 'onDry',
  rain: 'onRain',
  snow: 'onSnow',
  ice: 'onIce',
};

interface Saved {
  version: 1;
  best: Partial<Record<Surface, number>>;
}

type Phase = 'ready' | 'running' | 'paused' | 'over';

const dialog = document.querySelector<HTMLDialogElement>('#drift')!;
const title = dialog.querySelector<HTMLElement>('.drift__title-text')!;
const body = dialog.querySelector<HTMLElement>('.drift__body')!;
dialog.querySelector('.drift__close')!.addEventListener('click', () => dialog.close());

let game: Game | undefined;
dialog.addEventListener('close', () => {
  game?.stop();
  game = undefined;
});

/** Opens the game for the place shown and its weather now. */
export function openDrift(point: PickedPoint, forecast: Forecast | undefined): void {
  game?.stop();
  title.textContent = d('title', { place: point.name ?? placeText(point) });
  game = new Game(point, forecast);
  body.replaceChildren(...game.elements);
  if (!dialog.open) dialog.showModal();
  game.start();
}

function placeText(point: PickedPoint): string {
  return formatCoordinates(point.lat, point.lng);
}

class Game {
  readonly elements: HTMLElement[];
  private readonly road: Road;
  private readonly hasWeather: boolean;
  private world: World;
  private phase: Phase = 'ready';
  private frame = 0;
  private last = 0;
  private spare = 0;
  private overAt = 0;
  private readonly held = new Map<number | string, Steer>();
  private colours: Colours;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private particles: ReturnType<typeof makeWeatherParticles>;
  private readonly canvas = el('canvas', 'drift__canvas');
  private readonly context: CanvasRenderingContext2D;
  private readonly scoreValue = el('span', 'drift__score');
  private readonly comboValue = el('span', 'drift__combo');
  private readonly timeValue = el('span', 'drift__time');
  private readonly overlay = el('p', 'drift__overlay');
  private readonly bestLine = el('p', 'drift__best');
  private readonly announce = el('p', 'drift__status');
  private readonly shareButton = el('button', 'button drift__share', d('shareResult'));
  private readonly cleanUp = new AbortController();

  constructor(
    private readonly point: PickedPoint,
    forecast: Forecast | undefined,
  ) {
    this.road = roadFor(forecast);
    this.hasWeather = this.road.temperature !== undefined;
    this.world = this.newRun();
    this.context = this.canvas.getContext('2d')!;
    this.colours = readColours(dialog);
    this.particles = makeWeatherParticles(this.world, this.reducedMotion ? 12 : 60);

    // Focused on opening, so the arrow keys play at once (not the × button).
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', d('canvas', { surface: d(this.road.surface) }));
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.announce.setAttribute('role', 'status');
    this.shareButton.type = 'button';
    this.shareButton.disabled = true;

    const stats = el('p', 'drift__stats');
    stats.append(
      el('span', 'drift__label', `${d('score')} `),
      this.scoreValue,
      ' · ',
      this.comboValue,
      ' · ',
      this.timeValue,
    );
    const stage = el('div', 'drift__stage');
    stage.append(this.canvas, this.overlay);
    const footer = el('div', 'drift__footer');
    footer.append(this.bestLine, this.shareButton);

    // The hints last: on small screens the buttons stay in view first.
    this.elements = [
      el('p', 'drift__road', this.roadText()),
      ...(this.windText() ? [el('p', 'drift__wind', this.windText())] : []),
      stats,
      stage,
      footer,
      this.announce,
      el('p', 'drift__hint', d('hint')),
      el('p', 'drift__note', d('game')),
    ];
    this.showBest();
    this.updateStats();
    this.overlay.textContent = d('tapToStart');
    this.listen();
  }

  start() {
    this.fitCanvas();
    this.render();
    this.canvas.focus();
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.cleanUp.abort();
  }

  private newRun(): World {
    return newWorld(this.road.surface, this.road.push, Math.floor(Math.random() * 2 ** 32));
  }

  // ── Input ──

  private listen() {
    const signal = this.cleanUp.signal;
    const side = (event: PointerEvent): Steer => {
      const box = this.canvas.getBoundingClientRect();
      return event.clientX < box.left + box.width / 2 ? -1 : 1;
    };
    const stage = this.canvas.parentElement ?? this.canvas;
    stage.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();
        if (this.begin()) return;
        stage.setPointerCapture?.(event.pointerId);
        this.held.set(event.pointerId, side(event));
      },
      { signal },
    );
    stage.addEventListener(
      'pointermove',
      (event) => {
        if (this.held.has(event.pointerId)) this.held.set(event.pointerId, side(event));
      },
      { signal },
    );
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      stage.addEventListener(type, (event) => this.held.delete(event.pointerId), { signal });
    }

    dialog.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        // Only while playing or about to: arrows elsewhere stay normal.
        if (event.target instanceof HTMLButtonElement && this.phase !== 'running') return;
        event.preventDefault();
        if (this.begin()) return;
        this.held.set(event.key, event.key === 'ArrowLeft' ? -1 : 1);
      },
      { signal },
    );
    dialog.addEventListener(
      'keyup',
      (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') this.held.delete(event.key);
      },
      { signal },
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && this.phase === 'running') this.pause();
      },
      { signal },
    );
    window.addEventListener('resize', () => this.fitCanvas(), { signal });
    this.shareButton.addEventListener('click', () => void this.share(), { signal });
  }

  /** Starts, resumes or restarts a run on a tap or key; true if it did. */
  private begin(): boolean {
    if (this.phase === 'running') return false;
    if (this.phase === 'over') {
      if (performance.now() - this.overAt < RESTART_DELAY_MS) return true;
      this.world = this.newRun();
      this.particles = makeWeatherParticles(this.world, this.reducedMotion ? 12 : 60);
      this.announce.textContent = '';
    }
    this.phase = 'running';
    this.overlay.hidden = true;
    this.held.clear();
    this.last = performance.now();
    this.spare = 0;
    this.colours = readColours(dialog);
    this.loop();
    return false;
  }

  private steer(): Steer {
    let total = 0;
    for (const value of this.held.values()) total += value;
    return Math.sign(total) as Steer;
  }

  private pause() {
    this.phase = 'paused';
    cancelAnimationFrame(this.frame);
    this.held.clear();
    this.overlay.textContent = d('paused');
    this.overlay.hidden = false;
  }

  // ── The run ──

  private loop() {
    this.frame = requestAnimationFrame((now) => {
      if (this.phase !== 'running') return;
      // Fixed steps: the same game on 60 Hz and 120 Hz screens.
      const due = stepsDue(this.spare, now - this.last);
      this.spare = due.spare;
      this.last = now;
      for (let i = 0; i < due.steps; i++) step(this.world, this.steer());
      this.render();
      this.updateStats();
      if (finished(this.world)) this.end();
      else this.loop();
    });
  }

  private end() {
    this.phase = 'over';
    this.overAt = performance.now();
    this.held.clear();
    const score = Math.round(this.world.score);
    const on = d(ON[this.road.surface]);
    const saved = loadSaved();
    const best = saved.best[this.road.surface] ?? 0;
    const newBest = score > best;
    if (newBest)
      writeStored(STORAGE_KEY, { ...saved, best: { ...saved.best, [this.road.surface]: score } });
    this.showBest();
    const result = d('result', { score: number(score), on });
    this.announce.textContent = newBest && score > 0 ? `${result} ${d('newBest', { on })}` : result;
    this.overlay.textContent = d('tapAgain');
    this.overlay.hidden = false;
    this.shareButton.disabled = false;
  }

  private render() {
    draw(
      this.context,
      this.world,
      this.colours,
      this.phase === 'running' ? this.particles : [],
      !this.reducedMotion,
    );
  }

  private updateStats() {
    const score = number(Math.round(this.world.score));
    if (this.scoreValue.textContent !== score) this.scoreValue.textContent = score;
    const combo = `x${this.world.combo}`;
    if (this.comboValue.textContent !== combo) this.comboValue.textContent = combo;
    const time = d('time', { seconds: secondsLeft(this.world) });
    if (this.timeValue.textContent !== time) this.timeValue.textContent = time;
  }

  /** Sharp on high-density screens: the bitmap follows the shown size. */
  private fitCanvas() {
    const shownWidth = this.canvas.clientWidth || WIDTH;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(shownWidth * ratio);
    if (this.canvas.width !== width) {
      this.canvas.width = width;
      this.canvas.height = Math.round((width * HEIGHT) / WIDTH);
    }
    this.context.setTransform(width / WIDTH, 0, 0, width / WIDTH, 0, 0);
    this.render();
  }

  // ── Words ──

  private roadText(): string {
    if (!this.hasWeather) return d('noWeather');
    return d('road', {
      surface: d(this.road.surface),
      temperature: formatTemperature(this.road.temperature!),
      grip: formatPercent((GRIP[this.road.surface] / GRIP.dry) * 100),
    });
  }

  private windText(): string {
    if (!this.hasWeather || this.road.windSpeed < WINDY) return '';
    return d('wind', {
      speed: formatWindSpeed(this.road.windSpeed),
      from: windFrom(this.road.windFrom),
    });
  }

  private showBest() {
    const best = loadSaved().best[this.road.surface];
    this.bestLine.textContent = best
      ? d('best', { on: d(ON[this.road.surface]), score: number(best) })
      : '';
  }

  private async share() {
    const place = this.point.name ?? placeText(this.point);
    const text = d('shareText', {
      score: number(Math.round(this.world.score)),
      on: d(ON[this.road.surface]),
      place,
      temperature: this.hasWeather ? formatTemperature(this.road.temperature!) : '–',
    });
    const message = `${text}\n${placeUrl(this.point)}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: message });
        window.dispatchEvent(new Event('weatherpin:shared'));
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      this.announce.textContent = d('copied');
      window.dispatchEvent(new Event('weatherpin:shared'));
    } catch {
      this.announce.textContent = d('copyFailed');
    }
  }
}

function number(value: number): string {
  return new Intl.NumberFormat(currentUnits().dateLocale).format(value);
}

function loadSaved(): Saved {
  const stored = readStored(STORAGE_KEY) as Partial<Saved> | undefined;
  const best: Saved['best'] = {};
  if (stored && typeof stored === 'object' && stored.best && typeof stored.best === 'object') {
    for (const surface of Object.keys(GRIP) as Surface[]) {
      const value = (stored.best as Record<string, unknown>)[surface];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        best[surface] = Math.round(value);
      }
    }
  }
  return { version: 1, best };
}
