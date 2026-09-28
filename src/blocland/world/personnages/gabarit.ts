// Le gabarit des créatures d'Archipéo en facettes (lot R6) : des habitants debout, artisans de leur île, en trois
// gabarits (trapu : 2,3 blocs et 1,2 fois plus large ; standard : 2,6 blocs, 1,3 fois le bonhomme ; élancé : 2,9 blocs
// et 0,85 fois la largeur), la tête au cinquième, deux petits yeux sombres sans blanc ni sourire, trois couleurs (une
// dominante désaturée et sa marque, une tenue de lin ou de cuir, un outil de bois, de fer ou de laiton). Chaque espèce
// (./especes/) dit ce qui la fait reconnaître : sa silhouette, une signature qui dépasse du tronc (carapace, élytres,
// queue, cornes, oreilles), et l'outil de son métier dans la main droite (côté +X : le personnage regarde vers −Z).
// Une espèce se dessine dans le gabarit standard ; le trapu et l'élancé en sont une mise à l'échelle (la hauteur d'un
// côté, la largeur et la profondeur de l'autre), les yeux gardant leur taille.
//
// Six pièces : le corps (jambes, torse, tenue, bras gauche, queue), la tête, la coiffe, les yeux, le bras porteur et
// l'outil ; ce que tient la main gauche en fait une septième (`autre-main`, qui suit le corps), et une autre brille la
// nuit chez trois espèces (Fi, Astra, Braise). Budget : 250 triangles par créature en moyenne aux Premiers Rivages (dix
// îles pour 2 500), davantage ailleurs (six îles).
import type { Couleur } from '../palette';
import { LUEUR, OEIL, OUTIL, TENUE } from './couleurs';
import {
  anneauA,
  devant,
  facette,
  fuseau,
  parFace,
  peindrePersonnage,
  pose,
  repere,
  yeux,
  type Anneau,
  type FacettesDePersonnage,
  type Peindre,
  type Piece,
  type Pot,
  type Trace,
  type V3,
} from './peint';

/** La taille du gabarit standard (1,3 fois le bonhomme), où s'écrivent toutes les espèces, et sa tête, au cinquième. */
export const TAILLE_DE_CREATURE = 2.6;
export const COU = TAILLE_DE_CREATURE * (4 / 5) - 0.1;
export const SOMMET_DE_TETE = TAILLE_DE_CREATURE - 0.1;

/**
 * Les trois gabarits (DA, 28/09) : leur taille en blocs et leur largeur (et profondeur) relative au standard.
 * Trapus : Tunel, Braise, Pudding, Grimoire, Kroa, Bazar ; élancés : Théo, Frimas, Nénu, Cléa, Fi, Stat.
 */
export type Gabarit = 'trapu' | 'standard' | 'elance';
export const GABARITS: Record<Gabarit, { taille: number; largeur: number }> = {
  trapu: { taille: 2.3, largeur: 1.2 },
  standard: { taille: TAILLE_DE_CREATURE, largeur: 1 },
  elance: { taille: 2.9, largeur: 0.85 },
};

/** La taille d'une créature, selon son gabarit. */
export const tailleDe = (e: Pick<Espece, 'gabarit'>): number => GABARITS[e.gabarit ?? 'standard'].taille;

/**
 * Où se porte la marque de la dominante (un ventre clair, une tête sombre…). Le visage ne prend que le bas de la face
 * (le masque clair tient sous 35 % de la face, et ne fait jamais un visage humain) ; le plastron, tout le devant du torse.
 */
export type Marque = 'ventre' | 'poitrine' | 'plastron' | 'dos' | 'visage' | 'tete' | 'museau';

/** Ce que porte une créature : les tenues peignent le torse ou l'habillent de quelques facettes. */
export type Vetement = 'tablier' | 'robe' | 'cire' | 'gilet' | 'ceinture' | 'echarpe' | 'cape' | 'elytres' | 'ailes';

export interface Silhouette {
  /** Les demi-largeurs du torse (X) et sa demi-profondeur (Z), l'avancée du ventre. */
  largeur: number;
  profondeur: number;
  ventre: number;
  /** Le haut des jambes et leur rayon. */
  jambes: number;
  jambe: number;
  /** Les demi-largeur et demi-profondeur de la tête, et la largeur du haut du crâne (1 : une tête plate). */
  tete: number;
  teteProfondeur: number;
  crane: number;
  /** La longueur des bras. */
  bras: number;
}

const SILHOUETTE: Silhouette = { largeur: 0.31, profondeur: 0.25, ventre: 0.02, jambes: 0.7, jambe: 0.1, tete: 0.28, teteProfondeur: 0.25, crane: 0.8, bras: 0.62 };

/** Ce qu'une espèce reçoit pour se dessiner : ses couleurs (prises à la demande) et ses mesures. */
export class Kit {
  constructor(
    readonly pot: Pot,
    private readonly espece: Espece,
    readonly s: Silhouette,
  ) {}
  get dom(): Peindre {
    return this.pot(this.espece.dominante, 'dominante');
  }
  get marque(): Peindre {
    return this.pot(this.espece.marque?.couleur ?? this.espece.dominante, 'dominante');
  }
  get tenue(): Peindre {
    return this.pot(this.espece.tenue.couleur, 'tenue');
  }
  get bois(): Peindre {
    return this.pot(OUTIL.bois, 'outil');
  }
  get fer(): Peindre {
    return this.pot(OUTIL.fer, 'outil');
  }
  get laiton(): Peindre {
    return this.pot(OUTIL.laiton, 'outil');
  }
  get lin(): Peindre {
    return this.pot(TENUE.lin, 'outil');
  }
  get cuir(): Peindre {
    return this.pot(TENUE.cuir, 'outil');
  }
  get lueur(): Peindre {
    return this.pot(this.espece.lueur?.couleur ?? LUEUR, 'lueur');
  }
  outil(c: Couleur): Peindre {
    return this.pot(c, 'outil');
  }
  /** Le profil du torse et celui de la tête (pour poser ce qui s'y colle). */
  get torse(): Anneau[] {
    return torse(this.s);
  }
  get crane(): Anneau[] {
    return crane(this.s);
  }
}

/** Un dessin d'une espèce, dans le repère de la créature (ou dans celui d'une main). */
export type Dessin = (T: Trace, k: Kit) => void;

export interface Espece {
  nom: string;
  metier: string;
  /** Le gabarit (standard par défaut). */
  gabarit?: Gabarit;
  dominante: Couleur;
  marque?: { couleur: Couleur; ou: Marque[] };
  tenue: { couleur: Couleur; vetements: Vetement[] };
  silhouette?: Partial<Silhouette>;
  /** Un museau (vers −Z, sous les yeux), un bec (une pointe), ou rien. */
  museau?: { forme: 'museau' | 'bec'; long: number; r: number; y?: number };
  /** Les yeux : leur hauteur, écart et taille, ou leur plan (`z`) s'ils ne sont pas sur le devant de la tête. `false` : sans yeux. */
  yeux?: false | { y?: number; ecart?: number; taille?: number; z?: number };
  /** La pose des bras : de combien ils tournent vers l'avant (`rx`, positif) et vers le dehors (`rz`). */
  bras?: { rx?: number; rz?: number };
  autreBras?: { rx?: number; rz?: number };
  /** L'outil de métier, dans le repère de la main droite (+Y le long du manche) tourné de `pose`. */
  outil: { pose: [number, number, number]; dessiner: Dessin };
  /** Ce que tient la main gauche, dans son repère : une pièce à part (`autre-main`), qui suit le corps. */
  autreMain?: { pose: [number, number, number]; dessiner: Dessin };
  /** Oreilles, cornes, casque : au-dessus ou autour de la tête, jusqu'à 2,7 blocs. */
  coiffe?: Dessin;
  /** Queue, carapace, roseaux au dos… : avec le corps. */
  corps?: Dessin;
  /** Une autre tête que le gabarit (la tête-lanterne de Fi). */
  tete?: Dessin;
  /** Ce qui s'ajoute à la tête du gabarit (une lentille, une crête). */
  surTete?: Dessin;
  /**
   * La pièce qui brille la nuit, sur la tête ou sur le corps : peinte de `couleur` (la lueur par défaut), elle prend
   * `nuit` la nuit si elle est donnée (le verre de Fi, ambre mat le jour).
   */
  lueur?: { nom: string; sur: 'tete' | 'corps'; couleur?: Couleur; nuit?: Couleur; dessiner: Dessin };
}

// ---------- Le torse, la tête, les membres ----------

const N_TORSE = 8;
const N_TETE = 6;
const AVANT_DU_TORSE = [6, 7, 0];
const DOS_DU_TORSE = [2, 3, 4];
const VISAGE = 5;
const PLASTRON = [5, 6, 7, 0, 1];

function torse(s: Silhouette): Anneau[] {
  return [
    [s.jambes - 0.05, s.largeur * 0.8, s.profondeur * 0.8],
    [1.0, s.largeur, s.profondeur, -s.ventre],
    [1.5, s.largeur * 0.97, s.profondeur * 0.95],
    [1.8, s.largeur * 0.84, s.profondeur * 0.8],
    [COU, s.largeur * 0.42, s.profondeur * 0.45],
  ];
}

function crane(s: Silhouette): Anneau[] {
  return [
    [COU, s.tete * 0.75, s.teteProfondeur * 0.75],
    [2.24, s.tete, s.teteProfondeur],
    [SOMMET_DE_TETE, s.tete * s.crane, s.teteProfondeur * s.crane],
  ];
}

/** L'épaule droite (+X) ; la gauche est symétrique. */
function epaule(s: Silhouette): V3 {
  return [s.largeur * 0.95 * Math.cos(Math.PI / 8) + 0.06, 1.74, 0];
}

/** Le repère d'un bras : de l'épaule, tourné ; la main au bout, à `s.bras` sous l'épaule. */
function repereDuBras(s: Silhouette, cote: -1 | 1, rx: number, rz: number): (p: V3) => V3 {
  const e = epaule(s);
  return repere([cote * e[0], e[1], e[2]], rx, 0, cote * rz);
}

function bras(T: Trace, s: Silhouette, cote: -1 | 1, rx: number, rz: number, peau: Peindre, manche: Peindre): void {
  const R = pose(T, repereDuBras(s, cote, rx, rz));
  fuseau(
    R,
    [
      [-s.bras, 0.066],
      [0, 0.085],
    ],
    5,
    parFace((_k, j) => (j === -1 ? peau : manche)),
  );
}

/** Le repère de la main (`cote`), tourné de `rot` : là où se tient un outil. */
function repereDeLaMain(s: Silhouette, cote: -1 | 1, rx: number, rz: number, rot: [number, number, number]): (p: V3) => V3 {
  const main = repereDuBras(s, cote, rx, rz)([0, -s.bras + 0.04, 0]);
  return repere(main, rot[0], rot[1], rot[2]);
}

function corps(e: Espece, s: Silhouette, T: Trace, k: Kit): void {
  const v = new Set(e.tenue.vetements);
  const m = new Set(e.marque?.ou ?? []);
  const dom = k.dom;
  const marque = e.marque ? k.marque : dom;
  const tenue = k.tenue;
  // Les jambes : courtes, le pied allongé vers l'avant.
  for (const c of [-1, 1])
    fuseau(
      T,
      [
        [0, s.jambe, s.jambe * 1.35, -s.jambe * 0.4],
        [s.jambes, s.jambe * 0.9],
      ],
      5,
      dom,
      { x: c * Math.max(0.14, s.jambe + 0.04), haut: false },
    );
  // Le torse : la dominante, sa marque devant ou derrière, la tenue par-dessus.
  const peint = (kk: number, j: number): Peindre => {
    const avant = AVANT_DU_TORSE.includes(j);
    let c = dom;
    if (j === -1) c = v.has('robe') || v.has('cire') ? tenue : dom;
    else if (
      (m.has('ventre') && avant && kk <= 1) ||
      (m.has('poitrine') && avant && kk >= 1 && kk <= 2) ||
      (m.has('plastron') && PLASTRON.includes(j) && kk <= 2) ||
      (m.has('dos') && DOS_DU_TORSE.includes(j))
    )
      c = marque;
    if (j >= 0 && (v.has('robe') || v.has('cire')) && kk <= (v.has('cire') ? 3 : 1)) c = tenue;
    if (j >= 0 && v.has('gilet') && (kk === 1 || kk === 2) && j !== 7) c = tenue;
    return c;
  };
  const profil = torse(s);
  fuseau(T, profil, N_TORSE, parFace(peint), { haut: false });
  if (v.has('robe') || v.has('cire')) {
    const bas = v.has('robe') ? 0.25 : 0.4;
    fuseau(
      T,
      [
        [bas, s.largeur * 1.04, s.profondeur * 1.04],
        [1.0, s.largeur + 0.012, s.profondeur + 0.012, -s.ventre],
      ],
      N_TORSE,
      tenue,
      { bas: false, haut: false },
    );
  }
  const bande = (y0: number, y1: number, peindre: Peindre) => {
    const large = ([y, rx, rz = rx, dz = 0]: Anneau): Anneau => [y, rx + 0.018, rz + 0.018, dz];
    fuseau(T, [large(anneauA(profil, y0)), large(anneauA(profil, y1))], N_TORSE, peindre, { bas: false, haut: false });
  };
  if (v.has('ceinture')) bande(0.98, 1.08, tenue);
  if (v.has('echarpe')) bande(1.82, 1.9, tenue);
  if (v.has('tablier')) {
    const ys = [0.42, 1.0, 1.45];
    const pts = ys.map((y) => {
      const d = devant(profil, N_TORSE, Math.max(y, profil[0][0]));
      return { y, z: d.z - 0.014, w: d.demiLargeur * (y > 1.2 ? 1.0 : 1.35) };
    });
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      facette(
        T,
        [
          [-a.w, a.y, a.z],
          [a.w, a.y, a.z],
          [b.w, b.y, b.z],
          [-b.w, b.y, b.z],
        ],
        [0, (a.y + b.y) / 2, (a.z + b.z) / 2 + 1],
        tenue,
      );
    }
  }
  if (v.has('cape'))
    // La pèlerine : elle couvre les épaules et le haut des bras, et se voit de face.
    fuseau(
      T,
      [
        [1.3, s.largeur * 1.62, s.profondeur * 1.3],
        [1.8, s.largeur * 1.5, s.profondeur * 1.2],
        [COU + 0.02, s.largeur * 0.6, s.profondeur * 0.7],
      ],
      N_TORSE,
      tenue,
      { bas: false },
    );
  if (v.has('cape') || v.has('elytres') || v.has('ailes')) {
    const large = v.has('ailes') ? 1.15 : v.has('elytres') ? 1.02 : 0.92;
    const c = v.has('cape') ? tenue : dom;
    fuseau(
      T,
      [
        [v.has('elytres') ? 0.5 : 0.4, s.largeur * large, 0.05, s.profondeur * 0.85 + 0.03],
        [1.82, s.largeur * 0.62, 0.04, s.profondeur * 0.55 + 0.03],
      ],
      4,
      c,
    );
  }
  if (v.has('ailes'))
    // Les ailes : sous chaque bras, une membrane de l'épaule à la hanche (de face comme de dos).
    for (const c of [-1, 1]) {
      const e = epaule(s);
      const pts: V3[] = [
        [c * (e[0] - 0.04), e[1] - 0.02, 0.02],
        [c * (e[0] + 0.12), 1.3, 0.02],
        [c * (s.largeur + 0.02), 0.85, 0.02],
        [c * s.largeur * 0.8, 1.2, 0.02],
      ];
      facette(T, pts, [0, 1.3, 1], dom);
      facette(T, pts.map(([x, y]) => [x, y, 0.03] as V3), [0, 1.3, -1], dom);
    }
  // Le bras gauche, et ce qu'il tient.
  const ab = { rx: e.autreBras?.rx ?? 0.08, rz: e.autreBras?.rz ?? 0.1 };
  const manche = v.has('robe') || v.has('cire') || v.has('gilet') ? tenue : dom;
  bras(T, s, -1, ab.rx, ab.rz, dom, manche);
  e.corps?.(T, k);
}

function tete(e: Espece, s: Silhouette, T: Trace, k: Kit): void {
  if (e.tete) return e.tete(T, k);
  const m = new Set(e.marque?.ou ?? []);
  const dom = k.dom;
  const marque = e.marque ? k.marque : dom;
  const peint = (kk: number, j: number) => (m.has('tete') || (m.has('visage') && j === VISAGE && kk === 0) ? marque : dom);
  const profil = crane(s);
  fuseau(T, profil, N_TETE, parFace(peint));
  if (e.museau) {
    const y = e.museau.y ?? 2.17;
    const z = devant(profil, N_TETE, y).z + 0.03;
    const c = m.has('museau') || m.has('tete') ? marque : dom;
    const R = pose(T, repere([0, y, z], -Math.PI / 2, 0, 0));
    const { long, r } = e.museau;
    // Le fond du museau, collé à la tête, ne se voit pas : il n'est pas fermé.
    if (e.museau.forme === 'bec')
      fuseau(
        R,
        [
          [0, r, r * 0.8],
          [long, 0],
        ],
        4,
        c,
        { bas: false },
      );
    else
      fuseau(
        R,
        [
          [0, r, r * 0.8],
          [long, r * 0.55, r * 0.45],
        ],
        5,
        c,
        { bas: false },
      );
  }
  e.surTete?.(T, k);
}

// ---------- La créature entière ----------

/** Les pièces d'une créature, tirées de son espèce, à l'échelle de son gabarit. */
export function piecesDe(e: Espece): Piece[] {
  const s: Silhouette = { ...SILHOUETTE, ...e.silhouette };
  const g = GABARITS[e.gabarit ?? 'standard'];
  const h = g.taille / TAILLE_DE_CREATURE;
  const w = g.largeur;
  const echelle = (p: V3): V3 => [p[0] * w, p[1] * h, p[2] * w];
  const br = { rx: e.bras?.rx ?? 0.35, rz: e.bras?.rz ?? 0.1 };
  const ep = epaule(s);
  const cou: V3 = [0, COU, 0];
  const main = repereDuBras(s, 1, br.rx, br.rz)([0, -s.bras + 0.04, 0]);
  const kit = (pot: Pot) => new Kit(pot, e, s);
  /** Une pièce dessinée dans le gabarit standard, portée à l'échelle du sien. */
  const piece = (nom: string, pivot: V3, dessiner: (T: Trace, pot: Pot) => void, lueur?: Piece['lueur'], nuit?: Couleur): Piece => ({
    nom,
    pivot: echelle(pivot),
    ...(lueur ? { lueur } : {}),
    ...(nuit !== undefined ? { nuit } : {}),
    dessiner: (T, pot) => dessiner(pose(T, echelle), pot),
  });
  const pieces: Piece[] = [piece('corps', [0, s.jambes, 0], (T, pot) => corps(e, s, T, kit(pot))), piece('tete', cou, (T, pot) => tete(e, s, T, kit(pot)))];
  if (e.coiffe) {
    const coiffe = e.coiffe;
    pieces.push(piece('coiffe', cou, (T, pot) => coiffe(T, kit(pot))));
  }
  if (e.yeux !== false) {
    // Les yeux se posent à l'échelle, mais gardent leur taille.
    const o = e.yeux ?? {};
    const y = o.y ?? 2.3;
    const z = o.z ?? devant(crane(s), N_TETE, y).z;
    pieces.push({ nom: 'yeux', pivot: echelle(cou), dessiner: (T, pot) => yeux(T, pot(OEIL, 'yeux'), 0, y * h, z * w, (o.ecart ?? 0.1) * w, o.taille ?? 0.045) });
  }
  const v = new Set(e.tenue.vetements);
  const manche = v.has('robe') || v.has('cire') || v.has('gilet');
  pieces.push(
    piece('bras', [ep[0], ep[1], ep[2]], (T, pot) => {
      const k = kit(pot);
      bras(T, s, 1, br.rx, br.rz, k.dom, manche ? k.tenue : k.dom);
    }),
  );
  pieces.push(piece('outil', main, (T, pot) => e.outil.dessiner(pose(T, repereDeLaMain(s, 1, br.rx, br.rz, e.outil.pose)), kit(pot))));
  if (e.autreMain) {
    // Ce que tient la main gauche : une pièce à part, qui suit le corps (le bras gauche ne fait pas de geste).
    const m = e.autreMain;
    const ab = { rx: e.autreBras?.rx ?? 0.08, rz: e.autreBras?.rz ?? 0.1 };
    const gauche = repereDuBras(s, -1, ab.rx, ab.rz)([0, -s.bras + 0.04, 0]);
    pieces.push(piece('autre-main', gauche, (T, pot) => m.dessiner(pose(T, repereDeLaMain(s, -1, ab.rx, ab.rz, m.pose)), kit(pot))));
  }
  if (e.lueur) {
    const l = e.lueur;
    pieces.push(piece(l.nom, l.sur === 'tete' ? cou : [0, s.jambes, 0], (T, pot) => l.dessiner(T, kit(pot)), 'nuit', l.nuit));
  }
  return pieces;
}

/** Le devant de la tête d'une silhouette à la hauteur `y` (pour y poser des yeux ou une lentille). */
export function devantDeLaTete(y: number, s: Partial<Silhouette> = {}): number {
  return devant(crane({ ...SILHOUETTE, ...s }), N_TETE, y).z;
}

/** Une créature en facettes. */
export function creatureEnFacettes(e: Espece): FacettesDePersonnage {
  return peindrePersonnage(piecesDe(e));
}

// ---------- Les petites formes que partagent les espèces ----------

/** Une pointe (oreille, corne, épine, bec) : un cône à `n` pans, de sa base `o` vers `+Y` tourné de `rot`. */
export function pointe(T: Trace, o: V3, r: number, h: number, peindre: Peindre, rot: [number, number, number] = [0, 0, 0], n = 4, rz = r): void {
  fuseau(
    pose(T, repere(o, rot[0], rot[1], rot[2])),
    [
      [0, r, rz],
      [h, 0],
    ],
    n,
    peindre,
  );
}

/** Un manche (ou une perche, un pied) : un prisme à `n` pans le long de +Y, de `y0` à `y1`. */
export function manche(T: Trace, y0: number, y1: number, r: number, peindre: Peindre, n = 4): void {
  fuseau(
    T,
    [
      [y0, r],
      [y1, r],
    ],
    n,
    peindre,
  );
}

/** Un disque épais (plateau, bobine, lentille), à `n` pans, d'axe +Y. */
export function disque(T: Trace, y: number, r: number, e: number, peindre: Peindre, n = 6): void {
  fuseau(
    T,
    [
      [y - e / 2, r],
      [y + e / 2, r],
    ],
    n,
    peindre,
  );
}

/**
 * Un anneau (une corde enroulée, une bouée) : un tore de rayon `R` et d'épaisseur `r`, `n` tronçons de `m` pans, dans le
 * plan XY de son repère (`o`, tourné de `rot`) ; `2nm` triangles.
 */
export function anneau(T: Trace, o: V3, R: number, r: number, peindre: Peindre, rot: [number, number, number] = [0, 0, 0], n = 8, m = 3): void {
  const P = pose(T, repere(o, rot[0], rot[1], rot[2]));
  const point = (i: number, j: number): V3 => {
    const a = (i / n) * Math.PI * 2;
    const b = (j / m) * Math.PI * 2;
    const d = R + r * Math.cos(b);
    return [d * Math.cos(a), d * Math.sin(a), r * Math.sin(b)];
  };
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      P.quad(point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1), [R * Math.cos(a), R * Math.sin(a), 0], peindre);
    }
}

/** Une perche rayée (jalon, perche graduée) : `bandes` tronçons alternés, de `y0` à `y1`. */
export function jalon(T: Trace, y0: number, y1: number, r: number, bandes: number, a: Peindre, b: Peindre): void {
  const profil: Anneau[] = Array.from({ length: bandes + 1 }, (_, i) => [y0 + ((y1 - y0) * i) / bandes, r]);
  fuseau(
    T,
    profil,
    4,
    parFace((k) => (k % 2 === 0 ? a : b)),
  );
}
