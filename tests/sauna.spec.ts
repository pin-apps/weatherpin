// The sauna easter egg (src/sauna.ts): searching "sauna" offers Saunalahti
// ("Sauna Bay", Espoo), which opens a sauna report above the real weather.
// Only from that search; a link to the place shows the plain weather.

import type { Page } from '@playwright/test';
import { chooseUnit, expect, openApp, snapshot, test } from './helpers';

const sauna = (page: Page) => page.getByRole('region', { name: 'Sauna', exact: true });

async function searchSauna(page: Page) {
  await page.locator('#search-input').fill('sauna');
  const option = page.getByRole('listbox', { name: 'Places' }).getByRole('option').first();
  await expect(option).toContainText('Sauna');
  await expect(option).toContainText('Saunalahti, Finland');
  await option.click();
}

test.describe('sauna easter egg', () => {
  test(
    '"sauna" opens Saunalahti with a sauna report on top',
    { tag: '@layout' },
    async ({ page }, testInfo) => {
      await openApp(page);
      await searchSauna(page);

      await expect(page.locator('#panel-title')).toHaveText('Saunalahti, Finland');
      await expect(sauna(page)).toContainText('80 °C');
      await expect(sauna(page)).toContainText('Löyly incoming');
      await expect(sauna(page)).toContainText('Wind: none (close the door!)');
      // Inland in the fake API: no sea temperature.
      await expect(sauna(page)).toContainText('After the sauna: the sea is right there');
      // Above the real weather, which is all there too.
      const first = await page
        .locator('.panel__body')
        // (Only the warnings line may come first: it's for the real weather.)
        .evaluate((body) =>
          [...body.children]
            .filter((child) => !child.classList.contains('warnings'))[0]
            ?.classList.contains('sauna'),
        );
      expect(first).toBe(true);
      await expect(page.locator('.current__temp')).toBeVisible();

      // Fits the panel's width.
      const overflow = await page
        .locator('.panel__body')
        .evaluate((body) => body.scrollWidth - body.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await snapshot(page, testInfo, 'sauna');
    },
  );

  test.describe('by the sea', () => {
    test.use({ marineMode: 'sea' });

    test('the dip afterwards uses the real sea temperature, in °C or °F', async ({ page }) => {
      await openApp(page);
      await searchSauna(page);
      await expect(sauna(page)).toContainText('After the sauna: the sea is 8 °C');

      await chooseUnit(page, '°F');
      await expect(sauna(page)).toContainText('176 °F');
      await expect(sauna(page)).toContainText('After the sauna: the sea is 47 °F');
    });
  });

  test('stays a secret: a link to the place, or another place, has no sauna', async ({ page }) => {
    await openApp(page);
    await searchSauna(page);
    await expect(sauna(page)).toBeVisible();
    // The warnings answered first: leaving the page would cut that request
    // short, which WebKit reports as an error.
    await expect(page.locator('.warnings-status')).not.toHaveText('Checking…');

    // The address now links Saunalahti; opening it shows the plain weather.
    await page.reload();
    await expect(page.locator('#panel-title')).toHaveText('Saunalahti, Finland');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(sauna(page)).toHaveCount(0);
    await expect(page.locator('.warnings-status')).not.toHaveText('Checking…');

    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await expect(sauna(page)).toHaveCount(0);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('is in Finnish too', async ({ page }) => {
      await openApp(page);
      await page.locator('#search-input').fill('sauna');
      const option = page.getByRole('listbox', { name: 'Paikat' }).getByRole('option').first();
      await expect(option).toContainText('Saunalahti, Suomi');
      await option.click();
      const report = page.getByRole('region', { name: 'Sauna', exact: true });
      await expect(report).toContainText('Löylyä tulossa');
      await expect(report).toContainText('Saunan jälkeen: meri on ihan vieressä');
      expect(
        await page.evaluate(() => [
          ...(window as unknown as { i18nMissing: Set<string> }).i18nMissing,
        ]),
      ).toEqual([]);
    });
  });
});
