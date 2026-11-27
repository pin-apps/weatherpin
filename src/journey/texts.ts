// The weather levels' texts in every language the app speaks, side by side
// (a missing one won't compile). Here, not in the start-up language files:
// they load just after start-up for the chip's label, and with the card.
// scripts/check-i18n.mjs checks each text's {placeholders} match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

/** Level names by id (levels.ts has the ladder). */
const LEVEL_NAMES: Record<string, Texts> = {
  dewdrop: { en: 'Dewdrop', fi: 'Kastepisara', sv: 'Daggdroppe', nb: 'Duggdråpe' },
  breeze: { en: 'Breeze', fi: 'Tuulahdus', sv: 'Bris', nb: 'Bris' },
  cloud: { en: 'Cloud', fi: 'Pilvi', sv: 'Moln', nb: 'Sky' },
  shower: { en: 'Shower', fi: 'Sadekuuro', sv: 'Regnskur', nb: 'Regnbyge' },
  rainbow: { en: 'Rainbow', fi: 'Sateenkaari', sv: 'Regnbåge', nb: 'Regnbue' },
  snowflake: { en: 'Snowflake', fi: 'Lumihiutale', sv: 'Snöflinga', nb: 'Snøfnugg' },
  storm: { en: 'Storm', fi: 'Myrsky', sv: 'Storm', nb: 'Storm' },
  whirlwind: { en: 'Whirlwind', fi: 'Pyörremyrsky', sv: 'Virvelvind', nb: 'Virvelvind' },
  aurora: { en: 'Aurora', fi: 'Revontuli', sv: 'Norrsken', nb: 'Nordlys' },
  diamond: { en: 'Diamond dust', fi: 'Timanttipöly', sv: 'Diamantstoft', nb: 'Diamantstøv' },
};

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
  nextLevel: {
    en: 'Next: {level}: {needs}',
    fi: 'Seuraava: {level}: {needs}',
    sv: 'Nästa: {level}: {needs}',
    nb: 'Neste: {level}: {needs}',
  },
  morePoints: {
    en: '{count} more points',
    fi: '{count} pistettä lisää',
    sv: '{count} poäng till',
    nb: '{count} poeng til',
  },
  morePointsOne: { en: '1 more point', fi: '1 piste lisää', sv: '1 poäng till', nb: '1 poeng til' },
  moreDays: {
    en: '{count} more days of use',
    fi: '{count} käyttöpäivää lisää',
    sv: '{count} dagar till med appen',
    nb: '{count} dager til med appen',
  },
  moreDaysOne: {
    en: '1 more day of use',
    fi: '1 käyttöpäivä lisää',
    sv: '1 dag till med appen',
    nb: '1 dag til med appen',
  },
  moreBadges: {
    en: '{count} more badges',
    fi: '{count} merkkiä lisää',
    sv: '{count} märken till',
    nb: '{count} merker til',
  },
  moreBadgesOne: {
    en: '1 more badge',
    fi: '1 merkki lisää',
    sv: '1 märke till',
    nb: '1 merke til',
  },
  firstSteps: {
    en: '🎒 First steps: {done}/{total}',
    fi: '🎒 Ensiaskeleet: {done}/{total}',
    sv: '🎒 Första stegen: {done}/{total}',
    nb: '🎒 Første steg: {done}/{total}',
  },
  firstStepsDone: {
    en: '🎒 First steps: all done ✓',
    fi: '🎒 Ensiaskeleet: kaikki tehty ✓',
    sv: '🎒 Första stegen: alla klara ✓',
    nb: '🎒 Første steg: alle gjort ✓',
  },
  firstStepsHow: {
    en: 'Try these for 5 points each:',
    fi: 'Kokeile näitä, 5 pistettä kustakin:',
    sv: 'Prova dessa, 5 poäng var:',
    nb: 'Prøv disse, 5 poeng hver:',
  },
  firstVisit: {
    en: 'Your weather level: 💧 Dewdrop. Tap it to see how to grow!',
    fi: 'Sääsi taso: 💧 Kastepisara. Napauta sitä ja katso, miten kasvat!',
    sv: 'Din vädernivå: 💧 Daggdroppe. Tryck på den och se hur du växer!',
    nb: 'Værnivået ditt: 💧 Duggdråpe. Trykk på det og se hvordan du vokser!',
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
    en: 'Explored: {areas} · {countries} · {continents}',
    fi: 'Tutkittu: {areas} · {countries} · {continents}',
    sv: 'Utforskat: {areas} · {countries} · {continents}',
    nb: 'Utforsket: {areas} · {countries} · {continents}',
  },
  areas: {
    en: '{count} areas',
    fi: '{count} aluetta',
    sv: '{count} områden',
    nb: '{count} områder',
  },
  areaOne: { en: '1 area', fi: '1 alue', sv: '1 område', nb: '1 område' },
  countries: {
    en: '{count} countries',
    fi: '{count} maata',
    sv: '{count} länder',
    nb: '{count} land',
  },
  countryOne: { en: '1 country', fi: '1 maa', sv: '1 land', nb: '1 land' },
  continents: {
    en: '{count} continents',
    fi: '{count} maanosaa',
    sv: '{count} världsdelar',
    nb: '{count} verdensdeler',
  },
  continentOne: { en: '1 continent', fi: '1 maanosa', sv: '1 världsdel', nb: '1 verdensdel' },
  pointsOne: { en: '1 point', fi: '1 piste', sv: '1 poäng', nb: '1 poeng' },
  badgeCountOne: {
    en: '🏅 1 weather badge',
    fi: '🏅 1 säämerkki',
    sv: '🏅 1 vädermärke',
    nb: '🏅 1 værmerke',
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
    en: 'Points: a day of use 1 · the daily quiz 2 · a share 3 (once a day) · a new area 2 (5 a day) · a new country 10 (3 a day) · a new continent 25 · a weather badge 15 · a first step 5.',
    fi: 'Pisteet: käyttöpäivä 1 · päivän visa 2 · jakaminen 3 (kerran päivässä) · uusi alue 2 (5 päivässä) · uusi maa 10 (3 päivässä) · uusi maanosa 25 · säämerkki 15 · ensiaskel 5.',
    sv: 'Poäng: en dag med appen 1 · dagens quiz 2 · en delning 3 (en gång om dagen) · ett nytt område 2 (5 om dagen) · ett nytt land 10 (3 om dagen) · en ny världsdel 25 · ett vädermärke 15 · ett första steg 5.',
    nb: 'Poeng: en dag med appen 1 · dagens quiz 2 · en deling 3 (én gang om dagen) · et nytt område 2 (5 om dagen) · et nytt land 10 (3 om dagen) · en ny verdensdel 25 · et værmerke 15 · et første steg 5.',
  },
  allLevels: { en: 'All levels', fi: 'Kaikki tasot', sv: 'Alla nivåer', nb: 'Alle nivåer' },
  allLevelsHow: {
    en: 'Days of use count in total, not in a row: a missed day costs nothing, and a level once reached stays.',
    fi: 'Käyttöpäivät lasketaan yhteensä, ei putkeen: väliin jäänyt päivä ei maksa mitään, ja saavutettu taso pysyy.',
    sv: 'Dagar med appen räknas totalt, inte i rad: en missad dag kostar inget, och en nivå du nått behåller du.',
    nb: 'Dager med appen telles totalt, ikke på rad: en dag du hopper over koster ingenting, og et nivå du har nådd beholder du.',
  },
  needPoints: {
    en: '{count} points',
    fi: '{count} pistettä',
    sv: '{count} poäng',
    nb: '{count} poeng',
  },
  needDays: { en: '{count} days', fi: '{count} päivää', sv: '{count} dagar', nb: '{count} dager' },
  needBadges: {
    en: '{count} badges',
    fi: '{count} merkkiä',
    sv: '{count} märken',
    nb: '{count} merker',
  },
  levelStart: { en: 'the start', fi: 'alku', sv: 'starten', nb: 'starten' },
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
  pro: { en: 'Weather pro', fi: 'Sääammattilainen', sv: 'Väderproffs', nb: 'Værproff' },
  // First steps (award.ts).
  taskSearch: {
    en: 'Search for a place',
    fi: 'Hae paikkaa',
    sv: 'Sök efter en plats',
    nb: 'Søk etter et sted',
  },
  taskFavourite: {
    en: 'Save a favourite',
    fi: 'Tallenna suosikki',
    sv: 'Spara en favorit',
    nb: 'Lagre en favoritt',
  },
  taskLocate: {
    en: 'Use My location',
    fi: 'Käytä sijaintiasi',
    sv: 'Använd din plats',
    nb: 'Bruk Min posisjon',
  },
  taskRadar: {
    en: 'Turn on the rain radar',
    fi: 'Avaa sadetutka',
    sv: 'Slå på regnradarn',
    nb: 'Slå på nedbørsradaren',
  },
  taskQuiz: {
    en: 'Play the daily quiz',
    fi: 'Pelaa päivän visa',
    sv: 'Spela dagens quiz',
    nb: 'Spill dagens quiz',
  },
  taskShare: { en: 'Share something', fi: 'Jaa jotain', sv: 'Dela något', nb: 'Del noe' },
  taskPastDay: {
    en: 'See the weather on a past day',
    fi: 'Katso menneen päivän sää',
    sv: 'Se vädret en dag som varit',
    nb: 'Se været på en tidligere dag',
  },
  taskSky: {
    en: 'Open the Sky section',
    fi: 'Avaa Taivas-osio',
    sv: 'Öppna avsnittet Himlen',
    nb: 'Åpne delen Himmelen',
  },
  taskStartPlace: {
    en: 'Choose a start place',
    fi: 'Valitse aloituspaikka',
    sv: 'Välj en startplats',
    nb: 'Velg et startsted',
  },
  taskRandomPlace: {
    en: 'Try Random place',
    fi: 'Kokeile satunnaista paikkaa',
    sv: 'Prova Slumpmässig plats',
    nb: 'Prøv Tilfeldig sted',
  },
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

export function levelName(id: string): string {
  return LEVEL_NAMES[id][currentLanguage()];
}

/** "Your level: Storm, 412 of 600 points" (no "of" when points aren't what's missing). */
export function chipLabel(id: string, points: number, next: number | undefined): string {
  const level = levelName(id);
  return next === undefined
    ? journeyText('labelTop', { level, points })
    : journeyText('label', { level, points, next });
}

/** "1 point" or "12 points" (also areas, countries…): the text and its "One" form. */
export function counted(name: TextName, one: TextName, count: number, key = 'count'): string {
  return count === 1 ? journeyText(one) : journeyText(name, { [key]: count });
}

/** "Explored: 3 areas · 1 country · 1 continent". */
export function exploredText(areas: number, countries: number, continents: number): string {
  return journeyText('explored', {
    areas: counted('areas', 'areaOne', areas),
    countries: counted('countries', 'countryOne', countries),
    continents: counted('continents', 'continentOne', continents),
  });
}
