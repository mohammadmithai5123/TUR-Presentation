// Commits editor changes straight to the GitHub repository (src/slides/*.html,
// src/slides.json and uploaded images). The existing GitHub Actions workflow then
// rebuilds and redeploys the site. Needs a fine-grained personal access token with
// "Contents: Read and write" on this one repository; it is stored only in this browser.
window.githubSync = (() => {
  const KEY = 'tur-github-sync-v1';
  const API = 'https://api.github.com';

  // This presentation's own repository. It is only a name (never a secret), so downloaded copies and
  // local files are linked to it too; the access token is the one thing each browser must be given once.
  const DEFAULT_REPO = 'mohammadmithai5123/TUR-Presentation';
  function defaults() {
    const host = location.hostname.match(/^(.+)\.github\.io$/i);
    if (!host) return { repo: DEFAULT_REPO, branch: 'main' };
    const first = location.pathname.split('/').filter(Boolean)[0];
    const repo = first && !/\.html?$/i.test(first) ? first : `${host[1]}.github.io`;
    return { repo: `${host[1]}/${repo}`, branch: 'main' };
  }
  function config() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
    return { token: '', enabled: false, ...defaults(), ...stored };
  }
  function setConfig(patch) {
    const next = { ...config(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  }
  const ready = cfg => /^[\w.-]+\/[\w.-]+$/.test(cfg.repo) && !!cfg.token && !!cfg.branch;

  // When fetch() itself throws, say what is really wrong instead of always blaming the internet.
  async function explainFailure(cfg, error) {
    if (/[^\x21-\x7E]/.test(cfg.token)) return Object.assign(new Error('The token contains characters that are not allowed (a space, a line break, "•" or "…"). Copy it again from GitHub: only the text that starts with github_pat_.'), { status: 0, badToken: true });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return Object.assign(new Error('No internet connection.'), { status: 0, unreachable: true });
    try { await fetch(`${API}/zen`, { cache: 'no-store' }); }
    catch { return Object.assign(new Error('api.github.com cannot be reached from this browser. A VPN, firewall, antivirus or ad-blocker may be blocking it: turn it off for this site or try another network.'), { status: 0, unreachable: true }); }
    return Object.assign(new Error(`GitHub refused this request (${error?.message || 'network error'}). Check the repository name and the token.`), { status: 0 });
  }

  async function gh(cfg, path, { method = 'GET', body, raw = false } = {}) {
    let res;
    try {
      // No trailing slash for the repository itself: GitHub answers ".../repo/" with 404 and no CORS headers,
      // so the browser blocks the request ("Failed to fetch") even though the internet is fine.
      res = await fetch(`${API}/repos/${cfg.repo}${path ? '/' + path : ''}`, {
        method,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw await explainFailure(cfg, error);
    }
    if (!res.ok) {
      const reasons = {
        401: 'Token was rejected. Create a new one.',
        403: 'Token cannot write to this repository (needs Contents: Read and write).',
        404: 'Repository or branch not found, or the token has no access to it.',
        409: 'The branch changed while saving.',
        422: 'The branch changed while saving.',
      };
      throw Object.assign(new Error(reasons[res.status] || `GitHub error ${res.status}.`), { status: res.status });
    }
    return raw ? res.text() : res.json();
  }

  async function verify(cfg = config()) {
    if (!ready(cfg)) throw new Error('Enter repository (owner/name), branch and token.');
    const info = await gh(cfg, '');
    if (info.permissions && !info.permissions.push) throw new Error('Token has read-only access. It needs Contents: Read and write.');
    await gh(cfg, `git/ref/heads/${encodeURIComponent(cfg.branch)}`);
    return info.full_name;
  }

  function hash(text) { // cyrb53; stable short names for uploaded images
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0') + text.length.toString(16);
  }
  const plain = element => { const c = element.cloneNode(true); c.removeAttribute('data-note'); return c.outerHTML; };

  // slides / original: arrays of <section class="slide"> elements; notes live in data-note.
  async function commit({ slides, original, message }) {
    const cfg = config();
    if (!ready(cfg)) throw new Error('GitHub is not connected.');
    for (let attempt = 0; ; attempt++) {
      try { return await commitOnce(cfg, slides, original, message); }
      catch (error) { if (attempt === 0 && !error.permanent && (error.status === 409 || error.status === 422)) continue; throw error; }
    }
  }

  async function commitOnce(cfg, slides, original, message) {
    const branch = encodeURIComponent(cfg.branch);
    const head = (await gh(cfg, `git/ref/heads/${branch}`)).object.sha;
    const baseTree = (await gh(cfg, `git/commits/${head}`)).tree.sha;
    const manifest = JSON.parse(await gh(cfg, `contents/src/slides.json?ref=${branch}`, { raw: true }));
    const old = new Map(manifest.map(entry => [entry.id, entry]));
    const before = new Map(original.map(el => [el.id, plain(el)]));
    // Safety: a slide that exists on GitHub but that this copy has never seen means GitHub changed after this
    // copy was opened (or this is an old downloaded copy). Saving now would delete that slide, so stop instead.
    const known = new Set([...original.map(el => el.id), ...slides.map(el => el.id)]);
    const unknown = manifest.filter(entry => !known.has(entry.id)).map(entry => entry.id);
    if (unknown.length) throw Object.assign(new Error(`The published deck has newer slides this copy does not have (${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? ', …' : ''}). Nothing was changed. Open the live site, press Ctrl+Shift+R, and edit there.`), { status: 409, permanent: true });
    const tree = [], nextManifest = [], uploaded = new Set();

    for (const el of slides) {
      const entry = old.get(el.id);
      const file = entry?.file || `${el.id}.html`;
      const clone = el.cloneNode(true);
      clone.removeAttribute('data-note');
      for (const img of clone.querySelectorAll('img[src^="data:image/"]')) {
        const match = img.getAttribute('src').match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
        if (!match) continue; // e.g. the SVG placeholder
        const path = `assets/images/uploads/${hash(match[2])}.${match[1].toLowerCase().replace('jpeg', 'jpg')}`;
        if (!uploaded.has(path)) {
          const blob = await gh(cfg, 'git/blobs', { method: 'POST', body: { content: match[2], encoding: 'base64' } });
          tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
          uploaded.add(path);
        }
        img.setAttribute('src', path);
      }
      if (before.get(el.id) !== plain(el) || !entry) {
        tree.push({ path: `src/slides/${file}`, mode: '100644', type: 'blob', content: clone.outerHTML + '\n' });
      }
      nextManifest.push({ ...(entry || {}), id: el.id, file, notes: el.dataset.note || '' });
    }
    const keep = new Set(nextManifest.map(entry => entry.id));
    for (const entry of manifest) {
      if (!keep.has(entry.id)) tree.push({ path: `src/slides/${entry.file}`, mode: '100644', type: 'blob', sha: null });
    }
    if (JSON.stringify(nextManifest) !== JSON.stringify(manifest)) {
      tree.push({ path: 'src/slides.json', mode: '100644', type: 'blob', content: JSON.stringify(nextManifest, null, 2) + '\n' });
    }
    if (!tree.length) return { changed: false };

    const newTree = await gh(cfg, 'git/trees', { method: 'POST', body: { base_tree: baseTree, tree } });
    const created = await gh(cfg, 'git/commits', { method: 'POST', body: { message: message || 'Update slides from the browser editor', tree: newTree.sha, parents: [head] } });
    await gh(cfg, `git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: created.sha } });
    return { changed: true, sha: created.sha };
  }

  return { config, setConfig, ready, verify, commit };
})();
