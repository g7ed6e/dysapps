// Le terrain d'Archipéo (lot R2 de la piste Rendu, docs/conception/cadrage-archipeo.md) : la grille reste, le cube
// disparaît. Code pur, sans Three.js : il lit les cubes du sol (`sol` dans `VoxelCube`, posés par ./terrain.ts) et en
// tire un maillage à facettes, en tableaux typés, que la vue 3D dessine en un ou deux appels de dessin.
//
// - Le champ (`champDuSol`) : une colonne par case de terre, du cube le plus bas (`bas`) au plus haut (`haut`) ; le
//   dessus du sol est au niveau `haut + 1`, comme le dessus du cube. Chaque colonne porte la hauteur de ses quatre
//   coins : ils suivent la moyenne des voisines d'au plus un bloc d'écart, ce qui change une marche d'un bloc en pente
//   douce ; un écart de deux blocs ou plus reste une falaise. Chaque case est coupée en deux triangles, le long de sa
//   diagonale la plus plate (au hasard si les deux se valent) : pas de motif qui répète la grille.
// - Une case où quelque chose est posé (borne, maison, plan, décor, pont, monument) reste plate à sa hauteur : ce qui
//   est construit case par case ne flotte jamais au-dessus d'une pente. Les lacs et la lave restent plats aussi.
// - La côte descend jusqu'à l'eau (`RIVAGE`) et se teinte de sable au bord de la mer ; sous une île en altitude, la
//   roche s'amincit en facettes.
// - Les couleurs viennent de la palette (./palette.ts), nuancées selon l'option (b) retenue au lot R1 : plus sombres
//   vers la mer, de larges taches sur les dessus, des strates de deux blocs sur les falaises.
// - Le toucher (`pickCell`) et la marche (`hauteurDuSol`, `piedsSur`) lisent le même champ : un point touché redevient
//   une case, et le bonhomme reste posé sur la surface qu'on voit.
import type { VoxelCube } from '../Voxel';
import { AMBIENCE, mixColor } from './daylight';
import { ALTITUDE, type ArchipelagoId } from './map';
import { cielDe, couleurDeMatiere, MATIERES, type Couleur } from './palette';
import type { TextureKind } from './pixels';
import { bruit, FROID, FROID_SOUS } from './style';
import type { Cell } from './view';

/** Le niveau de l'eau dans la vue 3D (`WATER_LEVEL` de three/WorldCanvas.tsx). */
export const NIVEAU_EAU = -0.45;
/** Là où la côte d'une île au niveau de la mer rejoint l'eau : juste au-dessus. */
export const RIVAGE = -0.25;
/** Sous l'eau, rien ne se voit : les falaises s'arrêtent là (sauf dans le ciel, où il n'y a pas d'eau). */
export const PLANCHER = -1;
/** Les taches sur les dessus (option b, redosée sur les facettes) : ± 8 %, sur 9 blocs environ. */
export const TACHES = 0.08;
/** Les strates des falaises : ± 5 %, par tranche de deux blocs, sur les côtés seulement. */
export const STRATES = 0.05;
/** La part de sable sur la frange de la côte, au bord de la mer. */
export const FRANGE = 0.55;
/** Une île fermée : les couleurs délavées vers le gris clair (comme three/surface.ts). */
const DELAVE: [Couleur, number] = [0xb8bcc0, 0.55];

/** Les quatre coins d'une case, dans l'ordre : (x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1). */
const COINS: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/** Une colonne de sol : une case de terre, du cube le plus bas au plus haut. */
export interface Colonne {
  x: number;
  y: number;
  /** Le z du cube du dessus ; le dessus du sol est au niveau `haut + 1`. */
  haut: number;
  /** Le z du cube le plus bas ; le dessous est au niveau `bas`. */
  bas: number;
  /** La matière de chaque cube, de `bas` à `haut` (une texture, ou une couleur « #rrggbb »). */
  matieres: string[];
  /** Île fermée : couleurs délavées. */
  muted: boolean;
  /** Eau ou lave : reste plate. */
  liquide: boolean;
  /** Quelque chose est posé dessus : reste plate à sa hauteur. */
  fixe: boolean;
  /** La hauteur du dessus aux quatre coins (voir `COINS`). */
  coins: [number, number, number, number];
  /** La diagonale qui coupe le dessus : 0 du coin 0 au coin 2, 1 du coin 1 au coin 3. */
  diagonale: 0 | 1;
  /** La hauteur du dessous aux quatre coins, et sa diagonale. */
  coinsBas: [number, number, number, number];
  diagonaleBas: 0 | 1;
  /** Le coin touche la mer (aucune colonne voisine). */
  rivage: [boolean, boolean, boolean, boolean];
}

export interface ChampDuSol {
  archipel: ArchipelagoId;
  colonnes: Colonne[];
  /** La case → indice dans `colonnes`. */
  index: Map<number, number>;
  /** Le plus bas où l'on dessine une falaise (−∞ dans le ciel). */
  plancher: number;
}

/** La clé d'une case (les coordonnées tiennent largement dans ± 16 000). */
const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** La colonne d'une case, ou `undefined` dans l'eau. */
export function colonneEn(champ: ChampDuSol, x: number, y: number): Colonne | undefined {
  const i = champ.index.get(cle(x, y));
  return i === undefined ? undefined : champ.colonnes[i];
}

/**
 * Le champ du sol d'un archipel : ses colonnes et la hauteur de leurs coins. `sol` : les cubes du sol (`c.sol`), `autres` :
 * tout le reste (ce qui est posé dessus fige la case).
 */
export function champDuSol(a: ArchipelagoId, sol: VoxelCube[], autres: VoxelCube[] = []): ChampDuSol {
  const cubes = new Map<number, VoxelCube[]>();
  for (const c of sol) {
    const k = cle(c.x, c.y);
    const list = cubes.get(k);
    if (list) list.push(c);
    else cubes.set(k, [c]);
  }
  const colonnes: Colonne[] = [];
  const index = new Map<number, number>();
  for (const [k, list] of cubes) {
    list.sort((p, q) => p.z - q.z);
    const bas = list[0].z;
    const top = list[list.length - 1];
    const byZ = new Map(list.map((c) => [c.z, c]));
    const matieres: string[] = [];
    // Un trou dans la colonne (il n'y en a pas aujourd'hui) prend la matière du cube du dessous.
    for (let z = bas; z <= top.z; z++) matieres.push(matiereDe(byZ.get(z) ?? list.find((c) => c.z <= z)!));
    index.set(k, colonnes.length);
    colonnes.push({
      x: top.x,
      y: top.y,
      haut: top.z,
      bas,
      matieres,
      muted: Boolean(top.muted),
      liquide: top.texture === 'eau' || top.texture === 'lave',
      fixe: false,
      coins: [0, 0, 0, 0],
      diagonale: 0,
      coinsBas: [0, 0, 0, 0],
      diagonaleBas: 0,
      rivage: [false, false, false, false],
    });
  }
  const champ: ChampDuSol = { archipel: a, colonnes, index, plancher: AMBIENCE[a].sky ? -Infinity : PLANCHER };
  // Ce qui est posé juste sur le sol fige la case (fantômes compris : le plan à construire reste sur du plat).
  for (const c of autres) {
    const col = colonneEn(champ, c.x, c.y);
    if (col && c.z === col.haut + 1) col.fixe = true;
  }
  const auNiveauDeLaMer = !AMBIENCE[a].sky;
  for (const col of colonnes) {
    const L = col.haut + 1;
    const B = col.bas;
    COINS.forEach(([ox, oy], k) => {
      const px = col.x + ox;
      const py = col.y + oy;
      // Les quatre cases autour du coin.
      const voisines = [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)];
      const mer = voisines.some((v) => !v);
      col.rivage[k] = mer;
      // Le dessus.
      let h: number;
      if (col.fixe || col.liquide) h = L;
      // La côte basse d'une île au niveau de la mer descend jusqu'à l'eau ; plus haute, elle s'arrondit d'un bloc.
      else if (mer) h = auNiveauDeLaMer && L <= 2 ? RIVAGE : L - 1;
      else {
        let s = 0;
        let n = 0;
        for (const v of voisines) {
          const lv = v!.haut + 1;
          if (Math.abs(lv - L) > 1) continue;
          s += lv;
          n++;
        }
        h = s / n;
      }
      // Le dessous : il remonte vers le bord et vers les voisines moins profondes, d'un bloc au plus.
      let b: number;
      if (mer) b = B + 1;
      else {
        let s = 0;
        let n = 0;
        for (const v of voisines) {
          if (Math.abs(v!.bas - B) > 1) continue;
          s += v!.bas;
          n++;
        }
        b = s / n;
      }
      col.coins[k] = h;
      col.coinsBas[k] = Math.min(b, h);
    });
    col.diagonale = diagonaleDe(col.coins, col.x, col.y);
    col.diagonaleBas = diagonaleDe(col.coinsBas, col.x, col.y + 7919);
  }
  return champ;
}

function matiereDe(c: VoxelCube): string {
  return c.texture && c.texture in MATIERES ? c.texture : c.color;
}

/**
 * La signature d'un champ : la même tant que le sol ne change pas de forme ni de couleur. Poser un bloc sur un plan (sa
 * case est déjà figée par le fantôme) ne refait pas le maillage.
 */
export function signatureDuChamp(champ: ChampDuSol): string {
  return champ.archipel + champ.colonnes.map((c) => `|${c.x},${c.y},${c.haut},${c.bas},${c.fixe ? 1 : 0}${c.muted ? 1 : 0}${c.matieres.join(',')}`).join('');
}

// ---------- La surface : hauteur en un point ----------

/** Un hasard reproductible par case, de 0 à 1. */
function hasard(x: number, y: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** La diagonale qui coupe une case : la plus plate (le pli le plus doux), au hasard si les deux se valent. */
function diagonaleDe(h: number[], x: number, y: number): 0 | 1 {
  const d02 = Math.abs(h[0] - h[2]);
  const d13 = Math.abs(h[1] - h[3]);
  if (Math.abs(d02 - d13) > 1e-6) return d02 < d13 ? 0 : 1;
  return hasard(x, y) < 0.5 ? 0 : 1;
}

/** Les deux triangles d'une case, en indices de coins, selon sa diagonale. */
export function trianglesDeLaCase(diagonale: 0 | 1): [[number, number, number], [number, number, number]] {
  return diagonale === 0
    ? [
        [0, 1, 2],
        [0, 2, 3],
      ]
    : [
        [0, 1, 3],
        [1, 2, 3],
      ];
}

/** La hauteur d'une case coupée en deux triangles, en (u, v) de 0 à 1 dans la case. */
function dansLaCase(h: number[], diagonale: 0 | 1, u: number, v: number): number {
  // Coins : 0 (0, 0), 1 (1, 0), 2 (1, 1), 3 (0, 1).
  if (diagonale === 0) return u >= v ? h[0] + u * (h[1] - h[0]) + v * (h[2] - h[1]) : h[0] + v * (h[3] - h[0]) + u * (h[2] - h[3]);
  return u + v <= 1 ? h[0] + u * (h[1] - h[0]) + v * (h[3] - h[0]) : h[2] + (1 - u) * (h[3] - h[2]) + (1 - v) * (h[1] - h[2]);
}

/** La hauteur du dessus du sol en un point de la grille (x, y continus), ou `null` au-dessus de l'eau. */
export function hauteurDuSol(champ: ChampDuSol, x: number, y: number): number | null {
  const col = colonneEn(champ, Math.floor(x), Math.floor(y));
  if (!col) return null;
  return dansLaCase(col.coins, col.diagonale, x - col.x, y - col.y);
}

/**
 * La hauteur des pieds d'un marcheur (bonhomme, créature) en (x, y), quand son itinéraire le met à `z` : posé sur la
 * surface du sol, jamais dedans. Au-dessus de l'eau, ou bien plus haut que le sol (un pont, une pierre de gué, le
 * bord d'une falaise qu'il descend), il garde la hauteur de son itinéraire ; entre les deux, il passe en douceur.
 */
export function piedsSur(champ: ChampDuSol | null, x: number, y: number, z: number): number {
  if (!champ) return z;
  const s = hauteurDuSol(champ, x, y);
  if (s === null) return z;
  const w = smooth(clamp((z - s - 0.5) / 0.5, 0, 1));
  return s + Math.max(0, z - s) * w;
}

// ---------- Le toucher ----------

/**
 * La case touchée sur le terrain : le point touché (repère Three : X = x, Y = hauteur, Z = y) et la normale de la face.
 * `cell` : le cube du sol touché, `next` : la case devant la face (au-dessus d'un dessus, à côté d'une falaise, dessous
 * pour le dessous d'une île flottante). `null` si le point n'est sur aucune colonne.
 */
export function pickCell(
  champ: ChampDuSol,
  point: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number },
): { cell: Cell; next: Cell } | null {
  const e = 1e-3;
  // Les colonnes candidates : celle sous le point, et ses voisines si le point tombe sur une arête.
  const candidates = (px: number, pz: number): Colonne[] => {
    const out: Colonne[] = [];
    for (const x of new Set([Math.floor(px - e), Math.floor(px + e)]))
      for (const y of new Set([Math.floor(pz - e), Math.floor(pz + e)])) {
        const c = colonneEn(champ, x, y);
        if (c) out.push(c);
      }
    return out;
  };
  // Les falaises sont verticales : une normale qui monte, même un peu, est celle d'un dessus (d'un dessous si elle descend).
  if (Math.abs(normal.y) > 0.01) {
    // Un dessus (ou le dessous d'une île) : la colonne dont la surface passe par le point.
    const dessus = normal.y > 0;
    let best: Colonne | null = null;
    let bestD = Infinity;
    for (const c of candidates(point.x, point.z)) {
      const u = clamp(point.x - c.x, 0, 1);
      const v = clamp(point.z - c.y, 0, 1);
      const h = dessus ? dansLaCase(c.coins, c.diagonale, u, v) : dansLaCase(c.coinsBas, c.diagonaleBas, u, v);
      const d = Math.abs(h - point.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (!best) return null;
    const z = dessus ? best.haut : best.bas;
    return { cell: { x: best.x, y: best.y, z }, next: { x: best.x, y: best.y, z: dessus ? z + 1 : z - 1 } };
  }
  // Une falaise : la colonne derrière la face, à la hauteur du point.
  const len = Math.hypot(normal.x, normal.z) || 1;
  const nx = normal.x / len;
  const nz = normal.z / len;
  const dx = Math.abs(nx) >= Math.abs(nz) ? Math.sign(nx) : 0;
  const dy = dx === 0 ? Math.sign(nz) : 0;
  const inside = { x: point.x - dx * 0.25, z: point.z - dy * 0.25 };
  const list = candidates(inside.x, inside.z).filter((c) => point.y >= c.bas - e && point.y <= c.haut + 1 + e);
  const c = list[0] ?? candidates(inside.x, inside.z)[0];
  if (!c) return null;
  const z = clamp(Math.floor(point.y), c.bas, c.haut);
  return { cell: { x: c.x, y: c.y, z }, next: { x: c.x + dx, y: c.y + dy, z } };
}

// ---------- Le maillage ----------

/** Un maillage de triangles indépendants (facettes) : trois sommets par triangle. */
export interface Facettes {
  /** Positions, repère Three (X = x, Y = hauteur, Z = y). */
  positions: Float32Array;
  /** Normales, une par facette, répétée sur ses trois sommets. */
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js. */
  colors: Float32Array;
  /** Pour chaque triangle, l'indice de sa colonne dans le champ (les tests vérifient le toucher avec). */
  colonnes: Int32Array;
}

export interface MaillageDuSol {
  /** Tout le sol, en un seul appel de dessin. */
  sol: Facettes;
  /** Ce qui brille (la lave), avec sa lueur : un second appel de dessin, seulement s'il y en a. */
  lumineux: Facettes;
}

/** Nombre de triangles d'un maillage du sol. */
export function trianglesDuSol(m: MaillageDuSol): number {
  return m.sol.colonnes.length + m.lumineux.colonnes.length;
}

/** Appels de dessin d'un maillage du sol : un, deux s'il y a de la lave. */
export function appelsDuSol(m: MaillageDuSol): number {
  return (m.sol.colonnes.length ? 1 : 0) + (m.lumineux.colonnes.length ? 1 : 0);
}

type V3 = [number, number, number];
type RGB = [number, number, number];

/** Des facettes en construction : des tableaux typés qui grandissent au besoin (pas de copie finale ni de déchets). */
class Tampon {
  private pos = new Float32Array(9 * 4096);
  private nor = new Float32Array(9 * 4096);
  private col = new Float32Array(9 * 4096);
  private own = new Int32Array(4096);
  private n = 0;
  private grow(): void {
    const up = <T extends Float32Array | Int32Array>(a: T): T => {
      const b = new (a.constructor as { new (n: number): T })(a.length * 2);
      b.set(a);
      return b;
    };
    this.pos = up(this.pos);
    this.nor = up(this.nor);
    this.col = up(this.col);
    this.own = up(this.own);
  }
  /** Un triangle (a, b, c), ses couleurs, et la direction vers laquelle il doit regarder. */
  triangle(a: V3, b: V3, c: V3, ca: RGB, cb: RGB, cc: RGB, attendue: V3, colonne: number): void {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-9) return;
    // La face regarde vers l'extérieur (sens inverse des aiguilles d'une montre vu de dehors), sinon on la retourne.
    if (nx * attendue[0] + ny * attendue[1] + nz * attendue[2] < 0) {
      [b, c] = [c, b];
      [cb, cc] = [cc, cb];
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    if ((this.n + 1) * 9 > this.pos.length) this.grow();
    const o = this.n * 9;
    const pts = [a, b, c];
    const cols = [ca, cb, cc];
    for (let k = 0; k < 3; k++) {
      this.pos[o + k * 3] = pts[k][0];
      this.pos[o + k * 3 + 1] = pts[k][1];
      this.pos[o + k * 3 + 2] = pts[k][2];
      this.nor[o + k * 3] = nx / len;
      this.nor[o + k * 3 + 1] = ny / len;
      this.nor[o + k * 3 + 2] = nz / len;
      this.col[o + k * 3] = cols[k][0];
      this.col[o + k * 3 + 1] = cols[k][1];
      this.col[o + k * 3 + 2] = cols[k][2];
    }
    this.own[this.n] = colonne;
    this.n++;
  }
  fin(): Facettes {
    return {
      positions: this.pos.slice(0, this.n * 9),
      normals: this.nor.slice(0, this.n * 9),
      colors: this.col.slice(0, this.n * 9),
      colonnes: this.own.slice(0, this.n),
    };
  }
}

/** sRGB (0..1) vers l'espace linéaire de Three.js, par une table (4 096 pas : sous la précision d'un écran). */
const LINEAIRE = Float32Array.from({ length: 4097 }, (_, i) => {
  const v = i / 4096;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
});
const lineaire = (v: number) => LINEAIRE[Math.round(clamp(v, 0, 1) * 4096)];

/** La nuance d'un sommet (option b sur les facettes) : plus sombre vers la mer, des taches sur les dessus. */
export function nuanceDuSol(x: number, y: number, z: number, dessus: boolean, altitude: number): number {
  const hauteur = 0.82 + 0.2 * smooth(clamp((y - altitude + 1) / 12, 0, 1));
  const taches = dessus ? 1 + TACHES * (bruit(x / 9, z / 9) * 2 - 1) : 1;
  return clamp(hauteur * taches, 0.74, 1.1);
}

/** La strate d'un cube de falaise (z entier) : une tranche de deux blocs sur deux plus claire. */
export function strate(z: number): number {
  return Math.floor(z / 2) % 2 === 0 ? 1 + STRATES : 1 - STRATES;
}

/** Les options du maillage : le style de surface (`a` : aplats, sans nuance ; `b` : la nuance retenue). */
export interface OptionsDuSol {
  style?: 'a' | 'b';
}

/**
 * Le maillage à facettes du sol d'un champ : les dessus en deux triangles par case, les falaises coupées en strates, le dessous des îles flottantes. Les couleurs de la palette de
 * l'archipel, de jour : la nuit vient de la lumière de la scène, comme pour les blocs.
 */
export function landMesh(champ: ChampDuSol, options: OptionsDuSol = {}): MaillageDuSol {
  const a = champ.archipel;
  const style = options.style ?? 'b';
  const altitude = ALTITUDE[a];
  const froid = cielDe(a, 1).ambianceSol;
  const sable = couleurDeMatiere(a, 'sable').dessus;
  const auNiveauDeLaMer = !AMBIENCE[a].sky;
  const sol = new Tampon();
  const lumineux = new Tampon();
  const tampon = (m: string) => (m === 'lave' ? lumineux : sol);

  const facesVues = new Map<string, { dessus: Couleur; cote: Couleur }>();
  const faces = (m: string, muted: boolean): { dessus: Couleur; cote: Couleur } => {
    const k = muted ? `~${m}` : m;
    let f = facesVues.get(k);
    if (!f) {
      f = m in MATIERES ? couleurDeMatiere(a, m as TextureKind) : { dessus: parseInt(m.slice(1), 16), cote: parseInt(m.slice(1), 16) };
      if (muted) f = { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) };
      facesVues.set(k, f);
    }
    return f;
  };
  const dessusDe = (c: Colonne) => faces(c.matieres[c.matieres.length - 1], c.muted).dessus;
  /** La couleur finale d'un sommet (linéaire) : la couleur de la palette, nuancée, refroidie près de l'eau. */
  const peint = (c: Couleur, p: V3, dessus: boolean, facteur = 1): RGB => {
    let k = 1;
    let f = 0;
    if (style === 'b') {
      k = nuanceDuSol(p[0], p[1], p[2], dessus, altitude) * facteur;
      f = FROID * clamp((FROID_SOUS - p[1]) / 1.5, 0, 1);
    }
    const base = f > 0 ? mixColor(c, froid, f) : c;
    return [lineaire((((base >> 16) & 255) / 255) * k), lineaire((((base >> 8) & 255) / 255) * k), lineaire(((base & 255) / 255) * k)];
  };
  /** La couleur d'un coin : celle des cases qui s'y touchent (au plus un bloc d'écart), mêlées ; pas de damier. */
  const coinVu = new Map<number, Couleur>();
  const couleurCoin = (col: Colonne, k: number): Couleur => {
    if (col.liquide) return dessusDe(col);
    const px = col.x + COINS[k][0];
    const py = col.y + COINS[k][1];
    const key = cle(px, py) * 16 + (col.haut & 15) * 2 + (col.muted ? 1 : 0);
    const known = coinVu.get(key);
    if (known !== undefined) return known;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const v of [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)]) {
      if (!v || v.liquide || Math.abs(v.haut - col.haut) > 1) continue;
      const c = dessusDe(v);
      r += (c >> 16) & 255;
      g += (c >> 8) & 255;
      b += c & 255;
      n++;
    }
    let c = n ? (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n) : dessusDe(col);
    // La frange de sable, au bord de la mer.
    if (auNiveauDeLaMer && col.rivage[k] && col.coins[k] <= 0) c = mixColor(c, col.muted ? mixColor(sable, DELAVE[0], DELAVE[1]) : sable, FRANGE);
    coinVu.set(key, c);
    return c;
  };

  const HAUT: V3 = [0, 1, 0];
  const BAS: V3 = [0, -1, 0];
  const COTES: [number, number, number, number][] = [
    [1, 0, 1, 2],
    [-1, 0, 0, 3],
    [0, 1, 3, 2],
    [0, -1, 0, 1],
  ];

  champ.colonnes.forEach((col, i) => {
    const top = col.matieres[col.matieres.length - 1];
    const t = tampon(top);
    // ---- Le dessus : deux triangles, le long de la diagonale de la case.
    const P = (k: number): V3 => [col.x + COINS[k][0], col.coins[k], col.y + COINS[k][1]];
    const p = [P(0), P(1), P(2), P(3)];
    const c = p.map((q, k) => peint(couleurCoin(col, k), q, true));
    for (const [i0, i1, i2] of trianglesDeLaCase(col.diagonale)) t.triangle(p[i0], p[i1], p[i2], c[i0], c[i1], c[i2], HAUT, i);

    // ---- Les falaises, sur les quatre côtés : ce que la voisine ne couvre pas, coupé en strates.
    const matiere = (zz: number) => col.matieres[clamp(zz - col.bas, 0, col.matieres.length - 1)];
    for (const [dx, dy, k0, k1] of COTES) {
      const e0: [number, number] = [col.x + COINS[k0][0], col.y + COINS[k0][1]];
      const e1: [number, number] = [col.x + COINS[k1][0], col.y + COINS[k1][1]];
      const t0 = col.coins[k0];
      const t1 = col.coins[k1];
      const b0 = Math.max(col.coinsBas[k0], champ.plancher);
      const b1 = Math.max(col.coinsBas[k1], champ.plancher);
      const v = colonneEn(champ, col.x + dx, col.y + dy);
      // Chaque morceau de paroi : sa ligne du bas et sa ligne du haut, aux deux bouts du côté.
      const morceaux: [number, number, number, number][] = [];
      if (!v) morceaux.push([b0, b1, t0, t1]);
      else {
        const j0 = coinDe(v, e0);
        const j1 = coinDe(v, e1);
        // Au-dessus de la voisine, et sous elle (sous une île flottante qui s'amincit).
        morceaux.push([Math.max(b0, v.coins[j0]), Math.max(b1, v.coins[j1]), t0, t1]);
        morceaux.push([b0, b1, Math.min(t0, Math.max(v.coinsBas[j0], champ.plancher)), Math.min(t1, Math.max(v.coinsBas[j1], champ.plancher))]);
      }
      for (const [lo0, lo1, hi0, hi1] of morceaux) {
        const d0 = hi0 - lo0;
        const d1 = hi1 - lo1;
        if (d0 <= 1e-6 && d1 <= 1e-6) continue;
        // Le polygone dans le plan de la paroi (s de 0 à 1 le long du côté, y la hauteur) ; si le haut et le bas se
        // croisent, un triangle jusqu'au croisement.
        let poly: [number, number][];
        if (d0 > 1e-6 && d1 > 1e-6)
          poly = [
            [0, lo0],
            [1, lo1],
            [1, hi1],
            [0, hi0],
          ];
        else {
          const k = d0 / (d0 - d1);
          const x: [number, number] = [k, lo0 + (lo1 - lo0) * k];
          poly = d0 > 0 ? [[0, lo0], x, [0, hi0]] : [x, [1, lo1], [1, hi1]];
        }
        const ys = poly.map((q) => q[1]);
        const lo = Math.min(...ys);
        const hi = Math.max(...ys);
        // Les tranches : une par suite de cubes de même matière et de même strate. La première et la dernière prennent
        // aussi ce qui dépasse la colonne (un coin tiré vers une voisine).
        const zs = clamp(Math.floor(lo), col.bas, col.haut);
        const ze = clamp(Math.ceil(hi) - 1, col.bas, col.haut);
        let z = zs;
        while (z <= ze) {
          let z1 = z;
          while (z1 + 1 <= ze && matiere(z1 + 1) === matiere(z) && Math.floor((z1 + 1) / 2) === Math.floor(z / 2)) z1++;
          const tranche = zs === ze ? poly : clip(poly, z === zs ? -Infinity : z, z1 === ze ? Infinity : z1 + 1);
          if (tranche.length >= 3) {
            const m = matiere(z);
            const cote = faces(m, col.muted).cote;
            const f = style === 'a' ? 1 : strate(z);
            const pts = tranche.map(([s, y]): V3 => [e0[0] + (e1[0] - e0[0]) * s, y, e0[1] + (e1[1] - e0[1]) * s]);
            const cs = pts.map((q) => peint(cote, q, false, f));
            for (let j = 1; j + 1 < pts.length; j++) tampon(m).triangle(pts[0], pts[j], pts[j + 1], cs[0], cs[j], cs[j + 1], [dx, 0, dy], i);
          }
          z = z1 + 1;
        }
      }
    }

    // ---- Le dessous : seulement au-dessus du plancher (sous une île en altitude).
    if (Math.max(...col.coinsBas) > champ.plancher) {
      const m = col.matieres[0];
      const cote = faces(m, col.muted).cote;
      const f = style === 'a' ? 1 : strate(col.bas);
      const q = [0, 1, 2, 3].map((k): V3 => [col.x + COINS[k][0], col.coinsBas[k], col.y + COINS[k][1]]);
      const cq = q.map((pt) => peint(cote, pt, false, f));
      for (const [i0, i1, i2] of trianglesDeLaCase(col.diagonaleBas)) {
        // La caméra reste toujours au-dessus des îles, à 17° au moins : une facette tournée droit vers le bas ne se
        // voit jamais, on ne la dessine pas. Celles qui penchent font la roche facettée sous l'île.
        if (penteVersLeBas(q[i0], q[i1], q[i2]) > DESSOUS_CACHE) continue;
        tampon(m).triangle(q[i0], q[i1], q[i2], cq[i0], cq[i1], cq[i2], BAS, i);
      }
    }
  });
  return { sol: sol.fin(), lumineux: lumineux.fin() };
}

/** Au-delà de ce cosinus (moins de 14° de la verticale), une facette du dessous regarde trop bas pour être vue. */
export const DESSOUS_CACHE = 0.97;

/** Le cosinus de l'angle entre une facette et la verticale vers le bas (1 : elle regarde droit vers le bas). */
function penteVersLeBas(a: V3, b: V3, c: V3): number {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]);
  return len < 1e-9 ? 1 : Math.abs(n[1]) / len;
}

/** L'indice du coin d'une colonne qui tombe sur un point de la grille. */
function coinDe(col: Colonne, [px, py]: [number, number]): number {
  return COINS.findIndex(([ox, oy]) => col.x + ox === px && col.y + oy === py);
}

/** Garde d'un polygone convexe (s, y) la tranche entre deux hauteurs (Sutherland–Hodgman, deux coupes). */
function clip(poly: [number, number][], y0: number, y1: number): [number, number][] {
  let out = poly;
  for (const [sign, h] of [
    [1, y0],
    [-1, y1],
  ] as [number, number][]) {
    if (!Number.isFinite(h)) continue;
    const input = out;
    out = [];
    // Dedans : sign · (y − h) ≥ 0.
    for (let i = 0; i < input.length; i++) {
      const p = input[i];
      const q = input[(i + 1) % input.length];
      const fp = sign * (p[1] - h);
      const fq = sign * (q[1] - h);
      if (fp >= 0) out.push(p);
      if (fp >= 0 !== fq >= 0) {
        const k = fp / (fp - fq);
        out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]);
      }
    }
    if (out.length < 3) return [];
  }
  return out;
}
