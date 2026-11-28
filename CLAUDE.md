# Weatherpin

A world weather map, built with Vite and vanilla TypeScript. The user sees a
full-screen world map and clicks/taps any point, searches for a place by
name, or uses "My location" to get the weather there (current conditions,
next 24 hours, 7 days). Live at https://weatherpin.app (and the old
workers.dev address). It was first called "Nordic Weather": the Worker,
`package.json` and the `nordic-weather:` storage keys keep that name on
purpose (see README). The repo is `pin-apps/weatherpin` (public, no
licence: all rights reserved).

- Map: [Leaflet](https://leafletjs.com/) (npm, bundled; no CDN) with
  OpenStreetMap standard tiles. Follow the
  [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
  standard tile URL, visible "© OpenStreetMap contributors" attribution,
  max zoom 19, no prefetching or bulk downloading.
- Weather: [Open-Meteo](https://open-meteo.com/) Forecast API with
  `timezone=auto`, called directly from the browser. Attribute it
  (CC BY 4.0). There is no backend apart from a tiny warnings broker on
  the same Cloudflare Worker (`worker/`, `/api/*` only; see below).
- Place search: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  (place names and postcodes, not street addresses; data from GeoNames,
  credited in the map attribution). Debounced search-as-you-type; the free
  tier is limited to 600 requests/min and 10,000/day.
- Names of tapped points: OpenStreetMap's
  [Nominatim](https://nominatim.org/release-docs/latest/api/Reverse/)
  reverse geocoding (town level, `zoom=10`, in the app's language). Follow
  the [usage policy](https://operations.osmfoundation.org/policies/nominatim/):
  at most 1 request/s (spaced out in code), one per tap, cached, no bulk
  use. The weather never waits for it; no name keeps the coordinates. If
  traffic grows a lot, move to a paid geocoder.
- Air quality: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
  (CAMS data, global; pollen Europe only): current values plus an hourly
  index forecast, ~4 days in Europe, 5 elsewhere, and a pollen forecast per
  day (Europe, in season). The index follows the place (decided by time
  zone): the UK's DAQI in the UK and Canada's AQHI in Canada (both worked
  out by the app from the hourly pollutants, `src/weather/national-aqi.ts`,
  with a note that official readings can differ), the European AQI
  elsewhere in Europe, the US AQI everywhere else. Show the
  Copernicus notice next to the data. Also shown (current values only, same
  request): SO₂, CO, desert dust (only when ≥ 0.5 µg/m³) and, under
  "Greenhouse gases" (last, after the index forecast: not air quality), CO₂
  (ppm) and methane (µg/m³ converted to ppm). One "⚠️ Everything in this
  section comes from the CAMS forecast model, not from measuring stations"
  note right under the index covers the whole section (`estimateNote()` in
  `src/dom.ts`); the gases add only a plain "Not part of the air quality
  index".
- Sea weather: [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
  (waves, swell, sea temperature; CC BY 4.0) for the nearest sea cell
  (`cell_selection=sea`); inland every value is null and no Sea section
  shows.
- Weather on a past day: [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
  (`archive-api.open-meteo.com`, ERA5 from Copernicus, CC BY 4.0): one
  day at the place shown, 1 Jan 1940 to ~a week ago; nothing saved.
- Northern lights: NOAA Space Weather Prediction Center's
  [aurora nowcast](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast)
  (OVATION, public domain, CORS open): the chance now, in the Sky section
  only when dark and clear enough far north or south. Worded as a chance
  "now", credited "NOAA"; About says it's a model estimate.
- Rain radar: [RainViewer](https://www.rainviewer.com/api.html) free API
  (personal/educational/small community use, no key; credit RainViewer with
  a link). Since 2026: past ~2 h only, no forecast frames, colour scheme 2,
  zoom ≤ 7 (stretch above), 100 requests/IP/min: the newest frame at
  once, the past 2 h only on ▶ (loaded slowly, `src/radar/player.ts`). Off
  by default; in the map layers menu next to "My location" (the button
  `#layers-button` opens `#layers-menu`: Rain radar or Weather symbols,
  one at a time; `main.ts`).
- Radar over North America: Environment and Climate Change Canada's
  [MSC GeoMet](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/)
  WMS, layer `RADAR_1KM_RRAI` (rain rates), or `RADAR_1KM_RSNO` (snow
  rates) from November to March when the map's centre is north of 40° N,
  credited "Snow radar" (Canadian + US radars, 1 km, every 6 min;
  Open Government Licence – Canada, credit ECCC). Used when the map's
  centre is over North America at zoom ≥ 4; RainViewer elsewhere and as
  the fallback. Always request a time the capabilities list (a wrong time
  returns an error, not an image). No radar refreshes while the page is
  hidden.
- Weather warnings, by the place's time zone (from the forecast):
  Environment Canada (`api.weather.gc.ca` weather-alerts, a tiny bbox
  around the point; drop `ended`/`cancelled`, dedupe areas), US National
  Weather Service (`api.weather.gov/alerts/active?point=`, US zones only:
  it rejects other points with HTTP 400), MET Norway MetAlerts (`api.met.no`,
  land only, `lang=en`), SMHI for Sweden (`opendata-download-warnings.smhi.se`,
  CC BY 4.0: the whole country's list with GeoJSON areas, kept 5 min; the
  app checks which areas hold the point; land only, English). Finland
  (and Åland): FMI's CAP feed (`alerts.fmi.fi`, CC BY 4.0) sends no CORS
  header, so it comes through the site's own broker (`worker/`,
  `/api/fmi/…`) and `src/warnings/fmi.ts` matches the point itself (no
  location sent): texts in the app's language, "from … until …" for
  warnings issued ahead, FMI's name and page in the app's language. Elsewhere "Not available for this area". Only official
  warnings are shown: the app makes no warnings of its own from the
  forecast (decided 2026-11-21: "show official ones or say plainly that we
  can't"). When no warning is shown, a line at the top says why, with
  where to look: "No official warnings in effect · MET Norway", "This app
  doesn't show warnings for this region. Official warnings: MeteoAlarm
  (Europe) / WMO severe weather" (no "yet": it promises nothing), or
  "couldn't be checked". So no box never reads as
  "all clear". Plan for more of Europe: BACKLOG (warnings broker). MeteoAlarm sends no
  CORS headers either.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build to `dist/`
- `npm run lint` — run ESLint
- `npm run typecheck` — run `tsc --noEmit` (app, then `tests/`)
- `npm run test:e2e` — build, serve via `wrangler dev`, run Playwright tests
  (needs `npx playwright install chromium webkit` once)
- `npm run test:e2e:report` — open the last test report (screenshots)
- `npm run check:size` — gzipped JS/CSS that loads at start against their
  budgets: code 75 KB (incl. `src/i18n.ts`'s own chunk), texts 12 KB (the largest language file, as a
  visitor gets one), CSS 14 KB; files loaded on demand are listed, not
  counted; after a build; CI runs it
- `npm run check:i18n` — every text has a Finnish, a Swedish and a
  Norwegian translation, and the Finnish haiku lines are 5-7-5 (CI runs it)
- `npm run test:worker` — the warnings broker's unit tests (`worker/`,
  Node's own test runner, no network; CI runs it)
- `npm run format` — format with Prettier
- `npm run preview:worker` — build and serve via `wrangler dev` (local only)

Never run `wrangler deploy` by hand; CI deploys `main` (see README).

## Layout

- `BACKLOG.md` — light list of ideas and loose ends; check it when planning
  work, update it when something ships
- `index.html` — entry page: map container and weather panel markup; links
  the icons and manifest; the title, description, link-preview tags
  (`og:`/`twitter:`, picture `public/og-image.png`), canonical address and
  a schema.org description for search engines (data only, not run)
- `public/` — `_headers` (below), `robots.txt` and `sitemap.xml` (real
  files), `.well-known/security.txt` (RFC 9116: report security problems
  to security@weatherpin.app, the owner's forwarding address; **renew
  `Expires` before 2027-11-22**), `404.html` + `404.css` (status 404 for any other address: the
  app routes only by `#hash`; no scripts, no inline styles),
  `theme.js` (light/dark before the first
  paint, see `src/theme.ts`), the app icon (`favicon.svg`; the PNGs are
  drawn from the same shapes by `scripts/make-icons.py public`, as is the
  1200×630 link-preview picture `og-image.png`) and
  `manifest.webmanifest` (home-screen name/icon)
- `src/main.ts` — app entry point; wires the map, panel and API together;
  refreshes weather left open once it's 15 min old (page shown again, or
  a 1-min check), quietly: no loading state, failures keep the old weather
- `src/map.ts` — Leaflet map, click/tap/Enter handling, CSS marker, the
  blue "you are here" dot after My location (in memory only),
  longitude normalisation, attribution (OSM + Open-Meteo)
- `src/about.ts` — the About dialog (in `index.html`): sources, licences,
  privacy, "Use at your own risk"; opened from "About" in the map
  credits, the bottom of Settings or `#about`. Keep it free of personal details (no account names, emails or
  repo links); update it when a data source or what's stored changes
- `src/place-link.ts` — the address follows the place shown
  (`#at=60.17,24.94&name=Helsinki`, rounded to ~1 km); reading a place
  from a link
- `src/share-button.ts` — "Share this place" in the panel's ⋯ menu: the
  system share sheet, else copy the link
- `src/postcard.ts` + `src/postcard-button.ts` — "Share as a picture" in
  the ⋯ menu: a 1080×1080 postcard drawn on a canvas ("Greetings from
  HELSINKI", the weather in a stamp with a postmark (town, date),
  today's high/low and chance of rain, the next 3 days, the date there,
  weatherpin.app; sky colours by the weather). Share sheet with the file
  where there is one, else downloaded (`src/share-picture.ts`, shared
  with the past day's card). The drawing code loads on demand
- `src/quip-buttons.ts` + `src/quips/` — "🎲 Weather excuse", "💬 Small
  talk" and "🍃 Weather haiku" in the ⋯ menu, for fun (the card takes its
  icon and title from the button's own text): a card at the top of the panel
  (`card.ts`, one at a time) with a line made from the real weather there
  ("My cat is now a kite. Gusts of 25 mph from SW…"; small talk, in
  Finnish "Jutun juurta", sv/nb "Småprat": one opener about the real
  weather, never a scripted conversation: "Only 7 h 05 min of daylight
  today. Did you manage to see any of it?", temperature, rain and snow,
  light and darkness, tomorrow, the weekend, a beer outside). `facts.ts` works
  out once what's true (gusts, rain soon, thunder, cold, short day,
  tomorrow colder, the weekend…), already formatted; each line in
  `excuses.ts` + `excuses-more.ts` / `small-talk.ts` + `small-talk-more.ts`
  (~120 excuses, ~110 openers) fits when its facts are there, and a few
  always fit. "Another one" goes through all that fit before repeating;
  "Share" sends it with the place's link. The lines hold all four
  languages side by side (`Record<Language, string>`, so a missing one
  won't compile; `check:i18n` checks the placeholders match): they load
  on demand, not in the start-up language files. Nothing asked for or
  saved. The haiku (`haiku.ts`, lines in `haiku-lines.ts`, data only): an
  opening for the light (dawn, day, dusk, night, polar night, midnight
  sun) or the season (by hemisphere; none within 23.5° of the equator),
  then a middle and a closing line from the one weather group that fits
  best (thunder, snow, rain, fog, wind, −10° frost, 28° heat, clear
  night/day, grey), so a poem keeps to one subject; no numbers. English
  and Finnish 5-7-5 (`check:i18n` counts the Finnish syllables), Swedish
  and Norwegian short-long-short. A round shows each middle line once; the
  card keeps a poem's line breaks (a text with `\n`)
- `src/past-weather-button.ts` + `src/past-weather.ts` — "🎂 Weather on
  a day…" in the ⋯ menu: a dialog (`#past-weather` in `index.html`, apart
  from the forecast so an old day can't pass for today) with 1/10/50
  years ago or any date; that day's weather, a "Today: …, 14° warmer"
  line and an ERA5 note; "📸 Share as a picture" under a day makes its
  postcard ("Greetings from 2016", that date in the postmark, the day and
  "Today: …", no forecast). The dialog code loads when first opened
- `src/weather/archive.ts` — the archive request (one day, metric),
  in-memory cache, calendar date maths (`yearsBefore`, 29 Feb → 28 Feb)
- `src/search.ts` — search box with suggestions (ARIA combobox); an empty
  box lists the favourites with the weather there now ("☁️ 3 °C"), and
  under the list "Edit favourites" and "🎲 Random place" (buttons, also
  with no favourites)
- `src/places/geocoding.ts` — Open-Meteo geocoding request, place helpers
- `src/places/reverse.ts` — (loaded on the first tap, start-up size) the name of a tapped point from Nominatim
  ("Espoo, Finland"), spaced 1 s apart, cached; a name in another script
  (北京市) gives way to its name in the app's language, English or
  `int_name` (`namedetails=1`), else just the country; `main.ts` sets it on the
  point and the panel, page title and address follow
- `src/weather/saved.ts` — the last 3 forecasts shown, kept on the device;
  `api.ts` falls back to them when the network fails, and the panel says
  "No connection · weather from 14:05" (refreshes as soon as it's back)
- `src/storage.ts` — the only code that touches `localStorage`; safe when
  the browser blocks it
- `src/units.ts` — °C/°F setting and wind/rain/pressure units of one's
  own (saved; the rest Automatic), and the clock/date style from the
  browser language
- `src/install-prompt.ts` — keeps the browser's "can be installed" event
  (Chromium's `beforeinstallprompt`) from start-up for Settings; knows
  whether the app runs from the home screen
- `src/settings.ts` — the Settings dialog, opened from ⚙ next to the
  search box: "📲 Add to home screen" (the browser's install dialog where
  there is one, else how to do it: iPhone/iPad Share → Add to Home
  Screen, Firefox ⋮ → Install, others the menu; "Added to the home
  screen." once installed), appearance (Automatic/Light/Dark) and colours
  (Classic, Nordic night, Sauna, Retro, High contrast, 1990s), °C/°F with wind,
  rain and pressure under "More units" (a `<details>`, open when one is
  the user's own), language, the
  start place (shown, can be removed), "Clear saved data", a link to
  About. Rows of toggle buttons (`aria-pressed`); a choice applies at once.
  Its code loads on the first press of ⚙ (`main.ts`; presses while it
  loads open it once); units, theme and language stay in start-up code
- `src/theme.ts` + `public/theme.js` — light or dark on
  `<html data-theme>`: the user's choice, else the device's; the colour
  set on `<html data-skin>` (none for Classic; saved as `skin`), each
  skin's light and dark variables in `style.css` (all text 4.5:1 or more);
  `theme.js`
  (a plain blocking script in `<head>`) sets it before the first paint
  so there's no white flash, `theme.ts` follows changes. Keep the two in
  step
- `src/i18n.ts` — the language (saved choice, else the browser's), `t()`,
  `msg()`, `plural()`, translating `index.html`'s texts;
  `loadTranslations()` fetches the language's texts (a separate file per
  language; `main.ts` awaits it before anything else)
- `src/i18n-fi.ts`, `src/i18n-sv.ts`, `src/i18n-nb.ts` — the Finnish,
  Swedish and Norwegian (bokmål) texts; About's texts apart in `src/i18n-about-fi.ts`
  (`-sv`, `-nb`), loaded when About is first opened (`loadAboutTexts()`,
  about.ts; the dialog has `data-i18n-later`, so `translatePage()` leaves
  it until then): most visitors never open it (start-up texts budget)
- `scripts/check-i18n.mjs` — finds every text in `src/` and `index.html`
  and fails if one has no Finnish or no Swedish
- `src/sauna.ts` — easter egg: searching "sauna" offers Saunalahti, Espoo
  ("Sauna Bay"); choosing it adds a sauna report (80 °C, the real sea
  temperature for the dip) above the real weather. Only from that search
  (a link or favourite shows plain weather); kept out of About
- `src/santa.ts` — easter egg like the sauna: searching "Santa",
  "joulupukki", "tomten"… offers Santa's workshop (Rovaniemi, the Arctic
  Circle); choosing it adds a report from the real weather there (sleigh
  conditions from gusts, reindeer visibility from fog/snow, days to
  Christmas Eve). Only from that search; kept out of About. Both reports
  (`sauna-report.ts`, `santa-report.ts`) load on demand (`panel.ts`)
- `src/journey/` — weather levels, 10, small steps first (points + days
  of use, in total, not in a row): 💧 Dewdrop 0, 🌬️ Breeze 10 (day one),
  ☁️ Cloud 30 + 2 days, 🌦️ Shower 50 + 3, 🌈 Rainbow 80 + 5, ❄️ Snowflake
  120 + 7, ⛈️ Storm 180 + 10, 🌪️ Whirlwind 300 + 20 + 2 badges, 🌌 Aurora
  600 + 45 + 3, 💎 Diamond dust 2,000 + 100 + 5; days of use never fewer
  than the streak (repairs older saves) (`levels.ts`); the highest level reached is kept, saved by name
  (`reachedId`; older saves mapped by name in `award.ts`). First steps:
  10 features to try, 5 points each once (search, favourite, My location,
  radar, quiz, share, a past day, opening Sky, start place, Random place;
  `weatherpin:task` events; a favourite, start place or radar already
  there counts), all 10 → 🎓 Weather pro badge. `chip.ts` (start-up: the round chip next to ⚙ with the level's emoji and
  a progress ring, `--level-progress`; `noteJourney()`), `levels.ts`
  (levels, saved totals, events), `award.ts` (on demand: points for a day
  of use 1, the daily quiz 2, a share 3 once a day, a new ~50 km area 2 (5
  a day), a new country 10 (3 a day; search's `country_code` or Nominatim's), a new
  continent 25 (by time zone), a badge 15: −30°, +40°, thunder, polar
  night, midnight sun, northern lights, below sea level, above 3,000 m;
  secret badges for the easter eggs (sauna, Santa, a weather record place;
  named only once found, `weatherpin:secret` from `panel.ts`); never goes
  down; back after 30+ days: "resting" toast, streak from 1),
  `card.ts` ("Your weather journey" dialog and the level-up toast; "📸
  Share my level": a 1080×1080 picture, `drawLevelCard` in `postcard.ts`,
  headed "My Weatherpin level", with the level's emblem and ring, points, badges, what's explored and
  the weather of the place shown now and the next 3 days; share sheet or
  download via `share-picture.ts`, which counts as a share),
  `texts.ts` (its texts side by side, out of the start-up language files).
  Shares, the daily quiz and the aurora row announce themselves with
  window events (`weatherpin:shared`, `weatherpin:quiz`,
  `weatherpin:aurora`); `main.ts` passes them on. Saved as
  `nordic-weather:journey` (in About's privacy text)
- `src/records.ts` — weather records: a point near a record place (Vostok,
  Death Valley, Mawsynram, the Nordic national records…) gets a 🏆 line
  above the real weather; facts built in (WMO's extremes archive and the
  national services), values in the units shown
- `src/places/random-place.ts` + `land-mask.ts` — "Random place" under the
  search box: a random point on land (equal area, 75° N to 60° S) from a
  rough 0.5° land map (`scripts/make-land-mask.py`, Natural Earth, public
  domain); loaded only when pressed
- `src/start-place.ts` — the start place the app opens at (only if the user
  chose one; saved rounded to ~1 km)
- `src/start-place-button.ts` — "Start here" in the panel's ⋯ menu (says
  what changed), and the ⌂ mark next to the title
- `src/places/same-place.ts` — when two points count as the same place
- `src/favourites/store.ts` — favourite places, saved through `storage.ts`
- `src/favourites/button.ts` — the ☆/★ toggle in the weather panel
- `src/favourites/editor.ts` — the Edit favourites dialog: rename (the
  user's name is a `label`, shown in the app only; links, shares and the
  page title keep the place name), ↑/↓ to reorder, remove with Undo. New
  favourites go to the end of the list. Its code loads the first time
  it's opened (start-up size budget)
- `src/layer/` — the weather symbols layer: "Weather symbols" in the map
  layers menu (`#layer-button`, start-up; the rest loads when first
  turned on, or just after start-up if it was left on) shows the weather
  at the bigger cities in view as badges (symbol, temperature, name;
  Leaflet divIcons built with `el()`): **Now · Tonight (03:00) ·
  Tomorrow (15:00)** local time, picked in `.weather-bar` (bottom left,
  above the radar's bar when both are on: `--radar-bar-space`). Cities
  from `cities.ts` (made by `scripts/make-cities.py` from GeoNames'
  cities15000, CC BY 4.0: all ≥ 250,000 people, capitals, Nordic and
  Baltic places ≥ 15,000; biggest first), taken as many as fit ~88×56 px
  apart (4–12); their weather in one Open-Meteo request for the places
  not known (`hourly=temperature_2m,weather_code` only, `timezone=auto`, 2 days;
  "Now" is this hour; day or night from the sun's height, `weather/solar.ts`;
  15 s timeout), asked 1 s after the map stops, kept 2 h on the device
  (`nordic-weather:weather-layer-cache`, 200 cities at most, in About's
  privacy text), so panning back or reopening asks nothing. A badge opens that city's weather. Saved as
  `nordic-weather:weather-layer` (on, time). Hidden while the quiz is open
  (it would give the answers away). Its CSS (`weather-layer.css`) and
  texts load with it (start-up budgets)
- `src/radar/frame.ts` — what a radar source returns (one picture) and
  the shared layer look
- `src/radar/rainviewer.ts` — RainViewer frame list → a layer per frame
  (checks the tile host against the CSP's)
- `src/radar/eccc.ts` — Environment Canada: the last 2 h of times (every
  other 6-min one) from the WMS capabilities → WMS layers; where it covers the view; rain or snow layer
  by month and latitude
- `src/radar/radar.ts` — on/off button (saved), picks the source for the
  view, refreshes per source (6 or 10 min) while visible; the credit names
  the source and the time of the picture shown; the history bar (▶, slider,
  "13:50 · 15 min ago"), shown while the radar is on. Its code loads just
  after start-up (`main.ts`; an early press is kept)
- `src/radar/player.ts` — the radar history (loaded on the first ▶ or
  slider touch): the last ~2 h (RainViewer 13 pictures every 10 min, ECCC
  every 12 min), one hidden layer per picture, loaded one at a time newest
  first, each after the previous one's tiles, max 80 tile requests a
  minute (RainViewer allows 100 per IP); plays 0.5 s per picture, 1.5 s on
  the newest; never plays by itself. Moving the map, turning the radar
  off, a new newest picture or a hidden page stop it (back to the newest,
  the other layers go)
- `src/warnings/` — `types.ts` (shared shape, levels, credits),
  `eccc.ts`, `nws.ts`, `metno.ts`, `smhi.ts`, `fmi.ts` (one per service;
  FMI through the broker, the point matched in the app; each loaded on
  demand for a place in its country), `warnings.ts` (service by time
  zone, 5-min cache)
- `src/render/warnings.ts` — warning boxes at the top of the panel (title,
  until when, and the area it's for: up to three names, "Sea area: …" for
  US marine zones) and the status line in More details
- `src/geolocation.ts` — browser location as a promise, friendly errors
- `src/locate.ts` — "My location" button and its status message
- `src/panel.ts` — weather panel states: loading, error, forecast
- `src/panel-actions.ts` — the ⋯ menu's actions (Start here and the ⌂
  mark, Share this place, Share as a picture, excuse/small talk/haiku,
  Weather on a day) set up together; loaded right after start-up, not
  with it (`main.ts` keeps the place and weather shown and hands them
  over: `showActions()`), start-up size budget
- `src/panel-menu.ts` — the ⋯ button in the panel header (☆ ⋯ ×) and its
  menu of the place's actions (Share this place, Start here): a
  disclosure of plain buttons; closes on Escape (not the panel), outside
  clicks, after an action and on another place; opens a collapsed sheet.
  "🎮 Games…" swaps its contents to the games (balloon, drift; "‹ Back"
  first), so the menu stays short enough for a phone's sheet; the excuse,
  small talk and haiku stay on the main level (decided 2026-11-28); tests
  reach the games through `placeAction`
- `src/status-line.ts` — a self-clearing message line (live region),
  shared by the ⋯ menu's actions
- `src/sheet.ts` — mobile bottom sheet (collapse/expand, swipe;
  `expand()` for the ⋯ menu)
- `src/render/` — builds the panel content, in order of how often people
  need it: `current.ts` (big temperature, "Rain starting around 14:45",
  "Updated 14:05" + at a glance: wind, rain, snow on the ground from 1 cm
  ("about 23 cm", the model's `snow_depth`), UV, AQI badge), `hourly.ts`
  (graph + hour strip with wind arrows), `daily.ts` (each day opens
  its own graph and hours), `air-quality.ts` (full section), then "Sky"
  (`sky.ts`, below), then "More details" (humidity, pressure, the
  atmospheric correction for surveying instruments, local time, warnings
  status, coordinates; also in `current.ts`)
- `src/render/fold.ts` — foldable sections: a section's heading is a
  button (▾/▸, `aria-expanded`) that hides the rest of the section with
  CSS (`.is-folded`), so later fills still work; kept on the device for
  every place (`nordic-weather:folded-sections`, only the user's changes).
  First visit: Next 24 hours, 7 days and Sea open; Air quality, Sky and
  More details folded, with a summary in the heading ("[19 Good]",
  "Sunset 15:42"). The weather now and warnings never fold
- `src/render/sky.ts` — the Sky section, loaded on demand (`panel.ts`
  inserts the heading, keeps the module once loaded): sunrise/sunset and
  day length, "Until/Since midwinter", golden hour (sun 6° to −4°) and
  blue hour (−4° to −6°) still ahead today, stargazing (≥ 2 h dark below
  −12° with ≤ 25 % cloud in the next 18 h), northern/southern lights now,
  the moon, fishing times (solunar periods, `src/weather/solunar.ts`:
  ~2 h around the moon's highest and lowest point ★, ~1 h at moonrise and
  moonset, the next four; near a full/new moon or falling pressure "said to
  be" good; worded as tradition; texts in `src/render/fishing-texts.ts`,
  out of the start-up language files), your shadow (1/tan of the sun's height). Rows only when they
  say something
- `src/weather/beer.ts` — "Beer outside" in More details (after
  Pressure), just for fun: how long a 0.5 l lager poured at 4 °C takes to
  reach 12 °C (or start to freeze at −2 °C) in the weather now (Newton's
  cooling, faster in wind, sun counts as warmer air); "Stays cold out
  here" in between. Filled by `render/sky.ts` (same on-demand module)
- `src/weather/edm.ts` — the atmospheric correction for surveying
  instruments' distance meters (EDM) in ppm, Leica's published formula
  (visible red laser; 0 ppm at 1013.25 hPa, 12 °C, 60 %) from the
  forecast's temperature, **ground-level** pressure (`surface_pressure`,
  not `pressure_msl`) and humidity. In More details after Pressure, with
  those inputs and a clear "⚠️ Estimate only, not a measurement" note
  (`estimateNote()` in `src/dom.ts`; every estimate gets one); the
  source and a disclaimer in About. Asked for by a surveyor
- `src/weather/ev.ts` — "Electric car range" in More details (before Beer
  outside, filled by `render/sky.ts`, only from +5 °C down): typical range
  loss by temperature bands from published tests (NAF El Prix, AAA,
  Geotab), "🔋 20–40 % less", with an estimate note; no setting
- `src/quiz/` — the temperature quiz (button under the search box, or a
  link to `#quiz`; loaded on demand): `game.ts` (the daily's 5 places from
  a random sequence seeded with the UTC date, so the same for everyone with
  no server; scoring: 100 − 10 per °C off (5.5 per °F), 🟩 ≤ 2 °C / 4 °F,
  🟨 ≤ 5 °C / 9 °F; `nordic-weather:quiz` keeps only today's result, the
  streak and the best), `quiz.ts` (the non-modal `#quiz` card: the daily
  asks for today's high, free play for the temperature now; the local
  time and the elevation as clues; the answer
  stays hidden: no panel, title, address or saved forecast until the
  guess, map taps ignored; share text "Weatherpin quiz #N · S/500" + boxes
  - a link to `#quiz`), `texts.ts` (its texts in all four languages, out
    of the start-up language files). main.ts passes the map and the place
    name lookup in (importing them would split start-up code)
- `src/balloon/` — "🎈 Launch a balloon" in the ⋯ menu (loaded on demand, its
  CSS too, `balloon.css`;
  main.ts passes the map and the place name lookup in): a balloon from the
  place shown rides the forecast winds at a height (low 850 hPa ≈ 1.5 km,
  middle 700 ≈ 3 km, high 500 ≈ 5.5 km) for up to 5 days, worked out at
  once (`flight.ts`: hour by hour; brought down by thunder below, heavy
  snow or rain, or torn by 60 m/s), then drawn on the map in ~15 s (at
  once with reduced motion; Pause/tap the balloon, Skip to the end) with
  the weather up there and below. `winds.ts`: one Open-Meteo request per
  point (`hourly=wind_speed_500hPa,…`, UTC), a new one ~350 km on (30 at
  most a flight), cached 10 min; the launch place's asks all three heights
  (their winds now on the launch card). The card is a `<dialog id="balloon"
class="quiz balloon">` (the quiz card's look and place). Result: distance
  (km, or miles with °F or mph), time in the air, top speed, how it ended,
  where it landed (Nominatim), best flight; "Share result" = text + a link
  `#balloon=1.6017,2494.2026111513.500.red.120.landed.<path>.<name>`
  (`link.ts`: launch place in centidegrees, UTC hour, height, colour,
  hours, ending, a point every 3 h as base64url centidegree steps, the
  optional name, 20 characters; distances always from that path; odd or
  impossible links ignored). Opening one replays it (no winds asked) with
  "Launch from … too". Saved: `nordic-weather:balloon` (name, colour, best
  km; in About's privacy text). Texts side by side in `texts.ts`
- `src/drift-button.ts` + `src/drift/` — "🚗 Drift here" (Beta) in the ⋯
  menu (`panel-actions.ts`; the game, its CSS `drift.css` and texts load on
  the first tap): a modal card (`#drift` in `index.html`) with a 20 s drift
  game on a 380×420 canvas track. The road comes from the weather now at the
  place shown (`surface.ts`, the forecast already loaded, no request):
  freezing rain → black ice; snowfall → snowy; ≤ 0 °C after rain or snow in
  the last 6 h (or freezing fog) → black ice; snow on the ground ≥ 1 cm →
  snowy; rain → wet (3 puddles); else dry; grip 0.20/0.10/0.06/0.032, shown
  as a % of dry. The wind pushes the car downwind (`windPush`, capped).
  `physics.ts` is pure (no page): fixed 60 steps a second (`stepsDue`, so
  120 Hz plays the same), top speed 3.5 (calmer than the spec's 5.5),
  drifting = speed > 1.3 and > 12° off the heading, combo x1–x5, 9 cones
  (−100), seeded cone places. `draw.ts` draws it with the app's colour
  variables. Steering: hold the left/right half, or the arrow keys (the
  track has the focus on opening). Pauses when the page is hidden, stops
  when closed. Best score per road type saved as `nordic-weather:drift`
  (in About's privacy text); "Share result" sends a text with the place's
  link (share sheet, else copied). Texts side by side in `texts.ts`
- `src/weather/solar.ts` — the sun's height for a place and moment (NOAA's
  simplified formulas), day length on a date, spans of sun heights
- `src/weather/aurora.ts` — NOAA SWPC's OVATION aurora nowcast (30–90 min
  ahead, 1° grid, ~150 KB): asked for only when |lat| ≥ 45°, the sun is
  below −6° and cloud cover now ≤ 50 %; looks up to 5° poleward ("low in
  the north"); shown from 10 %; 10-min cache
- `src/render/graph.ts` — hour graph (temperature line, precipitation
  bars) as plain SVG with classes, no chart library; one sentence for
  screen readers
- `src/weather/api.ts` — Open-Meteo request, response types, 10-min cache,
  the saved copy when offline
- `src/weather/now.ts` — the weather now at several places in one
  Open-Meteo request (comma-separated coordinates), 10-min cache; for the
  favourites list
- `src/weather/air-quality.ts` — air quality request, cache, AQI scales and
  bands, which scale applies where
- `src/weather/national-aqi.ts` — loaded only for places in the UK or Canada
  (`fetchAirQuality` works the series out once, `AirQuality.national`): the UK's DAQI (DEFRA's bands, each
  pollutant over its own period) and Canada's AQHI (3-hour averages,
  Stieb et al. 2008) per hour, from the pollutant forecast (`past_days=1`
  for the running averages)
- `src/weather/air-quality-days.ts` — air quality forecast as each day's
  worst hour (local dates; skips days the model barely covers)
- `src/weather/wear.ts` — "What to wear" under "Feels like" ("Jacket,
  umbrella (rain from about 15:00)"): clothes by the feels-like
  temperature, plus boots for snow, windproof, sunscreen (now and the next
  3 hours) and the umbrella answer: rain now ("until about 14:45") or soon
  (15-minute steps), "umbrella for later" (likely or heavy rain within 12
  hours), a hood when windy, "no umbrella needed today" after rain or with
  a 30 %+ chance; nothing on a dry day
- `src/roads/digitraffic.ts` + `state.ts` — Finland: Fintraffic's road
  weather (Digitraffic, CC BY 4.0, no key, CORS open; loaded only for places in Finland): the sections of the
  main roads and their forecasts (0–12 h), downloaded whole (no location
  sent), cached; the nearest section within 30 km gives "Poor road
  conditions: partly icy · Road weather: Fintraffic (Vt 1: …)" (the link
  opens Fintraffic's traffic map there, road conditions layer on) under
  What to wear; nothing when normal, no road near, or on a failure
- `src/weather/frost.ts` — frost hints under What to wear: "Scrape the
  windscreen tomorrow morning" (a clear, calm night at 1 °C or below, or
  −3 °C whatever the sky; from 15:00) and "Frost tonight (−2 °C): bring the
  balcony plants in" (spring and autumn by hemisphere; from noon)
- `src/weather/nowcast.ts` — rain/snow starting or stopping in the next
  3 hours, from the forecast's 15-minute steps (`minutely_15`)
- `src/weather/marine.ts` — sea weather request (nearest sea cell), cache,
  highest waves in the next 24 h; null where there's no sea
- `src/render/marine.ts` — the Sea section, after the 7 days
- `src/weather/pollen.ts` — pollen levels (low/moderate/high; trees vs
  grasses and herbs) and the pollen forecast per day (Europe, in season)
- `src/weather/uv.ts` — UV levels (WHO bands), today's UV peak and the
  sun protection window (hours with UV 3 or more)
- `src/weather/pressure.ts` — 3-hour pressure trend
- `src/weather/wmo.ts` — WMO weather code → description and emoji
- `src/weather/sun.ts` — sunrise/sunset text incl. polar night/midnight sun,
  day length and its change by tomorrow ("4 min shorter tomorrow")
- `src/weather/moon.ts` — the moon's phase from the date (no request;
  average lunar month, so up to a day off), emoji mirrored in the south
- `src/format.ts` — unit conversion, 12/24h times, dates, coordinates
- `src/dom.ts` — tiny helpers for creating elements safely
- `src/style.css` — all styles; side panel on desktop, bottom sheet below
  768px; light colours on `:root`, dark ones on `[data-theme='dark']`
- `public/_headers` — security headers incl. CSP and HSTS, a one-year cache
  for `/assets/*` (hashed file names). `img-src` allows only the
  OSM tile host, `tilecache.rainviewer.com` and `geo.weather.gc.ca`,
  `connect-src` only `api.open-meteo.com`, `archive-api.open-meteo.com`,
  `services.swpc.noaa.gov` (aurora),
  `geocoding-api.open-meteo.com`,
  `nominatim.openstreetmap.org`, `air-quality-api.open-meteo.com`,
  `marine-api.open-meteo.com`, `api.rainviewer.com`, `geo.weather.gc.ca`,
  and the warning services `api.weather.gc.ca`, `api.weather.gov`,
  `api.met.no` and `opendata-download-warnings.smhi.se`, Fintraffic's road
  weather `tie.digitraffic.fi`; `script-src` and
  `connect-src` also allow Cloudflare Web Analytics
  (`static.cloudflareinsights.com`, `cloudflareinsights.com`); nothing
  else external
- `playwright.config.ts` — browser tests: devices (phones, tablet, desktop,
  dark mode) in Chromium, plus an iPhone and an iPad in WebKit (Safari's
  engine); serves the build with `wrangler dev` over https (the CSP's
  upgrade-insecure-requests breaks http in WebKit). Five devices (iPhone
  SE, Pixel 7, iPad in WebKit, both dark ones) run only tests tagged
  `@layout`; in a quick run (most PRs) the iPhone and iPad in Chromium
  too. A full run (`FULL_TESTS=1`): PRs touching shared layout files,
  dependencies or the test setup, Mondays on `main`, the "Run workflow"
  button. In CI they run in 2 shards (3 when full), 2 workers each,
  inside Playwright's Docker image (keep its tag in `ci.yml` in step with
  `@playwright/test`); a report job merges them
- `tests/helpers.ts` — fake network (fixtures, no real API/tile calls;
  `goOffline()` cuts it), every panel section open at the start (option
  `sectionsOpen`; `false` keeps the app's folded defaults),
  clock started at a fixed test time, console-error check, overlap/off-screen helpers
- `tests/layout.spec.ts` — layout rules: no overlaps, map fills the screen
- `tests/flows.spec.ts` — search, My location, errors, polar night, day
  length and moon, gestures
- `tests/day-hours.spec.ts` — hour graphs, opening a day's hours in the 7
  days (one at a time, keyboard, kept on a unit switch)
- `tests/favourites.spec.ts` — saving, the favourites list (with the
  weather now, one request, cached), full list, blocked storage
- `tests/favourites-editor.spec.ts` — renaming (kept out of links),
  reordering, removing with Undo, keyboard, 20 favourites
- `tests/weather-layer.spec.ts` — the weather symbols layer: off at
  first, the cities in view apart in one request, tonight/tomorrow, a
  badge opens its weather, kept and turned off, no new request for an
  earlier view, hidden during the quiz, failure, °F, with the radar on
  (bars apart), Finnish (`tests/fixtures/weather-layer.ts`)
- `tests/radar-history.spec.ts` — the history bar: only with the radar
  on, ▶ loads older pictures one at a time (newest first, no burst) and
  plays, keyboard picking with time and credit, moving the map, off, ECCC
  every 12 min, layout, Finnish
- `tests/radar.spec.ts` — rain radar toggle, tiles and credit, zoom ≤ 7,
  Environment Canada over Toronto, switching and fallback, background
  pause, errors
- `tests/warnings.spec.ts` — warnings per service (Norway, Sweden, Canada,
  US), the Finland link, filtering, not covered, failure, kept on a unit
  switch
- `tests/performance.spec.ts` — responsiveness (Chromium): no long
  tasks over 300 ms, weather shown soon after a tap, quick day/unit switch
- `tests/accessibility.spec.ts` — axe-core scan (WCAG 2.2 A/AA) of the
  main screens on a phone and a desktop, light and dark
- `tests/analytics.spec.ts` — the CSP lets Cloudflare Web Analytics load
  and report
- `tests/about.spec.ts` — About dialog: opens, closes, fits, no personal
  details
- `tests/install.spec.ts` — Add to home screen: install dialog accepted
  or dismissed, the browser menu way, iPhone, Firefox, already installed,
  Finnish
- `tests/settings.spec.ts` — Settings: opens, fits, light/dark (follows
  the device, forced either way, kept, no flash), start place, clearing
  saved data, the link to About, blocked storage
- `tests/place-links.spec.ts` — the address follows the place, opening
  links, Back/Forward, odd links ignored, sharing (sheet, copy, fallback)
- `tests/start-place.spec.ts` — setting/removing the start place, opening
  there after a reload, blocked or damaged storage
- `tests/panel-menu.spec.ts` — the ⋯ menu: weather right under the
  header, position and sizes, keyboard and Escape, outside clicks,
  another place, a collapsed phone sheet
- `tests/offline.spec.ts` — saved weather without a connection ("No
  connection · weather from …", back online, another day, a new place,
  clearing)
- `tests/random-place.spec.ts` — Random place: offered, lands on land
  (repeatable random numbers), keyboard, with favourites
- `tests/postcard.spec.ts` — the postcard: size, download, share sheet,
  sunny/night/long name/Finnish, a past day's card (each picture attached
  to the report)
- `tests/past-weather.spec.ts` — Weather on a day: 1/10/50 years ago and
  any date (request, limits), °F, failure, closing, nothing saved, fits,
  Finnish
- `tests/beer.spec.ts` — Beer outside: stays cold, warm (sun, wind, calm,
  hours), freezing, °F, Finnish, its place in More details
- `tests/air-values.spec.ts` — SO₂, CO, dust (only when present), CO₂
  and methane in ppm under "Greenhouse gases", the estimate notes, no CO₂ →
  no block, Finnish
- `tests/sections.spec.ts` — folding sections: first-visit defaults and
  summaries, tap and keyboard, kept for every place and after reopening,
  "Clear saved data", tap size, blocked storage, Finnish
- `tests/excuse.spec.ts` — the weather excuse: the excuses that fit the
  test weather (each once per round), °F, polar night, share sheet and
  copy, closing, fits the panel, Finnish
- `tests/small-talk.spec.ts` — small talk: the lines that fit the test
  weather, tomorrow colder / the weekend / rain later, sharing, one card
  at a time, fits the panel, Finnish
- `tests/balloon.spec.ts` — the balloon: the launch card (winds now per
  height, name, colour), a flight (progress, weather up there and below,
  pause, skip, result, request count, saved name/colour/best), a
  thunderstorm, reduced motion, sharing and opening the link, broken
  links ignored, a new place closes it, fits, Finnish (winds made up in
  `tests/fixtures/balloon.ts`)
- `tests/drift.spec.ts` + `tests/drift-physics.spec.ts` — the drift game:
  opened from the ⋯ menu, the road from the weather (wet, black ice), no
  game code before the tap and no weather request, a full run with the
  arrow keys (score, best saved, share), taps, pause, closing stops it,
  fits, accessibility, Finnish; the rules without a page (steps on
  60/120 Hz, walls, drifting and combo, cones, seeds, wind, road types)
- `tests/haiku.spec.ts` — the weather haiku: three lines from the right
  groups (rain in Oslo, polar night and snow, a clear southern spring
  night, heat near the equator with no season), a round, sharing, one card
  at a time, fits the panel, Finnish
- `tests/quiz.spec.ts` — the quiz: from the button and `#quiz`, a full
  daily (scores and boxes, saved, shared, no second go), the answer
  hidden, free play, °F, the weather afterwards, closing, fits, Finnish
- `tests/ev.spec.ts` — electric car range: bands, the note, none when
  mild, °F, Finnish
- `tests/edm.spec.ts` — the atmospheric correction: value, inputs and
  warning, Leica's standard atmosphere = 0 ppm, a hot day, °F, no
  ground-level pressure → no row, About, Finnish
- `tests/sky.spec.ts` — the Sky section: rows in Oslo at the test time,
  cloudy night, midwinter in the south, polar night, northern lights
  (chance, low in the north, low chance, cloudy/far south asks nothing,
  failure, southern lights, Finnish)
- `tests/santa.spec.ts` — the Santa easter egg: names, report from the
  weather, Christmas Eve, fog, stays a secret, Finnish
- `tests/roads.spec.ts` — Fintraffic's road conditions in Finland (poor,
  very poor, normal, no road near, none asked elsewhere), Finnish
- `tests/frost.spec.ts` — frost hints: windscreen (clear/cloudy, calm/windy,
  hard frost, morning, midday), plants by season and hemisphere, Finnish
- `tests/records.spec.ts` — weather records: near and far, units, Finnish
- `tests/app-icon.spec.ts` — icons and manifest are linked and load; the
  search engine and link preview tags, robots.txt, sitemap.xml
- `tests/units.spec.ts` — °C/°F in Settings, defaults per browser language,
  units of one's own (knots, Beaufort and its band edges, km/h, mmHg, in),
  °C/°F moving only Automatic ones, the old stored format, Finnish
- `tests/swedish.spec.ts` — a browser in Swedish, nothing left in
  English, choosing the language in Settings
- `tests/norwegian.spec.ts` — a browser in Norwegian (and nynorsk → bokmål),
  nothing left in English, MET Norway asked in Norwegian, choosing the
  language in Settings
- `tests/finnish.spec.ts` — a browser in Finnish, nothing left in English
  on the main screens, choosing the language in Settings
- `tests/place-names.spec.ts` — a tapped point's name replaces the
  coordinates (title, page title, address, favourites), Finnish, searched
  places ask nobody, no name keeps the coordinates
- `tests/sauna.spec.ts` — the sauna easter egg: search, report, sea, °F,
  stays a secret, Finnish
- `tests/journey.spec.ts` — weather levels: first visit, a place, a
  searched country and the level-up toast, 5 areas a day, a badge, shares
  once a day, the card, resting and never down, the top level's badges,
  tap size, blocked storage, Finnish
- `tests/snow-depth.spec.ts` — snow on the ground: cm, none under 1 cm,
  inches, Finnish
- `tests/sea.spec.ts` — the Sea section at sea, none inland or on failure,
  units
- `tests/nowcast.spec.ts` — rain starting/stopping, snow, a few drops,
  the 3-hour window
- `tests/refresh.spec.ts` — "Updated 14:05", refresh of old weather in
  place, failed refresh, closed panel
- `tests/fixtures/fmi.ts` — the broker's answers for Finland (list and
  compact warnings: Helsinki now and tomorrow, Lapland, expired, cancelled);
  `tests/helpers.ts` answers `/api/fmi/…` with them
- `tests/fixtures/` — sample forecast, air quality (Europe, Toronto),
  geocoding results, radar frames, test tile
- `scripts/check-size.mjs` — size budget for the built JS and CSS
- `wrangler.jsonc` — Cloudflare Workers config: static assets from `dist/`
  (served by Cloudflare directly, free), and the Worker script
  `worker/index.ts` for `/api/*` only (`run_worker_first`). Free plan only:
  100,000 script calls a day, 10 ms CPU each; never a paid plan (no
  spending cap)
- `worker/` — the warnings broker (TypeScript run by Cloudflare; its unit
  tests by Node): `fmi.ts` answers `GET /api/fmi/warnings` (the ids of
  FMI's warnings in effect, from FMI's 10 KB RSS list, cached 2 min per
  Cloudflare location, last good list served marked `stale` when FMI
  fails; plus boxes of warnings already read) and `GET
/api/fmi/warning/<id>` (one CAP file made compact by `cap.ts`: en/fi/sv
  texts, level, times, outlines snapped to 0.005°, box; kept a week, files
  never change). One file per call keeps each under the free plan's 10 ms
  (FMI's biggest, 0.8 MB, takes ~7 ms). Only FMI's own CAP paths are
  accepted (`isCapId`); GET/HEAD only; no location is ever sent (the app
  matches points itself). Only the app's own pages may ask
  (`Sec-Fetch-Site: same-origin`, else a Referer from the site; others
  get 403). `types.ts` is shared with the app
- `.github/workflows/cleanup.yml` — deletes old CI test reports (keeps the
  newest 3) and finished raw shard results: once on landing, Mondays, and
  from Run workflow; the free plan has 0.5 GB of Actions storage, reports
  are kept 2 days anyway
- `.github/workflows/ci.yml` — checks on PRs; checks + deploy on `main`;
  changes to top-level `.md` files alone run only gitleaks. On `main` the
  browser tests are skipped when the merge is identical to a PR commit
  that already passed CI, so update a PR from `main` before merging if
  `main` has moved (saves Actions minutes; see README)

## Conventions

- Readable code over clever code. Prefer clear names and small functions.
- Short comments that explain _why_, not _what_.
- Units: always request metric from Open-Meteo (explicitly) and convert for
  display in `src/format.ts`, never in the request. The user's °C/°F choice
  sets the rest unless chosen in Settings (wind: m/s, km/h, mph, knots,
  Beaufort; rain and snow: mm, in; pressure: hPa, inHg, mmHg): Automatic
  is °C → mm, hPa, and wind in m/s (Nordics), mph (UK) or km/h
  (elsewhere); °F → mph, inches, inHg. Switching °C/°F moves only the
  Automatic ones. The default comes from the browser language (°F for US
  English). Stored as `units` version 2 (version 1, °C/°F only, still
  read). Thresholds in the code stay in metric.
- Clock and date style follow the browser language (`14:00` / `2 PM`,
  `Sun 15 Nov` / `Sun, Nov 15`). Tests run as en-GB.
- Languages: English, Finnish, Swedish and Norwegian bokmål (`nb`; a
  browser in `nb`, `no` or nynorsk `nn` gets it) — for a browser in that
  language, or chosen in Settings; a change reloads the page. Every text
  the app shows goes through `t()` (or `msg()` in tables) from
  `src/i18n.ts`, keyed by the English text, with its translations in
  `src/i18n-fi.ts`, `src/i18n-sv.ts` and `src/i18n-nb.ts`; page texts get `data-i18n` /
  `data-i18n-attrs` / `data-i18n-html` in `index.html`. A `context|`
  prefix separates words a language says differently (`pollen|Low` vs UV
  `Low`). `npm run check:i18n` fails on a text missing in any. Nothing
  may call `t()` while modules load (texts arrive after that; use `msg()`
  in tables). In Finnish, Swedish and Norwegian: decimal comma, 24-hour
  clock, their own dates (`fi-FI`, `sv-SE`, `nb-NO`); place names in the
  language (Norwegian asks GeoNames for `no`, Nominatim for `nb,no`).
  Swedish compass points use Ö and V ("från SV"), Norwegian Ø and V
  ("fra SV"). In Norwegian, MET Norway's warnings come in Norwegian
  (`lang=no`); FMI's (no Norwegian) in English. Weather words follow
  Yr (klarvær, lettskyet…); "Meteorologisk institutt" is MET Norway, so
  FMI is "Finlands meteorologiske institutt".
  Texts from services (warnings, API errors) and the Copernicus notice
  stay as given.
- No backend beyond the Worker broker in `worker/` (free plan only), no API
  keys in the app. Open-Meteo is free and keyless; don't add other servers.
- Times from Open-Meteo are in the location's timezone (`timezone=auto`), not
  the browser's. Don't run them through `new Date()` unadjusted.
- Longitudes sent to the API are normalised to -180..180.
- Map must work with mouse and touch; a double-click/tap zooms and must not
  also place a marker.
- Build DOM with `el()`/`textContent`, not `innerHTML` with API data.
- Use a `divIcon` (CSS) marker; Leaflet's default image marker breaks with
  Vite. No inline `style=""` in HTML strings (CSP `style-src 'self'`).
- Favourites, settings and the last forecasts stay on the device in
  `localStorage` (no cookies, no server). Anything new that's saved goes
  into About's privacy text. Every storage access can throw (private modes, blocked
  storage): go through `src/storage.ts`, which handles that.
- Visits are counted with Cloudflare Web Analytics in its automatic setup:
  Cloudflare adds its counter script to the live page (no cookies, no
  token in the code; settings in the Cloudflare dashboard under the
  domain). Not in `wrangler dev` or the tests. If it's ever turned off or
  replaced, update About's privacy text and the CSP.
- Ask for the user's location only when they press "My location", never on
  page load. On load the app opens at a place in the address (`#at=…`, a
  shared link or bookmark), else at the start place if the user chose one
  (an explicit choice, not the last place viewed), otherwise the world map.
  Places in the address are rounded to ~1 km and kept in the hash (never
  sent to the server). Geolocation needs https or localhost.
- In tests, "opening the app again" is `page.goto('/')`: a reload keeps
  the place's link in the address.
- Text sizes in `rem`, so they follow the base size (16 px; on iPhone/iPad
  the iOS text size setting). Readable data is at least 15 px, nothing in
  the panel under 13 px (checked in `tests/layout.spec.ts`).
- Accessible UI: labels, visible focus states, light/dark (the device's
  `prefers-color-scheme`, or the user's choice in Settings; use the
  colour variables, never a dark-only media query). New screens and states go into
  `tests/accessibility.spec.ts`; fix violations rather than excluding them.
- Browser tests never call real APIs or OSM tiles; add fixtures in
  `tests/helpers.ts` for any new external host. A console error (incl. a CSP
  violation) fails a test. New UI controls belong in the overlap checks in
  `tests/layout.spec.ts`.
- Tag a test `@layout` (`{ tag: '@layout' }`) when it checks sizes,
  positions, overlaps or colours, so it runs on every device; the rest
  run on three (five in a full run; see `playwright.config.ts`).
- In tests, wait for a condition (`expect(…)`, `waitForMapStill`,
  `waitUntilStill`), not a fixed time; fixed waits only to prove that
  something does _not_ happen.
- Keep ESLint and `tsc` clean. Code is formatted with Prettier.
