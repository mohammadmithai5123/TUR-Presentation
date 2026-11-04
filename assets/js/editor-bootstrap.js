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
    const value = { html, synced: !!meta.synced, buildId };
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
  const markup = valid(saved?.html) ? saved.html : embedded?.textContent;
  if (valid(markup)) deck.innerHTML = markup;
  window.deckEditor = { key, original, html: deck.innerHTML, save, buildId };
})();
