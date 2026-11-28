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
    en: 'Hold the left or right side to steer; the car speeds up by itself. Arrow keys work too.',
    fi: 'Ohjaa pitämällä vasenta tai oikeaa puolta painettuna; auto kiihdyttää itse. Nuolinäppäimetkin toimivat.',
    sv: 'Håll vänster eller höger sida för att styra; bilen gasar själv. Piltangenterna fungerar också.',
    nb: 'Hold venstre eller høyre side for å styre; bilen gasser selv. Piltastene virker også.',
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
    en: 'Time! {score} points {on}.',
    fi: 'Aika loppui! {score} pistettä {on}.',
    sv: 'Tiden är ute! {score} poäng {on}.',
    nb: 'Tiden er ute! {score} poeng {on}.',
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
