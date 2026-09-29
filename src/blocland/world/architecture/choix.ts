// Le choix d'une pièce (lot 7a d'Archipéo) : le voisinage d'un bloc (./voisinage.ts) donne la pièce d'architecture qui
// prend sa place et son orientation. Une table de règles, la même pour tous les archipels : ce qui change d'un archipel
// à l'autre, c'est son kit (./kits/), qui dit la famille de chaque bloc et dessine (ou non) chaque pièce.
//
// Une pièce se nomme `classe.forme.pied.tete` :
// - la forme, lue sur les voisines de même classe côte à côte : seul, bout, droit, angle, té, croix ;
// - le pied : `pied` quand rien du plan n'est dessous (le bloc est au sol : soubassement, pilotis), sinon `haut` ;
// - la tête : `chaperon` quand rien du plan n'est au-dessus (un mur sans toit dans le plan porte un chaperon, jamais un
//   toit ajouté, décision du directeur artistique ; pour un toit, c'est le faîte), `toit` sous un toit, `mur` sous un mur.
//
// Déterministe, et invariant par rotation : tourner le voisinage d'un quart de tour donne la même pièce, tournée d'un
// quart de tour de plus (à la symétrie de la forme près).
import { tournerCotes, type Classe, type Voisinage } from './voisinage';

/** La forme d'une pièce, d'après ses voisines côte à côte. */
export type Forme = 'seul' | 'bout' | 'droit' | 'angle' | 'te' | 'croix';
export type Pied = 'pied' | 'haut';
export type Tete = 'chaperon' | 'toit' | 'mur';

/** Le nom d'une pièce : `classe.forme.pied.tete`. */
export type IdDePiece = `${Classe}.${Forme}.${Pied}.${Tete}`;

/** Un quart de tour, dans le sens direct vu du dessus (+x vers +y). */
export type Rotation = 0 | 1 | 2 | 3;

/**
 * Les formes, dans leur orientation de référence (le masque des côtés, bits de `COTES` : +x, +y, −x, −y). Une pièce est
 * dessinée dans cette orientation ; `pieceDe` dit de combien la tourner.
 */
export const FORMES: readonly { forme: Forme; cotes: number }[] = [
  { forme: 'seul', cotes: 0b0000 },
  // Une voisine en +x.
  { forme: 'bout', cotes: 0b0001 },
  // Le long de x.
  { forme: 'droit', cotes: 0b0101 },
  // En +x et en +y.
  { forme: 'angle', cotes: 0b0011 },
  // En +x, +y et −x : le pied du té en +y.
  { forme: 'te', cotes: 0b0111 },
  { forme: 'croix', cotes: 0b1111 },
];

/** Chaque masque de côtés (0 à 15) : sa forme, et le plus petit quart de tour qui y mène depuis la référence. */
const PAR_MASQUE: readonly { forme: Forme; rotation: Rotation }[] = (() => {
  const out: { forme: Forme; rotation: Rotation }[] = [];
  for (let m = 0; m < 16; m++) {
    let trouve: { forme: Forme; rotation: Rotation } | undefined;
    for (const f of FORMES) {
      for (let r = 0; r < 4 && !trouve; r++) if (tournerCotes(f.cotes, r) === m) trouve = { forme: f.forme, rotation: r as Rotation };
      if (trouve) break;
    }
    if (!trouve) throw new Error(`Masque sans forme : ${m}`);
    out.push(trouve);
  }
  return out;
})();

/** La pièce d'un bloc, d'après son voisinage, et son orientation. */
export function pieceDe(v: Voisinage): { piece: IdDePiece; rotation: Rotation } {
  const { forme, rotation } = PAR_MASQUE[v.cotes & 0b1111];
  const pied: Pied = v.dessous === 'rien' ? 'pied' : 'haut';
  const tete: Tete = v.dessus === 'rien' ? 'chaperon' : v.dessus;
  return { piece: `${v.classe}.${forme}.${pied}.${tete}`, rotation };
}

/** La forme de référence d'une pièce (son masque de côtés, avant rotation). */
export function cotesDeReference(forme: Forme): number {
  return FORMES.find((f) => f.forme === forme)!.cotes;
}
