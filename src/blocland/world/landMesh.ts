// Le terrain d'Archipéo (lot R2 de la piste Rendu, docs/conception/cadrage-archipeo.md) : la grille reste, le cube
// disparaît. Code pur, sans Three.js : il lit les cubes du sol (`sol` dans `VoxelCube`, posés par ./terrain.ts) et en
// tire un maillage à facettes, en tableaux typés, que la vue 3D dessine en un ou deux appels de dessin.
//
// - Le champ (`champDuSol`) : une colonne par case de terre, du cube le plus bas (`bas`) au plus haut (`haut`) ; le
//   dessus du sol est au niveau `haut + 1`, comme le dessus du cube. Chaque colonne porte la hauteur de ses quatre
//   coins : ils suivent la moyenne des voisines d'au plus un bloc d'écart, ce qui change une marche d'un bloc en pente
//   douce ; un écart de deux blocs ou plus reste une falaise. Chaque case est coupée en deux triangles, le long de sa
//   diagonale la plus plate (au hasard si les deux se valent) : pas de motif qui répète la grille.
// - Deux dessus voisins qui tranchent, d'un bloc d'écart (une dalle claire contre la roche) : le plus bas reste plat
//   jusqu'à son bord, le plus haut descend jusqu'à lui (le rebord plat de la dalle, lot R4).
// - Une case où quelque chose est posé (borne, maison, plan, pont, monument), ou contre laquelle s'appuie ce qui est
//   au-dessus de l'eau (un pont, une cascade), reste plate à sa hauteur : rien ne flotte au-dessus d'une pente. Les lacs
//   et la lave restent plats aussi. Une case où seul un décor est posé descend au bas de la pente si son socle en
//   dépasserait de plus d'un quart de bloc, et son décor avec elle (`poseDuDecor`).
// - La côte descend jusqu'à l'eau (`RIVAGE`), en sable pur sur la moitié côté mer ; sous une île en altitude, la
//   roche s'amincit en facettes ; au pied d'une haute colonne de roche qui plonge dans la mer, un liseré d'éboulis.
// - Les couleurs viennent de la palette (./palette.ts), nuancées selon l'option (b) retenue au lot R1 : plus sombres
//   vers la mer, de larges taches sur les dessus, des strates sur les falaises ; une pente à l'ombre n'est jamais
//   beaucoup plus sombre que le dessus voisin.
// Le code reste générique : il ne connaît ni les îles ni les archipels, seulement les cubes du sol et ce qui est posé
// dessus (une silhouette propre à chaque archipel viendra des cubes, pas d'ici).
// - Le toucher (`pickCell`) et la marche (`hauteurDuSol`, `piedsSur`) lisent le même champ : un point touché redevient
//   une case, et le bonhomme reste posé sur la surface qu'on voit.
import type { VoxelCube } from './cube';
import { AMBIENCE, mixColor } from './daylight';
import { ALTITUDE, type ArchipelagoId, type Ground } from './map';
import { cielDe, couleurDeMatiere, couleurDuSol, laveQuiBrille, MATIERES, SOLEIL_DIRECTION, SOLS, type Couleur } from './palette';
import type { TextureKind } from './pixels';
import { decorPose } from './decor';
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
/** Les strates des falaises : ± 5 %, sur les côtés seulement ; ± 3 % sur une paroi de plus de 4 blocs de haut. */
export const STRATES = 0.05;
export const STRATES_HAUTES = 0.03;
/** Au-delà de cette hauteur (en blocs), une paroi prend les strates discrètes. */
export const PAROI_HAUTE = 4;
/**
 * La frange de sable, au bord de la mer : la part de la case côté mer en sable pur (0,55 : un peu plus que la dernière
 * demi-case), puis le fondu vers le dessus, sur au plus `FONDU` de case.
 */
export const FRANGE = 0.55;
export const FONDU = 0.3;
/**
 * Deux dessus voisins de couleurs trop différentes (plus que ça, en distance entre couleurs 0..255) ne se fondent pas
 * d'un coin à l'autre, sur deux cases : chacun garde sa couleur et le passage se fait au bord, sur `FONDU` de case de
 * chaque côté (une dalle claire contre la roche, comme le sable au rivage). Les voisins proches (herbe et mousse, galet
 * et pierre) se fondent toujours d'un coin à l'autre.
 */
export const CONTRASTE = 100;
/** Les bornes de la nuance des pentes et des parois (option b). */
export const NUANCE_SOL: [number, number] = [0.82, 1.08];
/** Une pente à l'ombre reste au moins à cette part de la lumière d'un dessus plat. */
export const PENTE_OMBRE = 0.85;
/** Une case où seul un décor est posé descend si son socle dépasserait la pente de plus que ça. */
export const SOCLE_MAX = 0.25;
/** Une colonne dont la paroi plonge dans la mer de plus haut que ça (en blocs) prend un pied d'éboulis. */
export const COLONNE_HAUTE = 3;
/** La hauteur des éboulis du pied, au-dessus de `RIVAGE`. */
export const EBOULIS = 0.45;
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
  /** Quelque chose est posé dessus (ou s'appuie contre) : reste plate. */
  fixe: boolean;
  /** Une case où seul un décor est posé, descendue au bas de la pente : de combien (0 sinon). */
  abaissement: number;
  /** L'île de la colonne (l'étiquette de ses cubes) : l'épaisseur des strates en dépend. */
  ile: string;
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

/** Une case d'éboulis au pied d'une haute colonne de roche, dans l'eau. */
export interface Pied {
  x: number;
  y: number;
  /** La colonne à laquelle il appartient (le toucher y renvoie). */
  colonne: number;
  coins: [number, number, number, number];
  milieu: number;
}

export interface ChampDuSol {
  archipel: ArchipelagoId;
  colonnes: Colonne[];
  /** La case → indice dans `colonnes`. */
  index: Map<number, number>;
  /** Le plus bas où l'on dessine une falaise (−∞ dans le ciel). */
  plancher: number;
  /** Les éboulis au pied des hautes colonnes, et leur index par case. */
  pieds: Pied[];
  indexPieds: Map<number, number>;
  /** Les décors descendus avec leur case : identifiant du décor → de combien. */
  decorsAbaisses: Map<string, number>;
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
      abaissement: 0,
      ile: top.tag ?? '',
      coins: [0, 0, 0, 0],
      diagonale: 0,
      coinsBas: [0, 0, 0, 0],
      diagonaleBas: 0,
      rivage: [false, false, false, false],
    });
  }
  const champ: ChampDuSol = {
    archipel: a,
    colonnes,
    index,
    plancher: AMBIENCE[a].sky ? -Infinity : PLANCHER,
    pieds: [],
    indexPieds: new Map(),
    decorsAbaisses: new Map(),
  };
  // Ce qui est posé juste sur le sol fige la case (fantômes compris : le plan à construire reste sur du plat). Ce qui,
  // au-dessus de l'eau, s'appuie contre une colonne à la hauteur de son dessus (le bout d'un pont, le haut d'une
  // cascade) la fige aussi : la côte ne se dérobe pas sous lui.
  const decors = new Map<Colonne, Set<string>>();
  const autreChose = new Set<Colonne>();
  const adossees = new Set<Colonne>();
  const occupees = new Set<number>();
  for (const c of autres) {
    const col = colonneEn(champ, c.x, c.y);
    if (!col) {
      occupees.add(cle(c.x, c.y));
      for (const [dx, dy] of COTES4) {
        const v = colonneEn(champ, c.x + dx, c.y + dy);
        if (v && c.z === v.haut) {
          v.fixe = true;
          adossees.add(v);
        }
      }
      continue;
    }
    if (c.z !== col.haut + 1) continue;
    col.fixe = true;
    if (decorPose(c.decor) && !c.ghost) {
      const set = decors.get(col) ?? new Set<string>();
      set.add(c.decor!);
      decors.set(col, set);
    } else autreChose.add(col);
  }
  const auNiveauDeLaMer = !AMBIENCE[a].sky;
  // Deux dessus voisins qui tranchent (une dalle claire contre la roche, voir `CONTRASTE`) : la couleur de leur dessus,
  // de jour, sans le délavé (la forme ne change pas quand une île s'ouvre). Le sable a sa frange, le liquide reste plat.
  const dessus = new Map<Colonne, Couleur>();
  const dessusDe = (c: Colonne): Couleur => {
    let d = dessus.get(c);
    if (d === undefined) {
      const m = c.matieres[c.matieres.length - 1];
      const g = solNomme(m);
      d = m in MATIERES ? couleurDeMatiere(a, m as TextureKind).dessus : g ? couleurDuSol(a, g).dessus : parseInt(m.slice(1), 16);
      dessus.set(c, d);
    }
    return d;
  };
  const sableOuLiquide = (c: Colonne) => c.liquide || c.matieres[c.matieres.length - 1] === 'sable';
  const tranchent = (p: Colonne, q: Colonne) => !sableOuLiquide(p) && !sableOuLiquide(q) && ecartDeCouleur(dessusDe(p), dessusDe(q)) > CONTRASTE;
  /** La hauteur d'un coin du dessus, la case figée ou non. */
  const coinDuDessus = (col: Colonne, k: number, libre: boolean): number => {
    const L = col.haut + 1;
    if (!libre || col.liquide) return L;
    const voisines = autourDuCoin(champ, col, k);
    // La côte basse d'une île au niveau de la mer descend jusqu'à l'eau ; plus haute, elle s'arrondit d'un bloc.
    if (voisines.some((v) => !v)) return auNiveauDeLaMer && L <= 2 ? RIVAGE : L - 1;
    // Le rebord plat d'une dalle : contre une voisine plus basse d'un bloc qui tranche, le coin descend jusqu'à elle
    // (la roche descend jusqu'à la dalle) ; contre une voisine plus haute qui tranche, il ne monte pas vers elle (la
    // dalle reste plate jusqu'à son bord).
    if (voisines.some((v) => v!.haut + 1 === L - 1 && tranchent(col, v!))) return L - 1;
    let s = 0;
    let n = 0;
    for (const v of voisines) {
      const lv = v!.haut + 1;
      if (Math.abs(lv - L) > 1 || (lv > L && tranchent(col, v!))) continue;
      s += lv;
      n++;
    }
    return s / n;
  };
  for (const col of colonnes) {
    const B = col.bas;
    COINS.forEach((_, k) => {
      const voisines = autourDuCoin(champ, col, k);
      const mer = voisines.some((v) => !v);
      col.rivage[k] = mer;
      const h = coinDuDessus(col, k, !col.fixe);
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
  }
  // Une case où seul un décor est posé : si son socle plat dépasserait la pente de plus de `SOCLE_MAX`, elle descend au
  // bas de la pente, avec tout son décor (un décor sur plusieurs cases ne descend que si toutes peuvent le suivre).
  const bases = new Map<string, Colonne[]>();
  for (const [col, ids] of decors) for (const id of ids) bases.set(id, [...(bases.get(id) ?? []), col]);
  for (const [id, cols] of bases) {
    let drop = Infinity;
    for (const col of cols) {
      if (autreChose.has(col) || adossees.has(col) || decors.get(col)!.size > 1 || col.liquide) drop = 0;
      else {
        const bas = Math.min(...COINS.map((_, k) => coinDuDessus(col, k, true)));
        const exces = col.haut + 1 - bas;
        drop = exces > SOCLE_MAX ? Math.min(drop, exces) : 0;
      }
      if (drop === 0) break;
    }
    if (!(drop > 0 && Number.isFinite(drop))) continue;
    champ.decorsAbaisses.set(id, drop);
    for (const col of cols) {
      col.abaissement = drop;
      col.coins = col.coins.map((h) => h - drop) as Colonne['coins'];
      col.coinsBas = col.coinsBas.map((h, k) => Math.min(h, col.coins[k])) as Colonne['coinsBas'];
    }
  }
  for (const col of colonnes) {
    col.diagonale = diagonaleDe(col.coins, col.x, col.y);
    col.diagonaleBas = diagonaleDe(col.coinsBas, col.x, col.y + 7919);
  }
  // Au pied d'une haute colonne de roche qui plonge dans la mer : un liseré d'éboulis, d'une case de large.
  if (auNiveauDeLaMer) {
    const proprio = new Map<number, { i: number; d: number }>();
    colonnes.forEach((col, i) => {
      if (col.bas > NIVEAU_EAU || !col.rivage.some((r, k) => r && col.coins[k] - RIVAGE >= COLONNE_HAUTE)) return;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const x = col.x + dx;
          const y = col.y + dy;
          const k = cle(x, y);
          if (colonneEn(champ, x, y) || occupees.has(k)) continue;
          const d = Math.hypot(dx, dy);
          const cur = proprio.get(k);
          if (!cur || d < cur.d) proprio.set(k, { i, d });
        }
    });
    for (const [k, { i }] of proprio) {
      const x = Math.floor(k / 32768) - 16384;
      const y = (k % 32768) - 16384;
      const coins = COINS.map(([ox, oy]) => {
        const px = x + ox;
        const py = y + oy;
        const contre = [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)].some(Boolean);
        return contre ? RIVAGE + EBOULIS * (0.35 + 0.65 * hasard(px * 3 + 1, py * 5 + 2)) : NIVEAU_EAU - 0.35;
      }) as Pied['coins'];
      const milieu = (coins[0] + coins[1] + coins[2] + coins[3]) / 4 + 0.18 * (hasard(x * 7 + 3, y * 11 + 5) - 0.35);
      champ.indexPieds.set(k, champ.pieds.length);
      champ.pieds.push({ x, y, colonne: i, coins, milieu });
    }
  }
  return champ;
}

/** Les quatre côtés d'une case. */
const COTES4: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Les quatre cases autour d'un coin d'une colonne (`undefined` : la mer). */
function autourDuCoin(champ: ChampDuSol, col: Colonne, k: number): (Colonne | undefined)[] {
  const px = col.x + COINS[k][0];
  const py = col.y + COINS[k][1];
  return [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)];
}

/**
 * Les cubes posés sur le sol, tels que la vue 3D les dessine sur le sol à facettes : le décor d'une case descendue au bas
 * de sa pente descend avec elle (voir `champDuSol`). Les autres cubes ne bougent pas. La 2D et la vue simple gardent
 * les cubes d'origine.
 */
export function poseDuDecor(champ: ChampDuSol, cubes: VoxelCube[]): VoxelCube[] {
  if (!champ.decorsAbaisses.size) return cubes;
  return cubes.map((c) => {
    const d = c.decor ? champ.decorsAbaisses.get(c.decor) : undefined;
    return d ? { ...c, z: c.z - d } : c;
  });
}

/** Un sol de la palette de l'archipel, nommé par le modelé dessiné (« sol:roche ») : sa matière, ou `null`. */
export function solNomme(m: string): Ground | null {
  return m.startsWith('sol:') && m.slice(4) in SOLS ? (m.slice(4) as Ground) : null;
}

function matiereDe(c: VoxelCube): string {
  return c.texture && (c.texture in MATIERES || solNomme(c.texture)) ? c.texture : c.color;
}

/**
 * La signature d'un champ : la même tant que le sol ne change pas de forme ni de couleur. Poser un bloc sur un plan (sa
 * case est déjà figée par le fantôme) ne refait pas le maillage.
 */
export function signatureDuChamp(champ: ChampDuSol): string {
  return (
    champ.archipel +
    champ.colonnes.map((c) => `|${c.x},${c.y},${c.haut},${c.bas},${c.fixe ? 1 : 0}${c.muted ? 1 : 0}${c.abaissement},${c.matieres.join(',')}`).join('') +
    champ.pieds.map((p) => `|p${p.x},${p.y}`).join('')
  );
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
      // À égalité (sur une arête, la surface est continue), la case sous le point l'emporte.
      const d = Math.abs(h - point.y) + (c.x === Math.floor(point.x) && c.y === Math.floor(point.z) ? 0 : 1e-4);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    // Un éboulis au pied d'une haute colonne : la colonne.
    const pied = champ.indexPieds.get(cle(Math.floor(point.x), Math.floor(point.z)));
    if (!best && pied !== undefined && dessus) best = champ.colonnes[champ.pieds[pied].colonne];
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
  /**
   * Normales d'éclairage, une par facette, répétée sur ses trois sommets : la vraie normale, sauf pour une pente à
   * l'ombre, redressée vers le ciel (`normaleOmbree`). La vraie normale se tire des positions (ce que fait le toucher).
   */
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
  triangle(a: V3, b: V3, c: V3, ca: RGB, cb: RGB, cc: RGB, attendue: V3, colonne: number, eclairage?: (n: V3) => V3): void {
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
    // La normale d'éclairage (une pente à l'ombre, redressée), sinon la vraie.
    if (eclairage) {
      const e = eclairage([nx / len, ny / len, nz / len]);
      nx = e[0] * len;
      ny = e[1] * len;
      nz = e[2] * len;
    }
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
/** Une composante sRGB (0..1) dans l'espace linéaire de Three.js. */
export const lineaire = (v: number) => LINEAIRE[Math.round(clamp(v, 0, 1) * 4096)];

/** La nuance d'un sommet (option b sur les facettes) : plus sombre vers la mer, des taches sur les dessus. */
export function nuanceDuSol(x: number, y: number, z: number, dessus: boolean, altitude: number): number {
  const hauteur = 0.82 + 0.2 * smooth(clamp((y - altitude + 1) / 12, 0, 1));
  const taches = dessus ? 1 + TACHES * (bruit(x / 9, z / 9) * 2 - 1) : 1;
  return clamp(hauteur * taches, NUANCE_SOL[0], NUANCE_SOL[1]);
}

/** L'épaisseur des strates d'une île : 2 ou 3 blocs, tirée une fois par île. */
export function epaisseurDesStrates(ile: string): 2 | 3 {
  let h = 2166136261;
  for (let i = 0; i < ile.length; i++) h = Math.imul(h ^ ile.charCodeAt(i), 16777619);
  return (h >>> 0) % 2 === 0 ? 2 : 3;
}

/** La strate d'un cube de falaise (z entier) : une tranche sur deux plus claire, de `epaisseur` blocs. */
export function strate(z: number, epaisseur = 2, amplitude = STRATES): number {
  return Math.floor(z / epaisseur) % 2 === 0 ? 1 + amplitude : 1 - amplitude;
}

const luminanceLineaire = (c: Couleur) =>
  0.2126 * lineaire(((c >> 16) & 255) / 255) + 0.7152 * lineaire(((c >> 8) & 255) / 255) + 0.0722 * lineaire((c & 255) / 255);

/**
 * La lumière que reçoit une facette de normale `n` (unitaire), de jour, telle que la vue 3D l'éclaire : l'ambiance du
 * ciel et du sol (selon qu'elle regarde en haut ou en bas) et le soleil (`SOLEIL_DIRECTION`). Pour comparer, pas pour
 * peindre.
 */
export function eclairement(a: ArchipelagoId, n: V3): number {
  const c = cielDe(a, 1);
  const w = 0.5 * n[1] + 0.5;
  const len = Math.hypot(...SOLEIL_DIRECTION);
  const dot = (n[0] * SOLEIL_DIRECTION[0] + n[1] * SOLEIL_DIRECTION[1] + n[2] * SOLEIL_DIRECTION[2]) / len;
  return luminanceLineaire(mixColor(c.ambianceSol, c.ambianceCiel, w)) * c.ambianceForce + luminanceLineaire(c.soleil) * c.soleilForce * Math.max(0, dot);
}

/**
 * La normale d'éclairage d'une pente : sa vraie normale si elle reçoit au moins `PENTE_OMBRE` de la lumière d'un dessus
 * plat, sinon redressée vers le ciel juste ce qu'il faut. La facette garde sa forme (le toucher lit la vraie normale) et
 * reste une facette, seulement moins sombre à l'ombre. (Éclaircir sa couleur ne suffirait pas : le soleil de la palette
 * compte trois fois plus que l'ambiance, une pente raide à l'ombre saturerait avant d'y arriver.)
 */
export function normaleOmbree(a: ArchipelagoId, n: V3): V3 {
  const cible = PENTE_OMBRE * eclairement(a, [0, 1, 0]);
  if (eclairement(a, n) >= cible) return n;
  // (Un rien au-dessus : la normale est ensuite rangée en nombres à virgule simple précision.)
  const vise = cible * 1.003;
  const vers = (w: number): V3 => {
    const v: V3 = [n[0] * (1 - w), n[1] * (1 - w) + w, n[2] * (1 - w)];
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (eclairement(a, vers(mid)) >= vise) hi = mid;
    else lo = mid;
  }
  return vers(hi);
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
  // La lave brille (un second appel, sans lumière), sauf dans un archipel où le cratère est éteint (le 6e).
  const brille = laveQuiBrille(a);
  const tampon = (m: string) => (m === 'lave' && brille ? lumineux : sol);

  const facesVues = new Map<string, { dessus: Couleur; cote: Couleur }>();
  const faces = (m: string, muted: boolean): { dessus: Couleur; cote: Couleur } => {
    const k = muted ? `~${m}` : m;
    let f = facesVues.get(k);
    if (!f) {
      const g = solNomme(m);
      f = m in MATIERES ? couleurDeMatiere(a, m as TextureKind) : g ? couleurDuSol(a, g) : { dessus: parseInt(m.slice(1), 16), cote: parseInt(m.slice(1), 16) };
      if (muted) f = { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) };
      facesVues.set(k, f);
    }
    return f;
  };
  const dessusDe = (c: Colonne) => faces(c.matieres[c.matieres.length - 1], c.muted).dessus;
  const froidRGB = rgb(froid);
  /**
   * La couleur finale d'un sommet (linéaire) : la couleur de la palette (canaux 0..255), nuancée, refroidie près de
   * l'eau, puis relevée (`releve`) si la facette est une pente à l'ombre.
   */
  const peintRGB = (c: RGB, p: V3, dessus: boolean, facteur = 1): RGB => {
    let k = 1;
    let f = 0;
    if (style === 'b') {
      k = nuanceDuSol(p[0], p[1], p[2], dessus, altitude) * facteur;
      f = FROID * clamp((FROID_SOUS - p[1]) / 1.5, 0, 1);
    }
    return [0, 1, 2].map((j) => lineaire(((c[j] + (froidRGB[j] - c[j]) * f) / 255) * k)) as RGB;
  };
  const peint = (c: Couleur, p: V3, dessus: boolean, facteur = 1): RGB => peintRGB(rgb(c), p, dessus, facteur);
  // Les pentes à l'ombre : leur normale d'éclairage, calculée une fois par direction.
  const ombrees = new Map<string, V3>();
  const ombree = (n: V3): V3 => {
    if (n[1] > 0.9999) return n;
    const k = n.map((v) => v.toFixed(4)).join(',');
    let v = ombrees.get(k);
    if (!v) {
      v = normaleOmbree(a, n);
      ombrees.set(k, v);
    }
    return v;
  };
  const sableDe = (col: Colonne): RGB => rgb(col.muted ? mixColor(sable, DELAVE[0], DELAVE[1]) : sable);
  /** La couleur d'un coin : celle des cases qui s'y touchent (au plus un bloc d'écart), mêlées ; pas de damier. */
  const coinVu = new Map<string, Couleur>();
  const estSable = (c: Colonne) => c.matieres[c.matieres.length - 1] === 'sable';
  /** Deux dessus qui ne se fondent pas d'un coin à l'autre (voir `CONTRASTE`). */
  const tranchent = (p: Colonne, q: Colonne) => ecartDeCouleur(dessusDe(p), dessusDe(q)) > CONTRASTE;
  const couleurCoin = (col: Colonne, k: number): Couleur => {
    // Le sable reste du sable pur, et ne se fond pas dans ses voisines : le passage au sable est net (voir `FONDU`).
    if (col.liquide || estSable(col)) return dessusDe(col);
    const px = col.x + COINS[k][0];
    const py = col.y + COINS[k][1];
    // (La couleur d'un coin dépend aussi du dessus de la colonne : une voisine qui tranche n'y entre pas.)
    const key = `${cle(px, py) * 16 + (col.haut & 15) * 2 + (col.muted ? 1 : 0)}:${dessusDe(col)}`;
    const known = coinVu.get(key);
    if (known !== undefined) return known;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const v of [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)]) {
      if (!v || v.liquide || estSable(v) || Math.abs(v.haut - col.haut) > 1 || tranchent(col, v)) continue;
      const c = dessusDe(v);
      r += (c >> 16) & 255;
      g += (c >> 8) & 255;
      b += c & 255;
      n++;
    }
    const c = n ? (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n) : dessusDe(col);
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
    // ---- Le dessus : deux triangles, le long de la diagonale de la case. Au bord de la mer, le sable : pur sur la
    // part de la case côté mer (`FRANGE`), fondu vers le dessus sur `FONDU` de case ; les facettes sont coupées le
    // long de ces lignes (des courbes de niveau de la pente de la côte), pour que le sable ne bave pas plus loin.
    const P = (k: number): V3 => [col.x + COINS[k][0], col.coins[k], col.y + COINS[k][1]];
    const p = [P(0), P(1), P(2), P(3)];
    const base = [0, 1, 2, 3].map((k) => rgb(couleurCoin(col, k)));
    const plage = auNiveauDeLaMer && !col.liquide && !estSable(col) && col.rivage.some((r, k) => r && col.coins[k] <= 0);
    const sommet = Math.max(...col.coins);
    const etendue = sommet - RIVAGE;
    // La part de sable à une hauteur : 1 jusqu'à `FRANGE` de la case (depuis la mer), 0 après le fondu.
    const partDeSable = (y: number) => (!plage ? 0 : etendue < 1e-6 ? 1 : clamp((FRANGE + FONDU - (y - RIVAGE) / etendue) / FONDU, 0, 1));
    const sab = sableDe(col);
    // Les côtés contre une voisine qui tranche (voir `CONTRASTE`) : le passage se fait au bord, sur `FONDU` de case.
    const bords: { d: (q: V3) => number; axe: 0 | 2; ligne: number; c: RGB }[] = [];
    if (!col.liquide && !estSable(col))
      for (const [dx, dy] of COTES4) {
        const v = colonneEn(champ, col.x + dx, col.y + dy);
        if (!v || v.liquide || estSable(v) || Math.abs(v.haut - col.haut) > 1 || !tranchent(col, v)) continue;
        const axe = dx !== 0 ? 0 : 2;
        const bord = dx > 0 ? col.x + 1 : dx < 0 ? col.x : dy > 0 ? col.y + 1 : col.y;
        const signe = dx + dy;
        bords.push({ d: (q) => signe * (bord - q[axe]), axe, ligne: bord - signe * FONDU, c: rgb(dessusDe(v)) });
      }
    for (const [i0, i1, i2] of trianglesDeLaCase(col.diagonale)) {
      let morceaux: Sommet[][] = [
        [
          { p: p[i0], c: base[i0] },
          { p: p[i1], c: base[i1] },
          { p: p[i2], c: base[i2] },
        ],
      ];
      if (plage && etendue > 1e-6)
        for (const h of [RIVAGE + FRANGE * etendue, RIVAGE + (FRANGE + FONDU) * etendue])
          // (Un éclat plus fin qu'un centième de case ne se verrait pas : on ne le garde pas.)
          morceaux = morceaux.flatMap((m) => [couper(m, h, true), couper(m, h, false)].filter((q) => q.length >= 3 && aireAuSol(q) > 1e-3));
      for (const b of bords)
        morceaux = morceaux.flatMap((m) => [couper(m, b.ligne, true, b.axe), couper(m, b.ligne, false, b.axe)].filter((q) => q.length >= 3 && aireAuSol(q) > 1e-4));
      for (const m of morceaux) {
        const cs = m.map(({ p: q, c }) => {
          // Contre une voisine qui tranche : à mi-chemin des deux couleurs au bord, sa couleur propre à `FONDU` de case.
          let base = c;
          for (const b of bords) {
            const w = 0.5 * Math.max(0, 1 - b.d(q) / FONDU);
            if (w > 0) base = [0, 1, 2].map((j) => base[j] + (b.c[j] - base[j]) * w) as RGB;
          }
          const f = partDeSable(q[1]);
          return peintRGB([0, 1, 2].map((j) => base[j] + (sab[j] - base[j]) * f) as RGB, q, true);
        });
        for (let j = 1; j + 1 < m.length; j++) t.triangle(m[0].p, m[j].p, m[j + 1].p, cs[0], cs[j], cs[j + 1], HAUT, i, ombree);
      }
    }

    // ---- Les falaises, sur les quatre côtés : ce que la voisine ne couvre pas, coupé en strates.
    const matiere = (zz: number) => col.matieres[clamp(zz - col.bas, 0, col.matieres.length - 1)];
    const ep = epaisseurDesStrates(col.ile);
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
        // Les strates : discrètes sur une haute paroi ; leur épaisseur est celle de l'île.
        const amplitude = Math.max(d0, d1) > PAROI_HAUTE ? STRATES_HAUTES : STRATES;
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
          while (z1 + 1 <= ze && matiere(z1 + 1) === matiere(z) && Math.floor((z1 + 1) / ep) === Math.floor(z / ep)) z1++;
          const tranche = zs === ze ? poly : clip(poly, z === zs ? -Infinity : z, z1 === ze ? Infinity : z1 + 1);
          if (tranche.length >= 3) {
            const m = matiere(z);
            const cote = faces(m, col.muted).cote;
            const f = style === 'a' ? 1 : strate(z, ep, amplitude);
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
      const f = style === 'a' ? 1 : strate(col.bas, ep);
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
  // ---- Les éboulis au pied des hautes colonnes : la roche de la colonne, en quatre facettes bosselées.
  for (const pied of champ.pieds) {
    const col = champ.colonnes[pied.colonne];
    const cote = rgb(faces(col.matieres[0], col.muted).cote);
    const q = [0, 1, 2, 3].map((k): V3 => [pied.x + COINS[k][0], pied.coins[k], pied.y + COINS[k][1]]);
    const m: V3 = [pied.x + 0.5, pied.milieu, pied.y + 0.5];
    for (let k = 0; k < 4; k++) {
      const pts: V3[] = [m, q[k], q[(k + 1) % 4]];
      // Chaque caillou un peu plus clair ou plus sombre que son voisin.
      const f = 1 + 0.06 * (hasard(pied.x * 4 + k, pied.y * 9 + 1) * 2 - 1);
      const cs = pts.map((pt) => peintRGB(cote, pt, true, f));
      sol.triangle(pts[0], pts[1], pts[2], cs[0], cs[1], cs[2], HAUT, pied.colonne, ombree);
    }
  }
  return { sol: sol.fin(), lumineux: lumineux.fin() };
}

/** Un sommet en cours de découpe : sa position et sa couleur de base (canaux 0..255). */
interface Sommet {
  p: V3;
  c: RGB;
}

/** Garde d'un polygone convexe la part sous (ou sur) `h` le long d'un axe (la hauteur par défaut), en coupant ses arêtes. */
function couper(poly: Sommet[], h: number, dessous: boolean, axe: 0 | 1 | 2 = 1): Sommet[] {
  const out: Sommet[] = [];
  const f = (v: Sommet) => (dessous ? h - v.p[axe] : v.p[axe] - h);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const k = fa / (fa - fb);
      out.push({ p: [0, 1, 2].map((j) => a.p[j] + (b.p[j] - a.p[j]) * k) as V3, c: [0, 1, 2].map((j) => a.c[j] + (b.c[j] - a.c[j]) * k) as RGB });
    }
  }
  return out;
}

/** L'aire d'un polygone vu de dessus. */
function aireAuSol(poly: Sommet[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i].p;
    const q = poly[(i + 1) % poly.length].p;
    a += p[0] * q[2] - q[0] * p[2];
  }
  return Math.abs(a) / 2;
}

const rgb = (c: Couleur): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

/** La distance entre deux couleurs (canaux 0..255). */
export function ecartDeCouleur(a: Couleur, b: Couleur): number {
  const p = rgb(a);
  const q = rgb(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
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
