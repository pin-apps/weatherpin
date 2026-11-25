// The app icon and manifest: what browsers use for the tab icon and when
// the app is added to a phone's home screen. Also what search engines and
// link previews read: title, description, preview picture, robots.txt,
// sitemap.xml and the schema.org description.

import { expect, openApp, test } from './helpers';

test.describe('app icon and manifest', () => {
  // The same files for every device: check them once.
  test.skip(({ isMobile, viewport }) => isMobile || viewport?.width !== 1280);

  test('the page links its icons and manifest, and they load', async ({ page }) => {
    // openApp fails the test on any console error, incl. a CSP violation.
    await openApp(page);
    const href = (selector: string) => page.locator(selector).getAttribute('href');
    expect(await href('link[rel="icon"][type="image/svg+xml"]')).toBe('/favicon.svg');
    expect(await href('link[rel="apple-touch-icon"]')).toBe('/apple-touch-icon.png');
    expect(await href('link[rel="manifest"]')).toBe('/manifest.webmanifest');

    const manifestResponse = await page.request.get('/manifest.webmanifest');
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest).toMatchObject({
      name: 'Weatherpin',
      short_name: 'Weatherpin',
      start_url: '/',
      display: 'standalone',
    });

    const files = [
      '/favicon.svg',
      '/favicon-32.png',
      '/apple-touch-icon.png',
      ...manifest.icons.map((icon: { src: string }) => icon.src),
    ];
    for (const file of files) {
      const response = await page.request.get(file);
      expect(response.ok(), file).toBe(true);
      expect(response.headers()['content-type'], file).toMatch(/^image\//);
    }
  });

  test('search engines and link previews find what they need', async ({ page }) => {
    // openApp fails the test on any console error: the schema.org block
    // must not trip the CSP.
    await openApp(page);
    await expect(page).toHaveTitle('Weatherpin – weather anywhere on the world map');
    const meta = (selector: string) => page.locator(selector).getAttribute('content');
    const description = await meta('meta[name="description"]');
    expect(description).toContain('no ads, no tracking');
    expect(await meta('meta[property="og:description"]')).toBe(description);
    expect(await meta('meta[property="og:title"]')).toBe(
      'Weatherpin – weather anywhere on the world map',
    );
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(
      'https://weatherpin.app/',
    );

    // The preview picture: absolute address on the live site; the same
    // file is served here.
    const image = new URL((await meta('meta[property="og:image"]'))!);
    expect(image.origin).toBe('https://weatherpin.app');
    const imageResponse = await page.request.get(image.pathname);
    expect(imageResponse.headers()['content-type']).toBe('image/png');

    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(data).toMatchObject({ '@type': 'WebApplication', name: 'Weatherpin' });

    // Real files, not the "Page not found" page.
    const robots = await page.request.get('/robots.txt');
    expect(robots.headers()['content-type']).toMatch(/^text\/plain/);
    expect(await robots.text()).toContain('Sitemap: https://weatherpin.app/sitemap.xml');
    const sitemap = await page.request.get('/sitemap.xml');
    expect(sitemap.headers()['content-type']).toMatch(/xml/);
    expect(await sitemap.text()).toContain('<loc>https://weatherpin.app/</loc>');
  });

  test('other addresses answer 404 with a small page back to the map', async ({ page }) => {
    // The app routes only by #hash, so nothing else needs the app's page;
    // scanners asking for /.env must not get 200.
    for (const path of ['/.env', '/apua', '/sw.js', '/wp-admin/']) {
      const response = await page.request.get(path);
      expect(response.status(), path).toBe(404);
      expect(await response.text(), path).toContain('Page not found');
    }
    // (Checked as a request: opening it in the page would log the 404 as a
    // console error, which fails every test.)
    const body = await (await page.request.get('/apua')).text();
    expect(body).toContain('<a href="/">Back to the weather map</a>');
    expect((await page.request.get('/404.css')).status()).toBe(200);
  });

  test('security.txt says where to report a security problem', async ({ page }) => {
    const response = await page.request.get('/.well-known/security.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^text\/plain/);
    const text = await response.text();
    expect(text).toContain('Contact: mailto:security@weatherpin.app');
    // RFC 9116 asks for an expiry date, and that it isn't more than a year away.
    const expires = new Date(/^Expires: (.+)$/m.exec(text)![1]);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  test('the security headers include HSTS', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  });
});
