window.deckEditorReady = (async () => {
  const deck = document.querySelector('#deck');
  const embedded = document.querySelector('#saved-deck');
  const key = `tur-editor-v1:${location.pathname}`;
  const buildId = document.querySelector('meta[name="tur-build"]')?.content || '';
  const original = deck.innerHTML;
  async function database() {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open('tur-presentation-editor',1);
      request.onupgradeneeded = () => request.result.createObjectStore('decks');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function readSaved() {
    const db = await database();
    try { return await new Promise((resolve,reject) => {
      const request = db.transaction('decks').objectStore('decks').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }); } finally { db.close(); }
  }
  async function writeSaved(value) {
    const db = await database();
    try { await new Promise((resolve,reject) => {
      const tx = db.transaction('decks','readwrite');
      if (value) tx.objectStore('decks').put(value,key); else tx.objectStore('decks').delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }); } finally { db.close(); }
  }
  // meta.synced: this copy is already committed to GitHub. Once a newer deployed build
  // exists, the deployed deck is authoritative and the browser copy is discarded.
  async function save(html, meta = {}) {
    // base = the published markup this copy was made from, so a later load can tell "edited" from "just saved".
    const value = { html, synced: !!meta.synced, buildId, base: original };
    try {
      await writeSaved(value);
      try { localStorage.removeItem(key); } catch {}
    } catch {
      localStorage.setItem(key,JSON.stringify(value));
    }
  }
  let saved;
  try { saved = await readSaved(); } catch {}
  if (!saved) try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch {}
  if (saved?.synced && saved.buildId && saved.buildId !== buildId) {
    saved = null;
    try { await writeSaved(null); } catch {}
    try { localStorage.removeItem(key); } catch {}
  }
  const valid = value => typeof value === 'string' && value.includes('class="slide');
  const norm = html => String(html || '').replace(/>\s+</g, '><').trim();
  const discardSaved = async () => {
    try { await writeSaved(null); } catch {}
    try { localStorage.removeItem(key); } catch {}
  };
  // A copy saved in this browser normally wins over the published deck. That is right for real edits, but it also
  // froze the deck for anyone who only pressed "Save & present" and then never saw later published changes.
  let hiddenChanges = false;
  if (saved && valid(saved.html)) {
    if (saved.base !== undefined && norm(saved.html) === norm(saved.base)) {
      saved = null; // saved without any edit: the published deck is the truth
      await discardSaved();
    } else {
      // Older saves have no base; for those, a different build id is the only hint that the published deck moved on.
      hiddenChanges = saved.base !== undefined ? norm(saved.base) !== norm(original) : saved.buildId !== buildId;
    }
  }
  const markup = valid(saved?.html) ? saved.html : embedded?.textContent;
  if (valid(markup)) deck.innerHTML = markup;
  window.deckEditor = { key, original, html: deck.innerHTML, save, buildId };

  const keepKey = `tur-keep-copy:${key}:${buildId}`;
  let keptAlready = false;
  try { keptAlready = localStorage.getItem(keepKey) === '1'; } catch {}
  if (hiddenChanges && !keptAlready) {
    const bar = document.createElement('div');
    bar.id = 'saved-copy-banner';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>You are viewing a copy saved in this browser. Newer published changes are hidden.</span>' +
      '<button type="button" data-action="use-published">Use published version</button>' +
      '<button type="button" data-action="keep">Keep my copy</button>';
    document.body.append(bar);
    bar.addEventListener('click', async event => {
      const action = event.target.closest('button')?.dataset.action;
      if (action === 'keep') {
        try { localStorage.setItem(keepKey, '1'); } catch {}
        bar.remove();
      } else if (action === 'use-published') {
        if (!confirm('This removes the copy saved in this browser, including any edits made in it. Show the published version?')) return;
        await discardSaved();
        location.reload();
      }
    });
  }
})();
