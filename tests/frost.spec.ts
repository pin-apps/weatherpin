// Frost hints under "What to wear" (src/weather/frost.ts): the windscreen
// on clear, calm, freezing nights, and balcony plants on frosty nights in
// spring and autumn. The fake forecast's night hours are changed per test.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

interface Night {
  /** The forecast's "now", e.g. "2026-11-15T18:00". */
  now: string;
  temp: number;
  code?: number;
  wind?: number;
  latitude?: number;
}

/** The fake forecast with the hours from `now` to 09:00 the next day set. */
async function night(page: Page, { now, temp, code = 0, wind = 1, latitude }: Night) {
  // Registered after the fake network, so it takes over forecast requests.
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const forecast = forecastFixture();
    forecast.current.time = now;
    if (latitude !== undefined) forecast.latitude = latitude;
    const start = forecast.hourly.time.indexOf(now);
    for (let i = start; i < start + 16; i++) {
      forecast.hourly.temperature_2m[i] = temp;
      forecast.hourly.weather_code[i] = code;
      forecast.hourly.wind_speed_10m[i] = wind;
    }
    return route.fulfill({ json: forecast });
  });
}

const frost = (page: Page) => page.locator('.current__frost');

async function open(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__wear')).toBeVisible();
}

test.describe('frost hints', () => {
  test('none on a mild night', async ({ page }) => {
    await open(page);
    await expect(frost(page)).toHaveCount(0);
  });

  test('a clear, calm night near freezing: scrape the windscreen', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: 0 });
    await open(page);
    await expect(frost(page)).toHaveText(['🚗 Scrape the windscreen tomorrow morning']);
  });

  test('early in the morning: frost on the windscreens now', async ({ page }) => {
    await night(page, { now: '2026-11-15T06:00', temp: 0 });
    await open(page);
    await expect(frost(page)).toHaveText(['🚗 Frost on car windscreens this morning']);
  });

  test('cloudy at 0 °C: no frost on cars', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: 0, code: 3 });
    await open(page);
    await expect(frost(page)).toHaveCount(0);
  });

  test('windy at 0 °C: no frost on cars', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: 0, wind: 6 });
    await open(page);
    await expect(frost(page)).toHaveCount(0);
  });

  test('a hard frost under clouds still frosts the windscreen', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: -4, code: 3, wind: 6 });
    await open(page);
    await expect(frost(page)).toHaveText(['🚗 Scrape the windscreen tomorrow morning']);
  });

  test('not in the middle of the day', async ({ page }) => {
    // The fixture's own "now" is 14:00.
    await night(page, { now: '2026-11-15T14:00', temp: 0 });
    await open(page);
    await expect(frost(page)).toHaveCount(0);
  });

  test('plants: a frosty spring night in the south (November)', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: -2, code: 3, wind: 6, latitude: -43.5 });
    await open(page, '/#at=-43.53,172.64&name=Christchurch,+New+Zealand');
    // −2 °C under clouds and wind: plants at risk, no frost on cars.
    await expect(frost(page)).toHaveText(['🌱 Frost tonight (-2 °C): bring the balcony plants in']);
  });

  test('plants: not in a northern November (they are in already)', async ({ page }) => {
    await night(page, { now: '2026-11-15T18:00', temp: -2, code: 3, wind: 6 });
    await open(page);
    await expect(frost(page)).toHaveCount(0);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('the windscreen', async ({ page }) => {
      await night(page, { now: '2026-11-15T18:00', temp: 0 });
      await page.goto('/#at=60.17,24.94&name=Helsinki,+Suomi');
      await expect(frost(page)).toHaveText(['🚗 Huomenna aamulla tuulilasi pitää raaputtaa']);
    });
  });
});
