/**
 * Ce que le bouton Écouter d'une ligne de lexique lit, dans la voix de la langue vivante : les mots de la langue, à gauche
 * des « = » (« push = pousser, pull = tirer » → « push, pull »). Les lignes du lexique s'écrivent ainsi dans
 * `docs/contenu/` : le mot de la langue d'abord, puis son sens en français.
 * - Ce qui est entre parenthèses est une précision, laissée de côté (« library = bibliothèque (une librairie = …) »).
 * - La ligne se coupe en morceaux aux « ; ». Dans un morceau, le premier mot est tout ce qui précède le premier « = »
 *   (après un éventuel « La date : ») ; chaque mot suivant commence après la dernière virgule, le dernier « : » ou la
 *   dernière fin de phrase qui le précède (« black = noir, blue = bleu », « past = après : ten past seven = … »,
 *   « thank you = merci. sorry = pardon. ») ; sans l'un d'eux, c'est encore du français (« = 4 h moins 20 = 3 h 40 »).
 * - Un mot que la voix de la langue lirait mal est laissé : un mot accentué ou un petit mot français (« collège »,
 *   « Un nom au singulier ») et un suffixe (« -ty »).
 * Une ligne de méthode, sans « = », ne lit rien : elle n'a pas de bouton.
 */
const ACCENTS = /[àâäçéèêëîïôöùûüÿœæ]/i;
const PETITS_MOTS_FRANCAIS = /(^|\s)(un|une|des|du|de|le|la|les|au|aux|ou|et)(\s|$)/i;
const DEBUT_DU_PREMIER = / : /g;
const DEBUT_DES_SUIVANTS = /, | : |[.?!] /g;

/** Position juste après le dernier séparateur trouvé dans `texte`, ou -1. */
function apresLeDernier(texte: string, separateurs: RegExp): number {
  let fin = -1;
  for (const m of texte.matchAll(separateurs)) fin = m.index + m[0].length;
  return fin;
}

export function motsAEcouter(ligne: string): string {
  const mots: string[] = [];
  for (const morceau of ligne.replace(/\s*\([^)]*\)/g, '').split(';')) {
    const parts = morceau.split('=');
    for (let k = 0; k < parts.length - 1; k++) {
      const avant = parts[k].trimEnd();
      const debut = apresLeDernier(avant, k === 0 ? DEBUT_DU_PREMIER : DEBUT_DES_SUIVANTS);
      if (k > 0 && debut < 0) continue;
      const mot = avant
        .slice(Math.max(debut, 0))
        .replace(/\s*\/\s*/g, ', ')
        .replace(/\.$/, '')
        .trim();
      if (mot && !mot.startsWith('-') && !ACCENTS.test(mot) && !PETITS_MOTS_FRANCAIS.test(mot)) mots.push(mot);
    }
  }
  return mots.join(', ');
}
