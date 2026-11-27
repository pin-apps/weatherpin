// The balloon's texts, in every language the app speaks, side by side (a
// missing one won't compile). Kept here, not in the start-up language
// files: they load with the balloon, only when it's used.
// scripts/check-i18n.mjs checks each text's {placeholders} match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

const TEXTS = {
  launchTitle: {
    en: 'Launch a balloon',
    fi: 'Lähetä pallo matkaan',
    sv: 'Skicka iväg en ballong',
    nb: 'Send av gårde en ballong',
  },
  launchLead: {
    en: 'From {place}, now. It rides the forecast winds for up to 5 days. You choose only the height: each height has its own winds.',
    fi: 'Paikasta {place}, nyt. Pallo kulkee ennustettujen tuulten mukana enintään 5 päivää. Valitset vain korkeuden: joka korkeudella tuulee omalla tavallaan.',
    sv: 'Från {place}, nu. Den följer prognosens vindar i upp till 5 dagar. Du väljer bara höjden: varje höjd har sina egna vindar.',
    nb: 'Fra {place}, nå. Den følger vindene i værvarselet i opptil 5 dager. Du velger bare høyden: hver høyde har sine egne vinder.',
  },
  height: { en: 'Height', fi: 'Korkeus', sv: 'Höjd', nb: 'Høyde' },
  low: {
    en: 'Low · {height}',
    fi: 'Matala · {height}',
    sv: 'Låg · {height}',
    nb: 'Lav · {height}',
  },
  middle: {
    en: 'Middle · {height}',
    fi: 'Keskikorkea · {height}',
    sv: 'Mellan · {height}',
    nb: 'Middels · {height}',
  },
  high: {
    en: 'High · {height}',
    fi: 'Korkea · {height}',
    sv: 'Hög · {height}',
    nb: 'Høy · {height}',
  },
  lowHint: {
    en: 'Slow and steady',
    fi: 'Hidas ja tasainen',
    sv: 'Långsam och stadig',
    nb: 'Sakte og stødig',
  },
  middleHint: {
    en: 'A bit of both',
    fi: 'Vähän molempia',
    sv: 'Lite av båda',
    nb: 'Litt av begge',
  },
  highHint: {
    en: 'Fast, but the wind can tear it',
    fi: 'Nopea, mutta tuuli voi repiä sen',
    sv: 'Snabb, men vinden kan slita sönder den',
    nb: 'Rask, men vinden kan rive den i stykker',
  },
  windNow: {
    en: 'now {speed} {from}',
    fi: 'nyt {speed} {from}',
    sv: 'nu {speed} {from}',
    nb: 'nå {speed} {from}',
  },
  checkingWinds: {
    en: 'Checking the winds…',
    fi: 'Tarkistetaan tuulia…',
    sv: 'Kollar vindarna…',
    nb: 'Sjekker vindene…',
  },
  windsFailed: {
    en: "Couldn't get the winds. Try again in a moment.",
    fi: 'Tuulia ei saatu haettua. Yritä hetken päästä uudelleen.',
    sv: 'Kunde inte hämta vindarna. Försök igen om en stund.',
    nb: 'Fikk ikke hentet vindene. Prøv igjen om litt.',
  },
  nameLabel: {
    en: 'Balloon name (optional)',
    fi: 'Pallon nimi (vapaaehtoinen)',
    sv: 'Ballongens namn (valfritt)',
    nb: 'Ballongens navn (valgfritt)',
  },
  colour: { en: 'Colour', fi: 'Väri', sv: 'Färg', nb: 'Farge' },
  red: { en: 'Red', fi: 'Punainen', sv: 'Röd', nb: 'Rød' },
  blue: { en: 'Blue', fi: 'Sininen', sv: 'Blå', nb: 'Blå' },
  yellow: { en: 'Yellow', fi: 'Keltainen', sv: 'Gul', nb: 'Gul' },
  green: { en: 'Green', fi: 'Vihreä', sv: 'Grön', nb: 'Grønn' },
  launch: { en: 'Launch', fi: 'Matkaan!', sv: 'Iväg!', nb: 'Av gårde!' },
  game: {
    en: 'A game with forecast winds, not a flight forecast.',
    fi: 'Leikki ennustetuilla tuulilla, ei lentoennuste.',
    sv: 'En lek med prognosens vindar, inte en flygprognos.',
    nb: 'En lek med vindene i værvarselet, ikke et flyvarsel.',
  },
  checkingWay: {
    en: 'Checking the winds along the way…',
    fi: 'Tarkistetaan tuulia matkan varrelta…',
    sv: 'Kollar vindarna längs vägen…',
    nb: 'Sjekker vindene underveis…',
  },
  yourBalloon: { en: 'Your balloon', fi: 'Pallosi', sv: 'Din ballong', nb: 'Ballongen din' },
  aBalloon: { en: 'A balloon', fi: 'Pallo', sv: 'En ballong', nb: 'En ballong' },
  progress: {
    en: 'Day {day} · {hours} h · {distance}',
    fi: 'Päivä {day} · {hours} h · {distance}',
    sv: 'Dag {day} · {hours} h · {distance}',
    nb: 'Dag {day} · {hours} t · {distance}',
  },
  upThere: {
    en: '{height} up: {temperature}, wind {speed} {from}, {sky}',
    fi: '{height} ylhäällä: {temperature}, tuuli {speed} {from}, {sky}',
    sv: '{height} upp: {temperature}, vind {speed} {from}, {sky}',
    nb: '{height} oppe: {temperature}, vind {speed} {from}, {sky}',
  },
  inCloud: {
    en: 'in cloud ({percent})',
    fi: 'pilvessä ({percent})',
    sv: 'i moln ({percent})',
    nb: 'i skyer ({percent})',
  },
  clearAround: { en: 'clear around', fi: 'selkeää', sv: 'klart runt om', nb: 'klart rundt' },
  below: {
    en: 'Below: {weather}, {temperature}',
    fi: 'Alla: {weather}, {temperature}',
    sv: 'Nedanför: {weather}, {temperature}',
    nb: 'Under: {weather}, {temperature}',
  },
  pause: { en: 'Pause', fi: 'Tauko', sv: 'Paus', nb: 'Pause' },
  resume: { en: 'Continue', fi: 'Jatka', sv: 'Fortsätt', nb: 'Fortsett' },
  skip: {
    en: 'Skip to the end',
    fi: 'Hyppää loppuun',
    sv: 'Hoppa till slutet',
    nb: 'Hopp til slutten',
  },
  balloonMarker: {
    en: 'The balloon: pause or continue',
    fi: 'Pallo: tauko tai jatka',
    sv: 'Ballongen: paus eller fortsätt',
    nb: 'Ballongen: pause eller fortsett',
  },
  flew: { en: '{name} flew', fi: '{name} lensi', sv: '{name} flög', nb: '{name} fløy' },
  flewFrom: {
    en: '{name} from {place} flew',
    fi: '{name} paikasta {place} lensi',
    sv: '{name} från {place} flög',
    nb: '{name} fra {place} fløy',
  },
  route: { en: '{from} → {to}', fi: '{from} → {to}', sv: '{from} → {to}', nb: '{from} → {to}' },
  inAir: { en: 'In the air', fi: 'Ilmassa', sv: 'I luften', nb: 'I lufta' },
  topSpeed: { en: 'Top speed', fi: 'Huippuvauhti', sv: 'Toppfart', nb: 'Toppfart' },
  daysHours: {
    en: '{days} d {hours} h',
    fi: '{days} vrk {hours} h',
    sv: '{days} d {hours} h',
    nb: '{days} d {hours} t',
  },
  hoursOnly: { en: '{hours} h', fi: '{hours} h', sv: '{hours} h', nb: '{hours} t' },
  landed: {
    en: 'Landed gently after 5 days in the air.',
    fi: 'Laskeutui pehmeästi 5 päivän lennon jälkeen.',
    sv: 'Landade mjukt efter 5 dagar i luften.',
    nb: 'Landet mykt etter 5 dager i lufta.',
  },
  storm: {
    en: 'Brought down by a thunderstorm.',
    fi: 'Ukkonen pudotti sen maahan.',
    sv: 'Ett åskväder tvingade ner den.',
    nb: 'Et tordenvær tvang den ned.',
  },
  snow: {
    en: 'Brought down by heavy snow.',
    fi: 'Sakea lumisade painoi sen maahan.',
    sv: 'Kraftigt snöfall tvingade ner den.',
    nb: 'Kraftig snøfall tvang den ned.',
  },
  rain: {
    en: 'Brought down by heavy rain.',
    fi: 'Rankkasade painoi sen maahan.',
    sv: 'Kraftigt regn tvingade ner den.',
    nb: 'Kraftig regn tvang den ned.',
  },
  torn: {
    en: 'Torn apart by a storm-force wind.',
    fi: 'Myrskytuuli repi sen kappaleiksi.',
    sv: 'Slets sönder av en vind med stormstyrka.',
    nb: 'Revet i stykker av vind med stormstyrke.',
  },
  bestYet: {
    en: 'Your best flight so far!',
    fi: 'Paras lentosi tähän mennessä!',
    sv: 'Din bästa flygning hittills!',
    nb: 'Din beste flytur hittil!',
  },
  yourBest: {
    en: 'Your best: {distance}',
    fi: 'Paras lentosi: {distance}',
    sv: 'Ditt bästa: {distance}',
    nb: 'Din beste: {distance}',
  },
  shareResult: { en: 'Share result', fi: 'Jaa tulos', sv: 'Dela resultatet', nb: 'Del resultatet' },
  flyAgain: { en: 'Fly again', fi: 'Uusi lento', sv: 'Flyg igen', nb: 'Fly igjen' },
  copied: {
    en: 'Link copied',
    fi: 'Linkki kopioitu',
    sv: 'Länken kopierad',
    nb: 'Lenken er kopiert',
  },
  copyFailed: {
    en: "Couldn't copy the link.",
    fi: 'Linkkiä ei voitu kopioida.',
    sv: 'Kunde inte kopiera länken.',
    nb: 'Kunne ikke kopiere lenken.',
  },
  shareText: {
    en: '🎈 {name} flew {distance} from {from} to {to} in {duration}. Beat that:',
    fi: '🎈 {name} lensi {distance}: {from} → {to}, {duration}. Pystytkö parempaan?',
    sv: '🎈 {name} flög {distance} från {from} till {to} på {duration}. Slå det:',
    nb: '🎈 {name} fløy {distance} fra {from} til {to} på {duration}. Slå den:',
  },
  launched: {
    en: 'Launched {date} · {height} · {duration} in the air',
    fi: 'Lähti {date} · {height} · ilmassa {duration}',
    sv: 'Iväg {date} · {height} · {duration} i luften',
    nb: 'Sendt av gårde {date} · {height} · {duration} i lufta',
  },
  launchToo: {
    en: 'Launch from {place} too',
    fi: 'Lähetä oma pallo: {place}',
    sv: 'Skicka en egen från {place}',
    nb: 'Send en egen fra {place}',
  },
} satisfies Record<string, Texts>;

export type TextName = keyof typeof TEXTS;

/** A text in the app's language, its {placeholders} filled in. */
export function b(name: TextName, values: Record<string, string | number> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}
