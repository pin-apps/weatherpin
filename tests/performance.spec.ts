// Responsiveness: the app must never freeze the page for long, and the
// weather must appear soon after a tap. The network is the fake one (no
// waiting on real servers), so this measures the app's own work. Limits are
// generous on purpose (shared CI machines vary): they catch a change that
// makes the app several times slower, not a few milliseconds.
//
// Chromium only: "long tasks" (anything that blocks the page for 50 ms or
// more) are reported by Chromium's PerformanceObserver, not WebKit's.

import type { Page } from '@playwright/test';
import { expect, openApp, openSettings, pickPoint, test } from './helpers';

const MEASURED_PROJECTS = new Set(['iphone-13', 'desktop']);

// Longest the page may be blocked at once. Anything near 100 ms already
// feels sluggish to a tap; 300 leaves room for a busy CI machine.
const LONGEST_TASK_MS = 300;

// Starts recording long tasks before any of the app's code runs.
async function recordLongTasks(page: Page) {
  await page.addInitScript(() => {
    const tasks: number[] = [];
    (window as unknown as { longTasks: number[] }).longTasks = tasks;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) tasks.push(Math.round(entry.duration));
    }).observe({ type: 'longtask', buffered: true });
  });
}

const longTasks = (page: Page) =>
  page.evaluate(() => (window as unknown as { longTasks: number[] }).longTasks.slice());

test.describe('performance', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!MEASURED_PROJECTS.has(test.info().project.name), 'measured on two devices');
    await recordLongTasks(page);
  });

  test('loading the app never blocks the page for long', async ({ page }) => {
    await openApp(page);
    const tasks = await longTasks(page);
    expect(Math.max(0, ...tasks), `long tasks: ${tasks.join(', ')} ms`).toBeLessThan(
      LONGEST_TASK_MS,
    );
  });

  test('the weather appears quickly after a tap, without blocking', async ({ page }) => {
    await openApp(page);
    // Time from the tap to the temperature showing, measured in the page.
    await page.evaluate(() => {
      const timing = window as unknown as { tappedAt?: number; shownAt?: number };
      document.addEventListener('pointerdown', () => (timing.tappedAt ??= performance.now()), {
        capture: true,
      });
      new MutationObserver(() => {
        if (timing.shownAt === undefined && document.querySelector('.current__temp')) {
          timing.shownAt = performance.now();
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    const before = (await longTasks(page)).length;
    await pickPoint(page);
    const elapsed = await page.evaluate(() => {
      const timing = window as unknown as { tappedAt: number; shownAt: number };
      return timing.shownAt - timing.tappedAt;
    });
    // Includes the map's wait for a possible double-tap (~300 ms) before a
    // single tap counts.
    expect(elapsed).toBeLessThan(1500);
    const tasks = (await longTasks(page)).slice(before);
    expect(Math.max(0, ...tasks), `long tasks: ${tasks.join(', ')} ms`).toBeLessThan(
      LONGEST_TASK_MS,
    );
  });

  test('opening a day and switching units stay quick', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const before = (await longTasks(page)).length;
    // Each action timed in the page, from the click until `done` shows
    // (with `text` in it, if given).
    const timeOf = (selector: string, done: string, text = '') =>
      page.evaluate(
        ({ selector, done, text }) =>
          new Promise<number>((resolve) => {
            const start = performance.now();
            (document.querySelector(selector) as HTMLElement).click();
            const check = () =>
              document.querySelector(done)?.textContent?.includes(text)
                ? resolve(performance.now() - start)
                : requestAnimationFrame(check);
            check();
          }),
        { selector, done, text },
      );
    expect(await timeOf('.daily__row', '.daily__hours .hours-graph')).toBeLessThan(500);
    // °F in Settings: timed from the press, with the dialog already open.
    await openSettings(page);
    expect(
      await timeOf('#settings [data-value="fahrenheit"]', '.current__temp', '°F'),
    ).toBeLessThan(500);
    const tasks = (await longTasks(page)).slice(before);
    expect(Math.max(0, ...tasks), `long tasks: ${tasks.join(', ')} ms`).toBeLessThan(
      LONGEST_TASK_MS,
    );
    await expect(page.locator('.current__temp')).toHaveText(/°F$/);
  });
});
