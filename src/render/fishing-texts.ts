// The fishing times' texts in every language the app speaks, side by side
// (a missing one won't compile). Here, not in the start-up language files:
// they load with the Sky section. scripts/check-i18n.mjs checks each text's
// {placeholders} match.

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

const TEXTS = {
  label: {
    en: 'Fishing times',
    fi: 'Kalojen syöntiajat',
    sv: 'Fisketider',
    nb: 'Fisketider',
  },
  then: {
    en: 'Then {times}.',
    fi: 'Sitten {times}.',
    sv: 'Sedan {times}.',
    nb: 'Deretter {times}.',
  },
  legend: {
    en: '★ main period (the moon highest or lowest), the others at moonrise and moonset: an old fishing tradition.',
    fi: '★ pääsyöntiaika (kuu korkeimmillaan tai matalimmillaan), muut kuun noustessa ja laskiessa: vanha kalastusperinne.',
    sv: '★ huvudperiod (månen högst eller lägst), de andra vid månens uppgång och nedgång: en gammal fisketradition.',
    nb: '★ hovedperiode (månen høyest eller lavest), de andre ved måneoppgang og månenedgang: en gammel fisketradisjon.',
  },
  fullMoon: {
    en: 'Near the full moon: said to be the best days.',
    fi: 'Lähellä täysikuuta: näitä sanotaan parhaiksi päiviksi.',
    sv: 'Nära fullmåne: sägs vara de bästa dagarna.',
    nb: 'Nær fullmåne: sies å være de beste dagene.',
  },
  newMoon: {
    en: 'Near the new moon: said to be the best days.',
    fi: 'Lähellä uutta kuuta: näitä sanotaan parhaiksi päiviksi.',
    sv: 'Nära nymåne: sägs vara de bästa dagarna.',
    nb: 'Nær nymåne: sies å være de beste dagene.',
  },
  falling: {
    en: 'Falling pressure: said to get fish biting.',
    fi: 'Laskeva ilmanpaine: kalan sanotaan syövän silloin hyvin.',
    sv: 'Fallande lufttryck: sägs få fisken att nappa.',
    nb: 'Fallende lufttrykk: sies å få fisken til å bite.',
  },
} satisfies Record<string, Texts>;

/** A fishing text in the app's language, with {placeholders} filled in. */
export function fishingText(name: keyof typeof TEXTS, values: Record<string, string> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? values[key] : placeholder,
  );
}
