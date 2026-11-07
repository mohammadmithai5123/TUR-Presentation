// Credits on the closing slide: typed one block at a time, in the place where the old headline was, ending with the last credit and
// the closing line. The text in the slide is never changed: each line is revealed with a clip (CSS variable --p, 0 to 1) that follows
// the real width of the typed characters, so the credits stay editable, and nothing half-typed can be saved.
// Without script, with "reduce motion", in the editor and in print the credits are all shown at once in a grid instead.
// Leaving the slide, a hidden tab or opening the editor resets it. ?credits=static (or window.turCreditsDisabled = true) turns the typing off.
(async () => {
  await window.deckEditorReady;
  const deck = document.querySelector('#deck');
  if (!deck) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const disabled = () => window.turCreditsDisabled === true || /[?&]credits=static\b/.test(location.search);
  const editorOpen = () => Boolean(document.querySelector('#deck-editor')?.open);
  const activeSlide = () => deck.querySelector(':scope > .slide.active');

  // pace (milliseconds): per character for the role lines and for the names, and the pauses
  const PACE = { role: 20, name: 46, closing: 40, start: 950, afterLine: 150, hold: 1250, fade: 380, beforeClosing: 550 };
  let run = null;

  function cancel() {                                             // back to the static layout, leaving the markup exactly as it was
    if (!run) return;
    const r = run; run = null;
    r.timers.forEach(clearTimeout); clearInterval(r.watch);
    r.caret.remove();
    r.lines.forEach((line) => { line.style.removeProperty('--p'); if (!line.getAttribute('style')) line.removeAttribute('style'); });
    r.blocks.forEach((block) => block.classList.remove('on'));
    r.slide.classList.remove('cr-live');
  }

  const wait = (r, ms) => new Promise((resolve) => { r.timers.push(setTimeout(resolve, ms)); });

  function moveCaret(r, line, fraction) {
    const box = r.credits.getBoundingClientRect(), rect = line.getBoundingClientRect();
    r.caret.style.left = `${rect.left - box.left + fraction * rect.width}px`;
    r.caret.style.top = `${rect.top - box.top + rect.height * 0.1}px`;
    r.caret.style.height = `${rect.height * 0.8}px`;
    r.caret.style.display = '';
  }

  // type one line: its characters appear one after the other (the clip follows the real glyph edges)
  function type(r, line, ms) {
    return new Promise((resolve) => {
      const text = line.firstChild;
      if (line.childNodes.length !== 1 || !text || text.nodeType !== 3 || !text.data.length) {   // edited into something unusual: just show it
        line.style.setProperty('--p', '1'); resolve(); return;
      }
      const n = text.data.length, box = line.getBoundingClientRect(), range = document.createRange(), edge = [0];
      for (let k = 1; k <= n; k++) {
        range.setStart(text, 0); range.setEnd(text, k);
        edge.push(Math.min(1, Math.max(edge[k - 1], (range.getBoundingClientRect().right - box.left) / Math.max(1, box.width))));
      }
      edge[n] = 1;
      let k = 0;
      const step = () => {
        if (run !== r) return;
        k += 1;
        line.style.setProperty('--p', String(edge[k]));
        moveCaret(r, line, edge[k]);
        if (k >= n) { resolve(); return; }
        r.timers.push(setTimeout(step, ms + (text.data[k] === ' ' ? ms * 0.8 : 0)));
      };
      moveCaret(r, line, 0);
      r.timers.push(setTimeout(step, 70));
    });
  }

  async function sequence(r) {
    await wait(r, PACE.start);
    for (let i = 0; i < r.blocks.length; i++) {
      if (run !== r) return;
      const block = r.blocks[i];
      block.classList.add('on');
      for (const line of block.querySelectorAll('.cr-role, .cr-name')) {
        if (run !== r) return;
        await type(r, line, line.classList.contains('cr-role') ? PACE.role : PACE.name);
        await wait(r, PACE.afterLine);
      }
      if (i < r.blocks.length - 1) {                              // hold, clear, then the next block types in the same place
        await wait(r, PACE.hold);
        block.classList.remove('on');
        await wait(r, PACE.fade);
      }
    }
    if (run !== r) return;
    if (r.closing) { await wait(r, PACE.beforeClosing); await type(r, r.closing, PACE.closing); }
    await wait(r, 700);
    if (run === r) { r.caret.style.display = 'none'; r.finished = true; }   // finished: the last credit and the closing line stay
  }

  function start(slide) {
    if (disabled() || reduce.matches || document.hidden || editorOpen()) return;
    const credits = slide.querySelector('.cr-credits');
    const blocks = credits ? [...credits.querySelectorAll('.cr-block')] : [];
    if (!blocks.length) return;
    cancel();
    const caret = document.createElement('i'); caret.className = 'cr-caret'; caret.style.display = 'none';
    credits.append(caret);
    const lines = [...credits.querySelectorAll('.cr-role, .cr-name, .cr-closing')];
    slide.classList.add('cr-live');
    lines.forEach((line) => line.style.setProperty('--p', '0'));
    blocks.forEach((block) => block.classList.remove('on'));
    const r = run = { slide, credits, blocks, lines, caret, closing: credits.querySelector('.cr-closing'), timers: [], watch: 0, finished: false };
    r.watch = setInterval(() => { if (document.hidden || editorOpen()) cancel(); }, 250);
    sequence(r);
  }

  let current = activeSlide();
  new MutationObserver(() => {
    const now = activeSlide();
    if (now === current) return;
    current = now;
    cancel();                                                     // leaving the slide resets it
    if (now && now.querySelector('.cr-credits')) start(now);
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  reduce.addEventListener?.('change', () => { if (reduce.matches) cancel(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });

  if (current && current.querySelector('.cr-credits')) start(current);   // the deck was opened right on this slide
  window.turCredits = { get running() { return Boolean(run); }, get done() { return Boolean(run && run.finished); } };
})();
