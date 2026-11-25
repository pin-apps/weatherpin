// Browser tests (Playwright). Run with `npm run test:e2e`.
// The app is served by `wrangler dev` from the production build, so the real
// security headers in public/_headers (incl. the CSP) apply during tests.
// It's served over https (wrangler's own local certificate), like the real
// site: the CSP's upgrade-insecure-requests makes Safari's engine (WebKit)
// turn every http://localhost request into https, which would fail.

import { defineConfig, devices, type Project } from '@playwright/test';

const PORT = 8787;
const isCI = Boolean(process.env.CI);
// FULL_TESTS=1: every test on every device that runs them all. Without it
// (most PRs, to save CI minutes), the iPhone and iPad in Chromium run only
// the "@layout" tests; everything else runs on the desktop, the iPhone in
// WebKit and the phone held sideways. CI sets it for risky changes, the
// weekly run and the "Run workflow" button (see .github/workflows/ci.yml).
const fullTests = process.env.FULL_TESTS === '1';

// Phones and tablets get their real screen size, pixel density and touch
// support. Most devices run in Chromium; an iPhone and an iPad also run in
// WebKit (Safari's engine, which every iPhone browser uses), so Safari-only
// bugs show up in CI too.
//
// Not every device runs every test. What a test does (search, save, share)
// works the same on two portrait phones, or in dark mode; what it looks
// like doesn't. So some devices run only the "@layout" tests: the layout
// and accessibility checks, and tests that check something fits the
// screen. Every test runs on at least three devices (five in a full run),
// in both engines.
// Tag a new test `@layout` if it checks sizes, positions or colours.
const chromium = { browserName: 'chromium' as const };
const layoutOnly = { grep: /@layout/ };
const layoutOnlyUnlessFull = fullTests ? {} : layoutOnly;

const deviceProjects: Project[] = [
  { name: 'iphone-13', use: { ...devices['iPhone 13'], ...chromium }, ...layoutOnlyUnlessFull },
  // Same as iphone-13 but narrower (320 px) and shorter, or another phone
  // size: only where size matters.
  { name: 'iphone-se', use: { ...devices['iPhone SE'], ...chromium }, ...layoutOnly },
  { name: 'pixel-7', use: { ...devices['Pixel 7'], ...chromium }, ...layoutOnly },
  { name: 'iphone-13-landscape', use: { ...devices['iPhone 13 landscape'], ...chromium } },
  { name: 'ipad', use: { ...devices['iPad (gen 7)'], ...chromium }, ...layoutOnlyUnlessFull },
  {
    name: 'desktop',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 800 },
    },
  },
];

// Safari's engine. Everything on the iPhone: it's how every iPhone user
// gets the app. On the iPad only where its fonts can change the layout;
// what the app does there is the iPhone's WebKit plus the iPad's size.
const webkitProjects: Project[] = [
  { name: 'iphone-13-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  {
    name: 'ipad-webkit',
    use: { ...devices['iPad (gen 7)'], browserName: 'webkit' },
    ...layoutOnly,
  },
];

// Dark mode changes colours, not layout or behaviour: two devices, and
// only the tests where colours matter (contrast is in the accessibility
// scans).
const darkProjects: Project[] = ['iphone-13', 'desktop'].map((name) => {
  const base = deviceProjects.find((project) => project.name === name)!;
  return { name: `${name}-dark`, use: { ...base.use, colorScheme: 'dark' }, ...layoutOnly };
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // One retry in CI, so a one-off hiccup doesn't fail the build; a real bug
  // fails both tries.
  retries: isCI ? 1 : 0,
  // Two tests at a time per CI machine. Playwright's default is half the CPU
  // cores, which on GitHub's 2-core machines meant one at a time; most of a
  // test is waiting (animations, network), so two fit side by side.
  workers: isCI ? 2 : undefined,
  // In CI the tests run in parallel shards (2, or 3 in a full run); each writes raw results
  // ("blob"), and a later job merges them into one HTML report.
  reporter: isCI ? [['github'], ['list'], ['blob']] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `https://localhost:${PORT}`,
    // wrangler's local certificate isn't from a trusted authority.
    ignoreHTTPSErrors: true,
    locale: 'en-GB',
    timezoneId: 'Europe/Oslo',
    // Extra evidence for failures: a step-by-step trace on the retry.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // CI shards take the tests in this order, in three blocks of equal count.
  // The iPhone in WebKit is the slowest device, so it sits early, where it
  // shares a block with lighter ones; with this order each shard has
  // about the same test time (~4–6 min of tests, 2 at a time).
  projects: [
    deviceProjects[0],
    deviceProjects[1],
    webkitProjects[0],
    deviceProjects[2],
    deviceProjects[3],
    deviceProjects[4],
    deviceProjects[5],
    webkitProjects[1],
    ...darkProjects,
  ],

  webServer: {
    command: `npx wrangler dev --port ${PORT} --local-protocol https`,
    url: `https://localhost:${PORT}`,
    ignoreHTTPSErrors: true,
    // Locally, reuse a `npm run preview:worker` that's already running.
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
