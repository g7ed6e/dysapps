// Produit les JSON des exercices du jeu (src/blocland/exercises/data/<id>.json) depuis les îles écrites en Markdown
// (docs/contenu/<île>.md, format : scripts/contenu/format.mjs). Les JSON produits sont commités ; ne pas les éditer à la main.
// Usage : npm run contenu   (--check : échoue si un JSON ne suit plus son Markdown, sans rien écrire)
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireIle } from './format.mjs';

export const CONTENU = 'docs/contenu';
export const DATA = 'src/blocland/exercises/data';

/** Les îles écrites en Markdown et leurs fichiers JSON : Map<chemin JSON, texte>. */
export function produire() {
  const sortie = new Map();
  const iles = new Set();
  for (const f of readdirSync(CONTENU).filter((n) => n.endsWith('.md') && n !== 'README.md').sort()) {
    const fichier = join(CONTENU, f);
    const { ile, exercices } = lireIle(readFileSync(fichier, 'utf8'), fichier);
    if (f !== `${ile}.md`) throw new Error(`${fichier} : le fichier d'une île s'appelle <île>.md (${ile}.md)`);
    iles.add(ile);
    for (const ex of exercices) {
      const chemin = join(DATA, `${ex.id}.json`);
      if (sortie.has(chemin)) throw new Error(`${fichier} : exercice « ${ex.id} » écrit deux fois`);
      sortie.set(chemin, JSON.stringify(ex, null, 2) + '\n');
    }
  }
  return { sortie, iles };
}

/** Les JSON d'une île écrite en Markdown qui ne viennent d'aucun niveau (à supprimer). */
function orphelins({ sortie, iles }) {
  return readdirSync(DATA)
    .map((n) => join(DATA, n))
    .filter((p) => !sortie.has(p) && iles.has(JSON.parse(readFileSync(p, 'utf8')).biome));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const produit = produire();
  const perimes = [...produit.sortie].filter(([p, texte]) => !existsSync(p) || readFileSync(p, 'utf8') !== texte).map(([p]) => p);
  const enTrop = orphelins(produit);
  if (process.argv.includes('--check')) {
    if (perimes.length || enTrop.length) {
      for (const p of perimes) console.error(`✗ ${p} ne suit plus docs/contenu/ : npm run contenu`);
      for (const p of enTrop) console.error(`✗ ${p} ne vient d'aucun niveau de docs/contenu/ : npm run contenu le supprime`);
      process.exit(1);
    }
    console.log(`✓ ${produit.sortie.size} exercices à jour (${produit.iles.size} îles en Markdown)`);
  } else {
    for (const p of perimes) writeFileSync(p, produit.sortie.get(p));
    for (const p of enTrop) rmSync(p);
    console.log(`✓ ${perimes.length} exercices écrits, ${enTrop.length} supprimés (${produit.iles.size} îles en Markdown)`);
  }
}
