// "🎈 Launch a balloon" (the ⋯ menu) and shared flights (a #balloon= link):
// the card over the map (the quiz card's look and place, not modal, so the
// map shows the flight), the flight drawn on the map, and the result.
// Loaded on demand; main.ts passes the map and the place name lookup in
// (importing them would pull start-up code into this chunk).

import L from 'leaflet';
import { el } from '../dom';
import {
  formatCoordinates,
  formatPercent,
  formatTemperature,
  formatWindSpeed,
  windFrom,
} from '../format';
import type { PickedPoint } from '../map';
import { readStored, writeStored } from '../storage';
import { currentUnits } from '../units';
import { describeWeather } from '../weather/wmo';
import { fly, launchHour, pathKm, pathOf, type Ending, type Flight, type Point } from './flight';
import {
  COLOURS,
  balloonHash,
  cleanName,
  readBalloonHash,
  NAME_MAX,
  type Colour,
  type SharedFlight,
} from './link';
import { b, type TextName } from './texts';
import { LEVELS, conditionsAt, fetchWinds, type Conditions, type Level, type Winds } from './winds';

export interface BalloonHost {
  dialog: HTMLDialogElement;
  map: L.Map;
  placeName(lat: number, lng: number): Promise<string | undefined>;
  /** However the card closes. */
  onClose(): void;
}

interface Saved {
  version: 1;
  name?: string;
  colour?: Colour;
  bestKm?: number;
}

const STORAGE_KEY = 'balloon';
// The flight plays at 8 hours a second: 5 days in 15 s.
const HOURS_PER_SECOND = 8;
// The map first shows the first day's stretch, then follows the balloon:
// when it reaches the edge of the free part of the map, a short pan puts
// it back in the middle (room ahead), as a camera following it would.
const FIRST_VIEW_HOURS = 24;
const EDGE_PX = 48;
// Above the map's top edge: the search bar.
const TOP_BAR_PX = 40;
const LEVEL_TEXT: Record<Level, TextName> = { 850: 'low', 700: 'middle', 500: 'high' };
const HINT_TEXT: Record<Level, TextName> = { 850: 'lowHint', 700: 'middleHint', 500: 'highHint' };
const ENDING_TEXT: Record<Ending, TextName> = {
  landed: 'landed',
  storm: 'storm',
  snow: 'snow',
  rain: 'rain',
  torn: 'torn',
};

let host: BalloonHost | undefined;
// Each screen bumps this: answers for an older one are dropped.
let screen = 0;
let layers: L.Layer[] = [];
let stopPlaying: (() => void) | undefined;
// While the map pans or zooms, following waits for it.
let mapMoving = false;

/** Opens the card: the launch for a place, or a flight from a link's #hash. */
export function openBalloon(newHost: BalloonHost, target: PickedPoint | string): void {
  setUp(newHost);
  if (typeof target === 'string') {
    const shared = readBalloonHash(target);
    if (!shared) {
      newHost.onClose();
      return;
    }
    showShared(shared);
  } else {
    showLaunch(target);
  }
  if (!newHost.dialog.open) newHost.dialog.show();
}

function setUp(newHost: BalloonHost) {
  const first = host === undefined;
  host = newHost;
  if (!first) return;
  const { dialog } = newHost;
  dialog.querySelector('.quiz__close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dialog.close();
  });
  dialog.addEventListener('close', () => {
    screen++;
    clearMap();
    publishCoveredArea();
    host?.onClose();
  });
  new ResizeObserver(publishCoveredArea).observe(dialog);
  window.addEventListener('resize', publishCoveredArea);
  newHost.map.on('movestart', () => (mapMoving = true));
  newHost.map.on('moveend', () => (mapMoving = false));
}

// ── Screens ──

function showLaunch(place: PickedPoint) {
  const mine = ++screen;
  clearMap();
  const saved = loadSaved();
  let level: Level = 850;
  let colour: Colour = saved.colour ?? 'red';
  const launch = launchHour();

  const status = el('p', 'balloon__status', b('checkingWinds'));
  status.setAttribute('role', 'status');
  const heights = el('div', 'balloon__heights');
  heights.setAttribute('role', 'group');
  heights.setAttribute('aria-labelledby', 'balloon-height');
  const heightLabel = el('p', 'balloon__label', b('height'));
  heightLabel.id = 'balloon-height';

  const nameInput = el('input', 'balloon__name');
  nameInput.id = 'balloon-name';
  nameInput.type = 'text';
  nameInput.maxLength = NAME_MAX;
  nameInput.autocomplete = 'off';
  nameInput.value = saved.name ?? '';
  const nameLabel = el('label', 'balloon__label', b('nameLabel'));
  nameLabel.htmlFor = 'balloon-name';

  const colourLabel = el('p', 'balloon__label', b('colour'));
  colourLabel.id = 'balloon-colour';
  const colours = el('div', 'balloon__colours');
  colours.setAttribute('role', 'group');
  colours.setAttribute('aria-labelledby', 'balloon-colour');
  const colourButtons = COLOURS.map((name) => {
    const button = el('button', `balloon__colour balloon__colour--${name}`);
    button.type = 'button';
    button.setAttribute('aria-label', b(name));
    button.addEventListener('click', () => {
      colour = name;
      pressOnly(colourButtons, button);
    });
    return button;
  });
  colours.append(...colourButtons);
  pressOnly(colourButtons, colourButtons[COLOURS.indexOf(colour)]);

  const launchButton = el('button', 'button quiz__primary', b('launch'));
  launchButton.type = 'button';
  launchButton.disabled = true;

  setTitle(b('launchTitle'));
  setBody(
    [
      el('p', 'balloon__lead', b('launchLead', { place: placeText(place) })),
      heightLabel,
      heights,
      status,
      nameLabel,
      nameInput,
      colourLabel,
      colours,
      actionRow(launchButton),
      el('p', 'balloon__note', b('game')),
    ],
    launchButton,
  );
  showBalloonAt(place, colour);

  // All three heights at the launch place in one request; the flight's
  // first winds come from it too.
  const launchWinds = fetchWinds(place.lat, place.lng, LEVELS);
  launchWinds.then(
    (winds) => {
      if (mine !== screen) return;
      status.textContent = '';
      const buttons = LEVELS.map((height) => {
        const now = conditionsAt(winds, height, launch);
        const button = el('button', 'balloon__height');
        button.type = 'button';
        button.append(
          el('span', 'balloon__height-name', b(LEVEL_TEXT[height], { height: heightText(height) })),
          el(
            'span',
            'balloon__height-wind',
            now
              ? b('windNow', {
                  speed: formatWindSpeed(now.windSpeed),
                  from: windFrom(now.windFrom),
                })
              : '–',
          ),
          el('span', 'balloon__height-hint', b(HINT_TEXT[height])),
        );
        button.addEventListener('click', () => {
          level = height;
          pressOnly(buttons, button);
        });
        return button;
      });
      heights.append(...buttons);
      pressOnly(buttons, buttons[0]);
      launchButton.disabled = false;
    },
    () => {
      if (mine === screen) status.textContent = b('windsFailed');
    },
  );

  launchButton.addEventListener('click', () => {
    const name = cleanName(nameInput.value);
    writeSaved({ ...loadSaved(), name: name || undefined, colour });
    void startFlight(place, level, colour, name, launch, launchWinds);
  });
}

async function startFlight(
  place: PickedPoint,
  level: Level,
  colour: Colour,
  name: string,
  launch: number,
  launchWinds: Promise<Winds>,
) {
  const mine = ++screen;
  const status = el('p', 'balloon__status', b('checkingWay'));
  status.setAttribute('role', 'status');
  setTitle(name || b('yourBalloon'));
  setBody([status]);

  let first = true;
  let flight: Flight;
  try {
    flight = await fly(place, level, launch, (lat, lng) => {
      if (first) {
        first = false;
        return launchWinds;
      }
      return fetchWinds(lat, lng, [level]);
    });
  } catch {
    if (mine === screen) status.textContent = b('windsFailed');
    return;
  }
  if (mine !== screen) return;
  const path = pathOf(flight);
  const shared: SharedFlight = {
    start: { lat: place.lat, lng: place.lng },
    launch,
    level,
    colour,
    hours: flight.hours[flight.hours.length - 1].hour,
    ending: flight.ending,
    path,
    name: name || undefined,
  };
  const topSpeed = Math.max(...flight.hours.map((h) => h.conditions?.windSpeed ?? 0));
  play(shared, flight.hours, mine, () => showResult(shared, place, topSpeed));
}

/** The flight on the map, hour by hour; then `done`. */
function play(
  shared: SharedFlight,
  track: { lat: number; lng: number; hour: number; conditions?: Conditions }[],
  mine: number,
  done: () => void,
) {
  clearMap();
  const latLngs = unwrapped(track);
  const totalHours = shared.hours;
  // The distance shown while flying ends at the path's (link.ts) length.
  const cumulative = [0];
  for (let i = 1; i < latLngs.length; i++) {
    cumulative.push(cumulative[i - 1] + host!.map.distance(latLngs[i - 1], latLngs[i]) / 1000);
  }
  const scale = pathKm(shared.path) / (cumulative[cumulative.length - 1] || 1);

  const casing = L.polyline([], { color: '#ffffff', weight: 7, opacity: 0.9, interactive: false });
  const line = L.polyline([], {
    className: `balloon-path balloon-path--${shared.colour}`,
    weight: 4,
    interactive: false,
  });
  const marker = balloonMarker(latLngs[0], shared.colour, true);
  layers = [casing, line, marker];
  layers.forEach((layer) => layer.addTo(host!.map));
  // The first day's stretch to begin with; the map then follows the
  // balloon, and shows the whole flight at the end.
  const firstDay = latLngs.filter((_, index) => track[index].hour <= FIRST_VIEW_HOURS);
  fitFlight(firstDay.length > 1 ? firstDay : latLngs, false);

  const progress = el('p', 'balloon__progress');
  const upThere = el('p', 'balloon__up');
  const below = el('p', 'balloon__below');
  const pauseButton = el('button', 'button balloon__pause', b('pause'));
  pauseButton.type = 'button';
  const skipButton = el('button', 'button balloon__skip', b('skip'));
  skipButton.type = 'button';
  const actions = actionRow(pauseButton, skipButton);
  setTitle(shared.name || b('yourBalloon'));
  setBody([progress, upThere, below, actions], pauseButton);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hour = reduced ? totalHours : 0;
  let paused = false;
  let last = performance.now();
  let frame = 0;

  // The point at or before the hour shown (a link's path has one every 3 hours).
  let i = 0;
  const draw = () => {
    while (i < track.length - 1 && track[i + 1].hour <= hour) i++;
    const next = Math.min(i + 1, latLngs.length - 1);
    const t = hour - track[i].hour;
    const span = track[next].hour - track[i].hour || 1;
    const fraction = Math.min(Math.max(t / span, 0), 1);
    const here = L.latLng(
      latLngs[i].lat + (latLngs[next].lat - latLngs[i].lat) * fraction,
      latLngs[i].lng + (latLngs[next].lng - latLngs[i].lng) * fraction,
    );
    const drawn = [...latLngs.slice(0, i + 1), here];
    casing.setLatLngs(drawn);
    line.setLatLngs(drawn);
    marker.setLatLng(here);
    if (!reduced) follow(here);
    const km = (cumulative[i] + (cumulative[next] - cumulative[i]) * fraction) * scale;
    const wholeHours = Math.floor(hour);
    progress.textContent = b('progress', {
      day: Math.floor(wholeHours / 24) + 1,
      hours: wholeHours,
      distance: distanceText(km),
    });
    const conditions = track[i].conditions;
    upThere.textContent = conditions ? upThereText(shared.level, conditions) : '';
    below.textContent = conditions ? belowText(conditions) : '';
  };

  const finish = () => {
    cancelAnimationFrame(frame);
    stopPlaying = undefined;
    hour = totalHours;
    draw();
    marker.remove();
    layers.push(landingMarker(latLngs[latLngs.length - 1]).addTo(host!.map));
    fitFlight(latLngs, !reduced);
    if (mine === screen) done();
  };

  const tick = (now: number) => {
    if (!paused) hour += ((now - last) / 1000) * HOURS_PER_SECOND;
    last = now;
    if (hour >= totalHours) {
      finish();
      return;
    }
    draw();
    frame = requestAnimationFrame(tick);
  };

  const togglePause = () => {
    paused = !paused;
    pauseButton.textContent = paused ? b('resume') : b('pause');
  };
  pauseButton.addEventListener('click', togglePause);
  marker.on('click', togglePause);
  skipButton.addEventListener('click', finish);
  stopPlaying = () => cancelAnimationFrame(frame);

  if (reduced) finish();
  else {
    draw();
    frame = requestAnimationFrame(tick);
  }
}

function showResult(shared: SharedFlight, place: PickedPoint, topSpeed: number) {
  const mine = screen;
  const km = pathKm(shared.path);
  const saved = loadSaved();
  const best = km > (saved.bestKm ?? 0);
  if (best) writeSaved({ ...saved, bestKm: km });

  const from = placeText(place);
  const landing = shared.path[shared.path.length - 1];
  const route = el(
    'p',
    'balloon__route',
    b('route', { from, to: formatCoordinates(landing.lat, landing.lng) }),
  );
  const name = shared.name || b('yourBalloon');

  const shareButton = el('button', 'button quiz__primary', b('shareResult'));
  shareButton.type = 'button';
  const againButton = el('button', 'button', b('flyAgain'));
  againButton.type = 'button';
  const actions = actionRow(shareButton, againButton);
  const shareStatus = el('p', 'balloon__status');
  shareStatus.setAttribute('role', 'status');

  setTitle(name);
  setBody(
    [
      el('p', 'balloon__flew', b('flew', { name })),
      el('p', 'balloon__distance', distanceText(km)),
      route,
      stats(shared, topSpeed),
      el('p', 'balloon__ending', b(ENDING_TEXT[shared.ending])),
      el(
        'p',
        'balloon__best',
        best ? b('bestYet') : b('yourBest', { distance: distanceText(saved.bestKm ?? km) }),
      ),
      actions,
      shareStatus,
      el('p', 'balloon__note', b('game')),
    ],
    shareButton,
  );

  let to = formatCoordinates(landing.lat, landing.lng);
  void host!.placeName(landing.lat, landing.lng).then(
    (found) => {
      if (!found || mine !== screen) return;
      to = found;
      route.textContent = b('route', { from, to });
    },
    () => undefined,
  );

  shareButton.addEventListener('click', () => {
    const text = b('shareText', {
      name,
      distance: distanceText(km),
      from,
      to,
      duration: durationText(shared.hours),
    });
    void share(`${text}\n${linkFor(shared)}`, shareStatus);
  });
  againButton.addEventListener('click', () => showLaunch(place));
}

function showShared(shared: SharedFlight) {
  const mine = ++screen;
  const start: PickedPoint = { ...shared.start };
  const name = shared.name || b('aBalloon');
  const km = pathKm(shared.path);
  const saved = loadSaved();
  const fromText = el(
    'p',
    'balloon__flew',
    b('flewFrom', { name, place: formatCoordinates(start.lat, start.lng) }),
  );
  const launchButton = el(
    'button',
    'button quiz__primary',
    b('launchToo', { place: formatCoordinates(start.lat, start.lng) }),
  );
  launchButton.type = 'button';

  const track = shared.path.map((point, i) => ({
    ...point,
    hour: Math.min(i * 3, shared.hours),
  }));
  play(shared, track, mine, () => {
    const date = new Intl.DateTimeFormat(currentUnits().dateLocale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(shared.launch));
    setTitle(name);
    setBody(
      [
        fromText,
        el('p', 'balloon__distance', distanceText(km)),
        el(
          'p',
          'balloon__launched',
          b('launched', {
            date,
            height: heightText(shared.level),
            duration: durationText(shared.hours),
          }),
        ),
        el('p', 'balloon__ending', b(ENDING_TEXT[shared.ending])),
        ...(saved.bestKm
          ? [el('p', 'balloon__best', b('yourBest', { distance: distanceText(saved.bestKm) }))]
          : []),
        actionRow(launchButton),
        el('p', 'balloon__note', b('game')),
      ],
      launchButton,
    );
  });

  void host!.placeName(start.lat, start.lng).then(
    (found) => {
      if (!found || mine !== screen) return;
      start.name = found;
      fromText.textContent = b('flewFrom', { name, place: found });
      launchButton.textContent = b('launchToo', { place: found });
    },
    () => undefined,
  );
  launchButton.addEventListener('click', () => showLaunch(start));
}

// ── Map ──

const BALLOON_SVG =
  '<svg viewBox="-20 -32 40 56" width="36" height="50" aria-hidden="true" focusable="false">' +
  '<path class="balloon-marker__envelope" d="M0,-30C-17,-30-19,-8-7,6L-5,10L5,10L7,6C19,-8,17,-30,0,-30Z"/>' +
  '<path class="balloon-marker__ropes" d="M-5,10L-4,16M5,10L4,16"/>' +
  '<rect class="balloon-marker__basket" x="-5" y="16" width="10" height="7" rx="1"/></svg>';

function balloonMarker(at: L.LatLngExpression, colour: Colour, interactive: boolean): L.Marker {
  return L.marker(at, {
    icon: L.divIcon({
      className: `balloon-marker balloon-marker--${colour}`,
      html: BALLOON_SVG,
      iconSize: [36, 50],
      iconAnchor: [18, 46],
    }),
    interactive,
    keyboard: interactive,
    title: interactive ? b('balloonMarker') : '',
    alt: b('balloonMarker'),
    zIndexOffset: 1000,
  });
}

function landingMarker(at: L.LatLngExpression): L.Marker {
  return L.marker(at, {
    icon: L.divIcon({ className: 'balloon-landing', iconSize: [16, 16], iconAnchor: [8, 8] }),
    interactive: false,
    keyboard: false,
  });
}

function showBalloonAt(place: Point, colour: Colour) {
  const marker = balloonMarker([place.lat, place.lng], colour, false);
  layers.push(marker.addTo(host!.map));
}

function clearMap() {
  stopPlaying?.();
  stopPlaying = undefined;
  layers.forEach((layer) => layer.remove());
  layers = [];
}

/** Longitudes made continuous across the date line, so the line doesn't jump. */
function unwrapped(points: readonly Point[]): L.LatLng[] {
  const result: L.LatLng[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    let lng = point.lng;
    if (previous) {
      while (lng - previous.lng > 180) lng -= 360;
      while (lng - previous.lng < -180) lng += 360;
    }
    result.push(L.latLng(point.lat, lng));
  }
  return result;
}

/** Shows these points in the part of the map the card leaves free. */
function fitFlight(latLngs: L.LatLng[], animate: boolean) {
  host!.map.fitBounds(L.latLngBounds(latLngs), { ...freeArea(), maxZoom: 6, animate });
}

/** At the edge of the free part of the map: pans it back to the middle. */
function follow(here: L.LatLng) {
  const map = host!.map;
  if (mapMoving) return;
  const size = map.getSize();
  const { right, bottom } = coveredByCard();
  const at = map.latLngToContainerPoint(here);
  const inside =
    at.x >= EDGE_PX &&
    at.y >= EDGE_PX + TOP_BAR_PX &&
    at.x <= size.x - right - EDGE_PX &&
    at.y <= size.y - bottom - EDGE_PX;
  if (inside) return;
  const middle = L.point((size.x - right) / 2, (TOP_BAR_PX + size.y - bottom) / 2);
  map.panBy(at.subtract(middle), { animate: true, duration: 0.5 });
}

/** Leaflet padding for the map outside the card (and the search bar on top). */
function freeArea(): { paddingTopLeft: L.PointTuple; paddingBottomRight: L.PointTuple } {
  const { right, bottom } = coveredByCard();
  return {
    paddingTopLeft: [EDGE_PX, EDGE_PX + TOP_BAR_PX],
    paddingBottomRight: [EDGE_PX + right, EDGE_PX + bottom],
  };
}

/** How much of the map the card hides (as for the quiz card). */
function coveredByCard(): { right: number; bottom: number } {
  const rect = host!.dialog.getBoundingClientRect();
  if (rect.height === 0 || rect.right < window.innerWidth / 2) return { right: 0, bottom: 0 };
  if (rect.left > window.innerWidth / 2) return { right: window.innerWidth - rect.left, bottom: 0 };
  return { right: 0, bottom: window.innerHeight - rect.top };
}

/** What the card covers, for the map's credits and round buttons (style.css). */
function publishCoveredArea() {
  if (!host) return;
  const { right, bottom } = coveredByCard();
  const root = document.documentElement.style;
  root.setProperty('--quiz-right', `${right}px`);
  root.setProperty('--quiz-bottom', `${bottom}px`);
}

// ── Card helpers ──

function setTitle(text: string) {
  host!.dialog.querySelector('.balloon__title')!.textContent = text;
}

function setBody(children: Node[], focus?: HTMLElement) {
  const body = host!.dialog.querySelector<HTMLElement>('.quiz__body')!;
  body.replaceChildren(...children);
  (focus ?? body.querySelector<HTMLElement>('button') ?? host!.dialog).focus({
    preventScroll: true,
  });
}

/** Buttons side by side, as on the quiz card (wrapping on narrow phones). */
function actionRow(...buttons: HTMLButtonElement[]): HTMLElement {
  const row = el('div', 'quiz__row quiz__actions');
  row.append(...buttons);
  return row;
}

function pressOnly(buttons: HTMLButtonElement[], pressed: HTMLButtonElement) {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button === pressed));
}

function stats(shared: SharedFlight, topSpeed: number): HTMLElement {
  const list = el('dl', 'balloon__stats');
  const add = (label: string, value: string) => {
    const item = el('div', 'balloon__stat');
    item.append(el('dt', '', label), el('dd', '', value));
    list.append(item);
  };
  add(b('inAir'), durationText(shared.hours));
  add(b('topSpeed'), formatWindSpeed(topSpeed));
  add(b('height'), heightText(shared.level));
  return list;
}

async function share(message: string, status: HTMLElement) {
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
    status.textContent = b('copied');
    window.dispatchEvent(new Event('weatherpin:shared'));
  } catch {
    status.textContent = b('copyFailed');
  }
}

function linkFor(shared: SharedFlight): string {
  return `${window.location.origin}${window.location.pathname}${balloonHash(shared)}`;
}

// ── Words and numbers ──

const imperial = () => currentUnits().temperature === 'fahrenheit';

function heightText(level: Level): string {
  const feet = { 850: 5000, 700: 10000, 500: 18000 }[level];
  const km = { 850: 1.5, 700: 3, 500: 5.5 }[level];
  return imperial() ? `${number(feet)} ft` : `${number(km, 1)} km`;
}

function distanceText(km: number): string {
  const units = currentUnits();
  const miles = units.temperature === 'fahrenheit' || units.wind === 'mph';
  return miles ? `${number(km / 1.609344)} mi` : `${number(km)} km`;
}

function durationText(hours: number): string {
  const days = Math.floor(hours / 24);
  return days > 0 ? b('daysHours', { days, hours: hours % 24 }) : b('hoursOnly', { hours });
}

function number(value: number, decimals = 0): string {
  return new Intl.NumberFormat(currentUnits().dateLocale, {
    maximumFractionDigits: decimals,
  }).format(value);
}

function upThereText(level: Level, c: Conditions): string {
  const sky =
    (c.cloud ?? 0) >= 50
      ? b('inCloud', { percent: formatPercent(c.cloud ?? 0) })
      : b('clearAround');
  return b('upThere', {
    height: heightText(level),
    temperature: c.temperature == null ? '–' : formatTemperature(c.temperature),
    speed: formatWindSpeed(c.windSpeed),
    from: windFrom(c.windFrom),
    sky,
  });
}

function belowText(c: Conditions): string {
  if (c.groundCode == null || c.groundTemperature == null) return '';
  const weather = describeWeather(c.groundCode).description;
  return b('below', {
    weather: weather.charAt(0).toLocaleLowerCase() + weather.slice(1),
    temperature: formatTemperature(c.groundTemperature),
  });
}

function placeText(place: PickedPoint): string {
  return place.name ?? formatCoordinates(place.lat, place.lng);
}

// ── Saved on the device: the name and colour last used, the best flight ──

function loadSaved(): Saved {
  const stored = readStored(STORAGE_KEY) as Partial<Saved> | undefined;
  if (!stored || stored.version !== 1) return { version: 1 };
  return {
    version: 1,
    name: typeof stored.name === 'string' ? cleanName(stored.name) || undefined : undefined,
    colour: (COLOURS as readonly string[]).includes(stored.colour ?? '')
      ? stored.colour
      : undefined,
    bestKm: typeof stored.bestKm === 'number' && stored.bestKm > 0 ? stored.bestKm : undefined,
  };
}

function writeSaved(saved: Saved) {
  writeStored(STORAGE_KEY, saved);
}
