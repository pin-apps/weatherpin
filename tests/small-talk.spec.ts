// Small talk (src/quips/small-talk.ts): "💬 Small talk" in the ⋯ menu puts
// a card at the top of the panel with one conversation opener about the
// real weather there. In Oslo at the test time (5 °C, light rain, gusts
// 11.2 m/s, snow from 15:00, sunset 15:40, 7 h 05 min of daylight, 4 min
// shorter tomorrow, thunder from 18:00, a Sunday) dozens of lines fit, a
// few of them (today's and tomorrow's weather) always there.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, placeAction, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const card = (page: Page) => page.locator('.quip');
const text = (page: Page) => card(page).locator('.quip__text');

async function repeatableRandom(page: Page) {
  await page.evaluate(() => {
    let seed = 7;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  });
}

async function openSmallTalk(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  await repeatableRandom(page);
  await placeAction(page, 'Small talk');
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

test.describe('small talk', () => {
  test('openers from the weather there, each once per round', async ({ page }) => {
    await openSmallTalk(page);
    await expect(card(page).getByRole('heading', { name: 'Small talk' })).toBeVisible();
    await expect(text(page)).toBeFocused();
    const lines = await wholeRound(page);
    // Plenty of choice, all filled in; these among them.
    expect(lines.length).toBeGreaterThanOrEqual(25);
    checkFilled(lines);
    expect(lines.join(' ')).not.toContain('Nod at the sky');
    for (const line of [
      "It's slight rain and 5 °C today. How are you finding it?",
      'Tomorrow looks like mainly clear, 7 °C at most. Better than today?',
      "Proper rain, isn't it? Good for the gardens, at least.",
      'Snow on the way from about 15:00. Ready for it?',
      "Bit breezy today, isn't it? Gusts of 25 mph.",
      "5 °C today. Proper jacket weather, isn't it?",
      'Thunder expected around 18:00. Better be home before it, eh?',
      'Only 7 h 05 min of daylight today. Did you manage to see any of it?',
      "4 min less daylight tomorrow. Winter's coming, isn't it?",
      "The sun sets at 15:40 today. Better get outside while it's light?",
      'At least a beer would stay nicely cold out here. Small mercies, eh?',
    ]) {
      expect(lines).toContain(`“${line}”`);
    }
  });

  test('tomorrow, the weekend and rain later', async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const forecast = forecastFixture();
      // A Friday, dry now, rain likely at 19:00, 5° colder tomorrow.
      forecast.current.time = forecast.current.time.replace('2026-11-15', '2026-11-13');
      forecast.daily.time = forecast.daily.time.map((_, i) => `2026-11-${13 + i}`);
      forecast.hourly.time = forecast.hourly.time.map((time) =>
        time.replace(/2026-11-(\d\d)/, (_, day) => `2026-11-${Number(day) - 2}`),
      );
      forecast.current.precipitation = 0;
      (forecast.hourly.precipitation_probability as number[])[19] = 80;
      (forecast.hourly.weather_code as number[])[19] = 61;
      (forecast.daily.temperature_2m_max as number[])[1] = 1;
      return route.fulfill({ json: forecast });
    });
    await openSmallTalk(page);
    const lines = await wholeRound(page);
    expect(lines).toContain('“Rain from about 19:00, they say. Got your umbrella?”');
    expect(lines).toContain(
      '“Supposed to be 5° colder tomorrow. Better enjoy this while it lasts, eh?”',
    );
    expect(lines).toContain('“Tomorrow looks like mainly clear, 1 °C at most. Better than today?”');
    // Saturday 14 Nov is day 1 in the fixture's codes: mainly clear.
    expect(lines).toContain('“Weekend forecast: mainly clear. Any plans?”');
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
    await openSmallTalk(page);
    const line = (await text(page).textContent())!.replace(/^“|”$/g, '');
    await card(page).getByRole('button', { name: 'Share' }).click();
    const shared = () => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
    await expect.poll(async () => (await shared()).length).toBe(1);
    const [first, link] = (await shared())[0].text!.split('\n');
    expect(first).toBe(line);
    expect(link).toContain('#at=59.91,10.75');
  });

  test('one card at a time: small talk replaces the excuse', async ({ page }) => {
    await openSmallTalk(page);
    await placeAction(page, 'Weather excuse');
    await expect(card(page)).toHaveCount(1);
    await expect(card(page).getByRole('heading', { name: 'Weather excuse' })).toBeVisible();
  });

  test('fits the panel', { tag: '@layout' }, async ({ page }) => {
    await openSmallTalk(page);
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

    test('"Jutun juurta"', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(page.locator('.current__temp')).toBeVisible();
      await repeatableRandom(page);
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Huvin vuoksi…' }).click();
      await page.locator('#panel-menu').getByRole('button', { name: 'Jutun juurta' }).click();
      await expect(card(page).getByRole('heading', { name: 'Jutun juurta' })).toBeVisible();
      const lines = await wholeRound(page, 'Toinen');
      expect(lines).toContain(
        '“Olut pysyisi ainakin mukavan kylmänä täällä ulkona. Aina jotain hyvää, eikö?”',
      );
      expect(lines).toContain('“Vain 7 h 05 min valoisaa tänään. Ehditkö nähdä siitä mitään?”');
    });
  });
});
