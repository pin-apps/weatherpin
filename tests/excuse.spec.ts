// The weather excuse generator (src/quips/): "🎲 Weather excuse" in the
// ⋯ menu puts a card at the top of the panel with an excuse made from the
// real weather. Math.random is made repeatable, but the checks don't depend
// on the order: in Oslo at the test time (5 °C, light rain, gusts 11.2 m/s
// from the SW, thunder from 18:00, pressure falling) dozens of excuses fit.

import type { Page } from '@playwright/test';
import { chooseUnit, expect, placeAction, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const card = (page: Page) => page.locator('.quip');
const text = (page: Page) => card(page).locator('.quip__text');

async function repeatableRandom(page: Page) {
  await page.evaluate(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  });
}

async function openExcuse(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  await repeatableRandom(page);
  await placeAction(page, 'Weather excuse');
  await expect(card(page)).toBeVisible();
}

/**
 * Every line in a round: the one shown, then "Another one" until a line
 * comes back (a round shows each fitting line once before repeating).
 */
async function wholeRound(page: Page, another = 'Another one'): Promise<string[]> {
  const seen: string[] = [(await text(page).textContent())!];
  for (let i = 0; i < 300; i++) {
    await card(page).getByRole('button', { name: another }).click();
    await expect(text(page)).not.toHaveText(seen[seen.length - 1]);
    const line = (await text(page).textContent())!;
    if (seen.includes(line)) return seen;
    seen.push(line);
  }
  throw new Error('No line came back in 300 presses');
}

/** Filled in properly: no {placeholder}, "undefined" or "NaN" left; short enough. */
function checkFilled(lines: string[]) {
  for (const line of lines) {
    expect(line, line).not.toMatch(/[{}]|undefined|NaN/);
    expect(line.length, line).toBeLessThan(200);
  }
}

test.describe('weather excuse', () => {
  test('excuses from the weather there, each once per round', async ({ page }) => {
    await openExcuse(page);
    await expect(card(page).getByRole('heading', { name: 'Weather excuse' })).toBeVisible();
    // Read out first.
    await expect(text(page)).toBeFocused();

    const excuses = await wholeRound(page);
    // Plenty of choice, all filled in; these among them.
    expect(excuses.length).toBeGreaterThanOrEqual(25);
    checkFilled(excuses);
    for (const excuse of [
      "Sorry I'm late: gusts of 25 mph from SW kept blowing me back home.",
      "My cat is now a kite. Gusts of 25 mph from SW. I'm following it; I'll probably end up in Sweden.",
      "Can't make it: 0.6 mm of rain is coming and I'm not waterproof.",
      "0.6 mm of rain is coming. I've started building an ark and can't leave the project now.",
      'Horizontal rain. My umbrella left without me.',
      'Staying in: thunder around 18:00.',
      'Thunder around 18:00. Thor and I have an agreement: I stay in.',
      'Air pressure is falling, and so is my motivation, at exactly the same rate.',
      "Running late: it's 5 °C and slight rain, I needed a moment.",
      "The forecast said 'slight rain' and I took it personally.",
      "I looked outside. The weather looked back. I'm not ready.",
    ]) {
      expect(excuses).toContain(`“${excuse}”`);
    }
  });

  test('in °F', async ({ page }) => {
    await page.goto(OSLO);
    await chooseUnit(page, '°F');
    await openExcuse(page);
    const excuses = await wholeRound(page);
    expect(excuses).toContain("“Can't make it: 0.02 in of rain is coming and I'm not waterproof.”");
    expect(excuses).toContain("“Running late: it's 40 °F and slight rain, I needed a moment.”");
  });

  test.describe('in polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('cold and dark excuses', async ({ page }) => {
      await openExcuse(page, '/#at=78.22,15.65&name=Longyearbyen');
      const excuses = await wholeRound(page);
      expect(excuses).toContain("“My car won't start at -12 °C. Neither will I.”");
      expect(excuses).toContain("“The sun isn't getting up today, so I'm not either.”");
    });
  });

  test('shared with a link to the place', async ({ page }) => {
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
    await openExcuse(page);
    const excuse = (await text(page).textContent())!.replace(/^“|”$/g, '');
    await card(page).getByRole('button', { name: 'Share' }).click();
    const shared = () => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
    await expect.poll(async () => (await shared()).length).toBe(1);
    const [{ text: message }] = await shared();
    const [first, link] = message!.split('\n');
    expect(first).toBe(excuse);
    expect(link).toContain('#at=59.91,10.75');
  });

  test('copied where there is no share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      const copied: string[] = [];
      Object.assign(window, { copied });
      Object.defineProperty(navigator, 'share', { value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: (value: string) => Promise.resolve(void copied.push(value)) },
      });
    });
    await openExcuse(page);
    await card(page).getByRole('button', { name: 'Share' }).click();
    await expect(page.locator('.panel__action-status')).toHaveText('Copied');
    const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
    expect(copied).toHaveLength(1);
    expect(copied[0]).toContain('#at=59.91,10.75');
  });

  test('closes with ×, and on another place', async ({ page }) => {
    await openExcuse(page);
    await card(page).getByRole('button', { name: 'Close' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'More actions' })).toBeFocused();

    await repeatableRandom(page);
    await placeAction(page, 'Weather excuse');
    await expect(card(page)).toBeVisible();
    await page.goto('/#at=60.17,24.94&name=Helsinki,+Finland');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test('fits the panel', { tag: '@layout' }, async ({ page }) => {
    await openExcuse(page);
    const panel = (await page.locator('.panel__body').boundingBox())!;
    const box = (await card(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(panel.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width + 1);
    for (const button of await card(page).getByRole('button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    // Text in the card at least 15 px.
    const size = await text(page).evaluate((element) => getComputedStyle(element).fontSize);
    expect(parseFloat(size)).toBeGreaterThanOrEqual(15);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Säätekosyy"', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(page.locator('.current__temp')).toBeVisible();
      await repeatableRandom(page);
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Huvin vuoksi…' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Säätekosyy' }).click();
      await expect(card(page).getByRole('heading', { name: 'Säätekosyy' })).toBeVisible();
      const excuses = await wholeRound(page, 'Toinen');
      expect(excuses).toContain(
        '“Sori, myöhästyn: 11,2 m/s puuskat lounaasta puhalsivat minut takaisin kotiin.”',
      );
    });
  });
});
