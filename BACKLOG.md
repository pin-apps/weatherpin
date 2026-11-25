# Backlog

Light list of ideas and loose ends. Add freely; move items to **Done** (or
delete them) when they ship. Newest ideas at the bottom of each section.

## Status (2026-11-25)

Live at https://weatherpin.app and working; **development on a pause**
from 2026-11-25. The repo moved to `pin-apps/weatherpin` (public, fresh
start, main protected by a ruleset, CodeQL and secret scanning on, no
open alerts or PRs). Recently shipped: the quiz's smooth flights, bottom
sheet on phones, bold question words and elevation clue; elevation in
More details (see Done). Good first picks when picking up again: the
security fixes (Next), the thunder heads-up and "today vs tomorrow"
(Ideas); the warnings work waits on the WMO email. Decided: no EDM calculator with
typed-in readings. Start-up JS is
71.7/72 KB: ask before adding to start-up.

## Next

- Security review and tests (planned; notes kept outside the repo).
- Screenshot comparisons in CI ("stage b" of the browser tests): approved
  baseline images in the repo, made in Playwright's Docker image, plus a
  manual "Update visual baselines" workflow.
- More warning areas: the rest of Europe (MeteoAlarm: no CORS headers).
  Finland has a link and an email to FMI asking for CORS; a broker
  only on the Workers free tier (10 ms CPU per request), never a paid plan.
  Best broker candidate: WMO's Severe Weather Information Centre list
  (`severeweather.wmo.int/v2/json/wmo_all.json`, ~1,300 official warnings
  from national services worldwide, ~625 KB, no CORS, checked 2026-11-21).
  Its entries have only area text, no shapes: matching a point needs each
  warning's CAP file (`capURL`) and its polygons, so the broker would
  fetch and index them and answer per point. One broker could then give
  most of the world official warnings, not just Finland.
- Warnings broker for Europe ("option A", agreed 2026-11-21, not built):
  a Cloudflare Worker on the **free plan only** that reads MeteoAlarm's
  keyless country feeds (`feeds.meteoalarm.org/api/v1/warnings/feeds-<country>`,
  CC BY 4.0, no CORS) and answers the app per point (country from the
  time zone; cache ~10 min per country). Measured: parsing costs ~20 ms
  CPU per MB and the free plan allows 10 ms, so only feeds ≤ ~0.3 MB fit:
  ~25 countries incl. Finland (0.08 MB, matched FMI's own count), Norway,
  Sweden, UK, Ireland, Netherlands, Denmark, Poland, Czechia, Portugal.
  Too big: Austria, Hungary, Estonia (~0.4), Belgium, Croatia, Serbia,
  Ukraine, France 1.1, Italy 1.5, Spain 1.8, Israel 4.9, Germany 9.9,
  Switzerland 22.9 MB: keep the "not supported" link (Germany could come
  straight from DWD, which browsers can read). Sizes grow in storms; on
  failure the app falls back to the link. Area matching: EMMA_ID geocodes
  need MeteoAlarm's region shapes (not yet located); the UK sends
  polygons. Built so a country can move to MeteoGate later. MeteoGate
  (`api.meteogate.eu/warnings`, key in an `apikey` header, 500 req/h; the
  user has a key, stored outside the repo) is the better design (bbox list
  - per-warning files, little CPU) but on 2026-11-21 it held only
    Germany's warnings. The user also applied for a MeteoAlarm API token.
    Only official warnings: the app's own forecast-based warning hints were
    removed on purpose.
- Nearby warnings: also list warnings a few km around the
  point, separately ("Nearby: Wind Advisory · San Francisco"). Needs extra
  requests or zone shapes; mind the APIs' load.

- Open the app with no connection at all (a service worker keeping the
  app's files). Built once, then removed before anyone got it: it
  felt risky. Lessons: a service worker follows the CSP of its own script,
  so `connect-src` needs `'self'`. Even with that, its CI test still
  failed (the worker's downloads, probably the test server's certificate:
  Playwright accepts it for pages only). Always fetch the page from the
  network first. To remove one later, `/sw.js` must answer 404 or be a
  worker that unregisters itself; unknown paths answer 404.

- Every autumn: check the weather records in `src/records.ts` (WMO's
  World Weather & Climate Extremes Archive; FMI, SMHI and MET Norway for
  the Nordic ones). A new record: update the value and year, or move it to
  the new place (the old place's line then goes). Last checked 2026-11.

## Ideas

- Excuses and small talk from an AI at run time (later, maybe): a "✨ Something new" button asking Cloudflare Workers AI through the site's own Worker (free plan only: it stops, never charges, when the daily allowance runs out), cached per weather and language, with the written lines as the fallback. Weaker in Finnish than the written lines; About would need a line.

- More map layers. Rain radar has its own button; with a second
  layer, move both into one "Layers" button with a small menu. Each image
  layer needs its host in `img-src` (`public/_headers`), fake tiles in
  `tests/helpers.ts`, a credit in the attribution, and the button in the
  overlap checks. Candidates:
  - Wind: a small grid of arrows from Open-Meteo (one many-place request
    per view after panning stops; mind the rate limits).
  - Radar forecast frames (rain in the next hour): needs a paid source
    (Rainbow.ai etc., checked 2026-11-21), so not for now.
  - Satellite clouds from NASA GIBS: free, no key, but daily, not live.
  - Temperatures for big cities in view, from Open-Meteo (many places in
    one request). Panning makes more requests: mind the rate limits.

- Native speakers to read through `src/i18n-sv.ts` and `src/i18n-nb.ts`
  (Norwegian, incl. the weather excuses' jokes).
- Lighthouse score in CI (bundle size budget and responsiveness tests are
  done; a full Lighthouse run would add load metrics on a slow phone).

- Fun ideas from 2026-11-20 (pick any): laundry drying index ("Good
  drying weather 11–15"), snowman index (sticky snow near 0 °C), mosquito
  index (summer: warm, humid, calm), "today vs tomorrow" ("Tomorrow 6°
  colder and windy"), weather twin (places with the same weather now),
  "take me somewhere sunny" (one many-place request, cached 15 min),
  gentle
  falling snow/rain in the current-weather box (off for reduced motion),
  weather haiku from templates. (Northern lights shipped in the Sky
  section, as a chance "now" from NOAA's nowcast, not a "tonight" forecast.)

- Postcard on computers: copy the picture to the clipboard as well as
  downloading it (the user chose download only for now).

- Forest and grass fire hint (Finland, April–September only): FMI's fire
  warnings come from its forest fire index, which no open API offers.
  Approximate from Open-Meteo's top-layer soil moisture
  (`soil_moisture_0_to_1cm`), low humidity and wind, or the past week's rain
  (`past_days`). Compare with FMI's real warnings for a few weeks before
  showing it; never call it a warning.

- Desert dust forecast (the hourly `dust` is there, ~5 days): a heads-up
  for dust storms (Sahara, Middle East, Asia, Australia). Left out of the
  air values PR to keep it small.

- Thunder heads-up: "⚡ Thunder possible around 16–19" at the top (next to
  "Rain starting around"), from weather codes 95–99 in the next 12 hours;
  no new requests. Discussed 2026-11-22, left for later.

## Maybe

Built or thought through, then put aside. Revisit only with a clear reason.

- Day/night shading with the grayline (twilight band), with a button
  next to My location. Built and tested once, then closed: it adds
  little to a weather page (the panel already shows local time, sunrise
  and sunset) and adds a button over the map. The code is on the
  `grayline-layer` branch.

## Dates to keep

- `public/.well-known/security.txt` expires 2027-11-22: set a new
  `Expires` (at most a year ahead) by October 2027. Its test fails once
  it's past.

## Waiting on others

- WMO's re-use terms: before building the WMO warnings broker (Next),
  confirm by email that the app may show SWIC warnings automatically (the
  SWIC page says "free for re-use by media or other websites", WMO's
  general terms are stricter). The owner sends it; Claude can draft it. A
  user asked for radar and warnings in Australia (2026-11-22): the Bureau
  of Meteorology's licence forbids re-use, so WMO is the way; meanwhile
  the not-covered line could link to the BoM (not decided).
- Owner's to-do: Google Search Console and Bing Webmaster Tools (verify the
  domain with a DNS record in Cloudflare, submit the sitemap), if not done.

- TypeScript 7: blocked until `typescript-eslint` supports it. Then remove
  the TypeScript `ignore` rule in `.github/dependabot.yml`.

## Done

Newest first, one line each; the details are in the PRs and git history.

- Repo moved to pin-apps/weatherpin (public, all rights reserved; gitleaks via its command-line tool); README intro refreshed
- Quiz: the place's elevation as a clue; the question's key words in bold, the high covers the whole day
- Quiz: one smooth flight per place (no extra re-centring); a bottom sheet on phones, map credits and buttons kept clear of it
- Elevation in More details (Copernicus DEM via Open-Meteo, metres or feet)

- 🌡️ Temperature quiz (daily for everyone, free play, shareable) and electric car range in More details
- 📲 Add to home screen in Settings (install dialog, or how-to for iPhone and Firefox)
- 160 more weather excuses and small talk openers (224 in all), in four languages
- 💬 Small talk in the ⋯ menu, and 16 more (over-the-top) weather excuses; the lines load on demand in all four languages
- Umbrella answer in What to wear (when the rain starts or stops, for later, or not needed)
- Units of one's own in Settings: wind (m/s, km/h, mph, knots, Beaufort), rain (mm, in), pressure (hPa, inHg, mmHg)
- 🎲 Weather excuse in the ⋯ menu (excuses from the real weather, share with the place's link)
- Norwegian (bokmål): all texts, Ø/V compass, nb-NO dates, MET Norway warnings in Norwegian
- Foldable panel sections (tap a heading; kept on the device; Air quality, Sky, More details folded at first, with a summary)
- One note for the whole Air quality section: CAMS forecast model, not measuring stations
- Clearer layout: greenhouse gases last; EDM value beside its label
- More air values: SO₂, CO, desert dust, and CO₂ + methane (ppm) under "Greenhouse gases", with estimate notes
- Atmospheric correction (EDM ppm) for surveying instruments in More details, with a clear estimate note
- security.txt: report problems to security@weatherpin.app
- Real 404s for unknown addresses, HSTS, About says Cloudflare hosts the site
- "Beer outside" in More details; size budget split into code 72 KB + texts 12 KB
- Warnings wording: "This app doesn't show warnings for this region" (no "yet")
- Sky section: sun, midwinter, golden/blue hour, stargazing, northern lights (NOAA), moon, shadow
- Weather on a day (🎂, any day since 1940) and its postcard
- Postcard: long town names break at a syllable, not mid-letters
- Only official warnings: the forecast-based warning hints removed
- Rain radar history: ▶ plays the last ~2 h, slider (RainViewer, ECCC)
- Real FMI warnings in Finland through the site's own broker (`worker/`)
- Frost hints (windscreen, balcony plants); weather records at record places
- Weather postcard: "Share as a picture" in the ⋯ menu
- Random place (🎲) and the Santa easter egg
- What to wear under "Feels like"
- Search engines and link previews (tags, picture, robots.txt, sitemap.xml)
- Snow radar in winter over Canada and the northern US (ECCC)
- Blue "you are here" dot after My location (memory only)
- Air quality on national scales: UK DAQI, Canada AQHI
- Swedish, each language a separate download
- Offline: the last 3 forecasts saved, "No connection · weather from 14:05"
- Day length's change by tomorrow and the moon's phase
- ⋯ menu in the panel header (Share, Start here)
- Settings (⚙): °C/°F, light/dark, language, start place, clear saved data
- Favourites list shows the weather now; warning areas, US marine zones
- Weather warnings for Sweden (SMHI)
- Place names for tapped points (Nominatim)
- Finland: link to FMI's warnings page
- Easter egg: search "sauna"
- Finnish heading over favourites; check:i18n covers the stylesheet
- Cloudflare Web Analytics, no cookies
- Renamed Weatherpin, own domain weatherpin.app; "Use at your own risk"
- Finnish, checked in CI
- Sea weather (Open-Meteo Marine)
- Pollen forecast (Europe, in season)
- "Rain starting around 14:45" from 15-minute steps
- Wind arrows in the hour strips
- "Updated 14:05"; old weather refreshed in place after 15 min
- Cheaper browser tests: some devices run only `@layout` tests; 3 shards
- Edit favourites: rename, reorder, remove with Undo
- Cheaper CI: `main` skips browser tests already passed on the PR
- Speed: long cache for hashed files, early connections, size budget
- Faster CI: tests in Playwright's Docker image
- Place links: the address follows the place; Share this place
- Hour graphs; a day in the 7 days opens its own graph and hours
- Accessibility checks (axe-core, WCAG 2.2 AA), light and dark
- Browser tests in WebKit (iPhone, iPad) over https
- About dialog: sources, licences, privacy
- Warnings for Canada, the US and Norway
- App icon and web app manifest
- Environment Canada radar over North America
- Rain radar from RainViewer
- Panel order by how often people need each part
- UV index and the sun protection window
- Snow amounts and wind gusts
- Faster browser tests: parallel shards, merged report
- Start place
- Air quality forecast
- °C/°F; clock and date style from the browser language
- Favourite places
- Air pressure trend and air quality
- Fix: map broken on first load in iPhone Safari
- Browser tests in CI
- Layout fixes: attribution, round location button
- "My location" and place search
- iPhone: map fills the screen height
- World map with tap weather, 24 hours and 7 days
