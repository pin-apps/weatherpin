// The app in Norwegian (bokmål): for a browser in Norwegian ("nb", "no" or
// nynorsk "nn"), or chosen in Settings. Checks a sample of texts and formats
// (decimal comma, 24-hour clock, Norwegian days and compass points with Ø),
// that MET Norway's warnings are asked for in Norwegian, and that nothing on
// the main screens is left without a Norwegian translation
// (window.i18nMissing).

import type { Page } from '@playwright/test';
import { expect, openApp, pickPoint, test } from './helpers';

/** Texts shown in English because Norwegian was missing. */
const missing = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { i18nMissing: Set<string> }).i18nMissing]);

const detail = (page: Page, section: string, label: string) =>
  page
    .locator(`${section} .details__row`)
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

test.describe('Norwegian', () => {
  test.describe('a browser in Norwegian', () => {
    test.use({ locale: 'nb-NO' });

    test('shows the app in Norwegian', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
      await expect(page.locator('#search-input')).toHaveAttribute(
        'placeholder',
        'Søk etter et sted',
      );

      const warningsAsked = page.waitForRequest((request) =>
        request.url().startsWith('https://api.met.no/'),
      );
      await pickPoint(page);
      await expect(page.locator('.current__feels')).toHaveText('Føles som 1 °C');
      await expect(page.locator('.current__nowcast')).toHaveText('Regnet gir seg rundt kl. 14:45');
      await expect(page.locator('.current__updated')).toHaveText('Oppdatert 14:05');
      await expect(page.locator('.current__description')).toHaveText('Lett regn');
      // Decimal comma; wind from the southwest is "fra SV".
      await expect(detail(page, '.current', 'Nedbør')).toHaveText('0,2 mm');
      await expect(detail(page, '.current', 'Vind')).toContainText('fra SV');
      await expect(page.locator('.hourly__time').first()).toHaveText('Nå');
      await expect(page.locator('.daily__day').first()).toHaveText('I dag');
      // Norwegian day names, capitalised: Monday is "Man.".
      await expect(page.locator('.daily__day').nth(1)).toHaveText('Man.');
      await expect(page.getByRole('list', { name: 'Pollenvarsel' })).toBeVisible();
      await expect(page.locator('.aqi__label').first()).toHaveText('Grei');
      await expect(detail(page, '.sky', 'Daglengde')).toHaveText(
        '7 h 05 min · 4 min kortere i morgen',
      );
      await expect(detail(page, '.sky', 'Månen')).toHaveText('🌒 Voksende månesigd · 32 % opplyst');
      await expect(page.locator('.warnings-status')).not.toHaveText('Sjekker…');
      // MET Norway's own warnings, in Norwegian.
      expect(new URL((await warningsAsked).url()).searchParams.get('lang')).toBe('no');

      expect(await missing(page)).toEqual([]);
    });

    test('dialogs are in Norwegian too', async ({ page }) => {
      await openApp(page);
      await page
        .locator('.leaflet-control-attribution')
        .getByRole('link', { name: 'Om', exact: true })
        .click();
      const about = page.getByRole('dialog', { name: 'Om Weatherpin' });
      await expect(about).toContainText('Ingen konto, ingen informasjonskapsler');
      await expect(about).toContainText('Bruk på eget ansvar');
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Innstillinger' }).click();
      const settings = page.getByRole('dialog', { name: 'Innstillinger' });
      await expect(settings.getByRole('button', { name: 'Norsk' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(settings.getByRole('button', { name: 'Mørkt' })).toBeVisible();
      await expect(settings).toContainText('Appen åpnes ved verdenskartet.');
      expect(await missing(page)).toEqual([]);
    });
  });

  test.describe('a browser in nynorsk', () => {
    test.use({ locale: 'nn-NO' });

    test('gets bokmål', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
      await expect(page.locator('#search-input')).toHaveAttribute(
        'placeholder',
        'Søk etter et sted',
      );
    });
  });

  test('can be chosen in Settings, and back to English', async ({ page }) => {
    // The tests' browser is in English.
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__feels')).toHaveText('Feels like 1 °C');
    // The warnings answered first: the reload would cut that request
    // short, which WebKit reports as an error.
    await expect(page.locator('.warnings-status')).not.toHaveText('Checking…');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Norsk' }).click();
    // The page reloads in Norwegian, at the same place.
    await expect(page.locator('.current__feels')).toHaveText('Føles som 1 °C');
    // Again, the warnings answered before leaving the page.
    await expect(page.locator('.warnings-status')).not.toHaveText('Sjekker…');

    // Kept when the app is opened again.
    await page.goto('/');
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Søk etter et sted');

    await page.getByRole('button', { name: 'Innstillinger' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('#search-input')).toHaveAttribute(
      'placeholder',
      'Search for a place',
    );
  });
});
