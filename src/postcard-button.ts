// "Share as a picture" in the weather panel's ⋯ menu: the postcard
// (postcard.ts) of the weather shown. Phones open their share sheet with
// the picture; elsewhere it's downloaded. The status line under the
// panel's header says what happened (the menu has closed by then).

import type { PickedPoint } from './map';
import { pictureFileName, sharePicture } from './share-picture';
import { statusLine } from './status-line';
import type { Forecast } from './weather/api';
import { t } from './i18n';

export interface PostcardButton {
  /** The weather now in the panel: the button appears with it. */
  showFor(point: PickedPoint, forecast: Forecast): void;
  hide(): void;
}

export function setUpPostcardButton(
  button: HTMLButtonElement,
  status: HTMLElement,
): PostcardButton {
  let shown: { point: PickedPoint; forecast: Forecast } | undefined;
  const { say, clear } = statusLine(status);

  button.addEventListener('click', async () => {
    if (!shown) return;
    const { point, forecast } = shown;
    let picture: Blob;
    try {
      // The drawing code is fetched only now, the first time.
      const { drawPostcard } = await import('./postcard');
      picture = await drawPostcard(point, forecast);
    } catch {
      say(t("Couldn't make the picture"));
      return;
    }
    const title = point.name ? t('Weather in {place}', { place: point.name }) : t('Weather here');
    await sharePicture(picture, pictureFileName(point), title, say);
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
