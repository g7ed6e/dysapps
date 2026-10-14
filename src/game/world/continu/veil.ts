// La brume posée sur les lieux pas encore ouverts (piste 1, lot 1, deambuler-scenettes.md ; retouchée après les
// relectures du directeur artistique et du consultant Archipéo) : un banc bas, large et plat, posé sur le sol, de la
// teinte du lointain. Ses flancs sont les plus denses un peu au-dessus du sol, et il s'efface vers le haut et sur ses
// bords (une transparence par sommet, nulle au pourtour ; la vue efface aussi ce qu'on voit de biais, sa silhouette) :
// on devine la forme du lieu à travers, et son repère (la tour du Phare, la flèche de la grue) dépasse du dessus, plus
// clair. Trois dômes aplatis qui se chevauchent, sans pointe. Rien ne bouge : c'est un état, pas une
// animation (le lever se joue dans la vue). Elle se lève à l'approche de Kéo et pour la prochaine mission
// (./mission.ts, `veiledPlaces`). Code pur.
import { boundsOf } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { placeById, type PlaceId } from './plan6e';
import { modelOfPlace } from './places';
import { heightAt, standingHeight } from './terrain';

/** La couleur de la brume : la Brume du pack (#E5EBE3), celle du lointain aussi. */
export const MIST_COLOR = 0xe5ebe3;

/**
 * Un maillage de brume : trois sommets par triangle, et pour chacun sa normale lissée (la vue en tire la silhouette
 * douce), sa couleur et sa transparence (rouge, vert, bleu linéaires, alpha).
 */
export interface VeilMesh {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  triangles: number;
}

/** La hauteur du banc au-dessus du sol, en unités : un peu plus que Kéo, bien moins que la grue (7) ou le Phare (14). */
export const VEIL_HEIGHT = 3.4;

/**
 * Le profil d'un dôme, du pourtour au sommet : la part du rayon, la part de la hauteur, l'opacité. Le pourtour est
 * transparent et un peu sous le sol (le bord est doux) ; le flanc, qui cache le bas du lieu vu de la caméra, est le
 * plus dense ; le dessus, presque plat, s'efface un peu : le lieu se devine à travers, son repère dépasse.
 */
export const VEIL_PROFILE: readonly { r: number; y: number; a: number }[] = [
  { r: 1, y: -0.1, a: 0 },
  { r: 0.93, y: 0.35, a: 0.6 },
  { r: 0.82, y: 0.7, a: 0.72 },
  { r: 0.65, y: 0.92, a: 0.68 },
  { r: 0.35, y: 1, a: 0.62 },
  { r: 0, y: 1, a: 0.58 },
];

/** Le nombre de côtés d'un dôme : assez pour qu'il reste rond, sans pointe. */
const SIDES = 14;

/**
 * Ajoute un dôme aplati de rayon `radius` et de hauteur `height`, centré en `c`, posé sur le sol, jamais plus bas que
 * le pied du lieu (`floor`) : sur une berge ou au bord de l'eau, il couvre encore le lieu.
 */
function dome(pos: number[], nor: number[], col: number[], c: Vec2, radius: number, height: number, floor: number): void {
  const [r, g, b] = linearRgb(MIST_COLOR);
  // La normale lissée d'un anneau, tirée de la pente du profil autour de lui (vers le dehors et le haut).
  const slope = VEIL_PROFILE.map((_, k) => {
    const a = VEIL_PROFILE[Math.max(0, k - 1)];
    const b = VEIL_PROFILE[Math.min(VEIL_PROFILE.length - 1, k + 1)];
    const dr = (b.r - a.r) * radius;
    const dy = (b.y - a.y) * height;
    const l = Math.hypot(dr, dy) || 1;
    return { out: dy / l, up: -dr / l };
  });
  // Les sommets, anneau par anneau ; chacun posé sur le sol sous lui (le banc suit les pentes).
  const ring = (k: number) =>
    Array.from({ length: SIDES }, (_, s) => {
      const p = VEIL_PROFILE[k];
      const a = (2 * Math.PI * s) / SIDES;
      const x = c.x + Math.cos(a) * radius * p.r;
      const z = c.z + Math.sin(a) * radius * p.r;
      const n = slope[k];
      return [x, Math.max(floor, standingHeight(heightAt({ x, z }))) + p.y * height, z, p.a, Math.cos(a) * n.out, n.up, Math.sin(a) * n.out] as const;
    });
  const rings = VEIL_PROFILE.map((_, k) => ring(k));
  const put = (v: readonly [number, number, number, number, number, number, number]) => {
    pos.push(v[0], v[1], v[2]);
    nor.push(v[4], v[5], v[6]);
    col.push(r, g, b, v[3]);
  };
  // Les faces regardent vers le dehors (vers le haut) : vues de la caméra, dans le sens inverse des aiguilles d'une montre.
  for (let k = 0; k + 1 < rings.length; k++)
    for (let s = 0; s < SIDES; s++) {
      const n = (s + 1) % SIDES;
      const a0 = rings[k][s], a1 = rings[k][n], b0 = rings[k + 1][s], b1 = rings[k + 1][n];
      put(a0);
      put(b0);
      put(a1);
      if (k + 2 < rings.length) {
        put(a1);
        put(b0);
        put(b1);
      }
    }
}

/** Le banc d'un lieu : un grand dôme sur lui, deux plus petits de part et d'autre (est et ouest), qui le prolongent. */
function veilOf(pos: number[], nor: number[], col: number[], id: PlaceId): void {
  const place = placeById(id);
  const { min, max } = boundsOf(modelOfPlace(id).facets);
  const reach = Math.max(Math.abs(min[0]), Math.abs(max[0]), Math.abs(min[2]), Math.abs(max[2]));
  const radius = reach * 1.3 + 2;
  const { x, z } = place.center;
  const floor = standingHeight(heightAt(place.center));
  dome(pos, nor, col, place.center, radius, VEIL_HEIGHT, floor);
  dome(pos, nor, col, { x: x - radius * 0.7, z: z + radius * 0.15 }, radius * 0.65, VEIL_HEIGHT * 0.75, floor);
  dome(pos, nor, col, { x: x + radius * 0.7, z: z - radius * 0.1 }, radius * 0.6, VEIL_HEIGHT * 0.7, floor);
}

/** La brume des lieux `ids` : un seul maillage. */
export function veilFacets(ids: readonly PlaceId[]): VeilMesh {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  for (const id of ids) veilOf(pos, nor, col, id);
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), colors: new Float32Array(col), triangles: pos.length / 9 };
}
