# Weatherpin

Live at **https://weatherpin.app**. A world weather map, built with Vite and vanilla TypeScript. Click or tap any
point on the map, search for a place by name, or press "My location" to see
the current weather and forecast there.

The °C / °F button in the weather panel switches units (wind, rain and
pressure follow it). The first choice, the clock (`14:00` or `2 PM`) and the
date style come from the browser's language. The choice and favourite places
are saved on the device only. "Start here" under the place's name in the
weather panel makes that place the start place: the app then opens there,
with its weather showing.

Map tiles come from [OpenStreetMap](https://www.openstreetmap.org/), shown with
[Leaflet](https://leafletjs.com/). Forecasts come from the
[Open-Meteo](https://open-meteo.com/) API, and place search from Open-Meteo's
geocoding API (data from [GeoNames](https://www.geonames.org/)), and air
quality from Open-Meteo's air quality API (data from the Copernicus
Atmosphere Monitoring Service), and the optional rain radar from
[Environment and Climate Change Canada](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/)
over North America and [RainViewer](https://www.rainviewer.com/) elsewhere.
Severe weather warnings come from Environment and Climate Change Canada,
the US National Weather Service and MET Norway (other areas are not
covered yet). All are
called directly from the browser. There is no backend.

## Development

```sh
npm install
npm run dev          # dev server at http://localhost:5173
npm run typecheck
npm run lint
npm run build        # outputs to dist/
npm run preview:worker  # build, then serve dist/ locally the way Cloudflare will
```

### Browser tests

[Playwright](https://playwright.dev/) opens the built app in headless
Chromium at phone, tablet and desktop sizes (light and dark), and in WebKit
(Safari's engine) on an iPhone and an iPad, and checks it:

- **Layout rules** (`tests/layout.spec.ts`): controls never overlap or stick
  out of the screen, the map fills the screen, the marker isn't hidden.
- **Flows** (`tests/flows.spec.ts`): search, "My location", error and polar
  states, gestures.

The tests never call the real APIs or OSM: tiles, forecasts and search
results come from `tests/fixtures/`, and the clock is frozen. The app is
served with `wrangler dev`, so the real CSP applies, and any console error
fails the test.

```sh
npx playwright install chromium webkit   # once: download the test browsers
npm run test:e2e                   # build + run all tests
npm run test:e2e:report            # open the report with screenshots
npm run check:size                 # JS/CSS size against the budget (after a build)
npm run check:i18n                 # every text has a Finnish translation
```

In CI the **Browser tests** run on every PR, split over parallel jobs
(shards). Not every test runs on every device: some devices (two phone
sizes, dark mode, the iPad in WebKit) run only the tests tagged `@layout`
(layout, accessibility, things that must fit the screen), since what the
app _does_ is the same there. To save Actions minutes, most PRs get a
**quick run** (2 shards): the iPhone and iPad in Chromium also run only
`@layout` tests, so every test runs on three devices (desktop, the iPhone
in WebKit, a phone held sideways). A **full run** (3 shards, every test on
five devices) happens when a PR touches what every screen shares
(`index.html`, `style.css`, the sheet, map, panel and ⋯ menu, `main.ts`,
dependencies, the test setup or CI), every Monday on `main`, and from the
**Run workflow** button on the Actions page (CI → Run workflow). Locally,
`FULL_TESTS=1 npm run test:e2e` runs the full set. Neither the weekly run
nor the button deploys. The **Browser test
report** job merges their results into one HTML report, with a screenshot
of every tested screen, attached to the run as the `playwright-report`
artifact (Actions → the run → Artifacts). The tests run inside Playwright's
own Docker image, with the browsers and their Linux libraries already
installed, two tests at a time per job. When Dependabot updates
`@playwright/test`, update the image tag in `.github/workflows/ci.yml` to
the same version (CI still works without it, just slower).

`preview:worker` runs `wrangler dev`, which uses Cloudflare's runtime locally.
It applies `public/_headers` and the SPA fallback, so use it to check
headers or the CSP. It needs no Cloudflare account and deploys nothing.

## Deployment

The site is a static build hosted on **Cloudflare Workers with static assets**.
Cloudflare serves the files in `dist/` directly. A small Worker script
(`worker/`) answers only `/api/*`: a broker for FMI's weather warnings, which
browsers can't read directly. It runs on the free plan.

### How it works

- **`wrangler.jsonc`** points Cloudflare at `dist/` and turns on
  `not_found_handling: "404-page"`. Paths that don't match a file get
  `404.html` with status 404 (the app needs no other paths: places live in
  the `#hash`).
- **`public/_headers`** sets security headers on every response. Vite copies it
  into `dist/`, and Cloudflare applies it instead of serving it as a file:
  - `Content-Security-Policy`: everything from the site's own origin only,
    with two exceptions. `img-src` allows `tile.openstreetmap.org` for map
    tiles, and `connect-src` allows only `api.open-meteo.com`,
    `geocoding-api.open-meteo.com` and `air-quality-api.open-meteo.com`. If the app needs
    another host, add it here, or the browser will block the request.
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: geolocation is allowed for this site only (the
    "My location" button); camera, microphone, payment and USB are off.
- **`.github/workflows/ci.yml`** runs the pipeline:

  ```
  pull request ──► checks · browser tests · audit · gitleaks           (no deploy)
  push to main ──► checks · browser tests* · audit · gitleaks ──► deploy
  ```

  \* On `main` the browser tests are skipped when they already passed on
  this exact code: the push is a PR's merge, the merged code is identical
  to the PR's last commit (the PR was up to date with `main`), and a CI run
  for that commit passed on the PR. If `main` moved after the PR was
  tested, or anything is unclear, they run again. This halves the Actions
  minutes a change costs.
  To keep merges on the cheap path, update a PR from `main` before merging
  if `main` has moved.

  The `deploy` job runs only on pushes to `main`, and only after all four
  check jobs pass (the browser tests by passing or by that skip). It rebuilds the site and runs `wrangler deploy` through
  `cloudflare/wrangler-action`, using the wrangler version pinned in
  `package-lock.json`. It runs in the GitHub environment `production`, so
  the Cloudflare secrets are only available to that job. Deploys never run
  in parallel, and a running deploy is never cancelled.

  A change that only touches the Markdown files at the top of the repo
  (`BACKLOG.md`, `README.md`, `CLAUDE.md`) runs only gitleaks: the
  `changes` job ("What changed") sees that nothing on the site can change,
  so the checks, browser tests, audit and deploy show as skipped. Any other
  file in the change runs everything.

  The `audit` job checks only the packages users load (`npm audit
--omit=dev`). Advisories in build tools, which never ship, show up as
  Dependabot alerts on GitHub instead of blocking deploys.

### One-time setup

These steps are done by hand, once. Never commit the token or account ID.

1. **Create a Cloudflare API token.** In the Cloudflare dashboard, go to
   **Account API tokens → Create Token → Create Custom Token** with only:
   Account **Workers Scripts: Edit** and **Account Settings: Read**, and
   for the zone `weatherpin.app` **Workers Routes: Edit**. (The **Edit
   Cloudflare Workers** template also works but allows much more.)
2. **Find your account ID.** It's on the account's overview page in the
   dashboard (see
   [Find account and zone IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)).
3. **Create the GitHub environment.** In the repo, go to **Settings →
   Environments → New environment** and name it `production`. Recommended:
   under **Deployment branches and tags**, allow only `main`. Optionally add
   required reviewers if you want to approve each deploy.
4. **Add the secrets to that environment** (not as repository secrets, so
   only the deploy job can read them):
   - `CLOUDFLARE_API_TOKEN`: the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID`: the ID from step 2
5. **Merge to `main`.** The first successful run creates the Worker
   `nordic-weather` and prints its URL
   (`https://nordic-weather.<your-subdomain>.workers.dev`). The URL also
   appears on the `production` environment page in GitHub.

The app's own domain, `weatherpin.app`, is set in `wrangler.jsonc`
(`routes`, `custom_domain`): the deploy points it at the Worker and
Cloudflare issues its certificate. The domain must be in the same Cloudflare
account, and the API token needs **Workers Routes: Edit** for its zone
(step 1). The workers.dev address stays on (`workers_dev`). The Worker,
`package.json` and the storage keys keep the old name `nordic-weather`
(renaming the Worker would create a new one, and new
storage keys would lose everyone's saved favourites).

### Rollback

In the Cloudflare dashboard, open **Workers & Pages → nordic-weather →
Deployments** and roll back to an earlier version. Or revert the commit on
`main` and let the pipeline deploy again.

## Copyright

© 2026 tomk. All rights reserved. The code is public to read, but no
licence is granted to copy, change or reuse it. The weather data, map and
other sources the app uses come under their own licences (listed in the
app's About).
