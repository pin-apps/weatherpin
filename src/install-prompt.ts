// "Add to home screen" (Settings): browsers that can install the app
// (Chrome, Edge, Samsung Internet) say so once, soon after the page loads,
// with a `beforeinstallprompt` event; it's kept here, at start-up, until
// Settings (loaded later) needs it. Safari and Firefox have no such event:
// Settings shows how to do it from their menu instead.

/** The event Chromium browsers fire when the app can be installed. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let promptEvent: InstallPromptEvent | undefined;
let installedNow = false;

window.addEventListener('beforeinstallprompt', (event) => {
  // No browser banner of its own: the button in Settings offers it.
  event.preventDefault();
  promptEvent = event as InstallPromptEvent;
});
window.addEventListener('appinstalled', () => {
  installedNow = true;
  promptEvent = undefined;
});

/** The kept install prompt, if the browser offered one (and it's unused). */
export function installPrompt(): InstallPromptEvent | undefined {
  return promptEvent;
}

/** A prompt can be used once. */
export function promptUsed(): void {
  promptEvent = undefined;
}

/** Opened from the home screen icon, or installed during this visit. */
export function runsInstalled(): boolean {
  const iosHomeScreen = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installedNow || iosHomeScreen || matchMedia('(display-mode: standalone)').matches;
}
