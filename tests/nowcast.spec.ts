// "Rain starting/stopping around 14:45", from the forecast's 15-minute
// steps. The fixture's "now" is 14:00 in Oslo, raining, dry from 14:45.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, openApp, pickPoint, test } from './helpers';

/** The forecast fixture with these 15-minute amounts from 14:00. */
async function withSteps(page: Page, precipitation: number[], snowfall: number[] = []) {
  const forecast = forecastFixture();
  forecast.minutely_15.precipitation = precipitation;
  forecast.minutely_15.snowfall = forecast.minutely_15.time.map((_, i) => snowfall[i] ?? 0);
  // Registered after the shared fake network, so it answers first.
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) =>
    route.fulfill({ json: forecast }),
  );
}

const line = (page: Page) => page.locator('.current__nowcast');
const dry = Array.from({ length: 16 }, () => 0);

test.describe('rain in the next hours', () => {
  test('says when the rain stops', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(line(page)).toHaveText('Rain stopping around 14:45');
  });

  test('says when rain starts', async ({ page }) => {
    await withSteps(page, [0, 0, 0.05, 0, 0.4, 0.6, ...dry].slice(0, 16));
    await openApp(page);
    await pickPoint(page);
    // 0.05 mm in 15 minutes is a few drops, not "rain starting".
    await expect(line(page)).toHaveText('Rain starting around 15:00');
  });

  test('says snow when it snows', async ({ page }) => {
    await withSteps(page, [0, 0.3, 0.3, ...dry].slice(0, 16), [0, 0.4, 0.4]);
    await openApp(page);
    await pickPoint(page);
    await expect(line(page)).toHaveText('Snow starting around 14:15');
  });

  test('says nothing when it stays dry', async ({ page }) => {
    await withSteps(page, dry);
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(line(page)).toHaveCount(0);
  });

  test('looks only 3 hours ahead', async ({ page }) => {
    // Rain at 17:00, the 13th step: beyond the window.
    await withSteps(page, [...dry.slice(0, 12), 0.5, 0.5, 0.5, 0.5]);
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(line(page)).toHaveCount(0);
  });
});
