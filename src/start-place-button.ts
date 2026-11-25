// "Start here" in the weather panel's ⋯ menu: makes the place shown the
// start place, or (pressed again) removes it. A small ⌂ next to the panel
// title shows when the place is the start place, and the status line under
// the header says what changed (the menu has closed by then). Hidden when
// the browser can't save.

import type { PickedPoint } from './map';
import {
  clearStartPlace,
  isStartPlace,
  onStartPlaceChange,
  setStartPlace,
  startPlaceAvailable,
} from './start-place';
import { statusLine } from './status-line';
import { t } from './i18n';

export interface StartPlaceButton {
  /** Shows the button for the place now in the panel. */
  showFor(point: PickedPoint): void;
  hide(): void;
}

export function setUpStartPlaceButton(
  button: HTMLButtonElement,
  mark: HTMLElement,
  status: HTMLElement,
): StartPlaceButton {
  const icon = button.querySelector<HTMLElement>('.panel__start-icon')!;
  const { say } = statusLine(status);
  let point: PickedPoint | undefined;

  function render() {
    const on = point !== undefined && isStartPlace(point);
    // The name stays "Start here"; aria-pressed says whether it's on.
    button.setAttribute('aria-pressed', String(on));
    button.title = on
      ? t('The app opens here. Press to open at the world map instead.')
      : t('Open the app at this place next time');
    icon.textContent = on ? '✓' : '⌂';
    mark.hidden = !on;
  }

  button.addEventListener('click', () => {
    if (!point) return;
    if (isStartPlace(point)) {
      clearStartPlace();
      say(t('The app will open at the world map.'));
    } else if (setStartPlace(point)) {
      say(t('The app will open here.'));
    } else {
      say(t("This browser didn't let the app save it."));
    }
    render();
  });

  // Changed in another tab: keep this one honest.
  onStartPlaceChange(render);

  return {
    showFor(newPoint) {
      point = newPoint;
      button.hidden = !startPlaceAvailable();
      render();
    },
    hide() {
      point = undefined;
      button.hidden = true;
      mark.hidden = true;
    },
  };
}
