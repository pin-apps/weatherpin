// The site's Worker. Cloudflare serves the app's files (dist/) itself; only
// /api/* reaches this script (wrangler.jsonc: run_worker_first). The only
// API so far: FMI's warnings for Finland (fmi.ts).

import { handleApi } from './fmi.ts';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      return handleApi(request, {
        fetch: (input, init) => fetch(input, init),
        cache: (caches as unknown as { default: Cache }).default,
        now: () => new Date(),
      });
    }
    return env.ASSETS.fetch(request);
  },
};
