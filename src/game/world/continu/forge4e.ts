// La Forge (lot 2 du monde ouvert du 4e, GD-24 ; intention du directeur artistique du 21 octobre 2026, planche
// `selection-forge-v1` validée par le mainteneur le même jour) : « la grande forge des Passeurs, au pied du volcan : le feu
// de la montagne y arrivait par une rigole de pierre, et on y battait le minerai ». Le premier lieu fini du 4e. Le cœur,
// sans figure : le fourneau, un cône tronqué de pierre grise des Passeurs cerclé de fer, sa gueule voûtée au sud, face à la
// porte du lieu ; à l'ouest, le marteau-pilon dans son bâti, au-dessus de l'enclume ; à l'est, le train d'engrenages, trois
// roues dressées dont le diamètre double d'une roue à l'autre ; au sud-est, la cuve de trempe à huit pans ; au sud-ouest,
// la potence ; au sud-est, l'appentis de la chaudronnière ; derrière, au nord-ouest, la rigole couverte du lot 1 qui
// descend de la cuvette, son dernier tronçon et la grille au pied du fourneau, sa vanne à la prise.
// Le signe de l'absence du 4e : au bout de la chaîne de la potence, la chape de fer vide et ses deux goujons nus (les
// mâchoires de bronze des grandes pinces, prises par les Ferrailleurs) ; les pinces pendent fermées, leurs branches
// parallèles. Avant comme après, jamais une étape.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Le fourneau écrêté à 7, son bord cassé en biais, une fente
// sur son flanc est, deux cerclages rouillés, le troisième couché à son pied, sa gueule une ombre de pierre froide ; un
// montant du marteau-pilon debout, l'autre couché, la tête tombée à côté de l'enclume ; les roues couchées, la petite
// dressée contre le fourneau ; la cuve vide, un pan cassé ; le dernier tronçon de la rigole aux dalles déplacées ; les
// regards froids, la grille éteinte, la vanne fermée. Une seule lumière, la lanterne de l'appentis. Cinq parties (3 + 1 +
// 1) : le corps en trois (le fourneau refermé à sa hauteur de ruine ; le marteau-pilon ; le train d'engrenages et la cuve),
// le haut (le haut du fourneau, son gueulard et son collier ; la lanterne de la potence), les abords (la cour dallée, le
// dernier tronçon et la grille, les regards neufs, la vanne regarnie, la lanterne du chemin). Une trace par mission, avec
// sa partie. La restauration, une fois, après la dernière partie (`RESTORATION`) : la vanne se lève, les regards
// s'allument d'amont en aval, puis la grille, puis la gueule rougeoie ; rien ne s'éteint, rien ne pulse. Rien à lire dans
// la 3D, rien de croisé. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { drawPosed, FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E, RIGOLE_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Forge : la pierre grise des Passeurs et le fer rouillé du 4e (`COLORS_4E`) dans la ruine ; restaurés,
 * les cerclages, le bâti, la potence et le cadre de la gueule passent au fer bruni sombre, chaud, jamais presque noir
 * (directeur artistique, correction 3) ; la gueule froide, l'ombre d'une pierre froide (lot 1) ; le bois gris de la ruine,
 * le bois neuf brun des outils ; la tôle de fer grise de l'appentis ; l'eau sombre de la cuve ; le charbon et le minerai,
 * sombres sans être noirs ; le cuir du soufflet. Les lueurs : la lave du lot 1 (`#C4462C`), la gueule allumée (`#DC5530`,
 * plus rouge que la lueur de forge de la fiche, plus claire que la lave : avis dys, 2) et les trois teintes de son fondu,
 * que la vue dessine sans ombre (./levelWorld.ts, `FORGE_GLOW_COLORS`). L'ocre des lanternes, seule autre lumière.
 */
const C = {
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  rust: COLORS_4E.rust,
  rustShade: COLORS_4E.rustShade,
  // Le fer rouillé à l'ombre des roues de la ruine, comme au lot 1 : un brun éteint, jamais orange.
  rustGear: 0x6a483e,
  rustGearTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  coldMouth: 0x6a5e58,
  // Le dessus cassé du fourneau en ruine, et la bouche du gueulard : l'ombre de la pierre, un cran plus sombre.
  hollow: 0x5e544f,
  crack: 0x564c48,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  sheet: 0x8a8580,
  sheetShade: 0x6e6a66,
  water: 0x3f5866,
  coal: 0x524a46,
  ore: 0x5e524c,
  leather: 0x7a5a44,
  // Le dallage de la cour : la pierre grise au soleil, ses joints gris.
  paving: 0xb0a598,
  joint: 0x8a8078,
  // Le fond des regards et de la grille, froid et gris (lot 1 : la rigole vide).
  coldPit: 0x5a524e,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0x9c8452,
  lava: COLORS_4E.lava,
  // Les lingots des réponses : un fer gris chaud, plus clair que le fer bruni (jamais le cuivre : correction 4).
  ingot: 0x9a918a,
  ingotTop: 0xaaa199,
  // La chaudronnière, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de cuir, chemise grise.
  boots: 0x55595a,
  apron: 0x7a5a44,
  shirt: 0x8a8f94,
  head: 0xe3b48a,
} as const;

/**
 * La gueule allumée et les trois teintes de son fondu, de la pierre froide à la lueur (un quart, la moitié, trois quarts) :
 * la vue les dessine toutes sans ombre ; la séquence passe de l'une à l'autre (jamais une teinte entre deux).
 */
export const FORGE_GLOW = 0xdc5530;
export const FORGE_GLOW_FADE = [0x865c4e, 0xa55944, 0xc1573a] as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'forge')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt4e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/** Un point du monde dans le repère du lieu. */
const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/**
 * La cour dallée des abords, autour du fourneau : ses bords (x d'ouest en est, z du nord au sud). Son bord sud reste au
 * nord du chemin qui passe devant la porte (en z = 11) : rien ne se pose sur lui.
 */
const YARD = { x0: -10.5, x1: 12.2, z0: -7.4, z1: 8.4 } as const;

/**
 * Le dessus de la cour : un plan ajusté au sol sous elle (aux moindres carrés), relevé juste assez pour ne jamais passer
 * sous le sol, plus 0,04 : le pied de la Volcan est presque plat ici (à 0,3 près), la cour paraît à plat.
 */
const YARD_PLANE = (() => {
  const pts: [number, number, number][] = [];
  for (let x = YARD.x0; x <= YARD.x1 + 1e-6; x += 0.5) for (let z = YARD.z0; z <= YARD.z1 + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const mz = pts.reduce((s, p) => s + p[1], 0) / n;
  const my = pts.reduce((s, p) => s + p[2], 0) / n;
  let sxx = 0,
    szz = 0,
    sxz = 0,
    sxy = 0,
    szy = 0;
  for (const [x, z, y] of pts) {
    sxx += (x - mx) ** 2;
    szz += (z - mz) ** 2;
    sxz += (x - mx) * (z - mz);
    sxy += (x - mx) * (y - my);
    szy += (z - mz) * (y - my);
  }
  const det = sxx * szz - sxz * sxz;
  const b = (sxy * szz - szy * sxz) / det;
  const c = (szy * sxx - sxy * sxz) / det;
  let hi = -Infinity;
  for (const [x, z, y] of pts) hi = Math.max(hi, y - b * x - c * z);
  return { a: hi + 0.04, b, c };
})();

/** Le dessus des dalles de la cour, en un point du repère. */
const yardY = (x: number, z: number): number => YARD_PLANE.a + YARD_PLANE.b * x + YARD_PLANE.c * z;

/**
 * Le fourneau : son axe, son rayon au pied et en haut (un cône tronqué : la planche), sa hauteur restauré (9,5) et en
 * ruine (7, le bord cassé en biais de `ruinLow` à `ruinHigh`), ses dix pans (un pan face au sud, la gueule), ses trois
 * cerclages (leur milieu), le gueulard (son collier, de `collar` de haut).
 */
const FURNACE = { x: 0, z: -1, r0: 4.6, r1: 2.4, top: 9.5, ruin: 7, ruinLow: 5.9, ruinHigh: 7.2, sides: 10, bands: [2.1, 4.5, 6.6], band: 0.36, collar: 0.6 } as const;

/** Le rayon du fourneau à la hauteur `y` au-dessus de son pied. */
const furnaceR = (y: number): number => FURNACE.r0 - ((FURNACE.r0 - FURNACE.r1) * y) / FURNACE.top;

/** Le pied du fourneau (le dessus de la cour sous son axe) : le zéro de ses hauteurs. */
const FY = yardY(FURNACE.x, FURNACE.z);

/** Le demi-angle d'un pan (dix pans), et la pente du cône (son recul par unité de hauteur, sur le pan). */
const HALF_SIDE = Math.PI / FURNACE.sides;
const SLOPE = ((FURNACE.r0 - FURNACE.r1) / FURNACE.top) * Math.cos(HALF_SIDE);

/**
 * La gueule voûtée, au milieu du pan sud : sa demi-largeur, la naissance de sa voûte au-dessus du seuil, son seuil ; le
 * cadre autour d'elle (de fer bruni restauré, de pierre dans la ruine), sa largeur.
 */
const MOUTH = { half: 0.95, spring: 1.45, sill: 0.25, frame: 0.32 } as const;

/** Le marteau-pilon, à l'ouest : le milieu de son bâti, l'écart de ses deux montants, leur hauteur ; l'enclume sous lui. */
const HAMMER = { x: -8.2, z: 0.4, gap: 2.8, h: 6.2, post: 0.55, head: { w: 1.1, h: 0.9, y: 2.75 } } as const;
const ANVIL = { x: -8.2, z: 0.4 } as const;

/**
 * Le train d'engrenages, à l'est du fourneau, dressé dans un plan face au sud (en `z`) : trois roues engrenées, le
 * diamètre doublant de l'une à l'autre (1,5, 3, 6 : correction 5 du directeur artistique), la grande à l'est ; le
 * milieu de chacune (`x`, `y` au-dessus de la cour), son rayon, ses dents.
 */
const GEARS = {
  z: -4.9,
  thick: 0.34,
  tooth: 0.24,
  wheels: [
    { x: 2.95, y: 3.25, r: 0.75, teeth: 7 },
    { x: 5.05, y: 2.1, r: 1.5, teeth: 11 },
    { x: 9.55, y: 3.25, r: 3.0, teeth: 15 },
  ],
} as const;

/** La cuve de trempe à huit pans (la planche), au sud-est, entre les roues et l'appentis : son milieu, ses rayons, sa hauteur, son eau. */
const TUB = { x: 8.1, z: 0.6, rIn: 0.95, rOut: 1.28, h: 0.9, water: 0.72 } as const;

/** La potence, au sud-ouest, entre la gueule et l'enclume : son poteau, sa hauteur, le bout de son bras (vers l'est). */
const GIBBET = { x: -4.1, z: 4.6, h: 5.2, arm: 2.0, post: 0.32 } as const;

/**
 * L'appentis de la chaudronnière, au sud-est, ouvert vers l'ouest : ses bords (ses quatre poteaux aux coins), son toit
 * de tôle d'un pan, haut à l'ouest, bas à l'est ; son plancher de pierre (où se joue la scénette), un cran au-dessus de la cour.
 */
const SHED = { x0: 9.0, x1: 11.6, z0: 3.4, z1: 7.4, high: 3.1, low: 2.3, overhang: 0.35 } as const;
const SHED_FLOOR = { x0: 3.4, x1: 12.0, z0: 2.6, z1: 8.0, rise: 0.1 } as const;
/** La lanterne de l'appentis, la seule allumée de la ruine, sur un bras au poteau sud-ouest. */
const SHED_LANTERN = { x: SHED.x0 - 0.35, z: SHED.z1, y: 2.45 } as const;
/** La lanterne du chemin (les abords), à l'entrée de la cour côté Fabriques, au bord du chemin. */
const PATH_LANTERN = { x: 3.4, z: 8.6, h: 1.35 } as const;

/** Le pas de la porte du lieu, au bout de ses deux chemins (`fab-2`, `fab-3`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'forge')!.at);

// ---------- La rigole ----------

/** La rigole du lot 1, dans le repère du lieu : de la prise, au bord de la cuvette, à son bout, au nord-ouest de la cour. */
const RIGOLE: readonly Vec2[] = RIGOLE_4E.map(toLocal);

/** Le dessus des dalles de la rigole du lot 1 au-dessus du sol (./paths4e.ts : son pied à −0,15, ses murets de 0,35, sa dalle de 0,14). */
const RIGOLE_TOP = 0.34;

/**
 * Un point de la rigole à `s` unités de sa prise, et son cap (comme ./paths4e.ts : le long de `z` du pavé), sur le tracé du
 * lot 1, puis sur son dernier tronçon jusqu'à la grille (`GRATE`).
 */
function alongRigole(s: number): { at: Vec2; yaw: number } {
  const line = [...RIGOLE, GRATE_IN];
  let rest = s;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = Math.hypot(c.x - a.x, c.z - a.z);
    if (rest <= len || i === line.length - 1) {
      const t = Math.min(1, rest / len);
      return { at: { x: a.x + (c.x - a.x) * t, z: a.z + (c.z - a.z) * t }, yaw: Math.atan2(c.x - a.x, c.z - a.z) };
    }
    rest -= len;
  }
  return { at: line[line.length - 1], yaw: 0 };
}

/** La longueur de la rigole du lot 1. */
const RIGOLE_LENGTH = RIGOLE.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - RIGOLE[i].x, p.z - RIGOLE[i].z), 0);

/**
 * La grille au pied du fourneau, côté nord-ouest, là où la rigole entre sous lui : son milieu (dans l'axe du bout de la
 * rigole, à `out` du pied du fourneau), son demi-côté ; `in` : le bord de la grille où arrive le dernier tronçon.
 */
const GRATE = (() => {
  const end = RIGOLE[RIGOLE.length - 1];
  const d = Math.hypot(end.x - FURNACE.x, end.z - FURNACE.z);
  const u = { x: (end.x - FURNACE.x) / d, z: (end.z - FURNACE.z) / d };
  const half = 0.85;
  const r = FURNACE.r0 + half - 0.25;
  return { at: { x: FURNACE.x + u.x * r, z: FURNACE.z + u.z * r }, half, yaw: Math.atan2(u.x, u.z), u };
})();
const GRATE_IN: Vec2 = { x: GRATE.at.x + GRATE.u.x * GRATE.half, z: GRATE.at.z + GRATE.u.z * GRATE.half };

/**
 * Les quatre regards, à peu près également espacés de la prise au fourneau (en unités depuis la prise), jamais là où
 * l'embranchement des rails croise la rigole (vers 18,5, où elle reste couverte d'une dalle : un test le vérifie) ; un
 * carré de `half` de demi-côté, trois barreaux épais de `bar` (jamais une grille fine qui scintille : avis dys, 4).
 */
const REGARDS = { at: [6.5, 12.5, 23.5, 28.2], half: 0.6, bar: 0.26 } as const;

/** La vanne, à la prise : sa place depuis la prise, le demi-écart de ses piliers, leur hauteur, la porte de fer et sa levée. */
const VANNE = { s: 1.35, half: 1.05, h: 2.3, pillar: 0.5, door: { w: 1.25, h: 1.1, lift: 1.05 } } as const;

/** Le dernier tronçon (les abords), du bout de la rigole du lot 1 à la grille : sa largeur, comme celle du lot 1. */
const LAST = { width: 1.5, height: 0.35, slab: 0.14 } as const;

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » : de la porte vers le fourneau (cap sud-sud-est, regard vers le nord-nord-ouest), la
 * gueule face à elle, le volcan au fond. La caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_VIEW = Math.atan2(DOOR_AT.x - FURNACE.x, DOOR_AT.z - FURNACE.z);

/**
 * La vue d'arrivée de « Y aller » (comme le Gaillard et les Nacelles) : le fourneau restauré (9,5) dépasse les 7,7 que
 * montre la caméra qui suit ; un peu plus reculée et moins plongeante, il y tient entier, gueulard compris.
 */
const DOOR_FRAME = { height: 1, back: 1.6 } as const;

/**
 * Le point du nom sur la Carte, depuis le centre du lieu : au-dessus des roues, à droite du gueulard (directeur
 * artistique, correction 8), le même en ruine et restauré.
 */
const MAP_POINT: Vec3 = { x: 6.5, y: FY + FURNACE.top + 1.5, z: -3 };

// ---------- Les petits volumes ----------

/** Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de bronze en pointe), d'ocre ou éteinte. */
function lantern(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * s, z: top.z }, [0.24 * s, 0.3 * s, 0.24 * s], lit ? C.lantern : C.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04 * s, z: top.z, yaw: Math.PI / 4 }, 0.21 * s, 0, 0.16 * s, 4, C.bronze);
}

/**
 * Un volume à dessus libre : `top` (dans le sens inverse des aiguilles d'une montre vu d'en haut) et son dessous `by` sous
 * lui ; ses côtés et son dessus (le dessous ne se voit pas).
 */
function slab(b: FacetBuilder, top: readonly P3[], by: number, color: number, face: number): void {
  const bot = top.map(([x, y, z]) => [x, y - by, z] as const);
  const n = top.length;
  for (let k = 1; k < n - 1; k++) b.triangle(top[0], top[k], top[k + 1], face);
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(bot[k], bot[m], top[m], top[k], color);
  }
}

/** Un sommet du fourneau : le coin `k` de ses pans, à la hauteur `y` au-dessus de son pied, écarté de `out`. */
function furnaceCorner(k: number, y: number, out = 0): P3 {
  const a = (2 * Math.PI * k) / FURNACE.sides;
  const r = furnaceR(y) + out;
  return [FURNACE.x + r * Math.cos(a), FY + y, FURNACE.z + r * Math.sin(a)];
}

/**
 * Le cône du fourneau de `y0` à des hauteurs de haut qui peuvent changer d'un coin à l'autre (`top(k)` : le bord cassé
 * en biais de la ruine), ses pans de pierre grise, son dessus de `cap` (la pierre, ou l'ombre d'un dessus cassé).
 */
function furnaceCone(b: FacetBuilder, y0: number, top: (k: number) => number, cap: number): void {
  const n = FURNACE.sides;
  const lo = Array.from({ length: n }, (_, k) => furnaceCorner(k, y0));
  const hi = Array.from({ length: n }, (_, k) => furnaceCorner(k, top(k)));
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(lo[m], lo[k], hi[k], hi[m], k % 2 ? C.stone : C.stoneSun);
  }
  const mid = hi.reduce((s, p) => s + p[1], 0) / n;
  const c: P3 = [FURNACE.x, mid, FURNACE.z];
  for (let k = 0; k < n; k++) b.triangle(c, hi[(k + 1) % n], hi[k], cap);
}

/** Un cerclage du fourneau autour de la hauteur `y` (son milieu), un rien écarté de ses pans, de `color`. */
function furnaceBand(b: FacetBuilder, y: number, color: number, h: number = FURNACE.band): void {
  const n = FURNACE.sides;
  const lo = Array.from({ length: n }, (_, k) => furnaceCorner(k, y - h / 2, 0.07));
  const hi = Array.from({ length: n }, (_, k) => furnaceCorner(k, y + h / 2, 0.07));
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(lo[m], lo[k], hi[k], hi[m], color);
  }
}

/** Le contour d'une voûte (dans son plan : x en travers, y vers le haut) : de demi-largeur `w`, sa naissance à `spring`. */
function archOutline(w: number, spring: number): (readonly [number, number])[] {
  const pts: (readonly [number, number])[] = [
    [-w, 0],
    [w, 0],
  ];
  for (let i = 0; i <= 4; i++) {
    const a = (Math.PI * i) / 4;
    pts.push([w * Math.cos(a), spring + w * Math.sin(a)]);
  }
  return pts;
}

/**
 * Sur le pan sud du fourneau, posé contre lui (`lift` devant sa face), un dessin dans le plan du pan : x en travers, y le
 * long de la pente, depuis le seuil de la gueule.
 */
function onSouthFace(b: FacetBuilder, lift: number, draw: (l: FacetBuilder) => void): void {
  const tilt = Math.atan(SLOPE);
  const y = MOUTH.sill;
  const apothem = furnaceR(y) * Math.cos(HALF_SIDE);
  drawPosed(b, { x: FURNACE.x, y: FY + y, z: FURNACE.z + apothem + lift, yaw: 0, pitch: -tilt }, draw);
}

/**
 * La gueule : son cadre (de pierre dans la ruine, de fer bruni restauré) et son ombre de pierre froide ; la lueur se
 * pose devant elle à la restauration (`mouthGlow`).
 */
function mouth(b: FacetBuilder, frame: number): void {
  onSouthFace(b, 0.02, (l) => {
    l.plate({ x: 0, y: -MOUTH.sill + 0.02, z: 0 }, archOutline(MOUTH.half + MOUTH.frame, MOUTH.spring + MOUTH.sill), frame);
    l.plate({ x: 0, y: 0, z: 0.012 }, archOutline(MOUTH.half, MOUTH.spring), C.coldMouth);
  });
}

/** La lueur de la gueule, de la couleur `color`, posée devant son ombre (dans le maillage des lieux ou de la pose). */
function mouthGlow(b: FacetBuilder, color: number): void {
  onSouthFace(b, 0.045, (l) => l.plate({ x: 0, y: 0, z: 0 }, archOutline(MOUTH.half, MOUTH.spring), color));
}

/**
 * Une roue dentée : un disque épais aux dents en pointe (un contour en étoile, `teeth` dents), dressée dans son plan (x,
 * y), son épaisseur en z, et son moyeu sur ses deux faces. Couchée par `pitch`, à plat.
 */
function gearWheel(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number; pitch?: number }, r: number, teeth: number, side: number, face: number, hub: number): void {
  drawPosed(b, at, (l) => {
    const n = 2 * teeth;
    const T = GEARS.thick / 2;
    const rim = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * i) / teeth;
      const rr = i % 2 ? r : r + GEARS.tooth;
      return [rr * Math.cos(a), rr * Math.sin(a)] as const;
    });
    const f = rim.map(([x, y]) => [x, y, T] as P3);
    const k = rim.map(([x, y]) => [x, y, -T] as P3);
    for (let i = 0; i < n; i++) {
      const m = (i + 1) % n;
      l.triangle([0, 0, T], f[i], f[m], face);
      l.triangle([0, 0, -T], k[m], k[i], face);
      l.quad(k[i], k[m], f[m], f[i], side);
    }
    const hex = Array.from({ length: 6 }, (_, i) => [r * 0.24 * Math.cos((Math.PI * i) / 3), r * 0.24 * Math.sin((Math.PI * i) / 3)] as const);
    l.plate({ x: 0, y: 0, z: T + 0.01 }, hex, hub);
    l.plate({ x: 0, y: 0, z: -T - 0.01, yaw: Math.PI }, hex, hub);
  });
}

/** Un regard ou la grille : son fond (froid et gris), trois barreaux épais en travers de `bars` ; à plat, au cap `yaw`. */
function grate(b: FacetBuilder, at: Vec3, half: number, yaw: number, bars: number): void {
  b.box({ x: at.x, y: at.y, z: at.z, yaw }, [2 * half, 0.05, 2 * half], C.coldPit, C.coldPit);
  for (const t of [-0.55, 0, 0.55]) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    // Les barreaux en travers de la rigole (le long du `x` du cap), de bord à bord.
    b.box({ x: at.x + t * half * s, y: at.y + 0.05, z: at.z + t * half * c, yaw }, [2 * half + 0.1, 0.09, REGARDS.bar], bars, bars);
  }
}

/** La lave d'un regard ou de la grille, juste au-dessus de son fond, sous ses barreaux (une couleur sans ombre). */
function lavaPlate(b: FacetBuilder, at: Vec3, half: number, yaw: number, color: number): void {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const h = half - 0.04;
  const p = (u: number, v: number): P3 => [at.x + u * c + v * s, at.y + 0.056, at.z - u * s + v * c];
  // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
  b.quad(p(-h, h), p(h, h), p(h, -h), p(-h, -h), color);
}

// ---------- Le modèle ----------

/** Les pièces de la cour (abords) : la dalle qui suit le plan, puis ses joints en rangs. */
function yard(b: FacetBuilder): void {
  const Y = YARD;
  const corners: P3[] = [
    [Y.x0, yardY(Y.x0, Y.z1), Y.z1],
    [Y.x1, yardY(Y.x1, Y.z1), Y.z1],
    [Y.x1, yardY(Y.x1, Y.z0), Y.z0],
    [Y.x0, yardY(Y.x0, Y.z0), Y.z0],
  ];
  slab(b, corners, 0.5, C.stoneShade, C.paving);
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, yardY(q.x, q.z) + 0.012, q.z + nz * s];
    const quad = [p(a, 1), p(c, 1), p(c, -1), p(a, -1)] as const;
    // La face vers le ciel, quel que soit le sens du trait.
    const up = (quad[1][2] - quad[0][2]) * (quad[3][0] - quad[0][0]) - (quad[1][0] - quad[0][0]) * (quad[3][2] - quad[0][2]);
    if (up >= 0) b.quad(quad[0], quad[1], quad[2], quad[3], C.joint);
    else b.quad(quad[3], quad[2], quad[1], quad[0], C.joint);
  };
  for (const z of [-4.6, -1.8, 1.4, 4.4, 6.8]) line({ x: Y.x0 + 0.3, z }, { x: Y.x1 - 0.3, z });
  for (const x of [-7.4, 7.0]) line({ x, z: Y.z0 + 0.3 }, { x, z: Y.z1 - 0.3 });
}

/** Le plancher de pierre de l'appentis, où se joue la scénette : un cran au-dessus de la cour. */
function shedFloor(b: FacetBuilder): void {
  const F = SHED_FLOOR;
  const top = (x: number, z: number): P3 => [x, yardY(x, z) + F.rise, z];
  slab(b, [top(F.x0, F.z1), top(F.x1, F.z1), top(F.x1, F.z0), top(F.x0, F.z0)], F.rise + 0.6, C.stoneShade, C.stoneSun);
}

/** L'appentis : quatre poteaux de bois, son toit de tôle d'un pan (haut à l'ouest), l'établi, la bigorne, deux tôles debout. */
function shed(b: FacetBuilder): void {
  const S = SHED;
  const F = yardY((S.x0 + S.x1) / 2, (S.z0 + S.z1) / 2) + SHED_FLOOR.rise;
  for (const [x, z, h] of [
    [S.x0, S.z0, S.high],
    [S.x0, S.z1, S.high],
    [S.x1, S.z0, S.low],
    [S.x1, S.z1, S.low],
  ] as const)
    b.box({ x, y: F - 0.3, z }, [0.26, h + 0.3, 0.26], C.woodShade, C.wood);
  const o = S.overhang;
  const roofAt = (x: number) => F + S.high + ((S.low - S.high) * (x - S.x0)) / (S.x1 - S.x0);
  const r = (x: number, z: number): P3 => [x, roofAt(x) + 0.12, z];
  slab(b, [r(S.x0 - o, S.z1 + o), r(S.x1 + o, S.z1 + o), r(S.x1 + o, S.z0 - o), r(S.x0 - o, S.z0 - o)], 0.1, C.sheetShade, C.sheet);
  // L'établi, contre le fond (à l'est), et la bigorne devant lui ; deux tôles debout contre le poteau nord-est.
  b.box({ x: S.x1 - 0.55, y: F, z: (S.z0 + S.z1) / 2 }, [0.8, 0.85, 2.8], C.woodShade, C.wood);
  b.prism({ x: S.x0 + 0.9, y: F, z: S.z0 + 1.0 }, 0.28, 0.24, 0.6, 6, C.woodShade, C.wood);
  b.prism({ x: S.x0 + 0.9, y: F + 0.6, z: S.z0 + 1.0, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.14, 0, 0.62, 4, C.iron);
  for (const dz of [0.5, 0.95]) b.box({ x: S.x1 + 0.05, y: F - 0.05, z: S.z0 + dz, pitch: 0, yaw: 0.12 }, [0.06, 1.7, 0.9], C.sheetShade, C.sheet);
}

/** La lanterne de l'appentis, la seule allumée de la ruine, sur son bras au poteau sud-ouest. */
function shedLantern(b: FacetBuilder): void {
  const L = SHED_LANTERN;
  const F = yardY(SHED.x0, SHED.z1) + SHED_FLOOR.rise;
  b.beam({ x: SHED.x0, y: F + L.y + 0.1, z: L.z }, { x: L.x, y: F + L.y + 0.1, z: L.z }, 0.08, C.woodShade);
  lantern(b, { x: L.x, y: F + L.y + 0.06, z: L.z }, true);
}

/**
 * La potence : son poteau de fer, son bras vers l'est ; la chaîne, et au bout la chape vide aux deux goujons nus (le signe
 * de l'absence du 4e) ; les grandes pinces pendues fermées, leurs deux branches parallèles. La même avant et après : de
 * fer rouillé (le fer bruni restauré n'y entre pas : elle ne change jamais).
 */
function gibbet(b: FacetBuilder): void {
  const G = GIBBET;
  const g = yardY(G.x, G.z);
  const top = g + G.h;
  b.box({ x: G.x, y: SINK, z: G.z }, [G.post, top - SINK, G.post], C.rustShade, C.rust);
  b.box({ x: G.x + G.arm / 2, y: top - 0.3, z: G.z }, [G.arm + G.post, 0.26, 0.26], C.rustShade, C.rust);
  // La chaîne, du bout du bras, jusqu'à la chape vide et ses deux goujons nus.
  const end = G.x + G.arm - 0.1;
  b.box({ x: end, y: g + 2.75, z: G.z }, [0.07, top - 0.3 - (g + 2.75), 0.07], C.rustShade);
  b.box({ x: end, y: g + 2.45, z: G.z }, [0.42, 0.3, 0.2], C.rustShade, C.rust);
  for (const dx of [-0.12, 0.12]) b.box({ x: end + dx, y: g + 2.2, z: G.z }, [0.07, 0.25, 0.07], C.iron);
  // Les pinces, pendues à un crochet au milieu du bras : deux branches droites, parallèles, jamais en X.
  const mid = G.x + G.arm * 0.45;
  for (const dz of [-0.09, 0.09]) b.box({ x: mid, y: g + 1.55, z: G.z + dz }, [0.1, top - 0.3 - (g + 1.55), 0.07], C.rustShade);
}

/** La lanterne de la potence (le haut), pendue sous le bras, près du poteau. */
function gibbetLantern(b: FacetBuilder): void {
  const G = GIBBET;
  const top = yardY(G.x, G.z) + G.h - 0.3;
  lantern(b, { x: G.x + 0.55, y: top - 0.02, z: G.z }, true);
}

/** L'enclume sur son billot de bois, à l'ouest, sous le marteau-pilon : elle tient dans la ruine, sans rien changer. */
function anvil(b: FacetBuilder): void {
  const g = yardY(ANVIL.x, ANVIL.z);
  b.prism({ x: ANVIL.x, y: SINK, z: ANVIL.z }, 0.6, 0.55, g + 0.55 - SINK, 7, C.woodShade, C.wood);
  b.box({ x: ANVIL.x, y: g + 0.55, z: ANVIL.z }, [0.55, 0.32, 0.4], C.rustShade, C.rust);
  b.box({ x: ANVIL.x + 0.1, y: g + 0.87, z: ANVIL.z }, [1.05, 0.24, 0.48], C.rustShade, C.rust);
  b.prism({ x: ANVIL.x - 0.42, y: g + 1.0, z: ANVIL.z, pitch: Math.PI / 2, yaw: -Math.PI / 2 }, 0.17, 0, 0.55, 4, C.rust);
}

/** Les volumes de la Forge, de la ruine aux abords (le modèle du lieu). */
function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const F = FURNACE;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : l'enclume, la potence et son signe de l'absence, l'appentis, son plancher et sa lanterne (la seule allumée
  // de la ruine : la chaudronnière vit là).
  add('ruine', 0, (b) => {
    anvil(b);
    gibbet(b);
    shedFloor(b);
    shed(b);
    shedLantern(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : le fourneau écrêté, son bord cassé en biais (haut au nord-ouest, bas au sud-est), la fente de
  // son flanc est, ses deux cerclages rouillés, le troisième couché à plat à son pied ; sa gueule, une ombre de pierre
  // froide dans un cadre de pierre ; trois blocs tombés du haut.
  add(
    'ruine',
    0,
    (b) => {
      const cut = (k: number) => {
        const a = (2 * Math.PI * k) / F.sides;
        return F.ruinLow + ((F.ruinHigh - F.ruinLow) * (1 - Math.cos(a - 0.6))) / 2;
      };
      furnaceCone(b, SINK, cut, C.hollow);
      for (const y of F.bands.slice(0, 2)) furnaceBand(b, y, C.rustGear);
      mouth(b, C.stoneShade);
      // La fente : un coin sombre sur le pan est-sud-est (entre les coins 0 et 1), étroit en bas, large en haut.
      const p = (t: number, y: number, out: number): P3 => {
        const a = furnaceCorner(0, y, out),
          c = furnaceCorner(1, y, out);
        return [a[0] + (c[0] - a[0]) * t, a[1], a[2] + (c[2] - a[2]) * t];
      };
      b.quad(p(0.46, 1.1, 0.02), p(0.52, 1.1, 0.02), p(0.62, cut(0.5) - 0.05, 0.02), p(0.36, cut(0.5) - 0.05, 0.02), C.crack);
      // Le cerclage couché : un demi-anneau de fer à plat, au pied du fourneau, devant la gueule à l'est.
      const ring = { x: 2.4, z: 4.6, r: 1.05 };
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI * 0.15 + (Math.PI * i) / 6,
          a1 = Math.PI * 0.15 + (Math.PI * (i + 1)) / 6;
        const q = (a: number, r: number): P3 => [ring.x + r * Math.cos(a), yardY(ring.x, ring.z) + 0.06, ring.z - r * Math.sin(a)];
        b.quad(q(a0, ring.r + 0.13), q(a1, ring.r + 0.13), q(a1, ring.r - 0.13), q(a0, ring.r - 0.13), C.rustGear);
      }
      for (const [x, z, s, yaw] of [
        [3.4, 3.4, 0.95, 0.5],
        [4.6, 1.9, 0.75, 1.2],
        [-4.6, 2.9, 0.85, 2.1],
      ] as const)
        b.box({ x, y: yardY(x, z) - 0.2, z, yaw, pitch: 0.12 }, [s, s * 0.7 + 0.2, s * 0.85], C.stoneShade, C.stone);
    },
    corps1,
  );
  // Le corps 2 la relève : le marteau-pilon, un montant debout, l'autre couché ; la tête tombée, couchée à côté de
  // l'enclume.
  add(
    'ruine',
    0,
    (b) => {
      const H = HAMMER;
      const g = yardY(H.x, H.z);
      b.box({ x: H.x - H.gap / 2, y: SINK, z: H.z }, [H.post, g + H.h - SINK, H.post], C.rustShade, C.rust);
      b.box({ x: H.x + 0.6, y: g - 0.1, z: H.z + 2.2, yaw: 0.35 }, [H.post, H.post, H.h - 0.6], C.rustShade, C.rust);
      b.box({ x: H.x + 1.75, y: g - 0.15, z: H.z + 0.9, yaw: 0.5 }, [H.head.w, H.head.h, H.head.h], C.rustShade, C.rust);
    },
    corps2,
  );
  // Le corps 3 la relève : la grande roue couchée à plat, la petite dressée sur sa tranche contre le fourneau ; la cuve
  // vide, un pan cassé et couché à côté.
  add(
    'ruine',
    0,
    (b) => {
      const [small, , big] = GEARS.wheels;
      gearWheel(b, { x: 8.6, y: yardY(8.6, -4.0) + GEARS.thick / 2 - 0.05, z: -4.0, yaw: 0.3, pitch: Math.PI / 2 }, big.r, big.teeth, C.rustGear, C.rustGearTop, C.rustShade);
      gearWheel(b, { x: 4.1, y: yardY(4.1, -4.6) + small.r + GEARS.tooth - 0.05, z: -4.7, yaw: 0.9 }, small.r, small.teeth, C.rustGear, C.rustGearTop, C.rustShade);
      tub(b, false);
    },
    corps3,
  );
  // Le haut n'a rien de tombé à relever (le haut du fourneau est parti en blocs, qui partent avec le corps 1).
  // Les abords la relèvent : le dernier tronçon de la rigole, ses dalles déplacées, et la grille éteinte, rouillée.
  add(
    'ruine',
    0,
    (b) => {
      lastStretch(b, true);
      const g = GRATE.at;
      grate(b, { x: g.x, y: yardY(g.x, g.z) - 0.02, z: g.z }, GRATE.half, GRATE.yaw, C.rustGear);
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le fourneau refermé jusqu'à sa hauteur de ruine, la fente comblée, les trois cerclages de fer
  // bruni, la gueule voûtée nette dans son cadre de fer sombre (l'ombre froide, jusqu'à la restauration).
  add(0, 0, (b) => {
    furnaceCone(b, SINK, () => F.ruin, C.stone);
    for (const y of F.bands) furnaceBand(b, y, C.iron);
    mouth(b, C.iron);
  });
  // Le corps 2 sur 3 : le marteau-pilon, ses deux montants, la traverse, la tige et la tête remontée dans son guide.
  add(0, 1 / 3, (b) => {
    const H = HAMMER;
    const g = yardY(H.x, H.z);
    for (const s of [-1, 1]) b.box({ x: H.x + (s * H.gap) / 2, y: SINK, z: H.z }, [H.post, g + H.h - SINK, H.post], C.iron, C.ironTop);
    b.box({ x: H.x, y: g + H.h, z: H.z }, [H.gap + H.post + 0.3, 0.5, H.post + 0.1], C.iron, C.ironTop);
    b.box({ x: H.x, y: g + H.head.y + H.head.h, z: H.z }, [0.22, H.h - H.head.y - H.head.h, 0.22], C.iron);
    b.box({ x: H.x, y: g + H.head.y, z: H.z }, [H.head.w, H.head.h, H.head.w * 0.8], C.iron, C.ironTop);
  });
  // Le corps 3 sur 3 : le train d'engrenages dressé sur son bâti (trois roues engrenées, de plus en plus grandes) ; la cuve
  // réparée, pleine d'une eau sombre et immobile.
  add(0, 2 / 3, (b) => {
    const G = GEARS;
    const g = yardY(6, G.z);
    // Le bâti : une semelle de fer au sol, un poteau derrière chaque roue, jusqu'à son axe.
    b.box({ x: 6.2, y: g - 0.1, z: G.z - 0.45 }, [8.4, 0.3, 0.6], C.iron, C.ironTop);
    for (const w of G.wheels) b.box({ x: w.x, y: g, z: G.z - 0.4 }, [0.32, w.y + 0.15, 0.3], C.iron, C.ironTop);
    G.wheels.forEach((w, i) => gearWheel(b, { x: w.x, y: g + w.y, z: G.z + (i % 2) * 0.02, yaw: 0, pitch: 0 }, w.r, w.teeth, C.iron, C.ironTop, C.rustShade));
    tub(b, true);
  });
  // Le haut : les dernières assises du fourneau jusqu'à 9,5, son gueulard (la bouche sombre) et son collier de fer ; la
  // lanterne de la potence, allumée dès qu'elle est posée (jamais à une réussite). Pas de fumée au gueulard (correction 2).
  add(1, 0, (b) => {
    furnaceCone(b, F.ruin - 0.02, () => F.top, C.hollow);
    furnaceBand(b, F.top - F.collar / 2, C.iron, F.collar);
    gibbetLantern(b);
  });
  // Les abords : la cour dallée ; le dernier tronçon de la rigole et la grille neuve (éteinte jusqu'à la restauration) ; la
  // lanterne du chemin, à l'entrée de la cour côté Fabriques. Les regards neufs et la vanne regarnie sont hors du modèle
  // (`reach`, plus bas).
  add(2, 0, (b) => {
    yard(b);
    lastStretch(b, false);
    const g = GRATE.at;
    grate(b, { x: g.x, y: yardY(g.x, g.z) + 0.02, z: g.z }, GRATE.half, GRATE.yaw, C.iron);
    const p = PATH_LANTERN;
    const y = yardY(p.x, p.z);
    b.box({ x: p.x, y: y - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: y + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

/** La cuve de trempe à huit pans : vide, un pan cassé et couché (`full` faux), ou réparée et pleine d'eau sombre. */
function tub(b: FacetBuilder, full: boolean): void {
  const T = TUB;
  const g = yardY(T.x, T.z);
  const n = 8;
  const at = (k: number, r: number, y: number): P3 => [T.x + r * Math.cos((2 * Math.PI * k) / n + Math.PI / 8), y, T.z + r * Math.sin((2 * Math.PI * k) / n + Math.PI / 8)];
  const broken = full ? -1 : 2;
  for (let k = 0; k < n; k++) {
    if (k === broken) continue;
    const m = (k + 1) % n;
    const y0 = g - 0.3,
      y1 = g + T.h;
    b.quad(at(m, T.rOut, y0), at(k, T.rOut, y0), at(k, T.rOut, y1), at(m, T.rOut, y1), C.stone);
    b.quad(at(k, T.rIn, y0), at(m, T.rIn, y0), at(m, T.rIn, y1), at(k, T.rIn, y1), C.stoneShade);
    b.quad(at(m, T.rOut, y1), at(k, T.rOut, y1), at(k, T.rIn, y1), at(m, T.rIn, y1), C.stoneSun);
  }
  if (full) {
    const ring = Array.from({ length: n }, (_, k) => at(k, T.rIn, g + T.water));
    for (let k = 1; k < n - 1; k++) b.triangle(ring[0], ring[k + 1], ring[k], C.water);
  } else {
    // Le pan cassé, couché devant la cuve, et le fond sec.
    b.box({ x: T.x + 0.2, y: g - 0.05, z: T.z + 1.75, yaw: 0.4 }, [1.0, 0.3, T.rOut - T.rIn + 0.05], C.stoneShade, C.stone);
    const ring = Array.from({ length: n }, (_, k) => at(k, T.rIn, g + 0.05));
    for (let k = 1; k < n - 1; k++) b.triangle(ring[0], ring[k + 1], ring[k], C.stoneShade);
  }
}

/**
 * Le dernier tronçon de la rigole, du bout de celle du lot 1 à la grille du fourneau : deux murets et sa dalle de
 * couverture (comme ./paths4e.ts) ; dans la ruine, ses dalles déplacées, l'une de travers, l'autre couchée à côté.
 */
function lastStretch(b: FacetBuilder, ruin: boolean): void {
  const a = RIGOLE[RIGOLE.length - 1];
  const c = GRATE_IN;
  const len = Math.hypot(c.x - a.x, c.z - a.z);
  const yaw = Math.atan2(c.x - a.x, c.z - a.z);
  const mid = { x: (a.x + c.x) / 2, z: (a.z + c.z) / 2 };
  const y = yardY(mid.x, mid.z) - 0.15;
  const co = Math.cos(yaw),
    si = Math.sin(yaw);
  for (const side of [-1, 1]) {
    const o = side * (LAST.width / 2 - 0.15);
    b.box({ x: mid.x + co * o, y: y - 0.3, z: mid.z - si * o, yaw }, [0.3, LAST.height + 0.3, len], C.stoneShade, C.stone);
  }
  if (!ruin) {
    b.box({ x: mid.x, y: y + LAST.height, z: mid.z, yaw }, [LAST.width + 0.1, LAST.slab, len - 0.1], C.stoneShade, C.stoneSun);
    return;
  }
  // Le fond gris, ouvert ; une dalle de travers sur les murets, l'autre couchée à côté.
  b.box({ x: mid.x, y, z: mid.z, yaw }, [LAST.width - 0.3, 0.12, len], C.coldPit);
  b.box({ x: mid.x - si * 0.6, y: y + LAST.height - 0.05, z: mid.z - co * 0.6, yaw: yaw + 0.3, pitch: 0.1 }, [LAST.width + 0.1, LAST.slab, 1.3], C.stoneShade, C.stoneSun);
  b.box({ x: mid.x + co * 1.7 + si * 0.8, y: yardY(mid.x, mid.z) - 0.05, z: mid.z - si * 1.7 + co * 0.8, yaw: yaw - 0.7 }, [LAST.width + 0.1, LAST.slab, 1.3], C.stoneShade, C.stoneSun);
}

// ---------- Hors de l'emprise : la vanne et les regards (`reach`) ----------

/** Le sol du monde sous un point du lieu, à partir du centre au sol `c`. */
const worldAt = (c: Vec3, p: Vec2, lift: number): Vec3 => ({ x: c.x + p.x, y: c.y + localGround(p.x, p.z) + lift, z: c.z + p.z });

/** La vanne et les regards sont-ils neufs (les abords posés) ? */
const regardsNew = (posed: (stage: Stage, row: number) => boolean): boolean => posed(2, 0);

/**
 * Ce que la Forge pose loin de son emprise, le long de la rigole du lot 1 (jusqu'à 40 unités au nord-ouest) : à la prise,
 * le cadre de la vanne (deux piliers de pierre et leur linteau) ; les quatre regards, leur fond froid et leurs trois
 * barreaux, rouillés dans la ruine, de fer neuf avec les abords. Dès la ruine (la vanne fermée et les regards froids sont
 * là avant toute partie) ; la porte de la vanne et la lave sont de la restauration (`RESTORATION`).
 */
function reach(c: Vec3, posed: (stage: Stage, row: number) => boolean): Facets {
  const b = new FacetBuilder();
  const V = VANNE;
  const { at, yaw } = alongRigole(V.s);
  const co = Math.cos(yaw),
    si = Math.sin(yaw);
  for (const side of [-1, 1]) {
    const p = worldAt(c, { x: at.x + co * side * V.half, z: at.z - si * side * V.half }, 0);
    b.box({ x: p.x, y: p.y - 0.4, z: p.z, yaw }, [V.pillar, V.h + 0.4, V.pillar], C.stoneShade, C.stone);
  }
  const top = worldAt(c, at, V.h);
  b.box({ x: top.x, y: top.y, z: top.z, yaw }, [2 * V.half + V.pillar + 0.2, 0.42, V.pillar + 0.1], C.stoneShade, C.stoneSun);
  const bars = regardsNew(posed) ? C.iron : C.rustGear;
  for (const s of REGARDS.at) {
    const r = alongRigole(s);
    grate(b, worldAt(c, r.at, RIGOLE_TOP + 0.02), REGARDS.half, r.yaw, bars);
  }
  return b.build();
}

// ---------- La restauration ----------

/**
 * La restauration (intention, § 6 ; avis dys, 1 à 5) : une seule fois, après la dernière partie, le bilan fermé ; quatre
 * secondes : la porte de la vanne se lève (0,8 s, la prise s'emplit de lave), les quatre regards s'allument d'amont en
 * aval (0,5 s chacun), puis la grille du fourneau (0,5 s), puis la gueule rougeoie, par un fondu en quatre teintes (0,7 s).
 * Chaque lueur monte une fois et reste ; rien ne s'éteint, rien ne pulse. `steps` : l'instant où chaque lueur s'allume.
 */
const RESTORATION = { seconds: 4, vanne: 0.8, regards: [1.3, 1.8, 2.3, 2.8], grate: 3.3, fade: [3.475, 3.65, 3.825, 4] } as const;

/**
 * Ce qui change avec la restauration, dans le monde (`c` : le centre du lieu au sol), `t` secondes après son début (0 : la
 * vanne fermée, rien d'allumé, l'état d'avant ; `Infinity` : restaurée) : la porte de la vanne, levée de sa part ; la lave
 * à la prise et dans chaque regard allumé, sous la grille ; la gueule, de la teinte de son fondu. Sans ombre (la vue),
 * sans lumière ponctuelle : rien n'éclaire autour.
 */
function restorationFacets(c: Vec3, t: number): Facets {
  const b = new FacetBuilder();
  const R = RESTORATION;
  const V = VANNE;
  const lift = Math.max(0, Math.min(1, t / R.vanne));
  const v = alongRigole(V.s);
  const door = worldAt(c, v.at, -0.15 + lift * V.door.lift);
  b.box({ x: door.x, y: door.y, z: door.z, yaw: v.yaw }, [V.door.w, V.door.h, 0.16], C.iron, C.ironTop);
  if (t >= R.vanne) {
    // La prise, ouverte au lot 1 : le premier pavé de la rigole, de la prise à la vanne.
    const p = alongRigole(V.s / 2);
    lavaPlate(b, worldAt(c, p.at, 0.04 - 0.15), V.s / 2 - 0.05, p.yaw, C.lava);
  }
  R.regards.forEach((at, i) => {
    if (t < at) return;
    const r = alongRigole(REGARDS.at[i]);
    lavaPlate(b, worldAt(c, r.at, RIGOLE_TOP + 0.02), REGARDS.half, r.yaw, C.lava);
  });
  if (t >= R.grate) {
    const g = GRATE.at;
    lavaPlate(b, { x: c.x + g.x, y: c.y + yardY(g.x, g.z) + 0.02, z: c.z + g.z }, GRATE.half, GRATE.yaw, C.lava);
  }
  const fade = R.fade.filter((at) => t >= at).length;
  if (fade > 0) {
    const l = new FacetBuilder();
    mouthGlow(l, fade >= R.fade.length ? FORGE_GLOW : FORGE_GLOW_FADE[fade - 1]);
    const f = l.build();
    for (let i = 0; i < f.positions.length; i += 3) {
      f.positions[i] += c.x;
      f.positions[i + 1] += c.y;
      f.positions[i + 2] += c.z;
    }
    b.append(f);
  }
  return b.build();
}

// ---------- Les traces ----------

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  const f = l.build();
  for (let i = 0; i < f.positions.length; i += 3) {
    f.positions[i] += c.x;
    f.positions[i + 1] += c.y;
    f.positions[i + 2] += c.z;
  }
  b.append(f);
}

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 5) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  powers: { x: -5.5, z: -2.0 },
  roots: { x: -6.0, z: 2.6 },
  notation: { x: 6.85, z: 1.3 },
  subtracting: { x: 5.3, z: -0.1 },
  volumes: { x: -6.6, z: 6.4 },
} as const;

/**
 * Le grand soufflet de cuir sur son chevalet de bois, contre le flanc ouest du fourneau (Étincelles) : deux planches en
 * coin, le cuir entre elles, la buse vers le fourneau ; deux pieds droits.
 */
function bellows(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.powers;
    const g = yardY(x, z);
    for (const dz of [-0.5, 0.5]) l.box({ x, y: g, z: z + dz }, [0.9, 0.55, 0.14], C.newShade, C.newWood);
    l.box({ x, y: g + 0.55, z }, [1.0, 0.14, 1.6], C.newShade, C.newWood);
    l.prism({ x, y: g + 0.69, z, yaw: Math.PI / 2 }, 0.75, 0.62, 0.3, 4, C.leather, C.leather);
    l.box({ x, y: g + 0.99, z, pitch: 0 }, [0.9, 0.06, 1.5], C.newShade, C.newWood);
    l.beam({ x: x + 0.3, y: g + 0.82, z }, { x: x + 1.05, y: g + 0.8, z }, 0.14, C.iron);
  });
}

/** Deux marteaux à main, debout côte à côte dans un billot, le manche en haut, près de l'enclume (Enclume). */
function handHammers(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.roots;
    const g = yardY(x, z);
    l.prism({ x, y: g - 0.1, z }, 0.42, 0.4, 0.65, 7, C.woodShade, C.wood);
    for (const dx of [-0.16, 0.16]) {
      l.box({ x: x + dx, y: g + 0.45, z }, [0.24, 0.16, 0.14], C.iron, C.ironTop);
      l.box({ x: x + dx, y: g + 0.61, z }, [0.06, 0.62, 0.06], C.newShade, C.newWood);
    }
  });
}

/** Un seau de bois cerclé de fer, posé sur le rebord ouest de la cuve (Trempe). */
function bucket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.notation;
    const y = yardY(TUB.x, TUB.z) + TUB.h;
    l.prism({ x, y, z }, 0.2, 0.25, 0.45, 7, C.newShade, C.water);
    l.band({ x, y: y + 0.28, z }, 0.235, 0.05, 7, C.iron);
  });
}

/** Un bac de bois plein de charbon, la pelle plantée droite dedans, au pied du fourneau, côté est, loin de la gueule (Fourneau). */
function coalTub(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.subtracting;
    const g = yardY(x, z);
    l.box({ x, y: g, z, yaw: 0.3 }, [1.0, 0.5, 0.7], C.newShade, C.coal);
    l.prism({ x: x + 0.1, y: g + 0.45, z, yaw: 0.4 }, 0.38, 0.12, 0.2, 5, C.coal, C.coal);
    l.box({ x: x - 0.2, y: g + 0.45, z, yaw: 0.3 }, [0.28, 0.32, 0.05], C.iron);
    l.box({ x: x - 0.2, y: g + 0.77, z, yaw: 0.3 }, [0.06, 1.0, 0.06], C.newShade, C.newWood);
  });
}

/**
 * Une brouette de bois cerclée de fer, sa caisse pleine de minerai sombre en vrac (jamais un tas en cône : correction du
 * directeur artistique), au bord sud-ouest de la cour (Aires et volumes) : la caisse, la roue, les deux brancards, deux pieds.
 */
function wheelbarrow(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.volumes;
    const g = yardY(x, z);
    const yaw = 0.5;
    drawPosed(l, { x, y: g, z, yaw }, (q) => {
      q.box({ x: 0, y: 0.45, z: 0 }, [0.95, 0.42, 1.2], C.newShade, C.ore);
      q.band({ x: 0, y: 0.6, z: 0, yaw: Math.PI / 4 }, 0.86, 0.06, 4, C.iron);
      for (const [dx, dz, r] of [
        [-0.2, -0.25, 0.22],
        [0.18, 0.1, 0.2],
        [-0.05, 0.38, 0.18],
      ] as const)
        q.box({ x: dx, y: 0.84, z: dz, yaw: dx * 3 }, [r * 1.6, r, r * 1.3], C.ore, C.ore);
      q.drum({ x: 0, y: 0.32, z: -0.85, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.3, 0.1, 6, C.newShade, C.newWood);
      for (const s of [-1, 1]) {
        q.beam({ x: s * 0.4, y: 0.55, z: -0.6 }, { x: s * 0.36, y: 0.6, z: 1.35 }, 0.07, C.newShade);
        q.box({ x: s * 0.36, y: 0, z: 0.55 }, [0.07, 0.45, 0.07], C.newShade);
      }
    });
  });
}

/**
 * Les cinq traces, une par mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les abords) ;
 * des objets de la forge, jamais la notion.
 */
const TRACES = {
  powers: { at: TRACE_SPOTS.powers, lift: 1, stage: 0, row: 0, draw: bellows },
  'square-roots': { at: TRACE_SPOTS.roots, lift: 1, stage: 0, row: 1 / 3, draw: handHammers },
  'scientific-notation': { at: TRACE_SPOTS.notation, lift: 1, stage: 0, row: 2 / 3, draw: bucket },
  subtracting: { at: TRACE_SPOTS.subtracting, lift: 1, stage: 1, row: 0, draw: coalTub },
  volumes: { at: TRACE_SPOTS.volumes, lift: 1, stage: 2, row: 0, draw: wheelbarrow },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 8) : vers l'est, un peu au nord, vers l'Étalon et l'usine ;
 * le volcan, la cuvette et la rigole derrière elle : aucune lave dans le cadre. La caméra, reculée de quelque 13 unités,
 * se tient au sud de la potence, dans le vide de la cour, sans rien devant elle qui la ferait monter (au cap est-sud-est
 * de l'intention, elle tombait dans le fourneau et montait au-dessus de l'appentis). Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = Math.atan2(-Math.cos((12 * Math.PI) / 180), Math.sin((12 * Math.PI) / 180));

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la chaudronnière). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur le plancher de l'appentis, devant lui, à l'ouest. */
const SCENE_SPOT = { dx: 6.4, dz: 5.6, half: [2.6, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la chaudronnière au milieu de la scène. */
const SCENE_HALF = 2.1;

/**
 * La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme, comme questionScene.ts,
 * `sceneSpot`) : le dessus du plancher de l'appentis.
 */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return yardY(SCENE_SPOT.dx, SCENE_SPOT.dz) + SHED_FLOOR.rise - top;
})();

/** La chaudronnière en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de cuir, chemise grise. */
function smith(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.24, 0.42, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche des lingots sur ses tréteaux : la hauteur de la planche, à l'échelle 1 ; un lingot choisi se soulève d'un cran. */
const BOARD = { height: 0.5, lift: 0.3, ingot: 0.22 } as const;

/** Un lingot de fer, rectangulaire (jamais confondu avec une trace), posé à plat : seize triangles. */
function ingot(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw: Math.PI / 4 }, 0.36 * s, 0.3 * s, BOARD.ingot * s, 4, C.ingot, C.ingotTop);
}

export const FORGE: PlaceArt = {
  role: 'La chaudronnière',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3+1+1) et se montre dès que sa
  // mission est réussie et que sa partie est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse (intention, § 8) : la cour est plate, rien ne la cache.
    pitch: (15 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : le plancher de l'appentis, l'établi, la bigorne et les tôles debout sont au lieu ; les abords
  // (./forgeSurroundings.ts) ajoutent une pile de tôles. Il reste la chaudronnière en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) smith(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.ingot, half: 0.36 },
    // La caméra de la scénette regarde en biais (`site.start`) : la planche se tourne avec elle, sous la rangée.
    facing: true,
    // Une planche sur deux tréteaux, sous la rangée des lingots.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.5 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.45 * s], C.woodShade);
      }
    },
    // Un lingot posé sur la planche ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      ingot(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : le plancher seul, rien de l'item ; les lingots portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, face au fourneau.
  exit: { x: DOOR_AT.x - 1.2, z: DOOR_AT.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
  reach,
  restoration: { seconds: RESTORATION.seconds, draw: restorationFacets },
};

/** Le plan de la Forge, pour les tests et ses abords : la cour, le fourneau, ses machines, la rigole, la caméra. */
export const FORGE_LAYOUT = {
  yard: YARD,
  yardY,
  furnace: FURNACE,
  furnaceR,
  furnaceFoot: FY,
  mouth: MOUTH,
  hammer: HAMMER,
  anvil: ANVIL,
  gears: GEARS,
  tub: TUB,
  gibbet: GIBBET,
  shed: SHED,
  shedFloor: SHED_FLOOR,
  shedLantern: SHED_LANTERN,
  pathLantern: PATH_LANTERN,
  grate: GRATE,
  regards: REGARDS,
  vanne: VANNE,
  rigole: RIGOLE,
  rigoleLength: RIGOLE_LENGTH,
  alongRigole,
  restoration: RESTORATION,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  heightAtCenter: H0,
  /** La tôle du toit de l'appentis, flanc et dessus (ses abords en empilent). */
  sheet: { shade: C.sheetShade, top: C.sheet },
} as const;
