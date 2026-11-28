// The drift game's texts, in every language the app speaks, side by side
// (a missing one won't compile). Kept here, not in the start-up language
// files: they load with the game, only when it's played.
// scripts/check-i18n.mjs checks each text's {placeholders} match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

const TEXTS = {
  title: {
    en: 'Drift in {place}',
    fi: 'Driftaa: {place}',
    sv: 'Drifta i {place}',
    nb: 'Drift i {place}',
  },
  dry: {
    en: 'Dry asphalt',
    fi: 'Kuiva asfaltti',
    sv: 'Torr asfalt',
    nb: 'Tørr asfalt',
  },
  rain: {
    en: 'Wet road',
    fi: 'Märkä tie',
    sv: 'Våt väg',
    nb: 'Våt vei',
  },
  snow: {
    en: 'Snowy road',
    fi: 'Luminen tie',
    sv: 'Snöig väg',
    nb: 'Snødekt vei',
  },
  ice: {
    en: 'Black ice',
    fi: 'Musta jää',
    sv: 'Blixthalka',
    nb: 'Blankis',
  },
  glare: {
    en: 'Glare ice',
    fi: 'Peilijää',
    sv: 'Spegelblank is',
    nb: 'Speilblank is',
  },
  onGlare: {
    en: 'on glare ice',
    fi: 'peilijäällä',
    sv: 'på spegelblank is',
    nb: 'på speilblank is',
  },
  onDry: {
    en: 'on dry asphalt',
    fi: 'kuivalla asfaltilla',
    sv: 'på torr asfalt',
    nb: 'på tørr asfalt',
  },
  onRain: {
    en: 'on a wet road',
    fi: 'märällä tiellä',
    sv: 'på våt väg',
    nb: 'på våt vei',
  },
  onSnow: {
    en: 'on a snowy road',
    fi: 'lumisella tiellä',
    sv: 'på snöig väg',
    nb: 'på snødekt vei',
  },
  onIce: {
    en: 'on black ice',
    fi: 'mustalla jäällä',
    sv: 'på blixthalka',
    nb: 'på blankis',
  },
  road: {
    en: '{surface}, {temperature}, grip {grip}',
    fi: '{surface}, {temperature}, pito {grip}',
    sv: '{surface}, {temperature}, grepp {grip}',
    nb: '{surface}, {temperature}, grep {grip}',
  },
  wind: {
    en: 'Wind {speed} {from}: it pushes the car.',
    fi: 'Tuuli {speed} {from}: se työntää autoa.',
    sv: 'Vind {speed} {from}: den knuffar bilen.',
    nb: 'Vind {speed} {from}: den dytter bilen.',
  },
  noWeather: {
    en: 'Weather unavailable, dry track.',
    fi: 'Säätietoja ei ole, kuiva rata.',
    sv: 'Inget väder att tillgå, torr bana.',
    nb: 'Været er ikke tilgjengelig, tørr bane.',
  },
  score: {
    en: 'Score',
    fi: 'Pisteet',
    sv: 'Poäng',
    nb: 'Poeng',
  },
  time: {
    en: '{seconds} s',
    fi: '{seconds} s',
    sv: '{seconds} s',
    nb: '{seconds} s',
  },
  tapToStart: {
    en: 'Tap to start drifting',
    fi: 'Napauta ja aloita driftaus',
    sv: 'Tryck för att börja drifta',
    nb: 'Trykk for å begynne å drifte',
  },
  tapAgain: {
    en: 'Tap to drift again',
    fi: 'Napauta ja driftaa uudelleen',
    sv: 'Tryck för att drifta igen',
    nb: 'Trykk for å drifte igjen',
  },
  paused: {
    en: 'Paused. Tap to go on.',
    fi: 'Tauko. Jatka napauttamalla.',
    sv: 'Pausat. Tryck för att fortsätta.',
    nb: 'Pause. Trykk for å fortsette.',
  },
  points: {
    en: '{score} points',
    fi: '{score} pistettä',
    sv: '{score} poäng',
    nb: '{score} poeng',
  },
  hint: {
    en: 'Drive the green gates in order; drift through one for double points. Drift points count when a drift ends cleanly. Hits cost 2 s. Hold the left or right side to steer, or use the arrow keys.',
    fi: 'Aja vihreiden porttien läpi järjestyksessä; driftaten saat tuplapisteet. Driftin pisteet lasketaan, kun drifti päättyy puhtaasti. Törmäys vie 2 s. Ohjaa pitämällä vasenta tai oikeaa puolta painettuna tai nuolinäppäimillä.',
    sv: 'Kör genom de gröna portarna i ordning; drifta genom en för dubbla poäng. Driftpoängen räknas när en drift slutar rent. En krock kostar 2 s. Håll vänster eller höger sida för att styra, eller använd piltangenterna.',
    nb: 'Kjør gjennom de grønne portene i rekkefølge; drift gjennom en for doble poeng. Driftpoengene teller når en drift slutter rent. En kollisjon koster 2 s. Hold venstre eller høyre side for å styre, eller bruk piltastene.',
  },
  lap: {
    en: 'Lap {lap} · gate {gate}/{gates}',
    fi: 'Kierros {lap} · portti {gate}/{gates}',
    sv: 'Varv {lap} · port {gate}/{gates}',
    nb: 'Runde {lap} · port {gate}/{gates}',
  },
  counter: {
    en: 'Drift {points} x{combo}',
    fi: 'Drifti {points} x{combo}',
    sv: 'Drift {points} x{combo}',
    nb: 'Drift {points} x{combo}',
  },
  popGate: {
    en: 'Gate +{points}',
    fi: 'Portti +{points}',
    sv: 'Port +{points}',
    nb: 'Port +{points}',
  },
  popDriftGate: {
    en: 'Drift gate +{points}',
    fi: 'Driftiportti +{points}',
    sv: 'Driftport +{points}',
    nb: 'Driftport +{points}',
  },
  popCleanLap: {
    en: 'Clean lap +{points} · +2 s',
    fi: 'Puhdas kierros +{points} · +2 s',
    sv: 'Rent varv +{points} · +2 s',
    nb: 'Ren runde +{points} · +2 s',
  },
  popLap: {
    en: 'Lap {laps}',
    fi: 'Kierros {laps}',
    sv: 'Varv {laps}',
    nb: 'Runde {laps}',
  },
  popHit: {
    en: '−2 s',
    fi: '−2 s',
    sv: '−2 s',
    nb: '−2 s',
  },
  popWiped: {
    en: 'Wiped out! −{points}',
    fi: 'Pyyhkiytyi! −{points}',
    sv: 'Borta! −{points}',
    nb: 'Borte! −{points}',
  },
  popNice: {
    en: 'Nice drift +{points}',
    fi: 'Hyvä drifti +{points}',
    sv: 'Snygg drift +{points}',
    nb: 'Fin drift +{points}',
  },
  popBig: {
    en: 'Big drift +{points}',
    fi: 'Iso drifti +{points}',
    sv: 'Stor drift +{points}',
    nb: 'Stor drift +{points}',
  },
  popHuge: {
    en: 'Huge drift +{points}',
    fi: 'Valtava drifti +{points}',
    sv: 'Enorm drift +{points}',
    nb: 'Enorm drift +{points}',
  },
  plusSecond: {
    en: '{text} · +1 s',
    fi: '{text} · +1 s',
    sv: '{text} · +1 s',
    nb: '{text} · +1 s',
  },
  soundOn: {
    en: 'Sound on',
    fi: 'Äänet päällä',
    sv: 'Ljud på',
    nb: 'Lyd på',
  },
  soundOff: {
    en: 'Sound off',
    fi: 'Äänet pois',
    sv: 'Ljud av',
    nb: 'Lyd av',
  },
  best: {
    en: 'Best {on}: {score}',
    fi: 'Paras {on}: {score}',
    sv: 'Bäst {on}: {score}',
    nb: 'Best {on}: {score}',
  },
  newBest: {
    en: 'New best {on}!',
    fi: 'Uusi ennätys {on}!',
    sv: 'Nytt rekord {on}!',
    nb: 'Ny rekord {on}!',
  },
  result: {
    en: 'Time! {score} points {on}, {laps} laps.',
    fi: 'Aika loppui! {score} pistettä {on}, {laps} kierrosta.',
    sv: 'Tiden är ute! {score} poäng {on}, {laps} varv.',
    nb: 'Tiden er ute! {score} poeng {on}, {laps} runder.',
  },
  canvas: {
    en: 'Drift game: a car on a track, {surface}.',
    fi: 'Driftauspeli: auto radalla, {surface}.',
    sv: 'Driftspel: en bil på en bana, {surface}.',
    nb: 'Driftspill: en bil på en bane, {surface}.',
  },
  shareResult: {
    en: 'Share result',
    fi: 'Jaa tulos',
    sv: 'Dela resultatet',
    nb: 'Del resultatet',
  },
  shareText: {
    en: 'I drifted {score} pts {on} in {place}, {temperature}, on weatherpin.app',
    fi: 'Driftasin {score} pistettä {on} ({place}, {temperature}) weatherpin.appissa',
    sv: 'Jag driftade {score} poäng {on} i {place}, {temperature}, på weatherpin.app',
    nb: 'Jeg driftet {score} poeng {on} i {place}, {temperature}, på weatherpin.app',
  },
  copied: {
    en: 'Copied',
    fi: 'Kopioitu',
    sv: 'Kopierat',
    nb: 'Kopiert',
  },
  copyFailed: {
    en: "Couldn't copy it",
    fi: 'Kopiointi ei onnistunut',
    sv: 'Det gick inte att kopiera',
    nb: 'Kunne ikke kopiere',
  },
  game: {
    en: 'Just a game: the grip and the wind come from the weather there now.',
    fi: 'Vain peli: pito ja tuuli tulevat paikan säästä nyt.',
    sv: 'Bara ett spel: greppet och vinden kommer från vädret där just nu.',
    nb: 'Bare et spill: grepet og vinden kommer fra været der nå.',
  },
} satisfies Record<string, Texts>;

export type TextName = keyof typeof TEXTS;

/** A text in the app's language, its {placeholders} filled in. */
export function d(name: TextName, values: Record<string, string | number> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}
