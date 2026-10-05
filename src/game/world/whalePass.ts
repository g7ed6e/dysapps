// Le passage de la baleine (Archipéo, lot 5) : quand le mot de la baleine s'ouvre, une baleine quitte sa ronde et
// passe au large de l'île concernée. Code pur (sans Three.js) : le trajet sur l'eau, loin de toute terre, et son
// déroulé dans le temps (plonger, refaire surface, souffler, replonger, revenir). La 3D ne fait que le dessiner.
import { BIOMES, type BiomeId } from "../biomes";
import { getArchipelago } from "./archipelago";
import { liaisonsPoseesDe } from "./linkGeometry";
import { dockBox } from "./harbor";
import {
  archipelagoOfIsland,
  DANS_LE_CIEL,
  landCells,
  mapOf,
  type ArchipelagoId,
} from "./map";
import { MONUMENT_ISLET, monumentsOf } from "./monuments";
import {
  ISLET_H,
  ISLET_W,
  bossIsletOrigin,
  bridgePath,
  islandCenter,
  seaDecor,
  whaleSpots,
  worldBounds,
} from "./terrain";
import { smoothstep } from "../../core/math";
import { cacheDeLaDisposition } from './placement';

/** Un passage : un segment droit sur l'eau, de `from` à `to` (coordonnées de grille, continues). */
export interface WhaleRoute {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/** Longueur du passage (cases) : la baleine glisse lentement, environ deux cases par seconde. */
export const PASS_LENGTH = 12;
/** Écart minimal (cases) entre le trajet et toute terre, tout îlot, tout rocher, le port et son navire. */
const PASS_CLEARANCE = 3;

/** Le déroulé dans le temps (secondes) : elle plonge à sa ronde, passe au large, puis reparaît à sa ronde. */
export const PASS_TIMING = { sink: 1.2, swim: 7, rise: 1.2 };
export const PASS_DURATION =
  PASS_TIMING.sink + PASS_TIMING.swim + PASS_TIMING.rise;

interface Grid {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** 1 : une case où la baleine ne va pas. */
  cells: Uint8Array;
}

const gridCache = cacheDeLaDisposition<string, Grid>();

/** Ce que la baleine évite, case par case : terres, îlots des Gardiens et des monuments, ouvrages, port, rochers. */
function obstacles(a: ArchipelagoId): Grid {
  const cle = `${a}|${liaisonsPoseesDe(a).map((d) => d.id).join(',')}`;
  const known = gridCache.get(cle);
  if (known) return known;
  const b = worldBounds(a);
  const M = 40;
  const x0 = b.minX - M;
  const y0 = b.minY - M;
  const w = b.maxX - b.minX + 2 * M + 1;
  const h = b.maxY - b.minY + 2 * M + 1;
  const cells = new Uint8Array(w * h);
  const mark = (x: number, y: number) => {
    const i = x - x0;
    const j = y - y0;
    if (i >= 0 && j >= 0 && i < w && j < h) cells[j * w + i] = 1;
  };
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) mark(c.x, c.y);
    const o = bossIsletOrigin(BIOMES.findIndex((bi) => bi.id === def.id));
    for (let x = 0; x < ISLET_W; x++)
      for (let y = 0; y < ISLET_H; y++) mark(o.x + x, o.y + y);
  }
  for (const def of liaisonsPoseesDe(a)) for (const c of bridgePath(def)) mark(c.x, c.y);
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++)
    for (let y = dock.y0; y <= dock.y1; y++) mark(x, y);
  for (const m of monumentsOf(a))
    for (let x = 0; x < MONUMENT_ISLET; x++)
      for (let y = 0; y < MONUMENT_ISLET; y++)
        mark(m.islet.x + x, m.islet.y + y);
  for (const c of seaDecor(a)) mark(c.x, c.y);
  const grid = { x0, y0, w, h, cells };
  gridCache.set(cle, grid);
  return grid;
}

/** Le point (continu) est-il à `clear` cases au moins de tout obstacle, et dans l'étendue connue ? */
function clearAt(g: Grid, px: number, py: number, clear: number): boolean {
  const cx = Math.floor(px);
  const cy = Math.floor(py);
  const r = Math.ceil(clear);
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++) {
      const i = cx + dx - g.x0;
      const j = cy + dy - g.y0;
      if (i < 0 || j < 0 || i >= g.w || j >= g.h) return false;
      if (!g.cells[j * g.w + i]) continue;
      // Distance du point au carré de la case (x..x+1, y..y+1).
      const qx = Math.max(cx + dx - px, 0, px - (cx + dx + 1));
      const qy = Math.max(cy + dy - py, 0, py - (cy + dy + 1));
      if (Math.hypot(qx, qy) < clear) return false;
    }
  return true;
}

/** Le segment entier est-il sur l'eau libre ? (un point toutes les demi-cases) */
export function routeIsClear(
  a: ArchipelagoId,
  route: WhaleRoute,
  clear = PASS_CLEARANCE,
): boolean {
  if (DANS_LE_CIEL[a]) return false;
  const g = obstacles(a);
  const len = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y);
  const n = Math.max(1, Math.ceil(len * 2));
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    if (
      !clearAt(
        g,
        route.from.x + (route.to.x - route.from.x) * u,
        route.from.y + (route.to.y - route.from.y) * u,
        clear,
      )
    )
      return false;
  }
  return true;
}

/**
 * Où la baleine se montre, dans le repère de la vue de l'île : `depth` le long de l'axe de vue (positif : derrière le
 * centre de l'île, vers le haut de l'écran, car la caméra regarde d'en haut), `side` en travers (positif : vers la
 * droite de l'écran). Le haut de l'écran reste libre des panneaux et des boutons posés en bas ; la baleine ne passe
 * jamais derrière le nom de l'île, écrit au-dessus de son centre ; elle nage en travers, de profil (la silhouette la
 * plus lisible), en s'éloignant de l'axe de vue.
 * - Vue large (tablette, ordinateur) : sur le côté, à droite de préférence (le mot de la baleine s'ouvre en bas).
 * - Vue étroite (téléphone, panneau de l'île ouvert) : le côté sort de l'écran et le nom de l'île en prend toute la
 *   largeur ; elle passe plus loin derrière, au-dessus du nom, près de l'axe.
 */
const PASS_AIM = {
  large: { depth: 15, side: 10, tiers: { depth: [8, 24], side: [7, 14] } },
  etroite: { depth: 23, side: 3, tiers: { depth: [19, 30], side: [0, 6] } },
} as const;

/**
 * Le passage au large d'une île : un segment d'eau libre, en travers de la vue, là où l'élève le voit depuis la vue de
 * l'île (`toCamera` : direction de l'île vers la caméra, dans la grille ; le sud par défaut) : de préférence derrière
 * l'île, en haut de l'écran (PASS_AIM, selon que la vue est large ou étroite : `narrow`). Il ne touche ni terre, ni îlot, ni ouvrage, ni port, ni
 * rocher, ni les ronds des autres baleines. Autour d'une île du milieu du continent, l'eau libre est rare : les
 * exigences s'assouplissent (n'importe où autour de l'île, un peu plus court), jamais l'écart à la terre en dessous
 * de deux cases. `null` sans mer (Îles du Ciel) ou sans eau libre.
 */
export function whalePassRoute(
  island: BiomeId,
  toCamera: { x: number; y: number } = { x: 0, y: -1 },
  narrow = false,
): WhaleRoute | null {
  const aim = narrow ? PASS_AIM.etroite : PASS_AIM.large;
  // Les exigences, de la plus stricte à la plus souple (une île du milieu du continent a peu d'eau libre autour d'elle).
  const tiers = [
    { clear: PASS_CLEARANCE, length: PASS_LENGTH, ...aim.tiers },
    {
      clear: PASS_CLEARANCE,
      length: PASS_LENGTH,
      depth: [-24, 32],
      side: [0, 22],
    },
    { clear: 2, length: 10, depth: [-34, 40], side: [0, 34] },
  ];
  const a = archipelagoOfIsland(island);
  if (DANS_LE_CIEL[a]) return null;
  const c = islandCenter(island);
  const n = Math.hypot(toCamera.x, toCamera.y) || 1;
  // L'axe « derrière l'île » (vers le haut de l'écran) et l'axe en travers (vers la droite de l'écran : la grille a
  // son y le long du z de la scène, la caméra regarde le long de `back`).
  const back = { x: -toCamera.x / n, y: -toCamera.y / n };
  const right = { x: -back.y, y: back.x };
  const whales = whaleSpots(a);
  for (const tier of tiers) {
    let best: { route: WhaleRoute; score: number } | null = null;
    for (let depth = tier.depth[0]; depth <= tier.depth[1]; depth += 1)
      for (const sign of [1, -1])
        for (let off = tier.side[0]; off <= tier.side[1]; off += 1) {
          const side = sign * off;
          const score =
            -Math.abs(depth - aim.depth) * 0.6 -
            Math.abs(off - aim.side) * 0.5 -
            (sign < 0 ? 2 : 0);
          if (best && score <= best.score) continue;
          const mid = {
            x: c.x + back.x * depth + right.x * side,
            y: c.y + back.y * depth + right.y * side,
          };
          // Elle s'éloigne de l'axe de vue (à gauche, elle nage vers la gauche).
          const half = (sign * tier.length) / 2;
          const route = {
            from: { x: mid.x - right.x * half, y: mid.y - right.y * half },
            to: { x: mid.x + right.x * half, y: mid.y + right.y * half },
          };
          if (
            [route.from, mid, route.to].some((p) =>
              whales.some((w) => Math.hypot(w.x - p.x, w.y - p.y) < w.r + 3),
            )
          )
            continue;
          if (!routeIsClear(a, route, tier.clear)) continue;
          best = { route, score };
        }
    if (best) return best.route;
  }
  return null;
}

/** La baleine qui fait le passage : celle dont la ronde est la plus proche du trajet. -1 s'il n'y en a pas. */
export function passingWhale(
  spots: { x: number; y: number }[],
  route: WhaleRoute,
): number {
  const mid = {
    x: (route.from.x + route.to.x) / 2,
    y: (route.from.y + route.to.y) / 2,
  };
  let best = -1;
  let bestD = Infinity;
  spots.forEach((s, i) => {
    const d = Math.hypot(s.x - mid.x, s.y - mid.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Où en est le passage, `s` secondes après son début. */
export type PassPhase =
  /** À sa ronde, elle s'enfonce (`sink` : 0 → 1). */
  | { phase: "sink"; sink: number }
  /**
   * Sur le trajet : `u` (0 → 1) le long du segment, `depth` (0 en surface, 1 tout au fond), `pitch` (positif : nez vers
   * le haut), `spout` (0 : pas de souffle ; sinon la taille du souffle, une seule fois).
   */
  | { phase: "swim"; u: number; depth: number; pitch: number; spout: number }
  /** De retour à sa ronde, elle remonte (`sink` : 1 → 0). */
  | { phase: "rise"; sink: number }
  | { phase: "done" };

/** Le souffle : entre ces deux instants du trajet (fraction), une fois. */
const SPOUT_AT = { from: 0.38, to: 0.58 };

export function passPhase(s: number): PassPhase {
  const { sink, swim, rise } = PASS_TIMING;
  if (s < 0) return { phase: "done" };
  if (s < sink) return { phase: "sink", sink: smoothstep(0, 1, s / sink) };
  if (s < sink + swim) {
    const u = (s - sink) / swim;
    // Elle monte du fond (premier quart), reste en surface, puis plonge (dernier quart).
    const up = smoothstep(0, 0.22, u);
    const down = smoothstep(0.74, 1, u);
    const depth = 1 - up + down;
    const pitch =
      (u < 0.3 ? 1 - smoothstep(0.12, 0.3, u) : 0) * 0.18 -
      smoothstep(0.7, 0.9, u) * 0.3;
    const spout =
      u >= SPOUT_AT.from && u <= SPOUT_AT.to
        ? Math.sin(
            ((u - SPOUT_AT.from) / (SPOUT_AT.to - SPOUT_AT.from)) * Math.PI,
          )
        : 0;
    return { phase: "swim", u, depth, pitch, spout };
  }
  if (s < sink + swim + rise)
    return { phase: "rise", sink: 1 - smoothstep(0, 1, (s - sink - swim) / rise) };
  return { phase: "done" };
}
