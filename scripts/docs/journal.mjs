// Le journal des versions (docs/journal.md) est produit au build, sans titre de version écrit à la main :
// chaque pull request ajoute un fragment docs/_journal/<nom>.md (le texte de son entrée, sans titre), et la version
// d'un fragment est celle du commit de main qui l'a ajouté (scripts/version.mjs). Deux pull requests ajoutent
// deux fichiers différents : elles ne se gênent jamais. Les entrées d'avant les fragments sont dans
// docs/_journal/historique.md, recopiées telles quelles sous les entrées générées.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { versionOf } from '../version.mjs';

export const JOURNAL_DIR = 'docs/_journal';
export const HISTORY = 'historique.md';

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const INTRO = `# Journal des versions

Chaque pull request fusionnée publie une version nouvelle, décrite ici, de la plus récente à la plus ancienne. La version installée est affichée dans Réglages → Application. Les versions antérieures au journal sont résumées en bas de page.`;

/** « 26 septembre 2026 » pour « 2026-09-26 ». */
function frenchDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
}

/** Noms des fragments (fichiers .md de docs/_journal/, sauf l'historique). */
export function fragmentNames(cwd = process.cwd()) {
  return readdirSync(join(cwd, JOURNAL_DIR))
    .filter((n) => n.endsWith('.md') && n !== HISTORY)
    .sort();
}

/** Le commit de premier parent qui a ajouté le fragment, ou null s'il n'est pas encore dans l'historique. */
function addedBy(name, cwd) {
  try {
    const shas = git(['log', '--first-parent', '--diff-filter=A', '--format=%H', 'HEAD', '--', `${JOURNAL_DIR}/${name}`], cwd).split('\n').filter(Boolean);
    return shas.at(-1) ?? null;
  } catch {
    return null;
  }
}

/** Entrées du journal : { version, date, bodies } ; version null = pas encore publiée. */
export function journalEntries(cwd = process.cwd()) {
  const byVersion = new Map();
  for (const name of fragmentNames(cwd)) {
    const body = readFileSync(join(cwd, JOURNAL_DIR, name), 'utf8').trim();
    const sha = addedBy(name, cwd);
    const version = sha ? versionOf(sha, cwd) : null;
    const date = sha ? git(['log', '-1', '--format=%cs', sha], cwd) : null;
    const key = version ?? '';
    if (!byVersion.has(key)) byVersion.set(key, { version, date, bodies: [] });
    byVersion.get(key).bodies.push(body);
  }
  const minor = (v) => (v ? Number(v.split('.')[1]) : Infinity);
  return [...byVersion.values()].sort((a, b) => minor(b.version) - minor(a.version));
}

/** La page docs/journal.md. */
export function journalPage(cwd = process.cwd()) {
  const entries = journalEntries(cwd).map(({ version, date, bodies }) => {
    const title = version ? `## ${version} — ${frenchDate(date)}` : '## À paraître';
    return `${title}\n\n${bodies.join('\n\n')}`;
  });
  const history = readFileSync(join(cwd, JOURNAL_DIR, HISTORY), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  return { path: 'journal.md', title: 'Journal des versions', body: [INTRO, ...entries, history].join('\n\n') + '\n' };
}
