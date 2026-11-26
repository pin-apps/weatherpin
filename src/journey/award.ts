// Points towards the weather levels (chip.ts), worked out on demand and
// saved on the device only. Levels never go down: points only add up.
// Exploring counts most: new ~50 km areas (a few a day, so tapping the map
// at random isn't the way up), new countries and continents, and weather
// badges for having looked at a place in extreme weather.

import { readStored, writeStored } from '../storage';
import { JOURNEY_KEY, levelIndex, savedTotals, type JourneyEvent } from './levels';

const POINTS = { day: 1, quiz: 2, share: 3, area: 2, country: 10, continent: 25, badge: 15 };
/** New areas and new countries that count in a day. */
const AREAS_PER_DAY = 5;
const COUNTRIES_PER_DAY = 3;
/** Areas kept (the oldest go): enough for years, small to store. */
const MAX_AREAS = 2000;
/** An area is a square of half a degree: about 55 km north to south. */
const AREA_STEP = 0.5;
/** Secret badges: the easter eggs (sauna, Santa, a weather record place). */
export const SECRETS = ['sauna', 'santa', 'record'];
/** Away this long, the level was "resting". */
const RESTING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Journey {
  version: 2;
  points: number;
  /** Days the app has been used, and the highest level reached. */
  daysUsed: number;
  reached: number;
  /** Badge ids (texts.ts names them). */
  badges: string[];
  /** The last day the app was used (this device's date) and days in a row. */
  day?: string;
  streak: number;
  areas: string[];
  areaDay?: string;
  areasToday: number;
  /** ISO country codes ("FI"), when the place's country is known. */
  countries: string[];
  countryDay?: string;
  countriesToday: number;
  continents: string[];
  shareDay?: string;
  quizDay?: string;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function savedJourney(): Journey {
  const saved = (readStored(JOURNEY_KEY) ?? {}) as Partial<Journey>;
  const number = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
  // Days of use and the level reached (kept from before days counted).
  const { daysUsed, reached } = savedTotals();
  return {
    version: 2,
    points: number(saved.points),
    daysUsed,
    reached,
    badges: strings(saved.badges),
    day: text(saved.day),
    streak: number(saved.streak),
    areas: strings(saved.areas),
    areaDay: text(saved.areaDay),
    areasToday: number(saved.areasToday),
    countries: strings(saved.countries),
    countryDay: text(saved.countryDay),
    countriesToday: number(saved.countriesToday),
    continents: strings(saved.continents),
    shareDay: text(saved.shareDay),
    quizDay: text(saved.quizDay),
  };
}

/** This device's date, "2026-11-26". */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** The continent of a place from its time zone ("Europe/Oslo"). */
export function continentOf(timezone: string, lat: number, lng: number): string | undefined {
  const area = timezone.split('/')[0];
  if (area === 'America') return lat < 12.5 && lng > -79 ? 'south-america' : 'north-america';
  if (area === 'Australia' || area === 'Pacific') return 'oceania';
  if (area === 'Arctic') return 'europe';
  if (['Europe', 'Africa', 'Asia', 'Antarctica'].includes(area)) return area.toLowerCase();
  // Atlantic and Indian Ocean islands: no continent.
  return undefined;
}

/** The weather badges a place earns now. */
export function badgesFor(event: Extract<JourneyEvent, { kind: 'place' }>): string[] {
  const badges: string[] = [];
  if (event.temperature <= -30) badges.push('frost');
  if (event.temperature >= 40) badges.push('heat');
  if (event.weatherCode >= 95) badges.push('thunder');
  if (event.daylightSeconds === 0) badges.push('polarNight');
  if (event.daylightSeconds != null && event.daylightSeconds >= 86340) badges.push('midnightSun');
  if (event.elevation !== undefined && event.elevation < 0) badges.push('belowSea');
  if (event.elevation !== undefined && event.elevation >= 3000) badges.push('high');
  return badges;
}

/** What's news for the toast: a secret badge, a new level, back after a while. */
export type AwardNews = 'level-up' | 'welcome-back' | `secret:${string}`;

/** Adds the points `event` earns, saves, and says whether that's news. */
export function award(event: JourneyEvent): AwardNews[] {
  const journey = savedJourney();
  const before = levelIndex(journey);
  const day = today();
  let welcomeBack = false;
  let secret: string | undefined;
  const badge = (id: string) => {
    if (journey.badges.includes(id)) return;
    journey.badges.push(id);
    journey.points += POINTS.badge;
  };

  switch (event.kind) {
    case 'day':
      if (journey.day === day) break;
      if (journey.day && daysBetween(journey.day, day) >= RESTING_DAYS) welcomeBack = true;
      journey.streak = journey.day && daysBetween(journey.day, day) === 1 ? journey.streak + 1 : 1;
      journey.day = day;
      journey.daysUsed++;
      journey.points += POINTS.day;
      break;
    case 'share':
      if (journey.shareDay === day) break;
      journey.shareDay = day;
      journey.points += POINTS.share;
      break;
    case 'quiz':
      if (journey.quizDay === event.day) break;
      journey.quizDay = event.day;
      journey.points += POINTS.quiz;
      break;
    case 'aurora':
      badge('aurora');
      break;
    case 'country':
      if (journey.countryDay !== day) {
        journey.countryDay = day;
        journey.countriesToday = 0;
      }
      if (journey.countries.includes(event.code)) break;
      if (journey.countriesToday >= COUNTRIES_PER_DAY) break;
      journey.countries.push(event.code);
      journey.countriesToday++;
      journey.points += POINTS.country;
      break;
    case 'secret':
      if (!SECRETS.includes(event.id) || journey.badges.includes(event.id)) break;
      badge(event.id);
      secret = event.id;
      break;
    case 'place': {
      if (journey.areaDay !== day) {
        journey.areaDay = day;
        journey.areasToday = 0;
      }
      const area = `${Math.floor(event.lat / AREA_STEP)},${Math.floor(event.lng / AREA_STEP)}`;
      if (!journey.areas.includes(area) && journey.areasToday < AREAS_PER_DAY) {
        journey.areas = [...journey.areas, area].slice(-MAX_AREAS);
        journey.areasToday++;
        journey.points += POINTS.area;
      }
      const continent = continentOf(event.timezone, event.lat, event.lng);
      if (continent && !journey.continents.includes(continent)) {
        journey.continents.push(continent);
        journey.points += POINTS.continent;
      }
      badgesFor(event).forEach(badge);
      break;
    }
  }

  const after = levelIndex(journey);
  journey.reached = Math.max(journey.reached, after);
  writeStored(JOURNEY_KEY, journey);
  const news: AwardNews[] = [];
  if (secret) news.push(`secret:${secret}`);
  if (after > before) news.push('level-up');
  else if (welcomeBack) news.push('welcome-back');
  return news;
}
