// Les pièces communes des objets dessinés d'Archipéo (lot 1 du 6e, piste 3 « hybride ») : la palette d'un objet, et ce
// qui revient d'un objet à l'autre. La barrière et la lanterne sur poteau sont celles des cours
// (../architecture/yardPieces.ts : mêmes facettes, mêmes couleurs du kit) ; s'y ajoutent la caisse, la dalle, le plateau
// sur pieds, le petit toit (`Workshop.roof`), le bassin, la marche de pierre, le flacon, et pour le reste de l'archipel le
// trophée du Gardien rallumé, la barque, la caisse, le fanion et le foyer du quai. Trapues, rien de fin ni d'ajouré (au
// moins 0,15 case), deux ou trois couleurs chacune. Code pur, sans Three.js.
import { BLOCKS, type BlockId } from '../../biomes';
import { mixColor } from '../daylight';
import { DELAVE } from '../decor/brush';
import type { ArchipelagoId } from '../map';
import { ambianceDe, type Couleur, couleurDeMatiere, type Faces } from '../palette';
import type { TextureKind } from '../pixels';
import { couleursDuToit } from '../roofs';
import { barriereDeCour, KITS, LANTERNE_DE_COUR, type Role } from '../architecture';
import type { Facette } from '../architecture/rooms';
import type { Workshop, Tint } from './workshop';
import type { V3 } from '../decor/brush';

/**
 * Les couleurs propres aux objets (concepts du directeur artistique, les mêmes que le puits et les pièces de la cour) :
 * le bois des poteaux et des lisses, le fer, l'ardoise, la pierre et la dalle, l'eau et son liseré, la feuille, la
 * braise, le goudron de la coque.
 */
export const OBJECT_COLORS = {
  wood: 0x6e4a2c,
  lightWood: 0x7a5434,
  iron: 0x3a2a22,
  slate: 0x4e6378,
  stone: 0x8e8c84,
  darkStone: 0x6f6d66,
  slab: 0xcfc6b4,
  water: 0x4a9be0,
  edge: 0x8fc4ee,
  leaf: 0x5e9a3e,
  ember: 0xc0764a,
  tar: 0x3b2d20,
  cream: 0xf1e6cc,
} as const;

/** Les couleurs d'un objet posé dans un archipel : sous son voile, délavées sur une île fermée. */
export interface Paint {
  readonly a: ArchipelagoId;
  readonly muted: boolean;
  /** Une matière (les couleurs mêmes du bloc, `couleurDeMatiere`). */
  material(t: TextureKind): Faces;
  /** La matière d'un bloc. */
  block(b: BlockId): Faces;
  /** Une couleur propre à l'objet, sous le voile. */
  color(c: Couleur): Couleur;
  /** Un rôle du kit (le poteau et les lisses de la barrière, la pierre, la dalle, le fer et l'ardoise de la lanterne). */
  role(r: Role): Couleur;
  /** La couverture de l'île (ardoise, ou terre cuite à la Ferme et à la Mine). */
  roof(): Faces;
}

export function paintFor(a: ArchipelagoId, island: string | undefined, muted: boolean): Paint {
  const [tint, strength] = ambianceDe(a).voile;
  const faded = (c: Couleur) => (muted ? mixColor(c, DELAVE[0], DELAVE[1]) : c);
  const material = (t: TextureKind): Faces => {
    const f = couleurDeMatiere(a, t);
    return { dessus: faded(f.dessus), cote: faded(f.cote) };
  };
  return {
    a,
    muted,
    material,
    block: (b) => material(BLOCKS[b].texture as TextureKind),
    color: (c) => faded(mixColor(c, tint, strength)),
    role: (r) => faded(mixColor(KITS[a].couleurs[r] ?? OBJECT_COLORS.wood, tint, strength)),
    roof: () => couleursDuToit(a, island, muted),
  };
}

/** La teinte d'une facette de pièce de cour : son rôle du kit. */
const byRole = (pe: Paint) => (f: Facette) => pe.role(f.role ?? 'yardPost');

/** Le poteau de barrière seul des cours (son chapeau en pyramide), dans la case (x, y), posé en z : 12 triangles. */
export function fencePost(at: Workshop, pe: Paint, x: number, y: number, z: number): void {
  at.facets(barriereDeCour('seul', null, true).facettes, x, y, z, byRole(pe));
}

/** Les mesures de la lanterne sur poteau (celle des cours : ../architecture/yardPieces.ts). */
const LANTERN_POST = { side: 0.24, foot: { side: 0.44, upper: 0.14 } } as const;

/**
 * La lanterne sur poteau des cours, dans la case (x, y) : le pied de pierre posé en `zFoot` (s'il est sous la tête), le
 * poteau jusqu'à `zHead`, la tête de bois, de fer et d'ardoise posée en `zHead`, ses quatre vitres dans le feu
 * (allumées la nuit, sans clignoter). Une tête seule si `zFoot` est `null`. 42 triangles et 8 de vitres, avec le poteau.
 */
export function postLantern(at: Workshop, pe: Paint, x: number, y: number, zFoot: number | null, zHead: number): void {
  const { side, foot } = LANTERN_POST;
  if (zFoot !== null && zHead > zFoot) {
    at.block(x + 0.5, y + 0.5, foot.side, foot.side, zFoot, zFoot + foot.upper, pe.role('yardStone'));
    at.block(x + 0.5, y + 0.5, side, side, zFoot + foot.upper, zHead, pe.role('yardPost'), { bottom: true, top: true });
  }
  at.facets(LANTERNE_DE_COUR, x, y, zHead, byRole(pe), pe.role('lanternGlass'));
}

/**
 * Une caisse de (x0, y0) à (x1, y1), de z0 à z1, dans une matière (le carton de Bulle, le bois du quai) : le corps, et
 * son couvercle qui déborde un peu, d'un ton plus sombre (`rim`). 20 triangles.
 */
export function crate(at: Workshop, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, body: Tint, rim: Tint): void {
  const d = 0.035;
  const h = Math.min(0.12, (z1 - z0) * 0.18);
  at.box(x0, x1, y0, y1, z0, z1 - h, body, { bottom: true, top: true });
  at.box(x0 - d, x1 + d, y0 - d, y1 + d, z1 - h, z1, rim);
}

/** Une dalle posée, de (x0, y0) à (x1, y1), haute de `h` depuis z0, sans dessous : 10 triangles. */
export function slab(at: Workshop, x0: number, x1: number, y0: number, y1: number, z0: number, h: number, t: Tint): void {
  at.box(x0, x1, y0, y1, z0, z0 + h, t);
}

/**
 * Un plateau sur pieds (l'établi, l'urne, le banc) : le plateau de (x0, y0) à (x1, y1), son dessus en `zHigh`, épais de
 * `thick`, dans sa matière ; les pieds carrés de `legSide` aux points donnés, du sol à son dessous. 10 + 8 par pied.
 */
export function tableOnLegs(at: Workshop, x0: number, x1: number, y0: number, y1: number, zHigh: number, thick: number, tabletop: Tint, feet: readonly (readonly [number, number])[], legSide: number, foot: Tint): void {
  at.box(x0, x1, y0, y1, zHigh - thick, zHigh, tabletop, {});
  for (const [px, py] of feet) at.block(px, py, legSide, legSide, 0, zHigh - thick, foot, { bottom: true, top: true });
}

/**
 * Un bassin rectangulaire de (x0, y0) à (x1, y1) : ses murs épais de `e`, de z0 au bord en `zRim`, dans sa matière
 * (dehors, dessus du bord, dedans), l'eau en `zWater` et son liseré clair contre la paroi. 38 triangles.
 */
export function basin(at: Workshop, pe: Paint, x0: number, x1: number, y0: number, y1: number, z0: number, zRim: number, e: number, wall: Faces, zWater: number): void {
  at.box(x0, x1, y0, y1, z0, zRim, wall, { bottom: true, top: true });
  const [i0, i1, j0, j1] = [x0 + e, x1 - e, y0 + e, y1 - e];
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, zRim - 1];
  // Le dessus du bord, en quatre bandes.
  at.quad([x0, y0, zRim], [x1, y0, zRim], [i1, j0, zRim], [i0, j0, zRim], c, wall);
  at.quad([x1, y0, zRim], [x1, y1, zRim], [i1, j1, zRim], [i1, j0, zRim], c, wall);
  at.quad([x1, y1, zRim], [x0, y1, zRim], [i0, j1, zRim], [i1, j1, zRim], c, wall);
  at.quad([x0, y1, zRim], [x0, y0, zRim], [i0, j0, zRim], [i0, j1, zRim], c, wall);
  // La paroi intérieure, du bord à l'eau, tournée vers le milieu.
  const m: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (zWater + zRim) / 2];
  const outside = (p: V3, q: V3): V3 => [2 * (p[0] + q[0]) / 2 - m[0], 2 * (p[1] + q[1]) / 2 - m[1], m[2]];
  const corners: V3[] = [
    [i0, j0, 0],
    [i1, j0, 0],
    [i1, j1, 0],
    [i0, j1, 0],
  ];
  for (let k = 0; k < 4; k++) {
    const [p, q] = [corners[k], corners[(k + 1) % 4]];
    at.quad([p[0], p[1], zWater], [q[0], q[1], zWater], [q[0], q[1], zRim], [p[0], p[1], zRim], outside(p, q), wall);
  }
  // L'eau, et son liseré.
  const l = Math.min(i1 - i0, j1 - j0) * 0.14;
  const water = pe.color(OBJECT_COLORS.water);
  const edge = pe.color(OBJECT_COLORS.edge);
  at.box(i0, i1, j0, j1, zWater - 0.01, zWater, edge, { bottom: true, px: true, nx: true, py: true, ny: true });
  at.box(i0 + l, i1 - l, j0 + l, j1 - l, zWater, zWater + 0.005, water, { bottom: true, px: true, nx: true, py: true, ny: true });
}

/** Une marche de pierre (l'escalier de Grimoire) : un bloc de pierre grise de z0 à z1, sa dalle claire dessus. 10 triangles. */
export function stoneStep(at: Workshop, pe: Paint, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  at.box(x0, x1, y0, y1, z0, z1, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
}

/** Un flacon de verre teinté (l'étagère de Bulle) : un corps à six pans, son col de bois (le bouchon). 26 triangles. */
export function flask(at: Workshop, pe: Paint, cx: number, cy: number, z0: number, upper: number, glass: Couleur): void {
  const r = upper * 0.32;
  at.prism(cx, cy, r, r * 0.9, z0, z0 + upper * 0.66, 6, pe.color(glass));
  at.prism(cx, cy, r * 0.42, r * 0.42, z0 + upper * 0.66, z0 + upper, 4, pe.color(OBJECT_COLORS.wood), Math.PI / 4);
}

// ---------- Le trophée du Gardien rallumé ----------

/** Les mesures du trophée, en part de case : le socle de pierre taillée, sa corniche, le lingot d'or facetté. */
const TROPHY = {
  plinth: { side: 0.9, height: 0.1 },
  pedestal: { lower: 0.8, upper: 0.64, height: 0.78 },
  cornice: { side: 0.78, height: 0.12 },
  ingot: { base: [0.6, 0.36], top: [0.42, 0.2], height: 0.26 },
} as const;

/**
 * Le bloc d'or d'un Gardien rallumé (cases (x, y, z) de pierre et (x, y, z + 1) d'or) : sa plinthe, le socle de pierre taillé
 * en tronc de pyramide, sa corniche, et sur elle un lingot d'or facetté, tourné d'un huitième de tour (son grand côté vers la
 * caméra et sa tranche). 46 triangles. Il tient dans les deux cases qu'il remplace.
 */
export function trophy(at: Workshop, pe: Paint): void {
  const { plinth, pedestal, cornice, ingot } = TROPHY;
  const stone = pe.material('pierre');
  const gold = pe.material('or');
  at.block(0.5, 0.5, plinth.side, plinth.side, 0, plinth.height, { dessus: stone.dessus, cote: pe.role('yardStone') });
  at.prism(0.5, 0.5, (pedestal.lower / 2) * Math.SQRT2, (pedestal.upper / 2) * Math.SQRT2, plinth.height, pedestal.height, 4, { dessus: stone.dessus, cote: stone.cote }, Math.PI / 4, true);
  at.block(0.5, 0.5, cornice.side, cornice.side, pedestal.height, pedestal.height + cornice.height, { dessus: pe.role('yardSlab'), cote: stone.dessus });
  // Le lingot : un tronc de pyramide à base rectangulaire, ses arêtes du dessus abattues (un chanfrein : le facetté).
  const z0 = pedestal.height + cornice.height;
  const z1 = z0 + ingot.height;
  const zc = z1 - ingot.height * 0.3;
  const ang = Math.PI / 8;
  const rot = (u: number, v: number, z: number): V3 => [0.5 + u * Math.cos(ang) - v * Math.sin(ang), 0.5 + u * Math.sin(ang) + v * Math.cos(ang), z];
  const [bx, by] = [ingot.base[0] / 2, ingot.base[1] / 2];
  const [hx, hy] = [ingot.top[0] / 2, ingot.top[1] / 2];
  const [mx, my] = [(bx + hx) / 2 + 0.02, (by + hy) / 2 + 0.02];
  const lower = [rot(-bx, -by, z0), rot(bx, -by, z0), rot(bx, by, z0), rot(-bx, by, z0)];
  const mid = [rot(-mx, -my, zc), rot(mx, -my, zc), rot(mx, my, zc), rot(-mx, my, zc)];
  const upper = [rot(-hx, -hy, z1), rot(hx, -hy, z1), rot(hx, hy, z1), rot(-hx, hy, z1)];
  const inside: V3 = [0.5, 0.5, z0 + 0.05];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    at.quad(lower[i], lower[j], mid[j], mid[i], inside, gold.cote);
    at.quad(mid[i], mid[j], upper[j], upper[i], inside, gold.dessus);
  }
  at.quad(upper[0], upper[1], upper[2], upper[3], inside, gold.dessus);
}

// ---------- Les objets du quai ----------

/**
 * La barque du quai, de `span` cases (4) sur 2, le long de `axis`, posée en z0 : la coque goudronnée à fond plat, la proue
 * pointue et relevée, la poupe à tableau, le plat-bord de bois clair, deux bancs. Retournée (`capsized`, échouée sur
 * la grève), la coque seule, la quille de bois en l'air. 85 triangles (35 retournée).
 */
export function rowboat(at: Workshop, pe: Paint, axis: 'x' | 'y', span: number, capsized: boolean): void {
  // Dans le repère de la barque : `u` le long de l'axe, `v` en travers (de 0 à 2) ; le plat-bord, de la poupe à la proue
  // et retour, et sa hauteur (relevé aux bouts).
  const pt = (u: number, v: number, z: number): V3 => (axis === 'x' ? [u, v, z] : [v, u, z]);
  const [um, vm] = [span / 2, 1];
  const tar = pe.color(OBJECT_COLORS.tar);
  const wood = pe.material('planches');
  const rim: readonly (readonly [number, number, number])[] = [
    [0.15, 0.6, 0.95],
    [0.6, 0.18, 0.82],
    [um, 0.1, 0.76],
    [span - 0.8, 0.22, 0.84],
    [span - 0.05, vm, 1.25],
    [span - 0.8, 1.78, 0.84],
    [um, 1.9, 0.76],
    [0.6, 1.82, 0.82],
    [0.15, 1.4, 0.95],
  ];
  const n = rim.length;
  // Le fond, plus étroit et plus court que le plat-bord ; retournée, la coque tête en bas.
  const floor = rim.map(([u, v]) => [um + (u - um) * 0.8, vm + (v - vm) * 0.55] as const);
  const zf = 0.12;
  const h = (z: number) => (capsized ? 1.15 - z : z);
  const center: V3 = pt(um, vm, h(0.5));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    at.quad(pt(floor[i][0], floor[i][1], h(zf)), pt(floor[j][0], floor[j][1], h(zf)), pt(rim[j][0], rim[j][1], h(rim[j][2])), pt(rim[i][0], rim[i][1], h(rim[i][2])), center, tar);
  }
  const awayFromFloor: V3 = pt(um, vm, h(zf) + (capsized ? -1 : 1));
  for (let i = 1; i + 1 < n; i++) at.tri(pt(floor[0][0], floor[0][1], h(zf)), pt(floor[i][0], floor[i][1], h(zf)), pt(floor[i + 1][0], floor[i + 1][1], h(zf)), awayFromFloor, capsized ? tar : wood.cote);
  if (capsized) {
    // La quille, le long de la coque retournée.
    const q = span * 0.36;
    const [z0, z1] = [h(zf), h(zf) + 0.1];
    if (axis === 'x') at.box(um - q, um + q, vm - 0.08, vm + 0.08, z0, z1, wood.cote);
    else at.box(vm - 0.08, vm + 0.08, um - q, um + q, z0, z1, wood.cote);
    return;
  }
  // Le dedans de la coque (du bois), un peu en retrait du plat-bord, et le plat-bord.
  const inside = rim.map(([u, v, z]) => [u + (um - u) * 0.05, v + Math.sign(vm - v) * Math.min(0.1, Math.abs(vm - v)), z - 0.04] as const);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [a, b, ai, bi] = [rim[i], rim[j], inside[i], inside[j]];
    const outside: V3 = pt(um + (a[0] + b[0] - 2 * um) * 2, vm + (a[1] + b[1] - 2 * vm) * 2, a[2]);
    at.quad(pt(ai[0], ai[1], ai[2]), pt(bi[0], bi[1], bi[2]), pt(floor[j][0], floor[j][1], zf + 0.02), pt(floor[i][0], floor[i][1], zf + 0.02), outside, wood.cote);
    at.quad(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(bi[0], bi[1], bi[2]), pt(ai[0], ai[1], ai[2]), pt(um, vm, -1), wood.dessus);
  }
  // Deux bancs en travers.
  for (const u of [span * 0.33, span * 0.62]) {
    const [u0, u1] = [u - 0.13, u + 0.13];
    if (axis === 'x') at.box(u0, u1, 0.32, 1.68, 0.5, 0.6, wood, {});
    else at.box(0.32, 1.68, u0, u1, 0.5, 0.6, wood, {});
  }
}

/** Une caisse du quai, de toute la hauteur de sa case posée en z (planches, couvercle plus sombre) : 20 triangles. */
export function quayCrate(at: Workshop, pe: Paint, x: number, y: number, z: number): void {
  const wood = pe.material('planches');
  crate(at, x + 0.08, x + 0.92, y + 0.08, y + 0.92, z, z + 1, wood, { dessus: wood.dessus, cote: pe.color(OBJECT_COLORS.lightWood) });
}

/**
 * Le fanion du quai : un mât de bois de trois cases dans la case (x, y), posé en z, coiffé d'une pointe de fer, et une
 * flamme de toile triangulaire, épaisse, qui part vers `toward` (−1 ou 1, le long de x) en haut du mât. 28 triangles.
 */
export function pennant(at: Workshop, pe: Paint, x: number, y: number, z: number, toward: -1 | 1): void {
  const cx = x + 0.5;
  const cy = y + 0.5;
  at.prism(cx, cy, 0.1, 0.08, z, z + 2.84, 6, pe.material('tronc'), 0, true);
  at.prism(cx, cy, 0.12, 0, z + 2.84, z + 3, 6, pe.color(OBJECT_COLORS.iron), 0);
  const canvas = pe.material('toile');
  const [zb, zh] = [z + 2.1, z + 2.8];
  const end = cx + toward * 1.35;
  const e = 0.05;
  const a: V3[] = [
    [cx, cy - e, zh],
    [cx, cy - e, zb],
    [end, cy - e, (zb + zh) / 2 - 0.08],
  ];
  const b = a.map(([px, , pz]) => [px, cy + e, pz] as V3);
  const m: V3 = [cx + toward * 0.4, cy, (zb + zh) / 2];
  at.tri(a[0], a[1], a[2], m, canvas.cote);
  at.tri(b[0], b[1], b[2], m, canvas.cote);
  for (let i = 1; i < 3; i++) at.quad(a[i], a[(i + 1) % 3], b[(i + 1) % 3], b[i], m, canvas.dessus);
}

/**
 * Le foyer du quai, dans sa case posée en z : un cercle de pierres (un anneau bas à six pans), la cendre, trois bûches
 * croisées et la braise au milieu (mate, elle ne brille pas). La fumée reste celle du quai. 56 triangles.
 */
export function campfire(at: Workshop, pe: Paint, x: number, y: number, z: number): void {
  const [cx, cy] = [x + 0.5, y + 0.5];
  const stone = pe.material('pierre');
  const n = 6;
  at.prism(cx, cy, 0.46, 0.42, z, z + 0.2, n, stone, Math.PI / n, true);
  at.annulus(cx, cy, z + 0.2, 0.28, 0.42, n, stone.dessus);
  at.disc(cx, cy, z + 0.17, 0.3, n, pe.color(OBJECT_COLORS.tar));
  const wood = pe.material('tronc');
  for (let k = 0; k < 3; k++) {
    const ang = (k * 2 * Math.PI) / 3 + 0.3;
    const [dx, dy] = [Math.cos(ang) * 0.26, Math.sin(ang) * 0.26];
    at.beam([cx + dx, cy + dy, z + 0.2], [cx + dx * 0.15, cy + dy * 0.15, z + 0.36], 0.09, wood);
  }
  at.pyramid(cx, cy, 0.09, 0.09, z + 0.17, z + 0.34, pe.color(OBJECT_COLORS.ember));
}


// ---------- Les pièces du décor du cœur (lot 2 du 6e) ----------

/**
 * Un galet posé dans la case, au centre (cx, cy), en z0 : un caillou rond et plat à `n` pans (le flanc évasé, l'épaule,
 * le dessus), de rayon `r` et haut de `h`, tourné de `rot`. `5n − 2` triangles (23 à cinq pans).
 */
export function pebble(at: Workshop, cx: number, cy: number, z0: number, r: number, h: number, t: Tint, n = 5, rot = 0.3): void {
  at.prism(cx, cy, r * 0.82, r, z0, z0 + h * 0.45, n, t, rot, true);
  at.prism(cx, cy, r, r * 0.62, z0 + h * 0.45, z0 + h, n, t, rot);
}

/**
 * Un tas (de sable, de terre, de mousse) au centre (cx, cy), posé en z0 : un tronc de cône bas à `n` pans, de rayon `r`,
 * puis son sommet en pointe émoussée, haut de `h`. `3n` triangles.
 */
export function heap(at: Workshop, cx: number, cy: number, z0: number, r: number, h: number, t: Tint, n = 8, rot = 0.2): void {
  const zShoulder = z0 + h * 0.55;
  at.prism(cx, cy, r, r * 0.55, z0, zShoulder, n, t, rot, true);
  at.prism(cx, cy, r * 0.55, 0, zShoulder, z0 + h, n, t, rot);
}

/** Les mesures d'une gerbe, en part de case et de sa hauteur : le pied, la taille liée au tiers bas, la tête d'épis. */
const SHEAF = { foot: 0.22, waist: 0.14, head: 0.31, tie: 1 / 3, headTop: 0.78 } as const;

/**
 * Une gerbe de blé debout au centre (cx, cy), posée en z0, haute de `h` : le pied de paille qui se serre jusqu'au lien,
 * au tiers bas, puis la tête d'épis en éventail, 1,4 fois plus large que le pied (de haut, elle couvre le pied : on ne la
 * lit plus comme un sablier), et sa pointe basse ; quatre pans tournés d'un huitième de tour. La tête dans son ton
 * (`head`, la paille plus chaude), le lien (`tie`) en bande sur le pan de devant, vers la caméra (−y). 22 triangles.
 */
export function sheaf(at: Workshop, cx: number, cy: number, z0: number, h: number, straw: Tint, head: Tint, tie: Tint): void {
  const q = Math.PI / 4;
  const zl = z0 + h * SHEAF.tie;
  const zh = z0 + h * SHEAF.headTop;
  at.prism(cx, cy, SHEAF.foot, SHEAF.waist, z0, zl, 4, straw, q, true);
  at.prism(cx, cy, SHEAF.waist, SHEAF.head, zl, zh, 4, head, q, true);
  at.prism(cx, cy, SHEAF.head, 0, zh, z0 + h, 4, head, q);
  // Le lien : sur le pan de devant, à la taille de la gerbe (son demi-côté y vaut le rayon de la taille · cos 45°).
  const e = SHEAF.waist * Math.SQRT1_2 + 0.016;
  const y = cy - e;
  at.quad([cx - e, y, zl - 0.05], [cx + e, y, zl - 0.05], [cx + e, y, zl + 0.05], [cx - e, y, zl + 0.05], [cx, cy, zl], tie);
}

/**
 * Une borne au bord du chemin, dans la case (x, y) posée en z0 : la plinthe, le fût carré jusqu'à `upper`, la tête en
 * pointe de diamant basse (`head` : sa couleur, la matière sinon). 30 triangles.
 */
export function milestone(at: Workshop, pe: Paint, x: number, y: number, z0: number, upper: number, body: Tint, head?: Tint): void {
  const [cx, cy] = [x + 0.5, y + 0.5];
  at.block(cx, cy, 0.78, 0.78, z0, z0 + 0.18, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.block(cx, cy, 0.56, 0.56, z0 + 0.18, z0 + upper - 0.22, body, { bottom: true, top: true });
  at.prism(cx, cy, 0.28 * Math.SQRT2, 0.2 * Math.SQRT2, z0 + upper - 0.22, z0 + upper - 0.08, 4, head ?? body, Math.PI / 4, true);
  at.prism(cx, cy, 0.2 * Math.SQRT2, 0, z0 + upper - 0.08, z0 + upper, 4, head ?? body, Math.PI / 4);
}
