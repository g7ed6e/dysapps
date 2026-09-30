// Les îles écrites en Markdown (docs/contenu/) et les JSON qu'elles produisent (src/blocland/exercises/data/).
// Module sans effet : generer.mjs (npm run contenu) et importer.mjs s'en servent.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireIle, principal } from './format.mjs';

// Chemins depuis la racine du dépôt, d'où npm et vitest lancent les scripts.
const racine = process.cwd();
export const CONTENU = join(racine, 'docs/contenu');
export const DATA = join(racine, 'src/blocland/exercises/data');
export const ILES = join(racine, 'src/blocland/iles.json');

/** Ce qu'une île et chacune de ses missions doivent donner pour que le jeu les montre. */
const CHAMPS_ILE = ['name', 'module', 'subject', 'classe', 'description', 'block', 'guardian', 'icon', 'creature'];
const CHAMPS_MISSION = ['description', 'programme'];

/** L'ordre des îles : docs/contenu/archipel.md, une ligne « 1. `foret` » par île. */
function ordreDesIles() {
  const texte = readFileSync(join(CONTENU, 'archipel.md'), 'utf8');
  return [...texte.matchAll(/^\d+\. `([a-z0-9-]+)`$/gm)].map((m) => m[1]);
}

/**
 * Les îles (src/blocland/iles.json, dans l'ordre de docs/contenu/archipel.md) et les exercices écrits en Markdown :
 * { sortie: Map<chemin JSON, texte>, iles: Set<île> }.
 */
export function produire() {
  const sortie = new Map();
  const iles = new Set();
  const biomes = new Map();
  for (const f of readdirSync(CONTENU).filter((n) => n.endsWith('.md') && n !== 'README.md' && n !== 'archipel.md').sort()) {
    const fichier = join('docs/contenu', f);
    const { ile, biome, exercices } = lireIle(readFileSync(join(CONTENU, f), 'utf8'), fichier);
    if (f !== `${ile}.md`) throw new Error(`${fichier} : le fichier d'une île s'appelle <île>.md (${ile}.md)`);
    for (const k of CHAMPS_ILE) if (biome[k] === undefined) throw new Error(`${fichier} : l'île n'a pas de « ${k} » (voir docs/contenu/README.md)`);
    for (const m of biome.exercises) {
      for (const k of CHAMPS_MISSION) if (m[k] === undefined || m[k].length === 0) throw new Error(`${fichier}, mission ${m.id} : « ${k === 'programme' ? 'compétences' : k} » manque`);
    }
    iles.add(ile);
    biomes.set(ile, biome);
    for (const ex of exercices) {
      const chemin = join(DATA, `${ex.id}.json`);
      if (sortie.has(chemin)) throw new Error(`${fichier} : exercice « ${ex.id} » écrit deux fois`);
      sortie.set(chemin, JSON.stringify(ex, null, 2) + '\n');
    }
  }
  const ordre = ordreDesIles();
  for (const id of ordre) if (!biomes.has(id)) throw new Error(`docs/contenu/archipel.md : l'île « ${id} » n'a pas de fichier docs/contenu/${id}.md`);
  for (const id of biomes.keys()) if (!ordre.includes(id)) throw new Error(`docs/contenu/${id}.md : l'île manque dans docs/contenu/archipel.md`);
  if (new Set(ordre).size !== ordre.length) throw new Error('docs/contenu/archipel.md : une île y est écrite deux fois');
  sortie.set(ILES, JSON.stringify(ordre.map((id) => biomes.get(id)), null, 2) + '\n');
  return { sortie, iles };
}

/** Ce qui nomme un item (son premier champ hors clé, dans l'ordre du format), pour le reconnaître d'une version à l'autre. */
function nom(it) {
  const k = principal(it);
  return k === undefined ? '' : JSON.stringify(it[k]);
}

/**
 * Les clés d'item qui glisseraient d'un item à un autre : un item déjà présent avant sous une autre clé (la clé par
 * défaut suit le rang ; insérer, retirer ou permuter des items au milieu décalerait la répétition espacée de l'élève).
 * Corriger le texte d'un item en gardant sa place reste permis.
 */
export function clesDeplacees(ancien, nouveau) {
  const parNom = new Map();
  for (const it of ancien.items) parNom.set(nom(it), [...(parNom.get(nom(it)) ?? []), it.key]);
  return nouveau.items.filter((it) => parNom.has(nom(it)) && !parNom.get(nom(it)).includes(it.key)).map((it) => it.key);
}

/**
 * Les clés d'avant remplacées par une clé nouvelle au même rang : avec « clé des items : mot », corriger un mot change
 * sa clé, et l'item repart de zéro dans la répétition espacée. Permis (on peut vouloir remplacer un item), mais signalé.
 */
export function clesRemplacees(ancien, nouveau) {
  const avant = new Set(ancien.items.map((it) => it.key));
  const apres = new Set(nouveau.items.map((it) => it.key));
  return ancien.items.flatMap((it, n) => {
    const remplacant = nouveau.items[n];
    return !apres.has(it.key) && remplacant && !avant.has(remplacant.key) ? [`${it.key} → ${remplacant.key}`] : [];
  });
}
