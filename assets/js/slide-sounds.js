// Short sound effects tied to a slide. For now: when the Zello (communication) slide turns on, a short radio exchange plays:
// the call "Checkpoint in-charge" (radio-checkpoint-in-charge.mp3) and then the answer "Receiving, all clear" (radio-receiving-all-clear.mp3).
// It starts about 0.4 s after the slide opens (never in the middle of the slide), plays once per arrival, and stops at once if the
// viewer leaves. If the browser refuses to play sound it simply stays silent. ?sound=off (or window.turSoundsDisabled = true) turns it off.
(async () => {
  await window.deckEditorReady;
  const deck = document.querySelector('#deck');
  const assets = ['#radio-call', '#radio-reply'].map((query) => document.querySelector(query));   // name the files (the export pack inlines them); never played themselves
  if (!deck || assets.some((asset) => !asset)) return;

  const SLIDE_ID = 'communication-zello';
  const DELAY_MS = 400, GAP_MS = 450;                             // before the call, and between the call and the answer
  const disabled = () => window.turSoundsDisabled === true || /[?&]sound=off\b/.test(location.search);
  const editorOpen = () => Boolean(document.querySelector('#deck-editor')?.open);
  const activeId = () => deck.querySelector(':scope > .slide.active')?.id || null;

  const clips = assets.map(() => { const clip = new Audio(); clip.preload = 'auto'; clip.volume = 0.9; return clip; });
  const ensureSources = () => clips.forEach((clip, i) => { if (!clip.getAttribute('src')) clip.src = assets[i].getAttribute('src'); });   // nothing is downloaded while sounds are off
  if (!disabled()) ensureSources();
  let current = activeId(), timer = 0, run = 0;                   // opening the deck on this slide does not play (browsers block it anyway)

  const stop = () => {
    run += 1; clearTimeout(timer); timer = 0;
    clips.forEach((clip) => { clip.onended = null; try { clip.pause(); clip.currentTime = 0; } catch {} });
  };
  function play(token, i) {
    if (token !== run || activeId() !== SLIDE_ID || document.hidden || editorOpen()) return;
    const clip = clips[i];
    clip.onended = () => {
      clip.onended = null;
      if (token === run && i + 1 < clips.length) timer = setTimeout(() => { timer = 0; play(token, i + 1); }, GAP_MS);
    };
    const attempt = clip.play();
    if (attempt && attempt.catch) attempt.catch(() => {});        // sound refused by the browser: stay silent
  }
  function schedule() {
    if (disabled() || document.hidden || editorOpen()) return;
    ensureSources();
    const token = ++run;
    timer = setTimeout(() => { timer = 0; play(token, 0); }, DELAY_MS);
  }

  new MutationObserver(() => {
    const now = activeId();
    if (now === current) return;
    const before = current; current = now;
    stop();                                                       // leaving a slide always silences it
    if (now === SLIDE_ID && before !== SLIDE_ID) schedule();
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  window.turSounds = { clips, audio: clips[0], get pending() { return timer !== 0; }, get playing() { return clips.some((clip) => !clip.paused && !clip.ended); } };
})();
