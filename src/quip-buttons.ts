// "🎲 Weather excuse" and "💬 Small talk" in the weather panel's ⋯ menu.
// Their code and lines (quips/) are fetched only when one is pressed:
// start-up code stays small.

import type { PickedPoint } from './map';
import { placeUrl } from './place-link';
import type { Forecast } from './weather/api';
import { t } from './i18n';

export interface QuipButtons {
  /** The weather now in the panel: the buttons appear with it. */
  showFor(point: PickedPoint, forecast: Forecast): void;
  hide(): void;
}

export function setUpQuipButtons(
  excuseButton: HTMLButtonElement,
  smallTalkButton: HTMLButtonElement,
  status: HTMLElement,
): QuipButtons {
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  const buttons = [excuseButton, smallTalkButton];

  // If the code can't load (offline), the button does nothing this time.
  excuseButton.addEventListener('click', () => {
    if (!shown) return;
    const { point, forecast } = shown;
    Promise.all([import('./quips/card'), import('./quips/excuses')]).then(
      ([{ showCard }, { excusesFor }]) =>
        showCard({
          icon: '🎲',
          title: t('Weather excuse'),
          lines: () => excusesFor(forecast),
          placeLink: placeUrl(point),
          status,
        }),
      () => undefined,
    );
  });
  smallTalkButton.addEventListener('click', () => {
    if (!shown) return;
    const { point, forecast } = shown;
    Promise.all([import('./quips/card'), import('./quips/small-talk')]).then(
      ([{ showCard }, { smallTalkFor }]) =>
        showCard({
          icon: '💬',
          title: t('Small talk'),
          lines: () => smallTalkFor(forecast),
          placeLink: placeUrl(point),
          status,
        }),
      () => undefined,
    );
  });

  return {
    showFor(point, forecast) {
      shown = { point, forecast };
      buttons.forEach((button) => (button.hidden = false));
    },
    hide() {
      shown = undefined;
      buttons.forEach((button) => (button.hidden = true));
      document.querySelector('.quip')?.remove();
    },
  };
}
