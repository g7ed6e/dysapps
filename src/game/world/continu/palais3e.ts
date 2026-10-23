// Le Palais (les Prairies du 3e, GD-25, lot 4 ; proposition du consultant d'Archipéo, § 3, relecture des lieux du
// directeur artistique, corrections 7 et 16, et planche `selection-prairies-v1`, de près et de loin graine 42) : « le palais
// posé sur la plus grande des Prairies, où l'on recevait les messagers des autres archipels ». Sur le gabarit du Kiosque
// (./kiosque3e.ts), avec le kit du 3e (./place3eKit.ts). Un palais bas et long de pierre claire, un seul haut étage, sa
// rangée de hautes portes alignées (les salons en enfilade), son toit d'ardoise à peine enneigé au faîte ; devant, une
// terrasse et son grand escalier bas, aux marches larges et peu hautes ; le gong de fer bruni dans son portique de bois ;
// les plateaux à messages sur leurs pieds, de part et d'autre de l'allée. Ni fronton, ni blason, ni lettre ; pas de cobalt
// (il est à la Coupole).
//
// Le palais regarde le sud-sud-ouest, la porte du lieu (`FACING`) : tout se dessine dans son repère (`x` le long de la
// façade, vers la droite de qui la regarde ; `z` vers le devant), tourné d'un bloc. Kéo s'arrête à droite de l'escalier :
// le gong, son portique et l'escalier à sa gauche, jamais derrière lui (relecture du Versant, (b) 1) ; le palais à gauche
// du milieu du cadre, pour que le zeppelin, au loin à droite (+20°), reste entier au-delà de son aile droite.
//
// La ruine, d'après le texte, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : l'aile droite sans toit,
// ses murs ébréchés, ses fenêtres vides, trois paires de chevrons à nu ; un pan de toit tombé, appuyé contre la façade, son
// dessous de bois tourné vers la porte (relecture des Alpages, (b) 1 : un toit tombé penche, jamais à plat) ; l'escalier
// entier, deux marches fendues ; le gong couché au pied de son portique tombé ; deux plateaux renversés. Une seule lumière,
// la lanterne du majordome, au mur du perron. Quatre parties (2 + 1 + 1) : l'escalier et la terrasse ; l'aile droite (ses
// murs, ses fenêtres, son toit) ; le haut (les portes des salons ouvertes, le gong relevé, la lanterne du perron) ; les
// abords (les plateaux, l'allée de pierre claire, la lanterne du chemin). Une trace par mission, avec sa partie. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTuft3e, habitant3e, postLantern3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise, sheet } from './place4eKit';

/**
 * Les couleurs propres au Palais, en plus des matières des Passeurs (`C3E`) : le dedans clair des salons, qu'on voit par
 * les portes ouvertes ; le creux d'une fenêtre vide (jamais presque noir) ; la vitre éteinte ; l'étain des plateaux ; le
 * papier plié d'un message ; le tapis roulé ; la porcelaine des tasses ; les fleurs pâles des vasques ; la veste du
 * majordome (un bleu-gris sombre, jamais presque noir).
 */
const C = {
  salon: 0xb3ab9c,
  hollow: 0x5c5650,
  glass: 0xa9bccc,
  tray: 0xb8bcc2,
  paper: 0xd6d0c0,
  carpet: 0x8e5b52,
  carpetShade: 0x744a43,
  porcelain: 0xdedcd6,
  flower: 0xd2a3a0,
  leaf: 0x7f9a5c,
  candle: 0xe2dccb,
  coat: 0x56607a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('palais');

/** Le plan du sol sous le palais, sa terrasse et son allée : la plus grande Prairie est une table plate. */
const planeY = groundPlane4e(SITE.ground, [-10, 10], [-10, 12]);

/**
 * Le cap où regarde la façade (en degrés depuis le nord) : le sud-sud-ouest, vers la porte du lieu ; la vue d'arrivée
 * regarde à l'opposé, au cap de 27° (proposition, § 3).
 */
const FACING = 207;
const TURN = ((FACING - 180) * Math.PI) / 180;
/** Le lacet du repère du palais (`drawPosed`) : son `x` vers la droite de qui regarde la façade, son `z` vers le devant. */
const YAW = -TURN;

/** Un point du repère du palais dans le repère du lieu. */
const local = (x: number, z: number): Vec2 => ({ x: x * Math.cos(TURN) - z * Math.sin(TURN), z: x * Math.sin(TURN) + z * Math.cos(TURN) });

/** Le sol sous un point du repère du palais. */
const groundAt = (x: number, z: number): number => {
  const p = local(x, z);
  return planeY(p.x, p.z);
};

/** Dessine dans le repère du palais. */
const posed = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: 0, z: 0, yaw: YAW }, draw);

/**
 * Le corps du palais : de `x0` à `x1` le long de la façade, de `z0` (le dos) à `z1` (la façade) ; la hauteur de son
 * étage ; son socle de granit ; la limite de l'aile droite (`wing`) ; le toit (son débord, la hauteur du faîte, la part
 * enneigée au faîte, peu).
 */
const BODY = { x0: -8, x1: 8, z0: -6.4, z1: -1.5, h: 4.0, plinth: 0.4, wing: 1, eave: 0.35, ridge: 2.0, snow: 0.3 } as const;

/** Les hautes portes des salons sur la façade : leur place le long d'elle, leur largeur, leur haut ; celles de l'aile droite. */
const DOORS = { xs: [-6, -4, -2, 0, 2, 4, 6] as const, w: 1.1, top: 3.5, wing: [2, 4, 6] as const } as const;

/** Les fenêtres du dos, plus petites, vitrées. */
const BACK_WINDOWS = { xs: [-6, -3, 0, 3, 6] as const, w: 0.9, y0: 1.2, y1: 3.2 } as const;

/** La terrasse devant la façade (sa hauteur), et le grand escalier bas : sa demi-largeur, ses marches et leur giron. */
const TERRACE = { x0: -7, x1: 7, z0: BODY.z1, z1: 2.0, h: 0.75 } as const;
const STAIRS = { half: 3.2, steps: 3, tread: 0.65 } as const;
/** Le pied de l'escalier, sur l'herbe. */
const STAIRS_FOOT = TERRACE.z1 + STAIRS.steps * STAIRS.tread;

/** Le portique du gong, à droite de l'escalier : son milieu, sa demi-largeur, sa hauteur ; le gong, son rayon et son centre. */
const GONG = { x: 3.4, z: 4.2, half: 1.0, h: 2.6, post: 0.2, r: 0.7, y: 1.4 } as const;

/** Les plateaux à messages, de part et d'autre de l'allée ; les deux qui sont renversés dans la ruine. */
const TRAYS = { spots: [[-1.7, 5.0], [1.7, 5.0], [-1.7, 7.0], [1.7, 7.0]] as const, fallen: [[-0.9, 5.6, 0.6], [0.7, 7.4, -0.9]] as const, h: 0.95 } as const;

/** L'allée de pierre claire, du pied de l'escalier vers la porte : sa demi-largeur, son bout. */
const ALLEY = { half: 1.0, end: 8.4 } as const;

/** La lanterne du majordome (au mur, à gauche de la porte du milieu), celle du perron (à droite), celle du chemin. */
const LANTERNS = { wallY: 2.9, majordome: -1.05, perron: 1.05, path: { x: -1.9, z: 8.6, h: 1.4 } } as const;

/** Le pan de toit tombé, appuyé contre la façade de l'aile droite (la ruine) : de `x0` à `x1`, son haut contre le mur. */
const FALLEN_PAN = { x0: 4.7, x1: 7.5, top: 3.3, foot: 0.45 } as const;

/** L'herbe sèche de la ruine, au bord de la terrasse cassée et au pied de l'aile droite. */
const DRY = [
  { x: 6.6, z: 2.4, s: 1 },
  { x: 5.2, z: 0.9, s: 0.8 },
  { x: -6.4, z: 2.5, s: 0.85 },
  { x: 8.6, z: -0.6, s: 0.9 },
] as const;

/** La porte du lieu, dans le repère du palais : à droite de l'escalier, devant lui. */
const DOOR = (() => {
  const c = Math.cos(TURN),
    s = Math.sin(TURN);
  return { x: SITE.door.x * c + SITE.door.z * s, z: -SITE.door.x * s + SITE.door.z * c };
})();

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 3) : au nord-nord-est (27°), de la porte au sud-sud-ouest ; le palais de face, à gauche
 * du milieu, son escalier et le gong à gauche de Kéo ; au loin à droite, au-delà de la rive, le zeppelin. Le soleil vient
 * de la droite.
 */
const DOOR_VIEW = capOf(FACING - 180);

/** La vue d'arrivée basse, à hauteur de Kéo, un peu reculée : le palais entier dans le cadre. */
const DOOR_FRAME = { height: -2.2, back: 1.5 } as const;

// ---------- Les volumes ----------

/** Le pied du palais : le plus bas du sol sous ses coins et sa terrasse. */
const base = once(() => Math.min(...[BODY.x0, BODY.x1].flatMap((x) => [BODY.z0, TERRACE.z1].map((z) => groundAt(x, z)))) - 0.05);

/** Le point du nom sur la Carte, au-dessus du faîte, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + BODY.h + BODY.ridge + 1.6;
  },
  z: 0,
};

/** Un mur plein du palais, de `x0` à `x1`, de son socle à `h` (un haut ébréché : `h1` à son bout droit). */
function walls(l: FacetBuilder, x0: number, x1: number, h: number, h1 = h): void {
  const y = base();
  if (h1 === h) l.box({ x: (x0 + x1) / 2, y: y + SINK_3E, z: (BODY.z0 + BODY.z1) / 2 }, [x1 - x0, h - SINK_3E, BODY.z1 - BODY.z0], C3E.stoneShade, C3E.stone);
  else {
    // Le haut ébréché, en trois pans de moins en moins hauts vers le bout cassé.
    const n = 3;
    for (let k = 0; k < n; k++) {
      const a = x0 + ((x1 - x0) * k) / n,
        c = x0 + ((x1 - x0) * (k + 1)) / n;
      const top = h + ((h1 - h) * (k + 0.5)) / n;
      l.box({ x: (a + c) / 2, y: y + SINK_3E, z: (BODY.z0 + BODY.z1) / 2 }, [c - a + 0.01, top - SINK_3E, BODY.z1 - BODY.z0], C3E.stoneShade, C3E.stone);
    }
  }
  // Le socle de granit, un peu en saillie, sur toute la longueur.
  l.box({ x: (x0 + x1) / 2, y: y + SINK_3E, z: (BODY.z0 + BODY.z1) / 2 }, [x1 - x0 + 0.02, BODY.plinth - SINK_3E, BODY.z1 - BODY.z0 + 0.16], C3E.graniteShade, C3E.granite);
}

/** Le haut ébréché de l'aile droite (la ruine), au droit de `x` : le pan de mur de `walls` qui le porte. */
const BROKEN = { h: BODY.h - 0.4, h1: BODY.h - 1.5 } as const;
function brokenTop(x: number): number {
  const k = Math.min(2, Math.max(0, Math.floor(((x - BODY.wing) / (BODY.x1 - BODY.wing)) * 3)));
  return BROKEN.h + ((BROKEN.h1 - BROKEN.h) * (k + 0.5)) / 3;
}

/** Le toit d'ardoise à deux pans, de `x0` à `x1`, et la neige au faîte, peu. */
function roof(l: FacetBuilder, x0: number, x1: number): void {
  const y = base() + BODY.h;
  const sx = x1 - x0 + 2 * BODY.eave;
  const sz = BODY.z1 - BODY.z0 + 2 * BODY.eave;
  const at = { x: (x0 + x1) / 2, y, z: (BODY.z0 + BODY.z1) / 2 };
  l.gableRoof(at, sx, sz, BODY.ridge, C3E.slate, C3E.stoneShade);
  const k = BODY.snow;
  l.gableRoof({ ...at, y: y + BODY.ridge * (1 - k) + 0.02 }, sx + 0.02, sz * k, BODY.ridge * k, C3E.snow, C3E.snow);
}

/** Une haute porte de la façade : fermée (bois), vide (le creux d'une fenêtre sans vitre), vitrée, ou ouverte sur le salon. */
function facadeDoor(l: FacetBuilder, x: number, kind: 'closed' | 'hollow' | 'glazed' | 'open', top: number = DOORS.top): void {
  const y0 = base() + TERRACE.h;
  const h = top - TERRACE.h;
  // Une porte ouverte se pose un cran devant la fenêtre vitrée qu'elle remplace.
  const z = BODY.z1 + (kind === 'open' ? 0.09 : 0.03);
  const color = kind === 'closed' ? C3E.woodShade : kind === 'hollow' ? C.hollow : kind === 'glazed' ? C.glass : C.salon;
  l.box({ x, y: y0, z }, [DOORS.w, h, 0.08], color);
  // Le linteau de pierre claire, un cran plus clair que le mur.
  l.box({ x, y: y0 + h, z: z + 0.02 }, [DOORS.w + 0.3, 0.18, 0.12], C3E.stoneShade, C3E.stone);
  if (kind === 'open')
    for (const side of [-1, 1]) l.box({ x: x + side * (DOORS.w / 2 + 0.05), y: y0, z: z + 0.32 }, [0.06, h, 0.6], C3E.woodShade, C3E.wood);
  if (kind === 'glazed') l.box({ x, y: y0 + h * 0.55, z: z + 0.03 }, [DOORS.w, 0.06, 0.06], C3E.woodShade);
}

/** Les fenêtres du dos, vitrées, toujours là (de dos, le palais se lit entier). */
function backWindows(l: FacetBuilder): void {
  const y = base();
  for (const x of BACK_WINDOWS.xs) l.box({ x, y: y + BACK_WINDOWS.y0, z: BODY.z0 - 0.04 }, [BACK_WINDOWS.w, BACK_WINDOWS.y1 - BACK_WINDOWS.y0, 0.08], C.glass);
}

/** La terrasse et le grand escalier, refaits (pierre neuve), ou dans la ruine : deux marches fendues, un coin cassé. */
function terrace(l: FacetBuilder, fresh: boolean): void {
  const y = base();
  const T = TERRACE;
  const top = fresh ? C3E.stone : C3E.stoneShade;
  if (fresh) l.box({ x: (T.x0 + T.x1) / 2, y: y + SINK_3E, z: (T.z0 + T.z1) / 2 }, [T.x1 - T.x0, T.h - SINK_3E, T.z1 - T.z0], C3E.graniteShade, top);
  else {
    // Le coin droit cassé : la terrasse s'arrête à 5,4, un bloc plus bas au-delà.
    l.box({ x: (T.x0 + 5.4) / 2, y: y + SINK_3E, z: (T.z0 + T.z1) / 2 }, [5.4 - T.x0, T.h - SINK_3E, T.z1 - T.z0], C3E.graniteShade, top);
    l.box({ x: 6.2, y: y + SINK_3E, z: (T.z0 + T.z1) / 2 - 0.4, yaw: 0.06 }, [1.5, T.h - 0.3 - SINK_3E, T.z1 - T.z0 - 0.8], C3E.graniteShade, top);
  }
  for (let k = 0; k < STAIRS.steps; k++) {
    const h = T.h - (k + 1) * (T.h / STAIRS.steps);
    const z = T.z1 + (k + 0.5) * STAIRS.tread;
    const cracked = !fresh && k < 2;
    if (!cracked) {
      l.box({ x: 0, y: y + SINK_3E, z }, [2 * STAIRS.half - k * 0.3, h + T.h / STAIRS.steps - SINK_3E - 0.0001, STAIRS.tread], C3E.graniteShade, top);
      continue;
    }
    // Une marche fendue en deux, la moitié droite un peu affaissée.
    const w = STAIRS.half - k * 0.15;
    l.box({ x: -w / 2 - 0.08, y: y + SINK_3E, z }, [w - 0.08, h + T.h / STAIRS.steps - SINK_3E, STAIRS.tread], C3E.graniteShade, top);
    l.box({ x: w / 2 + 0.08, y: y + SINK_3E, z, yaw: 0.04 }, [w - 0.08, h + T.h / STAIRS.steps - 0.08 - SINK_3E, STAIRS.tread], C3E.graniteShade, top);
  }
}

/** Les chevrons à nu de l'aile droite (la ruine) : trois paires, du haut des murs au faîte, sans faîtage qui dépasse. */
function rafters(l: FacetBuilder): void {
  const y = base() + BODY.h - 0.5;
  const zm = (BODY.z0 + BODY.z1) / 2;
  for (const x of [2.6, 4.6, 6.6]) {
    l.beam({ x, y, z: BODY.z1 - 0.2 }, { x, y: y + BODY.ridge * 0.9, z: zm }, 0.16, C3E.woodShade);
    l.beam({ x, y, z: BODY.z0 + 0.2 }, { x, y: y + BODY.ridge * 0.9, z: zm }, 0.16, C3E.woodShade);
  }
}

/** Le pan de toit tombé, appuyé contre la façade de l'aile droite : son dessous de bois et ses lattes tournés vers la porte. */
function fallenPan(l: FacetBuilder): void {
  const y = base();
  const P = FALLEN_PAN;
  const zTop = BODY.z1 + 0.12,
    zFoot = BODY.z1 + 1.6;
  sheet(
    l,
    [
      [P.x0, y + P.top, zTop],
      [P.x1, y + P.top, zTop],
      [P.x1 + 0.2, y + TERRACE.h + P.foot - 0.4, zFoot],
      [P.x0 - 0.1, y + TERRACE.h + P.foot - 0.4, zFoot],
    ],
    0.12,
    C3E.wood,
    C3E.slate,
  );
  for (const t of [0.25, 0.5, 0.75]) {
    const yy = y + P.top + (TERRACE.h + P.foot - 0.4 - P.top) * t + 0.14;
    const zz = zTop + (zFoot - zTop) * t + 0.05;
    l.beam({ x: P.x0 + 0.05, y: yy, z: zz }, { x: P.x1 + 0.1, y: yy, z: zz }, 0.08, C3E.woodShade);
  }
}

/** Le gong de fer bruni dans son portique de bois : deux poteaux, une traverse qui s'arrête à eux, deux attaches. */
function gongUp(l: FacetBuilder): void {
  const G = GONG;
  const y = groundAt(G.x, G.z);
  for (const side of [-1, 1]) l.box({ x: G.x + side * (G.half - G.post / 2), y: y + SINK_3E, z: G.z }, [G.post, G.h - SINK_3E, G.post], C3E.woodShade, C3E.wood);
  l.box({ x: G.x, y: y + G.h - 0.24, z: G.z }, [2 * G.half, 0.24, G.post + 0.04], C3E.woodShade, C3E.wood);
  for (const side of [-1, 1]) l.beam({ x: G.x + side * 0.4, y: y + G.h - 0.24, z: G.z }, { x: G.x + side * 0.3, y: y + G.y + G.r * 0.8, z: G.z }, 0.04, C3E.iron);
  l.drum({ x: G.x, y: y + G.y, z: G.z - 0.05, pitch: Math.PI / 2 }, G.r, 0.1, 12, C3E.iron, C3E.ironTop);
  l.drum({ x: G.x, y: y + G.y, z: G.z + 0.05, pitch: Math.PI / 2 }, G.r * 0.28, 0.06, 8, C3E.iron, C3E.iron);
}

/** Le gong couché au pied de son portique tombé (la ruine) : les deux poteaux et la traverse dans l'herbe. */
function gongDown(l: FacetBuilder): void {
  const G = GONG;
  const y = groundAt(G.x, G.z);
  l.box({ x: G.x - 0.4, y: y - 0.05, z: G.z + 0.6, yaw: 0.35 }, [G.post, G.post, G.h - 0.3], C3E.woodShade, C3E.wood);
  l.box({ x: G.x + 0.9, y: y - 0.05, z: G.z + 0.2, yaw: -0.2 }, [G.post, G.post, G.h], C3E.woodShade, C3E.wood);
  l.box({ x: G.x + 0.3, y: y - 0.05, z: G.z + 1.7, yaw: 1.4 }, [2 * G.half, 0.22, G.post], C3E.woodShade, C3E.wood);
  l.drum({ x: G.x - 0.6, y: y + 0.08, z: G.z - 0.5, pitch: 0.22 }, G.r, 0.1, 12, C3E.iron, C3E.ironTop);
}

/** Un plateau à messages sur son pied : un fût de bois, le plateau d'étain, un message plié dessus. */
function trayUp(l: FacetBuilder, x: number, z: number): void {
  const y = groundAt(x, z);
  l.prism({ x, y: y - 0.1, z }, 0.16, 0.1, TRAYS.h + 0.1, 6, C3E.woodShade, C3E.wood);
  l.drum({ x, y: y + TRAYS.h, z }, 0.38, 0.05, 8, C.tray, C.tray);
  l.box({ x, y: y + TRAYS.h + 0.05, z, yaw: 0.3 }, [0.3, 0.04, 0.2], C.paper);
}

/** Un plateau renversé dans l'herbe (la ruine) : le pied couché, le plateau de travers. */
function trayDown(l: FacetBuilder, x: number, z: number, yaw: number): void {
  const y = groundAt(x, z);
  l.box({ x, y: y - 0.05, z, yaw }, [0.2, 0.2, TRAYS.h], C3E.woodShade, C3E.wood);
  l.drum({ x: x + Math.sin(yaw) * 0.7, y: y + 0.02, z: z + Math.cos(yaw) * 0.7, pitch: 0.3, yaw }, 0.38, 0.05, 8, C.tray, C.tray);
}

/** L'allée de pierre claire, du pied de l'escalier vers la porte, en dalles. */
function alley(l: FacetBuilder): void {
  const n = 4;
  const from = STAIRS_FOOT + 0.05;
  const step = (ALLEY.end - from) / n;
  for (let k = 0; k < n; k++) {
    const z = from + (k + 0.5) * step;
    l.box({ x: 0, y: groundAt(0, z) - 0.06, z }, [2 * ALLEY.half, 0.1, step - 0.08], C3E.joint, k % 2 ? C3E.stone : C3E.stoneShade);
  }
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : l'aile gauche et le milieu, debout, et leurs fenêtres du dos ; la lanterne du majordome, au mur du
  // perron, la seule allumée de la ruine.
  add('ruine', 0, (b) =>
    posed(b, (l) => {
      walls(l, BODY.x0, BODY.wing, BODY.h);
      backWindows(l);
      armLantern3e(l, LANTERNS.majordome, base() + LANTERNS.wallY, BODY.z1 + 0.05, 0, 1, true);
    }),
  );
  // Le corps 1 refait la terrasse et l'escalier fendus.
  add('ruine', 0, (b) => posed(b, (l) => terrace(l, false)), corps1);
  // Le corps 2 relève l'aile droite : ses murs ébréchés, ses fenêtres vides, ses chevrons à nu, le pan de toit appuyé
  // contre la façade, le toit de l'aile gauche seul, l'herbe sèche à son pied.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        walls(l, BODY.wing, BODY.x1, BROKEN.h, BROKEN.h1);
        for (const x of DOORS.wing) facadeDoor(l, x, 'hollow', Math.min(DOORS.top, brokenTop(x) - 0.45));
        rafters(l);
        fallenPan(l);
        roof(l, BODY.x0, BODY.wing);
        for (const d of DRY) dryTuft3e(l, d.x, groundAt(d.x, d.z), d.z, d.s);
      }),
    corps2,
  );
  // Le haut ouvre les portes des salons de l'aile gauche, fermées, et relève le gong couché et son portique tombé.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        for (const x of DOORS.xs) if (!(DOORS.wing as readonly number[]).includes(x)) facadeDoor(l, x, 'closed');
        gongDown(l);
      }),
    haut,
  );
  // Les abords relèvent les deux plateaux renversés.
  add('ruine', 0, (b) => posed(b, (l) => TRAYS.fallen.forEach(([x, z, yaw]) => trayDown(l, x, z, yaw))), abords);

  // ---- Le corps 1 : la terrasse et le grand escalier, refaits.
  add(0, 0, (b) => posed(b, (l) => terrace(l, true)));
  // ---- Le corps 2 : l'aile droite, ses murs, ses hautes fenêtres vitrées, et le toit d'ardoise entier.
  add(0, 0.5, (b) =>
    posed(b, (l) => {
      walls(l, BODY.wing, BODY.x1, BODY.h);
      roof(l, BODY.x0, BODY.x1);
    }),
  );
  // Ses hautes fenêtres vitrées : les portes ouvertes du haut se posent devant elles, un cran en avant.
  add(0, 0.5, (b) => posed(b, (l) => DOORS.wing.forEach((x) => facadeDoor(l, x, 'glazed'))));
  // ---- Le haut : les portes des salons ouvertes, alignées ; le gong relevé dans son portique ; la lanterne du perron.
  add(1, 0, (b) =>
    posed(b, (l) => {
      for (const x of DOORS.xs) facadeDoor(l, x, 'open');
      gongUp(l);
      armLantern3e(l, LANTERNS.perron, base() + LANTERNS.wallY, BODY.z1 + 0.05, 0, 1, true);
    }),
  );
  // ---- Les abords : les plateaux à messages sur leurs pieds, l'allée de pierre claire, la lanterne du chemin.
  add(2, 0, (b) =>
    posed(b, (l) => {
      for (const [x, z] of TRAYS.spots) trayUp(l, x, z);
      alley(l);
      const p = LANTERNS.path;
      postLantern3e(l, p.x, groundAt(p.x, p.z), p.z, p.h, true);
    }),
  );
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère du palais, loin du chemin et de la scène. */
const TRACE_SPOTS_P = {
  carpet: { x: -4.6, z: -0.4 },
  candles: { x: 5.6, z: -0.9 },
  broom: { x: -0.9, z: -1.25 },
  bench: { x: -7.2, z: 4.4 },
} as const;

/** Les mêmes, dans le repère du lieu. */
const TRACE_SPOTS = {
  carpet: local(TRACE_SPOTS_P.carpet.x, TRACE_SPOTS_P.carpet.z),
  candles: local(TRACE_SPOTS_P.candles.x, TRACE_SPOTS_P.candles.z),
  broom: local(TRACE_SPOTS_P.broom.x, TRACE_SPOTS_P.broom.z),
  bench: local(TRACE_SPOTS_P.bench.x, TRACE_SPOTS_P.bench.z),
} as const;

/** Dessine une trace dans le repère du palais, posée au centre du lieu. */
const traceIn = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => inWorld(b, c, draw, YAW);

/** Un grand tapis roulé, couché sur la terrasse (For et since). */
function carpet(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.carpet;
    const y = base() + TERRACE.h;
    l.drum({ x: x - 1.1, y: y + 0.22, z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.22, 2.2, 8, C.carpetShade, C.carpet);
    l.band({ x: x - 0.6, y: y + 0.22, z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.23, 0.1, 8, C3E.leather);
    l.band({ x: x + 0.5, y: y + 0.22, z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.23, 0.1, 8, C3E.leather);
  });
}

/** Deux chandeliers de fer debout, côte à côte, sur une console de bois (If). */
function candles(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.candles;
    const y = base() + TERRACE.h;
    for (const dx of [-0.42, 0.42]) l.box({ x: x + dx, y: y - 0.05, z }, [0.08, 0.8, 0.3], C3E.woodShade);
    l.box({ x, y: y + 0.75, z }, [1.1, 0.08, 0.4], C3E.woodShade, C3E.newWood);
    for (const dx of [-0.24, 0.24]) {
      l.prism({ x: x + dx, y: y + 0.83, z }, 0.1, 0.05, 0.06, 6, C3E.iron);
      l.prism({ x: x + dx, y: y + 0.88, z }, 0.035, 0.035, 0.42, 6, C3E.iron);
      l.prism({ x: x + dx, y: y + 1.28, z }, 0.09, 0.09, 0.04, 6, C3E.iron, C3E.ironTop);
      l.prism({ x: x + dx, y: y + 1.32, z }, 0.04, 0.04, 0.16, 6, C.candle);
    }
  });
}

/** Un plumeau et un balai debout côte à côte, contre la porte du milieu (Passif). */
function broom(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.broom;
    const y = base() + TERRACE.h;
    // Le balai : son manche, sa brosse de paille, la paille en bas.
    l.box({ x, y: y + 0.32, z, pitch: -0.08 }, [0.05, 1.25, 0.05], C3E.wood);
    l.prism({ x, y: y - 0.02, z: z + 0.02, pitch: -0.08 }, 0.2, 0.08, 0.36, 6, C3E.dry, C3E.dryShade);
    // Le plumeau : son manche plus court, sa touffe.
    l.box({ x: x + 0.38, y: y - 0.02, z, pitch: -0.1 }, [0.04, 1.0, 0.04], C3E.woodShade);
    l.prism({ x: x + 0.38, y: y + 0.98, z: z + 0.1, pitch: -0.1 }, 0.08, 0.2, 0.3, 6, C3E.canvas, C3E.canvasShade);
  });
}

/** Un banc de pierre, et deux vasques de pierre plantées de fleurs de part et d'autre (Messages ; correction 16). */
function bench(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.bench;
    const y = groundAt(x, z);
    for (const dx of [-0.6, 0.6]) l.box({ x: x + dx, y: y - 0.1, z }, [0.24, 0.52, 0.42], C3E.graniteShade, C3E.granite);
    l.box({ x, y: y + 0.42, z }, [1.7, 0.1, 0.5], C3E.stoneShade, C3E.stone);
    for (const dx of [-1.45, 1.45]) {
      l.prism({ x: x + dx, y: y - 0.1, z }, 0.16, 0.12, 0.42, 8, C3E.stoneShade, C3E.stone);
      l.prism({ x: x + dx, y: y + 0.32, z }, 0.22, 0.38, 0.28, 8, C3E.stoneShade, C3E.stone);
      l.prism({ x: x + dx, y: y + 0.6, z }, 0.34, 0.12, 0.3, 6, C.leaf);
      for (const [fx, fz] of [
        [0.12, 0.05],
        [-0.1, -0.08],
        [0.02, -0.14],
      ] as const)
        l.prism({ x: x + dx + fx, y: y + 0.82, z: z + fz }, 0.07, 0.05, 0.08, 5, C.flower);
    }
  });
}

/** Les quatre traces, une par mission, chacune avec sa partie : le corps (2), le haut, les abords. */
const TRACES = {
  'for-since': { at: TRACE_SPOTS.carpet, lift: 1.2, stage: 0, row: 0, draw: carpet },
  if: { at: TRACE_SPOTS.candles, lift: 1.4, stage: 0, row: 0.5, draw: candles },
  passive: { at: TRACE_SPOTS.broom, lift: 1.4, stage: 1, row: 0, draw: broom },
  messages: { at: TRACE_SPOTS.bench, lift: 1, stage: 2, row: 0, draw: bench },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la scénette (proposition, § 3) : à l'ouest-sud-ouest, vers les arches basses et la montagne au loin,
 * le soleil dans le dos ; le zeppelin hors du cadre.
 */
const SCENE_START = capOf(250);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le majordome). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/**
 * Le milieu de la scène, depuis le centre du lieu : sur l'herbe devant l'aile gauche, à gauche de l'escalier (la caméra,
 * à l'est-nord-est de la scène, reste devant le palais, jamais dans ses murs).
 */
const SCENE_SPOT = (() => {
  const p = local(-6.2, 7.6);
  return { dx: p.x, dz: p.z, half: [2.4, 1.2] as [number, number] } as const;
})();

/** L'écart de Kéo et du majordome au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe de la Prairie. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** Le plateau des tasses : sa hauteur à l'échelle 1 ; une tasse choisie se soulève d'un cran. */
const TABLE = { height: 0.62, lift: 0.28, cup: 0.2 } as const;

/** Une tasse de porcelaine et son anse, sans motif ; toutes pareilles. */
function cup(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.1 * s, 0.13 * s, 0.17 * s, 8, C.porcelain, C3E.stoneShade);
  b.box({ x: at.x + 0.15 * s, y: at.y + 0.05 * s, z: at.z }, [0.05 * s, 0.09 * s, 0.03 * s], C.porcelain);
}

export const PALAIS: PlaceArt = {
  role: 'Le majordome',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x8a8a86);
  },
  answer: {
    size: { height: TABLE.height + TABLE.lift + TABLE.cup, half: 0.3 },
    facing: true,
    // Une console basse de bois, et sur elle le plateau d'étain sous le rang des tasses.
    base(b, mid, y, z, span, s, ground) {
      const top = y + TABLE.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.08 * s, 0.46 * s], C3E.woodShade, C3E.newWood);
      b.box({ x: mid, y: top - 0.02 * s, z }, [span + 0.4, 0.03 * s, 0.34 * s], C.tray);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.1 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Une tasse, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      cup(b, { x: at.x, y: at.y + (TABLE.height + 0.01 + (picked ? TABLE.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.4, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Palais, pour les tests. */
export const PALAIS_LAYOUT = {
  body: BODY,
  terrace: TERRACE,
  stairsFoot: STAIRS_FOOT,
  gong: GONG,
  trays: TRAYS,
  facing: FACING,
  local,
  /** Un point du repère du lieu dans le repère du palais (l'inverse de `local`). */
  toFrame: (x: number, z: number): Vec2 => ({ x: x * Math.cos(TURN) + z * Math.sin(TURN), z: -x * Math.sin(TURN) + z * Math.cos(TURN) }),
  base,
  brokenTop,
  hollow: C.hollow,
  planeY,
  door: SITE.door,
  doorInFrame: DOOR,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
