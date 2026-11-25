// Light or dark: the user's choice in Settings (Automatic, Light, Dark).
// Automatic follows the device's own setting, and changes with it.
//
// The page shows the colours set on <html data-theme="light|dark">
// (src/style.css). public/theme.js sets it before the page is first drawn;
// this module keeps it right afterwards. Keep the two in step.

import { onStoredChange, readStored, writeStored } from './storage';

export type Theme = 'auto' | 'light' | 'dark';

// Stored as nordic-weather:theme = "auto" | "light" | "dark".
const STORAGE_KEY = 'theme';

// The browser bar's colour: the app's blue, or its dark surface.
const BAR_COLOURS = { light: '#0b63ce', dark: '#1b2633' } as const;

const deviceDark = window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme(): Theme | undefined {
  const saved = readStored(STORAGE_KEY);
  return saved === 'auto' || saved === 'light' || saved === 'dark' ? saved : undefined;
}

// Kept in memory too, so the choice still works (for this visit) when the
// browser won't let us save it.
let current: Theme = storedTheme() ?? 'auto';

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
  document.documentElement.dataset.theme = shown;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOURS[shown]);
}

// The device switched between light and dark (e.g. at sunset).
deviceDark.addEventListener('change', apply);

// Chosen in another tab: follow it.
onStoredChange(STORAGE_KEY, () => {
  current = storedTheme() ?? 'auto';
  apply();
});

// In case public/theme.js didn't load.
apply();
