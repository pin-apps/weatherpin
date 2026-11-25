// Unit tests for reading FMI's CAP files (cap.ts). Run: npm run test:worker
// Fixtures: real FMI files (fixtures/, CC BY 4.0, Finnish Meteorological
// Institute) and small made-up ones for the edge cases.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { capIdsOf, compactCap, isCapId, polygonsOf } from './cap.ts';
import { GRID } from './types.ts';
import { capFile } from './test-helpers.ts';

const fixture = (name: string) =>
  readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');

const ID = '2026/11-21/09-52-15Z/2.49.0.1.246.0.0.2026.28029135.72137552092521959079.xml';

test('a real FMI file: three languages, level, times, outlines', () => {
  const warning = compactCap(ID, fixture('fmi-warning.xml'));
  assert.ok(warning);
  assert.equal(warning.id, ID);
  assert.equal(warning.level, 'yellow');
  assert.equal(warning.onset, '2026-11-23T00:00:00+02:00');
  assert.equal(warning.expires, '2026-11-23T09:00:00+02:00');
  assert.deepEqual(Object.keys(warning.texts).sort(), ['en', 'fi', 'sv']);
  assert.equal(warning.texts.fi?.event, 'Tuulivaroitus merelle');
  assert.equal(warning.texts.en?.event, 'Wind warning for sea areas');
  assert.ok(warning.texts.fi?.areas.includes('Ahvenanmeri'));
  assert.ok(warning.polygons.length > 0);
  // On the grid: whole numbers, in Finland's sea areas.
  for (const ring of warning.polygons) {
    assert.ok(ring.every(Number.isInteger));
    assert.ok(ring.length % 2 === 0 && ring.length >= 6);
    assert.ok(ring[0] / GRID > 58 && ring[0] / GRID < 71);
  }
});

test('texts: entities decoded, areas once, level from the colour', () => {
  const warning = compactCap(ID, capFile());
  assert.ok(warning);
  assert.equal(warning.level, 'orange');
  assert.equal(warning.texts.en?.description, 'Gusts up to 25 m/s & more.');
  assert.deepEqual(warning.texts.sv?.areas, ['Helsinki']);
  assert.deepEqual(warning.polygons, [
    [12020, 4960, 12020, 5020, 12050, 5020, 12050, 4960, 12020, 4960],
  ]);
});

test('outlines: grid snapping drops repeats; bad numbers end the ring', () => {
  // 0.001° apart: the same grid point, kept once.
  assert.deepEqual(polygonsOf('<polygon>60.1,24.8 60.1001,24.8001 60.2,24.9 60.3,24.8</polygon>'), [
    [12020, 4960, 12040, 4980, 12060, 4960],
  ]);
  // Fewer than three corners: no ring.
  assert.deepEqual(polygonsOf('<polygon>60.1,24.8 60.2,24.9</polygon>'), []);
  assert.deepEqual(polygonsOf('<polygon>abc</polygon>'), []);
  assert.deepEqual(polygonsOf('<polygon>-33.9,-70.1 -33.8,-70.0 -33.7,-70.1</polygon>'), [
    [-6780, -14020, -6760, -14000, -6740, -14020],
  ]);
});

test('not shown: tests, cancellations, no outlines', () => {
  assert.equal(compactCap(ID, capFile({ status: 'Test' })), null);
  assert.equal(compactCap(ID, capFile({ msgType: 'Cancel' })), null);
  assert.equal(compactCap(ID, capFile({ polygon: '' })), null);
  assert.equal(compactCap(ID, '<alert><status>Actual</status></alert>'), null);
  assert.equal(compactCap(ID, 'not xml at all'), null);
});

test("the list: FMI's CAP links only, each once", () => {
  const ids = capIdsOf(fixture('fmi-list.rss'));
  assert.ok(ids.length > 0);
  assert.ok(ids.every(isCapId));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    capIdsOf(`<link>https://alerts.fmi.fi/cap/${ID}</link><link>https://alerts.fmi.fi/cap/${ID}</link>
      <link>https://evil.example/cap/${ID}</link><link>https://en.ilmatieteenlaitos.fi/warnings</link>`),
    [ID],
  );
});

test('ids: only the shape of FMI file paths', () => {
  assert.ok(isCapId(ID));
  for (const bad of [
    '',
    '../secret',
    `${ID}?x=1`,
    `2026/11-21/09-52-15Z/../../etc.xml`,
    `2026/11-21/09-52-15Z/2.49.0.1.xml`, // too short
    `https://alerts.fmi.fi/cap/${ID}`,
    ID.replace('.xml', '.json'),
  ]) {
    assert.equal(isCapId(bad), false, bad);
  }
});
