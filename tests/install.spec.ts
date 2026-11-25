// "Add to home screen" in Settings (src/settings.ts, src/install-prompt.ts):
// the browser's own install dialog where there is one (Chromium's
// beforeinstallprompt, faked here), else how to do it from the browser's
// menu (iPhone/iPad, Firefox, others), and nothing to do once installed.

import type { Page } from '@playwright/test';
import { expect, openApp, openSettings, test } from './helpers';

const installButton = (settings: ReturnType<Page['locator']>) =>
  settings.getByRole('button', { name: 'Add to home screen' });

/** A fake beforeinstallprompt whose dialog answers `outcome`. */
async function offerInstall(page: Page, outcome: 'accepted' | 'dismissed') {
  await page.evaluate((answer) => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: () => {
        (window as unknown as { prompted: number }).prompted =
          ((window as unknown as { prompted?: number }).prompted ?? 0) + 1;
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: answer }),
    });
    window.dispatchEvent(event);
  }, outcome);
}

const prompted = (page: Page) =>
  page.evaluate(() => (window as unknown as { prompted?: number }).prompted ?? 0);

/** Pretends to be another browser (before the page loads). */
async function userAgent(page: Page, agent: string, touchPoints = 0) {
  await page.addInitScript(
    ([ua, touch]) => {
      Object.defineProperty(navigator, 'userAgent', { get: () => ua });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => touch });
    },
    [agent, touchPoints] as const,
  );
}

test.describe('add to home screen', () => {
  test("the browser's own install dialog, accepted", async ({ page }) => {
    await openApp(page);
    await offerInstall(page, 'accepted');
    const settings = await openSettings(page);
    await installButton(settings).click();
    expect(await prompted(page)).toBe(1);
    await expect(settings.getByText('Added to the home screen.')).toBeVisible();
    await expect(installButton(settings)).toBeHidden();
  });

  test('dismissed: the button stays, then shows how to do it by hand', async ({ page }) => {
    await openApp(page);
    await offerInstall(page, 'dismissed');
    const settings = await openSettings(page);
    await installButton(settings).click();
    expect(await prompted(page)).toBe(1);
    await expect(installButton(settings)).toBeVisible();
    await expect(settings.getByText('Added to the home screen.')).toBeHidden();
    // A browser's prompt works once: the next press explains instead.
    await installButton(settings).click();
    expect(await prompted(page)).toBe(1);
    await expect(settings.locator('.settings__install-hint')).toBeVisible();
  });

  test('no install dialog offered: the browser menu way', async ({ page }) => {
    await openApp(page);
    const settings = await openSettings(page);
    await installButton(settings).click();
    await expect(settings.locator('.settings__install-hint')).toHaveText(
      /Open your browser's menu and choose Install app or Add to Home screen\.|Tap the Share button/,
    );
  });

  test.describe('on an iPhone', () => {
    test.beforeEach(async ({ page }) => {
      await userAgent(
        page,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        5,
      );
    });

    test('Share, then Add to Home Screen', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      await installButton(settings).click();
      await expect(settings.locator('.settings__install-hint')).toHaveText(
        'Tap the Share button (a square with an arrow), then Add to Home Screen.',
      );
    });
  });

  test.describe('in Firefox', () => {
    test.beforeEach(async ({ page }) => {
      await userAgent(page, 'Mozilla/5.0 (Android 15; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0');
    });

    test('the ⋮ menu, then Install', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      await installButton(settings).click();
      await expect(settings.locator('.settings__install-hint')).toHaveText(
        'Open the browser menu (⋮), then choose Install.',
      );
    });
  });

  test.describe('opened from the home screen', () => {
    test.beforeEach(async ({ page }) => {
      // As iPhone Safari says for an app opened from its icon.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'standalone', { get: () => true });
      });
    });

    test('says so, no button', async ({ page }) => {
      await openApp(page);
      const settings = await openSettings(page);
      await expect(settings.getByText('Added to the home screen.')).toBeVisible();
      await expect(installButton(settings)).toBeHidden();
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Lisää aloitusnäytölle"', async ({ page }) => {
      await openApp(page);
      await page.getByRole('button', { name: 'Asetukset' }).click();
      const settings = page.getByRole('dialog', { name: 'Asetukset' });
      await expect(settings.getByRole('heading', { name: 'Sovellus' })).toBeVisible();
      await expect(settings.getByRole('button', { name: 'Lisää aloitusnäytölle' })).toBeVisible();
    });
  });
});
