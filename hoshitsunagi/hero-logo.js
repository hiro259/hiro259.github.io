(() => {
  const control = document.querySelector('[data-hero-logo-switch]');
  if (!control) return;

  const icon = control.querySelector('.app-icon');
  const kanji = control.querySelector('.kanji-image');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouseHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let isKanji = false;
  let isManual = false;
  let timers = [];

  function showKanji(show) {
    isKanji = show;
    control.classList.toggle('is-kanji', show);
    control.setAttribute('aria-pressed', String(show));
    control.setAttribute('aria-label', show
      ? 'Show HOSHITSUNAGI app icon'
      : 'Show HOSHITSUNAGI Japanese logo');
  }

  function takeControl() {
    isManual = true;
    timers.forEach(window.clearTimeout);
    timers = [];
    control.classList.remove('is-autoplay');
  }

  control.addEventListener('pointerenter', (event) => {
    if (mouseHover.matches && event.pointerType === 'mouse') {
      takeControl();
      showKanji(true);
    }
  });

  control.addEventListener('pointerleave', (event) => {
    if (mouseHover.matches && event.pointerType === 'mouse') {
      takeControl();
      showKanji(false);
    }
  });

  control.addEventListener('click', (event) => {
    // Pointer hover already chooses the state. Keyboard and touch clicks toggle it.
    if (mouseHover.matches && event.detail !== 0 && event.pointerType === 'mouse') {
      takeControl();
      showKanji(control.matches(':hover'));
      return;
    }
    takeControl();
    showKanji(!isKanji);
  });

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches && !isManual) {
      takeControl();
      showKanji(false);
    }
  });

  // Decode both images before starting, so a slow connection cannot reveal a blank logo.
  // Reduced-motion users get the initial icon and may switch it manually without fades.
  if (reducedMotion.matches) return;
  Promise.all([icon.decode(), kanji.decode()]).then(() => {
    if (isManual || reducedMotion.matches) return;
    control.classList.add('is-autoplay');
    timers = [
      window.setTimeout(() => showKanji(true), 2000),
      window.setTimeout(() => showKanji(false), 6200),
      window.setTimeout(() => {
        control.classList.remove('is-autoplay');
        timers = [];
      }, 7400),
    ];
  }).catch(() => {
    // Keep the original app icon if either asset cannot be decoded.
    control.disabled = true;
  });
})();
