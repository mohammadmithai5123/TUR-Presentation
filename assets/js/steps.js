// One "pointer" behaviour for every slide that opens its points one by one (it began on the Activities slides):
// the newest point is highlighted, earlier points dim, and a small counter shows progress ("2 / 3 points").
// It only observes the presentation's own state (.active / .shown classes). The counter is created at run time,
// so it never becomes part of the saved slide markup and never shows up in the editor.
(() => {
  const deck = document.querySelector('#deck');
  if (!deck) return;
  // Route-journey slides and the animated map have their own controls; everything else uses .detail points.
  const eligible = slide => !slide.classList.contains('interactive-route') && slide.dataset.kind !== 'map';

  function counterFor(slide) {
    let counter = slide.querySelector('.step-progress, .activity-progress'); // .activity-progress: older saved decks
    if (!counter) {
      counter = document.createElement('div');
      counter.setAttribute('aria-live', 'polite');
      slide.append(counter);
    }
    // Only touch the class when needed: even re-adding an existing class counts as a mutation and would
    // re-trigger the observer below forever.
    if (!counter.classList.contains('step-progress')) counter.classList.add('step-progress');
    return counter;
  }

  function update() {
    deck.querySelectorAll(':scope > .slide.active').forEach(slide => {
      if (!eligible(slide)) return;
      const points = [...slide.querySelectorAll('.detail')];
      const shown = points.filter(point => point.classList.contains('shown'));
      points.forEach(point => {
        const current = point === shown.at(-1);
        if (point.classList.contains('current-step') !== current) point.classList.toggle('current-step', current);
      });
      if (points.length < 2) { slide.querySelector('.step-progress')?.remove(); return; } // a single point needs no counter
      const text = shown.length ? `${shown.length} / ${points.length} points` : 'Press Next to begin';
      const counter = counterFor(slide);
      if (counter.textContent !== text) counter.textContent = text;
    });
  }

  new MutationObserver(update).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  update();
})();
