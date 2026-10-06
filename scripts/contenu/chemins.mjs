// Les îles écrites en Markdown (docs/contenu/<île>.md) et les missions du portail (docs/contenu/portail/), avec les
// JSON qu'ils produisent (src/game/islands.ts, src/game/exercises/data/, src/game/world/plans/,
// src/game/world/requests.json, src/apps/<mission>/),
// et l'assemblage des blocs (docs/contenu/assemblage.md → src/game/world/recipes.ts, et ses questions →
// src/game/exercises/data/assemblage-<bloc>.json).
// Module sans effet : generer.mjs (npm run contenu) et importer.mjs s'en servent.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireIle, principal } from './format.mjs';
import { MISSIONS_PORTAIL } from './portail.mjs';
import { FICHIER_ASSEMBLAGE, ecrireRecettes, lireAssemblage, lireQuestions } from './assemblage.mjs';
import { verifierDemandes } from './demandes.mjs';

// Chemins depuis la racine du dépôt, d'où npm et vitest lancent les scripts.
const racine = process.cwd();
export const CONTENU = join(racine, 'docs/contenu');
export const DATA = join(racine, 'src/game/exercises/data');
export const ILES = join(racine, 'src/game/islands.ts');
export const PLANS = join(racine, 'src/game/world/plans');
export const RECETTES = join(racine, 'src/game/world/recipes.ts');
export const DEMANDES = join(racine, 'src/game/world/requests.json');

/** Ce qu'une île et chacune de ses missions doivent donner pour que le jeu les montre. */
const CHAMPS_ILE = ['name', 'module', 'subject', 'classe', 'description', 'block', 'guardian', 'icon', 'creature'];
const CHAMPS_MISSION = ['description', 'programme'];
const MATIERES = ['french', 'maths', 'english', 'history-geography', 'life-earth-sciences', 'physics-chemistry', 'technology', 'lv2'];
const CLASSES = ['6e', '5e', '4e', '3e'];

/** L'ordre des îles : docs/contenu/archipel.md, une ligne « 1. `french-6e-phonology` » par lieu. */
function ordreDesIles() {
  const texte = readFileSync(join(CONTENU, 'archipel.md'), 'utf8').replace(/\r\n/g, '\n');
  return [...texte.matchAll(/^\d+\. `([a-z0-9-]+)`$/gm)].map((m) => m[1]);
}

/**
 * Les îles (src/game/islands.ts, dans l'ordre de docs/contenu/archipel.md) et les exercices écrits en Markdown :
 * { sortie: Map<chemin JSON, texte>, iles: Set<île> }.
 */
export function produire() {
  const sortie = new Map();
  const iles = new Set();
  const biomes = new Map();
  const demandesParIle = new Map();
  const plansParIle = new Map();
  for (const f of readdirSync(CONTENU).filter((n) => n.endsWith('.md') && n !== 'README.md' && n !== 'archipel.md' && n !== FICHIER_ASSEMBLAGE).sort()) {
    const fichier = join('docs/contenu', f);
    const { ile, biome, exercices, plans, demandes } = lireIle(readFileSync(join(CONTENU, f), 'utf8'), fichier);
    if (f !== `${ile}.md`) throw new Error(`${fichier} : le fichier d'une île s'appelle <île>.md (${ile}.md)`);
    for (const k of CHAMPS_ILE) if (biome[k] === undefined) throw new Error(`${fichier} : l'île n'a pas de « ${k} » (voir docs/contenu/README.md)`);
    if (!MATIERES.includes(biome.subject)) throw new Error(`${fichier} : matière « ${biome.subject} » inconnue (${MATIERES.join(', ')})`);
    if (!CLASSES.includes(biome.classe)) throw new Error(`${fichier} : classe « ${biome.classe} » inconnue (${CLASSES.join(', ')})`);
    for (const m of biome.exercises) {
      for (const k of CHAMPS_MISSION) if (m[k] === undefined || m[k].length === 0) throw new Error(`${fichier}, mission ${m.id} : « ${k === 'programme' ? 'compétences' : k} » manque`);
      if (m.lv2 !== undefined && !['es', 'de'].includes(m.lv2)) throw new Error(`${fichier}, mission ${m.id} : « lv2 » vaut es ou de, lu « ${m.lv2} »`);
    }
    iles.add(ile);
    biomes.set(ile, biome);
    demandesParIle.set(ile, demandes);
    plansParIle.set(ile, plans.map((p) => p.id));
    for (const ex of exercices) {
      const chemin = join(DATA, `${ex.id}.json`);
      if (sortie.has(chemin)) throw new Error(`${fichier} : exercice « ${ex.id} » écrit deux fois`);
      sortie.set(chemin, JSON.stringify(ex, null, 2) + '\n');
    }
    for (const plan of plans) {
      const chemin = join(PLANS, `${plan.id}.json`);
      if (sortie.has(chemin)) throw new Error(`${fichier} : le plan « ${plan.id} » est déjà écrit sur une autre île`);
      sortie.set(chemin, JSON.stringify(plan, null, 2) + '\n');
    }
  }
  const ordre = ordreDesIles();
  for (const id of ordre) if (!biomes.has(id)) throw new Error(`docs/contenu/archipel.md : l'île « ${id} » n'a pas de fichier docs/contenu/${id}.md`);
  for (const id of biomes.keys()) if (!ordre.includes(id)) throw new Error(`docs/contenu/${id}.md : l'île manque dans docs/contenu/archipel.md`);
  if (new Set(ordre).size !== ordre.length) throw new Error('docs/contenu/archipel.md : une île y est écrite deux fois');
  // Un module TypeScript plutôt qu'un JSON : `satisfies` fait vérifier chaque île par le compilateur (matière, bloc, icône,
  // compétences…), sans rien coûter à l'exécution.
  const entete = "// Produit par `npm run contenu` depuis docs/contenu/<île>.md, dans l'ordre de docs/contenu/archipel.md : ne pas éditer.\n";
  sortie.set(ILES, `${entete}import type { BiomeDef } from './biomes';\n\nexport const ILES = ${JSON.stringify(ordre.map((id) => biomes.get(id)), null, 2)} satisfies BiomeDef[];\n`);
  // L'assemblage des blocs (GD-2) : docs/contenu/assemblage.md → src/game/world/recipes.ts, et la question de chaque
  // bloc assemblé → src/game/exercises/data/assemblage-<bloc>.json.
  const mdAssemblage = readFileSync(join(CONTENU, FICHIER_ASSEMBLAGE), 'utf8');
  const fichierAssemblage = join('docs/contenu', FICHIER_ASSEMBLAGE);
  const assemblage = lireAssemblage(mdAssemblage, fichierAssemblage);
  sortie.set(RECETTES, ecrireRecettes(assemblage));
  // Les commandes des habitants (GD-7) : la section « ## Les demandes » de chaque île → src/game/world/requests.json.
  const demandes = verifierDemandes(ordre.map((id) => biomes.get(id)), demandesParIle, assemblage.recettes, plansParIle);
  sortie.set(DEMANDES, JSON.stringify(demandes, null, 2) + '\n');
  for (const q of lireQuestions(
    mdAssemblage,
    fichierAssemblage,
    assemblage.recettes.map((r) => r.bloc),
  )) {
    const chemin = join(DATA, `${q.id}.json`);
    if (sortie.has(chemin)) throw new Error(`${fichierAssemblage} : « ${q.id} » est déjà l’identifiant d’un exercice d’île`);
    sortie.set(chemin, JSON.stringify(q, null, 2) + '\n');
  }
  // Les missions du portail : docs/contenu/portail/<mission>.md → src/apps/<mission>/….json.
  for (const m of MISSIONS_PORTAIL) {
    const fichier = join('docs/contenu/portail', `${m.id}.md`);
    sortie.set(join(racine, m.json), JSON.stringify(m.lire(readFileSync(join(CONTENU, 'portail', `${m.id}.md`), 'utf8'), fichier), null, 2) + '\n');
  }
  const connus = new Set(MISSIONS_PORTAIL.map((m) => `${m.id}.md`));
  for (const f of readdirSync(join(CONTENU, 'portail'))) if (!connus.has(f)) throw new Error(`docs/contenu/portail/${f} : mission du portail inconnue (${[...connus].join(', ')})`);
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
