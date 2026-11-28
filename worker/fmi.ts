// The warnings broker's API for Finland (FMI). FMI's warning feed doesn't
// let browsers read it (no CORS), so the app asks us:
//
//   GET /api/fmi/warnings        the warnings in effect: ids (and the boxes
//                                of those already read, to skip far ones)
//   GET /api/fmi/warning/<id>    one warning, compact (texts + outlines)
//
// No location is ever sent: the app checks which warnings cover the point
// itself. Each warning file is processed in its own call (FMI's biggest
// take most of the free plan's 10 ms of CPU) and kept: a file never
// changes. FMI is asked for its list at most every 2 minutes (per
// Cloudflare location), and for each file once; when FMI fails, the last
// good list is served, marked stale.

import { capIdsOf, compactCap, isCapId } from './cap.ts';
import type { Box, FmiWarningList } from './types.ts';

const FMI = 'https://alerts.fmi.fi/cap';
const LIST_URL = `${FMI}/feed/rss_en-GB.rss`;
// Keys in Cloudflare's cache (any URL works as a key; never fetched).
const CACHE_KEY = 'https://broker.cache/fmi';

const LIST_FRESH_S = 120;
const LIST_LAST_GOOD_S = 24 * 3600;
const WARNING_KEEP_S = 7 * 24 * 3600;
// The app may keep a list this long; a warning (immutable) much longer.
const LIST_CLIENT_S = 60;
// Bigger than any FMI file seen (0.8 MB); bigger means something's wrong.
const MAX_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 8000;

export interface Deps {
  fetch: typeof fetch;
  /** Cloudflare's cache (caches.default); null where there's none. */
  cache: Cache | null;
  now: () => Date;
  /** How long FMI may take (tests make it short). */
  timeoutMs?: number;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'",
  'Referrer-Policy': 'no-referrer',
};

function json(body: unknown, status: number, cacheSeconds: number, immutable = false): Response {
  const cache =
    cacheSeconds > 0
      ? `public, max-age=${cacheSeconds}${immutable ? ', immutable' : ''}`
      : 'no-store';
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      ...SECURITY_HEADERS,
    },
  });
}

function error(status: number, message: string): Response {
  return json({ error: message }, status, 0);
}

/** Text from FMI, within the time and size limits, or an Error. */
async function fetchText(deps: Deps, url: string): Promise<string> {
  const response = await deps.fetch(url, {
    signal: AbortSignal.timeout(deps.timeoutMs ?? TIMEOUT_MS),
    headers: { Accept: 'application/xml, text/xml, */*' },
  });
  if (!response.ok) throw new Error(`FMI: HTTP ${response.status}`);
  const length = Number(response.headers.get('Content-Length') ?? 0);
  if (length > MAX_BYTES) throw new Error('FMI: too big');
  const text = await response.text();
  if (text.length > MAX_BYTES) throw new Error('FMI: too big');
  return text;
}

async function cached(deps: Deps, key: string): Promise<Response | undefined> {
  return deps.cache ? deps.cache.match(key) : undefined;
}

async function store(deps: Deps, key: string, body: unknown, seconds: number): Promise<void> {
  if (!deps.cache) return;
  await deps.cache.put(key, json(body, 200, seconds));
}

// While FMI's list is being fetched, other requests wait for the same one.
let listInFlight: Promise<FmiWarningList> | undefined;

/** The list, with the boxes of the warnings already read (a cache lookup each). */
async function warningList(deps: Deps): Promise<FmiWarningList> {
  const list = await bareList(deps);
  const boxes: Record<string, Box | null> = {};
  await Promise.all(
    list.ids.map(async (id) => {
      const hit = await cached(deps, `${CACHE_KEY}/box/${id}`);
      if (hit) boxes[id] = (await hit.json()) as Box | null;
    }),
  );
  return { ...list, boxes };
}

async function bareList(deps: Deps): Promise<FmiWarningList> {
  const fresh = await cached(deps, `${CACHE_KEY}/list`);
  if (fresh) return (await fresh.json()) as FmiWarningList;
  listInFlight ??= (async () => {
    try {
      const list: FmiWarningList = {
        updated: deps.now().toISOString(),
        ids: capIdsOf(await fetchText(deps, LIST_URL)),
      };
      await store(deps, `${CACHE_KEY}/list`, list, LIST_FRESH_S);
      await store(deps, `${CACHE_KEY}/list-last-good`, list, LIST_LAST_GOOD_S);
      return list;
    } catch (failure) {
      const lastGood = await cached(deps, `${CACHE_KEY}/list-last-good`);
      if (!lastGood) throw failure;
      return { ...((await lastGood.json()) as FmiWarningList), stale: true };
    } finally {
      listInFlight = undefined;
    }
  })();
  return listInFlight;
}

async function warning(deps: Deps, id: string): Promise<Response> {
  const key = `${CACHE_KEY}/warning/${id}`;
  const hit = await cached(deps, key);
  if (hit) return json(await hit.json(), 200, WARNING_KEEP_S, true);
  const compact = compactCap(id, await fetchText(deps, `${FMI}/${id}`));
  // Not a warning to show (a cancel, no areas): say so, and keep that too.
  const body = compact ?? { id, none: true };
  await store(deps, key, body, WARNING_KEEP_S);
  await store(deps, `${CACHE_KEY}/box/${id}`, compact ? compact.box : null, WARNING_KEEP_S);
  return json(body, 200, WARNING_KEEP_S, true);
}

/**
 * Only the app's own pages may ask: browsers say where a request comes
 * from (Sec-Fetch-Site; older ones only send a Referer). This stops other
 * sites and lazy scripts, not a determined one (headers can be faked);
 * the cache keeps any abuse away from FMI, and the free plan caps the cost
 * at zero.
 */
function fromOurPages(request: Request): boolean {
  const site = request.headers.get('Sec-Fetch-Site');
  if (site) return site === 'same-origin';
  const referer = request.headers.get('Referer');
  try {
    return !!referer && new URL(referer).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** Answers /api/fmi/…; anything else under /api is 404. */
export async function handleApi(request: Request, deps: Deps): Promise<Response> {
  if (!fromOurPages(request)) return error(403, 'Only for weatherpin.app');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'GET, HEAD', ...SECURITY_HEADERS },
    });
  }
  const path = new URL(request.url).pathname;
  try {
    if (path === '/api/fmi/warnings') {
      return json(await warningList(deps), 200, LIST_CLIENT_S);
    }
    const prefix = '/api/fmi/warning/';
    if (path.startsWith(prefix)) {
      const id = path.slice(prefix.length);
      if (!isCapId(id)) return error(400, 'Not a warning id');
      return await warning(deps, id);
    }
  } catch {
    return error(502, "FMI's warnings couldn't be read");
  }
  return error(404, 'Not found');
}
