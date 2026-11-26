// The °C / °F switch and formats that follow the browser's language.
// The forecast fixture has 4.6 °C (feels like 1.2 °C), wind 5.7 m/s,
// 0.2 mm of rain and 1003.6 hPa, at 14:05 in Oslo.

import {
  chooseUnit,
  expect,
  openApp,
  openSettings,
  pickPoint,
  snapshot,
  test,
  waitForTiles,
} from './helpers';
import type { Locator, Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

/** The value next to a label in the current weather, e.g. "Wind". */
const detail = (page: Page, label: string) =>
  page
    .locator('.panel__body .details__row')
    .filter({ has: page.locator('dt', { hasText: label }) })
    .locator('dd');

test.describe('units', () => {
  test('°C by default; the switch changes every unit and is remembered', async ({
    page,
  }, testInfo) => {
    // The tests' browser language is en-GB: °C, wind in mph, 24-hour clock.
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toHaveText('5 °C');
    await expect(page.locator('.current__feels')).toHaveText('Feels like 1 °C');
    await expect(detail(page, 'Wind')).toContainText('13 mph from SW');
    await expect(detail(page, 'Precipitation')).toHaveText('0.2 mm');
    await expect(detail(page, 'Pressure')).toContainText('1004 hPa');

    // In Settings: °C pressed; °F switches the weather behind it at once.
    const settings = await openSettings(page);
    const celsius = settings.getByRole('button', { name: '°C' });
    const fahrenheit = settings.getByRole('button', { name: '°F' });
    await expect(celsius).toHaveAttribute('aria-pressed', 'true');
    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'false');
    await fahrenheit.click();
    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    await expect(celsius).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.current__temp')).toHaveText('40 °F');
    await page.keyboard.press('Escape');
    await expect(settings).toBeHidden();
    await expect(page.locator('.current__feels')).toHaveText('Feels like 34 °F');
    await expect(page.locator('.panel__summary')).toContainText('40 °F');
    await expect(detail(page, 'Wind')).toContainText('13 mph from SW');
    await expect(detail(page, 'Precipitation')).toHaveText('0.01 in');
    await expect(detail(page, 'Pressure')).toContainText('29.64 inHg ↓ falling');
    await expect(page.locator('.hourly__temp').first()).toHaveText(/°F$/);
    await expect(page.locator('.daily__max').first()).toHaveText(/°F$/);
    // Snow in inches too (2.1 cm).
    await expect(page.locator('.daily__snow').first()).toHaveText(/0\.8 in$/);
    // Air quality isn't converted; it was filled in before the switch.
    await expect(page.locator('.air-quality > .aqi .aqi__value')).toBeVisible();
    await snapshot(page, testInfo, 'fahrenheit');

    await page.goto('/');
    await waitForTiles(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toHaveText('40 °F');

    await chooseUnit(page, '°C');
    await expect(page.locator('.current__temp')).toHaveText('5 °C');
  });

  test.describe('US English browser', () => {
    test.use({ locale: 'en-US' });

    test('starts in °F with a 12-hour clock', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
      await expect(detail(page, 'Wind')).toContainText('13 mph');
      await expect(page.locator('.local-time__value')).toHaveText('Sun, Nov 15, 2:05 PM');
      // "Now", then 15:00 as "3 PM".
      await expect(page.locator('.hourly__time').nth(1)).toHaveText('3 PM');
      await expect(detail(page, 'Sunrise')).toHaveText(/^\d{1,2}:\d\d\sAM$/);
    });
  });

  test.describe('Canadian English browser', () => {
    test.use({ locale: 'en-CA' });

    test('starts in °C with km/h and a 12-hour clock', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('5 °C');
      await expect(detail(page, 'Wind')).toContainText('21 km/h');
      await expect(detail(page, 'Wind')).toContainText('gusts 40 km/h');
      await expect(page.locator('.local-time__value')).toHaveText('Sun, Nov 15, 2:05 p.m.');
    });
  });

  test.describe('Norwegian browser', () => {
    test.use({ locale: 'nb-NO' });

    test('shows wind in m/s and a 24-hour clock', async ({ page }) => {
      // The app is in Norwegian for this browser (tests/norwegian.spec.ts).
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('5 °C');
      await expect(detail(page, 'Vind')).toContainText('5,7 m/s');
      await expect(detail(page, 'Vind')).toContainText('vindkast 11,2 m/s');
      await expect(page.locator('.local-time__value')).toHaveText(
        // WebKit uses the system's date data, which can differ a little.
        /^Søn\.? 15\. nov\.?,? (kl\. )?14:05$/,
      );
      await expect(page.locator('.hourly__time').nth(1)).toHaveText('15:00');
    });
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

    test('the switch still works for this visit', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await chooseUnit(page, '°F');
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
      // A unit of one's own too.
      await chooseOwn(page, 'Wind', 'Knots');
      await expect(detail(page, 'Wind')).toContainText('11 kn from SW');
    });
  });

  test.describe('units of your own', () => {
    test('Automatic by default, with what it gives now', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      // Folded away while they're all Automatic.
      await expect(settings.locator('.settings__more')).not.toHaveAttribute('open', '');
      await openMoreUnits(settings);
      for (const name of ['Wind', 'Rain and snow', 'Pressure']) {
        await expect(
          settings.getByRole('group', { name }).getByRole('button', { name: 'Automatic' }),
        ).toHaveAttribute('aria-pressed', 'true');
      }
      // en-GB: mph, mm, hPa.
      await expect(settings.locator('.settings__units-hint')).toHaveText(
        'Automatic follows °C/°F and your region (now: mph, mm, hPa).',
      );
    });

    test('each changes the weather at once and is remembered', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await chooseOwn(page, 'Wind', 'Knots');
      await expect(detail(page, 'Wind')).toContainText('11 kn from SW');
      await expect(detail(page, 'Wind')).toContainText('gusts 22 kn');
      await expect(page.locator('.hourly__wind').first()).toContainText('kn');
      await chooseOwn(page, 'Wind', 'Beaufort');
      await expect(detail(page, 'Wind')).toContainText('4 Bft from SW');
      await expect(detail(page, 'Wind')).toContainText('gusts 6 Bft');
      await chooseOwn(page, 'Wind', 'km/h');
      await expect(detail(page, 'Wind')).toContainText('21 km/h from SW');
      await chooseOwn(page, 'Pressure', 'mmHg');
      await expect(detail(page, 'Pressure')).toContainText('753 mmHg');
      await chooseOwn(page, 'Rain and snow', 'in');
      await expect(detail(page, 'Precipitation')).toHaveText('0.01 in');
      await expect(page.locator('.current__temp')).toHaveText('5 °C');

      // Opening the app again keeps them.
      await page.goto('/');
      await pickPoint(page);
      await expect(detail(page, 'Wind')).toContainText('21 km/h from SW');
      await expect(detail(page, 'Pressure')).toContainText('753 mmHg');
      await expect(detail(page, 'Precipitation')).toHaveText('0.01 in');

      // Back to Automatic: mph again (en-GB).
      await chooseOwn(page, 'Wind', 'Automatic');
      await expect(detail(page, 'Wind')).toContainText('13 mph from SW');
    });

    test('°C/°F moves only the Automatic ones', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await chooseOwn(page, 'Wind', 'Knots');
      await chooseUnit(page, '°F');
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
      // Chosen: stays knots. Automatic: inches and inHg with °F.
      await expect(detail(page, 'Wind')).toContainText('11 kn from SW');
      await expect(detail(page, 'Precipitation')).toHaveText('0.01 in');
      await expect(detail(page, 'Pressure')).toContainText('29.64 inHg');
      const settings = await openSettings(page);
      await expect(settings.locator('.settings__units-hint')).toHaveText(
        'Automatic follows °C/°F and your region (now: mph, in, inHg).',
      );
    });

    test('a °F choice saved before unit choices existed still counts', async ({ page }) => {
      await page.addInitScript(() => {
        if (!localStorage.getItem('nordic-weather:units')) {
          localStorage.setItem(
            'nordic-weather:units',
            JSON.stringify({ version: 1, temperature: 'fahrenheit' }),
          );
        }
      });
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
    });

    test('Beaufort forces at the band edges', async ({ page }) => {
      // The wind now set to each edge of the WMO bands (m/s).
      let wind = 0;
      await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
        const forecast = forecastFixture();
        forecast.current.wind_speed_10m = wind;
        return route.fulfill({ json: forecast });
      });
      await page.goto(OSLO);
      await chooseOwn(page, 'Wind', 'Beaufort');
      for (const [metresPerSecond, force] of [
        [0.49, 0],
        [0.5, 1],
        [5.4, 3],
        [5.5, 4],
        [32.6, 11],
        [32.7, 12],
      ]) {
        wind = metresPerSecond;
        await page.goto('/');
        await page.goto(OSLO);
        await expect(detail(page, 'Wind')).toContainText(`${force} Bft from SW`);
      }
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test('the rows in Finnish', async ({ page }) => {
        await openApp(page);
        await page.getByRole('button', { name: 'Asetukset' }).click();
        const settings = page.getByRole('dialog', { name: 'Asetukset' });
        await expect(settings.getByRole('heading', { name: 'Yksiköt' })).toBeVisible();
        await settings.getByText('Lisää yksiköitä').click();
        await expect(
          settings.getByRole('group', { name: 'Tuuli' }).getByRole('button', { name: 'Solmut' }),
        ).toBeVisible();
        // fi-FI: m/s, mm, hPa.
        await expect(settings.locator('.settings__units-hint')).toHaveText(
          'Automaattinen seuraa °C/°F-valintaa ja aluettasi (nyt: m/s, mm, hPa).',
        );
      });
    });
  });
});

/** Chooses a unit of one's own in Settings ("Wind" → "Knots") and closes it. */
async function chooseOwn(page: Page, row: string, unit: string) {
  const settings = await openSettings(page);
  await openMoreUnits(settings);
  await settings
    .getByRole('group', { name: row })
    .getByRole('button', { name: unit, exact: true })
    .click();
  await settings.getByRole('button', { name: 'Close' }).click();
  await expect(settings).toBeHidden();
}

/** Opens "More units" (wind, rain, pressure) unless it's open already. */
async function openMoreUnits(settings: Locator) {
  const more = settings.locator('.settings__more');
  if (!(await more.evaluate((details) => (details as HTMLDetailsElement).open))) {
    await more.locator('summary').click();
  }
}
