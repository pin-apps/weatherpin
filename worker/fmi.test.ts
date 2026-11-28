// Unit tests for the broker's API (fmi.ts): answers, input checks, caching
// (FMI asked as little as possible), stale list on failure. A fake FMI and
// an in-memory stand-in for Cloudflare's cache. Run: npm run test:worker

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleApi, type Deps } from './fmi.ts';
import { capFile, memoryCache } from './test-helpers.ts';
import type { FmiWarning, FmiWarningList } from './types.ts';

const RSS = readFileSync(new URL('fixtures/fmi-list.rss', import.meta.url), 'utf8');
const ID = '2026/11-21/09-52-15Z/2.49.0.1.246.0.0.2026.28029135.72137552092521959079.xml';

function fakeFmi(answer: (url: string) => Response | Promise<Response>) {
  const asked: string[] = [];
  const fetch = (async (input: RequestInfo | URL) => {
    asked.push(String(input));
    return answer(String(input));
  }) as typeof globalThis.fetch;
  return { fetch, asked };
}

// The test clock: the cache's ages and the list's "updated" follow it.
interface Clock {
  now: number;
}

function setup(
  answer: (url: string) => Response | Promise<Response>,
  clock: Clock = { now: Date.parse('2026-11-21T10:00:00Z') },
  cache = memoryCache(clock),
) {
  const fmi = fakeFmi(answer);
  const deps: Deps = { fetch: fmi.fetch, cache, now: () => new Date(clock.now) };
  // As the app's pages ask (a browser's own header).
  const call = (
    path: string,
    method = 'GET',
    headers: HeadersInit = { 'Sec-Fetch-Site': 'same-origin' },
  ) => handleApi(new Request(`https://weatherpin.app${path}`, { method, headers }), deps);
  return { call, asked: fmi.asked, cache };
}

const ok = (body: string) => new Response(body, { status: 200 });

test('the list: ids of the warnings in effect, kept 2 minutes', async () => {
  const { call, asked } = setup(() => ok(RSS));
  const first = await call('/api/fmi/warnings');
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.equal(first.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(first.headers.get('X-Content-Type-Options'), 'nosniff');
  const list = (await first.json()) as FmiWarningList;
  assert.equal(list.updated, '2026-11-21T10:00:00.000Z');
  assert.ok(list.ids.length > 0);
  assert.equal(list.stale, undefined);

  // Many more requests: still one call to FMI.
  for (let i = 0; i < 5; i++) await call('/api/fmi/warnings');
  assert.equal(asked.length, 1);
  assert.match(asked[0], /^https:\/\/alerts\.fmi\.fi\/cap\/feed\/rss_en-GB\.rss$/);
});

test('the list: requests at the same moment share one call to FMI', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const { call, asked } = setup(async () => {
    await gate;
    return ok(RSS);
  });
  const answers = Promise.all([1, 2, 3].map(() => call('/api/fmi/warnings')));
  release();
  for (const answer of await answers) assert.equal(answer.status, 200);
  assert.equal(asked.length, 1);
});

test('the list: FMI down → the last good list, marked stale; none at all → 502', async () => {
  const clock = { now: Date.parse('2026-11-21T10:00:00Z') };
  const cache = memoryCache(clock);
  await setup(() => ok(RSS), clock, cache).call('/api/fmi/warnings');
  // 3 minutes on, the fresh copy (2 min) has expired and FMI is down.
  clock.now += 3 * 60 * 1000;
  const down = setup(() => new Response('', { status: 503 }), clock, cache);
  const stale = (await (await down.call('/api/fmi/warnings')).json()) as FmiWarningList;
  assert.equal(stale.stale, true);
  assert.equal(stale.updated, '2026-11-21T10:00:00.000Z');
  assert.ok(stale.ids.length > 0);
  assert.equal(down.asked.length, 1);

  const nothing = setup(() => {
    throw new Error('network down');
  });
  const answer = await nothing.call('/api/fmi/warnings');
  assert.equal(answer.status, 502);
  assert.equal(answer.headers.get('Cache-Control'), 'no-store');
});

test('the list: asked again once the 2 minutes are over', async () => {
  const clock = { now: Date.parse('2026-11-21T10:00:00Z') };
  const { call, asked } = setup(() => ok(RSS), clock);
  await call('/api/fmi/warnings');
  clock.now += 119 * 1000;
  await call('/api/fmi/warnings');
  assert.equal(asked.length, 1);
  clock.now += 2 * 1000;
  await call('/api/fmi/warnings');
  assert.equal(asked.length, 2);
});

test('one warning: compact, kept for good, FMI asked once', async () => {
  const { call, asked } = setup((url) => {
    assert.equal(url, `https://alerts.fmi.fi/cap/${ID}`);
    return ok(capFile());
  });
  const answer = await call(`/api/fmi/warning/${ID}`);
  assert.equal(answer.status, 200);
  assert.equal(answer.headers.get('Cache-Control'), 'public, max-age=604800, immutable');
  const warning = (await answer.json()) as FmiWarning;
  assert.deepEqual(warning.box, [12020, 4960, 12050, 5020]);
  assert.equal(warning.id, ID);
  assert.equal(warning.level, 'orange');
  assert.equal(warning.texts.fi?.event, 'Tuulivaroitus');
  await call(`/api/fmi/warning/${ID}`);
  assert.equal(asked.length, 1);
});

test('the list carries the boxes of warnings already read (null: nothing to show)', async () => {
  const other = ID.replace('.xml', '1.xml');
  const rss = `<link>https://alerts.fmi.fi/cap/${ID}</link><link>https://alerts.fmi.fi/cap/${other}</link>`;
  const { call } = setup((url) =>
    url.endsWith('.rss')
      ? ok(rss)
      : ok(capFile(url.endsWith('1.xml') ? { msgType: 'Cancel' } : {})),
  );
  let list = (await (await call('/api/fmi/warnings')).json()) as FmiWarningList;
  assert.deepEqual(list.boxes, {});
  await call(`/api/fmi/warning/${ID}`);
  await call(`/api/fmi/warning/${other}`);
  list = (await (await call('/api/fmi/warnings')).json()) as FmiWarningList;
  assert.deepEqual(list.boxes, { [ID]: [12020, 4960, 12050, 5020], [other]: null });
});

test('one warning: a cancellation says "none"', async () => {
  const { call } = setup(() => ok(capFile({ msgType: 'Cancel' })));
  assert.deepEqual(await (await call(`/api/fmi/warning/${ID}`)).json(), { id: ID, none: true });
});

test('input checks: only GET/HEAD, only FMI file ids, nothing else', async () => {
  const { call, asked } = setup(() => ok(capFile()));
  assert.equal((await call('/api/fmi/warnings', 'POST')).status, 405);
  // (URLs resolve ".." first: this is /api/secret.)
  assert.equal((await call('/api/fmi/warning/../../secret')).status, 404);
  assert.equal((await call('/api/fmi/warning/2026%2F..%2Fx.xml')).status, 400);
  assert.equal((await call(`/api/fmi/warning/${ID}x`)).status, 400);
  assert.equal((await call('/api/fmi/warning/')).status, 400);
  assert.equal((await call('/api/other')).status, 404);
  assert.equal((await call('/api/fmi/warnings/extra')).status, 404);
  assert.equal((await call('/api/fmi/warnings', 'OPTIONS')).status, 405);
  assert.equal((await call('/api/fmi/warnings', 'PUT')).status, 405);
  // Encoded slashes and dots, backslashes, odd characters, very long ids.
  for (const bad of [
    '..%2F..%2Fsecret',
    '%2e%2e%2fsecret',
    '2026%5C11-21%5Cx.xml',
    `${ID.replace(/\//g, '%5C')}`,
    `${ID}%00`,
    `${ID}%0d%0aX-Injected:%201`,
    `${'a/'.repeat(5000)}x.xml`,
    ID.replace('2026', '9'.repeat(5000)),
  ]) {
    const answer = await call(`/api/fmi/warning/${bad}`);
    assert.ok([400, 404].includes(answer.status), `${bad.slice(0, 60)}: ${answer.status}`);
  }
  // None of these reached FMI.
  assert.deepEqual(asked, []);
});

test('FMI errors, too-big or slow answers: 502, nothing kept', async () => {
  const tooBig = setup(() => new Response('x', { headers: { 'Content-Length': '99999999' } }));
  assert.equal((await tooBig.call(`/api/fmi/warning/${ID}`)).status, 502);
  const failing = setup(() => new Response('', { status: 500 }));
  assert.equal((await failing.call(`/api/fmi/warning/${ID}`)).status, 502);
  // A later good answer is still fetched (the failure wasn't cached).
  const clock = { now: Date.parse('2026-11-21T10:00:00Z') };
  const cache = memoryCache(clock);
  await setup(() => new Response('', { status: 500 }), clock, cache).call(`/api/fmi/warning/${ID}`);
  const good = setup(() => ok(capFile()), clock, cache);
  assert.equal((await good.call(`/api/fmi/warning/${ID}`)).status, 200);
  assert.equal(good.asked.length, 1);
});

test('a slow FMI: given up on, the last good list served, marked stale', async () => {
  const clock = { now: Date.parse('2026-11-21T10:00:00Z') };
  const cache = memoryCache(clock);
  await setup(() => ok(RSS), clock, cache).call('/api/fmi/warnings');
  clock.now += 3 * 60 * 1000;
  // FMI never answers; only the time limit ends the wait.
  const asked: string[] = [];
  const hanging = ((input: RequestInfo | URL, init?: RequestInit) => {
    asked.push(String(input));
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
    });
  }) as typeof fetch;
  const answer = await handleApi(
    new Request('https://weatherpin.app/api/fmi/warnings', {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
    }),
    { fetch: hanging, cache, now: () => new Date(clock.now), timeoutMs: 50 },
  );
  assert.equal(answer.status, 200);
  assert.equal(((await answer.json()) as FmiWarningList).stale, true);
  assert.equal(asked.length, 1);
});

test('a too-big list from FMI: the last good list, marked stale', async () => {
  const clock = { now: Date.parse('2026-11-21T10:00:00Z') };
  const cache = memoryCache(clock);
  await setup(() => ok(RSS), clock, cache).call('/api/fmi/warnings');
  clock.now += 3 * 60 * 1000;
  // No Content-Length: the size is checked on the text itself.
  const huge = setup(() => ok('x'.repeat(5 * 1024 * 1024)), clock, cache);
  const list = (await (await huge.call('/api/fmi/warnings')).json()) as FmiWarningList;
  assert.equal(list.stale, true);
  assert.ok(list.ids.length > 0);
});

test('only from our own pages: other sites, no browser headers → 403', async () => {
  const { call, asked } = setup(() => ok(RSS));
  const others: Record<string, string>[] = [
    { 'Sec-Fetch-Site': 'cross-site' },
    { 'Sec-Fetch-Site': 'same-site' },
    { 'Sec-Fetch-Site': 'none' },
    {},
    { Referer: 'https://evil.example/page' },
    { Referer: 'not a url' },
    // Our address inside another site's: still another site.
    { Referer: 'https://weatherpin.app.evil.example/' },
    { Referer: 'http://weatherpin.app/' },
    { 'Sec-Fetch-Site': 'cross-site', Referer: 'https://weatherpin.app/' },
  ];
  for (const headers of others) {
    assert.equal(
      (await call('/api/fmi/warnings', 'GET', headers)).status,
      403,
      JSON.stringify(headers),
    );
  }
  assert.deepEqual(asked, []);
  // Older browsers without Sec-Fetch-Site: a Referer from our own pages.
  const old = await call('/api/fmi/warnings', 'GET', {
    Referer: 'https://weatherpin.app/#at=60.17,24.94',
  });
  assert.equal(old.status, 200);
});
