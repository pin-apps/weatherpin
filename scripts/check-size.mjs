// Size budget for what every visitor downloads: the built JavaScript and CSS,
// measured gzipped (close to what the browser receives). Run after
// `npm run build`; CI fails when a budget is exceeded, so the app can't
// slowly get heavier without anyone deciding it should.
//
// Today (Nov 2026): JS ~60 KB (most of it the Leaflet map), CSS ~10 KB. The
// budgets leave room for a few features, not for a new library by accident.
// JS raised 75 → 80 KB on 2026-11-19 for the UK's and Canada's air quality
// indices (the app was at 74 KB after Swedish, settings, offline weather).
// Split on 2026-11-22 into code (72 KB) and texts (12 KB): every feature's
// texts load at start even when its code loads on demand, so the texts
// were crowding out the code (then 70.4 KB code + 9.7 KB texts).
//
// Counted: what the page loads at start (the files index.html names) as
// code, and one language's texts on their own (i18n-fi-….js,
// i18n-sv-….js, i18n-nb-….js: fetched only in that language, so the
// largest counts).
// Files fetched only on demand (e.g. the land map for "Random place") are
// listed but not counted.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exit } from 'node:process';
import { gzipSync } from 'node:zlib';

// Code was 72 KB until 2026-11-26, when this check was found to skip the
// app's own i18n code chunk (named like a language file): counted since,
// at the true size then (74.4 KB) plus a little room.
const BUDGET_KB = { '.js': 75, texts: 12, '.css': 14 };
const LABELS = { '.js': 'JS code', texts: 'Texts (largest language)', '.css': 'CSS' };
const ASSETS = 'dist/assets';

// The files the page itself loads: <script src>, <link href> (styles,
// module preloads).
const page = readFileSync('dist/index.html', 'utf8');
const atStart = new Set(
  [...page.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map((match) => match[1]),
);

let failed = false;
const totals = { '.js': 0, texts: 0, '.css': 0 };
let largestLanguage = 0;
const onDemand = [];
for (const name of readdirSync(ASSETS)) {
  const ext = name.slice(name.lastIndexOf('.'));
  if (ext !== '.js' && ext !== '.css') continue;
  const bytes = gzipSync(readFileSync(join(ASSETS, name)), { level: 9 }).length;
  // The language files (i18n-fi-…); src/i18n.ts's own chunk is code.
  if (/^i18n-(fi|sv|nb)-/.test(name)) largestLanguage = Math.max(largestLanguage, bytes);
  else if (atStart.has(name)) totals[ext] += bytes;
  else onDemand.push(`${name} ${(bytes / 1024).toFixed(1)} KB`);
}
totals.texts = largestLanguage;
if (atStart.size === 0) {
  console.error('No /assets/ files found in dist/index.html: has the build changed?');
  exit(1);
}

for (const [ext, bytes] of Object.entries(totals)) {
  const kb = bytes / 1024;
  const budget = BUDGET_KB[ext];
  const ok = kb <= budget;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} ${LABELS[ext]}: ${kb.toFixed(1)} KB gzipped (budget ${budget} KB)`,
  );
}

if (onDemand.length > 0) console.log(`     on demand, not counted: ${onDemand.join(', ')}`);

if (failed) {
  console.error(
    '\nOver budget. If the extra weight is worth it, raise the budget in scripts/check-size.mjs on purpose.',
  );
  exit(1);
}
