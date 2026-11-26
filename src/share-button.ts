// "Share this place" in the weather panel's ⋯ menu: sends a link to the
// place shown. Phones (and some desktops) open their own share sheet;
// elsewhere the link is copied. The status line under the panel's header
// says what happened (the menu has closed by then).

import type { PickedPoint } from './map';
import { placeUrl } from './place-link';
import { statusLine } from './status-line';
import { t } from './i18n';

export interface ShareButton {
  /** Shows the button for the place now in the panel. */
  showFor(point: PickedPoint): void;
  hide(): void;
}

export function setUpShareButton(button: HTMLButtonElement, status: HTMLElement): ShareButton {
  let point: PickedPoint | undefined;
  const { say, clear } = statusLine(status);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      say(t('Link copied'));
      window.dispatchEvent(new Event('weatherpin:shared'));
    } catch {
      // No clipboard (old browser, or not allowed): show the link to copy by hand.
      say(url, true);
    }
  }

  button.addEventListener('click', async () => {
    if (!point) return;
    const url = placeUrl(point);
    const title = point.name ? t('Weather in {place}', { place: point.name }) : t('Weather here');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        // Counts towards the weather level (main.ts).
        window.dispatchEvent(new Event('weatherpin:shared'));
        return;
      } catch (error) {
        // Closing the share sheet is a choice, not a failure.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copy(url);
  });

  return {
    showFor(newPoint) {
      point = newPoint;
      button.hidden = false;
      clear();
    },
    hide() {
      point = undefined;
      button.hidden = true;
      clear();
    },
  };
}
