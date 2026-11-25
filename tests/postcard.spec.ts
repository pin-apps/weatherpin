// "Share as a picture" in the ⋯ menu (src/postcard.ts): a 1080×1080
// postcard of the weather shown. Shared through the share sheet where
// there is one, else downloaded. Each test attaches its picture to the
// report, to look at.

import { readFileSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { expect, placeAction, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

/** Width and height from a PNG's header. */
function pngSize(png: Buffer): [number, number] {
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

/** Opens `link`, makes the picture (downloaded) and attaches it to the report. */
async function postcard(page: Page, testInfo: TestInfo, link: string, name: string) {
  await page.goto(link);
  await expect(page.locator('.current__temp')).toBeVisible();
  const download = page.waitForEvent('download');
  await placeAction(page, 'Share as a picture');
  const file = await download;
  const path = testInfo.outputPath(file.suggestedFilename());
  await file.saveAs(path);
  const png = readFileSync(path);
  await testInfo.attach(name, { body: png, contentType: 'image/png' });
  return { png, file };
}

/** The fake forecast with some of the weather now changed. */
async function weatherNow(page: Page, now: Record<string, number>) {
  // Registered after the fake network, so it takes over forecast requests.
  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const forecast = forecastFixture();
    Object.assign(forecast.current, now);
    return route.fulfill({ json: forecast });
  });
}

test.describe('weather postcard', () => {
  test('a 1080×1080 picture, downloaded where there is no share sheet', async ({
    page,
  }, testInfo) => {
    const { png, file } = await postcard(page, testInfo, OSLO, 'postcard, rainy day');
    expect(file.suggestedFilename()).toBe('weatherpin-oslo.png');
    expect(pngSize(png)).toEqual([1080, 1080]);
    await expect(page.locator('.panel__action-status')).toHaveText('Picture saved');
  });

  test('goes to the share sheet as a picture where there is one', async ({ page }) => {
    await page.addInitScript(() => {
      const shared: { name: string; type: string; size: number; title?: string }[] = [];
      Object.assign(window, { shared });
      Object.assign(navigator, {
        canShare: (data: ShareData) => Boolean(data.files?.length),
        share: async (data: ShareData) => {
          const file = data.files![0];
          shared.push({ name: file.name, type: file.type, size: file.size, title: data.title });
        },
      });
    });
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Share as a picture');
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { shared: unknown[] }).shared))
      .toEqual([
        {
          name: 'weatherpin-oslo.png',
          type: 'image/png',
          size: expect.any(Number),
          title: 'Weather in Oslo, Norway',
        },
      ]);
  });

  test('a sunny day', async ({ page }, testInfo) => {
    await weatherNow(page, {
      weather_code: 0,
      is_day: 1,
      temperature_2m: 24,
      apparent_temperature: 25,
    });
    const { png } = await postcard(page, testInfo, OSLO, 'postcard, sunny day');
    expect(pngSize(png)).toEqual([1080, 1080]);
  });

  test('at night', async ({ page }, testInfo) => {
    await weatherNow(page, { weather_code: 1, is_day: 0 });
    const { png } = await postcard(page, testInfo, OSLO, 'postcard, night');
    expect(pngSize(png)).toEqual([1080, 1080]);
  });

  test('a very long place name still fits', async ({ page }, testInfo) => {
    const { png } = await postcard(
      page,
      testInfo,
      '/#at=53.22,-4.2&name=Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch,+United+Kingdom',
      'postcard, long name',
    );
    expect(pngSize(png)).toEqual([1080, 1080]);
  });

  test('a long one-word name breaks between syllables, with a hyphen', async ({
    page,
  }, testInfo) => {
    // Records the texts drawn on the canvas. Text measures 1.6× wider, as in
    // a wide phone font: the test browser's font is narrow enough to fit
    // the name on one line, where the user's phone broke it.
    await page.addInitScript(() => {
      const drawn: string[] = [];
      Object.assign(window, { drawnTexts: drawn });
      const proto = CanvasRenderingContext2D.prototype;
      const { fillText, measureText } = proto;
      proto.fillText = function (value, ...rest) {
        drawn.push(value);
        return fillText.call(this, value, ...rest);
      };
      proto.measureText = function (value) {
        return { width: measureText.call(this, value).width * 1.6 } as TextMetrics;
      };
    });
    const { png } = await postcard(
      page,
      testInfo,
      '/#at=62.28,21.38&name=Kristiinankaupunki,+Finland',
      'postcard, Kristiinankaupunki',
    );
    expect(pngSize(png)).toEqual([1080, 1080]);
    const drawn = await page.evaluate(
      () => (window as unknown as { drawnTexts: string[] }).drawnTexts,
    );
    expect(drawn).toContain('KRISTIINAN-');
    expect(drawn).toContain('KAUPUNKI');
    expect(drawn).not.toContain('NKAUPUNKI');
  });

  test('not offered before the weather has loaded, nor after closing', async ({ page }) => {
    await page.goto(OSLO);
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('.panel__postcard')).toBeAttached();
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    await expect(page.locator('.panel__postcard')).toBeHidden();
  });

  test.describe("a past day's postcard (Weather on a day)", () => {
    /** Records the texts drawn on the canvas, in `window.drawnTexts`. */
    async function recordTexts(page: Page) {
      await page.addInitScript(() => {
        const drawn: string[] = [];
        Object.assign(window, { drawnTexts: drawn });
        const proto = CanvasRenderingContext2D.prototype;
        const { fillText } = proto;
        proto.fillText = function (value, ...rest) {
          drawn.push(value);
          return fillText.call(this, value, ...rest);
        };
      });
    }
    const drawnTexts = (page: Page) =>
      page.evaluate(() => (window as unknown as { drawnTexts: string[] }).drawnTexts);

    /** Opens Weather on a day at `link` and shows the day `button` picks. */
    async function showPastDay(page: Page, link: string, menu: string, button: string) {
      await page.goto(link);
      await expect(page.locator('.current__temp')).toBeVisible();
      await page.locator('.panel__more').click();
      await page.locator('#panel-menu').getByRole('button', { name: menu }).click();
      const dialog = page.locator('#past-weather');
      await expect(dialog.locator('.past-weather__share')).toBeHidden();
      await dialog.getByRole('button', { name: button }).click();
      await expect(dialog.locator('.past-weather__today')).toBeVisible();
      return dialog;
    }

    test('"Greetings from 2016": that day in the stamp and postmark, against today', async ({
      page,
    }, testInfo) => {
      await recordTexts(page);
      const dialog = await showPastDay(page, OSLO, 'Weather on a day…', '10 years ago');
      const download = page.waitForEvent('download');
      await dialog.getByRole('button', { name: 'Share as a picture' }).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe('weatherpin-oslo-2016-11-15.png');
      const path = testInfo.outputPath(file.suggestedFilename());
      await file.saveAs(path);
      const png = readFileSync(path);
      await testInfo.attach('postcard, a past day', { body: png, contentType: 'image/png' });
      expect(pngSize(png)).toEqual([1080, 1080]);
      await expect(dialog.locator('.past-weather__status')).toHaveText('Picture saved');

      const drawn = await drawnTexts(page);
      expect(drawn).toContain('Greetings from 2016');
      expect(drawn).toContain('OSLO');
      // The postmark: that day, not today.
      expect(drawn).toEqual(expect.arrayContaining(['15', 'NOV', '2016']));
      expect(drawn.some((value) => /Tuesday,? 15 November 2016/.test(value))).toBe(true);
      expect(drawn).toContain('Clear sky · high -8 °C · low -15 °C');
      expect(drawn).toContain('Today: 6 °C / -1 °C, 14° warmer');
      // No forecast on it.
      expect(drawn).not.toContain('Tomorrow');
    });

    test('goes to the share sheet with the date in its title', async ({ page }) => {
      await page.addInitScript(() => {
        const shared: { name: string; title?: string }[] = [];
        Object.assign(window, { shared });
        Object.assign(navigator, {
          canShare: (data: ShareData) => Boolean(data.files?.length),
          share: async (data: ShareData) => {
            shared.push({ name: data.files![0].name, title: data.title });
          },
        });
      });
      const dialog = await showPastDay(page, OSLO, 'Weather on a day…', '1 year ago');
      await dialog.getByRole('button', { name: 'Share as a picture' }).click();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { shared: unknown[] }).shared))
        .toEqual([
          {
            name: 'weatherpin-oslo-2025-11-15.png',
            title: expect.stringMatching(
              /^Weather in Oslo, Norway on Saturday,? 15 November 2025$/,
            ),
          },
        ]);
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test('"Terveisiä vuodelta 2025"', async ({ page }, testInfo) => {
        await recordTexts(page);
        const dialog = await showPastDay(
          page,
          '/#at=60.17,24.94&name=Helsinki,+Suomi',
          'Sää tiettynä päivänä…',
          'Vuosi sitten',
        );
        const download = page.waitForEvent('download');
        await dialog.getByRole('button', { name: 'Jaa kuvana' }).click();
        const file = await download;
        expect(file.suggestedFilename()).toBe('weatherpin-helsinki-2025-11-15.png');
        const path = testInfo.outputPath('past-fi.png');
        await file.saveAs(path);
        await testInfo.attach('postcard, a past day, Finnish', {
          body: readFileSync(path),
          contentType: 'image/png',
        });
        const drawn = await drawnTexts(page);
        expect(drawn).toContain('Terveisiä vuodelta 2025');
        expect(drawn).toContain('Tänään: 6 °C / -1 °C, 14° lämpimämpää');
      });
    });
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Terveisiä täältä:"', async ({ page }, testInfo) => {
      await page.goto('/#at=60.17,24.94&name=Helsinki,+Suomi');
      await expect(page.locator('.current__temp')).toBeVisible();
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Lisää toimintoja' }).click();
      await page.getByRole('button', { name: 'Jaa kuvana' }).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe('weatherpin-helsinki.png');
      const path = testInfo.outputPath('fi.png');
      await file.saveAs(path);
      await testInfo.attach('postcard, Finnish', {
        body: readFileSync(path),
        contentType: 'image/png',
      });
      await expect(page.locator('.panel__action-status')).toHaveText('Kuva tallennettu');
    });
  });
});
