// Elevation in More details: the forecast's own `elevation` (Open-Meteo,
// from the Copernicus DEM), no extra request. The fake Oslo forecast is at
// 23 m.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const elevation = (page: Page, label = 'Elevation') =>
  page
    .locator('.more-details .details__row')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

/** The forecast at another height (registered after the fake network, so it wins). */
async function heightIs(page: Page, metres: number | undefined) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
    const forecast: Record<string, unknown> = forecastFixture();
    if (metres === undefined) delete forecast.elevation;
    else forecast.elevation = metres;
    return route.fulfill({ json: forecast });
  });
}

async function openOslo(page: Page) {
  await page.goto(OSLO);
  await expect(page.locator('.current__temp')).toBeVisible();
}

test.describe('elevation', () => {
  test('in metres, after the coordinates', async ({ page }) => {
    await openOslo(page);
    await expect(elevation(page)).toHaveText('23 m');
    await expect(page.locator('.more-details dt').last()).toHaveText('Elevation');
  });

  test('a mountain: whole metres, thousands separated', async ({ page }) => {
    await heightIs(page, 2469.4);
    await openOslo(page);
    await expect(elevation(page)).toHaveText('2,469 m');
  });

  test('below sea level', async ({ page }) => {
    await heightIs(page, -430);
    await openOslo(page);
    await expect(elevation(page)).toHaveText('-430 m');
  });

  test('in feet with °F', async ({ page }) => {
    await openOslo(page);
    await chooseUnit(page, '°F');
    await expect(elevation(page)).toHaveText('75 ft');
  });

  test('no elevation in the answer: no row', async ({ page }) => {
    await heightIs(page, undefined);
    await openOslo(page);
    await expect(page.locator('.more-details dt', { hasText: 'Coordinates' })).toBeVisible();
    await expect(elevation(page)).toHaveCount(0);
  });

  test('in About', async ({ page }) => {
    await page.goto('/#about');
    await expect(page.getByRole('dialog', { name: 'About Weatherpin' })).toContainText(
      'Copernicus DEM',
    );
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('Korkeus merenpinnasta', async ({ page }) => {
      await heightIs(page, 2469.4);
      await openOslo(page);
      await expect(elevation(page, 'Korkeus merenpinnasta')).toHaveText(/^2\s?469 m$/);
    });
  });
});
