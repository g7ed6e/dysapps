// L'article devant le nom d'un lieu dans une phrase du jeu (« la Forêt des sons », « du Volcan », « à l’Horloge ») :
// un seul utilitaire pour toutes les phrases qui nomment un lieu, dans les deux univers (leurs lieux portent les mêmes
// noms). Code pur, sans Three.js.

/** Les premiers mots des noms de lieux au féminin (« de la Forêt des sons ») ; les autres sont au masculin (« du Volcan »). */
const FEMININS = new Set(['forêt', 'forge', 'mine', 'carrière', 'ferme', 'tour', 'plaine', 'rivière', 'falaise', 'baie', 'horloge', 'gare', 'île', 'halle', 'fabrique', 'fouille', 'pointe', 'vallée']);

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

/** Le genre d'un nom de lieu, pour accorder ce qui le suit (« la Forêt des sons est réunie », « le Volcan est réuni »). */
function isFemininePlace(nom: string): boolean {
  return FEMININS.has(nom.split(/\s/)[0].toLowerCase());
}

/** « réuni » ou « réunie » : un participe accordé au genre du nom d'un lieu (« la Mine des lettres est réunie »). */
export function agreeWithPlace(nom: string, masculin: string): string {
  return isFemininePlace(nom) ? `${masculin}e` : masculin;
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

/**
 * « La Tour du lecteur est réunie à la Ferme des accords. », « Le Volcan des décimaux est réuni à la Mine des lettres. » :
 * la phrase après une réunion (GD-9), accordée au premier lieu.
 */
export function joinedSentence(nom: string, autre: string): string {
  const le = thePlace(nom);
  return `${le.charAt(0).toUpperCase()}${le.slice(1)} est ${agreeWithPlace(nom, 'réuni')} ${toPlace(autre)}.`;
}
