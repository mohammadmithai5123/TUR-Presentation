(async () => {
  await window.deckEditorReady;
  const state = window.deckEditor;
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit Mode';
  editButton.id = 'edit-mode';
  document.querySelector('#controls').append(editButton);
  const dialog = document.createElement('dialog');
  dialog.id = 'deck-editor';
  dialog.setAttribute('aria-label', 'Presentation editor');
  dialog.innerHTML = `
    <header class="editor-header"><strong>Presentation editor</strong><span id="editor-status" role="status">Select text or an image in the preview.</span><button id="editor-cancel">Close</button></header>
    <div class="editor-layout">
      <aside class="editor-sidebar"><label>Slides<select id="editor-slides" size="12"></select></label>
        <div class="editor-actions"><button id="editor-up">Move up</button><button id="editor-down">Move down</button><button id="editor-add">Add slide</button><button id="editor-duplicate">Duplicate</button><button id="editor-delete">Delete slide</button><button id="editor-undo">Undo</button><button id="editor-add-photo">Add photo</button></div>
        <hr><button id="editor-save" class="editor-primary">Save &amp; present</button><button id="editor-export">Download editable HTML</button>
        <small>Changes save automatically in this browser. Download creates a portable file with images, fonts and the editor included.</small>
        <hr><details id="editor-github" class="editor-github"><summary>GitHub auto-save: <b id="editor-github-state">off</b></summary>
          <p class="editor-gh-help"><b>One-time setup.</b> <a id="editor-gh-token-link" href="https://github.com/settings/personal-access-tokens/new?name=TUR-Presentation-editor&amp;description=Auto-save%20from%20the%20presentation%20editor&amp;target_name=mohammadmithai5123&amp;expires_in=365&amp;contents=write" target="_blank" rel="noopener">Create a token</a> for this repository only, with <i>Contents: Read and write</i>, paste it below and press Connect. This browser then remembers it, and every edit is committed and published automatically.</p>
          <label>Repository<input id="editor-gh-repo" type="text" placeholder="owner/repository" autocomplete="off" spellcheck="false"></label>
          <label>Branch<input id="editor-gh-branch" type="text" autocomplete="off" spellcheck="false"></label>
          <label>Access token<input id="editor-gh-token" type="password" placeholder="github_pat_…" autocomplete="off"></label>
          <button id="editor-gh-connect">Connect &amp; turn on</button><button id="editor-gh-off">Turn off</button><button id="editor-gh-now">Save to GitHub now</button>
          <small>Every edit is committed to the repository and the site redeploys in about a minute. Use a fine-grained token for this repository only, with Contents: Read and write. It stays in this browser.</small>
        </details>
      </aside>
      <main class="editor-workspace"><div id="editor-preview"></div><p class="editor-hint">Click text or an image to select it. All briefing details are visible here.</p></main>
      <aside class="editor-inspector"><h2>Selected element</h2><p id="editor-selected">Nothing selected</p>
        <label>Text<textarea id="editor-text" rows="5" disabled></textarea></label>
        <label>Font size<input id="editor-font" type="range" min="0.8" max="9" step="0.1" disabled><output id="editor-font-value"></output></label>
        <label>Text colour<input id="editor-color" type="color" value="#fff8e9" disabled></label>
        <label>Replace image<input id="editor-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled></label>
        <label>Image description<input id="editor-alt" type="text" disabled></label>
        <label>Image size<input id="editor-image-size" type="range" min="50" max="130" value="100" disabled></label>
        <label>Image fit<select id="editor-fit" disabled><option value="contain">Show complete image</option><option value="cover">Fill frame</option></select></label>
        <hr><label>Slide background<input id="editor-background" type="color" value="#10271f"></label>
        <label>Speaker notes<textarea id="editor-notes" rows="4"></textarea></label>
      </aside>
    </div>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector(`#editor-${id}`);
  let model = [], current = 0, selected = null, history = [], dirty = false;
  let saveTimer = null, syncTimer = null, syncing = false, pendingSync = false, savedSinceOpen = false, latestHtml = '', syncFailed = false;
  const sync = window.githubSync;
  const snapshot = () => model.map(slide => slide.outerHTML).join('\n');
  const parse = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return [...template.content.children].filter(node => node.matches('section.slide'));
  };
  function checkpoint() {
    const html = snapshot();
    if (history.at(-1)?.html !== html) history.push({ html, current });
    if (history.length > 40) history.shift();
    dirty = true;
    $('status').textContent = 'Unsaved changes…';
    scheduleAutosave();
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const githubOn = () => sync.config().enabled && sync.ready(sync.config());
  function showGithubState() {
    const cfg = sync.config();
    $('github-state').textContent = githubOn() ? `on → ${cfg.repo}` : 'off';
    $('gh-repo').value = cfg.repo; $('gh-branch').value = cfg.branch;
    $('gh-token').value = cfg.token ? '••••••••••••' : '';
    $('gh-off').disabled = !githubOn(); $('gh-now').disabled = !githubOn();
  }
  // Ask the browser not to clear this site's storage (token and saved edits) when it is short of space.
  const keepStorage = () => { try { navigator.storage?.persist?.(); } catch {} };
  // Every time the editor opens: first time -> show how to connect; later -> quietly re-check the saved token,
  // and say clearly if GitHub rejects it (for example after it expired) instead of failing at the next save.
  async function checkGithub() {
    const cfg = sync.config();
    if (!sync.ready(cfg)) {
      $('github').open = true;
      $('status').textContent = 'Connect GitHub once (see the GitHub panel on the left): after that every edit is committed and goes live automatically.';
      return;
    }
    keepStorage();
    try {
      const name = await sync.verify({ ...cfg, enabled: true });
      if (!cfg.enabled) sync.setConfig({ enabled: true });
      showGithubState();
      $('status').textContent = `GitHub connected (${name}). Every edit is committed and goes live automatically.`;
    } catch (error) {
      if (error.unreachable) { $('status').textContent = `GitHub is connected, but cannot be reached right now: ${error.message} Edits are kept here and upload when it can.`; return; }
      $('github').open = true;
      $('status').textContent = `GitHub: ${error.message} Create a new token in the GitHub panel to keep auto-save running.`;
    }
  }
  function scheduleAutosave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 1200); }
  async function persist() {
    clearTimeout(saveTimer); saveTimer = null;
    const html = cleanHTML();
    try { await state.save(html, { synced: false }); }
    catch { $('status').textContent = 'Browser storage is full. Turn on GitHub auto-save or download editable HTML.'; return false; }
    state.html = html; latestHtml = html; dirty = false; savedSinceOpen = true;
    if (githubOn()) {
      pendingSync = true; clearTimeout(syncTimer); syncTimer = setTimeout(pushToGitHub, 3000);
      $('status').textContent = 'Saved in this browser · uploading to GitHub…';
    } else $('status').textContent = 'Saved in this browser';
    return true;
  }
  async function pushToGitHub() {
    clearTimeout(syncTimer); syncTimer = null;
    if (syncing) { syncTimer = setTimeout(pushToGitHub, 1500); return; }
    syncing = true; pendingSync = false; syncFailed = false;
    const html = latestHtml;
    $('status').textContent = 'Uploading to GitHub…';
    try {
      const result = await sync.commit({ slides: cleanSlides(), original: parse(state.original) });
      if (html === latestHtml) await state.save(html, { synced: true });
      $('status').textContent = result.changed ? 'Saved to GitHub ✓ The live site updates in about a minute.' : 'Already up to date on GitHub ✓';
    } catch (error) {
      syncFailed = true; pendingSync = true;
      $('status').textContent = `GitHub save failed: ${error.message} Your edits are kept in this browser.`;
    } finally { syncing = false; }
  }
  async function flush() {
    if (saveTimer && !(await persist())) return;
    while (syncing) await sleep(200);
    if (githubOn() && (pendingSync || syncTimer)) await pushToGitHub();
    while (syncing) await sleep(200);
  }
  window.addEventListener('beforeunload', event => { if (saveTimer || syncing || (pendingSync && !syncFailed)) event.preventDefault(); });
  function title(slide) { return slide.querySelector('h1')?.textContent.trim() || 'Untitled slide'; }
  function listSlides() {
    $('slides').replaceChildren(...model.map((slide, i) => new Option(`${i + 1}. ${title(slide)}`, i)));
    $('slides').value = current;
  }
  function clearSelection() {
    selected?.classList.remove('editor-selected-element');
    selected = null;
    $('selected').textContent = 'Nothing selected';
    for (const id of ['text','font','color','image','alt','image-size','fit']) $(id).disabled = true;
  }
  function render() {
    clearSelection();
    listSlides();
    const preview = $('preview');
    preview.replaceChildren(model[current]);
    model[current].classList.add('active');
    window.fitSlideText?.(model[current]);
    const photo = model[current].querySelector(':scope > .route-image');
    if (photo) {
      const classify = () => model.find(slide => slide.contains(photo))?.classList.toggle('panorama-slide',photo.naturalWidth / photo.naturalHeight >= 1.85);
      if (photo.complete && photo.naturalWidth) classify();
      else photo.onload = classify;
    }
    $('notes').value = model[current].dataset.note || '';
    $('up').disabled = current === 0;
    $('down').disabled = current === model.length - 1;
    $('delete').disabled = model.length === 1;
  }
  editButton.onclick = async () => {
    if (window.presentationIsBusy?.()) return;
    model = parse(state.html);
    current = Math.max(0, Math.min(model.length - 1, (+location.hash.slice(1) || 1) - 1));
    history = []; dirty = false; savedSinceOpen = false;
    document.querySelector('#lens').style.display = 'none';
    window.rideMap?.activate(false);
    showGithubState();
    dialog.showModal();
    render();
    void checkGithub();
  };
  let closing = false;
  async function closeEditor(event) {
    event?.preventDefault();
    if (closing) return;
    closing = true;
    try {
      await flush();
      if (syncFailed && !confirm(`${$('status').textContent}\n\nClose anyway? Edits stay in this browser, but are not on GitHub yet.`)) return;
      dialog.close();
      if (savedSinceOpen) { location.hash = current + 1; location.reload(); return; }
      window.rideMap?.activate(document.querySelector('#deck > .slide.active')?.dataset.kind === 'map');
    } finally { closing = false; }
  }
  $('cancel').onclick = closeEditor;
  dialog.addEventListener('cancel', closeEditor);
  dialog.addEventListener('keydown', event => event.stopPropagation());
  $('slides').onchange = () => { current = +$('slides').value; render(); };
  $('preview').onclick = event => {
    event.preventDefault(); event.stopPropagation();
    const target = event.target.closest('img,h1,h2,h3,p,small,em,.tag,.sub,.tagline,.cover-detail,.route-stop-name,.step-number,.image-note,.qr-note,.results span,footer span');
    if (!target) return;
    clearSelection(); selected = target;
    target.classList.add('editor-selected-element');
    const isImage = target.tagName === 'IMG';
    $('selected').textContent = isImage ? 'Image' : 'Text';
    for (const id of ['image','alt','image-size','fit']) $(id).disabled = !isImage;
    for (const id of ['text','font','color']) $(id).disabled = isImage;
    if (isImage) {
      $('image').value = ''; $('alt').value = target.alt;
      $('fit').value = getComputedStyle(target).objectFit === 'cover' ? 'cover' : 'contain';
      $('image-size').value = +(target.dataset.editorScale || 100);
    } else {
      $('text').value = target.innerText;
      const size = parseFloat(getComputedStyle(target).fontSize) / $('preview').clientWidth * 100;
      $('font').value = size; $('font-value').textContent = `${size.toFixed(1)}`;
      const rgb = getComputedStyle(target).color.match(/\d+/g);
      if (rgb) $('color').value = '#' + rgb.slice(0,3).map(v => (+v).toString(16).padStart(2,'0')).join('');
    }
  };
  $('text').oninput = () => {
    if (!selected) return; checkpoint();
    selected.replaceChildren(...$('text').value.split('\n').flatMap((line,i) => i ? [document.createElement('br'),document.createTextNode(line)] : [document.createTextNode(line)]));
    listSlides();
    window.fitSlideText?.(model[current]);
  };
  $('font').oninput = () => { if (selected) { checkpoint(); selected.style.fontSize = `${$('font').value}cqw`; $('font-value').textContent = $('font').value; window.fitSlideText?.(model[current]); } };
  $('color').oninput = () => { if (selected) { checkpoint(); selected.style.color = $('color').value; } };
  $('alt').oninput = () => { if (selected) { checkpoint(); selected.alt = $('alt').value; } };
  $('fit').onchange = () => { if (selected) { checkpoint(); selected.style.objectFit = $('fit').value; } };
  $('image-size').oninput = () => {
    if (!selected) return; checkpoint();
    selected.dataset.editorScale = $('image-size').value;
    selected.style.scale = `${+$('image-size').value / 100}`;
  };
  $('image').onchange = async () => {
    const file = $('image').files[0], target = selected;
    if (!file || !target) return;
    if (file.size > 20 * 1024 * 1024) { $('status').textContent = 'Choose an image smaller than 20 MB.'; return; }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { $('status').textContent = 'Choose a PNG, JPG, WEBP or GIF image.'; return; }
    try {
      const readUrl = blob => new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      let url;
      if (file.type === 'image/gif') url = await readUrl(file);
      else { // downscale to 2000px WebP so the repository and the page stay light
        const bitmap = await createImageBitmap(file);
        const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        url = canvas.toDataURL('image/webp', 0.85);
        if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', 0.88);
      }
      checkpoint(); target.src = url;
      if (target.matches('.route-image')) target.onload = () => target.closest('.slide').classList.toggle('panorama-slide', target.naturalWidth / target.naturalHeight >= 1.85);
      $('status').textContent = 'Image replaced. Saving…';
    } catch { $('status').textContent = 'Could not read this image.'; }
  };
  $('background').oninput = () => { checkpoint(); model[current].style.background = $('background').value; };
  $('notes').oninput = () => { checkpoint(); model[current].dataset.note = $('notes').value; };
  for (const [id,delta] of [['up',-1],['down',1]]) $(id).onclick = () => {
    if (current + delta < 0 || current + delta >= model.length) return;
    checkpoint(); [model[current],model[current + delta]] = [model[current + delta],model[current]]; current += delta; render();
  };
  function uniqueIds(slide) {
    const suffix = `-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const mapping = new Map();
    [slide,...slide.querySelectorAll('[id]')].forEach(node => { if (node.id) { mapping.set(node.id,node.id + suffix); node.id += suffix; } });
    slide.querySelectorAll('*').forEach(node => {
      for (const attr of ['href','aria-labelledby','aria-describedby','for']) {
        const value = node.getAttribute(attr); if (!value) continue;
        if (mapping.has(value)) node.setAttribute(attr,mapping.get(value));
        else if (value.startsWith('#') && mapping.has(value.slice(1))) node.setAttribute(attr,'#' + mapping.get(value.slice(1)));
      }
    });
  }
  $('duplicate').onclick = () => {
    if (model[current].dataset.kind === 'map') { $('status').textContent = 'The animated route map can be edited but cannot be duplicated.'; return; }
    checkpoint(); const clone = model[current].cloneNode(true); uniqueIds(clone); model.splice(++current,0,clone); render();
  };
  $('add').onclick = () => {
    checkpoint();
    const slide = document.createElement('section'); slide.className = 'slide text'; slide.dataset.kind = 'text'; slide.id = `slide-${Date.now()}`;
    slide.innerHTML = '<div class="tag">NEW SLIDE</div><h1>Your heading</h1><div class="text-copy"><h2>Your subtitle</h2><p class="detail">Add your first point.</p><p class="detail">Add your second point.</p><p class="detail">Add your third point.</p></div><footer><span>Taheri Unity Ride</span><b></b></footer>';
    model.splice(++current,0,slide); render();
  };
  $('add-photo').onclick = () => {
    const slide = model[current];
    if (!slide.matches('.text') || !slide.querySelector('.text-copy')) { $('status').textContent = 'Use Add slide first to create a slide for a new photo, or select an existing photo to replace it.'; return; }
    checkpoint();
    slide.classList.replace('text','route'); slide.dataset.kind = 'route';
    slide.querySelector('.text-copy').className = 'copy';
    const photo = document.createElement('img'); photo.className = 'route-image';
    photo.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="#234735"/><text x="600" y="300" text-anchor="middle" fill="#ffe1ab" font-size="38" font-family="sans-serif">Select this image, then upload your photo</text></svg>');
    photo.alt = 'Your photo'; slide.append(photo); slide.classList.add('panorama-slide'); render();
  };
  $('delete').onclick = () => { if (model.length > 1 && confirm(`Delete slide: ${title(model[current])}?`)) { checkpoint(); model.splice(current,1); current = Math.min(current,model.length - 1); render(); } };
  $('undo').onclick = () => { const previous = history.pop(); if (!previous) return; model = parse(previous.html); current = previous.current; dirty = true; render(); $('status').textContent = 'Last change undone'; scheduleAutosave(); };
  function cleanSlides() {
    return model.map((source,i) => {
      const slide = source.cloneNode(true);
      slide.classList.remove('active', 'panorama-slide'); // runtime state, recomputed on load
      slide.querySelectorAll('[style*="zoom"]').forEach(node => { node.style.removeProperty('zoom'); if (!node.getAttribute('style')) node.removeAttribute('style'); }); // auto-fit is runtime only
      slide.querySelectorAll('.editor-selected-element').forEach(node => node.classList.remove('editor-selected-element'));
      slide.querySelectorAll('footer b').forEach(node => node.textContent = `${String(i+1).padStart(2,'0')}/${model.length}`);
      return slide;
    });
  }
  const cleanHTML = () => cleanSlides().map(slide => slide.outerHTML).join('\n');
  $('save').onclick = async () => {
    $('save').disabled = true;
    try { if (await persist()) { await flush(); if (!syncFailed || confirm('GitHub save failed. Continue with the browser copy only?')) { location.hash = current + 1; location.reload(); } } }
    finally { $('save').disabled = false; }
  };
  $('gh-connect').onclick = async () => {
    // A token never contains spaces or line breaks; copy-paste often adds them, so drop them (and quotes).
    const typed = $('gh-token').value.replace(/\s+/g, '').replace(/^["'`]+|["'`]+$/g, '');
    const token = typed.startsWith('•') ? sync.config().token : typed;
    const cfg = { repo: $('gh-repo').value.trim(), branch: $('gh-branch').value.trim() || 'main', token };
    $('status').textContent = 'Checking GitHub access…';
    try {
      const name = await sync.verify({ ...cfg, enabled: true });
      sync.setConfig({ ...cfg, enabled: true }); showGithubState(); keepStorage();
      $('status').textContent = `Connected to ${name}. Edits now save to GitHub automatically.`;
      if (!await persist()) return;
      await pushToGitHub();
    } catch (error) { $('status').textContent = `GitHub: ${error.message}`; }
  };
  $('gh-off').onclick = () => { sync.setConfig({ enabled: false, token: '' }); pendingSync = false; showGithubState(); $('status').textContent = 'GitHub auto-save is off and the token was removed from this browser.'; };
  $('gh-now').onclick = async () => { if (await persist()) await flush(); };
  $('export').onclick = async () => {
    $('export').disabled = true; $('status').textContent = 'Preparing portable presentation…';
    try {
      if (!window.turExportAssets) await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src = 'assets/js/editor-export-assets.js'; script.onload = resolve; script.onerror = reject; document.head.append(script); });
      const pack = window.turExportAssets;
      let html = pack.shell.replace('<!-- SLIDES -->', () => cleanHTML());
      html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', `<style>${pack.css.replace(/<\/style/gi,'<\\/style')}</style>`);
      html = html.replace(/(?:src|href)="(assets\/[^"#?]+)"/g,(match,path) => pack.files[path] ? match.replace(path,pack.files[path]) : match);
      html = html.replace(/<script src="assets\/js\/([^"/]+)"><\/script>/g,(match,name) => pack.scripts[name] ? `<script>${pack.scripts[name].replace(/<\/script/gi,'<\\/script')}</script>` : match);
      // Inline the export pack too, so downloaded copies remain fully editable and exportable.
      const portablePack = { ...pack, files: {} };
      const bodyEnd = html.lastIndexOf('</body>');
      html = html.slice(0,bodyEnd) + `<script>window.turExportAssets=${JSON.stringify(portablePack).replace(/</g,'\\u003c')};</script>` + html.slice(bodyEnd);
      const url = URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = 'Taheri-Unity-Ride-Editable.html'; link.click(); setTimeout(() => URL.revokeObjectURL(url),60000);
      $('status').textContent = 'Downloaded. Open the HTML file to present or edit again.';
    } catch { $('status').textContent = 'Export could not load. Rebuild the project and try again.'; }
    finally { $('export').disabled = false; }
  };
})();
