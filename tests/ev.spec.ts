// "Electric car range" in More details (src/weather/ev.ts, filled with Beer
// outside by render/sky.ts): typical range loss in the cold, only from +5 °C
// down, with an estimate note.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const row = (page: Page) =>
  page
    .locator('.more-details .details__row')
    .filter({ has: page.locator('dt', { hasText: /^Electric car range$/ }) });

async function open(page: Page, link = OSLO) {
  await page.goto(link);
  // Filled with the beer row, by the on-demand Sky code.
  await expect(page.locator('.beer-outside')).toBeVisible();
}

test.describe('electric car range', () => {
  test('just above freezing: a small loss, with the estimate note', async ({ page }) => {
    // The fixture's 4.6 °C.
    await open(page);
    await expect(row(page).locator('.ev__value')).toHaveText('🔋 5–15 % less');
    await expect(row(page).locator('.ev__detail')).toHaveText(
      'Typical at 5 °C. Less with a heat pump or a car warmed while plugged in; more on short trips.',
    );
    await expect(row(page).locator('.estimate-note')).toHaveText(
      /Estimate from published tests, not your car\./,
    );
    // Just before Beer outside.
    const labels = await page.locator('.more-details dt').allTextContents();
    expect(labels.indexOf('Electric car range') + 1).toBe(labels.indexOf('Beer outside'));
  });

  test.describe('in polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('hard frost: a bigger loss', async ({ page }) => {
      // −12.4 °C.
      await open(page, '/#at=78.22,15.65&name=Longyearbyen');
      await expect(row(page).locator('.ev__value')).toHaveText('🔋 20–40 % less');
    });
  });

  test('no row when it is mild', async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const forecast = forecastFixture();
      forecast.current.temperature_2m = 12;
      return route.fulfill({ json: forecast });
    });
    await open(page);
    await expect(row(page)).toHaveCount(0);
  });

  test('in °F', async ({ page }) => {
    await page.goto(OSLO);
    await chooseUnit(page, '°F');
    await expect(row(page).locator('.ev__detail')).toContainText('Typical at 40 °F.');
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Sähköauton toimintamatka"', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      const finnish = page
        .locator('.more-details .details__row')
        .filter({ has: page.locator('dt', { hasText: /^Sähköauton toimintamatka$/ }) });
      await expect(finnish.locator('.ev__value')).toHaveText('🔋 5–15 % vähemmän');
    });
  });
});
