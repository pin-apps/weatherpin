// "Updated 14:05" and the refresh of weather left open: when the app comes
// back (page shown again) or stays open, weather 15 minutes old is fetched
// again, quietly: no loading state, same scroll position and open day.
//
// The test clock runs from 14:05 (Oslo time). A jump in time plus the
// "page shown again" event stands in for a phone that was put away.

import type { Page } from '@playwright/test';
import { expect, FIXED_NOW, openApp, pickPoint, test } from './helpers';

const MINUTE = 60 * 1000;

/** Counts the app's forecast requests from now on. */
function countForecastRequests(page: Page) {
  const count = { value: 0 };
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/v1/forecast')) count.value++;
  });
  return count;
}

/** The phone comes back `minutes` after the test's start time. */
async function comeBackAfter(page: Page, minutes: number) {
  await page.clock.setSystemTime(new Date(FIXED_NOW.getTime() + minutes * MINUTE));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
}

test.describe('updated time and refresh', () => {
  test('shows when the weather was fetched', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');
  });

  test('weather 15 minutes old is fetched again, in place', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');
    // An open day and a scrolled panel stay as they are.
    const day = page.locator('.daily__row').nth(2);
    await day.click();
    await expect(day).toHaveAttribute('aria-expanded', 'true');
    const body = page.locator('.panel__body');
    await body.evaluate((element) => (element.scrollTop = 200));
    const scrolled = await body.evaluate((element) => element.scrollTop);

    const requests = countForecastRequests(page);
    await comeBackAfter(page, 10);
    // Not yet: 10 minutes is fresh enough.
    await page.waitForTimeout(300);
    expect(requests.value).toBe(0);

    await comeBackAfter(page, 16);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:21');
    expect(requests.value).toBe(1);
    await expect(page.locator('.panel__status')).toHaveCount(0);
    await expect(page.locator('.daily__row').nth(2)).toHaveAttribute('aria-expanded', 'true');
    expect(await body.evaluate((element) => element.scrollTop)).toBe(scrolled);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('#panel-title')).not.toBeEmpty();
  });

  test('a failed refresh keeps the weather shown', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');

    // From now on the service answers with something unusable.
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) =>
      route.fulfill({ json: {} }),
    );
    await comeBackAfter(page, 30);
    await page.waitForTimeout(500);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('.panel__error')).toHaveCount(0);
    // Its time tells how old it is.
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');
  });

  test('a closed panel fetches nothing', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    const requests = countForecastRequests(page);
    await comeBackAfter(page, 60);
    await page.waitForTimeout(300);
    expect(requests.value).toBe(0);
  });
});
