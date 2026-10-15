// Les exercices qui changent de lieu avec les programmes de 2025-2026 (lot du 7 octobre 2026,
// docs/conception/cadrage-contenu.md, « Programmes 2025-2026 ») : ce que la 5e ne porte plus part en 4e ou en 3e, et la
// sauvegarde suit (format 4 de la partie, src/core/migration.ts). Les étoiles et la file de révision d'un exercice déplacé
// passent à son nouvel identifiant ; un item déplacé seul garde sa clé dans son nouvel exercice (les clés sont écrites
// dans docs/contenu/<lieu>.md), seul son exercice change. Données figées, comme legacyIds.ts : un déplacement à venir
// (la conjugaison de 4e en 2027) ajoute sa propre table, avec un nouveau format.

/** Un exercice entier : l'ancien identifiant → le nouveau. Ses items gardent leurs clés. */
export const MOVED_EXERCISES: Readonly<Record<string, string>> = {
  // Multiplier et diviser des relatifs, puis des fractions : du Glacier des relatifs (5e) au Fourneau de la Forge (4e).
  'maths-5e-signed-numbers-subtracting-1': 'maths-4e-powers-subtracting-1',
  'maths-5e-signed-numbers-subtracting-2': 'maths-4e-powers-subtracting-2',
  'maths-5e-signed-numbers-fractions-3': 'maths-4e-powers-subtracting-3',
  // Le partage selon un ratio : des Étals du Marché (5e) aux Cargaisons de l'Observatoire des données (3e).
  'maths-5e-proportionality-proportion-tables-3': 'maths-3e-statistics-ratio-sharing-1',
  // Mais, mes, met, m'est : de l'Aiguillage du Carrefour (5e) aux Liens du Cabinet (4e).
  'french-5e-homophones-choices-3': 'french-4e-vocabulary-conjunctions-1',
  // Le subjonctif : des Roseaux du Marais (5e) aux Liens du Cabinet (4e) ; reconnaître le temps reste au Marais (Reflets).
  'french-5e-conjugation-subjunctive-1': 'french-4e-vocabulary-conjunctions-3',
  'french-5e-conjugation-subjunctive-2': 'french-5e-conjugation-tense-recognition-1',
};

/**
 * Un item seul, quand son exercice reste où il est avec d'autres items : `<ancien exercice>:<clé>` → le nouvel
 * exercice. Ni / n'y, si / s'y (Aiguillage, niveau 2) et quel / qu'elle (niveau 1) partent aux Liens, niveau 2.
 */
export const MOVED_ITEMS: Readonly<Record<string, string>> = Object.fromEntries([
  ...[0, 1, 2, 3].map((i) => [`french-5e-homophones-choices-2:french-5e-homophones-choices-2-${i}`, 'french-4e-vocabulary-conjunctions-2']),
  ...[0, 1, 6, 7].map((i) => [`french-5e-homophones-choices-1:french-5e-homophones-choices-1-${i}`, 'french-4e-vocabulary-conjunctions-2']),
]);

/**
 * Les étoiles d'une mission ne baissent jamais (www/pedagogie/principes.md) : une mission qui reste à sa place mais
 * perd un niveau (l'Aiguillage du Carrefour, les Étals du Marché, les Icebergs du Glacier) garderait sinon ses étoiles
 * dans le seul niveau parti. Ses étoiles sont aussi données à un niveau qui reste (`<exercice parti>` → `<exercice
 * resté>`), sans partie jouée de plus ; le niveau parti les garde aussi dans sa nouvelle place.
 */
export const STARS_KEPT_IN_MISSION: Readonly<Record<string, string>> = {
  'french-5e-homophones-choices-3': 'french-5e-homophones-choices-2',
  'maths-5e-proportionality-proportion-tables-3': 'maths-5e-proportionality-proportion-tables-2',
  'maths-5e-signed-numbers-fractions-3': 'maths-5e-signed-numbers-fractions-2',
};

/**
 * Les items retirés par le lot, sans place dans aucun exercice (identifiants d'avant le déplacement) : ils quittent la
 * file de révision à la migration (sinon ils resteraient dus pour toujours, sans écran pour les revoir). Plus tôt et
 * plutôt (homophones lexicaux, en 3e) quittent l'Aiguillage ; deux phrases de l'ancien niveau 2 des Roseaux ne suivent
 * pas aux Reflets ; quatre phrases des homophones en phrases sont remplacées ; ou / où et quand / quant / qu'en (des
 * conjonctions, en 4e) quittent les Panneaux pour le portail seul. Les exercices générés (maths) ne figurent pas ici :
 * leurs clés décrivent un calcul que leur générateur peut encore tirer, ailleurs que dans leur échantillon fixe.
 */
export const RETIRED_ITEMS: ReadonlySet<string> = new Set([
  ...[4, 5, 6, 7].map((i) => `french-5e-homophones-choices-2:french-5e-homophones-choices-2-${i}`),
  ...[2, 7].map((i) => `french-5e-conjugation-subjunctive-2:french-5e-conjugation-subjunctive-2-${i}`),
  ...[0, 2, 4, 7].map((i) => `french-5e-homophones-homophone-sentences-2:french-5e-homophones-homophone-sentences-2-${i}`),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `french-5e-homophones-pairs-ou:ou-${i}`),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `french-5e-homophones-pairs-quand:quand-${i}`),
]);

/** Les adresses des missions déplacées (« Ma dernière mission ») : l'ancienne → la nouvelle. */
export const MOVED_PATHS: Readonly<Record<string, string>> = {
  '/adventure/maths-5e-signed-numbers/subtracting': '/adventure/maths-4e-powers/subtracting',
  '/adventure/french-5e-conjugation/subjunctive': '/adventure/french-5e-conjugation/tense-recognition',
};

const has = (o: Readonly<Record<string, string>>, k: string): boolean => Object.hasOwn(o, k);

/** L'identifiant d'un exercice après le déplacement (le même s'il n'a pas bougé). */
export function movedExerciseId(id: string): string {
  return has(MOVED_EXERCISES, id) ? MOVED_EXERCISES[id] : id;
}

/** Un item de la file de révision (`<exercice>:<clé>`) après le déplacement : sa clé ne change jamais. */
export function movedItemId(itemId: string): string {
  if (has(MOVED_ITEMS, itemId)) return `${MOVED_ITEMS[itemId]}:${itemId.slice(itemId.lastIndexOf(':') + 1)}`;
  const at = itemId.lastIndexOf(':');
  if (at < 0) return itemId;
  return `${movedExerciseId(itemId.slice(0, at))}${itemId.slice(at)}`;
}

/** Une adresse après le déplacement (la recherche, `?…`, est gardée). */
export function movedPath(path: string): string {
  const q = path.indexOf('?');
  const [base, search] = q < 0 ? [path, ''] : [path.slice(0, q), path.slice(q)];
  return has(MOVED_PATHS, base) ? `${MOVED_PATHS[base]}${search}` : path;
}
