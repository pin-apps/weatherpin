// Without a connection: the weather saved last time (weather/saved.ts),
// marked "No connection", and the newest again once the connection is back.
//
// The test clock runs from 14:05 (Oslo time).

import { expect, FIXED_NOW, goOffline, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo';
const SYDNEY = '/#at=-33.87,151.21&name=Sydney';
const MINUTE = 60 * 1000;

test.describe('saved weather', () => {
  test('shown without a connection, and says so; newest again once back', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');

    const reconnect = await goOffline(page);
    await page.reload();
    await expect(page.locator('.current__temp')).toHaveText('5 °C');
    const updated = page.locator('.current__updated');
    await expect(updated).toHaveText('No connection · weather from 14:05');
    await expect(updated).toHaveClass(/current__updated--offline/);

    // The connection is back: the newest weather, without waiting.
    await reconnect();
    await page.clock.setSystemTime(new Date(FIXED_NOW.getTime() + 20 * MINUTE));
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(updated).toHaveText('Updated 14:25');
    await expect(updated).not.toHaveClass(/current__updated--offline/);
  });

  test('weather from another day names the day', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');

    await goOffline(page);
    // The next day at 09:00, Oslo time.
    await page.clock.setSystemTime(new Date('2026-11-16T08:00:00Z'));
    await page.reload();
    await expect(page.locator('.current__updated')).toHaveText(
      'No connection · weather from Sun 14:05',
    );
  });

  test('the connection lost while open: the refresh says so', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');

    await goOffline(page);
    // The phone comes back half an hour later; the refresh can't connect.
    await page.clock.setSystemTime(new Date(FIXED_NOW.getTime() + 30 * MINUTE));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.locator('.current__updated')).toHaveText(
      'No connection · weather from 14:05',
    );
  });

  test('a place never seen before can only say there is no connection', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();

    await goOffline(page);
    await page.goto(SYDNEY);
    await expect(page.locator('.panel__error')).toContainText(
      'Could not reach the weather service',
    );
  });

  test('"Clear saved data" removes it', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    const saved = () =>
      page.evaluate(() => localStorage.getItem('nordic-weather:saved-forecasts') !== null);
    expect(await saved()).toBe(true);

    await page.locator('#settings-button').click();
    page.once('dialog', (confirmation) => void confirmation.accept());
    const reloaded = page.waitForEvent('load');
    await page.getByRole('button', { name: 'Clear saved data' }).click();
    await reloaded;
    expect(await saved()).toBe(false);
  });
});
