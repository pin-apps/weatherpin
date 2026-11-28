// Hardening: whatever comes from outside (a link, a service's answer, data
// saved on the device) is shown as plain text, never run or turned into
// page elements; odd saved data can't change how objects behave; the
// security headers are sent. (Script injections would also trip the CSP,
// whose violation report fails any test as a console error.)

import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { metnoWarningsFixture } from './fixtures/warnings';
import { expect, openApp, pickPoint, placeAction, test } from './helpers';

/** Markup and quotes that would do something if treated as HTML. */
const HOSTILE = `<img src=x onerror="window.pwned=1"><b id="injected">bold</b>"'&`;

const panelTitle = (page: Page) => page.locator('.panel__title');

/** Nothing ran, nothing was turned into elements, objects behave as usual. */
async function expectNothingInjected(page: Page) {
  const found = await page.evaluate(() => ({
    pwned: (window as unknown as { pwned?: number }).pwned,
    injected: document.querySelectorAll('#injected, img[src="x"], img[src$="/x"]').length,
    polluted: ({} as Record<string, unknown>).polluted,
  }));
  expect(found).toEqual({ pwned: undefined, injected: 0, polluted: undefined });
}

test.describe('outside data shows as text', () => {
  test('a place name in a link', async ({ page }) => {
    await page.goto(`/#at=60.17,24.94&name=${encodeURIComponent(HOSTILE)}`);
    await expect(panelTitle(page)).toContainText('<img src=x');
    await expect(page).toHaveTitle(/<img src=x/);
    await expectNothingInjected(page);
  });

  test('a very long name in a link is cut short', async ({ page }) => {
    await page.goto(`/#at=60.17,24.94&name=${'A'.repeat(5000)}`);
    await expect(panelTitle(page)).toContainText('AAAA');
    expect(((await panelTitle(page).textContent()) ?? '').length).toBeLessThanOrEqual(120);
  });

  test('a place name from the search', async ({ page }) => {
    const results = JSON.parse(
      readFileSync(new URL('fixtures/geocoding-oslo.json', import.meta.url), 'utf8'),
    );
    results.results[0].name = HOSTILE;
    results.results[0].admin1 = HOSTILE;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: results }),
    );
    await openApp(page);
    await page.locator('#search-input').fill('Oslo');
    const option = page.getByRole('option').first();
    await expect(option).toContainText('<img src=x');
    await expectNothingInjected(page);
    await option.click();
    await expect(panelTitle(page)).toContainText('<img src=x');
    await expectNothingInjected(page);
  });

  test("a tapped point's name", async ({ page }) => {
    await page.route('https://nominatim.openstreetmap.org/**', (route) =>
      route.fulfill({
        json: { name: HOSTILE, address: { city: HOSTILE, country: HOSTILE } },
      }),
    );
    await openApp(page);
    await pickPoint(page);
    await expect(panelTitle(page)).toContainText('<img src=x');
    await expectNothingInjected(page);
  });

  test.describe('a warning', () => {
    test.use({ warningsMode: 'active' });

    test("a warning's texts", async ({ page }) => {
      const warnings = metnoWarningsFixture();
      for (const feature of warnings.features) {
        Object.assign(feature.properties, {
          eventAwarenessName: HOSTILE,
          description: HOSTILE,
          consequences: HOSTILE,
          instruction: HOSTILE,
        });
      }
      await page.route('https://api.met.no/**', (route) => route.fulfill({ json: warnings }));
      await openApp(page);
      await pickPoint(page);
      const box = page.locator('.warning').first();
      await expect(box.locator('summary')).toContainText('<img src=x');
      await box.locator('summary').click();
      await expect(box.locator('.warning__text').first()).toContainText('<img src=x');
      await expectNothingInjected(page);
    });
  });
});

test.describe('saved data', () => {
  test('odd or hostile saved data: shown as text, nothing polluted, no crash', async ({ page }) => {
    await page.addInitScript((hostile) => {
      const pollute =
        '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}';
      for (const key of [
        'units',
        'theme',
        'skin',
        'language',
        'start-place',
        'journey',
        'quiz',
        'balloon',
        'weather-layer',
        'weather-layer-cache',
        'folded-sections',
        'saved-forecasts',
        'rain-radar',
      ]) {
        localStorage.setItem(`nordic-weather:${key}`, pollute);
      }
      localStorage.setItem(
        'nordic-weather:favourites',
        JSON.stringify({
          version: 1,
          places: [
            { name: hostile, lat: 60.17, lng: 24.94, label: hostile },
            { name: hostile, lat: 59.91, lng: 10.75 },
            { name: 'Not a place', lat: 'x', lng: null },
          ],
        }).replace('"version":1', '"version":1,"__proto__":{"polluted":true}'),
      );
    }, HOSTILE);
    await openApp(page);
    await page.locator('#search-input').click();
    await expect(page.getByRole('option').first()).toContainText('<img src=x');
    await expectNothingInjected(page);
  });
});

test("sharing: only the place's name as text and our own link", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        (window as unknown as { shared?: ShareData }).shared = data;
      },
    });
  });
  await page.goto(`/#at=60.17,24.94&name=${encodeURIComponent(HOSTILE)}`);
  await expect(panelTitle(page)).toContainText('<img src=x');
  await placeAction(page, 'Share this place');
  const sharedData = () =>
    page.evaluate(() => (window as unknown as { shared?: ShareData }).shared);
  await expect.poll(sharedData).toBeTruthy();
  const shared = (await sharedData())!;
  const origin = await page.evaluate(() => location.origin);
  const url = new URL(shared.url!);
  expect(url.origin).toBe(origin);
  expect(url.pathname).toBe('/');
  // The name travels encoded in the hash, never as markup.
  expect(shared.url).not.toContain('<');
  expect(shared.url).not.toContain('"');
});

test.describe('headers', () => {
  for (const path of ['/', '/no-such-page']) {
    test(`security headers on ${path}`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(path === '/' ? 200 : 404);
      const headers = response.headers();
      expect(headers['content-security-policy']).toContain("default-src 'self'");
      expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(headers['content-security-policy']).toContain("object-src 'none'");
      expect(headers['content-security-policy']).not.toContain('unsafe-inline');
      expect(headers['content-security-policy']).not.toContain('unsafe-eval');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['strict-transport-security']).toContain('max-age=31536000');
    });
  }
});
