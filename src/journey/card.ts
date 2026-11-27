// "Your weather journey" (opened from the level chip, loaded on demand):
// the level, points and progress to the next one, the streak, how much of
// the world has been explored and the weather badges, earned or still to
// find. Also the short toast for a new level.

import { el, iconEl } from '../dom';
import { formatCoordinates } from '../format';
import { t } from '../i18n';
import { sharePicture } from '../share-picture';
import { statusLine } from '../status-line';
import type { ShownWeather } from './chip';
import { SECRETS, TASKS, savedJourney, type AwardNews, type Journey } from './award';
import { LEVELS, levelIndex, progressToNext, type JourneyTotals, type Level } from './levels';
import { counted, exploredText, journeyText, levelName, type TextName } from './texts';

const BADGES: [id: TextName, emoji: string][] = [
  ['frost', '🥶'],
  ['heat', '🔥'],
  ['thunder', '⛈️'],
  ['polarNight', '🌑'],
  ['midnightSun', '☀️'],
  ['aurora', '🌌'],
  ['belowSea', '🌊'],
  ['high', '🏔️'],
];
const SECRET_EMOJI: Record<string, string> = { sauna: '🧖', santa: '🎅', record: '🏆' };
const TOAST_MS = 4000;

/** What the next level still needs (0 when met). */
function stillNeeded(totals: JourneyTotals): {
  next?: Level;
  points: number;
  days: number;
  badges: number;
} {
  const next = LEVELS[levelIndex(totals) + 1] as Level | undefined;
  if (!next) return { points: 0, days: 0, badges: 0 };
  return {
    next,
    points: Math.max(0, next.points - totals.points),
    days: Math.max(0, next.days - totals.daysUsed),
    badges: Math.max(0, next.badges - totals.badges.length),
  };
}

/** "Next: 🌈 Rainbow: 30 more points, 4 more days of use", or the top. */
function nextText(journey: Journey): string {
  const { next, points, days, badges } = stillNeeded(journey);
  if (!next) return journeyText('top');
  const needs = [
    points === 1
      ? journeyText('morePointsOne')
      : points > 0
        ? journeyText('morePoints', { count: points })
        : '',
    days === 1
      ? journeyText('moreDaysOne')
      : days > 0
        ? journeyText('moreDays', { count: days })
        : '',
    badges === 1
      ? journeyText('moreBadgesOne')
      : badges > 0
        ? journeyText('moreBadges', { count: badges })
        : '',
  ].filter(Boolean);
  return journeyText('nextLevel', {
    level: `${next.emoji} ${levelName(next.id)}`,
    needs: needs.join(', '),
  });
}

/**
 * Every level and what it needs ("🌈 Rainbow: 80 points · 14 days"),
 * reached ones ticked and the current one marked.
 */
function allLevels(journey: Journey): HTMLElement[] {
  const current = levelIndex(journey);
  const list = el('ol', 'journey__levels');
  LEVELS.forEach((level, i) => {
    const needs = [
      level.points > 0 ? journeyText('needPoints', { count: level.points }) : '',
      level.days > 0 ? journeyText('needDays', { count: level.days }) : '',
      level.badges > 0 ? journeyText('needBadges', { count: level.badges }) : '',
    ].filter(Boolean);
    const classes = [
      'journey__level-row',
      i <= current ? 'is-reached' : '',
      i === current ? 'is-current' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const item = el('li', classes);
    item.append(
      iconEl(i <= current ? '✓' : '○', 'journey__task-mark'),
      ` ${level.emoji} `,
      el('strong', undefined, levelName(level.id)),
      `: ${needs.length > 0 ? needs.join(' · ') : journeyText('levelStart')}`,
    );
    if (i === current) item.setAttribute('aria-current', 'step');
    list.append(item);
  });
  return [
    el('h3', undefined, journeyText('allLevels')),
    list,
    el('p', 'settings__hint', journeyText('allLevelsHow')),
  ];
}

/** The first steps: done ones ticked; one line once all are done. */
function firstSteps(journey: Journey): HTMLElement[] {
  const done = TASKS.filter((task) => journey.tasks.includes(task)).length;
  if (done === TASKS.length) return [el('p', 'journey__steps', journeyText('firstStepsDone'))];
  const list = el('ul', 'journey__tasks');
  for (const task of TASKS) {
    const isDone = journey.tasks.includes(task);
    const name = `task${task[0].toUpperCase()}${task.slice(1)}` as TextName;
    const item = el('li', isDone ? 'journey__task is-done' : 'journey__task');
    item.append(iconEl(isDone ? '✓' : '○', 'journey__task-mark'), ` ${journeyText(name)}`);
    list.append(item);
  }
  return [
    el('h3', undefined, journeyText('firstSteps', { done, total: TASKS.length })),
    el('p', 'settings__hint', journeyText('firstStepsHow')),
    list,
  ];
}

let dialog: HTMLDialogElement | undefined;
let weather: ShownWeather = () => undefined;

function createDialog(): HTMLDialogElement {
  const box = el('dialog', 'settings journey');
  box.setAttribute('aria-labelledby', 'journey-title');
  const close = el('button', 'about__close');
  close.type = 'button';
  close.setAttribute('aria-label', t('Close'));
  close.append(el('span', undefined, '×'));
  close.firstElementChild!.setAttribute('aria-hidden', 'true');
  close.addEventListener('click', () => box.close());
  // A tap outside the card closes it, like Settings.
  box.addEventListener('click', (event) => {
    if (event.target === box) box.close();
  });
  const title = el('h2', 'about__title', journeyText('title'));
  title.id = 'journey-title';
  const header = el('header', 'about__header');
  header.append(title, close);
  const content = el('div', 'settings__content');
  content.append(header, el('div', 'journey__body'));
  box.append(content);
  document.body.append(box);
  return box;
}

function fill(body: HTMLElement) {
  const journey = savedJourney();
  const index = levelIndex(journey);
  const level = LEVELS[index];
  const next = LEVELS[index + 1] as (typeof LEVELS)[number] | undefined;
  const top = index === LEVELS.length - 1;

  const heading = el('p', 'journey__level');
  heading.append(iconEl(level.emoji, 'journey__emoji'), ` ${levelName(level.id)}`);
  const points = el(
    'p',
    'journey__points',
    counted('points', 'pointsOne', journey.points, 'points'),
  );

  const parts: HTMLElement[] = [heading, points];
  if (next) {
    const progress = el('progress', 'journey__progress');
    progress.max = 100;
    progress.value = Math.round(progressToNext(journey) * 100);
    const nextLine = el('p', 'journey__next', nextText(journey));
    nextLine.id = 'journey-next';
    progress.setAttribute('aria-labelledby', 'journey-next');
    parts.push(progress, nextLine);
  } else if (top) {
    parts.push(el('p', 'journey__next', journeyText('top')));
  }
  parts.push(
    el(
      'p',
      'journey__days',
      journey.daysUsed === 1
        ? journeyText('daysUsedOne')
        : journeyText('daysUsed', { days: journey.daysUsed }),
    ),
  );
  if (journey.streak > 0) {
    parts.push(
      el(
        'p',
        'journey__streak',
        journey.streak === 1
          ? journeyText('streakOne')
          : journeyText('streak', { days: journey.streak }),
      ),
    );
  }
  parts.push(
    el(
      'p',
      'journey__explored',
      exploredText(journey.areas.length, journey.countries.length, journey.continents.length),
    ),
  );

  const badges = el('ul', 'journey__badges');
  for (const [id, emoji] of BADGES) {
    const earned = journey.badges.includes(id);
    const item = el('li', earned ? 'journey__badge is-earned' : 'journey__badge');
    item.append(iconEl(emoji, 'journey__badge-icon'), ` ${journeyText(id)}`);
    if (!earned) item.append(el('span', 'journey__not-yet', ` · ${journeyText('notYet')}`));
    badges.append(item);
  }
  // Secret badges: only the ones found are named.
  for (const id of SECRETS.filter((secret) => journey.badges.includes(secret))) {
    const item = el('li', 'journey__badge is-earned');
    item.append(iconEl(SECRET_EMOJI[id], 'journey__badge-icon'), ` ${journeyText(id as TextName)}`);
    badges.append(item);
  }
  if (journey.badges.includes('pro')) {
    const item = el('li', 'journey__badge is-earned');
    item.append(iconEl('🎓', 'journey__badge-icon'), ` ${journeyText('pro')}`);
    badges.append(item);
  }
  const secretsLeft = SECRETS.filter((secret) => !journey.badges.includes(secret)).length;
  const share = el('button', 'button journey__share', journeyText('share'));
  share.type = 'button';
  const status = el('p', 'settings__hint journey__status');
  status.setAttribute('role', 'status');
  share.addEventListener('click', () => void shareLevel(statusLine(status).say));
  parts.push(share, status, ...firstSteps(journey));
  parts.push(
    el('h3', undefined, journeyText('badges')),
    badges,
    ...(secretsLeft > 0
      ? [
          el(
            'p',
            'journey__secrets',
            secretsLeft === 1
              ? journeyText('secretsLeftOne')
              : journeyText('secretsLeft', { count: secretsLeft }),
          ),
        ]
      : []),
    ...allLevels(journey),
    el('p', 'settings__hint', journeyText('how')),
    el('p', 'settings__hint', journeyText('device')),
  );
  body.replaceChildren(...parts);
}

/** The level as a picture (postcard.ts), to the share sheet or downloaded. */
async function shareLevel(say: (text: string) => void) {
  const journey = savedJourney();
  const index = levelIndex(journey);
  const level = LEVELS[index];
  const shown = weather();
  let picture: Blob;
  try {
    const { drawLevelCard } = await import('../postcard');
    picture = await drawLevelCard({
      heading: journeyText('shareTitle'),
      emoji: level.emoji,
      level: levelName(level.id),
      points: counted('points', 'pointsOne', journey.points, 'points'),
      progress: progressToNext(journey),
      next: nextText(journey),
      lines: [
        counted('badgeCount', 'badgeCountOne', journey.badges.length),
        exploredText(journey.areas.length, journey.countries.length, journey.continents.length),
      ],
      weather: shown && {
        place: shown.point.name ?? formatCoordinates(shown.point.lat, shown.point.lng),
        forecast: shown.forecast,
      },
    });
  } catch {
    say(journeyText('pictureFailed'));
    return;
  }
  await sharePicture(picture, 'weatherpin-level.png', journeyText('shareTitle'), say);
}

export function openJourney(shownWeather?: ShownWeather): void {
  if (shownWeather) weather = shownWeather;
  dialog ??= createDialog();
  fill(dialog.querySelector<HTMLElement>('.journey__body')!);
  if (!dialog.open) dialog.showModal();
}

/** "New level: ☁️ Cloud!" (and a secret badge found) for a few seconds. */
export function toast(news: AwardNews[]): void {
  if (news.length === 0) return;
  const index = levelIndex(savedJourney());
  const text = news
    .map((item) => {
      if (item === 'level-up') {
        return journeyText('levelUp', {
          level: `${LEVELS[index].emoji} ${levelName(LEVELS[index].id)}`,
        });
      }
      if (item === 'welcome-back') return journeyText('welcomeBack');
      if (item === 'first-visit') return journeyText('firstVisit');
      const secret = item.slice('secret:'.length);
      return journeyText('secretFound', {
        badge: `${SECRET_EMOJI[secret]} ${journeyText(secret as TextName)}`,
      });
    })
    .join(' ');
  document.querySelector('.journey-toast')?.remove();
  const box = el('p', 'journey-toast');
  box.setAttribute('role', 'status');
  document.body.append(box);
  // Filled after it's in the page, so screen readers announce it.
  requestAnimationFrame(() => (box.textContent = text));
  // The chip lights up only for a new level.
  const levelUp = news.includes('level-up');
  if (levelUp) document.querySelector('.level-chip')?.classList.add('is-new-level');
  window.setTimeout(() => {
    box.remove();
    document.querySelector('.level-chip')?.classList.remove('is-new-level');
  }, TOAST_MS);
}
