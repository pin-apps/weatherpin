// Automated accessibility checks (axe-core) against WCAG 2.2 A and AA:
// contrast, names and roles, labels, focus. Every main screen, on a phone
// and a desktop, in light and dark mode (contrast differs). Automated
// checks find roughly a third of accessibility problems; they're a floor,
// not a guarantee.

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, goOffline, openApp, openSettings, pickPoint, placeAction, test } from './helpers';
import { forecastFixture } from './fixtures/forecast';
import { roadForecastsFixture } from './fixtures/roads';

// Light and dark, phone and desktop: enough to cover both layouts and both
// colour themes without scanning every device.
const SCANNED_PROJECTS = new Set(['iphone-13', 'iphone-13-dark', 'desktop', 'desktop-dark']);

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // Map tile images: pictures of the map, not content (Leaflet marks
    // them as presentation already).
    .exclude('.leaflet-tile-pane')
    .analyze();
  // One readable line per problem, so a failure says what to fix.
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} — ` +
      violation.nodes
        .slice(0, 3)
        .map(
          (node) =>
            `${node.target.join(' ')}${node.failureSummary ? ` [${node.failureSummary.replace(/\s+/g, ' ')}]` : ''}`,
        )
        .join('; '),
  );
}

test.describe('accessibility (WCAG 2.2 AA)', { tag: '@layout' }, () => {
  test.beforeEach(() => {
    test.skip(!SCANNED_PROJECTS.has(test.info().project.name), 'scanned on four devices');
  });

  test('the check itself catches a problem', async ({ page }) => {
    // A passing scan must mean "no problems", not "not scanning": plant a
    // known one (an image with no text alternative) and expect it found.
    test.skip(test.info().project.name !== 'desktop', 'once is enough');
    await openApp(page);
    await page.evaluate(() => {
      const image = document.createElement('img');
      image.src = '/favicon-32.png';
      document.querySelector('main')!.append(image);
    });
    expect((await violations(page)).join('\n')).toContain('image-alt');
  });

  test('the world map', async ({ page }) => {
    await openApp(page);
    expect(await violations(page)).toEqual([]);
  });

  test('the weather panel, with air quality', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await expect(page.locator('.aqi-days__item').first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test.describe('with sections folded (a first visit)', () => {
    test.use({ sectionsOpen: false });

    test('the weather panel, folded headings with summaries', async ({ page }) => {
      await page.goto('/#at=59.91,10.75&name=Oslo');
      await expect(page.locator('.is-folded .fold__summary .aqi')).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  });

  test('the weather excuse card', async ({ page }) => {
    await page.goto('/#at=59.91,10.75&name=Oslo');
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Weather excuse');
    await expect(page.locator('.quip__text')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the weather haiku card', async ({ page }) => {
    await page.goto('/#at=59.91,10.75&name=Oslo');
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Weather haiku');
    await expect(page.locator('.quip__text--poem')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the balloon: launch, and where it landed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#at=59.91,10.75&name=Oslo');
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Launch a balloon');
    const card = page.locator('#balloon');
    await expect(card.getByRole('group', { name: 'Height' }).getByRole('button')).toHaveCount(3);
    expect(await violations(page)).toEqual([]);
    await card.getByRole('button', { name: 'Launch' }).click();
    await expect(card.locator('.balloon__distance')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the weather symbols layer', async ({ page }) => {
    await page.goto('/');
    await page.locator('#layer-button').click();
    await expect(page.locator('.weather-badge').first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the temperature quiz: start and a round', async ({ page }) => {
    await page.goto('/#quiz');
    const quiz = page.getByRole('dialog', { name: 'Temperature quiz' });
    await expect(quiz).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await quiz.getByRole('button', { name: "Play today's quiz" }).click();
    await expect(quiz.getByRole('slider', { name: 'Your guess' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('weather saved here, without a connection', async ({ page }) => {
    await page.goto('/#at=59.91,10.75&name=Oslo');
    await expect(page.locator('.current__updated')).toHaveText('Updated 14:05');
    await goOffline(page);
    await page.reload();
    await expect(page.locator('.current__updated--offline')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('search results and the favourites list', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').fill('Oslo');
    await expect(page.getByRole('listbox', { name: 'Places' })).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await page.getByRole('button', { name: 'Favourite' }).click();
    await page.locator('#search-input').focus();
    await expect(page.getByRole('listbox', { name: 'Favourites' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test.describe("Canada's and the UK's air quality colours", () => {
    for (const mode of ['canada', 'uk'] as const) {
      test.describe(mode, () => {
        test.use({ airQualityMode: mode });

        test('the badges, every level', async ({ page }) => {
          await openApp(page);
          await pickPoint(page);
          await expect(page.locator('.aqi-days__item').first()).toBeVisible();
          expect(await violations(page)).toEqual([]);
        });
      });
    }
  });

  test.describe('at sea', () => {
    test.use({ marineMode: 'sea' });

    test('the Sea section', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await expect(page.locator('.sea .details__row').first()).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  });

  test('the sauna easter egg', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').fill('sauna');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('.sauna')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the Santa easter egg, and "Random place" under the search box', async ({ page }) => {
    await openApp(page);
    await page.locator('#search-input').focus();
    await expect(page.getByRole('button', { name: 'Random place' })).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.locator('#search-input').fill('Santa');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('.santa')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('a weather record and a frost hint', async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
      const forecast = forecastFixture();
      forecast.current.time = '2026-11-15T18:00';
      for (let i = 18; i < 34; i++) {
        forecast.hourly.temperature_2m[i] = -4;
      }
      return route.fulfill({ json: forecast });
    });
    await page.goto('/#at=68.17,25.78&name=Pokka,+Finland');
    await expect(page.locator('.record')).toBeVisible();
    await expect(page.locator('.current__frost')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("Fintraffic's road conditions in Finland", async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast**', (route) =>
      route.fulfill({ json: { ...forecastFixture(), timezone: 'Europe/Helsinki' } }),
    );
    await page.route('https://tie.digitraffic.fi/**/forecasts', (route) =>
      route.fulfill({ json: roadForecastsFixture('poor') }),
    );
    await page.goto('/#at=60.17,24.94&name=Helsinki,+Finland');
    await expect(page.locator('.current__roads')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the rain radar with its history bar', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Rain radar' }).click();
    await expect(page.locator('.radar-bar')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('a day opened to its hours', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await page.locator('.daily__row').nth(2).click();
    await expect(page.locator('.daily__hours svg.hours-graph')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test.describe('with a weather warning', () => {
    test.use({ warningsMode: 'active' });

    test('an open warning', async ({ page }) => {
      await openApp(page);
      await pickPoint(page);
      await page.locator('.warnings summary').first().click();
      await expect(page.locator('.warning__text').first()).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  });

  test('the favourites editor, after a removal', async ({ page }) => {
    await page.addInitScript(() => {
      const places = [
        { name: 'Oslo, Norway', lat: 59.91, lng: 10.75, label: 'Home' },
        { name: 'Bergen, Norway', lat: 60.39, lng: 5.32 },
        { name: 'Tromsø, Norway', lat: 69.65, lng: 18.96 },
      ];
      localStorage.setItem('nordic-weather:favourites', JSON.stringify({ version: 1, places }));
    });
    await openApp(page);
    await page.locator('#search-input').click();
    // The list with "Edit favourites" under it.
    await expect(page.getByRole('button', { name: 'Edit favourites' })).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Edit favourites' }).click();
    const editor = page.getByRole('dialog', { name: 'Edit favourites' });
    await editor.getByRole('button', { name: 'Remove Tromsø, Norway' }).click();
    await expect(editor.getByRole('button', { name: 'Undo' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the About dialog', async ({ page }) => {
    await openApp(page);
    await page.locator('.leaflet-control-attribution').getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('dialog', { name: 'About Weatherpin' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the weather journey card', async ({ page }) => {
    await openApp(page);
    await page.locator('#level-button').click();
    await expect(page.getByRole('dialog', { name: 'Your weather journey' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the ⋯ menu, open', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.locator('#panel-menu')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('Weather on a day, with a result', async ({ page }) => {
    await page.goto('/#at=59.91,10.75&name=Oslo,+Norway');
    await expect(page.locator('.current__temp')).toBeVisible();
    await placeAction(page, 'Weather on a day…');
    const dialog = page.getByRole('dialog', { name: 'Weather on a day' });
    await dialog.getByRole('button', { name: '10 years ago' }).click();
    await expect(dialog.locator('.past-weather__today')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the Settings dialog, with a start place', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await placeAction(page, 'Start here');
    const settings = await openSettings(page);
    await expect(settings.getByRole('button', { name: 'Remove start place' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the other colours, chosen in Settings', async ({ page }) => {
    // Light chosen on a dark device, dark on a light one: the same colours
    // as Automatic gives, so this checks the choice really switches them all.
    await openApp(page);
    const dark = await page.evaluate(() => document.documentElement.dataset.theme === 'dark');
    const settings = await openSettings(page);
    await settings.getByRole('button', { name: dark ? 'Light' : 'Dark' }).click();
    await page.keyboard.press('Escape');
    await pickPoint(page);
    await expect(page.locator('.air-quality > .aqi')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  // The colour sets (Settings → Colours): each on this device's light or
  // dark, with the weather and the air quality badges.
  for (const skin of ['nordic', 'sauna', 'retro', 'contrast', 'nineties']) {
    test(`the "${skin}" colours`, async ({ page }) => {
      await page.addInitScript((chosen) => {
        localStorage.setItem('nordic-weather:skin', JSON.stringify(chosen));
      }, skin);
      await openApp(page);
      await expect(page.locator('html')).toHaveAttribute('data-skin', skin);
      await pickPoint(page);
      await expect(page.locator('.air-quality > .aqi')).toBeVisible();
      expect(await violations(page)).toEqual([]);
      const settings = await openSettings(page);
      await expect(settings.getByRole('button', { name: 'Close' })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }
});
