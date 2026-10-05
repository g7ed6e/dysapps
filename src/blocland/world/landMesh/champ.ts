// Le champ du sol : une colonne par case de terre et la hauteur de ses quatre coins (`champDuSol`), la pose des décors
// sur la pente (`poseDuDecor`), et ce qui le lit : le toucher (`pickCell`) et la marche (`hauteurDuSol`, `piedsSur`).
import type { ArchipelagoId, Ground } from '../map';
import type { VoxelCube } from '../cube';
import { AMBIENCE } from '../daylight';
import { decorPose } from '../decor';
import { type Couleur, couleurDeMatiere, couleurDuSol, MATIERES, SOLS } from '../palette';
import type { TextureKind } from '../pixels';
import { cellHash } from '../../../core/random';
import { clamp, smooth } from '../../../core/math';
import type { Cell } from '../view';
import { COINS, COLONNE_HAUTE, CONTRASTE, EBOULIS, NIVEAU_EAU, PLANCHER, RIVAGE, SOCLE_MAX } from './reglages';
import { ecartDeCouleur } from './eclairage';

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
interface Pied {
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
export const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);

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
        return contre ? RIVAGE + EBOULIS * (0.35 + 0.65 * cellHash(px * 3 + 1, py * 5 + 2)) : NIVEAU_EAU - 0.35;
      }) as Pied['coins'];
      const milieu = (coins[0] + coins[1] + coins[2] + coins[3]) / 4 + 0.18 * (cellHash(x * 7 + 3, y * 11 + 5) - 0.35);
      champ.indexPieds.set(k, champ.pieds.length);
      champ.pieds.push({ x, y, colonne: i, coins, milieu });
    }
  }
  return champ;
}

/** Les quatre côtés d'une case. */
export const COTES4: [number, number][] = [
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
 * de sa pente descend avec elle (voir `champDuSol`). Les autres cubes ne bougent pas.
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

/** La diagonale qui coupe une case : la plus plate (le pli le plus doux), au hasard si les deux se valent. */
function diagonaleDe(h: number[], x: number, y: number): 0 | 1 {
  const d02 = Math.abs(h[0] - h[2]);
  const d13 = Math.abs(h[1] - h[3]);
  if (Math.abs(d02 - d13) > 1e-6) return d02 < d13 ? 0 : 1;
  return cellHash(x, y) < 0.5 ? 0 : 1;
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
