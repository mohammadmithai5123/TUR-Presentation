// Title screen: drives the layered cyclist (head, irises, eyelids, breathing) and the Start / exit behaviour.
// Nothing here runs unless the title slide is the open slide; with reduced motion the figure stays in its neutral pose.
//
// How the character works: the figure is a small 2.5D rig made of separate pictures (body, head, irises, lids). This script only
// writes a handful of CSS custom properties on `.ts-figure`, expressed in source-picture pixels / degrees:
//   --ex --ey   iris offset            --hx --hy  head shift        --hrz --hry --hrx  head roll / yaw / pitch
//   --lid       eyelid closure 0..1    --breath   chest rise 0..1
(async () => {
  await window.deckEditorReady;
  const deck = document.querySelector('#deck');
  const slide = deck?.querySelector(':scope > .slide.title-screen');
  const figure = slide?.querySelector('.ts-figure');
  const startButton = slide?.querySelector('.ts-start');
  if (!slide || !figure) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const portrait = matchMedia('(max-aspect-ratio: 1/1)');

  // Restrained limits (source pixels / degrees).
  const LIMIT = { irisX: 3.8, irisY: 1.3, yaw: 12, pitch: 6, roll: 2.6, shiftX: 2.4, shiftY: 1.2 };
  const HEAD = { x: 0.628, y: 0.105 };            // centre of the face inside the figure (fractions)
  const EYE_TAU = 0.07, HEAD_TAU = 0.26;           // seconds: eyes react fast, the head follows more slowly
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = (v) => v * v * (3 - 2 * v);

  let active = false, running = false, raf = 0, last = 0, clock = 0, leaving = null;
  let pointer = { x: 0, y: 0, seen: false, inside: false };
  const eye = { x: 0, y: 0 }, head = { x: 0, y: 0 };
  let blink = { next: 0, start: -1, double: false };
  let gesture = { start: -1, amp: 1, dur: 700 };
  const applied = {};

  function setVar(name, value) {
    const text = value.toFixed(3);
    if (applied[name] === text) return;
    applied[name] = text;
    figure.style.setProperty(name, text);
  }
  function clearVars() {
    for (const name of Object.keys(applied)) figure.style.removeProperty(name);
    for (const key of Object.keys(applied)) delete applied[key];
  }

  // ---- what the character looks at ----------------------------------------------------------------------------------
  function idleGaze(t) { // devices without a mouse: a slow, small wander so the character still feels alive
    return { x: 0.55 * Math.sin(t * 0.37) + 0.25 * Math.sin(t * 0.91 + 1.3), y: 0.2 * Math.sin(t * 0.29 + 2.1) };
  }
  function targetGaze(t) {
    if (!finePointer.matches) return idleGaze(t);
    if (!pointer.seen || !pointer.inside) return { x: 0, y: 0 };      // pointer left the screen: back to the neutral pose
    const box = figure.getBoundingClientRect(), stage = deck.getBoundingClientRect();
    const cx = box.left + box.width * HEAD.x, cy = box.top + box.height * HEAD.y;
    return { x: clamp((pointer.x - cx) / (stage.width * 0.32), -1, 1), y: clamp((pointer.y - cy) / (stage.height * 0.32), -1, 1) };
  }

  // ---- blinking and gestures ------------------------------------------------------------------------------------------------
  function blinkAmount(t) {
    if (blink.start < 0) { if (t >= blink.next) { blink.start = t; } else return 0; }
    const k = (t - blink.start) * 1000;                               // ms into the blink
    if (k < 0) return 0;
    if (k < 70) return ease(k / 70);                                  // closing
    if (k < 95) return 1;                                             // brief hold
    if (k < 205) return 1 - ease((k - 95) / 110);                     // opening
    blink.start = -1;
    blink.next = blink.double ? t + 0.22 : t + 2.6 + Math.random() * 3.6;
    blink.double = !blink.double && Math.random() < 0.12;
    return 0;
  }
  function gestureShape(t) {                                           // a nod: down and back, with relaxed "smiling" eyes
    if (gesture.start < 0) return 0;
    const p = (t - gesture.start) * 1000 / gesture.dur;
    if (p >= 1) { gesture.start = -1; return 0; }
    return Math.sin(Math.PI * p);
  }
  function nod(amplitude = 1, duration = 700) { gesture = { start: clock, amp: amplitude, dur: duration }; }

  // ---- the frame loop (only while the title slide is open) ---------------------------------------------------------------------
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    clock += dt;
    const gaze = targetGaze(clock);
    const a = 1 - Math.exp(-dt / EYE_TAU), b = 1 - Math.exp(-dt / HEAD_TAU);
    eye.x += (gaze.x - eye.x) * a; eye.y += (gaze.y - eye.y) * a;
    head.x += (gaze.x - head.x) * b; head.y += (gaze.y - head.y) * b;
    const g = gestureShape(clock) * gesture.amp;
    const breath = Math.sin(clock * 2 * Math.PI / 4.4) * 0.5 + 0.5;
    setVar('--ex', eye.x * LIMIT.irisX);
    setVar('--ey', eye.y * LIMIT.irisY);
    setVar('--hry', head.x * LIMIT.yaw);
    setVar('--hrx', -head.y * LIMIT.pitch - g * 5);
    setVar('--hrz', head.x * LIMIT.roll);
    setVar('--hx', head.x * LIMIT.shiftX);
    setVar('--hy', head.y * LIMIT.shiftY + g * 3.2);
    setVar('--lid', Math.max(blinkAmount(clock), g * 0.24));
    setVar('--breath', breath);
  }
  function startLoop() {
    if (running || reduce.matches || document.hidden) return;
    running = true; last = 0;
    blink = { next: clock + 1.8 + Math.random() * 2, start: -1, double: false };
    figure.classList.add('live');
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false; cancelAnimationFrame(raf); raf = 0;
    figure.classList.remove('live');
  }

  // ---- slide lifecycle ----------------------------------------------------------------------------------------------------------
  function layout() {
    document.body.classList.toggle('title-portrait', active && portrait.matches);
  }
  // ---- longer text than the layout expects: shrink it to fit (never below 40%) -------------------------------------------------
  // The heading, tag, tagline, subtitle and Start label are edited in the browser. Their sizes are multiplied by CSS variables
  // on <html> (outside the deck), so this is recalculated each time and never ends up in the saved presentation.
  const fitItems = [
    { name: 'tag', el: slide.querySelector(':scope > .tag'), zone: 0.62 },
    { name: 'h1', el: slide.querySelector(':scope > h1'), kind: 'block' },
    { name: 'tagline', el: slide.querySelector(':scope > .tagline'), zone: 0.52 },
    { name: 'sub', el: slide.querySelector(':scope > .ts-subtitle'), zone: 0.52 },
    { name: 'start', el: startButton, kind: 'button' },
  ].filter((item) => item.el);
  function fitText() {
    if (!slide.classList.contains('active') || !slide.offsetWidth) return;
    const root = document.documentElement.style;
    const W = slide.offsetWidth, narrow = document.body.classList.contains('title-portrait');
    const bar = slide.querySelector(':scope > .ts-bar');
    for (const { name } of fitItems) root.removeProperty(`--ts-fit-${name}`);
    for (const item of fitItems) {
      const el = item.el;
      // width of the text itself, independent of the box and of any running entrance transform
      const range = document.createRange(); range.selectNodeContents(el);
      const textWidth = () => range.getBoundingClientRect().width / ((el.getBoundingClientRect().width / el.offsetWidth) || 1);
      let fits;
      if (item.kind === 'block') {                                    // heading: may use several lines, must end above the accent bar
        fits = () => (!bar || el.offsetTop + el.offsetHeight <= bar.offsetTop + 1) && el.scrollWidth <= el.clientWidth + 1;
      } else if (item.kind === 'button') {                            // label must sit inside the pill
        const pad = parseFloat(getComputedStyle(el).paddingLeft) * 2 || 0;
        fits = () => textWidth() <= el.clientWidth - pad;
      } else {                                                        // one line that must stay clear of the cyclist
        const limit = narrow ? W * 0.94 : W * item.zone;
        fits = () => el.offsetLeft + textWidth() <= limit + 1;
      }
      let k = 1;
      while (k > 0.4 && !fits()) { k = Math.round((k - 0.03) * 100) / 100; root.setProperty(`--ts-fit-${item.name}`, k); }
    }
  }
  let fitQueued = false;
  const queueFit = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitText(); }); };
  window.addEventListener('resize', queueFit);
  document.fonts?.ready.then(queueFit);

  function activate() {
    active = true; leaving = null;
    slide.classList.remove('leaving');
    if (startButton) startButton.disabled = false;
    eye.x = eye.y = head.x = head.y = 0; gesture.start = -1;
    pointer.seen = false;
    clearVars();
    layout(); fitText(); startLoop();
  }
  function deactivate() {
    active = false; leaving = null;
    stopLoop(); clearVars();
    slide.classList.remove('leaving');
    if (startButton) startButton.disabled = false;
    layout();
  }
  function sync() {
    const on = slide.classList.contains('active');
    if (on && !active) activate();
    else if (!on && active) deactivate();
  }
  new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (!active) return; document.hidden ? stopLoop() : startLoop(); });
  reduce.addEventListener?.('change', () => { if (!active) return; if (reduce.matches) { stopLoop(); clearVars(); } else startLoop(); });
  portrait.addEventListener?.('change', () => { layout(); fitText(); });

  // ---- pointer input ------------------------------------------------------------------------------------------------------------------
  document.addEventListener('pointermove', (event) => {
    if (!active || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY, seen: true, inside: true };
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { pointer.inside = false; });
  document.documentElement.addEventListener('mouseenter', () => { pointer.inside = true; });

  if (startButton) {
    startButton.addEventListener('pointerenter', () => { if (active && !leaving) nod(0.8, 650); });
    startButton.addEventListener('focus', () => { if (active && !leaving && startButton.matches(':focus-visible')) nod(0.8, 650); });
    startButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (window.deckNext) window.deckNext(); else document.querySelector('#next')?.click();
    });
  }

  // ---- called by the deck when the viewer leaves this slide going forward (button, Enter, arrow, click) ----------------------------
  window.titleScreen = {
    leave() {
      if (leaving) return leaving;
      const quick = reduce.matches;
      slide.classList.add('leaving');
      if (startButton) startButton.disabled = true;
      nod(1.35, 520);                                                // acknowledgement
      leaving = new Promise((resolve) => setTimeout(resolve, quick ? 0 : 1000)).then(() => { leaving = null; });
      return leaving;
    },
    get active() { return active; },
    get running() { return running; },
    get leaving() { return Boolean(leaving); },
    nod,
    vars: () => ({ ...applied }),
  };
  sync();
})();
