import { el, hiddenText, iconEl } from '../dom';
import {
  formatLongDay,
  formatPrecipitation,
  formatSnow,
  formatTemperature,
  formatWeekday,
  orDash,
} from '../format';
import { currentHourIndex, type Forecast } from '../weather/api';
import { UV_PROTECTION_FROM, uvLevel } from '../weather/uv';
import { uvBadge } from './current';
import { makeFoldable } from './fold';
import { renderHoursGraph } from './graph';
import { hourStrip } from './hourly';
import { describeWeather } from '../weather/wmo';
import { t } from '../i18n';

interface DailyOptions {
  /** The day to show opened, e.g. "2026-11-18" (kept across a redraw). */
  openDay?: string;
  /** Called with the day opened, or undefined when it's closed. */
  onToggle?(day: string | undefined): void;
}

export function renderDaily(
  forecast: Forecast,
  { openDay, onToggle }: DailyOptions = {},
): HTMLElement {
  const daily = forecast.daily;

  const heading = el('h3', 'section-title', t('7 days'));
  heading.id = 'daily-title';

  const list = el('ol', 'daily');
  list.setAttribute('aria-labelledby', 'daily-title');

  // One day open at a time. Its hours are built when it opens, not before:
  // seven days of hours would be a lot of hidden DOM.
  const closeAll = () => {
    list.querySelectorAll<HTMLButtonElement>('.daily__row[aria-expanded="true"]').forEach((row) => {
      row.setAttribute('aria-expanded', 'false');
      const hours = document.getElementById(row.getAttribute('aria-controls')!)!;
      hours.hidden = true;
      hours.replaceChildren();
    });
  };
  const openRow = (row: HTMLButtonElement, hours: HTMLElement, date: string, isToday: boolean) => {
    closeAll();
    row.setAttribute('aria-expanded', 'true');
    hours.replaceChildren(...renderDayHours(forecast, date, isToday));
    hours.hidden = false;
  };

  daily.time.forEach((date, i) => {
    const condition = describeWeather(daily.weather_code[i] ?? -1);

    // Low and high in columns of their own, right-aligned, so the numbers
    // line up down the list like a table.
    const low = el('span', 'daily__low');
    low.append(
      hiddenText(`${t('temperature|Low')} `),
      el('span', 'daily__min', orDash(daily.temperature_2m_min[i], formatTemperature)),
    );
    const high = el('span', 'daily__high');
    high.append(
      hiddenText(`, ${t('temperature|high')} `),
      el('span', 'daily__max', orDash(daily.temperature_2m_max[i], formatTemperature)),
    );

    const precipitation = el(
      'span',
      'daily__precip',
      orDash(daily.precipitation_sum[i], formatPrecipitation),
    );
    precipitation.prepend(hiddenText(`${t('Precipitation')} `));

    // Rain, with snow under it on snowy days.
    const water = el('span', 'daily__water');
    water.append(precipitation);
    const snow = daily.snowfall_sum?.[i];
    if (snow != null && snow >= 0.1) {
      const snowText = el('span', 'daily__snow');
      // Screen readers hear "Snow 2.1 cm", not "snowflake".
      snowText.append(
        hiddenText(`${t('Snow')} `),
        iconEl('❄', 'daily__snow-icon'),
        ` ${formatSnow(snow)}`,
      );
      water.append(snowText);
    }

    // A column of its own, so badges line up and never push the row onto a
    // second line (issue #47). Empty on days below UV 3.
    const uvCell = el('span', 'daily__uv');
    const uvMax = daily.uv_index_max?.[i];
    if (uvMax != null) {
      const uv = uvLevel(uvMax);
      if (uv.value >= UV_PROTECTION_FROM) {
        // "UV 5" on screen; the level word for screen readers.
        const badge = uvBadge(uv.value, uv.level, `UV ${uv.value}`);
        badge.append(hiddenText(` ${t(uv.label)}`));
        badge.title = t('UV index {value}, {level}', {
          value: uv.value,
          level: t(uv.label).toLowerCase(),
        });
        uvCell.append(badge);
      }
    }

    // The whole row is a button that opens the day's hours under it.
    const row = el('button', 'daily__row');
    row.type = 'button';
    row.setAttribute('aria-expanded', 'false');
    row.append(
      el('span', 'daily__day', i === 0 ? t('Today') : formatWeekday(date)),
      iconEl(condition.icon, 'daily__icon'),
      hiddenText(condition.description),
      water,
      uvCell,
      low,
      high,
      iconEl('›', 'daily__chevron'),
    );

    const hours = el('div', 'daily__hours');
    hours.id = `daily-hours-${i}`;
    hours.hidden = true;
    hours.setAttribute('role', 'region');
    hours.setAttribute('aria-label', t('Hours on {day}', { day: formatLongDay(date) }));
    row.setAttribute('aria-controls', hours.id);

    row.addEventListener('click', () => {
      if (row.getAttribute('aria-expanded') === 'true') {
        closeAll();
        onToggle?.(undefined);
      } else {
        openRow(row, hours, date, i === 0);
        onToggle?.(date);
      }
    });

    const item = el('li', 'daily__item');
    item.append(row, hours);
    list.append(item);
    if (date === openDay) openRow(row, hours, date, i === 0);
  });

  const section = el('section', 'forecast-section');
  section.append(heading, list);
  makeFoldable(section, heading, 'daily');
  return section;
}

/** A day's graph and hour strip; today's start at the current hour. */
function renderDayHours(forecast: Forecast, date: string, isToday: boolean): Element[] {
  const times = forecast.hourly.time;
  let start = times.findIndex((time) => time.startsWith(date));
  let end = start;
  while (end < times.length && times[end].startsWith(date)) end++;
  if (isToday) start = Math.max(start, currentHourIndex(forecast));
  if (start === -1 || start >= end) {
    return [el('p', 'daily__no-hours', t('No hourly forecast for this day.'))];
  }
  return [
    renderHoursGraph(forecast, start, end),
    hourStrip(forecast, start, end, {
      label: t('Hours on {day}', { day: formatLongDay(date) }),
      firstIsNow: isToday,
    }),
  ];
}
