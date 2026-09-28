// La construction taillée d'Archipéo (lot R5 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les bâtiments
// des plans, les ouvrages, les monuments, l'école et la salle des trophées, les objets du quai et le décor du cœur, en
// blocs de pierre taillée. Code pur, sans Three.js : il lit les cubes restés en cubes après le décor (`rangerLeDecor`,
// posés par `poseDuDecor`) et les cubes du sol, et rend trois groupes de tableaux typés, trois appels de dessin :
//
// - `opaque` : les blocs, en couleurs par sommet (la palette de l'archipel, de jour ; la nuit vient de la lumière de
//   la scène). Les faces coplanaires d'une même couleur sont fusionnées en rectangles (fusion gloutonne par plan, par
//   sens et par couleur) ; chaque bloc garde sa teinte, à ± `TEINTE` de luminosité, que le shader tire de sa case
//   (`TEINTE_GLSL` sur `floor(position - normal * 0.5)`, ou l'attribut `teintes` pour un bloc hors de la grille) : la
//   fusion ne l'efface pas. Le biseau des arêtes saillantes (celles où deux faces visibles d'un bloc se rencontrent) est
//   peint par défaut : l'attribut `biseaux` donne la distance aux bords saillants de chaque rectangle, et le shader
//   incline la normale sur une bande de `BISEAU` case, sans un triangle de plus. Le biseau taillé en géométrie (bandes,
//   coins, petits triangles qui ferment un bout contre un bloc sans biseau) reste une option : il triple les triangles.
// - `fantomes` : les cubes d'un plan encore à poser, sans biseau, toutes leurs faces (un fantôme ne cache rien),
//   fusionnées par plan ; leurs uv sont leurs coordonnées sur le plan, en cases : le shader dessine l'arête fine de
//   chaque case là où elles sont entières (`ARETE_FANTOME`).
// - `fenetres` : ce qui s'allume la nuit. Les vitres (une lanterne ou un verre pris dans un mur) sont sombres le jour ;
//   les lanternes des cours, des comptoirs et des toits gardent leur couleur de lanterne. La nuit, toutes prennent la
//   lueur `LUEUR`, chacune à son moment (`eclatDeFenetre`, un décalage par sommet) ; au plus `FENETRES_ALLUMEES` vitres
//   par bâtiment, aucune sur une île fermée.
//
// Le toucher : la géométrie reste dans la case de son bloc (le biseau ne fait que rogner). `caseDeLaConstruction`
// redonne la case touchée et la case devant la face, pour une face, un biseau ou un coin.
import type { VoxelCube } from '../Voxel';
import { mixColor } from './daylight';
import { DELAVE, eclaircir, hex, rgb } from './decor/pinceau';
import { lineaire } from './landMesh';
import type { ArchipelagoId } from './map';
import { ambianceDe, BRUME, couleurDeMatiere, MATIERES, type Couleur, type Faces } from './palette';
import type { TextureKind } from './pixels';
import { couleursDuToit } from './toits';
import type { Cell } from './view';

// ---------- Les réglages de l'intention (directeur artistique, 28 septembre 2026) ----------

/** La variation de luminosité d'un bloc à l'autre : ± 4 %, jamais une autre teinte. */
export const TEINTE = 0.04;
/** Le biseau des arêtes saillantes, en part de case. */
export const BISEAU = 0.08;
/** La lueur des fenêtres et des lanternes, la nuit. */
export const LUEUR: Couleur = 0xffd866;
/** Le verre d'une vitre, le jour : le verre de la palette, à cette part de sa luminosité. */
export const VITRE_DE_JOUR = 0.55;
/** Au plus tant de vitres allumées par bâtiment. */
export const FENETRES_ALLUMEES = 3;
/** Le décalage d'allumage d'une fenêtre, de 0 à cette valeur (en degré de nuit). */
export const DECALAGE_MAX = 0.15;
/** L'allumage : rien sous ce degré de nuit, tout allumé à `PLEINE_NUIT`. */
export const ALLUMAGE = 0.3;
export const PLEINE_NUIT = 0.8;
/** Le fantôme : sa teinte, son arête, et l'épaisseur de l'arête en part de case. */
export const FANTOME: Couleur = BRUME;
export const ARETE: Couleur = 0x142b38;
export const ARETE_FANTOME = 0.035;
/** La toile du Bloc-Navire : le crème Brume. */
export const TOILE_DU_NAVIRE: Couleur = BRUME;

// ---------- Les fonctions que le shader reprend ----------

const f32 = Math.fround;
const fract = (v: number) => f32(v - Math.floor(v));

/**
 * Le hasard d'une case, de 0 à 1, stable : le même calcul que `TEINTE_GLSL` (en flottants 32 bits), sur la case dans le
 * repère Three (X = x, Y = hauteur, Z = y). Le GPU peut arrondir autrement : la teinte d'un bloc reste stable d'une
 * image à l'autre, pas forcément identique au bit près à celle-ci.
 */
export function hasardDeCase(x: number, y: number, z: number): number {
  let px = fract(f32(x * f32(0.1031)));
  let py = fract(f32(z * f32(0.1031)));
  let pz = fract(f32(y * f32(0.1031)));
  // p += dot(p, p.zyx + 31.32)
  const k = f32(31.32);
  const d = f32(f32(f32(px * f32(pz + k)) + f32(py * f32(py + k))) + f32(pz * f32(px + k)));
  px = f32(px + d);
  py = f32(py + d);
  pz = f32(pz + d);
  return fract(f32(f32(px + py) * pz));
}

/** La teinte d'un bloc : un facteur de luminosité (sur la couleur affichée, sRGB), de 1 − `TEINTE` à 1 + `TEINTE`. */
export function teinteDeCase(x: number, y: number, z: number): number {
  return 1 + TEINTE * (2 * hasardDeCase(x, y, z) - 1);
}

/**
 * Le même calcul en GLSL : `teinteDeCase(floor(position - normal * 0.5))`, en coordonnées de l'objet (le maillage est
 * posé à l'origine du monde), rend le facteur à appliquer à la couleur linéaire (la puissance 2,2 fait ± 4 % sur la
 * couleur affichée).
 */
export const TEINTE_GLSL = `
float teinteDeCase(vec3 c) {
  vec3 p = fract(c * 0.1031);
  p += dot(p, p.zyx + 31.32);
  float h = fract((p.x + p.y) * p.z);
  return pow(1.0 + ${TEINTE.toFixed(3)} * (2.0 * h - 1.0), 2.2);
}
`;

/**
 * L'éclat d'une fenêtre ou d'une lanterne, de 0 (éteinte) à 1 (pleine lueur), selon le degré de nuit `n` (0 : plein
 * jour, 1 : nuit ; `1 - daylight().light`) et son décalage (de 0 à `DECALAGE_MAX` ; négatif : jamais allumée). Rien sous
 * `ALLUMAGE`, tout allumé à `PLEINE_NUIT` ; chaque fenêtre s'allume sur sa rampe, un peu après les autres selon son
 * décalage. Monotone en `n`, en douceur (pas de clignotement).
 */
export function eclatDeFenetre(n: number, decalage: number): number {
  if (decalage < 0) return 0;
  const debut = ALLUMAGE + Math.min(decalage, DECALAGE_MAX);
  const fin = Math.min(PLEINE_NUIT, debut + (PLEINE_NUIT - ALLUMAGE) - DECALAGE_MAX);
  const t = Math.min(1, Math.max(0, (n - debut) / (fin - debut)));
  return t * t * (3 - 2 * t);
}

/** Le même calcul en GLSL (`n` : uniforme, `decalage` : attribut par sommet). */
export const ECLAT_GLSL = `
float eclatDeFenetre(float n, float decalage) {
  if (decalage < 0.0) return 0.0;
  float debut = ${ALLUMAGE.toFixed(3)} + min(decalage, ${DECALAGE_MAX.toFixed(3)});
  float fin = min(${PLEINE_NUIT.toFixed(3)}, debut + ${(PLEINE_NUIT - ALLUMAGE - DECALAGE_MAX).toFixed(3)});
  return smoothstep(debut, fin, n);
}
`;

/**
 * L'opacité des fantômes, entre la nuit (`light` = 0) et le jour (1) : le remplissage (0,35 de jour, 0,45 de nuit ;
 * 0,55 en Contraste élevé) et l'arête (50 % ; pleine en Contraste élevé).
 */
export function opaciteDesFantomes(light: number, contraste = false): { remplissage: number; arete: number } {
  if (contraste) return { remplissage: 0.55, arete: 1 };
  const l = Math.min(1, Math.max(0, light));
  return { remplissage: 0.45 + (0.35 - 0.45) * l, arete: 0.5 };
}

// ---------- Le maillage ----------

/** Un groupe de la construction : un appel de dessin. Repère Three (X = x, Y = hauteur, Z = y). */
export interface GroupeDeConstruction {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js (vides pour les fantômes : une couleur unie). */
  colors: Float32Array;
  indices: Uint32Array;
}

export interface GroupeDesFenetres extends GroupeDeConstruction {
  /** Par sommet : le décalage d'allumage (0 à `DECALAGE_MAX`), négatif pour une fenêtre qui ne s'allume jamais. */
  decalages: Float32Array;
}

export interface GroupeDesFantomes extends GroupeDeConstruction {
  /** Par sommet : ses coordonnées sur le plan de sa face, en cases (l'arête d'une case est là où elles sont entières). */
  uvs: Float32Array;
}

export interface GroupeOpaque extends GroupeDeConstruction {
  /**
   * Le biseau peint (mode `peint`) : par sommet, quatre distances (en cases) du sommet aux quatre bords de son rectangle,
   * côté u−, u+, v−, v+ (voir `TANGENTES`), ou `SANS_BISEAU` pour un bord qui n'est pas une arête saillante. Vide dans
   * les autres modes.
   */
  biseaux: Float32Array;
  /**
   * Par sommet : 0 pour un bloc sur la grille (le shader tire sa teinte de sa case), sinon la teinte du bloc
   * (`teinteDeCase` de sa case d'origine) : un objet du quai descendu d'une fraction de bloc au bas de sa pente
   * (`poseDuDecor`) chevauche deux cases, et garderait sinon deux teintes.
   */
  teintes: Float32Array;
}

export interface MaillageDeLaConstruction {
  opaque: GroupeOpaque;
  fantomes: GroupeDesFantomes;
  fenetres: GroupeDesFenetres;
}

export interface OptionsDeLaConstruction {
  /**
   * Le biseau des arêtes saillantes : `peint` (par défaut : le shader incline la normale sur une bande de `largeur` le
   * long des arêtes saillantes, sans un triangle de plus), `taille` (en géométrie : bandes, coins et bouts ; trop cher
   * pour un archipel, gardé pour un petit modèle comme le Bloc-Navire), `aucun`.
   */
  biseau?: 'peint' | 'taille' | 'aucun';
  /** La largeur du biseau, en part de case. */
  largeur?: number;
  /** Fusionner les faces coplanaires d'une même couleur (sinon une face par bloc). */
  fusion?: boolean;
  /** Dessiner aussi les bornes (sinon elles sont laissées au poste « Bornes », instanciées à part). */
  bornes?: boolean;
  /** Les cubes du Bloc-Navire : sa toile prend le crème Brume. */
  navire?: boolean;
}

/** Le genre d'un bloc dans la construction. */
export type Genre = 'bloc' | 'vitre' | 'lanterne' | 'fantome';

type V3 = [number, number, number];

/** Les six directions, en coordonnées de grille (z : hauteur). */
const DIRS: V3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const HAUT = 4;
const BAS = 5;
const axeDe = (d: number) => d >> 1;
const signeDe = (d: number) => (d & 1 ? -1 : 1);
const dir = (axe: number, signe: number) => axe * 2 + (signe > 0 ? 0 : 1);

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** La distance d'un bord qui n'est pas une arête saillante, dans `biseaux`. */
export const SANS_BISEAU = 64;

/**
 * Les deux axes (u, v) du plan d'une face, selon l'axe de sa normale, dans le repère Three : le shader du biseau peint
 * les retrouve de la normale. Normale selon X : (Z, Y) ; selon Y : (X, Z) ; selon Z : (X, Y).
 */
export const TANGENTES: Record<'x' | 'y' | 'z', [V3, V3]> = {
  x: [
    [0, 0, 1],
    [0, 1, 0],
  ],
  y: [
    [1, 0, 0],
    [0, 0, 1],
  ],
  z: [
    [1, 0, 0],
    [0, 1, 0],
  ],
};

const TOITURES = new Set(['toit', 'tuile']);
const LUMIERES = new Set(['lanterne', 'verre']);

/**
 * Le genre de chaque bloc : une vitre est une lanterne ou un verre pris dans un mur (deux blocs pleins de part et
 * d'autre sur une rangée, un bloc de la construction dessous, pas de toit dessus : les fenêtres de world/architect.ts,
 * celles de l'école) ; les autres lanternes (cours, comptoirs, sommets, la lanterne d'un phare sous son toit) restent
 * des lanternes ; le reste est un bloc.
 */
export function genresDesBlocs(cubes: VoxelCube[]): Map<VoxelCube, Genre> {
  const plein = new Map<string, VoxelCube>();
  for (const c of cubes) if (!c.ghost) plein.set(cle(c.x, c.y, c.z), c);
  const mur = (x: number, y: number, z: number) => {
    const n = plein.get(cle(x, y, z));
    return Boolean(n) && !LUMIERES.has(n!.texture ?? '');
  };
  const out = new Map<VoxelCube, Genre>();
  for (const c of cubes) {
    if (c.ghost) {
      out.set(c, 'fantome');
      continue;
    }
    if (!LUMIERES.has(c.texture ?? '')) {
      out.set(c, 'bloc');
      continue;
    }
    const dessus = plein.get(cle(c.x, c.y, c.z + 1));
    const pris =
      ((mur(c.x - 1, c.y, c.z) && mur(c.x + 1, c.y, c.z)) || (mur(c.x, c.y - 1, c.z) && mur(c.x, c.y + 1, c.z))) &&
      mur(c.x, c.y, c.z - 1) &&
      !(dessus && TOITURES.has(dessus.texture ?? ''));
    out.set(c, pris ? 'vitre' : c.texture === 'lanterne' ? 'lanterne' : 'bloc');
  }
  return out;
}

/** Le bâtiment d'un bloc, pour compter ses vitres allumées : son île et son lieu. */
const batimentDe = (c: VoxelCube) => `${c.tag ?? ''}|${c.place ?? ''}`;

/** Les décalages d'allumage des vitres et des lanternes : `FENETRES_ALLUMEES` vitres par bâtiment, rien sur une île fermée. */
function decalagesDe(genres: Map<VoxelCube, Genre>): Map<VoxelCube, number> {
  const out = new Map<VoxelCube, number>();
  const parBatiment = new Map<string, VoxelCube[]>();
  for (const [c, g] of genres) {
    if (g !== 'vitre' && g !== 'lanterne') continue;
    const d = c.muted ? -1 : DECALAGE_MAX * hasardDeCase(c.x + 17, c.y + 5, c.z + 11);
    out.set(c, d);
    if (g === 'vitre' && !c.muted) {
      const b = batimentDe(c);
      const list = parBatiment.get(b);
      if (list) list.push(c);
      else parBatiment.set(b, [c]);
    }
  }
  for (const list of parBatiment.values()) {
    const rang = list.map((c) => ({ c, h: hasardDeCase(c.x, c.y + 31, c.z + 7) })).sort((p, q) => p.h - q.h);
    for (const { c } of rang.slice(FENETRES_ALLUMEES)) out.set(c, -1);
  }
  return out;
}

/** Un groupe en cours de remplissage. */
class Remplissage {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  idx: number[] = [];
  extra: number[] = [];
  uv: number[] = [];
  bis: number[] = [];
  tei: number[] = [];
  /** Un polygone convexe (3 ou 4 sommets), tourné vers `n` (coordonnées de grille), et ses attributs par sommet. */
  poly(pts: V3[], n: V3, couleurs: Couleur[] | null, attr: { extra?: number; uvs?: [number, number][]; biseaux?: number[][]; teinte?: number } = {}): void {
    const { extra, uvs, biseaux, teinte } = attr;
    // Le sens : la normale du polygone doit suivre `n`.
    const [a, b, c] = pts;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    // En grille, (x, y, z) → Three (x, z, y) inverse le sens : on compare dans le repère de grille, puis on inverse.
    const direct = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] > 0;
    const ordre = pts.map((_, i) => i);
    if (direct) ordre.reverse();
    const base = this.pos.length / 3;
    const len = Math.hypot(n[0], n[1], n[2]);
    for (const i of ordre) {
      const p = pts[i];
      this.pos.push(p[0], p[2], p[1]);
      this.nor.push(n[0] / len, n[2] / len, n[1] / len);
      if (couleurs) {
        const k = rgb(couleurs[i]);
        this.col.push(lineaire(k[0] / 255), lineaire(k[1] / 255), lineaire(k[2] / 255));
      }
      if (extra !== undefined) this.extra.push(extra);
      if (uvs) this.uv.push(uvs[i][0], uvs[i][1]);
      if (biseaux) this.bis.push(...biseaux[i]);
      if (teinte !== undefined) this.tei.push(teinte);
    }
    for (let i = 1; i + 1 < pts.length; i++) this.idx.push(base, base + i, base + i + 1);
  }
  fin(): GroupeDeConstruction {
    return {
      positions: Float32Array.from(this.pos),
      normals: Float32Array.from(this.nor),
      colors: Float32Array.from(this.col),
      indices: Uint32Array.from(this.idx),
    };
  }
}

/**
 * La construction d'un archipel : trois groupes (voir l'en-tête). `cubes` : les cubes restés en cubes (sans le sol ni
 * le décor en primitives), posés par `poseDuDecor` ; `sol` : les cubes du sol, qui cachent le dessous d'un bloc posé
 * dessus. Les couleurs sont celles de la palette, de jour.
 */
export function maillageDeLaConstruction(
  a: ArchipelagoId,
  cubes: VoxelCube[],
  sol: VoxelCube[] = [],
  options: OptionsDeLaConstruction = {},
): MaillageDeLaConstruction {
  const mode = options.biseau ?? 'peint';
  const b = mode === 'aucun' ? 0 : (options.largeur ?? BISEAU);
  /** Les faces rentrent sous le biseau taillé ; le biseau peint ne change pas la géométrie. */
  const retrait = mode === 'taille' ? b : 0;
  const fusion = options.fusion ?? true;
  const dessines = options.bornes ? cubes : cubes.filter((c) => !c.quest);
  const genres = genresDesBlocs(dessines);
  const decalages = decalagesDe(genres);
  const plein = new Map<string, VoxelCube>();
  for (const c of dessines) if (!c.ghost) plein.set(cle(c.x, c.y, c.z), c);
  const sous = new Set(sol.map((c) => cle(c.x, c.y, c.z)));

  // Les couleurs d'un bloc, de jour.
  const vues = new Map<string, Faces>();
  const couleursDe = (c: VoxelCube): Faces => {
    const g = genres.get(c);
    const k = `${c.texture ?? ''}|${c.color}|${c.top ?? ''}|${c.muted ? 1 : 0}|${c.texture === 'toit' ? c.tag : ''}|${g}`;
    let f = vues.get(k);
    if (f) return f;
    const delave = (x: Faces): Faces => (c.muted ? { dessus: mixColor(x.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(x.cote, DELAVE[0], DELAVE[1]) } : x);
    if (c.texture === 'toit') f = couleursDuToit(a, c.tag, c.muted);
    else if (g === 'vitre') {
      const v = couleurDeMatiere(a, 'verre');
      f = delave({ dessus: eclaircir(v.dessus, VITRE_DE_JOUR), cote: eclaircir(v.cote, VITRE_DE_JOUR) });
    } else if (c.texture === 'toile' && options.navire) {
      // Le crème Brume, sous le voile de l'archipel comme toutes les matières ; ses côtés un peu plus sombres.
      const [teinte, force] = ambianceDe(a).voile;
      const creme = mixColor(TOILE_DU_NAVIRE, teinte, force);
      f = delave({ dessus: creme, cote: eclaircir(creme, 0.9) });
    } else if (c.texture && c.texture in MATIERES) f = delave(couleurDeMatiere(a, c.texture as TextureKind));
    else {
      // Sans matière : sa couleur (déjà délavée si l'île est fermée), comme le décor.
      const x = hex(c.color);
      f = { dessus: c.top ? hex(c.top) : mixColor(x, 0xffffff, 0.12), cote: x };
    }
    vues.set(k, f);
    return f;
  };
  const couleurDeFace = (c: VoxelCube, d: number) => (d === HAUT ? couleursDe(c).dessus : couleursDe(c).cote);

  /** La face `d` du bloc est-elle visible ? Un bloc plein la cache ; le sol cache le dessous ; un fantôme ne cache rien. */
  const visible = (c: VoxelCube, d: number): boolean => {
    const [dx, dy, dz] = DIRS[d];
    if (plein.has(cle(c.x + dx, c.y + dy, c.z + dz))) return false;
    if (d === BAS && sous.has(cle(c.x, c.y, c.z - 1))) return false;
    return true;
  };
  /** La teinte à porter par sommet : 0 sur la grille (le shader la calcule), celle de sa case d'origine hors de la grille. */
  const teinteDe = (c: VoxelCube) =>
    Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z) ? 0 : teinteDeCase(Math.floor(c.x), Math.floor(c.y), Math.floor(c.z));
  const taille = (c: VoxelCube) => b > 0 && genres.get(c) === 'bloc';
  /** L'arête entre les faces `d` et `e` d'un bloc est-elle biseautée ? */
  const biseaute = (c: VoxelCube, d: number, e: number) => taille(c) && visible(c, d) && visible(c, e);

  const O = new Remplissage();
  const F = new Remplissage();
  const G = new Remplissage();
  const groupeDe = (c: VoxelCube) => (genres.get(c) === 'bloc' ? O : F);
  const extraDe = (c: VoxelCube) => (genres.get(c) === 'bloc' ? undefined : decalages.get(c) ?? -1);

  /** Les deux axes du plan d'une face d'axe `k`, dans l'ordre. */
  const tangents = (k: number): [number, number] => (k === 0 ? [1, 2] : k === 1 ? [0, 2] : [0, 1]);
  const point = (k: number, plan: number, i: number, u: number, j: number, v: number): V3 => {
    const p: V3 = [0, 0, 0];
    p[k] = plan;
    p[i] = u;
    p[j] = v;
    return p;
  };

  /**
   * Un rectangle d'une face, de (uA, vA) à (uB, vB) sur son plan, ses bords saillants `r` (u−, u+, v−, v+) : rentré sous
   * le biseau taillé, ou avec les distances du biseau peint.
   */
  const rectangle = (R: Remplissage, d: number, plan: number, uA: number, uB: number, vA: number, vB: number, r: boolean[], col: Couleur, extra?: number, teinte?: number) => {
    const k = axeDe(d);
    const [i, j] = tangents(k);
    const u0 = uA + (r[0] ? retrait : 0);
    const u1 = uB - (r[1] ? retrait : 0);
    const v0 = vA + (r[2] ? retrait : 0);
    const v1 = vB - (r[3] ? retrait : 0);
    const coins: [number, number][] = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    const peint = mode === 'peint' && R === O;
    const dist = (x: number, bord: boolean) => (bord ? x : SANS_BISEAU);
    R.poly(
      coins.map(([u, v]) => point(k, plan, i, u, j, v)),
      DIRS[d],
      [col, col, col, col],
      { extra, teinte: R === O ? teinte : undefined, biseaux: peint ? coins.map(([u, v]) => [dist(u - u0, r[0]), dist(u1 - u, r[1]), dist(v - v0, r[2]), dist(v1 - v, r[3])]) : undefined },
    );
  };

  /** Un rectangle de fantôme : ses uv sont ses coordonnées sur le plan, en cases (l'arête est là où elles sont entières). */
  const fantome = (d: number, plan: number, u0: number, u1: number, v0: number, v1: number) => {
    const k = axeDe(d);
    const [i, j] = tangents(k);
    const coins: [number, number][] = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    G.poly(
      coins.map(([u, v]) => point(k, plan, i, u, j, v)),
      DIRS[d],
      null,
      { uvs: coins },
    );
  };

  // ---- Les faces des blocs, des vitres et des lanternes.
  interface Case {
    u: number;
    v: number;
    couleur: Couleur;
    teinte: number;
    /** Retraits du biseau : côté u−, u+, v−, v+. */
    r: [boolean, boolean, boolean, boolean];
    fait: boolean;
  }
  const plans = new Map<string, Map<string, Case>>();
  const SANS_BORDS: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  // Les fantômes : toutes leurs faces (un fantôme ne cache rien), fusionnées par plan comme les blocs.
  for (const c of dessines) {
    if (!c.ghost) continue;
    for (let d = 0; d < 6; d++) {
      const k = axeDe(d);
      const [i, j] = tangents(k);
      const base: V3 = [c.x, c.y, c.z];
      const plan = base[k] + (signeDe(d) > 0 ? 1 : 0);
      if (!fusion) {
        fantome(d, plan, base[i], base[i] + 1, base[j], base[j] + 1);
        continue;
      }
      const pk = `g|${d}|${plan}`;
      let p = plans.get(pk);
      if (!p) plans.set(pk, (p = new Map()));
      p.set(`${base[i]},${base[j]}`, { u: base[i], v: base[j], couleur: FANTOME, teinte: 0, r: SANS_BORDS, fait: false });
    }
  }
  for (const c of dessines) {
    if (c.ghost) continue;
    const g = genres.get(c);
    for (let d = 0; d < 6; d++) {
      if (!visible(c, d)) continue;
      const k = axeDe(d);
      const [i, j] = tangents(k);
      const base: V3 = [c.x, c.y, c.z];
      const plan = base[k] + (signeDe(d) > 0 ? 1 : 0);
      const r: [boolean, boolean, boolean, boolean] = [
        biseaute(c, d, dir(i, -1)),
        biseaute(c, d, dir(i, 1)),
        biseaute(c, d, dir(j, -1)),
        biseaute(c, d, dir(j, 1)),
      ];
      if (g !== 'bloc' || !fusion) {
        // Une face seule : les vitres et les lanternes ont chacune leur décalage.
        rectangle(groupeDe(c), d, plan, base[i], base[i] + 1, base[j], base[j] + 1, r, couleurDeFace(c, d), extraDe(c), teinteDe(c));
        continue;
      }
      const pk = `o|${d}|${plan}`;
      let p = plans.get(pk);
      if (!p) plans.set(pk, (p = new Map()));
      p.set(`${base[i]},${base[j]}`, { u: base[i], v: base[j], couleur: couleurDeFace(c, d), teinte: teinteDe(c), r, fait: false });
    }
  }

  // La fusion gloutonne : dans chaque plan, des rectangles d'une même couleur, dont chaque bord a le même retrait.
  for (const [pk, cases] of plans) {
    const [groupe, ds, ps] = pk.split('|');
    const d = Number(ds);
    const plan = Number(ps);
    const ordre = [...cases.values()].sort((p, q) => p.v - q.v || p.u - q.u);
    for (const s of ordre) {
      if (s.fait) continue;
      const at = (u: number, v: number) => {
        const x = cases.get(`${u},${v}`);
        return x && !x.fait && x.couleur === s.couleur && x.teinte === s.teinte ? x : undefined;
      };
      // Le long de u : même couleur, mêmes retraits en v.
      let u1 = s.u;
      for (;;) {
        const n = at(u1 + 1, s.v);
        if (!n || n.r[2] !== s.r[2] || n.r[3] !== s.r[3] || s.r[1] || n.r[0]) break;
        u1++;
      }
      const droite = cases.get(`${u1},${s.v}`)!;
      const bords = { gauche: s.r[0], droite: droite.r[1], bas: s.r[2], haut: s.r[3] };
      // Puis le long de v, rangée par rangée.
      let v1 = s.v;
      for (;;) {
        const rangee: Case[] = [];
        for (let u = s.u; u <= u1; u++) {
          const n = at(u, v1 + 1);
          if (!n) break;
          rangee.push(n);
        }
        if (rangee.length !== u1 - s.u + 1) break;
        const haut = rangee[0].r[3];
        if (rangee.some((n) => n.r[3] !== haut || n.r[2])) break;
        if (rangee[0].r[0] !== bords.gauche || rangee[rangee.length - 1].r[1] !== bords.droite) break;
        if (rangee.some((n, x) => x > 0 && n.r[0]) || rangee.some((n, x) => x < rangee.length - 1 && n.r[1])) break;
        // La rangée d'avant n'avait pas de retrait en haut (sinon elle ne touchait pas celle-ci).
        if (bords.haut) break;
        v1++;
        bords.haut = haut;
      }
      for (let v = s.v; v <= v1; v++) for (let u = s.u; u <= u1; u++) cases.get(`${u},${v}`)!.fait = true;
      if (groupe === 'g') fantome(d, plan, s.u, u1 + 1, s.v, v1 + 1);
      else rectangle(O, d, plan, s.u, u1 + 1, s.v, v1 + 1, [bords.gauche, bords.droite, bords.bas, bords.haut], s.couleur, undefined, s.teinte);
    }
  }

  // ---- Le biseau : les bandes des arêtes, leurs coins, et les bouts qui butent sur un bloc sans biseau.
  if (mode === 'taille' && b > 0) {
    interface Bande {
      t0: number;
      t1: number;
      court0: boolean;
      court1: boolean;
    }
    const bandes = new Map<string, { d: number; e: number; ai: number; aj: number; ca: Couleur; cb: Couleur; tc: number; list: Bande[] }>();
    for (const c of dessines) {
      if (!taille(c)) continue;
      const base: V3 = [c.x, c.y, c.z];
      for (let d = 0; d < 6; d++) {
        if (!visible(c, d)) continue;
        for (let e = d + 1; e < 6; e++) {
          if (axeDe(e) === axeDe(d) || !visible(c, e)) continue;
          const kd = axeDe(d);
          const ke = axeDe(e);
          const kf = 3 - kd - ke;
          // L'arête : sur le plan de d et celui de e, le long de l'axe kf.
          const ai = base[kd] + (signeDe(d) > 0 ? 1 : 0);
          const aj = base[ke] + (signeDe(e) > 0 ? 1 : 0);
          const court0 = visible(c, dir(kf, -1));
          const court1 = visible(c, dir(kf, 1));
          const ca = couleurDeFace(c, d);
          const cb = couleurDeFace(c, e);
          const tc = teinteDe(c);
          const key = `${d}|${e}|${ai}|${aj}|${ca}|${cb}|${tc}`;
          let l = bandes.get(key);
          if (!l) bandes.set(key, (l = { d, e, ai, aj, ca, cb, tc, list: [] }));
          l.list.push({ t0: base[kf], t1: base[kf] + 1, court0, court1 });
          // Les bouts sans coin : si un bloc sans ce biseau est là, un triangle ferme le bout (sa face vers ce bloc-ci).
          for (const sf of [-1, 1]) {
            const f = dir(kf, sf);
            if (visible(c, f)) continue;
            const off = DIRS[f];
            const n = plein.get(cle(c.x + off[0], c.y + off[1], c.z + off[2]));
            if (!n || biseaute(n, d, e)) continue;
            const t = sf > 0 ? base[kf] + 1 : base[kf];
            const K: V3 = [0, 0, 0];
            K[kd] = ai;
            K[ke] = aj;
            K[kf] = t;
            const A: V3 = [...K];
            A[ke] -= signeDe(e) * b;
            const B: V3 = [...K];
            B[kd] -= signeDe(d) * b;
            const col = couleurDeFace(n, dir(kf, -sf));
            groupeDe(n).poly([K, A, B], DIRS[dir(kf, -sf)], [col, col, col], { extra: extraDe(n), teinte: groupeDe(n) === O ? teinteDe(n) : undefined });
          }
        }
      }
      // Les coins : trois faces visibles.
      for (const sx of [-1, 1])
        for (const sy of [-1, 1])
          for (const sz of [-1, 1]) {
            const ds = [dir(0, sx), dir(1, sy), dir(2, sz)];
            if (!ds.every((d) => visible(c, d))) continue;
            const K: V3 = [c.x + (sx > 0 ? 1 : 0), c.y + (sy > 0 ? 1 : 0), c.z + (sz > 0 ? 1 : 0)];
            const s = [sx, sy, sz];
            // Le sommet sur la face d'axe m : rentré de b le long des deux autres axes.
            const pts = [0, 1, 2].map((m) => {
              const p: V3 = [...K];
              for (let q = 0; q < 3; q++) if (q !== m) p[q] -= s[q] * b;
              return p;
            });
            O.poly(pts, [sx, sy, sz], [0, 1, 2].map((m) => couleurDeFace(c, ds[m])), { teinte: teinteDe(c) });
          }
    }
    // Les bandes, fusionnées le long de leur arête.
    for (const { d, e, ai, aj, ca, cb, tc, list } of bandes.values()) {
      list.sort((p, q) => p.t0 - q.t0);
      const kd = axeDe(d);
      const ke = axeDe(e);
      const kf = 3 - kd - ke;
      const n: V3 = [0, 0, 0];
      n[kd] = signeDe(d);
      n[ke] = signeDe(e);
      const emettre = (s: Bande) => {
        const t0 = s.t0 + (s.court0 ? b : 0);
        const t1 = s.t1 - (s.court1 ? b : 0);
        const at = (t: number, surD: boolean): V3 => {
          const p: V3 = [0, 0, 0];
          p[kd] = surD ? ai : ai - signeDe(d) * b;
          p[ke] = surD ? aj - signeDe(e) * b : aj;
          p[kf] = t;
          return p;
        };
        O.poly([at(t0, true), at(t1, true), at(t1, false), at(t0, false)], n, [ca, ca, cb, cb], { teinte: tc });
      };
      let cur = null as Bande | null;
      for (const s of list) {
        if (cur && fusion && cur.t1 === s.t0 && !cur.court1 && !s.court0) cur = { ...cur, t1: s.t1, court1: s.court1 };
        else {
          if (cur) emettre(cur);
          cur = { ...s };
        }
      }
      if (cur) emettre(cur);
    }
  }

  const opaque = O.fin();
  const f = F.fin();
  const g = G.fin();
  return {
    opaque: { ...opaque, biseaux: Float32Array.from(O.bis), teintes: Float32Array.from(O.tei) },
    fenetres: { ...f, decalages: Float32Array.from(F.extra) },
    fantomes: { ...g, colors: new Float32Array(0), uvs: Float32Array.from(G.uv) },
  };
}

/** Triangles et appels de dessin de la construction (un appel par groupe non vide). */
export function coutDeLaConstruction(m: MaillageDeLaConstruction): { triangles: number; drawCalls: number; opaque: number; fantomes: number; fenetres: number } {
  const t = (g: GroupeDeConstruction) => g.indices.length / 3;
  const groupes = [m.opaque, m.fantomes, m.fenetres];
  return {
    triangles: groupes.reduce((n, g) => n + t(g), 0),
    drawCalls: groupes.filter((g) => g.indices.length > 0).length,
    opaque: t(m.opaque),
    fantomes: t(m.fantomes),
    fenetres: t(m.fenetres),
  };
}

/**
 * La case touchée sur la construction, et la case devant : le point touché et la normale de la facette (repère Three).
 * La case est celle du bloc sous le point (un demi-bloc derrière la facette, qui reste dans la case de son bloc, biseau
 * compris) ; la case devant est sa voisine du côté où la facette regarde le plus (le haut d'abord, pour un biseau ou un
 * coin : on pose sur le dessus).
 */
export function caseDeLaConstruction(point: { x: number; y: number; z: number }, normale: { x: number; y: number; z: number }): { cell: Cell; next: Cell } {
  const cell = {
    x: Math.floor(point.x - normale.x * 0.5),
    y: Math.floor(point.z - normale.z * 0.5),
    z: Math.floor(point.y - normale.y * 0.5),
  };
  const ax = Math.abs(normale.x);
  const ay = Math.abs(normale.y);
  const az = Math.abs(normale.z);
  const m = Math.max(ax, ay, az) - 1e-6;
  const next = { ...cell };
  if (ay >= m) next.z += Math.sign(normale.y);
  else if (ax >= m) next.x += Math.sign(normale.x);
  else next.y += Math.sign(normale.z);
  return { cell, next };
}
