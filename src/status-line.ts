// A short message line that clears itself, e.g. "Link copied". The element
// is a live region that stays in the page (empty when idle): screen
// readers often miss text added to a region that was hidden a moment
// before. Shared by the ⋯ menu's actions, which use the same line.

export interface StatusLine {
  /** Shows `text`; it goes away after a few seconds unless `stay`. */
  say(text: string, stay?: boolean): void;
  clear(): void;
}

// Long enough to read, then it goes away.
const DURATION_MS = 4000;

const lines = new WeakMap<HTMLElement, StatusLine>();

/** The status line for `element` (one per element, whoever asks). */
export function statusLine(element: HTMLElement): StatusLine {
  let line = lines.get(element);
  if (line) return line;
  let timer: number | undefined;
  line = {
    say(text, stay = false) {
      window.clearTimeout(timer);
      element.textContent = text;
      if (!stay) timer = window.setTimeout(() => (element.textContent = ''), DURATION_MS);
    },
    clear() {
      window.clearTimeout(timer);
      element.textContent = '';
    },
  };
  lines.set(element, line);
  return line;
}
