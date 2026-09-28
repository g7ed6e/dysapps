// Le décor d'Archipéo (lot R4 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les arbres, les rochers, les
// repères, les cascades et l'habillage de la mer, en primitives basse résolution (troncs à cinq pans, feuillages en
// icosaèdres, cônes de sapin, rochers bosselés), peintes par sommet avec la palette de l'archipel, et fusionnées en un
// seul maillage pour tout le décor (un second pour ce qui brille : lanternes, lave). Code pur, sans Three.js : il lit
// les cubes du décor rangés par nom (./props.ts, ./decor.ts) et le champ du sol (./landMesh.ts), et rend des tableaux
// typés que la vue 3D dessine en un ou deux appels de dessin.
//
// - Chaque élément est posé au milieu de sa case, sur la pente (`hauteurDuSol`) : plus de socle plat sous le décor, le
//   sol à facettes passe dessous (`rangerLeDecor` le sort des cubes qui figent une case). Un repère de plusieurs cases
//   s'enfonce jusqu'au plus bas de son emprise, sur un pied élargi : il ne flotte jamais au bord d'une pente.
// - Les cascades collent à la falaise de la case du bord, de la pente jusqu'à l'eau ; les écueils et les bancs
//   affleurent à la surface de la mer.
// - Rien ne bouge : « Réduire les animations » n'a rien à arrêter ici. La nuit vient de la lumière de la scène, comme
//   pour le sol ; ce qui brille (lanternes, lave) est à part, sans ombre ni lumière.
import type { VoxelCube } from '../Voxel';
import { mixColor } from './daylight';
import { DECOR_BATI, REPERES, SMOKE, type Repere } from './decor';
import { colonneEn, hauteurDuSol, lineaire, NIVEAU_EAU, type ChampDuSol } from './landMesh';
import type { ArchipelagoId } from './map';
import { couleurDeMatiere, MATIERES, type Couleur, type Faces } from './palette';
import type { TextureKind } from './pixels';
import { kindOf, PROP_KINDS } from './props';
import type { Cell } from './view';

/** Un élément du décor : ses cubes dans le monde en blocs, et où il pousse. */
export interface ElementDeDecor {
  id: string;
  /** Son genre (« arbre », « grand-phare », « ecueil »…). */
  genre: string;
  cubes: VoxelCube[];
  /** La case du pied : le tronc, la première case d'un repère, la case du bord d'une cascade, le centre d'un écueil. */
  x: number;
  y: number;
  /** Le niveau du sol sous lui dans le monde en blocs (le bas de son cube le plus bas). */
  z: number;
  /** Le côté de son emprise au sol, en cases (2 pour un repère de 2 × 2). */
  emprise: number;
  /** Île fermée : couleurs délavées. */
  muted: boolean;
}

/** Les genres dessinés en primitives : le décor rangé de la 2D (arbres, buissons, rochers…) et le décor bâti. */
const EN_PRIMITIVES: ReadonlySet<string> = new Set<string>([...PROP_KINDS, ...DECOR_BATI]);

/** Les genres dont le nom porte la case du monde (« genre@x,y ») ; le décor du cœur porte une case du cœur. */
const NOM_DU_MONDE: ReadonlySet<string> = DECOR_BATI;

/** Un cube d'un élément de décor dessiné en primitives. */
export function enPrimitives(c: VoxelCube): boolean {
  return Boolean(c.decor) && !c.ghost && EN_PRIMITIVES.has(kindOf(c.decor!));
}

/**
 * Sépare le décor dessiné en primitives des autres cubes. Le reste (le sol, la construction, le décor du cœur, les
 * objets du quai) va au champ du sol et aux cubes : une case où seul un élément du décor était posé n'est plus figée.
 */
export function rangerLeDecor(cubes: VoxelCube[]): { elements: ElementDeDecor[]; reste: VoxelCube[] } {
  const groupes = new Map<string, VoxelCube[]>();
  const reste: VoxelCube[] = [];
  for (const c of cubes) {
    if (!enPrimitives(c)) {
      reste.push(c);
      continue;
    }
    const list = groupes.get(c.decor!);
    if (list) list.push(c);
    else groupes.set(c.decor!, [c]);
  }
  const elements: ElementDeDecor[] = [];
  for (const [id, list] of groupes) {
    const genre = kindOf(id);
    const z = Math.min(...list.map((c) => c.z));
    let x: number;
    let y: number;
    const bas = list.filter((c) => c.z === z);
    if (NOM_DU_MONDE.has(genre)) {
      const [px, py] = id
        .slice(id.lastIndexOf('@') + 1)
        .split(',')
        .map(Number);
      x = px;
      y = py;
    } else {
      // Comme la 2D (./props.ts) : le pied du tronc s'il y en a un ; sinon la case que nomme le décor du paysage (un
      // sapin dont le tronc tomberait sur le cœur n'y a que son feuillage) ; sinon le cube le plus bas.
      const tronc = list.filter((c) => c.texture === 'tronc');
      const pied = (tronc.length ? tronc : list).reduce((p, q) => (q.z < p.z || (q.z === p.z && (q.x < p.x || (q.x === p.x && q.y < p.y))) ? q : p));
      const nom = id.slice(id.lastIndexOf('/') + 1);
      const [px, py] = nom.slice(nom.indexOf('@') + 1).split(',').map(Number);
      const duPaysage = !tronc.length && !nom.startsWith('cœur:') && Number.isInteger(px) && Number.isInteger(py);
      x = duPaysage ? px : pied.x;
      y = duPaysage ? py : pied.y;
    }
    const xs = bas.map((c) => c.x);
    // Un repère peut couvrir plusieurs cases (sa fumée ne touche pas le sol) ; le reste du décor pousse sur une case.
    const emprise = REPERES.includes(genre as Repere) && genre !== 'fumee' ? Math.max(1, Math.max(...xs) - Math.min(...xs) + 1) : 1;
    elements.push({ id, genre, cubes: list, x, y, z, emprise, muted: list.some((c) => c.muted) });
  }
  return { elements, reste };
}

// ---------- Le pinceau : des facettes et leurs couleurs ----------

type V3 = [number, number, number];
type RGB = [number, number, number];

/** Le décor en facettes : trois sommets par triangle, repère Three (X = x, Y = hauteur, Z = y). */
export interface FacettesDuDecor {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js. */
  colors: Float32Array;
  /** Pour chaque triangle, l'indice de son élément dans `elements` (le toucher y retrouve la case). */
  elements: Int32Array;
}

export interface MaillageDuDecor {
  /** Tout le décor, en un seul appel de dessin. */
  decor: FacettesDuDecor;
  /** Ce qui brille (lanternes, lave), sans lumière : un second appel, seulement s'il y en a. */
  lueurs: FacettesDuDecor;
  /** Les éléments dessinés, dans l'ordre de `elements`. */
  elements: ElementDeDecor[];
}

/** Une façon de peindre un sommet : sa position et la normale de sa facette. */
type Peindre = (p: V3, n: V3) => RGB;

class Pinceau {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private own: number[] = [];
  element = 0;
  /** Un triangle ; `dedans` : un point à l'intérieur du volume (la facette regarde à l'opposé). */
  triangle(a: V3, b: V3, c: V3, dedans: V3, peindre: Peindre): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(n[0], n[1], n[2]);
    if (len < 1e-9) return;
    n = [n[0] / len, n[1] / len, n[2] / len];
    const m = [(a[0] + b[0] + c[0]) / 3 - dedans[0], (a[1] + b[1] + c[1]) / 3 - dedans[1], (a[2] + b[2] + c[2]) / 3 - dedans[2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) {
      [b, c] = [c, b];
      n = [-n[0], -n[1], -n[2]];
    }
    for (const p of [a, b, c]) {
      this.pos.push(p[0], p[1], p[2]);
      this.nor.push(n[0], n[1], n[2]);
      const k = peindre(p, n);
      this.col.push(k[0], k[1], k[2]);
    }
    this.own.push(this.element);
  }
  quad(a: V3, b: V3, c: V3, d: V3, dedans: V3, peindre: Peindre): void {
    this.triangle(a, b, c, dedans, peindre);
    this.triangle(a, c, d, dedans, peindre);
  }
  fin(): FacettesDuDecor {
    return { positions: Float32Array.from(this.pos), normals: Float32Array.from(this.nor), colors: Float32Array.from(this.col), elements: Int32Array.from(this.own) };
  }
}

/** Un hasard reproductible, tiré du nom d'un élément. */
function hasardDe(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rgb = (c: Couleur): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = (s: string): Couleur => parseInt(s.slice(1), 16);
/** Une île fermée : les couleurs délavées vers le gris clair, comme le sol (./landMesh.ts). */
const DELAVE: [Couleur, number] = [0xb8bcc0, 0.55];
/** La nuance d'un décor : du pied (plus sombre) au sommet, `PIED` à `PIED + ELAN`. */
export const PIED = 0.84;
export const ELAN = 0.2;

/**
 * La peinture d'une matière : la couleur de côté vers le bas, celle du dessus vers le haut, plus sombre au pied (de
 * `y0` à `y0 + h`), `v` : une variation propre à l'élément.
 */
function peintre(f: Faces, y0: number, h: number, v = 1): Peindre {
  const dessus = rgb(f.dessus);
  const cote = rgb(f.cote);
  return (p, n) => {
    const w = clamp(0.45 + 0.6 * n[1], 0, 1);
    const t = h > 0 ? clamp((p[1] - y0) / h, 0, 1) : 1;
    const k = (PIED + ELAN * t) * v;
    return [0, 1, 2].map((j) => lineaire(((cote[j] + (dessus[j] - cote[j]) * w) / 255) * k)) as RGB;
  };
}

/** La fumée : claire, à peine ombrée (une volute, pas un rocher). */
function vaporeux(f: Faces): Peindre {
  const dessus = rgb(f.dessus);
  const cote = rgb(f.cote);
  return (_, n) => {
    const w = clamp(0.75 + 0.35 * n[1], 0, 1);
    return [0, 1, 2].map((j) => lineaire((cote[j] + (dessus[j] - cote[j]) * w) / 255)) as RGB;
  };
}

/** Ce qui brille : la couleur du dessus, pleine, sans nuance. */
function lueur(f: Faces): Peindre {
  const c = rgb(f.dessus);
  const k = c.map((v) => lineaire(v / 255)) as RGB;
  return () => k;
}

// ---------- Les primitives ----------

/** Un tronc de cône à `n` pans (un cône si `r1` vaut 0), de `y0` à `y1`, tourné de `rot` ; sans fond. */
function tronconique(P: Pinceau, cx: number, cz: number, y0: number, y1: number, r0: number, r1: number, n: number, rot: number, peindre: Peindre, chapeau = true): void {
  const bas: V3[] = [];
  const haut: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    bas.push([cx + r0 * Math.cos(a), y0, cz + r0 * Math.sin(a)]);
    haut.push([cx + r1 * Math.cos(a), y1, cz + r1 * Math.sin(a)]);
  }
  const dedans: V3 = [cx, y0 + (y1 - y0) * 0.3, cz];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (r1 <= 1e-6) P.triangle(bas[i], bas[j], [cx, y1, cz], dedans, peindre);
    else P.quad(bas[i], bas[j], haut[j], haut[i], dedans, peindre);
  }
  if (r1 > 1e-6 && chapeau) for (let i = 1; i + 1 < n; i++) P.triangle(haut[0], haut[i], haut[i + 1], [cx, y1 - 1, cz], peindre);
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_SOMMETS: V3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
].map((v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l] as V3;
});
const ICO_FACES = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

/** Un icosaèdre bosselé (feuillage, rocher, fumée) : vingt facettes, aplati de `sy`, chaque sommet décalé de ± `bosse`. */
function icosaedre(P: Pinceau, c: V3, r: number, sy: number, bosse: number, hasard: () => number, peindre: Peindre, rot = 0): void {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts = ICO_SOMMETS.map(([x, y, z]): V3 => {
    const k = r * (1 + bosse * (hasard() * 2 - 1));
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;
    return [c[0] + rx * k, c[1] + y * k * sy, c[2] + rz * k];
  });
  for (const [i, j, k] of ICO_FACES) P.triangle(pts[i], pts[j], pts[k], c, peindre);
}

/** Un octaèdre (cristal, fleur, lanterne), étiré de `sy` ; `moitie` : la moitié du haut seulement. */
function octaedre(P: Pinceau, c: V3, r: number, sy: number, peindre: Peindre, moitie = false, rot = 0): void {
  const pts: V3[] = [0, 1, 2, 3].map((i) => [c[0] + r * Math.cos(rot + (i * Math.PI) / 2), c[1], c[2] + r * Math.sin(rot + (i * Math.PI) / 2)]);
  const haut: V3 = [c[0], c[1] + r * sy, c[2]];
  const bas: V3 = [c[0], c[1] - r * sy, c[2]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    P.triangle(pts[i], pts[j], haut, c, peindre);
    if (!moitie) P.triangle(pts[i], pts[j], bas, c, peindre);
  }
}

/** Une boîte, sans fond : de (x0, y0, z0) à (x1, y1, z1). */
function boite(P: Pinceau, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, peindre: Peindre): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  P.quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  P.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0), c, peindre);
  P.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  P.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), c, peindre);
  P.quad(p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0), c, peindre);
}

// ---------- Le décor ----------

/** Les options du décor : le style de surface (`a` : aplats, sans nuance ni variation ; `b` : la nuance retenue). */
export interface OptionsDuDecor {
  style?: 'a' | 'b';
}

/** Combien s'enfonce le pied d'un élément sous le sol (il ne flotte jamais au-dessus d'une facette). */
export const ENFONCE = 0.15;

/**
 * Le décor d'un archipel en primitives, posé sur le champ du sol : un maillage pour tout le décor, un pour ce qui
 * brille. Les couleurs de la palette de l'archipel, de jour : la nuit vient de la lumière de la scène.
 */
export function maillageDuDecor(a: ArchipelagoId, champ: ChampDuSol, elements: ElementDeDecor[], options: OptionsDuDecor = {}): MaillageDuDecor {
  const style = options.style ?? 'b';
  const P = new Pinceau();
  const L = new Pinceau();
  const vues = new Map<string, Faces>();
  /** Les couleurs d'un cube : sa matière dans la palette, sinon sa couleur (déjà délavée si l'île est fermée). */
  const facesDe = (texture: string | undefined, couleur: string, dessus: string | undefined, muted: boolean): Faces => {
    const k = `${texture ?? ''}|${couleur}|${dessus ?? ''}|${muted ? 1 : 0}`;
    let f = vues.get(k);
    if (!f) {
      if (texture && texture in MATIERES) {
        f = couleurDeMatiere(a, texture as TextureKind);
        if (muted) f = { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) };
      } else {
        const c = hex(couleur);
        f = { dessus: dessus ? hex(dessus) : mixColor(c, 0xffffff, 0.12), cote: c };
      }
      vues.set(k, f);
    }
    return f;
  };
  const matiere = (m: TextureKind, muted: boolean) => facesDe(m, '#000000', undefined, muted);
  const du = (c: VoxelCube) => facesDe(c.texture, c.color, c.top, Boolean(c.muted));
  /** La hauteur du sol en un point, sinon `repli` (au-dessus de l'eau). */
  const sol = (x: number, y: number, repli: number) => hauteurDuSol(champ, x, y) ?? repli;
  /** Le plus bas du sol sur une emprise carrée (le pied d'un repère s'y enfonce). */
  const plusBas = (x0: number, y0: number, w: number, repli: number) => {
    let m = Infinity;
    for (const u of [0.1, 0.5, 0.9]) for (const v of [0.1, 0.5, 0.9]) m = Math.min(m, sol(x0 + u * w, y0 + v * w, repli));
    return m;
  };

  elements.forEach((e, i) => {
    P.element = i;
    L.element = i;
    const hasard = hasardDe(e.id);
    const vari = style === 'a' ? () => 1 : () => 0.94 + 0.12 * hasard();
    const cx = e.x + 0.5;
    const cz = e.y + 0.5;
    const base = sol(cx, cz, e.z);
    const hautDe = (pred: (c: VoxelCube) => boolean) => Math.max(...e.cubes.filter(pred).map((c) => c.z + 1), e.z);
    const premier = (pred: (c: VoxelCube) => boolean) => e.cubes.find(pred);
    const rot = hasard() * Math.PI * 2;
    switch (e.genre) {
      case 'arbre': {
        const tronc = e.cubes.filter((c) => c.texture === 'tronc');
        const tall = Math.max(1, tronc.length);
        const fT = du(tronc[0] ?? e.cubes[0]);
        const fF = du(premier((c) => c.texture === 'feuilles') ?? e.cubes[e.cubes.length - 1]);
        // Un tronc court, un feuillage rond et large (la couronne de 3 × 3 cubes), un second plus petit sur les grands.
        const s = 0.92 + 0.16 * hasard();
        const yF = base + 0.55 * tall + 1.05 * s;
        tronconique(P, cx, cz, base - ENFONCE, yF - 0.4, 0.19 * s, 0.12 * s, 5, rot, peintre(fT, base, tall, vari()), false);
        const pF = peintre(fF, yF - 1.2 * s, 2.5 * s, vari());
        icosaedre(P, [cx, yF, cz], 1.22 * s, 0.86, 0.14, hasard, pF, rot);
        if (tall >= 3) {
          const a = rot + hasard() * Math.PI * 2;
          icosaedre(P, [cx + 0.55 * Math.cos(a), yF + 0.75 * s, cz + 0.55 * Math.sin(a)], 0.75 * s, 0.9, 0.14, hasard, pF, rot);
        }
        return;
      }
      case 'sapin': {
        const tronc = e.cubes.filter((c) => c.texture === 'tronc');
        const tall = Math.max(1, tronc.length);
        const fT = du(tronc[0] ?? e.cubes[0]);
        const fS = du(premier((c) => c.texture !== 'tronc') ?? e.cubes[0]);
        const s = 0.9 + 0.2 * hasard();
        tronconique(P, cx, cz, base - ENFONCE, base + tall + 0.4, 0.14 * s, 0.1 * s, 5, rot, peintre(fT, base, tall, vari()), false);
        const y0 = base + tall + 0.2;
        const pS = peintre(fS, y0, 3, vari());
        const etages = tall >= 2 ? 3 : 2;
        for (let k = 0; k < etages; k++) {
          const r = (1.25 - (k * 0.95) / etages) * s;
          tronconique(P, cx, cz, y0 + k * 0.8 * s, y0 + k * 0.8 * s + 1.35 * s, r, 0, 6, rot + k * 0.5, pS);
        }
        return;
      }
      case 'buisson': {
        const f = du(e.cubes[0]);
        for (const c of e.cubes) {
          const b = sol(c.x + 0.5, c.y + 0.5, c.z);
          const r = (0.46 + 0.1 * hasard()) * (c === e.cubes[0] ? 1 : 0.85);
          icosaedre(P, [c.x + 0.5, b + r * 0.45, c.y + 0.5], r, 0.72, 0.12, hasard, peintre(f, b, r * 1.2, vari()), rot);
        }
        return;
      }
      case 'fleur': {
        const f = du(e.cubes[0]);
        const herbe = matiere('feuilles', e.muted);
        tronconique(P, cx, cz, base - 0.05, base + 0.28, 0.2, 0, 4, rot, peintre(herbe, base, 0.3, vari()));
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * Math.PI * 2) / 3;
          octaedre(P, [cx + 0.22 * Math.cos(a), base + 0.26 + 0.06 * k, cz + 0.22 * Math.sin(a)], 0.15, 0.8, peintre(f, base, 0.4, vari()), true, a);
        }
        return;
      }
      case 'champignon': {
        const f = du(e.cubes[0]);
        const pied = matiere('sable', e.muted);
        tronconique(P, cx, cz, base - 0.05, base + 0.34, 0.1, 0.09, 5, rot, peintre(pied, base, 0.3));
        tronconique(P, cx, cz, base + 0.3, base + 0.54, 0.38, 0.16, 6, rot, peintre(f, base + 0.25, 0.3, vari()));
        return;
      }
      case 'rocher': {
        const f = du(e.cubes[0]);
        const haut = hautDe(() => true) - e.z;
        const r = haut >= 2 ? 0.66 : 0.5 + 0.08 * hasard();
        const sy = haut >= 2 ? 1.05 : 0.68;
        icosaedre(P, [cx, base + r * sy * 0.45, cz], r, sy, 0.18, hasard, peintre(f, base - 0.2, r * sy * 1.6, vari()), rot);
        return;
      }
      case 'souche': {
        const f = du(e.cubes[0]);
        tronconique(P, cx, cz, base - ENFONCE, base + 0.45, 0.33, 0.27, 6, rot, peintre(f, base, 0.5, vari()));
        return;
      }
      case 'roseau': {
        const f = du(e.cubes[0]);
        const h = hautDe(() => true) - e.z;
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * Math.PI * 2) / 3;
          const x = cx + 0.18 * Math.cos(a);
          const z = cz + 0.18 * Math.sin(a);
          tronconique(P, x, z, sol(x, z, base) - 0.05, base + h * (0.7 + 0.12 * k), 0.06, 0, 3, a, peintre(f, base, h, vari()));
        }
        return;
      }
      case 'cristal': {
        const f = du(e.cubes[0]);
        const h = hautDe(() => true) - e.z;
        octaedre(P, [cx, base + 0.35 * h, cz], 0.22, 1.9 * h, peintre(f, base, h, vari()), false, rot);
        octaedre(P, [cx + 0.22 * Math.cos(rot), base + 0.25, cz + 0.22 * Math.sin(rot)], 0.14, 1.9, peintre(f, base, h, vari()), false, rot + 0.7);
        return;
      }
      case 'ecueil': {
        // Un rocher qui affleure, un par case (aux Anciens Ateliers, une aiguille d'ardoise sur une pierre) : de sous
        // l'eau jusqu'au haut de ses cubes.
        const cases = new Map<string, VoxelCube[]>();
        for (const c of e.cubes) cases.set(`${c.x},${c.y}`, [...(cases.get(`${c.x},${c.y}`) ?? []), c]);
        for (const list of cases.values()) {
          const { x, y } = list[0];
          const haut = Math.max(...list.map((q) => q.z + 1));
          const ardoise = list.filter((q) => q.texture === 'ardoise' && q.z >= 0);
          const dessous = list.reduce((p, q) => (q.z < p.z ? q : p));
          const r = 0.5 + 0.1 * hasard();
          if (ardoise.length) {
            tronconique(P, x + 0.5, y + 0.5, NIVEAU_EAU - 0.3, haut - 0.05, 0.42, 0.13, 5, rot, peintre(du(ardoise[0]), NIVEAU_EAU, haut - NIVEAU_EAU, vari()));
            octaedre(P, [x + 0.5, NIVEAU_EAU - 0.05, y + 0.5], r + 0.1, 0.55, peintre(du(dessous), NIVEAU_EAU - 0.3, 0.6, vari()), true, rot);
            continue;
          }
          // Les cases voisines d'un écueil : un caillou bas, à quatre facettes.
          if (x !== e.x || y !== e.y) {
            octaedre(P, [x + 0.5, NIVEAU_EAU - 0.05, y + 0.5], r, clamp((haut - 0.3 - NIVEAU_EAU) / r, 0.5, 1.2), peintre(du(dessous), NIVEAU_EAU - 0.2, 0.7, vari()), true, rot + 0.4);
            continue;
          }
          const top = haut - 0.25;
          const sy = clamp((top - NIVEAU_EAU + 0.2) / (r * 1.45), 0.45, 1.6);
          const f = du(list.reduce((p, q) => (q.z > p.z ? q : p)));
          icosaedre(P, [x + 0.5, NIVEAU_EAU - 0.2 + r * sy * 0.5, y + 0.5], r, sy, 0.18, hasard, peintre(f, NIVEAU_EAU - 0.2, top - NIVEAU_EAU + 0.2, vari()), rot);
        }
        return;
      }
      case 'banc': {
        // Un banc de sable (de glace, de galets) au ras de l'eau : une tache plate, bordée d'un rebord bas.
        const f = du(e.cubes[0]);
        const mx = e.cubes.reduce((s, c) => s + c.x + 0.5, 0) / e.cubes.length;
        const mz = e.cubes.reduce((s, c) => s + c.y + 0.5, 0) / e.cubes.length;
        const R = 0.45 + 0.42 * Math.sqrt(e.cubes.length);
        const n = 7;
        const y = NIVEAU_EAU + 0.1;
        const bord: V3[] = [];
        for (let k = 0; k < n; k++) {
          const a = rot + (k / n) * Math.PI * 2;
          const r = R * (0.78 + 0.34 * hasard());
          bord.push([mx + r * Math.cos(a), y, mz + r * 0.85 * Math.sin(a)]);
        }
        const p = peintre(f, NIVEAU_EAU - 0.1, 0.2, vari());
        for (let k = 1; k + 1 < n; k++) P.triangle(bord[0], bord[k], bord[k + 1], [mx, y - 1, mz], p);
        for (let k = 0; k < n; k++) {
          const q = bord[(k + 1) % n];
          const b = bord[k];
          P.quad(b, q, [q[0], NIVEAU_EAU - 0.15, q[2]], [b[0], NIVEAU_EAU - 0.15, b[2]], [mx, NIVEAU_EAU - 0.05, mz], p);
        }
        return;
      }
      case 'cascade': {
        cascade(P, champ, e, du(e.cubes.find((c) => c.texture === 'eau') ?? e.cubes[0]), du(e.cubes.find((c) => c.texture !== 'eau') ?? e.cubes[0]));
        return;
      }
      default:
        repere(P, L, e, { base, plusBas, du, matiere, hasard, vari, rot, style });
    }
  });
  return { decor: P.fin(), lueurs: L.fin(), elements };
}

/** La cascade d'une île en altitude : un filet sur la case du bord, puis la chute le long de sa falaise, et l'écume. */
function cascade(P: Pinceau, champ: ChampDuSol, e: ElementDeDecor, eau: Faces, ecume: Faces): void {
  // La chute est dans la case voisine du bord : c'est de ce côté que tombe l'eau.
  const chute = e.cubes.filter((c) => c.x !== e.x || c.y !== e.y);
  const dehors = chute.find((c) => Math.abs(c.x - e.x) + Math.abs(c.y - e.y) === 1) ?? chute[0];
  if (!dehors) return;
  const dx = dehors.x - e.x;
  const dy = dehors.y - e.y;
  const col = colonneEn(champ, e.x, e.y);
  // Jusqu'à la mer, ou jusqu'au bas de la chute dans le ciel (les Îles du Ciel n'ont pas d'eau).
  const bas = Number.isFinite(champ.plancher) ? NIVEAU_EAU : Math.min(...chute.filter((c) => c.x === dehors.x && c.y === dehors.y).map((c) => c.z));
  // Le bord de la case, du côté de la chute, et la hauteur du sol à mi-bord.
  const bx = e.x + 0.5 + dx * 0.5;
  const bz = e.y + 0.5 + dy * 0.5;
  const haut = (col ? hauteurDuSol(champ, bx - dx * 0.01, bz - dy * 0.01) : null) ?? e.z;
  const [tx, tz] = [-dy, dx];
  const W = 0.32;
  const peau = 0.07;
  // Le filet sur la case : du milieu de la case au bord, sur la pente, un rien au-dessus.
  const filet = (s: number, w: number): V3 => {
    const x = e.x + 0.5 + dx * 0.5 * s + tx * w;
    const z = e.y + 0.5 + dy * 0.5 * s + tz * w;
    return [x, (hauteurDuSol(champ, x, z) ?? haut) + 0.04, z];
  };
  const pEau = (y0: number, h: number) => peintre(eau, y0, h);
  const pFilet = pEau(haut - 1, 1.2);
  for (const [s0, s1] of [
    [-0.2, 0.4],
    [0.4, 1],
  ])
    P.quad(filet(s0, -W * 0.8), filet(s1, -W), filet(s1, W), filet(s0, W * 0.8), [e.x + 0.5, haut - 1, e.y + 0.5], pFilet);
  // La chute : une lame d'eau plaquée contre la falaise, de l'épaisseur `peau`, rayée de clair.
  const x0 = bx + dx * 0.02;
  const z0 = bz + dy * 0.02;
  const x1 = bx + dx * (0.02 + peau);
  const z1 = bz + dy * (0.02 + peau);
  const pas = Math.max(1, Math.round((haut - bas) / 1.2));
  const claire: Faces = { dessus: mixColor(eau.dessus, 0xffffff, 0.35), cote: mixColor(eau.cote, 0xffffff, 0.3) };
  for (let k = 0; k < pas; k++) {
    const yA = haut + 0.04 - ((haut - bas) * k) / pas;
    const yB = haut + 0.04 - ((haut - bas) * (k + 1)) / pas;
    const p = k % 2 ? pEau(bas, haut - bas) : peintre(claire, bas, haut - bas);
    const w0 = W * (1 + 0.12 * (k / pas));
    const w1 = W * (1 + 0.12 * ((k + 1) / pas));
    const dedans: V3 = [(x0 + x1) / 2, (yA + yB) / 2, (z0 + z1) / 2];
    // Face au large, et les deux tranches (la lame se voit de biais).
    P.quad([x1 - tx * w0, yA, z1 - tz * w0], [x1 + tx * w0, yA, z1 + tz * w0], [x1 + tx * w1, yB, z1 + tz * w1], [x1 - tx * w1, yB, z1 - tz * w1], dedans, p);
    for (const sgn of [-1, 1]) P.quad([x0 + sgn * tx * w0, yA, z0 + sgn * tz * w0], [x1 + sgn * tx * w0, yA, z1 + sgn * tz * w0], [x1 + sgn * tx * w1, yB, z1 + sgn * tz * w1], [x0 + sgn * tx * w1, yB, z0 + sgn * tz * w1], dedans, p);
  }
  // L'écume au pied : une tache claire, à plat.
  const fx = bx + dx * 0.6;
  const fz = bz + dy * 0.6;
  const y = Math.max(bas, NIVEAU_EAU) + 0.06;
  const pEcume = peintre(ecume, y - 1, 1);
  const n = 6;
  const pts: V3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    pts.push([fx + 0.6 * Math.cos(a), y, fz + 0.6 * Math.sin(a)]);
  }
  for (let k = 1; k + 1 < n; k++) P.triangle(pts[0], pts[k], pts[k + 1], [fx, y - 1, fz], pEcume);
}

interface OutilsDuRepere {
  base: number;
  plusBas: (x0: number, y0: number, w: number, repli: number) => number;
  du: (c: VoxelCube) => Faces;
  matiere: (m: TextureKind, muted: boolean) => Faces;
  hasard: () => number;
  vari: () => number;
  rot: number;
  style: 'a' | 'b';
}

/** Les repères : un grand ouvrage par région, posé au plus bas de son emprise (il s'y enfonce, jamais ne flotte). */
function repere(P: Pinceau, L: Pinceau, e: ElementDeDecor, o: OutilsDuRepere): void {
  const w = e.emprise;
  const cx = e.x + w / 2;
  const cz = e.y + w / 2;
  const pied = o.plusBas(e.x, e.y, w, e.z) - 0.3;
  const Z = e.z;
  const fumee = e.cubes.filter((c) => c.color === SMOKE);
  const fFumee: Faces = { dessus: mixColor(hex(SMOKE), 0xffffff, 0.35), cote: mixColor(hex(SMOKE), 0x9aa4b0, 0.3) };
  const bouffees = (list: VoxelCube[]) => {
    list.forEach((c, k) => {
      const r = 0.5 + 0.12 * o.hasard() + 0.03 * k;
      icosaedre(P, [c.x + 0.5, c.z + 0.5, c.y + 0.5], r, 0.85, 0.16, o.hasard, vaporeux(fFumee), o.rot + k);
    });
  };
  const du = (texture: TextureKind) => {
    const c = e.cubes.find((q) => q.texture === texture);
    return c ? o.du(c) : o.matiere(texture, e.muted);
  };
  switch (e.genre) {
    case 'grand-arbre': {
      // Un chêne géant : un tronc évasé au pied, trois masses de feuillage.
      const fT = du('tronc');
      const fF = du('feuilles');
      const pT = peintre(fT, pied, Z + 6 - pied);
      tronconique(P, cx, cz, pied, o.base + 0.7, 1.05, 0.72, 7, o.rot, pT, false);
      tronconique(P, cx, cz, o.base + 0.6, Z + 6.6, 0.72, 0.5, 7, o.rot, pT, false);
      const pF = peintre(fF, Z + 6, 4);
      icosaedre(P, [cx, Z + 7.6, cz], 2.8, 0.6, 0.12, o.hasard, pF, o.rot);
      icosaedre(P, [cx - 0.6, Z + 8.6, cz + 0.4], 1.9, 0.72, 0.12, o.hasard, pF, o.rot + 1);
      icosaedre(P, [cx + 0.9, Z + 8.3, cz - 0.6], 1.4, 0.8, 0.12, o.hasard, pF, o.rot + 2);
      return;
    }
    case 'champignon-geant': {
      // Un champignon géant : pied clair, chapeau rouge en dôme, des points blancs.
      const fPied = du('sable');
      const chapeau = e.cubes.find((c) => c.z === Z + 3 && !c.texture) ?? e.cubes[0];
      const fC = o.du(chapeau);
      const fP = o.du(e.cubes.find((c) => c.z === Z + 5) ?? chapeau);
      tronconique(P, cx, cz, pied, Z + 3.9, 0.5, 0.4, 6, o.rot, peintre(fPied, pied, Z + 4 - pied), false);
      const pC = peintre(fC, Z + 3.4, 2);
      tronconique(P, cx, cz, Z + 3.5, Z + 4.6, 2.5, 1.3, 8, o.rot, pC, false);
      tronconique(P, cx, cz, Z + 4.6, Z + 5.5, 1.3, 0, 8, o.rot, pC);
      for (let k = 0; k < 5; k++) {
        const a = o.rot + (k / 5) * Math.PI * 2 + 0.3;
        octaedre(P, [cx + 1.75 * Math.cos(a), Z + 4.35, cz + 1.75 * Math.sin(a)], 0.24, 0.7, peintre(fP, Z + 4, 1), true, a);
      }
      octaedre(P, [cx, Z + 5.5, cz], 0.3, 0.6, peintre(fP, Z + 5, 1), true);
      return;
    }
    case 'aiguille-de-glace': {
      // Une aiguille de glace : un pilier qui s'amincit en pointe, un cristal au sommet.
      const fG = du('glace');
      const pG = peintre(fG, pied, Z + 8 - pied);
      tronconique(P, cx, cz, pied, Z + 5.2, 1.1, 0.62, 6, o.rot, pG, false);
      tronconique(P, cx, cz, Z + 5.2, Z + 8.6, 0.62, 0, 6, o.rot + 0.3, pG);
      octaedre(P, [cx, Z + 9.2, cz], 0.42, 1.5, peintre(du('cristal'), Z + 8.5, 1.2), false, o.rot);
      return;
    }
    case 'haut-fourneau': {
      // Le haut-fourneau : une cheminée de basalte qui s'évase au pied, la lave au sommet, la fumée au vent.
      const fB = du('basalte');
      const pB = peintre(fB, pied, Z + 9 - pied);
      tronconique(P, cx, cz, pied, Z + 1.2, 1.35, 1.12, 8, o.rot, pB, false);
      tronconique(P, cx, cz, Z + 1.2, Z + 9.3, 1.12, 0.92, 8, o.rot, pB, false);
      // La lèvre : un anneau de basalte autour de la lave.
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = o.rot + (i / n) * Math.PI * 2;
        const a1 = o.rot + ((i + 1) / n) * Math.PI * 2;
        const p = (r: number, a: number, y: number): V3 => [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
        P.quad(p(0.92, a0, Z + 9.3), p(0.92, a1, Z + 9.3), p(0.66, a1, Z + 9.3), p(0.66, a0, Z + 9.3), [cx, Z + 8, cz], pB);
      }
      tronconique(L, cx, cz, Z + 8.9, Z + 9.2, 0.7, 0.68, 8, o.rot, lueur(du('lave')));
      bouffees(fumee);
      return;
    }
    case 'tour-de-guet': {
      // Une tour de guet de pierre sur le pic, sa lanterne et sa bannière.
      const fP = du('pierre');
      tronconique(P, cx, cz, pied, Z + 4, 0.58, 0.46, 6, o.rot, peintre(fP, pied, Z + 4 - pied));
      tronconique(P, cx, cz, Z + 4, Z + 4.25, 0.5, 0.5, 6, o.rot, peintre(fP, Z + 3, 1.2));
      octaedre(L, [cx, Z + 4.65, cz], 0.3, 1.2, lueur(du('lanterne')), false, o.rot);
      const mat = o.matiere('tronc', e.muted);
      tronconique(P, cx + 0.3, cz, Z + 4.2, Z + 6, 0.05, 0.04, 4, 0, peintre(mat, Z + 4, 2), false);
      boite(P, cx + 0.33, Z + 5.05, cz - 0.03, cx + 1.1, Z + 5.8, cz + 0.03, peintre(du('toile'), Z + 5, 1));
      return;
    }
    case 'grand-phare': {
      // Le grand phare : une tour de pierre à bandes claires, la lanterne, le toit de prisme.
      const fP = du('pierre');
      const fB = o.du(e.cubes.find((c) => c.texture === 'nuage') ?? e.cubes[0]);
      const r = (y: number) => 1.12 - 0.3 * clamp((y - Z) / 8, 0, 1);
      const tranches: [number, number, Faces][] = [
        [pied, Z + 3, fP],
        [Z + 3, Z + 4, fB],
        [Z + 4, Z + 7, fP],
        [Z + 7, Z + 8, fB],
      ];
      for (const [y0, y1, f] of tranches) tronconique(P, cx, cz, y0, y1, r(y0), r(y1), 8, o.rot, peintre(f, pied, Z + 8 - pied), false);
      tronconique(P, cx, cz, Z + 8, Z + 8.2, 1.05, 1.05, 8, o.rot, peintre(fP, Z + 7, 1.5));
      tronconique(L, cx, cz, Z + 8.2, Z + 9.1, 0.66, 0.66, 8, o.rot, lueur(du('lanterne')), false);
      tronconique(P, cx, cz, Z + 9.1, Z + 10.5, 1.0, 0, 8, o.rot, peintre(du('prisme'), Z + 9, 1.5));
      return;
    }
    case 'fumee':
      bouffees(fumee.length ? fumee : e.cubes);
      return;
    default:
      // Un décor bâti sans forme propre : ses cubes, en boîtes.
      for (const c of e.cubes) boite(P, c.x, c.z, c.y, c.x + 1, c.z + 1, c.y + 1, peintre(o.du(c), c.z, 1));
  }
}

/** Triangles et appels de dessin d'un maillage du décor. */
export function coutDuDecor(m: MaillageDuDecor): { triangles: number; drawCalls: number } {
  const t = m.decor.elements.length + m.lueurs.elements.length;
  return { triangles: t, drawCalls: (m.decor.elements.length ? 1 : 0) + (m.lueurs.elements.length ? 1 : 0) };
}

/**
 * La case touchée sur le décor : celle où pousse l'élément du triangle touché (le haut de sa colonne de sol), et la
 * case au-dessus. Au large (un écueil, un banc), la case de l'eau.
 */
export function caseDuDecor(champ: ChampDuSol, m: MaillageDuDecor, lueur: boolean, triangle: number): { cell: Cell; next: Cell } | null {
  const f = lueur ? m.lueurs : m.decor;
  const i = f.elements[triangle];
  const e = i === undefined ? undefined : m.elements[i];
  if (!e) return null;
  const col = colonneEn(champ, e.x, e.y);
  const z = col ? col.haut : e.z - 1;
  return { cell: { x: e.x, y: e.y, z }, next: { x: e.x, y: e.y, z: z + 1 } };
}

/** La signature d'un décor : la même tant que ses éléments ne changent pas (les couleurs d'une île qu'on ouvre, oui). */
export function signatureDuDecor(elements: ElementDeDecor[]): string {
  return elements.map((e) => `${e.id}${e.muted ? '~' : ''}:${e.cubes.length}`).join('|');
}
