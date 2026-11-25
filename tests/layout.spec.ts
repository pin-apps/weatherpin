// Layout rules that must hold on every screen size: nothing overlaps,
// nothing sticks out of the screen, and the map has no empty grey areas.
// These catch the kind of bugs we've had (grey bars on iPhone, attribution
// covering the search box and zoom buttons) without comparing pixels.

import type { Page } from '@playwright/test';
import {
  chooseUnit,
  expect,
  isMobileLayout,
  offScreen,
  openApp,
  overlapArea,
  overlappingPairs,
  pickPoint,
  snapshot,
  uncoveredScreenPoints,
  test,
  visibleBoxes,
  waitForMapStill,
  waitForTiles,
  waitUntilStill,
  type Box,
} from './helpers';

// The floating controls over the map. The search suggestion list is left out
// on purpose: it's allowed to drop down over the zoom buttons.
const CONTROLS = {
  'search box': '.search__input',
  'settings button': '#settings-button',
  'zoom buttons': '.leaflet-control-zoom',
  attribution: '.leaflet-control-attribution',
  'location button': '#locate-button',
  'rain radar button': '#radar-button',
};

const WITH_PANEL = { ...CONTROLS, 'weather panel': '#panel' };

test.describe('layout', { tag: '@layout' }, () => {
  test('map fills the whole screen, with no grey bars', async ({ page }, testInfo) => {
    await openApp(page);
    await snapshot(page, testInfo, 'first view');

    const uncovered = await uncoveredScreenPoints(page);
    expect(uncovered, 'screen points with no map tile under them').toEqual([]);
  });

  test('map recovers when its container gets its size late (issue #18)', async ({
    page,
  }, testInfo) => {
    // Recreates a first, uncached visit where the map is created before its
    // container has its full size: hold the container at 0 px tall while the
    // app starts, then release it. Like in the bug, the window never resizes.
    // (Set through the style property: an injected <style> would break our CSP.)
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        const map = document.getElementById('map');
        if (!map) return;
        map.style.setProperty('height', '0px', 'important');
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });

    await page.goto('/');
    await expect(page.locator('#map.leaflet-container')).toBeAttached();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.getElementById('map')!.style.removeProperty('height'));

    await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
    await waitForMapStill(page);
    await waitForTiles(page);
    await snapshot(page, testInfo, 'after late size');
    expect(await uncoveredScreenPoints(page), 'screen points with no map tile').toEqual([]);
  });

  test('controls do not overlap and stay on screen', async ({ page }, testInfo) => {
    await openApp(page);
    const boxes = await visibleBoxes(page, CONTROLS);
    await snapshot(page, testInfo, 'controls');

    expect(boxes.map((b) => b.name)).toEqual(Object.keys(CONTROLS));
    expect(overlappingPairs(boxes)).toEqual([]);
    expect(offScreen(page, boxes)).toEqual([]);
  });

  test('with the weather open, nothing overlaps the panel', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    await snapshot(page, testInfo, 'weather open');

    const boxes = await visibleBoxes(page, WITH_PANEL);
    expect(boxes.map((b) => b.name)).toContain('weather panel');
    expect(overlappingPairs(boxes)).toEqual([]);
    expect(offScreen(page, boxes)).toEqual([]);
  });

  test('the panel header buttons fit beside the title', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const boxes = await visibleBoxes(page, {
      title: '#panel-title',
      'favourite button': '.panel__favourite',
      'more actions button': '.panel__more',
      'close button': '.panel__close',
    });
    expect(boxes.map((b) => b.name)).toEqual([
      'title',
      'favourite button',
      'more actions button',
      'close button',
    ]);
    expect(overlappingPairs(boxes)).toEqual([]);
    expect(offScreen(page, boxes)).toEqual([]);
  });

  test('the marker is not hidden behind the panel', async ({ page }) => {
    await openApp(page);
    // Near the right edge (desktop panel) and low down (mobile sheet).
    await pickPoint(page, 0.8, 0.6);

    const [marker, panel] = await visibleBoxes(page, {
      marker: '.pick-marker',
      panel: '#panel',
    });
    expect(marker?.name).toBe('marker');
    expect(overlapArea(marker as Box, panel as Box), 'marker under the panel').toBe(0);
    expect(offScreen(page, [marker as Box])).toEqual([]);
  });

  test('collapsed bottom sheet keeps controls above it', async ({ page }, testInfo) => {
    test.skip(!isMobileLayout(page), 'bottom sheet is phone-only');
    await openApp(page);
    await pickPoint(page);
    await page.locator('.panel__handle').click();
    await expect(page.locator('.panel__handle')).toHaveAttribute('aria-expanded', 'false');
    // The sheet slides down; measure once it has stopped.
    await waitUntilStill(page.locator('#panel'));
    await snapshot(page, testInfo, 'sheet collapsed');

    const boxes = await visibleBoxes(page, WITH_PANEL);
    expect(overlappingPairs(boxes)).toEqual([]);
    // The weather body is hidden; only the header with the summary shows.
    await expect(page.locator('.panel__summary')).toBeVisible();
    await expect(page.locator('.panel__body')).toBeHidden();
  });

  test('page never scrolls sideways', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('7-day rows stay on one line, with the UV badges lined up', async ({ page }) => {
    // Issue #47: a wide rain amount pushed the UV badge onto a second line.
    // The forecast fixture has 12.3 mm with a UV badge, and 30.4 mm with
    // snow and a UV badge.
    await openApp(page);
    await pickPoint(page);
    await page.locator('.daily').scrollIntoViewIfNeeded();
    const rows = await page.locator('.daily__row').evaluateAll((items) =>
      items.map((item) => {
        const row = item.getBoundingClientRect();
        const cells = [...item.children]
          .filter((child) => !child.classList.contains('visually-hidden'))
          .map((child) => child.getBoundingClientRect());
        const badge = item.querySelector('.uv')?.getBoundingClientRect();
        const low = item.querySelector('.daily__min')!.getBoundingClientRect();
        const high = item.querySelector('.daily__max')!.getBoundingClientRect();
        return {
          // Every cell inside the row, nothing spilling out at the sides.
          fits: cells.every((cell) => cell.left >= row.left - 0.5 && cell.right <= row.right + 0.5),
          // Cells don't overlap each other.
          overlaps: cells.some((cell, i) => i > 0 && cell.left < cells[i - 1].right - 0.5),
          hasSnow: item.querySelector('.daily__snow') !== null,
          height: row.height,
          badgeLeft: badge?.left,
          lowRight: low.right,
          highRight: high.right,
        };
      }),
    );
    expect(rows.map((row) => row.fits)).toEqual(rows.map(() => true));
    expect(rows.map((row) => row.overlaps)).toEqual(rows.map(() => false));
    // Rows without snow are all one line high.
    const plain = rows.filter((row) => !row.hasSnow).map((row) => Math.round(row.height));
    expect(Math.max(...plain) - Math.min(...plain)).toBeLessThanOrEqual(1);
    // Every UV badge starts at the same x.
    const lefts = rows.flatMap((row) => (row.badgeLeft === undefined ? [] : [row.badgeLeft]));
    expect(lefts).toHaveLength(3);
    expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(1);
    // Low and high temperatures right-aligned, like numbers in a table.
    for (const key of ['lowRight', 'highRight'] as const) {
      const rights = rows.map((row) => row[key]);
      expect(Math.max(...rights) - Math.min(...rights), key).toBeLessThanOrEqual(1);
    }
  });

  // Every list of values in the panel, checked the same way: nothing sticks
  // out of its row and no two pieces overlap. With everyday values, polar
  // ones (negative temperatures, snow) and °F (three-digit temperatures,
  // longer units).
  const DATA_ROWS = [
    '.current .details__row',
    '.hourly__item',
    '.daily__row',
    '.air-quality .details__row',
    '.aqi-days__item',
    '.pollen-days__item',
    '.sky .details__row',
    '.more-details .details__row',
  ];

  async function rowProblems(page: Page): Promise<string[]> {
    return page.evaluate((selectors) => {
      const problems: string[] = [];
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((row, rowIndex) => {
          const box = row.getBoundingClientRect();
          // The pieces of the row: its children, or for a details row the
          // value's parts too (badge, text, second line).
          const cells = [...row.querySelectorAll(':scope > *, :scope > dd > *')]
            .filter((cell) => !cell.closest('.visually-hidden'))
            .map((cell) => ({
              name: cell.className || cell.tagName,
              rect: cell.getBoundingClientRect(),
            }))
            .filter(({ rect }) => rect.width > 0 && rect.height > 0);
          const where = `${selector} #${rowIndex + 1}`;
          for (const { name, rect } of cells) {
            if (rect.left < box.left - 0.5 || rect.right > box.right + 0.5) {
              problems.push(`${where}: ${name} sticks out of the row`);
            }
          }
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
              const a = cells[i].rect;
              const b = cells[j].rect;
              // Nested pieces (a badge inside its value) don't count.
              const nested =
                (a.left <= b.left &&
                  a.right >= b.right &&
                  a.top <= b.top &&
                  a.bottom >= b.bottom) ||
                (b.left <= a.left && b.right >= a.right && b.top <= a.top && b.bottom >= a.bottom);
              const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (!nested && overlapX > 0.5 && overlapY > 0.5) {
                problems.push(`${where}: ${cells[i].name} overlaps ${cells[j].name}`);
              }
            }
          }
        });
      }
      return problems;
    }, DATA_ROWS);
  }

  test('data lists: nothing sticks out or overlaps', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.aqi-days__item').first()).toBeVisible();
    expect(await rowProblems(page)).toEqual([]);

    // °F: three-digit temperatures, inches, inHg, mph.
    await chooseUnit(page, '°F');
    await expect(page.locator('.current__temp')).toHaveText(/°F$/);
    expect(await rowProblems(page)).toEqual([]);

    // A day opened to its hours.
    await page.locator('.daily__row').nth(5).click();
    await expect(page.locator('.daily__hours .hourly__item').first()).toBeVisible();
    // Measure the open day's chevron after its turn, as it stays.
    await page
      .locator('.daily__row')
      .nth(5)
      .locator('.daily__chevron')
      .evaluate((chevron) => Promise.all(chevron.getAnimations().map((turn) => turn.finished)));
    expect(await rowProblems(page)).toEqual([]);
  });

  test.describe('in Finnish', () => {
    // Longer words ("Tänään", "Kohtalainen"), decimal commas.
    test.use({ locale: 'fi-FI' });

    test('data lists: nothing sticks out or overlaps', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.pollen-days__item').first()).toBeVisible();
      expect(await rowProblems(page)).toEqual([]);
    });
  });

  test.describe('in polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('data lists: nothing sticks out or overlaps', async ({ page }) => {
      // Negative temperatures (-18 °C), snow falling, no sun times.
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.aqi-days__item').first()).toBeVisible();
      expect(await rowProblems(page)).toEqual([]);
    });
  });

  test('buttons are big enough to tap', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const boxes = await visibleBoxes(page, {
      'location button': '#locate-button',
      'rain radar button': '#radar-button',
      'close button': '.panel__close',
      'favourite button': '.panel__favourite',
      'settings button': '#settings-button',
      'more actions button': '.panel__more',
      'search box': '.search__input',
      'a day in the 7 days': '.daily__row',
    });
    // 44 × 44 px: Apple's and WCAG's recommended minimum touch target.
    const tooSmall = boxes
      .filter((b) => b.width < 44 || b.height < 44)
      .map((b) => `${b.name} is ${Math.round(b.width)}×${Math.round(b.height)} px`);
    expect(tooSmall).toEqual([]);
  });

  test('panel text is big enough to read', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.aqi-days__item').first()).toBeVisible();
    const sizes = await page.evaluate(() => {
      const found: { text: string; px: number }[] = [];
      for (const element of document.querySelectorAll('#panel *')) {
        // Only elements that hold text themselves.
        const own = [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent!.trim())
          .join(' ')
          .trim();
        if (own) found.push({ text: own, px: parseFloat(getComputedStyle(element).fontSize) });
      }
      return {
        base: parseFloat(getComputedStyle(document.documentElement).fontSize),
        found,
      };
    });
    // Body text at least the browser's standard 16 px (larger on iOS when
    // the user chose larger text); nothing in the panel under 13 px.
    expect(sizes.base).toBeGreaterThanOrEqual(16);
    const tooSmall = sizes.found
      .filter((item) => item.px < 13)
      .map((item) => `"${item.text.slice(0, 30)}" is ${item.px} px`);
    expect(tooSmall).toEqual([]);
  });
});
