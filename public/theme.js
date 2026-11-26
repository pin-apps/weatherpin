// Light or dark colours and the colour set (skin), set before the page is
// first drawn so a dark-mode user never sees a white flash. Loaded as a plain blocking script in the
// <head> (the CSP allows no inline scripts). src/theme.ts does the same
// after start-up and follows changes; keep the two in step.
(function () {
  var choice;
  try {
    choice = JSON.parse(localStorage.getItem('nordic-weather:theme'));
  } catch {
    // Blocked or damaged storage: follow the device.
  }
  var skin;
  try {
    skin = JSON.parse(localStorage.getItem('nordic-weather:skin'));
  } catch {
    // Blocked or damaged storage: the classic colours.
  }
  // Light and dark browser bar colours per skin (as in src/theme.ts).
  var bars = {
    classic: ['#0b63ce', '#1b2633'],
    nordic: ['#0e6a70', '#0f2131'],
    sauna: ['#9a3d12', '#2a1c13'],
    retro: ['#a8430c', '#3a2a1d'],
    contrast: ['#000000', '#000000'],
  };
  // Only a name from the list (not e.g. "__proto__" from damaged storage).
  if (typeof skin !== 'string' || !Object.prototype.hasOwnProperty.call(bars, skin)) {
    skin = 'classic';
  }
  var dark =
    choice === 'dark' ||
    (choice !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  if (skin !== 'classic') document.documentElement.dataset.skin = skin;
  var bar = document.querySelector('meta[name="theme-color"]');
  if (bar) bar.setAttribute('content', bars[skin][dark ? 1 : 0]);
})();
