import L from 'leaflet';
import { t } from './i18n';

export interface PickedPoint {
  /** Latitude in degrees, -90..90. */
  lat: number;
  /** Longitude in degrees, normalised to -180..180. */
  lng: number;
  /** Place name, when the point came from a search, e.g. "Oslo, Norway". */
  name?: string;
}

/** Space (px) covered by the weather panel, which the marker should avoid. */
export interface CoveredArea {
  right: number;
  bottom: number;
}

export interface WorldMap {
  map: L.Map;
  /** Removes the marker, e.g. when the weather panel is closed. */
  clearMarker(): void;
  /** Pans the map, if needed, so the marker isn't hidden under the panel. */
  revealMarker(covered: CoveredArea): void;
  /**
   * After a flight (the quiz): puts the marker in the middle of the
   * uncovered area at `zoom`, with a short pan if it isn't there already.
   */
  /**
   * A small blue dot where the user is (after My location), apart from the
   * marker of the place shown. Kept until the page is closed; never saved.
   */
  showUserPosition(point: PickedPoint): void;
  /** Flies to a point (search result, user's location) and places the marker. */
  goTo(point: PickedPoint, covered: CoveredArea, zoom?: number): void;
  /**
   * Starts the map at a point (the start place), with no animation. Until
   * the user moves the map, size changes re-centre it there; `covered` is
   * asked again each time, as the panel's size may change too.
   */
  startAt(point: PickedPoint, covered: () => CoveredArea): void;
}

// A click is handled only after this delay, so a double-click/double-tap
// (which Leaflet uses for zoom) can cancel it instead of placing a marker.
const CLICK_DELAY_MS = 250;

// Inhabited latitudes; the full Mercator square would leave too much ocean
// and ice at the top and bottom of the initial view.
const WORLD_BOUNDS = L.latLngBounds([-60, -180], [78, 180]);

const TILE_SIZE = 256;
// Fractional zoom lets the world fill the screen snugly on any screen size.
const ZOOM_SNAP = 0.25;

// The map's top and bottom edges (Web Mercator stops at ±85.05°). Panning is
// limited to these vertically; ±720° longitude leaves the wrapping world free
// to scroll sideways.
const MERCATOR_MAX_LAT = 85.0511;
const PAN_BOUNDS = L.latLngBounds([-MERCATOR_MAX_LAT, -720], [MERCATOR_MAX_LAT, 720]);

// Respect the system setting: no zoom/pan animations if motion is reduced.
const ANIMATE = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Default zoom when jumping to a point: roughly city level.
const GO_TO_ZOOM = 10;

// Gap (px) kept between the marker and the panel or screen edges.
const REVEAL_MARGIN = 32;

// How many zoom steps revealMarker may add when panning alone can't move the
// marker clear of the panel.
const MAX_REVEAL_ZOOM_STEPS = 4;

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// Kept short so the bar fits on phones. The full Open-Meteo licence link
// (CC BY 4.0) is in the weather panel, next to the data.
const OPEN_METEO_ATTRIBUTION = 'Weather: <a href="https://open-meteo.com/">Open-Meteo.com</a>';
const GEONAMES_ATTRIBUTION = 'Places: <a href="https://www.geonames.org/">GeoNames</a>';

/** Wraps any longitude into -180..180 (the map repeats when panning). */
export function normaliseLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/**
 * Lowest zoom at which the world is at least as tall as the map. Zooming out
 * further would show empty grey bars above and below it. On a portrait phone
 * this makes the world wider than the screen, which is fine: it wraps
 * sideways.
 */
function fillHeightZoom(map: L.Map): number {
  const zoom = Math.log2(map.getSize().y / TILE_SIZE);
  return Math.max(0, Math.ceil(zoom / ZOOM_SNAP) * ZOOM_SNAP);
}

function addAttribution(map: L.Map) {
  // Bottom-right on every screen. On phones CSS lifts it above the bottom
  // sheet, so it is never covered (OSM requires it to stay visible).
  const control = L.control.attribution({ position: 'bottomright' }).addTo(map);
  // "About" first: all sources, licences and privacy (see src/about.ts).
  control.setPrefix(`<a href="#about">${t('About')}</a> | ${control.options.prefix}`);
  control.addAttribution(OPEN_METEO_ATTRIBUTION);
  control.addAttribution(GEONAMES_ATTRIBUTION);
}

export function createMap(container: HTMLElement, onPick: (point: PickedPoint) => void): WorldMap {
  const map = L.map(container, {
    zoomSnap: ZOOM_SNAP,
    worldCopyJump: true,
    maxBounds: PAN_BOUNDS,
    // Stops dragging past the top/bottom edge instead of springing back.
    maxBoundsViscosity: 1,
    zoomAnimation: ANIMATE,
    fadeAnimation: ANIMATE,
    markerZoomAnimation: ANIMATE,
    // Added separately below, so it can also credit Open-Meteo and move.
    attributionControl: false,
    // Added below with its titles in the app's language.
    zoomControl: false,
  });
  L.control.zoom({ zoomInTitle: t('Zoom in'), zoomOutTitle: t('Zoom out') }).addTo(map);

  // Whole world, filling the screen height. The minimum zoom is set first so
  // fitBounds can't zoom out past it (which would show grey bars).
  const showWholeWorld = () => {
    map.setMinZoom(fillHeightZoom(map));
    map.fitBounds(WORLD_BOUNDS, { animate: false });
  };
  // The starting view: the whole world, or the start place (see startAt).
  let showStartView = showWholeWorld;
  showStartView();

  // Until the user first touches the map or a place is shown (click, search,
  // My location), any size change re-applies the starting view. Afterwards it
  // only adjusts the minimum zoom, so the chosen view isn't pulled away: e.g.
  // when a phone's keyboard closes after a search.
  let userHasMovedMap = false;
  const markMoved = () => (userHasMovedMap = true);
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    container.addEventListener(type, markMoved, { once: true, passive: true });
  }

  // Leaflet re-measures itself only when the window resizes. But the map's
  // container can also change size on its own, e.g. on a first, uncached
  // visit when the stylesheet arrives after the map was created, or while
  // iPhone Safari settles its screen height (issue #18). Watch the container
  // itself and keep Leaflet in step with its real size.
  new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(container);

  // Fires for window resizes, rotation and container size changes alike.
  // setMinZoom also zooms in if the current view is now too far out.
  map.on('resize', () => {
    if (userHasMovedMap) {
      map.setMinZoom(fillHeightZoom(map));
    } else {
      showStartView();
    }
  });

  // OSM tile usage policy: standard URL, visible attribution, max zoom 19,
  // no bulk downloading or prefetching.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: OSM_ATTRIBUTION,
  }).addTo(map);

  addAttribution(map);

  // A pure-CSS marker: Leaflet's default image marker breaks with Vite.
  const markerIcon = L.divIcon({
    className: 'pick-marker',
    html: '<span class="pick-marker__dot"></span>',
    iconSize: [24, 24],
    // The dot is a 24px square rotated 45°, so its tip sits 12·√2 ≈ 17px
    // below the centre.
    iconAnchor: [12, 29],
  });

  let marker: L.Marker | undefined;
  let pendingClick: number | undefined;

  // "You are here": a CSS dot like the marker, beneath it when both are on
  // the same spot.
  const userIcon = L.divIcon({
    className: 'user-position',
    html: '<span class="user-position__dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
  let userMarker: L.Marker | undefined;

  function showUserPosition(point: PickedPoint) {
    const latlng = L.latLng(point.lat, point.lng);
    if (userMarker) {
      userMarker.setLatLng(latlng);
    } else {
      userMarker = L.marker(latlng, {
        icon: userIcon,
        keyboard: false,
        interactive: false,
        zIndexOffset: -1000,
      }).addTo(map);
    }
  }

  const cancelPendingClick = () => {
    window.clearTimeout(pendingClick);
    pendingClick = undefined;
  };

  function placeMarker(latlng: L.LatLngExpression) {
    userHasMovedMap = true;
    showMarker(latlng);
  }

  function showMarker(latlng: L.LatLngExpression) {
    if (marker) {
      marker.setLatLng(latlng);
    } else {
      marker = L.marker(latlng, { icon: markerIcon, keyboard: false, interactive: false });
      marker.addTo(map);
    }
  }

  function pick(latlng: L.LatLng) {
    // Keep the marker where the user tapped (it may be on a wrapped copy of
    // the world); only the reported coordinates are normalised.
    placeMarker(latlng);
    onPick({ lat: latlng.lat, lng: normaliseLongitude(latlng.lng) });
  }

  map.on('click', (event: L.LeafletMouseEvent) => {
    cancelPendingClick();
    pendingClick = window.setTimeout(() => {
      pendingClick = undefined;
      pick(event.latlng);
    }, CLICK_DELAY_MS);
  });

  map.on('dblclick zoomstart dragstart', cancelPendingClick);

  // Keyboard users pan with the arrow keys; Enter picks the map's centre.
  container.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target === container) {
      event.preventDefault();
      pick(map.getCenter());
    }
  });

  function clearMarker() {
    marker?.remove();
    marker = undefined;
  }

  /** Map centre that puts `latlng` in the middle of the uncovered area. */
  function centreFor(latlng: L.LatLng, zoom: number, covered: CoveredArea): L.LatLng {
    const target = map.project(latlng, zoom).add([covered.right / 2, covered.bottom / 2]);
    return map.unproject(target, zoom);
  }

  /**
   * Whether, at `zoom`, the map can pan far enough to show the marker above a
   * bottom sheet. Panning stops at the map's top and bottom edges, and at the
   * lowest zoom the world is barely taller than the screen, so there may be
   * no room. (Sideways the world repeats, so there's always room.)
   */
  function markerFitsAt(latlng: L.LatLng, zoom: number, covered: CoveredArea): boolean {
    const height = map.getSize().y;
    const half = height / 2;
    // Highest and lowest centre the map's edges allow.
    const minCentreY = map.project([MERCATOR_MAX_LAT, 0], zoom).y + half;
    const maxCentreY = map.project([-MERCATOR_MAX_LAT, 0], zoom).y - half;

    const markerY = map.project(latlng, zoom).y;
    const wantedCentreY = markerY + covered.bottom / 2;
    const centreY = Math.min(Math.max(wantedCentreY, minCentreY), maxCentreY);
    const markerScreenY = markerY - centreY + half;
    return (
      markerScreenY >= REVEAL_MARGIN && markerScreenY <= height - covered.bottom - REVEAL_MARGIN
    );
  }

  function revealMarker(covered: CoveredArea) {
    if (!marker) return;
    const latlng = marker.getLatLng();
    const currentZoom = map.getZoom();

    // Zoom in only as far as needed for the marker to fit above the sheet.
    let zoom = currentZoom;
    while (!markerFitsAt(latlng, zoom, covered) && zoom < currentZoom + MAX_REVEAL_ZOOM_STEPS) {
      zoom += 1;
    }

    if (zoom === currentZoom) {
      // Smallest pan that brings the marker into view (often none at all).
      map.panInside(latlng, {
        animate: ANIMATE,
        paddingTopLeft: [REVEAL_MARGIN, REVEAL_MARGIN],
        paddingBottomRight: [covered.right + REVEAL_MARGIN, covered.bottom + REVEAL_MARGIN],
      });
    } else {
      map.setView(centreFor(latlng, zoom, covered), zoom, { animate: ANIMATE });
    }
  }

  function goTo(point: PickedPoint, covered: CoveredArea, targetZoom = GO_TO_ZOOM) {
    // Cancel a click still waiting for its double-click check.
    cancelPendingClick();

    // The world repeats sideways: use the copy of the point nearest the
    // current view, so the map doesn't fly the long way round.
    const centreLng = map.getCenter().lng;
    const lng = point.lng + 360 * Math.round((centreLng - point.lng) / 360);
    const latlng = L.latLng(point.lat, lng);
    placeMarker(latlng);

    // Land the point in the middle of the part of the map the panel doesn't
    // cover. Never zoom out if the user is already closer in.
    const zoom = Math.max(map.getZoom(), targetZoom);
    map.flyTo(centreFor(latlng, zoom, covered), zoom, { animate: ANIMATE });
  }

  function startAt(point: PickedPoint, covered: () => CoveredArea) {
    const latlng = L.latLng(point.lat, point.lng);
    // Not placeMarker: the map hasn't been moved by the user yet, so a late
    // size change (e.g. issue #18) should still re-centre on the place.
    showMarker(latlng);
    showStartView = () => {
      map.setMinZoom(fillHeightZoom(map));
      map.setView(centreFor(latlng, GO_TO_ZOOM, covered()), GO_TO_ZOOM, { animate: false });
    };
    showStartView();
  }

  return { map, clearMarker, revealMarker, showUserPosition, goTo, startAt };
}
