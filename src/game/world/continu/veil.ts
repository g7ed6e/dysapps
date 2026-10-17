// La brume des terres fermées (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) :
// les dômes de brume par lieu disparaissent ; une terre pas encore reliée est tout entière sous une brume basse, jamais
// opaque, où chaque lieu garde sa silhouette (référent dys) : deux voiles posés sur le sol, l'un à hauteur de Kéo,
// l'autre un peu plus haut et plus léger, de la teinte du lointain. Chaque voile s'efface sur ses bords : loin des
// chemins et des lieux de sa terre, vers une terre voisine, et sur l'eau (le bras de mer reste net, sa coupure bleue
// se lit). Rien ne bouge : c'est un état, pas une animation ; quand on relie la terre, elle se lève en fondu doux après le
// toc du pont (d'un coup avec « Réduire les animations ») : la vue n'en change que la transparence. Code pur.
import { distance, linearRgb, smoothstep, type Vec2 } from './geometry';
import { LANDS, NODE_LANDS, type LandId, type LinkedLand } from './lands';
import { PATH_NODES, placeById } from './plan6e';
import { heightAt, landDistance, standingHeight } from './terrain';

/** La couleur de la brume : la Brume du pack (#E5EBE3), celle du lointain aussi. */
export const MIST_COLOR = 0xe5ebe3;

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
 * mur ; ensemble, environ 55 %, jamais opaque.
 */
export const VEIL_LAYERS: readonly { lift: number; alpha: number }[] = [
  { lift: 0.6, alpha: 0.46 },
  { lift: 1.9, alpha: 0.16 },
];

/** La hauteur du voile le plus haut au-dessus du sol : bien moins que Kéo et un toit (le cadenas se pose au-dessus). */
export const VEIL_HEIGHT = VEIL_LAYERS[VEIL_LAYERS.length - 1].lift;

/**
 * Le dessin du voile : le pas de sa grille ; jusqu'où il s'étend loin d'un chemin ou d'un lieu de sa terre (`reach`,
 * effacé dès `reach × 0,6`) ; la largeur de son fondu vers une terre voisine (`border`) et vers l'eau (`shore` : presque
 * rien, il s'arrête net sur la rive, ses sommets mouillés posés sur elle, `toShore`) ; autour du centre d'un lieu,
 * jusqu'où il couvre même l'eau (`place`).
 */
const GRID = { step: 5, reach: 18, border: 5, shore: 0.4, place: 7 } as const;

/** Les repères d'une terre : les nœuds de ses chemins et le centre de ses lieux. */
const featuresOf = (land: LandId): Vec2[] => [
  ...PATH_NODES.filter((n) => NODE_LANDS.get(n.id) === land).map((n) => n.at),
  ...LANDS.find((l) => l.id === land)!.places.map((id) => placeById(id).center),
];
const FEATURES = new Map<LandId, Vec2[]>(LANDS.map((l) => [l.id, featuresOf(l.id)]));
/** Le centre des lieux de chaque terre : la brume couvre un lieu même posé sur l'eau (la Gare maritime, sur son îlot). */
const CENTERS = new Map<LandId, Vec2[]>(LANDS.map((l) => [l.id, l.places.map((id) => placeById(id).center)]));

const nearest = (p: Vec2, points: readonly Vec2[]): number => points.reduce((d, q) => Math.min(d, distance(p, q)), Infinity);

/** De `p` à `q`, passe-t-on sur l'eau (un pas d'une unité) ? */
function acrossWater(p: Vec2, q: Vec2): boolean {
  const n = Math.ceil(distance(p, q));
  for (let k = 1; k < n; k++) if (landDistance({ x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n }) < 0) return true;
  return false;
}

/** La part de brume de la terre `land` en `p` (0 à 1) : dans sa terre, près de ses repères, hors de l'eau. */
export function veilShare(land: LinkedLand, p: Vec2): number {
  const own = nearest(p, FEATURES.get(land)!);
  if (own >= GRID.reach) return 0;
  // Le repère d'une autre terre le plus proche, s'il touche presque celui-ci, et seulement s'il est du même côté de l'eau :
  // de l'autre côté d'un bras de mer, il ne compte pas, et la brume va jusqu'à la rive (relecture du lot 1, directeur
  // artistique : elle s'arrête net sur la rive d'en face).
  let other = Infinity;
  for (const [id, points] of FEATURES) {
    if (id === land) continue;
    for (const q of points) {
      const d = distance(p, q);
      if (d < other && d < own + GRID.border && !acrossWater(p, q)) other = d;
    }
  }
  const inside = smoothstep(0, GRID.border, other - own);
  const near = 1 - smoothstep(GRID.reach * 0.6, GRID.reach, own);
  const dry = Math.max(smoothstep(-GRID.shore, 0.5, landDistance(p)), 1 - smoothstep(GRID.place, GRID.place + GRID.shore, nearest(p, CENTERS.get(land)!)));
  return inside * near * dry;
}

/** Un sommet ramené sur la rive se pose à tant d'unités au-delà, sur la terre : la brume s'y tient entière. */
const SHORE_IN = 0.5;

/**
 * Un point de l'eau ramené sur la rive la plus proche (quelques pas de Newton sur la distance à la terre), s'il en est à
 * moins de `most` unités ; sinon, rien.
 */
function toShore(p: Vec2, most: number): Vec2 | null {
  let q = p;
  for (let k = 0; k < 4; k++) {
    const d = landDistance(q);
    if (Math.abs(d - SHORE_IN) < 0.05) break;
    const e = 0.25;
    const gx = (landDistance({ x: q.x + e, z: q.z }) - landDistance({ x: q.x - e, z: q.z })) / (2 * e);
    const gz = (landDistance({ x: q.x, z: q.z + e }) - landDistance({ x: q.x, z: q.z - e })) / (2 * e);
    const g = Math.hypot(gx, gz) || 1;
    q = { x: q.x - (gx / g) * (d - SHORE_IN), z: q.z - (gz / g) * (d - SHORE_IN) };
  }
  return landDistance(q) >= 0 && distance(p, q) <= most ? q : null;
}

/**
 * La brume d'une terre : ses deux voiles sur une grille qui suit le sol, les cases sans brume laissées de côté. Un
 * sommet de la grille sur l'eau, près de la rive, y est ramené (relecture du lot 1, directeur artistique : la brume
 * s'arrête net sur la rive d'en face, sans fondu sur le bras de mer) ; il prend la brume de ce point de la rive (aucune,
 * si la rive est celle d'une autre terre).
 */
function veilOf(pos: number[], nor: number[], col: number[], land: LinkedLand): void {
  const [r, g, b] = linearRgb(MIST_COLOR);
  const points = FEATURES.get(land)!;
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
  const centers = CENTERS.get(land)!;
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      let p = { x: minX + i * GRID.step, z: minZ + j * GRID.step };
      let off = false;
      if (landDistance(p) < 0 && nearest(p, centers) > GRID.place) {
        const q = toShore(p, 2 * GRID.step);
        if (q) p = q;
        off = !q || veilShare(land, q) === 0;
      }
      const s = off ? 0 : veilShare(land, p);
      spot.push(p);
      share.push(s);
      wet.push(off);
      floor.push(s > 0 ? Math.max(0.05, standingHeight(heightAt(p))) : 0);
    }
  const at = (i: number, j: number) => j * (nx + 1) + i;
  for (const layer of VEIL_LAYERS) {
    const put = (i: number, j: number) => {
      const k = at(i, j);
      pos.push(spot[k].x, floor[k] + layer.lift, spot[k].z);
      nor.push(0, 1, 0);
      col.push(r, g, b, share[k] * layer.alpha);
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
