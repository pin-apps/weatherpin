// Light or dark: the user's choice in Settings (Automatic, Light, Dark), and
// the colour set ("skin": Classic, Nordic night, Sauna, Retro, High contrast).
// Automatic follows the device's own setting, and changes with it.
//
// The page shows the colours set on <html data-theme="light|dark">
// (src/style.css). public/theme.js sets it before the page is first drawn;
// this module keeps it right afterwards. Keep the two in step.

import { onStoredChange, readStored, writeStored } from './storage';

export type Theme = 'auto' | 'light' | 'dark';
/** Colour sets (style.css), each with a light and a dark version. */
export type Skin = 'classic' | 'nordic' | 'sauna' | 'retro' | 'contrast';
const SKINS: readonly Skin[] = ['classic', 'nordic', 'sauna', 'retro', 'contrast'];

// Stored as nordic-weather:theme = "auto" | "light" | "dark", and
// nordic-weather:skin = a Skin (none: classic).
const STORAGE_KEY = 'theme';
const SKIN_KEY = 'skin';

// The browser bar's colour per skin: its accent, or its dark surface.
const BAR_COLOURS: Record<Skin, { light: string; dark: string }> = {
  classic: { light: '#0b63ce', dark: '#1b2633' },
  nordic: { light: '#0e6a70', dark: '#0f2131' },
  sauna: { light: '#9a3d12', dark: '#2a1c13' },
  retro: { light: '#a8430c', dark: '#3a2a1d' },
  contrast: { light: '#000000', dark: '#000000' },
};

const deviceDark = window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme(): Theme | undefined {
  const saved = readStored(STORAGE_KEY);
  return saved === 'auto' || saved === 'light' || saved === 'dark' ? saved : undefined;
}

function storedSkin(): Skin {
  const saved = readStored(SKIN_KEY);
  return SKINS.includes(saved as Skin) ? (saved as Skin) : 'classic';
}

// Kept in memory too, so the choice still works (for this visit) when the
// browser won't let us save it.
let current: Theme = storedTheme() ?? 'auto';
let skin: Skin = storedSkin();

export function currentSkin(): Skin {
  return skin;
}

/** Applies a colour set now and saves it; false if it couldn't be saved. */
export function setSkin(chosen: Skin): boolean {
  skin = chosen;
  apply();
  return writeStored(SKIN_KEY, chosen);
}

export function currentTheme(): Theme {
  return current;
}

/** Applies the choice now and saves it; false if it couldn't be saved. */
export function setTheme(theme: Theme): boolean {
  current = theme;
  apply();
  return writeStored(STORAGE_KEY, theme);
}

function apply() {
  const dark = current === 'dark' || (current === 'auto' && deviceDark.matches);
  const shown = dark ? 'dark' : 'light';
  const root = document.documentElement;
  root.dataset.theme = shown;
  if (skin === 'classic') delete root.dataset.skin;
  else root.dataset.skin = skin;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BAR_COLOURS[skin][shown]);
}

// The device switched between light and dark (e.g. at sunset).
deviceDark.addEventListener('change', apply);

// Chosen in another tab: follow it.
onStoredChange(STORAGE_KEY, () => {
  current = storedTheme() ?? 'auto';
  apply();
});
onStoredChange(SKIN_KEY, () => {
  skin = storedSkin();
  apply();
});

// In case public/theme.js didn't load.
apply();
