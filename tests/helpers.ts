// Shared setup for the browser tests: fake network, frozen clock, a watch on
// console errors, and helpers for checking where things are on screen.

import { FMI_WARNINGS, fmiListFixture } from './fixtures/fmi';
import { roadForecastsFixture, roadSectionsFixture } from './fixtures/roads';
import { readFileSync } from 'node:fs';
import {
  test as base,
  expect,
  type Locator,
  type Page,
  type Route,
  type TestInfo,
} from '@playwright/test';
import { airQualityFixture, type AirQualityKind } from './fixtures/air-quality';
import { archiveFixture } from './fixtures/archive';
import { auroraFixture } from './fixtures/aurora';
import { balloonWindsFixture } from './fixtures/balloon';
import { forecastFixture, type ForecastKind } from './fixtures/forecast';
import { weatherLayerFixture } from './fixtures/weather-layer';
import { marineFixture, type MarineKind } from './fixtures/marine';
import { ECCC_CAPABILITIES, radarFramesFixture } from './fixtures/radar';
import {
  ecccWarningsFixture,
  metnoWarningsFixture,
  smhiWarningsFixture,
  NO_WARNINGS,
  nwsWarningsFixture,
} from './fixtures/warnings';

const TILE_PNG = readFileSync(new URL('./fixtures/tile.png', import.meta.url));
const OSLO_RESULTS = readFileSync(
  new URL('./fixtures/geocoding-oslo.json', import.meta.url),
  'utf8',
);

/** 14:05 in Oslo; matches the forecast fixture's "current" hour. */
export const FIXED_NOW = new Date('2026-11-15T13:05:00Z');

/** Breakpoint where the panel turns into a bottom sheet (see style.css). */
export const MOBILE_MAX_WIDTH = 767;

/** What the fake forecast API answers. */
export type ForecastMode = ForecastKind | 'server-error';

/** What the fake air quality API answers. */
export type AirQualityMode = AirQualityKind | 'server-error';

/**
 * What the fake radar services answer: both fine, only Environment Canada
 * failing, or both failing.
 */
export type RadarMode = 'normal' | 'eccc-error' | 'server-error';

/** What the fake warning services answer. */
export type WarningsMode = 'none' | 'active' | 'server-error';

/** What the fake sea weather API answers: inland (no data) by default. */
export type MarineMode = MarineKind | 'server-error';
/**
 * Nominatim's answer: no name (as at sea), a town (Espoo), or a place named
 * in another script: with an English name (北京市 → Beijing) or without
 * any readable one (only the country can be shown).
 */
export type PlaceNameMode = 'none' | 'town' | 'foreign' | 'unreadable';

interface Options {
  forecastMode: ForecastMode;
  airQualityMode: AirQualityMode;
  radarMode: RadarMode;
  warningsMode: WarningsMode;
  marineMode: MarineMode;
  /** Nominatim's answer for a tapped point: no name (as at sea) or a town. */
  placeNameMode: PlaceNameMode;
  /**
   * Every panel section open at the start (default), so tests can read any
   * row; false keeps the app's own first-visit defaults (some folded).
   */
  sectionsOpen: boolean;
}

/**
 * `test` with the page prepared: external requests answered from fixtures,
 * the clock frozen, and the test failed if the page logs any console error
 * (which also catches Content-Security-Policy violations).
 */
export const test = base.extend<Options>({
  forecastMode: ['normal', { option: true }],
  airQualityMode: ['europe', { option: true }],
  radarMode: ['normal', { option: true }],
  warningsMode: ['none', { option: true }],
  marineMode: ['land', { option: true }],
  placeNameMode: ['none', { option: true }],
  sectionsOpen: [true, { option: true }],

  page: async (
    {
      page,
      forecastMode,
      airQualityMode,
      radarMode,
      warningsMode,
      marineMode,
      placeNameMode,
      sectionsOpen,
    },
    use,
  ) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      // The browser logs the failed request itself in the error scenario.
      const expectsServerError =
        forecastMode === 'server-error' ||
        airQualityMode === 'server-error' ||
        radarMode !== 'normal' ||
        warningsMode === 'server-error' ||
        marineMode === 'server-error';
      // (500 from the fake services; 502 from the fake warnings broker.)
      if (expectsServerError && /status of 50[02]/.test(message.text())) return;
      // Playwright's own screenshot stylesheet, blocked by our CSP in WebKit
      // (see snapshot()). Only while a screenshot is being taken.
      if (screenshotting.has(page) && message.text().includes('style-src')) return;
      // After goOffline(): the browser logs each request that fails.
      if (offline.has(page) && NETWORK_FAILURE.test(message.text())) return;
      // A request cut off while offline can be logged just after the
      // connection is back; only goOffline() causes this exact error.
      if (wentOffline.has(page) && message.text().includes('ERR_INTERNET_DISCONNECTED')) return;
      problems.push(`Console error: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`Page error: ${error.message}`));

    // Start the clock at a fixed moment but let it run: Leaflet times its pan
    // and zoom animations with Date, so a frozen clock (setFixedTime) would
    // stop every animation at its first frame.
    await page.clock.setSystemTime(FIXED_NOW);
    if (sectionsOpen) await openAllSections(page);
    await fakeNetwork(
      page,
      { forecastMode, airQualityMode, radarMode, warningsMode, marineMode, placeNameMode },
      problems,
    );

    await use(page);

    expect(problems, 'console errors or unexpected requests').toEqual([]);
  },
});

export { expect };

/**
 * Saves "every section open" once per tab, as a user who unfolded them all
 * would have (a reload keeps what the test did since, e.g. clearing saved
 * data). Blocked storage just keeps the app's defaults.
 */
async function openAllSections(page: Page) {
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('test:sections-opened')) return;
      sessionStorage.setItem('test:sections-opened', '1');
      const sections = Object.fromEntries(
        ['hourly', 'daily', 'sea', 'air-quality', 'sky', 'more-details'].map((id) => [id, false]),
      );
      localStorage.setItem(
        'nordic-weather:folded-sections',
        JSON.stringify({ version: 1, sections }),
      );
    } catch {
      // Storage blocked by the test: the app's defaults apply.
    }
  });
}

async function fakeNetwork(
  page: Page,
  {
    forecastMode,
    airQualityMode,
    radarMode,
    warningsMode,
    marineMode,
    placeNameMode,
  }: Omit<Options, 'sectionsOpen'>,
  problems: string[],
) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    // The site's own warnings broker for Finland (worker/fmi.ts): answered
    // here, so its real fetches to FMI never happen in tests.
    if (url.hostname === 'localhost' && url.pathname.startsWith('/api/')) {
      if (warningsMode === 'server-error') {
        return route.fulfill({ status: 502, json: { error: "FMI's warnings couldn't be read" } });
      }
      if (url.pathname === '/api/fmi/warnings') {
        return route.fulfill({ json: fmiListFixture(warningsMode === 'active') });
      }
      const warning = FMI_WARNINGS[url.pathname.replace('/api/fmi/warning/', '')];
      if (warning) return route.fulfill({ json: warning });
      return route.fulfill({ status: 404, json: { error: 'Not found' } });
    }

    // The app itself, served by wrangler dev.
    if (url.hostname === 'localhost') return route.continue();

    // Map tiles: one plain test tile for every position (no load on OSM).
    if (url.hostname === 'tile.openstreetmap.org') {
      return route.fulfill({ contentType: 'image/png', body: TILE_PNG });
    }

    if (url.hostname === 'api.open-meteo.com' && url.pathname === '/v1/forecast') {
      if (forecastMode === 'server-error') {
        return route.fulfill({ status: 500, json: { error: true, reason: 'Test server error' } });
      }
      // The favourites list asks only for the weather now, for all its
      // places in one request: one answer each (a list for several).
      if (!url.searchParams.has('hourly')) {
        const count = (url.searchParams.get('latitude') ?? '').split(',').length;
        const answers = Array.from({ length: count }, (_, i) => ({
          current: { temperature_2m: 3 + i, weather_code: 3, is_day: 1 },
        }));
        return route.fulfill({ json: count === 1 ? answers[0] : answers });
      }
      // The weather symbols layer's many places (src/layer/weather-layer.ts).
      if (url.searchParams.get('hourly') === 'temperature_2m,weather_code') {
        return route.fulfill({ json: weatherLayerFixture(url) });
      }
      // A balloon's winds at height (src/balloon/winds.ts).
      if (url.searchParams.get('hourly')?.includes('hPa')) {
        return route.fulfill({ json: balloonWindsFixture(url) });
      }
      return route.fulfill({ json: forecastFixture(forecastMode) });
    }

    if (url.hostname === 'air-quality-api.open-meteo.com') {
      if (airQualityMode === 'server-error') {
        return route.fulfill({ status: 500, json: { error: true, reason: 'Test server error' } });
      }
      return route.fulfill({ json: airQualityFixture(airQualityMode) });
    }

    // The northern lights now (src/weather/aurora.ts).
    if (url.hostname === 'services.swpc.noaa.gov') {
      return route.fulfill({ json: auroraFixture() });
    }

    // Weather on a past day (src/weather/archive.ts): the same day whatever
    // the date asked for.
    if (url.hostname === 'archive-api.open-meteo.com') {
      return route.fulfill({ json: archiveFixture(url.searchParams.get('start_date') ?? '') });
    }

    if (url.hostname === 'marine-api.open-meteo.com') {
      if (marineMode === 'server-error') {
        return route.fulfill({ status: 500, json: { error: true, reason: 'Test server error' } });
      }
      return route.fulfill({ json: marineFixture(marineMode) });
    }

    // Rain radar: the frame list, and the same test tile for every radar tile.
    if (url.hostname === 'api.rainviewer.com') {
      if (radarMode === 'server-error') {
        return route.fulfill({ status: 500, body: 'Test server error' });
      }
      return route.fulfill({ json: radarFramesFixture() });
    }
    if (url.hostname === 'tilecache.rainviewer.com') {
      return route.fulfill({ contentType: 'image/png', body: TILE_PNG });
    }
    // Environment Canada radar: the time list, and the test tile for images.
    if (url.hostname === 'geo.weather.gc.ca') {
      if (radarMode !== 'normal') {
        return route.fulfill({ status: 500, body: 'Test server error' });
      }
      const request = (
        url.searchParams.get('request') ??
        url.searchParams.get('REQUEST') ??
        ''
      ).toLowerCase();
      if (request === 'getcapabilities') {
        return route.fulfill({ contentType: 'text/xml', body: ECCC_CAPABILITIES });
      }
      return route.fulfill({ contentType: 'image/png', body: TILE_PNG });
    }

    // Weather warnings: Environment Canada, US NWS, MET Norway, SMHI.
    const warningFixtures: Record<string, () => object> = {
      'api.weather.gc.ca': ecccWarningsFixture,
      'api.weather.gov': nwsWarningsFixture,
      'api.met.no': metnoWarningsFixture,
      'opendata-download-warnings.smhi.se': smhiWarningsFixture,
    };
    if (url.hostname in warningFixtures) {
      if (warningsMode === 'server-error') {
        return route.fulfill({ status: 500, json: { error: 'Test server error' } });
      }
      // SMHI sends a plain list; the others a GeoJSON FeatureCollection.
      const none = url.hostname === 'opendata-download-warnings.smhi.se' ? [] : NO_WARNINGS;
      const body = warningsMode === 'active' ? warningFixtures[url.hostname]() : none;
      return route.fulfill({ json: body });
    }

    // Fintraffic's road weather (Finland): the sections and their forecasts.
    if (url.hostname === 'tie.digitraffic.fi') {
      return route.fulfill({
        json: url.pathname.endsWith('/forecasts') ? roadForecastsFixture() : roadSectionsFixture(),
      });
    }

    if (url.hostname === 'geocoding-api.open-meteo.com') {
      const name = (url.searchParams.get('name') ?? '').toLowerCase();
      // Like the real API: no "results" key when nothing matches.
      const body = 'oslo'.startsWith(name) || name.startsWith('osl') ? OSLO_RESULTS : '{}';
      return route.fulfill({ contentType: 'application/json', body });
    }

    // Cloudflare Web Analytics (Cloudflare adds it to the live page only;
    // tests/analytics.spec.ts adds it by hand): a stand-in counter script
    // that reports one visit, like the real one.
    if (url.hostname === 'static.cloudflareinsights.com') {
      return route.fulfill({
        contentType: 'text/javascript',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: "fetch('https://cloudflareinsights.com/cdn-cgi/rum', { method: 'POST', body: 'visit' });",
      });
    }
    if (url.hostname === 'cloudflareinsights.com') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Nominatim (the name of a tapped point). By default no name, as at
    // sea, so tapped points keep their coordinates as the title.
    if (url.hostname === 'nominatim.openstreetmap.org') {
      if (placeNameMode === 'none') return route.fulfill({ json: { error: 'Unable to geocode' } });
      if (placeNameMode === 'foreign' || placeNameMode === 'unreadable') {
        return route.fulfill({
          json: {
            name: '北京市',
            address: { city: '北京市', country: 'China' },
            namedetails:
              placeNameMode === 'foreign'
                ? { name: '北京市', 'name:en': 'Beijing', 'name:zh': '北京市' }
                : { name: '北京市', 'name:zh': '北京市' },
          },
        });
      }
      const finnish = url.searchParams.get('accept-language') === 'fi';
      return route.fulfill({
        json: {
          name: 'Espoo',
          address: { city: 'Espoo', state: 'Uusimaa', country: finnish ? 'Suomi' : 'Finland' },
        },
      });
    }

    problems.push(`Unexpected external request: ${url.href}`);
    return route.abort();
  });
}

/**
 * Turns a map layer on or off: the layers button (by My location) opens
 * its menu, the item toggles that layer (and the menu closes).
 */
export async function chooseLayer(page: Page, name: 'Rain radar' | 'Weather symbols') {
  const menu = page.locator('#layers-menu');
  if (await menu.isHidden()) await page.getByRole('button', { name: 'Map layers' }).click();
  await menu.getByRole('button', { name }).click();
}

/** Presses one of the place's actions in the weather panel's ⋯ menu. */
export async function placeAction(
  page: Page,
  name:
    | 'Share this place'
    | 'Share as a picture'
    | 'Weather excuse'
    | 'Small talk'
    | 'Weather haiku'
    | 'Launch a balloon'
    | 'Drift here'
    | 'Weather on a day…'
    | 'Start here',
) {
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.locator('#panel-menu').getByRole('button', { name }).click();
  // The menu closes by itself once the action is chosen.
  await expect(page.locator('#panel-menu')).toBeHidden();
}

/** Opens Settings (⚙ next to the search box) and returns the dialog. */
export async function openSettings(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings).toBeVisible();
  return settings;
}

/** Chooses °C or °F in Settings, then closes it again. */
export async function chooseUnit(page: Page, unit: '°C' | '°F') {
  const settings = await openSettings(page);
  await settings.getByRole('button', { name: unit }).click();
  await settings.getByRole('button', { name: 'Close' }).click();
  await expect(settings).toBeHidden();
}

/** Opens the app and waits until the map tiles are drawn. */
export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await waitForTiles(page);
}

export async function waitForTiles(page: Page) {
  await page.waitForFunction(
    () => document.querySelectorAll('.leaflet-tile:not(.leaflet-tile-loaded)').length === 0,
  );
}

/**
 * Names of sample points near the screen's edges (and its centre) that no
 * loaded map tile covers. Grey bars or a shrunken map show up here. Tile
 * images ignore pointer events, so this checks geometry, not hit-testing.
 */
export async function uncoveredScreenPoints(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const points: [string, number, number][] = [
      ['top-left', 2, 2],
      ['top-right', w - 2, 2],
      ['bottom-left', 2, h - 2],
      ['bottom-right', w - 2, h - 2],
      ['top-centre', w / 2, 2],
      ['bottom-centre', w / 2, h - 2],
      ['centre', w / 2, h / 2],
    ];
    const tiles = [...document.querySelectorAll('.leaflet-tile-loaded')].map((tile) =>
      tile.getBoundingClientRect(),
    );
    return points
      .filter(
        ([, x, y]) =>
          !tiles.some((t) => x >= t.left && x <= t.right && y >= t.top && y <= t.bottom),
      )
      .map(([name]) => name);
  });
}

export function isMobileLayout(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) <= MOBILE_MAX_WIDTH;
}

/**
 * Clicks (or taps, on touch devices) a point on the map, given as fractions
 * of the map's width and height, and waits for the forecast to show.
 */
export async function pickPoint(page: Page, xFraction = 0.5, yFraction = 0.35) {
  const size = page.viewportSize()!;
  const x = size.width * xFraction;
  const y = size.height * yFraction;
  const hasTouch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (hasTouch) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
  await expect(page.locator('.current__temp')).toBeVisible();
  // The map may pan to keep the marker clear of the panel.
  await waitForMapStill(page);
  await waitForTiles(page);
}

/**
 * Waits until `locator` has stopped moving: its box on screen is the same
 * for 5 animation frames in a row (a pan, fly or slide has ended). Faster
 * and steadier than waiting a fixed time.
 */
export async function waitUntilStill(locator: Locator) {
  await locator.evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        let last = '';
        let stillFrames = 0;
        const check = () => {
          const box = element.getBoundingClientRect();
          const now = `${box.x},${box.y},${box.width},${box.height}`;
          // Leaflet zooms by animating the tiles, not the map pane.
          const zooming = document.querySelector('.leaflet-zoom-anim') !== null;
          stillFrames = now === last && !zooming ? stillFrames + 1 : 0;
          last = now;
          if (stillFrames >= 5) resolve();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }),
  );
}

/** Waits until the map has stopped panning, flying and zooming. */
export async function waitForMapStill(page: Page) {
  await waitUntilStill(page.locator('.leaflet-map-pane'));
}

export interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** On-screen box of an element, or null if it isn't visible. */
export async function boxOf(name: string, locator: Locator): Promise<Box | null> {
  if (!(await locator.isVisible())) return null;
  const box = await locator.boundingBox();
  return box ? { name, ...box } : null;
}

/** Boxes of the visible elements among `selectors` (name → CSS selector). */
export async function visibleBoxes(page: Page, selectors: Record<string, string>): Promise<Box[]> {
  const boxes: Box[] = [];
  for (const [name, selector] of Object.entries(selectors)) {
    const box = await boxOf(name, page.locator(selector).first());
    if (box) boxes.push(box);
  }
  return boxes;
}

/** Overlapping area of two boxes in px² (touching edges don't count). */
export function overlapArea(a: Box, b: Box): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0.5 && height > 0.5 ? width * height : 0;
}

/** Every pair of boxes that overlaps, as readable strings for the report. */
export function overlappingPairs(boxes: Box[]): string[] {
  const pairs: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const area = overlapArea(boxes[i], boxes[j]);
      if (area > 0)
        pairs.push(`${boxes[i].name} overlaps ${boxes[j].name} (${Math.round(area)} px²)`);
    }
  }
  return pairs;
}

/** Boxes that stick out of the viewport, as readable strings. */
export function offScreen(page: Page, boxes: Box[]): string[] {
  const { width, height } = page.viewportSize()!;
  return boxes
    .filter(
      (b) =>
        b.x < -0.5 || b.y < -0.5 || b.x + b.width > width + 0.5 || b.y + b.height > height + 0.5,
    )
    .map((b) => `${b.name} is partly off screen`);
}

/** Attaches a screenshot to the HTML report (shown for every test run). */
// Pages taking a screenshot right now.
const screenshotting = new WeakSet<Page>();

const offline = new WeakSet<Page>();
const wentOffline = new WeakSet<Page>();
// Chromium's and WebKit's words for a request that failed offline.
const NETWORK_FAILURE =
  /Failed to load resource|ERR_INTERNET_DISCONNECTED|appears to be offline|Fetch API cannot load/;

/**
 * Cuts the page off from every service but the app's own server (which
 * the test can take away too, with `context.setOffline`). Returns a
 * function that brings the connection back.
 */
export async function goOffline(page: Page): Promise<() => Promise<void>> {
  offline.add(page);
  wentOffline.add(page);
  const fail = (route: Route) =>
    new URL(route.request().url()).hostname === 'localhost'
      ? route.fallback()
      : route.abort('internetdisconnected');
  // Added last, so it comes before the fake network's own routes.
  await page.route('**/*', fail);
  return async () => {
    await page.unroute('**/*', fail);
    offline.delete(page);
  };
}

export async function snapshot(page: Page, testInfo: TestInfo, name: string) {
  // In WebKit, Playwright adds a <style> to the page while it takes a
  // screenshot; our CSP (style-src 'self') blocks it and WebKit logs a
  // violation. That one message is ignored during the screenshot only; any
  // other time a CSP violation still fails the test.
  screenshotting.add(page);
  try {
    const body = await page.screenshot();
    // Let the violation's console message arrive before we stop ignoring it.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await testInfo.attach(name, { body, contentType: 'image/png' });
  } finally {
    screenshotting.delete(page);
  }
}
