// Easter egg: searching "sauna" offers Saunalahti in Espoo (literally
// "Sauna Bay"), and choosing it opens a sauna report above the real
// weather. Only from that search: a link or a favourite to the same place
// shows the plain weather, so it stays a secret. Not listed in About.

import { el, iconEl } from './dom';
import { formatTemperature } from './format';
import type { PickedPoint } from './map';
import type { Marine } from './weather/marine';
import { t } from './i18n';

/** Saunalahti, Espoo (GeoNames), on the Gulf of Finland. */
const SAUNALAHTI = { lat: 60.16312, lng: 24.62012 };

/** Close enough to see the shore. */
export const SAUNA_ZOOM = 12;

/** Löyly temperature for the report, °C. */
const SAUNA_TEMPERATURE = 80;

/** Below this the sea is a bracing dip (°C). */
const COLD_SEA = 15;

/** The points opened from the sauna search (others show plain weather). */
const saunaPoints = new WeakSet<PickedPoint>();

export function isSaunaSearch(query: string): boolean {
  return (
    query
      .trim()
      .toLowerCase()
      .replace(/[!.]+$/, '') === 'sauna'
  );
}

/** A new point for Saunalahti, marked as opened from the sauna search. */
export function saunaPoint(): PickedPoint {
  const point = { ...SAUNALAHTI, name: t('Saunalahti, Finland') };
  saunaPoints.add(point);
  return point;
}

export function isSaunaPoint(point: PickedPoint): boolean {
  return saunaPoints.has(point);
}

/**
 * The sauna report. `marine` gives the real sea temperature for the dip
 * afterwards (undefined while it loads, null if there's none).
 */
export function renderSauna(marine: Marine | null | undefined): HTMLElement {
  const heading = el('h3', 'section-title', t('Sauna'));
  heading.id = 'sauna-title';
  heading.append(' ', iconEl('🧖', 'sauna__icon'));

  const temperature = el('p', 'sauna__temp', formatTemperature(SAUNA_TEMPERATURE));
  const lines = el('ul', 'sauna__lines');
  for (const text of [
    t('Löyly incoming'),
    t('Humidity rising'),
    t('Wind: none (close the door!)'),
  ]) {
    lines.append(el('li', undefined, text));
  }
  lines.append(seaLine(marine?.current.sea_surface_temperature ?? null));

  const section = el('section', 'forecast-section sauna');
  section.setAttribute('aria-labelledby', 'sauna-title');
  section.append(heading, temperature, lines);
  return section;
}

function seaLine(seaTemperature: number | null): HTMLElement {
  const line = el('li');
  if (seaTemperature == null) {
    line.append(t('After the sauna: the sea is right there'), ' ', iconEl('🌊', 'sauna__icon'));
  } else {
    line.append(
      t('After the sauna: the sea is {temperature}', {
        temperature: formatTemperature(seaTemperature),
      }),
      ' ',
      iconEl(seaTemperature < COLD_SEA ? '🥶' : '🌊', 'sauna__icon'),
    );
  }
  return line;
}
