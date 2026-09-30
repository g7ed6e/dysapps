// npm run contenu : produit les JSON des exercices du jeu (src/blocland/exercises/data/<id>.json) depuis les îles
// écrites en Markdown (docs/contenu/<île>.md, format : scripts/contenu/format.mjs). Les JSON produits sont commités ;
// ne pas les éditer à la main.
// --check : échoue si un JSON ne suit plus son Markdown, sans rien écrire (CI).
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { clesDeplacees, clesRemplacees, DATA, produire } from './chemins.mjs';

const { sortie, iles } = produire();
const court = (p) => relative(process.cwd(), p);
const perimes = [...sortie].filter(([p, texte]) => !existsSync(p) || readFileSync(p, 'utf8') !== texte).map(([p]) => p);
const enTrop = readdirSync(DATA)
  .map((n) => join(DATA, n))
  .filter((p) => !sortie.has(p) && iles.has(JSON.parse(readFileSync(p, 'utf8')).biome));

if (process.argv.includes('--check')) {
  if (perimes.length || enTrop.length) {
    for (const p of perimes) console.error(`✗ ${court(p)} ne suit plus docs/contenu/ : npm run contenu`);
    for (const p of enTrop) console.error(`✗ ${court(p)} ne vient d'aucun niveau de docs/contenu/ : npm run contenu le supprime`);
    process.exit(1);
  }
  console.log(`✓ ${sortie.size} fichiers à jour (${iles.size} îles en Markdown)`);
} else {
  const erreurs = [];
  for (const p of perimes.filter((q) => q.startsWith(DATA) && existsSync(q))) {
    const deplacees = clesDeplacees(JSON.parse(readFileSync(p, 'utf8')), JSON.parse(sortie.get(p)));
    const remplacees = clesRemplacees(JSON.parse(readFileSync(p, 'utf8')), JSON.parse(sortie.get(p)));
    if (remplacees.length) console.warn(`! ${court(p)} : clés remplacées (${remplacees.join(', ')}) ; ces items repartent de zéro pour l'élève. Pour une coquille corrigée, garder l'ancienne clé avec « - clé : ».`);
    if (deplacees.length) erreurs.push(`${court(p)} : les clés ${deplacees.join(', ')} désigneraient d'autres items qu'avant. Un item s'ajoute à la fin ; pour en insérer ou en retirer un au milieu, écrire « - clé : » avec l'ancienne clé sur les items qui suivent, et une clé nouvelle sur l'item ajouté.`);
  }
  if (erreurs.length) {
    for (const e of erreurs) console.error(`✗ ${e}`);
    process.exit(1);
  }
  for (const p of perimes) writeFileSync(p, sortie.get(p));
  for (const p of enTrop) rmSync(p);
  console.log(`✓ ${perimes.length} fichiers écrits, ${enTrop.length} supprimés (${iles.size} îles en Markdown)`);
}
