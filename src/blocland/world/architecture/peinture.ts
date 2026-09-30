// Les murs peints de l'architecture modulaire (lot 7b d'Archipéo) : le colombage, le bardage, le soubassement et le
// chaperon sont peints par le shader des blocs (0 triangle), d'après un motif par face de case. Un mur peint garde la
// géométrie de son bloc : ses faces passent par la fusion de world/construction.ts (deux faces voisines de même motif
// et de même couleur ne font qu'un rectangle), et le shader retrouve la case de chaque pixel (`fract` de sa position).
//
// Les décisions du directeur artistique (30 septembre 2026, avis « Aligné ») :
// - colombage sobre : un poteau à chaque bord de case (1/8 de case en tout, 1/16 de chaque côté), une sablière basse sur
//   le soubassement, une haute sous la tête ; des décharges seulement aux bouts et aux angles d'une façade, une par
//   panneau, aucune sur un mur droit, et seulement au rez (sur le soubassement) : sobre, lisible de loin ; le
//   remplissage crème nettement majoritaire ;
// - aucun motif qui ressemble à une lettre : toutes les décharges montent dans le même sens, vues du dehors, et une seule
//   rangée par façade, si bien que deux décharges ne forment jamais un chevron (V, Λ) ni une croix, pas même autour
//   d'un angle ou d'un étage à l'autre ; au plus une par panneau ;
// - de loin, les traits fins s'effacent jusqu'au mur crème uni, sans moiré ; le soubassement et le chaperon, larges,
//   restent ;
// - soubassement de pierre sur 0,35 case, au pied seulement ; les blocs de pierre font un mur plein ; le chaperon d'un
//   mur sans toit est en pierre ;
// - bardage aux pignons et sur les bâtiments du quai ; la nuit, rien ne s'allume : la lumière de la scène assombrit tout.
// Code pur, sans Three.js : le GLSL est une chaîne, que three/construction.ts insère dans le shader des blocs.
import type { Voisinage } from './voisinage';

/**
 * Le motif d'une face, en bits (un entier exact dans l'attribut `motif`, un flottant) : le genre (bits 0 et 1), puis
 * ce qui s'y ajoute.
 */
export const MOTIF = {
  /** Le genre : le colombage (poteaux, sablières, décharges sur le remplissage). */
  colombage: 1,
  /** Le genre : le bardage (des planches, leurs joints). */
  bardage: 2,
  /** Le genre : un mur plein (sa matière ; seulement le soubassement ou le chaperon). */
  plein: 3,
  /** La bande de pierre au pied (`COLOMBAGE.soubassement`). */
  soubassement: 1 << 2,
  /** La sablière basse, posée sur le soubassement. */
  sabliereBasse: 1 << 3,
  /** La sablière haute, sous la tête (sous un toit). */
  sabliereHaute: 1 << 4,
  /** La bande de pierre en haut d'un mur sans toit, et son ombre. */
  chaperon: 1 << 5,
  /** Toute la face en pierre : le dessus d'un chaperon. */
  pierreEntiere: 1 << 6,
  /** Une décharge qui monte vers les u croissants (voir `peintureDuMur`). */
  montante: 1 << 7,
  /** Une décharge qui monte vers les u décroissants. */
  descendante: 1 << 8,
  /** L'île est fermée : les couleurs des rôles délavées. */
  delave: 1 << 9,
} as const;

/** Les mesures du colombage, en part de case. */
export const COLOMBAGE = {
  /** La demi-largeur d'un poteau : 1/16 de case de chaque côté d'un bord (1/8 entre deux cases). */
  poteau: 1 / 16,
  /** La hauteur du soubassement de pierre (0,3 à 0,4 case, décision du directeur artistique). */
  soubassement: 0.35,
  /** L'épaisseur d'une sablière. */
  sabliere: 0.07,
  /** La hauteur du chaperon. */
  chaperon: 0.14,
  /** La demi-largeur d'une décharge. */
  decharge: 0.04,
  /**
   * Le jeu d'une décharge en bas : son pied reste à cette distance (de l'axe) de ce qui borde le panneau en bas (la
   * sablière basse). Elle ne touche que les poteaux, jamais une sablière ni le chaperon : aucun angle aigu entre deux
   * pièces de bois, qui se lirait comme un chevron (relecture du directeur artistique, 30/09). Vue de biais, une face
   * fuyante fait de la sablière, horizontale, une oblique qui rejoint le pied de la décharge : le jour entre elles doit
   * donc se voir à la vue de l'île, soit deux pixels au moins quand une case en fait 16 (le colombage y est entièrement
   * peint, voir `MOTIF_GLSL`). Avec 0,1, il faisait moins d'un pixel, et la décharge et la sablière se lisaient comme un
   * « < » (seconde relecture, `archi-fantome-pres`).
   */
  jeuBas: 0.2,
  /**
   * Le jeu d'une décharge en haut : sa tête reste à cette distance de ce qui borde le panneau en haut (la sablière haute,
   * le chaperon, ou le haut de la case, que l'arête d'un fantôme posé au-dessus dessine pendant le chantier). Au 6e,
   * toutes les décharges sont sous un étage : rien de bois au-dessus d'elles une fois tout construit.
   */
  jeuHaut: 0.1,
  /** Le bardage : la hauteur d'une planche, et la demi-largeur d'un joint. */
  planche: 0.25,
  joint: 0.012,
} as const;

/** Les rôles peints par le shader, dans l'ordre de l'uniforme `uRoles` (puis les mêmes, délavés). */
export const ROLES_PEINTS = ['poteau', 'soubassement', 'chaperon'] as const;

/** La couleur de fond d'un mur peint : la couleur de ses faces, avant le motif. */
export type Fond = 'remplissage' | 'bardage' | 'matiere' | 'soubassement';

/** Un mur peint : son fond et le motif de chacune de ses faces (ordre des bits de `FACES` : +x, +y, −x, −y, haut, bas). */
export interface PeintureDuMur {
  fond: Fond;
  motifs: readonly number[];
}

/** Comment peindre un mur d'une famille : un colombage (le bois) ou un mur plein (la pierre). */
export type ManiereDuMur = 'colombage' | 'plein';

export interface ContexteDuMur {
  /** Le bâtiment est bardé (les bâtiments du quai), au lieu du colombage. */
  barde?: boolean;
  /** La face du côté `cote` (0 à 3, ordre de `COTES`) regarde-t-elle le dehors du bâtiment ? (Les décharges y vont seules.) */
  exterieur?: (cote: number) => boolean;
}

/** Les quatre côtés : +x, +y, −x, −y (comme `COTES`). */
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

/**
 * Le sens d'une décharge sur la face du côté `cote` : le même sur toutes les faces, vues du dehors. Le calcul se fait
 * dans la grille : la droite d'une face de normale n (vue du dehors, le haut en z) y est (−n) × z = (−n.y, n.x), et la
 * décharge monte vers elle. Mais la scène est le miroir de la grille (X = x, Y = z, Z = y, world/mesher.ts) : à l'écran,
 * toutes montent vers la gauche. Le sens importe peu ; qu'il soit le même partout fait qu'aucune décharge ne répond à
 * une autre en chevron. Le shader lit la face selon u : la y de la grille pour une face de normale x, la x pour une face
 * de normale y.
 */
export function sensDeLaDecharge(cote: number): number {
  const droite = cote % 2 === 0 ? DX[cote] : -DY[cote];
  return droite > 0 ? MOTIF.montante : MOTIF.descendante;
}

/**
 * La décharge d'une face, s'il y en a une : ses deux bouts dans la case, (u, v) de 0 à 1 le long de la face (u : la y de
 * la grille pour une face de normale x, la x pour une face de normale y ; v : la hauteur), du pied à la tête. Le même
 * panneau que `MOTIF_GLSL` : d'un poteau à l'autre, à `COLOMBAGE.jeuBas` au-dessus de la sablière basse et à
 * `COLOMBAGE.jeuHaut` sous la sablière haute ou le chaperon.
 */
export function decharge(motif: number): { pied: [number, number]; tete: [number, number] } | null {
  if (!(motif & (MOTIF.montante | MOTIF.descendante)) || (motif & 3) !== MOTIF.colombage) return null;
  const C = COLOMBAGE;
  const bas = (motif & MOTIF.sabliereBasse ? C.soubassement + C.sabliere : 0) + C.jeuBas;
  const haut = (motif & MOTIF.chaperon ? 1 - C.chaperon : motif & MOTIF.sabliereHaute ? 1 - C.sabliere : 1) - C.jeuHaut;
  return motif & MOTIF.montante
    ? { pied: [C.poteau, bas], tete: [1 - C.poteau, haut] }
    : { pied: [1 - C.poteau, bas], tete: [C.poteau, haut] };
}

/**
 * La peinture d'un mur, d'après son voisinage dans le plan (en orientation du monde) :
 * - un mur plein (la pierre) : sa matière, et un chaperon s'il n'a rien au-dessus ;
 * - un mur de bois posé sur un toit (une cheminée) : de la pierre, maçonnée ;
 * - un pignon (un mur de bois sous un toit, entre deux toits) ou un bâtiment du quai : bardé ;
 * - sinon, le colombage : soubassement et sablière basse au pied, sablière haute sous un toit, chaperon sans rien
 *   au-dessus, décharge au rez, sur une face du dehors quand un seul de ses deux voisins le long de la face manque (le
 *   bout ou l'angle d'une façade : jamais sur un mur droit).
 * Un chaperon ne se pose que sur un mur qui ne monte plus (rien de sa classe un cran plus haut à côté : les gradins
 * d'un dôme n'en ont pas).
 */
export function peintureDuMur(v: Voisinage, maniere: ManiereDuMur, contexte: ContexteDuMur = {}): PeintureDuMur {
  const pied = v.dessous === 'rien';
  const chaperon = v.dessus === 'rien' && v.monte === 0;
  const haut = chaperon ? MOTIF.pierreEntiere : 0;
  const bandes = chaperon ? MOTIF.chaperon : 0;
  const partout = (cotes: number, fond: Fond): PeintureDuMur => ({ fond, motifs: [cotes, cotes, cotes, cotes, haut, 0] });
  if (maniere === 'plein') return partout(MOTIF.plein | bandes, 'matiere');
  if (v.dessous === 'toit') return partout(MOTIF.plein | bandes, 'soubassement');
  if (v.dessus === 'toit' && v.toits !== 0) return partout(MOTIF.bardage, 'bardage');
  if (contexte.barde) return partout(MOTIF.bardage | (pied ? MOTIF.soubassement : 0) | bandes, 'bardage');
  const base = MOTIF.colombage | (pied ? MOTIF.soubassement | MOTIF.sabliereBasse : 0) | (v.dessus === 'toit' ? MOTIF.sabliereHaute : 0) | bandes;
  const motifs = [0, 1, 2, 3].map((cote) => {
    if (!pied || v.cotes & (1 << cote) || !contexte.exterieur?.(cote)) return base;
    // Les deux voisines le long de la face : exactement une qui manque, c'est un bout ou un angle de la façade.
    const manquent = [(cote + 1) % 4, (cote + 3) % 4].filter((c) => !(v.cotes & (1 << c))).length;
    return manquent === 1 ? base | sensDeLaDecharge(cote) : base;
  });
  return { fond: 'remplissage', motifs: [...motifs, haut, 0] };
}

/**
 * Le motif en GLSL : `peindreLeMotif(c, motif, pos, n)` rend la couleur linéaire `c` (le fond de la face) peinte du
 * motif, au point `pos` (repère Three, la case entière aux coordonnées entières) de normale `n`. `uRoles` : les
 * couleurs linéaires des rôles (`ROLES_PEINTS`), puis les mêmes, délavées. De loin, quand une case tient en moins de
 * 16 pixels, les traits fins (poteaux, sablières, décharges, joints) s'effacent ; sous 8 pixels, le mur est uni.
 */
export const MOTIF_GLSL = `
uniform vec3 uRoles[${ROLES_PEINTS.length * 2}];
float bandeDuMotif(float d, float w, float f) {
  return 1.0 - smoothstep(w - 0.5 * f, w + 0.5 * f, d);
}
vec3 peindreLeMotif(vec3 c, float motif, vec3 pos, vec3 n) {
  int m = int(motif + 0.5);
  if (m <= 0) return c;
  bool delave = (m & ${MOTIF.delave}) != 0;
  vec3 bois = delave ? uRoles[3] : uRoles[0];
  vec3 socle = delave ? uRoles[4] : uRoles[1];
  vec3 chap = delave ? uRoles[5] : uRoles[2];
  vec3 an = abs(n);
  if (an.y > 0.5) return (m & ${MOTIF.pierreEntiere}) != 0 ? chap : c;
  float u = an.x > 0.5 ? pos.z : pos.x;
  float fu = fract(u);
  float fv = fract(pos.y);
  float du = max(fwidth(u), 1e-5);
  float dv = max(fwidth(pos.y), 1e-5);
  float loin = clamp((1.0 / max(du, dv) - 8.0) / 8.0, 0.0, 1.0);
  int genre = m & 3;
  const float S = ${COLOMBAGE.soubassement.toFixed(4)};
  const float B = ${COLOMBAGE.sabliere.toFixed(4)};
  const float C = ${COLOMBAGE.chaperon.toFixed(4)};
  const float P = ${COLOMBAGE.poteau.toFixed(4)};
  if (genre == ${MOTIF.colombage}) {
    float bois_ = bandeDuMotif(min(fu, 1.0 - fu), P, du);
    if ((m & ${MOTIF.sabliereBasse}) != 0) bois_ = max(bois_, bandeDuMotif(abs(fv - (S + 0.5 * B)), 0.5 * B, dv));
    if ((m & ${MOTIF.sabliereHaute}) != 0) bois_ = max(bois_, bandeDuMotif(abs(fv - (1.0 - 0.5 * B)), 0.5 * B, dv));
    if ((m & ${MOTIF.montante | MOTIF.descendante}) != 0) {
      // Le panneau : entre les poteaux, et entre ce qui le borde en bas et en haut ; la décharge, à son jeu de l'un et
      // de l'autre (elle ne touche que les poteaux).
      float bas = ((m & ${MOTIF.sabliereBasse}) != 0 ? S + B : 0.0) + ${COLOMBAGE.jeuBas.toFixed(4)};
      float haut = ((m & ${MOTIF.chaperon}) != 0 ? 1.0 - C : ((m & ${MOTIF.sabliereHaute}) != 0 ? 1.0 - B : 1.0)) - ${COLOMBAGE.jeuHaut.toFixed(4)};
      bool monte = (m & ${MOTIF.montante}) != 0;
      vec2 a = vec2(P, monte ? bas : haut);
      vec2 b = vec2(1.0 - P, monte ? haut : bas);
      vec2 p = vec2(fu, fv);
      vec2 d = b - a;
      float t = clamp(dot(p - a, d) / dot(d, d), 0.0, 1.0);
      bois_ = max(bois_, bandeDuMotif(length(p - (a + t * d)), ${COLOMBAGE.decharge.toFixed(4)}, max(du, dv)));
    }
    c = mix(c, bois, bois_ * loin);
  } else if (genre == ${MOTIF.bardage}) {
    float q = fract(pos.y / ${COLOMBAGE.planche.toFixed(4)});
    float joint = bandeDuMotif(min(q, 1.0 - q) * ${COLOMBAGE.planche.toFixed(4)}, ${COLOMBAGE.joint.toFixed(4)}, dv);
    c *= 1.0 - 0.18 * joint * loin;
  }
  if ((m & ${MOTIF.soubassement}) != 0) c = mix(c, socle, 1.0 - smoothstep(S - 0.5 * dv, S + 0.5 * dv, fv));
  if ((m & ${MOTIF.chaperon}) != 0) {
    c *= 1.0 - 0.25 * bandeDuMotif(abs(fv - (1.0 - C - 0.012)), 0.012, dv) * loin;
    c = mix(c, chap, smoothstep(1.0 - C - 0.5 * dv, 1.0 - C + 0.5 * dv, fv));
  }
  return c;
}
`;
