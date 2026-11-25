// The ⋯ button in the weather panel's header and its small menu: the
// place's less used actions (Share this place, Start here), kept out of
// the way of the weather. A disclosure (a button that shows and hides a
// group of buttons), so the items stay plain buttons for screen readers
// and Tab reaches them right after ⋯.
//
// Closes on Escape (focus back on ⋯), on a click outside it, after an item
// is pressed, and when the panel shows another place or closes.

export interface PanelMenu {
  close(): void;
}

export function setUpPanelMenu(
  button: HTMLButtonElement,
  menu: HTMLElement,
  { onOpen }: { onOpen(): void },
): PanelMenu {
  const isOpen = () => !menu.hidden;

  function open() {
    // E.g. a collapsed phone sheet expands, so the menu has room to show.
    onOpen();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', closeIfOutside, true);
  }

  function close() {
    if (!isOpen()) return;
    // Focus inside the menu would be lost as it hides: back to ⋯.
    const hadFocus = menu.contains(document.activeElement);
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', closeIfOutside, true);
    if (hadFocus) button.focus();
  }

  function closeIfOutside(event: PointerEvent) {
    const target = event.target as Node;
    if (!menu.contains(target) && !button.contains(target)) close();
  }

  button.addEventListener('click', () => (isOpen() ? close() : open()));

  // After the item's own click handler has run (bubbling reaches the menu
  // after the item).
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('button')) close();
  });

  // Escape closes the menu, not the whole panel (whose own Escape handler
  // is further up).
  for (const element of [button, menu]) {
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.stopPropagation();
      close();
      button.focus();
    });
  }

  // Tabbing past the last item (or back before ⋯) closes it.
  menu.addEventListener('focusout', (event) => {
    const next = event.relatedTarget as Node | null;
    if (next && !menu.contains(next) && next !== button) close();
  });

  return { close };
}
