// The temperature quiz's screens (rules in game.ts), in the #quiz dialog: a
// start card (today's quiz, or its result if it's been played, and free
// play), 5 rounds (the map flies to a random place on land; you guess with a
// slider; the answer is revealed), and the results with a share text
// ("Weatherpin quiz #24 · 410/500 🌡️ 🟩🟩🟨🟩🟥 weatherpin.app/#quiz").
//
// The answer stays hidden until the guess: the weather panel stays closed,
// the address and page title don't change, and the place isn't kept in
// the device's copy of recent weather. Loaded on demand (main.ts).

import { el, iconEl } from '../dom';
import {
  formatClockTime,
  formatCoordinates,
  formatDuration,
  formatElevation,
  formatLocalNow,
} from '../format';
import type { CoveredArea, PickedPoint } from '../map';
import { statusLine } from '../status-line';
import { currentUnits } from '../units';
import { fetchForecast, type Forecast } from '../weather/api';
import { describeWeather } from '../weather/wmo';
import { t } from '../i18n';
import { q } from './texts';
import {
  MAX_POINTS,
  ROUNDS,
  quizDay,
  quizNumber,
  saveDaily,
  score,
  seededRandom,
  todaysResult,
  untilNextQuiz,
  type QuizRecord,
  type Scored,
} from './game';

export interface QuizHost {
  dialog: HTMLDialogElement;
  /**
   * Flies to a place (its marker only, no weather), landing it in the middle
   * of the map that `covered` leaves visible.
   */
  goTo(point: { lat: number; lng: number }, covered: CoveredArea): void;
  /** Leaves the quiz and opens the weather of a place. */
  showWeather(point: PickedPoint): void;
  /** The quiz has been closed. */
  onClose(): void;
  /**
   * A place's name ("Espoo, Finland"), from main.ts's own place-name
   * lookup (importing it here would split it out of the start-up code).
   */
  placeName(lat: number, lng: number): Promise<string | undefined>;
}

interface Round {
  point: PickedPoint;
  /** The answer, in the unit shown (rounded). */
  answer: number;
  guess: number;
  scored: Scored;
}

type Mode = 'daily' | 'free';

// The slider's range, by unit.
const RANGE = { celsius: [-40, 45, 15], fahrenheit: [-40, 113, 59] } as const;

let host: QuizHost | undefined;
// Bumped on every new screen and on close: a slow answer for an old screen
// is ignored.
let screen = 0;

export function openQuiz(quizHost: QuizHost): void {
  host = quizHost;
  const { dialog } = quizHost;
  if (!dialog.dataset.ready) {
    dialog.dataset.ready = 'yes';
    dialog.querySelector('.quiz__close')!.addEventListener('click', closeQuiz);
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeQuiz();
    });
    // However it's closed (×, Escape, or main.ts when a place's weather is
    // asked for): a round still loading must not move the map any more.
    dialog.addEventListener('close', () => {
      screen++;
      publishCoveredArea();
      host?.onClose();
    });
    // The map's credits and round buttons move clear of the card, as they do
    // for the weather sheet.
    new ResizeObserver(publishCoveredArea).observe(dialog);
    window.addEventListener('resize', publishCoveredArea);
  }
  // Not modal: the map behind it shows where each place is.
  if (!dialog.open) dialog.show();
  showStart();
}

function closeQuiz() {
  host?.dialog.close();
}

function body(): HTMLElement {
  return host!.dialog.querySelector<HTMLElement>('.quiz__body')!;
}

/** Replaces the dialog's content; focus goes to `focus` (or the first button). */
function show(nodes: Node[], focus?: HTMLElement) {
  screen++;
  body().style.minHeight = '';
  body().replaceChildren(...nodes);
  (focus ?? body().querySelector<HTMLElement>('button, input'))?.focus();
}

// About a question's height. During a game the card keeps one height (the
// tallest round screen so far, at least this), so the map's single flight,
// aimed above the card, lands where the pin stays: nothing moves afterwards.
const QUESTION_HEIGHT_PX = 300;
let roundHeight = QUESTION_HEIGHT_PX;

/** Keeps the card at the game's height (grows only). */
function keepRoundHeight() {
  roundHeight = Math.max(roundHeight, body().offsetHeight);
  body().style.minHeight = `${roundHeight}px`;
}

/** "Loading…" in a card of the game's height. */
function showLoading() {
  show([el('p', 'quiz__lead', t('Loading…'))]);
  keepRoundHeight();
}

/**
 * "☀️ Local time 09:15 · ⛰️ 2,469 m": the height is a fair clue (air cools
 * about 6.5 °C per 1,000 m) and says nothing of today's weather. On the
 * same line, so the card (and where the map aims) stays the same height.
 */
function localLine(forecast: Forecast, isDay: boolean): HTMLElement {
  const time = formatLocalNow(forecast.timezone, forecast.utc_offset_seconds);
  const line = el('p', 'quiz__local', `${isDay ? '☀️' : '🌙'} ${q('localTime', { time })}`);
  const { elevation } = forecast;
  if (elevation !== undefined && Number.isFinite(elevation)) {
    const height = el('span', 'quiz__elevation');
    // The emoji alone says little to a screen reader.
    height.append(
      ' · ⛰️ ',
      el('span', 'visually-hidden', `${t('Elevation')} `),
      formatElevation(elevation),
    );
    line.append(height);
  }
  return line;
}

/** A paragraph with the text's *marked* words in bold (as text, not HTML). */
function emphasised(className: string, text: string): HTMLElement {
  const paragraph = el('p', className);
  text.split(/\*([^*]+)\*/).forEach((part, index) => {
    if (part) paragraph.append(index % 2 ? el('strong', undefined, part) : part);
  });
  return paragraph;
}

/** Side by side: the guess and its button (a compact card leaves more map). */
function row(...children: HTMLElement[]): HTMLElement {
  const element = el('div', 'quiz__row');
  element.append(...children);
  return element;
}

function button(text: string, onClick: () => void, extra = ''): HTMLButtonElement {
  const element = el('button', `button quiz__button ${extra}`.trim(), text);
  element.type = 'button';
  element.addEventListener('click', onClick);
  return element;
}

const fahrenheit = () => currentUnits().temperature === 'fahrenheit';

/** °C into the unit shown, rounded: what the player compares with. */
const inUnit = (celsius: number) => Math.round(fahrenheit() ? (celsius * 9) / 5 + 32 : celsius);
const degrees = (value: number) => `${value} ${fahrenheit() ? '°F' : '°C'}`;

// ── Start ──────────────────────────────────────────────────────────────────

function showStart() {
  const day = quizDay();
  const done = todaysResult(day);
  if (done) return showDone(day, done);
  show([
    el('p', 'quiz__lead', q('intro', { number: quizNumber(day) })),
    button(q('playDaily'), () => void play('daily'), 'quiz__primary'),
    el('p', 'quiz__hint', q('freeIntro')),
    button(q('free'), () => void play('free')),
  ]);
}

/** Today's daily is done: its result, the streak, and the next quiz. */
function showDone(day: string, record: QuizRecord) {
  const lines = summaryLines(record);
  show([
    el('p', 'quiz__lead', q('played', { number: quizNumber(day) })),
    el('p', 'quiz__score', `${record.score} / ${MAX_POINTS}`),
    el('p', 'quiz__boxes', record.boxes ?? ''),
    ...lines,
    el('p', 'quiz__hint', q('nextQuiz', { time: formatDuration(untilNextQuiz() / 1000) })),
    shareButton(shareText('daily', record.score ?? 0, record.boxes ?? '', day)),
    button(q('free'), () => void play('free')),
  ]);
}

function summaryLines(record: QuizRecord): HTMLElement[] {
  return [
    el(
      'p',
      'quiz__streak',
      `🔥 ${q(record.streak === 1 ? 'streakOne' : 'streak', { days: record.streak })}`,
    ),
    el('p', 'quiz__best', q('best', { score: record.best })),
  ];
}

// ── Rounds ─────────────────────────────────────────────────────────────────

async function play(mode: Mode) {
  const day = quizDay();
  roundHeight = QUESTION_HEIGHT_PX;
  show([el('p', 'quiz__lead', t('Loading…'))]);
  const places = await import('../places/random-place').catch(() => undefined);
  if (!places) return showProblem(() => void play(mode));
  const random = mode === 'daily' ? seededRandom(`weatherpin-quiz-${day}`) : Math.random;
  const points = Array.from({ length: ROUNDS }, () => places.randomLandPoint(random));
  const rounds: Round[] = [];
  const next = (index: number): void => {
    if (index < ROUNDS) void playRound(mode, points[index], index, rounds, next);
    else showResults(mode, day, rounds);
  };
  next(0);
}

async function playRound(
  mode: Mode,
  at: { lat: number; lng: number },
  index: number,
  rounds: Round[],
  next: (index: number) => void,
) {
  showLoading();
  const mine = screen;
  // Off at once, while the place loads: one smooth flight, never cut short.
  host!.goTo(at, coveredByCard());
  let forecast: Forecast;
  let name: string | undefined;
  try {
    // Not kept in the device's copy of recent weather: that would show it.
    [forecast, name] = await Promise.all([
      fetchForecast(at.lat, at.lng, undefined, { keep: false }),
      host!.placeName(at.lat, at.lng).catch(() => undefined),
    ]);
  } catch {
    if (mine === screen) showProblem(() => void playRound(mode, at, index, rounds, next));
    return;
  }
  if (mine !== screen) return;

  const point: PickedPoint = { lat: at.lat, lng: at.lng, name };
  const isDay = forecast.current.is_day === 1;
  const [min, max, start] = RANGE[currentUnits().temperature];
  const slider = el('input', 'quiz__slider');
  slider.type = 'range';
  slider.id = 'quiz-guess';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = '1';
  slider.value = String(start);
  const value = el('output', 'quiz__value', degrees(start));
  value.htmlFor.add('quiz-guess');
  slider.addEventListener('input', () => (value.textContent = degrees(Number(slider.value))));
  // For screen readers: on screen the slider and its value say it.
  const label = el('label', 'visually-hidden', q('yourGuess'));
  label.htmlFor = 'quiz-guess';

  const guessButton = button(
    q('guess'),
    () => {
      const answer = inUnit(dailyAnswer(mode, forecast).celsius);
      const guess = Number(slider.value);
      const round = { point, answer, guess, scored: score(guess, answer, fahrenheit()) };
      rounds.push(round);
      showReveal(mode, forecast, round, index, next);
    },
    'quiz__primary',
  );

  show(
    [
      el('p', 'quiz__round', q('round', { number: index + 1, total: ROUNDS })),
      el('p', 'quiz__place', placeLabel(point)),
      localLine(forecast, isDay),
      emphasised('quiz__question', mode === 'daily' ? q('askHigh') : q('askNow')),
      // The high counts the hours still to come: it matters in the morning.
      ...(mode === 'daily' ? [el('p', 'quiz__hint', q('wholeDay'))] : []),
      label,
      slider,
      row(value, guessButton),
    ],
    slider,
  );
  keepRoundHeight();
}

/**
 * How much of the map the quiz card hides: along the bottom on phones; in
 * a corner on wide screens, clear of the map's middle.
 */
function coveredByCard(): CoveredArea {
  const rect = host!.dialog.getBoundingClientRect();
  // Closed, or in the left corner of a wide screen: the map's middle is free.
  if (rect.height === 0 || rect.right < window.innerWidth / 2) return { right: 0, bottom: 0 };
  // On the right (a phone on its side): the map shows to its left.
  if (rect.left > window.innerWidth / 2) return { right: window.innerWidth - rect.left, bottom: 0 };
  // Along the bottom (phones): the map shows above it.
  return { right: 0, bottom: window.innerHeight - rect.top };
}

/**
 * What the card covers, as CSS variables for the map's credits and round
 * buttons (style.css): 0 when closed or in a wide screen's free corner.
 */
function publishCoveredArea() {
  const { right, bottom } = coveredByCard();
  const root = document.documentElement.style;
  // Through the style property, which the CSP allows (unlike style="").
  root.setProperty('--quiz-right', `${right}px`);
  root.setProperty('--quiz-bottom', `${bottom}px`);
}

/**
 * "Beijing, China", or "Somewhere in China" when only the country has a
 * readable name (places/reverse.ts), or the coordinates.
 */
function placeLabel(point: PickedPoint): string {
  if (!point.name) return formatCoordinates(point.lat, point.lng);
  return point.name.includes(',') ? point.name : q('somewhereIn', { country: point.name });
}

/** The answer in °C, and for the daily, when the high is expected. */
function dailyAnswer(mode: Mode, forecast: Forecast): { celsius: number; time?: string } {
  if (mode === 'free') return { celsius: forecast.current.temperature_2m };
  const date = forecast.daily.time[0];
  const high = forecast.daily.temperature_2m_max[0] ?? forecast.current.temperature_2m;
  // The hour of the high on that date, from the hourly forecast.
  let best = -1;
  forecast.hourly.time.forEach((time, i) => {
    const temperature = forecast.hourly.temperature_2m[i];
    if (!time.startsWith(date) || temperature == null) return;
    if (best === -1 || temperature > (forecast.hourly.temperature_2m[best] ?? -Infinity)) best = i;
  });
  return {
    celsius: high,
    time: best === -1 ? undefined : formatClockTime(forecast.hourly.time[best]),
  };
}

function showReveal(
  mode: Mode,
  forecast: Forecast,
  round: Round,
  index: number,
  next: (index: number) => void,
) {
  const condition = describeWeather(forecast.current.weather_code, forecast.current.is_day === 1);
  const { time } = dailyAnswer(mode, forecast);
  const answerText =
    mode === 'daily'
      ? time
        ? q('highAt', { temp: degrees(round.answer), time })
        : q('high', { temp: degrees(round.answer) })
      : q('nowThere', { temp: degrees(round.answer) });
  const last = index + 1 >= ROUNDS;
  const answer = el('p', 'quiz__answer');
  answer.append(iconEl(condition.icon, 'quiz__icon'), ` ${answerText}`);
  show([
    el('p', 'quiz__round', q('round', { number: index + 1, total: ROUNDS })),
    el('p', 'quiz__place', placeLabel(round.point)),
    answer,
    el(
      'p',
      'quiz__verdict',
      `${round.scored.box} ${q('guessed', {
        guess: degrees(round.guess),
        off: round.scored.off,
        points: round.scored.points,
      })}`,
    ),
    button(last ? q('seeResults') : q('nextPlace'), () => next(index + 1), 'quiz__primary'),
  ]);
  keepRoundHeight();
}

// ── Results ────────────────────────────────────────────────────────────────

function showResults(mode: Mode, day: string, rounds: Round[]) {
  const total = rounds.reduce((sum, round) => sum + round.scored.points, 0);
  const boxes = rounds.map((round) => round.scored.box).join('');
  const record = mode === 'daily' ? saveDaily(day, total, boxes) : undefined;
  // Counts towards the weather level (main.ts).
  if (record) window.dispatchEvent(new CustomEvent('weatherpin:quiz', { detail: day }));

  const list = el('ol', 'quiz__places');
  for (const round of rounds) {
    const item = el('li', 'quiz__places-item');
    item.append(
      el('span', 'quiz__places-name', `${round.scored.box} ${placeLabel(round.point)}`),
      el('span', 'quiz__places-answer', `${degrees(round.answer)} (${degrees(round.guess)})`),
      button(
        q('showWeather'),
        () => {
          closeQuiz();
          host?.showWeather(round.point);
        },
        'quiz__link',
      ),
    );
    list.append(item);
  }

  show([
    el('p', 'quiz__score', `${total} / ${MAX_POINTS}`),
    el('p', 'quiz__boxes', boxes),
    el('p', 'quiz__lead', verdict(total)),
    ...(record ? summaryLines(record) : []),
    list,
    shareButton(shareText(mode, total, boxes, day)),
    button(mode === 'daily' ? q('free') : q('playAgain'), () => void play('free')),
  ]);
}

function verdict(total: number): string {
  if (total >= 450) return q('verdictTop');
  if (total >= 300) return q('verdictGood');
  if (total >= 150) return q('verdictMid');
  return q('verdictLow');
}

// ── Sharing ────────────────────────────────────────────────────────────────

/** "Weatherpin quiz #24 · 410/500 🌡️", the boxes, and a link to the quiz. */
function shareText(mode: Mode, total: number, boxes: string, day: string): string {
  const title =
    mode === 'daily'
      ? q('shareDaily', {
          number: quizNumber(day),
          score: total,
          max: MAX_POINTS,
        })
      : q('shareFree', { score: total, max: MAX_POINTS });
  return `${title} 🌡️\n${boxes}\n${window.location.origin}/#quiz`;
}

function shareButton(text: string): HTMLButtonElement {
  return button(t('Share'), async () => {
    const { say } = statusLine(host!.dialog.querySelector<HTMLElement>('.quiz__status')!);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        window.dispatchEvent(new Event('weatherpin:shared'));
        return;
      } catch (error) {
        // Closing the share sheet is a choice, not a failure.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      say(t('Copied'));
      window.dispatchEvent(new Event('weatherpin:shared'));
    } catch {
      say(t("Couldn't copy it: select the text to copy it."));
    }
  });
}

function showProblem(retry: () => void) {
  show([el('p', 'quiz__lead', q('problem')), button(t('Try again'), retry, 'quiz__primary')]);
}
