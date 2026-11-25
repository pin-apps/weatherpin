// "Random place" under the search box (src/places/random-place.ts): a
// random point on land, with no request but the weather's. The test makes
// "random" repeatable: a fixed sequence of numbers lands in Nigeria.

import type { Page } from '@playwright/test';
import { expect, openApp, test } from './helpers';

const randomButton = (page: Page) => page.getByRole('button', { name: 'Random place' });

/** Math.random from now on: a fixed sequence (the same as checked by hand). */
async function repeatableRandom(page: Page) {
  await page.evaluate(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  });
}

test.describe('random place', () => {
  test('offered under the empty search box, even with no favourites', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await expect(randomButton(page)).toBeVisible();
    // No favourites: no list, no "Edit favourites".
    await expect(page.locator('.search__results')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Edit favourites' })).toBeHidden();

    // Typing a search: just the search results.
    await page.locator('#search-input').fill('Oslo');
    await expect(page.getByRole('listbox', { name: 'Places' })).toBeVisible();
    await expect(randomButton(page)).toBeHidden();
  });

  test('flies to a random place on land and shows its weather', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await repeatableRandom(page);
    // The land map is loaded only now.
    const landMap = page.waitForRequest(/\/assets\/random-place-.*\.js$/);
    await randomButton(page).click();
    await landMap;

    await expect(page.locator('.current__temp')).toBeVisible();
    // Northern Nigeria (checked against the land map by hand).
    await expect(page.locator('#panel-title')).toHaveText('11.58° N, 7.13° E');
    expect(new URL(page.url()).hash).toBe('#at=11.58,7.13');
    await expect(randomButton(page)).toBeHidden();
  });

  test('works with the keyboard', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await page.keyboard.press('Tab');
    await expect(randomButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test(
    'its text lines up with the favourites and "Edit favourites"',
    { tag: '@layout' },
    async ({ page }) => {
      await page.addInitScript(() => {
        const places = [{ name: 'Oslo, Norway', lat: 59.91, lng: 10.75 }];
        localStorage.setItem('nordic-weather:favourites', JSON.stringify({ version: 1, places }));
      });
      await openApp(page);
      await page.locator('#search-input').focus();
      await expect(randomButton(page)).toBeVisible();
      const left = async (selector: string) => (await page.locator(selector).boundingBox())!.x;
      const favourite = await left('.search__option-text');
      expect(Math.abs((await left('.search__edit [data-i18n]')) - favourite)).toBeLessThan(1);
      expect(Math.abs((await left('.search__random [data-i18n]')) - favourite)).toBeLessThan(1);
    },
  );

  test('sits under the favourites, after "Edit favourites"', async ({ page }) => {
    await page.addInitScript(() => {
      const places = [{ name: 'Oslo, Norway', lat: 59.91, lng: 10.75 }];
      localStorage.setItem('nordic-weather:favourites', JSON.stringify({ version: 1, places }));
    });
    await openApp(page);
    await page.locator('#search-input').focus();
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit favourites' })).toBeVisible();
    await expect(randomButton(page)).toBeVisible();
    // The list holds only the favourites.
    await expect(page.getByRole('option')).toHaveCount(1);
  });
});
