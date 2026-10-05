// L'article devant le nom d'un lieu dans une phrase du jeu (« la Forêt des sons », « du Volcan », « à l’Horloge ») :
// un seul utilitaire pour toutes les phrases qui nomment un lieu, dans les deux univers (leurs lieux portent les mêmes
// noms). Code pur, sans Three.js.

/** Les premiers mots des noms de lieux au féminin (« de la Forêt des sons ») ; les autres sont au masculin (« du Volcan »). */
const FEMININS = new Set(['forêt', 'forge', 'mine', 'carrière', 'ferme', 'tour', 'plaine', 'rivière', 'falaise', 'baie', 'horloge', 'gare', 'île', 'halle', 'fabrique']);

/** Les premiers mots qui s'élident devant un h muet. */
const H_MUETS = new Set(['horloge']);

/**
 * L'article d'un nom de lieu, le seul utilitaire des phrases du jeu qui nomment un lieu (les noms des deux univers) :
 * « l’ » devant une voyelle ou un h muet, sinon « la » ou « le » selon le premier mot.
 */
function articleOf(nom: string): 'l’' | 'la' | 'le' {
  const premier = nom.split(/\s/)[0].toLowerCase();
  if (/^[aeiouyàâéèêëîïôöûü]/i.test(premier) || H_MUETS.has(premier)) return 'l’';
  return FEMININS.has(premier) ? 'la' : 'le';
}

/** « la Forêt des sons », « le Volcan des décimaux », « l’Horloge des verbes » : le nom d'un lieu dans une phrase. */
export function thePlace(nom: string): string {
  const art = articleOf(nom);
  return art === 'l’' ? `l’${nom}` : `${art} ${nom}`;
}

/** « de la Forêt des sons », « du Volcan des décimaux », « de l’Atelier du calcul littéral ». */
export function ofPlace(nom: string): string {
  const art = articleOf(nom);
  return art === 'le' ? `du ${nom}` : `de ${thePlace(nom)}`;
}

/** « à la Forêt des sons », « au Volcan des décimaux », « à l’Horloge des verbes ». */
export function toPlace(nom: string): string {
  const art = articleOf(nom);
  return art === 'le' ? `au ${nom}` : `à ${thePlace(nom)}`;
}
