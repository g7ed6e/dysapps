// La brume de décor du 5e (GD-22, lot 2 ; fiche, § 2 : « les Hautes Brumes ») et la ligne de la falaise sur la Carte.
// La brume de décor n'est pas celle des terres fermées (./veil.ts, un état) : des nappes basses et immobiles, posées dans
// les failles (au pied de la falaise, là où le plateau tombe sur la forêt, et dans l'entaille du chenal de l'ouest) et au
// pied des aiguilles ; jamais sur un chemin ni sur un lieu, jamais sur la Carte (la vue la cache), jamais devant un
// texte. Rien ne bouge : « Réduire les animations » n'a rien à arrêter. Sur la Carte, le plateau se lit par la ligne de
// sa falaise, un trait double levé au-dessus de son rebord, sur l'île seulement. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, signedDistance, type Vec2 } from './geometry';
import { CHANNELS_5E, COAST_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E, PLATEAU, PLATEAU_5E } from './plan5e';
import { heightAt5e, landDistance5e, plateauShare } from './terrain5e';
import type { VeilMesh } from './veil';

/**
 * La brume des failles (artiste technique 3D ; à valider sur captures) : sa couleur (la Brume du pack, un rien plus chaude
 * sous le soleil bas) ; l'écart des nappes le long du pied de la falaise ; leur rayon (au plus) ; leur hauteur au-dessus
 * du sol, en deux voiles (le premier entre les troncs, le second au ras de la canopée : retouche du lot 2, directeur
 * artistique, « la nappe de brume de décor ne se voit pas en 3D » : posée à 1,4, elle restait sous les arbres) ; leur
 * transparence au cœur (leur bord à zéro) ; jusqu'où elles restent loin d'un chemin et d'un lieu ; leur rayon le plus
 * petit (une place plus étroite n'en reçoit pas).
 */
export const RIFT_MIST = {
  color: 0xf0ede4,
  step: 9,
  radius: 8,
  layers: [
    { lift: 2.2, alpha: 0.42 },
    { lift: 5.6, alpha: 0.3 },
  ],
  sides: 8,
  path: 3,
  place: 10,
  out: 3.5,
  smallest: 4,
} as const;

const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
  return PATH_EDGES_5E.map(([a, b]) => [at.get(a)!, at.get(b)!] as const);
})();

/** Le bord sud du plateau, d'ouest en est (son polygone sans ses deux coins du nord, hors de l'île). */
const CLIFF_LINE: readonly Vec2[] = PLATEAU_5E.slice(0, PLATEAU_5E.length - 2);

/** Une nappe : son centre, son rayon. */
export interface MistSpot {
  at: Vec2;
  radius: number;
}

/** Le rayon d'une nappe en `p` : assez loin des chemins et des lieux ; rien si la place est trop étroite. */
function spotRadius(p: Vec2): number {
  let r: number = RIFT_MIST.radius;
  for (const [u, v] of SEGMENTS) r = Math.min(r, distanceToPolyline(p, [u, v]) - RIFT_MIST.path);
  for (const pl of PLACES_5E) r = Math.min(r, distance(p, pl.center) - RIFT_MIST.place);
  return r >= RIFT_MIST.smallest ? r : 0;
}

/**
 * Les nappes : le long du pied de la falaise, un peu en bas, hors de l'eau ; dans l'entaille du chenal de l'ouest, sur
 * ses deux rives, là où il coupe le plateau ; au pied de chaque aiguille. Chacune loin des chemins et des lieux.
 */
export function riftMistSpots(): MistSpot[] {
  const out: MistSpot[] = [];
  const keep = (p: Vec2) => {
    const radius = spotRadius(p);
    if (radius > 0) out.push({ at: p, radius });
  };
  for (let k = 1; k < CLIFF_LINE.length; k++) {
    const a = CLIFF_LINE[k - 1];
    const b = CLIFF_LINE[k];
    const len = distance(a, b);
    // Vers le bas : la normale au bord, du côté sud (z croissant).
    const nx = -(b.z - a.z) / len;
    const nz = (b.x - a.x) / len;
    const [ox, oz] = nz > 0 ? [nx, nz] : [-nx, -nz];
    for (let d = RIFT_MIST.step / 2; d < len; d += RIFT_MIST.step) {
      const p = { x: a.x + ((b.x - a.x) * d) / len + ox * RIFT_MIST.out, z: a.z + ((b.z - a.z) * d) / len + oz * RIFT_MIST.out };
      if (landDistance5e(p) < 1 || plateauShare(p) > 0.3) continue;
      keep(p);
    }
  }
  // L'entaille du chenal de l'ouest : sur chaque rive, tant que le plateau la borde.
  const rift = CHANNELS_5E.ouest.line;
  for (let k = 1; k < rift.length; k++) {
    const a = rift[k - 1];
    const b = rift[k];
    const len = distance(a, b);
    for (let d = 0; d < len; d += RIFT_MIST.step) {
      for (const side of [-1, 1]) {
        const off = CHANNELS_5E.ouest.halfWidth + 3;
        const p = { x: a.x + ((b.x - a.x) * d) / len - (side * (b.z - a.z) * off) / len, z: a.z + ((b.z - a.z) * d) / len + (side * (b.x - a.x) * off) / len };
        if (landDistance5e(p) < 1 || plateauShare(p) > 0.3 || plateauShare({ x: p.x, z: p.z - 12 }) < 0.5) continue;
        keep(p);
      }
    }
  }
  // Au pied de chaque aiguille, du côté de la caméra (au sud).
  for (const n of NEEDLES_5E) keep({ x: n.at.x, z: n.at.z + n.radius * 0.6 });
  return out;
}

let mistCache: VeilMesh | null = null;

/** Les nappes des failles : deux disques à pans par nappe, l'un sur l'autre, pleins au cœur, effacés au bord ; un seul maillage. */
export function riftMistFacets(): VeilMesh {
  if (mistCache) return mistCache;
  const [r, g, b] = linearRgb(RIFT_MIST.color);
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const put = (x: number, y: number, z: number, a: number) => {
    pos.push(x, y, z);
    nor.push(0, 1, 0);
    col.push(r, g, b, a);
  };
  for (const { at: c, radius } of riftMistSpots())
    for (const layer of RIFT_MIST.layers) {
      const y = heightAt5e(c) + layer.lift;
      const n = RIFT_MIST.sides;
      for (let k = 0; k < n; k++) {
        const a0 = (2 * Math.PI * k) / n;
        const a1 = (2 * Math.PI * (k + 1)) / n;
        // Vu d'en haut, dans le sens inverse des aiguilles d'une montre (z vers le sud).
        put(c.x, y, c.z, layer.alpha);
        put(c.x + radius * Math.cos(a1), y, c.z + radius * Math.sin(a1), 0);
        put(c.x + radius * Math.cos(a0), y, c.z + radius * Math.sin(a0), 0);
      }
    }
  mistCache = { positions: new Float32Array(pos), normals: new Float32Array(nor), colors: new Float32Array(col), triangles: pos.length / 9 };
  return mistCache;
}

/** Le trait de la falaise s'arrête à tant d'unités en deçà de la côte : jamais sur la mer. */
const CLIFF_INLAND = 2;

/**
 * Le bord du plateau, sur l'île seulement : chaque côté de son polygone gardé là où il est à `CLIFF_INLAND` unités au
 * moins de la côte (cherché d'unité en unité), en un tronçon d'un seul tenant par côté.
 */
export function cliffMapSegments(): [Vec2, Vec2][] {
  const out: [Vec2, Vec2][] = [];
  for (let k = 1; k < CLIFF_LINE.length; k++) {
    const a = CLIFF_LINE[k - 1];
    const c = CLIFF_LINE[k];
    const n = Math.max(1, Math.ceil(distance(a, c)));
    const at = (i: number) => ({ x: a.x + ((c.x - a.x) * i) / n, z: a.z + ((c.z - a.z) * i) / n });
    let first = -1;
    let last = -1;
    for (let i = 0; i <= n; i++) {
      if (signedDistance(at(i), COAST_5E) <= CLIFF_INLAND) continue;
      if (first < 0) first = i;
      last = i;
    }
    if (first >= 0 && last > first) out.push([at(first), at(last)]);
  }
  return out;
}

/**
 * La ligne de la falaise sur la Carte (fiche, § 6 : « le plateau dessiné avec la ligne de sa falaise ») : deux traits, un
 * sombre et un clair dessus, le long du rebord, levés au-dessus du plateau pour se lire de haut ; d'une autre forme que
 * le tiret d'un chemin et que le trait double d'un pont. Seulement sur l'île (retouche du lot 2, directeur artistique :
 * le trait débordait sur la mer, aux deux bouts du plateau). Dans le maillage des lieux : aucun appel de plus.
 */
export function cliffMapLine(): Facets {
  const b = new FacetBuilder();
  const y = PLATEAU.height + 2.5;
  const segments = cliffMapSegments();
  const strip = (half: number, lift: number, color: number) => {
    for (const [a, c] of segments) {
      const len = distance(a, c);
      const nx = (-(c.z - a.z) / len) * half;
      const nz = ((c.x - a.x) / len) * half;
      b.quad([a.x + nx, y + lift, a.z + nz], [c.x + nx, y + lift, c.z + nz], [c.x - nx, y + lift, c.z - nz], [a.x - nx, y + lift, a.z - nz], color);
    }
  };
  strip(1.1, 0, CLIFF_MAP_COLORS.dark);
  strip(0.5, 0.05, CLIFF_MAP_COLORS.light);
  return b.build();
}

/**
 * Les deux traits de la falaise sur la Carte : le sombre, le clair dessus (référent dys, relecture du lot 2 : contraste
 * mesuré). Sous la lumière du 5e, vus de la Carte : le trait sombre contre la pierre du plateau, 4,4:1 (contre ses
 * dalles claires, 6,5:1 ; ses taches de mousse, 3,7:1) ; le trait clair contre le sombre, 10,9:1.
 */
export const CLIFF_MAP_COLORS = { dark: 0x3a362c, light: 0xefe4c8 } as const;
