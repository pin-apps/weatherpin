// Mobile bottom sheet behaviour for the weather panel. The layout itself is
// CSS (a media query); this only toggles the collapsed state.

// Matches the CSS breakpoint where the panel becomes a bottom sheet.
const MOBILE_QUERY = window.matchMedia('(max-width: 767px)');

// How far (px) a vertical swipe must travel to count as collapse/expand.
const SWIPE_THRESHOLD = 40;

// How long after a swipe a click still counts as part of that swipe.
const CLICK_AFTER_SWIPE_MS = 300;

export interface Sheet {
  /** Opens a collapsed phone sheet (nothing on desktop). */
  expand(): void;
}

export function setUpSheet(panel: HTMLElement): Sheet {
  const handle = panel.querySelector<HTMLButtonElement>('.panel__handle')!;
  const dragArea = panel.querySelector<HTMLElement>('.panel__top')!;

  function setCollapsed(collapsed: boolean) {
    panel.classList.toggle('panel--collapsed', collapsed);
    // The label stays fixed; aria-expanded tells screen readers the state.
    handle.setAttribute('aria-expanded', String(!collapsed));
  }

  handle.addEventListener('click', () => {
    setCollapsed(!panel.classList.contains('panel--collapsed'));
  });

  // Swipe on the top bar: down collapses, up expands. Taps (e.g. on the
  // close button) move less than the threshold and are left alone.
  let startY: number | undefined;
  // A swipe that ends on a button would also "click" it (toggling the sheet
  // straight back, or closing it), so the click right after a swipe is eaten.
  let swallowNextClick = false;

  dragArea.addEventListener('pointerdown', (event) => {
    startY = event.clientY;
    swallowNextClick = false;
  });
  dragArea.addEventListener('pointerup', (event) => {
    if (startY === undefined) return;
    const distance = event.clientY - startY;
    startY = undefined;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    setCollapsed(distance > 0);
    swallowNextClick = true;
    // The browser sends that click immediately; don't eat a later real one.
    window.setTimeout(() => (swallowNextClick = false), CLICK_AFTER_SWIPE_MS);
  });
  dragArea.addEventListener('pointercancel', () => {
    startY = undefined;
  });

  // Capture phase: runs before the buttons' own click handlers.
  dragArea.addEventListener(
    'click',
    (event) => {
      if (!swallowNextClick) return;
      swallowNextClick = false;
      event.stopPropagation();
      event.preventDefault();
    },
    true,
  );

  setCollapsed(false);
  trackSheetHeight(panel);
  return { expand: () => setCollapsed(false) };
}

/**
 * Publishes how much of the screen bottom the sheet covers as the CSS
 * variable --sheet-height, so the map attribution and the location button
 * can sit just above it. 0 on desktop (side panel) or when the panel is closed.
 */
function trackSheetHeight(panel: HTMLElement) {
  const update = () => {
    const covered = MOBILE_QUERY.matches && !panel.hidden ? panel.offsetHeight : 0;
    // Set through the style property, which the CSP allows (unlike style="").
    document.documentElement.style.setProperty('--sheet-height', `${covered}px`);
  };
  // Fires when the sheet opens, closes, collapses or changes size.
  new ResizeObserver(update).observe(panel);
  MOBILE_QUERY.addEventListener('change', update);
  update();
}
