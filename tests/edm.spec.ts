// The atmospheric correction for surveying instruments (src/weather/edm.ts,
// shown in More details by src/render/current.ts): Leica's formula from the
// forecast's temperature, ground-level pressure and humidity, with the
// inputs and a clear "estimate" warning. The fake weather now in Oslo:
// 4.6 °C, 1001.2 hPa at ground level, 81 % → −4.19 ppm.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const edmRow = (page: Page, label = 'Atmospheric correction (EDM)') =>
  page
    .locator('.more-details .details__row')
    .filter({ has: page.locator('dt', { hasText: label }) });

/** The weather now changed (registered after the fake network, so it wins). */
async function weatherNow(page: Page, now: Record<string, number | null>) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    if (!new URL(route.request().url()).searchParams.has('hourly')) return route.fallback();
    const forecast = forecastFixture();
    Object.assign(forecast.current, now);
    return route.fulfill({ json: forecast });
  });
}

async function openOslo(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
}

test.describe('atmospheric correction (EDM)', () => {
  test('the value, its inputs and the warning, right after Pressure', async ({ page }) => {
    const asked = page.waitForRequest(
      (request) =>
        request.url().startsWith('https://api.open-meteo.com/v1/forecast') &&
        new URL(request.url()).searchParams.has('hourly'),
    );
    await openOslo(page);
    // Ground-level pressure is asked for (not only the sea-level one).
    expect(new URL((await asked).url()).searchParams.get('current')).toContain('surface_pressure');

    const row = edmRow(page);
    await expect(row.locator('.edm__value')).toHaveText('-4 ppm');
    await expect(row.locator('.edm__inputs')).toHaveText(
      'Inputs: 4.6 °C · 1001.2 hPa at ground level · 81 %',
    );
    const note = row.locator('.estimate-note');
    await expect(note).toBeVisible();
    await expect(note.locator('strong')).toHaveText('Estimate only, not a measurement.');
    await expect(note).toContainText('measure temperature and pressure on site');

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

  test(
    'the value stays beside its label; inputs and warning below',
    { tag: '@layout' },
    async ({ page }) => {
      await openOslo(page);
      const row = edmRow(page);
      await row.scrollIntoViewIfNeeded();
      const label = (await row.locator('dt').boundingBox())!;
      const value = (await row.locator('.edm__value').boundingBox())!;
      const inputs = (await row.locator('.edm__inputs').boundingBox())!;
      const note = (await row.locator('.estimate-note').boundingBox())!;
      // Same line: the value starts no lower than the label's first line.
      expect(Math.abs(value.y - label.y)).toBeLessThanOrEqual(4);
      expect(value.x).toBeGreaterThan(label.x);
      // Then the inputs, then the warning, each under the label and value.
      expect(inputs.y).toBeGreaterThanOrEqual(
        Math.max(label.y + label.height, value.y + value.height) - 1,
      );
      expect(note.y).toBeGreaterThanOrEqual(inputs.y + inputs.height - 1);
      expect(Math.abs(inputs.x - label.x)).toBeLessThanOrEqual(1);
    },
  );

  test("Leica's standard atmosphere is 0 ppm", async ({ page }) => {
    await weatherNow(page, {
      temperature_2m: 12,
      surface_pressure: 1013.25,
      relative_humidity_2m: 60,
    });
    await openOslo(page);
    await expect(edmRow(page).locator('.edm__value')).toHaveText('0 ppm');
  });

  test('a hot day: a positive correction', async ({ page }) => {
    await weatherNow(page, {
      temperature_2m: 25,
      surface_pressure: 1013.25,
      relative_humidity_2m: 60,
    });
    await openOslo(page);
    await expect(edmRow(page).locator('.edm__value')).toHaveText('+13 ppm');
  });

  test('in °F: the inputs in °F and inHg, the same ppm', async ({ page }) => {
    await openOslo(page);
    await chooseUnit(page, '°F');
    const row = edmRow(page);
    await expect(row.locator('.edm__value')).toHaveText('-4 ppm');
    await expect(row.locator('.edm__inputs')).toHaveText(
      'Inputs: 40.3 °F · 29.57 inHg at ground level · 81 %',
    );
    await expect(row).toHaveCount(1);
  });

  test('no ground-level pressure (an older saved forecast): no row', async ({ page }) => {
    await weatherNow(page, { surface_pressure: null });
    await openOslo(page);
    await expect(page.locator('.more-details dt', { hasText: 'Pressure' })).toHaveCount(1);
    await expect(edmRow(page)).toHaveCount(0);
  });

  test('About says how it is worked out and that it is an estimate', async ({ page }) => {
    await page.goto('/#about');
    const about = page.locator('#about');
    await expect(about).toContainText('formula Leica Geosystems publishes');
    await expect(about).toContainText('0 ppm = 1013.25 hPa, 12 °C, 60 % humidity');
    await expect(about).toContainText(
      'The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates',
    );
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Ilmakehäkorjaus (EDM)"', async ({ page }) => {
      await openOslo(page, '/#at=59.91,10.75&name=Oslo,+Norja');
      const row = edmRow(page, 'Ilmakehäkorjaus (EDM)');
      await expect(row.locator('.edm__value')).toHaveText('-4 ppm');
      await expect(row.locator('.edm__inputs')).toHaveText(
        'Lähtöarvot: 4,6 °C · 1001,2 hPa maanpinnalla · 81 %',
      );
      await expect(row.locator('.estimate-note strong')).toHaveText('Vain arvio, ei mittaus.');
    });
  });
});
