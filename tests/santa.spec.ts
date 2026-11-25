// The Santa easter egg (src/santa.ts): searching "Santa" (or "joulupukki",
// "tomten", …) offers Santa's workshop in Rovaniemi, with a report made
// from the real weather there. Only from that search, like the sauna.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, openApp, test } from './helpers';

const report = (page: Page) => page.getByRole('region', { name: "Santa's workshop", exact: true });

async function searchSanta(page: Page, query = 'Santa') {
  await page.locator('#search-input').fill(query);
  const option = page.getByRole('listbox', { name: 'Places' }).getByRole('option').first();
  await expect(option).toContainText("Santa's workshop");
  await expect(option).toContainText('Rovaniemi, Finland');
  await option.click();
}

test.describe('Santa easter egg', () => {
  test('"Santa" opens the workshop, with a report from the real weather', async ({ page }) => {
    await openApp(page);
    await searchSanta(page);
    await expect(page.locator('#panel-title')).toHaveText("Santa's workshop, Rovaniemi");
    // The fake weather: gusts 11 m/s, light rain, 15 November.
    await expect(report(page)).toContainText(
      'Sleigh flying conditions: bumpy, hold on to the presents',
    );
    await expect(report(page)).toContainText('Reindeer visibility: good');
    await expect(report(page)).toContainText('Elves: busy, 39 days to Christmas Eve');
    // Above the real weather.
    const first = await page
      .locator('.panel__body')
      // (Only the warnings line may come first: it's for the real weather.)
      .evaluate((body) =>
        [...body.children]
          .filter((child) => !child.classList.contains('warnings'))[0]
          ?.classList.contains('santa'),
      );
    expect(first).toBe(true);
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test('the other names find him too', async ({ page }) => {
    await openApp(page);
    for (const query of ['joulupukki', 'Jultomten', 'father christmas!']) {
      await page.locator('#search-input').fill(query);
      await expect(
        page.getByRole('listbox', { name: 'Places' }).getByRole('option').first(),
      ).toContainText("Santa's workshop");
    }
  });

  test('on Christmas Eve the elves rest; fog needs the red nose', async ({ page }) => {
    // Registered after the fake network, so it takes over forecast requests.
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const forecast = forecastFixture();
      Object.assign(forecast.current, { time: '2026-12-24T10:00', weather_code: 45 });
      return route.fulfill({ json: forecast });
    });
    await openApp(page);
    await searchSanta(page);
    await expect(report(page)).toContainText('The elves are resting: merry Christmas!');
    await expect(report(page)).toContainText(
      'Reindeer visibility: foggy, follow the bright red nose',
    );
  });

  test('stays a secret: a link to the workshop shows the plain weather', async ({ page }) => {
    await openApp(page);
    await searchSanta(page);
    await expect(report(page)).toBeVisible();
    await page.reload();
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(report(page)).toHaveCount(0);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('is in Finnish too', async ({ page }) => {
      await openApp(page);
      await page.locator('#search-input').fill('joulupukki');
      const option = page.getByRole('listbox', { name: 'Paikat' }).getByRole('option').first();
      await expect(option).toContainText('Joulupukin paja');
      await option.click();
      const finnishReport = page.getByRole('region', { name: 'Joulupukin paja', exact: true });
      await expect(finnishReport).toContainText('Tontut: kiireisiä, 39 päivää jouluaattoon');
      expect(
        await page.evaluate(() => [
          ...(window as unknown as { i18nMissing: Set<string> }).i18nMissing,
        ]),
      ).toEqual([]);
    });
  });
});
