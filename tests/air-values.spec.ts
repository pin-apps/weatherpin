// More air values in the Air quality section (src/render/air-quality.ts):
// sulphur dioxide, carbon monoxide, desert dust (only when there is some),
// and CO₂ and methane in ppm under "Greenhouse gases"; one clear note at
// the top says the whole section is model values. The fake values now: SO₂ 1.2, CO 187,
// dust 0 µg/m³, CO₂ 456 ppm, methane 1520 µg/m³ (≈ 2.3 ppm).

import type { Page } from '@playwright/test';
import { airQualityFixture } from './fixtures/air-quality';
import { expect, test } from './helpers';

const OSLO = '/#at=59.91,10.75&name=Oslo,+Norway';

const section = (page: Page) => page.locator('.air-quality');

const value = (page: Page, label: string) =>
  section(page)
    .locator('.details__row')
    .filter({ has: page.locator('dt', { hasText: label }) })
    .locator('dd');

/** The air quality now changed (registered after the fake network, so it wins). */
async function airNow(page: Page, now: Record<string, number | null>) {
  await page.route('https://air-quality-api.open-meteo.com/**', (route) => {
    const airQuality = airQualityFixture('europe');
    Object.assign(airQuality.current, now);
    return route.fulfill({ json: airQuality });
  });
}

async function openOslo(page: Page, link = OSLO) {
  await page.goto(link);
  await expect(section(page).locator(':scope > .aqi')).toBeVisible();
}

test.describe('more air values', () => {
  test('asked for in the same request, current values only', async ({ page }) => {
    const asked = page.waitForRequest((request) =>
      request.url().startsWith('https://air-quality-api.open-meteo.com/'),
    );
    await openOslo(page);
    const current = new URL((await asked).url()).searchParams.get('current') ?? '';
    for (const variable of [
      'sulphur_dioxide',
      'carbon_monoxide',
      'dust',
      'carbon_dioxide',
      'methane',
    ]) {
      expect(current.split(',')).toContain(variable);
    }
  });

  test('pollutants, greenhouse gases and their notes', async ({ page }) => {
    await openOslo(page);
    await expect(value(page, 'Sulphur dioxide (SO₂)')).toHaveText('1.2 µg/m³');
    await expect(value(page, 'Carbon monoxide (CO)')).toHaveText('187.0 µg/m³');
    // No dust in the air: no row.
    await expect(value(page, 'Desert dust')).toHaveCount(0);

    // Greenhouse gases come last, after the air quality forecast, just
    // before the Copernicus notice.
    await expect(section(page).locator('.air-quality__subtitle')).toHaveText([
      'Next days',
      'Pollen forecast',
      'Greenhouse gases',
    ]);
    await expect(value(page, 'Carbon dioxide (CO₂)')).toHaveText('456 ppm');
    await expect(value(page, 'Methane (CH₄)')).toHaveText('2.3 ppm');

    // One warning for the whole section, right under the index, before
    // any values; the gases get only a plain line saying why they're apart.
    const note = section(page).locator('.estimate-note');
    await expect(note).toHaveCount(1);
    await expect(note.locator('strong')).toHaveText(
      'Everything in this section comes from the CAMS forecast model, not from measuring stations.',
    );
    await expect(note).toContainText('about 11 km across in Europe (40 km elsewhere)');
    await expect(note).toBeVisible();
    const order = await section(page).evaluate((element) =>
      [...element.children]
        .map((child) =>
          child.classList.contains('aqi')
            ? 'index'
            : child.classList.contains('estimate-note')
              ? 'note'
              : child.classList.contains('details')
                ? 'values'
                : child.classList.contains('air-quality__subtitle')
                  ? child.textContent
                  : child.classList.contains('air-quality__aside')
                    ? child.textContent
                    : null,
        )
        .filter(Boolean),
    );
    expect(order.slice(0, 3)).toEqual(['index', 'note', 'values']);
    expect(order.slice(-3)).toEqual([
      'Greenhouse gases',
      'values',
      'Not part of the air quality index.',
    ]);
  });

  test('a dusty day: the dust row', async ({ page }) => {
    await airNow(page, { dust: 85 });
    await openOslo(page);
    await expect(value(page, 'Desert dust')).toHaveText('85.0 µg/m³');
  });

  test('no CO₂ from the service: no greenhouse block, a dash for missing gases', async ({
    page,
  }) => {
    await airNow(page, { carbon_dioxide: null, methane: null, sulphur_dioxide: null });
    await openOslo(page);
    await expect(section(page).getByText('Greenhouse gases')).toHaveCount(0);
    await expect(value(page, 'Sulphur dioxide (SO₂)')).toHaveText('–');
    await expect(section(page).locator('.estimate-note')).toHaveCount(1);
  });

  test.describe('in Finnish', () => {
    test.use({ locale: 'fi-FI' });

    test('"Kasvihuonekaasut"', async ({ page }) => {
      await openOslo(page, '/#at=59.91,10.75&name=Oslo,+Norja');
      await expect(value(page, 'Hiilidioksidi (CO₂)')).toHaveText('456 ppm');
      await expect(value(page, 'Metaani (CH₄)')).toHaveText('2,3 ppm');
      await expect(value(page, 'Rikkidioksidi (SO₂)')).toHaveText('1,2 µg/m³');
      await expect(section(page).getByText('Kasvihuonekaasut')).toBeVisible();
    });
  });
});
