// La brume des terres fermées (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) :
// les dômes de brume par lieu disparaissent ; une terre pas encore reliée est tout entière sous une brume basse, jamais
// opaque, où chaque lieu garde sa silhouette (référent dys) : deux voiles posés sur le sol, l'un à hauteur de Kéo,
// l'autre un peu plus haut et plus léger, de la teinte du lointain. Chaque voile s'efface sur ses bords : loin des
// chemins et des lieux de sa terre, vers une terre voisine, et sur l'eau (le bras de mer reste net, sa coupure bleue
// se lit). Rien ne bouge : c'est un état, pas une animation ; elle part d'un coup quand on relie la terre. Code pur.
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
 * dense. Ensemble, jamais plus de 0,6 : un lieu se lit toujours à travers ; le haut de son repère (la tour du Phare, la
 * flèche de la grue) dépasse du second.
 */
export const VEIL_LAYERS: readonly { lift: number; alpha: number }[] = [
  { lift: 0.9, alpha: 0.38 },
  { lift: 2.3, alpha: 0.24 },
];

/** La hauteur du voile le plus haut au-dessus du sol : bien moins que Kéo et un toit (le cadenas se pose au-dessus). */
export const VEIL_HEIGHT = VEIL_LAYERS[VEIL_LAYERS.length - 1].lift;

/**
 * Le dessin du voile : le pas de sa grille ; jusqu'où il s'étend loin d'un chemin ou d'un lieu de sa terre (`reach`,
 * effacé dès `reach × 0,6`) ; la largeur de son fondu vers une terre voisine (`border`) et vers l'eau (`shore`) ; autour
 * du centre d'un lieu, jusqu'où il couvre même l'eau (`place`).
 */
const GRID = { step: 5, reach: 18, border: 5, shore: 3, place: 7 } as const;

/** Les repères d'une terre : les nœuds de ses chemins et le centre de ses lieux. */
const featuresOf = (land: LandId): Vec2[] => [
  ...PATH_NODES.filter((n) => NODE_LANDS.get(n.id) === land).map((n) => n.at),
  ...LANDS.find((l) => l.id === land)!.places.map((id) => placeById(id).center),
];
const FEATURES = new Map<LandId, Vec2[]>(LANDS.map((l) => [l.id, featuresOf(l.id)]));
/** Le centre des lieux de chaque terre : la brume couvre un lieu même posé sur l'eau (la Gare maritime, sur son îlot). */
const CENTERS = new Map<LandId, Vec2[]>(LANDS.map((l) => [l.id, l.places.map((id) => placeById(id).center)]));

const nearest = (p: Vec2, points: readonly Vec2[]): number => points.reduce((d, q) => Math.min(d, distance(p, q)), Infinity);

/** La part de brume de la terre `land` en `p` (0 à 1) : dans sa terre, près de ses repères, hors de l'eau. */
export function veilShare(land: LinkedLand, p: Vec2): number {
  const own = nearest(p, FEATURES.get(land)!);
  if (own >= GRID.reach) return 0;
  let other = Infinity;
  for (const [id, points] of FEATURES) if (id !== land) other = Math.min(other, nearest(p, points));
  const inside = smoothstep(0, GRID.border, other - own);
  const near = 1 - smoothstep(GRID.reach * 0.6, GRID.reach, own);
  const dry = Math.max(smoothstep(-GRID.shore, 0.5, landDistance(p)), 1 - smoothstep(GRID.place, GRID.place + GRID.shore, nearest(p, CENTERS.get(land)!)));
  return inside * near * dry;
}

/** La brume d'une terre : ses deux voiles sur une grille qui suit le sol, les cases sans brume laissées de côté. */
function veilOf(pos: number[], nor: number[], col: number[], land: LinkedLand): void {
  const [r, g, b] = linearRgb(MIST_COLOR);
  const points = FEATURES.get(land)!;
  const minX = Math.min(...points.map((q) => q.x)) - GRID.reach;
  const maxX = Math.max(...points.map((q) => q.x)) + GRID.reach;
  const minZ = Math.min(...points.map((q) => q.z)) - GRID.reach;
  const maxZ = Math.max(...points.map((q) => q.z)) + GRID.reach;
  const nx = Math.ceil((maxX - minX) / GRID.step);
  const nz = Math.ceil((maxZ - minZ) / GRID.step);
  // Chaque sommet de la grille : sa part de brume, et le sol sous lui (jamais sous l'eau).
  const share: number[] = [];
  const floor: number[] = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const p = { x: minX + i * GRID.step, z: minZ + j * GRID.step };
      const s = veilShare(land, p);
      share.push(s);
      floor.push(s > 0 ? Math.max(0.05, standingHeight(heightAt(p))) : 0);
    }
  const at = (i: number, j: number) => j * (nx + 1) + i;
  for (const layer of VEIL_LAYERS) {
    const put = (i: number, j: number) => {
      const k = at(i, j);
      pos.push(minX + i * GRID.step, floor[k] + layer.lift, minZ + j * GRID.step);
      nor.push(0, 1, 0);
      col.push(r, g, b, share[k] * layer.alpha);
    };
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        if (!share[at(i, j)] && !share[at(i + 1, j)] && !share[at(i, j + 1)] && !share[at(i + 1, j + 1)]) continue;
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

/** La brume des terres fermées `lands` : un seul maillage (chaque terre calculée une fois). */
export function veilFacets(lands: readonly LinkedLand[]): VeilMesh {
  const parts = lands.map((land) => {
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
  return { positions: join('positions'), normals: join('normals'), colors: join('colors'), triangles: parts.reduce((n, m) => n + m.triangles, 0) };
}
