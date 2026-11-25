// The "Sea" section: waves, swell, the highest waves ahead, sea temperature.
// Only for places with sea data (see weather/marine.ts).

import { el, iconEl } from '../dom';
import { formatClockTime, formatTemperature, formatWaveHeight, windFrom } from '../format';
import { highestWaves, type Marine } from '../weather/marine';
import { makeFoldable } from './fold';
import { t } from '../i18n';

export function renderMarine(marine: Marine): HTMLElement {
  const now = marine.current;
  const rows: [string, string | HTMLElement][] = [];

  if (now.wave_height != null) rows.push([t('Waves'), renderWaves(marine)]);
  if (now.swell_wave_height != null)
    rows.push([t('Swell'), formatWaveHeight(now.swell_wave_height)]);
  const highest = highestWaves(marine);
  if (highest) {
    rows.push([
      t('Highest in 24 h'),
      t('{height} around {time}', {
        height: formatWaveHeight(highest.height),
        time: formatClockTime(highest.time),
      }),
    ]);
  }
  if (now.sea_surface_temperature != null) {
    rows.push([t('Sea temperature'), formatTemperature(now.sea_surface_temperature)]);
  }

  const heading = el('h3', 'section-title', t('Sea'));
  heading.id = 'sea-title';
  const section = el('section', 'forecast-section sea');
  section.setAttribute('aria-labelledby', 'sea-title');
  const list = el('dl', 'details');
  for (const [label, value] of rows) {
    const row = el('div', 'details__row');
    const dd = el('dd');
    dd.append(value);
    row.append(el('dt', undefined, label), dd);
    list.append(row);
  }
  section.append(heading, list);
  makeFoldable(section, heading, 'sea');
  return section;
}

/** "0.6 m from SSE ↑ · every 3 s" (the arrow points where they go). */
function renderWaves(marine: Marine): HTMLElement {
  const { wave_height, wave_direction, wave_period } = marine.current;
  const waves = el('span');
  waves.append(formatWaveHeight(wave_height!));
  if (wave_direction != null) {
    const arrow = iconEl('↑', 'wind-arrow');
    // The style property is allowed by the CSP (unlike style="").
    arrow.style.transform = `rotate(${wave_direction + 180}deg)`;
    waves.append(` ${windFrom(wave_direction)} `, arrow);
  }
  if (wave_period != null) {
    waves.append(` · ${t('every {seconds} s', { seconds: Math.round(wave_period) })}`);
  }
  return waves;
}
