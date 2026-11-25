// User flows end to end: search, "My location", error and polar states, and
// map gestures. Each attaches screenshots to the HTML report so a CI run can
// be looked at screen by screen.

import type { Page } from '@playwright/test';
import { forecastFixture } from './fixtures/forecast';
import { chooseUnit, expect, openApp, pickPoint, snapshot, test, waitForTiles } from './helpers';

test.describe('search', () => {
  test('choosing a suggestion shows the weather there', async ({ page }, testInfo) => {
    await openApp(page);
    await page.locator('#search-input').fill('Oslo');

    const options = page.getByRole('option');
    await expect(options).toHaveCount(5);
    await snapshot(page, testInfo, 'suggestions');

    await options.first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await expect(
      page.locator('.more-details .details__row', { hasText: 'Coordinates' }),
    ).toContainText('59.91° N');
    await expect(page.locator('.current__temp')).toHaveText('5 °C');
    await snapshot(page, testInfo, 'weather for Oslo');
  });

  test('works with the keyboard', async ({ page }) => {
    await openApp(page);
    const input = page.locator('#search-input');
    await input.fill('Oslo');
    await expect(page.getByRole('option')).toHaveCount(5);

    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await expect(page.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
    await input.press('Enter');
    await expect(page.locator('#panel-title')).toHaveText('Oslo, United States');
  });

  test('says when nothing is found', async ({ page }, testInfo) => {
    await openApp(page);
    await page.locator('#search-input').fill('zzqxw');
    await expect(page.locator('.search__message')).toHaveText('No places found.');
    await snapshot(page, testInfo, 'no results');
  });
});

test.describe('my location', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 59.91, longitude: 10.75 },
  });

  test('flies to the user and shows the weather', async ({ page }, testInfo) => {
    await openApp(page);
    await page.locator('#locate-button').click();
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(page.locator('#panel-title')).toHaveText('59.91° N, 10.75° E');
    await expect(page.locator('.pick-marker')).toBeVisible();
    // A dot marks the user's position, apart from the place's marker.
    await expect(page.locator('.user-position')).toBeVisible();
    await snapshot(page, testInfo, 'my location');
  });

  test('the dot stays while other places are looked at', async ({ page }) => {
    await openApp(page);
    await page.locator('#locate-button').click();
    await expect(page.locator('.user-position')).toBeVisible();

    // Another place, then the panel closed: the dot is still there (one).
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').nth(1).click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, United States');
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    await expect(page.locator('.user-position')).toHaveCount(1);

    // Not saved: gone when the app is opened again.
    await page.goto('/');
    await waitForTiles(page);
    await expect(page.locator('.user-position')).toHaveCount(0);
  });

  test('no dot without My location', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.user-position')).toHaveCount(0);
  });
});

test.describe('my location, permission denied', () => {
  test.use({ permissions: [] });

  test('explains that access is blocked', async ({ page, context }, testInfo) => {
    await context.clearPermissions();
    await openApp(page);
    await page.locator('#locate-button').click();
    await expect(page.locator('#locate-message')).toContainText('blocked');
    await snapshot(page, testInfo, 'location blocked');
  });
});

test.describe('forecast states', () => {
  test('shows the full forecast for a clicked point', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.local-time__value')).toHaveText(
      // WebKit uses the system's date data: older versions add a comma.
      /^Sun,? 15 Nov, 14:05$/,
    );
    await expect(page.locator('.hourly__item')).toHaveCount(24);
    await expect(page.locator('.hourly__time').first()).toHaveText('Now');
    await expect(page.locator('.daily__item')).toHaveCount(7);
    await expect(page.locator('.daily__day').first()).toHaveText('Today');
    await expect(
      page.locator('.details__row').filter({ has: page.locator('dt', { hasText: /^Pressure$/ }) }),
    ).toContainText('1004 hPa ↓ falling');
    await snapshot(page, testInfo, 'forecast');

    // Gusts next to the wind; snow apart from the rain amount, on snowy days.
    await expect(page.locator('.details__row', { hasText: 'Wind' })).toContainText(
      '13 mph from SW',
    );
    await expect(page.locator('.details__row', { hasText: 'Wind' })).toContainText('gusts 25 mph');
    await expect(page.locator('.details__row', { hasText: 'Precipitation' })).toHaveText(
      /^Precipitation\s*0\.2 mm$/,
    );
    const snowDays = page.locator('.daily__item').filter({ has: page.locator('.daily__snow') });
    await expect(snowDays.locator('.daily__day')).toHaveText(['Tue', 'Fri']);
    await expect(snowDays.locator('.daily__snow')).toHaveText([
      /^Snow ❄ 2\.1 cm$/,
      /^Snow ❄ 0\.6 cm$/,
    ]);

    // By how often people need each part: now, forecasts, air quality in
    // full, then the less-checked details.
    // (The warnings come first: tests/warnings.spec.ts.)
    const sections = page.locator('.panel__body > section:not(.warnings)');
    await expect(sections).toHaveClass([
      /\bcurrent\b/,
      /forecast-section/,
      /forecast-section/,
      /air-quality/,
      /\bsky\b/,
      /more-details/,
    ]);
    await expect(sections.locator('.section-title .fold__title')).toHaveText([
      'Next 24 hours',
      '7 days',
      'Air quality',
      'Sky',
      'More details',
    ]);
    // At a glance: wind, rain, UV and the air quality badge.
    await expect(page.locator('.current dt')).toHaveText([
      'Wind',
      'Precipitation',
      'UV index',
      'Air quality',
    ]);
    await expect(page.locator('.glance-aqi')).toHaveText(/^30\s*Fair\s*European AQI$/);

    // Scroll to the 7-day list so it's in the screenshot too.
    await page.locator('.daily').scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'forecast, 7 days');
  });

  test.describe('polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('says the sun does not rise', async ({ page }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.sky .details')).toContainText('Polar night');
      // Snow falling now: shown in cm next to the melted-water amount.
      await expect(page.locator('.details__row', { hasText: 'Precipitation' })).toContainText(
        '0.2 mm · 0.4 cm snow',
      );
      await snapshot(page, testInfo, 'polar night');
    });

    test('shows the moon but no day length', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(moreDetail(page, 'Daylight')).toHaveCount(0);
      await expect(moreDetail(page, 'Moon')).toContainText('Waxing crescent');
    });
  });

  test.describe('server error', () => {
    test.use({ forecastMode: 'server-error' });

    test('shows the error with a retry button', async ({ page }, testInfo) => {
      await openApp(page);
      const size = page.viewportSize()!;
      await page.mouse.click(size.width / 2, size.height * 0.35);
      await expect(page.locator('.panel__error')).toContainText('Test server error');
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
      await snapshot(page, testInfo, 'error');
    });
  });
});

// Sun and moon: in the Sky section (render/sky.ts).
const moreDetail = (page: Page, label: string) =>
  page
    .locator('.sky .details__row')
    .filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd');

test.describe('sun and moon', () => {
  test('day length with its change by tomorrow, and the moon', async ({ page }) => {
    // The test clock says 15 November 2026: 6 days after a new moon.
    await page.goto('/#at=59.91,10.75&name=Oslo');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(moreDetail(page, 'Daylight')).toHaveText('7 h 05 min · 4 min shorter tomorrow');
    await expect(moreDetail(page, 'Moon')).toHaveText('🌒 Waxing crescent · 32 % lit');
    // The emoji is only a picture; the name says it.
    await expect(moreDetail(page, 'Moon').locator('.moon__emoji')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  test('the moon is seen mirrored south of the equator', async ({ page }) => {
    await page.goto('/#at=-33.87,151.21&name=Sydney');
    await expect(page.locator('.current__temp')).toBeVisible();
    await expect(moreDetail(page, 'Moon')).toHaveText('🌘 Waxing crescent · 32 % lit');
  });
});

test.describe('what to wear', () => {
  const wear = (page: Page) => page.locator('.current__wear');

  test('rain and gusts: a jacket and a hood', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    // Feels like 1 °C, raining, gusts 11 m/s.
    await expect(wear(page)).toHaveText(
      /^🧥\s*What to wear:\s*Jacket, a hood \(too windy for an umbrella\)$/,
    );
    // The label is for screen readers; the emoji is only a picture.
    await expect(wear(page).locator('.visually-hidden')).toHaveText('What to wear:');
    await expect(wear(page).locator('.current__wear-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  test('a warm, dry, sunny day: shorts and sunscreen', async ({ page }) => {
    // Registered after the fake network, so it takes over forecast requests.
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const forecast = forecastFixture();
      Object.assign(forecast.current, {
        apparent_temperature: 27,
        precipitation: 0,
        wind_gusts_10m: 4,
        wind_speed_10m: 2,
        uv_index: 6,
      });
      forecast.minutely_15.precipitation = forecast.minutely_15.precipitation.map(() => 0);
      forecast.hourly.precipitation = forecast.hourly.precipitation.map(() => 0);
      forecast.hourly.precipitation_probability = forecast.hourly.precipitation_probability.map(
        () => 0,
      );
      return route.fulfill({ json: forecast });
    });
    await openApp(page);
    await pickPoint(page);
    // Dry all day: no word about umbrellas.
    await expect(wear(page)).toHaveText(
      /^🩳\s*What to wear:\s*Shorts weather, sunglasses and sunscreen$/,
    );
  });

  test.describe('do I need an umbrella?', () => {
    /** The fake forecast, calm and dry, then changed by `change`. */
    async function weather(
      page: Page,
      change: (forecast: ReturnType<typeof forecastFixture>) => void,
    ) {
      await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
        const forecast = forecastFixture();
        Object.assign(forecast.current, { precipitation: 0, wind_gusts_10m: 4, wind_speed_10m: 2 });
        forecast.minutely_15.precipitation = forecast.minutely_15.precipitation.map(() => 0);
        forecast.hourly.precipitation = forecast.hourly.precipitation.map(() => 0);
        forecast.hourly.precipitation_probability = forecast.hourly.precipitation_probability.map(
          () => 0,
        );
        change(forecast);
        return route.fulfill({ json: forecast });
      });
      await openApp(page);
      await pickPoint(page);
    }

    test('raining now: until when', async ({ page }) => {
      await weather(page, (forecast) => {
        forecast.current.precipitation = 0.3;
        forecast.minutely_15.precipitation = [0.3, 0.4, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      });
      await expect(wear(page)).toContainText('Jacket, umbrella (raining until about 14:45)');
    });

    test('rain soon: from when', async ({ page }) => {
      await weather(page, (forecast) => {
        forecast.minutely_15.precipitation = [0, 0, 0, 0, 0, 0.2, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      });
      await expect(wear(page)).toContainText('Jacket, umbrella (rain from about 15:15)');
    });

    test('rain later today: an umbrella for later', async ({ page }) => {
      await weather(page, (forecast) => {
        // 19:00 is hour 19 of the first day.
        (forecast.hourly.precipitation_probability as number[])[19] = 80;
        forecast.hourly.weather_code[19] = 61;
      });
      await expect(wear(page)).toContainText('Jacket, umbrella for later (rain from about 19:00)');
    });

    test('rain and gusts: a hood instead', async ({ page }) => {
      await weather(page, (forecast) => {
        Object.assign(forecast.current, { precipitation: 0.3, wind_gusts_10m: 12 });
      });
      await expect(wear(page)).toContainText('Jacket, a hood (too windy for an umbrella)');
    });

    test('after rain, or a small chance: no umbrella needed', async ({ page }) => {
      await weather(page, (forecast) => {
        // It rained at 12:00; dry from now on.
        (forecast.hourly.precipitation as number[])[12] = 0.8;
      });
      await expect(wear(page)).toHaveText(/What to wear:\s*Jacket, no umbrella needed today$/);
    });

    test('in °F', async ({ page }) => {
      await weather(page, (forecast) => {
        forecast.minutely_15.precipitation = [0, 0, 0, 0, 0, 0.2, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      });
      await chooseUnit(page, '°F');
      await expect(wear(page)).toContainText('umbrella (rain from about 15:15)');
    });

    test.describe('in Finnish', () => {
      test.use({ locale: 'fi-FI' });

      test('"sateenvarjo"', async ({ page }) => {
        await weather(page, (forecast) => {
          forecast.minutely_15.precipitation = [0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        });
        await expect(wear(page)).toContainText('sateenvarjo (sadetta noin klo 15:15 alkaen)');
      });
    });
  });

  test.describe('polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('winter gear, boots for the snow, windproof', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      // Feels like −20 °C, snowing, gusts 14 m/s.
      await expect(wear(page)).toContainText(
        'Winter gear: hat and mittens, waterproof boots, something windproof',
      );
    });
  });
});

test.describe('UV index', () => {
  const uvRow = (page: Page) =>
    page
      .locator('.current .details__row')
      .filter({ has: page.locator('dt', { hasText: 'UV index' }) })
      .locator('dd');

  test('shows the UV now and the peak of the day', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    await expect(uvRow(page)).toHaveText(
      /^1 Low · today's max 3 Moderate around 12:00\s*Sun protection 11:00–13:00$/,
    );
    await expect(uvRow(page).locator('.uv')).toHaveClass(/uv--level-1/);
    // The hours with UV 3 or more (2.5 at 11:00 rounds to 3, as shown).
    await expect(uvRow(page).locator('.uv-protection')).toHaveText('Sun protection 11:00–13:00');

    // 7 days: a badge only on days from UV 3 up (days 1, 4 and 6).
    const badges = page.locator('.daily__item .uv');
    await expect(badges).toHaveText([/^UV 3\s*Moderate$/, /^UV 5\s*Moderate$/, /^UV 6\s*High$/]);
    await expect(page.locator('.daily__item').nth(0).locator('.uv')).toHaveCount(1);
    await expect(page.locator('.daily__item').nth(1).locator('.uv')).toHaveCount(0);
    await expect(badges.nth(2)).toHaveClass(/uv--level-3/);
    await page.locator('.daily').scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'UV in 7 days');
  });

  test.describe('in polar night', () => {
    test.use({ forecastMode: 'polar-night' });

    test('says just 0 Low, with no badges', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(uvRow(page)).toHaveText('0 Low');
      await expect(uvRow(page).locator('.uv-protection')).toHaveCount(0);
      await expect(page.locator('.daily__item .uv')).toHaveCount(0);
    });
  });

  test('the weather still shows without UV data', async ({ page }) => {
    // Registered after the fake network, so it takes over forecast requests.
    await page.route('https://api.open-meteo.com/**', (route) => {
      const forecast = forecastFixture();
      delete (forecast.current as { uv_index?: number }).uv_index;
      delete (forecast.hourly as { uv_index?: unknown }).uv_index;
      delete (forecast.daily as { uv_index_max?: unknown }).uv_index_max;
      return route.fulfill({ json: forecast });
    });
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.current__temp')).toHaveText('5 °C');
    await expect(uvRow(page)).toHaveText('–');
    await expect(page.locator('.daily__item .uv')).toHaveCount(0);
  });
});

test.describe('air quality', () => {
  test('shows the European AQI and pollen in Europe', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    const section = page.locator('.air-quality');
    await expect(section.locator(':scope > .aqi')).toHaveText(/30\s*Fair\s*European AQI/);
    await expect(section).toContainText('PM2.5');
    await expect(section).toContainText('5.0 µg/m³');
    // Only pollen that's actually in the air is listed.
    await expect(section).toContainText('Birch pollen');
    await expect(section).not.toContainText('Grass pollen');
    await expect(section).toContainText('Copernicus Atmosphere Monitoring Service');
    await section.scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'air quality, Europe');
  });

  test('forecasts the worst air of each day in Europe', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    const days = page.getByRole('list', { name: 'Next days' }).getByRole('listitem');
    // Today counts only the hours still ahead (the 70 this morning is past);
    // the 5th day, with only a few hours of forecast, is left out.
    await expect(days).toHaveText([
      /^Today\s*42\s*Moderate\s*worst around 18:00$/,
      /^Mon\s*25\s*Fair$/,
      /^Tue\s*18\s*Good$/,
      /^Wed\s*55\s*Moderate$/,
    ]);
    await expect(days.first().locator('.aqi')).toHaveClass(/aqi--european aqi--level-3/);
    await days.last().scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'air quality forecast, Europe');
  });

  test('forecasts pollen per day in Europe', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    // Now: birch 25 grains/m³, moderate for a tree.
    await expect(
      page.locator('.air-quality .details__row', { hasText: 'Birch pollen' }),
    ).toContainText('· Moderate');
    // Each day's worst hour per type, highest level first; this morning's
    // 300 is past, and the 5th day has no data.
    const days = page.getByRole('list', { name: 'Pollen forecast' }).getByRole('listitem');
    await expect(days).toHaveText([
      /^Today\s*Birch: Moderate$/,
      /^Mon\s*Birch: High$/,
      /^Tue\s*Grass: Moderate\s*Birch: Low$/,
      /^Wed\s*None$/,
    ]);
    await expect(days.nth(1).locator('.pollen-level')).toHaveClass(/pollen-level--high/);
    await days.last().scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'pollen forecast');
  });

  test.describe('in North America', () => {
    test.use({ airQualityMode: 'north-america' });

    test('shows the US AQI and no pollen (New York)', async ({ page }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      const section = page.locator('.air-quality');
      await expect(section.locator(':scope > .aqi')).toHaveText(/22\s*Good\s*US AQI/);
      await expect(section).not.toContainText('pollen');
      await expect(page.getByRole('list', { name: 'Pollen forecast' })).toHaveCount(0);
      await section.scrollIntoViewIfNeeded();
      await snapshot(page, testInfo, 'air quality, New York');
    });

    test('forecasts five days in US AQI', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      const days = page.getByRole('list', { name: 'Next days' }).getByRole('listitem');
      await expect(days).toHaveText([
        /^Today\s*58\s*Moderate\s*worst around 17:00$/,
        /^Mon\s*40\s*Good$/,
        /^Tue\s*35\s*Good$/,
        /^Wed\s*72\s*Moderate$/,
        /^Thu\s*45\s*Good$/,
      ]);
      await expect(days.first().locator('.aqi')).toHaveClass(/aqi--us aqi--level-2/);
    });
  });

  test.describe('in Canada', () => {
    test.use({ airQualityMode: 'canada' });

    test("Canada's own index (AQHI), worked out from the pollutants", async ({
      page,
    }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.glance-aqi')).toHaveText(/^2\s*Low risk\s*Canada AQHI$/);
      const section = page.locator('.air-quality');
      await expect(section.locator(':scope > .aqi')).toHaveText(/^2\s*Low risk\s*Canada AQHI$/);
      await expect(section.locator(':scope > .aqi')).toHaveClass(/aqi--canada aqi--level-1/);
      await expect(section.locator('.air-quality__note')).toHaveText(
        'Worked out from forecast data; official readings can differ a little.',
      );

      // Above 10 is "10+".
      const days = page.getByRole('list', { name: 'Next days' }).getByRole('listitem');
      await expect(days).toHaveText([
        /^Today\s*5\s*Moderate risk\s*worst around 18:00$/,
        /^Mon\s*10\+\s*Very high risk$/,
        /^Tue\s*7\s*High risk$/,
        /^Wed\s*2\s*Low risk$/,
        /^Thu\s*2\s*Low risk$/,
      ]);
      await expect(days.nth(1).locator('.aqi')).toHaveClass(/aqi--canada aqi--level-4/);
      await section.scrollIntoViewIfNeeded();
      await snapshot(page, testInfo, 'air quality, Toronto');
    });
  });

  test.describe('in the UK', () => {
    test.use({ airQualityMode: 'uk' });

    test("the UK's own index (DAQI), worked out from the pollutants", async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.glance-aqi')).toHaveText(/^2\s*Low\s*UK DAQI$/);
      const section = page.locator('.air-quality');
      await expect(section.locator(':scope > .aqi')).toHaveClass(/aqi--uk aqi--level-1/);
      await expect(section.locator('.air-quality__note')).toBeVisible();
      const days = page.getByRole('list', { name: 'Next days' }).getByRole('listitem');
      await expect(days).toHaveText([
        /^Today\s*4\s*Moderate\s*worst around 18:00$/,
        /^Mon\s*5\s*Moderate$/,
        /^Tue\s*7\s*High$/,
        /^Wed\s*10\s*Very high$/,
        /^Thu\s*2\s*Low$/,
      ]);
      await expect(days.nth(3).locator('.aqi')).toHaveClass(/aqi--uk aqi--level-4/);
    });
  });

  test.describe('when the air quality service fails', () => {
    test.use({ airQualityMode: 'server-error' });

    test('the weather still shows', async ({ page }, testInfo) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.current__temp')).toHaveText('5 °C');
      await expect(page.locator('.air-quality')).toContainText(
        'Air quality is unavailable right now.',
      );
      await expect(page.locator('.glance-aqi')).toHaveText('–');
      await snapshot(page, testInfo, 'air quality unavailable');
    });
  });
});

test.describe('map gestures', () => {
  test('double-click zooms without placing a marker', async ({ page }) => {
    await openApp(page);
    const size = page.viewportSize()!;
    await page.mouse.dblclick(size.width / 2, size.height / 2);
    // Longer than the app's click delay, so a stray click would have fired.
    await page.waitForTimeout(600);
    await expect(page.locator('.pick-marker')).toHaveCount(0);
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('closing the panel removes the marker', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await page.getByRole('button', { name: 'Close weather panel' }).click();
    await expect(page.locator('#panel')).toBeHidden();
    await expect(page.locator('.pick-marker')).toHaveCount(0);
  });
});
