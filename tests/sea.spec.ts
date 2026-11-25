// The Sea section (Open-Meteo Marine API): waves, swell, the highest waves
// in the next 24 hours, sea temperature. Only where there's sea data; the
// fake API answers "inland" (all null) unless a test asks for the sea.

import type { Page } from '@playwright/test';
import { chooseUnit, expect, openApp, pickPoint, snapshot, test } from './helpers';

const sea = (page: Page) => page.getByRole('region', { name: 'Sea', exact: true });
const row = (page: Page, label: string) =>
  sea(page)
    .locator('.details__row', { has: page.locator('dt', { hasText: label }) })
    .locator('dd');

test.describe('sea weather', () => {
  test.describe('at sea', () => {
    test.use({ marineMode: 'sea' });

    test('shows waves, swell, the highest waves and sea temperature', async ({
      page,
    }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      await expect(sea(page)).toBeVisible();
      await expect(row(page, 'Waves')).toHaveText('1.2 m from SW ↑ · every 6 s');
      await expect(row(page, 'Swell')).toHaveText('0.8 m');
      // This morning's 3.0 m is past; tomorrow's 2.8 m is more than 24 h away.
      await expect(row(page, 'Highest in 24 h')).toHaveText('2.4 m around 21:00');
      await expect(row(page, 'Sea temperature')).toHaveText('8 °C');
      // Right after the 7 days.
      const after7Days = await page
        .locator('.sea')
        .evaluate((section) => section.previousElementSibling?.querySelector('.daily') !== null);
      expect(after7Days).toBe(true);
      await sea(page).scrollIntoViewIfNeeded();
      await snapshot(page, testInfo, 'sea');
    });

    test('follows the units, and stays on a unit switch', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(row(page, 'Swell')).toHaveText('0.8 m');
      await chooseUnit(page, '°F');
      await expect(row(page, 'Waves')).toContainText('3.9 ft');
      await expect(row(page, 'Sea temperature')).toHaveText('47 °F');
    });

    test('rows fit their width', { tag: '@layout' }, async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(sea(page)).toBeVisible();
      const problems = await page.locator('.sea .details__row').evaluateAll((rows) =>
        rows.flatMap((element) => {
          const box = element.getBoundingClientRect();
          return [...element.children]
            .map((child) => child.getBoundingClientRect())
            .filter((rect) => rect.left < box.left - 0.5 || rect.right > box.right + 0.5)
            .map(() => `${element.textContent} sticks out`);
        }),
      );
      expect(problems).toEqual([]);
    });
  });

  test('inland there is no Sea section', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('.air-quality > .aqi')).toBeVisible();
    await expect(page.locator('.sea')).toHaveCount(0);
  });

  test.describe('when the sea service fails', () => {
    test.use({ marineMode: 'server-error' });

    test('the rest of the weather shows', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toBeVisible();
      await expect(page.locator('.air-quality > .aqi')).toBeVisible();
      await expect(page.locator('.sea')).toHaveCount(0);
    });
  });
});
