// Links to places: the address follows the place shown, a link opens its
// place, Back goes to the previous place, and "Share this place" sends a
// link (share sheet where there is one, else copied).

import type { Page } from '@playwright/test';
import { expect, openApp, pickPoint, placeAction, test, waitForTiles } from './helpers';

async function searchOslo(page: Page) {
  await page.locator('#search-input').fill('Oslo');
  await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
  await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
  await expect(page.locator('.current__temp')).toBeVisible();
}

const hash = (page: Page) => page.evaluate(() => window.location.hash);

async function openLink(page: Page, linkHash: string) {
  await page.goto(`/${linkHash}`);
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await waitForTiles(page);
}

test.describe('place links', () => {
  test('the address and page title follow the place shown', async ({ page }) => {
    await openApp(page);
    await searchOslo(page);
    expect(await hash(page)).toMatch(/^#at=59\.91,10\.75&name=Oslo,\+Norway$/);
    await expect(page).toHaveTitle('Oslo, Norway · Weatherpin');

    // Closing the panel takes the place out of the address.
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    expect(await hash(page)).toBe('');
    await expect(page).toHaveTitle('Weatherpin – weather anywhere on the world map');
  });

  test('a link opens its place, with the weather', async ({ page }) => {
    await openLink(page, '#at=60.17,24.94&name=Helsinki');
    await expect(page.locator('#panel-title')).toHaveText('Helsinki');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('.pick-marker')).toHaveCount(1);
  });

  test('a link without a name shows the coordinates', async ({ page }) => {
    await openLink(page, '#at=60.17,24.94');
    await expect(page.locator('#panel-title')).toHaveText(/60\.17° N, 24\.94° E/);
  });

  test('Back goes to the previous place, then to the plain map', async ({ page }) => {
    await openApp(page);
    await searchOslo(page);
    // High on the screen: lower down, a phone's open sheet has the map
    // credits riding just above it.
    await pickPoint(page, 0.5, 0.2);
    await expect(page.locator('#panel-title')).not.toHaveText('Oslo, Norway');

    await page.goBack();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await page.goBack();
    await expect(page.locator('#panel')).toBeHidden();
    await page.goForward();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
  });

  test('broken or odd links are ignored, and names stay plain text', async ({ page }) => {
    for (const bad of ['#at=999,10', '#at=abc', '#at=60.1;alert(1)', '#somewhere']) {
      await openLink(page, bad);
      await expect(page.locator('#panel')).toBeHidden();
    }
    const name = '<img src=x onerror=alert(1)>';
    await openLink(page, `#at=60.17,24.94&name=${encodeURIComponent(name)}`);
    await expect(page.locator('#panel-title')).toHaveText(name);
    await expect(page.locator('#panel-title img')).toHaveCount(0);
  });
});

test.describe('share this place', () => {
  test('uses the share sheet, with the place rounded to ~1 km', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          (window as unknown as { shared?: ShareData }).shared = data;
        },
      });
    });
    await openLink(page, '#at=60.123456,24.987654&name=Somewhere');
    await placeAction(page, 'Share this place');
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { shared?: ShareData }).shared))
      .toEqual({
        title: 'Weather in Somewhere',
        url: expect.stringMatching(/\/#at=60\.12,24\.99&name=Somewhere$/),
      });
  });

  test('copies the link where there is no share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as unknown as { copied?: string }).copied = text;
          },
        },
      });
    });
    await openApp(page);
    await searchOslo(page);
    await placeAction(page, 'Share this place');
    await expect(page.locator('.panel__action-status')).toHaveText('Link copied');
    expect(await page.evaluate(() => (window as unknown as { copied?: string }).copied)).toMatch(
      /\/#at=59\.91,10\.75&name=Oslo,\+Norway$/,
    );
  });

  test('shows the link when it cannot be copied', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('not allowed')) },
      });
    });
    await openLink(page, '#at=60.17,24.94');
    await placeAction(page, 'Share this place');
    await expect(page.locator('.panel__action-status')).toHaveText(/\/#at=60\.17,24\.94$/);
  });
});
