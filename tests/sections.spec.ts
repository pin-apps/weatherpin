// Folding panel sections away (src/render/fold.ts): a tap on a section's
// heading hides it, the device remembers it for every place. On a first
// visit Air quality, Sky and More details start folded, with a short
// summary in the heading. These tests keep the app's own defaults
// (`sectionsOpen: false`); the other specs start with every section open.

import type { Page } from '@playwright/test';
import { expect, openSettings, test } from './helpers';

test.use({ sectionsOpen: false });

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';
const HELSINKI = '/#at=60.17,24.94&name=Helsinki,+Finland';

const fold = (page: Page, name: string) =>
  page.locator('.section-title .fold').filter({ hasText: name });

const sectionOf = (page: Page, name: string) =>
  page.locator('.panel__body section').filter({ has: fold(page, name) });

async function open(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  // The air quality summary arrives with its data.
  await expect(fold(page, 'Air quality').locator('.aqi')).toBeVisible();
}

test.describe('foldable sections', () => {
  test('first visit: the forecasts open, the rest folded with a summary', async ({ page }) => {
    await open(page);

    for (const name of ['Next 24 hours', '7 days']) {
      await expect(fold(page, name)).toHaveAttribute('aria-expanded', 'true');
      await expect(fold(page, name).locator('.fold__summary')).toBeHidden();
    }
    await expect(page.locator('.daily')).toBeVisible();

    for (const name of ['Air quality', 'Sky', 'More details']) {
      await expect(fold(page, name)).toHaveAttribute('aria-expanded', 'false');
    }
    // Folded: the rows are hidden, the heading says the gist.
    await expect(sectionOf(page, 'Air quality').locator('.details').first()).toBeHidden();
    await expect(fold(page, 'Air quality').locator('.fold__summary')).toHaveText(/^30\s*Fair$/);
    await expect(fold(page, 'Sky').locator('.fold__summary')).toHaveText('Sunset 15:40');
    await expect(sectionOf(page, 'More details').locator('.details')).toBeHidden();
    // The air quality badge at the top stays.
    await expect(page.locator('.glance-aqi .aqi')).toBeVisible();
  });

  test('a tap opens and folds a section', async ({ page }) => {
    await open(page);
    await fold(page, 'Air quality').click();
    await expect(fold(page, 'Air quality')).toHaveAttribute('aria-expanded', 'true');
    await expect(sectionOf(page, 'Air quality').locator('.details').first()).toBeVisible();
    // Open, the summary goes: the full badge is right below.
    await expect(fold(page, 'Air quality').locator('.fold__summary')).toBeHidden();

    await fold(page, '7 days').click();
    await expect(fold(page, '7 days')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.daily')).toBeHidden();
  });

  test('works with the keyboard', async ({ page }) => {
    await open(page);
    await fold(page, 'More details').focus();
    await page.keyboard.press('Enter');
    await expect(fold(page, 'More details')).toHaveAttribute('aria-expanded', 'true');
    await expect(sectionOf(page, 'More details').locator('.details')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(fold(page, 'More details')).toHaveAttribute('aria-expanded', 'false');
  });

  test('remembered on the device, for every place', async ({ page }) => {
    await open(page);
    await fold(page, 'More details').click();
    await fold(page, 'Next 24 hours').click();
    await expect(fold(page, 'Next 24 hours')).toHaveAttribute('aria-expanded', 'false');

    // Another place, then the app opened again.
    await open(page, HELSINKI);
    await expect(fold(page, 'More details')).toHaveAttribute('aria-expanded', 'true');
    await expect(fold(page, 'Next 24 hours')).toHaveAttribute('aria-expanded', 'false');
    await page.goto('/');
    await open(page);
    await expect(fold(page, 'More details')).toHaveAttribute('aria-expanded', 'true');
    await expect(fold(page, 'Next 24 hours')).toHaveAttribute('aria-expanded', 'false');
    await expect(fold(page, 'Sky')).toHaveAttribute('aria-expanded', 'false');
  });

  test('"Clear saved data" brings back the defaults', async ({ page }) => {
    await open(page);
    await fold(page, 'Sky').click();
    await expect(fold(page, 'Sky')).toHaveAttribute('aria-expanded', 'true');

    const settings = await openSettings(page);
    page.once('dialog', (confirmation) => void confirmation.accept());
    const reloaded = page.waitForEvent('load');
    await settings.getByRole('button', { name: 'Clear saved data' }).click();
    await reloaded;

    await open(page);
    await expect(fold(page, 'Sky')).toHaveAttribute('aria-expanded', 'false');
  });

  test(
    'headings are easy to tap and stay inside the panel',
    { tag: '@layout' },
    async ({ page }) => {
      await open(page);
      for (const button of await page.locator('.section-title .fold').all()) {
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        const panel = await page.locator('.panel__body').boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(panel!.x - 1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(panel!.x + panel!.width + 1);
      }
    },
  );

  test.describe('when the browser blocks storage', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage is blocked', 'SecurityError');
          },
        });
      });
    });

    test('the defaults, and folding still works for this visit', async ({ page }) => {
      await open(page);
      await expect(fold(page, 'Sky')).toHaveAttribute('aria-expanded', 'false');
      await fold(page, 'Sky').click();
      await expect(fold(page, 'Sky')).toHaveAttribute('aria-expanded', 'true');
      await expect(sectionOf(page, 'Sky').locator('.sky__list')).toBeVisible();
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('headings and summaries in Finnish', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(fold(page, 'Ilmanlaatu').locator('.aqi')).toBeVisible();
      await expect(fold(page, 'Taivas').locator('.fold__summary')).toHaveText(
        'Auringonlasku 15:40',
      );
    });
  });
});
