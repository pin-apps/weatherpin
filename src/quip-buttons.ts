// "🎲 Weather excuse", "💬 Small talk" and "🍃 Weather haiku" in the
// weather panel's ⋯ menu. Their code and lines (quips/) are fetched only
// when one is pressed: start-up code stays small.

import type { PickedPoint } from './map';
import { placeUrl } from './place-link';
import type { Forecast } from './weather/api';

export interface QuipButtons {
  /** The weather now in the panel: the buttons appear with it. */
  showFor(point: PickedPoint, forecast: Forecast): void;
  hide(): void;
}

type Lines = (forecast: Forecast) => string[];

export function setUpQuipButtons(
  excuseButton: HTMLButtonElement,
  smallTalkButton: HTMLButtonElement,
  haikuButton: HTMLButtonElement,
  status: HTMLElement,
): QuipButtons {
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  // Each button and its lines, loaded when pressed.
  const quips: [HTMLButtonElement, () => Promise<Lines>][] = [
    [excuseButton, () => import('./quips/excuses').then((m) => m.excusesFor)],
    [smallTalkButton, () => import('./quips/small-talk').then((m) => m.smallTalkFor)],
    [haikuButton, () => import('./quips/haiku').then((m) => m.haikuFor)],
  ];

  for (const [button, load] of quips) {
    // If the code can't load (offline), the button does nothing this time.
    button.addEventListener('click', () => {
      if (!shown) return;
      const { point, forecast } = shown;
      // The card's icon and title are the button's own (already translated).
      const [icon, title] = [...button.children].map((child) => child.textContent ?? '');
      Promise.all([import('./quips/card'), load()]).then(
        ([{ showCard }, linesFor]) =>
          showCard({
            icon,
            title,
            lines: () => linesFor(forecast),
            placeLink: placeUrl(point),
            status,
          }),
        () => undefined,
      );
    });
  }

  return {
    showFor(point, forecast) {
      shown = { point, forecast };
      quips.forEach(([button]) => (button.hidden = false));
    },
    hide() {
      shown = undefined;
      quips.forEach(([button]) => (button.hidden = true));
      document.querySelector('.quip')?.remove();
    },
  };
}
