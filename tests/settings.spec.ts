// Settings (⚙ next to the search box): opening and closing, light/dark
// (Automatic follows the device), the start place, clearing saved data,
// the way to About, and a browser that blocks storage. °C/°F is in
// units.spec.ts, the language in finnish.spec.ts.

import type { Page } from '@playwright/test';
import {
  chooseUnit,
  expect,
  openApp,
  openSettings,
  placeAction,
  pickPoint,
  snapshot,
  test,
  waitForTiles,
} from './helpers';

/** The light/dark colours in use (data-theme), the page's background and the browser bar's colour. */
const theme = (page: Page) =>
  page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    background: getComputedStyle(document.body).backgroundColor,
    bar: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
  }));

const LIGHT = { theme: 'light', background: 'rgb(238, 243, 247)', bar: '#0b63ce' };
const DARK = { theme: 'dark', background: 'rgb(17, 26, 36)', bar: '#1b2633' };

test.describe('Settings', () => {
  test(
    'opens from ⚙, fits the screen, and closes',
    { tag: '@layout' },
    async ({ page }, testInfo) => {
      await openApp(page);
      const settings = await openSettings(page);
      await expect(settings.getByRole('group', { name: 'Temperature' })).toBeVisible();
      await expect(settings.getByRole('group', { name: 'Appearance' })).toBeVisible();
      await expect(settings.getByRole('group', { name: 'Language' })).toBeVisible();
      await expect(settings.getByRole('button', { name: 'Clear saved data' })).toBeVisible();
      await snapshot(page, testInfo, 'settings');

      // Fits on the screen; long content scrolls inside it.
      const box = (await settings.boundingBox())!;
      const size = page.viewportSize()!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(size.width);
      expect(box.y + box.height).toBeLessThanOrEqual(size.height);

      await page.keyboard.press('Escape');
      await expect(settings).toBeHidden();
      await openSettings(page);
      await settings.getByRole('button', { name: 'Close' }).click();
      await expect(settings).toBeHidden();
    },
  );

  test('its code loads on the first press; presses meanwhile open it once', async ({ page }) => {
    // A slow download of the dialog's code (loaded on demand).
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/assets/settings-*.js', async (route) => {
      await held;
      await route.continue();
    });
    await openApp(page);
    const gear = page.getByRole('button', { name: 'Settings' });
    await gear.click();
    await gear.click();
    release();
    const settings = page.getByRole('dialog', { name: 'Settings' });
    await expect(settings).toBeVisible();
    await settings.getByRole('button', { name: 'Close' }).click();
    await expect(settings).toBeHidden();
  });

  test('"About Weatherpin" at the bottom opens About instead', async ({ page }) => {
    await openApp(page);
    const settings = await openSettings(page);
    await settings.getByRole('link', { name: 'About Weatherpin' }).click();
    await expect(settings).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'About Weatherpin' })).toBeVisible();
  });

  test.describe('appearance', () => {
    // A light device, unless a test says otherwise (dark-mode projects too).
    test.use({ colorScheme: 'light' });

    test('Automatic follows the device, also when it changes', async ({ page, browserName }) => {
      // Switching the colour scheme of an open page makes Playwright's
      // WebKit trip over our CSP (its own inline style); not the app.
      test.skip(browserName === 'webkit', "Playwright's live switch breaks WebKit's CSP check");
      await openApp(page);
      const settings = await openSettings(page);
      await expect(
        settings
          .getByRole('group', { name: 'Appearance' })
          .getByRole('button', { name: 'Automatic' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(await theme(page)).toEqual(LIGHT);

      // E.g. the phone switches to dark at sunset.
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect.poll(() => theme(page)).toEqual(DARK);
    });

    test(
      'Dark on a light device, kept after a reload',
      { tag: '@layout' },
      async ({ page }, testInfo) => {
        await openApp(page);
        await pickPoint(page);
        const settings = await openSettings(page);
        await settings.getByRole('button', { name: 'Dark' }).click();
        await expect(settings.getByRole('button', { name: 'Dark' })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        expect(await theme(page)).toEqual(DARK);
        await page.keyboard.press('Escape');
        await snapshot(page, testInfo, 'dark chosen');

        await page.goto('/');
        await waitForTiles(page);
        // Still dark, although the device is light.
        expect(await theme(page)).toEqual(DARK);
      },
    );

    test.describe('on a dark device', () => {
      test.use({ colorScheme: 'dark' });

      test('Light, and back to Automatic', async ({ page }) => {
        await openApp(page);
        expect(await theme(page)).toEqual(DARK);
        const settings = await openSettings(page);
        await settings.getByRole('button', { name: 'Light' }).click();
        expect(await theme(page)).toEqual(LIGHT);

        // Back to Automatic: dark again, like the device.
        await settings
          .getByRole('group', { name: 'Appearance' })
          .getByRole('button', { name: 'Automatic' })
          .click();
        expect(await theme(page)).toEqual(DARK);
      });
    });

    test('a saved choice is in place before the page is drawn (no flash)', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      await settings.getByRole('button', { name: 'Dark' }).click();

      // Note the colours the moment <body> appears, before any drawing.
      await page.addInitScript(() => {
        new MutationObserver((_, observer) => {
          if (!document.body) return;
          (window as unknown as { themeAtBody?: string }).themeAtBody =
            document.documentElement.dataset.theme;
          observer.disconnect();
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto('/');
      const atBody = await page.evaluate(
        () => (window as unknown as { themeAtBody?: string }).themeAtBody,
      );
      expect(atBody).toBe('dark');
    });
  });

  test.describe('colours', () => {
    const accent = (page: Page) =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
      );

    test('a colour set, in light and dark, kept and in place before drawing', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      await settings.getByRole('button', { name: 'Light' }).click();
      await expect(settings.getByRole('button', { name: 'Classic' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await settings.getByRole('button', { name: 'Sauna' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-skin', 'sauna');
      await expect(settings.getByRole('button', { name: 'Sauna' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(await accent(page)).toBe('#9a3d12');
      await settings.getByRole('button', { name: 'Dark' }).click();
      expect(await accent(page)).toBe('#ff9b54');

      // Kept, and set before <body> appears (no flash of the classic colours).
      await page.addInitScript(() => {
        new MutationObserver((_, observer) => {
          if (!document.body) return;
          (window as unknown as { skinAtBody?: string }).skinAtBody =
            document.documentElement.dataset.skin;
          observer.disconnect();
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto('/');
      expect(
        await page.evaluate(() => (window as unknown as { skinAtBody?: string }).skinAtBody),
      ).toBe('sauna');

      // Back to Classic: no skin on the page.
      const again = await openSettings(page);
      await again.getByRole('button', { name: 'Classic' }).click();
      await expect(page.locator('html')).not.toHaveAttribute('data-skin', /./);
    });

    test('a damaged saved value gives the classic colours', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('nordic-weather:skin', JSON.stringify('__proto__'));
      });
      await openApp(page);
      await expect(page.locator('html')).not.toHaveAttribute('data-skin', /./);
    });
  });

  test.describe('start place', () => {
    test('shows where the app opens, and removes it', async ({ page }) => {
      await openApp(page);
      let settings = await openSettings(page);
      await expect(settings).toContainText(
        'The app opens at the world map. To change it, open a place and choose Start here in its ⋯ menu.',
      );
      await expect(settings.getByRole('button', { name: 'Remove start place' })).toBeHidden();
      await page.keyboard.press('Escape');

      await page.locator('#search-input').fill('Oslo');
      await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
      await placeAction(page, 'Start here');

      settings = await openSettings(page);
      await expect(settings).toContainText('The app opens at Oslo, Norway.');
      await settings.getByRole('button', { name: 'Remove start place' }).click();
      await expect(settings).toContainText('The app opens at the world map.');
      await expect(settings.getByRole('button', { name: 'Remove start place' })).toBeHidden();
      // The panel behind follows: "Start here" is off again.
      await page.keyboard.press('Escape');
      await expect(page.locator('.panel__start')).toHaveAttribute('aria-pressed', 'false');

      await page.goto('/');
      await waitForTiles(page);
      await expect(page.locator('#panel')).toBeHidden();
    });
  });

  test('"Clear saved data" removes favourites and settings', async ({ page }) => {
    await openApp(page);
    // Save something: °F, dark and a favourite.
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await page.getByRole('button', { name: 'Favourite' }).click();
    await chooseUnit(page, '°F');
    await expect(page.locator('.current__temp')).toHaveText('40 °F');

    const settings = await openSettings(page);
    await settings.getByRole('button', { name: 'Dark' }).click();
    page.once('dialog', (confirmation) => void confirmation.accept());
    const reloaded = page.waitForEvent('load');
    await settings.getByRole('button', { name: 'Clear saved data' }).click();

    // The page starts again, as on a first visit.
    await reloaded;
    await expect(page.locator('#panel')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('');
    // Only today's first point towards the weather level, as on a first visit.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(localStorage).filter((key) => key.startsWith('nordic-weather:')),
        ),
      )
      .toEqual(['nordic-weather:journey']);
    await page.locator('#search-input').focus();
    await expect(page.locator('.search__results')).toBeHidden();
  });

  test.describe('when the browser blocks storage', () => {
    test.use({ colorScheme: 'light' });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage is blocked', 'SecurityError');
          },
        });
      });
    });

    test('hides what needs saving; units and colours still work for this visit', async ({
      page,
    }) => {
      await openApp(page);
      await pickPoint(page);
      const settings = await openSettings(page);
      await expect(settings.getByRole('heading', { name: 'Start place' })).toBeHidden();
      await expect(settings.getByRole('button', { name: 'Clear saved data' })).toBeHidden();

      await settings.getByRole('button', { name: '°F' }).click();
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
      await settings.getByRole('button', { name: 'Dark' }).click();
      expect(await theme(page)).toEqual(DARK);

      // A language needs a reload, so it must be saved: say it couldn't.
      await settings.getByRole('button', { name: 'Suomi' }).click();
      await expect(settings.getByRole('status')).toHaveText(
        "This browser didn't let the app save it.",
      );
    });
  });
});
