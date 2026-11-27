// The ⋯ menu in the weather panel's header: Share this place and Start
// here, out of the way of the weather. Opens below ⋯, works with the
// keyboard, closes on Escape (the panel stays), outside clicks and after
// an action; on a collapsed phone sheet it opens the sheet first.

import type { Page } from '@playwright/test';
import {
  expect,
  isMobileLayout,
  offScreen,
  openApp,
  pickPoint,
  snapshot,
  test,
  visibleBoxes,
} from './helpers';

const moreButton = (page: Page) => page.getByRole('button', { name: 'More actions' });
const menu = (page: Page) => page.locator('#panel-menu');

test.describe('⋯ menu', () => {
  test(
    'the weather starts right under the header; the menu opens over it',
    { tag: '@layout' },
    async ({ page }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toBeVisible();
      // No row of buttons between the place's name and the weather.
      const header = (await page.locator('.panel__header').boundingBox())!;
      const body = (await page.locator('.panel__body').boundingBox())!;
      expect(body.y - (header.y + header.height)).toBeLessThanOrEqual(1);

      await expect(menu(page)).toBeHidden();
      await moreButton(page).click();
      await expect(moreButton(page)).toHaveAttribute('aria-expanded', 'true');
      await expect(menu(page)).toBeVisible();
      await snapshot(page, testInfo, 'menu open');

      // Both actions, on screen, below ⋯, big enough to tap.
      const boxes = await visibleBoxes(page, {
        share: '.panel__share',
        picture: '.panel__postcard',
        excuse: '.panel__excuse',
        'small talk': '.panel__small-talk',
        haiku: '.panel__haiku',
        balloon: '.panel__balloon',
        'a past day': '.panel__past',
        'start here': '.panel__start',
      });
      expect(boxes.map((b) => b.name)).toEqual([
        'share',
        'picture',
        'excuse',
        'small talk',
        'haiku',
        'balloon',
        'a past day',
        'start here',
      ]);
      expect(offScreen(page, boxes)).toEqual([]);
      const more = (await moreButton(page).boundingBox())!;
      for (const box of boxes) {
        expect(box.y).toBeGreaterThanOrEqual(more.y + more.height - 4);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    },
  );

  test('works with the keyboard; Escape closes the menu, not the panel', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await moreButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__share')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__postcard')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__excuse')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__small-talk')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__haiku')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__balloon')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__past')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.panel__start')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu(page)).toBeHidden();
    await expect(moreButton(page)).toBeFocused();
    await expect(moreButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#panel')).toBeVisible();

    // An action from the keyboard (Start here, the last item): the menu
    // closes, focus back on ⋯.
    await page.keyboard.press('Enter');
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    await expect(page.locator('.panel__start')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu(page)).toBeHidden();
    await expect(moreButton(page)).toBeFocused();
    await expect(page.locator('.panel__start-mark')).toBeVisible();
  });

  test('says what Start here did, as the menu has closed', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const status = page.locator('.panel__action-status');
    await moreButton(page).click();
    await page.getByRole('button', { name: 'Start here' }).click();
    await expect(menu(page)).toBeHidden();
    await expect(status).toHaveText('The app will open here.');

    await moreButton(page).click();
    await expect(page.getByRole('button', { name: 'Start here' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Start here' }).click();
    await expect(status).toHaveText('The app will open at the world map.');
  });

  test('a click outside closes it', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await moreButton(page).click();
    await expect(menu(page)).toBeVisible();
    await page.locator('#panel-title').click();
    await expect(menu(page)).toBeHidden();
    await expect(page.locator('#panel')).toBeVisible();
  });

  test('another place closes it', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await moreButton(page).click();
    await expect(menu(page)).toBeVisible();
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await expect(menu(page)).toBeHidden();
  });

  test(
    'on a collapsed phone sheet, opens the sheet first',
    { tag: '@layout' },
    async ({ page }) => {
      test.skip(!isMobileLayout(page), 'bottom sheet is phone-only');
      await openApp(page);
      await pickPoint(page);
      const handle = page.getByRole('button', { name: 'Weather details' });
      await handle.click();
      await expect(handle).toHaveAttribute('aria-expanded', 'false');

      await moreButton(page).click();
      await expect(handle).toHaveAttribute('aria-expanded', 'true');
      await expect(menu(page)).toBeVisible();
      const boxes = await visibleBoxes(page, {
        share: '.panel__share',
        picture: '.panel__postcard',
        excuse: '.panel__excuse',
        'small talk': '.panel__small-talk',
        haiku: '.panel__haiku',
        balloon: '.panel__balloon',
        'a past day': '.panel__past',
        'start here': '.panel__start',
      });
      expect(offScreen(page, boxes)).toEqual([]);
    },
  );
});
