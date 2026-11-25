// "Weather on a day" in the ⋯ menu (src/past-weather.ts): the weather at
// the place shown on a past day, from Open-Meteo's archive (faked in
// helpers.ts: a clear day, high −8.2 °C, low −15.4 °C, whatever the date).
// Today in the tests is 15 Nov 2026 (high 6 °C, low −1 °C). Dates match
// with or without a comma after the weekday ("Tuesday, 15 November"),
// which depends on the browser's language data.

import type { Page, Request } from '@playwright/test';
import {
  chooseUnit,
  expect,
  isMobileLayout,
  openApp,
  pickPoint,
  placeAction,
  snapshot,
  test,
} from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Weather on a day' });

/** Opens a place and the dialog; returns the archive requests made from then on. */
async function openDialog(page: Page, link = OSLO): Promise<URL[]> {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  const requests: URL[] = [];
  page.on('request', (request: Request) => {
    const url = new URL(request.url());
    if (url.hostname === 'archive-api.open-meteo.com') requests.push(url);
  });
  await placeAction(page, 'Weather on a day…');
  await expect(dialog(page)).toBeVisible();
  return requests;
}

test.describe('weather on a day', () => {
  test('"10 years ago": that day, in metric from the archive, against today', async ({ page }) => {
    const requests = await openDialog(page);
    await expect(dialog(page)).toContainText('Oslo, Norway');
    await dialog(page).getByRole('button', { name: '10 years ago' }).click();

    const result = dialog(page).locator('.past-weather__result');
    await expect(result).toContainText(/Tuesday,? 15 November 2016/);
    await expect(result).toContainText('Clear sky · high -8 °C · low -15 °C');
    await expect(result).toContainText('No rain or snow');
    await expect(result).toContainText('7 h of sunshine');
    await expect(result).toContainText('Today: 6 °C / -1 °C, 14° warmer');
    await expect(dialog(page).getByText(/Estimated from weather records/)).toBeVisible();

    expect(requests).toHaveLength(1);
    const params = requests[0].searchParams;
    expect(params.get('start_date')).toBe('2016-11-15');
    expect(params.get('end_date')).toBe('2016-11-15');
    expect(params.get('latitude')).toBe('59.91');
    expect(params.get('longitude')).toBe('10.75');
    expect(params.get('timezone')).toBe('auto');
    expect(params.get('temperature_unit')).toBe('celsius');
    expect(params.get('wind_speed_unit')).toBe('ms');
    expect(params.get('precipitation_unit')).toBe('mm');
  });

  test('any day from 1940 to a week ago', async ({ page }) => {
    const requests = await openDialog(page);
    const field = dialog(page).getByLabel('Any day');
    await expect(field).toHaveAttribute('min', '1940-01-01');
    await expect(field).toHaveAttribute('max', '2026-11-09');

    await field.fill('1987-03-14');
    await dialog(page).getByRole('button', { name: 'Show' }).click();
    await expect(dialog(page).locator('.past-weather__result')).toContainText(
      /Saturday,? 14 March 1987/,
    );
    expect(requests.map((url) => url.searchParams.get('start_date'))).toEqual(['1987-03-14']);

    // Before 1940: not asked for (proved by waiting a moment).
    await field.fill('1939-12-31');
    await dialog(page).getByRole('button', { name: 'Show' }).click();
    await page.waitForTimeout(500);
    expect(requests).toHaveLength(1);
  });

  test('in °F', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    await chooseUnit(page, '°F');
    await placeAction(page, 'Weather on a day…');
    await dialog(page).getByRole('button', { name: '1 year ago' }).click();
    const result = dialog(page).locator('.past-weather__result');
    await expect(result).toContainText(/Saturday,? 15 November 2025/);
    await expect(result).toContainText('high 17 °F · low 4 °F');
    await expect(result).toContainText('Today: 43 °F / 30 °F, 26° warmer');
  });

  test('says so when the archive sends nothing usable', async ({ page }) => {
    await page.route('https://archive-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: { error: true } }),
    );
    await openDialog(page);
    await dialog(page).getByRole('button', { name: '50 years ago' }).click();
    await expect(dialog(page).locator('.past-weather__result')).toHaveText(
      "Couldn't get the weather for that day. Try again.",
    );
    await expect(dialog(page).getByText(/Estimated from weather records/)).toBeHidden();
  });

  test('closes with Escape or ×, back to ⋯; the weather stays', async ({ page }) => {
    await openDialog(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#panel')).toBeVisible();
    await expect(page.getByRole('button', { name: 'More actions' })).toBeFocused();

    await placeAction(page, 'Weather on a day…');
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test('saves nothing on the device', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    const keys = () => page.evaluate(() => Object.keys(localStorage).sort());
    const before = await keys();
    await placeAction(page, 'Weather on a day…');
    await dialog(page).getByRole('button', { name: '10 years ago' }).click();
    await expect(dialog(page).locator('.past-weather__result')).toContainText('2016');
    expect(await keys()).toEqual(before);
  });

  test('fits on the screen with a result', { tag: '@layout' }, async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Weather on a day…');
    await dialog(page).getByRole('button', { name: '10 years ago' }).click();
    await expect(dialog(page).locator('.past-weather__today')).toBeVisible();
    await snapshot(page, testInfo, 'weather on a day');

    const viewport = page.viewportSize()!;
    const box = (await dialog(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    // Each control big enough to tap.
    for (const control of await dialog(page).locator('button, input').all()) {
      const size = (await control.boundingBox())!;
      expect(size.height).toBeGreaterThanOrEqual(isMobileLayout(page) ? 44 : 40);
    }
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('menu, buttons and the day in Finnish', async ({ page }) => {
      await page.goto('/#at=60.17,24.94&name=Helsinki,+Suomi');
      await expect(page.locator('.current__temp')).toBeVisible();
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.getByRole('button', { name: 'Sää tiettynä päivänä…' }).click();
      const finnish = page.getByRole('dialog', { name: 'Sää tiettynä päivänä' });
      await finnish.getByRole('button', { name: 'Vuosi sitten' }).click();
      const result = finnish.locator('.past-weather__result');
      await expect(result).toContainText('15. marraskuuta 2025');
      await expect(result).toContainText('ylin -8 °C');
      await expect(result).toContainText('Tänään: 6 °C / -1 °C, 14° lämpimämpää');
    });
  });
});
