// Cloudflare Web Analytics: on the live site Cloudflare adds its visit
// counter script to the page (automatic setup). wrangler dev doesn't, so the
// test adds the same tag by hand and checks the CSP lets it load and report
// (a CSP violation is a console error, which fails the test).

import { expect, openApp, test } from './helpers';

test('the CSP lets Cloudflare Web Analytics load and report', async ({ page }) => {
  await openApp(page);
  const report = page.waitForRequest('https://cloudflareinsights.com/cdn-cgi/rum');
  await page.evaluate(() => {
    // The tag as Cloudflare injects it (a module script, cross-origin).
    const script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    document.body.append(script);
  });
  expect((await report).method()).toBe('POST');
});
