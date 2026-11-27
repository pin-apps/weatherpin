// The weather symbols layer (src/layer/weather-layer.ts): picked in the map
// layers menu (the button by My location; the rain radar or this, one at a
// time), it shows the weather at the bigger cities in view, now,
// tonight or tomorrow (the time bar), in one request for all of them
// (fixtures/weather-layer.ts: tonight 6° colder, tomorrow 3° warmer than
// now); a badge opens that city's weather; kept; hidden during the quiz.

import type { Page } from '@playwright/test';
import {
  chooseLayer,
  expect,
  openApp,
  overlappingPairs,
  test,
  visibleBoxes,
  waitForMapStill,
} from './helpers';

// The menu item (hidden while the layers menu is closed).
const button = (page: Page) => page.locator('#layer-button');
const layersButton = (page: Page) => page.locator('#layers-button');
const bar = (page: Page) => page.getByRole('group', { name: 'Weather symbols' });
const badges = (page: Page) => page.locator('.weather-badge');

/** Requests for the layer's many places, counted. */
function countRequests(page: Page): () => number {
  let count = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.searchParams.get('hourly') === 'temperature_2m,weather_code') count++;
  });
  return () => count;
}

async function turnOn(page: Page) {
  await chooseLayer(page, 'Weather symbols');
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
    expect(count).toBeLessThanOrEqual(12);
    expect(requests()).toBe(1);
    // Every badge has a city's name.
    for (const name of await badges(page).locator('.weather-badge__name').allTextContents()) {
      expect(name.length).toBeGreaterThan(1);
    }
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
    // Each badge says what it is, in words too.
    await expect(badges(page).first()).toHaveAccessibleName(/\(.+: .+, -?\d+ °C\)$/);
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
    await chooseLayer(page, 'Weather symbols');
    await expect(button(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(layersButton(page)).not.toHaveClass(/is-on/);
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

  test('remembered across visits: reopening asks for nothing', async ({ page }) => {
    const requests = countRequests(page);
    await openApp(page);
    await turnOn(page);
    expect(requests()).toBe(1);
    const temps = await temperatures(page);
    await page.goto('/');
    await expect(badges(page).first()).toBeVisible();
    expect(await temperatures(page)).toEqual(temps);
    expect(requests()).toBe(1);
    // Only temperature and weather code, 2 days: a lean request.
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nordic-weather:weather-layer-cache')!),
    );
    expect(saved.version).toBe(1);
    expect(Object.keys(saved.places).length).toBeGreaterThanOrEqual(4);
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
      if (url.searchParams.get('hourly') !== 'temperature_2m,weather_code') {
        return route.fallback();
      }
      // A broken answer (an HTTP error would log a console error).
      return route.fulfill({ contentType: 'application/json', body: 'not json' });
    });
    await openApp(page);
    await chooseLayer(page, 'Weather symbols');
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
      await expect(badges(page).first()).toHaveAccessibleName(/, -?\d+ °F\)$/);
    });
  });

  test('the layers menu: one at a time; Escape and a click elsewhere close it', async ({
    page,
  }) => {
    await openApp(page);
    const menu = page.locator('#layers-menu');
    await layersButton(page).click();
    await expect(layersButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('button', { name: 'Rain radar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(layersButton(page)).toBeFocused();
    await layersButton(page).click();
    await page.locator('.search__input').click();
    await expect(menu).toBeHidden();

    // The radar, then the weather symbols: the radar goes off.
    await chooseLayer(page, 'Rain radar');
    await expect(menu).toBeHidden();
    await expect(layersButton(page)).toHaveClass(/is-on/);
    await expect(page.locator('.radar-bar')).toBeVisible();
    await chooseLayer(page, 'Weather symbols');
    await expect(badges(page).first()).toBeVisible();
    await expect(page.locator('#radar-button')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.radar-bar')).toBeHidden();
    // And back.
    await chooseLayer(page, 'Rain radar');
    await expect(button(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(badges(page)).toHaveCount(0);
    await expect(layersButton(page)).toHaveClass(/is-on/);
  });

  test('the menu fits beside the button', { tag: '@layout' }, async ({ page }) => {
    await openApp(page);
    await layersButton(page).click();
    const boxes = await visibleBoxes(page, {
      'layers menu': '#layers-menu',
      'map layers button': '#layers-button',
      'location button': '#locate-button',
      attribution: '.leaflet-control-attribution',
      'search box': '.search__input',
    });
    expect(overlappingPairs(boxes)).toEqual([]);
    const viewport = page.viewportSize()!;
    const menuBox = boxes.find((box) => box.name === 'layers menu')!;
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height);
    for (const item of await page.locator('#layers-menu button').all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Sääsymbolit"', async ({ page }) => {
      await openApp(page);
      await page.getByRole('button', { name: 'Karttatasot' }).click();
      await page.getByRole('button', { name: 'Sääsymbolit' }).click();
      const finnishBar = page.getByRole('group', { name: 'Sääsymbolit' });
      await expect(finnishBar.getByRole('button', { name: 'Nyt' })).toBeVisible();
      await expect(finnishBar.getByRole('button', { name: 'Tänä yönä' })).toBeVisible();
      await expect(finnishBar.getByRole('button', { name: 'Huomenna' })).toBeVisible();
      await expect(badges(page).first()).toBeVisible();
    });
  });
});
