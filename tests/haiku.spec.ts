// The weather haiku (src/quips/haiku.ts): "🍃 Weather haiku" in the ⋯ menu
// puts a card at the top of the panel with a three-line poem: an opening
// for the light or the season, then a middle and a closing line from the
// weather group that fits. In Oslo at the test time (14:00, sunset 15:40,
// November, light rain) that's the day or autumn, then rain.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, placeAction, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const card = (page: Page) => page.locator('.quip');
const text = (page: Page) => card(page).locator('.quip__text');

async function repeatableRandom(page: Page) {
  await page.evaluate(() => {
    let seed = 11;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  });
}

async function openHaiku(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  await repeatableRandom(page);
  await placeAction(page, 'Weather haiku');
  await expect(card(page)).toBeVisible();
}

/** Every poem in a round, each split into its lines. */
async function wholeRound(page: Page, another = 'Another one'): Promise<string[][]> {
  const seen: string[] = [(await text(page).textContent())!];
  for (let i = 0; i < 20; i++) {
    await card(page).getByRole('button', { name: another }).click();
    await expect(text(page)).not.toHaveText(seen[seen.length - 1]);
    const poem = (await text(page).textContent())!;
    // A new round starts when a middle line comes back.
    if (seen.some((old) => old.split('\n')[1] === poem.split('\n')[1])) break;
    seen.push(poem);
  }
  return seen.map((poem) => poem.split('\n'));
}

/** A forecast changed for one test. */
async function forecastWith(
  page: Page,
  change: (forecast: ReturnType<typeof forecastFixture>) => void,
) {
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const forecast = forecastFixture();
    change(forecast);
    return route.fulfill({ json: forecast });
  });
}

test.describe('weather haiku', () => {
  test('three lines about the weather there, no middle line twice in a round', async ({ page }) => {
    await openHaiku(page);
    await expect(card(page).getByRole('heading', { name: 'Weather haiku' })).toBeVisible();
    await expect(text(page)).toBeFocused();
    // As written: no quote marks, the line breaks kept on screen.
    await expect(text(page)).not.toContainText('“');
    await expect(text(page)).toHaveCSS('white-space', 'pre-line');
    const box = (await text(page).boundingBox())!;
    const lineHeight = parseFloat(await text(page).evaluate((p) => getComputedStyle(p).lineHeight));
    expect(box.height).toBeGreaterThanOrEqual(lineHeight * 3 - 1);

    const poems = await wholeRound(page);
    expect(poems).toHaveLength(4);
    for (const poem of poems) {
      expect(poem).toHaveLength(3);
      expect([
        'Middle of the day',
        'Just another day',
        'Autumn has arrived',
        'An autumn moment',
      ]).toContain(poem[0]);
      expect(['the kettle answers', 'the earth drinks it in', 'a snail goes walking']).toContain(
        poem[2],
      );
    }
    expect(poems.map((poem) => poem[1]).sort()).toEqual([
      'grey water runs from the eaves',
      'puddles gather on the street',
      'rain taps on the window glass',
      'umbrellas bloom on the street',
    ]);
  });

  test.describe('in polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('the polar night and the snow', async ({ page }) => {
      await openHaiku(page, '/#at=78.22,15.65&name=Longyearbyen');
      const poems = await wholeRound(page);
      for (const poem of poems) {
        expect([
          'Polar night is here',
          'No sunrise today',
          'Autumn has arrived',
          'An autumn moment',
        ]).toContain(poem[0]);
        expect([
          'the shovel waits now',
          'a child laughs out loud',
          'the world, new again',
        ]).toContain(poem[2]);
      }
    });
  });

  test('a clear night in a southern spring', async ({ page }) => {
    await forecastWith(page, (forecast) => {
      forecast.latitude = -45.87;
      forecast.current.weather_code = 0;
      forecast.current.precipitation = 0;
      forecast.current.wind_gusts_10m = 4;
      forecast.current.is_day = 0;
    });
    await openHaiku(page, '/#at=-45.87,170.5&name=Dunedin');
    const poems = await wholeRound(page);
    for (const poem of poems) {
      expect([
        'Night over the town',
        'In the dark of night',
        'Spring is on its way',
        'A moment of spring',
      ]).toContain(poem[0]);
    }
    expect(poems.map((poem) => poem[1])).toContain('the Milky Way, faint and far');
  });

  test('heat near the equator: no seasons, just the light', async ({ page }) => {
    await forecastWith(page, (forecast) => {
      forecast.latitude = 1.29;
      forecast.current.weather_code = 2;
      forecast.current.precipitation = 0;
      forecast.current.wind_gusts_10m = 4;
      forecast.current.temperature_2m = 31;
    });
    await openHaiku(page, '/#at=1.29,103.85&name=Singapore');
    const poems = await wholeRound(page);
    for (const poem of poems) {
      expect(['Middle of the day', 'Just another day']).toContain(poem[0]);
    }
    expect(poems.map((poem) => poem[1])).toContain('the asphalt shimmers with heat');
  });

  test('shared as three lines with a link to the place', async ({ page }) => {
    await page.addInitScript(() => {
      const shared: ShareData[] = [];
      Object.assign(window, { shared });
      Object.defineProperty(navigator, 'share', {
        value: (data: ShareData) => {
          shared.push(data);
          return Promise.resolve();
        },
      });
    });
    await openHaiku(page);
    const poem = (await text(page).textContent())!;
    await card(page).getByRole('button', { name: 'Share' }).click();
    const shared = () => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
    await expect.poll(async () => (await shared()).length).toBe(1);
    const lines = (await shared())[0].text!.split('\n');
    expect(lines.slice(0, 3).join('\n')).toBe(poem);
    expect(lines[3]).toContain('#at=59.91,10.75');
  });

  test('one card at a time: the haiku replaces small talk', async ({ page }) => {
    await openHaiku(page);
    await placeAction(page, 'Small talk');
    await expect(card(page)).toHaveCount(1);
    await expect(card(page).getByRole('heading', { name: 'Small talk' })).toBeVisible();
    await placeAction(page, 'Weather haiku');
    await expect(card(page)).toHaveCount(1);
    await expect(card(page).getByRole('heading', { name: 'Weather haiku' })).toBeVisible();
  });

  test('fits the panel', { tag: '@layout' }, async ({ page }) => {
    await openHaiku(page);
    const panel = (await page.locator('.panel__body').boundingBox())!;
    const box = (await card(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(panel.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width + 1);
    for (const button of await card(page).getByRole('button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Säähaiku"', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(page.locator('.current__temp')).toBeVisible();
      await repeatableRandom(page);
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Säähaiku' }).click();
      await expect(card(page).getByRole('heading', { name: 'Säähaiku' })).toBeVisible();
      const poems = await wholeRound(page, 'Toinen');
      expect(poems.map((poem) => poem[1]).sort()).toEqual([
        'lätäköitä kadulla',
        'räystäät valuvat vettä',
        'sade naputtaa lasiin',
        'sateenvarjot kukkivat',
      ]);
      for (const poem of poems) {
        expect([
          'Keskellä päivää',
          'Taas uusi päivä',
          'Syksy on tullut',
          'Syksyinen hetki',
        ]).toContain(poem[0]);
      }
    });
  });
});
