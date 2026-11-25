// Severe weather warnings: the service follows the place's time zone
// (MET Norway, Environment Canada, US NWS), warnings show at the top of the
// weather, and "More details" says whether there are none, the area isn't
// covered, or they couldn't be checked.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { FMI_IDS } from './fixtures/fmi';
import { chooseUnit, expect, openApp, pickPoint, snapshot, test } from './helpers';

const status = (page: Page) =>
  page.locator('.more-details .details__row', { hasText: 'Weather warnings' }).locator('dd');
const warnings = (page: Page) => page.locator('.warnings details');
const coverage = (page: Page) => page.locator('.warnings__coverage');
const HELSINKI = '/#at=60.17,24.94&name=Helsinki,+Finland';

/** Answers the forecast as if the place were in another time zone. */
async function placeIn(page: Page, timezone: string) {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { ...forecastFixture(), timezone } }),
  );
}

/** Records which warning services the page asks. */
function warningRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    const hosts = [
      'api.weather.gc.ca',
      'api.weather.gov',
      'api.met.no',
      'opendata-download-warnings.smhi.se',
    ];
    if (hosts.includes(host)) {
      urls.push(request.url());
    }
  });
  return urls;
}

test.describe('weather warnings', () => {
  test("only the place's own service's code is downloaded", async ({ page }) => {
    // Each service's code is a file of its own, loaded on demand.
    const loaded: string[] = [];
    page.on('request', (request) => {
      const file = /\/assets\/(eccc|nws|metno|smhi|fmi)-[^/]+\.js$/.exec(request.url());
      if (file) loaded.push(file[1]);
    });
    await openApp(page);
    expect(loaded).toEqual([]);
    // Oslo: MET Norway.
    await pickPoint(page);
    await expect(status(page)).toHaveText('None in effect · MET Norway');
    expect(loaded).toEqual(['metno']);
  });

  test('with none in effect, says so and shows no boxes', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(status(page)).toHaveText('None in effect · MET Norway');
    await expect(warnings(page)).toHaveCount(0);
    // Said at the top too, so no box never reads as "all clear".
    await expect(coverage(page)).toHaveText('No official warnings in effect · MET Norway');
    await expect(coverage(page).getByRole('link')).toHaveAttribute('href', 'https://www.yr.no/en');
  });

  test.describe('in effect', () => {
    test.use({ warningsMode: 'active' });

    test('Norway: MET Norway warning at the top, land only', async ({ page }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      // The marine gale warning is for boats, not this place.
      await expect(warnings(page)).toHaveCount(1);
      const box = warnings(page).first();
      await expect(box).toHaveClass(/warning--yellow/);
      // 20:00 UTC is 21:00 in Oslo.
      await expect(box.locator('summary')).toHaveText('⚠Wind warning · until Mon 21:00');
      // First thing in the weather, above the temperature.
      await expect(page.locator('.panel__body > :first-child')).toHaveClass('warnings');
      await expect(status(page)).toHaveText('1 in effect (see top) · MET Norway');
      await expect(page.locator('.panel__summary')).toHaveText(/^⚠ Wind warning · /);
      await snapshot(page, testInfo, 'warning');

      // Closed at first; a tap opens the full text.
      await expect(box.locator('.warning__text').first()).toBeHidden();
      await box.locator('summary').click();
      await expect(box.locator('.warning__text')).toHaveText([
        'Strong winds from the south-west, gusts up to 25 m/s.',
        'Danger of falling trees.',
      ]);
      await expect(box.locator('.warning__instruction')).toHaveText(
        'Secure loose objects outdoors.',
      );
      await expect(box.locator('.warning__source')).toHaveText('Issued by MET Norway');
      await snapshot(page, testInfo, 'warning opened');
    });

    test('Sweden: SMHI, only areas holding the point, land only', async ({ page }) => {
      const requests = warningRequests(page);
      await placeIn(page, 'Europe/Stockholm');
      await openApp(page);
      await pickPoint(page);
      // The far-away flood, the sea wind and the river (a line) don't show.
      await expect(warnings(page)).toHaveCount(1);
      const box = warnings(page).first();
      await expect(box).toHaveClass(/warning--yellow/);
      // 20:00 UTC is 21:00 in Stockholm.
      await expect(box.locator('summary')).toHaveText('⚠Wind warning · until Mon 21:00');
      await box.locator('summary').click();
      await expect(box.locator('.warning__text')).toHaveText([
        'Description of incident: Gusts up to 25 m/s.',
        'What to expect: Fallen trees and power cuts.',
      ]);
      await expect(box.locator('.warning__source')).toHaveText('Issued by SMHI');
      await expect(status(page)).toHaveText('1 in effect (see top) · SMHI');
      expect(requests).toHaveLength(1);
      expect(requests[0]).toContain('opendata-download-warnings.smhi.se');
    });

    test('Canada: Environment Canada, active only, each once', async ({ page }) => {
      const requests = warningRequests(page);
      await placeIn(page, 'America/Toronto');
      await openApp(page);
      await pickPoint(page);
      // Listed for two areas around the point, shown once; the ended
      // statement is left out.
      await expect(warnings(page)).toHaveCount(1);
      await expect(warnings(page).first().locator('.warning__title')).toHaveText(
        'Snowfall warning',
      );
      // Both areas named, so it's clear where it applies.
      await expect(warnings(page).first().locator('.warning__area')).toHaveText(
        'City of Toronto, Toronto - Etobicoke',
      );
      await expect(status(page)).toHaveText(
        '1 in effect (see top) · Environment and Climate Change Canada',
      );
      await warnings(page).first().locator('summary').click();
      await expect(warnings(page).first().locator('.warning__text')).toHaveText([
        'Snowfall with total amounts of 15 to 25 cm is expected.',
        'Travel may be hazardous.',
      ]);
      expect(requests.every((url) => url.startsWith('https://api.weather.gc.ca/'))).toBe(true);
      expect(new URL(requests[0]).searchParams.get('bbox')).toMatch(/^-?\d/);
    });

    test('US: National Weather Service, real alerts only, with their areas', async ({ page }) => {
      const requests = warningRequests(page);
      await placeIn(page, 'America/New_York');
      await openApp(page);
      await pickPoint(page);
      // The test message is left out; "Severe" shows as orange, first.
      await expect(warnings(page)).toHaveCount(2);
      const box = warnings(page).first();
      await expect(box).toHaveClass(/warning--orange/);
      await expect(box.locator('.warning__title')).toHaveText('Winter Storm Warning');
      await expect(box.locator('.warning__until')).toHaveText(' · until Mon 15:00');
      // Its zones (the first three), so a tap nearby isn't puzzling (#55).
      await expect(box.locator('.warning__area')).toHaveText(
        'Northern Erie, Southern Erie, Genesee…',
      );
      // A marine zone's alert says it's for the sea area.
      await expect(warnings(page).nth(1).locator('.warning__area')).toHaveText(
        'Sea area: San Francisco Bay South of the Bay Bridge',
      );
      await box.locator('summary').click();
      await expect(box.locator('.warning__instruction')).toContainText('extra flashlight');
      await expect(box.locator('.warning__source')).toHaveText(
        'Issued by US National Weather Service',
      );
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatch(/^https:\/\/api\.weather\.gov\/alerts\/active\?point=/);
    });

    test('elsewhere: says warnings are not available, asks nobody', async ({ page }) => {
      const requests = warningRequests(page);
      await placeIn(page, 'Asia/Tokyo');
      await openApp(page);
      await pickPoint(page);
      await expect(status(page)).toHaveText('Not available for this area');
      await expect(warnings(page)).toHaveCount(0);
      await expect(coverage(page)).toHaveText(
        "This app doesn't show warnings for this region. Official warnings: WMO severe weather",
      );
      await expect(coverage(page).getByRole('link')).toHaveAttribute(
        'href',
        'https://severeweather.wmo.int/',
      );
      expect(requests).toEqual([]);
    });

    test('elsewhere in Europe: points to MeteoAlarm', async ({ page }) => {
      await placeIn(page, 'Europe/Berlin');
      await openApp(page);
      await pickPoint(page);
      await expect(coverage(page)).toHaveText(
        "This app doesn't show warnings for this region. Official warnings: MeteoAlarm",
      );
      await expect(coverage(page).getByRole('link')).toHaveAttribute(
        'href',
        'https://meteoalarm.org/',
      );
    });

    test("Finland: FMI's warnings through the site's broker, matched here", async ({ page }) => {
      const asked: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) asked.push(url.pathname);
      });
      await placeIn(page, 'Europe/Helsinki');
      await page.goto(HELSINKI);
      // Most serious first; the one starting tomorrow says so.
      await expect(warnings(page)).toHaveCount(2);
      await expect(warnings(page).nth(0)).toHaveClass(/warning--orange/);
      await expect(warnings(page).nth(0).locator('summary')).toContainText('Wind warning');
      await expect(warnings(page).nth(0).locator('summary')).toContainText(/ · until /);
      await expect(warnings(page).nth(0).locator('.warning__area')).toHaveText('Helsinki, Espoo');
      await expect(warnings(page).nth(1).locator('summary')).toContainText(
        'Traffic weather warning',
      );
      await expect(warnings(page).nth(1).locator('summary')).toContainText(/ · from .+ until /);
      await warnings(page).nth(0).locator('summary').click();
      await expect(warnings(page).nth(0)).toContainText('Wind warning text.');
      await expect(warnings(page).nth(0)).toContainText('Take care.');
      await expect(
        warnings(page).nth(0).getByRole('link', { name: 'Finnish Meteorological Institute' }),
      ).toHaveAttribute('href', 'https://en.ilmatieteenlaitos.fi/warnings');
      await expect(status(page)).toHaveText(
        '2 in effect (see top) · Finnish Meteorological Institute',
      );
      await expect(coverage(page)).toHaveCount(0);
      // Lapland's box is far away and the cancelled one has none: never
      // fetched. No location went to the broker.
      expect(asked).not.toContain(`/api/fmi/warning/${FMI_IDS.lapland}`);
      expect(asked).not.toContain(`/api/fmi/warning/${FMI_IDS.cancelled}`);
      expect(asked).toContain(`/api/fmi/warning/${FMI_IDS.expired}`);
      expect(asked.every((path) => !/60\.17|24\.94/.test(path))).toBe(true);
    });

    test('Finland: a point outside every area has none', async ({ page }) => {
      await placeIn(page, 'Europe/Helsinki');
      await page.goto('/#at=62.6,29.76&name=Joensuu,+Finland');
      await expect(coverage(page)).toHaveText(
        'No official warnings in effect · Finnish Meteorological Institute',
      );
      await expect(warnings(page)).toHaveCount(0);
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test("Finland: FMI's texts and page in Finnish", async ({ page }) => {
        await placeIn(page, 'Europe/Helsinki');
        await page.goto('/#at=60.17,24.94&name=Helsinki,+Suomi');
        await expect(warnings(page).nth(0).locator('summary')).toContainText('Tuulivaroitus');
        await expect(warnings(page).nth(0).locator('summary')).toContainText('asti');
        await warnings(page).nth(0).locator('summary').click();
        await expect(
          warnings(page).nth(0).getByRole('link', { name: 'Ilmatieteen laitos' }),
        ).toHaveAttribute('href', 'https://www.ilmatieteenlaitos.fi/varoitukset');
      });
    });

    test('a unit switch keeps the warnings', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(warnings(page)).toHaveCount(1);
      await chooseUnit(page, '°F');
      await expect(page.locator('.current__temp')).toHaveText('40 °F');
      await expect(warnings(page)).toHaveCount(1);
      await expect(status(page)).toHaveText('1 in effect (see top) · MET Norway');
    });
  });

  test.describe('when the service fails', () => {
    test.use({ warningsMode: 'server-error' });

    test('says they could not be checked; the weather still shows', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('5 °C');
      await expect(status(page)).toHaveText("Couldn't be checked right now");
      await expect(warnings(page)).toHaveCount(0);
      await expect(coverage(page)).toHaveText("Official warnings couldn't be checked: MET Norway");
    });

    test("Finland: the broker failing says so, with FMI's page", async ({ page }) => {
      await placeIn(page, 'Europe/Helsinki');
      await page.goto(HELSINKI);
      await expect(coverage(page)).toHaveText(
        "Official warnings couldn't be checked: Finnish Meteorological Institute",
      );
      await expect(coverage(page).getByRole('link')).toHaveAttribute(
        'href',
        'https://en.ilmatieteenlaitos.fi/warnings',
      );
    });
  });
});
