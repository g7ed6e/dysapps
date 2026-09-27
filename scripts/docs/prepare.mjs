// Prépare les sources du site de documentation pour VitePress (docs/.vitepress/config.mts) :
// les pages Markdown de docs/ (sauf docs/_theme/, docs/_journal/ et docs/.vitepress/) plus les pages générées depuis
// les données du jeu (scripts/docs/generate.mjs) et le journal des versions (scripts/docs/journal.mjs),
// copiées dans .docs-src/ avec les fichiers statiques (icône, police Luciole, sw.js, captures d'écran du jeu).
// Aucune ressource externe.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generatePages } from './generate.mjs';
import { journalPage } from './journal.mjs';

const root = process.cwd();
export const DOCS = join(root, 'docs');
export const SRC = join(root, '.docs-src');
const THEME = join(DOCS, '_theme');
const CAPTURES = join(DOCS, '_captures');
/** Une image JPEG d'un pixel, à la place d'une capture absente en local. */
const PLACEHOLDER_JPEG =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

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

const GAME_NOTE =
  'Cette page est produite à chaque publication à partir des données du jeu (`scripts/docs/generate.mjs`) : elle décrit exactement la version en ligne.';
const JOURNAL_NOTE =
  'Cette page est assemblée à chaque publication à partir des fragments de `docs/_journal/` (un par pull request) ; les numéros de version viennent de l’historique git (`scripts/version.mjs`).';

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
  const generated = [...(await generatePages()).map((p) => ({ ...p, note: GAME_NOTE })), { ...journalPage(root), note: JOURNAL_NOTE }].map((p) => ({
    ...p,
    generated: true,
    updated: today,
  }));
  const pages = [...disk.filter((p) => !generated.some((g) => g.path === p.path)), ...generated];

  rmSync(SRC, { recursive: true, force: true });
  for (const page of pages) {
    const out = join(SRC, page.path);
    mkdirSync(dirname(out), { recursive: true });
    // Une page générée n'a pas de fichier source à ouvrir : elle dit d'où elle vient.
    const body = page.generated
      ? `---\neditLink: false\n---\n\n${page.body.trimEnd()}\n\n::: info Page générée\n${page.note}\n:::\n`
      : page.body;
    writeFileSync(out, body);
  }
  const pub = join(SRC, 'public');
  mkdirSync(pub, { recursive: true });
  cpSync(join(root, 'public', 'icon.svg'), join(pub, 'icon.svg'));
  cpSync(join(root, 'public', 'fonts', 'luciole'), join(pub, 'fonts', 'luciole'), { recursive: true });
  cpSync(join(THEME, 'sw.js'), join(pub, 'sw.js'));
  // Les captures d'écran du jeu : servies sous /captures/. Elles ne sont pas dans le dépôt ; la CI les fait
  // (npm run docs:captures) avant ce build. Une image citée par une page doit être une capture déclarée dans
  // scripts/docs/captures.mjs : une capture renommée ou oubliée casse le build, pas seulement l'image.
  const declared = new Set(
    [...readFileSync(join(root, 'scripts', 'docs', 'captures.mjs'), 'utf8').matchAll(/name: '([a-z0-9-]+)'/g)].map((m) => `${m[1]}.jpg`),
  );
  const required = process.env.DOCS_CAPTURES === 'required';
  mkdirSync(join(pub, 'captures'), { recursive: true });
  if (existsSync(CAPTURES)) cpSync(CAPTURES, join(pub, 'captures'), { recursive: true });
  const missing = new Set();
  for (const page of pages.filter((p) => !p.generated)) {
    // Le code (blocs et `en ligne`) ne compte pas : un exemple de syntaxe n'est pas une image citée.
    const text = page.body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const [, name] of text.matchAll(/\]\(\/captures\/([^)\s]+)\)/g)) {
      if (!declared.has(name)) throw new Error(`Capture inconnue : ${name} (citée dans docs/${page.path}) — la déclarer dans scripts/docs/captures.mjs`);
      if (existsSync(join(CAPTURES, name))) continue;
      if (required) throw new Error(`Capture absente : docs/_captures/${name} (citée dans docs/${page.path}) — voir npm run docs:captures`);
      missing.add(name);
    }
  }
  // En local, sans captures : une image d'un pixel à la place, pour relire les pages sans rejouer le jeu.
  for (const name of missing) writeFileSync(join(pub, 'captures', name), Buffer.from(PLACEHOLDER_JPEG, 'base64'));
  if (missing.size) console.warn(`${missing.size} captures absentes de docs/_captures/, remplacées par une image vide : npm run docs:captures pour les faire.`);
  writeFileSync(join(pub, '.nojekyll'), '');

  return pages.map(({ path, title, generated: g, updated }) => ({ path, title, generated: g, updated }));
}

export const nav = JSON.parse(readFileSync(join(THEME, 'nav.json'), 'utf8'));
