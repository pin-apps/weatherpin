// The weather panel's ⋯ menu actions (Start here and the ⌂ mark, Share
// this place, Share as a picture, the weather excuse, small talk and haiku,
// Drift here, Weather on a day), set up together. Loaded right after start-up, not
// with it (main.ts; start-up size budget): main.ts keeps the place and
// weather shown until then and hands them over.

import { setUpDriftButton } from './drift-button';
import type { PickedPoint } from './map';
import { setUpPastWeatherButton } from './past-weather-button';
import { setUpPostcardButton } from './postcard-button';
import { setUpQuipButtons } from './quip-buttons';
import { setUpShareButton } from './share-button';
import { setUpStartPlaceButton } from './start-place-button';
import type { Forecast } from './weather/api';

export interface PanelActions {
  /** The place shown, and its weather once it's there. */
  show(point: PickedPoint, forecast?: Forecast): void;
  hide(): void;
}

export function setUpPanelActions(status: HTMLElement): PanelActions {
  const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;
  const startPlace = setUpStartPlaceButton(
    button('.panel__start'),
    document.querySelector<HTMLElement>('.panel__start-mark')!,
    status,
  );
  const share = setUpShareButton(button('.panel__share'), status);
  const postcard = setUpPostcardButton(button('.panel__postcard'), status);
  const quips = setUpQuipButtons(
    button('.panel__excuse'),
    button('.panel__small-talk'),
    button('.panel__haiku'),
    status,
  );
  const drift = setUpDriftButton(button('.panel__drift'), status);
  const past = setUpPastWeatherButton(button('.panel__past'), status);
  // These draw from the weather, so they show only once it's there.
  const withWeather = [postcard, quips, drift, past];

  return {
    show(point, forecast) {
      startPlace.showFor(point);
      share.showFor(point);
      for (const action of withWeather) {
        if (forecast) action.showFor(point, forecast);
        else action.hide();
      }
    },
    hide() {
      for (const action of [startPlace, share, ...withWeather]) action.hide();
    },
  };
}
