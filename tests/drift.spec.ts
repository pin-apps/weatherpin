// "🚗 Drift here" (src/drift/): the ⋯ menu opens the game for the place
// shown, the road from its weather (the test forecast: light rain, 4.6 °C,
// wind 5.7 m/s from SW), a 20 s run with the arrow keys or taps, the best
// score kept, sharing; no weather request of its own and no game code until
// it's opened. (The rules themselves: drift-physics.spec.ts.)

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, offScreen, placeAction, test, visibleBoxes } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo';
const card = (page: Page) => page.getByRole('dialog', { name: /Drift in Oslo/ });
const road = (page: Page) => page.locator('.drift__road');
const time = (page: Page) => page.locator('.drift__time');
const overlay = (page: Page) => page.locator('.drift__overlay');
const result = (page: Page) => page.locator('.drift__status');

async function openDrift(page: Page) {
  await page.goto(OSLO);
  await expect(page.locator('.current__temp')).toBeVisible();
  await placeAction(page, 'Drift here');
  await expect(card(page)).toBeVisible();
}

/** Requests to the site's own files and to Open-Meteo, counted. */
function watchRequests(page: Page) {
  const seen = { game: 0, weather: 0 };
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/^\/assets\/drift-[^/]+\.js$/.test(url.pathname)) seen.game++;
    if (url.hostname.endsWith('.open-meteo.com')) seen.weather++;
  });
  return seen;
}

test.describe('drift game', () => {
  test('opens from the ⋯ menu: the road from the weather, no requests of its own', async ({
    page,
  }) => {
    const seen = watchRequests(page);
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    // Give everything else time to load: still no game code.
    await page.waitForTimeout(500);
    expect(seen.game).toBe(0);
    const weatherBefore = seen.weather;

    await placeAction(page, 'Drift here');
    await expect(card(page)).toBeVisible();
    expect(seen.game).toBe(1);
    await expect(road(page)).toHaveText(/^Wet road, .?5 °C, grip 50 %$/);
    await expect(page.locator('.drift__wind')).toHaveText(/^Wind .+ from SW: it pushes the car\.$/);
    await expect(overlay(page)).toHaveText('Tap to start drifting');
    await expect(time(page)).toHaveText('20 s');
    await expect(page.locator('.drift__share')).toBeDisabled();
    // The track has the focus: the arrow keys play straight away.
    await expect(page.locator('.drift__canvas')).toBeFocused();

    // Playing a little asks nothing either.
    await page.keyboard.down('ArrowLeft');
    await expect(time(page)).not.toHaveText('20 s', { timeout: 3000 });
    await page.keyboard.up('ArrowLeft');
    expect(seen.weather).toBe(weatherBefore);
  });

  test('a full run with the arrow keys: score, best kept, share', async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          (window as unknown as { shared?: ShareData }).shared = data;
        },
      });
    });
    await openDrift(page);
    await page.keyboard.down('ArrowRight');
    await expect(overlay(page)).toBeHidden();
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await expect(result(page)).toContainText('Time!', { timeout: 30_000 });
    await page.keyboard.up('ArrowLeft');
    await expect(time(page)).toHaveText('0 s');
    await expect(result(page)).toHaveText(/^Time! [\d,]+ points on a wet road\./);
    await expect(overlay(page)).toHaveText('Tap to drift again');

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nordic-weather:drift') ?? 'null'),
    );
    expect(saved.version).toBe(1);
    const score = saved.best?.rain;
    if (score > 0) {
      await expect(page.locator('.drift__best')).toHaveText(/^Best on a wet road: [\d,]+$/);
    }

    await page.locator('.drift__share').click();
    const sharedData = () =>
      page.evaluate(() => (window as unknown as { shared?: ShareData }).shared);
    await expect.poll(sharedData).toBeTruthy();
    const shared = (await sharedData())!;
    expect(shared.text).toMatch(
      /^I drifted [\d,]+ pts on a wet road in Oslo, .?5 °C, on weatherpin\.app\nhttps:\/\/.+\/#at=59\.91,10\.75&name=Oslo$/,
    );
  });

  test('taps start and steer; closing stops the game; a hidden page pauses it', async ({
    page,
  }) => {
    await openDrift(page);
    const canvas = page.locator('.drift__canvas');
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await page.mouse.down();
    await expect(overlay(page)).toBeHidden();
    await expect(time(page)).not.toHaveText('20 s', { timeout: 3000 });
    await page.mouse.up();

    // Switching away pauses it.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(overlay(page)).toHaveText('Paused. Tap to go on.');
    const paused = await time(page).textContent();
    await page.waitForTimeout(1200);
    await expect(time(page)).toHaveText(paused!);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    });
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.5);
    await expect(overlay(page)).toBeHidden();

    // Closing stops it: the clock no longer runs.
    await card(page).getByRole('button', { name: 'Close' }).click();
    await expect(card(page)).toBeHidden();
    const closedAt = await time(page).textContent();
    await page.waitForTimeout(1200);
    expect(await time(page).textContent()).toBe(closedAt);
  });

  test('black ice below zero after rain', async ({ page }) => {
    const icy = forecastFixture();
    icy.current.temperature_2m = -6;
    icy.current.weather_code = 3;
    icy.current.precipitation = 0;
    icy.current.wind_speed_10m = 1;
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.get('hourly')?.startsWith('temperature_2m,weather_code,')) {
        return route.fallback();
      }
      return route.fulfill({ json: icy });
    });
    await openDrift(page);
    await expect(road(page)).toHaveText(/^Black ice, .6 °C, grip 16 %$/);
    await expect(page.locator('.drift__wind')).toHaveCount(0);
  });

  test('the card fits the screen', { tag: '@layout' }, async ({ page }) => {
    await openDrift(page);
    const boxes = await visibleBoxes(page, {
      'drift card': '#drift',
      track: '.drift__canvas',
      'close button': '.drift__close',
      'share button': '.drift__share',
    });
    expect(boxes.map((b) => b.name)).toEqual([
      'drift card',
      'track',
      'close button',
      'share button',
    ]);
    expect(offScreen(page, boxes)).toEqual([]);
    const track = boxes.find((b) => b.name === 'track')!;
    expect(track.height / track.width).toBeCloseTo(420 / 380, 1);
    expect(track.width).toBeGreaterThanOrEqual(160);
  });

  test('accessibility of the card', async ({ page }) => {
    await openDrift(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('#drift')
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('the card in Finnish', async ({ page }) => {
      await page.goto(OSLO);
      await expect(page.locator('.current__temp')).toBeVisible();
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Driftaa täällä' }).click();
      await expect(page.locator('.drift__title-text')).toHaveText('Driftaa: Oslo');
      await expect(road(page)).toHaveText(/^Märkä tie, .?5 °C, pito 50 %$/);
      await expect(overlay(page)).toHaveText('Napauta ja aloita driftaus');
    });
  });
});
