// The temperature quiz (src/quiz/): from the button under the search box
// or a link to #quiz. Every fake forecast is the Oslo fixture, so each
// place's answers are known: the daily asks for today's high (6 °C, the
// hourly peak first around 04:00), free play for the temperature now (5 °C). The
// test clock's UTC day is 2026-11-15: quiz #15. Place names aren't looked
// up (the fake Nominatim knows none), so places show as coordinates.

import type { Page } from '@playwright/test';
import {
  chooseUnit,
  expect,
  openApp,
  overlappingPairs,
  test,
  visibleBoxes,
  waitUntilStill,
} from './helpers';

const quiz = (page: Page) => page.getByRole('dialog', { name: 'Temperature quiz' });
const slider = (page: Page) => quiz(page).getByRole('slider', { name: 'Your guess' });

/**
 * Whether the pin is near the middle of the map the card leaves visible:
 * above it on phones (card along the bottom), to its left on a phone held
 * sideways (card on the right), the whole map on wide screens (card in the
 * left corner).
 */
async function offMiddle(page: Page): Promise<{ sideways: boolean; upAndDown: boolean }> {
  const pin = await page.locator('.pick-marker').boundingBox();
  const card = (await quiz(page).boundingBox())!;
  const size = page.viewportSize()!;
  if (!pin) return { sideways: false, upAndDown: false };
  let [width, height] = [size.width, size.height];
  if (card.x > size.width / 2) width = card.x;
  else if (card.x + card.width > size.width / 2) height = card.y;
  const x = pin.x + pin.width / 2;
  // The pin's point is at its bottom.
  const y = pin.y + pin.height;
  return {
    sideways: Math.abs(x - width / 2) < width * 0.15,
    upAndDown: Math.abs(y - height / 2) < height * 0.2,
  };
}

async function openQuiz(page: Page) {
  await page.goto('/#quiz');
  await expect(quiz(page)).toBeVisible();
}

/** Plays a round: waits for the question, guesses `value`, returns the verdict. */
async function guess(page: Page, value: number): Promise<string> {
  await expect(slider(page)).toBeVisible();
  await slider(page).fill(String(value));
  await quiz(page).getByRole('button', { name: 'Guess', exact: true }).click();
  const verdict = quiz(page).locator('.quiz__verdict');
  await expect(verdict).toBeVisible();
  return (await verdict.textContent()) ?? '';
}

async function playDaily(page: Page, value = 6) {
  await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
  for (let round = 1; round <= 5; round++) {
    await expect(quiz(page).locator('.quiz__round')).toHaveText(`Place ${round} of 5`);
    await guess(page, value);
    await quiz(page)
      .getByRole('button', { name: round < 5 ? 'Next place' : 'See results' })
      .click();
  }
}

test.describe('temperature quiz', () => {
  test('from the button under the search box', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await page.getByRole('button', { name: 'Temperature quiz' }).click();
    await expect(quiz(page)).toBeVisible();
    await expect(quiz(page)).toContainText("Today's quiz #15: guess today's high at 5 places.");
  });

  test('the daily: 5 places, scored, saved and shared', async ({ page }) => {
    await page.addInitScript(() => {
      const shared: ShareData[] = [];
      Object.assign(window, { shared });
      Object.defineProperty(navigator, 'share', {
        value: (data: ShareData) => Promise.resolve(void shared.push(data)),
      });
    });
    await openQuiz(page);
    await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
    await expect(quiz(page).locator('.quiz__question')).toHaveText("What's today's high here?");
    await expect(slider(page)).toBeFocused();
    expect(await guess(page, 6)).toBe('🟩 You guessed 6 °C: 0° off · 100 points');
    await expect(quiz(page).locator('.quiz__answer')).toContainText(
      "Today's high: 6 °C (around 04:00)",
    );
    await quiz(page).getByRole('button', { name: 'Next place' }).click();
    // 2 off: still green, 80 points; 4 off: yellow, 60; 7 off: red, 30.
    expect(await guess(page, 8)).toBe('🟩 You guessed 8 °C: 2° off · 80 points');
    await quiz(page).getByRole('button', { name: 'Next place' }).click();
    expect(await guess(page, 2)).toBe('🟨 You guessed 2 °C: 4° off · 60 points');
    await quiz(page).getByRole('button', { name: 'Next place' }).click();
    expect(await guess(page, 13)).toBe('🟥 You guessed 13 °C: 7° off · 30 points');
    await quiz(page).getByRole('button', { name: 'Next place' }).click();
    expect(await guess(page, 6)).toBe('🟩 You guessed 6 °C: 0° off · 100 points');
    await quiz(page).getByRole('button', { name: 'See results' }).click();

    await expect(quiz(page).locator('.quiz__score')).toHaveText('370 / 500');
    await expect(quiz(page).locator('.quiz__boxes')).toHaveText('🟩🟩🟨🟥🟩');
    await expect(quiz(page)).toContainText('Not bad at all!');
    await expect(quiz(page)).toContainText('🔥 1 day in a row');
    await expect(quiz(page)).toContainText('Your best: 370');
    await expect(quiz(page).locator('.quiz__places-item')).toHaveCount(5);

    await quiz(page).getByRole('button', { name: 'Share' }).click();
    const shared = () => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
    await expect.poll(async () => (await shared()).length).toBe(1);
    const origin = new URL(page.url()).origin;
    expect((await shared())[0].text).toBe(
      `Weatherpin quiz #15 · 370/500 🌡️\n🟩🟩🟨🟥🟩\n${origin}/#quiz`,
    );

    // The same day again: the result, not a second go.
    await page.goto('/');
    await openQuiz(page);
    await expect(quiz(page)).toContainText("You've played today's quiz #15.");
    await expect(quiz(page).locator('.quiz__score')).toHaveText('370 / 500');
    await expect(quiz(page).getByRole('button', { name: "Play today's quiz" })).toHaveCount(0);
    await expect(quiz(page)).toContainText('Next quiz in');
  });

  test('the answer stays hidden until the guess', async ({ page }) => {
    await openQuiz(page);
    const title = await page.title();
    await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
    await expect(slider(page)).toBeVisible();
    // No weather panel, no change to the title or the address, nothing
    // kept in the device's copy of recent weather.
    await expect(page.locator('#panel')).toBeHidden();
    expect(await page.title()).toBe(title);
    expect(new URL(page.url()).hash).toBe('#quiz');
    expect(
      await page.evaluate(() => localStorage.getItem('nordic-weather:saved-forecasts')),
    ).toBeNull();
    await expect(page.getByText('6 °C')).toHaveCount(0);
    // A tap on the map doesn't open the weather either.
    await page.mouse.click(10, page.viewportSize()!.height / 3);
    // (A tap opens the weather after the double-tap check: give it time.)
    await page.waitForTimeout(800);
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('free play: the temperature right now', async ({ page }) => {
    await openQuiz(page);
    await quiz(page).getByRole('button', { name: 'Free play', exact: true }).click();
    await expect(quiz(page).locator('.quiz__question')).toHaveText(
      "What's the temperature here right now?",
    );
    expect(await guess(page, 7)).toBe('🟩 You guessed 7 °C: 2° off · 80 points');
    await expect(quiz(page).locator('.quiz__answer')).toContainText("It's 5 °C there right now.");
  });

  test('in °F: the same limits, scaled', async ({ page }) => {
    await openApp(page);
    await chooseUnit(page, '°F');
    await openQuiz(page);
    await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
    // Today's high 6 °C = 43 °F; 4 °F off is still green.
    expect(await guess(page, 47)).toBe('🟩 You guessed 47 °F: 4° off · 78 points');
  });

  test('shows the weather of a place afterwards', async ({ page }) => {
    await openQuiz(page);
    await playDaily(page);
    await expect(quiz(page).locator('.quiz__score')).toHaveText('500 / 500');
    await expect(quiz(page)).toContainText('Meteorologist material!');
    await quiz(page).getByRole('button', { name: 'Show the weather' }).first().click();
    await expect(quiz(page)).toBeHidden();
    await expect(page.locator('.current__temp')).toBeVisible();
  });

  test('closes with × and Escape, and cleans the address', async ({ page }) => {
    await openQuiz(page);
    await page.keyboard.press('Escape');
    await expect(quiz(page)).toBeHidden();
    // (The address is cleaned on the dialog's close event, a moment later.)
    await expect.poll(() => new URL(page.url()).hash).toBe('');
    await openQuiz(page);
    await quiz(page).getByRole('button', { name: 'Close' }).click();
    await expect(quiz(page)).toBeHidden();
  });

  test('fits the screen', { tag: '@layout' }, async ({ page }) => {
    await openQuiz(page);
    await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
    await expect(slider(page)).toBeVisible();
    const box = (await quiz(page).boundingBox())!;
    const size = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    for (const button of await quiz(page).getByRole('button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test(
    'the map credits and round buttons stay clear of the card',
    { tag: '@layout' },
    async ({ page }) => {
      await openQuiz(page);
      await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
      await expect(slider(page)).toBeVisible();
      // Moved like for the weather sheet: wait for them to settle.
      await expect
        .poll(async () =>
          overlappingPairs(
            await visibleBoxes(page, {
              quiz: '#quiz',
              credits: '.leaflet-control-attribution',
              location: '#locate-button',
              radar: '#radar-button',
            }),
          ),
        )
        .toEqual([]);
    },
  );

  test(
    'each place lands in the middle of the map the card leaves visible',
    { tag: '@layout' },
    async ({ page }) => {
      await openQuiz(page);
      await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
      for (let round = 1; round <= 3; round++) {
        await expect(slider(page)).toBeVisible();
        // One flight lands the place in the middle of what the card leaves
        // visible, and nothing moves after it (no extra pan to re-centre).
        await waitUntilStill(page.locator('.pick-marker'));
        expect(await offMiddle(page), `round ${round}`).toEqual({
          sideways: true,
          upAndDown: true,
        });
        const landed = await page.locator('.pick-marker').boundingBox();
        await page.waitForTimeout(1000);
        expect(await page.locator('.pick-marker').boundingBox()).toEqual(landed);
        await guess(page, 6);
        await quiz(page).getByRole('button', { name: 'Next place' }).click();
      }
    },
  );

  test.describe('names in another script', () => {
    test.use({ placeNameMode: 'foreign' });

    test('the English name', async ({ page }) => {
      await openQuiz(page);
      await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
      await expect(quiz(page).locator('.quiz__place')).toHaveText('Beijing, China');
    });
  });

  test.describe('names with no readable spelling', () => {
    test.use({ placeNameMode: 'unreadable' });

    test('only the country', async ({ page }) => {
      await openQuiz(page);
      await quiz(page).getByRole('button', { name: "Play today's quiz" }).click();
      await expect(quiz(page).locator('.quiz__place')).toHaveText('Somewhere in China');
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Lämpötilavisa"', async ({ page }) => {
      await page.goto('/#quiz');
      const finnish = page.getByRole('dialog', { name: 'Lämpötilavisa' });
      await expect(finnish).toContainText(
        'Päivän visa #15: arvaa päivän ylin lämpötila viidessä paikassa.',
      );
      await finnish.getByRole('button', { name: 'Pelaa päivän visa' }).click();
      await expect(finnish.locator('.quiz__question')).toHaveText(
        'Mikä on täällä tänään päivän ylin lämpötila?',
      );
    });
  });
});
