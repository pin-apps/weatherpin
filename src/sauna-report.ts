// The sauna easter egg's report (sauna.ts), loaded on demand by panel.ts:
// few ever see it, so it stays out of the start-up code.

import { el, iconEl } from './dom';
import { formatTemperature } from './format';
import { t } from './i18n';
import type { Marine } from './weather/marine';

/** Löyly temperature for the report, °C. */
const SAUNA_TEMPERATURE = 80;

/** Below this the sea is a bracing dip (°C). */
const COLD_SEA = 15;

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
