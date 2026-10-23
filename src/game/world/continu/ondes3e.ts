// Les Ondes (les Prairies du 3e, GD-25, lot 4 ; proposition du consultant d'Archipéo, § 6, relecture des lieux du
// directeur artistique, et planche `selection-prairies-v1`, de près et de loin graine 42) : « la station qui captait les
// voix des autres archipels, au pied de son grand mât ». Sur le gabarit du Palais (./palais3e.ts), avec le kit du 3e
// (./place3eKit.ts). Une station de pierre claire au toit d'ardoise un peu enneigé au faîte ; contre elle, l'auvent de
// bois et, dessous, les postes alignés sur leur longue table, leurs cadrans ronds sans lettre ni chiffre ; à gauche, le
// cœur du lieu : le grand mât de bois haubané, sans vergue ni bras, et le pavillon d'écoute en cornet de fer bruni, sur son
// propre pied, tourné vers le large.
//
// La station regarde l'est-nord-est, la porte du lieu (`FACING`) : tout se dessine dans son repère (`x` le long de la
// façade, vers la droite de qui la regarde ; `z` vers le devant), tourné d'un bloc. La vue d'arrivée regarde l'ouest-sud-
// ouest : le mât et le pavillon à gauche de Kéo, jamais derrière lui (relecture du Versant, (b) 1) ; au-delà de l'île, la
// mer de nuages jusqu'au ciel (relecture des Alpages, (b) 4).
//
// La ruine, d'après le texte, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : le grand mât debout, ses
// haubans détendus ; le pavillon couché au pied de son support ; l'auvent tombé, appuyé contre la station, penché, son
// dessous de bois vers la porte (relecture des Alpages, (b) 1) ; les postes posés au sol en rang ; le toit de la station
// ouvert du côté de la porte, les chevrons à nu ; l'herbe sèche. Une seule lumière, la lanterne de l'annonceur, à la
// porte. Quatre parties (2 + 1 + 1) : la station (ses murs, sa porte, son toit) ; les postes sous l'auvent ; le haut (le
// pavillon remonté, les haubans retendus, la lanterne de l'auvent) ; les abords (le chemin, le banc, le muret bas, la
// lanterne du chemin). Une trace par mission, avec sa partie. Code pur.
import type { Stage } from "./construction";
import { drawPosed, type FacetBuilder } from "./facets";
import type { Vec2, Vec3 } from "./geometry";
import type { AddPiece, PlaceArt, Sphere } from "./placeArt";
import {
  C3E,
  SINK_3E,
  armLantern3e,
  dryTuft3e,
  habitant3e,
  postLantern3e,
  site3e,
} from "./place3eKit";
import {
  capOf,
  groundPlane4e,
  inWorld,
  once,
  sceneRight,
  sceneRise,
  sheet,
} from "./place4eKit";

/**
 * Les couleurs propres aux Ondes, en plus des matières des Passeurs (`C3E`) : le fer bruni du pavillon et son dedans, un brun d'ombre
 * (jamais presque noir) ; le cadran rond des postes, sans lettre ; le creux d'une porte ouverte ; la gourde ; la veste de
 * l'annonceur.
 */
const C = {
  horn: 0x92785c,
  hornInside: 0x6e5e50,
  dial: 0xd6d0c0,
  hollow: 0x5c5650,
  flask: 0x7d8a6e,
  coat: 0x6a6f86,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e("ondes");

/** Le plan du sol sous la station, son mât et son chemin : la plus petite Prairie est une table plate. */
const planeY = groundPlane4e(SITE.ground, [-9, 9], [-9, 9]);

/** Le cap où regarde la façade (en degrés depuis le nord) : l'est-nord-est, vers la porte ; la vue d'arrivée regarde à 243°. */
const FACING = 63;
const TURN = ((FACING - 180) * Math.PI) / 180;
/** Le lacet du repère de la station (`drawPosed`) : son `x` vers la droite de qui regarde la façade, son `z` vers le devant. */
const YAW = -TURN;

/** Un point du repère de la station dans le repère du lieu. */
const local = (x: number, z: number): Vec2 => ({
  x: x * Math.cos(TURN) - z * Math.sin(TURN),
  z: x * Math.sin(TURN) + z * Math.cos(TURN),
});

/** Le sol sous un point du repère de la station. */
const groundAt = (x: number, z: number): number => {
  const p = local(x, z);
  return planeY(p.x, p.z);
};

/** Dessine dans le repère de la station. */
const posed = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void =>
  drawPosed(b, { x: 0, y: 0, z: 0, yaw: YAW }, draw);

/**
 * La station : de `x0` à `x1` le long de la façade, de `z0` (le dos) à `z1` (la façade) ; la hauteur de ses murs ; son
 * socle de granit ; son toit (son débord, la hauteur du faîte, la part enneigée au faîte) ; sa porte.
 */
const STATION = {
  x0: 0.6,
  x1: 5.0,
  z0: -4.2,
  z1: -0.9,
  h: 2.7,
  plinth: 0.3,
  eave: 0.3,
  ridge: 1.6,
  snow: 0.3,
  door: { x: 1.5, w: 0.95, h: 2.0 },
} as const;

/** L'auvent contre la façade : son bord, la hauteur de son toit au mur et au bord, ses deux poteaux. */
const AWNING = {
  x0: 0.4,
  x1: 5.2,
  z1: 1.7,
  wallY: 2.45,
  edgeY: 2.0,
  posts: [0.6, 5.0] as const,
  post: 0.18,
} as const;

/** La longue table des postes, sous l'auvent : son milieu, sa longueur, sa largeur, sa hauteur ; les trois postes. */
const TABLE = {
  x: 3.3,
  z: 0.55,
  w: 3.0,
  d: 0.75,
  h: 0.8,
  sets: [2.3, 3.3, 4.3] as const,
} as const;

/** Le grand mât : son pied, sa hauteur, son épaisseur ; ses trois haubans, attachés aux deux tiers, et leurs ancres. */
const MAST = {
  x: -3.6,
  z: -2.4,
  h: 10,
  r: 0.2,
  tie: 0.68,
  anchors: [
    [-7.2, 0.4],
    [-1.4, -6.6],
    [-6.6, -5.8],
  ] as const,
} as const;

/** Le pavillon d'écoute : le pied de son support, sa hauteur, sa longueur, le rayon de sa bouche ; tourné vers le large (vers la gauche). */
const HORN = {
  x: -2.0,
  z: 0.9,
  h: 1.5,
  length: 2.0,
  mouth: 0.85,
  throat: 0.14,
} as const;

/** L'auvent tombé (la ruine), appuyé contre la façade : de `x0` à `x1`, son pied sur l'herbe. */
const FALLEN_AWNING = { x0: 2.0, x1: 5.1, foot: 1.6 } as const;

/** Le chemin de pierre claire, du devant de l'auvent vers la porte du lieu : sa demi-largeur, son bout. */
const ALLEY = { x: 1.5, half: 0.85, end: 7.4 } as const;

/** Le banc et le muret bas (les abords), à droite du chemin ; la lanterne du chemin, à sa gauche. */
const BENCH = { x: 4.4, z: 4.2 } as const;
const LOW_WALL = { x0: 5.6, x1: 5.6, z0: 2.6, z1: 6.4, h: 0.7 } as const;
const PATH_LANTERN = { x: -0.2, z: 6.2, h: 1.4 } as const;

/** L'herbe sèche de la ruine, au pied de la station et du mât. */
const DRY = [
  { x: 4.0, z: 2.6, s: 1 },
  { x: -1.2, z: -1.0, s: 0.85 },
  { x: 5.8, z: -1.2, s: 0.9 },
  { x: -4.6, z: 0.4, s: 0.8 },
] as const;

/** La porte du lieu, dans le repère de la station. */
const DOOR = (() => {
  const c = Math.cos(TURN),
    s = Math.sin(TURN);
  return {
    x: SITE.door.x * c + SITE.door.z * s,
    z: -SITE.door.x * s + SITE.door.z * c,
  };
})();

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 6) : à l'ouest-sud-ouest (243°), de la porte à l'est-nord-est ; le mât et le pavillon à
 * gauche de Kéo, la station à droite ; au-delà de l'île, la mer de nuages jusqu'au ciel. Le soleil vient de la gauche.
 */
const DOOR_VIEW = capOf(FACING + 180);

/** La vue d'arrivée à hauteur de Kéo, un peu reculée : le haut du mât dans le cadre, la nappe de nuages en bande lisible. */
const DOOR_FRAME = { height: -1.6, back: 1.2 } as const;

// ---------- Les volumes ----------

/** Le pied de la station : le plus bas du sol sous ses coins et le bord de son auvent. */
const base = once(
  () =>
    Math.min(
      ...[STATION.x0, STATION.x1].flatMap((x) =>
        [STATION.z0, AWNING.z1].map((z) => groundAt(x, z)),
      ),
    ) - 0.05,
);

/** Le plancher : le dessus du socle, sous la station et son auvent. */
const floor = (): number => base() + STATION.plinth;

/** Le point du nom sur la Carte, au-dessus de la station, le même en ruine et restauré (le mât reste à côté). */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + STATION.h + STATION.ridge + 1.6;
  },
  z: 0,
};

/** Le socle de granit, sous la station et son auvent. */
function plinth(l: FacetBuilder): void {
  const S = STATION;
  l.box(
    {
      x: (AWNING.x0 + AWNING.x1) / 2,
      y: base() + SINK_3E,
      z: (S.z0 + AWNING.z1) / 2,
    },
    [AWNING.x1 - AWNING.x0 + 0.2, S.plinth - SINK_3E, AWNING.z1 - S.z0 + 0.2],
    C3E.graniteShade,
    C3E.granite,
  );
}

/** Les murs de pierre claire de la station, sa porte ouverte sur son dedans d'ombre, la lanterne de l'annonceur. */
function stationWalls(l: FacetBuilder): void {
  const S = STATION;
  const y = floor() - 0.05;
  l.box(
    { x: (S.x0 + S.x1) / 2, y, z: (S.z0 + S.z1) / 2 },
    [S.x1 - S.x0, S.h + 0.05, S.z1 - S.z0],
    C3E.stoneShade,
    C3E.stone,
  );
  // Les deux pignons, sous le faîte.
  l.gableRoof(
    { x: (S.x0 + S.x1) / 2, y: floor() + S.h, z: (S.z0 + S.z1) / 2 },
    S.x1 - S.x0,
    S.z1 - S.z0,
    S.ridge - 0.05,
    C3E.stone,
    C3E.stoneShade,
  );
  l.box(
    { x: S.door.x, y: floor(), z: S.z1 + 0.02 },
    [S.door.w, S.door.h, 0.06],
    C.hollow,
  );
  l.box(
    { x: S.door.x, y: floor() + S.door.h, z: S.z1 + 0.04 },
    [S.door.w + 0.25, 0.16, 0.1],
    C3E.graniteShade,
    C3E.granite,
  );
  armLantern3e(
    l,
    S.door.x - S.door.w / 2 - 0.35,
    floor() + 2.05,
    S.z1 + 0.02,
    0,
    1,
    true,
  );
}

/** Le toit d'ardoise entier de la station, et la neige au faîte. */
function stationRoof(l: FacetBuilder): void {
  const S = STATION;
  const at = { x: (S.x0 + S.x1) / 2, y: floor() + S.h, z: (S.z0 + S.z1) / 2 };
  const sx = S.x1 - S.x0 + 2 * S.eave,
    sz = S.z1 - S.z0 + 2 * S.eave;
  l.gableRoof(at, sx, sz, S.ridge, C3E.slate, C3E.stone);
  l.gableRoof(
    { ...at, y: at.y + S.ridge * (1 - S.snow) + 0.02 },
    sx + 0.02,
    sz * S.snow,
    S.ridge * S.snow,
    C3E.snow,
    C3E.snow,
  );
}

/** Le toit ouvert de la ruine : le pan du dos seul, la neige au faîte, les chevrons à nu du côté de la porte. */
function stationRoofOpen(l: FacetBuilder): void {
  const S = STATION;
  const y = floor() + S.h;
  const zm = (S.z0 + S.z1) / 2;
  const x0 = S.x0 - S.eave,
    x1 = S.x1 + S.eave;
  sheet(
    l,
    [
      [x1, y - 0.2, S.z0 - S.eave],
      [x0, y - 0.2, S.z0 - S.eave],
      [x0, y + S.ridge - 0.1, zm],
      [x1, y + S.ridge - 0.1, zm],
    ],
    0.1,
    C3E.slate,
    C3E.wood,
  );
  l.box(
    { x: (x0 + x1) / 2, y: y + S.ridge - 0.06, z: zm - 0.3 },
    [x1 - x0, 0.07, 0.6],
    C3E.snow,
  );
  for (const x of [1.4, 2.8, 4.2])
    l.beam(
      { x, y: y - 0.05, z: S.z1 - 0.1 },
      { x, y: y + S.ridge * 0.92, z: zm },
      0.13,
      C3E.woodShade,
    );
}

/** L'auvent debout : ses deux poteaux, sa poutre, son toit de bois en appentis contre la façade. */
function awningUp(l: FacetBuilder): void {
  const A = AWNING;
  const y = floor();
  for (const x of A.posts)
    l.box(
      { x, y: y - 0.02, z: A.z1 - 0.15 },
      [A.post, A.edgeY - 0.08, A.post],
      C3E.woodShade,
      C3E.wood,
    );
  l.box(
    { x: (A.x0 + A.x1) / 2, y: y + A.edgeY - 0.1, z: A.z1 - 0.15 },
    [A.posts[1] - A.posts[0] + A.post, 0.18, 0.18],
    C3E.woodShade,
    C3E.wood,
  );
  sheet(
    l,
    [
      [A.x1, y + A.wallY, STATION.z1],
      [A.x0, y + A.wallY, STATION.z1],
      [A.x0, y + A.edgeY, A.z1 + 0.2],
      [A.x1, y + A.edgeY, A.z1 + 0.2],
    ],
    0.1,
    C3E.newWood,
    C3E.wood,
  );
}

/** L'auvent tombé (la ruine), appuyé contre la façade, penché : son dessous de bois et ses lattes tournés vers la porte. */
function awningDown(l: FacetBuilder): void {
  const P = FALLEN_AWNING;
  const top = floor() + AWNING.wallY - 0.5;
  sheet(
    l,
    [
      [P.x0, top, STATION.z1 + 0.1],
      [P.x1, top, STATION.z1 + 0.1],
      [P.x1 + 0.15, groundAt(P.x1, P.foot) + 0.02, P.foot],
      [P.x0 - 0.1, groundAt(P.x0, P.foot) + 0.02, P.foot],
    ],
    0.1,
    C3E.wood,
    C3E.newWood,
  );
  for (const t of [0.35, 0.7]) {
    const yy = top + (floor() - top) * t + 0.12;
    const zz = STATION.z1 + 0.1 + (P.foot - STATION.z1) * t + 0.05;
    l.beam(
      { x: P.x0 + 0.05, y: yy, z: zz },
      { x: P.x1 + 0.1, y: yy, z: zz },
      0.08,
      C3E.woodShade,
    );
  }
  // Un poteau de l'auvent, couché dans l'herbe.
  l.box(
    { x: -0.4, y: groundAt(-0.4, 2.6) - 0.05, z: 2.6, yaw: 1.2 },
    [AWNING.post, AWNING.post, AWNING.edgeY],
    C3E.woodShade,
    C3E.wood,
  );
}

/** Un poste de bois, ses deux cadrans ronds sans lettre ni chiffre, tournés vers le devant. */
function radioSet(l: FacetBuilder, x: number, y: number, z: number): void {
  l.box({ x, y, z }, [0.72, 0.5, 0.42], C3E.woodShade, C3E.newWood);
  for (const dx of [-0.16, 0.16])
    l.drum(
      { x: x + dx, y: y + 0.27, z: z + 0.2, pitch: Math.PI / 2 },
      0.1,
      0.04,
      8,
      C3E.iron,
      C.dial,
    );
}

/** La longue table et ses trois postes, sous l'auvent. */
function tableAndSets(l: FacetBuilder): void {
  const T = TABLE;
  const y = floor();
  l.box(
    { x: T.x, y: y + T.h - 0.08, z: T.z },
    [T.w, 0.08, T.d],
    C3E.woodShade,
    C3E.newWood,
  );
  for (const sx of [-1, 1])
    l.box(
      { x: T.x + sx * (T.w / 2 - 0.1), y: y - 0.02, z: T.z },
      [0.1, T.h - 0.06, T.d - 0.1],
      C3E.woodShade,
    );
  for (const x of T.sets) radioSet(l, x, y + T.h, T.z - 0.05);
}

/** Les trois postes posés au sol en rang (la ruine), devant la station. */
function setsDown(l: FacetBuilder): void {
  for (const [k, x] of TABLE.sets.entries())
    radioSet(
      l,
      x - 0.6,
      groundAt(x - 0.6, 2.4 + 0.1 * k) - 0.02,
      2.4 + 0.1 * k,
    );
}

/** Le grand mât de bois, debout sur son dé de granit, sans vergue ni bras ; une pomme de fer au sommet. */
function mast(l: FacetBuilder): void {
  const M = MAST;
  const y = groundAt(M.x, M.z);
  l.box(
    { x: M.x, y: y + SINK_3E, z: M.z },
    [0.9, 0.5 - SINK_3E, 0.9],
    C3E.graniteShade,
    C3E.granite,
  );
  l.prism(
    { x: M.x, y: y + 0.4, z: M.z },
    M.r,
    M.r * 0.55,
    M.h,
    6,
    C3E.woodShade,
    C3E.wood,
  );
  l.prism({ x: M.x, y: y + 0.4 + M.h, z: M.z }, 0.16, 0.05, 0.3, 6, C3E.iron);
}

/** Les trois haubans, du mât aux ancres : tendus (droits), ou détendus (la ruine : ils retombent vers l'herbe). */
function guys(l: FacetBuilder, taut: boolean): void {
  const M = MAST;
  const y0 = groundAt(M.x, M.z) + 0.4;
  const top = { x: M.x, y: y0 + M.h * M.tie, z: M.z };
  for (const [ax, az] of M.anchors) {
    const ay = groundAt(ax, az);
    l.box(
      { x: ax, y: ay - 0.2, z: az },
      [0.3, 0.32, 0.3],
      C3E.iron,
      C3E.ironTop,
    );
    const foot = { x: ax, y: ay + 0.1, z: az };
    if (taut) l.beam(top, foot, 0.05, C3E.iron);
    else {
      // Détendu : il pend du mât jusqu'au sol, à mi-chemin, puis court dans l'herbe jusqu'à son ancre.
      const mid = {
        x: M.x + (ax - M.x) * 0.45,
        y: groundAt(M.x + (ax - M.x) * 0.45, M.z + (az - M.z) * 0.45) + 0.04,
        z: M.z + (az - M.z) * 0.45,
      };
      l.beam({ x: M.x, y: y0 + M.h * M.tie, z: M.z }, mid, 0.05, C3E.iron);
      l.beam(mid, foot, 0.05, C3E.iron);
    }
  }
}

/** Le cornet du pavillon d'écoute, dans un repère où il pointe vers +z depuis son col en (0, 0, 0). */
function horn(k: FacetBuilder): void {
  k.prism(
    { x: 0, y: 0, z: 0 },
    HORN.throat,
    HORN.mouth,
    HORN.length,
    8,
    C.horn,
    C.hornInside,
  );
  k.prism({ x: 0, y: -0.25, z: 0 }, 0.09, HORN.throat, 0.25, 6, C.horn);
}

/** Le pavillon remonté sur son pied, tourné vers le large (vers la gauche de la vue d'arrivée). */
function hornUp(l: FacetBuilder): void {
  const H = HORN;
  const y = groundAt(H.x, H.z);
  l.prism(
    { x: H.x, y: y - 0.1, z: H.z },
    0.32,
    0.26,
    0.2,
    6,
    C3E.graniteShade,
    C3E.granite,
  );
  l.prism({ x: H.x, y: y + 0.08, z: H.z }, 0.09, 0.07, H.h, 6, C3E.iron);
  drawPosed(
    l,
    {
      x: H.x,
      y: y + H.h,
      z: H.z,
      yaw: -Math.PI / 2 - 0.25,
      pitch: Math.PI / 2 - 0.08,
    },
    horn,
  );
}

/** Le pied seul et le pavillon couché dans l'herbe à côté (la ruine), sa bouche vers la porte. */
function hornDown(l: FacetBuilder): void {
  const H = HORN;
  const y = groundAt(H.x, H.z);
  l.prism(
    { x: H.x, y: y - 0.1, z: H.z },
    0.32,
    0.26,
    0.2,
    6,
    C3E.graniteShade,
    C3E.granite,
  );
  l.prism({ x: H.x, y: y + 0.08, z: H.z }, 0.09, 0.07, H.h * 0.55, 6, C3E.iron);
  const gx = H.x - 0.9,
    gz = H.z + 0.4;
  drawPosed(
    l,
    {
      x: gx,
      y: groundAt(gx, gz) + 0.12,
      z: gz,
      yaw: 0.4,
      pitch: Math.PI / 2 - 0.12,
    },
    horn,
  );
}

/** Le chemin de pierre claire, du devant de l'auvent vers la porte du lieu, en dalles. */
function alley(l: FacetBuilder): void {
  const n = 3;
  const from = AWNING.z1 + 0.15;
  const step = (ALLEY.end - from) / n;
  for (let k = 0; k < n; k++) {
    const z = from + (k + 0.5) * step;
    l.box(
      { x: ALLEY.x, y: groundAt(ALLEY.x, z) - 0.06, z },
      [2 * ALLEY.half, 0.1, step - 0.08],
      C3E.joint,
      k % 2 ? C3E.stone : C3E.stoneShade,
    );
  }
}

/** Le banc de pierre, à planche de bois. */
function bench(l: FacetBuilder): void {
  const { x, z } = BENCH;
  const y = groundAt(x, z);
  for (const s of [-1, 1])
    l.box(
      { x: x + s * 0.55, y: y - 0.1, z },
      [0.26, 0.55, 0.38],
      C3E.graniteShade,
      C3E.granite,
    );
  l.box({ x, y: y + 0.42, z }, [1.5, 0.1, 0.44], C3E.woodShade, C3E.wood);
}

/** Le muret bas de pierre claire à chaperon d'ardoise, le long du banc, loin de la rive. */
function lowWall(l: FacetBuilder): void {
  const W = LOW_WALL;
  const y = Math.min(groundAt(W.x0, W.z0), groundAt(W.x1, W.z1));
  l.box(
    { x: W.x0, y: y + SINK_3E, z: (W.z0 + W.z1) / 2 },
    [0.45, W.h - SINK_3E, W.z1 - W.z0],
    C3E.stoneShade,
    C3E.stone,
  );
  l.box(
    { x: W.x0, y: y + W.h, z: (W.z0 + W.z1) / 2 },
    [0.58, 0.12, W.z1 - W.z0 + 0.1],
    C3E.slate,
    C3E.slateTop,
  );
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle, les murs de la station, sa porte et la lanterne de l'annonceur, la seule allumée de la ruine ;
  // le grand mât debout.
  add("ruine", 0, (b) =>
    posed(b, (l) => {
      plinth(l);
      stationWalls(l);
      mast(l);
    }),
  );
  // La station (corps 1) referme le toit ouvert.
  add("ruine", 0, (b) => posed(b, stationRoofOpen), corps1);
  // Les postes (corps 2) relèvent l'auvent tombé et les postes posés au sol.
  add(
    "ruine",
    0,
    (b) =>
      posed(b, (l) => {
        awningDown(l);
        setsDown(l);
      }),
    corps2,
  );
  // Le haut remonte le pavillon couché et retend les haubans.
  add(
    "ruine",
    0,
    (b) =>
      posed(b, (l) => {
        hornDown(l);
        guys(l, false);
      }),
    haut,
  );
  // Les abords effacent l'herbe sèche.
  add(
    "ruine",
    0,
    (b) =>
      posed(b, (l) =>
        DRY.forEach((d) => dryTuft3e(l, d.x, groundAt(d.x, d.z), d.z, d.s)),
      ),
    abords,
  );

  // ---- La station : son toit d'ardoise sous la neige.
  add(0, 0, (b) => posed(b, stationRoof));
  // ---- Les postes, alignés sur leur longue table, sous l'auvent.
  add(0, 0.5, (b) =>
    posed(b, (l) => {
      awningUp(l);
      tableAndSets(l);
    }),
  );
  // ---- Le haut : le pavillon sur son pied, tourné vers le large ; les haubans retendus ; la lanterne de l'auvent.
  add(1, 0, (b) =>
    posed(b, (l) => {
      hornUp(l);
      guys(l, true);
      armLantern3e(
        l,
        AWNING.posts[1],
        floor() + 1.7,
        AWNING.z1 - 0.15,
        0,
        1,
        true,
      );
    }),
  );
  // ---- Les abords : le chemin de pierre claire, le banc, le muret bas, la lanterne du chemin.
  add(2, 0, (b) =>
    posed(b, (l) => {
      alley(l);
      bench(l);
      lowWall(l);
      const p = PATH_LANTERN;
      postLantern3e(l, p.x, groundAt(p.x, p.z), p.z, p.h, true);
    }),
  );
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de la station, loin du chemin et de la scène. */
const TRACE_SPOTS_P = {
  chair: { x: 3.0, z: -0.45 },
  stools: { x: 3.3, z: 1.35 },
  ladder: { x: MAST.x + 0.25, z: MAST.z + 0.55 },
  bench: { x: BENCH.x, z: BENCH.z },
} as const;

/** Les mêmes, dans le repère du lieu. */
const TRACE_SPOTS = {
  chair: local(TRACE_SPOTS_P.chair.x, TRACE_SPOTS_P.chair.z),
  stools: local(TRACE_SPOTS_P.stools.x, TRACE_SPOTS_P.stools.z),
  ladder: local(TRACE_SPOTS_P.ladder.x, TRACE_SPOTS_P.ladder.z),
  bench: local(TRACE_SPOTS_P.bench.x, TRACE_SPOTS_P.bench.z),
} as const;

/** Dessine une trace dans le repère de la station, posée au centre du lieu. */
const traceIn = (
  b: FacetBuilder,
  c: Vec3,
  draw: (l: FacetBuilder) => void,
): void => inWorld(b, c, draw, YAW);

/** Une chaise de bois et une petite table, contre la façade, à droite de la porte (Comprendre). */
function chairAndTable(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.chair;
    const y = floor();
    // La petite table ronde.
    l.prism(
      { x: x + 0.55, y: y - 0.02, z },
      0.06,
      0.06,
      0.68,
      6,
      C3E.woodShade,
    );
    l.prism(
      { x: x + 0.55, y: y + 0.66, z },
      0.3,
      0.3,
      0.05,
      8,
      C3E.woodShade,
      C3E.newWood,
    );
    // La chaise : son siège, ses quatre pieds, son dossier plein.
    for (const [dx, dz] of [
      [-0.16, -0.16],
      [0.16, -0.16],
      [-0.16, 0.16],
      [0.16, 0.16],
    ] as const)
      l.box(
        { x: x - 0.2 + dx, y: y - 0.02, z: z + dz },
        [0.05, 0.46, 0.05],
        C3E.woodShade,
      );
    l.box(
      { x: x - 0.2, y: y + 0.44, z },
      [0.42, 0.05, 0.42],
      C3E.woodShade,
      C3E.newWood,
    );
    l.box(
      { x: x - 0.2, y: y + 0.48, z: z - 0.19 },
      [0.42, 0.45, 0.05],
      C3E.woodShade,
      C3E.newWood,
    );
  });
}

/** Deux tabourets hauts, côte à côte, devant la longue table (Connecteurs). */
function highStools(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.stools;
    const y = floor();
    for (const dx of [-0.5, 0.5]) {
      l.prism(
        { x: x + dx, y: y - 0.02, z },
        0.14,
        0.08,
        0.72,
        6,
        C3E.woodShade,
      );
      l.prism(
        { x: x + dx, y: y + 0.7, z },
        0.2,
        0.2,
        0.07,
        6,
        C3E.woodShade,
        C3E.newWood,
      );
    }
  });
}

/** Une échelle de bois appuyée au mât, ses deux montants et ses barreaux (Faux amis). */
function ladder(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.ladder;
    const y = groundAt(x, z);
    drawPosed(l, { x, y: y - 0.05, z, yaw: 0, pitch: -0.2 }, (k) => {
      for (const s of [-1, 1])
        k.box({ x: s * 0.22, y: 0, z: 0 }, [0.07, 3.2, 0.07], C3E.wood);
      for (let r = 0; r < 6; r++)
        k.box(
          { x: 0, y: 0.35 + r * 0.5, z: 0 },
          [0.44, 0.05, 0.05],
          C3E.newWood,
        );
    });
  });
}

/** Une gamelle de fer et une gourde, posées sur le banc (École et médias). */
function mealOnBench(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.bench;
    const y = groundAt(x, z) + 0.52;
    l.drum({ x: x - 0.3, y, z }, 0.17, 0.14, 8, C3E.iron, C3E.ironTop);
    l.box({ x: x - 0.3, y: y + 0.14, z }, [0.04, 0.12, 0.3], C3E.iron);
    l.prism({ x: x + 0.3, y, z }, 0.12, 0.12, 0.26, 8, C.flask, C.flask);
    l.prism({ x: x + 0.3, y: y + 0.26, z }, 0.05, 0.04, 0.08, 6, C3E.leather);
  });
}

/** Les quatre traces, une par mission, chacune avec sa partie : le corps (2), le haut, les abords. */
const TRACES = {
  understanding: {
    at: TRACE_SPOTS.chair,
    lift: 1.3,
    stage: 0,
    row: 0,
    draw: chairAndTable,
  },
  "linking-words": {
    at: TRACE_SPOTS.stools,
    lift: 1.3,
    stage: 0,
    row: 0.5,
    draw: highStools,
  },
  "false-friends": {
    at: TRACE_SPOTS.ladder,
    lift: 1.8,
    stage: 1,
    row: 0,
    draw: ladder,
  },
  media: {
    at: TRACE_SPOTS.bench,
    lift: 1,
    stage: 2,
    row: 0,
    draw: mealOnBench,
  },
} as const satisfies Record<string, PlaceArt["traces"][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 6) : à l'ouest-sud-ouest, à l'horizontale, vers le large et la montagne. */
const SCENE_START = capOf(243);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'annonceur). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : sur l'herbe devant le pavillon, le mât à gauche, l'auvent à droite. */
const SCENE_SPOT = (() => {
  const p = local(-1.6, 4.4);
  return { dx: p.x, dz: p.z, half: [2.4, 1.2] as [number, number] } as const;
})();

/** L'écart de Kéo et de l'annonceur au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe de la Prairie. */
const sceneRiseOf = once(() =>
  sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)),
);

/** La table des boutons : sa hauteur à l'échelle 1 ; un bouton choisi se soulève d'un cran. */
const KNOBS = { height: 0.62, lift: 0.28, knob: 0.16 } as const;

/** Un bouton de bois rond, sa face claire sans trait ; tous pareils. */
function knob(b: FacetBuilder, at: Vec3, s: number): void {
  b.drum(
    { x: at.x, y: at.y, z: at.z },
    0.13 * s,
    0.1 * s,
    8,
    C3E.woodShade,
    C3E.newWood,
  );
  b.drum(
    { x: at.x, y: at.y + 0.1 * s, z: at.z },
    0.06 * s,
    0.06 * s,
    6,
    C3E.wood,
    C3E.wood,
  );
}

export const ONDES: PlaceArt = {
  role: "L’annonceur",
  model,
  traceStage: 0,
  sceneSpot: {
    dx: SCENE_SPOT.dx,
    dz: SCENE_SPOT.dz,
    half: SCENE_SPOT.half,
    fine: true,
  },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: {
      dx: -SCENE_RIGHT.x * SCENE_HALF,
      dz: -SCENE_RIGHT.z * SCENE_HALF,
      scale: 0.6,
      yaw: Math.PI - 0.4 + SCENE_START,
    },
    habitant: {
      dx: SCENE_RIGHT.x * SCENE_HALF,
      dz: SCENE_RIGHT.z * SCENE_HALF,
    },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (4 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x6a5444);
  },
  answer: {
    size: { height: KNOBS.height + KNOBS.lift + KNOBS.knob, half: 0.3 },
    facing: true,
    // Une petite table de bois, sous le rang des boutons.
    base(b, mid, y, z, span, s, ground) {
      const top = y + KNOBS.height * s;
      b.box(
        { x: mid, y: top - 0.08 * s, z },
        [span + 0.7, 0.08 * s, 0.46 * s],
        C3E.woodShade,
        C3E.newWood,
      );
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box(
          { x, y: f, z },
          [0.1, top - 0.08 * s - f, 0.4 * s],
          C3E.woodShade,
        );
      }
    },
    // Un bouton, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      knob(
        b,
        {
          x: at.x,
          y: at.y + (KNOBS.height + (picked ? KNOBS.lift : 0)) * s,
          z: at.z,
        },
        s,
      );
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan des Ondes, pour les tests. */
export const ONDES_LAYOUT = {
  station: STATION,
  awning: AWNING,
  mast: MAST,
  horn: HORN,
  facing: FACING,
  local,
  /** Un point du repère du lieu dans le repère de la station (l'inverse de `local`). */
  toFrame: (x: number, z: number): Vec2 => ({
    x: x * Math.cos(TURN) + z * Math.sin(TURN),
    z: -x * Math.sin(TURN) + z * Math.cos(TURN),
  }),
  base,
  floor,
  planeY,
  door: SITE.door,
  doorInFrame: DOOR,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
