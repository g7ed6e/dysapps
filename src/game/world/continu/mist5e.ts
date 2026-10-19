// La brume de décor du 5e (GD-22, lot 2 ; fiche, § 2 : « les Hautes Brumes ») et la ligne de la falaise sur la Carte.
// La brume de décor n'est pas celle des terres fermées (./veil.ts, un état) : des nappes basses et immobiles, posées dans
// les failles, au pied de la falaise, là où le plateau tombe sur la forêt ; jamais sur un chemin ni sur un lieu, jamais
// sur la Carte (la vue la cache), jamais devant un texte. Rien ne bouge : « Réduire les animations » n'a rien à arrêter.
// Sur la Carte, le plateau se lit par la ligne de sa falaise, un trait double levé au-dessus de son rebord. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E, PLATEAU, PLATEAU_5E } from './plan5e';
import { heightAt5e, landDistance5e, plateauShare } from './terrain5e';
import type { VeilMesh } from './veil';

/**
 * La brume des failles (artiste technique 3D ; à valider sur captures) : sa couleur (la Brume du pack, un rien plus chaude
 * sous le soleil bas) ; l'écart des nappes le long du pied de la falaise ; leur rayon ; leur hauteur au-dessus du sol ;
 * leur transparence au cœur (leur bord à zéro) ; jusqu'où elles restent loin d'un chemin et d'un lieu.
 */
export const RIFT_MIST = { color: 0xf0ede4, step: 9, radius: 7, lift: 1.4, alpha: 0.42, sides: 8, path: 4, place: 12, out: 3.5 } as const;

const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
  return PATH_EDGES_5E.map(([a, b]) => [at.get(a)!, at.get(b)!] as const);
})();

/** Le bord sud du plateau, d'ouest en est (son polygone sans ses deux coins du nord, hors de l'île). */
const CLIFF_LINE: readonly Vec2[] = PLATEAU_5E.slice(0, PLATEAU_5E.length - 2);

/** Les centres des nappes : le long du pied de la falaise, un peu en bas, loin des chemins, des lieux et de l'eau. */
export function riftMistSpots(): Vec2[] {
  const out: Vec2[] = [];
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
      if (SEGMENTS.some(([u, v]) => distanceToPolyline(p, [u, v]) < RIFT_MIST.radius + RIFT_MIST.path)) continue;
      if (PLACES_5E.some((pl) => distance(p, pl.center) < RIFT_MIST.place + RIFT_MIST.radius)) continue;
      out.push(p);
    }
  }
  return out;
}

let mistCache: VeilMesh | null = null;

/** Les nappes des failles : un disque à pans par nappe, plein au cœur, effacé au bord ; un seul maillage. */
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
  for (const c of riftMistSpots()) {
    const y = heightAt5e(c) + RIFT_MIST.lift;
    const n = RIFT_MIST.sides;
    for (let k = 0; k < n; k++) {
      const a0 = (2 * Math.PI * k) / n;
      const a1 = (2 * Math.PI * (k + 1)) / n;
      // Vu d'en haut, dans le sens inverse des aiguilles d'une montre (z vers le sud).
      put(c.x, y, c.z, RIFT_MIST.alpha);
      put(c.x + RIFT_MIST.radius * Math.cos(a1), y, c.z + RIFT_MIST.radius * Math.sin(a1), 0);
      put(c.x + RIFT_MIST.radius * Math.cos(a0), y, c.z + RIFT_MIST.radius * Math.sin(a0), 0);
    }
  }
  mistCache = { positions: new Float32Array(pos), normals: new Float32Array(nor), colors: new Float32Array(col), triangles: pos.length / 9 };
  return mistCache;
}

/**
 * La ligne de la falaise sur la Carte (fiche, § 6 : « le plateau dessiné avec la ligne de sa falaise ») : deux traits, un
 * sombre et un clair dessus, le long du rebord, levés au-dessus du plateau pour se lire de haut ; d'une autre forme que
 * le tiret d'un chemin et que le trait double d'un pont. Dans le maillage des lieux : aucun appel de plus.
 */
export function cliffMapLine(): Facets {
  const b = new FacetBuilder();
  const y = PLATEAU.height + 2.5;
  const strip = (half: number, lift: number, color: number) => {
    for (let k = 1; k < CLIFF_LINE.length; k++) {
      const a = CLIFF_LINE[k - 1];
      const c = CLIFF_LINE[k];
      const len = distance(a, c);
      const nx = (-(c.z - a.z) / len) * half;
      const nz = ((c.x - a.x) / len) * half;
      b.quad([a.x + nx, y + lift, a.z + nz], [c.x + nx, y + lift, c.z + nz], [c.x - nx, y + lift, c.z - nz], [a.x - nx, y + lift, a.z - nz], color);
    }
  };
  strip(1.1, 0, 0x5d5a4e);
  strip(0.5, 0.05, 0xe8dcc0);
  return b.build();
}
