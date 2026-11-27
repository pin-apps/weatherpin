// The app in Finnish: for a browser in Finnish, or chosen in Settings. Checks
// a sample of texts and formats, and that nothing on the main screens is
// left without a Finnish translation (the app lists what fell back to
// English in window.i18nMissing).

import type { Page } from '@playwright/test';
import { expect, openApp, pickPoint, test } from './helpers';

/** Texts shown in English because Finnish was missing. */
const missing = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { i18nMissing: Set<string> }).i18nMissing]);

const about = (page: Page) =>
  page.locator('.leaflet-control-attribution').getByRole('link', { name: /^(About|Tietoa)$/ });

test.describe('Finnish', () => {
  test.describe('a browser in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('shows the app in Finnish', async ({ page }) => {
      await openApp(page);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
      await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Hae paikkaa');

      await pickPoint(page);
      await expect(page.locator('.current__feels')).toHaveText('Tuntuu kuin 1 °C');
      await expect(page.locator('.current__nowcast')).toHaveText('Sade lakkaa noin klo 14:45');
      await expect(page.locator('.current__updated')).toHaveText('Päivitetty 14:05');
      await expect(page.locator('.current__description')).toHaveText('Heikkoa sadetta');
      // Decimal comma; wind from the southwest, in one Finnish word.
      await expect(
        page.locator('.current .details__row', { hasText: 'Sade' }).locator('dd'),
      ).toHaveText('0,2 mm');
      await expect(page.locator('.current .details__row', { hasText: 'Tuuli' })).toContainText(
        'lounaasta',
      );
      await expect(page.locator('.hourly__time').first()).toHaveText('Nyt');
      await expect(page.locator('.daily__day').first()).toHaveText('Tänään');
      // Finnish day names, capitalised: Monday is "Ma".
      await expect(page.locator('.daily__day').nth(1)).toHaveText('Ma');
      await expect(page.getByRole('list', { name: 'Siitepölyennuste' })).toBeVisible();
      await expect(page.locator('.aqi__label').first()).toHaveText('Tyydyttävä');
      await expect(page.locator('.warnings-status')).not.toHaveText('Tarkistetaan…');
      await expect(
        page.locator('.sky .details__row', { hasText: 'Päivän pituus' }).locator('dd'),
      ).toHaveText('7 h 05 min · huomenna 4 min lyhyempi');
      await expect(
        page.locator('.sky .details__row', { hasText: /^Kuu/ }).locator('dd'),
      ).toHaveText('🌒 Kasvava sirppi · 32 % valaistuna');

      expect(await missing(page)).toEqual([]);
    });

    test('dialogs and lists are in Finnish too', async ({ page }) => {
      await page.addInitScript(() => {
        const places = [{ name: 'Oslo, Norja', lat: 59.91, lng: 10.75 }];
        localStorage.setItem('nordic-weather:favourites', JSON.stringify({ version: 1, places }));
      });
      await openApp(page);
      await page.locator('#search-input').click();
      const favourites = page.getByRole('listbox', { name: 'Suosikit' });
      await expect(favourites).toBeVisible();
      // The visible heading is drawn by the CSS (::before).
      expect(
        await favourites.evaluate((list) => getComputedStyle(list, '::before').content),
      ).toContain('Suosikit');
      await page.getByRole('button', { name: 'Muokkaa suosikkeja' }).click();
      const editor = page.getByRole('dialog', { name: 'Muokkaa suosikkeja' });
      await expect(
        editor.getByRole('button', { name: 'Siirrä Oslo, Norja alaspäin' }),
      ).toBeVisible();
      await editor.getByRole('button', { name: 'Valmis' }).click();

      await page.locator('#search-input').fill('Oslo');
      await expect(page.getByRole('listbox', { name: 'Paikat' })).toBeVisible();
      await page.locator('#search-input').fill('');

      await about(page).click();
      const dialog = page.getByRole('dialog', { name: 'Tietoa Weatherpinistä' });
      await expect(dialog).toContainText('Ei tiliä, ei evästeitä');
      await expect(dialog).toContainText('Käyttö omalla vastuulla');
      await expect(dialog).toContainText('Säätekosyyt, jutun juurta ja haikut ovat huvin vuoksi.');
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Asetukset' }).click();
      const settings = page.getByRole('dialog', { name: 'Asetukset' });
      await expect(settings.getByRole('group', { name: 'Kieli' })).toBeVisible();
      await expect(settings.getByRole('button', { name: 'Suomi' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(settings.getByRole('button', { name: 'Tumma' })).toBeVisible();
      await expect(settings).toContainText('Sovellus avautuu maailmankarttaan.');
      expect(await missing(page)).toEqual([]);
    });
  });

  test('can be chosen in Settings, and back to English', async ({ page }) => {
    // The tests' browser is in English.
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__feels')).toHaveText('Feels like 1 °C');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Suomi' }).click();
    // The page reloads in Finnish, at the same place.
    await expect(page.locator('.current__feels')).toHaveText('Tuntuu kuin 1 °C');
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Hae paikkaa');

    // Kept when the app is opened again.
    await page.goto('/');
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Hae paikkaa');

    await page.getByRole('button', { name: 'Asetukset' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('#search-input')).toHaveAttribute(
      'placeholder',
      'Search for a place',
    );
  });
});
