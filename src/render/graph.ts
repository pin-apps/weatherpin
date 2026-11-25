// A small graph of a run of hours: the temperature as a line, precipitation
// as bars under it, the warmest and coldest hour labelled. Plain SVG built
// with the DOM (no chart library, no inline styles: the CSP allows neither
// style="" nor what most chart libraries inject). The picture scales to the
// panel's width; screen readers get one sentence instead.

import { formatHour, formatPrecipitation, formatTemperature } from '../format';
import type { Forecast } from '../weather/api';
import { t } from '../i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Drawing units; the SVG scales to the panel's width. 300 wide keeps the
// 13-unit labels near 13 px on the narrowest phones.
const WIDTH = 300;
const HEIGHT = 132;
const SIDE = 6;
// Where the temperature line may go, top and bottom (room for labels).
const LINE_TOP = 24;
const LINE_BOTTOM = 70;
// Precipitation bars stand on this line, at most this tall.
const BAR_BASE = 108;
const BAR_MAX = 20;
const HOUR_LABEL_Y = 126;
// Below this a bar would be a speck; at the scale's top, a full bar.
const MIN_RAIN_MM = 0.05;
const RAIN_SCALE_MIN_MM = 1;
// Hour labels every 6 hours: 00, 06, 12, 18.
const HOUR_LABEL_EVERY = 6;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  className: string,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  element.setAttribute('class', className);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

/** A text label that never runs off either side of the graph. */
function label(className: string, x: number, y: number, text: string): SVGTextElement {
  const anchor = x < 30 ? 'start' : x > WIDTH - 30 ? 'end' : 'middle';
  const element = svgEl('text', className, {
    x: anchor === 'start' ? Math.max(x - 4, 0) : anchor === 'end' ? Math.min(x + 4, WIDTH) : x,
    y,
    'text-anchor': anchor,
  });
  element.textContent = text;
  return element;
}

/** Index of the largest value (first one on ties), or -1 if there is none. */
function indexOfBest(values: (number | null)[], better: (a: number, b: number) => boolean): number {
  let best = -1;
  values.forEach((value, i) => {
    if (value == null) return;
    if (best === -1 || better(value, values[best]!)) best = i;
  });
  return best;
}

/** Graph of hourly[start] to hourly[end - 1]. */
export function renderHoursGraph(forecast: Forecast, start: number, end: number): SVGSVGElement {
  const hourly = forecast.hourly;
  const times = hourly.time.slice(start, end);
  const temps = hourly.temperature_2m.slice(start, end);
  const rain = hourly.precipitation.slice(start, end);
  const step = (WIDTH - 2 * SIDE) / Math.max(times.length, 1);
  const xAt = (i: number) => SIDE + (i + 0.5) * step;

  const svg = svgEl('svg', 'hours-graph', {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: 'img',
  });

  // Hour labels and a faint line for each, behind everything else.
  times.forEach((time, i) => {
    if (Number(time.slice(11, 13)) % HOUR_LABEL_EVERY !== 0) return;
    svg.append(
      svgEl('line', 'hours-graph__grid', {
        x1: xAt(i),
        x2: xAt(i),
        y1: LINE_TOP - 8,
        y2: BAR_BASE,
      }),
      label('hours-graph__hour', xAt(i), HOUR_LABEL_Y, formatHour(time)),
    );
  });

  // Precipitation bars; small amounts stay small (the scale starts at 1 mm).
  const rainValues = rain.map((mm) => mm ?? 0);
  const rainScale = Math.max(RAIN_SCALE_MIN_MM, ...rainValues);
  rainValues.forEach((mm, i) => {
    if (mm < MIN_RAIN_MM) return;
    const height = Math.max(2, (mm / rainScale) * BAR_MAX);
    svg.append(
      svgEl('rect', 'hours-graph__bar', {
        x: xAt(i) - step * 0.35,
        y: BAR_BASE - height,
        width: step * 0.7,
        height,
        rx: 1,
      }),
    );
  });
  svg.append(
    svgEl('line', 'hours-graph__base', { x1: SIDE, x2: WIDTH - SIDE, y1: BAR_BASE, y2: BAR_BASE }),
  );

  // Temperature line, broken where a model has no value.
  const warmest = indexOfBest(temps, (a, b) => a > b);
  const coldest = indexOfBest(temps, (a, b) => a < b);
  if (warmest !== -1) {
    const high = temps[warmest]!;
    const low = temps[coldest]!;
    // A flat day still gets a little room above and below the line.
    const span = Math.max(high - low, 2);
    const middle = (high + low) / 2;
    const yAt = (t: number) =>
      LINE_BOTTOM - ((t - (middle - span / 2)) / span) * (LINE_BOTTOM - LINE_TOP);

    let path = '';
    let drawing = false;
    temps.forEach((t, i) => {
      if (t == null) {
        drawing = false;
        return;
      }
      path += `${drawing ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(t).toFixed(1)}`;
      drawing = true;
    });
    svg.append(svgEl('path', 'hours-graph__line', { d: path }));

    // Warmest labelled above its point, coldest below (just one when equal).
    svg.append(
      svgEl('circle', 'hours-graph__dot', { cx: xAt(warmest), cy: yAt(high), r: 3 }),
      label('hours-graph__temp', xAt(warmest), yAt(high) - 8, formatTemperature(high)),
    );
    if (coldest !== warmest && Math.round(low) !== Math.round(high)) {
      svg.append(
        svgEl('circle', 'hours-graph__dot', { cx: xAt(coldest), cy: yAt(low), r: 3 }),
        label('hours-graph__temp', xAt(coldest), yAt(low) + 18, formatTemperature(low)),
      );
    }
  }

  svg.setAttribute('aria-label', describe(times, temps, rainValues, warmest, coldest));
  return svg;
}

/** What the graph shows, in one sentence for screen readers. */
function describe(
  times: string[],
  temps: (number | null)[],
  rain: number[],
  warmest: number,
  coldest: number,
): string {
  const parts: string[] = [];
  if (warmest !== -1) {
    parts.push(
      t('Temperature from {low} to {high}, warmest around {time}.', {
        low: formatTemperature(temps[coldest]!),
        high: formatTemperature(temps[warmest]!),
        time: formatHour(times[warmest]),
      }),
    );
  }
  const total = rain.reduce((sum, mm) => sum + mm, 0);
  if (total >= MIN_RAIN_MM) {
    const wettest = indexOfBest(rain, (a, b) => a > b);
    parts.push(
      t('Precipitation {amount} in total, most around {time}.', {
        amount: formatPrecipitation(total),
        time: formatHour(times[wettest]),
      }),
    );
  } else {
    parts.push(t('No precipitation.'));
  }
  return parts.join(' ');
}
