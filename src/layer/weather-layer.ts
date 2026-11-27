// The weather symbols layer: over the map, the weather at the bigger
// cities in view (a symbol and the temperature), now, tonight (03:00) or
// tomorrow (15:00) at each place, picked in the time bar. Tapping one
// shows that city's weather in the panel. Off by default; on/off and the
// time are kept. Loaded when first turned on, or after start-up if it was
// left on (main.ts); hidden during the quiz, which it would give away.
//
// The cities (cities.ts, GeoNames) are taken biggest first, as many as fit
// apart on screen (12 at most); their weather comes in one lean Open-Meteo
// request for all the places not already known (each counts as a call:
// only temperature and weather code, hourly, 2 days), asked once the map
// has stopped for a second, and kept 2 hours on the device, across visits
// too, so panning back or reopening the app asks for nothing. Day or night
// comes from the sun's height, not the request.

import L from 'leaflet';
import './weather-layer.css';
import { el } from '../dom';
import type { PickedPoint } from '../map';
import { readStored, writeStored } from '../storage';
import { currentUnits } from '../units';
import { sunElevation } from '../weather/solar';
import { describeWeather } from '../weather/wmo';
import { formatTemperature } from '../format';
import { CITIES } from './cities';
import { w } from './texts';

export interface WeatherLayerHost {
  map: L.Map;
  button: HTMLButtonElement;
  /** The time bar: its buttons carry data-time, a .weather-bar__status line. */
  bar: HTMLElement;
  /** Shows a city's weather in the panel. */
  openPlace(point: PickedPoint): void;
}

export interface WeatherLayer {
  toggle(): void;
  /** Hidden for a while (the quiz), kept on. */
  setPaused(paused: boolean): void;
}

type Time = 'now' | 'tonight' | 'tomorrow';
const TIMES: readonly Time[] = ['now', 'tonight', 'tomorrow'];

interface City {
  name: string;
  lat: number;
  lng: number;
}

interface Reading {
  temperature: number;
  code: number;
  isDay: boolean;
}

interface Saved {
  version: 1;
  on: boolean;
  time: Time;
}

const STORAGE_KEY = 'weather-layer';
const CACHE_MS = 2 * 60 * 60 * 1000;
const CACHE_KEY = 'weather-layer-cache';
const MAX_KEPT = 200;
const HOUR_MS = 3600 * 1000;
// The sun's centre this far below the horizon: sunrise/sunset.
const SUNSET_ELEVATION = -0.833;
const TIMEOUT_MS = 15_000;
// A badge's room on screen (px): cities closer than this are left out.
const APART_X = 88;
const APART_Y = 56;
const EDGE = 24;
const MAX_BADGES = 12;
const MOVE_SETTLE_MS = 1000;

/** A city's hourly forecast, as asked: local times from `first`. */
interface Known {
  at: number;
  /** Seconds from UTC to the place's local time. */
  offset: number;
  first: string;
  temps: (number | null)[];
  codes: (number | null)[];
}
const cache = new Map<string, Known>();
let cacheLoaded = false;
let cities: City[] | undefined;

export function setUpWeatherLayer(host: WeatherLayerHost): WeatherLayer {
  loadCache();
  const saved = loadSaved();
  let on = false;
  let paused = false;
  let time: Time = saved.time;
  let settle: ReturnType<typeof setTimeout> | undefined;
  // Each update bumps this: an older request's answer is dropped.
  let round = 0;
  const group = L.layerGroup();
  const status = host.bar.querySelector<HTMLElement>('.weather-bar__status')!;
  const timeButtons = [...host.bar.querySelectorAll<HTMLButtonElement>('[data-time]')];

  timeButtons.forEach((button) =>
    button.addEventListener('click', () => {
      time = button.dataset.time as Time;
      save();
      showTime();
      void update();
    }),
  );

  const scheduleUpdate = () => {
    clearTimeout(settle);
    settle = setTimeout(() => void update(), MOVE_SETTLE_MS);
  };

  function showTime() {
    for (const button of timeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.time === time));
    }
  }

  function setOn(next: boolean) {
    on = next;
    host.button.setAttribute('aria-pressed', String(on));
    save();
    apply();
  }

  /** Shown when on and not paused; otherwise nothing on the map. */
  function apply() {
    const visible = on && !paused;
    host.bar.hidden = !visible;
    if (visible) {
      group.addTo(host.map);
      host.map.on('moveend', scheduleUpdate);
      showTime();
      void update();
    } else {
      round++;
      clearTimeout(settle);
      host.map.off('moveend', scheduleUpdate);
      group.clearLayers();
      group.remove();
    }
  }

  async function update() {
    const mine = ++round;
    const chosen = citiesInView(host.map);
    if (chosen.length === 0) {
      group.clearLayers();
      status.textContent = w('zoomOut');
      return;
    }
    const missing = chosen.filter((city) => !fresh(city));
    status.textContent = missing.length > 0 ? w('loading') : '';
    draw(chosen.filter(fresh));
    if (missing.length === 0) return;
    try {
      await fetchReadings(missing);
    } catch {
      if (mine === round) status.textContent = w('failed');
      return;
    }
    if (mine !== round) return;
    status.textContent = '';
    draw(chosen.filter(fresh));
  }

  function draw(shown: City[]) {
    group.clearLayers();
    for (const city of shown) {
      const reading = readingFor(city, cache.get(key(city))!, time);
      if (!reading) continue;
      const place = { lat: city.lat, lng: wrapped(city.lng), name: city.name };
      group.addLayer(badge(city, reading, () => host.openPlace(place)));
    }
  }

  function save() {
    writeStored(STORAGE_KEY, { version: 1, on, time } satisfies Saved);
  }

  // Above the radar's bar when both are on (style.css: --radar-bar-space).
  const radarBar = document.querySelector<HTMLElement>('.radar-bar');
  if (radarBar) {
    const makeRoom = () =>
      document.documentElement.style.setProperty(
        '--radar-bar-space',
        `${radarBar.hidden ? 0 : radarBar.offsetHeight + 8}px`,
      );
    new MutationObserver(makeRoom).observe(radarBar, {
      attributes: true,
      attributeFilter: ['hidden'],
    });
    new ResizeObserver(makeRoom).observe(radarBar);
    makeRoom();
  }

  if (saved.on) setOn(true);

  return {
    toggle: () => setOn(!on),
    setPaused(next) {
      paused = next;
      apply();
    },
  };
}

// ── Cities in view ──

function allCities(): City[] {
  cities ??= CITIES.split('\n').map((line) => {
    const [name, lat, lng] = line.split(';');
    return { name, lat: Number(lat), lng: Number(lng) };
  });
  return cities;
}

/** The biggest cities in view that fit apart on screen (shown at the world copy in view). */
function citiesInView(map: L.Map): City[] {
  const size = map.getSize();
  const centreLng = map.getCenter().lng;
  const max = Math.min(
    MAX_BADGES,
    Math.max(4, Math.floor((size.x * size.y) / (APART_X * APART_Y * 3))),
  );
  const taken: { city: City; x: number; y: number }[] = [];
  for (const city of allCities()) {
    const lng = city.lng + 360 * Math.round((centreLng - city.lng) / 360);
    const point = map.latLngToContainerPoint([city.lat, lng]);
    if (point.x < EDGE || point.y < EDGE || point.x > size.x - EDGE || point.y > size.y - EDGE)
      continue;
    if (taken.some((t) => Math.abs(t.x - point.x) < APART_X && Math.abs(t.y - point.y) < APART_Y)) {
      continue;
    }
    taken.push({ city: { ...city, lng }, x: point.x, y: point.y });
    if (taken.length >= max) break;
  }
  return taken.map((t) => t.city);
}

// ── Weather ──

const wrapped = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;
const key = (city: City) => `${city.lat},${wrapped(city.lng)}`;
const fresh = (city: City) => {
  const known = cache.get(key(city));
  return known !== undefined && Date.now() - known.at < CACHE_MS;
};

interface Answer {
  utc_offset_seconds?: number;
  hourly?: {
    time: string[];
    temperature_2m: (number | null)[];
    weather_code: (number | null)[];
  };
}

/** The hourly temperature and weather of these cities, 2 days: one request. */
async function fetchReadings(list: City[]): Promise<void> {
  const params = new URLSearchParams({
    latitude: list.map((city) => city.lat.toFixed(2)).join(','),
    longitude: list.map((city) => wrapped(city.lng).toFixed(2)).join(','),
    hourly: 'temperature_2m,weather_code',
    timezone: 'auto',
    forecast_days: '2',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Weather symbols: HTTP ${response.status}`);
  const data = (await response.json()) as Answer | Answer[];
  const answers = Array.isArray(data) ? data : [data];
  list.forEach((city, i) => {
    const hourly = answers[i]?.hourly;
    if (!hourly?.time?.length) return;
    cache.set(key(city), {
      at: Date.now(),
      offset: answers[i].utc_offset_seconds ?? 0,
      first: hourly.time[0],
      temps: hourly.temperature_2m,
      codes: hourly.weather_code,
    });
  });
  saveCache();
}

/**
 * Now (this hour), tonight 03:00 (tomorrow's, unless it's before 03:00) or
 * tomorrow 15:00, local time at the city; day or night by the sun there.
 */
function readingFor(city: City, known: Known, time: Time): Reading | undefined {
  // Local wall-clock times, as if UTC.
  const first = Date.parse(`${known.first}Z`);
  const localNow = Date.now() + known.offset * 1000;
  const midnight = Math.floor(localNow / (24 * HOUR_MS)) * 24 * HOUR_MS;
  const localHour = new Date(localNow).getUTCHours();
  const target =
    time === 'now'
      ? first + Math.floor((localNow - first) / HOUR_MS) * HOUR_MS
      : midnight + (time === 'tonight' ? (localHour < 3 ? 3 : 27) : 39) * HOUR_MS;
  const i = Math.round((target - first) / HOUR_MS);
  const temperature = known.temps[i];
  const code = known.codes[i];
  if (i < 0 || temperature == null || code == null) return undefined;
  const utc = target - known.offset * 1000;
  return {
    temperature,
    code,
    isDay: sunElevation(city.lat, wrapped(city.lng), utc) > SUNSET_ELEVATION,
  };
}

/** The cities' weather kept from earlier visits, still fresh. */
function loadCache() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  const stored = readStored(CACHE_KEY) as { version?: number; places?: unknown } | undefined;
  if (stored?.version !== 1 || typeof stored.places !== 'object' || !stored.places) return;
  for (const [place, known] of Object.entries(stored.places as Record<string, Known>)) {
    const sound =
      typeof known?.at === 'number' &&
      Date.now() - known.at < CACHE_MS &&
      typeof known.offset === 'number' &&
      typeof known.first === 'string' &&
      Array.isArray(known.temps) &&
      Array.isArray(known.codes);
    if (sound) cache.set(place, known);
  }
}

/** Kept on the device: the freshest, at most 200 cities. */
function saveCache() {
  const kept = [...cache.entries()]
    .filter(([, known]) => Date.now() - known.at < CACHE_MS)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, MAX_KEPT);
  writeStored(CACHE_KEY, { version: 1, places: Object.fromEntries(kept) });
}

// ── Badges ──

function badge(city: City, reading: Reading, open: () => void): L.Marker {
  const { description, icon } = describeWeather(reading.code, reading.isDay);
  const degrees = Math.round(
    currentUnits().temperature === 'fahrenheit'
      ? reading.temperature * 1.8 + 32
      : reading.temperature,
  );
  const temperatureClass = degrees < 0 ? 'cold' : degrees > 0 ? 'warm' : 'zero';
  const element = el('span', 'weather-badge__box');
  const label = w('label', {
    place: city.name,
    weather: description,
    temperature: formatTemperature(reading.temperature),
  });
  // Named by what it shows, with the full words for screen readers.
  element.append(
    el('span', 'weather-badge__icon', icon),
    el('span', `weather-badge__temp weather-badge__temp--${temperatureClass}`, `${degrees}°`),
    el('span', 'weather-badge__name', city.name),
    el('span', 'visually-hidden', ` (${label})`),
  );
  const marker = L.marker([city.lat, city.lng], {
    icon: L.divIcon({
      className: 'weather-badge',
      html: element,
      iconSize: [76, 36],
      iconAnchor: [38, 18],
    }),
    keyboard: true,
  });
  marker.on('click', open);
  return marker;
}

function loadSaved(): Saved {
  const stored = readStored(STORAGE_KEY) as Partial<Saved> | undefined;
  return {
    version: 1,
    on: stored?.version === 1 && stored.on === true,
    time: TIMES.includes(stored?.time as Time) ? (stored!.time as Time) : 'now',
  };
}
