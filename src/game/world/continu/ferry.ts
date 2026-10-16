// La Gare maritime (GD-20, point 8, lot L9b, directeur artistique) : sur un îlot bas au large de la côte ouest (un
// rocher modelé dans le lieu : le terrain s'arrête avant lui), un quai de pierre sur ses faces nord et ouest, tourné vers
// le large ; le long du quai nord, un long auvent bas sur de minces colonnes de fer, son bord droit (ni lambrequin ni
// dents) ; à son bout est, un pavillon de pierre au toit d'ardoise en croupe. L'ensemble est horizontal. On y vient par
// la jetée de planches (paths.ts), qui accoste au sud-est. Avant : la ruine démontée (les colonnes debout sans
// couverture, deux couchées, les tôles de l'auvent au sol, le pavillon sans toit, le bord du quai ébréché, aucune
// bitte), délavée, jamais sombre. Le corps : le quai réparé, les murs et le toit du pavillon. Le haut : l'auvent sur ses
// colonnes. Les abords : les bittes, le chemin de la porte (ils portent les traces). L'habitant, « le chef de gare »,
// immobile ; les réponses, des malles bombées pareilles, de bois cerclé, le couvercle entrouvert : la malle de la bonne
// réponse se ferme, sa sangle bouclée. Rien d'écrit : ni horloge, ni tableau des départs, ni billet. Code pur
// (placeArt.ts).
import { FacetBuilder, type Facets, type Placement } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import type { Reaction } from './questionScene';
import { COLORS_6E } from './plan6e';

/** Le large sous l'îlot : le pied du rocher, sous l'eau. */
const SEABED = -2.4;

const C = {
  // Le rocher de l'îlot (la roche du monde) et son dessus, plus clair ; l'herbe rase sur son dos.
  rock: COLORS_6E.rock,
  rockTop: 0xab9576,
  rockDark: 0x8a7458,
  grass: COLORS_6E.grass,
  // Le quai : la pierre du pavillon (#CFC6B2), son ombre, ses joints.
  stone: 0xcfc6b2,
  stoneShade: 0xb3aa95,
  // Les colonnes de fer (#2F3E48), l'auvent de tôle peinte Vert île (#438B82) et son ombre.
  iron: 0x2f3e48,
  sheet: 0x438b82,
  sheetShade: 0x37756d,
  // Le pavillon : sa pierre, son ardoise (#4D6A82), sa porte, ses fenêtres (une ombre brune, jamais noire).
  slate: 0x4d6a82,
  slateShade: 0x415a6e,
  door: 0x7a5538,
  recess: 0x5e4e3c,
  path: COLORS_6E.path,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  // La ruine : délavée, d'un ton moyen, jamais sombre.
  worn: 0xbdb5a3,
  wornTop: 0xb0a896,
  wornIron: 0x8c969b,
  wornSheet: 0x8aaba5,
  // Les malles (#8A5A36), leurs cercles de fer (#2F3E48), leur sangle de cuir (#7A4E2E).
  trunk: 0x8a5a36,
  trunkTop: 0x9c6a42,
  hoop: 0x2f3e48,
  strap: 0x7a4e2e,
  // Le dedans d'une malle ouverte : un brun très sombre, jamais noir.
  inside: 0x3f2c1e,
  // Le chef de gare : veste Sable clair (#E3C9A0), pantalon Nuit océan (#142B38), casquette à bandeau Bleu lagon
  // (#178078), porte-voix de cuivre.
  jacket: 0xe3c9a0,
  jacketShade: 0xccb187,
  night: 0x142b38,
  band: 0x178078,
  head: 0xe3c08a,
  copper: 0xc07a3e,
  // Le bac : sa coque blanche cassée, son liston Bleu lagon, sa cabine.
  hull: 0xe9e1cf,
  hullShade: 0xd2c9b4,
  rail: 0x178078,
} as const;

/** Le contour de l'îlot, depuis son centre : son rayon tous les 36°, d'est en est par le sud (jamais au-delà de `FERRY_ISLET`). */
const ISLET_RADII = [7.3, 6.9, 7.2, 6.8, 7.3, 7.1, 6.9, 7.4, 7.0, 7.2] as const;

/** Le quai : le long de la face nord (de x0 à x1, de son bord z0 à z1) et de la face ouest (de son bord x0 à x1, de z0 à z1). */
const FERRY_QUAY = {
  north: { x0: -5.6, x1: 4.6, z0: -6.4, z1: -4.4 },
  west: { x0: -6.6, x1: -4.6, z0: -4.4, z1: 2.6 },
  top: 0.04,
} as const;

/** L'auvent : de x0 à x1 le long du quai nord, de z0 à z1 ; ses colonnes, en deux rangées ; sa hauteur, son épaisseur. */
export const CANOPY = { x0: -5.4, x1: 1.9, z0: -5.9, z1: -2.3, columns: [-5.0, -1.6, 1.6], rows: [-5.5, -2.7], height: 2.5, thick: 0.12, column: 0.09 } as const;

/** Le pavillon, au bout est de l'auvent : son milieu, sa largeur, sa profondeur, ses murs, son toit en croupe. */
const PAVILION = { x: 3.6, z: -3.4, w: 2.8, d: 3.0, wall: 2.1, roof: 1.0, eave: 0.25 } as const;

/** Les bittes d'amarrage, au bord du quai (dans le repère du lieu). */
const BOLLARDS: readonly Vec2[] = [
  { x: -3.8, z: -6.1 },
  { x: 0.6, z: -6.1 },
  { x: -6.3, z: -1.0 },
];

/** Un point du contour de l'îlot, au rayon `k` de sa valeur, à l'angle de rang `i`. */
function isletPoint(i: number, k = 1): Vec2 {
  const a = (2 * Math.PI * i) / ISLET_RADII.length;
  const r = ISLET_RADII[i % ISLET_RADII.length] * k;
  return { x: r * Math.cos(a), z: r * Math.sin(a) };
}

/**
 * Le rocher de l'îlot : son dos plat au niveau des pontons (le 0 du lieu : Kéo y marche), ses flancs qui plongent dans
 * l'eau, élargis sous elle ; un aplat clair sur son dos.
 */
function isletRock(b: FacetBuilder, water: number): void {
  const n = ISLET_RADII.length;
  const top = Array.from({ length: n }, (_, i) => isletPoint(i));
  const mid = Array.from({ length: n }, (_, i) => isletPoint(i, 1.12));
  const low = Array.from({ length: n }, (_, i) => isletPoint(i, 1.4));
  const yMid = water - 0.15;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // Vu de dehors : le tour dans le sens des angles croissants (x vers z) est celui des aiguilles d'une montre vu d'en
    // haut ; les faces se tournent vers l'extérieur.
    b.quad([top[i].x, 0, top[i].z], [top[j].x, 0, top[j].z], [mid[j].x, yMid, mid[j].z], [mid[i].x, yMid, mid[i].z], C.rockDark);
    b.quad([mid[i].x, yMid, mid[i].z], [mid[j].x, yMid, mid[j].z], [low[j].x, SEABED, low[j].z], [low[i].x, SEABED, low[i].z], C.rock);
  }
  // Le dos : un liseré de roche claire au bord, l'herbe rase dedans (au même niveau : Kéo y marche à plat).
  const grass = Array.from({ length: n }, (_, i) => isletPoint(i, 0.82));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    b.quad([grass[i].x, 0, grass[i].z], [grass[j].x, 0, grass[j].z], [top[j].x, 0, top[j].z], [top[i].x, 0, top[i].z], C.rockTop);
  }
  for (let i = 1; i < n - 1; i++) b.triangle([grass[0].x, 0, grass[0].z], [grass[i + 1].x, 0, grass[i + 1].z], [grass[i].x, 0, grass[i].z], C.grass);
}

/** Un pan de quai : sa dalle, d'un bord à l'autre, son dessus à `top`, ses flancs jusque sous l'eau. */
function quayRun(b: FacetBuilder, q: { x0: number; x1: number; z0: number; z1: number }, top: number, water: number, color: number = C.stoneShade, face: number = C.stone): void {
  b.box({ x: (q.x0 + q.x1) / 2, y: water - 0.5, z: (q.z0 + q.z1) / 2 }, [q.x1 - q.x0, top - water + 0.5, q.z1 - q.z0], color, face);
}

/** Une colonne de fer, de son pied à `h`, sa base et son chapiteau. */
function column(b: FacetBuilder, x: number, z: number, h: number, color: number): void {
  b.prism({ x, y: FERRY_QUAY.top, z }, CANOPY.column, CANOPY.column, h - FERRY_QUAY.top, 5, color);
  b.box({ x, y: h - 0.1, z }, [0.26, 0.1, 0.26], color);
}

/** Le toit en croupe du pavillon : quatre pans, le faîtage le long de x, posé sur ses murs. */
function hipRoof(b: FacetBuilder, x: number, y: number, z: number, w: number, d: number, h: number, color: number, side: number): void {
  const [hx, hz] = [w / 2, d / 2];
  const ridge = Math.max(0.1, hx - hz);
  const a: [number, number, number] = [x - hx, y, z + hz],
    bb: [number, number, number] = [x + hx, y, z + hz],
    c: [number, number, number] = [x + hx, y, z - hz],
    dd: [number, number, number] = [x - hx, y, z - hz];
  const r0: [number, number, number] = [x - ridge, y + h, z],
    r1: [number, number, number] = [x + ridge, y + h, z];
  b.quad(a, bb, r1, r0, color);
  b.quad(c, dd, r0, r1, color);
  b.triangle(bb, c, r1, side);
  b.triangle(dd, a, r0, side);
}

/** La Gare maritime : l'îlot, son quai, l'auvent et le pavillon, dans le repère du lieu (le modèle du lieu). */
function model(add: AddPiece, ground: SiteGround, door: Vec2): void {
  const water = ground.water;
  const Q = FERRY_QUAY;
  const P = PAVILION;
  const A = CANOPY;
  // L'îlot, toujours là.
  add('ruine', 0, (b) => isletRock(b, water));
  // Le quai ébréché : sa dalle plus basse, des pierres manquantes au bord ; le quai réparé la remplace.
  add(
    'ruine',
    0,
    (b) => {
      quayRun(b, { ...Q.north, z0: Q.north.z0 + 0.5 }, Q.top - 0.08, water, C.worn, C.wornTop);
      quayRun(b, { ...Q.west, x0: Q.west.x0 + 0.5 }, Q.top - 0.08, water, C.worn, C.wornTop);
      for (const [x, z, yaw] of [
        [-2.4, -6.3, 0.3],
        [-6.4, 0.8, -0.5],
      ] as const)
        b.box({ x, y: water - 0.1, z, yaw }, [0.7, 0.3, 0.5], C.worn, C.wornTop);
    },
    { stage: 0, row: 0 },
  );
  // Le pavillon sans toit : ses murs ébréchés, à mi-hauteur ; les murs neufs les habillent.
  add(
    'ruine',
    0,
    (b) => {
      b.box({ x: P.x, y: water, z: P.z }, [P.w - 0.1, 1.2 - water, P.d - 0.1], C.worn, C.wornTop);
      b.box({ x: P.x + 0.7, y: 1.2, z: P.z + P.d / 2 - 0.25 }, [1.0, 0.4, 0.35], C.worn, C.wornTop);
    },
    { stage: 0, row: 0.34 },
  );
  // Les colonnes debout sans couverture, deux d'entre elles couchées sur le quai ; les colonnes neuves les remplacent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z] of [
        [A.columns[0], A.rows[0]],
        [A.columns[1], A.rows[0]],
        [A.columns[2], A.rows[0]],
        [A.columns[0], A.rows[1]],
      ] as const)
        column(b, x, z, A.height, C.wornIron);
      for (const [x, z, yaw] of [
        [-1.2, -3.4, 0.25],
        [0.6, -1.6, -0.6],
      ] as const)
        b.beam({ x: x - Math.cos(yaw) * 1.2, y: Q.top + 0.08, z: z - Math.sin(yaw) * 1.2 }, { x: x + Math.cos(yaw) * 1.2, y: Q.top + 0.1, z: z + Math.sin(yaw) * 1.2 }, 0.16, C.wornIron);
    },
    { stage: 1, row: 0 },
  );
  // Les tôles de l'auvent tombées au sol, de travers ; l'auvent neuf les relève.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw, w] of [
        [-4.0, -0.8, 0.35, 2.0],
        [-2.3, 1.2, -0.2, 1.7],
        [-3.6, 2.6, 0.9, 1.4],
      ] as const)
        b.box({ x, y: 0.0, z, yaw }, [w, 0.05, 1.1], C.wornSheet);
    },
    { stage: 1, row: 0.5 },
  );
  // Le corps : le quai réparé, ses dalles franches, de la pierre du pavillon ; au sud-est, le débarcadère où accoste la
  // jetée et les dalles qui mènent à la porte du lieu (on y marche : elles sont du quai, pas des abords).
  add(0, 0, (b) => {
    quayRun(b, Q.north, Q.top, water);
    quayRun(b, Q.west, Q.top, water);
    const run = (p: Vec2, q: Vec2) => {
      const len = Math.hypot(q.x - p.x, q.z - p.z);
      b.box({ x: (p.x + q.x) / 2, y: -0.05, z: (p.z + q.z) / 2, yaw: Math.atan2(q.x - p.x, q.z - p.z) }, [1.3, 0.09, len + 0.6], C.stoneShade, C.stone);
    };
    run(FERRY_LANDING, door);
  });
  // Les murs du pavillon, sa porte au sud, deux fenêtres.
  add(0, 0.34, (b) => {
    b.box({ x: P.x, y: water, z: P.z }, [P.w, P.wall - water, P.d], C.stoneShade, C.stone);
    b.box({ x: P.x, y: Q.top, z: P.z + P.d / 2 + 0.03 }, [0.85, 1.5, 0.06], C.door);
    b.plate({ x: P.x - P.w / 2 - 0.01, y: 0.9, z: P.z, yaw: -Math.PI / 2 }, [[-0.32, 0], [0.32, 0], [0.32, 0.7], [-0.32, 0.7]], C.recess);
    b.plate({ x: P.x + P.w / 2 + 0.01, y: 0.9, z: P.z, yaw: Math.PI / 2 }, [[-0.32, 0], [0.32, 0], [0.32, 0.7], [-0.32, 0.7]], C.recess);
  });
  // Le toit d'ardoise en croupe, débordant.
  add(0, 0.67, (b) => hipRoof(b, P.x, P.wall, P.z, P.w + 2 * P.eave, P.d + 2 * P.eave, P.roof, C.slate, C.slateShade));
  // Le haut : les colonnes de fer, en deux rangées.
  add(1, 0, (b) => {
    for (const z of A.rows) for (const x of A.columns) column(b, x, z, A.height, C.iron);
  });
  // L'auvent : une tôle plate, à peine penchée vers le sud, son bord droit ; une poutre de fer sous chaque rangée.
  add(1, 0.5, (b) => {
    const [x, z] = [(A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2];
    for (const zr of A.rows) b.box({ x: (A.columns[0] + A.columns[2]) / 2, y: A.height - 0.12, z: zr }, [A.columns[2] - A.columns[0] + 0.3, 0.12, 0.16], C.iron);
    b.box({ x, y: A.height, z, pitch: 0.04 }, [A.x1 - A.x0, A.thick, A.z1 - A.z0], C.sheetShade, C.sheet);
  });
  // Les abords : les bittes d'amarrage au bord du quai.
  add(2, 0, (b) => {
    for (const p of BOLLARDS) {
      b.prism({ x: p.x, y: Q.top, z: p.z }, 0.2, 0.17, 0.4, 6, C.iron);
      b.prism({ x: p.x, y: Q.top + 0.4, z: p.z }, 0.24, 0.24, 0.07, 6, C.iron);
    }
  });
  // Le chemin de la porte : de la porte du lieu au pied de l'auvent, du sable sur le dos de l'îlot.
  add(2, 0.5, (b) => {
    const to = { x: door.x - 1.4, z: A.z1 + 0.4 };
    const len = Math.hypot(to.x - door.x, to.z - door.z);
    b.box({ x: (door.x + to.x) / 2, y: -0.05, z: (door.z + to.z) / 2, yaw: Math.atan2(to.x - door.x, to.z - door.z) }, [1.2, 0.08, len + 0.4], C.stoneShade, C.path);
  });
}

/** L'accostage de la jetée, au sud-est de l'îlot, depuis son centre (le nœud `lar-5`, plan6e.ts). */
const FERRY_LANDING: Vec2 = { x: 5.2, z: 4.6 };

/** La malle de réponse, à l'échelle 1 : sa largeur, sa hauteur de caisse, sa profondeur, la hauteur de son couvercle bombé. */
const TRUNK = { w: 0.84, h: 0.42, d: 0.56, lid: 0.2, open: 0.55, tipped: -0.35 } as const;

/** Le profil du couvercle bombé (vu de côté, du nord au sud), depuis sa charnière, au nord : un demi-octogone. */
const LID_OUTLINE: readonly (readonly [number, number])[] = [
  [0, 0],
  [TRUNK.d, 0],
  [TRUNK.d - 0.06, TRUNK.lid * 0.7],
  [TRUNK.d * 0.72, TRUNK.lid],
  [TRUNK.d * 0.28, TRUNK.lid],
  [0.06, TRUNK.lid * 0.7],
];

/**
 * Le couvercle d'une malle, à l'échelle `s`, sa charnière (le bord nord du haut de la caisse) en `hinge`, ouvert de
 * `open` (en radians, levé vers le nord) : la tôle bombée, ses deux cercles de fer ; la sangle bouclée quand il est fermé.
 */
function trunkLid(b: FacetBuilder, hinge: Vec3, s: number, open: number): void {
  const T = TRUNK;
  // Le profil se dessine dans le plan z, y du repère (yaw d'un quart de tour), puis bascule autour de la charnière.
  const at: Placement = { x: hinge.x + (T.w / 2) * s, y: hinge.y, z: hinge.z, yaw: -Math.PI / 2, pitch: 0 };
  const lift = (o: readonly (readonly [number, number])[]) => o.map(([u, v]) => [u * s * Math.cos(open) - v * s * Math.sin(open), u * s * Math.sin(open) + v * s * Math.cos(open)] as [number, number]);
  b.extrude(at, lift(LID_OUTLINE), T.w * s, C.trunk, C.trunkTop);
  for (const dx of [0.2, T.w - 0.2]) b.extrude({ ...at, x: hinge.x + (T.w / 2 - dx + 0.03) * s }, lift(LID_OUTLINE.map(([u, v]) => [u, v + 0.012] as const)), 0.06 * s, C.hoop);
  if (open) return;
  // Fermé : la sangle de cuir passe sur le couvercle et descend devant, bouclée (une boucle de fer).
  b.box({ x: hinge.x, y: hinge.y + T.lid * s, z: hinge.z + (T.d / 2) * s }, [0.1 * s, 0.025 * s, T.d * s], C.strap);
  b.box({ x: hinge.x, y: hinge.y - 0.18 * s, z: hinge.z + (T.d + 0.012) * s }, [0.1 * s, 0.2 * s, 0.025 * s], C.strap);
  b.box({ x: hinge.x, y: hinge.y - 0.12 * s, z: hinge.z + (T.d + 0.03) * s }, [0.15 * s, 0.08 * s, 0.02 * s], C.hoop);
}

/**
 * Une malle de réponse, à l'échelle `s`, son pied en `at` : la caisse de bois, ses deux cercles de fer, sa sangle qui pend
 * défaite ; le couvercle entrouvert (`lid`), ou rien (`lid` faux : il arrive avec la réaction). `tilt` : basculée en
 * arrière : sa forme dit qu'elle est choisie. Toutes les mêmes : ni étiquette, ni ruban.
 */
function trunk(b: FacetBuilder, at: Vec3, s: number, tilt = 0, lid = true): void {
  const T = TRUNK;
  const box = (dy: number, size: [number, number, number], color: number, top = color, dz = 0) =>
    b.box({ x: at.x, y: at.y + dy * Math.cos(tilt) * s, z: at.z - dy * Math.sin(tilt) * s + dz * s, pitch: tilt }, [size[0] * s, size[1] * s, size[2] * s], color, top);
  box(0, [T.w, T.h, T.d], C.trunk, C.trunkTop);
  // Le dedans, sombre, sous le couvercle entrouvert (relecture de L9 : le couvercle ne flotte plus) ; le couvercle fermé
  // le recouvre.
  box(T.h, [T.w - 0.08, 0.012, T.d - 0.08], C.inside);
  for (const dx of [-T.w / 2 + 0.2, T.w / 2 - 0.2]) b.box({ x: at.x + dx * s, y: at.y - 0.005, z: at.z, pitch: tilt }, [0.06 * s, (T.h + 0.01) * s, (T.d + 0.02) * s], C.hoop);
  // La sangle défaite pend devant la caisse.
  box(T.h * 0.2, [0.1, T.h * 0.6, 0.02], C.strap, C.strap, T.d / 2 + 0.01);
  if (lid) trunkLid(b, { x: at.x, y: at.y + T.h * Math.cos(tilt) * s, z: at.z - (T.d / 2) * s - T.h * Math.sin(tilt) * s }, s, T.open);
}

/** Le couvercle fermé et la sangle bouclée d'une malle, à l'échelle `s`, sa charnière en 0 (la réaction). */
function closedLid(s: number): Facets {
  const b = new FacetBuilder();
  trunkLid(b, { x: 0, y: 0, z: 0 }, s, 0);
  return b.build();
}

/**
 * Le couvercle qui se rabat sur la caisse d'une malle posée en `at` (la réaction) : il descend de sa place entrouverte
 * (relevé au nord) jusque sur elle, fermé, la sangle bouclée, en un geste court.
 */
function closingLid(at: Vec3, s: number): Reaction {
  const hinge = { x: at.x, y: at.y + TRUNK.h * s, z: at.z - (TRUNK.d / 2) * s };
  return { facets: closedLid(s), from: { ...hinge, y: hinge.y + 0.22 * s, z: hinge.z - 0.12 * s }, to: hinge, arc: 0, stay: true };
}

/** Le chef de gare, immobile, le visage nu (rien n'y est dessiné : ni sourire, ni moue) ; il ne dit rien. */
function chefDeGare(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.14, 0.5, 6, C.night);
  // La veste Sable clair (le haut clair), droite, boutonnée ; son col.
  b.prism({ x: at.x, y: at.y + 0.45, z: at.z }, 0.33, 0.28, 0.5, 10, C.jacket, C.jacketShade);
  b.prism({ x: at.x, y: at.y + 0.93, z: at.z }, 0.19, 0.17, 0.07, 8, C.jacketShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  // La casquette ronde : sa calotte, son bandeau Bleu lagon, sa visière vers la caméra.
  b.prism({ x: at.x, y: at.y + 1.25, z: at.z }, 0.25, 0.25, 0.08, 10, C.band);
  b.prism({ x: at.x, y: at.y + 1.33, z: at.z }, 0.25, 0.27, 0.1, 10, C.night);
  b.box({ x: at.x, y: at.y + 1.25, z: at.z + 0.26 }, [0.32, 0.03, 0.16], C.night);
  // Les bras : le droit le long du corps ; le gauche tient bas le porte-voix de cuivre, son pavillon vers le sol.
  b.beam({ x: at.x - 0.29, y: at.y + 0.88, z: at.z }, { x: at.x - 0.34, y: at.y + 0.46, z: at.z + 0.04 }, 0.14, C.jacket);
  const hand = { x: at.x + 0.36, y: at.y + 0.5, z: at.z + 0.08 };
  b.beam({ x: at.x + 0.29, y: at.y + 0.88, z: at.z }, hand, 0.14, C.jacket);
  b.prism({ x: hand.x, y: hand.y - 0.38, z: hand.z }, 0.11, 0.04, 0.34, 8, C.copper);
}

/** Le sol de la scène : le quai sous l'auvent, sa demi-largeur et sa profondeur. */
const SCENE_FLOOR = { half: 4.6, depth: 2.4 } as const;

/** La scène, depuis le centre du lieu : sous le bord sud de l'auvent, le quai et la mer derrière. */
const SCENE_SPOT = { dx: -1.8, dz: -1.5 } as const;
const SCENE_RISE = 0.06;
const WITNESS_FRONT = 0.5;

/** Où se pose la trace de chaque mission, depuis le centre du lieu ; aucune plus haute que l'auvent. */
export const FERRY_TRACE_SPOTS = {
  'to-be': { x: -4.4, z: 1.4 },
  'have-got': { x: -7.2, z: -2.4 },
  'present-simple': { x: -1.4, z: -8.4 },
  story: { x: -1.8, z: -4.1 },
} as const;

/** Le chariot à bagages, vide (To be) : son plateau, ses deux roues, son timon levé. */
function luggageCart(b: FacetBuilder, g: Vec3): void {
  const yaw = 0.4;
  b.box({ x: g.x, y: g.y + 0.3, z: g.z, yaw }, [1.4, 0.08, 0.8], C.darkWood, C.wood);
  for (const side of [-1, 1]) b.drum({ x: g.x + side * 0.42 * Math.cos(yaw), y: g.y + 0.25, z: g.z - side * 0.42 * Math.sin(yaw), yaw: yaw + Math.PI / 2, pitch: Math.PI / 2 }, 0.25, 0.08, 6, C.iron);
  b.beam({ x: g.x - 0.7 * Math.sin(yaw), y: g.y + 0.34, z: g.z - 0.4 * Math.cos(yaw) }, { x: g.x - 1.1 * Math.sin(yaw), y: g.y + 0.9, z: g.z - 0.95 * Math.cos(yaw) }, 0.06, C.iron);
}

/** La passerelle d'embarquement posée au bord du quai ouest (Have ou has) : son tablier en pente, ses deux mains courantes. */
function gangway(b: FacetBuilder, g: Vec3): void {
  const from = { x: g.x + 1.0, y: g.y + FERRY_QUAY.top, z: g.z },
    to = { x: g.x - 0.9, y: g.y - 0.25, z: g.z };
  b.beam(from, to, 0.08, C.darkWood);
  b.box({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: g.z, yaw: Math.PI / 2, pitch: Math.atan2(from.y - to.y, from.x - to.x) }, [0.9, 0.06, 2.0], C.wood);
  for (const side of [-1, 1]) b.beam({ ...from, y: from.y + 0.6, z: g.z + side * 0.42 }, { ...to, y: to.y + 0.6, z: g.z + side * 0.42 }, 0.05, C.iron);
}

/** Le bac amarré au quai nord (Présent simple) : sa coque, son liston, son pont et sa cabine, sur l'eau. */
function ferryBoat(b: FacetBuilder, g: Vec3): void {
  const y = g.y;
  b.extrude({ x: g.x, y: y - 0.25, z: g.z - 0.9 }, [[-2.3, 0.85], [-2.1, 0.0], [2.0, 0.0], [2.6, 0.85]], 1.8, C.hullShade, C.hull);
  b.box({ x: g.x + 0.15, y: y + 0.55, z: g.z }, [4.9, 0.1, 1.85], C.rail, C.wood);
  b.box({ x: g.x - 0.5, y: y + 0.65, z: g.z }, [1.6, 0.75, 1.2], C.hullShade, C.hull);
  b.box({ x: g.x - 0.5, y: y + 1.4, z: g.z }, [1.8, 0.08, 1.4], C.slate);
}

/** Le long banc d'attente sous l'auvent (Story time) : son assise, son dossier, ses pieds de fer. */
function bench(b: FacetBuilder, g: Vec3): void {
  b.box({ x: g.x, y: g.y + 0.42, z: g.z }, [3.0, 0.08, 0.46], C.darkWood, C.wood);
  b.box({ x: g.x, y: g.y + 0.5, z: g.z - 0.22 }, [3.0, 0.42, 0.06], C.wood);
  for (const dx of [-1.3, 1.3]) b.box({ x: g.x + dx, y: g.y, z: g.z }, [0.08, 0.42, 0.4], C.iron);
}

export const FERRY: PlaceArt = {
  role: 'Le chef de gare',
  model,
  traceStage: 2,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [4.4, 1.2], fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.0, depth: 0.3 },
    // Plongée de 27° (18° ailleurs au large) : l'horizon passe au-dessus du cadre, et avec lui la rangée des mâts des
    // Balises ; deux au plus restent dans l'image, sur tous les écrans (relecture de L9, un test).
    pitch: (27 * Math.PI) / 180,
  },
  // Le sol de la scène : les dalles du quai, sur toute sa largeur, jusque sous l'eau ; le chef de gare.
  decor(b, floor, at, sphere) {
    const F = SCENE_FLOOR;
    const depth = 1.2;
    b.box({ x: floor.x, y: floor.y - depth, z: floor.z }, [2 * F.half, depth, F.depth], C.stoneShade, C.stone);
    for (const dx of [-F.half / 2, F.half / 2]) b.box({ x: floor.x + dx, y: floor.y, z: floor.z }, [0.05, 0.01, F.depth], C.stoneShade);
    chefDeGare(b, at, sphere);
  },
  answer: {
    size: { height: TRUNK.h + TRUNK.lid + 0.25, half: TRUNK.w / 2 + 0.04 },
    // Le quai sous les malles : une bande de dalles, jusqu'au sol.
    base(b, mid, y, z, span, s, ground) {
      const low = Math.min(ground, y) - 0.2;
      b.box({ x: mid, y: low, z }, [span, y - low, 1.0 * s], C.stoneShade, C.stone);
    },
    object(b, at, s, _i, _count, picked, marked) {
      trunk(b, at, s, picked ? TRUNK.tipped : 0, !marked);
    },
    // Après une bonne réponse, la malle touchée se ferme : le couvercle se rabat, la sangle bouclée ; elle reste fermée
    // jusqu'à l'item suivant (d'un coup avec « Réduire les animations »).
    mark: closingLid,
    replaces: true,
  },
  rest() {},
  // Story time (le C) : une seule malle, au milieu, à la place de celle du milieu en R ; après une bonne réponse
  // seulement, elle se ferme (le même geste qu'en R). Pendant l'écoute, rien ne bouge. Rien ne la borde.
  column(b, o, done) {
    const at = { x: o.x, y: o.y + SCENE_RISE + 0.02, z: o.z + WITNESS_FRONT };
    trunk(b, at, 1, 0, !done);
    return done ? closingLid(at, 1) : null;
  },
  traces: {
    'to-be': { at: FERRY_TRACE_SPOTS['to-be'], lift: 0.5, draw: (b, c) => luggageCart(b, { x: c.x + FERRY_TRACE_SPOTS['to-be'].x, y: c.y, z: c.z + FERRY_TRACE_SPOTS['to-be'].z }) },
    'have-got': { at: FERRY_TRACE_SPOTS['have-got'], lift: 0.4, draw: (b, c) => gangway(b, { x: c.x + FERRY_TRACE_SPOTS['have-got'].x, y: c.y, z: c.z + FERRY_TRACE_SPOTS['have-got'].z }) },
    'present-simple': { at: FERRY_TRACE_SPOTS['present-simple'], lift: 0.6, draw: (b, c) => ferryBoat(b, { x: c.x + FERRY_TRACE_SPOTS['present-simple'].x, y: c.y - 0.45, z: c.z + FERRY_TRACE_SPOTS['present-simple'].z }) },
    story: { at: FERRY_TRACE_SPOTS.story, lift: 0.6, draw: (b, c) => bench(b, { x: c.x + FERRY_TRACE_SPOTS.story.x, y: c.y + FERRY_QUAY.top, z: c.z + FERRY_TRACE_SPOTS.story.z }) },
  },
  // Kéo au retour : à l'est de la porte, sur le dos de l'îlot, hors du chemin.
  exit: { x: 2.8, z: 2.6 },
};

/** Le rayon le plus long du dos de l'îlot : jamais au-delà du disque que les chemins et la mer réservent (`FERRY_ISLET`). */
export const ISLET_REACH = Math.max(...ISLET_RADII);
