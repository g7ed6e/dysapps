// Construit le site de documentation (https://g7ed6e.github.io/dysapps/) dans dist-docs/ :
// les pages Markdown de docs/ (sauf docs/_theme/) plus les pages générées depuis les données du jeu.
// Usage : node scripts/docs/build.mjs [--serve [port]]
// Aucune ressource externe : polices, styles et scripts sont copiés dans le site.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import { generatePages } from './generate.mjs';

const root = process.cwd();
const DOCS = join(root, 'docs');
const THEME = join(DOCS, '_theme');
const OUT = join(root, 'dist-docs');
/** Base du site pour les rares liens absolus (page 404) : « / » en local, « /dysapps/ » sur GitHub Pages. */
const BASE = process.env.BASE_PATH ?? '/';
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const nav = JSON.parse(readFileSync(join(THEME, 'nav.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// ---------- Collecte des pages ----------

function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith('_')) continue;
      walk(full, list);
    } else if (extname(name) === '.md') list.push(full);
  }
  return list;
}

function titleOf(body, fallback) {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : fallback;
}

function gitDate(relPath) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

const diskPages = walk(DOCS)
  .sort()
  .map((full) => {
    const path = posix.normalize(relative(DOCS, full).split('\\').join('/'));
    const body = readFileSync(full, 'utf8');
    return { path, body, title: titleOf(body, path), generated: false, updated: gitDate(posix.join('docs', path)) };
  });
const generated = (await generatePages()).map((p) => ({ ...p, generated: true, updated: today }));
const pages = [...diskPages.filter((p) => !generated.some((g) => g.path === p.path)), ...generated];
const byPath = new Map(pages.map((p) => [p.path, p]));

// ---------- Navigation ----------

function expandSection(section) {
  const entries = [];
  for (const item of section.pages) {
    if (typeof item === 'string') {
      const page = byPath.get(item);
      if (!page) throw new Error(`Page absente : docs/${item} (référencée dans docs/_theme/nav.json)`);
      entries.push({ page });
    } else if (item.dir) {
      const children = pages.filter((p) => posix.dirname(p.path) === item.dir);
      if (children.length === 0) throw new Error(`Dossier vide : docs/${item.dir}`);
      entries.push({ group: item.title, pages: children });
    }
  }
  return { title: section.title, entries };
}
const sections = nav.sections.map(expandSection);
/** Ordre de lecture (précédent / suivant) : accueil, puis les sections dans l'ordre. */
const ordered = [byPath.get('index.md'), ...sections.flatMap((s) => s.entries.flatMap((e) => (e.page ? [e.page] : e.pages)))].filter(Boolean);
for (const p of pages) {
  p.section = sections.find((s) => s.entries.some((e) => e.page === p || e.pages?.includes(p)))?.title ?? '';
  p.url = p.path.replace(/\.md$/, '.html');
  if (!ordered.includes(p)) console.warn(`(!) docs/${p.path} n'est dans aucune section de nav.json : page construite, mais hors sommaire.`);
}

// ---------- Markdown ----------

function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const strip = (html) => html.replace(/<[^>]+>/g, '');
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let current = null; // { toc: [], ids: Set }
marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      let id = slug(strip(text)) || 'section';
      let n = 1;
      while (current.ids.has(id)) id = `${slug(strip(text))}-${++n}`;
      current.ids.add(id);
      if (depth === 2 || depth === 3) current.toc.push({ id, depth, text: strip(text) });
      return `<h${depth} id="${id}">${text}${depth > 1 ? ` <a class="anchor" href="#${id}" aria-label="Lien vers cette section">#</a>` : ''}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      let target = href;
      const m = /^([^#?]*\.md)(#.*)?$/.exec(href ?? '');
      if (m && !/^[a-z]+:/.test(href)) target = m[1].replace(/\.md$/, '.html') + (m[2] ?? '');
      const external = /^https?:/.test(target);
      const attrs = [`href="${escapeHtml(target)}"`, title ? `title="${escapeHtml(title)}"` : '', external ? 'rel="noopener"' : ''].filter(Boolean).join(' ');
      return `<a ${attrs}>${text}</a>`;
    },
    table({ header, rows }) {
      const cellHtml = (c, tag) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</${tag}>`;
      const head = `<tr>${header.map((c) => cellHtml(c, 'th')).join('')}</tr>`;
      const body = rows.map((r) => `<tr>${r.map((c) => cellHtml(c, 'td')).join('')}</tr>`).join('\n');
      return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>\n`;
    },
  },
});

function render(page) {
  current = { toc: [], ids: new Set() };
  const html = marked.parse(page.body);
  return { html, toc: current.toc };
}

// ---------- Gabarit ----------

function relTo(page) {
  const depth = page.path.split('/').length - 1;
  return depth ? '../'.repeat(depth) : './';
}

function navHtml(page, rel) {
  const link = (p, cls = '') => `<a href="${rel}${p.url}"${p === page ? ' aria-current="page"' : ''}${cls ? ` class="${cls}"` : ''}>${escapeHtml(p.title)}</a>`;
  const groups = sections
    .map((s) => {
      const items = s.entries
        .map((e) => {
          if (e.page) return `<li>${link(e.page)}</li>`;
          const open = e.pages.includes(page) ? ' open' : '';
          return `<li><details${open}><summary>${escapeHtml(e.group)}</summary><ul>${e.pages.map((p) => `<li>${link(p)}</li>`).join('')}</ul></details></li>`;
        })
        .join('');
      return `<section class="nav-section"><h2>${escapeHtml(s.title)}</h2><ul>${items}</ul></section>`;
    })
    .join('');
  const home = byPath.get('index.md');
  return `<nav id="sommaire" class="sidebar" aria-label="Sommaire de la documentation">
  <form class="search" role="search" onsubmit="return false">
    <label for="search-input">Rechercher dans la doc</label>
    <input id="search-input" type="search" placeholder="Rechercher…" autocomplete="off" data-index="${rel}search-index.json" data-rel="${rel}" />
    <ul id="search-results" class="search-results" aria-live="polite"></ul>
  </form>
  <section class="nav-section"><ul><li>${link(home)}</li></ul></section>
  ${groups}
</nav>`;
}

function tocHtml(toc) {
  if (toc.length < 2) return '';
  const items = toc.map((h) => `<li class="toc-${h.depth}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('');
  return `<aside class="toc" aria-label="Sur cette page"><details open><summary>Sur cette page</summary><ul>${items}</ul></details></aside>`;
}

function layout(page, html, toc) {
  const rel = relTo(page);
  const i = ordered.indexOf(page);
  const prev = i > 0 ? ordered[i - 1] : null;
  const next = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;
  const pager =
    prev || next
      ? `<nav class="pager" aria-label="Page précédente et suivante">${prev ? `<a class="prev" href="${rel}${prev.url}"><span>Précédent</span>${escapeHtml(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${rel}${next.url}"><span>Suivant</span>${escapeHtml(next.title)}</a>` : ''}</nav>`
      : '';
  const source = page.generated
    ? `Page générée depuis les données du jeu (<code>scripts/docs/generate.mjs</code>) le ${page.updated}.`
    : `Source : <a href="${nav.repoUrl}/blob/main/docs/${page.path}" rel="noopener"><code>docs/${page.path}</code></a>${page.updated ? `, mise à jour le ${page.updated}` : ''}.`;
  const description = strip(html).replace(/\s+/g, ' ').trim().slice(0, 160);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'" />
<meta name="referrer" content="no-referrer" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#6b4a2e" />
<title>${page.path === 'index.md' ? 'Documentation DysApps' : `${escapeHtml(page.title)} · Documentation DysApps`}</title>
<link rel="icon" type="image/svg+xml" href="${rel}icon.svg" />
<link rel="stylesheet" href="${rel}assets/style.css" />
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="topbar">
  <a class="brand" href="${rel}index.html"><span class="brand-block" aria-hidden="true"></span><span class="brand-name">DysApps</span><span class="brand-sub">Documentation</span></a>
  <div class="topbar-actions">
    <a class="topbar-link" href="#sommaire">Sommaire</a>
    <a class="button primary" href="${nav.appUrl}" rel="noopener">Ouvrir l’application</a>
  </div>
</header>
<div class="layout">
  ${navHtml(page, rel)}
  <main id="contenu" class="content">
    ${page.section ? `<p class="crumbs">${escapeHtml(page.section)}</p>` : ''}
    ${tocHtml(toc)}
    <article class="article">
${html}
    </article>
    <p class="source">${source}</p>
    ${pager}
  </main>
</div>
<footer class="footer">
  <p>DysApps ${escapeHtml(pkg.version)} · applications d’entraînement pour les élèves dys du collège · <a href="${nav.repoUrl}" rel="noopener">code source</a> (licence MIT) · police Luciole © Laurent Bourcellier &amp; Jonathan Fabreguettes, CC BY 4.0.</p>
  <p>Aucune donnée n’est collectée : ce site n’utilise ni cookie ni service externe.</p>
</footer>
<script src="${rel}assets/site.js"></script>
</body>
</html>
`;
}

// ---------- Écriture ----------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
const searchIndex = [];
for (const page of pages) {
  const { html, toc } = render(page);
  const out = join(OUT, page.url);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(page, html, toc));
  searchIndex.push({
    title: page.title,
    url: page.url,
    section: page.section,
    headings: toc.map((h) => ({ id: h.id, text: h.text })),
    text: strip(html).replace(/\s+/g, ' ').trim().slice(0, 6000),
  });
}
writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(searchIndex));

// Thème et ressources locales (rien n'est chargé depuis l'extérieur).
cpSync(join(THEME, 'style.css'), join(OUT, 'assets', 'style.css'));
cpSync(join(THEME, 'site.js'), join(OUT, 'assets', 'site.js'));
cpSync(join(THEME, 'sw.js'), join(OUT, 'sw.js'));
cpSync(join(root, 'public', 'icon.svg'), join(OUT, 'icon.svg'));
cpSync(join(root, 'public', 'fonts', 'luciole'), join(OUT, 'fonts', 'luciole'), { recursive: true });
const silkscreen = join(root, 'node_modules', '@fontsource', 'silkscreen', 'files', 'silkscreen-latin-400-normal.woff2');
if (existsSync(silkscreen)) cpSync(silkscreen, join(OUT, 'fonts', 'silkscreen-latin-400-normal.woff2'));
writeFileSync(join(OUT, '.nojekyll'), '');
writeFileSync(
  join(OUT, '404.html'),
  `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Page introuvable · Documentation DysApps</title><link rel="stylesheet" href="${BASE}assets/style.css" /></head><body><main class="content notfound"><h1>Page introuvable</h1><p>Cette adresse n’existe pas (ou plus). L’application elle-même est sur <a href="${nav.appUrl}">${nav.appUrl}</a>.</p><p><a class="button primary" href="${BASE}">Retour à la documentation</a></p></main></body></html>\n`,
);
console.log(`✓ ${pages.length} pages (${generated.length} générées) écrites dans dist-docs/`);

// ---------- Aperçu local ----------

if (process.argv.includes('--serve')) {
  const port = Number(process.argv[process.argv.indexOf('--serve') + 1]) || 4173;
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
  createHttpServer((req, res) => {
    let file = resolve(OUT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    const found = existsSync(file);
    if (!found) file = join(OUT, '404.html');
    res.writeHead(found ? 200 : 404, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(existsSync(file) ? readFileSync(file) : 'Introuvable');
  }).listen(port, () => console.log(`Aperçu : http://localhost:${port}/`));
}
