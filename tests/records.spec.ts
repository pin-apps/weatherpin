// Weather records (src/records.ts): a point near a famous record place
// gets a line about it above the real weather.

import { expect, test } from './helpers';

const record = (page: import('@playwright/test').Page) => page.locator('.record');

test.describe('weather records', () => {
  test('Vostok Station: the coldest ever measured', async ({ page }) => {
    await page.goto('/#at=-78.46,106.84&name=Vostok+Station');
    await expect(record(page)).toContainText('Weather record');
    await expect(record(page)).toContainText(
      'Vostok: coldest ever measured on Earth, -89 °C (1983)',
    );
    // The real weather still follows.
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test('a tap a few km away counts; far away, nothing', async ({ page }) => {
    await page.goto('/#at=36.5,-116.8');
    await expect(record(page)).toContainText('Death Valley');
    await page.goto('/#at=59.91,10.75&name=Oslo,+Norway');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(record(page)).toHaveCount(0);
  });

  test('values follow the units: the strongest gust in mph (British English)', async ({ page }) => {
    await page.goto('/#at=-20.8,115.4');
    await expect(record(page)).toContainText('strongest gust ever measured, 253 mph');
  });

  test.describe('in US English', () => {
    test.use({ locale: 'en-US' });

    test('°F', async ({ page }) => {
      await page.goto('/#at=-78.46,106.84');
      await expect(record(page)).toContainText('-129 °F (1983)');
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test("Finland's coldest", async ({ page }) => {
      await page.goto('/#at=68.17,25.78&name=Pokka,+Suomi');
      await expect(record(page)).toContainText('Sääennätys');
      await expect(record(page)).toContainText('Pokka: Suomen kylmin, -51 °C (1999)');
    });
  });
});
