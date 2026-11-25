// Rain radar history (src/radar/player.ts, the bar in radar.ts): ▶ plays
// the last ~2 hours, the slider picks a picture, the credit follows it.
// Older pictures load one at a time and only on demand; moving the map
// goes back to the newest. RainViewer's fixture: 13 pictures, 10 minutes
// apart, the newest 13:00 UTC (14:00 in Oslo); the clock is at 13:05.

import type { Page } from '@playwright/test';
import {
  expect,
  offScreen,
  openApp,
  overlappingPairs,
  pickPoint,
  snapshot,
  test,
  visibleBoxes,
} from './helpers';

const radarButton = (page: Page) => page.getByRole('button', { name: 'Rain radar' });
const bar = (page: Page) => page.locator('.radar-bar');
const play = (page: Page) => page.locator('.radar-bar__play');
const slider = (page: Page) => page.getByRole('slider', { name: 'Radar time' });
const time = (page: Page) => page.locator('.radar-bar__time');
const credit = (page: Page) => page.locator('.leaflet-control-attribution');
const radarLayers = (page: Page) => page.locator('.leaflet-layer.radar-tiles');

/** RainViewer tile requests: each picture's id ("test<time>"), in order of asking. */
function rainViewerTiles(page: Page) {
  const asked: { frame: string; at: number }[] = [];
  page.on('request', (request) => {
    const match = request.url().match(/tilecache\.rainviewer\.com\/v2\/radar\/(test\d+)\//);
    if (match) asked.push({ frame: match[1], at: Date.now() });
  });
  return asked;
}

/** Picture ids in the order their first tile was asked for. */
const framesInOrder = (asked: { frame: string }[]) => [...new Set(asked.map((a) => a.frame))];

async function radarOn(page: Page) {
  await openApp(page);
  await radarButton(page).click();
  await expect(bar(page)).toBeVisible();
}

test.describe('rain radar history', () => {
  test('the bar comes with the radar, at the newest picture, nothing extra loaded', async ({
    page,
  }) => {
    const asked = rainViewerTiles(page);
    await openApp(page);
    await expect(bar(page)).toBeHidden();
    await radarButton(page).click();
    await expect(bar(page)).toBeVisible();
    await expect(time(page)).toHaveText('14:00 · latest');
    await expect(slider(page)).toHaveAttribute('max', '12');
    await expect(slider(page)).toHaveValue('12');
    await expect(play(page)).toHaveAccessibleName('Play radar history');
    await expect(play(page)).toHaveAttribute('aria-pressed', 'false');
    // Only the newest picture until ▶ is pressed.
    await page.waitForTimeout(1500);
    expect(framesInOrder(asked)).toEqual(['test1794747600']);

    await radarButton(page).click();
    await expect(bar(page)).toBeHidden();
  });

  test('▶ loads older pictures one at a time, newest first, and plays them', async ({ page }) => {
    const asked = rainViewerTiles(page);
    await radarOn(page);
    await play(page).click();
    await expect(play(page)).toHaveAccessibleName('Pause radar history');
    await expect(play(page)).toHaveAttribute('aria-pressed', 'true');
    // Pictures arrive back in time, one after another.
    await expect.poll(() => framesInOrder(asked).length, { timeout: 20_000 }).toBeGreaterThan(3);
    const order = framesInOrder(asked).map((id) => Number(id.slice(4)));
    expect(order).toEqual([...order].sort((a, b) => b - a));
    // Never a burst: well under RainViewer's 100 requests a minute so far.
    expect(asked.length).toBeLessThanOrEqual(100);
    // It plays: other pictures than the newest come up.
    await expect
      .poll(async () => Number(await slider(page).inputValue()), { timeout: 10_000 })
      .toBeLessThan(12);
  });

  test('pause, then pick a picture with the keyboard: time and credit follow', async ({ page }) => {
    await radarOn(page);
    await play(page).click();
    await expect(time(page)).not.toContainText('loading 1/13', { timeout: 15_000 });
    await play(page).click();
    await expect(play(page)).toHaveAttribute('aria-pressed', 'false');

    await slider(page).focus();
    await page.keyboard.press('End');
    // (Older pictures may still be loading: "… · loading 9/13".)
    await expect(time(page)).toContainText('14:00 · latest');
    await page.keyboard.press('ArrowLeft');
    await expect(slider(page)).toHaveValue('11');
    await expect(time(page)).toContainText('13:50 · 15 min ago');
    await expect(slider(page)).toHaveAttribute('aria-valuetext', '13:50 · 15 min ago');
    await expect(credit(page)).toContainText('Radar: RainViewer, 13:50');
    await expect(credit(page)).not.toContainText('RainViewer, 14:00');
  });

  test('moving the map: back to the newest, the older pictures go', async ({ page }) => {
    await radarOn(page);
    await play(page).click();
    await expect.poll(() => radarLayers(page).count(), { timeout: 15_000 }).toBeGreaterThan(1);
    await page.locator('.leaflet-control-zoom-in').click();
    await expect(play(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(time(page)).toHaveText('14:00 · latest');
    await expect(radarLayers(page)).toHaveCount(1);
    await expect(credit(page)).toContainText('Radar: RainViewer, 14:00');
  });

  test('turning the radar off stops it all', async ({ page }) => {
    await radarOn(page);
    await play(page).click();
    await radarButton(page).click();
    await expect(bar(page)).toBeHidden();
    await expect(radarLayers(page)).toHaveCount(0);
    await expect(credit(page)).not.toContainText('RainViewer');
  });

  test('over North America: Environment Canada, every 12 minutes for 2 hours', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nordic-weather:start-place',
        JSON.stringify({ version: 1, place: { lat: 29.76, lng: -95.37, name: 'Houston' } }),
      );
      localStorage.setItem('nordic-weather:rain-radar', JSON.stringify({ version: 1, on: true }));
    });
    await openApp(page);
    // The start place opens the weather; on phones an open sheet hides the bar.
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    await expect(bar(page)).toBeVisible();
    // 13:00 back to 11:00 UTC, every 12 minutes: 11 pictures.
    await expect(slider(page)).toHaveAttribute('max', '10');
    await expect(time(page)).toHaveText('14:00 · latest');
  });

  test('the bar fits, overlapping nothing', { tag: '@layout' }, async ({ page }, testInfo) => {
    await radarOn(page);
    await snapshot(page, testInfo, 'radar history bar');
    const controls = {
      'search box': '.search__input',
      'zoom buttons': '.leaflet-control-zoom',
      attribution: '.leaflet-control-attribution',
      'location button': '#locate-button',
      'rain radar button': '#radar-button',
      'radar history bar': '.radar-bar',
    };
    let boxes = await visibleBoxes(page, controls);
    expect(boxes.map((b) => b.name)).toContain('radar history bar');
    expect(overlappingPairs(boxes)).toEqual([]);
    expect(offScreen(page, boxes)).toEqual([]);

    // With the weather open too. (On phones the open sheet leaves no room:
    // the bar hides until the sheet is collapsed.)
    await pickPoint(page);
    boxes = await visibleBoxes(page, { ...controls, 'weather panel': '#panel' });
    expect(overlappingPairs(boxes)).toEqual([]);
    expect(offScreen(page, boxes)).toEqual([]);
    await snapshot(page, testInfo, 'radar history bar, weather open');
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('the bar in Finnish', async ({ page }) => {
      await openApp(page);
      await page.getByRole('button', { name: 'Sadetutka' }).click();
      await expect(page.locator('.radar-bar__time')).toHaveText('14:00 · uusin');
      await expect(page.locator('.radar-bar__play')).toHaveAccessibleName('Toista tutkahistoria');
    });
  });
});
