// "Beer outside" in More details (src/weather/beer.ts, shown by
// src/render/sky.ts): roughly how long a cold beer stays cold here now.
// Minutes worked out with beer.ts for Oslo at the fixed test time (14:05,
// the sun 7.6° up). The fake weather now: 4.6 °C, rain, 5.7 m/s.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const beer = (page: Page) =>
  page
    .locator('.more-details .details__row')
    .filter({ has: page.locator('dt', { hasText: /^Beer outside$/ }) })
    .locator('dd');

/** The weather now changed (registered after the fake network, so it wins). */
async function weatherNow(page: Page, now: Record<string, number>) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
    const forecast = forecastFixture();
    Object.assign(forecast.current, now);
    return route.fulfill({ json: forecast });
  });
}

async function openOslo(page: Page) {
  await page.goto(OSLO);
  await expect(page.locator('.current__temp')).toBeVisible();
}

test.describe('beer outside', () => {
  test('a cool, rainy day: stays cold; after Pressure, before Local time', async ({ page }) => {
    await openOslo(page);
    await expect(beer(page)).toHaveText('🍺 Stays cold out here');
    await expect(page.locator('.more-details dt')).toHaveText([
      'Humidity',
      'Pressure',
      'Atmospheric correction (EDM)',
      'Electric car range',
      'Beer outside',
      'Local time',
      'Weather warnings',
      'Coordinates',
    ]);
  });

  test('warm and sunny with a breeze: warm in about 25 min', async ({ page }) => {
    await weatherNow(page, { temperature_2m: 22, wind_speed_10m: 3, weather_code: 0 });
    await openOslo(page);
    await expect(beer(page)).toHaveText('🍺 Gets warm in about 25 min (sunny, breezy)');
  });

  test('warm, cloudy and calm: slower', async ({ page }) => {
    await weatherNow(page, { temperature_2m: 22, wind_speed_10m: 0, weather_code: 3 });
    await openOslo(page);
    await expect(beer(page)).toHaveText('🍺 Gets warm in about 40 min');
  });

  test('just warm enough: in hours', async ({ page }) => {
    await weatherNow(page, { temperature_2m: 14, wind_speed_10m: 0, weather_code: 3 });
    await openOslo(page);
    await expect(beer(page)).toHaveText('🍺 Gets warm in about 2 h');
  });

  test('freezing: starts to freeze', async ({ page }) => {
    await weatherNow(page, { temperature_2m: -10, wind_speed_10m: 0, weather_code: 3 });
    await openOslo(page);
    await expect(beer(page)).toHaveText('🍺 Starts to freeze in about 40 min');
  });

  test('the same in °F (no temperatures in the text)', async ({ page }) => {
    await weatherNow(page, { temperature_2m: 22, wind_speed_10m: 3, weather_code: 0 });
    await openOslo(page);
    await chooseUnit(page, '°F');
    await expect(beer(page)).toHaveText('🍺 Gets warm in about 25 min (sunny, breezy)');
    // Still only one row after the redraw.
    await expect(beer(page)).toHaveCount(1);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Olut ulkona"', async ({ page }) => {
      await weatherNow(page, { temperature_2m: 22, wind_speed_10m: 3, weather_code: 0 });
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(page.locator('.current__temp')).toBeVisible();
      const finnish = page
        .locator('.more-details .details__row')
        .filter({ has: page.locator('dt', { hasText: /^Olut ulkona$/ }) })
        .locator('dd');
      await expect(finnish).toHaveText('🍺 Lämpenee noin 25 min (aurinkoista, tuulista)');
    });
  });
});
