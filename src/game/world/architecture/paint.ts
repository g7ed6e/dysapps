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
// - la pierre garde la teinte de sa matière (retouches du directeur artistique, 8 octobre 2026, « familles du 6e ») :
//   un mur plein n'a de soubassement qu'à partir de trois rangées (`RANGEES_DU_SOUBASSEMENT`), une seule fois, au pied,
//   et son chaperon est une bande mince dans une teinte plus sombre de sa matière (`CHAPERON_DE_LA_PIERRE`), son dessus
//   aussi : la teinte de la matière couvre au moins 85 % de la hauteur visible d'un mur, même d'une rangée ; un mur
//   bardé suit la même règle du soubassement ;
// - bardage aux pignons (sur les bâtiments de bois du quai, la règle attend qu'on en pose : option (c) du directeur
//   artistique, 30/09, voir kits/6e.ts) ; la nuit, rien ne s'allume : la lumière de la scène assombrit tout.
// Le métal et le velours (intention du directeur artistique, 9 octobre 2026) : la tôle, des joints verticaux mats tous
// les quarts de case (`SHEET_METAL`, le rôle `joint`), le soubassement à partir de trois rangées et un chaperon mince ; la
// tenture, des plis d'un quart de case dans la teinte du velours et un galon d'or en haut (`DRAPE`, le rôle `galon`).
// De loin, les joints et les plis s'effacent : le mur est uni.
// Code pur, sans Three.js : le GLSL est une chaîne, que three/construction.ts insère dans le shader des blocs.
import type { Voisinage } from './neighborhood';

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
  /** Une porte : son vantail (la couleur de sa matière) dans un encadrement de pierre (la finition). */
  vantail: 1 << 10,
  /** Un cadran : un disque clair à douze points, sans aiguilles (décision du directeur artistique, 8 octobre 2026). */
  cadran: 1 << 11,
  /**
   * Un rectangle de plusieurs rangées (la fusion de world/construction.ts réunit les rangées d'un mur) : les bandes du
   * pied ne se peignent que sur sa rangée du pied, celles de la tête que sur sa rangée de la tête (`RANGEES`).
   */
  rangees: 1 << 12,
  /**
   * Des lignes verticales au lieu des bandes horizontales : sur le bardage, la tôle (des joints tous les quarts de case,
   * le métal) ; sur un mur plein, la tenture (des plis d'un quart de case, le velours), dont le chaperon est un galon.
   * Les deux bits du genre étant pris, c'est un bit à part (lot du métal et du précieux, 9 octobre 2026).
   */
  vertical: 1 << 13,
} as const;

/**
 * Les rangées d'un rectangle de plusieurs rangées (`MOTIF.rangees`) : la hauteur (z de la grille, modulo 16) de sa
 * rangée du pied, sur quatre bits à partir du bit `pied`, et celle de sa rangée de la tête, à partir du bit `tete`. Un
 * rectangle a donc au plus 16 rangées.
 */
export const RANGEES = { pied: 14, tete: 18, masque: 15, max: 16 } as const;

/** Le premier bit au-dessus de tous ceux d'un mur peint : les blocs assemblés commencent au-delà (construction/shader.ts). */
export const MOTIF_FIN = 1 << (RANGEES.tete + 4);

/** Les bandes qui ne se peignent qu'au pied d'un mur, et celles qui ne se peignent qu'à sa tête. */
const BITS_DU_PIED = MOTIF.soubassement | MOTIF.sabliereBasse | MOTIF.montante | MOTIF.descendante;
const BITS_DE_LA_TETE = MOTIF.chaperon | MOTIF.sabliereHaute;

/**
 * Deux rangées d'un mur peuvent-elles se réunir en un rectangle, la rangée `dessus` posée sur `dessous` ? Le même motif,
 * aux bandes près : rien du pied sur celle du dessus, rien de la tête sur celle du dessous. Peindre ne coûte ainsi aucun
 * triangle : un mur de trois rangées reste un rectangle par face, son soubassement et son chaperon compris.
 */
export function rangeesReunies(dessous: number, dessus: number): boolean {
  if (dessous === dessus) return !(dessous & (BITS_DU_PIED | BITS_DE_LA_TETE));
  const corps = ~(BITS_DU_PIED | BITS_DE_LA_TETE);
  return (dessous & corps) === (dessus & corps) && !(dessus & BITS_DU_PIED) && !(dessous & BITS_DE_LA_TETE);
}

/** Le motif que le shader lit sur la rangée `z` d'un rectangle (`MOTIF_GLSL` : le même calcul, pour les tests). */
export function motifDeLaRangee(m: number, z: number): number {
  if (!(m & MOTIF.rangees)) return m;
  const r = z & RANGEES.masque;
  let out = m;
  if (r !== ((m >> RANGEES.pied) & RANGEES.masque)) out &= ~BITS_DU_PIED;
  if (r !== ((m >> RANGEES.tete) & RANGEES.masque)) out &= ~BITS_DE_LA_TETE;
  return out;
}

/**
 * Le motif d'un rectangle de rangées réunies, de la rangée `zBas` (motif `bas`) à la rangée `zHaut` (motif `haut`) : les
 * bandes du pied de la première, celles de la tête de la dernière, et leurs hauteurs (`RANGEES`). Une seule rangée, ou
 * aucune bande : le motif tel quel.
 */
export function motifDesRangees(bas: number, haut: number, zBas: number, zHaut: number): number {
  // Un bloc assemblé (au-delà de `MOTIF_FIN`) n'a pas de bandes : ses bits bas ne sont pas ceux d'un mur.
  if (zHaut === zBas || bas >= MOTIF_FIN) return bas;
  const bandes = (bas & BITS_DU_PIED) | (haut & BITS_DE_LA_TETE);
  if (!bandes) return bas;
  const m = RANGEES.masque;
  return (bas & ~(BITS_DU_PIED | BITS_DE_LA_TETE)) | bandes | MOTIF.rangees | ((zBas & m) << RANGEES.pied) | ((zHaut & m) << RANGEES.tete);
}

/** Les mesures du colombage, en part de case. */
export const COLOMBAGE = {
  /** La demi-largeur d'un poteau : 1/16 de case de chaque côté d'un bord (1/8 entre deux cases). */
  poteau: 1 / 16,
  /** La hauteur du soubassement de pierre (0,3 à 0,4 case, décision du directeur artistique). */
  soubassement: 0.35,
  /** La hauteur du chaperon d'un mur plein : une bande mince, dans une teinte plus sombre de la matière. */
  chaperonPlein: 0.08,
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
  /** La largeur de l'encadrement d'une porte, sur ses deux côtés et en haut. */
  encadrement: 0.12,
} as const;

/**
 * La tôle (le métal, `aimant`) : des plaques à joints verticaux peints, tous les quarts de case, mats, sans rivet ni
 * reflet (intention du directeur artistique, 9 octobre 2026) ; de loin, le mur devient uni. `joint` : la demi-largeur
 * d'un joint, en part de case ; `pas` : l'écart entre deux joints.
 */
export const SHEET_METAL = { pas: 0.25, joint: 0.02 } as const;

/**
 * La tenture (le velours du fond de la salle des trophées) : des plis verticaux, une bande claire puis une sombre d'un
 * quart de case chacune, dans la teinte de la matière (`clair`, `sombre` : ses parts, en couleur linéaire), et un galon
 * d'or peint en haut (`galon`, en part de case ; le rôle `galon` du kit).
 */
export const DRAPE = { pli: 0.25, clair: 1.14, sombre: 0.8, galon: 0.08 } as const;

/**
 * Les dessins peints du cœur, des liaisons et des lieux (intention du directeur artistique, 9 octobre 2026), faits des
 * bits de `MOTIF` (aucun bit de plus : les combinaisons ne servaient pas) :
 * - `planksAlongX`, `planksAlongY` : sur le dessus d'un tablier, des joints dans le brun des poteaux, tous les quarts de
 *   case, en travers de la marche (le long de x : des lignes à x constant) ; de loin, effacés (`loinFin`) ;
 * - `straw` : sur les flancs du champ de blé, les stries de la tôle, dans un ton plus sombre de la matière (la paille) ;
 * - `glazing` : la verrière, des petits bois dans le brun des poteaux au bord et au milieu de chaque case ;
 * - `gallery` : l'entrée d'une galerie, un encadrement de bois (le brun des pilotis) au bord du volume seulement, côté u
 *   bas (`MOTIF.montante`), côté u haut (`MOTIF.descendante`) et en haut (`MOTIF.chaperon`) ;
 * - `waterRim` : sur le dessus d'une nappe d'eau, le liseré clair au bord de la nappe seulement, côté −x
 *   (`MOTIF.montante`), +x (`MOTIF.descendante`), −y de la grille (`MOTIF.chaperon`), +y (`MOTIF.sabliereHaute`).
 */
export const HEART_MOTIFS = {
  planksAlongX: MOTIF.bardage | MOTIF.vertical | MOTIF.montante,
  planksAlongY: MOTIF.bardage | MOTIF.vertical | MOTIF.descendante,
  straw: MOTIF.bardage | MOTIF.vertical | MOTIF.descendante,
  glazing: MOTIF.colombage | MOTIF.vertical,
  gallery: MOTIF.vantail | MOTIF.vertical,
  waterRim: MOTIF.plein | MOTIF.vertical,
} as const;

/** Les mesures des dessins peints du cœur : le pas et le joint du plancher, les petits bois, le ton des stries, le liseré de l'eau. */
export const HEART_PAINT = { pas: 0.25, joint: 0.02, petitBois: 0.035, paille: 0.72, lisere: 0.06 } as const;

/**
 * Un mur plein n'a de soubassement qu'à partir de tant de rangées (décision du directeur artistique, 8 octobre 2026) :
 * plus bas, la bande de pierre prenait la moitié du mur, et la teinte de la matière se perdait.
 */
export const RANGEES_DU_SOUBASSEMENT = 3;

/** Le chaperon d'un mur plein et son dessus : la teinte de sa matière, à cette part (en couleur linéaire). */
export const CHAPERON_DE_LA_PIERRE = 0.62;

/** Les mesures du cadran, en part de case, depuis le milieu de la face. */
export const CADRAN = {
  /** Le rayon du disque. */
  disque: 0.36,
  /**
   * Le disque : la teinte du cadran, éclaircie de cette part vers le blanc (en couleur linéaire), loin du crème Brume
   * d'un fantôme (`#E5EBE3`). De loin, le disque s'efface avec ses points.
   */
  eclat: 0.3,
  /** Les points : la teinte du disque, à cette part. */
  sombre: 0.45,
  /** Le rayon du cercle des douze points, et celui d'un point. */
  points: 0.27,
  point: 0.035,
} as const;

/** Les douze points du cadran, sur la face (u, v de 0 à 1) : un toutes les heures, sans aiguilles. */
export function pointsDuCadran(): [number, number][] {
  return Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6;
    return [0.5 + CADRAN.points * Math.cos(a), 0.5 + CADRAN.points * Math.sin(a)];
  });
}

/** Les rôles peints par le shader, dans l'ordre de l'uniforme `uRoles` (puis les mêmes, délavés). */
export const ROLES_PEINTS = ['poteau', 'soubassement', 'chaperon', 'joint', 'galon', 'pilotis', 'lisere'] as const;

/** L'indice d'un rôle peint dans `uRoles`, délavé ou non. */
const roleIndex = (r: (typeof ROLES_PEINTS)[number], delave: boolean) => ROLES_PEINTS.indexOf(r) + (delave ? ROLES_PEINTS.length : 0);

/**
 * La couleur de fond d'un mur peint : la couleur de ses faces, avant le motif ; un rôle du kit, ou sa matière. L'or mat
 * (`galon`) et la braise (`braise`) : le bloc d'or d'un Gardien, le sommet du cône des Décimaux.
 */
export type Fond = 'remplissage' | 'bardage' | 'matiere' | 'soubassement' | 'tole' | 'galon' | 'braise';

/** Un mur peint : son fond et le motif de chacune de ses faces (ordre des bits de `FACES` : +x, +y, −x, −y, haut, bas). */
export interface PeintureDuMur {
  fond: Fond;
  motifs: readonly number[];
}

/**
 * Comment peindre un mur d'une famille : un colombage (le bois), un mur plein (la pierre), un bardage (des clins dans la
 * teinte de sa matière), un vantail (la porte, dans son encadrement), la tôle (le métal), la tenture (le velours).
 */
export type ManiereDuMur = 'colombage' | 'plein' | 'bardage' | 'vantail' | 'tole' | 'tenture';

export interface ContexteDuMur {
  /** Le bâtiment est bardé (les bâtiments du quai), au lieu du colombage. */
  barde?: boolean;
  /** Un pilier isolé (la salle des trophées) : poteaux et sablières seulement, aucune décharge. */
  sansDecharge?: boolean;
  /** La face du côté `cote` (0 à 3, ordre de `SIDES`) regarde-t-elle le dehors du bâtiment ? (Les décharges y vont seules.) */
  exterieur?: (cote: number) => boolean;
  /**
   * Le nombre de rangées du mur à la colonne du bloc (les murs empilés d'un seul tenant, du pied à la tête) : un mur
   * plein ou bardé n'a de soubassement qu'à partir de `RANGEES_DU_SOUBASSEMENT`. Sans lui, le soubassement est posé.
   */
  rangees?: number;
  /**
   * Le mur fait partie d'un volume lissé (./volumes.ts) : ni chaperon ni dessus de pierre, un seul dessus dans sa
   * matière ; `rangees` compte alors les cases du volume empilées à la colonne du bloc.
   */
  lisse?: boolean;
}

/** Les quatre côtés : +x, +y, −x, −y (comme `SIDES`). */
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
 * Le cadran se peint-il sur ce mur ? Un bloc de cadran en tête de son mur (rien de sa classe au-dessus), seul, au bout
 * ou au milieu d'une rangée (pas dans un angle : le haut de la tour de l'Horloge ne montre qu'un cadran par face), sur
 * ses faces sans voisine.
 */
function cadranSur(v: Voisinage): boolean {
  const c = v.cotes & 0b1111;
  const enLigne = c === 0 || c === 0b0001 || c === 0b0010 || c === 0b0100 || c === 0b1000 || c === 0b0101 || c === 0b1010;
  return v.texture === 'cadran' && v.dessus !== 'mur' && enLigne;
}

/**
 * La peinture d'un mur, d'après son voisinage dans le plan (en orientation du monde) :
 * - un vantail (la porte) : sa matière dans un encadrement de pierre, sur ses quatre côtés ;
 * - un bardage : des clins dans la teinte de sa matière, un chaperon de pierre s'il n'a rien au-dessus ;
 * - un mur plein (la pierre) : sa matière, un soubassement de pierre au pied, un chaperon s'il n'a rien au-dessus ; un
 *   cadran en tête de son mur porte son disque à douze points (`cadranSur`) ;
 * - un mur de bois posé sur un toit (une cheminée) : de la pierre, maçonnée ;
 * - un pignon (un mur de bois sous un toit, entre deux toits) ou un bâtiment du quai : bardé ;
 * - sinon, le colombage : soubassement et sablière basse au pied, sablière haute sous un toit, chaperon sans rien
 *   au-dessus, décharge au rez, sur une face du dehors quand un seul de ses deux voisins le long de la face manque (le
 *   bout ou l'angle d'une façade : jamais sur un mur droit), et jamais sous un chaperon (le panneau y est trop court).
 * Un chaperon ne se pose que sur un mur qui ne monte plus (rien de sa classe un cran plus haut à côté : les gradins
 * d'un dôme n'en ont pas), et jamais sur un volume lissé (`lisse`).
 */
export function peintureDuMur(v: Voisinage, maniere: ManiereDuMur, contexte: ContexteDuMur = {}): PeintureDuMur {
  const pied = v.dessous === 'rien';
  // Le soubassement d'un mur plein ou bardé : au pied d'un mur d'au moins trois rangées.
  const socle = pied && (contexte.rangees ?? RANGEES_DU_SOUBASSEMENT) >= RANGEES_DU_SOUBASSEMENT ? MOTIF.soubassement : 0;
  // Un volume lissé n'a qu'un dessus, dans sa matière : aucun chaperon, ni bande ni dessus gris, case par case.
  const chaperon = !contexte.lisse && v.dessus === 'rien' && v.monte === 0;
  const haut = chaperon ? MOTIF.pierreEntiere : 0;
  const bandes = chaperon ? MOTIF.chaperon : 0;
  const partout = (cotes: number, fond: Fond): PeintureDuMur => ({ fond, motifs: [cotes, cotes, cotes, cotes, haut, 0] });
  if (maniere === 'vantail') return { fond: 'matiere', motifs: [MOTIF.vantail, MOTIF.vantail, MOTIF.vantail, MOTIF.vantail, 0, 0] };
  if (maniere === 'bardage') return partout(MOTIF.bardage | bandes, 'matiere');
  // La tôle : ses joints, le soubassement à partir de trois rangées, un chaperon mince sans toit (comme un mur plein), et
  // un dessus dans sa teinte (le kit : `tole`), sans dessus gris ; aux pignons aussi.
  if (maniere === 'tole') {
    const b = MOTIF.bardage | MOTIF.vertical | socle | bandes;
    return { fond: 'tole', motifs: [b, b, b, b, 0, 0] };
  }
  // La tenture : ses plis, et le galon en haut du mur (sous le toit, ou sans rien dessus) ; ni soubassement ni chaperon.
  if (maniere === 'tenture') {
    const b = MOTIF.plein | MOTIF.vertical | (v.dessus !== 'mur' ? MOTIF.chaperon : 0);
    return { fond: 'matiere', motifs: [b, b, b, b, 0, 0] };
  }
  if (maniere === 'plein') {
    const base = MOTIF.plein | socle | bandes;
    const disque = cadranSur(v);
    const motifs = [0, 1, 2, 3].map((cote) => (disque && !(v.cotes & (1 << cote)) ? base | MOTIF.cadran : base));
    // Le dessus du chaperon : la teinte sombre de la matière (le genre `plein` le dit au shader).
    return { fond: 'matiere', motifs: [...motifs, haut ? MOTIF.plein | haut : 0, 0] };
  }
  if (v.dessous === 'toit') return partout(MOTIF.plein | bandes, 'soubassement');
  if (v.dessus === 'toit' && v.toits !== 0) return partout(MOTIF.bardage, 'bardage');
  if (contexte.barde) return partout(MOTIF.bardage | socle | bandes, 'bardage');
  const base = MOTIF.colombage | (pied ? MOTIF.soubassement | MOTIF.sabliereBasse : 0) | (v.dessus === 'toit' ? MOTIF.sabliereHaute : 0) | bandes;
  const motifs = [0, 1, 2, 3].map((cote) => {
    // Sous un chaperon (un mur sans toit : un muret, un monument), le panneau est trop court : la tête d'une décharge
    // viendrait trop près du pied de sa voisine, autour d'un angle ou d'un mur de deux cases.
    if (!pied || chaperon || contexte.sansDecharge || v.cotes & (1 << cote) || !contexte.exterieur?.(cote)) return base;
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
 * 16 pixels, les traits fins (poteaux, sablières, décharges, clins) s'effacent ; sous 8 pixels, le mur est uni. Les
 * motifs au quart de case (joints de la tôle, plis de la tenture) s'effacent dès 32 pixels par case, et ont disparu à 16.
 */
export const MOTIF_GLSL = `
uniform vec3 uRoles[${ROLES_PEINTS.length * 2}];
float bandeDuMotif(float d, float w, float f) {
  return 1.0 - smoothstep(w - 0.5 * f, w + 0.5 * f, d);
}
vec3 peindreLeMotif(vec3 c, float motif, vec3 pos, vec3 n) {
  // Les dérivées (fwidth) avant tout retour conditionnel : hors d'un flot uniforme, elles ne sont pas définies.
  vec3 an = abs(n);
  float u = an.x > 0.5 ? pos.z : pos.x;
  float du = max(fwidth(u), 1e-5);
  float dv = max(fwidth(pos.y), 1e-5);
  float dz = max(fwidth(pos.z), 1e-5);
  int m = int(motif + 0.5);
  if (m <= 0) return c;
  bool delave = (m & ${MOTIF.delave}) != 0;
  vec3 bois = delave ? uRoles[${roleIndex('poteau', true)}] : uRoles[${roleIndex('poteau', false)}];
  vec3 socle = delave ? uRoles[${roleIndex('soubassement', true)}] : uRoles[${roleIndex('soubassement', false)}];
  vec3 chap = delave ? uRoles[${roleIndex('chaperon', true)}] : uRoles[${roleIndex('chaperon', false)}];
  vec3 joint = delave ? uRoles[${roleIndex('joint', true)}] : uRoles[${roleIndex('joint', false)}];
  vec3 galon = delave ? uRoles[${roleIndex('galon', true)}] : uRoles[${roleIndex('galon', false)}];
  vec3 cadreDeBois = delave ? uRoles[${roleIndex('pilotis', true)}] : uRoles[${roleIndex('pilotis', false)}];
  vec3 lisere = delave ? uRoles[${roleIndex('lisere', true)}] : uRoles[${roleIndex('lisere', false)}];
  int genre = m & 3;
  bool vertical = (m & ${MOTIF.vertical}) != 0;
  if (an.y > 0.5) {
    if (genre == ${MOTIF.bardage} && vertical) {
      // Le plancher d'un tablier : un joint brun tous les quarts de case, en travers de la marche ; de loin, uni.
      bool leLongDeX = (m & ${MOTIF.montante}) != 0;
      float w = leLongDeX ? pos.x : pos.z;
      float dw = leLongDeX ? du : dz;
      float loinDuPlancher = clamp((${HEART_PAINT.pas.toFixed(4)} / dw - 4.0) / 4.0, 0.0, 1.0);
      float q = fract(w / ${HEART_PAINT.pas.toFixed(4)});
      float j = bandeDuMotif(min(q, 1.0 - q) * ${HEART_PAINT.pas.toFixed(4)}, ${HEART_PAINT.joint.toFixed(4)}, dw);
      return mix(c, bois, j * loinDuPlancher);
    }
    if (genre == ${MOTIF.plein} && vertical) {
      // Le liseré d'une nappe d'eau, au bord de la nappe seulement (une bande nette, sans fondu de loin).
      const float L = ${HEART_PAINT.lisere.toFixed(4)};
      vec2 f = fract(pos.xz);
      float bord = 0.0;
      if ((m & ${MOTIF.montante}) != 0) bord = max(bord, 1.0 - smoothstep(L - 0.5 * du, L + 0.5 * du, f.x));
      if ((m & ${MOTIF.descendante}) != 0) bord = max(bord, smoothstep(1.0 - L - 0.5 * du, 1.0 - L + 0.5 * du, f.x));
      if ((m & ${MOTIF.chaperon}) != 0) bord = max(bord, 1.0 - smoothstep(L - 0.5 * dz, L + 0.5 * dz, f.y));
      if ((m & ${MOTIF.sabliereHaute}) != 0) bord = max(bord, smoothstep(1.0 - L - 0.5 * dz, 1.0 - L + 0.5 * dz, f.y));
      return mix(c, lisere, bord);
    }
    if ((m & ${MOTIF.cadran}) != 0) {
      // Le cadran sur le dessus d'une dalle (le rouage) : le même disque à douze points, sans aiguilles.
      vec2 p = fract(pos.xz) - 0.5;
      float w = max(du, dz);
      float loinDuDisque = clamp((1.0 / w - 8.0) / 8.0, 0.0, 1.0);
      float disque = bandeDuMotif(length(p), ${CADRAN.disque.toFixed(4)}, w);
      float k = floor(atan(p.y, p.x) / 0.5235988 + 0.5) * 0.5235988;
      float point = bandeDuMotif(length(p - ${CADRAN.points.toFixed(4)} * vec2(cos(k), sin(k))), ${CADRAN.point.toFixed(4)}, w);
      c = mix(c, mix(c, vec3(1.0), ${CADRAN.eclat.toFixed(4)}), disque * loinDuDisque);
      return mix(c, c * ${CADRAN.sombre.toFixed(4)}, point * loinDuDisque);
    }
    // Le dessus d'un chaperon : de pierre, ou, sur un mur plein, la teinte sombre de sa matière.
    return (m & ${MOTIF.pierreEntiere}) != 0 ? (genre == ${MOTIF.plein} ? c * ${CHAPERON_DE_LA_PIERRE.toFixed(4)} : chap) : c;
  }
  float fu = fract(u);
  float fv = fract(pos.y);
  // Un rectangle de plusieurs rangées : les bandes du pied sur sa rangée du pied, celles de la tête sur sa rangée de la tête.
  if ((m & ${MOTIF.rangees}) != 0) {
    int r = int(floor(pos.y)) & ${RANGEES.masque};
    if (r != ((m >> ${RANGEES.pied}) & ${RANGEES.masque})) m &= ~${BITS_DU_PIED};
    if (r != ((m >> ${RANGEES.tete}) & ${RANGEES.masque})) m &= ~${BITS_DE_LA_TETE};
  }
  float loin = clamp((1.0 / max(du, dv) - 8.0) / 8.0, 0.0, 1.0);
  // Les motifs au quart de case (les joints de la tôle, les plis de la tenture) s'effacent deux fois plus tôt : rien sous
  // 4 pixels par motif (16 par case), entiers dès 8 (32 par case), pour ne jamais moirer en recul ni en mouvement.
  float loinFin = clamp((${SHEET_METAL.pas.toFixed(4)} / max(du, dv) - 4.0) / 4.0, 0.0, 1.0);
  if ((m & ${MOTIF.vantail}) != 0) {
    const float E = ${COLOMBAGE.encadrement.toFixed(4)};
    if (vertical) {
      // L'entrée d'une galerie : un encadrement de bois au bord du volume seulement (ses côtés et son haut), de loin effacé.
      float bord = 0.0;
      if ((m & ${MOTIF.montante}) != 0) bord = max(bord, 1.0 - smoothstep(E - 0.5 * du, E + 0.5 * du, fu));
      if ((m & ${MOTIF.descendante}) != 0) bord = max(bord, smoothstep(1.0 - E - 0.5 * du, 1.0 - E + 0.5 * du, fu));
      if ((m & ${MOTIF.chaperon}) != 0) bord = max(bord, smoothstep(1.0 - E - 0.5 * dv, 1.0 - E + 0.5 * dv, fv));
      return mix(c, cadreDeBois, bord * loin);
    }
    // La porte : son vantail dans un encadrement de pierre (ses deux côtés et le haut), qui s'efface de loin.
    float cadre = max(bandeDuMotif(min(fu, 1.0 - fu), E, du), smoothstep(1.0 - E - 0.5 * dv, 1.0 - E + 0.5 * dv, fv));
    return mix(c, chap, cadre * loin);
  }
  if ((m & ${MOTIF.cadran}) != 0) {
    // Le cadran : un disque un peu plus clair que sa teinte, douze points sombres, sans aiguilles ; de loin, le disque
    // s'efface avec ses points (jamais un disque clair sans ses points, qui se lirait comme un fantôme).
    vec2 p = vec2(fu, fv) - 0.5;
    float w = max(du, dv);
    float disque = bandeDuMotif(length(p), ${CADRAN.disque.toFixed(4)}, w);
    float k = floor(atan(p.y, p.x) / 0.5235988 + 0.5) * 0.5235988;
    float point = bandeDuMotif(length(p - ${CADRAN.points.toFixed(4)} * vec2(cos(k), sin(k))), ${CADRAN.point.toFixed(4)}, w);
    c = mix(c, mix(c, vec3(1.0), ${CADRAN.eclat.toFixed(4)}), disque * loin);
    c = mix(c, c * ${CADRAN.sombre.toFixed(4)}, point * loin);
  }
  const float S = ${COLOMBAGE.soubassement.toFixed(4)};
  const float B = ${COLOMBAGE.sabliere.toFixed(4)};
  const float C = ${COLOMBAGE.chaperon.toFixed(4)};
  const float P = ${COLOMBAGE.poteau.toFixed(4)};
  if (genre == ${MOTIF.colombage} && vertical) {
    // La verrière : des petits bois au bord et au milieu de chaque case, dans les deux sens ; de loin, la vitre unie.
    const float PB = ${HEART_PAINT.petitBois.toFixed(4)};
    float e = min(min(fu, 1.0 - fu), abs(fu - 0.5));
    float f = min(min(fv, 1.0 - fv), abs(fv - 0.5));
    c = mix(c, bois, max(bandeDuMotif(e, PB, du), bandeDuMotif(f, PB, dv)) * loin);
  } else if (genre == ${MOTIF.colombage}) {
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
  } else if (genre == ${MOTIF.bardage} && vertical) {
    // La tôle : un joint mat tous les quarts de case, le long de la face ; de loin, le mur uni.
    float q = fract(u / ${SHEET_METAL.pas.toFixed(4)});
    float j = bandeDuMotif(min(q, 1.0 - q) * ${SHEET_METAL.pas.toFixed(4)}, ${SHEET_METAL.joint.toFixed(4)}, du);
    // Les stries du blé (le bit de la décharge descendante) : le même joint, dans un ton plus sombre de la paille.
    c = mix(c, (m & ${MOTIF.descendante}) != 0 ? c * ${HEART_PAINT.paille.toFixed(4)} : joint, j * loinFin);
  } else if (genre == ${MOTIF.plein} && vertical) {
    // La tenture : des plis, une bande claire puis une sombre d'un quart de case, en douceur (un cosinus, sans arête).
    float pli = 0.5 + 0.5 * cos(3.14159265 * u / ${DRAPE.pli.toFixed(4)});
    c *= mix(1.0, mix(${DRAPE.sombre.toFixed(4)}, ${DRAPE.clair.toFixed(4)}, pli), loinFin);
  } else if (genre == ${MOTIF.bardage}) {
    float q = fract(pos.y / ${COLOMBAGE.planche.toFixed(4)});
    float joint = bandeDuMotif(min(q, 1.0 - q) * ${COLOMBAGE.planche.toFixed(4)}, ${COLOMBAGE.joint.toFixed(4)}, dv);
    c *= 1.0 - 0.18 * joint * loin;
  }
  if ((m & ${MOTIF.soubassement}) != 0) c = mix(c, socle, 1.0 - smoothstep(S - 0.5 * dv, S + 0.5 * dv, fv));
  if ((m & ${MOTIF.chaperon}) != 0 && genre == ${MOTIF.plein} && vertical) {
    // Le galon d'or de la tenture, en haut du mur.
    const float G = ${DRAPE.galon.toFixed(4)};
    c = mix(c, galon, smoothstep(1.0 - G - 0.5 * dv, 1.0 - G + 0.5 * dv, fv));
  } else if ((m & ${MOTIF.chaperon}) != 0 && (genre == ${MOTIF.plein} || vertical)) {
    // Le chaperon d'un mur plein ou de tôle : une bande mince, la teinte de sa matière plus sombre, sans trait d'ombre.
    const float CP = ${COLOMBAGE.chaperonPlein.toFixed(4)};
    c = mix(c, c * ${CHAPERON_DE_LA_PIERRE.toFixed(4)}, smoothstep(1.0 - CP - 0.5 * dv, 1.0 - CP + 0.5 * dv, fv));
  } else if ((m & ${MOTIF.chaperon}) != 0) {
    c *= 1.0 - 0.25 * bandeDuMotif(abs(fv - (1.0 - C - 0.012)), 0.012, dv) * loin;
    c = mix(c, chap, smoothstep(1.0 - C - 0.5 * dv, 1.0 - C + 0.5 * dv, fv));
  }
  return c;
}
`;
