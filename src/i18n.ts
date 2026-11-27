// The app's words in English (the source text, used as the key), Finnish,
// Swedish or Norwegian (bokmål).
//
// `t('Feels like {temp}', { temp })` returns the text in the current
// language, with {placeholders} filled in. Where one English word needs
// different Finnish ones, a context goes in front: `t('pollen|Low')` is
// "Low" in English, "Vähäinen" in Finnish (UV's "Low" is "Heikko"). Anything
// without a translation shows in English (and is listed for the tests,
// which fail on it). Texts kept in tables (weather descriptions, levels) are marked with
// `msg()` where they're defined and go through `t()` where they're shown,
// so scripts/check-i18n.mjs can find every text.
//
// The language: the user's choice (Settings → Language), else Finnish,
// Swedish or Norwegian for a browser in one of them (Norwegian browsers say
// "nb", "no" or "nn": nynorsk readers get bokmål), else English. It's set once per
// page load; a change reloads the page (the place stays in the address).
//
// Each language's texts (i18n-fi.ts, i18n-sv.ts, i18n-nb.ts) are a separate download,
// fetched only for that language: main.ts waits for loadTranslations()
// before showing anything.

import { readStored, writeStored } from './storage';

export type Language = 'en' | 'fi' | 'sv' | 'nb';

const LANGUAGES: readonly Language[] = ['en', 'fi', 'sv', 'nb'];

/** Dates and times in each language's style (English follows the browser). */
export const LANGUAGE_LOCALES = { fi: 'fi-FI', sv: 'sv-SE', nb: 'nb-NO' } as const;

/** Norwegian in a browser: bokmål ("nb"), Norwegian ("no") or nynorsk ("nn"). */
const NORWEGIAN_CODES = new Set(['nb', 'no', 'nn']);
const STORAGE_KEY = 'language';

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

function browserLanguage(): Language {
  const preferred = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  // "sv-FI" (Swedish in Finland) is Swedish too.
  const code = preferred.split('-')[0];
  if (NORWEGIAN_CODES.has(code)) return 'nb';
  return isLanguage(code) ? code : 'en';
}

function savedLanguage(): Language | undefined {
  const saved = readStored(STORAGE_KEY);
  return isLanguage(saved) ? saved : undefined;
}

let language: Language = savedLanguage() ?? browserLanguage();

// The texts of the language in use (none for English: it's the keys).
let texts: Readonly<Record<string, string>> = {};

/**
 * Downloads the texts of the language in use. If that fails (e.g. offline
 * before the app was ever kept), the app shows in English rather than not
 * at all.
 */
export async function loadTranslations(): Promise<void> {
  try {
    if (language === 'fi') texts = (await import('./i18n-fi')).FINNISH;
    else if (language === 'sv') texts = (await import('./i18n-sv')).SWEDISH;
    else if (language === 'nb') texts = (await import('./i18n-nb')).NORWEGIAN;
  } catch {
    language = 'en';
  }
}

/**
 * The About dialog's texts, kept out of the start-up language file: loaded
 * when About is first opened (about.ts). In English, or if they can't
 * load, About stays in English.
 */
export async function loadAboutTexts(): Promise<void> {
  try {
    if (language === 'fi') texts = { ...texts, ...(await import('./i18n-about-fi')).FINNISH_ABOUT };
    else if (language === 'sv')
      texts = { ...texts, ...(await import('./i18n-about-sv')).SWEDISH_ABOUT };
    else if (language === 'nb')
      texts = { ...texts, ...(await import('./i18n-about-nb')).NORWEGIAN_ABOUT };
  } catch {
    // Offline before it was ever loaded: About in English this time.
  }
}

export function currentLanguage(): Language {
  return language;
}

/** Saves the choice; the caller reloads the page to apply it. */
export function saveLanguage(next: Language): boolean {
  return writeStored(STORAGE_KEY, next);
}

// Texts shown in English because a translation was missing (read by the tests).
const missing = new Set<string>();
Object.defineProperty(window, 'i18nMissing', { value: missing });

export function t(text: string, values: Record<string, string | number> = {}): string {
  // English is the key without its context.
  let result = text.replace(/^[a-z]+\|/, '');
  if (language !== 'en') {
    const translated = texts[text];
    if (translated === undefined) missing.add(text);
    else result = translated;
  }
  return result.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}

/** Marks a text for translation where it's defined; `t()` translates it. */
export function msg(text: string): string {
  return text;
}

/** One text or the other by count: "1 favourite", "3 favourites". */
export function plural(count: number, one: string, other: string): string {
  return t(count === 1 ? one : other, { count });
}

/**
 * The page's own texts (index.html): an element with `data-i18n` gets its
 * text translated (key: the English text, whitespace collapsed);
 * `data-i18n-attrs="placeholder title"` those attributes (same keys).
 * `data-i18n-html="name"` replaces a text with links by our own
 * translated markup, stored as "html:name" (never data from a service).
 */
export function translatePage(root: ParentNode = document): void {
  document.documentElement.lang = language;
  if (language === 'en') return;
  const key = (text: string) => text.replace(/\s+/g, ' ').trim();
  // Parts whose texts load later (data-i18n-later, e.g. About) are left
  // for then: translatePage(that part) once its texts are here.
  const now = (element: Element) => root !== document || !element.closest('[data-i18n-later]');
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    if (!now(element)) return;
    element.textContent = t(key(element.textContent ?? ''));
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
    if (!now(element)) return;
    const name = `html:${element.dataset.i18nHtml}`;
    if (texts[name] === undefined) missing.add(name);
    else element.innerHTML = texts[name];
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-attrs]').forEach((element) => {
    if (!now(element)) return;
    for (const name of element.dataset.i18nAttrs!.split(' ')) {
      const value = element.getAttribute(name);
      if (value) element.setAttribute(name, t(key(value)));
    }
  });
}
