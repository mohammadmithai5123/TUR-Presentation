// Short sound effects tied to a slide. For now: the "Roger that" radio voice when the Zello (communication) slide turns on.
// It starts about 0.4 s after the slide opens (never in the middle of the slide), plays once per arrival, and stops at once if the
// viewer leaves. If the browser refuses to play sound it simply stays silent. ?sound=off (or window.turSoundsDisabled = true) turns it off.
(async () => {
  await window.deckEditorReady;
  const deck = document.querySelector('#deck');
  const asset = document.querySelector('#roger-sound');           // names the file (the export pack inlines it); never played itself
  if (!deck || !asset) return;

  const SLIDE_ID = 'communication-zello';
  const DELAY_MS = 400;
  const disabled = () => window.turSoundsDisabled === true || /[?&]sound=off\b/.test(location.search);
  const editorOpen = () => Boolean(document.querySelector('#deck-editor')?.open);
  const activeId = () => deck.querySelector(':scope > .slide.active')?.id || null;

  const audio = new Audio(asset.getAttribute('src'));
  audio.preload = 'auto'; audio.volume = 0.9;
  let current = activeId(), timer = 0;                            // opening the deck on this slide does not play (browsers block it anyway)

  const stop = () => { clearTimeout(timer); timer = 0; try { audio.pause(); audio.currentTime = 0; } catch {} };
  function schedule() {
    if (disabled() || document.hidden || editorOpen()) return;
    timer = setTimeout(() => {
      timer = 0;
      if (activeId() !== SLIDE_ID || document.hidden || editorOpen()) return;
      const attempt = audio.play();
      if (attempt && attempt.catch) attempt.catch(() => {});      // sound refused by the browser: stay silent
    }, DELAY_MS);
  }

  new MutationObserver(() => {
    const now = activeId();
    if (now === current) return;
    const before = current; current = now;
    stop();                                                       // leaving a slide always silences it
    if (now === SLIDE_ID && before !== SLIDE_ID) schedule();
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  window.turSounds = { audio, get pending() { return timer !== 0; } };
})();
