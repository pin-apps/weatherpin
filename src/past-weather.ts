// "Weather on a day" (the panel's ⋯ menu): the weather at the place shown
// on a past day, any day from 1940 to about a week ago, from Open-Meteo's
// archive (weather/archive.ts). A native <dialog> in index.html: it keeps
// the past apart from the forecast in the panel, so an old day can't be
// mistaken for today. Loaded the first time it's opened; nothing saved.

import { el, iconEl } from './dom';
import {
  formatCoordinates,
  formatPrecipitation,
  formatSnow,
  formatTemperature,
  formatWindSpeed,
} from './format';
import { t } from './i18n';
import type { PickedPoint } from './map';
import { pictureFileName, sharePicture } from './share-picture';
import { statusLine } from './status-line';
import { currentUnits } from './units';
import type { Forecast } from './weather/api';
import {
  ARCHIVE_DELAY_DAYS,
  daysBefore,
  fetchPastDay,
  FIRST_ARCHIVE_DAY,
  yearsBefore,
  type PastDay,
} from './weather/archive';
import { describeWeather } from './weather/wmo';

interface Shown {
  point: PickedPoint;
  forecast: Forecast;
}

const dialog = document.querySelector<HTMLDialogElement>('#past-weather')!;
const placeText = dialog.querySelector<HTMLElement>('.past-weather__place')!;
const form = dialog.querySelector<HTMLFormElement>('.past-weather__form')!;
const dateInput = dialog.querySelector<HTMLInputElement>('.past-weather__date')!;
const result = dialog.querySelector<HTMLElement>('.past-weather__result')!;
const note = dialog.querySelector<HTMLElement>('.past-weather__note')!;
const shareButton = dialog.querySelector<HTMLButtonElement>('.past-weather__share')!;
const shareStatus = statusLine(dialog.querySelector<HTMLElement>('.past-weather__status')!);

/** A day's weather in words, for the dialog and its postcard. */
interface DayTexts {
  day: PastDay;
  icon: string;
  title: string;
  summary: string;
  details: string;
  today: string | null;
}

let shown: Shown | undefined;
// The day on screen, for its postcard.
let shownDay: DayTexts | undefined;
// Only the latest request's answer is shown.
let requestId = 0;

dialog.querySelector('.past-weather__close')!.addEventListener('click', () => dialog.close());
// A click on the dimmed backdrop (the dialog itself, outside its content).
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.querySelectorAll<HTMLButtonElement>('.past-weather__ago').forEach((button) =>
  button.addEventListener('click', () => {
    if (!shown) return;
    const date = yearsBefore(todayThere(shown.forecast), Number(button.dataset.years));
    dateInput.value = date;
    void show(date);
  }),
);
// The day as a postcard (postcard.ts, fetched now): share sheet or download.
shareButton.addEventListener('click', async () => {
  if (!shown || !shownDay) return;
  const { point } = shown;
  const texts = shownDay;
  let picture: Blob;
  try {
    const { drawPastDayPostcard } = await import('./postcard');
    picture = await drawPastDayPostcard(point, {
      date: texts.day.date,
      weatherCode: texts.day.weatherCode,
      stamp: formatTemperature(texts.day.high!),
      title: texts.title,
      lines: [texts.summary, texts.details],
      today: texts.today,
    });
  } catch {
    shareStatus.say(t("Couldn't make the picture"));
    return;
  }
  const place = point.name ?? formatCoordinates(point.lat, point.lng);
  const title = t('Weather in {place} on {date}', { place, date: texts.title });
  await sharePicture(picture, pictureFileName(point, texts.day.date), title, shareStatus.say);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const date = dateInput.value;
  if (date && date >= dateInput.min && date <= dateInput.max) void show(date);
  else say(t('Pick a day between 1 January 1940 and a week ago.'));
});

/** Opens the dialog for the place shown in the panel. */
export function openPastWeather(point: PickedPoint, forecast: Forecast): void {
  shown = { point, forecast };
  requestId++;
  placeText.textContent = point.name ?? formatCoordinates(point.lat, point.lng);
  dateInput.min = FIRST_ARCHIVE_DAY;
  dateInput.max = daysBefore(todayThere(forecast), ARCHIVE_DELAY_DAYS);
  dateInput.value = '';
  showResult([]);
  if (!dialog.open) dialog.showModal();
}

/** Today in the place's own calendar (the forecast's first day). */
function todayThere(forecast: Forecast): string {
  return forecast.daily.time[0];
}

function say(text: string) {
  showResult([el('p', 'past-weather__message', text)]);
}

/** The result area: a message, or a day (with the note and its postcard). */
function showResult(elements: HTMLElement[], day?: DayTexts) {
  shownDay = day;
  result.replaceChildren(...elements);
  note.hidden = !day;
  shareButton.hidden = !day;
  shareStatus.clear();
}

async function show(date: string) {
  if (!shown) return;
  const { point, forecast } = shown;
  const id = ++requestId;
  say(t('Loading…'));
  let day: PastDay;
  try {
    day = await fetchPastDay(point.lat, point.lng, date);
  } catch {
    if (id === requestId) say(t("Couldn't get the weather for that day. Try again."));
    return;
  }
  if (id !== requestId) return;
  if (day.high === null || day.low === null) {
    say(t('No weather records for that day yet.'));
    return;
  }
  const texts = describeDay(day, forecast);
  showResult(renderDay(texts), texts);
}

function describeDay(day: PastDay, forecast: Forecast): DayTexts {
  const condition = describeWeather(day.weatherCode ?? -1);
  const high = t('high {temperature}', { temperature: formatTemperature(day.high!) });
  const low = t('low {temperature}', { temperature: formatTemperature(day.low!) });
  const details = [precipitationText(day)];
  if (day.windMax !== null) {
    details.push(t('wind up to {speed}', { speed: formatWindSpeed(day.windMax) }));
  }
  if (day.sunshine !== null) {
    details.push(t('{hours} h of sunshine', { hours: Math.round(day.sunshine / 3600) }));
  }
  return {
    day,
    icon: condition.icon,
    title: formatFullDate(day.date),
    summary: `${condition.description} · ${high} · ${low}`,
    details: details.join(' · '),
    today: todayLine(day, forecast),
  };
}

function renderDay(texts: DayTexts): HTMLElement[] {
  const summary = el('p', 'past-weather__summary');
  summary.append(iconEl(texts.icon, 'past-weather__icon'), ` ${texts.summary}`);
  const elements = [
    el('p', 'past-weather__day', texts.title),
    summary,
    el('p', 'past-weather__details', texts.details),
  ];
  if (texts.today) elements.push(el('p', 'past-weather__today', texts.today));
  return elements;
}

function precipitationText(day: PastDay): string {
  if (day.snowfall !== null && day.snowfall >= 0.1) {
    return t('Snow {amount}', { amount: formatSnow(day.snowfall) });
  }
  if (day.precipitation !== null && day.precipitation >= 0.1) {
    return t('Rain {amount}', { amount: formatPrecipitation(day.precipitation) });
  }
  return t('No rain or snow');
}

/** "Today: 3 °C / −1 °C, 11° warmer": today's high against that day's. */
function todayLine(day: PastDay, forecast: Forecast): string | null {
  const high = forecast.daily.temperature_2m_max[0];
  const low = forecast.daily.temperature_2m_min[0];
  if (typeof high !== 'number' || typeof low !== 'number') return null;
  // In the units shown, so the numbers add up on screen.
  const scale = currentUnits().temperature === 'fahrenheit' ? 9 / 5 : 1;
  const degrees = Math.round((high - day.high!) * scale);
  const difference =
    degrees > 0
      ? t('{degrees}° warmer', { degrees })
      : degrees < 0
        ? t('{degrees}° colder', { degrees: -degrees })
        : t('the same high');
  return t('Today: {high} / {low}, {difference}', {
    high: formatTemperature(high),
    low: formatTemperature(low),
    difference,
  });
}

/** "2026-03-14" → "Saturday 14 March 1987" in the app's language. */
function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const text = new Intl.DateTimeFormat(currentUnits().dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
