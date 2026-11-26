// The weather levels' texts in every language the app speaks, side by side
// (a missing one won't compile). Here, not in the start-up language files:
// they load just after start-up for the chip's label, and with the card.
// scripts/check-i18n.mjs checks each text's {placeholders} match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

/** Level names, in order (chip.ts has the points). */
const LEVEL_NAMES: Texts[] = [
  { en: 'Breeze', fi: 'Tuulahdus', sv: 'Bris', nb: 'Bris' },
  { en: 'Cloud', fi: 'Pilvi', sv: 'Moln', nb: 'Sky' },
  { en: 'Storm', fi: 'Myrsky', sv: 'Storm', nb: 'Storm' },
  { en: 'Aurora', fi: 'Revontuli', sv: 'Norrsken', nb: 'Nordlys' },
  { en: 'Diamond dust', fi: 'Timanttipöly', sv: 'Diamantstoft', nb: 'Diamantstøv' },
];

const TEXTS = {
  label: {
    en: 'Your level: {level}, {points} of {next} points',
    fi: 'Tasosi: {level}, {points}/{next} pistettä',
    sv: 'Din nivå: {level}, {points} av {next} poäng',
    nb: 'Ditt nivå: {level}, {points} av {next} poeng',
  },
  labelTop: {
    en: 'Your level: {level}, {points} points',
    fi: 'Tasosi: {level}, {points} pistettä',
    sv: 'Din nivå: {level}, {points} poäng',
    nb: 'Ditt nivå: {level}, {points} poeng',
  },
  title: {
    en: 'Your weather journey',
    fi: 'Sääseikkailusi',
    sv: 'Din väderresa',
    nb: 'Din værreise',
  },
  points: {
    en: '{points} points',
    fi: '{points} pistettä',
    sv: '{points} poäng',
    nb: '{points} poeng',
  },
  next: {
    en: 'Next: {level} at {points} points',
    fi: 'Seuraava: {level}, {points} pistettä',
    sv: 'Nästa: {level} vid {points} poäng',
    nb: 'Neste: {level} ved {points} poeng',
  },
  needBadges: {
    en: 'and {count} weather badges ({have}/{count})',
    fi: 'ja {count} säämerkkiä ({have}/{count})',
    sv: 'och {count} vädermärken ({have}/{count})',
    nb: 'og {count} værmerker ({have}/{count})',
  },
  needDays: {
    en: 'and {days} days of use ({have}/{days})',
    fi: 'ja {days} käyttöpäivää ({have}/{days})',
    sv: 'och {days} dagar med appen ({have}/{days})',
    nb: 'og {days} dager med appen ({have}/{days})',
  },
  daysUsed: {
    en: '📅 {days} days of use',
    fi: '📅 {days} käyttöpäivää',
    sv: '📅 {days} dagar med appen',
    nb: '📅 {days} dager med appen',
  },
  daysUsedOne: {
    en: '📅 1 day of use',
    fi: '📅 1 käyttöpäivä',
    sv: '📅 1 dag med appen',
    nb: '📅 1 dag med appen',
  },
  secretsLeft: {
    en: '🔒 {count} secret badges still to find',
    fi: '🔒 {count} salaista merkkiä vielä löytämättä',
    sv: '🔒 {count} hemliga märken kvar att hitta',
    nb: '🔒 {count} hemmelige merker igjen å finne',
  },
  secretsLeftOne: {
    en: '🔒 1 secret badge still to find',
    fi: '🔒 1 salainen merkki vielä löytämättä',
    sv: '🔒 1 hemligt märke kvar att hitta',
    nb: '🔒 1 hemmelig merke igjen å finne',
  },
  secretFound: {
    en: 'Secret badge found: {badge}!',
    fi: 'Salainen merkki löytyi: {badge}!',
    sv: 'Hemligt märke hittat: {badge}!',
    nb: 'Hemmelig merke funnet: {badge}!',
  },
  top: {
    en: 'The top level. Well done!',
    fi: 'Korkein taso. Hienoa!',
    sv: 'Högsta nivån. Bra jobbat!',
    nb: 'Høyeste nivå. Godt jobbet!',
  },
  streak: {
    en: '🔥 {days} days in a row',
    fi: '🔥 {days} päivää putkeen',
    sv: '🔥 {days} dagar i rad',
    nb: '🔥 {days} dager på rad',
  },
  streakOne: {
    en: '🔥 1 day in a row',
    fi: '🔥 1 päivä putkeen',
    sv: '🔥 1 dag i rad',
    nb: '🔥 1 dag på rad',
  },
  explored: {
    en: 'Explored: {areas} areas · {countries} countries · {continents} continents',
    fi: 'Tutkittu: {areas} aluetta · {countries} maata · {continents} maanosaa',
    sv: 'Utforskat: {areas} områden · {countries} länder · {continents} världsdelar',
    nb: 'Utforsket: {areas} områder · {countries} land · {continents} verdensdeler',
  },
  badges: {
    en: 'Weather badges',
    fi: 'Säämerkit',
    sv: 'Vädermärken',
    nb: 'Værmerker',
  },
  notYet: {
    en: 'not yet',
    fi: 'ei vielä',
    sv: 'inte än',
    nb: 'ikke ennå',
  },
  how: {
    en: 'Points: a day of use 1 · the daily quiz 2 · a share 3 (once a day) · a new area 2 (5 a day) · a new country 10 (3 a day) · a new continent 25 · a weather badge 15. Storm also needs 7 days of use, Aurora 30, Diamond dust 100 and 5 badges.',
    fi: 'Pisteet: käyttöpäivä 1 · päivän visa 2 · jakaminen 3 (kerran päivässä) · uusi alue 2 (5 päivässä) · uusi maa 10 (3 päivässä) · uusi maanosa 25 · säämerkki 15. Myrsky vaatii lisäksi 7 käyttöpäivää, Revontuli 30, Timanttipöly 100 ja 5 merkkiä.',
    sv: 'Poäng: en dag med appen 1 · dagens quiz 2 · en delning 3 (en gång om dagen) · ett nytt område 2 (5 om dagen) · ett nytt land 10 (3 om dagen) · en ny världsdel 25 · ett vädermärke 15. Storm kräver också 7 dagar med appen, Norrsken 30, Diamantstoft 100 och 5 märken.',
    nb: 'Poeng: en dag med appen 1 · dagens quiz 2 · en deling 3 (én gang om dagen) · et nytt område 2 (5 om dagen) · et nytt land 10 (3 om dagen) · en ny verdensdel 25 · et værmerke 15. Storm krever også 7 dager med appen, Nordlys 30, Diamantstøv 100 og 5 merker.',
  },
  device: {
    en: 'Saved only on this device. Clearing saved data starts it again.',
    fi: 'Tallennettu vain tälle laitteelle. Tallennettujen tietojen tyhjennys aloittaa alusta.',
    sv: 'Sparas bara på den här enheten. Att rensa sparade data börjar om från början.',
    nb: 'Lagres bare på denne enheten. Å slette lagrede data starter på nytt.',
  },
  levelUp: {
    en: 'New level: {level}!',
    fi: 'Uusi taso: {level}!',
    sv: 'Ny nivå: {level}!',
    nb: 'Nytt nivå: {level}!',
  },
  welcomeBack: {
    en: 'Welcome back! Your level was resting 💤',
    fi: 'Tervetuloa takaisin! Tasosi lepäsi 💤',
    sv: 'Välkommen tillbaka! Din nivå har vilat 💤',
    nb: 'Velkommen tilbake! Nivået ditt har hvilt 💤',
  },
  share: {
    en: '📸 Share my level',
    fi: '📸 Jaa tasosi',
    sv: '📸 Dela din nivå',
    nb: '📸 Del nivået ditt',
  },
  shareTitle: {
    en: 'My Weatherpin level',
    fi: 'Weatherpin-tasoni',
    sv: 'Min Weatherpin-nivå',
    nb: 'Mitt Weatherpin-nivå',
  },
  badgeCount: {
    en: '🏅 {count} weather badges',
    fi: '🏅 {count} säämerkkiä',
    sv: '🏅 {count} vädermärken',
    nb: '🏅 {count} værmerker',
  },
  pictureFailed: {
    en: "Couldn't make the picture",
    fi: 'Kuvaa ei saatu tehtyä',
    sv: 'Det gick inte att göra bilden',
    nb: 'Klarte ikke å lage bildet',
  },
  // Weather badges (award.ts decides when each is earned).
  frost: { en: '−30° frost', fi: '−30° pakkanen', sv: '−30° kyla', nb: '−30° kulde' },
  heat: { en: '+40° heat', fi: '+40° helle', sv: '+40° värme', nb: '+40° hete' },
  thunder: { en: 'Thunderstorm', fi: 'Ukkonen', sv: 'Åska', nb: 'Tordenvær' },
  polarNight: { en: 'Polar night', fi: 'Kaamos', sv: 'Polarnatt', nb: 'Mørketid' },
  midnightSun: { en: 'Midnight sun', fi: 'Yötön yö', sv: 'Midnattssol', nb: 'Midnattssol' },
  aurora: { en: 'Northern lights', fi: 'Revontulet', sv: 'Norrsken', nb: 'Nordlys' },
  belowSea: {
    en: 'Below sea level',
    fi: 'Merenpinnan alapuolella',
    sv: 'Under havsytan',
    nb: 'Under havnivå',
  },
  high: { en: 'Above 3,000 m', fi: 'Yli 3 000 m', sv: 'Över 3 000 m', nb: 'Over 3 000 m' },
  // Secret badges: the easter eggs. Named only once found.
  sauna: { en: 'Löyly master', fi: 'Löylymestari', sv: 'Bastumästare', nb: 'Badstuemester' },
  santa: {
    en: "Santa's helper",
    fi: 'Joulupukin apuri',
    sv: 'Tomtens hjälpare',
    nb: 'Julenissens hjelper',
  },
  record: { en: 'Record hunter', fi: 'Ennätysmetsästäjä', sv: 'Rekordjägare', nb: 'Rekordjeger' },
} satisfies Record<string, Texts>;

export type TextName = keyof typeof TEXTS;

/** A levels text in the app's language, with {placeholders} filled in. */
export function journeyText(name: TextName, values: Record<string, string | number> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}

export function levelName(index: number): string {
  return LEVEL_NAMES[index][currentLanguage()];
}

/** "Your level: Storm, 412 of 600 points" (no "of" at the top level). */
export function chipLabel(index: number, points: number, next: number | undefined): string {
  const level = levelName(index);
  return next === undefined
    ? journeyText('labelTop', { level, points })
    : journeyText('label', { level, points, next });
}
