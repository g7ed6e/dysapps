// La brume des terres fermées (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) :
// les dômes de brume par lieu disparaissent ; une terre pas encore reliée est tout entière sous une brume basse, jamais
// opaque, où chaque lieu garde sa silhouette (référent dys) : deux voiles posés sur le sol, l'un à hauteur de Kéo,
// l'autre un peu plus haut et plus léger, de la teinte du lointain. Chaque voile s'efface sur ses bords : loin des
// chemins et des lieux de sa terre, vers une terre voisine, et sur l'eau (le bras de mer reste net, sa coupure bleue
// se lit). Rien ne bouge : c'est un état, pas une animation ; quand on relie la terre, elle se lève en fondu doux après le
// toc du pont (d'un coup avec « Réduire les animations ») : la vue n'en change que la transparence. Code pur.
import { distance, distanceToPolyline, linearRgb, smoothstep, type Vec2 } from './geometry';
import { nodeLands, planOfLand, type LandId, type LinkedLand } from './lands';
import { placeById, planFor, type LevelPlan, type OpenWorldLevel } from './levelPlan';
import type { PathNode } from './network';
import { PATH_NODES } from './plan6e';
import { PATH_NODES_4E, VOLCANO_4E } from './plan4e';
import { PATH_EDGES_5E, PATH_NODES_5E } from './plan5e';
import { heightAt, heightAt as heightAt6e, landDistance, standingHeight } from './terrain';
import { heightAt4e, landDistance4e } from './terrain4e';
import { heightAt5e, landDistance5e, plateauShare } from './terrain5e';

/**
 * La couleur de la brume : la Brume du pack (#E5EBE3), un peu plus claire (#EEF1EC, retouche du lot 3) pour se lire
 * sur l'herbe au soleil, plus claire qu'avant.
 */
const MIST_COLOR = 0xeef1ec;

/**
 * Un maillage de brume : trois sommets par triangle, et pour chacun sa normale (vers le haut), sa couleur et sa
 * transparence (rouge, vert, bleu linéaires, alpha).
 */
export interface VeilMesh {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  triangles: number;
}

/**
 * Les deux voiles (artiste technique 3D, référent dys) : leur hauteur au-dessus du sol et leur transparence la plus
 * dense. Ensemble, jamais plus de 0,62 (vus d'en haut, 1 − 0,54 × 0,84, environ 55 %) : un lieu se lit toujours à
 * travers ; le haut de son repère (la tour du Phare, la flèche de la grue) dépasse du second. Relecture du lot 1
 * (directeur artistique, référent dys) : plus dense au sol, jusqu'à mi-hauteur des bâtiments, les toits au-dessus.
 * Reprise avec la lumière du lot 3 (GD-20, point 3) : une nappe plus basse et plus dense (46 % à 0,6 unité), le second
 * voile plus léger : sous la nouvelle lumière, plus contrastée, le sol voilé se lit comme de la brume, jamais comme un
 * mur ; ensemble, environ 55 %, jamais opaque. Retouche du lot 3 : la nappe à 50 % et 0,5 unité, le second voile à
 * 12 % (ensemble 56 %), et la nappe pleine plus loin des chemins et des lieux (`GRID.reach`, `GRID.full`).
 */
export const VEIL_LAYERS: readonly { lift: number; alpha: number }[] = [
  { lift: 0.5, alpha: 0.5 },
  { lift: 1.7, alpha: 0.12 },
];

/** La hauteur du voile le plus haut au-dessus du sol : bien moins que Kéo et un toit (le cadenas se pose au-dessus). */
export const VEIL_HEIGHT = VEIL_LAYERS[VEIL_LAYERS.length - 1].lift;

/**
 * Les voiles du 5e (retouche du lot 2, directeur artistique : « la brume d'état ne se voit pas en 3D » ; artiste technique
 * 3D) : sous la canopée de la forêt, les deux voiles du 6e restaient cachés. Trois voiles : la nappe basse et dense, un
 * voile entre les troncs, un dernier au ras de la canopée (les houppiers en sortent). Ensemble, vus d'en haut, environ
 * 60 % (1 − 0,62 × 0,82 × 0,78), jamais plus que le 6e : jamais opaque, un lieu se lit toujours à travers.
 */
export const VEIL_LAYERS_5E: readonly { lift: number; alpha: number }[] = [
  { lift: 0.6, alpha: 0.38 },
  { lift: 3.2, alpha: 0.18 },
  { lift: 6.8, alpha: 0.22 },
];

/**
 * Au 5e, la brume s'écarte des chemins de sa terre (retouche du lot 2 : jamais sur un chemin) : nulle sur le chemin, à
 * `clear` unités de son axe, pleine à `full`.
 */
const PATH_CLEAR_5E = { clear: 1.6, full: 4.5 } as const;

/**
 * Le dessin du voile : le pas de sa grille ; jusqu'où il s'étend loin d'un chemin ou d'un lieu de sa terre (`reach`,
 * effacé dès `reach × full`) ; la largeur de son fondu vers une terre voisine (`border`) et vers l'eau (`shore` : presque
 * rien, il s'arrête net sur la rive, ses sommets mouillés posés sur elle, `toShore`) ; autour du centre d'un lieu,
 * jusqu'où il couvre même l'eau (`place`). Reprise du lot 3 (directeur artistique : des « plaques de verre à arêtes
 * droites ») : une grille plus fine (3 unités au lieu de 5) qui épouse mieux le sol, chaque sommet posé au-dessus du plus
 * haut du sol autour de lui (aucune pente ne le perce d'une arête droite), et aucun bord net : là où une case est laissée
 * de côté (sur l'eau), ses voisines s'effacent jusqu'à elle.
 */
const GRID = { step: 3, reach: 22, full: 0.75, border: 5, shore: 0.4, place: 7 } as const;

/**
 * Ce que la brume lit d'un niveau (GD-22, lot 2) : les repères de chaque terre (les nœuds de ses chemins et le centre
 * de ses lieux), le centre des lieux de chaque terre (la brume couvre un lieu même posé sur l'eau : la Gare maritime, sur
 * son îlot), l'eau et le sol ; et, au 5e, l'étage de chaque terre (`level` : la brume des Aiguilles reste sur le plateau,
 * celle d'en bas sous la falaise, de 0 à 1).
 */
interface VeilWorld {
  features: ReadonlyMap<LandId, Vec2[]>;
  centers: ReadonlyMap<LandId, Vec2[]>;
  landDistance(p: Vec2): number;
  heightAt(p: Vec2): number;
  level(land: LandId, p: Vec2): number;
  /** Ses voiles. */
  layers: readonly { lift: number; alpha: number }[];
  /** La part de brume qu'un chemin laisse en `p` (de 0 sur lui à 1 loin de lui) ; au 6e, partout 1. */
  clear(p: Vec2): number;
}

function veilWorld(plan: LevelPlan, nodes: readonly PathNode[], base: Pick<VeilWorld, 'landDistance' | 'heightAt' | 'level' | 'layers' | 'clear'>): VeilWorld {
  const nodeLand = nodeLands(plan);
  const featuresOf = (land: LandId): Vec2[] => [
    ...nodes.filter((n) => nodeLand.get(n.id) === land).map((n) => n.at),
    ...plan.lands.find((l) => l.id === land)!.places.map((id) => placeById(id).center),
  ];
  return {
    ...base,
    features: new Map(plan.lands.map((l) => [l.id, featuresOf(l.id)])),
    centers: new Map(plan.lands.map((l) => [l.id, l.places.map((id) => placeById(id).center)])),
  };
}

/** Les tronçons des chemins du 5e. */
const PATH_SEGMENTS_5E: readonly (readonly [Vec2, Vec2])[] = PATH_EDGES_5E.map(([a, b]) => [PATH_NODES_5E.find((n) => n.id === a)!.at, PATH_NODES_5E.find((n) => n.id === b)!.at] as const);

/** Les lieux du plateau du 5e (GD-22) : les Aiguilles. */
const UPPER_LAND_5E: LandId = 'aiguilles';

const worldOfLand = new Map<LandId, VeilWorld>();

/** La brume du niveau d'une terre (faite une fois par niveau, retrouvée sans rien chercher ensuite). */
function worldOf(land: LandId): VeilWorld {
  let w = worldOfLand.get(land);
  if (!w) worldOfLand.set(land, (w = levelWorld(land)));
  return w;
}

/**
 * La brume de chaque niveau, faite à la première terre qui la demande (un niveau oublié ne compile pas). Au 4e, un seul
 * sol, comme le 6e ; la brume s'arrête sur la mer et le bassin, pas sur le ravin ni la coulée (secs), et jamais sur le
 * haut du volcan (retouche 1 du lot 1, directeur artistique : ni le haut du cône ni le panache sous la brume).
 */
const VEIL_WORLDS: Readonly<Record<OpenWorldLevel, () => VeilWorld>> = {
  '6e': () => veilWorld(planFor('6e'), PATH_NODES, { landDistance, heightAt, level: () => 1, layers: VEIL_LAYERS, clear: () => 1 }),
  '5e': () =>
    veilWorld(planFor('5e'), PATH_NODES_5E, {
      landDistance: landDistance5e,
      heightAt: heightAt5e,
      level: (l, p) => (l === UPPER_LAND_5E ? smoothstep(0.35, 0.75, plateauShare(p)) : 1 - smoothstep(0.05, 0.4, plateauShare(p))),
      layers: VEIL_LAYERS_5E,
      clear: (p) => smoothstep(PATH_CLEAR_5E.clear, PATH_CLEAR_5E.full, Math.min(...PATH_SEGMENTS_5E.map(([a, b]) => distanceToPolyline(p, [a, b])))),
    }),
  '4e': () =>
    veilWorld(planFor('4e'), PATH_NODES_4E, {
      landDistance: landDistance4e,
      heightAt: heightAt4e,
      level: () => 1,
      layers: VEIL_LAYERS,
      clear: (p) => smoothstep(VOLCANO_4E.radius * VOLCANO_CLEAR_4E[0], VOLCANO_4E.radius * VOLCANO_CLEAR_4E[1], distance(p, VOLCANO_4E.crater)),
    }),
};

/** Au 4e, la brume s'efface sur le cône du volcan : nulle à moins de tant de son rayon du cratère, pleine au-delà de tant. */
const VOLCANO_CLEAR_4E = [0.5, 0.72] as const;

const levelVeils = new Map<OpenWorldLevel, VeilWorld>();

function levelWorld(land: LandId): VeilWorld {
  const level = planOfLand(land).level;
  let w = levelVeils.get(level);
  if (!w) levelVeils.set(level, (w = VEIL_WORLDS[level]()));
  return w;
}

const nearest = (p: Vec2, points: readonly Vec2[]): number => points.reduce((d, q) => Math.min(d, distance(p, q)), Infinity);

/** De `p` à `q`, passe-t-on sur l'eau (un pas d'une unité) ? */
function acrossWater(w: VeilWorld, p: Vec2, q: Vec2): boolean {
  const n = Math.ceil(distance(p, q));
  for (let k = 1; k < n; k++) if (w.landDistance({ x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n }) < 0) return true;
  return false;
}

/** La part de brume de la terre `land` en `p` (0 à 1) : dans sa terre, près de ses repères, hors de l'eau. */
export function veilShare(land: LinkedLand, p: Vec2): number {
  const w = worldOf(land);
  const own = nearest(p, w.features.get(land)!);
  if (own >= GRID.reach) return 0;
  // Le repère d'une autre terre le plus proche, s'il touche presque celui-ci, et seulement s'il est du même côté de l'eau :
  // de l'autre côté d'un bras de mer, il ne compte pas, et la brume va jusqu'à la rive (relecture du lot 1, directeur
  // artistique : elle s'arrête net sur la rive d'en face).
  let other = Infinity;
  for (const [id, points] of w.features) {
    if (id === land) continue;
    for (const q of points) {
      const d = distance(p, q);
      if (d < other && d < own + GRID.border && !acrossWater(w, p, q)) other = d;
    }
  }
  const inside = smoothstep(0, GRID.border, other - own);
  const near = 1 - smoothstep(GRID.reach * GRID.full, GRID.reach, own);
  const dry = Math.max(smoothstep(-GRID.shore, 0.5, w.landDistance(p)), 1 - smoothstep(GRID.place, GRID.place + GRID.shore, nearest(p, w.centers.get(land)!)));
  return inside * near * dry * w.level(land, p) * w.clear(p);
}

/** Un sommet ramené sur la rive se pose à tant d'unités au-delà, sur la terre : la brume s'y tient entière. */
const SHORE_IN = 0.5;

/**
 * Un point de l'eau ramené sur la rive la plus proche (quelques pas de Newton sur la distance à la terre), s'il en est à
 * moins de `most` unités ; sinon, rien.
 */
function toShore(w: VeilWorld, p: Vec2, most: number): Vec2 | null {
  let q = p;
  for (let k = 0; k < 4; k++) {
    const d = w.landDistance(q);
    if (Math.abs(d - SHORE_IN) < 0.05) break;
    const e = 0.25;
    const gx = (w.landDistance({ x: q.x + e, z: q.z }) - w.landDistance({ x: q.x - e, z: q.z })) / (2 * e);
    const gz = (w.landDistance({ x: q.x, z: q.z + e }) - w.landDistance({ x: q.x, z: q.z - e })) / (2 * e);
    const g = Math.hypot(gx, gz) || 1;
    q = { x: q.x - (gx / g) * (d - SHORE_IN), z: q.z - (gz / g) * (d - SHORE_IN) };
  }
  return w.landDistance(q) >= 0 && distance(p, q) <= most ? q : null;
}

/**
 * La brume d'une terre : ses deux voiles sur une grille qui suit le sol, les cases sans brume laissées de côté. Un
 * sommet de la grille sur l'eau, près de la rive, y est ramené (relecture du lot 1, directeur artistique : la brume
 * s'arrête net sur la rive d'en face, sans fondu sur le bras de mer) ; il prend la brume de ce point de la rive (aucune,
 * si la rive est celle d'une autre terre).
 */
function veilOf(pos: number[], nor: number[], col: number[], land: LinkedLand): void {
  const [r, g, b] = linearRgb(MIST_COLOR);
  const w = worldOf(land);
  const points = w.features.get(land)!;
  const minX = Math.min(...points.map((q) => q.x)) - GRID.reach;
  const maxX = Math.max(...points.map((q) => q.x)) + GRID.reach;
  const minZ = Math.min(...points.map((q) => q.z)) - GRID.reach;
  const maxZ = Math.max(...points.map((q) => q.z)) + GRID.reach;
  const nx = Math.ceil((maxX - minX) / GRID.step);
  const nz = Math.ceil((maxZ - minZ) / GRID.step);
  // Chaque sommet de la grille : sa place (ramenée sur la rive s'il est sur l'eau, hors du lieu posé sur l'eau), sa
  // part de brume, et le sol sous lui (jamais sous l'eau).
  const share: number[] = [];
  const floor: number[] = [];
  const spot: Vec2[] = [];
  // Un sommet resté sur l'eau, ou ramené sur la rive d'une autre terre : aucune case qui le touche n'est dessinée (rien
  // ne s'étire sur l'eau d'une rive à l'autre).
  const wet: boolean[] = [];
  const centers = w.centers.get(land)!;
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      let p = { x: minX + i * GRID.step, z: minZ + j * GRID.step };
      let off = false;
      if (w.landDistance(p) < 0 && nearest(p, centers) > GRID.place) {
        const q = toShore(w, p, 2 * GRID.step);
        if (q) p = q;
        off = !q || veilShare(land, q) === 0;
      }
      const s = off ? 0 : veilShare(land, p);
      spot.push(p);
      share.push(s);
      wet.push(off);
      floor.push(s > 0 ? Math.max(0.05, standingHeight(highest(p, w.heightAt))) : 0);
    }
  const at = (i: number, j: number) => j * (nx + 1) + i;
  // Un sommet voisin d'un sommet mouillé (une case laissée de côté) n'a plus de brume : le bord s'efface, jamais net.
  const soft = share.slice();
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      if (!wet[at(i, j)]) continue;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const a = i + di;
          const b = j + dj;
          if (a >= 0 && b >= 0 && a <= nx && b <= nz) soft[at(a, b)] = 0;
        }
    }
  for (const layer of w.layers) {
    const put = (i: number, j: number) => {
      const k = at(i, j);
      pos.push(spot[k].x, floor[k] + layer.lift, spot[k].z);
      nor.push(0, 1, 0);
      col.push(r, g, b, soft[k] * layer.alpha);
    };
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        if (!share[at(i, j)] && !share[at(i + 1, j)] && !share[at(i, j + 1)] && !share[at(i + 1, j + 1)]) continue;
        if (wet[at(i, j)] || wet[at(i + 1, j)] || wet[at(i, j + 1)] || wet[at(i + 1, j + 1)]) continue;
        // Vu d'en haut, dans le sens inverse des aiguilles d'une montre.
        put(i, j);
        put(i, j + 1);
        put(i + 1, j);
        put(i + 1, j);
        put(i, j + 1);
        put(i + 1, j + 1);
      }
  }
}

/** Jusqu'où, autour d'un sommet du voile, on cherche le plus haut du sol (une demi-case). */
const VEIL_AROUND = GRID.step / 2;

/** Le plus haut du sol en `p` et à une demi-case autour : le voile passe au-dessus, jamais dedans. */
export function highest(p: Vec2, heightAt: (p: Vec2) => number = heightAt6e): number {
  const e = VEIL_AROUND;
  return Math.max(heightAt(p), heightAt({ x: p.x + e, z: p.z }), heightAt({ x: p.x - e, z: p.z }), heightAt({ x: p.x, z: p.z + e }), heightAt({ x: p.x, z: p.z - e }));
}

const cache = new Map<LinkedLand, VeilMesh>();

/**
 * La brume des terres fermées `lands` : un seul maillage (chaque terre calculée une fois). `fading` : la terre dont la
 * brume se lève (GD-20, point 3, « La pose ») ; la sienne vient en dernier, à partir du sommet `fadingFrom`, pour que la
 * vue n'en change que la transparence.
 */
export function veilFacets(lands: readonly LinkedLand[], fading?: LinkedLand): VeilMesh & { fadingFrom: number } {
  const order = fading ? [...lands.filter((l) => l !== fading), fading] : lands;
  const parts = order.map((land) => {
    const known = cache.get(land);
    if (known) return known;
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    veilOf(pos, nor, col, land);
    const mesh = { positions: new Float32Array(pos), normals: new Float32Array(nor), colors: new Float32Array(col), triangles: pos.length / 9 };
    cache.set(land, mesh);
    return mesh;
  });
  const join = (key: 'positions' | 'normals' | 'colors') => {
    const out = new Float32Array(parts.reduce((n, m) => n + m[key].length, 0));
    let o = 0;
    for (const m of parts) {
      out.set(m[key], o);
      o += m[key].length;
    }
    return out;
  };
  const triangles = parts.reduce((n, m) => n + m.triangles, 0);
  const last = fading ? parts[parts.length - 1].triangles : 0;
  return { positions: join('positions'), normals: join('normals'), colors: join('colors'), triangles, fadingFrom: (triangles - last) * 3 };
}
