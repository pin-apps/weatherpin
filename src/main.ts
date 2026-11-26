import 'leaflet/dist/leaflet.css';
import './style.css';
import { setUpAbout } from './about';
// Keeps the browser's "can be installed" event for Settings (loaded later).
import './install-prompt';
import { loadTranslations, t, translatePage } from './i18n';
import { setUpFavouriteButton } from './favourites/button';
import type { FavouritesEditor } from './favourites/editor';
import { setUpLocateButton } from './locate';
import { createMap, normaliseLongitude, type CoveredArea, type PickedPoint } from './map';
import { createPanel } from './panel';
import { setUpPanelMenu } from './panel-menu';
import { placeFromHash, placeHash } from './place-link';
import { placeLabel, zoomForPlace } from './places/geocoding';
import { countryCodeAt, placeNameAt } from './places/reverse';
import { noteJourney, setUpLevelChip } from './journey/chip';
import { samePlace } from './places/same-place';
import { SAUNA_ZOOM, saunaPoint } from './sauna';
import { SANTA_ZOOM, santaPoint } from './santa';
import { setUpSearch } from './search';
import { setUpPastWeatherButton } from './past-weather-button';
import { setUpPostcardButton } from './postcard-button';
import { setUpQuipButtons } from './quip-buttons';
import { setUpShareButton } from './share-button';
import { setUpSheet } from './sheet';
import { loadStartPlace } from './start-place';
import { setUpStartPlaceButton } from './start-place-button';
import { fetchAirQuality } from './weather/air-quality';
import { fetchWarnings, inFinland } from './warnings/warnings';
import { fetchForecast, WeatherError, type Forecast } from './weather/api';
import { fetchMarine } from './weather/marine';
import { formatCoordinates } from './format';

// Finnish or Swedish texts are a small download of their own; nothing is
// shown or set up before they're here (only the imports above have run,
// and they translate nothing yet).
await loadTranslations();
// The page's own texts in the user's language, before anything reads them
// (e.g. the location button keeps its label to restore it).
translatePage();

const mapElement = document.querySelector<HTMLElement>('#map')!;
const panelElement = document.querySelector<HTMLElement>('#panel')!;

let currentPoint: PickedPoint | undefined;
// When the weather now in the panel was fetched (see refreshIfOld).
let shownAt: number | undefined;
// Shown from this device's copy, without a connection (weather/saved.ts).
let shownOffline = false;
// Aborts the previous request, so a slow old response can't overwrite a new one.
let inFlight: AbortController | undefined;

const favouriteButton = setUpFavouriteButton(
  document.querySelector<HTMLButtonElement>('.panel__favourite')!,
  document.querySelector<HTMLElement>('.panel__message')!,
);

setUpAbout(document.querySelector<HTMLDialogElement>('#about')!);

// The Settings dialog's code loads on the first press of ⚙ (start-up size
// budget); presses while it loads just open it once it's there.
let openSettings: Promise<() => void> | undefined;
document.querySelector<HTMLButtonElement>('#settings-button')!.addEventListener('click', () => {
  openSettings ??= import('./settings').then(({ setUpSettings }) =>
    setUpSettings(document.querySelector<HTMLDialogElement>('#settings')!),
  );
  openSettings.then(
    (open) => open(),
    // The code didn't load (offline, or a new version deployed): try again
    // on the next press.
    () => (openSettings = undefined),
  );
});

// Weather levels (journey/): the chip, a point for each day of use, and
// shares, the daily quiz and northern lights (announced by those parts with
// window events, so they needn't import the levels' code).
setUpLevelChip(document.querySelector<HTMLButtonElement>('#level-button')!, () =>
  shownWeather && shownWeather.point === currentPoint ? shownWeather : undefined,
);
noteJourney({ kind: 'day' });
window.addEventListener('weatherpin:shared', () => noteJourney({ kind: 'share' }));
window.addEventListener('weatherpin:aurora', () => noteJourney({ kind: 'aurora' }));
window.addEventListener('weatherpin:quiz', (event) =>
  noteJourney({ kind: 'quiz', day: String((event as CustomEvent<string>).detail) }),
);

// The ⋯ menu's actions share one status line under the panel's header.
const actionStatus = document.querySelector<HTMLElement>('.panel__action-status')!;
const startPlaceButton = setUpStartPlaceButton(
  document.querySelector<HTMLButtonElement>('.panel__start')!,
  document.querySelector<HTMLElement>('.panel__start-mark')!,
  actionStatus,
);

const shareButton = setUpShareButton(
  document.querySelector<HTMLButtonElement>('.panel__share')!,
  actionStatus,
);

const postcardButton = setUpPostcardButton(
  document.querySelector<HTMLButtonElement>('.panel__postcard')!,
  actionStatus,
);

const quipButtons = setUpQuipButtons(
  document.querySelector<HTMLButtonElement>('.panel__excuse')!,
  document.querySelector<HTMLButtonElement>('.panel__small-talk')!,
  actionStatus,
);

const pastWeatherButton = setUpPastWeatherButton(
  document.querySelector<HTMLButtonElement>('.panel__past')!,
  actionStatus,
);

// The page's own title for the plain map ("Weatherpin – weather anywhere
// on the world map", translated); a place's title is "Oslo · Weatherpin".
const APP_TITLE = document.title;
const APP_NAME = 'Weatherpin';

const panel = createPanel(panelElement, {
  onClose: () => {
    closePanel();
    // The address goes back to the plain map (no new Back step).
    if (placeFromHash(window.location.hash)) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    mapElement.focus();
  },
  onRetry: () => {
    if (currentPoint) void loadWeather(currentPoint, 'none');
  },
});

const sheet = setUpSheet(panelElement);

const panelMenu = setUpPanelMenu(
  document.querySelector<HTMLButtonElement>('.panel__more')!,
  document.querySelector<HTMLElement>('#panel-menu')!,
  { onOpen: () => sheet.expand() },
);

const worldMap = createMap(mapElement, (point) => {
  // During the quiz a tap could give an answer away.
  if (quizOpen) return;
  void loadWeather(point);
  worldMap.revealMarker(panelCoveredArea());
});

// The rain radar's code loads right after start-up, not with it (the radar
// is off by default; this keeps the start-up code in its size budget). A
// press of the button in that moment is kept and handled once it's ready.
const radarButton = document.querySelector<HTMLButtonElement>('#radar-button')!;
let radarPressedEarly = false;
const pressedEarly = () => (radarPressedEarly = !radarPressedEarly);
radarButton.addEventListener('click', pressedEarly);
void import('./radar/radar').then(
  ({ setUpRainRadar }) => {
    radarButton.removeEventListener('click', pressedEarly);
    setUpRainRadar(
      worldMap.map,
      radarButton,
      // Shares the message line under the search box with "My location".
      document.querySelector<HTMLElement>('#locate-message')!,
      {
        root: document.querySelector<HTMLElement>('.radar-bar')!,
        play: document.querySelector<HTMLButtonElement>('.radar-bar__play')!,
        slider: document.querySelector<HTMLInputElement>('.radar-bar__slider')!,
        time: document.querySelector<HTMLElement>('.radar-bar__time')!,
      },
    );
    if (radarPressedEarly) radarButton.click();
  },
  () => undefined,
);

setUpLocateButton(
  document.querySelector<HTMLButtonElement>('#locate-button')!,
  document.querySelector<HTMLElement>('#locate-message')!,
  (position) => {
    const point = { lat: position.lat, lng: normaliseLongitude(position.lng) };
    // A dot that stays there while other places are looked at.
    worldMap.showUserPosition(point);
    // Open the panel first, so the map knows how much space it takes.
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea());
  },
);

const searchInput = document.querySelector<HTMLInputElement>('#search-input')!;
// The Edit favourites dialog's code loads the first time it's opened: few
// visits need it, and it keeps the start-up code in its size budget.
let favouritesEditor: Promise<FavouritesEditor> | undefined;
function openFavouritesEditor() {
  favouritesEditor ??= import('./favourites/editor').then(({ setUpFavouritesEditor }) =>
    setUpFavouritesEditor(document.querySelector<HTMLDialogElement>('#favourites-editor')!, () => {
      // Back to the search box, which shows the list in its new order. Not
      // on phones: that would bring the keyboard up.
      if (!window.matchMedia('(pointer: coarse)').matches) searchInput.focus();
    }),
  );
  favouritesEditor.then(
    (editor) => editor.open(),
    // The code didn't load (offline, or a new version deployed): try again
    // on the next press.
    () => (favouritesEditor = undefined),
  );
}

setUpSearch(document.querySelector<HTMLElement>('#search')!, {
  onSelectPlace: (place) => {
    const point = {
      lat: place.latitude,
      lng: normaliseLongitude(place.longitude),
      name: placeLabel(place),
    };
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea(), zoomForPlace(place));
    if (place.country_code)
      noteJourney({ kind: 'country', code: place.country_code.toUpperCase() });
  },
  onSelectFavourite: (favourite) => {
    const point = { lat: favourite.lat, lng: favourite.lng, name: favourite.name };
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea());
  },
  onEditFavourites: openFavouritesEditor,
  onSelectSauna: () => {
    const point = saunaPoint();
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea(), SAUNA_ZOOM);
  },
  onSelectSanta: () => {
    const point = santaPoint();
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea(), SANTA_ZOOM);
  },
  onQuiz: () => openQuiz(),
  onRandomPlace: async () => {
    // The land map is fetched only now, the first time (a few KB). If it
    // can't load (offline), the button just does nothing this time.
    const module = await import('./places/random-place').catch(() => undefined);
    if (!module) return;
    const point = module.randomLandPoint();
    // Its name follows from Nominatim, as for a tapped point.
    void loadWeather(point);
    worldMap.goTo(point, panelCoveredArea(), RANDOM_PLACE_ZOOM);
  },
});

// Far enough out to see where in the world a random place is.
const RANDOM_PLACE_ZOOM = 6;

// The temperature quiz (quiz/, loaded on demand): from its button or a
// link to #quiz (what a shared result points to).
let quizOpen = false;
// The place shown and its weather (for the level picture, journey/).
let shownWeather: { point: PickedPoint; forecast: Forecast } | undefined;
function openQuiz() {
  closePanel();
  quizOpen = true;
  void import('./quiz/quiz').then(
    ({ openQuiz: open }) =>
      open({
        dialog: document.querySelector<HTMLDialogElement>('#quiz')!,
        // Like a place picked anywhere else in the app: one flight, nothing after.
        goTo: (point, covered) => worldMap.goTo(point, covered, RANDOM_PLACE_ZOOM),
        showWeather: (point) => {
          void loadWeather(point);
          worldMap.goTo(point, panelCoveredArea(), RANDOM_PLACE_ZOOM);
        },
        placeName: (lat, lng) => placeNameAt(lat, lng),
        onClose: () => {
          quizOpen = false;
          if (window.location.hash === '#quiz') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          if (!currentPoint) worldMap.clearMarker();
        },
      }),
    () => (quizOpen = false),
  );
}
if (window.location.hash === '#quiz') openQuiz();

/** How much of the map the panel hides: a bottom sheet, or a side panel. */
function panelCoveredArea(): CoveredArea {
  const rect = panelElement.getBoundingClientRect();
  const isBottomSheet = rect.bottom >= window.innerHeight - 1 && rect.left <= 1;
  return isBottomSheet
    ? { right: 0, bottom: rect.height }
    : { right: window.innerWidth - rect.left, bottom: 0 };
}

function closePanel() {
  inFlight?.abort();
  currentPoint = undefined;
  shownAt = undefined;
  panelMenu.close();
  panel.hide();
  favouriteButton.hide();
  startPlaceButton.hide();
  shareButton.hide();
  postcardButton.hide();
  quipButtons.hide();
  pastWeatherButton.hide();
  worldMap.clearMarker();
  document.title = APP_TITLE;
}

/**
 * How a new place changes the address: a new Back step ('push', for places
 * the user picks), the same step ('replace', on page load), or none (it
 * came from the address).
 */
type AddressChange = 'push' | 'replace' | 'none';

function updateAddress(point: PickedPoint, change: AddressChange) {
  const hash = placeHash(point);
  if (change === 'none' || window.location.hash === hash) return;
  if (change === 'push') history.pushState(null, '', hash);
  else history.replaceState(null, '', hash);
}

/**
 * Loads and shows the weather at `point`. A refresh (`quiet`) is newer
 * weather for the place already shown: no loading state, and if it fails
 * the older weather stays (its "Updated" time says how old it is).
 */
async function loadWeather(
  point: PickedPoint,
  address: AddressChange = 'push',
  { quiet = false } = {},
) {
  // A place's weather asked for (search, favourites, My location, a link…)
  // ends the quiz: no weather panel under it (issue #137).
  if (quizOpen) {
    quizOpen = false;
    document.querySelector<HTMLDialogElement>('#quiz')!.close();
  }
  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;
  currentPoint = point;
  updateAddress(point, address);
  // Bookmarks and the history list name the place.
  document.title = `${point.name ?? formatCoordinates(point.lat, point.lng)} · ${APP_NAME}`;

  // A tapped point (or My location) gets its place name a moment later.
  if (!point.name && !quiet) void showPlaceName(point, controller.signal);

  if (!quiet) {
    panelMenu.close();
    panel.showLoading(point);
    favouriteButton.showFor(point);
    startPlaceButton.showFor(point);
    shareButton.showFor(point);
    // Back once there's weather to draw.
    postcardButton.hide();
    quipButtons.hide();
    pastWeatherButton.hide();
  }

  // Both requests start at once; air quality must not slow down the weather.
  const forecastRequest = fetchForecast(point.lat, point.lng, controller.signal);
  const airQualityRequest = fetchAirQuality(point.lat, point.lng, controller.signal);
  // Sea weather too; most places have none (inland), which is no error.
  const marineRequest = fetchMarine(point.lat, point.lng, controller.signal);
  // Handled below; this stops an "unhandled rejection" if the forecast fails first.
  airQualityRequest.catch(() => {});
  marineRequest.catch(() => {});

  let forecast;
  try {
    forecast = await forecastRequest;
    if (quiet) panel.refreshForecast(point, forecast);
    else panel.showForecast(point, forecast);
    shownAt = forecast.fetchedAt;
    postcardButton.showFor(point, forecast);
    shownWeather = { point, forecast };
    quipButtons.showFor(point, forecast);
    pastWeatherButton.showFor(point, forecast);
    shownOffline = forecast.offline === true;
    // A place looked at counts towards the level (not a quiet refresh).
    if (!quiet) {
      noteJourney({
        kind: 'place',
        lat: point.lat,
        lng: point.lng,
        timezone: forecast.timezone,
        temperature: forecast.current.temperature_2m,
        weatherCode: forecast.current.weather_code,
        daylightSeconds: forecast.daily.daylight_duration[0] ?? null,
        elevation: forecast.elevation,
      });
    }
  } catch (error) {
    if (controller.signal.aborted || quiet) return;
    const message =
      error instanceof WeatherError
        ? error.message
        : t('Something went wrong loading the weather.');
    panel.showError(point, message);
    return;
  }

  // A failed sea request just leaves the section out (a refresh keeps it).
  marineRequest.then(
    (marine) => {
      if (!controller.signal.aborted) panel.showMarine(marine);
    },
    () => {
      if (!controller.signal.aborted && !quiet) panel.showMarine(null);
    },
  );

  // Warnings need the place's time zone (from the forecast) to pick the
  // service. Like air quality, they're extra: a failure is shown, not fatal.
  void fetchWarnings(point.lat, point.lng, forecast.timezone, controller.signal).then(
    (warnings) => {
      if (!controller.signal.aborted) panel.showWarnings(warnings ?? 'not-covered');
    },
    () => {
      if (!controller.signal.aborted && !quiet) panel.showWarnings('failed');
    },
  );

  // Finland: Fintraffic's road conditions on the nearest main road. Extra
  // too: a failure just leaves the line out. Its code loads only for places
  // in Finland.
  if (inFinland(forecast.timezone)) {
    import('./roads/digitraffic')
      .then(({ fetchRoadConditions }) => fetchRoadConditions(point.lat, point.lng))
      .then(
        (roads) => {
          if (!controller.signal.aborted) panel.showRoads(roads);
        },
        () => {
          if (!controller.signal.aborted && !quiet) panel.showRoads('failed');
        },
      );
  }

  // Air quality is extra: if only it fails, the weather stays and the
  // section just says it's unavailable (a refresh keeps the older values).
  try {
    const airQuality = await airQualityRequest;
    if (!controller.signal.aborted) panel.showAirQuality(airQuality);
  } catch {
    if (!controller.signal.aborted && !quiet) panel.showAirQualityUnavailable();
  }
}

/**
 * Looks up the name of a point that has none ("Espoo, Finland") and shows
 * it: panel title, page title, address. The weather never waits for it,
 * and without a name (at sea, or a failure) the coordinates stay.
 */
async function showPlaceName(point: PickedPoint, signal: AbortSignal) {
  const name = await placeNameAt(point.lat, point.lng, signal);
  const country = countryCodeAt(point.lat, point.lng);
  if (country && !signal.aborted) noteJourney({ kind: 'country', code: country });
  if (!name || signal.aborted || currentPoint !== point) return;
  // The same point object: the favourite, share and start place buttons
  // read its name when pressed.
  point.name = name;
  updateAddress(point, 'replace');
  document.title = `${name} · ${APP_NAME}`;
  panel.showName(point);
}

// Weather left open goes stale: a phone brings the app back from the
// background hours later with the morning's forecast. Refresh it when the
// page is shown again, or while it stays open, once it's this old.
const REFRESH_AFTER_MS = 15 * 60 * 1000;
const REFRESH_CHECK_MS = 60 * 1000;
function refreshIfOld() {
  if (!currentPoint || shownAt === undefined || document.hidden) return;
  if (Date.now() - shownAt < REFRESH_AFTER_MS) return;
  // Only one try per age: a failed refresh waits for the next interval.
  shownAt = Date.now() - REFRESH_AFTER_MS + REFRESH_CHECK_MS * 5;
  void loadWeather(currentPoint, 'none', { quiet: true });
}

document.addEventListener('visibilitychange', refreshIfOld);
window.setInterval(refreshIfOld, REFRESH_CHECK_MS);
// Back online after showing saved weather: get the newest at once.
window.addEventListener('online', () => {
  if (currentPoint && shownOffline) void loadWeather(currentPoint, 'none', { quiet: true });
});

// Back and Forward between places, or an address edited by hand.
window.addEventListener('hashchange', () => {
  const linked = placeFromHash(window.location.hash);
  if (linked) {
    if (currentPoint && samePlace(linked, currentPoint)) return;
    void loadWeather(linked, 'none');
    worldMap.goTo(linked, panelCoveredArea());
  } else if (window.location.hash === '#quiz') {
    openQuiz();
  } else if (window.location.hash === '' && currentPoint) {
    // Back to the plain map. (Other hashes, like #about, leave it alone.)
    closePanel();
  }
});

// Open at a place in the address (a shared link or a bookmark); otherwise
// at the user's start place, if they chose one; otherwise the map shows the
// whole world. Never the user's location: that is only asked for when they
// press "My location".
const linkedPlace = placeFromHash(window.location.hash);
// Not under the quiz (a link to #quiz): its places need the map to themselves.
const startPlace = linkedPlace ?? (quizOpen ? undefined : loadStartPlace());
if (startPlace) {
  // Panel first, so the map knows how much of the screen it covers.
  void loadWeather(startPlace, linkedPlace ? 'none' : 'replace');
  worldMap.startAt(startPlace, panelCoveredArea);
}
