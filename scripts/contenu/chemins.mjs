// Les îles écrites en Markdown (docs/contenu/) et les JSON qu'elles produisent (src/blocland/exercises/data/).
// Module sans effet : generer.mjs (npm run contenu) et importer.mjs s'en servent.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireIle } from './format.mjs';

// Chemins depuis la racine du dépôt, d'où npm et vitest lancent les scripts.
const racine = process.cwd();
export const CONTENU = join(racine, 'docs/contenu');
export const DATA = join(racine, 'src/blocland/exercises/data');

/** Les exercices des îles écrites en Markdown : { sortie: Map<chemin JSON, texte>, iles: Set<île> }. */
export function produire() {
  const sortie = new Map();
  const iles = new Set();
  for (const f of readdirSync(CONTENU).filter((n) => n.endsWith('.md') && n !== 'README.md').sort()) {
    const fichier = join('docs/contenu', f);
    const { ile, exercices } = lireIle(readFileSync(join(CONTENU, f), 'utf8'), fichier);
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

/** Le champ qui nomme un item (le premier hors clé), pour reconnaître un item d'une version à l'autre. */
function nom(it) {
  const k = Object.keys(it).find((c) => c !== 'key' && c !== 'aid');
  return k === undefined ? '' : JSON.stringify(it[k]);
}

/**
 * Les clés d'item qui désigneraient un autre item qu'avant (la clé par défaut suit le rang : insérer ou retirer un
 * item au milieu décale les suivants, et la répétition espacée de l'élève glisserait d'un item à l'autre).
 */
export function clesDeplacees(ancien, nouveau) {
  const avant = new Map(ancien.items.map((it) => [it.key, nom(it)]));
  return nouveau.items.filter((it) => avant.has(it.key) && avant.get(it.key) !== nom(it)).map((it) => it.key);
}
