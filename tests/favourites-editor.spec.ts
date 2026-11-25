// "Edit favourites": renaming, reordering and removing favourites, opened
// from under the favourites list in the search box. Each test starts with
// the favourites it needs already saved.

import type { Page } from '@playwright/test';
import {
  expect,
  offScreen,
  openApp,
  overlappingPairs,
  snapshot,
  test,
  visibleBoxes,
} from './helpers';

interface SavedPlace {
  name: string;
  lat: number;
  lng: number;
  label?: string;
}

const OSLO = { name: 'Oslo, Norway', lat: 59.91, lng: 10.75 };
const BERGEN = { name: 'Bergen, Norway', lat: 60.39, lng: 5.32 };
const TROMSO = { name: 'Tromsø, Norway', lat: 69.65, lng: 18.96 };

/** Saves favourites before the app starts (only once: later loads keep changes). */
async function seed(page: Page, places: SavedPlace[]) {
  await page.addInitScript((places) => {
    const key = 'nordic-weather:favourites';
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify({ version: 1, places }));
    }
  }, places);
}

/** What's saved, as the app stored it. */
const saved = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('nordic-weather:favourites') ?? '{}').places as SavedPlace[],
  );

const editor = (page: Page) => page.getByRole('dialog', { name: 'Edit favourites' });
const favouritesList = (page: Page) => page.getByRole('listbox', { name: 'Favourites' });
const nameField = (page: Page, place: string) =>
  editor(page).getByRole('textbox', { name: `Name for ${place}` });

/** The names in the editor's fields, top to bottom. */
const fieldValues = (page: Page) =>
  editor(page)
    .locator('.favourites-editor__name')
    .evaluateAll((fields) => fields.map((field) => (field as HTMLInputElement).value));

async function openEditor(page: Page) {
  await page.locator('#search-input').click();
  await expect(favouritesList(page)).toBeVisible();
  await page.getByRole('button', { name: 'Edit favourites' }).click();
  await expect(editor(page)).toBeVisible();
}

/** Names in the search box's favourites list, top to bottom. */
async function listedNames(page: Page) {
  await page.locator('#search-input').click();
  await expect(favouritesList(page)).toBeVisible();
  return favouritesList(page).locator('.search__option-name').allTextContents();
}

test.describe('editing favourites', () => {
  test(
    'opens from the favourites list and fits the screen',
    { tag: '@layout' },
    async ({ page }, testInfo) => {
      await seed(page, [OSLO, { ...BERGEN, label: 'Cabin' }, TROMSO]);
      await openApp(page);

      await page.locator('#search-input').click();
      await expect(page.getByRole('button', { name: 'Edit favourites' })).toBeVisible();
      await snapshot(page, testInfo, 'favourites list with edit');
      await page.getByRole('button', { name: 'Edit favourites' }).click();
      await expect(editor(page)).toBeVisible();
      // Done has the focus, so a phone's keyboard stays down.
      await expect(editor(page).getByRole('button', { name: 'Done' })).toBeFocused();
      await expect
        .poll(() => fieldValues(page))
        .toEqual(['Oslo, Norway', 'Cabin', 'Tromsø, Norway']);
      // The renamed place still says where it is.
      await expect(editor(page).locator('.favourites-editor__place').nth(1)).toHaveText(
        'Bergen, Norway',
      );
      await snapshot(page, testInfo, 'favourites editor');

      const size = page.viewportSize()!;
      const box = (await editor(page).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(size.width);
      expect(box.y + box.height).toBeLessThanOrEqual(size.height);

      // A row's name and buttons side by side, none cut off.
      const row = '.favourites-editor__item:nth-child(2)';
      const boxes = await visibleBoxes(page, {
        name: `${row} .favourites-editor__name`,
        up: `${row} .favourites-editor__up`,
        down: `${row} .favourites-editor__down`,
        remove: `${row} .favourites-editor__remove`,
        done: '.favourites-editor__done',
      });
      expect(boxes).toHaveLength(5);
      expect(overlappingPairs(boxes)).toEqual([]);
      expect(offScreen(page, boxes)).toEqual([]);
      for (const control of boxes) {
        expect(control.height, `${control.name} is big enough to tap`).toBeGreaterThanOrEqual(44);
      }

      await editor(page).getByRole('button', { name: 'Done' }).click();
      await expect(editor(page)).toBeHidden();
    },
  );

  test('a new name shows in the app, but links keep the place name', async ({ page }) => {
    await seed(page, [OSLO]);
    await openApp(page);
    await page.locator('#search-input').click();
    await favouritesList(page).getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');

    await openEditor(page);
    await nameField(page, 'Oslo, Norway').fill('Home');
    await nameField(page, 'Oslo, Norway').press('Enter');
    await expect(editor(page).locator('.favourites-editor__place')).toHaveText('Oslo, Norway');
    await expect(editor(page).getByRole('button', { name: 'Remove Home' })).toBeVisible();
    await editor(page).getByRole('button', { name: 'Done' }).click();

    // The open panel follows at once.
    await expect(page.locator('#panel-title')).toHaveText('Home');
    expect(await saved(page)).toEqual([{ ...OSLO, label: 'Home' }]);
    // The user's name stays on the device: not in the address or the title
    // (bookmarks, history, shares).
    await expect(page).toHaveURL(/name=Oslo/);
    expect(page.url()).not.toContain('Home');
    await expect(page).toHaveTitle(/^Oslo, Norway · /);

    // The search list shows both names.
    expect(await listedNames(page)).toEqual(['Home']);
    await expect(favouritesList(page).locator('.search__option-text')).toHaveText([
      'HomeOslo, Norway',
    ]);

    // Opening the app again keeps it.
    await page.goto('/');
    expect(await listedNames(page)).toEqual(['Home']);
  });

  test("an empty name goes back to the place's own name", async ({ page }) => {
    await seed(page, [{ ...OSLO, label: 'Home' }]);
    await openApp(page);
    await openEditor(page);

    await nameField(page, 'Oslo, Norway').fill('   ');
    await nameField(page, 'Oslo, Norway').press('Enter');
    await expect(nameField(page, 'Oslo, Norway')).toHaveValue('Oslo, Norway');
    await expect(editor(page).locator('.favourites-editor__place')).toBeHidden();
    expect(await saved(page)).toEqual([OSLO]);
  });

  test('a name still being typed is kept when the editor closes', async ({ page }) => {
    await seed(page, [OSLO]);
    await openApp(page);
    await openEditor(page);
    await nameField(page, 'Oslo, Norway').fill('Work');
    await page.keyboard.press('Escape');
    await expect(editor(page)).toBeHidden();
    expect(await saved(page)).toEqual([{ ...OSLO, label: 'Work' }]);
  });

  test('↑ and ↓ change the order', async ({ page }) => {
    await seed(page, [OSLO, BERGEN, TROMSO]);
    await openApp(page);
    await openEditor(page);

    const up = editor(page).getByRole('button', { name: 'Move Tromsø, Norway up' });
    await up.click();
    await up.click();
    await expect
      .poll(() => fieldValues(page))
      .toEqual(['Tromsø, Norway', 'Oslo, Norway', 'Bergen, Norway']);
    // At the top it can't go further up; the focus stays on the place.
    await expect(up).toBeDisabled();
    await expect(
      editor(page).getByRole('button', { name: 'Move Tromsø, Norway down' }),
    ).toBeFocused();
    await expect(
      editor(page).getByRole('button', { name: 'Move Bergen, Norway down' }),
    ).toBeDisabled();

    await editor(page).getByRole('button', { name: 'Move Oslo, Norway down' }).click();
    expect((await saved(page)).map((place) => place.name)).toEqual([
      'Tromsø, Norway',
      'Bergen, Norway',
      'Oslo, Norway',
    ]);

    await editor(page).getByRole('button', { name: 'Done' }).click();
    expect(await listedNames(page)).toEqual(['Tromsø, Norway', 'Bergen, Norway', 'Oslo, Norway']);
  });

  test('a removed place can be put back with Undo', async ({ page }, testInfo) => {
    await seed(page, [OSLO, BERGEN, TROMSO]);
    await openApp(page);
    await openEditor(page);

    await editor(page).getByRole('button', { name: 'Remove Bergen, Norway' }).click();
    await expect(editor(page).locator('.favourites-editor__item')).toHaveCount(2);
    await expect(editor(page).getByRole('status')).toHaveText('Removed Bergen, Norway.');
    const undo = editor(page).getByRole('button', { name: 'Undo' });
    await expect(undo).toBeFocused();
    await snapshot(page, testInfo, 'removed, with undo');
    expect((await saved(page)).map((place) => place.name)).toEqual([
      'Oslo, Norway',
      'Tromsø, Norway',
    ]);

    await undo.click();
    await expect
      .poll(() => fieldValues(page))
      .toEqual(['Oslo, Norway', 'Bergen, Norway', 'Tromsø, Norway']);
    await expect(editor(page).getByRole('status')).toHaveText('Bergen, Norway is back.');
    await expect(undo).toBeHidden();
    expect(await saved(page)).toEqual([OSLO, BERGEN, TROMSO]);
  });

  test('removing the last place says there are none', async ({ page }) => {
    await seed(page, [OSLO]);
    await openApp(page);
    await openEditor(page);
    await editor(page).getByRole('button', { name: 'Remove Oslo, Norway' }).click();
    await expect(editor(page).locator('.favourites-editor__empty')).toBeVisible();
    await expect(editor(page).locator('.favourites-editor__hint')).toBeHidden();
  });

  test('a newly starred place goes to the end of the list', async ({ page }) => {
    await seed(page, [BERGEN]);
    await openApp(page);
    await page.locator('#search-input').fill('Oslo');
    const results = page.getByRole('listbox', { name: 'Places' });
    await expect(results).toBeVisible();
    await results.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Favourite' }).click();
    await expect(page.getByRole('button', { name: 'Favourite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect((await saved(page)).map((place) => place.name)).toEqual([
      'Bergen, Norway',
      'Oslo, Norway',
    ]);
  });

  test(
    'with 20 favourites the editor still fits, and scrolls',
    { tag: '@layout' },
    async ({ page }) => {
      await seed(
        page,
        Array.from({ length: 20 }, (_, i) => ({ name: `Place ${i + 1}`, lat: -40 + i, lng: 10 })),
      );
      await openApp(page);
      await openEditor(page);
      const size = page.viewportSize()!;
      const box = (await editor(page).boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(size.height);
      const last = editor(page).getByRole('button', { name: 'Move Place 20 up' });
      await last.click();
      await expect(editor(page).locator('.favourites-editor__name').nth(18)).toHaveValue(
        'Place 20',
      );
    },
  );

  test('works with the keyboard', async ({ page }) => {
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    test.skip(coarse, 'keyboard focus return is for mouse and keyboard devices');
    await seed(page, [OSLO, BERGEN]);
    await openApp(page);

    const input = page.locator('#search-input');
    await input.focus();
    await expect(favouritesList(page)).toBeVisible();
    // Tab from the box reaches "Edit favourites"; the list stays open.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Edit favourites' })).toBeFocused();
    await expect(favouritesList(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(editor(page)).toBeVisible();
    await expect(editor(page).getByRole('button', { name: 'Done' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(nameField(page, 'Oslo, Norway')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      editor(page).getByRole('button', { name: 'Move Oslo, Norway down' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(editor(page).getByRole('button', { name: 'Move Oslo, Norway up' })).toBeFocused();

    // Closing goes back to the search box, which lists the new order.
    await page.keyboard.press('Escape');
    await expect(editor(page)).toBeHidden();
    await expect(input).toBeFocused();
    await expect(favouritesList(page).locator('.search__option-name')).toHaveText([
      'Bergen, Norway',
      'Oslo, Norway',
    ]);
  });
});
