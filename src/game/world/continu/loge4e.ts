// La Loge (lot 3 du monde ouvert du 4e, le Bastion, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-bastion-v1` et corrections 16 à 19) : « le théâtre des ouvriers, au bord de la baie : après le
// travail, on venait y écouter des histoires ». On y entre par les coulisses. Le dernier lieu fini du Bastion, sur le
// gabarit du Chariot (./chariot4e.ts : 2 + 1 + 1 parties). Une haute cage de scène de brique, ouverte au nord par la
// grande porte des décors ; dedans, le mur des contrepoids à l'ouest et leurs deux rails de fer debout, la galerie sur
// ses consoles et ses deux tambours, les cintres tout en haut ; au sud, le mur du cadre et sa grande arche, le rideau
// rouge vin posé ouvert, et par l'arche la baie. Dehors, contre le mur est, l'appentis du costumier, sa table de coupe,
// ses rouleaux de toile unie et sa lanterne. Le cœur, sans figure : ni affiche, ni masque, ni visage, ni décor peint, ni
// costume pendu ; rien qui montre l'anglais ; aucun orange. Le toit restauré est un pan bas presque plat de tôle rouge
// sombre, son faîte à 9,3 (10,5 au plus) : la grue du Gabarit reste dégagée de tout son tiers haut depuis le quai de la Crique.
//
// La cage est posée au sud de sa cour des décors, assez loin de la porte (au bout de `bas-3`) pour que la caméra qui suit,
// tournée de tous côtés autour de Kéo, reste toujours hors d'elle. La ruine (intention, « La ruine ») : le mur du cadre
// debout, haut, percé de son arche ouverte en haut ; le mur des contrepoids à l'ouest ; un mur bas à l'est, plus haut à
// l'angle du cadre ; au nord, les deux piliers courts de la porte des décors ; plus de toit ; le plancher gris entier, un
// peu disjoint ; les rails rouillés et le chariot des contrepoids couché ; les consoles de la galerie, ses planches à plat
// le long du mur ; une poutre en travers tout en haut, une seconde tombée en biais ; le tambour couché sur le plancher ;
// le rideau tombé en un tas dans l'arche. Le signe de l'absence du 4e, sur la face intérieure du pilier gauche de la
// porte des décors : la ferrure vide à deux chevilles nues (le gong est sur le Rafiot), la même avant et après.
//
// Les parties : aujourd'hui quatre missions (le corps en deux, le haut, les abords), cinq à la bascule de 2027 (le corps
// en trois). Le corps est dessiné en trois groupes : le bas (`row` 0), le milieu (`row` 0,4), le haut du corps (`row`
// 0,8) ; chaque groupe tombe dans une seule partie, en moitiés comme en tiers. Une trace par mission, avec sa partie ; celle
// de 2027 (le cornet, au milieu) est modelée, sa place gardée dans le budget, jamais posée avant sa mission. Rien à lire,
// rien de croisé, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { inWorld, lantern, localGround4e, quadOut, sheet, wallRun } from './place4eKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Loge : la brique et le chaperon de pierre grise (`COLORS_4E`, comme la Manufacture) ; la rouille de
 * la ruine seulement ; le fer restauré bruni sombre ; la tôle rouge sombre du toit et de l'appentis ; le bois gris du
 * plancher, de la galerie et des cintres ; le rideau rouge vin `#6E2A2C`, sans frange, son revers un cran plus sombre ;
 * la toile unie des rouleaux, des sacs et de la toile de fond ; le carton gris chaud des boîtes à chapeau. Aucun orange,
 * ni cuivre, ni terre cuite.
 */
const C = {
  brick: COLORS_4E.brickShade,
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  rust: COLORS_4E.rust,
  rustShade: COLORS_4E.rustShade,
  rustDull: 0x6a483e,
  rustDullTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  roof: 0x74403a,
  roofUnder: 0x5e3a34,
  floor: 0x8e8a84,
  floorJoint: 0x6e6a64,
  boards: 0x9a948c,
  boardsJoint: 0x7e7870,
  grey: 0x8a8278,
  greyShade: 0x726a62,
  curtain: 0x6e2a2c,
  curtainBack: 0x5a2224,
  cloth: 0xd2c8b4,
  clothShade: 0xb8ae9a,
  clothBlue: 0x9aa4a8,
  clothBrown: 0x8a7a6a,
  sack: 0xc4b89e,
  sackShade: 0xa89c84,
  box: 0xa89c8e,
  boxShade: 0x948a7e,
  paving: 0xb0a598,
  joint: 0x8a8078,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  // Le costumier, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise.
  boots: 0x55595a,
  apron: 0x5e5a66,
  shirt: 0x9a9286,
  head: 0xd9a47c,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'loge')!.center;

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/** Le pas de la porte, au bout de son chemin (`bas-3`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'loge')!.at);

/**
 * La cage de scène (11 sur 6,2), au sud de la cour des décors : ses murs (sur leur axe), leur épaisseur ; le haut des murs
 * restaurés au nord (`north`) et au sud (`south`, le mur du cadre), les murs est et ouest en pente de l'un à l'autre ; les
 * trois bandes du corps (le bas jusqu'à `low`, le milieu jusqu'à `mid`, le haut du corps jusqu'au haut) ; le toit, un pan
 * de tôle presque plat posé sur eux, son débord, son épaisseur ; le faîte : 10,5 au plus (sous la tour du Gabarit), et
 * baissé à 9,3 pour que, depuis le quai de la Crique, la grue du Gabarit dépasse la cage de tout son tiers haut (la cage
 * est presque dans l'axe, devant elle : à 10,5, la ligne du regard vers les deux tiers du poteau passait sous son toit).
 */
const CAGE = { x0: -5.5, x1: 5.5, z0: 2.5, z1: 8.7, wall: 0.45, north: 8.6, south: 9.05, low: 2.4, mid: 5.4, over: 0.3, roof: 0.1, ridge: 9.3 } as const;

/** Le dessus du plancher de scène, au-dessus du pied du lieu. */
const FLOOR = 0.35;

/** La grande porte des décors, au milieu du mur nord : sa demi-largeur, sa hauteur (le haut du milieu des murs). */
const DOOR = { half: 2.0, top: CAGE.mid } as const;

/** La grande arche du cadre de scène, au milieu du mur sud : sa demi-largeur, la naissance et le haut de son cintre. */
const ARCH = { half: 3.2, spring: 4.4, crown: 6.0 } as const;

/** Le mur bas de l'est, dans la ruine : il se relève à l'angle du cadre, à partir de `corner`, jusqu'à `cornerTop`. */
const EAST_RUIN = { top0: 1.6, top1: 2.2, corner: 7.3, cornerTop: 6.6 } as const;

/** Les deux rails des contrepoids, debout sur la face intérieure du mur ouest : leur place en travers, leur haut. */
const RAILS = { z: [5.0, 5.8], top: 7.0 } as const;

/** La galerie, le long du mur ouest : sa largeur, sa hauteur, d'où à où ; ses consoles ; ses deux tambours. */
const GALLERY = { wide: 1.0, y: 4.9, z0: 3.3, z1: 7.8, consoles: [3.7, 4.9, 6.3, 7.5], drums: [4.2, 6.9], drumR: 0.36 } as const;

/** Les cintres : trois poutres en travers, tout en haut, leur hauteur ; une poulie sur chacune, au-dessus de la galerie. */
const FLIES = { y: 7.7, z: [3.7, 5.6, 7.5], pulley: -4.3 } as const;

/** Le rideau, posé ouvert en deux pans contre le mur du cadre, de part et d'autre de l'arche : sa largeur repliée, ses plis. */
const CURTAIN = { gathered: 1.1, folds: 4, depth: 0.16, z: CAGE.z1 - CAGE.wall / 2 - 0.16 } as const;

/**
 * L'appentis du costumier, dehors, contre le mur est : de `x0` à `x1`, de `z0` (ouvert au nord) à `z1` ; son toit de tôle
 * à un pan, haut à l'ouest (`hi`, sur son poteau), bas sur le mur est (`lo`).
 */
const LEANTO = { x0: 6.4, x1: 9.4, z0: 3.3, z1: 6.7, hi: 2.9, lo: 2.3, wall: 0.36 } as const;

/** La table de coupe, le long du mur est de l'appentis : son milieu, sa taille ; les trois rouleaux de toile debout. */
const TABLE = { x: 8.6, z: 4.9, size: [0.8, 0.85, 2.2] as P3 } as const;
const ROLLS = [
  { x: 9.0, z: 6.3, color: C.cloth },
  { x: 8.6, z: 6.35, color: C.clothBlue },
  { x: 8.8, z: 5.95, color: C.clothBrown },
] as const;

/** La lanterne du costumier (la seule allumée de la ruine), à son poteau ; celle de la porte (le haut) ; celle du chemin (les abords). */
const LANTERN_TAILOR = { x: LEANTO.x0 + 0.42, z: LEANTO.z0 + 0.12, y: 2.4 } as const;
const LANTERN_DOOR = { x: 4.7, z: CAGE.z0 - CAGE.wall / 2 - 0.22, y: 3.2 } as const;
const PATH_LANTERN = { x: -1.3, z: -10.3, h: 1.35 } as const;

/** La cour des décors, au nord de la cage (dans le sens inverse des aiguilles d'une montre vu d'en haut). */
const YARD: readonly Vec2[] = [
  { x: -5.2, z: 2.0 },
  { x: 5.2, z: 2.0 },
  { x: 5.2, z: -5.8 },
  { x: -5.2, z: -5.8 },
];

/** La salle en plein air, au sud : la terrasse de pierre, ses deux marches jusqu'au plancher, ses trois rangs de bancs. */
const HOUSE = { x: 4.2, z0: CAGE.z1 + CAGE.wall / 2 + 0.02, z1: 11.6, rows: [10.0, 10.6, 11.2], bench: 2.4 } as const;

/**
 * Le plan du sol, ajusté sous la cage, l'appentis et la cour (aux moindres carrés), relevé juste assez pour ne jamais
 * passer sous le sol.
 */
const PLANE = (() => {
  const pts: [number, number, number][] = [];
  for (let x = -6; x <= 9.5 + 1e-6; x += 0.5) for (let z = -6; z <= 9 + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
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

/** Le dessus du plan du sol en un point du repère. */
const planeY = (x: number, z: number): number => PLANE.a + PLANE.b * x + PLANE.c * z;

/** Le pied du lieu : le plan sous le milieu de la cage ; toutes les hauteurs de la cage partent de lui. */
const G = planeY(0, (CAGE.z0 + CAGE.z1) / 2);

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » : au nord de la porte, elle regarde vers le sud, à travers la cage (intention, « Le
 * chemin et la vue d'arrivée ») : la grande porte des décors, dedans les rails, la galerie et les cintres ; au fond, l'arche
 * et le dos du rideau, la baie ; l'appentis du costumier et sa lanterne à gauche. Elle regarde vers −(sin cap, cos cap).
 */
const DOOR_VIEW = Math.PI;

/** La vue d'arrivée (`doorFrame`) : plus basse et plus reculée que la caméra qui suit, la cage entière et son toit dans le cadre. */
const DOOR_FRAME = { height: -3, back: 2.0 } as const;

/**
 * Le point du nom sur la Carte et au-dessus du lieu : au-dessus du mur ouest, celui qui reste debout dans la ruine, jamais
 * dans l'arche ni sur le rideau. Au milieu de la cage, il tombait, vu de dos dans la ruine (sans toit), au milieu de
 * l'arche, sur la scène et le rideau tombé (captures du 22 octobre 2026), comme le Chariot pose le sien sur le treuil.
 */
const MAP_POINT: Vec3 = { x: CAGE.x0 + 0.5, y: G + CAGE.ridge + 1.2, z: (CAGE.z0 + CAGE.z1) / 2 };

// ---------- Les murs ----------

/** Un triangle tourné vers `out` (sa normale du même côté), quel que soit l'ordre de ses coins. */
function triOut(b: FacetBuilder, a: P3, c: P3, d: P3, out: P3, color: number): void {
  const n = [(c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]), (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]), (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/** Un pan de mur de brique de la cage (d'ouest en est si `alongX`, sinon du nord au sud), son dessus en pierre grise. */
function run(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, y0: number, top0: number, top1: number, thick: number = CAGE.wall): void {
  wallRun(b, alongX, at, from, to, thick, y0, top0, top1, C.brick, C.stoneSun);
}

/** Le haut des murs est et ouest restaurés, du nord au sud : en pente douce du mur nord au mur du cadre. */
const sideTop = (z: number): number => G + CAGE.north + ((CAGE.south - CAGE.north) * (z - (CAGE.z0 - CAGE.wall / 2))) / (CAGE.z1 - CAGE.z0 + CAGE.wall);

/**
 * Le cintre de l'arche du cadre : de chaque côté, un coin plein en biais, de la naissance au haut du cintre, à ses deux
 * faces, et son dessous ; puis, si `closed`, le dessous plat de la bande qui la referme en haut.
 */
function archHaunches(b: FacetBuilder, closed: boolean): void {
  const z = CAGE.z1,
    t = CAGE.wall / 2;
  const [spring, crown] = [G + ARCH.spring, G + ARCH.crown];
  const a = ARCH.half * 0.42;
  for (const s of [-1, 1]) {
    const xe = s * ARCH.half,
      xi = s * (ARCH.half - a);
    for (const v of [-t, t]) triOut(b, [xe, spring, z + v], [xe, crown, z + v], [xi, crown, z + v], [0, 0, Math.sign(v)], C.brick);
    quadOut(b, [xe, spring, z - t], [xi, crown, z - t], [xi, crown, z + t], [xe, spring, z + t], [-s, -1, 0], C.brick);
  }
  if (closed) quadOut(b, [-(ARCH.half - a), crown, z - t], [ARCH.half - a, crown, z - t], [ARCH.half - a, crown, z + t], [-(ARCH.half - a), crown, z + t], [0, -1, 0], C.brick);
}

/** Le plancher de scène : son plateau, son bord, et les joints de ses planches (de travers dans la ruine : un peu disjoint). */
function stageFloor(b: FacetBuilder, color: number, joint: number, skew: number): void {
  const t = CAGE.wall / 2;
  const [x0, x1, z0, z1] = [CAGE.x0 + t, CAGE.x1 - t, CAGE.z0 + t, CAGE.z1 - t];
  b.box({ x: (x0 + x1) / 2, y: G + SINK, z: (z0 + z1) / 2 }, [x1 - x0, FLOOR - SINK, z1 - z0], color);
  const y = G + FLOOR + 0.012;
  for (const [k, x] of [-3.3, -1.1, 1.1, 3.3].entries()) {
    const d = skew * (k % 2 ? 1 : -1);
    quadOut(b, [x - 0.035 + d, y, z0 + 0.05], [x + 0.035 + d, y, z0 + 0.05], [x + 0.035 - d, y, z1 - 0.05], [x - 0.035 - d, y, z1 - 0.05], [0, 1, 0], joint);
  }
}

/** Les deux rails des contrepoids, debout sur la face intérieure du mur ouest. */
function rails(b: FacetBuilder, color: number): void {
  const x = CAGE.x0 + CAGE.wall / 2 + 0.06;
  for (const z of RAILS.z) b.box({ x, y: G + FLOOR - 0.05, z }, [0.12, RAILS.top - FLOOR, 0.1], color);
}

/** Les consoles de fer de la galerie, en ligne sur le mur ouest. */
function consoles(b: FacetBuilder, color: number, top: number): void {
  const x = CAGE.x0 + CAGE.wall / 2 + GALLERY.wide / 2 - 0.05;
  for (const z of GALLERY.consoles) b.box({ x, y: G + GALLERY.y - 0.32, z }, [GALLERY.wide - 0.1, 0.3, 0.12], color, top);
}

/** Un tambour de treuil de bois, son axe du nord au sud, posé sur son pied `y`. */
function drum(b: FacetBuilder, x: number, y: number, z: number, r: number, len: number): void {
  b.drum({ x, y: y + r, z: z - len / 2, pitch: Math.PI / 2 }, r, len, 8, C.woodShade, C.wood);
}

/**
 * Un pan du rideau, posé ouvert contre le mur du cadre, de `x0` à `x0 + s · gathered` : ses plis en zigzag, du plancher
 * au-dessus du cintre ; sa face vers la salle et son revers vers les coulisses ; l'embrasse qui le retient.
 */
function curtainPanel(b: FacetBuilder, x0: number, s: -1 | 1): void {
  const K = CURTAIN;
  const [y0, y1] = [G + FLOOR + 0.02, G + ARCH.crown + 0.5];
  const step = K.gathered / K.folds;
  for (let k = 0; k < K.folds; k++) {
    const xa = x0 + s * k * step,
      xb = x0 + s * (k + 1) * step;
    const za = K.z - (k % 2 ? K.depth : 0),
      zb = K.z - (k % 2 ? 0 : K.depth);
    const q: [P3, P3, P3, P3] = [
      [xa, y0, za],
      [xb, y0, zb],
      [xb, y1, zb],
      [xa, y1, za],
    ];
    quadOut(b, ...q, [0, 0, 1], C.curtain);
    quadOut(b, ...q, [0, 0, -1], C.curtainBack);
  }
  b.box({ x: x0 + (s * K.gathered) / 2, y: G + 1.6, z: K.z - K.depth / 2 }, [K.gathered + 0.06, 0.12, K.depth + 0.1], C.curtainBack);
}

/** La ferrure vide du 4e : une petite plaque de fer éteint, deux chevilles nues, tournée vers `n` (x ou z). */
function emptyBracket(b: FacetBuilder, x: number, y: number, z: number, nx: number, nz: number): void {
  b.box({ x, y: y - 0.12, z, yaw: Math.atan2(nx, nz) }, [0.34, 0.24, 0.06], C.rustDull, C.rustDullTop);
  for (const s of [-0.09, 0.09]) b.box({ x: x + nx * 0.09 + nz * s, y: y - 0.04, z: z + nz * 0.09 - nx * s, yaw: Math.atan2(nx, nz) }, [0.06, 0.06, 0.12], C.iron);
}

/**
 * L'appentis du costumier, dehors, contre le mur est (toujours là) : son mur est et son mur sud de brique bas, son toit de
 * tôle à un pan sur son poteau et sa sablière, ouvert au nord ; sa table de coupe, ses rouleaux de toile unie debout ; sa
 * lanterne, la seule allumée de la ruine.
 */
function atelier(b: FacetBuilder): void {
  const A = LEANTO;
  const t = A.wall / 2;
  const foot = G + SINK;
  const roofAt = (x: number) => G + A.hi + ((A.lo - A.hi) * (x - A.x0)) / (A.x1 - A.x0);
  wallRun(b, false, A.x1, A.z0, A.z1 + t, A.wall, foot, G + A.lo - 0.05, G + A.lo - 0.05, C.brick, C.stoneSun);
  wallRun(b, true, A.z1, A.x0 - t, A.x1 - t, A.wall, foot, roofAt(A.x0) - 0.05, roofAt(A.x1) - 0.05, C.brick, C.stoneSun);
  b.box({ x: A.x0 + 0.12, y: foot, z: A.z0 + 0.12 }, [0.2, roofAt(A.x0) - foot - 0.05, 0.2], C.woodShade, C.wood);
  b.beam({ x: A.x0 + 0.12, y: roofAt(A.x0) - 0.12, z: A.z0 + 0.12 }, { x: A.x0 + 0.12, y: roofAt(A.x0) - 0.12, z: A.z1 - t }, 0.16, C.woodShade);
  sheet(
    b,
    [
      [A.x0 - 0.2, roofAt(A.x0 - 0.2), A.z0 - 0.3],
      [A.x1 + 0.25, roofAt(A.x1 + 0.25), A.z0 - 0.3],
      [A.x1 + 0.25, roofAt(A.x1 + 0.25), A.z1 + 0.25],
      [A.x0 - 0.2, roofAt(A.x0 - 0.2), A.z1 + 0.25],
    ],
    0.06,
    C.roof,
    C.roofUnder,
  );
  const T = TABLE;
  const ty = planeY(T.x, T.z);
  b.box({ x: T.x, y: ty + T.size[1] - 0.08, z: T.z }, [T.size[0], 0.08, T.size[2]], C.woodShade, C.wood);
  for (const s of [-1, 1]) b.box({ x: T.x, y: ty - 0.1, z: T.z + s * (T.size[2] / 2 - 0.2) }, [T.size[0] - 0.1, T.size[1] - 0.08 + 0.1, 0.08], C.woodShade);
  for (const r of ROLLS) b.prism({ x: r.x, y: planeY(r.x, r.z) - 0.05, z: r.z }, 0.16, 0.16, 1.25, 5, r.color, C.clothShade);
  const L = LANTERN_TAILOR;
  b.box({ x: L.x - 0.15, y: G + L.y + 0.02, z: L.z }, [0.36, 0.07, 0.07], C.iron);
  lantern(b, { x: L.x, y: G + L.y, z: L.z }, true);
}

/** La cour des décors : la dalle qui suit le plan, son bord, et ses joints en rangs (jamais sur le chemin). */
function yard(b: FacetBuilder): void {
  const top = YARD.map(({ x, z }) => [x, planeY(x, z) + 0.02, z] as P3);
  for (let k = 1; k < top.length - 1; k++) b.triangle(top[0], top[k], top[k + 1], C.paving);
  const cx = YARD.reduce((s, p) => s + p.x, 0) / YARD.length,
    cz = YARD.reduce((s, p) => s + p.z, 0) / YARD.length;
  for (let k = 0; k < top.length; k++) {
    const m = (k + 1) % top.length;
    const out: P3 = [(top[k][0] + top[m][0]) / 2 - cx, 0, (top[k][2] + top[m][2]) / 2 - cz];
    quadOut(b, [top[k][0], top[k][1] - 0.4, top[k][2]], [top[m][0], top[m][1] - 0.4, top[m][2]], top[m], top[k], out, C.stoneShade);
  }
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, planeY(q.x, q.z) + 0.032, q.z + nz * s];
    quadOut(b, p(a, 1), p(c, 1), p(c, -1), p(a, -1), [0, 1, 0], C.joint);
  };
  line({ x: -4.9, z: -2.1 }, { x: 4.9, z: -2.1 });
  for (const x of [-2.6, 2.6]) line({ x, z: -5.5 }, { x, z: 1.7 });
}

/** La salle en plein air, au sud : la terrasse de pierre, ses deux marches jusqu'au plancher, trois rangs de bancs de bois. */
function house(b: FacetBuilder): void {
  const H = HOUSE;
  const mid = (H.z0 + H.z1) / 2;
  const top = G + 0.06;
  b.box({ x: 0, y: G - 1.4, z: mid }, [2 * H.x, top - (G - 1.4), H.z1 - H.z0], C.stoneShade, C.stoneSun);
  b.box({ x: 0, y: top - 0.1, z: H.z0 + 0.25 }, [2 * ARCH.half - 0.4, 0.21, 0.5], C.stoneShade, C.stoneSun);
  b.box({ x: 0, y: top - 0.1, z: H.z0 + 0.125 }, [2 * ARCH.half - 0.4, 0.31, 0.25], C.stoneShade, C.stoneSun);
  for (const z of H.rows) {
    b.box({ x: 0, y: top - 0.02, z }, [2 * H.bench, 0.42, 0.12], C.woodShade);
    b.box({ x: 0, y: top + 0.4, z }, [2 * H.bench + 0.3, 0.07, 0.34], C.woodShade, C.wood);
  }
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const K = CAGE;
  const t = K.wall / 2;
  const foot = G + SINK;
  const [west, east] = [K.x0 - t, K.x1 + t];
  const [north, south] = [K.z0 - t, K.z1 + t];
  const bas = { stage: 0 as Stage, row: 0 };
  const milieu = { stage: 0 as Stage, row: 0.4 };
  const hautCorps = { stage: 0 as Stage, row: 0.8 };

  // Toujours là : la ferrure vide, sur la face intérieure du pilier gauche (à l'est) de la porte des décors ; l'appentis du
  // costumier et sa lanterne, la seule allumée.
  add('ruine', 0, (b) => {
    emptyBracket(b, DOOR.half - 0.03, G + FLOOR + 1.55, K.z0, -1, 0);
    atelier(b);
  });

  // ---- La ruine ----
  // Le bas la relève : le plancher gris un peu disjoint ; les deux piliers courts de la porte des décors ; le mur bas de
  // l'est ; les rails rouillés et le chariot des contrepoids couché, plein de ses pains de fonte (un seul volume) ; trois
  // blocs de brique dans la cour.
  add(
    'ruine',
    0,
    (b) => {
      stageFloor(b, C.floor, C.floorJoint, 0.06);
      run(b, true, K.z0, -DOOR.half - 1.0, -DOOR.half, foot, G + 2.3, G + 2.0);
      run(b, true, K.z0, DOOR.half, DOOR.half + 1.0, foot, G + 2.1, G + 2.4);
      run(b, false, K.x1, north, EAST_RUIN.corner, foot, G + EAST_RUIN.top0, G + EAST_RUIN.top1);
      rails(b, C.rust);
      b.box({ x: -4.3, y: G + FLOOR - 0.02, z: 6.2, yaw: 0.35 }, [1.0, 0.46, 0.7], C.rustShade, C.greyShade);
      for (const [x, z, yaw] of [
        [-3.9, 0.6, 0.4],
        [3.6, 0.9, -0.3],
        [4.7, -0.4, 0.9],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.06, z, yaw }, [0.62, 0.32, 0.36], C.brick, C.stoneSun);
    },
    bas,
  );
  // Le milieu la relève : les consoles rouillées de la galerie, ses planches rangées à plat le long du mur ; le tambour
  // de treuil couché sur le plancher.
  add(
    'ruine',
    0,
    (b) => {
      consoles(b, C.rustShade, C.rust);
      for (const [x, lift] of [
        [-4.6, 0],
        [-4.25, 0.1],
      ] as const)
        b.box({ x, y: G + FLOOR + lift, z: 5.5 }, [0.32, 0.1, 4.2], C.woodShade, C.grey);
      b.prism({ x: 1.8, y: G + FLOOR - 0.02, z: 4.6 }, 0.7, 0.7, 0.9, 8, C.woodShade, C.wood);
    },
    milieu,
  );
  // Le haut du corps la relève : le mur du cadre debout, haut, percé de son arche ouverte en haut ; le mur des
  // contrepoids, plus haut vers le cadre ; l'angle du mur est relevé contre le cadre ; une poutre en travers tout en haut,
  // une seconde tombée en biais ; le rideau tombé en un tas dans l'arche.
  add(
    'ruine',
    0,
    (b) => {
      run(b, true, K.z1, west, -ARCH.half, foot, G + 7.8, G + 8.1);
      run(b, true, K.z1, ARCH.half, east, foot, G + 8.0, G + 7.4);
      run(b, true, K.z1, -ARCH.half, -1.1, G + ARCH.crown, G + 7.6, G + 6.3);
      run(b, true, K.z1, 1.6, ARCH.half, G + ARCH.crown, G + 6.2, G + 7.2);
      archHaunches(b, false);
      run(b, false, K.x0, north, K.z1 - t, foot, G + 4.8, G + 6.4);
      run(b, false, K.x1, EAST_RUIN.corner, K.z1 - t, foot, G + EAST_RUIN.cornerTop - 0.3, G + EAST_RUIN.cornerTop);
      b.box({ x: 0, y: G + 6.0, z: K.z1 - t - 0.25 }, [K.x1 - K.x0 - 0.3, 0.3, 0.3], C.woodShade, C.grey);
      b.beam({ x: -4.9, y: G + 5.5, z: 3.7 }, { x: -1.4, y: G + FLOOR + 0.12, z: 4.9 }, 0.3, C.grey);
      b.prism({ x: -0.5, y: G + FLOOR - 0.05, z: K.z1 - 0.75, yaw: 0.2 }, 1.6, 0.55, 0.62, 7, C.curtain, C.curtainBack);
      b.prism({ x: 1.3, y: G + FLOOR - 0.05, z: K.z1 - 0.65, yaw: 0.6 }, 1.0, 0.3, 0.42, 7, C.curtain, C.curtainBack);
    },
    hautCorps,
  );

  // ---- Le corps, le bas : le plancher refait ; le bas des murs nord (de part et d'autre de la porte des décors) et est ;
  // les rails de fer bruni et le chariot des contrepoids relevé entre eux, plein de ses pains de fonte.
  add(0, 0, (b) => {
    stageFloor(b, C.boards, C.boardsJoint, 0);
    run(b, true, K.z0, west, -DOOR.half, foot, G + K.low, G + K.low);
    run(b, true, K.z0, DOOR.half, east, foot, G + K.low, G + K.low);
    run(b, false, K.x1, north, EAST_RUIN.corner, foot, G + K.low, G + K.low);
    rails(b, C.iron);
    b.box({ x: K.x0 + t + 0.3, y: G + 1.5, z: (RAILS.z[0] + RAILS.z[1]) / 2 }, [0.42, 1.0, RAILS.z[1] - RAILS.z[0] - 0.12], C.iron, C.greyShade);
  });
  // ---- Le corps, le milieu : les murs nord et est jusqu'à la galerie ; la galerie de bois sur ses consoles de fer, son
  // garde-corps plein ; ses deux tambours.
  add(0, 0.4, (b) => {
    run(b, true, K.z0, west, -DOOR.half, G + K.low, G + K.mid, G + K.mid);
    run(b, true, K.z0, DOOR.half, east, G + K.low, G + K.mid, G + K.mid);
    run(b, false, K.x1, north, EAST_RUIN.corner, G + K.low, G + K.mid, G + K.mid);
    consoles(b, C.iron, C.ironTop);
    const gx = K.x0 + t + GALLERY.wide / 2;
    b.box({ x: gx, y: G + GALLERY.y - 0.02, z: (GALLERY.z0 + GALLERY.z1) / 2 }, [GALLERY.wide, 0.12, GALLERY.z1 - GALLERY.z0], C.woodShade, C.grey);
    b.box({ x: K.x0 + t + GALLERY.wide - 0.04, y: G + GALLERY.y + 0.1, z: (GALLERY.z0 + GALLERY.z1) / 2 }, [0.07, 0.62, GALLERY.z1 - GALLERY.z0], C.woodShade, C.grey);
    for (const z of GALLERY.drums) drum(b, gx - 0.12, G + GALLERY.y + 0.1, z, GALLERY.drumR, 0.7);
  });
  // ---- Le corps, le haut : le haut des murs nord et est ; le mur des contrepoids entier ; le mur du cadre entier, son
  // arche refermée en haut ; les cintres (trois poutres, une poulie chacune, leurs cordages jusqu'aux tambours) ; le rideau
  // raccroché, posé ouvert en deux pans de part et d'autre de l'arche.
  add(0, 0.8, (b) => {
    run(b, true, K.z0, west, east, G + K.mid, G + K.north, G + K.north);
    quadOut(b, [-DOOR.half, G + K.mid, K.z0 - t], [DOOR.half, G + K.mid, K.z0 - t], [DOOR.half, G + K.mid, K.z0 + t], [-DOOR.half, G + K.mid, K.z0 + t], [0, -1, 0], C.brick);
    run(b, false, K.x1, north, EAST_RUIN.corner, G + K.mid, sideTop(north), sideTop(EAST_RUIN.corner));
    run(b, false, K.x1, EAST_RUIN.corner, K.z1 - t, foot, sideTop(EAST_RUIN.corner), sideTop(K.z1 - t));
    run(b, false, K.x0, north, K.z1 - t, foot, sideTop(north), sideTop(K.z1 - t));
    run(b, true, K.z1, west, -ARCH.half, foot, G + K.south, G + K.south);
    run(b, true, K.z1, ARCH.half, east, foot, G + K.south, G + K.south);
    run(b, true, K.z1, -ARCH.half, ARCH.half, G + ARCH.crown, G + K.south, G + K.south);
    archHaunches(b, true);
    for (const [k, z] of FLIES.z.entries()) {
      b.box({ x: 0, y: G + FLIES.y, z }, [K.x1 - K.x0 - 0.2, 0.3, 0.28], C.woodShade, C.grey);
      b.drum({ x: FLIES.pulley, y: G + FLIES.y - 0.24, z: z - 0.06, pitch: Math.PI / 2 }, 0.24, 0.12, 6, C.woodShade, C.wood);
      const dz = GALLERY.drums[k === 2 ? 1 : 0];
      b.beam({ x: FLIES.pulley, y: G + FLIES.y - 0.45, z }, { x: K.x0 + t + GALLERY.wide / 2 - 0.12, y: G + GALLERY.y + 0.1 + 2 * GALLERY.drumR, z: dz + (k === 1 ? 0.25 : -0.1) }, 0.05, C.sackShade);
    }
    curtainPanel(b, -ARCH.half + 0.05, -1);
    curtainPanel(b, ARCH.half - 0.05, 1);
    b.box({ x: 0, y: G + ARCH.crown - 0.1, z: CURTAIN.z - 0.04 }, [2 * ARCH.half + 0.6, 0.45, 0.1], C.curtainBack, C.curtain);
  });
  // ---- Le haut : le toit de la cage, un pan bas presque plat de tôle rouge sombre (son faîte à 9,3, sur le mur du
  // cadre) ; la grande porte des décors, ses deux battants ouverts repliés contre le mur ; la lanterne de la porte.
  add(1, 0, (b) => {
    const [n, s] = [north - 0.05, south + K.over];
    const yAt = (z: number) => G + K.north + 0.02 + ((K.ridge - K.roof - K.north - 0.02) * (z - n)) / (s - n);
    sheet(
      b,
      [
        [west - K.over, yAt(n), n],
        [east + K.over, yAt(n), n],
        [east + K.over, yAt(s), s],
        [west - K.over, yAt(s), s],
      ],
      K.roof,
      C.roof,
      C.roofUnder,
    );
    for (const sgn of [-1, 1]) b.box({ x: sgn * (DOOR.half + 1.05), y: planeY(sgn * 3, K.z0 - 0.4) - 0.05, z: north - 0.06 }, [2.0, DOOR.top - 0.15, 0.1], C.woodShade, C.wood);
    const L = LANTERN_DOOR;
    b.box({ x: L.x, y: G + L.y + 0.02, z: L.z + 0.12 }, [0.07, 0.07, 0.3], C.iron);
    lantern(b, { x: L.x, y: G + L.y, z: L.z }, true);
  });
  // ---- Les abords : au nord, la cour des décors dallée et la lanterne du chemin ; au sud, la salle en plein air.
  add(2, 0, (b) => {
    yard(b);
    house(b);
    const p = PATH_LANTERN;
    const py = planeY(p.x, p.z);
    b.box({ x: p.x, y: py - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: py + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, « Les parties et les traces ») ; aucune sur le chemin. */
const TRACE_SPOTS = {
  stools: { x: -4.2, z: 7.3 },
  horn: { x: 4.6, z: 3.4 },
  sacks: { x: -4.85, z: 4.05 },
  chair: { x: 4.75, z: 6.4 },
  backdrop: { x: -3.4, z: -2.8 },
} as const;

/** Deux tabourets de bois côte à côte, au bord du plancher, près du mur ouest (Dialogues). */
function stools(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.stools;
    for (const dx of [-0.32, 0.32]) l.prism({ x: x + dx, y: G + FLOOR - 0.02, z }, 0.19, 0.17, 0.48, 6, C.woodShade, C.wood);
  });
}

/**
 * Le cornet d'un tuyau acoustique de fer bruni, sur un court poteau près de la régie, à l'écart de la ferrure vide (la
 * mission de 2027, `relatives-reported` ; une proposition, correction 20) : modelé dès ce lot, posé seulement avec sa mission.
 */
function horn(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.horn;
    const y = G + FLOOR;
    l.box({ x, y: y - 0.02, z }, [0.14, 1.1, 0.14], C.iron, C.ironTop);
    l.beam({ x, y: y + 1.05, z }, { x: x + 0.45, y: y + 2.4, z: z - 0.2 }, 0.07, C.iron);
    l.prism({ x: x - 0.02, y: y + 1.05, z: z + 0.04, yaw: 0.3 }, 0.05, 0.17, 0.26, 6, C.iron, C.greyShade);
  });
}

/** Trois sacs de lest de toile unie, de la même taille, debout côte à côte au pied des rails (Quantités). */
function sacks(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.sacks;
    for (const dz of [-0.42, 0, 0.42]) l.prism({ x, y: G + FLOOR - 0.02, z: z + dz, yaw: dz }, 0.18, 0.14, 0.55, 6, C.sackShade, C.sack);
  });
}

/** Un vieux fauteuil de scène en bois, à haut dossier, tapissé de toile unie, dans la coulisse contre le mur est (Prétérit irrégulier). */
function chair(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.chair;
    const y = G + FLOOR - 0.02;
    l.box({ x, y, z }, [0.62, 0.48, 0.62], C.woodShade, C.clothBlue);
    l.box({ x: x + 0.27, y, z }, [0.1, 1.35, 0.62], C.woodShade, C.clothBlue);
    for (const s of [-1, 1]) l.box({ x: x - 0.02, y: y + 0.48, z: z + s * 0.28 }, [0.56, 0.24, 0.07], C.woodShade, C.wood);
  });
}

/** Un long rouleau de toile de fond unie, couché sur deux tréteaux pleins (jamais un chevalet en X), dans la cour, à l'ouest (Stories). */
function backdrop(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.backdrop;
    const y = planeY(x, z);
    for (const s of [-1, 1]) l.box({ x: x + s * 1.05, y: y - 0.05, z }, [0.16, 0.72, 0.62], C.woodShade, C.wood);
    l.drum({ x: x - 1.6, y: y + 0.88, z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.2, 3.2, 8, C.clothShade, C.cloth);
  });
}

/**
 * Les traces, une par mission, chacune avec sa partie ; des objets de coulisses, jamais la notion. Celle de 2027
 * (`relatives-reported`) prend le milieu du corps (`row` 0,4) : une trace par partie dans les deux comptes.
 */
const TRACES = {
  dialogues: { at: TRACE_SPOTS.stools, lift: 1, stage: 0, row: 0, draw: stools },
  'relatives-reported': { at: TRACE_SPOTS.horn, lift: 1, stage: 0, row: 0.4, draw: horn },
  quantities: { at: TRACE_SPOTS.sacks, lift: 1, stage: 0, row: 0.8, draw: sacks },
  'irregular-past': { at: TRACE_SPOTS.chair, lift: 1, stage: 1, row: 0, draw: chair },
  stories: { at: TRACE_SPOTS.backdrop, lift: 1, stage: 2, row: 0, draw: backdrop },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention : vers l'est-sud-est, vers le mur de brique de l'appentis) : un
 * fond calme derrière la bulle ; l'arche, la baie et le rideau hors du cadre. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = Math.atan2(-Math.cos(Math.PI / 8), -Math.sin(Math.PI / 8));

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le costumier) : le sud-sud-ouest. */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : dehors, devant l'appentis ouvert au nord, à l'est de la cage. */
const SCENE_SPOT = { dx: 7.7, dz: 1.4, half: [1.2, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du costumier au milieu de la scène. */
const SCENE_HALF = 1.4;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous elle). */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -3; k <= 3; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 3) * hz));
  return Math.max(0, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.03 - top);
})();

/** Le costumier en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise. */
function tailor(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.28, 0.24, 0.48, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.62, z: at.z }, 0.26, 0.23, 0.38, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.28, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.34, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Les boîtes à chapeau des réponses : rondes et basses, toutes de la même taille ; une boîte choisie se soulève d'un cran. */
const HATBOX = { r: 0.26, h: 0.26, lid: 0.06, lift: 0.3 } as const;

export const LOGE: PlaceArt = {
  role: 'Le costumier',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 2+1+1, puis 3+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 2.0, bottom: -0.4, top: 2.5, depth: 0.3 },
    // Basse : la cour est plate, et le mur de l'appentis ferme le fond.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la table de coupe et les rouleaux sont à l'appentis. Il reste le costumier en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) tailor(b, at, sphere);
  },
  answer: {
    size: { height: HATBOX.h + HATBOX.lid + HATBOX.lift + 0.1, half: HATBOX.r + 0.06 },
    facing: true,
    // La table de coupe : un long plateau de bois sur deux pieds pleins, où les boîtes sont en rang.
    base(b, mid, y, z, span, s, ground) {
      const foot = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: y - 0.1 * s, z: z + 0.1 * s }, [span + 0.6, 0.1 * s, 0.6 * s], C.woodShade, C.wood);
      for (const k of [-1, 1]) b.box({ x: mid + k * (span / 2 + 0.1), y: foot, z: z + 0.1 * s }, [0.12 * s, y - 0.1 * s - foot, 0.5 * s], C.woodShade);
    },
    // Une boîte à chapeau ronde, en carton uni gris chaud, et son couvercle ; choisie, elle se soulève d'un cran (sa place
    // le dit, jamais sa couleur).
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (picked ? HATBOX.lift : 0) * s;
      b.prism({ x: at.x, y, z: at.z }, HATBOX.r * s, HATBOX.r * s, HATBOX.h * s, 8, C.boxShade, C.box);
      b.prism({ x: at.x, y: y + HATBOX.h * s, z: at.z }, (HATBOX.r + 0.025) * s, (HATBOX.r + 0.025) * s, HATBOX.lid * s, 8, C.box, C.box);
    },
  },
  // Les missions en R : la table seule, rien de l'item ; les boîtes portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la cage.
  exit: { x: DOOR_AT.x + 0.6, z: DOOR_AT.z + 0.8 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Loge, pour les tests et ses abords : la cage, l'arche, la galerie, l'appentis, la caméra. */
export const LOGE_LAYOUT = {
  cage: CAGE,
  floor: FLOOR,
  door: DOOR,
  arch: ARCH,
  rails: RAILS,
  gallery: GALLERY,
  leanto: LEANTO,
  yard: YARD,
  house: HOUSE,
  planeY,
  base: G,
  pathLantern: PATH_LANTERN,
  doorAt: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  colors: { curtain: C.curtain, roof: C.roof, bracket: C.rustDull },
} as const;
