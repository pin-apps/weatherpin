// The temperature quiz's texts, in every language the app speaks, side by
// side (a missing one won't compile). Kept here, not in the start-up
// language files: they load with the quiz, only when it's played.
// scripts/check-i18n.mjs checks each text's {placeholders} and *bold*
// marks match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

const TEXTS = {
  intro: {
    en: "Today's quiz #{number}: guess today's high at 5 places.",
    fi: 'Päivän visa #{number}: arvaa päivän ylin lämpötila viidessä paikassa.',
    sv: 'Dagens quiz #{number}: gissa dagens högsta temperatur på 5 platser.',
    nb: 'Dagens quiz #{number}: gjett dagens høyeste temperatur på 5 steder.',
  },
  somewhereIn: {
    en: 'Somewhere in {country}',
    fi: 'Jossain: {country}',
    sv: 'Någonstans i {country}',
    nb: 'Et sted i {country}',
  },
  playDaily: {
    en: "Play today's quiz",
    fi: 'Pelaa päivän visa',
    sv: 'Spela dagens quiz',
    nb: 'Spill dagens quiz',
  },
  freeIntro: {
    en: 'Free play: guess the temperature right now at 5 random places.',
    fi: 'Vapaa peli: arvaa lämpötila juuri nyt viidessä satunnaisessa paikassa.',
    sv: 'Fritt spel: gissa temperaturen just nu på 5 slumpmässiga platser.',
    nb: 'Fritt spill: gjett temperaturen akkurat nå på 5 tilfeldige steder.',
  },
  free: {
    en: 'Free play',
    fi: 'Vapaa peli',
    sv: 'Fritt spel',
    nb: 'Fritt spill',
  },
  played: {
    en: "You've played today's quiz #{number}.",
    fi: 'Olet pelannut päivän visan #{number}.',
    sv: 'Du har spelat dagens quiz #{number}.',
    nb: 'Du har spilt dagens quiz #{number}.',
  },
  nextQuiz: {
    en: 'Next quiz in {time}',
    fi: 'Seuraava visa {time} kuluttua',
    sv: 'Nästa quiz om {time}',
    nb: 'Neste quiz om {time}',
  },
  streakOne: {
    en: '{days} day in a row',
    fi: '{days} päivä putkeen',
    sv: '{days} dag i rad',
    nb: '{days} dag på rad',
  },
  streak: {
    en: '{days} days in a row',
    fi: '{days} päivää putkeen',
    sv: '{days} dagar i rad',
    nb: '{days} dager på rad',
  },
  best: {
    en: 'Your best: {score}',
    fi: 'Paras tuloksesi: {score}',
    sv: 'Ditt bästa: {score}',
    nb: 'Din beste: {score}',
  },
  yourGuess: {
    en: 'Your guess',
    fi: 'Arvauksesi',
    sv: 'Din gissning',
    nb: 'Din gjetning',
  },
  guess: {
    en: 'Guess',
    fi: 'Arvaa',
    sv: 'Gissa',
    nb: 'Gjett',
  },
  round: {
    en: 'Place {number} of {total}',
    fi: 'Paikka {number}/{total}',
    sv: 'Plats {number} av {total}',
    nb: 'Sted {number} av {total}',
  },
  localTime: {
    en: 'Local time {time}',
    fi: 'Paikallinen aika {time}',
    sv: 'Lokal tid {time}',
    nb: 'Lokal tid {time}',
  },
  // *…*: the words that tell the two questions apart, shown in bold.
  askHigh: {
    en: "What's *today's high* here?",
    fi: 'Mikä on täällä tänään *päivän ylin lämpötila*?',
    sv: 'Vilken är *dagens högsta temperatur* här?',
    nb: 'Hva er *dagens høyeste temperatur* her?',
  },
  wholeDay: {
    en: 'The whole day there, also the hours still to come.',
    fi: 'Koko päivän ajalta, myös vielä tulevat tunnit.',
    sv: 'Hela dagen där, även timmarna som är kvar.',
    nb: 'Hele dagen der, også timene som gjenstår.',
  },
  askNow: {
    en: "What's the temperature here *right now*?",
    fi: 'Mikä täällä on lämpötila *juuri nyt*?',
    sv: 'Vilken temperatur är det här *just nu*?',
    nb: 'Hvilken temperatur er det her *akkurat nå*?',
  },
  highAt: {
    en: "Today's high: {temp} (around {time})",
    fi: 'Päivän ylin: {temp} (noin klo {time})',
    sv: 'Dagens högsta: {temp} (omkring kl. {time})',
    nb: 'Dagens høyeste: {temp} (rundt kl. {time})',
  },
  high: {
    en: "Today's high: {temp}",
    fi: 'Päivän ylin: {temp}',
    sv: 'Dagens högsta: {temp}',
    nb: 'Dagens høyeste: {temp}',
  },
  nowThere: {
    en: "It's {temp} there right now.",
    fi: 'Siellä on nyt {temp}.',
    sv: 'Det är {temp} där just nu.',
    nb: 'Det er {temp} der akkurat nå.',
  },
  guessed: {
    en: 'You guessed {guess}: {off}° off · {points} points',
    fi: 'Arvasit {guess}: {off}° pielessä · {points} pistettä',
    sv: 'Du gissade {guess}: {off}° fel · {points} poäng',
    nb: 'Du gjettet {guess}: {off}° feil · {points} poeng',
  },
  seeResults: {
    en: 'See results',
    fi: 'Katso tulokset',
    sv: 'Se resultatet',
    nb: 'Se resultatet',
  },
  nextPlace: {
    en: 'Next place',
    fi: 'Seuraava paikka',
    sv: 'Nästa plats',
    nb: 'Neste sted',
  },
  showWeather: {
    en: 'Show the weather',
    fi: 'Näytä sää',
    sv: 'Visa vädret',
    nb: 'Vis været',
  },
  playAgain: {
    en: 'Play again',
    fi: 'Pelaa uudelleen',
    sv: 'Spela igen',
    nb: 'Spill igjen',
  },
  verdictTop: {
    en: 'Meteorologist material!',
    fi: 'Meteorologin ainesta!',
    sv: 'Meteorologämne!',
    nb: 'Meteorologemne!',
  },
  verdictGood: {
    en: 'Not bad at all!',
    fi: 'Ei huono ollenkaan!',
    sv: 'Inte illa alls!',
    nb: 'Ikke verst i det hele tatt!',
  },
  verdictMid: {
    en: "The weather is hard to guess, isn't it?",
    fi: 'Sää on vaikea arvata, eikö?',
    sv: 'Vädret är svårt att gissa, va?',
    nb: 'Været er vanskelig å gjette, hva?',
  },
  verdictLow: {
    en: 'Have you looked outside lately?',
    fi: 'Oletko katsonut ulos viime aikoina?',
    sv: 'Har du tittat ut på sistone?',
    nb: 'Har du kikket ut i det siste?',
  },
  shareDaily: {
    en: 'Weatherpin quiz #{number} · {score}/{max}',
    fi: 'Weatherpin-visa #{number} · {score}/{max}',
    sv: 'Weatherpin-quiz #{number} · {score}/{max}',
    nb: 'Weatherpin-quiz #{number} · {score}/{max}',
  },
  shareFree: {
    en: 'Weatherpin quiz (free play) · {score}/{max}',
    fi: 'Weatherpin-visa (vapaa peli) · {score}/{max}',
    sv: 'Weatherpin-quiz (fritt spel) · {score}/{max}',
    nb: 'Weatherpin-quiz (fritt spill) · {score}/{max}',
  },
  problem: {
    en: "Couldn't get the weather there. Check your connection.",
    fi: 'Säätä ei saatu haettua. Tarkista yhteys.',
    sv: 'Det gick inte att hämta vädret där. Kontrollera anslutningen.',
    nb: 'Kunne ikke hente været der. Sjekk nettforbindelsen.',
  },
} satisfies Record<string, Texts>;

/** A quiz text in the app's language, with {placeholders} filled in. */
export function q(name: keyof typeof TEXTS, values: Record<string, string | number> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}
