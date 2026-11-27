// The balloon (src/balloon/): "🎈 Launch a balloon" in the ⋯ menu flies a
// balloon on the forecast winds at a height, draws it on the map, and
// shares the flight as a link. The winds are made up (fixtures/balloon.ts):
// from the west everywhere, 15/25/35 m/s low/middle/high, so a flight goes
// due east for 5 days. Any point's name is "Espoo, Finland" (helpers.ts).

import type { Page } from '@playwright/test';
import { balloonWindsFixture } from './fixtures/balloon';
import { expect, placeAction, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const card = (page: Page) => page.locator('#balloon');

async function openLaunch(page: Page) {
  await page.goto(OSLO);
  await expect(page.locator('.current__temp')).toBeVisible();
  await placeAction(page, 'Launch a balloon');
  await expect(card(page).getByRole('heading', { name: 'Launch a balloon' })).toBeVisible();
}

/** Picks a height ("High"), optionally names it, and launches. */
async function launch(page: Page, height: 'Low' | 'Middle' | 'High', name = '') {
  await card(page)
    .getByRole('button', { name: new RegExp(`^${height} ·`) })
    .click();
  if (name) await card(page).getByLabel('Balloon name (optional)').fill(name);
  await card(page).getByRole('button', { name: 'Launch' }).click();
}

/** Winds requests (at height), counted. */
function countWinds(page: Page): () => number {
  let count = 0;
  page.on('request', (request) => {
    if (request.url().includes('hPa')) count++;
  });
  return () => count;
}

test.describe('balloon', () => {
  // Points get a name ("Espoo, Finland"), as from Nominatim.
  test.use({ placeNameMode: 'town' });

  test('launch: the winds at each height now, a name and a colour', async ({ page }) => {
    await openLaunch(page);
    // The weather panel gives way to the card.
    await expect(page.locator('#panel')).toBeHidden();
    await expect(card(page)).toContainText('From Oslo, Norway, now.');
    const heights = card(page).getByRole('group', { name: 'Height' }).getByRole('button');
    await expect(heights).toHaveCount(3);
    await expect(heights.nth(0)).toContainText('Low · 1.5 km');
    await expect(heights.nth(0)).toContainText('now 34 mph from W');
    await expect(heights.nth(1)).toContainText('Middle · 3 km');
    await expect(heights.nth(1)).toContainText('now 56 mph from W');
    await expect(heights.nth(2)).toContainText('High · 5.5 km');
    await expect(heights.nth(2)).toContainText('now 78 mph from W');
    // Low is picked to start with; one height pressed at a time.
    await expect(heights.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await heights.nth(2).click();
    await expect(heights.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(heights.nth(0)).toHaveAttribute('aria-pressed', 'false');
    const colours = card(page).getByRole('group', { name: 'Colour' }).getByRole('button');
    await expect(colours).toHaveCount(4);
    await expect(card(page).getByRole('button', { name: 'Red' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(card(page)).toContainText('A game with forecast winds, not a flight forecast.');
  });

  test('a flight: the weather up there on the way, then where it landed', async ({ page }) => {
    const winds = countWinds(page);
    await openLaunch(page);
    await card(page).getByRole('button', { name: 'Blue' }).click();
    await launch(page, 'High', 'Puhti');
    await expect(card(page).getByRole('heading', { name: 'Puhti' })).toBeVisible();

    // On the way: day, hours and distance, and what the balloon meets.
    await expect(card(page).locator('.balloon__progress')).toHaveText(
      /^Day \d · \d+ h · [\d,]+ mi$/,
    );
    await expect(card(page).locator('.balloon__up')).toHaveText(
      /^5\.5 km up: -30 °C, wind 78 mph from W, in cloud \(80 %\)$/,
    );
    await expect(card(page).locator('.balloon__below')).toHaveText('Below: overcast, 2 °C');
    await expect(page.locator('.balloon-marker--blue')).toBeVisible();
    await expect(page.locator('path.balloon-path--blue')).toHaveCount(1);

    // Paused: the balloon stays where it is.
    await card(page).getByRole('button', { name: 'Pause' }).click();
    await expect(card(page).getByRole('button', { name: 'Continue' })).toBeVisible();
    const progress = await card(page).locator('.balloon__progress').textContent();
    await page.waitForTimeout(600);
    await expect(card(page).locator('.balloon__progress')).toHaveText(progress!);

    await card(page).getByRole('button', { name: 'Skip to the end' }).click();
    await expect(card(page)).toContainText('Puhti flew');
    // 35 m/s for 5 days: ~15,000 km, in miles.
    const distance = await card(page).locator('.balloon__distance').textContent();
    const miles = Number(distance!.replace(/\D/g, ''));
    expect(miles).toBeGreaterThan(8500);
    expect(miles).toBeLessThan(9600);
    await expect(card(page).locator('.balloon__route')).toHaveText('Oslo, Norway → Espoo, Finland');
    await expect(card(page)).toContainText('5 d 0 h');
    await expect(card(page)).toContainText('78 mph');
    await expect(card(page)).toContainText('Landed gently after 5 days in the air.');
    await expect(card(page)).toContainText('Your best flight so far!');
    await expect(page.locator('.balloon-landing')).toBeVisible();
    // The winds were asked for along the way, not every hour.
    expect(winds()).toBeLessThanOrEqual(45);

    // Remembered: the name and colour for next time, and the best flight.
    const saved = await page.evaluate(() => localStorage.getItem('nordic-weather:balloon'));
    expect(JSON.parse(saved!)).toMatchObject({ version: 1, name: 'Puhti', colour: 'blue' });
    await card(page).getByRole('button', { name: 'Fly again' }).click();
    await expect(card(page).getByLabel('Balloon name (optional)')).toHaveValue('Puhti');
    await expect(card(page).getByRole('button', { name: 'Blue' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('brought down by a thunderstorm', async ({ page }) => {
    // Thunder from 19:00 UTC the next day: 30 hours after the 13:00 launch.
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.get('hourly')?.includes('hPa')) return route.fallback();
      return route.fulfill({ json: balloonWindsFixture(url, { thunderFrom: 43 }) });
    });
    await openLaunch(page);
    await launch(page, 'Low');
    await card(page).getByRole('button', { name: 'Skip to the end' }).click();
    await expect(card(page)).toContainText('Your balloon flew');
    await expect(card(page)).toContainText('Brought down by a thunderstorm.');
    await expect(card(page)).toContainText('1 d 6 h');
  });

  test('without motion: straight to where it landed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openLaunch(page);
    await launch(page, 'Middle');
    await expect(card(page)).toContainText('Your balloon flew');
    await expect(card(page)).toContainText('Landed gently after 5 days in the air.');
  });

  test('shared as a link that shows the same flight', async ({ page }) => {
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
    await openLaunch(page);
    await launch(page, 'High', 'Puhti');
    await card(page).getByRole('button', { name: 'Skip to the end' }).click();
    const distance = (await card(page).locator('.balloon__distance').textContent())!;
    await expect(card(page).locator('.balloon__route')).toContainText('Espoo');
    await card(page).getByRole('button', { name: 'Share result' }).click();
    const shared = () => page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
    await expect.poll(async () => (await shared()).length).toBe(1);
    const [text, link] = (await shared())[0].text!.split('\n');
    expect(text).toBe(
      `🎈 Puhti flew ${distance} from Oslo, Norway to Espoo, Finland in 5 d 0 h. Beat that:`,
    );
    expect(link).toMatch(
      /#balloon=1\.5991,1075\.2026111513\.500\.red\.120\.landed\.[\w-]+\.Puhti$/,
    );

    // A friend opens it (here, in the same page, which keeps the test's
    // fake network): the same flight, replayed, with no winds asked for.
    const winds = countWinds(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(link);
    // Opened afresh, not just the address changing.
    await page.reload();
    await expect(card(page).getByRole('heading', { name: 'Puhti' })).toBeVisible();
    await expect(card(page).locator('.balloon__distance')).toHaveText(distance);
    await expect(card(page)).toContainText('Puhti from Espoo, Finland flew');
    await expect(card(page)).toContainText('5.5 km · 5 d 0 h in the air');
    expect(winds()).toBe(0);
    await card(page).getByRole('button', { name: 'Launch from Espoo, Finland too' }).click();
    await expect(card(page).getByRole('heading', { name: 'Launch a balloon' })).toBeVisible();
  });

  test('a broken or changed link is ignored', async ({ page }) => {
    for (const hash of [
      '#balloon=1.nonsense',
      // A path that jumps 1,000s of km in 3 hours.
      '#balloon=1.6000,1000.2026111513.500.red.6.landed.wF7QD8ABgH0.Fake',
    ]) {
      await page.goto(`/${hash}`);
      await expect(page.locator('#map')).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
      await expect(card(page)).toBeHidden();
    }
  });

  test('a place picked on the map closes the card', async ({ page }) => {
    await openLaunch(page);
    await page.goto(OSLO.replace('59.91', '60.17'));
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(card(page)).toBeHidden();
  });

  test('fits the screen', { tag: '@layout' }, async ({ page }) => {
    await openLaunch(page);
    await expect(card(page).getByRole('group', { name: 'Height' }).getByRole('button')).toHaveCount(
      3,
    );
    const viewport = page.viewportSize()!;
    const box = (await card(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    for (const button of await card(page).getByRole('button').all()) {
      if (!(await button.isVisible())) continue;
      const size = (await button.boundingBox())!;
      expect(size.height).toBeGreaterThanOrEqual(44);
      expect(size.width).toBeGreaterThanOrEqual(44);
    }
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Lähetä pallo matkaan"', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(page.locator('.current__temp')).toBeVisible();
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page
        .locator('#panel-menu')
        .getByRole('button', { name: 'Lähetä pallo matkaan' })
        .click();
      await expect(card(page)).toContainText('Paikasta Oslo, Norja, nyt.');
      await expect(card(page).getByRole('button', { name: /^Korkea · 5,5 km/ })).toContainText(
        'nyt 35,0 m/s lännestä',
      );
      await card(page).getByLabel('Pallon nimi (vapaaehtoinen)').fill('Puhti');
      await card(page).getByRole('button', { name: 'Matkaan!' }).click();
      await expect(card(page)).toContainText('Puhti lensi');
      await expect(card(page)).toContainText('Laskeutui pehmeästi 5 päivän lennon jälkeen.');
      await expect(card(page)).toContainText('5 vrk 0 h');
    });
  });
});
