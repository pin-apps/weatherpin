// "Weather on a day" in the weather panel's ⋯ menu: opens the dialog
// (past-weather.ts, fetched the first time) for the place shown.

import type { PickedPoint } from './map';
import { statusLine } from './status-line';
import type { Forecast } from './weather/api';
import { t } from './i18n';

export interface PastWeatherButton {
  /** The weather now in the panel: the button appears with it. */
  showFor(point: PickedPoint, forecast: Forecast): void;
  hide(): void;
}

export function setUpPastWeatherButton(
  button: HTMLButtonElement,
  status: HTMLElement,
): PastWeatherButton {
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  const { say, clear } = statusLine(status);

  button.addEventListener('click', async () => {
    if (!shown) return;
    const { point, forecast } = shown;
    try {
      const { openPastWeather } = await import('./past-weather');
      openPastWeather(point, forecast);
    } catch {
      say(t("Couldn't open it. Check your connection."));
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
