// The About dialog: opened from "About" in the map credits (or the bottom
// of Settings), lists the data sources and privacy facts, and closes with
// Escape or the × button. ("Clear saved data" is in settings.spec.ts.)

import type { Page } from '@playwright/test';
import { expect, openApp, snapshot, test } from './helpers';

const about = (page: Page) => page.getByRole('dialog', { name: 'About Weatherpin' });

test.describe('About dialog', () => {
  test('opens from the map credits, and closes', { tag: '@layout' }, async ({ page }, testInfo) => {
    await openApp(page);
    await expect(about(page)).toBeHidden();
    await page.locator('.leaflet-control-attribution').getByRole('link', { name: 'About' }).click();
    await expect(about(page)).toBeVisible();
    await expect(about(page)).toContainText('Open-Meteo.com');
    await expect(about(page)).toContainText('OpenStreetMap');
    await expect(about(page)).toContainText('Environment and Climate Change Canada');
    await expect(about(page)).toContainText('No account, no cookies and no tracking');
    await expect(about(page)).toContainText('Use at your own risk');
    // The excuses and small talk are jokes, not advice.
    await expect(about(page)).toContainText('Weather excuses and small talk are for fun.');
    await snapshot(page, testInfo, 'about');

    // Fits on the screen; long content scrolls inside it.
    const box = (await about(page).boundingBox())!;
    const size = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);

    await page.keyboard.press('Escape');
    await expect(about(page)).toBeHidden();

    await page.locator('.leaflet-control-attribution').getByRole('link', { name: 'About' }).click();
    await about(page).getByRole('button', { name: 'Close' }).click();
    await expect(about(page)).toBeHidden();
  });

  test('a link to #about opens it', async ({ page }) => {
    await page.goto('/#about');
    await expect(about(page)).toBeVisible();
  });

  test('has no personal details: no accounts, emails or code links', async ({ page }) => {
    await openApp(page);
    const html = await page.locator('#about').evaluate((dialog) => dialog.outerHTML);
    // (Environment Canada's licence page lives on eccc-msc.github.io: fine.)
    expect(html).not.toMatch(/github\.com|gitlab|@|mailto:/i);
  });
});
