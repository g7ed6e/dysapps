// Les Nacelles (GD-22, lot 16 ; intention du directeur artistique du 21 octobre 2026, planche `selection-nacelles-v1`
// validée par le mainteneur le 21 octobre 2026) : « une gare de bois adossée à un piton, d'où partent deux câbles vers deux
// aiguilles ». Le lieu dit qu'on transportait des gens d'un sommet à l'autre, autrefois, et que la gare se remonte ; il ne
// dit jamais qu'on part : les câbles et les nacelles sont un décor. Le cœur, sans figure : la machinerie, le mât et ses
// poulies, les deux rouages, les deux câbles retendus, les nacelles en panier au quai. Autour : la halle ouverte sur le
// quai, adossée au piton, et la cour de dalles chaudes devant. Kéo marche sur la cour ; le quai, la halle, le mât, les
// câbles et les nacelles sont un décor, jamais un sol. Le lieu est sur le plateau, à plat, la côte à une trentaine
// d'unités : ni muret, ni éperon.
//
// Le piton est un dos de roche à pans, moussu, trapu (de l'ordre de 9 de haut, plus large que haut), le même avant et
// après (gris du plateau sur tous ses pans, jamais beige). Contre lui, la halle (de l'ordre de 8,4 sur 5,8, un appentis de
// bardeaux dont l'avant-toit, à 5,2, passe au-dessus de la poutre, ses poteaux de 4,5) ouvre sur le quai ses trois baies ; sa
// poutre de façade, de bois brun, porte une bande pleine de vert-de-gris où deux ondes de racines entrelacées sont dessinées.
// Au fond, la face de pierre taillée, où une grande roue dentée de bronze a laissé sa place : un trou rond (rayon 0,4) à 2,7
// de haut et quatre goujons de fer clair, le signe de l'absence, avant comme après ; la lanterne de la halle, petite, pend
// d'une corde courte au plus près de la poutre, au-dessus de lui. Le mât (11 de haut, une platine plate, aucune pointe) se
// tient à gauche de la halle vu de la porte, ses deux rouages à son pied, côté Kéo ; les trois poulies (un disque de fer à dix
// pans, un disque de bois sur sa face) pendent de crochets sous la poutre de façade. Les deux nacelles, des paniers de paille
// tressée larges et bas, de deux tons, au bord brun épais, sans porte ni siège, pendent chacune de quatre cordes dans son
// portique en U renversé : l'une dans la baie de droite de la halle, l'autre au bout est du quai.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. La moitié du toit est tombée en un grand panneau à plat sur
// le quai, l'autre s'est affaissée dans la halle (elle ne monte plus vers le fond : vue de côté, elle se lisait comme un câble
// qui part dans le ciel) ; des jours dans les lames, deux poteaux de travers ; trois planches manquent au quai ; le mât est tombé en deux
// tronçons couchés côte à côte ; des trois poulies une gît à plat, deux pendent de travers ; un rouage debout, l'autre
// fendu en deux demi-disques ; les deux câbles, détendus, en boucles sur le quai et sur le panneau, leurs bouts pendus à la
// poutre (rien ne sort du lieu dans la ruine) ; une nacelle couchée au bord du quai, son portique cassé à côté ; les dalles
// de la cour fendues, un côté affaissé. La seule lumière : la lanterne de la câbliste, sur une perche courte au bord du
// quai, à droite vu de la porte.
//
// Quatre parties, quatre traces, posées avec elles. Le corps en deux (`row` 0 puis 0,5) : la cour remise à plat, le quai
// refait, les poteaux, la poutre et les lames basses, les deux rouages, avec la caisse à outils fermée sur son billot ;
// puis les lames hautes, les trois poulies et la première nacelle, avec le touret de câble. Le haut : le toit de bardeaux,
// le mât debout, la lanterne de la halle, avec le pot de grès ouvert ; les deux câbles retendus vers les aiguilles de
// décor, hors de l'emprise du lieu, sont dessinés avec lui (`reach`). Les abords : la rampe de dalles, la barrière basse,
// la lanterne du chemin et la seconde nacelle, avec le sac de chevilles et le maillet couché. Rien ne bouge, rien à lire
// dans la 3D. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder, type Facets, type Placement } from './facets';
import { distance, type Vec2, type Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, fromPlan5e, NEEDLES_5E, PLACES_5E, type Needle } from './plan5e';
import { spireRadiusAt } from './spire5e';
import { jitter } from './surroundingsKit';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs des Nacelles : la pierre grise moussue du plateau (le piton, la face taillée), les dalles chaudes de la
 * cour (#CFC6B4) à joints #777D77, le bois brun désaturé des Passeurs (neuf, usé), le fer gris, le bronze des seules
 * ferrures, le vert-de-gris du motif des racines, la paille des nacelles (#C2AE78, bord brun), le brun très sombre du signe
 * de l'absence (#3A312C, jamais noir) ; la seule lumière, l'ocre des lanternes (la vitre éteinte : #BFC4B8).
 */
const C = {
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  moss: COLORS_5E.plateauMoss,
  slab: 0xcfc6b4,
  joint: 0x777d77,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  /** Les coutures des lames : un cran sous le bois neuf. */
  seam: 0x76635a,
  shingle: 0x947d68,
  shingleShade: 0x7b6955,
  floor: 0x7b6955,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  /** Les câbles : un gris fer neutre, plus sombre que le fer des ferrures, pour que la lumière dorée ne le tire pas vers la corde. */
  cable: 0x585b5a,
  verdigris: 0x6f9a8a,
  /** La paille tressée des nacelles : deux tons, d'un pan à l'autre ; le bord brun. */
  straw: 0xc2ae78,
  strawDark: 0xa8955f,
  strawEdge: 0x7d6048,
  strawInside: 0x9c8a5a,
  hole: 0x3a312c,
  /** Les goujons du signe de l'absence : un fer clair, qui se détache du fond sombre du trou. */
  stud: 0x8a857a,
  /** Les dalles de la cour en ruine : l'une enfoncée, celles du côté est de biais ; un ton à mi-chemin entre la dalle et son joint, jamais un trou. */
  slabSunk: 0xa9a394,
  slabTilt: 0xbdb5a3,
  lantern: COLORS_5E.lantern,
  glassOff: 0xbfc4b8,
  rope: 0xd8c49a,
  // Les traces : le bois de la caisse, le grès du pot, le liège, la toile du sac.
  stoneware: 0x8c7a66,
  stonewareShade: 0x7a6a58,
  cork: 0x6e5a48,
  sack: 0xc8b48a,
  sackShade: 0xb09c74,
  // La câbliste, en pion (son modèle 3D prend sa place, ./habitants.ts) : chemise de lin, pantalon brun, tablier de toile.
  shirt: 0xd3c4a2,
  trousers: 0x6b5a46,
  skin: 0xd9a77f,
  cap: 0x8c766a,
  /** Le bois des moufles de la question : un brun chaud, plus sombre que la poutre. */
  block: 0x6f5238,
} as const;

/** Un point du lieu, son sol, et sa hauteur au-dessus de lui. */
type At = (x: number, z: number) => number;

// ---------- Le plan du lieu (repère du lieu : le centre en 0, le nord vers −z, la porte au sud) ----------

/**
 * La halle : de `x0` à `x1`, du fond (`back`, contre la face taillée) à la façade (`front`) ; la hauteur de ses poteaux
 * (`post`), la poutre de façade (centre `beamY`, épaisseur `beam`), le toit en appentis du fond (`roofBack`) à l'avant-toit
 * (`roofFront`), l'épaisseur des lames (`board`). Quatre poteaux de façade, donc trois baies.
 */
const HALL = { x0: -3, x1: 5.4, back: -8.4, front: -2.6, post: 4.5, beamY: 4.7, beam: 0.45, roofBack: 6.5, roofFront: 5.2, eave: 0.45, board: 0.14, lowRow: 2.2 } as const;

/** Le pan de toit de la ruine, affaissé : où il repose, au fond de la halle (le z, la hauteur au-dessus du sol). */
const ROOF_FALL = { z: -6.0, y: 2.5 } as const;

/** Les poteaux de la façade, de l'ouest à l'est : la baie de droite est entre les deux derniers. */
const POSTS_X = [-2.85, -0.05, 2.75, 5.25] as const;

/** Le milieu de la halle (la poutre, sa lanterne, le trou de la face taillée). */
const HALL_MID = (HALL.x0 + HALL.x1) / 2;

/** Le quai (planches à fleur de dalle) devant la halle, et le sol de la halle ; la cour devant ; la rampe à l'est. */
const QUAI = { x0: -8.4, x1: 9.4, z0: HALL.front, z1: 0.8, planks: 16 } as const;
const COURT = { x0: QUAI.x0, x1: QUAI.x1, z0: QUAI.z1, z1: 8, cols: 6, rows: 3 } as const;
const RAMP = { x0: 9.6, x1: 11.8, z0: HALL.front, z1: 8, rows: 4 } as const;

/** Le mât (carré, de `side`), à gauche de la halle vu de la porte ; ses deux rouages à son pied, sur leurs arbres. */
const MAST = { x: -7, z: -1.4, top: 11, side: 0.5 } as const;
const GEAR_A = { x: -5.4, y: 1.25, z: -0.95, r: 0.95, teeth: 5, thick: 0.3 } as const;
const GEAR_B = { x: -3.8, y: 1.05, z: -0.95, r: 0.7, teeth: 5, thick: 0.3 } as const;

/** Les trois poulies, sous la poutre de façade, à l'ouest de sa lanterne : leur x, leur rayon, leur épaisseur. */
const PULLEYS = { xs: [-2.3, -1.4, -0.5], r: 0.38, thick: 0.15, strap: 0.32, sides: 10, groove: 0.72 } as const;

/** Les nacelles : le panier (rayons du bas, du haut, hauteur), le portique en U renversé (écart des montants, hauteur). */
const BASKET = { r0: 0.62, r1: 0.9, h: 0.65, sides: 8, rim: 0.2 } as const;
const PORTIQUE = { span: 2.3, h: 3.1, post: 0.2, hang: 0.6 } as const;
const NACELLE_1 = { x: 4, z: -4.6 } as const;
const NACELLE_2 = { x: 8.3, z: -1.2 } as const;

/** La perche courte de la lanterne de la câbliste, au bord du quai, à droite vu de la porte (à hauteur d'épaule de Kéo). */
const KEEPER_POLE = { x: 7.1, z: 0.45, top: 1.7 } as const;

/** La lanterne du chemin, sur un piquet bas, en tête de la rampe. */
const PATH_LANTERN = { x: 11, z: 6.9, top: 1.25 } as const;

/** La barrière basse de la rampe : sur son bord est, de `z0` à `z1`, ses deux lisses parallèles. */
const FENCE = { x: 11.7, z0: -2.2, z1: 7.6, posts: 4, rails: [0.45, 0.85], post: 0.14, top: 1.05 } as const;

/** Le trou rond du signe de l'absence, sur la face taillée : à 2,7 de haut, au milieu de la halle ; ses quatre goujons, hors du trou. */
const HOLE = { x: HALL_MID, y: 2.7, r: 0.4, stud: 0.55, studSize: 0.16 } as const;

/** La face de pierre taillée, au fond de la halle, et le piton derrière elle. */
const FACE = { x0: HALL.x0, x1: HALL.x1, z: HALL.back, depth: 0.8, h: 6.4, course: 2 } as const;
const PITON = { x: HALL_MID, z: -15.6, rx: 11.5, rz: 7.2, top: 9, sides: 9 } as const;

// ---------- Les formes ----------

/** Le sol (relatif) sous un volume de rayon `r` : le plus haut. */
const topAt = (ground: SiteGround, x: number, z: number, r: number): number => ground.foot(x, z, r).top;

/**
 * Une lanterne des Passeurs (une vitre dans un cadre) en (x, z), son pied en `y` : allumée (l'ocre, fixe) ou éteinte (la
 * vitre #BFC4B8), son chapeau de bronze. Quatorze triangles.
 */
function lantern(b: FacetBuilder, x: number, y: number, z: number, lit: boolean, s = 1): void {
  b.box({ x, y, z }, [0.26 * s, 0.34 * s, 0.26 * s], lit ? C.lantern : C.glassOff);
  b.prism({ x, y: y + 0.34 * s, z, yaw: Math.PI / 4 }, 0.24 * s, 0, 0.15 * s, 4, C.bronze);
}

/**
 * La lanterne de la halle, pendue sous la poutre de façade par une corde courte (le trou de la face taillée, derrière, reste
 * dégagé) : elle pend au plus près de la poutre, à la taille 0,8. Vingt-huit triangles.
 */
function hallLantern(b: FacetBuilder, g: number, lit: boolean): void {
  const s = 0.8;
  const beamBottom = g + HALL.beamY - HALL.beam / 2;
  const hat = 0.34 * s + 0.15 * s;
  const foot = beamBottom - 0.1 - hat;
  b.beam({ x: HALL_MID, y: foot + hat, z: HALL.front + 0.25 }, { x: HALL_MID, y: beamBottom, z: HALL.front + 0.25 }, 0.03, C.rope);
  lantern(b, HALL_MID, foot, HALL.front + 0.25, lit, s);
}

/** Un poteau fin planté en (x, z), de `y0` à `y1`. Dix triangles. */
function stake(b: FacetBuilder, x: number, z: number, y0: number, y1: number, w: number, color: number): void {
  b.box({ x, y: y0, z }, [w, y1 - y0, w], color);
}

/** La lanterne sur sa perche : le poteau et la lanterne au bout. Vingt-quatre triangles. */
function poleLantern(b: FacetBuilder, x: number, z: number, g: number, top: number, lit: boolean, wood: number): void {
  stake(b, x, z, g + SINK, g + top, 0.13, wood);
  lantern(b, x, g + top, z, lit);
}

/** Les sommets d'une roue dentée : par dent, deux sur le fond, deux au sommet (des dents carrées, épaisses). */
function gearOutline(r: number, teeth: number, turn: number): [number, number][] {
  const pitch = (2 * Math.PI) / teeth;
  const half = pitch * 0.27;
  const inner = r * 0.76;
  const pts: [number, number][] = [];
  for (let t = 0; t < teeth; t++) {
    const a = turn + t * pitch;
    for (const [rad, da] of [
      [inner, -half],
      [r, -half],
      [r, half],
      [inner, half],
    ] as const)
      pts.push([rad * Math.cos(a + da), rad * Math.sin(a + da)]);
  }
  return pts;
}

/**
 * Une roue dentée debout, sa face vers le sud (+z), pleine (jamais quatre rayons), cinq dents carrées épaisses : le
 * contour est tiré d'un éventail depuis le centre, ses deux faces, ses flancs. `from`–`to` : une part des sommets (un
 * demi-disque, ses deux coupes droites vers le centre) ; sans, la roue entière. Quatre triangles par sommet.
 */
function gearDisc(b: FacetBuilder, c: Vec3, r: number, teeth: number, thick: number, side: number, face: number, turn = 0, part?: [number, number]): void {
  const all = gearOutline(r, teeth, turn);
  const pts = part ? all.slice(part[0], part[1] + 1) : all;
  const n = pts.length;
  const z0 = c.z,
    z1 = c.z + thick;
  const P = (p: readonly [number, number], z: number): [number, number, number] => [c.x + p[0], c.y + p[1], z];
  const mid0: [number, number, number] = [c.x, c.y, z0],
    mid1: [number, number, number] = [c.x, c.y, z1];
  const edges = part ? n - 1 : n;
  for (let k = 0; k < edges; k++) {
    const m = (k + 1) % n;
    b.triangle(mid1, P(pts[k], z1), P(pts[m], z1), face);
    b.triangle(mid0, P(pts[m], z0), P(pts[k], z0), face);
    b.quad(P(pts[k], z0), P(pts[m], z0), P(pts[m], z1), P(pts[k], z1), side);
  }
  if (part) {
    // Les deux coupes droites du demi-disque, du centre aux bouts de l'arc.
    b.quad(mid0, P(pts[0], z0), P(pts[0], z1), mid1, side);
    b.quad(P(pts[n - 1], z0), mid0, mid1, P(pts[n - 1], z1), side);
  }
}

/** Le moyeu d'une roue : un petit pavé de fer sur sa face, sur son arbre. Dix triangles. */
function boss(b: FacetBuilder, g: { x: number; y: number; z: number; thick: number }, y0: number): void {
  b.box({ x: g.x, y: y0 + g.y - 0.12, z: g.z + g.thick + 0.05 }, [0.24, 0.24, 0.12], C.iron);
}

/**
 * Une poulie à plat ou pendue : un disque de fer à dix pans, sa face vers +z, tournée de `yaw`/`pitch`, et sur sa face un
 * disque de bois plus petit, qui laisse au fer sa jante (rien à voir avec un écrou). Cinquante triangles.
 */
function pulley(b: FacetBuilder, x: number, y: number, z: number, yaw = 0, pitch = 0, worn = false): void {
  // Le disque (axe le long de +z) : bascule d'un quart de tour autour de x, puis `pitch` de plus.
  const at = { x, y, z, yaw, pitch: Math.PI / 2 + pitch };
  b.drum(at, PULLEYS.r, PULLEYS.thick, PULLEYS.sides, C.iron);
  // Le bois, à peine au-dessus du fer, sur la face qui regarde vers +z (le dessus du prisme, une fois basculé).
  drawPosed(b, at, (l) => {
    const r = PULLEYS.r * PULLEYS.groove;
    const c: [number, number, number] = [0, PULLEYS.thick + 0.012, 0];
    const ring = Array.from({ length: PULLEYS.sides }, (_, k) => [r * Math.cos((2 * Math.PI * k) / PULLEYS.sides), c[1], r * Math.sin((2 * Math.PI * k) / PULLEYS.sides)] as [number, number, number]);
    for (let k = 0; k < PULLEYS.sides; k++) l.triangle(c, ring[(k + 1) % PULLEYS.sides], ring[k], worn ? C.wornWood : C.newWood);
  });
}

/** Un crochet de fer sous la poutre de façade, en x, d'où pend une poulie. Dix triangles. */
function hook(b: FacetBuilder, x: number, g: number): void {
  b.box({ x, y: g + HALL.beamY - HALL.beam / 2 - PULLEYS.strap, z: HALL.front }, [0.07, PULLEYS.strap, 0.07], C.iron);
}

/** Le centre d'une poulie pendue, au-dessus du sol. */
const pulleyY = (g: number): number => g + HALL.beamY - HALL.beam / 2 - PULLEYS.strap - PULLEYS.r;

/**
 * Un panier de nacelle (de paille tressée, au bord brun), ouvert, sans porte, sans siège, sans marche : large et bas, le
 * tour évasé vers le haut, deux tons de paille d'un pan à l'autre (la tresse), le dedans plus sombre, un bord brun épais
 * en anneau. Quarante triangles.
 */
function basket(b: FacetBuilder, at: Placement): void {
  const k = BASKET;
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw: at.yaw ?? 0, pitch: at.pitch ?? 0 }, (l) => {
    const ring = (r: number, y: number) => Array.from({ length: k.sides }, (_, i) => [r * Math.cos((2 * Math.PI * i) / k.sides), y, r * Math.sin((2 * Math.PI * i) / k.sides)] as [number, number, number]);
    const lo = ring(k.r0, 0);
    const hi = ring(k.r1, k.h);
    for (let i = 0; i < k.sides; i++) {
      const n = (i + 1) % k.sides;
      l.quad(lo[n], lo[i], hi[i], hi[n], i % 2 ? C.strawDark : C.straw);
      l.triangle([0, k.h, 0], hi[n], hi[i], C.strawInside);
    }
    l.annulus({ x: 0, y: k.h + 0.01, z: 0 }, k.r1 - k.rim, k.r1 + 0.04, 0.04, k.sides, C.strawEdge, C.strawEdge, false);
  });
}

/** Une corde fine, un prisme à trois pans de `a` à `c` (qui se lit de tous les côtés) : six triangles. */
function thread(b: FacetBuilder, a: Vec3, c: Vec3, w: number, color: number): void {
  const dx = c.x - a.x,
    dy = c.y - a.y,
    dz = c.z - a.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const d = [dx / len, dy / len, dz / len];
  // Deux axes perpendiculaires à la corde.
  const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let p1 = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]];
  const l1 = Math.hypot(p1[0], p1[1], p1[2]) || 1;
  p1 = p1.map((v) => v / l1);
  const p2 = [d[1] * p1[2] - d[2] * p1[1], d[2] * p1[0] - d[0] * p1[2], d[0] * p1[1] - d[1] * p1[0]];
  const side = (e: Vec3, t: number): [number, number, number] => {
    const ang = Math.PI / 2 + (t * 2 * Math.PI) / 3;
    const ca = Math.cos(ang) * w,
      sa = Math.sin(ang) * w;
    return [e.x + ca * p1[0] + sa * p2[0], e.y + ca * p1[1] + sa * p2[1], e.z + ca * p1[2] + sa * p2[2]];
  };
  for (let t = 0; t < 3; t++) {
    const n = (t + 1) % 3;
    const q = [side(a, t), side(a, n), side(c, n), side(c, t)] as const;
    // Le sens du tour qui regarde vers le dehors de la corde.
    const ux = q[1][0] - q[0][0],
      uy = q[1][1] - q[0][1],
      uz = q[1][2] - q[0][2];
    const vx = q[3][0] - q[0][0],
      vy = q[3][1] - q[0][1],
      vz = q[3][2] - q[0][2];
    const nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const mx = (q[0][0] + q[1][0]) / 2 - a.x,
      my = (q[0][1] + q[1][1]) / 2 - a.y,
      mz = (q[0][2] + q[1][2]) / 2 - a.z;
    if (nx * mx + ny * my + nz * mz >= 0) b.quad(q[0], q[1], q[2], q[3], color);
    else b.quad(q[3], q[2], q[1], q[0], color);
  }
}

// ---------- Le piton et la face taillée ----------

/**
 * Le piton : un dos de roche à pans, moussu, large et bas (plus large que haut), derrière la halle ; trois couronnes de
 * sommets inégaux, un dessus en éventail. Ses sommets de façade ne passent jamais devant la face taillée. Quarante-cinq
 * triangles.
 */
function piton(b: FacetBuilder, at: At): void {
  const P = PITON;
  const n = P.sides;
  const rings = [
    { s: 1, y: -0.5 },
    { s: 0.8, y: 4.2 },
    { s: 0.5, y: 7.4 },
  ] as const;
  const frontMax = FACE.z - 0.1;
  const ring = rings.map((r, i) =>
    Array.from({ length: n }, (_, k) => {
      const a = (2 * Math.PI * k) / n + 0.2;
      const q = 1 + (jitter(31 + k * 3 + i * 17) - 0.5) * 0.3;
      const x = P.x + P.rx * r.s * q * Math.cos(a);
      const z = Math.min(frontMax, P.z + P.rz * r.s * q * Math.sin(a));
      return [x, at(x, z) + r.y + (i ? (jitter(7 + k + i * 5) - 0.5) * 0.9 : 0), z] as [number, number, number];
    }),
  );
  const tip: [number, number, number] = [P.x + 0.6, at(P.x, P.z) + P.top, P.z + 0.3];
  const tone = (p: readonly number[], q: readonly number[], s: readonly number[]): number => {
    // La normale de la facette, tournée vers le dehors : le dessus mousse, le pan au soleil, le pan à l'ombre.
    const ux = q[0] - p[0],
      uy = q[1] - p[1],
      uz = q[2] - p[2];
    const vx = s[0] - p[0],
      vy = s[1] - p[1],
      vz = s[2] - p[2];
    const nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    if (ny / len > 0.75) return C.moss;
    // Face au soleil (bas, à l'ouest-sud-ouest) : le grès doré de la lumière tirait la roche vers le beige ; les pans qui
    // l'attrapent le plus prennent le gris de l'ombre, ceux de biais le gris du plateau.
    const sun = (nx * -0.91 + nz * 0.41) / len;
    return sun > 0.45 ? C.stoneShade : sun > -0.1 ? C.stone : C.stoneShade;
  };
  for (let i = 0; i < 2; i++)
    for (let k = 0; k < n; k++) {
      const m = (k + 1) % n;
      const lo = ring[i],
        hi = ring[i + 1];
      b.triangle(lo[m], lo[k], hi[k], tone(lo[m], lo[k], hi[k]));
      b.triangle(lo[m], hi[k], hi[m], tone(lo[m], hi[k], hi[m]));
    }
  const top = ring[2];
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.triangle(tip, top[m], top[k], tone(tip, top[m], top[k]));
  }
  // Un second pan bas à l'ouest, qui prolonge le dos de roche (un rocher du plateau).
  const x = P.x - 9.2,
    z = FACE.z - 2.4;
  lowRock(b, { x, y: at(x, z), z }, 2.6, 2.4, 5);
}

/**
 * La face de pierre taillée au fond de la halle, deux assises (la plus haute, plus claire) ; le signe de l'absence : un
 * trou rond à 2,7 de haut, brun très sombre, et ses quatre goujons de fer clair, un rectangle, rien d'autre. Il ne change
 * jamais, avant comme après.
 */
function face(b: FacetBuilder, at: At): void {
  const F = FACE;
  const g = Math.min(at(F.x0, F.z), at(F.x1, F.z));
  const w = F.x1 - F.x0;
  b.box({ x: (F.x0 + F.x1) / 2, y: g + SINK, z: F.z - F.depth / 2 }, [w, F.course - SINK, F.depth], C.stone, C.stoneSun);
  b.box({ x: (F.x0 + F.x1) / 2, y: g + F.course, z: F.z - F.depth / 2 }, [w, F.h - F.course, F.depth], C.stoneSun, C.stoneSun);
  const z = F.z + 0.012;
  const disc = Array.from({ length: 8 }, (_, k) => [HOLE.r * Math.cos((Math.PI * k) / 4 + Math.PI / 8), HOLE.r * Math.sin((Math.PI * k) / 4 + Math.PI / 8)] as const);
  b.plate({ x: HOLE.x, y: g + HOLE.y, z }, disc, C.hole);
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    b.box({ x: HOLE.x + sx * HOLE.stud, y: g + HOLE.y + sy * HOLE.stud - HOLE.studSize / 2, z: F.z + 0.09 }, [HOLE.studSize, HOLE.studSize, 0.18], C.stud);
}

// ---------- La halle ----------

/** Un poteau de façade, droit ou de travers (`lean`, `yaw`) ; `h` plus court : un moignon cassé. Dix triangles. */
function post(b: FacetBuilder, x: number, g: number, h: number, wood: number, shade: number, lean = 0, yaw = 0): void {
  b.box({ x, y: g + SINK, z: HALL.front, pitch: lean, yaw }, [0.32, h - SINK, 0.32], shade, wood);
}

/** La poutre de façade, de `x0` à `x1`, de bois brun. Dix triangles. */
function facadeBeam(b: FacetBuilder, x0: number, x1: number, g: number, wood: number, shade: number): void {
  b.box({ x: (x0 + x1) / 2, y: g + HALL.beamY - HALL.beam / 2, z: HALL.front }, [x1 - x0, HALL.beam, 0.42], shade, wood);
}

/**
 * Le motif des racines, sur la face sud de la poutre de façade : une bande vert-de-gris pleine (un quart de haut, la
 * largeur de la baie centrale, la poutre restant de bois brun autour) et, dessinées dessus, deux ondes entrelacées du brun
 * de la poutre, sans lettre ni chiffre. Vingt-six triangles.
 */
function roots(b: FacetBuilder, g: number): void {
  const z = HALL.front + 0.21;
  const y = g + HALL.beamY;
  const half = 2.2;
  const band = 0.125;
  b.quad([HALL_MID - half, y - band, z + 0.012], [HALL_MID + half, y - band, z + 0.012], [HALL_MID + half, y + band, z + 0.012], [HALL_MID - half, y + band, z + 0.012], C.verdigris);
  const steps = 6;
  for (const sign of [1, -1]) {
    const pt = (i: number): [number, number] => {
      const t = i / steps;
      return [HALL_MID - half + 2 * half * t, y + sign * 0.08 * Math.sin(t * Math.PI * 2 + (sign > 0 ? 0 : Math.PI))];
    };
    for (let i = 0; i < steps; i++) {
      const [x0, y0] = pt(i),
        [x1, y1] = pt(i + 1);
      b.quad([x0, y0 - 0.035, z + 0.026], [x1, y1 - 0.035, z + 0.026], [x1, y1 + 0.035, z + 0.026], [x0, y0 + 0.035, z + 0.026], C.seam);
    }
  }
}

/** Les lames d'un côté : de `row` bas ou haut, sur le mur ouest (`side` −1) ou est (+1). Dix ou douze triangles. */
function sideWall(b: FacetBuilder, side: -1 | 1, g: number, high: boolean, worn: boolean): void {
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  const depth = HALL.front - HALL.back;
  const x = side < 0 ? HALL.x0 + HALL.board / 2 : HALL.x1 - HALL.board / 2;
  const mid = (HALL.front + HALL.back) / 2;
  if (!high) {
    b.box({ x, y: g + SINK, z: mid, yaw: Math.PI / 2 }, [depth, HALL.lowRow - SINK, HALL.board], shade, wood);
    return;
  }
  // Le haut suit le toit : plus haut au fond (contre la face taillée) qu'à la façade.
  const out = side < 0 ? x - HALL.board / 2 : x + HALL.board / 2;
  b.extrude(
    { x: out - (side < 0 ? 0 : HALL.board), y: g, z: HALL.front, yaw: Math.PI / 2 },
    [
      [0, HALL.lowRow],
      [depth, HALL.lowRow],
      [depth, HALL.roofBack - 0.05],
      [0, HALL.roofFront - 0.12],
    ],
    HALL.board,
    shade,
    wood,
  );
}

/** Les coutures des lames sur la face extérieure d'un mur (ouest ou est) : trois traits verticaux par rangée. Douze triangles. */
function seams(b: FacetBuilder, side: -1 | 1, g: number, high: boolean): void {
  const x = side < 0 ? HALL.x0 - 0.012 : HALL.x1 + 0.012;
  const y0 = g + (high ? HALL.lowRow : 0);
  const y1 = g + (high ? HALL.post - 0.1 : HALL.lowRow);
  for (const t of [0.25, 0.5, 0.75]) {
    const z = HALL.front + (HALL.back - HALL.front) * t;
    // Une facette verticale face à l'extérieur : vers −x à l'ouest, +x à l'est.
    if (side < 0) b.quad([x, y0, z - 0.03], [x, y0, z + 0.03], [x, y1, z + 0.03], [x, y1, z - 0.03], C.seam);
    else b.quad([x, y0, z + 0.03], [x, y0, z - 0.03], [x, y1, z - 0.03], [x, y1, z + 0.03], C.seam);
  }
}

/**
 * Le toit en appentis de bardeaux (du fond à l'avant-toit), de `x0` à `x1`, quatre rangs de bardeaux. `fall` : un pan
 * affaissé, qui ne va plus que jusqu'à `z`, où il repose à la hauteur `y` (la ruine). Vingt-six triangles.
 */
function roof(b: FacetBuilder, x0: number, x1: number, g: number, worn: boolean, fall?: { z: number; y: number }): void {
  const zBack = fall?.z ?? HALL.back;
  const yBack = fall?.y ?? HALL.roofBack;
  const run = HALL.front + HALL.eave - zBack;
  const rise = yBack - HALL.roofFront;
  const len = Math.hypot(run, rise);
  const pitch = Math.atan2(rise, run);
  const thick = 0.18;
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  // Le milieu du dessus du pan, puis le pied du pavé (son dessous), plus bas de l'épaisseur.
  const topY = g + (yBack + HALL.roofFront) / 2;
  const topZ = (zBack + HALL.front + HALL.eave) / 2;
  const midY = topY - thick * cp;
  const midZ = topZ - thick * sp;
  b.box({ x: (x0 + x1) / 2, y: midY, z: midZ, pitch }, [x1 - x0, thick, len], worn ? C.wornShade : C.shingleShade, worn ? C.wornWood : C.shingle);
  // Les rangs : des bandes sombres sur le dessus du pan, à `t` du milieu vers l'avant.
  for (let r = 1; r <= 4; r++) {
    const t = (r / 5 - 0.5) * len;
    const yy = topY - t * sp + 0.012;
    const zz = topZ + t * cp;
    b.quad([x0, yy, zz - 0.04], [x0, yy, zz + 0.04], [x1, yy, zz + 0.04], [x1, yy, zz - 0.04], worn ? C.wornShade : C.shingleShade);
  }
}

// ---------- Le quai, la cour, la rampe ----------

/** Les planches du quai : seize, posées dans la longueur de la halle, à fleur de dalle ; `missing` : celles qui manquent. */
function quai(b: FacetBuilder, at: At, worn: boolean, missing: readonly number[] = []): void {
  const Q = QUAI;
  const w = (Q.x1 - Q.x0) / Q.planks;
  const y = (x: number, z: number) => at(x, z) + 0.1;
  // Le sol de la halle et le dessous du quai : un aplat brun sombre, d'où les planches manquantes se lisent.
  b.quad([HALL.x0, y(HALL.x0, HALL.back), HALL.back], [HALL.x0, y(HALL.x0, Q.z0), Q.z0], [HALL.x1, y(HALL.x1, Q.z0), Q.z0], [HALL.x1, y(HALL.x1, HALL.back), HALL.back], C.floor);
  b.quad([Q.x0, y(Q.x0, Q.z0) - 0.04, Q.z0], [Q.x0, y(Q.x0, Q.z1) - 0.04, Q.z1], [Q.x1, y(Q.x1, Q.z1) - 0.04, Q.z1], [Q.x1, y(Q.x1, Q.z0) - 0.04, Q.z0], C.floor);
  for (let i = 0; i < Q.planks; i++) {
    if (missing.includes(i)) continue;
    const x0 = Q.x0 + i * w + 0.03,
      x1 = Q.x0 + (i + 1) * w - 0.03;
    const tone = i % 2 ? (worn ? C.wornShade : C.newShade) : worn ? C.wornWood : C.newWood;
    b.quad([x0, y(x0, Q.z0), Q.z0], [x0, y(x0, Q.z1), Q.z1], [x1, y(x1, Q.z1), Q.z1], [x1, y(x1, Q.z0), Q.z0], tone);
  }
}

/** Une dalle chaude de la cour, de (x0, z0) à (x1, z1), à fleur de sol ; `dip` : son coin sud-est affaissé ; `color`, sa couleur. */
function slab(b: FacetBuilder, at: At, x0: number, z0: number, x1: number, z1: number, dip = 0, color: number = C.slab): void {
  const y = (x: number, z: number) => at(x, z) + 0.07;
  b.quad([x0, y(x0, z0), z0], [x0, y(x0, z1), z1], [x1, y(x1, z1) - dip, z1], [x1, y(x1, z0), z0], color);
}

/**
 * Le dessous des joints de la cour : un aplat gris, sous les dalles. Un seul plan sur toute la cour, qui s'écarte du sol d'au
 * plus 0,035 (la cour penche vers le sud) : posé à 0,01, il reste sous les dalles (à 0,07) et ne les recouvre plus (à 0,045,
 * il en cachait des pans entiers, lus comme de grandes plaques sombres, des trous).
 */
function jointBed(b: FacetBuilder, at: At, x0: number, z0: number, x1: number, z1: number): void {
  const y = (x: number, z: number) => at(x, z) + 0.01;
  b.quad([x0, y(x0, z0), z0], [x0, y(x0, z1), z1], [x1, y(x1, z1), z1], [x1, y(x1, z0), z0], C.joint);
}

/** La cour remise à plat : des dalles rectangulaires, joints nets (six colonnes sur trois rangées). Trente-huit triangles. */
function court(b: FacetBuilder, at: At): void {
  const K = COURT;
  jointBed(b, at, K.x0, K.z0, K.x1, K.z1);
  const dx = (K.x1 - K.x0) / K.cols,
    dz = (K.z1 - K.z0) / K.rows;
  for (let i = 0; i < K.cols; i++) for (let j = 0; j < K.rows; j++) slab(b, at, K.x0 + i * dx + 0.05, K.z0 + j * dz + 0.05, K.x0 + (i + 1) * dx - 0.05, K.z0 + (j + 1) * dz - 0.05);
}

/** La cour fendue, un côté affaissé (la ruine) : des dalles de travers, la rangée du sud-est enfoncée. */
function crackedCourt(b: FacetBuilder, at: At): void {
  const K = COURT;
  jointBed(b, at, K.x0, K.z0, K.x1, K.z1);
  const dx = (K.x1 - K.x0) / K.cols,
    dz = (K.z1 - K.z0) / K.rows;
  for (let i = 0; i < K.cols; i++)
    for (let j = 0; j < K.rows; j++) {
      // Deux dalles se sont enfoncées (d'un ton plus sombre que les autres, jamais le gris d'un trou), celles du côté est
      // penchent, un cran plus sombres : le lit gris des joints reste sous elles, il ne se voit qu'entre elles.
      const sunk = (i === 2 && j === 1) || (i === 4 && j === 2);
      const x0 = K.x0 + i * dx + 0.05,
        z0 = K.z0 + j * dz + 0.05;
      const x1 = K.x0 + (i + 1) * dx - 0.05,
        z1 = K.z0 + (j + 1) * dz - 0.05;
      if (sunk) slab(b, at, x0, z0, x1, z1, 0.02, C.slabSunk);
      else slab(b, at, x0, z0, x1, z1, i >= 4 ? 0.02 + 0.004 * j : 0, i >= 4 ? C.slabTilt : C.slab);
    }
}

/** La rampe de dalles qui contourne le bout est du quai : une colonne de dalles, du nord du quai à la porte. */
function ramp(b: FacetBuilder, at: At): void {
  const R = RAMP;
  jointBed(b, at, R.x0, R.z0, R.x1, R.z1);
  const dz = (R.z1 - R.z0) / R.rows;
  for (let j = 0; j < R.rows; j++) slab(b, at, R.x0 + 0.05, R.z0 + j * dz + 0.05, R.x1 - 0.05, R.z0 + (j + 1) * dz - 0.05);
}

/** La barrière basse du bord est de la rampe : des poteaux et deux lisses parallèles, tout du long. */
function fence(b: FacetBuilder, at: At): void {
  const F = FENCE;
  const zs = Array.from({ length: F.posts }, (_, i) => F.z0 + ((F.z1 - F.z0) * i) / (F.posts - 1));
  for (const z of zs) stake(b, F.x, z, at(F.x, z) + SINK, at(F.x, z) + F.top, F.post, C.newShade);
  for (let i = 0; i < zs.length - 1; i++)
    for (const h of F.rails) {
      const y0 = at(F.x, zs[i]) + h,
        y1 = at(F.x, zs[i + 1]) + h;
      b.beam({ x: F.x, y: y0, z: zs[i] }, { x: F.x, y: y1, z: zs[i + 1] }, 0.08, C.newWood);
    }
}

// ---------- Le mât, les rouages, les nacelles ----------

/** Le mât debout : un fût carré de 11, deux frettes de fer, la platine plate du haut où s'attachent les câbles (aucune pointe : elle ferait potence). Quarante triangles. */
function mast(b: FacetBuilder, at: At): void {
  const M = MAST;
  const g = at(M.x, M.z);
  b.box({ x: M.x, y: g + SINK, z: M.z }, [M.side, M.top - SINK, M.side], C.newShade, C.newWood);
  for (const y of [1.2, M.top - 1.4]) b.box({ x: M.x, y: g + y, z: M.z }, [M.side + 0.1, 0.2, M.side + 0.1], C.iron);
  b.box({ x: M.x, y: g + M.top, z: M.z }, [M.side + 0.2, 0.14, M.side + 0.2], C.iron);
}

/** Les deux rouages debout sur leurs arbres, et leur bâti : deux montants et leurs arbres de fer. Cent soixante-seize triangles. */
function gears(b: FacetBuilder, at: At, worn: boolean): void {
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  for (const G of [GEAR_A, GEAR_B]) {
    const g = at(G.x, G.z);
    gearDisc(b, { x: G.x, y: g + G.y, z: G.z }, G.r, G.teeth, G.thick, shade, wood, 0.3);
    boss(b, { ...G, y: G.y }, g);
    // Le montant derrière la roue, et l'arbre de fer qui le relie à son moyeu.
    stake(b, G.x, G.z - 1.0, g + SINK, g + G.y + 0.2, 0.26, shade);
    b.beam({ x: G.x, y: g + G.y, z: G.z - 0.9 }, { x: G.x, y: g + G.y, z: G.z + G.thick + 0.02 }, 0.14, C.iron);
  }
}

/** Le portique en U renversé d'une nacelle : deux montants et la traverse ; la nacelle pend dessous, par deux cordes. */
function portique(b: FacetBuilder, x: number, z: number, g: number, worn = false): void {
  const P = PORTIQUE;
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  for (const s of [-1, 1]) stake(b, x + (s * P.span) / 2, z, g + SINK, g + P.h, P.post, shade);
  b.box({ x, y: g + P.h, z }, [P.span + 0.4, 0.2, 0.22], shade, wood);
}

/**
 * Une nacelle au quai, dans son portique : le panier pend, immobile, par quatre cordes réunies en un point sous la
 * traverse. Quatre-vingt-quatorze triangles.
 */
function nacelle(b: FacetBuilder, x: number, z: number, g: number): void {
  portique(b, x, z, g);
  const y = g + PORTIQUE.h - PORTIQUE.hang - BASKET.h;
  const knot = { x, y: g + PORTIQUE.h - 0.1, z };
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    thread(b, knot, { x: x + dx * BASKET.r1 * 0.9, y: y + BASKET.h, z: z + dz * BASKET.r1 * 0.9 }, 0.04, C.rope);
  basket(b, { x, y, z });
}

// ---------- Les câbles ----------

/** Les deux câbles du haut : leur épaisseur, le creux fixe au milieu, l'anneau aux deux tiers de leur aiguille. */
export const CABLE = { thick: 0.25, sag: 0.9, segments: 3, ring: { r0: 0.3, r1: 0.52, up: 2 / 3 } } as const;

/** Une aiguille de décor, trouvée dans `NEEDLES_5E` par sa place sur le plan (jamais par son rang dans la liste). */
function needleAt(plan: readonly [number, number]): Needle {
  const at = fromPlan5e(plan);
  const found = NEEDLES_5E.find((n) => distance(n.at, at) < 0.01);
  if (!found) throw new Error(`Aucune aiguille du plan en [${plan.join(', ')}]`);
  return found;
}

/** Les aiguilles de décor que visent les câbles : celle de l'ouest ([905, 170] sur le plan) et celle de l'est ([1 190, 222]). */
const TARGETS = [needleAt([905, 170]), needleAt([1190, 222])] as const;

const CENTER = PLACES_5E.find((p) => p.id === 'nacelles')!.center;

/** Le sol du 5e en un point du monde. */
const groundAbs = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le haut du mât, dans le monde (la platine des câbles). */
export function mastTop(): Vec3 {
  return { x: CENTER.x + MAST.x, y: groundAbs(CENTER.x + MAST.x, CENTER.z + MAST.z) + MAST.top + 0.07, z: CENTER.z + MAST.z };
}

/** Le bout d'un câble, à l'anneau de l'aiguille `k` : aux deux tiers de sa hauteur, sur la face tournée vers le lieu. */
export function cableEnd(k: 0 | 1): Vec3 {
  const n = TARGETS[k];
  const y = groundAbs(n.at.x, n.at.z) + n.height * CABLE.ring.up;
  const top = mastTop();
  const dx = top.x - n.at.x,
    dz = top.z - n.at.z;
  const l = Math.hypot(dx, dz);
  const reach = spireRadiusAt({ radius: n.radius, height: n.height }, n.height * CABLE.ring.up) * 0.92 + 0.12;
  return { x: n.at.x + (dx / l) * reach, y, z: n.at.z + (dz / l) * reach };
}

/** Le point de départ d'un câble au haut du mât : à l'ouest et à l'est de la platine, à deux hauteurs. */
function cableStart(k: 0 | 1): Vec3 {
  const t = mastTop();
  return { x: t.x + (k === 0 ? -0.2 : 0.2), y: t.y - (k === 0 ? 0.05 : 0.3), z: t.z };
}

/** La ligne d'un câble : ses sommets, du mât à l'anneau, avec le creux fixe (sans oscillation). */
export function cableLine(k: 0 | 1): Vec3[] {
  const a = cableStart(k),
    c = cableEnd(k);
  const n = CABLE.segments;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t - CABLE.sag * 4 * t * (1 - t), z: a.z + (c.z - a.z) * t };
  });
}

/** Un anneau de fer à l'extrémité d'un câble : un cercle plat à six pans, ses deux faces, perpendiculaire au câble. Vingt-quatre triangles. */
function ring(b: FacetBuilder, at: Vec3, dir: Vec3): void {
  const l = Math.hypot(dir.x, dir.y, dir.z) || 1;
  const d = { x: dir.x / l, y: dir.y / l, z: dir.z / l };
  for (const s of [1, -1]) {
    const pitch = Math.acos(s * d.y);
    const yaw = Math.atan2(s * d.x, s * d.z);
    b.annulus({ x: at.x, y: at.y, z: at.z, yaw, pitch }, CABLE.ring.r0, CABLE.ring.r1, 0.01, 6, C.cable, C.cable, false);
  }
}

/**
 * Les deux câbles retendus, dans le monde (hors de l'emprise du lieu, donc hors de son modèle : aucune borne de marche, de
 * flore ou de caméra ne s'en trouve changée, la Carte ne les dessine pas) : de fer gris, un trait continu, partis du haut
 * du mât, ils montent avec un léger creux fixe jusqu'à l'anneau de leur aiguille. Jamais plus bas que le haut du mât.
 * Cent vingt triangles.
 */
export function nacellesCables(): Facets {
  const b = new FacetBuilder();
  for (const k of [0, 1] as const) {
    const line = cableLine(k);
    for (let i = 0; i < line.length - 1; i++) b.beam(line[i], line[i + 1], CABLE.thick, C.cable);
    const end = line[line.length - 1];
    const before = line[line.length - 2];
    ring(b, end, { x: end.x - before.x, y: end.y - before.y, z: end.z - before.z });
  }
  return b.build();
}

// ---------- La ruine ----------

/** Un ruban à plat (un câble détendu posé sur le quai) : de point en point, de largeur `w`, à la hauteur `y`. Deux triangles par tronçon. */
function ribbon(b: FacetBuilder, pts: readonly Vec2[], y: number, w: number, color: number): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i],
      c = pts[i + 1];
    const dx = c.x - a.x,
      dz = c.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * (w / 2),
      nz = (dx / l) * (w / 2);
    // Vers le haut : le sens du tour est celui qui donne la normale en +y.
    b.quad([a.x + nx, y, a.z + nz], [c.x + nx, y, c.z + nz], [c.x - nx, y, c.z - nz], [a.x - nx, y, a.z - nz], color);
  }
}

/**
 * Les volumes des Nacelles, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; la porte
 * est au sud, sur le chemin.
 */
function model(add: AddPiece, ground: SiteGround): void {
  const at: At = (x, z) => ground.at(x, z);
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le piton et la face taillée avec le signe de l'absence ; et la lanterne de la câbliste, allumée dès la
  // ruine (la seule), sur sa perche courte au bord du quai.
  add('ruine', 0, (b) => {
    piton(b, at);
    face(b, at);
  });
  add('ruine', 0, (b) => {
    const K = KEEPER_POLE;
    poleLantern(b, K.x, K.z, at(K.x, K.z), K.top, true, C.wornShade);
  });

  // ----- La ruine que le corps (1 sur 2) relève : le quai troué, la cour fendue, les poteaux, les lames basses, le rouage fendu.
  add('ruine', 0, (b) => quai(b, at, true, [3, 7, 11]), corps1);
  add('ruine', 0, (b) => crackedCourt(b, at), corps1);
  add(
    'ruine',
    0,
    (b) => {
      // Deux poteaux de travers, un moignon, un debout ; la poutre coupée, côté ouest seulement.
      const g = (x: number) => at(x, HALL.front);
      post(b, POSTS_X[0], g(POSTS_X[0]), HALL.post, C.wornWood, C.wornShade);
      post(b, POSTS_X[1], g(POSTS_X[1]), HALL.post - 0.2, C.wornWood, C.wornShade, 0.16, 0.1);
      post(b, POSTS_X[2], g(POSTS_X[2]), HALL.post - 0.6, C.wornWood, C.wornShade, -0.24, -0.1);
      post(b, POSTS_X[3], g(POSTS_X[3]), 1.6, C.wornWood, C.wornShade);
      facadeBeam(b, HALL.x0 - 0.2, 0.8, g(0), C.wornWood, C.wornShade);
    },
    corps1,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Les lames basses, avec des jours : quelques planches debout, d'autres tombées.
      const g = at(HALL.x0, HALL.front - 3);
      const gE = at(HALL.x1, HALL.front - 3);
      const board = (x: number, z: number, y: number, h: number) => b.box({ x, y: y + SINK, z }, [HALL.board, h - SINK, 0.92], C.wornShade, C.wornWood);
      for (const z of [-3.1, -4.05, -5.95, -6.9]) board(HALL.x0 + 0.07, z, g, HALL.lowRow);
      for (const z of [-4.05, -6.9, -7.85]) board(HALL.x1 - 0.07, z, gE, HALL.lowRow - 0.4);
    },
    corps1,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Le rouage debout (le plus grand), de bois usé ; l'autre, fendu en deux demi-disques couchés à son pied.
      const gA = at(GEAR_A.x, GEAR_A.z);
      gearDisc(b, { x: GEAR_A.x, y: gA + GEAR_A.y, z: GEAR_A.z }, GEAR_A.r, GEAR_A.teeth, GEAR_A.thick, C.wornShade, C.wornWood, 0.3);
      boss(b, GEAR_A, gA);
      stake(b, GEAR_A.x, GEAR_A.z - 1.0, gA + SINK, gA + GEAR_A.y + 0.2, 0.26, C.wornShade);
      b.beam({ x: GEAR_A.x, y: gA + GEAR_A.y, z: GEAR_A.z - 0.9 }, { x: GEAR_A.x, y: gA + GEAR_A.y, z: GEAR_A.z + GEAR_A.thick + 0.02 }, 0.14, C.iron);
      // Les demi-disques de B, à plat sur le quai (dessinés debout puis couchés sur le dos, face en haut).
      for (const [x, z, yaw, part] of [
        [-3.6, -0.25, 0.25, [0, 9]],
        [-2.2, -1.05, -0.5, [10, 19]],
      ] as const)
        drawPosed(b, { x, y: at(x, z) + 0.1, z, yaw, pitch: -Math.PI / 2 }, (l) => gearDisc(l, { x: 0, y: 0, z: 0 }, GEAR_B.r, GEAR_B.teeth, GEAR_B.thick, C.wornShade, C.wornWood, 0.3, [part[0], part[1]]));
    },
    corps1,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Trois planches du quai, tombées sur la cour, de côté, loin du chemin de la porte.
      for (const [x, z, yaw] of [
        [-6.4, 2.0, 0.5],
        [-5.4, 2.6, -0.3],
        [7.4, 2.3, 0.2],
      ] as const)
        b.box({ x, y: at(x, z) + 0.05, z, yaw }, [0.5, 0.08, 2.1], C.wornShade, C.wornWood);
    },
    corps1,
  );

  // ----- La ruine que le corps (2 sur 2) relève : les lames hautes à jours, les trois poulies (une à plat, deux de travers).
  add(
    'ruine',
    0,
    (b) => {
      const g = at(HALL.x0, HALL.front - 3);
      const gE = at(HALL.x1, HALL.front - 3);
      const board = (x: number, z: number, y: number, y0: number, y1: number) => b.box({ x, y: y + y0, z }, [HALL.board, y1 - y0, 0.92], C.wornShade, C.wornWood);
      for (const z of [-3.1, -5.0]) board(HALL.x0 + 0.07, z, g, HALL.lowRow, HALL.post - 0.5);
      board(HALL.x1 - 0.07, -7.85, gE, HALL.lowRow, HALL.post + 0.9);
    },
    corps2,
  );
  add(
    'ruine',
    0,
    (b) => {
      const g = at(PULLEYS.xs[0], HALL.front);
      // Deux poulies pendues de travers à leurs crochets, une à plat sur le quai.
      for (const [k, tilt] of [
        [0, 0.55],
        [1, -0.45],
      ] as const) {
        const x = PULLEYS.xs[k];
        hook(b, x, g);
        pulley(b, x, pulleyY(g) + 0.04, HALL.front, 0.35 * tilt, tilt, true);
      }
      pulley(b, -6, at(-6, 0.3) + 0.1, 0.3, 0.4, -Math.PI / 2, true);
    },
    corps2,
  );

  // ----- La ruine que le haut relève : la moitié ouest du toit restée sur les poteaux, le panneau tombé sur le quai avec un
  // câble en boucle, le mât en deux tronçons couchés, l'autre câble en boucle à côté, la lanterne de la halle, éteinte.
  // Le pan qui reste, affaissé : il tient à l'avant-toit sur les poteaux et s'enfonce dans la halle (vu de côté, un long trait
  // qui montait vers le ciel faisait lire un câble sortant du lieu).
  add('ruine', 0, (b) => roof(b, HALL.x0 - 0.3, 0.6, at(0, HALL.front), true, ROOF_FALL), haut);
  add(
    'ruine',
    0,
    (b) => {
      // Le panneau de bardeaux, à plat sur le quai, un peu de biais ; trois rangs.
      const x = 4.5,
        z = -0.7;
      const y = topAt(ground, x, z, 2) + 0.06;
      b.box({ x, y, z, yaw: 0.12 }, [4.6, 0.2, 3.2], C.wornShade, C.wornWood);
      const c = Math.cos(0.12),
        s = Math.sin(0.12);
      for (const o of [-0.9, 0, 0.9]) {
        const px = x + o * s,
          pz = z + o * c;
        b.quad([px - 2.2 * c, y + 0.215, pz + 2.2 * s], [px - 2.2 * c + 0.06 * s, y + 0.215, pz + 2.2 * s + 0.06 * c], [px + 2.2 * c + 0.06 * s, y + 0.215, pz - 2.2 * s + 0.06 * c], [px + 2.2 * c, y + 0.215, pz - 2.2 * s], C.shingleShade);
      }
      // La boucle du câble de l'est, sur le panneau.
      ribbon(b, [{ x: 3.0, z: -1.6 }, { x: 5.0, z: -1.9 }, { x: 6.2, z: -1.1 }, { x: 5.7, z: 0.0 }, { x: 3.8, z: -0.1 }, { x: 3.2, z: -0.8 }], y + 0.235, CABLE.thick, C.cable);
    },
    haut,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Le mât en deux tronçons couchés côte à côte sur le quai, en long, parallèles.
      for (const [x, z, len] of [
        [-0.4, -0.12, 5.0],
        [-0.9, 0.52, 4.2],
      ] as const)
        b.box({ x, y: at(x, z) + 0.1, z, yaw: Math.PI / 2 + 0.03 }, [MAST.side, MAST.side, len], C.wornShade, C.wornWood);
      // Le câble de l'ouest, en boucle sur le quai, son bout pendu à la poutre de façade (il ne sort pas du lieu).
      ribbon(b, [{ x: 0.5, z: -2.3 }, { x: 1.4, z: -1.55 }, { x: 0.5, z: -1.0 }, { x: -1.4, z: -1.2 }, { x: -1.6, z: -2.0 }], at(0, -1.5) + 0.14, CABLE.thick, C.cable);
      for (const x of [0.5, 0.6]) b.beam({ x, y: at(x, HALL.front) + HALL.beamY - HALL.beam / 2, z: HALL.front + 0.2 }, { x, y: at(x, -2.3) + 0.14, z: -2.3 }, CABLE.thick, C.cable);
      // La lanterne de la halle, éteinte, pendue au milieu de la poutre de façade (qui part avec le corps) : sa corde et sa vitre.
      hallLantern(b, at(HALL_MID, HALL.front), false);
    },
    haut,
  );

  // ----- La ruine que les abords relèvent : la nacelle couchée au bord du quai, son portique cassé, la lanterne éteinte couchée.
  add(
    'ruine',
    0,
    (b) => {
      const x = NACELLE_2.x,
        z = NACELLE_2.z;
      const y = topAt(ground, x, z, 1) + 0.1;
      // Le panier couché de travers sur le quai, son ouverture vers l'ouest.
      basket(b, { x: x - 0.3, y: y + BASKET.r1, z: z + 0.3, yaw: 0.5, pitch: Math.PI / 2 });
      // Le portique cassé : un montant tombé, un autre penché, la traverse en deux couchée.
      b.box({ x: x + 1.1, y, z: z - 0.9, yaw: 0.9 }, [PORTIQUE.post, PORTIQUE.post, 2.6], C.wornShade, C.wornWood);
      b.box({ x: x + 0.7, y: y - 0.2, z: z - 1.1, pitch: 0.3 }, [PORTIQUE.post, 1.8, PORTIQUE.post], C.wornShade);
      // La lanterne éteinte, couchée au pied du piquet penché (en tête de la rampe).
      const P = PATH_LANTERN;
      const gp = at(P.x, P.z);
      b.box({ x: P.x, y: gp + SINK, z: P.z, pitch: 0.4 }, [0.13, 1.2 - SINK, 0.13], C.wornShade);
      b.box({ x: P.x - 0.7, y: gp + 0.02, z: P.z + 0.25, yaw: 0.6, pitch: Math.PI / 2 }, [0.26, 0.34, 0.26], C.glassOff);
    },
    abords,
  );

  // ----- Le corps (1 sur 2) : la cour remise à plat, le quai refait, les poteaux, la poutre et le motif, les lames basses,
  // les deux rouages sur leurs arbres.
  add(0, 0, (b) => {
    court(b, at);
    quai(b, at, false);
  });
  add(0, 0, (b) => {
    for (const x of POSTS_X) post(b, x, at(x, HALL.front), HALL.post, C.newWood, C.newShade);
    facadeBeam(b, HALL.x0 - 0.2, HALL.x1 + 0.2, at(HALL_MID, HALL.front), C.newWood, C.newShade);
    roots(b, at(HALL_MID, HALL.front));
    for (const side of [-1, 1] as const) {
      sideWall(b, side, at(side < 0 ? HALL.x0 : HALL.x1, HALL.front - 3), false, false);
      seams(b, side, at(side < 0 ? HALL.x0 : HALL.x1, HALL.front - 3), false);
    }
  });
  add(0, 0, (b) => gears(b, at, false));
  // ----- Le corps (2 sur 2) : les lames hautes, les trois poulies sur leurs crochets, la première nacelle dans son portique.
  add(0, 0.5, (b) => {
    for (const side of [-1, 1] as const) {
      sideWall(b, side, at(side < 0 ? HALL.x0 : HALL.x1, HALL.front - 3), true, false);
      seams(b, side, at(side < 0 ? HALL.x0 : HALL.x1, HALL.front - 3), true);
    }
  });
  add(0, 0.5, (b) => {
    const g = at(PULLEYS.xs[0], HALL.front);
    for (const x of PULLEYS.xs) {
      hook(b, x, g);
      pulley(b, x, pulleyY(g), HALL.front);
    }
  });
  add(0, 0.5, (b) => nacelle(b, NACELLE_1.x, NACELLE_1.z, at(NACELLE_1.x, NACELLE_1.z)));
  // ----- Le haut : le toit de bardeaux, le mât debout, la lanterne de la halle (allumée avec cette partie).
  add(1, 0, (b) => roof(b, HALL.x0 - 0.3, HALL.x1 + 0.3, at(HALL_MID, HALL.front), false));
  add(1, 0, (b) => mast(b, at));
  add(1, 0, (b) => hallLantern(b, at(HALL_MID, HALL.front), true));
  // ----- Les abords : la rampe de dalles, la barrière basse, la lanterne du chemin, la seconde nacelle au bout du quai.
  add(2, 0, (b) => {
    ramp(b, at);
    fence(b, at);
  });
  add(2, 0, (b) => {
    const P = PATH_LANTERN;
    poleLantern(b, P.x, P.z, at(P.x, P.z), P.top, true, C.newShade);
  });
  add(2, 0, (b) => nacelle(b, NACELLE_2.x, NACELLE_2.z, at(NACELLE_2.x, NACELLE_2.z)));
}

// ---------- Les traces ----------

/** Le sol d'un point du lieu, depuis son centre posé au sol (`c`), dans le monde. */
const groundNear = (c: Vec3, lx: number, lz: number): number => standingHeight(heightAt5e({ x: c.x + lx, z: c.z + lz })) - c.y;

/** Où se pose la trace de chaque mission, depuis le centre du lieu : à gauche du quai, côté Kéo ; les abords, au bord de la rampe. */
const TRACE_SPOTS = {
  specifications: { x: -6.4, z: 0.25 },
  'technical-solutions': { x: -4, z: 0.5 },
  'life-cycle': { x: -2.2, z: -2 },
  'project-management': { x: 9.0, z: 2.0 },
} as const;

/**
 * La caisse à outils (Cahier des charges) : une caisse de bois fermée, la poignée relevée, posée sur un billot, au pied du
 * mât. Aucun outil dehors, aucun engrenage dessus.
 */
function toolbox(b: FacetBuilder, c: Vec3): void {
  const S = TRACE_SPOTS.specifications;
  const g = groundNear(c, S.x, S.z);
  const x = c.x + S.x,
    z = c.z + S.z;
  b.prism({ x, y: c.y + g, z }, 0.34, 0.3, 0.34, 5, C.newShade, C.newWood);
  b.box({ x, y: c.y + g + 0.34, z, yaw: 0.2 }, [0.78, 0.42, 0.44], C.newShade, C.newWood);
  // Le couvercle fermé et la poignée relevée, deux montants et une barre.
  b.box({ x, y: c.y + g + 0.76, z, yaw: 0.2 }, [0.8, 0.07, 0.46], C.seam, C.newWood);
  const s = Math.sin(0.2),
    k = Math.cos(0.2);
  for (const o of [-0.22, 0.22]) b.beam({ x: x + o * k, y: c.y + g + 0.8, z: z - o * s }, { x: x + o * k, y: c.y + g + 1.02, z: z - o * s }, 0.05, C.iron);
  b.beam({ x: x - 0.22 * k, y: c.y + g + 1.02, z: z + 0.22 * s }, { x: x + 0.22 * k, y: c.y + g + 1.02, z: z - 0.22 * s }, 0.06, C.iron);
}

/**
 * Le touret de câble (Solutions techniques) : un tambour posé à plat, à deux flasques pleines, sans rayon, où s'enroule un
 * câble de fer gris.
 */
function cableDrum(b: FacetBuilder, c: Vec3): void {
  const S = TRACE_SPOTS['technical-solutions'];
  const g = c.y + groundNear(c, S.x, S.z);
  const x = c.x + S.x,
    z = c.z + S.z;
  b.prism({ x, y: g, z }, 0.52, 0.52, 0.08, 8, C.newShade, C.newWood);
  b.prism({ x, y: g + 0.08, z }, 0.36, 0.36, 0.34, 8, C.iron, C.iron);
  b.prism({ x, y: g + 0.42, z }, 0.52, 0.52, 0.08, 8, C.newShade, C.newWood);
}

/** Le pot de grès (Cycle de vie) : ouvert, la spatule de bois penchée dedans, le bouchon de liège posé à côté. */
function pot(b: FacetBuilder, c: Vec3): void {
  const S = TRACE_SPOTS['life-cycle'];
  const g = c.y + groundNear(c, S.x, S.z);
  const x = c.x + S.x,
    z = c.z + S.z;
  b.prism({ x, y: g, z }, 0.3, 0.42, 0.42, 7, C.stonewareShade, C.stoneware);
  b.prism({ x, y: g + 0.42, z }, 0.42, 0.28, 0.2, 7, C.stoneware, C.stonewareShade);
  b.beam({ x: x + 0.05, y: g + 0.78, z: z + 0.05 }, { x: x + 0.3, y: g + 0.42, z: z + 0.15 }, 0.07, C.newWood);
  b.prism({ x: x + 0.72, y: g, z: z + 0.2 }, 0.14, 0.12, 0.16, 5, C.cork);
}

/** Le sac de chevilles (Gestion de projet) : un sac de toile noué, plein ; un maillet de bois couché à côté, au bord de la rampe. */
function pegBag(b: FacetBuilder, c: Vec3): void {
  const S = TRACE_SPOTS['project-management'];
  const g = c.y + groundNear(c, S.x, S.z);
  const x = c.x + S.x,
    z = c.z + S.z;
  b.prism({ x, y: g - 0.02, z, yaw: 0.3 }, 0.3, 0.38, 0.38, 5, C.sackShade, C.sack);
  b.prism({ x, y: g + 0.36, z, yaw: 0.3 }, 0.38, 0.12, 0.28, 5, C.sack, C.sackShade);
  b.prism({ x, y: g + 0.62, z, yaw: 0.3 }, 0.16, 0, 0.14, 5, C.sack);
  // Le maillet, couché : sa tête et son manche, parallèles au bord de la rampe.
  b.box({ x: x + 1.0, y: g, z: z + 0.1, yaw: 0.2 }, [0.36, 0.26, 0.26], C.newShade, C.newWood);
  b.box({ x: x + 1.0, y: g + 0.04, z: z + 0.55, yaw: 0.2 }, [0.07, 0.07, 0.6], C.newShade);
}

// ---------- La scénette ----------

/** Le plancher de la scène, le pavé de dalles chaudes devant le quai : sa demi-largeur, sa profondeur, sa hauteur. */
const SCENE_FLOOR = { half: 4.4, depth: 2.6, rise: 0.15 } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur la cour, devant le quai, le pied du mât et un rouage à gauche, derrière Kéo. */
const SCENE_SPOT = { dx: -2.6, dz: 3.1 } as const;

/** Le plancher de la scène : un pavé de dalles chaudes à joints nets, sur un socle de pierre. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const g = Math.min(standingHeight(heightAt5e({ x: floor.x, z: floor.z })), floor.y - 0.1);
  b.box({ x: floor.x, y: g - 0.3, z: floor.z }, [2 * F.half, floor.y - g + 0.28, F.depth], C.joint, C.joint);
  const n = 4;
  for (let k = 0; k < n; k++)
    for (let j = 0; j < 2; j++) {
      const x0 = floor.x - F.half + (k * 2 * F.half) / n + 0.05,
        x1 = x0 + (2 * F.half) / n - 0.1;
      const z0 = floor.z - F.depth / 2 + (j * F.depth) / 2 + 0.05,
        z1 = z0 + F.depth / 2 - 0.1;
      b.quad([x0, floor.y, z0], [x0, floor.y, z1], [x1, floor.y, z1], [x1, floor.y, z0], C.slab);
    }
}

/**
 * La câbliste en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu : ses jambes, son pantalon, sa
 * chemise de lin, sa casquette ; les bras le long du corps.
 */
function cabler(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.1, 0.11, 0.54, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.52, z: at.z }, 0.28, 0.26, 0.48, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.skin);
  b.prism({ x: at.x, y: at.y + 1.26, z: at.z }, 0.24, 0.2, 0.1, 8, C.cap);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La poutre basse des moufles : sa hauteur à l'échelle 1, sa lame ; une moufle choisie remonte de `lift`. */
const BEAM = { height: 1.9, lift: 0.2, post: 0.16, block: 0.4 } as const;

/**
 * Une moufle de bois (une poulie dans sa chape, un crochet en haut), pendue à la poutre : sa corde, sa chape, sa poulie, son
 * crochet. Aucun chiffre, aucune marque. Soixante-quatre triangles.
 */
function pulleyBlock(b: FacetBuilder, at: Vec3, s: number, lift: number): void {
  const top = at.y + BEAM.height * s;
  const y = at.y + (BEAM.height - 1.0 + lift) * s;
  // Le crochet de fer sous la poutre, la corde, la chape de bois (un pavé), la poulie (un disque) dedans.
  b.box({ x: at.x, y: top - 0.2 * s, z: at.z }, [0.06 * s, 0.2 * s, 0.06 * s], C.iron);
  b.beam({ x: at.x, y: top - 0.2 * s, z: at.z }, { x: at.x, y: y + BEAM.block * s, z: at.z }, 0.04 * s, C.rope);
  b.box({ x: at.x, y, z: at.z }, [0.34 * s, BEAM.block * s, 0.22 * s], C.block, C.newWood);
  b.drum({ x: at.x, y: y + 0.2 * s, z: at.z - 0.14 * s, pitch: Math.PI / 2 }, 0.17 * s, 0.28 * s, PULLEYS.sides, C.iron, C.newWood);
}

/**
 * La vue d'arrivée de « Y aller » (règle des Aiguilles, comme au Gaillard) : le mât (11 au-dessus de la cour, à 9,4 au nord de
 * la porte) sort de ce que montre la caméra qui suit, 7,7 au-dessus de la cour. La caméra qui suit monte de 1 et recule de
 * 1,6 fois, sans plonger plus : le haut du mât s'y voit (un test le vérifie) ; le retour d'une scénette la lit aussi.
 */
const DOOR_FRAME = { height: 1, back: 1.6 } as const;

export const NACELLES: PlaceArt = {
  role: 'La câbliste',
  model,
  // L'étape la plus basse qui porte une trace : la scénette se joue sur le lieu dès que le corps (1 sur 2) est posé. Chaque
  // trace a sa partie (`stage`, `row`) : elle se montre quand sa mission est réussie et que sa partie est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [SCENE_FLOOR.half, SCENE_FLOOR.depth / 2], fine: true },
  site: {
    rise: SCENE_FLOOR.rise,
    keo: { dx: -2.6, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.4, dz: 0.2 },
    subject: { halfWidth: 4.4, bottom: -0.5, top: 3.6, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) cabler(b, at, sphere);
  },
  answer: {
    size: { height: BEAM.height, half: 0.4 },
    // La poutre basse des moufles : deux montants plantés au bout de la rangée, la poutre en travers, au-dessus d'elles.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BEAM.height * s;
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.25);
        b.box({ x, y: Math.min(ground, y) - 0.3, z }, [BEAM.post, top - Math.min(ground, y) + 0.4, BEAM.post], C.newShade);
      }
      b.box({ x: mid, y: top, z }, [span + 0.8, 0.16, 0.18], C.newShade, C.newWood);
    },
    // Une moufle pendue ; choisie, elle remonte de 0,2 (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      pulleyBlock(b, at, s, picked ? BEAM.lift : 0);
    },
  },
  // Les quatre missions en R : la cour seule, rien de l'item ; les moufles portent les réponses.
  rest() {},
  traces: {
    specifications: { at: TRACE_SPOTS.specifications, lift: 1.2, stage: 0, row: 0, draw: toolbox },
    'technical-solutions': { at: TRACE_SPOTS['technical-solutions'], lift: 1, stage: 0, row: 0.5, draw: cableDrum },
    'life-cycle': { at: TRACE_SPOTS['life-cycle'], lift: 1, stage: 1, row: 0, draw: pot },
    'project-management': { at: TRACE_SPOTS['project-management'], lift: 1, stage: 2, row: 0, draw: pegBag },
  },
  // Les câbles du haut, hors de l'emprise du lieu : une fois le haut posé.
  reach: (_c, posed) => (posed(1, 0) ? nacellesCables() : null),
  // Kéo au retour : dans la cour, à l'ouest de la porte, face à la halle.
  exit: { x: -1.6, z: 6.2 },
  doorFrame: DOOR_FRAME,
};

/** Le plus haut du lieu : le haut du mât, au-dessus du sol (il reste bien sous les aiguilles). */
export const NACELLES_MAST_TOP = MAST.top;

