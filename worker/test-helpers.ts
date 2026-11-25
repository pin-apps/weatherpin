// Shared by the broker's unit tests: made-up FMI files and a stand-in for
// Cloudflare's cache.

/** A small CAP file with one area around central Helsinki. */
export function capFile({
  status = 'Actual',
  msgType = 'Alert',
  colour = 'orange',
  polygon = '60.10,24.80 60.10,25.10 60.25,25.10 60.25,24.80 60.10,24.80',
  description = 'Gusts up to 25 m/s &amp; more.',
} = {}) {
  const info = (language: string, event: string) => `
  <info>
    <language>${language}</language>
    <event>${event}</event>
    <severity>Severe</severity>
    <onset>2026-11-21T12:00:00+02:00</onset>
    <expires>2026-11-22T06:00:00+02:00</expires>
    <headline>${event}: Helsinki</headline>
    <description>${description}</description>
    <parameter><valueName>color</valueName><value>${colour}</value></parameter>
    <area><areaDesc>Helsinki</areaDesc><polygon>${polygon}</polygon></area>
    <area><areaDesc>Helsinki</areaDesc></area>
  </info>`;
  return `<?xml version="1.0"?><alert><status>${status}</status><msgType>${msgType}</msgType>${info(
    'fi-FI',
    'Tuulivaroitus',
  )}${info('sv-FI', 'Vindvarning')}${info('en-GB', 'Wind warning')}</alert>`;
}

/**
 * Cloudflare's cache in memory: match and put, honouring Cache-Control
 * max-age against the given clock.
 */
export function memoryCache(clock: { now: number }): Cache {
  const entries = new Map<string, { response: Response; until: number }>();
  return {
    async match(key: RequestInfo | URL) {
      const entry = entries.get(String(key));
      return entry && entry.until > clock.now ? entry.response.clone() : undefined;
    },
    async put(key: RequestInfo | URL, response: Response) {
      const age = Number(
        /max-age=(\d+)/.exec(response.headers.get('Cache-Control') ?? '')?.[1] ?? 0,
      );
      entries.set(String(key), { response: response.clone(), until: clock.now + age * 1000 });
    },
  } as Cache;
}
