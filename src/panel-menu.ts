// The ⋯ button in the weather panel's header and its small menu: the
// place's less used actions (Share this place, Start here), kept out of
// the way of the weather. A disclosure (a button that shows and hides a
// group of buttons), so the items stay plain buttons for screen readers
// and Tab reaches them right after ⋯.
//
// Closes on Escape (focus back on ⋯), on a click outside it, after an item
// is pressed, and when the panel shows another place or closes.
//
// "🎉 For fun…" swaps the menu's contents to the fun actions (excuse, small
// talk, haiku, balloon, drift) with "‹ Back" first: the menu stays short, so
// it fits a phone's sheet without moving it. Closing goes back to the main
// list. (Those two buttons have data-menu-nav: pressing them doesn't close.)

export interface PanelMenu {
  close(): void;
}

export function setUpPanelMenu(
  button: HTMLButtonElement,
  menu: HTMLElement,
  { onOpen }: { onOpen(): void },
): PanelMenu {
  const isOpen = () => !menu.hidden;
  const main = menu.querySelector<HTMLElement>('.panel__menu-main')!;
  const fun = menu.querySelector<HTMLElement>('.panel__menu-fun')!;
  const funButton = menu.querySelector<HTMLButtonElement>('.panel__fun')!;
  const backButton = menu.querySelector<HTMLButtonElement>('.panel__fun-back')!;

  function showFun(on: boolean) {
    main.hidden = on;
    fun.hidden = !on;
    (on ? backButton : funButton).focus();
  }
  funButton.addEventListener('click', () => showFun(true));
  backButton.addEventListener('click', () => showFun(false));

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
    main.hidden = false;
    fun.hidden = true;
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
    const item = (event.target as Element).closest('button');
    if (item && !item.hasAttribute('data-menu-nav')) close();
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
