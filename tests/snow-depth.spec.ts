// Snow on the ground, at a glance: Open-Meteo's `snow_depth` (a model
// value in metres), shown from 1 cm as "about 23 cm". The fake forecast
// has none, so each test sets its own.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const snow = (page: Page, label = 'Snow on the ground') =>
  page
    .locator('.current .details__row')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

/** The forecast with this much snow on the ground (wins over the fake network). */
async function snowDepth(page: Page, metres: number) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
    const forecast = forecastFixture();
    forecast.current.snow_depth = metres;
    return route.fulfill({ json: forecast });
  });
}

async function openOslo(page: Page) {
  await page.goto(OSLO);
  await expect(page.locator('.current__temp')).toBeVisible();
}

test.describe('snow on the ground', () => {
  test('in cm, after precipitation', async ({ page }) => {
    await snowDepth(page, 0.234);
    await openOslo(page);
    await expect(snow(page)).toHaveText('about 23 cm');
    await expect(page.locator('.current dt')).toHaveText([
      'Wind',
      'Precipitation',
      'Snow on the ground',
      'UV index',
      'Air quality',
    ]);
  });

  test('none under 1 cm', async ({ page }) => {
    await snowDepth(page, 0.004);
    await openOslo(page);
    await expect(page.locator('.current dt', { hasText: 'Wind' })).toBeVisible();
    await expect(snow(page)).toHaveCount(0);
  });

  test('in inches with °F', async ({ page }) => {
    await snowDepth(page, 0.234);
    await openOslo(page);
    await chooseUnit(page, '°F');
    await expect(snow(page)).toHaveText('about 9.2 in');
  });

  test('deep snow in whole inches', async ({ page }) => {
    await snowDepth(page, 0.8);
    await openOslo(page);
    await chooseUnit(page, '°F');
    await expect(snow(page)).toHaveText('about 31 in');
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('Lunta maassa', async ({ page }) => {
      await snowDepth(page, 0.234);
      await openOslo(page);
      await expect(snow(page, 'Lunta maassa')).toHaveText('noin 23 cm');
    });
  });
});
