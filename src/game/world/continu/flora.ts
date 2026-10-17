// La végétation, les rochers et les ombres peintes du monde continu (GD-20, point 3, lot 3, troisième et quatrième
// leviers graphiques ; décision du mainteneur du 17 octobre 2026) : des pins, des palmiers, des buissons ronds et des
// rochers en trois gris, en volumes bas-poly à aplats (une couleur par facette, rien d'importé), posés hors des chemins,
// des lieux, des ponts et des rives des bras de mer ; au pied de chacun et de chaque lieu, une ombre peinte, le sol
// sous elle plus sombre, du côté opposé au soleil. Ils entrent dans les tuiles du terrain (./tiles.ts) : aucun maillage
// ni appel de plus, et ce qui est loin ou hors champ tombe avec sa tuile. Leur place vient du hasard fixe de chaque
// case (`hash2`) : le même monde à chaque construction. Rien ne bouge. Code pur.
import { FacetBuilder, boundsOf, type Facets, type Placement } from './facets';
import { distance, distanceToPolyline, hash2, type Vec2 } from './geometry';
import { LOOKOUT_RAMP, PATH_EDGES, PATH_NODES, PLACES, PORT, TERRAIN } from './plan6e';
import { modelOfPlace } from './places';
import { SHADOW_DIR } from './sky';
import { drawTile, groundTone, heightOnFar, heightOnMesh, hillsAt, landDistance, straitClearance, tileRect, type HeightField, type TileDetail } from './terrain';

/** Ce qui pousse ou se pose : un pin, un palmier, un buisson, un rocher. */
type FloraKind = 'pin' | 'palmier' | 'buisson' | 'rocher';

/** Une plante ou un rocher : sa sorte, sa place, sa taille, son orientation, et sa teinte (un des trois gris d'un rocher). */
export interface FloraItem {
  kind: FloraKind;
  x: number;
  z: number;
  scale: number;
  yaw: number;
  shade: number;
  /** Dessinée de loin aussi (une part des pins, les palmiers, les gros rochers) ; sinon de près seulement. */
  far: boolean;
}

/**
 * Les couleurs (aplats) : le feuillage sombre des pins, celui des palmiers et des buissons, le bois des troncs, les trois
 * gris des rochers (planche des éléments, `repasse/elements/`, « végétation » et « rochers »).
 */
export const FLORA_COLORS = {
  pine: 0x2f7d62,
  pineLight: 0x3c9270,
  /** Les pins de loin (la forêt du fond, reprise du lot 3) : plus clairs, ils ne mouchettent plus la Carte. */
  pineFar: 0x4a9a78,
  pineFarLight: 0x5cab86,
  palm: 0x47a96f,
  bush: 0x3f9a74,
  bushLight: 0x55b083,
  trunk: 0x7a5538,
  rocks: [0x8d8984, 0xa5a19a, 0x74706b],
} as const;

/**
 * Où rien ne pousse : à moins de `path` unités d'un chemin (des grands arbres, `pathTall`), à moins de `placeGap` unités
 * de l'emprise d'un lieu (`placeRadius`), `strait` d'un bras de mer (les rives et les ponts), à l'Escale (`PORT_KEEP`,
 * son quai, sa place, ses bâtiments et leurs abords, dans son repère), dans l'eau. Un grand arbre ne pousse pas non plus
 * devant la caméra : à moins de `camera` unités au sud d'un chemin (la caméra suit Kéo depuis le sud), d'où il couperait
 * Kéo. Seuls des rochers se posent sur la rive d'un bras de mer (retouche du lot 3, d'après les concepts validés :
 * « détroit », des blocs gris au bord de l'eau), à plus de `bank` unités de son eau et `bankPath` d'un chemin (les culées
 * et les ponts restent dégagés) ; de même, de gros blocs gris sur la côte (reprise du lot 3, directeur artistique), à
 * moins de `coast` unités de l'eau et plus de `coastPath` d'un chemin. Autour d'un lieu (reprise du lot 3, directeur
 * artistique), un bosquet le cadre, de `placeGap` à `placeBand` unités de son emprise, jamais au sud de son centre (entre
 * la caméra et Kéo) ; le long des chemins, quelques plantes et rochers de premier plan, jusqu'à `edge` unités.
 */
export const FLORA_KEEP = { path: 1.6, pathTall: 3, placeGap: 4, placeBand: 8, strait: 5, camera: 7.5, bank: 0.6, bankPath: 6, coast: 2.6, coastPath: 4, edge: 5.5 } as const;

/** Le rayon de l'emprise d'un lieu (de son centre au plus loin de son modèle, en x et en z), entre 2 et 10 unités. */
const placeRadii = new Map<string, number>();
export function placeRadius(id: (typeof PLACES)[number]['id']): number {
  let r = placeRadii.get(id);
  if (r === undefined) {
    const box = boundsOf(modelOfPlace(id).facets);
    r = Math.max(2, Math.min(10, Math.max(-box.min[0], box.max[0], -box.min[2], box.max[2])));
    placeRadii.set(id, r);
  }
  return r;
}

/** L'Escale et ses abords, dans le repère du Port (`PORT.toLocal`) : rien n'y pousse. */
const PORT_KEEP = { x0: -9, x1: 43, z0: -15, z1: 26 } as const;

/** Le pas de la grille des places possibles (une au plus par case), en unités. */
const FLORA_CELL = 2.6;

/**
 * La part des cases où quelque chose peut pousser (retouche du lot 3 : 0,6 au lieu de 0,42, des bosquets plus larges ;
 * la végétation des concepts validés est plus fournie ; reprise : 0,5, la forêt du fond moins dense).
 */
const FLORA_DENSITY = 0.5;

/** Les arêtes des chemins, en segments, et la rampe de la Vigie. */
const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES.map((n) => [n.id, n.at]));
  return [...PATH_EDGES.map(([a, b]) => [at.get(a)!, at.get(b)!] as const), [LOOKOUT_RAMP.from, LOOKOUT_RAMP.to] as const];
})();

/** La distance d'un point aux chemins, au plus `cap` (les segments trop loin sont écartés d'abord). */
function pathDistance(p: Vec2, cap: number): number {
  let d = cap;
  for (const [a, b] of SEGMENTS) {
    if (Math.min(a.x, b.x) - d > p.x || Math.max(a.x, b.x) + d < p.x || Math.min(a.z, b.z) - d > p.z || Math.max(a.z, b.z) + d < p.z) continue;
    d = Math.min(d, distanceToPolyline(p, [a, b]));
  }
  return d;
}

/** Les bosquets : un champ lent, fixe (des taches de forêt sur les hauteurs, des clairières entre elles). */
const grove = (p: Vec2) => 0.55 * Math.sin(p.x * 0.061 + 0.4) * Math.sin(p.z * 0.073 + 1.7) + 0.45 * Math.sin(p.x * 0.029 - p.z * 0.034 + 2.6);

/** La place de chaque plante d'une tuile, tirée une fois (le plan ne change pas). */
const cache = new Map<number, readonly FloraItem[]>();

/** Ce qui pousse dans la tuile (`tx`, `tz`), sur le sol du plan (`ground`, la hauteur de près). */
export function floraOf(field: HeightField, tx: number, tz: number): readonly FloraItem[] {
  const key = tz * TERRAIN.tilesX + tx;
  const known = cache.get(key);
  if (known) return known;
  const r = tileRect(tx, tz);
  const out: FloraItem[] = [];
  const i0 = Math.ceil(r.minX / FLORA_CELL);
  const j0 = Math.ceil(r.minZ / FLORA_CELL);
  for (let j = j0; j * FLORA_CELL < r.maxZ; j++)
    for (let i = i0; i * FLORA_CELL < r.maxX; i++) {
      const roll = hash2(i * 3 + 1, j * 5 + 2);
      if (roll > FLORA_DENSITY) continue;
      const p = { x: (i + 0.15 + 0.7 * hash2(i, j + 911)) * FLORA_CELL, z: (j + 0.15 + 0.7 * hash2(i + 577, j)) * FLORA_CELL };
      if (p.x >= r.maxX || p.z >= r.maxZ) continue;
      const item = pick(field, p, roll / FLORA_DENSITY, hash2(j + 41, i + 83));
      if (item) out.push(item);
    }
  cache.set(key, out);
  return out;
}

/** La sorte de ce qui pousse en `p`, ou rien (`roll`, `look` : le hasard fixe de la case, de 0 à 1). */
function pick(field: HeightField, p: Vec2, roll: number, look: number): FloraItem | null {
  const d = landDistance(p);
  if (d < 0.3) return null;
  const bank = straitClearance(p);
  if (bank < FLORA_KEEP.bank) return null;
  const port = PORT.toLocal(p);
  if (port.x > PORT_KEEP.x0 && port.x < PORT_KEEP.x1 && port.z > PORT_KEEP.z0 && port.z < PORT_KEEP.z1) return null;
  // Le lieu le plus près, rapporté à son emprise : trop près, rien ; dans la bande qui le cadre, un bosquet.
  let gap = Infinity;
  let south = false;
  for (const pl of PLACES) {
    const g = distance(p, pl.center) - placeRadius(pl.id);
    if (g < gap) {
      gap = g;
      south = p.z > pl.center.z + 1;
    }
  }
  if (gap < FLORA_KEEP.placeGap) return null;
  const path = pathDistance(p, FLORA_KEEP.camera + 1);
  if (path < FLORA_KEEP.path) return null;
  const base = { x: p.x, z: p.z, yaw: look * 2 * Math.PI, shade: Math.floor(look * 3) % 3 };
  if (bank < FLORA_KEEP.strait) {
    // La rive d'un bras de mer : des rochers seuls, loin des chemins et des ponts.
    if (path < FLORA_KEEP.bankPath || roll > 0.55) return null;
    return { kind: 'rocher', scale: 1.1 + 0.9 * look, ...base, far: true };
  }
  // Hors de la mer, le haut de l'estran : de gros blocs gris sur la côte, loin des chemins.
  if (d < FLORA_KEEP.coast) {
    if (path < FLORA_KEEP.coastPath || roll > 0.45) return null;
    return { kind: 'rocher', scale: 1.4 + 1.0 * look, ...base, far: true };
  }
  const h = heightOnMesh(field, p.x, p.z);
  const slope = slopeAt(field, p);
  const g = grove(p);
  const hill = hillsAt(p) > 0.6;
  let kind: FloraKind | null = null;
  let scale = 1;
  // Pour la forêt du fond : une part des pins seulement est dessinée de loin.
  let far = look < 0.55;
  if (gap < FLORA_KEEP.placeBand) {
    // Le bosquet qui cadre un lieu (de près seulement : sur la Carte, rien sous son nom), jamais au sud de lui.
    if (south || roll > 0.75) return null;
    kind = roll < 0.45 ? 'pin' : 'buisson';
    scale = 0.85 + 0.4 * look;
    far = false;
  } else if (slope > 0.75 && !hill) {
    // Ce qui est raide : des rochers, parfois.
    if (roll < 0.35) kind = 'rocher';
    scale = 0.8 + 0.7 * look;
  } else if (d < 7 && h < 1.6) {
    // Le haut de la plage : des palmiers épars, quelques rochers.
    if (roll < 0.22) kind = 'palmier';
    else if (roll < 0.32) kind = 'rocher';
    scale = 0.85 + 0.35 * look;
    far = kind === 'palmier';
  } else if (hill) {
    // Une colline : ses pans restent nus (de grandes facettes), sauf un bosquet à son pied et un rocher, parfois.
    if (g > 0.24 && roll < 0.35 && hillsAt(p) < 2.5) kind = 'pin';
    else if (roll < 0.05) kind = 'rocher';
    scale = 0.8 + 0.5 * look;
  } else if (g > 0.12) {
    // Un bosquet : des pins serrés, des buissons à l'orée.
    kind = g > 0.24 ? (roll < 0.85 ? 'pin' : 'buisson') : roll < 0.55 ? 'buisson' : roll < 0.7 ? 'pin' : null;
    scale = 0.8 + 0.5 * look;
  } else if (path < FLORA_KEEP.edge && roll < 0.3) {
    // Le premier plan, le long d'un chemin : un buisson, un gros rocher à facettes, un pin.
    kind = roll < 0.14 ? 'buisson' : roll < 0.22 ? 'rocher' : 'pin';
    scale = kind === 'rocher' ? 1 + 0.6 * look : 0.8 + 0.4 * look;
    far = false;
  } else if (roll < 0.12) {
    kind = 'buisson';
    scale = 0.75 + 0.5 * look;
  } else if (roll < 0.15) {
    kind = 'pin';
    scale = 0.85 + 0.4 * look;
  } else if (roll < 0.19) {
    kind = 'rocher';
    scale = 0.6 + 0.6 * look;
  }
  if (!kind) return null;
  const tall = kind === 'pin' || kind === 'palmier';
  if (tall && (path < FLORA_KEEP.pathTall || inFrontOfCamera(p))) return null;
  // De loin, ni buisson ni petit rocher : ils mouchetaient la Carte.
  if (kind === 'buisson' || (kind === 'rocher' && scale < 1.3)) far = false;
  return { kind, scale, ...base, far };
}

/** La pente du sol en `p` : la longueur de sa pente (0 à plat, 1 à 45°). */
function slopeAt(field: HeightField, p: Vec2): number {
  const e = 0.8;
  const gx = (heightOnMesh(field, p.x + e, p.z) - heightOnMesh(field, p.x - e, p.z)) / (2 * e);
  const gz = (heightOnMesh(field, p.x, p.z + e) - heightOnMesh(field, p.x, p.z - e)) / (2 * e);
  return Math.hypot(gx, gz);
}

/** Un grand arbre en `p` serait-il entre la caméra et Kéo, Kéo sur un chemin au nord de lui ? */
function inFrontOfCamera(p: Vec2): boolean {
  for (let k = 1.5; k <= FLORA_KEEP.camera; k += 1.5) if (pathDistance({ x: p.x, z: p.z - k }, 2) < 1.8) return true;
  return false;
}

/** Une ombre peinte : un disque à `sides` côtés posé sur le sol, plus sombre que lui, du côté opposé au soleil. */
export const SHADOW = { lift: 0.05, darken: [0.66, 0.74, 0.84], sides: 7 } as const;

/** La couleur d'une ombre sur un sol de couleur `ground` (sRGB) : plus sombre et plus froide, jamais noire. */
export function shadowColor(ground: number): number {
  const [kr, kg, kb] = SHADOW.darken;
  const r = Math.round(((ground >> 16) & 255) * kr);
  const g = Math.round(((ground >> 8) & 255) * kg);
  const b = Math.round((ground & 255) * kb);
  return (r << 16) | (g << 8) | b;
}

/**
 * Une ombre peinte en (`x`, `z`), de rayon `radius` (en x) et `depth` (en z, l'ellipse), posée sur `ground` ; son centre
 * décalé de `shift` unités vers le côté opposé au soleil. Rend le nombre de triangles.
 */
function shadow(b: FacetBuilder | null, ground: (x: number, z: number) => number, x: number, z: number, radius: number, shift: number): number {
  const n = SHADOW.sides;
  if (!b) return n;
  const cx = x + SHADOW_DIR.x * shift;
  const cz = z + SHADOW_DIR.z * shift;
  const color = shadowColor(groundTone(cx, cz, ground(cx, cz)));
  const at = (px: number, pz: number): [number, number, number] => [px, ground(px, pz) + SHADOW.lift, pz];
  const c = at(cx, cz);
  const rim = Array.from({ length: n }, (_, k) => at(cx + radius * Math.cos((2 * Math.PI * k) / n), cz + radius * Math.sin((2 * Math.PI * k) / n)));
  // Vu d'en haut, dans le sens inverse des aiguilles d'une montre (le côté éclairé de la facette, tourné vers le ciel).
  for (let k = 0; k < n; k++) b.triangle(c, rim[(k + 1) % n], rim[k], color);
  return n;
}

/** Ce qu'une plante coûte, en triangles, de près et de loin (sans son ombre). */
const COST: Record<FloraKind, Record<TileDetail, number>> = {
  pin: { near: 27, far: 10 },
  palmier: { near: 36, far: 18 },
  buisson: { near: 15, far: 5 },
  rocher: { near: 15, far: 5 },
};

/** Le rayon de l'ombre de chaque sorte, à l'échelle 1. */
const SHADOW_RADIUS: Record<FloraKind, number> = { pin: 0.95, palmier: 0.8, buisson: 0.62, rocher: 0.6 };

/**
 * Les facettes de ce qui pousse dans une tuile (sa végétation, ses rochers et leurs ombres, puis l'ombre des lieux dont
 * le centre y tombe), au niveau de détail de la tuile ; ou leur seul nombre (sans `b`).
 */
function drawFlora(field: HeightField, tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
  const ground = detail === 'near' ? (x: number, z: number) => heightOnMesh(field, x, z) : (x: number, z: number) => heightOnFar(field, x, z);
  let count = 0;
  for (const it of floraOf(field, tx, tz)) {
    // De loin, une part seulement (`far`), sans ombre peinte : la Carte et le fond ne sont plus mouchetés.
    if (detail === 'far' && !it.far) continue;
    if (detail === 'near') count += shadow(b, ground, it.x, it.z, SHADOW_RADIUS[it.kind] * it.scale, 0.35 * it.scale);
    count += COST[it.kind][detail];
    if (b) drawItem(b, it, ground(it.x, it.z) - 0.08, detail);
  }
  for (const s of placeShadows()) {
    if (Math.floor((s.x - TERRAIN.minX) / (TERRAIN.step * TERRAIN.tileCells)) !== tx || Math.floor((s.z - TERRAIN.minZ) / (TERRAIN.step * TERRAIN.tileCells)) !== tz) continue;
    count += shadow(b, ground, s.x, s.z, s.radius, s.radius * 0.45);
  }
  return count;
}

/** L'ombre au pied de chaque lieu : son centre, et un rayon tiré de son emprise (entre 1,6 et 4,5 unités). */
let placeShadowList: { x: number; z: number; radius: number }[] | null = null;
function placeShadows(): readonly { x: number; z: number; radius: number }[] {
  placeShadowList ??= PLACES.map((p) => {
    const box = boundsOf(modelOfPlace(p.id).facets);
    const extent = Math.min(box.max[0] - box.min[0], box.max[2] - box.min[2]);
    return { x: p.center.x, z: p.center.z, radius: Math.max(1.6, Math.min(4.5, 0.42 * extent)) };
  });
  return placeShadowList;
}

/** Une plante ou un rocher, son pied à `y`. */
function drawItem(b: FacetBuilder, it: FloraItem, y: number, detail: TileDetail): void {
  const s = it.scale;
  const at = (dy: number): Placement => ({ x: it.x, y: y + dy * s, z: it.z, yaw: it.yaw });
  const C = FLORA_COLORS;
  switch (it.kind) {
    case 'pin':
      if (detail === 'near') {
        b.prism(at(0), 0.13 * s, 0.11 * s, 0.6 * s, 4, C.trunk);
        b.prism(at(0.45), 1.0 * s, 0, 1.35 * s, 5, C.pine);
        b.prism(at(1.15), 0.78 * s, 0, 1.15 * s, 5, C.pineLight);
        b.prism(at(1.8), 0.52 * s, 0, 1.0 * s, 5, C.pine);
      } else {
        b.prism(at(0.3), 0.95 * s, 0, 1.7 * s, 5, C.pineFar);
        b.prism(at(1.45), 0.6 * s, 0, 1.35 * s, 5, C.pineFarLight);
      }
      return;
    case 'palmier':
      palm(b, it, y, detail);
      return;
    case 'buisson':
      if (detail === 'near') b.prism(at(-0.05), 0.62 * s, 0.38 * s, 0.55 * s, 5, C.bush, C.bushLight);
      else b.prism(at(-0.05), 0.6 * s, 0, 0.75 * s, 5, C.bush);
      return;
    case 'rocher': {
      const color = C.rocks[it.shade];
      if (detail === 'near') b.prism(at(-0.1), 0.62 * s, 0.34 * s, 0.6 * s, 5, color, C.rocks[(it.shade + 1) % 3]);
      else b.prism(at(-0.1), 0.6 * s, 0, 0.7 * s, 5, color);
    }
  }
}

/**
 * Un palmier : un tronc penché en deux tronçons (un seul de loin), puis cinq palmes, chacune un V de deux facettes de
 * près (une de loin), tombant du haut.
 */
function palm(b: FacetBuilder, it: FloraItem, y: number, detail: TileDetail): void {
  const s = it.scale;
  const C = FLORA_COLORS;
  const lean = { x: Math.cos(it.yaw) * 0.35 * s, z: Math.sin(it.yaw) * 0.35 * s };
  const top: [number, number, number] = [it.x + 2 * lean.x, y + 2.5 * s, it.z + 2 * lean.z];
  if (detail === 'near') {
    trunk(b, [it.x, y, it.z], [it.x + 0.6 * lean.x, y + 1.3 * s, it.z + 0.6 * lean.z], 0.13 * s, 0.11 * s, C.trunk);
    trunk(b, [it.x + 0.6 * lean.x, y + 1.3 * s, it.z + 0.6 * lean.z], top, 0.11 * s, 0.09 * s, C.trunk);
  } else trunk(b, [it.x, y, it.z], top, 0.13 * s, 0.09 * s, C.trunk);
  const fronds = 5;
  for (let k = 0; k < fronds; k++) {
    const a = it.yaw + (2 * Math.PI * k) / fronds;
    const ca = Math.cos(a), sa = Math.sin(a);
    const len = 1.35 * s;
    const tip: [number, number, number] = [top[0] + ca * len, top[1] - 0.55 * s, top[2] + sa * len];
    const mid: [number, number, number] = [top[0] + ca * len * 0.5, top[1] + 0.12 * s, top[2] + sa * len * 0.5];
    const w = 0.32 * s;
    const left: [number, number, number] = [mid[0] - sa * w, mid[1] - 0.08 * s, mid[2] + ca * w];
    const right: [number, number, number] = [mid[0] + sa * w, mid[1] - 0.08 * s, mid[2] - ca * w];
    if (detail === 'near') {
      // Une palme : deux facettes en V autour de sa nervure, vues d'en haut.
      upward(b, top, mid, left, C.palm);
      upward(b, top, right, mid, C.palm);
      upward(b, mid, tip, left, C.bush);
      upward(b, mid, right, tip, C.bush);
    } else {
      upward(b, top, right, left, C.palm);
      upward(b, left, right, tip, C.palm);
    }
  }
}

/** Un triangle tourné vers le ciel (une palme se voit d'en haut), quel que soit l'ordre de ses sommets. */
function upward(b: FacetBuilder, p: readonly [number, number, number], q: readonly [number, number, number], r: readonly [number, number, number], color: number): void {
  const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
  if (ny >= 0) b.triangle(p, q, r, color);
  else b.triangle(p, r, q, color);
}

/** Un tronçon de tronc à quatre côtés, de `from` à `to`, sans dessus ni dessous. */
function trunk(b: FacetBuilder, from: readonly [number, number, number], to: readonly [number, number, number], r0: number, r1: number, color: number): void {
  const ring = (c: readonly [number, number, number], r: number) =>
    [0, 1, 2, 3].map((k) => [c[0] + r * Math.cos((Math.PI * k) / 2 + Math.PI / 4), c[1], c[2] + r * Math.sin((Math.PI * k) / 2 + Math.PI / 4)] as [number, number, number]);
  const lo = ring(from, r0);
  const hi = ring(to, r1);
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.quad(lo[n], lo[k], hi[k], hi[n], color);
  }
}

/** Une tuile du terrain entière (lot 3) : son sol et son écume (./terrain.ts), puis ce qui y pousse et les ombres. */
export function landTileFacets(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTile(field, tx, tz, detail, b);
  drawFlora(field, tx, tz, detail, b);
  return b.build();
}

/** Le nombre de triangles de chaque tuile entière à un niveau de détail, par rang (sans rien construire). */
export function landTileCounts(field: HeightField, detail: TileDetail): Int32Array {
  const out = new Int32Array(TERRAIN.tilesX * TERRAIN.tilesZ);
  for (let tz = 0; tz < TERRAIN.tilesZ; tz++) for (let tx = 0; tx < TERRAIN.tilesX; tx++) out[tz * TERRAIN.tilesX + tx] = drawTile(field, tx, tz, detail, null) + drawFlora(field, tx, tz, detail, null);
  return out;
}
