/* Real in-game footage; no network request until the section is viewed or selected. */
(() => {
  const section = document.querySelector('[data-gameplay-showcase]');
  if (!section) return;

  const video = section.querySelector('[data-gameplay-video]');
  const source = section.querySelector('[data-gameplay-source]');
  const panel = section.querySelector('[data-gameplay-panel]');
  const toggle = section.querySelector('[data-gameplay-toggle]');
  const soundToggle = section.querySelector('[data-gameplay-sound]');
  const caption = section.querySelector('[data-gameplay-caption]');
  const tabs = Array.from(section.querySelectorAll('[data-gameplay-clip]'));
  if (!video || !source || !panel || !toggle || !soundToggle || !caption || tabs.length !== 2) return;

  const clips = {
    play: {
      src: './presentation/videos/play-1.mp4',
      poster: './presentation/posters/play-1.jpg',
      label: 'HOSHITSUNAGI real gameplay: connecting stars',
      caption: 'PLAY · Actual in-game footage · 11s loop'
    },
    special: {
      src: './presentation/videos/play-3.mp4',
      poster: './presentation/posters/play-3.jpg',
      label: 'HOSHITSUNAGI real gameplay: SPECIAL effects',
      caption: 'SPECIAL · Actual in-game footage · 14s loop'
    }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let currentClip = 'play';
  let inView = false;
  let pausedByUser = false;

  function updateToggle() {
    const playing = !video.paused && !video.ended;
    toggle.textContent = playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', playing ? 'Pause gameplay video' : 'Play gameplay video');
    toggle.setAttribute('aria-pressed', String(playing));
  }

  function updateSound() {
    const soundOn = !video.muted;
    soundToggle.textContent = soundOn ? 'Sound On' : 'Sound Off';
    soundToggle.setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
    soundToggle.setAttribute('aria-pressed', String(soundOn));
  }

  function safePlay() {
    const result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(updateToggle);
    }
  }

  function canAutoPlay() {
    return inView && !document.hidden && !reducedMotion.matches && !saveData && !pausedByUser;
  }

  function syncPlayback() {
    // If the viewer leaves the section or backgrounds the tab, never resume audibly.
    if ((!inView || document.hidden) && !video.muted) {
      video.muted = true;
      updateSound();
    }
    if (canAutoPlay()) {
      safePlay();
    } else {
      video.pause();
    }
    updateToggle();
  }

  function selectClip(key) {
    if (!clips[key] || key === currentClip) return;
    currentClip = key;
    pausedByUser = false;
    video.pause();

    const clip = clips[key];
    source.src = clip.src;
    video.poster = clip.poster;
    video.setAttribute('aria-label', clip.label);
    caption.textContent = clip.caption;

    tabs.forEach((tab) => {
      const selected = tab.dataset.gameplayClip === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });

    video.load();
    syncPlayback();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectClip(tab.dataset.gameplayClip));
    tab.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectClip(tabs[next].dataset.gameplayClip);
      tabs[next].focus();
    });
  });

  toggle.addEventListener('click', () => {
    if (video.paused) {
      pausedByUser = false;
      safePlay();
    } else {
      pausedByUser = true;
      video.pause();
    }
    updateToggle();
  });

  soundToggle.addEventListener('click', () => {
    video.muted = !video.muted;
    updateSound();
    // Unmuting is always a deliberate gesture; video playback has its own control.
  });

  video.addEventListener('play', updateToggle);
  video.addEventListener('pause', updateToggle);
  video.addEventListener('ended', updateToggle);
  document.addEventListener('visibilitychange', syncPlayback);

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', syncPlayback);
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(syncPlayback);
  }

  /* Show a poster until the clip is meaningfully on screen. */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35);
      syncPlayback();
    }, { threshold: [0, 0.35, 0.75] });
    observer.observe(section.querySelector('.gameplay-demo'));
  } else {
    inView = true;
    syncPlayback();
  }

  /* Keep native video controls if scripting never executes. */
  video.controls = false;
  video.muted = true;
  updateToggle();
  updateSound();
})();
