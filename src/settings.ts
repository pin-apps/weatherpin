// The Settings dialog, opened from the ⚙ button next to the search box
// (main.ts loads this code on the first press):
// add to home screen, light/dark and colours, units, language, the start place, and clearing
// everything saved. A native <dialog>: Escape closes it and focus stays
// inside while it's open. Each choice is a row of toggle buttons (the one
// in use pressed) and takes effect at once.

import { formatCoordinates } from './format';
import { installPrompt, promptUsed, runsInstalled } from './install-prompt';
import { currentLanguage, saveLanguage, t, type Language } from './i18n';
import { clearStartPlace, loadStartPlace, onStartPlaceChange } from './start-place';
import { clearAllStored, storageAvailable } from './storage';
import { currentSkin, currentTheme, setSkin, setTheme, type Skin, type Theme } from './theme';
import {
  automaticUnits,
  chosenUnits,
  currentUnits,
  onUnitsChange,
  setTemperatureUnit,
  setUnit,
  type ChosenKind,
  type ChosenUnits,
  type TemperatureUnit,
} from './units';

/** Sets up the dialog; returns the function that opens it. */
export function setUpSettings(dialog: HTMLDialogElement): () => void {
  const message = dialog.querySelector<HTMLElement>('.settings__message')!;
  const startSection = dialog.querySelector<HTMLElement>('.settings__start')!;
  const startText = dialog.querySelector<HTMLElement>('.settings__start-text')!;
  const startRemove = dialog.querySelector<HTMLButtonElement>('.settings__start-remove')!;
  const clearButton = dialog.querySelector<HTMLButtonElement>('.settings__clear')!;
  const unitsHint = dialog.querySelector<HTMLElement>('.settings__units-hint')!;
  const moreUnits = dialog.querySelector<HTMLDetailsElement>('.settings__more')!;
  const installButton = dialog.querySelector<HTMLButtonElement>('.settings__install')!;
  const installHint = dialog.querySelector<HTMLElement>('.settings__install-hint')!;
  const installed = dialog.querySelector<HTMLElement>('.settings__installed')!;

  const buttons = (group: string) =>
    dialog.querySelectorAll<HTMLButtonElement>(`[data-setting="${group}"] button`);

  /** Presses the button whose value is in use, and releases the others. */
  function press(group: string, value: string) {
    buttons(group).forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.value === value)),
    );
  }

  function renderStartPlace() {
    const start = loadStartPlace();
    startText.textContent = start
      ? t('The app opens at {place}.', {
          place: start.name ?? formatCoordinates(start.lat, start.lng),
        })
      : t(
          'The app opens at the world map. To change it, open a place and choose Start here in its ⋯ menu.',
        );
    startRemove.hidden = !start;
  }

  function renderUnits() {
    press('temperature', currentUnits().temperature);
    const chosen = chosenUnits();
    for (const kind of UNIT_KINDS) press(kind, chosen[kind] ?? 'auto');
    // Folded away unless one of them is the user's own.
    if (UNIT_KINDS.some((kind) => chosen[kind] !== undefined)) moreUnits.open = true;
    unitsHint.textContent = t('Automatic follows °C/°F and your region (now: {units}).', {
      units: automaticUnitNames(),
    });
  }

  function renderInstall() {
    const done = runsInstalled();
    installButton.hidden = done;
    installed.hidden = !done;
    if (done) installHint.hidden = true;
  }

  function render() {
    renderInstall();
    renderUnits();
    press('theme', currentTheme());
    press('skin', currentSkin());
    press('language', currentLanguage());
    renderStartPlace();
    // Without storage there's nothing saved to show or remove.
    const canSave = storageAvailable();
    startSection.hidden = !canSave;
    clearButton.hidden = !canSave;
  }

  function open() {
    message.textContent = '';
    render();
    if (!dialog.open) dialog.showModal();
  }

  dialog.querySelector('.settings__close')!.addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop (the dialog itself, outside its content).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // "About Weatherpin" at the bottom: About opens in its place (about.ts
  // handles every link to #about).
  dialog.querySelector('a[href="#about"]')!.addEventListener('click', () => dialog.close());

  // Add to home screen: the browser's own dialog where there is one, else
  // how to do it from the browser's menu.
  installButton.addEventListener('click', async () => {
    const prompt = installPrompt();
    if (!prompt) {
      installHint.textContent = installSteps();
      installHint.hidden = false;
      return;
    }
    promptUsed();
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      installButton.hidden = true;
      installed.hidden = false;
      installHint.hidden = true;
    }
  });

  // °C or °F: the weather behind the dialog switches at once. Works for
  // this visit even when the browser won't save it.
  buttons('temperature').forEach((button) =>
    button.addEventListener('click', () => {
      setTemperatureUnit(button.dataset.value as TemperatureUnit);
    }),
  );
  // Wind, rain and pressure: Automatic, or one the user picks.
  for (const kind of UNIT_KINDS) {
    buttons(kind).forEach((button) =>
      button.addEventListener('click', () => {
        setUnit(kind, button.dataset.value as ChosenUnits[ChosenKind] | 'auto');
      }),
    );
  }
  onUnitsChange(renderUnits);

  buttons('theme').forEach((button) =>
    button.addEventListener('click', () => {
      setTheme(button.dataset.value as Theme);
      press('theme', currentTheme());
    }),
  );
  buttons('skin').forEach((button) =>
    button.addEventListener('click', () => {
      setSkin(button.dataset.value as Skin);
      press('skin', currentSkin());
    }),
  );

  // A new language reloads the page in it (the place shown stays: it's in
  // the address), so it must be saved first.
  buttons('language').forEach((button) =>
    button.addEventListener('click', () => {
      const language = button.dataset.value as Language;
      if (language === currentLanguage()) return;
      if (saveLanguage(language)) window.location.reload();
      else message.textContent = t("This browser didn't let the app save it.");
    }),
  );

  startRemove.addEventListener('click', () => {
    clearStartPlace();
    // Focus would be lost with the button gone: keep it in the section.
    startText.focus();
  });
  // Also when "Start here" is pressed, or in another tab.
  onStartPlaceChange(renderStartPlace);

  clearButton.addEventListener('click', () => {
    const sure = window.confirm(
      t('Remove your favourites, start place and settings from this device?'),
    );
    if (!sure) return;
    // Start again from scratch, as on a first visit: the plain address, not
    // a reload (which would keep a place's link and open it again).
    if (clearAllStored()) window.location.assign(window.location.pathname);
    else message.textContent = t("This browser didn't let the app remove them.");
  });
  return open;
}

const UNIT_KINDS: readonly ChosenKind[] = ['wind', 'precipitation', 'pressure'];

/** "m/s, mm, hPa": the units Automatic gives now. */
function automaticUnitNames(): string {
  const { wind, precipitation, pressure } = automaticUnits();
  const windName = { ms: 'm/s', kmh: 'km/h', mph: 'mph', kn: 'kn', bft: 'Bft' }[wind];
  return [windName, precipitation === 'inch' ? 'in' : 'mm', pressure].join(', ');
}

/** How to add the app to the home screen from this browser's own menu. */
function installSteps(): string {
  const agent = navigator.userAgent;
  // iPads say "Macintosh" but have touch.
  const apple =
    /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);
  if (apple) return t('Tap the Share button (a square with an arrow), then Add to Home Screen.');
  if (/Firefox\//.test(agent)) return t('Open the browser menu (⋮), then choose Install.');
  return t("Open your browser's menu and choose Install app or Add to Home screen.");
}
