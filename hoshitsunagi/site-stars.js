/* Lightweight homepage sky based on the Flutter title seeds (game_controller.dart,
   game_painter_legacy.dart, and seed_profiles.dart). No gameplay is loaded. */
(() => {
  const canvas = document.querySelector('[data-site-stars]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // These are the six exact normalSeedProfiles colors in the iOS game.
  const palette = ['#70E1E8', '#64D5B4', '#B6A1EE', '#FF9E91', '#D99AAA', '#DCE8EF'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sprites = palette.map(makeSprite);
  const dustCount = 42;
  const frameInterval = 1000 / 30;
  let stars = [];
  let width = 0;
  let height = 0;
  let clock = 0;
  let previousFrame = 0;
  let animationId = 0;

  function makeSprite(color) {
    // Pre-render the game's soft colored halo + tiny white core once per color.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const ink = sprite.getContext('2d');
    if (!ink) return null;
    const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
    const rgba = (alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    const glow = ink.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, 'rgba(249,255,255,1)');
    glow.addColorStop(.035, 'rgba(249,255,255,.97)');
    glow.addColorStop(.075, rgba(.84));
    glow.addColorStop(.15, rgba(.58));
    glow.addColorStop(.30, rgba(.20));
    glow.addColorStop(.55, rgba(.065));
    glow.addColorStop(1, rgba(0));
    ink.fillStyle = glow;
    ink.fillRect(0, 0, 128, 128);
    return sprite;
  }

  // Stable arrangement on reload; movement is still continuous and organic.
  function makeRandom() {
    let seed = 741;
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  }

  function bounds(w, h) {
    const xInset = Math.min(80, Math.max(24, w * .08));
    const top = Math.min(90, Math.max(75, h * .08));
    const bottom = Math.min(80, Math.max(40, h * .08));
    return {
      left: xInset, right: Math.max(xInset + 1, w - xInset),
      top, bottom: Math.max(top + 1, h - bottom),
    };
  }

  function populate() {
    const random = makeRandom();
    const area = bounds(width, height);
    const count = width < 600 ? 8 : 12;
    stars = Array.from({ length: count }, (_, i) => {
      const angle = random() * Math.PI * 2;
      return {
        x: area.left + random() * (area.right - area.left),
        y: area.top + random() * (area.bottom - area.top),
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        phase: random() * 6,
        color: i % palette.length,
      };
    });
  }

  function resize() {
    const oldWidth = width;
    const oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const expected = width < 600 ? 8 : 12;
    if (!stars.length || stars.length !== expected) {
      populate();
    } else {
      const previous = bounds(oldWidth, oldHeight);
      const next = bounds(width, height);
      const normal = (value, low, high) => Math.min(1, Math.max(0, (value - low) / (high - low)));
      for (const star of stars) {
        star.x = next.left + normal(star.x, previous.left, previous.right) * (next.right - next.left);
        star.y = next.top + normal(star.y, previous.top, previous.bottom) * (next.bottom - next.top);
      }
    }
    draw();
  }

  function advance(dt) {
    clock += dt;
    const area = bounds(width, height);
    // Same title drift (speed 7) and curl frequencies as the Flutter controller.
    const damping = Math.pow(.992, dt * 60);
    for (const star of stars) {
      star.vx = star.vx * damping + Math.cos(clock * .72 + star.phase) * dt * 4;
      star.vy = star.vy * damping + Math.sin(clock * .61 + star.phase) * dt * 4;
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      if (star.x < area.left || star.x > area.right) star.vx *= -1;
      if (star.y < area.top || star.y > area.bottom) star.vy *= -1;
      star.x = Math.min(area.right, Math.max(area.left, star.x));
      star.y = Math.min(area.bottom, Math.max(area.top, star.y));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Keep the stars visible through the entire page, but quieter below Hero.
    const lowerPage = Math.min(1, window.scrollY / Math.max(1, height));
    const softness = 1 - .3 * lowerPage;

    ctx.fillStyle = 'rgba(184,216,232,.14)';
    for (let i = 0; i < dustCount; i++) {
      const x = ((i * 83.17 + Math.sin(clock * .08 + i) * 9) % width + width) % width;
      const y = ((i * 47.63 + Math.cos(clock * .06 + i) * 7) % height + height) % height;
      ctx.beginPath();
      ctx.arc(x, y, i % 5 === 0 ? 1.25 : .65, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const star of stars) {
      const sprite = sprites[star.color];
      if (!sprite) continue;
      const pulse = 1 + Math.sin(clock * 2 + star.phase) * .16;
      const diameter = 66 * pulse;
      ctx.globalAlpha = .77 * softness;
      ctx.drawImage(sprite, star.x - diameter / 2, star.y - diameter / 2, diameter, diameter);
    }
    ctx.globalAlpha = 1;
  }

  function stop() {
    if (animationId) window.cancelAnimationFrame(animationId);
    animationId = 0;
    previousFrame = 0;
  }

  function tick(timestamp) {
    animationId = 0;
    if (document.hidden || reduceMotion.matches) return;
    if (!previousFrame || timestamp - previousFrame >= frameInterval) {
      const dt = previousFrame ? Math.min(.04, (timestamp - previousFrame) / 1000) : 0;
      previousFrame = timestamp;
      advance(dt);
      draw();
    }
    animationId = window.requestAnimationFrame(tick);
  }

  function syncMotion() {
    stop();
    if (!reduceMotion.matches && !document.hidden) {
      animationId = window.requestAnimationFrame(tick);
    } // Otherwise the last frame stays visible without an animation loop.
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    if (reduceMotion.matches) draw();
  }, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reduceMotion.addEventListener('change', syncMotion);
  resize();
  syncMotion();
})();
