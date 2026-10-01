// Le choix d'une pièce (lot 7 d'Archipéo) : le voisinage d'un bloc (./voisinage.ts) donne la pièce d'architecture qui
// prend sa place et son orientation. Une table de règles, la même pour tous les archipels : ce qui change d'un archipel
// à l'autre, c'est son kit (./kits/), qui dit la famille de chaque bloc et dessine (ou non) chaque pièce.
//
// Un mur se nomme `mur.forme.pied.tete` :
// - la forme, lue sur les voisines de même classe côte à côte : seul, bout, droit, angle, té, croix ;
// - le pied : `pied` quand rien du plan n'est dessous (le bloc est au sol : soubassement), `pilotis` quand rien n'est
//   dessous, pas même le sol (l'eau, le bord du quai), sinon `haut` ;
// - la tête : `chaperon` quand rien du plan n'est au-dessus (un mur sans toit dans le plan porte un chaperon, jamais un
//   toit ajouté, décision du directeur artistique), `toit` sous un toit, `mur` sous un mur.
//
// Un toit se nomme `toit.pente.rive.tete`, lu sur le sens de la pente (décision du directeur artistique, 30 septembre
// 2026 : « chaperon » est réservé aux murs) :
// - la pente : `versant` quand le toit monte d'un seul côté (un toit un cran plus haut, à côté) ; sinon `aretier` quand
//   il monte vers un seul coin (le coin d'une pyramide) ; sinon `faite` quand il descend de deux côtés opposés, `croupe`
//   de trois, `pointe` de quatre ; sinon encore `versant` quand il descend d'un seul côté et file, au même niveau, du
//   côté opposé (le haut d'un toit de quatre rangées, celui de l'école : deux versants qui se rejoignent au faîte) ;
//   sinon `plat` (rien de lisible : il reste un bloc) ;
// - la rive : `rive` au bout d'une rangée de versants ou de faîtes (une voisine manque le long de la rangée), sinon
//   `courant` ;
// - la tête : `ciel` quand rien du plan n'est au-dessus, sinon `toit` ou `mur` (un toit sous un bloc reste un bloc).
//
// Déterministe, et invariant par rotation : tourner le voisinage d'un quart de tour donne la même pièce, tournée d'un
// quart de tour de plus (à la symétrie de la forme près).
import { tournerCotes, type Voisinage } from './voisinage';

/** La forme d'un mur, d'après ses voisines côte à côte. */
export type Forme = 'seul' | 'bout' | 'droit' | 'angle' | 'te' | 'croix';
export type Pied = 'pied' | 'haut' | 'pilotis';
export type Tete = 'chaperon' | 'toit' | 'mur';
/** La pente d'un toit. */
export type Pente = 'versant' | 'aretier' | 'faite' | 'croupe' | 'pointe' | 'plat';
export type Rive = 'rive' | 'courant';
export type TeteDeToit = 'ciel' | 'toit' | 'mur';

export type IdDeMur = `mur.${Forme}.${Pied}.${Tete}`;
export type IdDeToit = `toit.${Pente}.${Rive}.${TeteDeToit}`;
/** Le nom d'une pièce. */
export type IdDePiece = IdDeMur | IdDeToit;

/** Un quart de tour, dans le sens direct vu du dessus (+x vers +y). */
export type Rotation = 0 | 1 | 2 | 3;

/**
 * Les formes des murs, dans leur orientation de référence (le masque des côtés, bits de `COTES` : +x, +y, −x, −y). Une
 * pièce est dessinée dans cette orientation ; `pieceDe` dit de combien la tourner.
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

/**
 * Les pentes des toits, dans leur orientation de référence : le versant monte vers +x (`monte`) ; l'arêtier vers le coin
 * (+x, +y) (`coins`) ; le faîte descend vers +x et −x (`descend` : il file le long de y) ; la croupe vers +x, −x et −y
 * (le bout du faîte qui file vers +y) ; la pointe de quatre côtés.
 */
export const PENTES: readonly { pente: Exclude<Pente, 'plat'>; masque: 'monte' | 'coins' | 'descend'; bits: number }[] = [
  { pente: 'versant', masque: 'monte', bits: 0b0001 },
  { pente: 'aretier', masque: 'coins', bits: 0b0001 },
  { pente: 'faite', masque: 'descend', bits: 0b0101 },
  { pente: 'croupe', masque: 'descend', bits: 0b1101 },
  { pente: 'pointe', masque: 'descend', bits: 0b1111 },
];

/** Le plus petit quart de tour qui mène le masque `reference` à `masque`, ou `null`. */
function rotationVers(reference: number, masque: number): Rotation | null {
  for (let r = 0; r < 4; r++) if (tournerCotes(reference, r) === masque) return r as Rotation;
  return null;
}

/** Chaque masque de côtés (0 à 15) : sa forme, et le plus petit quart de tour qui y mène depuis la référence. */
const PAR_MASQUE: readonly { forme: Forme; rotation: Rotation }[] = (() => {
  const out: { forme: Forme; rotation: Rotation }[] = [];
  for (let m = 0; m < 16; m++) {
    let trouvee: { forme: Forme; rotation: Rotation } | null = null;
    for (const f of FORMES) {
      const rotation = rotationVers(f.cotes, m);
      if (rotation !== null) {
        trouvee = { forme: f.forme, rotation };
        break;
      }
    }
    if (!trouvee) throw new Error(`Masque sans forme : ${m}`);
    out.push(trouvee);
  }
  return out;
})();

/** La pente d'un toit et son orientation : la première des `PENTES` que son voisinage montre. */
function penteDe(v: Voisinage): { pente: Pente; rotation: Rotation } {
  // Un toit qui monte n'est pas un sommet : on lit d'abord la montée (d'un côté, puis vers un coin), puis la descente.
  const lus = v.monte ? PENTES.filter((p) => p.masque === 'monte') : v.coins ? PENTES.filter((p) => p.masque === 'coins') : PENTES.filter((p) => p.masque === 'descend');
  for (const p of lus) {
    const r = rotationVers(p.bits, v[p.masque] & 0b1111);
    if (r !== null) return { pente: p.pente, rotation: r };
  }
  // Le haut d'un versant : il descend d'un seul côté (−x dans l'orientation de référence) et sa voisine de même niveau
  // est du côté opposé (+x), vers où il monte.
  if (!v.monte && !v.coins) {
    const r = rotationVers(0b0100, v.descend & 0b1111);
    if (r !== null && v.cotes & tournerCotes(0b0001, r)) return { pente: 'versant', rotation: r };
  }
  return { pente: 'plat', rotation: 0 };
}

/** La pièce d'un bloc, d'après son voisinage, et son orientation. */
export function pieceDe(v: Voisinage): { piece: IdDePiece; rotation: Rotation } {
  if (v.classe === 'toit') {
    const tete: TeteDeToit = v.dessus === 'rien' ? 'ciel' : v.dessus;
    const { pente, rotation } = tete === 'ciel' ? penteDe(v) : { pente: 'plat' as const, rotation: 0 as Rotation };
    // La rangée file le long de y dans l'orientation de référence : tournée, le long de x.
    const le = rotation % 2 === 0 ? 0b1010 : 0b0101;
    const file = pente === 'versant' || pente === 'faite';
    const rive: Rive = !file || (v.cotes & le) === le ? 'courant' : 'rive';
    return { piece: `toit.${pente}.${rive}.${tete}`, rotation };
  }
  const { forme, rotation } = PAR_MASQUE[v.cotes & 0b1111];
  const pied: Pied = v.dessous !== 'rien' ? 'haut' : v.surLeVide ? 'pilotis' : 'pied';
  const tete: Tete = v.dessus === 'rien' ? 'chaperon' : v.dessus;
  return { piece: `mur.${forme}.${pied}.${tete}`, rotation };
}

/** La forme de référence d'un mur (son masque de côtés, avant rotation). */
export function cotesDeReference(forme: Forme): number {
  return FORMES.find((f) => f.forme === forme)!.cotes;
}
