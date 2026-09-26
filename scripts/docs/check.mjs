// Vérifie, sur une pull request, qu'elle décrit ce qu'elle change dans le journal des versions : elle ajoute un
// fragment docs/_journal/<nom>.md (le texte de l'entrée, sans titre de version : la version se calcule à la
// fusion, voir scripts/version.mjs). Le build de la doc (npm run docs:build) vérifie de son côté que toutes les
// pages du sommaire existent.
// Usage : node scripts/docs/check.mjs [ref de base]   (par défaut origin/main)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fragmentNames, JOURNAL_DIR } from './journal.mjs';

const base = process.argv[2] ?? 'origin/main';
const errors = [];

/** Fragments déjà présents sur la base (aucun si le dossier n'y existe pas encore). */
function namesOnBase() {
  try {
    return execFileSync('git', ['ls-tree', '--name-only', `${base}:${JOURNAL_DIR}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Fragments ajoutés par la pull request (commités ou non) par rapport à la base.
const onBase = new Set(namesOnBase());
const added = fragmentNames().filter((n) => !onBase.has(n));
if (added.length === 0) {
  errors.push(`Aucun fragment nouveau dans ${JOURNAL_DIR}/ : ajouter un fichier ${JOURNAL_DIR}/<nom-de-la-branche>.md qui dit, pour l'élève ou pour le contenu, ce que change la pull request (sans titre de version).`);
}
for (const name of fragmentNames()) {
  const body = readFileSync(join(JOURNAL_DIR, name), 'utf8').trim();
  if (!body) errors.push(`${JOURNAL_DIR}/${name} est vide.`);
  if (/^#{1,2}\s/m.test(body)) errors.push(`${JOURNAL_DIR}/${name} ne doit pas avoir de titre « # » ou « ## » : le titre de version est ajouté au build.`);
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ Journal : ${added.map((n) => `${JOURNAL_DIR}/${n}`).join(', ')}`);
