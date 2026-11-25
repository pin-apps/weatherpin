import { el, hiddenText, iconEl } from '../dom';
import { formatHour, formatTemperature, formatWindSpeed, orDash, windFrom } from '../format';
import { currentHourIndex, type Forecast } from '../weather/api';
import { describeWeather } from '../weather/wmo';
import { makeFoldable } from './fold';
import { renderHoursGraph } from './graph';
import { t } from '../i18n';

const HOURS_SHOWN = 24;

export function renderHourly(forecast: Forecast): HTMLElement {
  // Start at the current hour (or the first one, if it can't be found).
  const start = Math.max(currentHourIndex(forecast), 0);
  const end = Math.min(start + HOURS_SHOWN, forecast.hourly.time.length);

  const heading = el('h3', 'section-title', t('Next 24 hours'));
  heading.id = 'hourly-title';

  const section = el('section', 'forecast-section');
  section.append(
    heading,
    renderHoursGraph(forecast, start, end),
    hourStrip(forecast, start, end, { labelledBy: 'hourly-title', firstIsNow: true }),
  );
  makeFoldable(section, heading, 'hourly');
  return section;
}

interface StripOptions {
  /** Id of the heading that names the strip, or a name of its own. */
  labelledBy?: string;
  label?: string;
  /** Label the first hour "Now" instead of its time. */
  firstIsNow?: boolean;
}

/** A sideways-scrolling row of hours (hourly[start] to hourly[end - 1]). */
export function hourStrip(
  forecast: Forecast,
  start: number,
  end: number,
  { labelledBy, label, firstIsNow = false }: StripOptions,
): HTMLElement {
  const hourly = forecast.hourly;

  // Focusable so keyboard users can scroll the strip with the arrow keys.
  const strip = el('ol', 'hourly');
  strip.tabIndex = 0;
  if (labelledBy) strip.setAttribute('aria-labelledby', labelledBy);
  if (label) strip.setAttribute('aria-label', label);

  for (let i = start; i < end; i++) {
    const code = hourly.weather_code[i];
    const condition = describeWeather(code ?? -1, hourly.is_day[i] !== 0);
    const chance = hourly.precipitation_probability[i];

    const item = el('li', 'hourly__item');
    item.append(
      el('span', 'hourly__time', firstIsNow && i === start ? t('Now') : formatHour(hourly.time[i])),
      iconEl(condition.icon, 'hourly__icon'),
      hiddenText(condition.description),
      el('span', 'hourly__temp', orDash(hourly.temperature_2m[i], formatTemperature)),
    );

    const wind = renderWind(hourly.wind_speed_10m?.[i], hourly.wind_direction_10m?.[i]);
    if (wind) item.append(wind);

    // Only worth showing when rain/snow is actually possible.
    if (chance != null && chance > 0) {
      const rain = el('span', 'hourly__chance', `${chance} %`);
      rain.prepend(hiddenText(`${t('Chance of precipitation')} `));
      item.append(rain);
    }
    strip.append(item);
  }
  return strip;
}

/**
 * The hour's wind: an arrow the way it blows, and its speed under it
 * ("4 m/s"; two lines, so km/h fits the narrow hour). Screen readers get
 * "Wind 4 m/s from SW".
 */
function renderWind(
  speed: number | null | undefined,
  direction: number | null | undefined,
): HTMLElement | null {
  if (speed == null) return null;
  const wind = el('span', 'hourly__wind');
  wind.title = t('Wind');
  if (direction != null) {
    // Like the wind now: the API gives where it comes from; the arrow
    // points where it blows to. The style property is allowed by the CSP.
    const arrow = iconEl('↑', 'hourly__wind-arrow');
    arrow.style.transform = `rotate(${direction + 180}deg)`;
    wind.append(arrow);
  }
  const from = direction != null ? ` ${windFrom(direction)}` : '';
  wind.append(
    hiddenText(`${t('Wind')} `),
    el('span', 'hourly__wind-speed', formatWindSpeed(speed)),
    hiddenText(from),
  );
  return wind;
}
