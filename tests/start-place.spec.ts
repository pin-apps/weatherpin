// The start place: "Start here" in the weather panel's ⋯ menu makes the app
// open at that place, with its weather showing. Each test starts with
// empty storage (a fresh browser context); a reload keeps it.

import {
  expect,
  openApp,
  overlapArea,
  pickPoint,
  placeAction,
  snapshot,
  test,
  visibleBoxes,
  waitForTiles,
} from './helpers';
import type { Page } from '@playwright/test';

/** "Start here" in the ⋯ menu (read while the menu is closed, too). */
const startButton = (page: Page) => page.locator('.panel__start');
const pressStart = (page: Page) => placeAction(page, 'Start here');
/** The small ⌂ next to the panel title. */
const startMark = (page: Page) => page.locator('.panel__start-mark');

async function showOslo(page: Page) {
  await page.locator('#search-input').fill('Oslo');
  const results = page.getByRole('listbox', { name: 'Places' });
  await expect(results).toBeVisible();
  await results.getByRole('option').first().click();
  await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
  await expect(page.locator('.current__temp')).toBeVisible();
}

// Opening the app again at its plain address. (A reload would keep the
// place's link in the address, which opens that place by itself.)
async function reload(page: Page) {
  await page.goto('/');
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await waitForTiles(page);
}

/** The saved start place, read straight from storage. */
function storedStartPlace(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem('nordic-weather:start-place') ?? 'null'),
  );
}

test.describe('start place', () => {
  test('without one, the app opens at the world map', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#panel')).toBeHidden();
    await expect(page.locator('.pick-marker')).toHaveCount(0);
  });

  test(
    'a searched place opens with its weather after a reload',
    { tag: '@layout' },
    async ({ page }, testInfo) => {
      await openApp(page);
      await showOslo(page);
      await expect(startButton(page)).toHaveAttribute('aria-pressed', 'false');
      await expect(startMark(page)).toBeHidden();
      await pressStart(page);
      await expect(startButton(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(startMark(page)).toBeVisible();

      await reload(page);
      await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
      await expect(page.locator('.current__temp')).toHaveText('5 °C');
      await expect(startButton(page)).toHaveAttribute('aria-pressed', 'true');
      await expect(startMark(page)).toBeVisible();
      await snapshot(page, testInfo, 'opened at start place');

      // The marker shows, clear of the panel (bottom sheet or side panel).
      const [marker, panel] = await visibleBoxes(page, {
        marker: '.pick-marker',
        panel: '#panel',
      });
      expect(marker?.name).toBe('marker');
      expect(overlapArea(marker!, panel!)).toBe(0);
    },
  );

  test('a clicked point is saved rounded to about 1 km', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const title = await page.locator('#panel-title').textContent();
    await pressStart(page);

    const { version, place } = await storedStartPlace(page);
    expect(version).toBe(1);
    expect(place.name).toBeUndefined();
    // At most two decimals.
    expect(place.lat).toBe(Math.round(place.lat * 100) / 100);
    expect(place.lng).toBe(Math.round(place.lng * 100) / 100);

    await reload(page);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(startButton(page)).toHaveAttribute('aria-pressed', 'true');
    // The same place, give or take the rounding: the title shows coordinates.
    await expect(page.locator('#panel-title')).toHaveText(/° [NS], .*° [EW]$/);
    expect(title).toMatch(/° [NS], .*° [EW]$/);
  });

  test('pressing it again removes the start place', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await pressStart(page);
    await expect(startButton(page)).toHaveAttribute('aria-pressed', 'true');
    await pressStart(page);
    await expect(startButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(startMark(page)).toBeHidden();

    await reload(page);
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('closing the panel keeps the start place', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await pressStart(page);
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    await expect(page.locator('#panel')).toBeHidden();

    await reload(page);
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
  });

  test('another place shows the button unpressed', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await pressStart(page);
    await pickPoint(page, 0.2, 0.3);
    await expect(startButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(startMark(page)).toBeHidden();
  });

  test.describe('when the browser blocks storage', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage is blocked', 'SecurityError');
          },
        });
      });
    });

    test('hides the button and opens at the world map', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('#panel')).toBeHidden();
      await showOslo(page);
      await expect(page.locator('.panel__start')).toBeHidden();
    });
  });

  test.describe('with a damaged saved value', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          'nordic-weather:start-place',
          JSON.stringify({ version: 1, place: { lat: 'north', lng: null } }),
        );
      });
    });

    test('ignores it and opens at the world map', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('#panel')).toBeHidden();
    });
  });
});
