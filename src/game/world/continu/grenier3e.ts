// Le Grenier (le Versant du 3e, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 4, relecture des lieux du
// directeur artistique, et planche `selection-versant-v1`, vue de près graine 2026, de loin graine 42) : « on y montait
// les provisions, on les comptait, on les empilait et on les partageait ». Lieu du monde ouvert seulement (GD-24). Sur le
// gabarit du Belvédère (./belvedere3e.ts), avec le kit du 3e (./place3eKit.ts). Un grenier de bois gris sur six pieds de
// granit en champignon, son pignon au sud, face au chemin, sa porte et ses trois marches ; son toit d'ardoise raide sous
// un peu de neige ; la poutre de levage et sa poulie sous le faîte du pignon ; les sacs en carré au pied du mur et en cube
// sur une plate-forme ; les mesures de bois rondes emboîtables, de la plus grande à la plus petite, sur la longue table ;
// les casiers de partage, tous pareils ; la meule debout sous son petit toit sur quatre poteaux, à droite. Des sacs ronds,
// au col noué, jamais des caisses ((a) 9). Kéo s'arrête à gauche du grenier, qu'il voit de trois quarts, sa porte et ses
// marches à côté de lui, jamais derrière ((a) 5).
//
// La ruine, d'après le texte : le grenier debout sur ses pieds, le pan de son toit vu depuis la porte (à l'ouest) ouvert,
// ses chevrons à nu, trois lauzes tombées au pied (relecture du Versant par le directeur artistique, (a) 6), la porte qui
// pend ; les sacs éboulés en un tas mou ; les mesures renversées dans l'herbe ; les casiers penchés
// contre le mur ; la meule couchée à plat à côté de son bâti, le petit toit tombé. Une seule lumière, la lanterne du
// meunier, au crochet de la porte. Cinq parties (3 + 1 + 1) : le plancher, la porte et les marches ; les sacs rangés ;
// les mesures et les casiers ; le haut (le toit refait, la poutre et sa poulie, une lanterne) ; les abords (la meule
// sous son toit, le banc, la lanterne du chemin). Une trace par mission, avec sa partie. Rien à lire (la plaque au-dessus
// de la porte, sur les images, disparaît), aucune figure. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, habitant3e, postLantern3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, quadOut, sceneRight, sceneRise, sheet } from './place4eKit';

/**
 * Les couleurs propres au Grenier, en plus des matières des Passeurs (`C3E`) : la toile des sacs, au soleil et à l'ombre
 * (beige froid, jamais jaune) ; le creux sombre de la porte et des casiers ; le bois clair des mesures et leur dedans ;
 * l'osier du panier, le pain ; la blouse du meunier (un gris clair poudré).
 */
const C = {
  sack: 0xcfc5ae,
  sackShade: 0xb3a990,
  hollow: 0x6c645c,
  measure: 0xb39e82,
  measureIn: 0x8e7a62,
  wicker: 0xa88d66,
  bread: 0xc2945e,
  coat: 0xb9b6ae,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('grenier');

/** Le plan du sol sous le grenier, la meule et la cour : le replat est plat ici (à 0,1 près). */
const planeY = groundPlane4e(SITE.ground, [-6, 8], [-4, 6]);

/**
 * Le grenier : sa largeur (x), sa profondeur (z, du pignon nord au pignon sud), son milieu ; la hauteur de ses pieds en
 * champignon et de son plancher ; la hauteur de ses murs ; celle du faîte au-dessus des murs (un toit raide) ; le
 * débord du toit ; la porte (sa demi-largeur, sa hauteur).
 */
const G = { w: 4.2, d: 3.6, cx: 0, cz: -0.6, feet: 0.75, floor: 0.16, wall: 2.1, ridge: 2.1, eave: 0.4, door: 0.55, doorH: 1.6 } as const;

/** Le sol au pied du grenier, plat. */
const foot = once(() => Math.max(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => planeY(G.cx + (sx * G.w) / 2, G.cz + (sz * G.d) / 2)))));

/** Le dessus du plancher. */
const floorY = () => foot() + G.feet + G.floor;

/** Le pignon sud (la façade), en z. */
const FRONT = G.cz + G.d / 2;

/** Les six pieds en champignon, sous les angles et le milieu des longs côtés. */
const FEET: readonly Vec2[] = [-1, 0, 1].flatMap((i) => [-1, 1].map((sx) => ({ x: G.cx + (sx * (G.w / 2 - 0.3)), z: G.cz + i * (G.d / 2 - 0.3) })));

/**
 * Les sacs : le carré au pied du mur, à gauche de la porte ; la plate-forme du cube, à droite. Un sac : son rayon (un
 * tronc à six pans, les angles arrondis), sa hauteur, et son col noué ; `step`, l'écart de deux sacs rangés.
 */
const SACKS = { square: { x: -1.5, z: FRONT + 0.75 }, cube: { x: 3.4, z: 0.9 }, r: 0.29, h: 0.42, neck: 0.1, step: 0.58 } as const;

/** La longue table des mesures, à l'ouest du grenier, du nord au sud ; ses mesures, de la plus grande à la plus petite. */
const TABLE = { x: -3.6, z: -0.6, len: 3.0, w: 0.8, h: 0.8, measures: [0.34, 0.27, 0.21, 0.15] as const } as const;

/** Les casiers de partage, tous pareils, sur leur banc bas contre le mur est. */
const BINS = { x: G.cx + G.w / 2 + 0.45, z: -1.4, n: 3, size: 0.55 } as const;

/** La meule sous son petit toit, à droite (à l'est) : son milieu, son rayon, l'emprise et la hauteur de son toit. */
const MILL = { x: 5.8, z: -0.4, r: 0.8, t: 0.3, roof: { w: 2.4, d: 2.0, h: 2.1 } } as const;

/** Le banc de la cour, contre le pignon sud, à droite de la porte (les abords). */
const BENCH = { x: 1.6, z: FRONT + 0.55, len: 1.4, w: 0.42, h: 0.42 } as const;

/** La lanterne du chemin (les abords), au bord de la cour, hors du chemin. */
const PATH_LANTERN = { x: 2.6, z: 6.2, h: 1.4 } as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 4) : 30°, de la porte au sud ; le grenier de face, la meule à droite ; le zeppelin
 * entier dans le cadre, à gauche de la colonne des boutons (relecture des Prairies, (a) 4 : à 21°, il était coupé au bord
 * droit).
 */
const DOOR_VIEW = capOf(30);

/** La vue d'arrivée basse, à hauteur de Kéo. */
const DOOR_FRAME = { height: -2.5, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du faîte, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return floorY() + G.wall + G.ridge + 1;
  },
  z: G.cz,
};

// ---------- Les volumes ----------

/** Un pied en champignon : son fût de granit, son chapeau plus large. */
function mushroom(b: FacetBuilder, at: Vec2): void {
  const y = foot();
  b.prism({ x: at.x, y: y + SINK_3E, z: at.z }, 0.22, 0.17, G.feet - 0.14 - SINK_3E, 5, C3E.graniteShade, C3E.granite);
  b.prism({ x: at.x, y: y + G.feet - 0.14, z: at.z, yaw: 0.3 }, 0.42, 0.4, 0.14, 6, C3E.graniteShade, C3E.graniteSun);
}

/** Le corps du grenier : ses murs de bois gris, ses planches, le creux de sa porte. */
function body(b: FacetBuilder): void {
  const y = foot() + G.feet;
  b.box({ x: G.cx, y, z: G.cz }, [G.w, G.floor + G.wall, G.d], C3E.wood, C3E.woodShade);
  // Les planches du pignon, des joints debout (rien à lire).
  const zf = FRONT + 0.012;
  for (const x of [-1.5, -0.9, 0.9, 1.5]) quadOut(b, [x - 0.03, y + 0.1, zf], [x + 0.03, y + 0.1, zf], [x + 0.03, y + G.floor + G.wall - 0.05, zf], [x - 0.03, y + G.floor + G.wall - 0.05, zf], [0, 0, 1], C3E.woodShade);
  quadOut(b, [-G.door, floorY(), zf + 0.004], [G.door, floorY(), zf + 0.004], [G.door, floorY() + G.doorH, zf + 0.004], [-G.door, floorY() + G.doorH, zf + 0.004], [0, 0, 1], C.hollow);
}

/** Les deux pignons, de bois gris, sous le toit. */
function gables(b: FacetBuilder): void {
  const y = floorY() + G.wall;
  for (const [z, n] of [
    [FRONT, 1],
    [G.cz - G.d / 2, -1],
  ] as const)
    quadOut(b, [-G.w / 2, y, z], [G.w / 2, y, z], [0.001, y + G.ridge, z], [-0.001, y + G.ridge, z], [0, 0, n], C3E.wood);
}

/** Un pan du toit (`side` −1 : l'ouest, +1 : l'est), d'ardoise, et un peu de neige au faîte. */
function roofPan(b: FacetBuilder, side: -1 | 1): void {
  const y = floorY() + G.wall;
  const z0 = G.cz - G.d / 2 - G.eave,
    z1 = FRONT + G.eave;
  const ex = side * (G.w / 2 + G.eave);
  const ey = y - (G.eave * G.ridge) / (G.w / 2);
  const top = y + G.ridge;
  sheet(b, [[0, top, z0], [0, top, z1], [ex, ey, z1], [ex, ey, z0]], 0.12, C3E.slateTop, C3E.slate);
  const k = 0.35;
  sheet(b, [[0, top + 0.12, z0], [0, top + 0.12, z1], [ex * k, top + 0.12 - (top - ey) * k, z1], [ex * k, top + 0.12 - (top - ey) * k, z0]], 0.05, C3E.snow, C3E.slateTop);
}

/**
 * Le pan ouest ouvert (la ruine) : le faîtage, six chevrons à nu du faîte à l'avant-toit, une latte cassée ; on voit le
 * ciel entre eux depuis la porte.
 */
function bareRafters(b: FacetBuilder): void {
  const y = floorY() + G.wall;
  const top = y + G.ridge;
  const z0 = G.cz - G.d / 2 - G.eave + 0.1,
    z1 = FRONT + G.eave - 0.1;
  const out = G.eave * 0.6;
  const ex = -(G.w / 2 + out);
  const ey = y - (out * G.ridge) / (G.w / 2);
  b.beam({ x: 0, y: top, z: z0 }, { x: 0, y: top, z: z1 }, 0.16, C3E.woodShade);
  for (let k = 0; k < 6; k++) {
    const z = z0 + ((z1 - z0) * k) / 5;
    b.beam({ x: 0, y: top - 0.04, z }, { x: ex, y: ey, z }, 0.12, C3E.woodShade);
  }
  const mid = { x: ex * 0.55, y: top - (top - ey) * 0.55 + 0.08 };
  b.beam({ x: mid.x, y: mid.y, z: z0 }, { x: mid.x, y: mid.y - 0.05, z: z0 + (z1 - z0) * 0.45 }, 0.07, C3E.wood);
}

/** Les lauzes tombées du pan ouvert, au pied du mur ouest, entre lui et la table (la ruine). */
export const FALLEN_SLATES = [
  { x: -2.55, z: -1.0, yaw: 0.5, pitch: 0.12 },
  { x: -2.65, z: 0.4, yaw: 1.7, pitch: -0.1 },
  { x: -2.5, z: 1.25, yaw: 2.6, pitch: 0.18 },
] as const;

/** La poutre de levage sous le faîte du pignon sud, sa poulie et sa corde (le haut). */
function hoist(b: FacetBuilder): void {
  const y = floorY() + G.wall + G.ridge - 0.45;
  b.box({ x: 0, y, z: FRONT - 0.4 }, [0.2, 0.2, 1.4], C3E.woodShade, C3E.wood);
  b.drum({ x: 0.0, y: y - 0.25, z: FRONT + 0.6, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.18, 0.08, 8, C3E.iron, C3E.ironTop);
  b.beam({ x: 0.2, y: y - 0.26, z: FRONT + 0.6 }, { x: 0.2, y: floorY() + 0.4, z: FRONT + 0.6 }, 0.03, C.sackShade);
}

/** Les trois marches de granit devant la porte, et la porte fermée (le corps 1). */
function stepsAndDoor(b: FacetBuilder): void {
  for (let k = 0; k < 3; k++) {
    const h = ((3 - k) / 3) * (floorY() - foot());
    b.box({ x: 0, y: foot() - 0.2, z: FRONT + 0.25 + k * 0.32 }, [1.3, h + 0.2, 0.34], C3E.graniteShade, C3E.graniteSun);
  }
  b.box({ x: 0, y: floorY(), z: FRONT + 0.03 }, [2 * G.door, G.doorH, 0.06], C3E.woodShade, C3E.newWood);
}

/** La porte qui pend à un gond, en biais (la ruine). */
function hangingDoor(b: FacetBuilder): void {
  b.box({ x: -G.door - 0.2, y: floorY() - 0.25, z: FRONT + 0.45, yaw: -1.1, pitch: 0.12 }, [2 * G.door, G.doorH, 0.06], C3E.woodShade, C3E.wood);
}

/**
 * Un sac de toile, posé en (`x`, `y`, `z`), tourné de `yaw`, penché de `pitch` : un tronc à six pans, un peu plus étroit
 * en haut ; `neck` : son col noué au-dessus (la toile resserrée, le lien, le bout qui dépasse), sauf sous un autre sac.
 */
function sack(b: FacetBuilder, x: number, y: number, z: number, yaw = 0, pitch = 0, neck = true): void {
  const S = SACKS;
  b.prism({ x, y, z, yaw, pitch }, S.r, S.r * 0.86, S.h, 6, C.sackShade, C.sack);
  if (!neck) return;
  // Le col suit le sac : au bout de son axe (un quart de tour de `pitch` le couche).
  const up = { x: Math.sin(pitch) * Math.sin(yaw), y: Math.cos(pitch), z: Math.sin(pitch) * Math.cos(yaw) };
  const at = (d: number) => ({ x: x + up.x * d, y: y + up.y * d, z: z + up.z * d });
  b.prism({ ...at(S.h - 0.02), yaw, pitch }, S.r * 0.42, S.r * 0.26, S.neck, 5, C.sackShade, C.sack);
  b.prism({ ...at(S.h + S.neck - 0.03), yaw, pitch }, S.r * 0.32, S.r * 0.32, 0.04, 5, C3E.woodShade);
  b.prism({ ...at(S.h + S.neck + 0.01), yaw: yaw + 0.4, pitch }, S.r * 0.4, 0, 0.12, 5, C.sack);
}

/** Les sacs rangés : quatre en carré au pied du mur ; huit en cube sur une plate-forme de planches (le corps 2). */
function sacksStacked(b: FacetBuilder): void {
  const s = SACKS.step;
  const q = SACKS.square;
  for (const i of [-0.5, 0.5]) for (const k of [-0.5, 0.5]) sack(b, q.x + i * s, planeY(q.x, q.z), q.z + k * s);
  const c = SACKS.cube;
  const top = planeY(c.x, c.z) + 0.25;
  b.box({ x: c.x, y: top - 0.25, z: c.z }, [1.5, 0.25, 1.25], C3E.woodShade, C3E.wood);
  for (const i of [-0.5, 0.5]) for (const k of [-0.5, 0.5]) for (const j of [0, 1]) sack(b, c.x + i * s, top + j * (SACKS.h - 0.01), c.z + k * s, 0, 0, j === 1);
}

/** Le tas mou des sacs éboulés au pied du mur (la ruine). */
function sacksFallen(b: FacetBuilder): void {
  const q = SACKS.square;
  for (const [dx, dz, yaw, pitch, lift] of [
    [0, 0, 0.3, 1.35, 0.22],
    [0.6, 0.35, 1.2, 1.4, 0.22],
    [-0.45, 0.55, 2.1, 0.3, 0],
    [0.2, 0.15, 0.8, 1.3, 0.5],
  ] as const)
    sack(b, q.x + dx, planeY(q.x, q.z) + lift - 0.05, q.z + dz, yaw, pitch);
}

/** La longue table des mesures, sur quatre pieds. */
function table(b: FacetBuilder): void {
  const T = TABLE;
  const g = planeY(T.x, T.z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: T.x + sx * (T.w / 2 - 0.1), y: g - 0.2, z: T.z + sz * (T.len / 2 - 0.15) }, [0.12, T.h + 0.2, 0.12], C3E.woodShade);
  b.box({ x: T.x, y: g + T.h, z: T.z }, [T.w, 0.1, T.len], C3E.woodShade, C3E.wood);
}

/** Une mesure de bois ronde (un boisseau), son dedans plus sombre, de rayon `r`, posée en (`x`, `y`, `z`). */
function measure(b: FacetBuilder, x: number, y: number, z: number, r: number, pitch = 0, yaw = 0): void {
  b.prism({ x, y, z, pitch, yaw }, r, r * 1.04, r * 0.9, 8, C.measure, C.measureIn);
}

/** Les mesures rangées sur la table, de la plus grande (au nord) à la plus petite (le corps 3). */
function measuresInRow(b: FacetBuilder): void {
  const T = TABLE;
  const y = planeY(T.x, T.z) + T.h + 0.1;
  let z = T.z - T.len / 2 + 0.15;
  for (const r of T.measures) {
    z += r;
    measure(b, T.x, y, z, r);
    z += r + 0.12;
  }
}

/** Les mesures renversées dans l'herbe, à côté de la table (la ruine). */
function measuresFallen(b: FacetBuilder): void {
  const T = TABLE;
  for (const [k, [dx, dz, yaw]] of (
    [
      [-1.0, -0.6, 0.4],
      [-1.2, 0.5, 1.6],
      [-0.9, 1.4, 2.7],
    ] as const
  ).entries()) {
    const r = T.measures[k];
    measure(b, T.x + dx, planeY(T.x + dx, T.z + dz) + r, T.z + dz, r, Math.PI / 2, yaw);
  }
}

/** Les casiers de partage, tous pareils, sur leur banc bas (le corps 3), ou penchés contre le mur (la ruine). */
function bins(b: FacetBuilder, upright: boolean): void {
  const B = BINS;
  const g = planeY(B.x, B.z);
  if (upright) b.box({ x: B.x, y: g - 0.2, z: B.z }, [0.6, 0.55, B.n * (B.size + 0.08) + 0.1], C3E.graniteShade, C3E.granite);
  for (let i = 0; i < B.n; i++) {
    const z = B.z + (i - (B.n - 1) / 2) * (B.size + 0.08);
    if (upright) {
      b.box({ x: B.x, y: g + 0.35, z }, [B.size, B.size, B.size], C3E.woodShade, C3E.newWood);
      quadOut(b, [B.x + B.size / 2 + 0.005, g + 0.42, z - B.size / 2 + 0.07], [B.x + B.size / 2 + 0.005, g + 0.42, z + B.size / 2 - 0.07], [B.x + B.size / 2 + 0.005, g + 0.35 + B.size - 0.07, z + B.size / 2 - 0.07], [B.x + B.size / 2 + 0.005, g + 0.35 + B.size - 0.07, z - B.size / 2 + 0.07], [1, 0, 0], C.hollow);
    } else if (i < 2) b.box({ x: B.x + 0.1, y: g, z: z + 0.2 * i, yaw: 0.3 * i, pitch: 0.35 }, [B.size, B.size, B.size], C3E.woodShade, C3E.wood);
  }
}

/** Le bâti de la meule, toujours là : un socle de granit et ses deux montants de bois. */
function millFrame(b: FacetBuilder): void {
  const M = MILL;
  const g = planeY(M.x, M.z);
  b.box({ x: M.x, y: g - 0.2, z: M.z }, [0.9, 0.5, 1.2], C3E.graniteShade, C3E.granite);
  for (const s of [-1, 1]) b.box({ x: M.x, y: g + 0.3, z: M.z + s * 0.38 }, [0.16, 0.85, 0.12], C3E.woodShade, C3E.wood);
}

/** La meule debout dans son bâti, sous son petit toit d'ardoise sur quatre poteaux (les abords). */
function millUp(b: FacetBuilder): void {
  const M = MILL;
  const g = planeY(M.x, M.z);
  b.drum({ x: M.x - M.t / 2, y: g + 0.3 + M.r, z: M.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, M.r, M.t, 10, C3E.graniteShade, C3E.granite);
  const R = M.roof;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: M.x + (sx * R.w) / 2.4, y: g - 0.2, z: M.z + (sz * R.d) / 2.4 }, [0.16, R.h + 0.2, 0.16], C3E.woodShade, C3E.wood);
  b.gableRoof({ x: M.x, y: g + R.h, z: M.z, yaw: Math.PI / 2 }, R.d + 0.3, R.w + 0.3, 0.6, C3E.slate, C3E.woodShade);
}

/** La meule couchée à plat à côté de son bâti, le petit toit tombé dans l'herbe, deux poteaux debout (la ruine). */
function millFallen(b: FacetBuilder): void {
  const M = MILL;
  b.prism({ x: M.x + 1.4, y: planeY(M.x + 1.4, M.z + 0.6) - 0.05, z: M.z + 0.6 }, M.r, M.r, M.t, 10, C3E.graniteShade, C3E.granite);
  const R = M.roof;
  for (const sz of [-1, 1]) b.box({ x: M.x - R.w / 2.4, y: planeY(M.x, M.z) - 0.2, z: M.z + (sz * R.d) / 2.4 }, [0.16, R.h * 0.8 + 0.2, 0.16], C3E.woodShade, C3E.wood);
  b.box({ x: M.x + 0.5, y: planeY(M.x + 0.5, M.z - 1.6) - 0.1, z: M.z - 1.6, yaw: 0.4, pitch: 0.22 }, [R.w, 0.12, R.d * 0.7], C3E.slate, C3E.slateTop);
}

/** La lanterne du meunier, au crochet de la porte : la seule allumée de la ruine. */
function millerLantern(b: FacetBuilder): void {
  armLantern3e(b, G.door + 0.35, floorY() + G.doorH + 0.1, FRONT + 0.02, 0, 1, true);
}

/** Le banc de la cour, contre le pignon (les abords). */
function bench(b: FacetBuilder): void {
  const B = BENCH;
  const g = planeY(B.x, B.z);
  for (const s of [-1, 1]) b.box({ x: B.x + s * (B.len / 2 - 0.15), y: g - 0.1, z: B.z }, [0.18, B.h + 0.1, B.w - 0.08], C3E.graniteShade, C3E.granite);
  b.box({ x: B.x, y: g + B.h, z: B.z }, [B.len, 0.1, B.w], C3E.woodShade, C3E.wood);
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : les six pieds, le grenier debout, ses pignons, la moitié est de son toit ; la longue table ; le bâti
  // de la meule ; la lanterne du meunier, la seule allumée de la ruine.
  add('ruine', 0, (b) => {
    for (const f of FEET) mushroom(b, f);
    body(b);
    gables(b);
    roofPan(b, 1);
    table(b);
    millFrame(b);
    millerLantern(b);
  });
  // Le corps 1 relève la porte qui pend.
  add('ruine', 0, hangingDoor, corps1);
  // Le corps 2 relève le tas des sacs éboulés.
  add('ruine', 0, sacksFallen, corps2);
  // Le corps 3 relève les mesures renversées dans l'herbe et les casiers penchés.
  add(
    'ruine',
    0,
    (b) => {
      measuresFallen(b);
      bins(b, false);
    },
    corps3,
  );
  // Le haut relève les chevrons à nu du pan ouest et ses trois lauzes tombées au pied du mur.
  add(
    'ruine',
    0,
    (b) => {
      bareRafters(b);
      for (const s of FALLEN_SLATES) b.box({ x: s.x, y: planeY(s.x, s.z) - 0.04, z: s.z, yaw: s.yaw, pitch: s.pitch }, [0.6, 0.08, 0.45], C3E.slate, C3E.slateTop);
    },
    haut,
  );
  // Les abords relèvent la meule couchée et son petit toit tombé.
  add('ruine', 0, millFallen, abords);

  // ---- Le corps 1 : le grenier calé, sa porte fermée, ses trois marches.
  add(0, 0, stepsAndDoor);
  // ---- Le corps 2 : les sacs en carré au pied du mur, en cube sur la plate-forme.
  add(0, 1 / 3, sacksStacked);
  // ---- Le corps 3 : les mesures rangées sur la table, les casiers droits.
  add(0, 2 / 3, (b) => {
    measuresInRow(b);
    bins(b, true);
  });
  // ---- Le haut : le pan ouest du toit refait sous la neige, la poutre de levage et sa poulie ; une lanterne au coin.
  add(1, 0, (b) => {
    roofPan(b, -1);
    hoist(b);
    armLantern3e(b, G.w / 2, floorY() + G.wall - 0.3, FRONT, 0.7, 0.7, true);
  });
  // ---- Les abords : la meule debout sous son petit toit ; le banc ; la lanterne du chemin.
  add(2, 0, (b) => {
    millUp(b);
    bench(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin. */
const TRACE_SPOTS = {
  shovel: { x: -2.6, z: FRONT + 0.4 },
  barrow: { x: -G.w / 2 - 0.5, z: -2.0 },
  sieve: { x: -G.w / 2 - 0.02, z: 0.2 },
  forks: { x: G.w / 2 + 0.15, z: -2.2 },
  basket: { x: BENCH.x + 0.3, z: BENCH.z },
} as const;

/** Une pelle à grain de bois, debout dans un baquet (Puissances). */
function grainShovel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.shovel;
    const y = planeY(x, z);
    l.prism({ x, y, z }, 0.3, 0.34, 0.4, 8, C3E.woodShade, C.measureIn);
    l.box({ x: x + 0.05, y: y + 0.3, z, pitch: 0.1 }, [0.06, 1.2, 0.06], C3E.newWood);
    l.box({ x: x + 0.05, y: y + 1.4, z: z + 0.12, pitch: 0.1 }, [0.26, 0.32, 0.05], C3E.newWood, C3E.wood);
  });
}

/** Une brouette à bras, appuyée au mur ouest du grenier, sa roue au sol (Racines). */
function barrow(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.barrow;
    const y = planeY(x, z);
    l.box({ x: x - 0.1, y: y + 0.3, z, pitch: 0 }, [0.7, 0.3, 0.9], C3E.woodShade, C.measureIn);
    l.drum({ x: x - 0.1 - 0.04, y: y + 0.22, z: z - 0.55, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.22, 0.08, 8, C3E.woodShade, C3E.wood);
    for (const s of [-1, 1]) l.beam({ x: x - 0.1 + s * 0.3, y: y + 0.45, z: z - 0.4 }, { x: x - 0.1 + s * 0.3, y: y + 0.2, z: z + 0.9 }, 0.06, C3E.wood);
  });
}

/** Un tamis rond pendu à un clou, au mur ouest (Diviseurs et premiers). */
function sieve(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.sieve;
    const y = floorY() + 1.2;
    l.band({ x: x - 0.04, y, z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.3, 0.08, 8, C3E.newWood);
    l.plate({ x: x - 0.02, y, z, yaw: -Math.PI / 2 }, Array.from({ length: 8 }, (_, k) => [0.28 * Math.cos((k * Math.PI) / 4), 0.28 * Math.sin((k * Math.PI) / 4)] as const), C3E.canvasShade);
    l.box({ x: x - 0.05, y: y + 0.3, z }, [0.08, 0.06, 0.06], C3E.iron);
  });
}

/** Deux fourches de bois debout côte à côte contre le mur est (Développer). */
function forks(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.forks;
    const y = planeY(x, z);
    for (const dz of [-0.25, 0.25]) {
      l.box({ x: x + 0.06, y, z: z + dz }, [0.06, 1.3, 0.06], C3E.newWood);
      l.box({ x: x + 0.06, y: y + 1.3, z: z + dz }, [0.06, 0.06, 0.26], C3E.newWood);
      for (const t of [-0.1, 0.1]) l.box({ x: x + 0.06, y: y + 1.36, z: z + dz + t }, [0.05, 0.3, 0.05], C3E.newWood);
    }
  });
}

/** Un panier d'osier plein de pains ronds, sur le banc (Équations). */
function breadBasket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.basket;
    const y = planeY(x, z) + BENCH.h + 0.1;
    l.prism({ x, y, z }, 0.2, 0.26, 0.18, 8, C.wicker, C3E.woodShade);
    for (const [dx, dz] of [
      [-0.08, -0.05],
      [0.09, 0.02],
      [0, 0.1],
    ] as const)
      l.prism({ x: x + dx, y: y + 0.16, z: z + dz }, 0.1, 0.06, 0.08, 6, C.bread);
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : le corps en trois, le haut, les abords. */
const TRACES = {
  'power-rules': { at: TRACE_SPOTS.shovel, lift: 1, stage: 0, row: 0, draw: grainShovel },
  'square-equations': { at: TRACE_SPOTS.barrow, lift: 1, stage: 0, row: 1 / 3, draw: barrow },
  'prime-factors': { at: TRACE_SPOTS.sieve, lift: 1, stage: 0, row: 2 / 3, draw: sieve },
  identities: { at: TRACE_SPOTS.forks, lift: 1, stage: 1, row: 0, draw: forks },
  'zero-product': { at: TRACE_SPOTS.basket, lift: 1, stage: 2, row: 0, draw: breadBasket },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 4) : au nord, vers le grenier et la meule, le pic au loin à gauche. */
const SCENE_START = capOf(0);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le meunier). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : devant la porte, sous l'avant-toit. */
const SCENE_SPOT = { dx: 0, dz: FRONT + 2.4, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du meunier au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : la terre de la cour. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La planche des écuelles sur ses deux blocs : sa hauteur à l'échelle 1 ; une écuelle choisie se soulève d'un cran. */
const PLANK = { height: 0.5, lift: 0.3, bowl: 0.14 } as const;

/** Une écuelle de bois, toutes pareilles, son creux plus sombre. */
function bowl(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.14 * s, 0.23 * s, PLANK.bowl * s, 8, C.measure, C.measureIn);
}

export const GRENIER: PlaceArt = {
  role: 'Le meunier',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x6a6458, 0xb8b2a6);
  },
  answer: {
    size: { height: PLANK.height + PLANK.lift + PLANK.bowl, half: 0.3 },
    facing: true,
    // Une planche de bois gris sur deux blocs de granit, sous la rangée des écuelles.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PLANK.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.42 * s], C3E.woodShade, C3E.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.3, top - 0.1 * s - f, 0.4 * s], C3E.graniteShade, C3E.granite);
      }
    },
    // Une écuelle, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      bowl(b, { x: at.x, y: at.y + (PLANK.height + (picked ? PLANK.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x + 0.7, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Grenier, pour les tests et ses abords. */
export const GRENIER_LAYOUT = {
  granary: G,
  front: FRONT,
  feet: FEET,
  sacks: SACKS,
  table: TABLE,
  bins: BINS,
  mill: MILL,
  bench: BENCH,
  pathLantern: PATH_LANTERN,
  planeY,
  get floor() {
    return floorY();
  },
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
