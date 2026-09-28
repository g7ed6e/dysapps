// La faune et le ciel d'Archipéo (lot R3 de la piste Rendu, docs/conception/cadrage-archipeo.md) : code pur, sans
// Three.js. Les baleines, les oiseaux et les nuages en formes facettées, peintes par sommet (une couleur par facette),
// que la vue 3D dessine en une instanciation par famille (three/faune.ts) : un appel de dessin pour toutes les baleines
// (souffle compris), un pour les oiseaux, un pour les nuages. Et la pose des baleines au fil du temps (leur ronde au
// large, leur passage devant une île), commune au monde en blocs et à Archipéo.
//
// Repères des formes (repère Three) : la baleine regarde vers +X (tête), le dos vers +Y ; l'oiseau vole vers +Z, ailes
// le long de X ; le nuage s'allonge le long de X, le dessous plat à Y = 0.
import { AMBIENCE, mixColor } from './daylight';
import type { ArchipelagoId } from './map';
import { passPhase, type WhaleRoute } from './whalePass';
import { BRUME, type Couleur } from './palette';

/**
 * Les nuages au-dessus d'un archipel : position relative à son étendue (0..1) et longueur en blocs. Aux Îles du Ciel,
 * deux fois plus (`nuagesDe`), les seconds bas, entre les îles.
 */
export const NUAGES: [number, number, number][] = [
  [0.05, 0.1, 4],
  [0.22, 0.9, 3],
  [0.4, 0.3, 5],
  [0.55, 1.1, 3],
  [0.7, -0.1, 4],
  [0.88, 0.6, 3],
  [1.02, 0.2, 2],
];

/** Les nuages d'un archipel (voir `NUAGES`). */
export function nuagesDe(a: ArchipelagoId): [number, number, number][] {
  return AMBIENCE[a].sky ? [...NUAGES, ...NUAGES.map(([fx, fy, len]) => [(fx + 0.5) % 1.1, fy - 0.45, len + 1] as [number, number, number])] : NUAGES;
}

/** Les oiseaux d'un archipel : combien, et à quelle altitude (plus nombreux et plus haut aux Anciens Ateliers, tout en haut aux Îles du Ciel). */
export function oiseauxDe(a: ArchipelagoId): { nombre: number; altitude: number } {
  return { nombre: a === '4e' ? 8 : 6, altitude: a === '4e' ? 17 : AMBIENCE[a].sky ? 18 : 13 };
}

/**
 * L'oiseau planeur des Îles du Ciel (sous-lot R4b-3e ; fiche du 3e, §2) : un seul, de 3 cases d'envergure, ailes fixes,
 * aux couleurs des oiseaux communs (la même forme, plus grande). Il tourne au-dessus du massif enneigé, derrière l'arc
 * des îles, plus haut que tous les autres oiseaux, à vitesse constante, sans battre des ailes : jamais au-dessus d'une
 * île (le lot 9 y fera signaler la zone active par des oiseaux), jamais devant la lanterne du phare.
 *
 * - `u` : le centre de sa ronde le long de la largeur de l'archipel (0 à l'ouest, 1 à l'est), loin du phare (vers 0,5) ;
 * - `recul` : en cases au-delà du bord nord de l'archipel, au-dessus du premier rang du massif (world/decor/3e.ts) ;
 * - `hauteur` : à la hauteur de la galerie du grand phare, au-dessus des cimes du premier rang et des autres oiseaux.
 */
export const PLANEUR = { u: 0.2, recul: 95, rayon: 14, hauteur: 24, periode: 32, envergure: 3, ailes: 0.35 } as const;

/** L'envergure de la forme de l'oiseau commun (`formeDOiseau`), en blocs. */
export const ENVERGURE_DE_L_OISEAU = 1.6;

/** L'oiseau planeur d'un archipel (seulement les Îles du Ciel) : sa ronde. */
export function planeurDe(a: ArchipelagoId, b: { minX: number; maxX: number; maxY: number }): { cx: number; cz: number; rayon: number; y: number } | null {
  if (!AMBIENCE[a].sky) return null;
  return { cx: b.minX + PLANEUR.u * (b.maxX - b.minX), cz: b.maxY + PLANEUR.recul, rayon: PLANEUR.rayon, y: PLANEUR.hauteur };
}

/**
 * Le planeur à l'instant `t` : sur sa ronde, à vitesse constante (un tour en `PLANEUR.periode` secondes), tourné le long
 * de son cercle ; figé dans sa pose de départ quand l'appareil demande moins d'animations (`reduit`).
 */
export function poseDuPlaneur(r: { cx: number; cz: number; rayon: number; y: number }, t: number, reduit: boolean): { x: number; y: number; z: number; cap: number; echelle: number } {
  const a = reduit ? 0 : (2 * Math.PI * t) / PLANEUR.periode;
  return { x: r.cx + Math.cos(a) * r.rayon, y: r.y, z: r.cz + Math.sin(a) * r.rayon, cap: -a, echelle: PLANEUR.envergure / ENVERGURE_DE_L_OISEAU };
}

type V3 = [number, number, number];

/** Une forme facettée : trois sommets par triangle, une couleur (linéaire) par sommet, et ses poids d'animation. */
export interface Forme {
  positions: Float32Array;
  colors: Float32Array;
  /** Pour chaque sommet, des poids nommés (la queue, le souffle d'une baleine) : 0 s'il n'y participe pas. */
  poids: Record<string, Float32Array>;
  /** Les sommets du ventre (la baleine) : la nuit les assombrit. */
  ventre?: Uint32Array;
}

/** Nombre de triangles d'une forme. */
export const trianglesDe = (f: Forme) => f.positions.length / 9;

const versLineaire = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const rgbLineaire = (c: Couleur): V3 => [versLineaire(((c >> 16) & 255) / 255), versLineaire(((c >> 8) & 255) / 255), versLineaire((c & 255) / 255)];

/** Un hasard reproductible, de 0 à 1. */
function hasard(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Une forme en construction. */
class Atelier {
  private pos: number[] = [];
  private col: number[] = [];
  private w = new Map<string, number[]>();
  private marques: number[] = [];
  /** `marque` : une couleur dont on retient les sommets (le ventre de la baleine). */
  constructor(
    noms: string[] = [],
    private marque?: Couleur,
  ) {
    for (const n of noms) this.w.set(n, []);
  }
  /**
   * Un triangle d'une couleur, tourné vers `dehors` (un vecteur, ou le point `depuis` dont il s'éloigne) : sens inverse
   * des aiguilles d'une montre vu de dehors. `poids` : ses poids nommés, par sommet.
   */
  tri(a: V3, b: V3, c: V3, couleur: Couleur, oriente: { dehors?: V3; depuis?: V3 }, poids: Record<string, [number, number, number]> = {}): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.hypot(n[0], n[1], n[2]) < 1e-9) return;
    const g = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    const d = oriente.dehors ?? [g[0] - oriente.depuis![0], g[1] - oriente.depuis![1], g[2] - oriente.depuis![2]];
    const retourne = n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0;
    const pts = retourne ? [a, c, b] : [a, b, c];
    const rgb = rgbLineaire(couleur);
    if (couleur === this.marque) for (let k = 0; k < 3; k++) this.marques.push(this.pos.length / 3 + k);
    for (const p of pts) this.pos.push(p[0], p[1], p[2]);
    for (let k = 0; k < 3; k++) this.col.push(rgb[0], rgb[1], rgb[2]);
    for (const [nom, list] of this.w) {
      const q = poids[nom] ?? [0, 0, 0];
      const o = retourne ? [q[0], q[2], q[1]] : q;
      list.push(o[0], o[1], o[2]);
    }
  }
  /** Un triangle mince vu des deux côtés (aile, nageoire) : deux faces, dessus et dessous. */
  lame(a: V3, b: V3, c: V3, dessus: Couleur, dessous: Couleur, haut: V3, poids: Record<string, [number, number, number]> = {}): void {
    this.tri(a, b, c, dessus, { dehors: haut }, poids);
    this.tri(a, b, c, dessous, { dehors: [-haut[0], -haut[1], -haut[2]] }, poids);
  }
  fin(): Forme {
    const poids: Record<string, Float32Array> = {};
    for (const [nom, list] of this.w) poids[nom] = Float32Array.from(list);
    const f: Forme = { positions: Float32Array.from(this.pos), colors: Float32Array.from(this.col), poids };
    if (this.marque !== undefined) f.ventre = Uint32Array.from(this.marques);
    return f;
  }
}

// ---------- La baleine ----------

/** La baleine de la fiche : bleu profond, ventre crème ; son souffle, couleur de brume. */
export const BALEINE = { dos: 0x1e3a5c, flanc: 0x27496c, ventre: 0xe3d9c0, nageoire: 0x2a4a6a, souffle: BRUME } as const;
/**
 * La nuit, le ventre crème s'assombrit vers le flanc (R4b-6e, repris du lot R3) : il ne luit pas sur la mer sombre ; la
 * baleine reste lisible par le reflet de lune de la vue 3D. `nuit` : 0 le jour, 1 en pleine nuit.
 */
export const VENTRE_DE_NUIT = mixColor(BALEINE.flanc, BALEINE.ventre, 0.4);

/** Les couleurs de la baleine à un moment de la nuit : celles de `f`, le ventre fondu vers `VENTRE_DE_NUIT`. */
export function couleursDeLaBaleine(f: Forme, nuit: number, out: Float32Array): Float32Array {
  out.set(f.colors);
  const jour = rgbLineaire(BALEINE.ventre);
  const soir = rgbLineaire(VENTRE_DE_NUIT);
  const k = Math.min(1, Math.max(0, nuit));
  for (const i of f.ventre ?? []) for (let j = 0; j < 3; j++) out[3 * i + j] = jour[j] + (soir[j] - jour[j]) * k;
  return out;
}

/** Le pivot de la queue (le long de X) et l'évent d'où part le souffle. */
export const PIVOT_QUEUE = -1.9;
export const EVENT: V3 = [2.3, 0.55, 0];

/**
 * La baleine en facettes (environ 6 unités de long, comme celle du monde en blocs) : un corps à six pans en six
 * sections, le dos bleu profond et le ventre crème, deux nageoires, une petite bosse dorsale, la queue (poids `queue`,
 * qui bat autour de `PIVOT_QUEUE`) et trois bouffées de souffle au-dessus de l'évent (poids `souffle` : repliées sur
 * l'évent quand elle ne souffle pas).
 */
export function formeDeBaleine(): Forme {
  const f = new Atelier(['queue', 'souffle'], BALEINE.ventre);
  // x, demi-hauteur, demi-largeur, hauteur du centre, poids de la queue.
  const sections: [number, number, number, number, number][] = [
    [-2.55, 0.15, 0.13, 0.05, 1],
    [-1.7, 0.37, 0.4, 0.02, 0.25],
    [-0.5, 0.58, 0.68, 0, 0],
    [0.8, 0.64, 0.74, 0, 0],
    [2.0, 0.56, 0.64, -0.02, 0],
    [2.9, 0.38, 0.44, -0.06, 0],
  ];
  const PANS = 6;
  const anneau = sections.map(([x, ry, rz, yc]) =>
    Array.from({ length: PANS }, (_, k): V3 => {
      const t = ((30 + 60 * k) * Math.PI) / 180;
      return [x, yc + ry * Math.sin(t), rz * Math.cos(t)];
    }),
  );
  const peau = (a: V3, b: V3, c: V3) => {
    const gy = (a[1] + b[1] + c[1]) / 3;
    return gy < -0.22 ? BALEINE.ventre : gy < 0.05 ? BALEINE.flanc : BALEINE.dos;
  };
  for (let s = 0; s + 1 < sections.length; s++) {
    const axe: V3 = [(sections[s][0] + sections[s + 1][0]) / 2, (sections[s][3] + sections[s + 1][3]) / 2, 0];
    for (let k = 0; k < PANS; k++) {
      const a = anneau[s][k];
      const b = anneau[s][(k + 1) % PANS];
      const c = anneau[s + 1][(k + 1) % PANS];
      const d = anneau[s + 1][k];
      const w0 = sections[s][4];
      const w1 = sections[s + 1][4];
      f.tri(a, b, c, peau(a, b, c), { depuis: axe }, { queue: [w0, w0, w1] });
      f.tri(a, c, d, peau(a, c, d), { depuis: axe }, { queue: [w0, w1, w1] });
    }
  }
  // Le museau et le bout de la queue.
  const museau: V3 = [3.45, -0.12, 0];
  const bout: V3 = [-2.8, 0.06, 0];
  const last = sections.length - 1;
  for (let k = 0; k < PANS; k++) {
    const a = anneau[last][k];
    const b = anneau[last][(k + 1) % PANS];
    f.tri(a, b, museau, peau(a, b, museau), { depuis: [2.9, -0.06, 0] });
    const c = anneau[0][k];
    const d = anneau[0][(k + 1) % PANS];
    f.tri(c, d, bout, BALEINE.dos, { depuis: [-2.55, 0.05, 0] }, { queue: [1, 1, 1] });
  }
  // La queue : deux lobes plats, repliés vers l'arrière, une encoche au milieu.
  const HAUT: V3 = [0, 1, 0];
  for (const cote of [1, -1]) {
    const racine: V3 = [-2.55, 0.05, 0];
    const pointe: V3 = [-3.45, 0.14, 1.3 * cote];
    const encoche: V3 = [-3.12, 0.06, 0.34 * cote];
    const milieu: V3 = [-3.0, 0.05, 0];
    f.lame(racine, pointe, encoche, BALEINE.dos, BALEINE.nageoire, HAUT, { queue: [1, 1, 1] });
    f.lame(racine, encoche, milieu, BALEINE.dos, BALEINE.nageoire, HAUT, { queue: [1, 1, 1] });
    // Les nageoires, sous les flancs, penchées vers le bas et l'arrière.
    f.lame([1.2, -0.3, 0.6 * cote], [0.45, -0.36, 0.64 * cote], [0.15, -0.72, 1.5 * cote], BALEINE.nageoire, BALEINE.ventre, [0, 1, 0.3 * cote]);
  }
  // La bosse dorsale.
  f.lame([-1.55, 0.36, 0], [-0.85, 0.5, 0], [-1.4, 0.66, 0], BALEINE.dos, BALEINE.dos, [0, 0, 1]);
  // Le souffle : trois bouffées à huit faces, de plus en plus grosses vers le haut.
  for (let k = 0; k < 3; k++) {
    const c: V3 = [2.3 + (k - 1) * 0.2, 0.95 + k * 0.45, 0];
    const r = 0.22 + k * 0.1;
    const pts: V3[] = [
      [c[0] + r, c[1], c[2]],
      [c[0], c[1], c[2] + r],
      [c[0] - r, c[1], c[2]],
      [c[0], c[1], c[2] - r],
    ];
    const top: V3 = [c[0], c[1] + r * 0.9, c[2]];
    const bas: V3 = [c[0], c[1] - r * 0.8, c[2]];
    for (let i = 0; i < 4; i++) {
      f.tri(pts[i], pts[(i + 1) % 4], top, BALEINE.souffle, { depuis: c }, { souffle: [1, 1, 1] });
      f.tri(pts[i], pts[(i + 1) % 4], bas, BALEINE.souffle, { depuis: c }, { souffle: [1, 1, 1] });
    }
  }
  return f.fin();
}

// ---------- L'oiseau ----------

/** Les oiseaux de la fiche : blancs, ailes grises, le bout des ailes plus sombre. */
export const OISEAU = { corps: 0xeef0ec, aile: 0x9ea8ad, pointe: 0x4e5559, dessous: 0xd8dcda } as const;

/**
 * Un oiseau de mer en facettes, d'un peu plus d'une unité d'envergure : un corps à huit faces, une queue, deux ailes en
 * deux pans (le bras et la main), relevées en V. Battre des ailes, c'est l'écraser en hauteur jusqu'à l'inverser (les
 * ailes descendent) ; le corps est assez plat pour ne pas s'en ressentir.
 */
export function formeDOiseau(): Forme {
  const f = new Atelier();
  const centre: V3 = [0, 0.005, 0.02];
  const bec: V3 = [0, 0, 0.36];
  const croupion: V3 = [0, 0.02, -0.26];
  const flancs: V3[] = [
    [0.08, 0, 0.03],
    [0, 0.07, 0.04],
    [-0.08, 0, 0.03],
    [0, -0.06, 0.03],
  ];
  for (let i = 0; i < 4; i++) {
    const a = flancs[i];
    const b = flancs[(i + 1) % 4];
    f.tri(a, b, bec, OISEAU.corps, { depuis: centre });
    f.tri(a, b, croupion, OISEAU.corps, { depuis: centre });
  }
  f.lame(croupion, [-0.11, 0.02, -0.42], [0.11, 0.02, -0.42], OISEAU.aile, OISEAU.dessous, [0, 1, 0]);
  for (const s of [1, -1]) {
    const avant: V3 = [0.06 * s, 0.02, 0.12];
    const arriere: V3 = [0.06 * s, 0.02, -0.08];
    const coudeAvant: V3 = [0.4 * s, 0.13, 0.08];
    const coudeArriere: V3 = [0.4 * s, 0.13, -0.1];
    const pointe: V3 = [0.8 * s, 0.22, -0.14];
    f.lame(avant, coudeAvant, coudeArriere, OISEAU.aile, OISEAU.dessous, [0, 1, 0]);
    f.lame(avant, coudeArriere, arriere, OISEAU.aile, OISEAU.dessous, [0, 1, 0]);
    f.lame(coudeAvant, pointe, coudeArriere, OISEAU.pointe, OISEAU.dessous, [0, 1, 0]);
  }
  return f.fin();
}

// ---------- Le nuage ----------

/** Les cumulus de la fiche : crème en haut (`#ECEEEE`), bleutés dessous. */
export const NUAGE = { dessus: 0xf3f4f1, milieu: 0xeceeee, dessous: 0xc9d2d7 } as const;

/** Les vingt faces d'un icosaèdre (sommets de ./faune.ts). */
function icosaedre(): { v: V3[]; f: [number, number, number][] } {
  const p = (1 + Math.sqrt(5)) / 2;
  const v: V3[] = [
    [-1, p, 0],
    [1, p, 0],
    [-1, -p, 0],
    [1, -p, 0],
    [0, -1, p],
    [0, 1, p],
    [0, -1, -p],
    [0, 1, -p],
    [p, 0, -1],
    [p, 0, 1],
    [-p, 0, -1],
    [-p, 0, 1],
  ].map((q) => {
    const l = Math.hypot(q[0], q[1], q[2]);
    return [q[0] / l, q[1] / l, q[2] / l] as V3;
  });
  const f: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { v, f };
}

/**
 * Un cumulus en facettes, d'environ 4 unités de long : quatre boules à vingt faces, un peu cabossées, le dessous
 * aplati ; crème en haut, bleuté dessous.
 */
export function formeDeNuage(): Forme {
  const f = new Atelier();
  const { v, f: faces } = icosaedre();
  const boules: [number, number, number, number][] = [
    [-1.35, 0.35, 0.1, 0.8],
    [-0.2, 0.62, -0.1, 1.05],
    [0.95, 0.45, 0.15, 0.85],
    [1.85, 0.3, -0.05, 0.6],
  ];
  const peinte = (y: number) => (y < 0.12 ? NUAGE.dessous : y < 0.75 ? NUAGE.milieu : NUAGE.dessus);
  boules.forEach(([cx, cy, cz, r], b) => {
    const pts = v.map((q, i): V3 => {
      const k = r * (0.88 + 0.24 * hasard(b * 31 + i, i * 7 + 3));
      return [cx + q[0] * k * 1.1, Math.max(0, cy + q[1] * k * 0.72), cz + q[2] * k];
    });
    for (const [i, j, k] of faces) {
      const a = pts[i];
      const bb = pts[j];
      const c = pts[k];
      f.tri(a, bb, c, peinte((a[1] + bb[1] + c[1]) / 3), { depuis: [cx, cy * 0.6, cz] });
    }
  });
  return f.fin();
}

// ---------- L'écume du passage ----------

/**
 * Le liseré d'écume autour de la baleine qui passe, à plat sur l'eau : un anneau ovale et deux traînées derrière la
 * queue. Tourné vers le haut.
 */
export function formeDEcume(): Forme {
  const f = new Atelier();
  const N = 18;
  const HAUT: V3 = [0, 1, 0];
  const pt = (a: number, rx: number, rz: number, dx = 0.2): V3 => [dx + rx * Math.cos(a), 0, rz * Math.sin(a)];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    const p0 = pt(a0, 3.5, 1.15);
    const p1 = pt(a1, 3.5, 1.15);
    const q0 = pt(a0, 3.9, 1.5);
    const q1 = pt(a1, 3.9, 1.5);
    f.tri(p0, q0, q1, BRUME, { dehors: HAUT });
    f.tri(p0, q1, p1, BRUME, { dehors: HAUT });
  }
  for (const s of [1, -1]) f.tri([-3.4, 0, 0.3 * s], [-5.2, 0, 0.9 * s], [-5.0, 0, 0.6 * s], BRUME, { dehors: HAUT });
  return f.fin();
}

// ---------- La pose des baleines ----------

/** La ronde d'une baleine au large : son centre, son rayon, sa phase et sa vitesse. */
export interface Ronde {
  cx: number;
  cy: number;
  r: number;
  phase: number;
  speed: number;
}

/** Où est une baleine, et comment : de quoi placer sa forme (et le liseré d'écume de son passage). */
export interface PoseDeBaleine {
  x: number;
  y: number;
  z: number;
  /** Rotations autour de la verticale (le cap) et de l'axe Z (elle pique ou se cabre). */
  cap: number;
  roulis: number;
  echelle: number;
  /** L'angle de la queue autour de son pivot. */
  queue: number;
  /** La taille du souffle (0 : pas de souffle). */
  souffle: number;
  /** L'opacité du liseré d'écume (0 : pas d'écume). */
  ecume: number;
}

/** Sa ronde au large : elle tourne, monte et descend lentement, et souffle en surface. */
export function poseDeRonde(w: Ronde, t: number): PoseDeBaleine {
  const a = t * w.speed + w.phase;
  const rise = Math.sin(t * 0.45 + w.phase);
  return {
    x: w.cx + Math.cos(a) * w.r,
    y: -0.9 + rise * 0.9,
    z: w.cy + Math.sin(a) * w.r,
    cap: -a - Math.PI / 2,
    roulis: rise * 0.12,
    echelle: 1,
    queue: Math.sin(t * 2.4 + w.phase) * 0.35,
    souffle: rise > 0.7 ? 0.6 + (rise - 0.7) * 2.5 : 0,
    ecume: 0,
  };
}

/** Un passage au large d'une île (le mot de la baleine) : son trajet, son cap, son début (temps de l'horloge). */
export interface Passage {
  route: WhaleRoute;
  heading: number;
  start: number;
}

/**
 * La pose d'une baleine pendant son passage : elle quitte sa ronde en s'enfonçant, glisse le long du trajet, fait
 * surface, souffle une fois, replonge, puis remonte à sa ronde. `fini` : le passage est terminé (sa ronde reprend).
 */
export function poseDePassage(w: Ronde, t: number, p: Passage): { pose: PoseDeBaleine; fini: boolean } {
  const ronde = poseDeRonde(w, t);
  const ph = passPhase(t - p.start);
  if (ph.phase === 'done') return { pose: ronde, fini: true };
  if (ph.phase !== 'swim') return { pose: { ...ronde, y: ronde.y - ph.sink * 3.2, souffle: 0, ecume: 0 }, fini: false };
  const { from, to } = p.route;
  return {
    pose: {
      x: from.x + (to.x - from.x) * ph.u,
      y: -0.15 - ph.depth * 3.05 + (1 - ph.depth) * Math.sin(t * 1.2) * 0.06,
      z: from.y + (to.y - from.y) * ph.u,
      cap: p.heading,
      roulis: ph.pitch,
      echelle: 1.2,
      queue: Math.sin(t * 1.6) * 0.25,
      souffle: ph.spout > 0 ? 0.7 + ph.spout * 0.9 : 0,
      ecume: 0.8 * Math.max(0, 1 - ph.depth * 1.6),
    },
    fini: false,
  };
}
