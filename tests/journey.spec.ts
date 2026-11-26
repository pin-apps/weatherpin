// Weather levels (src/journey/): the chip next to ⚙, points for a day of
// use, places explored (new ~50 km areas, 5 a day; countries; continents)
// and weather badges, the level-up toast, "Your weather journey", never
// going down. Every fake forecast is in Europe/Oslo at 4.6 °C, 23 m up.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, openApp, test } from './helpers';

const chip = (page: Page) => page.locator('#level-button');
const card = (page: Page) => page.getByRole('dialog', { name: 'Your weather journey' });
const toast = (page: Page) => page.locator('.journey-toast');

const link = (lat: number) => `/#at=${lat},10.75&name=Somewhere`;

/** Waits for the chip's label (its texts load just after start-up). */
async function expectLevel(page: Page, label: string, emoji: string) {
  await expect(chip(page)).toHaveAttribute('aria-label', label);
  await expect(chip(page).locator('.level-chip__emoji')).toHaveText(emoji);
}

async function openCard(page: Page) {
  await chip(page).click();
  await expect(card(page)).toBeVisible();
}

/** A saved journey before the app starts (as from earlier visits). */
async function savedJourney(page: Page, journey: Record<string, unknown>) {
  await page.addInitScript((saved) => {
    if (localStorage.getItem('nordic-weather:journey') === null) {
      localStorage.setItem('nordic-weather:journey', JSON.stringify(saved));
    }
  }, journey);
}

test.describe('weather levels', () => {
  test('a first visit: Breeze, a point for the day', async ({ page }) => {
    await openApp(page);
    await expectLevel(page, 'Your level: Breeze, 1 of 30 points', '🌬️');
  });

  test('a place: a new area and a new continent', async ({ page }) => {
    await page.goto(link(59.91));
    await expect(page.locator('.current__temp')).toBeVisible();
    // 1 (today) + 2 (area) + 25 (Europe).
    await expectLevel(page, 'Your level: Breeze, 28 of 30 points', '🌬️');
  });

  test('a searched place adds its country: up to Cloud, with a toast', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    // 1 + 10 (Norway) + 2 + 25 = 38.
    await expectLevel(page, 'Your level: Cloud, 38 of 150 points', '☁️');
    await expect(toast(page)).toHaveText('New level: ☁️ Cloud!');
    await expect(toast(page)).toHaveAttribute('role', 'status');
  });

  test('only 5 new areas count in a day', async ({ page }) => {
    for (const lat of [59.91, 60.91, 61.91, 62.91, 63.91, 64.91]) {
      await page.goto(link(lat));
      await expect(page.locator('.current__temp')).toBeVisible();
    }
    // 1 + 25 + 5 × 2.
    await expectLevel(page, 'Your level: Cloud, 36 of 150 points', '☁️');
    await openCard(page);
    await expect(card(page)).toContainText('Explored: 5 areas · 0 countries · 1 continents');
  });

  test('a weather badge: −30° frost', async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
      const forecast = forecastFixture();
      forecast.current.temperature_2m = -31;
      return route.fulfill({ json: forecast });
    });
    await page.goto(link(59.91));
    await expect(page.locator('.current__temp')).toBeVisible();
    // 28 + 15.
    await expectLevel(page, 'Your level: Cloud, 43 of 150 points', '☁️');
    await openCard(page);
    const frost = card(page).locator('.journey__badge', { hasText: '−30° frost' });
    await expect(frost).toHaveClass(/is-earned/);
    await expect(card(page).locator('.journey__badge', { hasText: 'Thunderstorm' })).toContainText(
      'not yet',
    );
  });

  test('a share counts once a day', async ({ page }) => {
    await openApp(page);
    await expectLevel(page, 'Your level: Breeze, 1 of 30 points', '🌬️');
    await page.evaluate(() => window.dispatchEvent(new Event('weatherpin:shared')));
    await expectLevel(page, 'Your level: Breeze, 4 of 30 points', '🌬️');
    await page.evaluate(() => window.dispatchEvent(new Event('weatherpin:shared')));
    await page.waitForTimeout(500);
    await expectLevel(page, 'Your level: Breeze, 4 of 30 points', '🌬️');
  });

  test('the card: level, progress, streak, badges', async ({ page }) => {
    await savedJourney(page, {
      version: 1,
      points: 412,
      badges: ['thunder'],
      day: '2026-11-14',
      streak: 3,
      areas: [],
      areasToday: 0,
      countries: ['FI', 'SE'],
      continents: ['europe'],
    });
    await openApp(page);
    await expectLevel(page, 'Your level: Storm, 413 of 600 points', '⛈️');
    await openCard(page);
    await expect(card(page).locator('.journey__level')).toHaveText('⛈️ Storm');
    await expect(card(page)).toContainText('413 points');
    await expect(card(page)).toContainText('Next: 🌌 Aurora at 600 points');
    await expect(card(page).locator('progress')).toHaveAttribute('value', '263');
    // Yesterday and today: 4 days in a row.
    await expect(card(page)).toContainText('🔥 4 days in a row');
    await expect(card(page)).toContainText('0 areas · 2 countries · 1 continents');
    await expect(card(page).locator('.journey__badge.is-earned')).toHaveText(['⛈️ Thunderstorm']);
    await card(page).getByRole('button', { name: 'Close' }).click();
    await expect(card(page)).toBeHidden();
  });

  test('never goes down: back after a long while, the level was resting', async ({ page }) => {
    await savedJourney(page, {
      version: 1,
      points: 650,
      badges: [],
      day: '2026-09-01',
      streak: 12,
      areas: [],
      areasToday: 0,
      countries: [],
      continents: [],
    });
    await openApp(page);
    await expectLevel(page, 'Your level: Aurora, 651 of 2000 points', '🌌');
    await expect(toast(page)).toHaveText('Welcome back! Your level was resting 💤');
    await openCard(page);
    await expect(card(page)).toContainText('🔥 1 day in a row');
  });

  test('the top level needs 5 weather badges too', async ({ page }) => {
    await savedJourney(page, {
      version: 1,
      points: 2500,
      badges: ['frost', 'heat'],
      day: '2026-11-15',
      streak: 1,
      areas: [],
      areasToday: 0,
      countries: [],
      continents: [],
    });
    await openApp(page);
    await expectLevel(page, 'Your level: Aurora, 2500 points', '🌌');
    await openCard(page);
    await expect(card(page)).toContainText(
      'Next: 💎 Diamond dust at 2000 points and 5 weather badges (2/5)',
    );
  });

  test('a big enough button next to Settings', { tag: '@layout' }, async ({ page }) => {
    await openApp(page);
    const box = (await chip(page).boundingBox())!;
    const settings = (await page.locator('#settings-button').boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(settings.x);
    // The search box stays usable on the narrowest phones.
    expect((await page.locator('.search__input').boundingBox())!.width).toBeGreaterThanOrEqual(180);
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

    test('the chip still shows, the weather still works', async ({ page }) => {
      await page.goto(link(59.91));
      await expect(page.locator('.current__temp')).toBeVisible();
      await expectLevel(page, 'Your level: Breeze, 0 of 30 points', '🌬️');
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('Tuulahdus', async ({ page }) => {
      await openApp(page);
      await expectLevel(page, 'Tasosi: Tuulahdus, 1/30 pistettä', '🌬️');
      await chip(page).click();
      await expect(page.getByRole('dialog', { name: 'Sääseikkailusi' })).toContainText('Säämerkit');
    });
  });
});
