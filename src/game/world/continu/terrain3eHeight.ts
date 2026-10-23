// La hauteur du sol du 3e (découpée de ./terrain3e.ts, qui la réexporte) : la montagne, les trois Prairies, leurs rives
// sous la mer de nuages, le cône du pic, les arêtes, la langue de glace et la levée du Cirque ; ce qu'on ne marche pas ; la
// carte de hauteurs et le sol dessiné de près. Code pur.
import { distance, distanceToPolyline, insidePolygon, signedDistance, smoothstep, type Vec2 } from './geometry';
import { ARETES_3E, ARETE_EST_3E, ARETE_OUEST_3E, CIRQUE_AREA_3E, COL_3E, LANGUE_3E, LANGUE_LOOK_3E, MOUNTAIN_3E, PATH_EDGES_3E, PATH_NODES_3E, PEAK_3E, PRAIRIES_3E, TERRAIN_3E, alongPolyline } from './plan3e';
import { farHeightsOf, heightOnMesh, type HeightField } from './terrain';

/** Le fond sous les nuages : la pente des rives y descend, cachée par le plan des nuages. */
const CLOUD_FLOOR = -1.5;
/**
 * Les rives : de la mer de nuages au sol, sur tant d'unités (la montagne, une pente douce comme une plage ; les Prairies,
 * voir `PRAIRIE_BANK`) ; sous les nuages, sur tant d'autres.
 */
const BANK = { mountain: 5, under: 3 } as const;
/** Le sol où l'on marche : la montagne à `mountain` (son ondulation en plus), les Prairies à `prairie`, plates. */
const LEVEL = { mountain: 1.25, swell: 0.35, prairie: 0.55, prairieSwell: 0.1 } as const;
/**
 * La rive d'une Prairie (lot 1, retouche 1, « Reporté » : la rive des Prairies était en gradins ; sélection des Prairies,
 * « Partout » : une table, son liseré d'ardoise arrondi, jamais de falaise) : la table garde son niveau jusque sous le
 * liseré (`edge`, en unités de la rive), puis plonge d'un coup sous les nuages (`under`) ; le liseré seul se voit au bord.
 */
export const PRAIRIE_BANK = { edge: [0.5, 1.5], under: -0.9, deep: { y: -3, over: 1 } } as const;
/** La levée douce le long de la rive nord du Cirque : sa hauteur, de `rise[0]` à `rise[1]` unités de la rive, jusqu'à `fade`. */
const CIRQUE_RIM = { height: 2.2, rise: [3, 10], fade: [13, 28] } as const;

/** La distance à la rive de la montagne : positive sur elle. */
export const mountainDistance = (p: Vec2): number => signedDistance(p, MOUNTAIN_3E);

/** La distance à la rive de la Prairie la plus proche : positive sur elle. */
export const prairieDistance = (p: Vec2): number =>
  Math.max(signedDistance(p, PRAIRIES_3E.grande), signedDistance(p, PRAIRIES_3E.deuxieme), signedDistance(p, PRAIRIES_3E.petite));

/** La distance signée à la terre : positive sur la montagne et les Prairies, négative au-dessus de la mer de nuages. */
export function landDistance3e(p: Vec2): number {
  return Math.max(mountainDistance(p), prairieDistance(p));
}

/** La distance au bord de la langue de glace : négative dedans. */
export const langueClearance = (p: Vec2): number => distanceToPolyline(p, LANGUE_3E) - LANGUE_LOOK_3E.halfWidth;

/** La distance au bord de l'arête est : négative dedans (la galerie du col la traverse). */
export const areteEstClearance = (p: Vec2): number => distanceToPolyline(p, ARETE_EST_3E) - ARETES_3E.halfWidth;

/** La distance au bord de la plus proche des deux arêtes : négative dedans. */
export const areteClearance = (p: Vec2): number => Math.min(distanceToPolyline(p, ARETE_OUEST_3E), distanceToPolyline(p, ARETE_EST_3E)) - ARETES_3E.halfWidth;

/** Une ondulation lente du sol, de 0 à 1 (des sinus, aucun hasard : le même sol à chaque construction). */
const wave = (p: Vec2): number => 0.5 + 0.25 * Math.sin(p.x * 0.07 + 0.4) * Math.cos(p.z * 0.06 - 0.8) + 0.25 * Math.sin((p.x + p.z) * 0.045 + 1.3);

/** Le flanc du cône, de 0 au pied à `PEAK_3E.flank.height` au haut, en pente douce. */
const flank = (d: number): number => PEAK_3E.flank.height * (1 - smoothstep(PEAK_3E.flank.inner, PEAK_3E.flank.outer, d));

/** La place du col le long de l'arête est, depuis le pic. */
const COL_ALONG = alongPolyline(COL_3E, ARETE_EST_3E).s;

/** La crête d'une arête au-dessus du sol en `p` : haute au pied du pic, basse au bord des nuages ; nulle au col de l'arête est. */
function ridgeHeight(p: Vec2): number {
  let h = 0;
  for (const line of [ARETE_OUEST_3E, ARETE_EST_3E]) {
    const { d, s } = alongPolyline(p, line);
    if (d >= ARETES_3E.halfWidth) continue;
    let crest = ARETES_3E.low + (ARETES_3E.high - ARETES_3E.low) * Math.exp(-s / ARETES_3E.fall);
    if (line === ARETE_EST_3E) {
      // Côté pic, l'entaille du col reste large (les arcades de la galerie y voient le pic) ; côté nuages, la crête
      // remonte contre le mur plein de la galerie.
      const [r0, r1] = s > COL_ALONG ? ARETES_3E.colEast : ARETES_3E.col;
      crest *= smoothstep(r0, r1, distance(p, COL_3E));
    }
    h = Math.max(h, crest * (1 - (d / ARETES_3E.halfWidth) ** 2));
  }
  return h;
}

/** Le col de l'arête est : le sol y est celui du replat à moins de tant d'unités, puis rejoint le flanc du cône à tant. */
const COL_NOTCH = [12, 26] as const;

/** La levée de la rive nord du Cirque, en `p`, à `coast` unités de la rive. */
function cirqueRim(p: Vec2, coast: number): number {
  if (coast > CIRQUE_RIM.fade[1] || !insidePolygon(p, CIRQUE_AREA_3E)) return 0;
  return CIRQUE_RIM.height * smoothstep(CIRQUE_RIM.rise[0], CIRQUE_RIM.rise[1], coast) * (1 - smoothstep(CIRQUE_RIM.fade[0], CIRQUE_RIM.fade[1], coast));
}

/**
 * La hauteur du sol, avant la grille : sous les nuages, la pente des rives ; sur les Prairies, une table plate ; sur la
 * montagne, le sol ondulé, le flanc du cône, les arêtes, la levée du Cirque, la langue de glace un rien plus bas.
 */
export function heightAt3e(p: Vec2): number {
  const m = mountainDistance(p);
  const pr = prairieDistance(p);
  const coast = Math.max(m, pr);
  if (pr >= m) {
    // Au-delà de la rive, le fond plonge bien plus bas que les nuages : vue de loin, la grille plus lâche ne tire plus de
    // dents de scie sous le liseré (relecture des Prairies, (a) 2).
    const D = PRAIRIE_BANK.deep;
    const under = pr >= 0 ? PRAIRIE_BANK.under : PRAIRIE_BANK.under + (D.y - PRAIRIE_BANK.under) * smoothstep(0, D.over, -pr);
    if (pr <= PRAIRIE_BANK.edge[0]) return under;
    return under + (LEVEL.prairie + LEVEL.prairieSwell * wave(p) - under) * smoothstep(PRAIRIE_BANK.edge[0], PRAIRIE_BANK.edge[1], pr);
  }
  if (coast < 0) return CLOUD_FLOOR * smoothstep(0, BANK.under, -coast);
  const d = distance(p, PEAK_3E.at);
  // Le col : le sol y redescend au niveau du replat (le flanc du cône s'y efface), pour que la galerie passe à plat.
  const ground = LEVEL.mountain + LEVEL.swell * wave(p) + flank(d);
  const notch = 1 - smoothstep(COL_NOTCH[0], COL_NOTCH[1], distance(p, COL_3E));
  let h = ground + (LEVEL.mountain - ground) * notch + ridgeHeight(p) + cirqueRim(p, m);
  const ice = langueClearance(p);
  if (ice < 1) h -= LANGUE_LOOK_3E.sink * (1 - smoothstep(-1, 1, ice));
  return h * smoothstep(0, BANK.mountain, m);
}

/** Le haut du cône, les arêtes et la langue de glace : on n'y marche pas (la marche libre les contourne ; un toucher mène à côté). */
export const walkBlocked3e = (p: Vec2): boolean => distance(p, PEAK_3E.at) < PEAK_3E.blocked || areteClearance(p) < 0.6 || langueClearance(p) < 0.6;

let fieldCache: HeightField | null = null;

/** La carte de hauteurs du 3e (une fois), son terrain de loin abaissé sous les chemins, comme au 6e. */
export function buildHeightField3e(): HeightField {
  if (fieldCache) return fieldCache;
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN_3E;
  const nx = tilesX * tileCells + 1;
  const nz = tilesZ * tileCells + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt3e({ x: minX + i * step, z: minZ + j * step });
  const field: HeightField = { minX, minZ, step, nx, nz, heights, far: heights };
  fieldCache = { ...field, far: farHeightsOf(field, PATH_NODES_3E, PATH_EDGES_3E, (x, z) => groundOn3e(field, x, z)) };
  return fieldCache;
}

/** Le point est-il dans la grille du 3e ? */
const inGrid = (f: HeightField, x: number, z: number): boolean => x >= f.minX && z >= f.minZ && x <= f.minX + (f.nx - 1) * f.step && z <= f.minZ + (f.nz - 1) * f.step;

/** Le sol dessiné de près du 3e en (x, z) : sur la grille, comme la tuile ; au-delà, la hauteur du plan. */
export const groundOn3e = (f: HeightField, x: number, z: number): number => (inGrid(f, x, z) ? heightOnMesh(f, x, z) : heightAt3e({ x, z }));
