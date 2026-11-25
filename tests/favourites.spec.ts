// Favourite places: the ☆/★ button in the weather panel, kept in
// localStorage. Each test starts with empty storage (a fresh browser
// context); a reload in the same test keeps it, like a real browser.

import { expect, openApp, snapshot, test, waitForTiles } from './helpers';
import type { Page } from '@playwright/test';

async function showOslo(page: Page) {
  await page.locator('#search-input').fill('Oslo');
  // Wait for the search results, not the favourites the empty box showed.
  const results = page.getByRole('listbox', { name: 'Places' });
  await expect(results).toBeVisible();
  await results.getByRole('option').first().click();
  await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
}

const star = (page: Page) => page.getByRole('button', { name: 'Favourite' });

test.describe('favourites', () => {
  test('a saved place stays saved after a reload', async ({ page }, testInfo) => {
    await openApp(page);
    await showOslo(page);
    await expect(star(page)).toHaveAttribute('aria-pressed', 'false');

    await star(page).click();
    await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(star(page)).toHaveText('★');
    await snapshot(page, testInfo, 'saved');

    await page.goto('/');
    await waitForTiles(page);
    await showOslo(page);
    await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('pressing the star again removes the place', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await star(page).click();
    await expect(star(page)).toHaveAttribute('aria-pressed', 'true');

    await star(page).click();
    await expect(star(page)).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/');
    await waitForTiles(page);
    await showOslo(page);
    await expect(star(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('favourites appear in the empty search box', async ({ page }, testInfo) => {
    await openApp(page);
    await showOslo(page);
    await star(page).click();
    await page.goto('/');
    await waitForTiles(page);

    const input = page.locator('#search-input');
    await input.focus();
    const list = page.getByRole('listbox', { name: 'Favourites' });
    await expect(list).toBeVisible();
    await expect(list.locator('.search__option-name')).toHaveText(['Oslo, Norway']);
    // With the weather there now.
    await expect(list.locator('.search__option-weather')).toHaveText(['☁️3 °C']);
    await snapshot(page, testInfo, 'favourites list');

    await list.getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('the favourites list works with the keyboard', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await star(page).click();

    const input = page.locator('#search-input');
    await input.focus();
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
  });

  test('typing hides the favourites at once', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await star(page).click();

    const input = page.locator('#search-input');
    await input.focus();
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeVisible();
    // Several letters at once (like fast typing): the favourites must go
    // straight away, before the search results are back.
    await input.fill('Oslo');
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeHidden();
    await expect(page.getByRole('listbox', { name: 'Places' })).toBeVisible();
  });

  test('typing switches to search results; clearing brings favourites back', async ({ page }) => {
    await openApp(page);
    await showOslo(page);
    await star(page).click();

    const input = page.locator('#search-input');
    await input.fill('Oslo');
    await expect(page.getByRole('listbox', { name: 'Places' })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(5);

    await input.fill('');
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(1);
  });

  test('with no favourites the empty box shows no list', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await page.waitForTimeout(300);
    await expect(page.locator('.search__results')).toBeHidden();
  });

  test.describe('with 20 favourites already', () => {
    test.beforeEach(async ({ page }) => {
      // Fill storage before the app starts (runs on every page load).
      await page.addInitScript(() => {
        const places = Array.from({ length: 20 }, (_, i) => ({
          name: `Place ${i + 1}`,
          lat: -40 + i,
          lng: -100 + i,
        }));
        localStorage.setItem('nordic-weather:favourites', JSON.stringify({ version: 1, places }));
      });
    });

    test('the list shows the weather now at each, from one request', async ({ page }) => {
      const requests: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.hostname === 'api.open-meteo.com' && !url.searchParams.has('hourly')) {
          requests.push(request.url());
        }
      });
      await openApp(page);
      await page.locator('#search-input').focus();
      const weather = page
        .getByRole('listbox', { name: 'Favourites' })
        .locator('.search__option-weather');
      await expect(weather).toHaveCount(20);
      // In the list's order: the fake answers 3 °C, 4 °C, … in turn.
      await expect(weather.first()).toHaveText('☁️3 °C');
      await expect(weather.last()).toHaveText('☁️22 °C');
      expect(requests).toHaveLength(1);

      // Opened again within 10 minutes: from the cache, no new request.
      await page.keyboard.press('Escape');
      await page.locator('#search-input').blur();
      await page.locator('#search-input').focus();
      await expect(weather.first()).toHaveText('☁️3 °C');
      expect(requests).toHaveLength(1);
    });

    test('says the list is full instead of saving', async ({ page }, testInfo) => {
      await openApp(page);
      await showOslo(page);
      await star(page).click();
      await expect(page.locator('.panel__message')).toHaveText(
        'You have 20 favourites. Remove one to save another.',
      );
      await expect(page.locator('.panel__message')).toBeVisible();
      await expect(star(page)).toHaveAttribute('aria-pressed', 'false');
      await snapshot(page, testInfo, 'favourites full');
    });
  });

  test.describe('when the browser blocks storage', () => {
    test.beforeEach(async ({ page }) => {
      // Like some private modes and privacy settings: any access throws.
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage is blocked', 'SecurityError');
          },
        });
      });
    });

    test('hides the star and everything else still works', async ({ page }) => {
      await openApp(page);
      await showOslo(page);
      await expect(page.locator('.current__temp')).toBeVisible();
      await expect(page.locator('.panel__favourite')).toBeHidden();
    });
  });
});
