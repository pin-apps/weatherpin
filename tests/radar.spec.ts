// Rain radar layer: the button next to "My location", the radar source by
// map view (Environment Canada over North America, RainViewer elsewhere),
// the credit with the radar time, pausing in the background, and errors.

import type { Page } from '@playwright/test';
import {
  chooseLayer,
  expect,
  openApp,
  pickPoint,
  snapshot,
  test,
  waitForMapStill,
  waitForTiles,
} from './helpers';

// The menu item (hidden while the layers menu is closed).
const radarButton = (page: Page) => page.locator('#radar-button');
const radarTiles = (page: Page) => page.locator('.radar-tiles img');

test.describe('rain radar', () => {
  test('is off at first, without any radar requests', async ({ page }) => {
    const radarRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('rainviewer')) radarRequests.push(request.url());
    });
    await openApp(page);
    await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(radarTiles(page)).toHaveCount(0);
    expect(radarRequests).toEqual([]);
  });

  test('shows the newest frame, credits RainViewer, and is remembered', async ({
    page,
  }, testInfo) => {
    await openApp(page);
    await chooseLayer(page, 'Rain radar');
    await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'true');

    // Tiles of the newest frame (13:00 UTC), in the one free colour scheme.
    await expect(radarTiles(page).first()).toBeVisible();
    const src = await radarTiles(page).first().getAttribute('src');
    expect(src).toMatch(
      /^https:\/\/tilecache\.rainviewer\.com\/v2\/radar\/test1794747600\/256\/\d+\/\d+\/\d+\/2\/1_1\.png$/,
    );
    // 13:00 UTC is 14:00 in the tests' time zone (Oslo).
    await expect(page.locator('.leaflet-control-attribution')).toContainText(
      'Radar: RainViewer, 14:00',
    );
    await waitForTiles(page);
    await snapshot(page, testInfo, 'rain radar');

    await page.goto('/');
    await waitForTiles(page);
    await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(radarTiles(page).first()).toBeVisible();

    await chooseLayer(page, 'Rain radar');
    await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(radarTiles(page)).toHaveCount(0);
    await expect(page.locator('.leaflet-control-attribution')).not.toContainText('RainViewer');
  });

  test('never asks RainViewer for zoom levels above 7', async ({ page }) => {
    const zooms = new Set<number>();
    page.on('request', (request) => {
      const match = request.url().match(/tilecache\.rainviewer\.com\/.*\/256\/(\d+)\//);
      if (match) zooms.add(Number(match[1]));
    });
    await openApp(page);
    await chooseLayer(page, 'Rain radar');
    await expect(radarTiles(page).first()).toBeVisible();
    // Opening a place zooms the map in to street level.
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('.current__temp')).toBeVisible();
    await waitForMapStill(page);
    await waitForTiles(page);
    expect(zooms.size).toBeGreaterThan(0);
    expect(Math.max(...zooms)).toBeLessThanOrEqual(7);
  });

  test('the map can still be clicked through the radar', async ({ page }) => {
    await openApp(page);
    await chooseLayer(page, 'Rain radar');
    await expect(radarTiles(page).first()).toBeVisible();
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test.describe('when RainViewer fails', () => {
    test.use({ radarMode: 'server-error' });

    test('says so and switches back off', async ({ page }, testInfo) => {
      await openApp(page);
      await chooseLayer(page, 'Rain radar');
      await expect(page.locator('#locate-message')).toHaveText(
        'Rain radar is unavailable right now. Try again later.',
      );
      await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'false');
      await expect(radarTiles(page)).toHaveCount(0);
      await snapshot(page, testInfo, 'rain radar unavailable');
    });
  });

  test.describe('over North America', () => {
    /** Opens at `place` (as a start place) with the radar already on. */
    const openAt = (page: Page, place: { lat: number; lng: number; name: string }) =>
      page.addInitScript((start) => {
        localStorage.setItem(
          'nordic-weather:start-place',
          JSON.stringify({ version: 1, place: start }),
        );
        localStorage.setItem('nordic-weather:rain-radar', JSON.stringify({ version: 1, on: true }));
      }, place);

    /** The WMS layer and time the first radar tile asks for. */
    const tileRequest = async (page: Page) => {
      const src = new URL((await radarTiles(page).first().getAttribute('src'))!);
      const params = Object.fromEntries(
        [...src.searchParams].map(([key, value]) => [key.toLowerCase(), value]),
      );
      return { layers: params.layers, time: params.time };
    };

    const TORONTO = { lat: 43.65, lng: -79.38, name: 'Toronto' };

    test('rain radar in summer (Toronto, July)', async ({ page }) => {
      await page.clock.setSystemTime(new Date('2026-07-15T13:05:00Z'));
      await openAt(page, TORONTO);
      await openApp(page);
      await expect(radarTiles(page).first()).toBeVisible();
      expect((await tileRequest(page)).layers).toBe('RADAR_1KM_RRAI');
    });

    test('rain radar in winter where it mostly rains (Houston)', async ({ page }) => {
      await openAt(page, { lat: 29.76, lng: -95.37, name: 'Houston' });
      await openApp(page);
      await expect(radarTiles(page).first()).toBeVisible();
      expect(await tileRequest(page)).toEqual({
        layers: 'RADAR_1KM_RRAI',
        time: '2026-11-15T13:00:00Z',
      });
      await expect(page.locator('.leaflet-control-attribution')).toContainText(
        'Radar: Environment and Climate Change Canada, 14:00',
      );
    });
  });

  test.describe('over North America in winter', () => {
    test.beforeEach(async ({ page }) => {
      // Open at Toronto (as a start place) with the radar already on. The
      // test clock says November: snow radar.
      await page.addInitScript(() => {
        localStorage.setItem(
          'nordic-weather:start-place',
          JSON.stringify({ version: 1, place: { lat: 43.65, lng: -79.38, name: 'Toronto' } }),
        );
        localStorage.setItem('nordic-weather:rain-radar', JSON.stringify({ version: 1, on: true }));
      });
    });

    test('uses Environment Canada snow radar', async ({ page }, testInfo) => {
      await openApp(page);
      await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(radarTiles(page).first()).toBeVisible();
      const src = new URL((await radarTiles(page).first().getAttribute('src'))!);
      expect(src.origin + src.pathname).toBe('https://geo.weather.gc.ca/geomet');
      const params = Object.fromEntries(
        [...src.searchParams].map(([key, value]) => [key.toLowerCase(), value]),
      );
      expect(params).toMatchObject({
        request: 'GetMap',
        layers: 'RADAR_1KM_RSNO',
        // The newest time the service listed, never a guessed one.
        time: '2026-11-15T12:54:00Z',
        crs: 'EPSG:3857',
        transparent: 'true',
      });
      await expect(page.locator('.leaflet-control-attribution')).toContainText(
        'Snow radar: Environment and Climate Change Canada, 13:54',
      );
      await waitForTiles(page);
      await snapshot(page, testInfo, 'snow radar over Toronto');
    });

    test('switches to RainViewer when the map moves away', async ({ page }) => {
      // The flight across the Atlantic takes ~5 s. One device flies, to test
      // the switch after a real flight; the rest jump straight there.
      if (test.info().project.name !== 'desktop')
        await page.emulateMedia({ reducedMotion: 'reduce' });
      await openApp(page);
      await expect(page.locator('.leaflet-control-attribution')).toContainText(
        'Environment and Climate Change Canada',
      );
      await page.locator('#search-input').fill('Oslo');
      await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
      // The map flies across the Atlantic (~5 s); the source switches when
      // it lands.
      await expect(page.locator('.leaflet-control-attribution')).toContainText(
        'Radar: RainViewer, 14:00',
        { timeout: 15_000 },
      );
      await expect(page.locator('.leaflet-control-attribution')).not.toContainText(
        'Environment and Climate Change Canada',
      );
      await expect(page.locator('.radar-tiles img').first()).toHaveAttribute(
        'src',
        /tilecache\.rainviewer\.com/,
      );
    });

    test.describe('when Environment Canada fails', () => {
      test.use({ radarMode: 'eccc-error' });

      test('falls back to RainViewer', async ({ page }) => {
        await openApp(page);
        await expect(page.locator('.leaflet-control-attribution')).toContainText(
          'Radar: RainViewer, 14:00',
        );
        await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#locate-message')).toBeHidden();
      });
    });
  });

  test('waits while the page is hidden, then loads when it is shown', async ({ page }) => {
    const frameRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('weather-maps.json')) frameRequests.push(request.url());
    });
    await openApp(page);
    // Like a background tab: hidden, and the browser says so.
    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => (value ? 'hidden' : 'visible'),
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);

    await setHidden(true);
    await chooseLayer(page, 'Rain radar');
    await expect(radarButton(page)).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(500);
    expect(frameRequests).toEqual([]);

    await setHidden(false);
    await expect(radarTiles(page).first()).toBeVisible();
    expect(frameRequests).toHaveLength(1);
  });
});
