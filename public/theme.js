// Light or dark colours, set before the page is first drawn so a dark-mode
// user never sees a white flash. Loaded as a plain blocking script in the
// <head> (the CSP allows no inline scripts). src/theme.ts does the same
// after start-up and follows changes; keep the two in step.
(function () {
  var choice;
  try {
    choice = JSON.parse(localStorage.getItem('nordic-weather:theme'));
  } catch {
    // Blocked or damaged storage: follow the device.
  }
  var dark =
    choice === 'dark' ||
    (choice !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  var bar = document.querySelector('meta[name="theme-color"]');
  if (bar) bar.setAttribute('content', dark ? '#1b2633' : '#0b63ce');
})();
