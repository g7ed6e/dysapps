// Prépare les sources du site de documentation pour VitePress (docs/.vitepress/config.mts) :
// les pages Markdown de docs/ (sauf docs/_theme/ et docs/.vitepress/) plus les pages générées depuis
// les données du jeu (scripts/docs/generate.mjs), copiées dans .docs-src/ avec les fichiers statiques
// (icône, police Luciole, sw.js). Aucune ressource externe.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generatePages } from './generate.mjs';

const root = process.cwd();
export const DOCS = join(root, 'docs');
export const SRC = join(root, '.docs-src');
const THEME = join(DOCS, '_theme');

function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith('_') || name.startsWith('.')) continue;
      walk(full, list);
    } else if (extname(name) === '.md') list.push(full);
  }
  return list;
}

function titleOf(body, fallback) {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : fallback;
}

/** Date du dernier commit qui touche le fichier (AAAA-MM-JJ), ou null hors dépôt git. */
function gitDate(relPath) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Écrit .docs-src/ et renvoie les pages : { path, title, generated, updated }.
 * `path` est relatif à docs/ (ex. « manuel/demarrer.md »).
 */
export async function prepareDocs() {
  const today = new Date().toISOString().slice(0, 10);
  const disk = walk(DOCS)
    .sort()
    .map((full) => {
      const path = posix.normalize(relative(DOCS, full).split('\\').join('/'));
      const body = readFileSync(full, 'utf8');
      return { path, body, title: titleOf(body, path), generated: false, updated: gitDate(posix.join('docs', path)) };
    });
  const generated = (await generatePages()).map((p) => ({ ...p, generated: true, updated: today }));
  const pages = [...disk.filter((p) => !generated.some((g) => g.path === p.path)), ...generated];

  rmSync(SRC, { recursive: true, force: true });
  for (const page of pages) {
    const out = join(SRC, page.path);
    mkdirSync(dirname(out), { recursive: true });
    // Une page générée n'a pas de fichier source à ouvrir : elle dit d'où elle vient.
    const body = page.generated
      ? `---\neditLink: false\n---\n\n${page.body.trimEnd()}\n\n::: info Page générée\nCette page est produite à chaque publication à partir des données du jeu (\`scripts/docs/generate.mjs\`) : elle décrit exactement la version en ligne.\n:::\n`
      : page.body;
    writeFileSync(out, body);
  }
  const pub = join(SRC, 'public');
  mkdirSync(pub, { recursive: true });
  cpSync(join(root, 'public', 'icon.svg'), join(pub, 'icon.svg'));
  cpSync(join(root, 'public', 'fonts', 'luciole'), join(pub, 'fonts', 'luciole'), { recursive: true });
  cpSync(join(THEME, 'sw.js'), join(pub, 'sw.js'));
  writeFileSync(join(pub, '.nojekyll'), '');

  return pages.map(({ path, title, generated: g, updated }) => ({ path, title, generated: g, updated }));
}

export const nav = JSON.parse(readFileSync(join(THEME, 'nav.json'), 'utf8'));
