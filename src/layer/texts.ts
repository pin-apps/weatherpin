// The weather symbols layer's own texts, in every language the app speaks,
// side by side (a missing one won't compile); out of the start-up language
// files, as they load with the layer. scripts/check-i18n.mjs checks each
// text's {placeholders} match. (The button and time bar are in index.html.)

import { currentLanguage, type Language } from '../i18n';

type Texts = Record<Language, string>;

const TEXTS = {
  loading: {
    en: 'Loading the weather symbols…',
    fi: 'Haetaan sääsymboleita…',
    sv: 'Hämtar vädersymbolerna…',
    nb: 'Henter værsymbolene…',
  },
  failed: {
    en: "Couldn't load the weather symbols. Move the map to try again.",
    fi: 'Sääsymboleita ei saatu haettua. Siirrä karttaa yrittääksesi uudelleen.',
    sv: 'Kunde inte hämta vädersymbolerna. Flytta kartan för att försöka igen.',
    nb: 'Fikk ikke hentet værsymbolene. Flytt kartet for å prøve igjen.',
  },
  zoomOut: {
    en: 'No listed places here: zoom out to see some.',
    fi: 'Täällä ei ole listattuja paikkoja: loitonna nähdäksesi niitä.',
    sv: 'Inga listade platser här: zooma ut för att se några.',
    nb: 'Ingen listede steder her: zoom ut for å se noen.',
  },
  label: {
    en: '{place}: {weather}, {temperature}',
    fi: '{place}: {weather}, {temperature}',
    sv: '{place}: {weather}, {temperature}',
    nb: '{place}: {weather}, {temperature}',
  },
} satisfies Record<string, Texts>;

/** A text in the app's language, its {placeholders} filled in. */
export function w(name: keyof typeof TEXTS, values: Record<string, string> = {}): string {
  return TEXTS[name][currentLanguage()].replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? values[key] : placeholder,
  );
}
