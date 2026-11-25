// The name of a tapped point (src/places/reverse.ts, OpenStreetMap's
// Nominatim): the coordinates show first, then the name replaces them in
// the title, the page title and the address. No name (at sea, a failure):
// the coordinates stay.

import type { Page } from '@playwright/test';
import { expect, openApp, pickPoint, test } from './helpers';

const title = (page: Page) => page.locator('#panel-title');
const coordinatesRow = (page: Page) =>
  page.locator('.details__row', { has: page.locator('dt', { hasText: /^Coordinates$/ }) });

/** Records the requests to Nominatim. */
function nameRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname === 'nominatim.openstreetmap.org') urls.push(request.url());
  });
  return urls;
}

test.describe('place names for tapped points', () => {
  test.describe('a place named in another script', () => {
    test.use({ placeNameMode: 'foreign' });

    test('gets its English name', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('#panel-title')).toHaveText('Beijing, China');
    });
  });

  test.describe('a place with no readable name', () => {
    test.use({ placeNameMode: 'unreadable' });

    test('keeps the country', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('#panel-title')).toHaveText('China');
    });
  });

  test.describe('in a town', () => {
    test.use({ placeNameMode: 'town' });

    test('the name replaces the coordinates', async ({ page }) => {
      const requests = nameRequests(page);
      await openApp(page);
      await pickPoint(page);
      await expect(title(page)).toHaveText('Espoo, Finland');
      await expect(page).toHaveTitle('Espoo, Finland · Weatherpin');
      await expect(page).toHaveURL(/name=Espoo/);
      // The coordinates move to More details, as for a searched place.
      await expect(coordinatesRow(page)).toHaveCount(1);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toContain('accept-language=en');

      // A favourite saved now is saved with the name.
      await page.getByRole('button', { name: 'Favourite' }).click();
      await page.locator('#search-input').click();
      await expect(page.getByRole('listbox', { name: 'Favourites' })).toContainText(
        'Espoo, Finland',
      );
    });

    test('a searched place keeps its name and asks nobody', async ({ page }) => {
      const requests = nameRequests(page);
      await openApp(page);
      await page.locator('#search-input').fill('Oslo');
      await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
      await expect(title(page)).toHaveText('Oslo, Norway');
      await expect(page.locator('.current__temp')).toBeVisible();
      expect(requests).toEqual([]);
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test('the name is in Finnish', async ({ page }) => {
        const requests = nameRequests(page);
        await openApp(page);
        await pickPoint(page);
        await expect(title(page)).toHaveText('Espoo, Suomi');
        expect(requests[0]).toContain('accept-language=fi');
      });
    });
  });

  test('with no name (at sea), the coordinates stay', async ({ page }) => {
    const requests = nameRequests(page);
    await openApp(page);
    await pickPoint(page);
    await expect.poll(() => requests.length).toBe(1);
    await expect(title(page)).toHaveText(/°/);
    await expect(coordinatesRow(page)).toHaveCount(0);
  });
});
