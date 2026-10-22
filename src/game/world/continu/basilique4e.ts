// La Basilique (les Coteaux du 4e, GD-24 ; intention du directeur artistique du 22 octobre 2026, § 7) : « un temple de
// basalte que les Passeurs ont relevé sous une halle de bois, pour s'y retrouver à l'abri ». Sur le gabarit de l'Étalon
// (./etalon4e.ts), avec le kit commun des Coteaux (./place4eKit.ts). Huit colonnes rondes de basalte chaud, en deux rangs
// de quatre d'ouest en est (des fûts lisses à dix pans, jamais six : c'est la forme des Orgues), chacune sur sa base
// carrée nue sous son dé carré nu ; le pavement de pierre grise à joints ; au milieu de la nef, la fontaine : un bassin
// rectangulaire de pierre et le pilier qui porte le bec, et sur le pilier le signe de l'absence du 4e, le support de fer
// vide et ses deux goujons nus (la vasque, prise par les Ferrailleurs), avant comme après ; au-dessus, la halle de bois
// ouverte, quatre fermes, une sur chaque paire de colonnes, ses pannes et son toit de tôle à deux pans, haute de 7 au
// plus, sans aucun mur : on voit le large entre les colonnes. Rien ne dit Rome ni la Grèce.
//
// La place : la porte est à l'est ; ses deux chemins en partent, vers `cot-2` au nord-est et vers `cot-3` au
// nord-ouest. Le second passe en biais au nord du centre : la nef est tirée vers l'ouest, son bout est à 1,5 du centre,
// pour que le chemin longe la halle sans y entrer, et l'arrivée regarde la nef dans son axe.
//
// La ruine : le pavement soulevé par endroits, une dalle dressée de biais, une autre soulevée ; cinq colonnes debout, de
// même hauteur, dont les deux de l'ouest ; une cassée à mi-hauteur ; deux couchées sur le pavement, parallèles, en deux
// tambours chacune ; de la halle, la seule ferme ouest, debout sur ses deux colonnes, et deux poutres couchées à plat au
// pied des colonnes couchées ; le bassin sec et fendu, le bec bouché de terre. Une seule lumière, la lanterne de la
// sculptrice, pendue à la ferme ouest. Trois parties (1 + 1 + 1) : le corps (le pavement remis à plat, les huit colonnes
// debout), le haut (la halle et la lanterne de la ferme est), les abords (la fontaine, le parvis dallé, la lanterne du
// chemin). Lieu d'option (comme l'Oracle au 5e) : une trace par rang, la même pour le latin et le grec. Aucune lueur,
// rien d'orange, rien à lire, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C4E, SINK, capOf, emptyMount, groundPlane4e, inWorld, lantern, once, postLantern, quadOut, sceneRight, sceneRise, sheet, site4e, wallRun } from './place4eKit';

/**
 * Les couleurs propres à la Basilique, en plus des matières des Passeurs (`C4E`) : le fond sec du bassin et la terre
 * qui bouche le bec ; l'eau sombre, immobile, et son filet ; le gris-beige lisse de l'amphore ; le chanvre de la corde.
 */
const C = {
  // Le basalte des fûts et de leurs tambours (retouche 2) : le basalte du 4e (`C4E.basalt`, #4A4240) devenait presque
  // noir à l'ombre ; éclairci jusqu'à ce que sa face la plus sombre, à l'écran, ne passe jamais sous #4A4240 (un test le
  // vérifie sous la lumière du 4e). Toujours chaud et mat.
  shaft: 0x8e827a,
  shaftTop: 0x988c84,
  dryBottom: 0x6e625a,
  water: 0x34505e,
  stream: 0x6e8a96,
  amphora: 0xa89c88,
  amphoraTop: 0xb4a894,
  rope: 0x9a8a6c,
  // La sculptrice, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de cuir, chemise grise.
  boots: 0x55595a,
  apron: 0x7a6a5a,
  shirt: 0x9a948a,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site4e('basilique');

/** Le plan du sol, ajusté sous la nef, son parvis et ses colonnes couchées : la plaine est plate ici (à 0,2 près). */
const planeY = groundPlane4e(SITE.ground, [-11.5, 6.5], [-5, 5]);

/**
 * La nef : les colonnes (x d'ouest en est, z des deux rangs), le rayon d'un fût et ses dix pans, la base et le dé (leur
 * côté, leur hauteur), le haut du fût ; la halle au-dessus : le débord du toit (au-delà des colonnes, en x et en z), le
 * faîtage, la section des fermes et des pannes.
 */
const NEF = {
  xs: [-9.5, -6, -2.5, 1],
  zs: [-2.3, 2.3],
  r: 0.36,
  sides: 10,
  base: { side: 0.95, h: 0.3 },
  die: { side: 0.9, h: 0.28 },
  shaft: 3.7,
  over: { x: 1.4, z: 0.9 },
  ridge: 6.8,
  beam: 0.2,
} as const;

/** Le pavement : son emprise (x d'ouest en est, z du nord au sud ; plus étroit au nord, le long du chemin), son épaisseur au-dessus du sol. */
const PAVE = { x0: -11.3, x1: 1.5, z0: -2.95, z1: 3.2, h: 0.18 } as const;

/** Le dessus du pavement, plat : le sol de la nef. */
const floorY = once(() => Math.max(...[PAVE.x0, PAVE.x1].flatMap((x) => [PAVE.z0, PAVE.z1].map((z) => planeY(x, z)))) + PAVE.h);

/** Le haut des fûts et le dessus des dés : le pied des fermes. */
const topY = once(() => floorY() + NEF.base.h + NEF.shaft + NEF.die.h);

/** La fontaine, au milieu de la nef : le bassin (son milieu, sa longueur d'ouest en est, sa largeur, sa hauteur) et le pilier du bec, à son bout ouest. */
const FOUNTAIN = { x: -4.25, z: 0, len: 2.4, w: 1.3, h: 0.5, wall: 0.18, pillar: { x: -5.7, side: 0.42, h: 1.45, bec: 1.1 } } as const;

/** Le parvis dallé (les abords), à l'est de la nef, devant la porte ; il laisse le chemin libre. */
const PARVIS = { x0: 1.5, x1: 5.4, z0: 0.2, z1: 3.4 } as const;

/** La lanterne du chemin (les abords), au bord est du parvis. */
const PATH_LANTERN = { x: 5.0, z: 3.0, h: 1.35 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (intention, « Les caps ») : 270°, de la porte à l'est, la nef dans son axe, le large au fond. */
const DOOR_VIEW = capOf(270);

/** La vue d'arrivée basse, à hauteur de Kéo (comme aux Fabriques). */
const DOOR_FRAME = { height: -3, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du faîtage, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: -4.25,
  get y() {
    return floorY() + NEF.ridge + 1.2;
  },
  z: 0,
};

// ---------- Les colonnes ----------

/** Une colonne debout : sa base carrée nue, son fût lisse à dix pans (haut de `shaft`), son dé carré nu (`die`). */
function column(b: FacetBuilder, x: number, z: number, shaft: number, die: boolean): void {
  const N = NEF;
  b.box({ x, y: floorY() - 0.1, z }, [N.base.side, N.base.h + 0.1, N.base.side], C4E.stoneShade, C4E.stone);
  b.prism({ x, y: floorY() + N.base.h, z, yaw: Math.PI / N.sides }, N.r, N.r, shaft, N.sides, C.shaft, C.shaftTop);
  if (die) b.box({ x, y: floorY() + N.base.h + shaft, z }, [N.die.side, N.die.h, N.die.side], C4E.stoneShade, C4E.stoneSun);
}

/** Un tambour de colonne couché au pied de la nef, d'ouest en est, depuis `x` (son bout ouest), long de `len`. */
function drum(b: FacetBuilder, x: number, z: number, len: number): void {
  b.prism({ x, y: planeY(x + len / 2, z) + NEF.r * 0.9, z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, NEF.r, NEF.r, len, NEF.sides, C.shaft);
}

// ---------- La halle ----------

/** Une ferme de bois sur la paire de colonnes de `x` : l'entrait, les deux arbalétriers, le poinçon. */
function truss(b: FacetBuilder, x: number, color: number): void {
  const N = NEF;
  const z = N.zs[1] + N.over.z;
  const y = topY() + N.beam / 2;
  b.beam({ x, y, z: -z }, { x, y, z }, N.beam, color);
  for (const s of [-1, 1]) b.beam({ x, y: y + 0.05, z: s * z }, { x, y: floorY() + N.ridge - 0.12, z: 0 }, N.beam, color);
  b.beam({ x, y, z: 0 }, { x, y: floorY() + N.ridge - 0.12, z: 0 }, N.beam * 0.8, color);
}

/** La hauteur du dessous du toit à `z` du faîtage (les arbalétriers). */
const roofAt = (z: number): number => {
  const N = NEF;
  const half = N.zs[1] + N.over.z;
  return floorY() + N.ridge - 0.02 - (Math.abs(z) / half) * (N.ridge - 0.02 - (topY() - floorY() + N.beam));
};

/** La halle : les quatre fermes, les pannes (le faîtage, une au milieu de chaque pan, une à chaque bas), le toit de tôle. */
function hall(b: FacetBuilder): void {
  const N = NEF;
  for (const x of N.xs) truss(b, x, C4E.newShade);
  const x0 = N.xs[0] - N.over.x,
    x1 = N.xs[3] + N.over.x;
  const half = N.zs[1] + N.over.z;
  for (const z of [0, -half / 2, half / 2, -half + 0.15, half - 0.15]) {
    const y = roofAt(z) - N.beam / 2 + 0.02;
    b.beam({ x: x0, y, z }, { x: x1, y, z }, N.beam * 0.8, C4E.newShade);
  }
  for (const s of [-1, 1]) {
    const lo = roofAt(half) + 0.1,
      hi = roofAt(0) + 0.1;
    sheet(
      b,
      [
        [x0, lo, s * (half + 0.1)],
        [x1, lo, s * (half + 0.1)],
        [x1, hi, 0],
        [x0, hi, 0],
      ],
      0.05,
      C4E.sheet,
      C4E.sheetUnder,
    );
  }
}

/** Une lanterne pendue sous l'entrait de la ferme de `x`, à `z` du faîtage. */
function trussLantern(b: FacetBuilder, x: number, z: number): void {
  lantern(b, { x, y: topY(), z }, true);
}

// ---------- Le pavement, la fontaine ----------

/** Le pavement de pierre grise et ses joints, d'ouest en est et en travers. */
function pavement(b: FacetBuilder): void {
  const P = PAVE;
  b.box({ x: (P.x0 + P.x1) / 2, y: SINK, z: (P.z0 + P.z1) / 2 }, [P.x1 - P.x0, floorY() - SINK, P.z1 - P.z0], C4E.stoneShade, C4E.paving);
  const y = floorY() + 0.01;
  for (const z of [-1.6, 0, 1.6]) quadOut(b, [P.x0, y, z - 0.03], [P.x1, y, z - 0.03], [P.x1, y, z + 0.03], [P.x0, y, z + 0.03], [0, 1, 0], C4E.joint);
  for (let x = P.x0 + 1.75; x < P.x1 - 0.5; x += 1.75) quadOut(b, [x - 0.03, y, P.z0], [x + 0.03, y, P.z0], [x + 0.03, y, P.z1], [x - 0.03, y, P.z1], [0, 1, 0], C4E.joint);
}

/** Le bassin : ses quatre murets, entiers (les abords) ou le muret sud fendu, un éclat tombé (la ruine) ; son fond. */
function basin(b: FacetBuilder, whole: boolean): void {
  const F = FOUNTAIN;
  const x0 = F.x - F.len / 2,
    x1 = F.x + F.len / 2;
  const z0 = F.z - F.w / 2,
    z1 = F.z + F.w / 2;
  const top = floorY() + F.h;
  wallRun(b, true, z0 + F.wall / 2, x0, x1, F.wall, floorY() - 0.05, top, top, C4E.stoneShade, C4E.stoneSun);
  for (const x of [x0 + F.wall / 2, x1 - F.wall / 2]) wallRun(b, false, x, z0 + F.wall, z1 - F.wall, F.wall, floorY() - 0.05, top, top, C4E.stoneShade, C4E.stoneSun);
  if (whole) wallRun(b, true, z1 - F.wall / 2, x0, x1, F.wall, floorY() - 0.05, top, top, C4E.stoneShade, C4E.stoneSun);
  else {
    // Fendu : deux morceaux, l'un affaissé ; l'éclat sur le pavement.
    wallRun(b, true, z1 - F.wall / 2, x0, F.x - 0.1, F.wall, floorY() - 0.05, top, top - 0.1, C4E.stoneShade, C4E.stoneSun);
    wallRun(b, true, z1 - F.wall / 2 + 0.04, F.x + 0.05, x1, F.wall, floorY() - 0.12, top - 0.22, top - 0.08, C4E.stoneShade, C4E.stone);
    b.box({ x: F.x + 0.2, y: floorY(), z: z1 + 0.45, yaw: 0.5 }, [0.35, 0.18, 0.25], C4E.stoneShade, C4E.stone);
  }
}

/** Le pilier du bec, au bout ouest du bassin, et sur lui le support vide de la vasque : toujours là. */
function pillar(b: FacetBuilder): void {
  const P = FOUNTAIN.pillar;
  b.box({ x: P.x, y: floorY() - 0.05, z: FOUNTAIN.z }, [P.side, P.h + 0.05, P.side], C4E.stoneShade, C4E.stoneSun);
  emptyMount(b, { x: P.x, y: floorY() + P.h, z: FOUNTAIN.z }, 0);
}

/** Le bec, vers l'est, sur le pilier : bouché de terre (la ruine) ou débouché, son filet d'eau tombé droit dans le bassin (les abords). */
function bec(b: FacetBuilder, open: boolean): void {
  const P = FOUNTAIN.pillar;
  const y = floorY() + P.bec;
  const x = P.x + P.side / 2 + 0.16;
  b.box({ x, y, z: FOUNTAIN.z }, [0.34, 0.1, 0.12], C4E.stoneShade, C4E.stone);
  if (!open) {
    b.box({ x: x + 0.17, y: y - 0.02, z: FOUNTAIN.z }, [0.1, 0.13, 0.15], C4E.earth, C4E.earthTop);
    return;
  }
  // Le filet, fixe, du bec à l'eau.
  const water = floorY() + FOUNTAIN.h - 0.12;
  b.box({ x: x + 0.15, y: water, z: FOUNTAIN.z }, [0.05, y - water, 0.06], C.stream);
}

// ---------- Le modèle ----------

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };
  const N = NEF;
  const [xa, xb, xc, xd] = N.xs,
    [zn, zs] = N.zs;

  // Toujours là : le pavement ; cinq colonnes debout, de même hauteur, dont les deux de l'ouest ; la ferme ouest sur
  // elles, et sous elle la lanterne de la sculptrice (la seule allumée de la ruine) ; le pilier du bec et le support vide.
  add('ruine', 0, (b) => {
    pavement(b);
    for (const [x, z] of [
      [xa, zn],
      [xa, zs],
      [xb, zn],
      [xc, zs],
      [xd, zn],
    ] as const)
      column(b, x, z, N.shaft, true);
    truss(b, xa, C4E.woodShade);
    trussLantern(b, xa, -0.9);
    pillar(b);
  });

  // ---- La ruine ----
  // Le corps la relève : la colonne du sud-est cassée à mi-hauteur ; les deux couchées sur le pavement, parallèles, en
  // deux tambours chacune ; la dalle dressée de biais, l'autre soulevée.
  add(
    'ruine',
    0,
    (b) => {
      column(b, xd, zs, N.shaft * 0.5, false);
      b.box({ x: xd + 0.15, y: floorY() + N.base.h + N.shaft * 0.5 - 0.1, z: zs, yaw: 0.4, pitch: 0.25 }, [0.5, 0.2, 0.45], C.shaft);
      for (const [x, z] of [
        [xb - 1.4, zs + 1.0],
        [xc - 2.1, zn - 1.0],
      ] as const) {
        drum(b, x, z, 1.7);
        drum(b, x + 1.85, z + 0.06, 1.6);
      }
      b.box({ x: -7.8, y: floorY() - 0.25, z: 1.0, yaw: 0.3, pitch: 0.6 }, [1.2, 0.18, 0.9], C4E.joint, C4E.paving);
      b.box({ x: -1.2, y: floorY() - 0.05, z: -1.1, yaw: -0.2, pitch: 0.12 }, [1.1, 0.16, 0.9], C4E.joint, C4E.paving);
    },
    corps,
  );
  // Le haut la relève : deux poutres couchées à plat au pied des colonnes couchées.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, len, yaw] of [
        [xb + 0.4, zs + 1.75, 4.0, 0.05],
        [xc - 0.9, zn - 1.65, 3.4, -0.06],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.04, z, yaw }, [len, N.beam, N.beam * 1.2], C4E.woodShade, C4E.wood);
    },
    haut,
  );
  // Les abords la relèvent : le bassin sec et fendu, le bec bouché de terre.
  add(
    'ruine',
    0,
    (b) => {
      basin(b, false);
      const F = FOUNTAIN;
      quadOut(b, [F.x - F.len / 2, floorY() + 0.02, F.z - F.w / 2], [F.x + F.len / 2, floorY() + 0.02, F.z - F.w / 2], [F.x + F.len / 2, floorY() + 0.02, F.z + F.w / 2], [F.x - F.len / 2, floorY() + 0.02, F.z + F.w / 2], [0, 1, 0], C.dryBottom);
      bec(b, false);
    },
    abords,
  );

  // ---- Le corps : le pavement remis à plat (les dalles dressées parties) ; les trois colonnes relevées, leurs tambours
  // remontés, leurs dés posés : les huit debout.
  add(0, 0, (b) => {
    for (const [x, z] of [
      [xb, zs],
      [xc, zn],
      [xd, zs],
    ] as const)
      column(b, x, z, N.shaft, true);
  });
  // ---- Le haut : la halle (les trois autres fermes de bois neuf, les pannes, le toit de tôle à deux pans) ; la
  // lanterne de la halle, à la ferme est, qui s'allume.
  add(1, 0, (b) => {
    hall(b);
    trussLantern(b, xd, 0.9);
  });
  // ---- Les abords : la fontaine (le bec débouché, le bassin réparé et plein d'une eau sombre, immobile) ; le parvis
  // dallé ; la lanterne du chemin, au bord est du parvis.
  add(2, 0, (b) => {
    basin(b, true);
    const F = FOUNTAIN;
    const w = floorY() + F.h - 0.12;
    quadOut(b, [F.x - F.len / 2, w, F.z - F.w / 2], [F.x + F.len / 2, w, F.z - F.w / 2], [F.x + F.len / 2, w, F.z + F.w / 2], [F.x - F.len / 2, w, F.z + F.w / 2], [0, 1, 0], C.water);
    bec(b, true);
    const P = PARVIS;
    b.box({ x: (P.x0 + P.x1) / 2, y: SINK, z: (P.z0 + P.z1) / 2 }, [P.x1 - P.x0, floorY() - 0.04 - SINK, P.z1 - P.z0], C4E.stoneShade, C4E.paving);
    const y = floorY() - 0.03;
    quadOut(b, [P.x0, y, 1.8], [P.x1, y, 1.8], [P.x1, y, 1.86], [P.x0, y, 1.86], [0, 1, 0], C4E.joint);
    const L = PATH_LANTERN;
    postLantern(b, L.x, planeY(L.x, L.z), L.z, L.h, true);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 7) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  home: { x: NEF.xs[0] + 0.15, z: NEF.zs[1] + 0.72 },
  forum: { x: (NEF.xs[0] + NEF.xs[1]) / 2, z: NEF.zs[0] - 0.2 },
  sea: { x: NEF.xs[3] + 0.85, z: NEF.zs[1] + 0.3 },
} as const;

/** Une amphore lisse gris-beige, sans décor, debout dans son support de fer, contre la colonne du sud-ouest (le chez-soi). */
function amphora(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.home;
    const y = floorY();
    for (const [dx, dz] of [
      [-0.2, -0.2],
      [0.2, -0.2],
      [0, 0.22],
    ] as const)
      l.box({ x: x + dx, y, z: z + dz }, [0.04, 0.34, 0.04], C4E.iron);
    l.prism({ x, y: y + 0.08, z }, 0.06, 0.24, 0.32, 7, C.amphora, C.amphora);
    l.prism({ x, y: y + 0.4, z }, 0.24, 0.1, 0.42, 7, C.amphora, C.amphoraTop);
  });
}

/** Un maillet rond et une gradine, debout côte à côte dans un billot, avec un écart (la place publique). */
function malletAndChisel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.forum;
    const y = floorY();
    l.prism({ x, y, z }, 0.3, 0.28, 0.45, 7, C4E.newShade, C4E.newWood);
    l.box({ x: x - 0.12, y: y + 0.45, z }, [0.05, 0.4, 0.05], C4E.newShade, C4E.newWood);
    l.prism({ x: x - 0.12, y: y + 0.85, z }, 0.11, 0.11, 0.18, 7, C4E.newShade, C4E.newWood);
    l.box({ x: x + 0.13, y: y + 0.45, z }, [0.04, 0.5, 0.04], C4E.iron, C4E.ironTop);
  });
}

/** Une corde lovée sur une dalle, au pied de la colonne du sud-est (la mer). */
function coiledRope(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.sea;
    l.box({ x, y: floorY() - 0.06, z }, [0.8, 0.08, 0.7], C4E.joint, C4E.paving);
    l.annulus({ x, y: floorY() + 0.02, z }, 0.12, 0.27, 0.1, 8, C.rope, C.rope, false);
    l.annulus({ x, y: floorY() + 0.12, z }, 0.1, 0.22, 0.08, 8, C.rope, C.rope, false);
  });
}

/** Les trois traces, une par rang de mission, chacune avec sa partie : la même pour le latin et le grec. */
const RANKS = {
  home: { at: TRACE_SPOTS.home, lift: 1, stage: 0, row: 0, draw: amphora },
  forum: { at: TRACE_SPOTS.forum, lift: 1.2, stage: 1, row: 0, draw: malletAndChisel },
  sea: { at: TRACE_SPOTS.sea, lift: 0.8, stage: 2, row: 0, draw: coiledRope },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/** Les missions de chaque rang, en latin et en grec (au rang 2, le forum et l'agora). */
export const BASILIQUE_RANKS = {
  home: ['la-home', 'gr-home'],
  forum: ['la-forum', 'gr-agora'],
  sea: ['la-mediterranean', 'gr-mediterranean'],
} as const satisfies Record<keyof typeof RANKS, readonly [string, string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (intention, § 7) : à l'ouest, le large entre deux colonnes. */
const SCENE_START = capOf(270);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la sculptrice) : le nord. */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : sous la halle, entre la fontaine et le bout est de la nef. */
const SCENE_SPOT = { dx: -0.9, dz: 0, half: [1.4, 1.6] as [number, number] } as const;

/** L'écart de Kéo et de la sculptrice au milieu de la scène : chacun entre la fontaine et un rang de colonnes. */
const SCENE_HALF = 1.6;

/** La hauteur du sol de la scène au-dessus de son point : le pavement. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, floorY()));

/** La sculptrice en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier de cuir, chemise grise. */
function sculptor(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.24, 0.42, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** L'établi de la sculptrice, sous le rang des blocs : sa hauteur, à l'échelle 1 ; un bloc choisi se soulève d'un cran. */
const BENCH = { height: 0.6, lift: 0.3, block: 0.3 } as const;

/** Un bloc de pierre taillée, un cube nu, tous pareils (une forme par réponse se lirait comme un indice). */
function block(b: FacetBuilder, at: Vec3, s: number): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [BENCH.block * s, BENCH.block * s, BENCH.block * s], C4E.stone, C4E.stoneSun);
}

export const BASILIQUE: PlaceArt = {
  role: 'La sculptrice',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 1 + 1 + 1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 2.8, bottom: -0.5, top: 2.6, depth: 0.3 },
    // Basse : sous la halle, la caméra passe sous le bas du toit.
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : deux colonnes, le bassin et le pavement sont au lieu ; les abords (./basiliqueSurroundings.ts)
  // ajoutent ce qui cadre. Il reste la sculptrice en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) sculptor(b, at, sphere);
  },
  answer: {
    size: { height: BENCH.height + BENCH.lift + BENCH.block, half: 0.3 },
    facing: true,
    // L'établi de bois sur deux pieds, sous le rang des blocs.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BENCH.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.6 * s], C4E.newShade, C4E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.14, top - 0.1 * s - foot, 0.5 * s], C4E.newShade);
      }
    },
    // Un bloc taillé, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      block(b, { x: at.x, y: at.y + (BENCH.height + (picked ? BENCH.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les six missions : le pavement seul, rien de l'item ; les blocs portent les réponses.
  rest() {},
  traces: Object.fromEntries((Object.keys(BASILIQUE_RANKS) as (keyof typeof BASILIQUE_RANKS)[]).flatMap((rank) => BASILIQUE_RANKS[rank].map((m) => [m, RANKS[rank]]))),
  // Kéo au retour : au pas de la porte, tourné vers la nef.
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.5 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Basilique, pour les tests et ses abords : la nef, la halle, la fontaine, le parvis, la caméra. */
export const BASILIQUE_LAYOUT = {
  nef: NEF,
  shaft: { side: C.shaft, top: C.shaftTop },
  pave: PAVE,
  get floor() {
    return floorY();
  },
  get top() {
    return topY();
  },
  fountain: FOUNTAIN,
  parvis: PARVIS,
  pathLantern: PATH_LANTERN,
  roofAt,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
