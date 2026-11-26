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
import { SECRETS, savedJourney, type AwardNews, type Journey } from './award';
import { LEVELS, TOP_LEVEL_BADGES, levelIndex, progressToNext } from './levels';
import { journeyText, levelName, type TextName } from './texts';

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

/** "Next: 🌌 Aurora at 600 points and 30 days of use (12/30)", or the top. */
function nextText(journey: Journey): string {
  const index = levelIndex(journey);
  const next = LEVELS[index + 1] as (typeof LEVELS)[number] | undefined;
  if (!next) return journeyText('top');
  let text = journeyText('next', {
    level: `${next.emoji} ${levelName(index + 1)}`,
    points: next.points,
  });
  if (next.days > 0) {
    text += ` ${journeyText('needDays', { days: next.days, have: Math.min(journey.daysUsed, next.days) })}`;
  }
  if (index + 1 === LEVELS.length - 1) {
    text += ` ${journeyText('needBadges', { count: TOP_LEVEL_BADGES, have: journey.badges.length })}`;
  }
  return text;
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
  heading.append(iconEl(level.emoji, 'journey__emoji'), ` ${levelName(index)}`);
  const points = el('p', 'journey__points', journeyText('points', { points: journey.points }));

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
      journeyText('explored', {
        areas: journey.areas.length,
        countries: journey.countries.length,
        continents: journey.continents.length,
      }),
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
  const secretsLeft = SECRETS.filter((secret) => !journey.badges.includes(secret)).length;
  const share = el('button', 'button journey__share', journeyText('share'));
  share.type = 'button';
  const status = el('p', 'settings__hint journey__status');
  status.setAttribute('role', 'status');
  share.addEventListener('click', () => void shareLevel(statusLine(status).say));
  parts.push(share, status);
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
  const next = LEVELS[index + 1] as (typeof LEVELS)[number] | undefined;
  const shown = weather();
  let picture: Blob;
  try {
    const { drawLevelCard } = await import('../postcard');
    picture = await drawLevelCard({
      heading: journeyText('shareTitle'),
      emoji: level.emoji,
      level: levelName(index),
      points: journeyText('points', { points: journey.points }),
      progress: next
        ? Math.min(1, (journey.points - level.points) / (next.points - level.points))
        : 1,
      next: next
        ? journeyText('next', {
            level: `${next.emoji} ${levelName(index + 1)}`,
            points: next.points,
          })
        : journeyText('top'),
      lines: [
        journeyText('badgeCount', { count: journey.badges.length }),
        journeyText('explored', {
          areas: journey.areas.length,
          countries: journey.countries.length,
          continents: journey.continents.length,
        }),
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
        return journeyText('levelUp', { level: `${LEVELS[index].emoji} ${levelName(index)}` });
      }
      if (item === 'welcome-back') return journeyText('welcomeBack');
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
  document.querySelector('.level-chip')?.classList.add('is-new-level');
  window.setTimeout(() => {
    box.remove();
    document.querySelector('.level-chip')?.classList.remove('is-new-level');
  }, TOAST_MS);
}
