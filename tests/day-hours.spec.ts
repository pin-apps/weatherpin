// The hour graphs, and tapping a day in the 7-day list to see its hours.
// The forecast fixture starts on Sunday 15 Nov, at 14:00 in Oslo.

import type { Page } from '@playwright/test';
import { chooseUnit, expect, openApp, pickPoint, snapshot, test } from './helpers';

const dayRow = (page: Page, day: string) =>
  page.locator('.daily__row').filter({ has: page.locator('.daily__day', { hasText: day }) });

test.describe('hour graphs and day hours', () => {
  test('the next 24 hours have a graph that says what it shows', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const graph = page.locator('.forecast-section').first().locator('svg.hours-graph');
    await expect(graph).toBeVisible();
    await expect(graph).toHaveAttribute('role', 'img');
    await expect(graph).toHaveAttribute(
      'aria-label',
      /^Temperature from -?\d+ °C to \d+ °C, warmest around \d\d:00\. Precipitation \d\.\d mm in total, most around \d\d:00\.$/,
    );
    // The warmest and coldest hour labelled, and hours along the bottom.
    await expect(graph.locator('.hours-graph__temp')).toHaveCount(2);
    await expect(graph.locator('.hours-graph__hour').first()).toHaveText('18:00');
    await expect(graph.locator('.hours-graph__bar').first()).toBeAttached();
  });

  test('each hour shows the wind: an arrow and its speed', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    // 14:00 in the fixture: 5 m/s from 340° (NNW). Tests run as en-GB: mph.
    const now = page.locator('.forecast-section').first().locator('.hourly__item').first();
    await expect(now.locator('.hourly__wind-speed')).toHaveText('11 mph');
    await expect(now.locator('.hourly__wind')).toContainText('Wind 11 mph from NNW');
    // Points where the wind blows to: from 340°, so turned 520° (= 160°).
    await expect(now.locator('.hourly__wind-arrow')).toHaveAttribute('style', /rotate\(520deg\)/);
    // A day's hours have it too.
    await page.locator('.daily__row').nth(1).click();
    await expect(page.locator('.daily__hours .hourly__wind').first()).toBeVisible();
  });

  test('tapping a day shows its hours; one day open at a time', async ({ page }, testInfo) => {
    await openApp(page);
    await pickPoint(page);
    const tuesday = dayRow(page, 'Tue');
    await expect(tuesday).toHaveAttribute('aria-expanded', 'false');
    // Built only when opened.
    await expect(page.locator('.daily__hours .hourly__item')).toHaveCount(0);

    await tuesday.click();
    await expect(tuesday).toHaveAttribute('aria-expanded', 'true');
    const hours = page.getByRole('region', { name: 'Hours on Tuesday 17 Nov' });
    await expect(hours).toBeVisible();
    await expect(hours.locator('svg.hours-graph')).toBeVisible();
    await expect(hours.locator('.hourly__item')).toHaveCount(24);
    await expect(hours.locator('.hourly__time').first()).toHaveText('00:00');
    await hours.scrollIntoViewIfNeeded();
    await snapshot(page, testInfo, 'tuesday-open');

    // Opening another day closes the first.
    const wednesday = dayRow(page, 'Wed');
    await wednesday.click();
    await expect(wednesday).toHaveAttribute('aria-expanded', 'true');
    await expect(tuesday).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.daily__hours:not([hidden])')).toHaveCount(1);

    // Tapping it again closes it.
    await wednesday.click();
    await expect(wednesday).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.daily__hours:not([hidden])')).toHaveCount(0);
  });

  test('today starts at the current hour', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await dayRow(page, 'Today').click();
    const hours = page.getByRole('region', { name: 'Hours on Sunday 15 Nov' });
    // 14:00 to 23:00.
    await expect(hours.locator('.hourly__item')).toHaveCount(10);
    await expect(hours.locator('.hourly__time').first()).toHaveText('Now');
    await expect(hours.locator('.hourly__time').last()).toHaveText('23:00');
  });

  test('works from the keyboard', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    const friday = dayRow(page, 'Fri');
    await friday.focus();
    await page.keyboard.press('Enter');
    await expect(friday).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(friday).toHaveAttribute('aria-expanded', 'false');
  });

  test('the open day stays open when the units change', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await dayRow(page, 'Mon').click();
    await chooseUnit(page, '°F');
    await expect(page.locator('.current__temp')).toHaveText(/°F$/);
    const hours = page.getByRole('region', { name: 'Hours on Monday 16 Nov' });
    await expect(hours).toBeVisible();
    await expect(hours.locator('.hourly__temp').first()).toHaveText(/°F$/);
    await expect(hours.locator('svg.hours-graph')).toHaveAttribute('aria-label', /°F/);
  });

  test('a new place starts with every day closed', async ({ page }) => {
    await openApp(page);
    await pickPoint(page);
    await dayRow(page, 'Mon').click();
    await expect(page.locator('.daily__hours:not([hidden])')).toHaveCount(1);
    await page.locator('#search-input').fill('Oslo');
    await page.getByRole('listbox', { name: 'Places' }).getByRole('option').first().click();
    await expect(page.locator('#panel-title')).toHaveText('Oslo, Norway');
    await expect(page.locator('.daily__row').first()).toBeVisible();
    await expect(page.locator('.daily__hours:not([hidden])')).toHaveCount(0);
  });
});
