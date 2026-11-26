// Handing a postcard picture to the user: the system share sheet where it
// takes files (phones), else a download. Shared by today's postcard (the
// ⋯ menu) and a past day's (Weather on a day).

import type { PickedPoint } from './map';
import { t } from './i18n';

/** "weatherpin-helsinki.png", or "weatherpin-helsinki-1987-03-14.png" with a date. */
export function pictureFileName(point: PickedPoint, date?: string): string {
  const slug = (point.name?.split(',')[0] ?? 'place')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `weatherpin-${slug || 'place'}${date ? `-${date}` : ''}.png`;
}

/**
 * Shares `picture` (the share sheet), else downloads it. `say` tells the
 * user what happened when it was downloaded.
 */
export async function sharePicture(
  picture: Blob,
  name: string,
  title: string,
  say: (text: string) => void,
): Promise<void> {
  const file = new File([picture], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      window.dispatchEvent(new Event('weatherpin:shared'));
      return;
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  // After the browser has taken the file.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  say(t('Picture saved'));
  window.dispatchEvent(new Event('weatherpin:shared'));
}
