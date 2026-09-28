// Le phare de référence d'Archipéo (sous-lot R4b-6e, docs/conception/cadrage-archipeo.md §6, « La fiche de famille »,
// règle 1) : un seul modèle, en primitives peintes, que les Premiers Rivages construisent, que les Îles du Ciel
// reprennent en changeant la taille, le socle et le site, et que R5 réutilise pour les plans du phare, pièce par pièce,
// sans en changer ni les proportions ni les couleurs. Code pur : il trace dans les pinceaux qu'on lui donne.
import { mixColor } from '../daylight';
import { SOLEIL_DIRECTION, type Couleur, type Faces } from '../palette';
import { lineaire } from '../landMesh';
import { boite, clamp, DELAVE, lueur, peintre, rgb, tronconique, type Peindre, type Pinceau, type RGB } from './pinceau';

/**
 * Les proportions du phare, en fraction de sa hauteur H au-dessus du socle (DA, 28/09) ; les rayons en fraction du
 * rayon bas du fût r ; les débords et l'anneau en cases.
 */
export const PHARE = {
  /** Le fût, tronconique, de 0 à 0,70 H ; son rayon haut. */
  fut: [0, 0.7],
  rayonHaut: 0.75,
  /** Les deux bandes de terre cuite, de 0,08 H chacune. */
  bandes: [
    [0.3, 0.38],
    [0.5, 0.58],
  ],
  /** La galerie : une dalle posée sur le fût, qui dépasse son haut. */
  galerie: { bas: 0.7, epaisseur: 0.03, debord: 0.25 },
  /** La lanterne, vitrée ; son rayon. */
  lanterne: { bas: 0.73, haut: 0.85, rayon: 0.55 },
  /** Le toit conique, sa base plus large que la lanterne. */
  toit: { bas: 0.85, haut: 1, rayon: 0.85 },
  /** L'anneau pétrole à la jonction du socle et du fût (en cases), et son débord sur le fût. */
  anneau: { hauteur: 0.15, debord: 0.06 },
  /** Huit pans, comme les repères du lot R4. */
  pans: 8,
} as const;

/** Les couleurs du phare, les mêmes dans tous les archipels (fiche de famille). */
export const COULEURS_DU_PHARE = {
  fut: 0xe9e4d6,
  /** Terre cuite désaturée, jamais un rouge vif : les bandes et le toit. */
  bande: 0xa8553a,
  toit: 0xa8553a,
  galerie: 0x553330,
  anneau: 0x3f8299,
  /** La lanterne la nuit, dans les lueurs ; de jour, le verre de la palette. */
  lanterneNuit: 0xffd866,
} as const;

/**
 * L'éclat du fût : sous la lumière de la scène, un crème peint tel quel se lit grège, et gris à l'ombre (relecture du
 * DA, 28/09). Le fût est donc peint plus clair que blanc dans l'espace linéaire (×`ECLAT_DU_FUT`), sans assombrir son
 * pied ni griser son ombre : à l'écran, environ `#DDD5C2` au soleil et `#B3AA97` à l'ombre, la note la plus claire du
 * phare. La couleur de la fiche (`fut`) ne change pas.
 */
export const ECLAT_DU_FUT = 1.55;
/** L'ombre du fût : plus claire (+`eclat`) et plus chaude (`chaleur` : plus de rouge, moins de bleu), à l'opposé du soleil. */
export const OMBRE_DU_FUT = { eclat: 0.55, chaleur: 0.1 } as const;

/** Le phare de chaque archipel qui en a un : seuls la taille, le socle et le site changent (H et r en cases). */
export const PHARES = {
  '6e': { H: 8, r: 1, socle: 1, emprise: 2 },
  '3e': { H: 11, r: 1.2, socle: 3, emprise: 4 },
} as const;

/** Les pièces du phare, du bas vers le haut : R5 en dessine une partie pendant la restauration d'un plan. */
export const PIECES_DU_PHARE = ['socle', 'anneau', 'fut', 'galerie', 'lanterne', 'toit'] as const;
export type PieceDuPhare = (typeof PIECES_DU_PHARE)[number];

/** Où et comment poser un phare. */
export interface PoseDuPhare {
  /** Le centre de son emprise (repère Three : x, et z pour y). */
  cx: number;
  cz: number;
  /** Le bas du socle (au plus bas de l'emprise, comme tout repère) et le bas du fût (le haut du socle). */
  pied: number;
  y: number;
  /** Sa hauteur au-dessus du socle et le rayon bas de son fût, en cases. */
  H: number;
  r: number;
  /** Le côté de son emprise carrée, en cases. */
  emprise: number;
  /** Sa rotation (autour de l'axe du fût). */
  rot: number;
  /** La pierre du socle (celle de l'archipel). */
  pierre: Faces;
  /** Le verre de la lanterne, de jour. */
  verre: Faces;
  /** Île fermée : couleurs délavées, lanterne éteinte. */
  muted: boolean;
  /** Les pièces à dessiner (toutes par défaut). */
  pieces?: ReadonlySet<PieceDuPhare>;
}

/** Le rayon du fût à une fraction f de H. */
export function rayonDuFut(r: number, f: number): number {
  return r * (1 - (1 - PHARE.rayonHaut) * clamp(f / PHARE.fut[1], 0, 1));
}

const ombre = (c: Couleur): Faces => ({ dessus: c, cote: mixColor(c, 0x4a4c5a, 0.14) });
/** Le soleil, normé : l'ombre du fût se réchauffe et s'éclaircit à l'opposé. */
const SOLEIL = (() => {
  const l = Math.hypot(...SOLEIL_DIRECTION);
  return SOLEIL_DIRECTION.map((v) => v / l) as [number, number, number];
})();
/**
 * Le crème du fût : sa couleur, plus claire que blanc (×`ECLAT_DU_FUT`), à toute hauteur ; sur les faces à l'ombre,
 * un peu plus claire encore et plus chaude, pour que l'ombre reste un crème et jamais un gris neutre.
 */
const creme = (c: Couleur, muted: boolean): Peindre => {
  const f = delave({ dessus: c, cote: c }, muted);
  const k = rgb(f.dessus).map((v) => lineaire(v / 255) * ECLAT_DU_FUT) as RGB;
  return (_, n) => {
    const s = clamp((0.55 - (n[0] * SOLEIL[0] + n[1] * SOLEIL[1] + n[2] * SOLEIL[2])) / 0.8, 0, 1);
    const g = 1 + OMBRE_DU_FUT.eclat * s;
    return [k[0] * g * (1 + OMBRE_DU_FUT.chaleur * s), k[1] * g, k[2] * g * (1 - OMBRE_DU_FUT.chaleur * s)];
  };
};
const delave = (f: Faces, muted: boolean): Faces => (muted ? { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) } : f);

/**
 * Le phare : son socle de pierre et l'anneau pétrole, le fût crème et ses deux bandes, la galerie, la lanterne (dans
 * `L`, les lueurs : claire de jour, elle brille la nuit ; éteinte sur une île fermée), le toit conique. Ni faisceau ni
 * rotation avant le lot 9. Le socle des Îles du Ciel (des salles de pierre) est dessiné par leur sous-lot, qui passe
 * `pieces` sans `socle`.
 */
export function dessinerPhare(P: Pinceau, L: Pinceau, o: PoseDuPhare): void {
  const a = (p: PieceDuPhare) => !o.pieces || o.pieces.has(p);
  const { cx, cz, y, H, r, rot, muted } = o;
  const n = PHARE.pans;
  const haut = y + H;
  const peint = (c: Couleur): Peindre => peintre(delave(ombre(c), muted), o.pied, haut - o.pied);
  const at = (f: number) => y + f * H;
  if (a('socle') && y > o.pied) {
    const s = o.emprise / 2;
    boite(P, cx - s, o.pied, cz - s, cx + s, y, cz + s, peintre(delave(o.pierre, muted), o.pied, haut - o.pied));
  }
  if (a('anneau')) tronconique(P, cx, cz, y, y + PHARE.anneau.hauteur, r + PHARE.anneau.debord, rayonDuFut(r, PHARE.anneau.hauteur / H) + PHARE.anneau.debord, n, rot, peint(COULEURS_DU_PHARE.anneau));
  if (a('fut')) {
    // Le fût en tranches : crème, bande, crème, bande, crème ; un seul cône, des couleurs par tranche. Sans galerie
    // (un plan du phare en cours, R5), son haut est fermé : on ne voit jamais l'intérieur.
    const bornes = [PHARE.fut[0], ...PHARE.bandes.flat(), PHARE.fut[1]];
    for (let i = 0; i + 1 < bornes.length; i++) {
      const [f0, f1] = [bornes[i], bornes[i + 1]];
      const p = i % 2 === 1 ? peint(COULEURS_DU_PHARE.bande) : creme(COULEURS_DU_PHARE.fut, muted);
      const ferme = i + 2 === bornes.length && !a('galerie');
      tronconique(P, cx, cz, at(f0), at(f1), rayonDuFut(r, f0), rayonDuFut(r, f1), n, rot, p, ferme);
    }
  }
  if (a('galerie')) {
    const g = rayonDuFut(r, PHARE.galerie.bas) + PHARE.galerie.debord;
    tronconique(P, cx, cz, at(PHARE.galerie.bas), at(PHARE.galerie.bas + PHARE.galerie.epaisseur), g, g, n, rot, peint(COULEURS_DU_PHARE.galerie));
  }
  if (a('lanterne')) {
    const rl = PHARE.lanterne.rayon * r;
    const y0 = at(PHARE.lanterne.bas);
    const y1 = at(PHARE.lanterne.haut);
    const verre = delave(o.verre, muted);
    if (muted) tronconique(P, cx, cz, y0, y1, rl, rl, n, rot, peintre(verre, y0, y1 - y0), false);
    else {
      // Dans les lueurs : le verre de jour, la lueur de la lanterne la nuit (sans clignoter ni tourner).
      L.deNuit = lueur({ dessus: COULEURS_DU_PHARE.lanterneNuit, cote: COULEURS_DU_PHARE.lanterneNuit });
      tronconique(L, cx, cz, y0, y1, rl, rl, n, rot, peintre(verre, y0 - (y1 - y0), 2 * (y1 - y0)), false);
      L.deNuit = null;
    }
  }
  if (a('toit')) tronconique(P, cx, cz, at(PHARE.toit.bas), at(PHARE.toit.haut), PHARE.toit.rayon * r, 0, n, rot, peint(COULEURS_DU_PHARE.toit));
}
