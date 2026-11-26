// Weather levels (🌬️ Breeze → 💎 Diamond dust): the chip next to ⚙ with
// the level's emoji and a ring filling up to the next level. Only this is
// start-up code; the points are worked out in award.ts and the card and
// texts load on demand. Everything stays on the device.

import { LEVELS, levelIndex, savedTotals, type JourneyEvent } from './levels';

export type { JourneyEvent };

let refresh = () => {};

/** Counts something towards the level (award.ts, on demand), then redraws. */
export function noteJourney(event: JourneyEvent): void {
  void import('./award')
    .then(({ award }) => {
      const news = award(event);
      refresh();
      if (news)
        void import('./card').then(
          ({ toast }) => toast(news),
          () => undefined,
        );
    })
    .catch(() => undefined);
}

export function setUpLevelChip(button: HTMLButtonElement): void {
  const emoji = button.querySelector<HTMLElement>('.level-chip__emoji')!;
  refresh = () => {
    const totals = savedTotals();
    const index = levelIndex(totals);
    const level = LEVELS[index];
    const next = LEVELS[index + 1] as (typeof LEVELS)[number] | undefined;
    emoji.textContent = level.emoji;
    const progress = next ? (totals.points - level.points) / (next.points - level.points) : 1;
    // Through the style property, which the CSP allows (unlike style="").
    button.style.setProperty('--level-progress', String(Math.max(0, Math.min(1, progress))));
    // The level's name in words for screen readers, once the texts are in.
    // (Offline before it loaded: the plain "Your level" label stays.)
    void import('./texts')
      .then(({ chipLabel }) => {
        // Points enough but badges missing (the top level): no "of".
        const label = chipLabel(
          index,
          totals.points,
          next && next.points > totals.points ? next.points : undefined,
        );
        button.setAttribute('aria-label', label);
        button.title = label;
      })
      .catch(() => undefined);
  };
  button.addEventListener('click', () => {
    void import('./card').then(
      ({ openJourney }) => openJourney(),
      () => undefined,
    );
  });
  refresh();
}
