import { el } from './dom';
import { findFavourite, onFavouritesChange } from './favourites/store';
import { formatCoordinates, formatLocalNow, formatTemperature } from './format';
import type { PickedPoint } from './map';
import {
  fillAirQuality,
  fillAirQualityGlance,
  renderAirQualitySection,
  showAirQualityMessage,
} from './render/air-quality';
import {
  renderCurrent,
  renderMoreDetails,
  renderSkySection,
  roadConditionsLine,
} from './render/current';
import { renderDaily } from './render/daily';
import { renderHourly } from './render/hourly';
import { renderMarine } from './render/marine';
import { isSaunaPoint } from './sauna';
import { isSantaPoint } from './santa';
import type { AirQuality } from './weather/air-quality';
import { renderWarnings, roadCredit, warningsStatus, type WarningsState } from './render/warnings';
import type { RoadState } from './roads/state';
import { onUnitsChange } from './units';
import type { Forecast } from './weather/api';
import type { Marine } from './weather/marine';
import { describeWeather } from './weather/wmo';
import { t } from './i18n';

export interface Panel {
  showLoading(point: PickedPoint): void;
  showError(point: PickedPoint, message: string): void;
  showForecast(point: PickedPoint, forecast: Forecast): void;
  /**
   * Newer weather for the place already shown, without a loading state:
   * same scroll position and open day, and the air quality and warnings
   * already shown stay until their own refresh replaces them.
   */
  refreshForecast(point: PickedPoint, forecast: Forecast): void;
  /** Fills the air quality section shown by showForecast. */
  showAirQuality(airQuality: AirQuality): void;
  showAirQualityUnavailable(): void;
  /** Shows warnings at the top and their status in More details. */
  showWarnings(state: WarningsState): void;
  /** Fintraffic's road conditions (Finland): a line when they're poor. */
  showRoads(state: RoadState): void;
  /** Adds the Sea section after the 7 days (null: no sea here). */
  showMarine(marine: Marine | null): void;
  /** The point shown has just got its place name (see places/reverse.ts). */
  showName(point: PickedPoint): void;
  hide(): void;
}

interface PanelHandlers {
  onClose(): void;
  onRetry(): void;
}

// Local time only shows minutes, so refreshing twice a minute is plenty.
const CLOCK_REFRESH_MS = 30 * 1000;

/** An easter egg found: a secret badge for the weather levels (main.ts). */
function secretFound(id: string) {
  window.dispatchEvent(new CustomEvent('weatherpin:secret', { detail: id }));
}

export function createPanel(root: HTMLElement, handlers: PanelHandlers): Panel {
  const title = root.querySelector<HTMLElement>('#panel-title')!;
  const body = root.querySelector<HTMLElement>('.panel__body')!;
  const closeButton = root.querySelector<HTMLButtonElement>('.panel__close')!;
  // One-line summary in the header; the only content a collapsed sheet shows.
  const summary = root.querySelector<HTMLElement>('.panel__summary')!;

  let clockTimer: number | undefined;
  // What the panel shows, so it can be drawn again in other units.
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  let airQualityShown: AirQuality | 'unavailable' | undefined;
  let warningsShown: WarningsState | undefined;
  let marineShown: Marine | null | undefined;
  let roadsShown: RoadState | undefined;
  // The 7-day row opened to show its hours, kept when the units change.
  let openDay: string | undefined;
  // The collapsed sheet's line without a warning in front of it.
  let plainSummary = '';
  // The place in the panel (also while loading or after an error).
  let current: PickedPoint | undefined;

  const stopClock = () => window.clearInterval(clockTimer);

  closeButton.addEventListener('click', handlers.onClose);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handlers.onClose();
  });

  function open(point: PickedPoint) {
    stopClock();
    // A new place starts with every day closed; a redraw keeps the open one.
    if (point !== shown?.point) openDay = undefined;
    shown = undefined;
    airQualityShown = undefined;
    warningsShown = undefined;
    roadsShown = undefined;
    marineShown = undefined;
    root.hidden = false;
    current = point;
    showTitle();
  }

  // A searched place shows its name, a favourite the user renamed their
  // name for it; the coordinates go in the body. The user's name stays in
  // the panel: links, shares and the page title use the place's own name.
  function showTitle() {
    if (!current) return;
    const { lat, lng, name } = current;
    title.textContent = findFavourite(current)?.label ?? name ?? formatCoordinates(lat, lng);
  }
  // Renamed in the favourites editor (or another tab) while it's shown.
  onFavouritesChange(showTitle);

  function showLoading(point: PickedPoint) {
    open(point);
    body.setAttribute('aria-busy', 'true');
    summary.textContent = t('Loading…');
    body.replaceChildren(el('p', 'panel__status', t('Loading weather…')));
  }

  function showError(point: PickedPoint, message: string) {
    open(point);
    body.setAttribute('aria-busy', 'false');
    summary.textContent = t('Weather unavailable');
    const retry = el('button', 'button', t('Try again'));
    retry.type = 'button';
    retry.addEventListener('click', handlers.onRetry);

    const box = el('div', 'panel__error');
    box.setAttribute('role', 'alert');
    box.append(el('p', undefined, message), retry);
    body.replaceChildren(box);
  }

  /**
   * A weather record near the point (records.ts, e.g. at Vostok), above the
   * weather. The facts load on demand, so they stay out of the start-up code.
   */
  function showRecord(point: PickedPoint) {
    // (A failed load, e.g. on leaving the page, just shows no record.)
    void import('./records')
      .catch(() => undefined)
      .then((records) => {
        if (!records || shown?.point !== point) return;
        const record = records.renderRecord(point);
        body.querySelector(':scope > .current')?.before(...record);
        // A secret badge for the weather levels (journey/, through main.ts).
        if (record.length > 0) secretFound('record');
      });
  }

  /**
   * The sauna and Santa easter eggs' reports (sauna.ts, santa.ts) lead,
   * above the real weather. They load on demand: few ever see them.
   */
  function showEasterEgg(point: PickedPoint, forecast: Forecast) {
    const sauna = isSaunaPoint(point);
    if (!sauna && !isSantaPoint(point)) return;
    // (A failed load, e.g. offline, just shows the plain weather.)
    void (sauna ? import('./sauna-report') : import('./santa-report'))
      .catch(() => undefined)
      .then((module) => {
        if (!module || shown?.point !== point) return;
        const report =
          'renderSauna' in module ? module.renderSauna(marineShown) : module.renderSanta(forecast);
        body.querySelector(':scope > .record, :scope > .current')?.before(report);
        secretFound(sauna ? 'sauna' : 'santa');
      });
  }

  // render/sky.ts once loaded: later redraws (a refresh, °C/°F) fill the
  // Sky section at once, so the scroll position holds.
  let sky: typeof import('./render/sky') | undefined;

  /**
   * The Sky section's rows and the "Beer outside" row in More details
   * (render/sky.ts, loaded on demand the first time).
   */
  function fillSky(point: PickedPoint, forecast: Forecast) {
    const fill = (module: typeof import('./render/sky')) => {
      const list = body.querySelector<HTMLElement>('.sky__list');
      if (list && shown?.point === point) module.fillSky(list, forecast, point);
      const moreDetails = body.querySelector<HTMLElement>('.more-details .details');
      if (moreDetails && shown?.point === point) module.fillBeer(moreDetails, forecast, point);
    };
    if (sky) return fill(sky);
    // (A failed load, e.g. offline, leaves the section empty.)
    void import('./render/sky')
      .then((module) => {
        sky = module;
        fill(module);
      })
      .catch(() => undefined);
  }

  function showForecast(point: PickedPoint, forecast: Forecast) {
    open(point);
    shown = { point, forecast };
    body.setAttribute('aria-busy', 'false');
    const now = forecast.current;
    const condition = describeWeather(now.weather_code, now.is_day === 1);
    plainSummary = `${condition.icon} ${formatTemperature(now.temperature_2m)} · ${condition.description}`;
    summary.textContent = plainSummary;
    body.replaceChildren(
      // By how often people need each part: now at a glance, the forecasts,
      // then air quality in full and the less-checked details.
      renderCurrent(forecast),
      renderHourly(forecast),
      renderDaily(forecast, {
        openDay,
        onToggle: (day) => (openDay = day),
      }),
      renderAirQualitySection(),
      renderSkySection(forecast),
      renderMoreDetails(forecast, point),
    );
    showEasterEgg(point, forecast);
    showRecord(point);
    fillSky(point, forecast);
    // A new location starts at the top, not where the last one was scrolled.
    body.scrollTop = 0;

    // Keep the location's clock ticking while the panel shows it.
    const clock = body.querySelector<HTMLElement>('.local-time__value')!;
    clockTimer = window.setInterval(() => {
      clock.textContent = formatLocalNow(forecast.timezone, forecast.utc_offset_seconds);
    }, CLOCK_REFRESH_MS);
  }

  function airQualitySection(): HTMLElement | null {
    return body.querySelector<HTMLElement>('.air-quality');
  }

  function airQualityGlance(): HTMLElement | null {
    return body.querySelector<HTMLElement>('.glance-aqi');
  }

  function showAirQuality(airQuality: AirQuality) {
    airQualityShown = airQuality;
    const glance = airQualityGlance();
    if (glance) fillAirQualityGlance(glance, airQuality);
    const section = airQualitySection();
    if (section) fillAirQuality(section, airQuality);
  }

  function showRoads(state: RoadState) {
    if (!shown) return;
    roadsShown = state;
    body.querySelector('.current__roads')?.remove();
    // No main road near, no answer, or normal conditions: nothing to say.
    if (state && state !== 'failed' && state.level !== 'normal') {
      body
        .querySelector('.current__wear')
        ?.after(roadConditionsLine(state, roadCredit(state, true)));
    }
  }

  function showWarnings(state: WarningsState) {
    if (!shown) return;
    warningsShown = state;
    body.querySelector('.warnings')?.remove();
    // Most important first: above everything else in the weather.
    body.prepend(renderWarnings(state, shown.forecast));
    const status = body.querySelector('.warnings-status');
    if (status) status.replaceChildren(warningsStatus(state));
    // A collapsed phone sheet shows only one line: lead with the warning.
    const first = typeof state === 'string' ? undefined : state.warnings[0];
    summary.textContent = first ? `⚠ ${first.title} · ${plainSummary}` : plainSummary;
  }

  function showMarine(marine: Marine | null) {
    if (!shown) return;
    marineShown = marine;
    body.querySelector('.sea')?.remove();
    // Where people look for it: after the forecast for the coming days.
    if (marine) body.querySelector('.daily')?.closest('section')?.after(renderMarine(marine));
    // The sauna report's dip in the sea uses the real sea temperature.
    const sauna = body.querySelector('.sauna');
    if (sauna) {
      void import('./sauna-report').then(({ renderSauna }) => {
        if (sauna.isConnected) sauna.replaceWith(renderSauna(marine));
      });
    }
  }

  function showAirQualityUnavailable() {
    airQualityShown = 'unavailable';
    const glance = airQualityGlance();
    if (glance) fillAirQualityGlance(glance, undefined);
    const section = airQualitySection();
    if (section) showAirQualityMessage(section, t('Air quality is unavailable right now.'));
  }

  function showName(point: PickedPoint) {
    if (current !== point) return;
    showTitle();
    // Draws again so More details gains the coordinates row.
    if (shown?.point === point) redraw(point, shown.forecast);
  }

  function hide() {
    stopClock();
    shown = undefined;
    current = undefined;
    root.hidden = true;
  }

  // New units: draw the same weather again, keeping the scroll position.
  onUnitsChange(() => {
    if (shown) redraw(shown.point, shown.forecast);
  });

  function refreshForecast(point: PickedPoint, forecast: Forecast) {
    if (shown?.point !== point) showForecast(point, forecast);
    else redraw(point, forecast);
  }

  /** Draws the place again (new units or newer weather), in place. */
  function redraw(point: PickedPoint, forecast: Forecast) {
    const airQuality = airQualityShown;
    const warnings = warningsShown;
    const marine = marineShown;
    const roads = roadsShown;
    const scrollTop = body.scrollTop;
    // The body is a live region; without this a screen reader would read the
    // whole panel out again for the same place.
    body.setAttribute('aria-live', 'off');
    showForecast(point, forecast);
    if (airQuality === 'unavailable') showAirQualityUnavailable();
    else if (airQuality) showAirQuality(airQuality);
    if (warnings) showWarnings(warnings);
    if (roads !== undefined) showRoads(roads);
    if (marine !== undefined) showMarine(marine);
    body.scrollTop = scrollTop;
    window.setTimeout(() => body.setAttribute('aria-live', 'polite'), 0);
  }

  return {
    showLoading,
    showError,
    showForecast,
    refreshForecast,
    showAirQuality,
    showAirQualityUnavailable,
    showWarnings,
    showRoads,
    showMarine,
    showName,
    hide,
  };
}
