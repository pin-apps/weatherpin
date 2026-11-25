// The app in Swedish: for a browser in Swedish, or chosen in Settings.
// Checks a sample of texts and formats (decimal comma, 24-hour clock,
// Swedish days and compass points), and that nothing on the main screens
// is left without a Swedish translation (window.i18nMissing).

import type { Page } from '@playwright/test';
import { expect, openApp, pickPoint, test } from './helpers';

/** Texts shown in English because Swedish was missing. */
const missing = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { i18nMissing: Set<string> }).i18nMissing]);

const detail = (page: Page, section: string, label: string) =>
  page
    .locator(`${section} .details__row`)
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

test.describe('Swedish', () => {
  test.describe('a browser in Swedish', () => {
    test.use({ locale: 'sv-SE' });

    test('shows the app in Swedish', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
      await expect(page.locator('#search-input')).toHaveAttribute(
        'placeholder',
        'Sök efter en plats',
      );

      await pickPoint(page);
      await expect(page.locator('.current__feels')).toHaveText('Känns som 1 °C');
      await expect(page.locator('.current__nowcast')).toHaveText('Regnet upphör omkring kl. 14:45');
      await expect(page.locator('.current__updated')).toHaveText('Uppdaterad 14:05');
      await expect(page.locator('.current__description')).toHaveText('Lätt regn');
      // Decimal comma; wind from the southwest is "från SV".
      await expect(detail(page, '.current', 'Nederbörd')).toHaveText('0,2 mm');
      await expect(detail(page, '.current', 'Vind')).toContainText('från SV');
      await expect(page.locator('.hourly__time').first()).toHaveText('Nu');
      await expect(page.locator('.daily__day').first()).toHaveText('I dag');
      // Swedish day names, capitalised: Monday is "Mån".
      await expect(page.locator('.daily__day').nth(1)).toHaveText('Mån');
      await expect(page.getByRole('list', { name: 'Pollenprognos' })).toBeVisible();
      await expect(page.locator('.aqi__label').first()).toHaveText('Godtagbar');
      await expect(detail(page, '.sky', 'Dagslängd')).toHaveText(
        '7 h 05 min · 4 min kortare i morgon',
      );
      await expect(detail(page, '.sky', 'Månen')).toHaveText('🌒 Tilltagande skära · 32 % belyst');
      await expect(page.locator('.warnings-status')).not.toHaveText('Kontrollerar…');

      expect(await missing(page)).toEqual([]);
    });

    test('dialogs are in Swedish too', async ({ page }) => {
      await openApp(page);
      await page
        .locator('.leaflet-control-attribution')
        .getByRole('link', { name: 'Om', exact: true })
        .click();
      const about = page.getByRole('dialog', { name: 'Om Weatherpin' });
      await expect(about).toContainText('Inget konto, inga kakor');
      await expect(about).toContainText('Användning på egen risk');
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Inställningar' }).click();
      const settings = page.getByRole('dialog', { name: 'Inställningar' });
      await expect(settings.getByRole('button', { name: 'Svenska' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(settings.getByRole('button', { name: 'Mörkt' })).toBeVisible();
      await expect(settings).toContainText('Appen öppnas vid världskartan.');
      expect(await missing(page)).toEqual([]);
    });
  });

  test('can be chosen in Settings, and back to English', async ({ page }) => {
    // The tests' browser is in English.
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__feels')).toHaveText('Feels like 1 °C');
    // The warnings answered first: the reload would cut that request short,
    // which WebKit reports as an error.
    await expect(page.locator('.warnings-status')).not.toHaveText('Checking…');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Svenska' }).click();
    // The page reloads in Swedish, at the same place.
    await expect(page.locator('.current__feels')).toHaveText('Känns som 1 °C');
    await expect(page.locator('.warnings-status')).not.toHaveText('Kontrollerar…');

    // Kept when the app is opened again.
    await page.goto('/');
    await expect(page.locator('#search-input')).toHaveAttribute(
      'placeholder',
      'Sök efter en plats',
    );

    await page.getByRole('button', { name: 'Inställningar' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('#search-input')).toHaveAttribute(
      'placeholder',
      'Search for a place',
    );
  });
});
