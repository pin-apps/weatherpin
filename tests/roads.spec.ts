// Road conditions in Finland: Fintraffic's road weather on the nearest
// main road (roads/digitraffic.ts), as a line under What to wear when
// they're poor. Nothing elsewhere: the app makes no guesses of its own.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { roadForecastsFixture, type RoadsKind } from './fixtures/roads';
import { expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';
const HELSINKI = '/#at=60.17,24.94&name=Helsinki,+Finland';
// Far up in Lapland: no main road section within 30 km in the fixture.
const UTSJOKI = '/#at=69.91,27.03&name=Utsjoki,+Finland';

/** The fake forecast, in `timezone`. */
async function placeIn(page: Page, timezone: string) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) =>
    route.fulfill({ json: { ...forecastFixture(), timezone } }),
  );
}

async function roads(page: Page, kind: RoadsKind) {
  await page.route('https://tie.digitraffic.fi/**/forecasts', (route) =>
    route.fulfill({ json: roadForecastsFixture(kind) }),
  );
}

const line = (page: Page) => page.locator('.current__roads');

async function open(page: Page, link: string) {
  await page.goto(link);
  await expect(page.locator('.current__wear')).toBeVisible();
}

test.describe("Finland: Fintraffic's road conditions", () => {
  test('poor conditions on the nearest main road', async ({ page }) => {
    await placeIn(page, 'Europe/Helsinki');
    await roads(page, 'poor');
    await open(page, HELSINKI);
    await expect(line(page)).toHaveText(
      '🛣️ Poor road conditions: partly icy · Road weather: Fintraffic (Vt 1: Helsinki - Kehä III)',
    );
    // The credit opens Fintraffic's traffic map there, road conditions on.
    await expect(line(page).getByRole('link', { name: 'Fintraffic' })).toHaveAttribute(
      'href',
      'https://liikennetilanne.fintraffic.fi/kartta/?x=2776308&y=8437684&z=10&checkedLayers=4',
    );
  });

  test('very poor', async ({ page }) => {
    await placeIn(page, 'Europe/Helsinki');
    await roads(page, 'very-poor');
    await open(page, HELSINKI);
    await expect(line(page)).toContainText('Very poor road conditions: partly icy');
  });

  test('normal conditions: no line', async ({ page }) => {
    await placeIn(page, 'Europe/Helsinki');
    await roads(page, 'normal');
    await open(page, HELSINKI);
    await expect(page.locator('.warnings__coverage')).toBeVisible();
    await expect(line(page)).toHaveCount(0);
  });

  test('no main road near: no line', async ({ page }) => {
    await placeIn(page, 'Europe/Helsinki');
    await roads(page, 'poor');
    await open(page, UTSJOKI);
    await expect(page.locator('.warnings__coverage')).toBeVisible();
    await expect(line(page)).toHaveCount(0);
  });

  test('outside Finland: nothing asked, no line', async ({ page }) => {
    const asked: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('digitraffic')) asked.push(request.url());
    });
    await open(page, OSLO);
    await expect(page.locator('.warnings__coverage')).toBeVisible();
    await expect(line(page)).toHaveCount(0);
    expect(asked).toEqual([]);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('huono ajokeli', async ({ page }) => {
      await placeIn(page, 'Europe/Helsinki');
      await roads(page, 'poor');
      await open(page, '/#at=60.17,24.94&name=Helsinki,+Suomi');
      await expect(line(page)).toContainText('Huono ajokeli: osittain jäistä · Tiesää: Fintraffic');
    });
  });
});
