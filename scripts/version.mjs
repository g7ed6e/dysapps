// La version de l'application se calcule depuis l'historique git, à la manière de GitVersion (mode « mainline ») :
// elle n'est écrite dans aucun fichier, deux pull requests concurrentes ne se disputent donc plus aucun numéro.
// - Point d'ancrage : la dernière étiquette vX.Y.Z sur la lignée de premier parent de HEAD.
// - Chaque commit de premier parent après l'étiquette (une pull request fusionnée dans main) monte la version
//   mineure, sauf si son message demande autre chose : « +semver: major », « +semver: patch » ou « +semver: none ».
// - Sans étiquette atteignable (historique absent), la version est 0.0.0-<sha> et un avertissement est affiché.
// Usage : node scripts/version.mjs   (affiche la version de HEAD)
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const BUMP = /^\s*\+semver:\s*(major|breaking|minor|feature|patch|fix|none|skip)\s*$/im;

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Rend l'historique et les étiquettes si le dépôt a été cloné en surface (Cloudflare clone en profondeur réduite). */
function ensureHistory(cwd) {
  try {
    if (git(['rev-parse', '--is-shallow-repository'], cwd) === 'true') git(['fetch', '--unshallow', '--tags', '--quiet'], cwd);
  } catch {
    // Pas de réseau ou pas de dépôt : versionOf le signalera.
  }
}

/** Le cran demandé par un message de commit (minor par défaut). */
export function bumpOf(message) {
  const m = BUMP.exec(message)?.[1];
  if (m === 'major' || m === 'breaking') return 'major';
  if (m === 'patch' || m === 'fix') return 'patch';
  if (m === 'none' || m === 'skip') return 'none';
  return 'minor';
}

/** Applique un cran à [majeur, mineur, correctif]. */
export function bump([maj, min, pat], kind) {
  if (kind === 'major') return [maj + 1, 0, 0];
  if (kind === 'minor') return [maj, min + 1, 0];
  if (kind === 'patch') return [maj, min, pat + 1];
  return [maj, min, pat];
}

/** Version d'un commit (par défaut HEAD), ou null si aucune étiquette vX.Y.Z n'est atteignable. */
export function versionOf(rev = 'HEAD', cwd = process.cwd()) {
  let tag;
  try {
    tag = git(['describe', '--tags', '--first-parent', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*', rev], cwd);
  } catch {
    return null;
  }
  const m = TAG.exec(tag);
  if (!m) return null;
  let v = m.slice(1).map(Number);
  // Messages des commits de premier parent après l'étiquette, du plus ancien au plus récent (séparés par NUL).
  const log = execFileSync('git', ['log', '--first-parent', '--reverse', '-z', '--format=%B', `${tag}..${rev}`], { cwd, encoding: 'utf8' });
  for (const message of log.split('\0').filter((s) => s.trim())) v = bump(v, bumpOf(message));
  return v.join('.');
}

/** Version du build courant ; jamais d'échec, mais un avertissement si l'historique manque. */
export function appVersion(cwd = process.cwd()) {
  ensureHistory(cwd);
  const v = versionOf('HEAD', cwd);
  if (v) return v;
  let sha = 'inconnu';
  try {
    sha = git(['rev-parse', '--short', 'HEAD'], cwd);
  } catch {
    // Hors dépôt git.
  }
  console.warn(`(!) Version incalculable (aucune étiquette vX.Y.Z dans l'historique git) : « 0.0.0-${sha} ».`);
  return `0.0.0-${sha}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) console.log(appVersion());
