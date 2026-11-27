// The weather symbols layer (src/layer/weather-layer.ts): the button above
// the radar button shows the weather at the bigger cities in view, now,
// tonight or tomorrow (the time bar), in one request for all of them
// (fixtures/weather-layer.ts: tonight 6° colder, tomorrow 3° warmer than
// now); a badge opens that city's weather; kept; hidden during the quiz.

import type { Page } from '@playwright/test';
import { expect, openApp, overlappingPairs, test, visibleBoxes, waitForMapStill } from './helpers';

const button = (page: Page) => page.locator('#layer-button');
const bar = (page: Page) => page.getByRole('group', { name: 'Weather symbols' });
const badges = (page: Page) => page.locator('.weather-badge');

/** Requests for the layer's many places, counted. */
function countRequests(page: Page): () => number {
  let count = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.searchParams.get('hourly') === 'temperature_2m,weather_code,is_day') count++;
  });
  return () => count;
}

async function turnOn(page: Page) {
  await button(page).click();
  await expect(button(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(badges(page).first()).toBeVisible();
}

/** Each badge's temperature, in screen order (left to right, top to bottom). */
async function temperatures(page: Page): Promise<string[]> {
  return badges(page).locator('.weather-badge__temp').allTextContents();
}

test.describe('weather symbols layer', () => {
  test('off at first; on: the bigger cities in view, apart, in one request', async ({ page }) => {
    const requests = countRequests(page);
    await openApp(page);
    await expect(button(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(badges(page)).toHaveCount(0);
    await expect(bar(page)).toBeHidden();

    await turnOn(page);
    const count = await badges(page).count();
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(24);
    expect(requests()).toBe(1);
    // The world's biggest city is among them (the list is biggest first).
    await expect(page.locator('.weather-badge__name', { hasText: /^Shanghai$/ })).toBeVisible();
    // No badge on top of another.
    const boxes = await badges(page)
      .locator('.weather-badge__box')
      .evaluateAll((elements) =>
        elements.map((element, i) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { name: String(i), x, y, width, height };
        }),
      );
    expect(overlappingPairs(boxes)).toEqual([]);
    // Each badge says what it is.
    await expect(badges(page).first()).toHaveAttribute('aria-label', /^.+: .+, -?\d+ °C$/);
    await expect(bar(page)).toBeVisible();
    await expect(bar(page).getByRole('button', { name: 'Now' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('tonight and tomorrow', async ({ page }) => {
    await openApp(page);
    await turnOn(page);
    const now = await temperatures(page);
    await bar(page).getByRole('button', { name: 'Tonight' }).click();
    await expect(bar(page).getByRole('button', { name: 'Tonight' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(() => temperatures(page)).not.toEqual(now);
    const tonight = await temperatures(page);
    expect(tonight.map((t) => parseInt(t.replace('−', '-'), 10))).toEqual(
      now.map((t) => parseInt(t.replace('−', '-'), 10) - 6),
    );
    await bar(page).getByRole('button', { name: 'Tomorrow' }).click();
    await expect
      .poll(async () => (await temperatures(page)).map((t) => parseInt(t, 10)))
      .toEqual(now.map((t) => parseInt(t, 10) + 3));
  });

  test("a badge opens that city's weather", async ({ page }) => {
    await openApp(page);
    await turnOn(page);
    const name = (await badges(page).first().locator('.weather-badge__name').textContent())!;
    await badges(page).first().click();
    await expect(page.locator('.panel__title')).toContainText(name);
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test('kept for next time, and turned off', async ({ page }) => {
    await openApp(page);
    await turnOn(page);
    await bar(page).getByRole('button', { name: 'Tomorrow' }).click();
    await page.goto('/');
    await expect(button(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(badges(page).first()).toBeVisible();
    await expect(bar(page).getByRole('button', { name: 'Tomorrow' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await button(page).click();
    await expect(button(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(badges(page)).toHaveCount(0);
    await expect(bar(page)).toBeHidden();
    const saved = await page.evaluate(() => localStorage.getItem('nordic-weather:weather-layer'));
    expect(JSON.parse(saved!)).toEqual({ version: 1, on: false, time: 'tomorrow' });
  });

  test('back to an earlier view: nothing asked again', async ({ page }) => {
    const requests = countRequests(page);
    await openApp(page);
    await turnOn(page);
    expect(requests()).toBe(1);
    const first = await badges(page).locator('.weather-badge__name').allTextContents();
    await page.locator('.leaflet-control-zoom-in').click();
    await waitForMapStill(page);
    await expect.poll(requests).toBe(2);
    await page.locator('.leaflet-control-zoom-out').click();
    await waitForMapStill(page);
    await expect
      .poll(async () =>
        (await badges(page).locator('.weather-badge__name').allTextContents()).sort(),
      )
      .toEqual([...first].sort());
    expect(requests()).toBe(2);
  });

  test('hidden while the quiz is open', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nordic-weather:weather-layer',
        JSON.stringify({ version: 1, on: true, time: 'now' }),
      );
    });
    await page.goto('/#quiz');
    const quiz = page.getByRole('dialog', { name: 'Temperature quiz' });
    await expect(quiz).toBeVisible();
    await expect(button(page)).toHaveAttribute('aria-pressed', 'true');
    // Give the layer time to show if it were going to.
    await page.waitForTimeout(800);
    await expect(badges(page)).toHaveCount(0);
    await expect(bar(page)).toBeHidden();
    await quiz.getByRole('button', { name: 'Close' }).click();
    await expect(badges(page).first()).toBeVisible();
  });

  test('a failure says so', async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('hourly') !== 'temperature_2m,weather_code,is_day') {
        return route.fallback();
      }
      return route.fulfill({ status: 500, json: { error: true, reason: 'Test' } });
    });
    await openApp(page);
    await button(page).click();
    await expect(bar(page)).toContainText(
      "Couldn't load the weather symbols. Move the map to try again.",
    );
    await expect(badges(page)).toHaveCount(0);
  });

  test.describe('in °F', () => {
    test.use({ locale: 'en-US' });

    test('temperatures in °F', async ({ page }) => {
      await openApp(page);
      await turnOn(page);
      await expect(badges(page).first()).toHaveAttribute('aria-label', /, -?\d+ °F$/);
    });
  });

  test(
    'with the radar on too: the bars apart, nothing overlapping',
    { tag: '@layout' },
    async ({ page }) => {
      await openApp(page);
      await page.getByRole('button', { name: 'Rain radar' }).click();
      await expect(page.locator('.radar-bar')).toBeVisible();
      await turnOn(page);
      const boxes = await visibleBoxes(page, {
        'weather bar': '.weather-bar',
        'radar bar': '.radar-bar',
        'weather symbols button': '#layer-button',
        'rain radar button': '#radar-button',
        'location button': '#locate-button',
        attribution: '.leaflet-control-attribution',
      });
      expect(overlappingPairs(boxes)).toEqual([]);
      for (const time of await bar(page).getByRole('button').all()) {
        expect((await time.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    },
  );

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Sääsymbolit"', async ({ page }) => {
      await openApp(page);
      await page.getByRole('button', { name: 'Sääsymbolit' }).click();
      const finnishBar = page.getByRole('group', { name: 'Sääsymbolit' });
      await expect(finnishBar.getByRole('button', { name: 'Nyt' })).toBeVisible();
      await expect(finnishBar.getByRole('button', { name: 'Tänä yönä' })).toBeVisible();
      await expect(finnishBar.getByRole('button', { name: 'Huomenna' })).toBeVisible();
      await expect(badges(page).first()).toBeVisible();
    });
  });
});
