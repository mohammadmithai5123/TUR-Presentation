// Cinematic intro on slide 2 only: it plays once each time the viewer arrives on slide 2 *from slide 1* (Start button, Enter, arrows,
// click, or the slide list). Opening slide 2 any other way (Back from slide 3, a link like #2, a reload) shows the slide as usual.
//
// How it works: an overlay with the video is placed over slide 2, and the slide's own content waits underneath (hidden, with its
// entrance animations held). In the last 0.6 s the overlay cross-fades away and the content enters with its normal animation.
// Click, Space, Enter or Right Arrow skip it. Leaving slide 2, hiding the tab or opening the editor stops it at once (and the sound).
// It is skipped with "reduce motion", when the video cannot load within 2 s, and with ?intro=off (or window.turIntroDisabled = true).
(async () => {
  await window.deckEditorReady;
  const deck = document.querySelector('#deck');
  const asset = document.querySelector('#intro-video');            // declares the file (the export pack inlines it); never played itself
  if (!deck || !asset) return;

  const SRC = asset.getAttribute('src');
  const FADE = 0.6;                                                 // seconds of cross-fade at the end
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const disabled = () => window.turIntroDisabled === true || /[?&]intro=off\b/.test(location.search);
  const slidesNow = () => [...deck.querySelectorAll(':scope > .slide')];
  const editorOpen = () => Boolean(document.querySelector('#deck-editor')?.open);

  // One detached player, preloaded while the title slide is on screen, so slide 2 can start at once.
  const player = document.createElement('video');
  player.src = SRC; player.preload = 'auto'; player.playsInline = true; player.volume = 0.7;
  player.setAttribute('playsinline', ''); player.setAttribute('aria-hidden', 'true');
  if (!disabled()) { try { player.load(); } catch {} }

  let last = slidesNow().find((s) => s.classList.contains('active')) || null;
  let run = null;

  function finish() {                                               // remove everything the intro put on the page
    if (!run) return;
    const r = run; run = null;
    cancelAnimationFrame(r.raf); clearTimeout(r.wait); clearTimeout(r.end);
    player.removeEventListener('canplay', r.onCanPlay); player.removeEventListener('error', r.onError); player.removeEventListener('ended', r.onEnded);
    try { player.pause(); player.currentTime = 0; } catch {}
    player.muted = false; player.remove();
    r.overlay.remove();
    r.slide.classList.remove('intro-playing');
  }

  function reveal(fast) {                                           // hand over to slide 2's own content
    if (!run || run.revealed) return;
    run.revealed = true;
    run.overlay.classList.toggle('fast', Boolean(fast));
    run.slide.classList.remove('intro-playing');                    // its entrance animations start now, under the fading overlay
    run.overlay.classList.add('fading');
    run.end = setTimeout(finish, (fast ? 0.3 : FADE) * 1000 + 80);
  }

  function skip() {
    if (!run || run.revealed) return;
    try { player.pause(); } catch {}                                // the sound stops at once
    reveal(true);
  }

  function tick() {
    if (!run) return;
    if (document.hidden || editorOpen()) { finish(); return; }
    const d = player.duration || 9.6;
    if (!run.revealed && player.currentTime >= d - FADE) reveal(false);
    run.raf = requestAnimationFrame(tick);
  }

  function start(slide) {
    if (disabled() || reduce.matches || document.hidden || editorOpen()) return;
    if (run) finish();
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay'; overlay.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('p'); hint.className = 'intro-skip'; hint.textContent = 'Click or press Space to skip';
    player.muted = false; player.volume = 0.7;
    try { player.currentTime = 0; } catch {}
    overlay.append(player, hint);
    overlay.addEventListener('click', (event) => { event.stopPropagation(); skip(); });
    slide.append(overlay);
    slide.classList.add('intro-playing');
    const r = run = { slide, overlay, started: false, revealed: false, raf: 0, wait: 0, end: 0 };

    r.onError = () => finish();                                     // the video is missing: show the slide normally
    r.onEnded = () => { if (run === r) { reveal(false); } };
    r.onCanPlay = () => {
      if (run !== r || r.started) return;
      r.started = true; clearTimeout(r.wait);
      const p = player.play();
      if (p && p.catch) p.catch(() => {                              // the browser refused sound: play it silently instead
        if (run !== r) return;
        player.muted = true;
        player.play().catch(() => finish());
      });
      r.raf = requestAnimationFrame(tick);
    };
    player.addEventListener('error', r.onError); player.addEventListener('ended', r.onEnded);
    if (player.readyState >= 3) r.onCanPlay();
    else {
      player.addEventListener('canplay', r.onCanPlay, { once: true });
      try { player.load(); } catch {}
      r.wait = setTimeout(() => { if (run === r && !r.started) finish(); }, 2000);
    }
  }

  // Arriving on slide 2 straight from slide 1 starts the intro. (Class changes tell us which slide is open.)
  new MutationObserver(() => {
    const active = slidesNow().find((s) => s.classList.contains('active')) || null;
    if (active === last) return;
    const previous = last; last = active;
    if (run && run.slide !== active) finish();                      // left slide 2 (Back, jump, Home ...): stop at once
    const list = slidesNow();
    if (active && previous && active === list[1] && previous === list[0]) start(active);
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // While it plays, Space / Enter / Right Arrow / Page Down skip it instead of moving on.
  document.addEventListener('keydown', (event) => {
    if (!run || run.revealed) return;
    if ([' ', 'Enter', 'ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); skip(); }
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });

  window.turIntro = { get running() { return Boolean(run); }, skip, player };
})();
