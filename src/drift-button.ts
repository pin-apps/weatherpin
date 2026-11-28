// "🚗 Drift here" in the weather panel's ⋯ menu: opens the drift game
// (drift/drift.ts, fetched the first time) on the weather now at the place
// shown. Presses while it loads open it once.

import { t } from './i18n';
import type { PickedPoint } from './map';
import { statusLine } from './status-line';
import type { Forecast } from './weather/api';

export interface DriftButton {
  /** The weather now in the panel: the button appears with it. */
  showFor(point: PickedPoint, forecast: Forecast): void;
  hide(): void;
}

export function setUpDriftButton(button: HTMLButtonElement, status: HTMLElement): DriftButton {
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  let loading = false;
  const { say, clear } = statusLine(status);

  button.addEventListener('click', async () => {
    if (!shown || loading) return;
    const { point, forecast } = shown;
    loading = true;
    try {
      const { openDrift } = await import('./drift/drift');
      openDrift(point, forecast);
    } catch {
      say(t("Couldn't open it. Check your connection."));
    } finally {
      loading = false;
    }
  });

  return {
    showFor(point, forecast) {
      shown = { point, forecast };
      button.hidden = false;
    },
    hide() {
      shown = undefined;
      button.hidden = true;
      clear();
    },
  };
}
