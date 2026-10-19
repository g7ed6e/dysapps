// La brume de décor du 5e (GD-22, lot 2 ; fiche, § 2 : « les Hautes Brumes ») et la ligne de la falaise sur la Carte.
// La brume de décor n'est pas celle des terres fermées (./veil.ts, un état) : des nappes basses et immobiles, posées dans
// les failles (au pied de la falaise, là où le plateau tombe sur la forêt, et dans l'entaille du chenal de l'ouest) et au
// pied des aiguilles ; jamais sur un chemin ni sur un lieu, jamais sur la Carte (la vue la cache), jamais devant un
// texte. Rien ne bouge : « Réduire les animations » n'a rien à arrêter. Sur la Carte, le plateau se lit par la ligne de
// sa falaise, une bande sombre à dents levée au-dessus de son rebord, sur l'île seulement. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { CHANNELS_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E, PLATEAU, PLATEAU_5E } from './plan5e';
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

/** Le trait de la falaise s'arrête à tant d'unités en deçà de la côte et des chenaux : jamais sur l'eau. */
const CLIFF_INLAND = 2;

/**
 * Le bord du plateau, sur la terre seulement : chaque côté de son polygone gardé là où il est à `CLIFF_INLAND` unités au
 * moins de la côte et de l'eau des chenaux (`landDistance5e`, cherché d'unité en unité), en un tronçon par morceau d'un
 * seul tenant : un côté que coupe un chenal en donne deux (retouche du lot 2, directeur artistique : la ligne passait
 * au-dessus de l'eau du chenal de l'ouest, là où il entaille le plateau).
 */
export function cliffMapSegments(): [Vec2, Vec2][] {
  const out: [Vec2, Vec2][] = [];
  for (let k = 1; k < CLIFF_LINE.length; k++) {
    const a = CLIFF_LINE[k - 1];
    const c = CLIFF_LINE[k];
    const n = Math.max(1, Math.ceil(distance(a, c)));
    const at = (i: number) => ({ x: a.x + ((c.x - a.x) * i) / n, z: a.z + ((c.z - a.z) * i) / n });
    let first = -1;
    for (let i = 0; i <= n + 1; i++) {
      const dry = i <= n && landDistance5e(at(i)) > CLIFF_INLAND;
      if (dry && first < 0) first = i;
      if (!dry && first >= 0) {
        if (i - 1 > first) out.push([at(first), at(i - 1)]);
        first = -1;
      }
    }
  }
  return out;
}

/**
 * La ligne de la falaise sur la Carte (fiche, § 6 : « le plateau dessiné avec la ligne de sa falaise ») : le signe d'une
 * falaise sur une carte, asymétrique, d'une autre forme que le chemin (un ruban de sable bordé de sombre des deux côtés,
 * ./paths5e.ts, `pathMapEdges5e`) et que le trait double d'un pont. Une bande sombre dominante le long du rebord, côté
 * plateau, sur la pierre ; du seul côté du pied, un liseré clair sur la mousse et la forêt, coupé de dents sombres
 * tournées vers le bas, qu'aucun chemin ni pont ne porte (retouche du lot 2, directeur artistique : en trois traits,
 * clair, sombre, clair, le rebord se lisait comme une route, alors que le plateau ne se rejoint que par la Montée et sa
 * cabine). Levée au-dessus du plateau pour se lire de haut ; seulement sur la terre (le trait débordait sur la mer, aux deux
 * bouts du plateau, et sur l'eau du chenal de l'ouest). Dans le maillage des lieux : aucun appel de plus.
 */
export function cliffMapLine(): Facets {
  const b = new FacetBuilder();
  const y = PLATEAU.height + 2.5;
  const { back, front, rim, reach, pitch, tooth } = CLIFF_MAP_SHAPE;
  for (const [a, c] of cliffMapSegments()) {
    const len = distance(a, c);
    // Le long du tronçon, puis vers le pied (le plateau est au nord, à gauche du sens d'ouest en est).
    const ux = (c.x - a.x) / len;
    const uz = (c.z - a.z) / len;
    const at = (d: number, o: number, lift: number) => [a.x + ux * d - uz * o, y + lift, a.z + uz * d + ux * o] as const;
    // Chaque bande de `lo` à `hi` (vers le pied) : le même sens de tour que les dents (face vers le haut).
    const band = (lo: number, hi: number, lift: number, color: number) => b.quad(at(0, hi, lift), at(len, hi, lift), at(len, lo, lift), at(0, lo, lift), color);
    band(front, rim, 0, CLIFF_MAP_COLORS.light);
    band(-back, front, 0.05, CLIFF_MAP_COLORS.dark);
    // Les dents : leur base contre la bande sombre, leur pointe dans le liseré, qui reste d'un seul tenant au-dessous ;
    // espacées de `pitch`, centrées sur le tronçon.
    if (len < tooth) continue;
    const count = Math.floor((len - tooth) / pitch) + 1;
    const first = (len - (count - 1) * pitch) / 2;
    for (let k = 0; k < count; k++) {
      const d = first + k * pitch;
      b.triangle(at(d, reach, 0.1), at(d + tooth / 2, front, 0.1), at(d - tooth / 2, front, 0.1), CLIFF_MAP_COLORS.dark);
    }
  }
  return b.build();
}

/**
 * La forme de la falaise sur la Carte, en unités depuis le rebord, vers le pied (une unité, deux pixels environ sur la
 * Carte de la tablette) : la bande sombre de `back` côté plateau à `front` côté pied ; le liseré clair de `front` à
 * `rim` ; les dents sombres, larges de `tooth` à leur base, de pointe à `reach` (le liseré reste d'un seul tenant de
 * `reach` à `rim`, un trait clair continu sous la dentelure), une toutes les `pitch` unités. Le sombre
 * borde la pierre, le clair la mousse et la forêt du pied (référent dys, seconde relecture du lot 2 : le sombre seul
 * tombait à 2,6:1 contre la mousse sombre et la forêt).
 */
export const CLIFF_MAP_SHAPE = { back: 1.4, front: 0.6, rim: 2.8, reach: 2, tooth: 2, pitch: 5 } as const;

/**
 * Les couleurs de la falaise sur la Carte : le sombre (la bande et les dents), le clair (le liseré du pied) ; le sombre est aussi le
 * liseré des chemins sur la Carte (./paths5e.ts, `pathMapEdges5e`). Mesurés sur la capture de la Carte de la tablette
 * (référent dys, seconde relecture du lot 2) : le sombre contre la pierre du plateau, 4,8:1 ; le liseré clair contre la
 * mousse sombre du pied, 3,9:1, contre la forêt, 5,9:1 ; le clair contre le sombre, 10,9:1. La forme change à la retouche du lot 2, pas les teintes.
 */
export const CLIFF_MAP_COLORS = { dark: 0x3a362c, light: 0xefe4c8 } as const;
