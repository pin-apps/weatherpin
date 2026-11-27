// The "About" dialog: data sources, licences, privacy and "Use at your own
// risk", opened from "About" in the map's credit line, at the bottom of
// Settings, or a link to #about. A native <dialog>: Escape closes it and
// focus stays inside while it's open. (Settings are in settings.ts.)

import { loadAboutTexts, translatePage } from './i18n';

export function setUpAbout(dialog: HTMLDialogElement): void {
  // Its texts load on the first opening (i18n.ts), translated once.
  let ready: Promise<void> | undefined;
  function open() {
    ready ??= loadAboutTexts().then(() => translatePage(dialog));
    void ready.then(() => {
      if (!dialog.open) dialog.showModal();
    });
  }

  // Any link to #about, now or later (Leaflet redraws its credit line).
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href="#about"]');
    if (!link) return;
    event.preventDefault();
    open();
  });

  dialog.querySelector('.about__close')!.addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop (the dialog element itself, outside its
  // content) closes it too.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Opened straight from a link to the page's #about.
  if (window.location.hash === '#about') open();
}
