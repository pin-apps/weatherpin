// The Sky section (src/render/sky.ts): sunrise and sunset, the way to
// midwinter, golden and blue hour, stargazing, the northern lights now, the
// moon and your shadow. Values worked out with src/weather/solar.ts for the
// fixed test time: Sunday 15 Nov 2026, 13:05 UTC (14:05 in Oslo). The fake
// forecast is cloudy except 22:00–02:00 tonight; the fake aurora grid is
// in tests/fixtures/aurora.ts.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, snapshot, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';
const HELSINKI = '/#at=60.17,24.94&name=Helsinki,+Finland';

const sky = (page: Page) => page.locator('.sky');
const row = (page: Page, label: string) =>
  sky(page)
    .locator('.details__row')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

/** Counts the requests to NOAA's aurora nowcast from now on. */
function auroraRequests(page: Page): { count: number } {
  const seen = { count: 0 };
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'services.swpc.noaa.gov') seen.count++;
  });
  return seen;
}

/**
 * The fake forecast with changes: e.g. the weather "now" in the evening,
 * or no clear hours. Registered after the fake network, so it takes over.
 */
async function forecastWith(
  page: Page,
  change: (forecast: ReturnType<typeof forecastFixture>) => void,
) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
    const forecast = forecastFixture();
    change(forecast);
    return route.fulfill({ json: forecast });
  });
}

/** 22:05 in Oslo (dark): the clock and the forecast's "now". */
async function evening(page: Page) {
  await page.clock.setSystemTime(new Date('2026-11-15T21:05:00Z'));
  await forecastWith(page, (forecast) => {
    forecast.current.time = '2026-11-15T22:00';
    forecast.current.is_day = 0;
  });
}

async function openPlace(page: Page, link: string) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  await expect(row(page, 'Moon')).toBeVisible();
}

test.describe('sky', () => {
  test('in the afternoon in Oslo: sun, midwinter, golden and blue hour, stars, moon, shadow', async ({
    page,
  }, testInfo) => {
    const requests = auroraRequests(page);
    await openPlace(page, OSLO);
    // Between Air quality and More details.
    await expect(page.locator('.panel__body > section.sky + section.more-details')).toHaveCount(1);
    await expect(sky(page).locator('dt')).toHaveText([
      'Sunrise',
      'Sunset',
      'Daylight',
      'Until midwinter',
      'Golden hour',
      'Blue hour',
      'Stargazing',
      'Moon',
      'Your shadow',
    ]);
    await expect(row(page, 'Until midwinter')).toHaveText('1 h 40 min less daylight by 21 Dec');
    // The morning ones are over: only this afternoon's.
    await expect(row(page, 'Golden hour')).toHaveText('14:30–16:20');
    await expect(row(page, 'Blue hour')).toHaveText('16:20–16:38');
    await expect(row(page, 'Stargazing')).toHaveText('Good 22:00–02:00: clear sky, some moonlight');
    await expect(row(page, 'Your shadow')).toHaveText('7× your height');
    // No longer in More details.
    await expect(page.locator('.more-details dt', { hasText: 'Sunrise' })).toHaveCount(0);
    await expect(page.locator('.more-details dt', { hasText: 'Moon' })).toHaveCount(0);

    // Daylight now: no northern lights, and NOAA not asked.
    await expect(row(page, 'Northern lights')).toHaveCount(0);
    expect(requests.count).toBe(0);

    await sky(page).scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'sky');
  });

  test('no stargazing when the night is cloudy', async ({ page }) => {
    await forecastWith(page, (forecast) => {
      forecast.hourly.cloud_cover = forecast.hourly.time.map(() => 90);
    });
    await openPlace(page, OSLO);
    await expect(row(page, 'Stargazing')).toHaveCount(0);
  });

  test('south of the equator, midwinter is in June', async ({ page }) => {
    await openPlace(page, '/#at=-33.87,151.21&name=Sydney,+Australia');
    await expect(row(page, 'Since midwinter')).toHaveText('+3 h 59 min of daylight since 21 Jun');
    // Night in Sydney at this time: no shadow.
    await expect(row(page, 'Your shadow')).toHaveCount(0);
  });

  test.describe('polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('no midwinter countdown, no golden hour, no shadow', async ({ page }) => {
      await openPlace(page, '/#at=78.22,15.65&name=Longyearbyen,+Svalbard');
      await expect(sky(page)).toContainText('Polar night');
      for (const label of ['Until midwinter', 'Since midwinter', 'Golden hour', 'Your shadow']) {
        await expect(row(page, label)).toHaveCount(0);
      }
    });
  });

  test.describe('northern lights', () => {
    test('dark and clear in Helsinki: the chance now, from NOAA', async ({ page }) => {
      await evening(page);
      await openPlace(page, HELSINKI);
      await expect(row(page, 'Northern lights')).toHaveText('Chance 35 % now · NOAA');
      // Between stargazing and the moon.
      await expect(
        sky(page)
          .locator('dt')
          .filter({ hasText: /Stargazing|Northern|Moon/ }),
      ).toHaveText(['Stargazing', 'Northern lights', 'Moon']);
      await expect(row(page, 'Your shadow')).toHaveCount(0);
    });

    test('more likely just to the north: "low in the north"', async ({ page }) => {
      await evening(page);
      await openPlace(page, OSLO);
      await expect(row(page, 'Northern lights')).toHaveText(
        'Chance 40 % now · low in the north · NOAA',
      );
    });

    test('nothing when the chance is low', async ({ page }) => {
      await evening(page);
      const requests = auroraRequests(page);
      await openPlace(page, '/#at=59.33,18.07&name=Stockholm,+Sweden');
      await expect.poll(() => requests.count).toBe(1);
      await expect(row(page, 'Northern lights')).toHaveCount(0);
    });

    test('nothing, and NOAA not asked, when cloudy or far south', async ({ page }) => {
      await page.clock.setSystemTime(new Date('2026-11-15T21:05:00Z'));
      await forecastWith(page, (forecast) => {
        forecast.current.time = '2026-11-15T22:00';
        forecast.hourly.cloud_cover = forecast.hourly.time.map(() => 90);
      });
      const requests = auroraRequests(page);
      await openPlace(page, HELSINKI);
      await openPlace(page, '/#at=41.9,12.5&name=Rome,+Italy');
      // Proved by waiting a moment: no request comes.
      await page.waitForTimeout(500);
      expect(requests.count).toBe(0);
      await expect(row(page, 'Northern lights')).toHaveCount(0);
    });

    test('nothing when NOAA sends something unexpected', async ({ page }) => {
      await evening(page);
      await page.route('https://services.swpc.noaa.gov/**', (route) =>
        route.fulfill({ json: { error: true } }),
      );
      await openPlace(page, HELSINKI);
      await page.waitForTimeout(500);
      await expect(row(page, 'Northern lights')).toHaveCount(0);
    });

    test('"Southern lights" in the south', async ({ page }) => {
      // 02:05 in Dunedin, New Zealand: dark.
      await forecastWith(page, (forecast) => {
        forecast.hourly.cloud_cover = forecast.hourly.time.map(() => 0);
      });
      await openPlace(page, '/#at=-45.87,170.5&name=Dunedin,+New+Zealand');
      await expect(row(page, 'Southern lights')).toHaveText('Chance 25 % now · NOAA');
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test('"Revontulet"', async ({ page }) => {
        await evening(page);
        await page.goto('/#at=60.17,24.94&name=Helsinki,+Suomi');
        await expect(page.locator('.current__temp')).toBeVisible();
        const finnish = page
          .locator('.sky .details__row')
          .filter({ has: page.locator('dt', { hasText: /^Revontulet$/ }) })
          .locator('dd');
        await expect(finnish).toHaveText('Todennäköisyys nyt 35 % · NOAA');
        await expect(page.locator('.sky .fold__title')).toHaveText('Taivas');
      });
    });
  });
});
