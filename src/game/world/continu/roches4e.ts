// Les Roches (les Coteaux du 4e, GD-24 ; intention du directeur artistique du 22 octobre 2026, § 4, sur la planche
// `selection-coteaux-v3`) : « la salle des échantillons de la mine, chaque pierre à sa place et à son nom ». Sur le
// gabarit de l'Étalon (./etalon4e.ts), avec le kit commun des Coteaux (./place4eKit.ts). Une salle basse de pierre grise
// des Passeurs à assises (jamais de brique), au pied du cône : la terrasse entaille le flanc jusqu'à la plaine
// (`ROCHES_TERRACE_4E`, terrain4e.ts), le mur du fond (au nord) et le mur ouest retiennent la pente, un talus de terre
// couvre l'entaille derrière eux. Ouverte au sud et à l'est, sous un toit à un pan de lauzes de basalte chaud, haut contre
// le mur du fond. Le cœur, sans figure : les casiers de bois contre le mur ouest et les vitrines ouvertes (des cadres sans
// verre) au mur du fond, leurs pierres de formes différentes (prismes, boules, plaques, aiguilles), d'un même ton mat ;
// la grande table de tri et ses bacs en rang ; au bout de la table, le pied de fer bas de la grande loupe, son support vide
// et ses deux goujons nus : le signe de l'absence du 4e (la lentille, prise par les Ferrailleurs), jamais un chevalet
// portant un cadre, avant comme après.
//
// La ruine, d'après le texte : les deux murs à mi-hauteur, leurs assises du haut tombées en biais depuis l'angle ; le toit
// tombé, dont il ne reste que deux poutres couchées en long sur la table, parallèles ; les casiers debout, vides aux deux
// tiers ; une vitrine tombée en avant, son cadre à plat ; les échantillons en un seul tas au pied des casiers ; la table
// fendue en long, ses bacs de tri renversés. Une seule lumière, la lanterne de la géologue, posée sur une console à
// l'angle du mur du fond. Quatre parties aujourd'hui (2 + 1 + 1 : le premier plan coupé en deux par la hauteur,
// parts.ts) : le corps 1 (les murs remontés, le seuil de pierre), le corps 2 (les casiers, les vitrines, la table), le
// haut (le toit, la lanterne du poteau sud-est), les abords (le seuil dallé, le muret de pierres sèches, les déblais en
// tas net, l'allée, sa lanterne). Chaque trace est attachée à sa mission, jamais à son rang. Aucune lueur, rien
// d'orange, rien à lire, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C4E, SINK, armLantern, capOf, emptyMount, groundPlane4e, inWorld, lantern, once, postLantern, quadOut, sceneRight, sceneRise, sheet, site4e, wallRun, type P3 } from './place4eKit';
import { COLORS_4E } from './plan4e';

/**
 * Les couleurs propres aux Roches, en plus des matières des Passeurs (`C4E`, le joint des assises compris) : le fond sombre des
 * cases ; les pierres des casiers, d'un même ton mat (jamais un cristal brillant), et leur dessus ; le talus de terre
 * des Coteaux qui vient contre les murs ; la toile brune de la sacoche (jamais moutarde ni orange).
 */
const C = {
  niche: 0x4e4642,
  sample: 0x8e8478,
  sampleTop: 0x9a9086,
  // Les pierres des casiers et des vitrines (retouche 2) : bien plus claires que le fond des cases, pour que leur forme
  // se lise de la porte ; toujours mates, du gris de la pierre des Passeurs.
  cased: 0xb2a99c,
  casedTop: 0xc2baae,
  talus: COLORS_4E.burnt,
  talusSun: COLORS_4E.burntSun,
  satchel: 0x7a6450,
  satchelTop: 0x86705c,
  // La géologue, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier brun-gris, chemise.
  boots: 0x55595a,
  apron: 0x7a6e60,
  shirt: 0x7e8a8e,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site4e('roches');

/**
 * La salle : son dedans (x d'ouest en est, z du nord au sud), l'épaisseur des murs, la hauteur du mur du fond, celle du
 * mur ouest à son bout sud (sous le toit qui descend), le bout sud du mur ouest qui dépasse le toit, plus bas (`stub`).
 */
const ROOM = { x0: 0.4, x1: 6.0, z0: 0.4, z1: 4.6, wall: 0.6, h: 3.5, westSouth: 2.6, stub: { z1: 5.4, h: 1.5 } } as const;

/** Les murs de la ruine : de la hauteur de l'angle nord-ouest, ils tombent en biais vers leurs bouts. */
const RUIN_WALLS = { corner: 2.6, backEnd: 1.3, westEnd: 1.2, stub: 1.0 } as const;

/** Le sol de la salle, sur la terrasse : un plan ajusté sous son dedans et son seuil. */
const planeY = groundPlane4e(SITE.ground, [ROOM.x0, ROOM.x1], [ROOM.z0, ROOM.z1 + 1], 0.02);

/** Le toit à un pan : sa hauteur au-dessus du sol au droit du mur du fond, sa pente vers le sud, ses bords. */
const ROOF = { y: ROOM.h + 0.02, slope: 0.2, x0: -0.5, x1: 6.35, z0: -0.45, z1: 5.0, thick: 0.14 } as const;
const roofY = (z: number): number => ROOF.y - (z - (ROOM.z0 - ROOM.wall / 2)) * ROOF.slope;

/** Les deux casiers contre le mur ouest : leur milieu en z, leur largeur, leur profondeur, leur hauteur ; leurs étagères. */
const CASIERS = { x: ROOM.x0 + 0.28, at: [1.3, 2.55], w: 1.15, d: 0.55, h: 2.0, shelves: [0.02, 0.67, 1.33] } as const;

/** L'épaisseur du fond d'un casier, contre le mur : les cases sont creuses devant lui. */
const CASIER_BACK = 0.12;

/** Les deux vitrines au mur du fond : leur milieu en x, leur largeur, leur bas et leur haut. */
const VITRINES = { z: ROOM.z0 + 0.15, at: [1.9, 4.4], w: 1.2, y0: 0.7, y1: 2.1 } as const;

/** La grande table de tri : son milieu, sa longueur (x), sa largeur, sa hauteur ; ses trois bacs en rang. */
const TABLE = { x: 2.6, z: 3.1, w: 2.4, d: 0.9, h: 0.85, bins: [1.9, 2.6, 3.3] } as const;

/** Le pied de fer bas de la grande loupe, au bout est de la table : sa place, sa hauteur. */
const LOUPE = { x: 4.15, z: 3.1, h: 0.75 } as const;

/** La lanterne de la géologue, posée sur une console à l'angle du mur du fond : la console, sa hauteur. */
const CORBEL = { x: ROOM.x0 + 0.22, z: ROOM.z0 + 0.22, y: 2.05, size: 0.45 } as const;

/** Les deux poteaux du bord sud du toit ; celui du sud-est porte la lanterne du pignon (le haut). */
const POSTS = [3.0, 5.8] as const;
const POST_Z = ROOM.z1 - 0.15;

/**
 * Le seuil dallé des abords, devant le côté sud ouvert ; l'allée vers le chemin ; la lanterne de l'allée, vers son bout
 * (retouche 1 : plus près du seuil, elle passait devant Kéo dans la scénette).
 */
const SEUIL = { x0: 1.6, x1: ROOM.x1, z0: ROOM.z1 + 0.15, z1: ROOM.z1 + 1.1 } as const;
const ALLEE = { from: { x: ROOM.x1, z: 5.2 }, to: { x: 8.4, z: 5.5 }, half: 0.35 } as const;
const PATH_LANTERN = { x: 7.5, z: 6.25, h: 1.35 } as const;

/** Le muret de pierres sèches qui retient la pente au sud-ouest, dans le prolongement du mur ouest ; les déblais en tas. */
const MURET = { x: 0.05, z0: ROOM.stub.z1, z1: 6.5, thick: 0.5 } as const;
const DEBLAIS = { x: 6.9, z: 1.4 } as const;

/** Le talus de terre derrière les murs, jusqu'à la pente du cône : à tant du dehors des murs. */
const TALUS_BACK = 4.0;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (intention, « Les caps ») : 290°, de la porte à l'est-sud-est. La salle de trois quarts, ouverte vers
 * nous ; le cratère haut et à droite, à vingt degrés de l'axe, jamais au centre.
 */
const DOOR_VIEW = capOf(290);

/** La vue d'arrivée basse, à hauteur de Kéo. */
const DOOR_FRAME = { height: -3, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du toit. */
const MAP_POINT: Vec3 = { x: 3.2, y: ROOM.h + 1.6, z: 2.5 };

// ---------- La salle ----------

/** La hauteur du haut du mur du fond en `x` et du mur ouest en `z`, selon qu'ils sont relevés ou en ruine. */
function backTop(x: number, whole: boolean): number {
  const u = (x - (ROOM.x0 - ROOM.wall)) / (ROOM.x1 - ROOM.x0 + ROOM.wall);
  return whole ? ROOM.h : RUIN_WALLS.corner + (RUIN_WALLS.backEnd - RUIN_WALLS.corner) * u;
}
function westTop(z: number, whole: boolean): number {
  if (z > ROOM.z1) return whole ? ROOM.stub.h : RUIN_WALLS.stub;
  const u = (z - (ROOM.z0 - ROOM.wall)) / (ROOM.z1 - ROOM.z0 + ROOM.wall);
  return whole ? ROOM.h + (ROOM.westSouth - ROOM.h) * u : RUIN_WALLS.corner + (RUIN_WALLS.westEnd - RUIN_WALLS.corner) * u;
}

/** Les deux murs de pierre grise, leurs assises marquées sur leurs faces du dedans ; le bout sud du mur ouest, plus bas. */
function walls(b: FacetBuilder, whole: boolean): void {
  const R = ROOM;
  const g = planeY(R.x0, R.z0);
  const bx0 = R.x0 - R.wall;
  wallRun(b, true, R.z0 - R.wall / 2, bx0, R.x1, R.wall, SINK, g + backTop(bx0, whole), g + backTop(R.x1, whole), C4E.stoneShade, C4E.stoneSun);
  const wz0 = R.z0 - R.wall;
  wallRun(b, false, R.x0 - R.wall / 2, wz0, R.z1, R.wall, SINK, g + westTop(wz0, whole), g + westTop(R.z1, whole), C4E.stoneShade, C4E.stoneSun);
  const stub = whole ? R.stub.h : RUIN_WALLS.stub;
  wallRun(b, false, R.x0 - R.wall / 2, R.z1 - 0.01, R.stub.z1, R.wall, SINK, g + stub, g + stub - 0.1, C4E.stoneShade, C4E.stoneSun);
  // Les assises : un joint sombre sur la face du dedans de chaque mur, là où le mur monte plus haut que lui.
  for (const c of whole ? [1.1, 2.25] : [0.95]) {
    const y = g + c;
    let xEnd: number = R.x1;
    if (!whole) xEnd = Math.min(R.x1, bx0 + ((c + 0.1 - RUIN_WALLS.corner) / (RUIN_WALLS.backEnd - RUIN_WALLS.corner)) * (R.x1 - bx0));
    if (xEnd > R.x0 + 0.3) quadOut(b, [R.x0, y, R.z0 + 0.01], [xEnd, y, R.z0 + 0.01], [xEnd, y + 0.05, R.z0 + 0.01], [R.x0, y + 0.05, R.z0 + 0.01], [0, 0, 1], C4E.stoneJoint);
    let zEnd: number = R.z1;
    if (!whole) zEnd = Math.min(R.z1, wz0 + ((c + 0.1 - RUIN_WALLS.corner) / (RUIN_WALLS.westEnd - RUIN_WALLS.corner)) * (R.z1 - wz0));
    if (zEnd > R.z0 + 0.3) quadOut(b, [R.x0 + 0.01, y, R.z0], [R.x0 + 0.01, y, zEnd], [R.x0 + 0.01, y + 0.05, zEnd], [R.x0 + 0.01, y + 0.05, R.z0], [1, 0, 0], C4E.stoneJoint);
  }
}

/**
 * Le talus de terre derrière les deux murs : du haut du mur (ou du sol de la pente, s'il est plus bas) jusqu'à la pente
 * du cône, à `TALUS_BACK` du dehors des murs ; il couvre l'entaille de la terrasse.
 */
function talus(b: FacetBuilder, whole: boolean): void {
  const R = ROOM;
  const g = planeY(R.x0, R.z0);
  const out = R.x0 - R.wall,
    back = R.z0 - R.wall;
  const far = (x: number, z: number) => SITE.ground(x, z) - 0.05;
  const inner = (top: number, x: number, z: number) => Math.max(g + 0.05, Math.min(g + top, far(x, z)));
  const xs = [out, 1.5, 3.0, 4.5, R.x1];
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xc] = [xs[i], xs[i + 1]];
    quadOut(b, [xa, inner(backTop(xa, whole), xa, back - TALUS_BACK), back], [xc, inner(backTop(xc, whole), xc, back - TALUS_BACK), back], [xc, far(xc, back - TALUS_BACK), back - TALUS_BACK], [xa, far(xa, back - TALUS_BACK), back - TALUS_BACK], [0, 1, 0], C.talusSun);
  }
  const zs = [back, 1.5, 3.0, R.z1, R.stub.z1];
  for (let i = 0; i < zs.length - 1; i++) {
    const [za, zc] = [zs[i], zs[i + 1]];
    quadOut(b, [out, inner(westTop(za, whole), out - TALUS_BACK, za), za], [out, inner(westTop(zc, whole), out - TALUS_BACK, zc), zc], [out - TALUS_BACK, far(out - TALUS_BACK, zc), zc], [out - TALUS_BACK, far(out - TALUS_BACK, za), za], [0, 1, 0], C.talus);
  }
  const corner = inner(Math.min(backTop(out, whole), westTop(back, whole)), out - TALUS_BACK, back - TALUS_BACK);
  quadOut(b, [out, corner, back], [out, far(out, back - TALUS_BACK), back - TALUS_BACK], [out - TALUS_BACK, far(out - TALUS_BACK, back - TALUS_BACK), back - TALUS_BACK], [out - TALUS_BACK, far(out - TALUS_BACK, back), back], [0, 1, 0], C.talus);
}

/** Le sol de terre battue de la salle, et la console de pierre de l'angle, la lanterne de la géologue posée dessus. */
function floorAndCorbel(b: FacetBuilder): void {
  const R = ROOM;
  const f = (x: number, z: number): P3 => [x, planeY(x, z) + 0.02, z];
  quadOut(b, f(R.x0, R.z0), f(R.x1, R.z0), f(R.x1, R.z1), f(R.x0, R.z1), [0, 1, 0], C4E.earth);
  const K = CORBEL;
  const y = planeY(K.x, K.z) + K.y;
  b.box({ x: K.x, y, z: K.z, yaw: Math.PI / 4 }, [K.size, 0.16, K.size], C4E.stoneShade, C4E.stoneSun);
  lantern(b, { x: K.x, y: y + 0.16 + 0.36, z: K.z }, true);
}

/** Le pied de fer bas de la grande loupe, au bout de la table : le signe de l'absence, toujours là. */
function loupeStand(b: FacetBuilder): void {
  const L = LOUPE;
  const g = planeY(L.x, L.z);
  b.box({ x: L.x, y: g - 0.1, z: L.z }, [0.4, 0.12, 0.4], C4E.iron, C4E.ironTop);
  b.box({ x: L.x, y: g, z: L.z }, [0.14, L.h, 0.14], C4E.iron);
  emptyMount(b, { x: L.x, y: g + L.h, z: L.z }, Math.PI / 2);
}

// ---------- Les casiers, les vitrines, la table ----------

/**
 * Une pierre d'échantillon, d'une forme : 0 un prisme, 1 une boule, 2 une plaque, 3 une aiguille ; de la taille `k`
 * (1 : celle du tas de la ruine) ; claire (`light`) dans les cases, sur leur fond sombre.
 */
function sample(b: FacetBuilder, at: Vec3, shape: number, yaw = 0, k = 1, light = false): void {
  const side = light ? C.cased : C.sample,
    top = light ? C.casedTop : C.sampleTop;
  if (shape === 0) b.prism({ ...at, yaw }, 0.13 * k, 0.13 * k, 0.16 * k, 3, side, top);
  else if (shape === 1) b.prism({ ...at, yaw }, 0.1 * k, 0.07 * k, 0.16 * k, 5, side, top);
  else if (shape === 2) b.box({ ...at, yaw }, [0.26 * k, 0.05 * k, 0.18 * k], side, top);
  else b.prism({ ...at, yaw }, 0.06 * k, 0, 0.32 * k, 3, side);
}

/**
 * Les pierres d'un casier restauré (retouche 2 : le cœur du lieu, « chaque pierre à sa place ») : deux par case, dans
 * ses trois cases, de formes et de tailles variées (la taille de chacune, en part de celle du tas), décalées d'un casier
 * à l'autre pour qu'aucune case ne répète sa voisine.
 */
const CASED = { sizes: [1.6, 1.15, 1.35, 1.7, 1.25, 1.5], shapes: [1, 2, 0, 3, 2, 1] } as const;

/**
 * Un casier de bois contre le mur ouest : son fond sombre, ses deux flancs, ses trois étagères. Le fond est un panneau
 * mince contre le mur (retouche 2 : plein, sur toute la profondeur, il avalait les pierres des cases).
 */
function casier(b: FacetBuilder, z: number, wood: number, top: number): void {
  const K = CASIERS;
  const g = planeY(K.x, z);
  b.box({ x: K.x - K.d / 2 + CASIER_BACK / 2, y: g - 0.05, z }, [CASIER_BACK, K.h + 0.05, K.w], C.niche, top);
  for (const s of [-1, 1]) b.box({ x: K.x, y: g - 0.05, z: z + s * (K.w / 2) }, [K.d + 0.04, K.h + 0.05, 0.06], wood, top);
  for (const y of K.shelves) b.box({ x: K.x + 0.02, y: g + y, z }, [K.d + 0.02, 0.06, K.w], wood, top);
}

/** Une vitrine : un cadre ouvert, sans verre, debout contre le mur du fond ; ou tombée en avant, à plat (`fallen`). */
function vitrine(b: FacetBuilder, x: number, wood: number, top: number, fallen = false): void {
  const V = VITRINES;
  const g = planeY(x, V.z);
  const h = V.y1 - V.y0;
  if (fallen) {
    // À plat sur le sol, son haut vers le sud : deux longerons et deux traverses.
    const z0 = V.z + 0.2;
    for (const s of [-1, 1]) b.box({ x: x + s * (V.w / 2 - 0.05), y: g, z: z0 + h / 2, yaw: 0.08 }, [0.1, 0.08, h], wood, top);
    for (const dz of [0, h]) b.box({ x, y: g, z: z0 + dz, yaw: 0.08 }, [V.w, 0.08, 0.1], wood, top);
    return;
  }
  for (const s of [-1, 1]) b.box({ x: x + s * (V.w / 2 - 0.05), y: g + V.y0, z: V.z }, [0.1, h, 0.2], wood, top);
  for (const y of [V.y0, V.y1 - 0.1]) b.box({ x, y: g + y, z: V.z }, [V.w, 0.1, 0.24], wood, top);
}

/** La table de tri : son plateau et ses deux pieds pleins ; entière, ou fendue en long, ses deux moitiés de travers. */
function table(b: FacetBuilder, whole: boolean): void {
  const T = TABLE;
  const g = planeY(T.x, T.z);
  for (const s of [-1, 1]) b.box({ x: T.x + s * (T.w / 2 - 0.25), y: g - 0.05, z: T.z }, [0.1, T.h - 0.05, T.d - 0.15], whole ? C4E.newShade : C4E.woodShade, whole ? C4E.newWood : C4E.wood);
  if (whole) {
    b.box({ x: T.x, y: g + T.h - 0.1, z: T.z }, [T.w, 0.1, T.d], C4E.newShade, C4E.newWood);
    for (const x of T.bins) b.box({ x, y: g + T.h, z: T.z }, [0.55, 0.2, 0.5], C4E.newShade, C4E.earthTop);
    return;
  }
  for (const s of [-1, 1]) b.box({ x: T.x, y: g + T.h - 0.16, z: T.z + s * 0.23, pitch: s * 0.12 }, [T.w, 0.09, T.d / 2 - 0.02], C4E.woodShade, C4E.wood);
}

// ---------- Le modèle ----------

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 2 };
  const haut = { stage: 1 as Stage, row: 0 };

  // Toujours là : le sol de terre battue, la console de l'angle et la lanterne de la géologue (la seule allumée de la
  // ruine) ; le pied de la loupe et le signe de l'absence.
  add('ruine', 0, (b) => {
    floorAndCorbel(b);
    loupeStand(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : les deux murs à mi-hauteur, tombés en biais depuis l'angle, et leur talus.
  add(
    'ruine',
    0,
    (b) => {
      walls(b, false);
      talus(b, false);
    },
    corps1,
  );
  // Le corps 2 la relève : les casiers vides aux deux tiers ; une vitrine debout et vide, l'autre tombée à plat ; le tas
  // d'échantillons au pied des casiers ; la table fendue, ses bacs renversés.
  add(
    'ruine',
    0,
    (b) => {
      CASIERS.at.forEach((z, k) => {
        casier(b, z, C4E.woodShade, C4E.wood);
        sample(b, { x: CASIERS.x + 0.05, y: planeY(CASIERS.x, z) + CASIERS.shelves[1] + 0.06, z: z - 0.25 + 0.4 * k }, k);
      });
      vitrine(b, VITRINES.at[0], C4E.woodShade, C4E.wood);
      vitrine(b, VITRINES.at[1], C4E.woodShade, C4E.wood, true);
      const heap = { x: CASIERS.x + 0.75, z: 2.0 };
      const g = planeY(heap.x, heap.z);
      [
        [0, 0, 0, 0],
        [0.25, 0.15, 1, 0.6],
        [-0.15, 0.3, 2, 1.2],
        [0.1, -0.3, 0, 2.1],
        [0.05, 0.05, 2, 0.4],
      ].forEach(([dx, dz, shape, yaw], k) => sample(b, { x: heap.x + dx, y: g + (k === 4 ? 0.14 : 0), z: heap.z + dz }, shape, yaw));
      table(b, false);
      const T = TABLE;
      T.bins.forEach((x, k) => b.box({ x: x + 0.2 * k - 0.1, y: planeY(x, T.z + 0.9) - 0.05, z: T.z + 0.85 + 0.12 * k, yaw: 0.5 * k - 0.4, pitch: 0.3 }, [0.55, 0.2, 0.5], C4E.woodShade, C4E.wood));
    },
    corps2,
  );
  // Le haut la relève : les deux poutres du toit tombé, couchées en long sur la table, parallèles.
  add(
    'ruine',
    0,
    (b) => {
      const T = TABLE;
      const y = planeY(T.x, T.z) + T.h + 0.04;
      for (const dz of [-0.22, 0.22]) b.beam({ x: 1.05, y: y + 0.11, z: T.z + dz }, { x: 3.85, y: y + 0.11, z: T.z + dz }, 0.22, C4E.woodShade);
    },
    haut,
  );

  // ---- Le corps 1 sur 2 : les murs remontés à leur pleine hauteur, assise par assise, et leur talus ; le seuil de pierre.
  add(0, 0, (b) => {
    walls(b, true);
    talus(b, true);
    const R = ROOM;
    b.box({ x: (R.x0 + R.x1) / 2, y: planeY(3, R.z1) - 0.1, z: R.z1 }, [R.x1 - R.x0, 0.18, 0.3], C4E.stoneShade, C4E.stoneSun);
  });
  // ---- Le corps 2 sur 2 : les casiers redressés et les vitrines debout, leurs cases pleines de pierres de formes
  // différentes ; la table de tri réparée, ses bacs en rang.
  add(0, 1 / 2, (b) => {
    for (const z of CASIERS.at) {
      casier(b, z, C4E.newShade, C4E.newWood);
      const g = planeY(CASIERS.x, z);
      const c = z > 2 ? 3 : 0;
      CASIERS.shelves.forEach((y, k) => {
        for (let s = 0; s < 2; s++) {
          const i = (2 * k + s + c) % CASED.sizes.length;
          sample(b, { x: CASIERS.x + 0.06, y: g + y + 0.06, z: z - 0.27 + 0.54 * s }, CASED.shapes[i], 0.3 + 0.9 * s, CASED.sizes[i], true);
        }
      });
    }
    for (const [k, x] of VITRINES.at.entries()) {
      vitrine(b, x, C4E.newShade, C4E.newWood);
      const g = planeY(x, VITRINES.z);
      for (let s = 0; s < 2; s++) sample(b, { x: x - 0.25 + 0.5 * s, y: g + VITRINES.y0 + 0.1, z: VITRINES.z }, (k + 2 * s + 1) % 4, 0.5, 1.3, true);
    }
    table(b, true);
  });
  // ---- Le haut : le toit à un pan de lauzes de basalte, sur ses poutres neuves, ses deux poteaux au sud et sa sablière ;
  // la lanterne du pignon, au poteau sud-est, allumée dès sa pose.
  add(1, 0, (b) => {
    const g = planeY(3, 2.5);
    const R = ROOF;
    sheet(
      b,
      [
        [R.x0, g + roofY(R.z0), R.z0],
        [R.x1, g + roofY(R.z0), R.z0],
        [R.x1, g + roofY(R.z1), R.z1],
        [R.x0, g + roofY(R.z1), R.z1],
      ],
      R.thick,
      C4E.basalt,
      C4E.basaltShade,
    );
    // Les rangs de lauzes : un trait plus clair en travers du pan.
    for (const z of [1.0, 2.3, 3.6]) {
      const y = g + roofY(z) + R.thick + 0.01;
      quadOut(b, [R.x0, y, z], [R.x1, y, z], [R.x1, y - 0.016, z + 0.08], [R.x0, y - 0.016, z + 0.08], [0, 1, 0], C4E.basaltSun);
    }
    for (const x of [1.6, 3.2, 4.6, POSTS[1]]) b.beam({ x, y: g + roofY(ROOM.z0) - 0.12, z: ROOM.z0 }, { x, y: g + roofY(POST_Z) - 0.12, z: POST_Z }, 0.18, C4E.newWood);
    const py = g + roofY(POST_Z) - 0.22;
    for (const x of POSTS) b.box({ x, y: planeY(x, POST_Z) - 0.1, z: POST_Z }, [0.22, py - planeY(x, POST_Z) + 0.1, 0.22], C4E.newShade, C4E.newWood);
    b.beam({ x: ROOM.x0 - 0.3, y: py + 0.1, z: POST_Z }, { x: ROOM.x1 + 0.1, y: py + 0.1, z: POST_Z }, 0.2, C4E.newShade);
    armLantern(b, POSTS[1] + 0.12, py - 0.35, POST_Z + 0.12, 0.7, 0.7, true);
  });
  // ---- Les abords : le seuil dallé et ses joints ; l'allée jusqu'au chemin ; le muret bas de pierres sèches qui retient la
  // pente ; les déblais en un tas net, au bord ; la lanterne de l'allée.
  add(2, 0, (b) => {
    const S = SEUIL;
    const f = (x: number, z: number): P3 => [x, planeY(x, z) + 0.04, z];
    quadOut(b, f(S.x0, S.z0), f(S.x1, S.z0), f(S.x1, S.z1), f(S.x0, S.z1), [0, 1, 0], C4E.paving);
    for (const x of [3.0, 4.5]) quadOut(b, f(x - 0.03, S.z0), f(x + 0.03, S.z0), f(x + 0.03, S.z1), f(x - 0.03, S.z1), [0, 1, 0], C4E.joint);
    const A = ALLEE;
    const len = Math.hypot(A.to.x - A.from.x, A.to.z - A.from.z);
    const nx = (-(A.to.z - A.from.z) / len) * A.half,
      nz = ((A.to.x - A.from.x) / len) * A.half;
    const a = (p: Vec2, s: number): P3 => [p.x + nx * s, SITE.ground(p.x + nx * s, p.z + nz * s) + 0.04, p.z + nz * s];
    quadOut(b, a(A.from, -1), a(A.to, -1), a(A.to, 1), a(A.from, 1), [0, 1, 0], C4E.paving);
    const M = MURET;
    const top = (z: number) => Math.max(SITE.ground(M.x - 0.9, z), planeY(0.5, z)) + 0.25;
    wallRun(b, false, M.x, M.z0, M.z1, M.thick, SINK, top(M.z0), top(M.z1), C4E.stoneShade, C4E.stone);
    const D = DEBLAIS;
    b.prism({ x: D.x, y: SITE.ground(D.x, D.z) - 0.05, z: D.z, yaw: 0.3 }, 0.8, 0.35, 0.6, 5, C4E.stoneShade, C4E.stone);
    const p = PATH_LANTERN;
    postLantern(b, p.x, SITE.ground(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 4) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  roots: { x: TABLE.x - 0.8, z: TABLE.z + TABLE.d / 2 + 0.12 },
  meaning: { x: TABLE.x - TABLE.w / 2 - 0.3, z: TABLE.z + 0.3 },
  nuances: { x: 5.1, z: 1.1 },
  conjunctions: { x: ROOM.x0 - ROOM.wall / 2, z: ROOM.stub.z1 - 0.3 },
} as const;

/** Un tamis de bois rond, debout contre le pied de la table (Racines). */
function sieve(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.roots;
    l.prism({ x, y: planeY(x, z) + 0.32, z, pitch: Math.PI / 2 - 0.15 }, 0.3, 0.3, 0.08, 8, C4E.newShade, C4E.newWood);
  });
}

/** Une sacoche de toile brune, sur un tabouret au bout de la table (Sens). */
function satchelOnStool(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.meaning;
    const g = planeY(x, z);
    l.box({ x, y: g - 0.05, z }, [0.1, 0.55, 0.1], C4E.newShade);
    l.box({ x, y: g + 0.5, z }, [0.4, 0.06, 0.4], C4E.newShade, C4E.newWood);
    l.box({ x, y: g + 0.56, z, yaw: 0.3 }, [0.34, 0.24, 0.18], C.satchel, C.satchelTop);
  });
}

/** Un pic de géologue et un burin, debout côte à côte dans un billot, avec un écart (Nuances). */
function pickAndChisel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.nuances;
    const g = planeY(x, z);
    l.prism({ x, y: g - 0.05, z }, 0.3, 0.28, 0.55, 7, C4E.woodShade, C4E.newWood);
    const y = g + 0.5;
    l.box({ x: x - 0.1, y, z }, [0.05, 0.75, 0.05], C4E.newShade, C4E.newWood);
    l.box({ x: x - 0.1, y: y + 0.72, z }, [0.34, 0.07, 0.07], C4E.iron, C4E.ironTop);
    l.box({ x: x + 0.14, y, z: z + 0.04 }, [0.05, 0.42, 0.05], C4E.iron, C4E.ironTop);
  });
}

/** Un casque de fer sombre, sans lampe, posé sur l'angle sud du mur ouest (Liens). */
function helmet(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.conjunctions;
    const y = planeY(ROOM.x0, z) + ROOM.stub.h - 0.08;
    l.prism({ x, y, z }, 0.26, 0.26, 0.03, 8, C4E.iron, C4E.ironTop);
    l.prism({ x, y: y + 0.03, z }, 0.19, 0.11, 0.17, 6, C4E.iron, C4E.ironTop);
  });
}

/**
 * Les quatre traces d'aujourd'hui, chacune avec sa partie (2 + 1 + 1) ; attachées à leur mission, jamais à leur rang : si
 * la cinquième mission s'écrit, seules leurs étapes et leurs rangées changent.
 */
const TRACES = {
  'word-roots': { at: TRACE_SPOTS.roots, lift: 1, stage: 0, row: 0, draw: sieve },
  meaning: { at: TRACE_SPOTS.meaning, lift: 1, stage: 0, row: 1 / 2, draw: satchelOnStool },
  nuances: { at: TRACE_SPOTS.nuances, lift: 1, stage: 1, row: 0, draw: pickAndChisel },
  conjunctions: { at: TRACE_SPOTS.conjunctions, lift: 1, stage: 2, row: 0, draw: helmet },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (intention, § 4) : au sud-ouest, par le côté sud ouvert, le mur ouest à droite. */
const SCENE_START = capOf(225);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la géologue). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/**
 * Le milieu de la scène, depuis le centre du lieu : au bord sud du toit, la géologue dessous, devant la table, Kéo sur la
 * terre au-delà du seuil ; assez au sud-est pour que la caméra, au nord-est, voie la géologue par le côté est ouvert et
 * sous le toit, jamais à travers le mur du fond (son regard passe au-delà du bout est du mur). Retouche 1 : le milieu
 * glisse de 0,6 vers l'est (et de 0,15 en z) et l'écart se resserre, pour que la géologue sorte de derrière le pied de la
 * loupe et les tréteaux, entière et loin du bord droit de l'image.
 */
const SCENE_SPOT = { dx: 4.5, dz: 5.75, half: [1.8, 1.0] as [number, number] } as const;

/** L'écart de Kéo et de la géologue au milieu de la scène. */
const SCENE_HALF = 1.6;

/** La hauteur du sol de la scène au-dessus de son point : la terre battue de la salle. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.02));

/** La géologue en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier brun-gris, chemise. */
function geologist(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.24, 0.42, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche des galets sur ses tréteaux : sa hauteur, à l'échelle 1 ; un galet choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.3, stone: 0.2 } as const;

/** Un galet gris à facettes, tous de la même taille et de la même forme (les formes variées restent aux casiers). */
function pebble(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw: 0.3 }, 0.18 * s, 0.12 * s, 0.17 * s, 5, C.sample, C.sampleTop);
}

export const ROCHES: PlaceArt = {
  role: 'La géologue',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 2 + 1 + 1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la table, les casiers et le pied de la loupe sont au lieu ; les abords (./rochesSurroundings.ts)
  // ajoutent ce qui cadre. Il reste la géologue en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) geologist(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.stone, half: 0.3 },
    facing: true,
    // Une planche sur deux tréteaux, sous la rangée des galets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.5 * s], C4E.newShade, C4E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.45 * s], C4E.newShade);
      }
    },
    object(b, at, s, _i, _count, picked) {
      pebble(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la salle.
  exit: { x: SITE.door.x - 0.9, z: SITE.door.z - 0.3 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan des Roches, pour les tests et ses abords : la salle, ses meubles, le toit, la caméra. */
export const ROCHES_LAYOUT = {
  room: ROOM,
  roof: ROOF,
  casiers: CASIERS,
  vitrines: VITRINES,
  table: TABLE,
  loupe: LOUPE,
  seuil: SEUIL,
  allee: ALLEE,
  planeY,
  pathLantern: PATH_LANTERN,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
