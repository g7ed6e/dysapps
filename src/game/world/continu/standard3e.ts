// Le Standard (le Cirque du 3e, GD-25 ; proposition du consultant d'Archipéo, § 5, relecture des lieux du directeur
// artistique et relecture des Prairies, (b) 1 et 2) : « le petit poste qui reliait le Fanal aux autres archipels par des
// fils ». Sur le gabarit des Ondes (./ondes3e.ts), avec le kit du 3e (./place3eKit.ts). Une salle de pierre claire, large
// et basse, sur son socle de granit, son toit d'ardoise un peu enneigé au faîte ; sa façade ouverte sous un auvent de
// bois ; dedans, contre le mur du fond, le tableau à fiches de bois, ses rangs de douilles et ses cordons en boucles ; au-
// dessus, une rangée de lampes témoins ; devant, le bureau et le casque ; dehors, la ligne des poteaux de bois et leurs
// fils tendus jusqu'au Fanal. Aucun numéro, aucune lettre.
//
// La salle regarde l'est-sud-est, la porte du lieu (`FACING`) : tout se dessine dans son repère (`x` le long de la
// façade, vers la droite de qui la regarde ; `z` vers le devant), tourné d'un bloc. La vue d'arrivée regarde l'ouest-
// nord-ouest (297°) : la salle de face, le tableau par la façade ouverte, le premier poteau à droite, le Lac au-delà.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : le pan avant du toit ouvert, les chevrons
// à nu ; sa moitié gauche tombée devant la salle, penchée, l'ardoise vers la porte et ses chevrons qui dépassent
// (relecture des Prairies, (b) 2) ; le tableau couché au sol, ses cordons en boucles ; les lampes témoins en place,
// éteintes ; trois poteaux, l'un penché, les fils tombés en boucles lâches ; l'herbe sèche. Une seule lumière, la
// lanterne de la télégraphiste, à la porte de la salle. Quatre parties (2 + 1 + 1) : la salle (son toit, son auvent) ;
// le tableau redressé, ses cordons rangés, le casque ; le haut (les lampes témoins allumées ensemble, la lanterne de la
// façade) ; les abords (les poteaux debout et les fils jusqu'au Fanal, le chemin, la lanterne du chemin). Une trace par
// mission, avec sa partie.
//
// Les poteaux portent loin (de 9 à 45 unités) : hors du premier, ils sont hors du modèle du lieu (`PlaceArt.reach`, comme
// les câbles des Nacelles du 5e), sans effet sur la marche, la flore, la caméra ni le toucher, absents de la Carte. Code pur.
//
// Le Standard se lit en trois fichiers : son repère et son plan (./standardFrame3e.ts), la ligne des poteaux
// (./standardLine3e.ts), et ici la salle, sa ruine, ses traces et sa scénette.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTufts3e, habitant3e, pathLantern3e, scene3e } from './place3eKit';
import { capOf, inWorld, sheet, type P3 } from './place4eKit';
import { ALLEY, AWNING, BOARD, C, DESK, DRY, FACING, FALLEN_BOARD, FALLEN_PAN, LAMPS, PATH_LANTERN, POLE, ROOM, SITE, YAW, base, floor, groundAt, local, posed } from './standardFrame3e';
import { FANAL_AT, FANAL_HOOK, LINE, firstPole, firstWires, firstWiresDown, poleLine } from './standardLine3e';

// ---------- La vue ----------

/** Le cap d'arrivée (proposition, § 5) : à l'ouest-nord-ouest (297°), de la porte à l'est-sud-est ; le soleil dans le dos. */
const DOOR_VIEW = capOf(FACING + 180);

/** La vue d'arrivée, un peu plus près et plus bas que la caméra qui suit : la salle se lit par sa façade ouverte. */
const DOOR_FRAME = { height: -1.0, back: 0.9 } as const;

// ---------- Les volumes ----------

/** Le point du nom sur la Carte, au-dessus de la salle, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + ROOM.h + ROOM.ridge + 1.6;
  },
  z: 0,
};

/** Le socle de granit, sous la salle et son auvent. */
function plinth(l: FacetBuilder): void {
  const R = ROOM;
  l.box(
    { x: 0, y: base() + SINK_3E, z: (R.z0 + AWNING.z1) / 2 },
    [AWNING.x1 - AWNING.x0 + 0.2, R.plinth - SINK_3E, AWNING.z1 - R.z0 + 0.2],
    C3E.graniteShade,
    C3E.granite,
  );
}

/** Un pignon de pierre claire, en triangle sous le faîte, à `x`, ses deux faces : sa moitié du dos (`back`), sous le pan qui tient, ou sa moitié de devant. */
function gable(l: FacetBuilder, x: number, back: boolean): void {
  const R = ROOM;
  const y = floor() + R.h;
  const zm = (R.z0 + R.z1) / 2;
  const z = back ? R.z0 : R.z1;
  for (const s of [-1, 1]) {
    const px = x + s * (R.wall / 2);
    const a: P3 = [px, y, z],
      b: P3 = [px, y, zm],
      c: P3 = [px, y + R.ridge - 0.05, zm];
    const out = (s > 0) === back;
    if (out) l.triangle(a, c, b, s > 0 ? C3E.stone : C3E.stoneShade);
    else l.triangle(a, b, c, s > 0 ? C3E.stone : C3E.stoneShade);
  }
}

/** Les murs de la salle : le fond, les deux pignons, les deux trumeaux de la façade et le linteau de la baie ; la lanterne de la télégraphiste. */
function roomWalls(l: FacetBuilder): void {
  const R = ROOM;
  const y = floor() - 0.05;
  const t = R.wall;
  // Le mur du fond, son dedans un rien plus sombre, pour que le tableau s'y lise.
  l.box({ x: 0, y, z: R.z0 + t / 2 }, [R.x1 - R.x0, R.h + 0.05, t], C3E.stoneShade, C3E.stone);
  for (const x of [R.x0 + t / 2, R.x1 - t / 2]) {
    l.box({ x, y, z: (R.z0 + R.z1) / 2 }, [t, R.h + 0.05, R.z1 - R.z0], C3E.stoneShade, C3E.stone);
    gable(l, x, true);
  }
  for (const [a, c] of [
    [R.x0, R.bay.x0],
    [R.bay.x1, R.x1],
  ] as const)
    l.box({ x: (a + c) / 2, y, z: R.z1 - t / 2 }, [c - a, R.h + 0.05, t], C3E.stoneShade, C3E.stone);
  l.box({ x: 0, y: floor() + R.bay.h, z: R.z1 - t / 2 }, [R.bay.x1 - R.bay.x0 + 0.1, R.h - R.bay.h, t + 0.04], C3E.graniteShade, C3E.granite);
  armLantern3e(l, R.x1 - 0.25, floor() + 2.2, R.z1 + 0.02, 0, 1, true);
}

/** Le toit d'ardoise entier, sur la moitié de devant des pignons, et la neige au faîte. */
function roomRoof(l: FacetBuilder): void {
  const R = ROOM;
  for (const x of [R.x0 + R.wall / 2, R.x1 - R.wall / 2]) gable(l, x, false);
  const at = { x: 0, y: floor() + R.h, z: (R.z0 + R.z1) / 2 };
  const sx = R.x1 - R.x0 + 2 * R.eave,
    sz = R.z1 - R.z0 + 2 * R.eave;
  l.gableRoof(at, sx, sz, R.ridge, C3E.slate, C3E.stone);
  l.gableRoof({ ...at, y: at.y + R.ridge * (1 - R.snow) + 0.02 }, sx + 0.02, sz * R.snow, R.ridge * R.snow, C3E.snow, C3E.snow);
}

/** Le toit ouvert de la ruine : le pan du dos seul, la neige au faîte, les chevrons à nu du côté de la porte. */
function roomRoofOpen(l: FacetBuilder): void {
  const R = ROOM;
  const y = floor() + R.h;
  const zm = (R.z0 + R.z1) / 2;
  const x0 = R.x0 - R.eave,
    x1 = R.x1 + R.eave;
  sheet(
    l,
    [
      [x1, y - 0.2, R.z0 - R.eave],
      [x0, y - 0.2, R.z0 - R.eave],
      [x0, y + R.ridge - 0.1, zm],
      [x1, y + R.ridge - 0.1, zm],
    ],
    0.1,
    C3E.slate,
    C3E.wood,
  );
  l.box({ x: 0, y: y + R.ridge - 0.06, z: zm - 0.3 }, [x1 - x0, 0.07, 0.6], C3E.snow);
  for (const x of [-2.6, -0.9, 0.9, 2.6]) l.beam({ x, y: y - 0.05, z: R.z1 + 0.1 }, { x, y: y + R.ridge * 0.92, z: zm }, 0.13, C3E.woodShade);
}

/** Le pan avant tombé (la ruine), en deux morceaux : l'un couché, l'ardoise vers la porte ; l'autre debout contre le trumeau gauche, son dessous de bois et ses chevrons vers la porte. */
function panDown(l: FacetBuilder): void {
  const F = FALLEN_PAN.flat;
  const hi = floor() + F.lift;
  const lo = (x: number) => groundAt(x, F.front) + 0.04;
  sheet(
    l,
    [
      [F.x1, lo(F.x1), F.front],
      [F.x0, lo(F.x0), F.front],
      [F.x0, hi, F.back],
      [F.x1, hi, F.back],
    ],
    0.1,
    C3E.slateTop,
    C3E.wood,
  );
  // L'autre morceau, debout, penché contre le trumeau : son ardoise contre la pierre, son dessous de bois et ses trois chevrons vers la porte.
  const L = FALLEN_PAN.leaning;
  const z = ROOM.z1 + 0.05;
  const fy = (x: number) => groundAt(x, z + L.foot);
  sheet(
    l,
    [
      [L.x0, fy(L.x0), z + L.foot],
      [L.x1, fy(L.x1), z + L.foot],
      [L.x1, floor() + L.top, z],
      [L.x0, floor() + L.top, z],
    ],
    0.1,
    C3E.newWood,
    C3E.slate,
  );
  for (const x of [L.x0 + 0.3, (L.x0 + L.x1) / 2, L.x1 - 0.3])
    l.beam({ x, y: fy(x) + 0.08, z: z + L.foot + 0.05 }, { x, y: floor() + L.top + 0.35, z: z + 0.02 }, 0.13, C3E.woodShade);
}

/** L'auvent debout : ses deux poteaux, sa poutre, son toit de bois en appentis contre la façade. */
function awning(l: FacetBuilder): void {
  const A = AWNING;
  const y = floor();
  for (const x of A.posts) l.box({ x, y: y - 0.02, z: A.z1 - 0.15 }, [A.post, A.edgeY - 0.08, A.post], C3E.woodShade, C3E.wood);
  l.box({ x: 0, y: y + A.edgeY - 0.1, z: A.z1 - 0.15 }, [A.posts[1] - A.posts[0] + A.post, 0.18, 0.18], C3E.woodShade, C3E.wood);
  sheet(
    l,
    [
      [A.x1, y + A.wallY, ROOM.z1],
      [A.x0, y + A.wallY, ROOM.z1],
      [A.x0, y + A.edgeY, A.z1 + 0.2],
      [A.x1, y + A.edgeY, A.z1 + 0.2],
    ],
    0.1,
    C3E.newWood,
    C3E.wood,
  );
}

/** Le tableau à fiches, dans un repère `k` posé sur sa face arrière (x le long, y vers le haut, z vers l'avant) : le panneau, les douilles, les cordons. */
function boardShape(k: FacetBuilder, tidy: boolean): void {
  const B = BOARD;
  const h = B.y1 - B.y0;
  k.box({ x: 0, y: 0, z: 0.06 }, [B.w, h, 0.12], C3E.woodShade, C3E.newWood);
  const step = (B.w - 0.5) / (B.cols - 1);
  for (const ry of B.rows) {
    const y = ry - B.y0;
    for (let c = 0; c < B.cols; c++) {
      const x = -B.w / 2 + 0.25 + c * step;
      k.quad([x - 0.05, y - 0.05, 0.125], [x + 0.05, y - 0.05, 0.125], [x + 0.05, y + 0.05, 0.125], [x - 0.05, y + 0.05, 0.125], C.hollow);
    }
  }
  // Les cordons : rangés, trois boucles en U qui pendent d'une douille à l'autre ; défaits, plus lâches.
  const [r0, , r2] = B.rows.map((r) => r - B.y0);
  for (const [i, color] of C.cords.entries()) {
    const xa = -B.w / 2 + 0.25 + (2 * i) * step,
      xb = xa + 2 * step;
    const ya = i === 1 ? r0 : r2;
    const sag = tidy ? 0.35 : 0.6;
    const a = { x: xa + 0.12, y: ya - sag, z: 0.2 },
      e = { x: xb - 0.12, y: ya - sag, z: 0.2 };
    k.beam({ x: xa, y: ya, z: 0.16 }, a, 0.04, color);
    k.beam(a, e, 0.04, color);
    k.beam(e, { x: xb, y: ya, z: 0.16 }, 0.04, color);
  }
}

/** Le tableau debout contre le mur du fond. */
function boardUp(l: FacetBuilder): void {
  drawPosed(l, { x: BOARD.x, y: floor() + BOARD.y0, z: ROOM.z0 + ROOM.wall + 0.01, yaw: 0 }, (k) => boardShape(k, true));
}

/** Le tableau couché au sol (la ruine), devant la salle, face au ciel, ses cordons défaits. */
function boardDown(l: FacetBuilder): void {
  const { x, z } = FALLEN_BOARD;
  drawPosed(l, { x, y: groundAt(x, z) + 0.02, z: z - 0.6, yaw: 0.25, pitch: -Math.PI / 2 + 0.08 }, (k) => boardShape(k, false));
}

/** Les lampes témoins, au-dessus du tableau : éteintes, ou allumées ensemble. */
function lamps(l: FacetBuilder, lit: boolean): void {
  const z = ROOM.z0 + ROOM.wall + 0.02;
  l.box({ x: 0, y: floor() + LAMPS.y - 0.05, z: z + 0.05 }, [2.5, 0.06, 0.12], C3E.woodShade);
  for (const x of LAMPS.xs) l.box({ x, y: floor() + LAMPS.y, z: z + 0.1 }, [LAMPS.s, LAMPS.s, LAMPS.s * 0.8], lit ? C3E.lantern : C3E.lanternOff);
}

/** Le bureau devant le tableau, ses deux joues. */
function desk(l: FacetBuilder): void {
  const D = DESK;
  const z = ROOM.z0 + ROOM.wall + 0.25 + D.d / 2;
  const y = floor();
  l.box({ x: D.x, y: y + D.h - 0.08, z }, [D.w, 0.08, D.d], C3E.woodShade, C3E.newWood);
  for (const s of [-1, 1]) l.box({ x: D.x + s * (D.w / 2 - 0.06), y: y - 0.02, z }, [0.08, D.h - 0.06, D.d - 0.06], C3E.woodShade);
}

/** Le casque posé sur le bureau : ses deux écouteurs ronds et l'arceau. */
function headset(l: FacetBuilder): void {
  const x = -0.6,
    z = ROOM.z0 + ROOM.wall + 0.25 + DESK.d / 2,
    y = floor() + DESK.h;
  for (const s of [-1, 1]) l.drum({ x: x + s * 0.13, y, z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.08, 0.06, 8, C3E.leather, C3E.iron);
  l.beam({ x: x - 0.13, y: y + 0.08, z }, { x, y: y + 0.24, z }, 0.035, C3E.iron);
  l.beam({ x, y: y + 0.24, z }, { x: x + 0.13, y: y + 0.08, z }, 0.035, C3E.iron);
}

/** Le chemin de pierre claire, du devant de l'auvent vers la porte du lieu, en dalles. */
function alley(l: FacetBuilder): void {
  const n = 4;
  const from = AWNING.z1 + 0.15;
  const step = (ALLEY.end - from) / n;
  for (let k = 0; k < n; k++) {
    const z = from + (k + 0.5) * step;
    l.box({ x: ALLEY.x, y: groundAt(ALLEY.x, z) - 0.06, z }, [2 * ALLEY.half, 0.1, step - 0.08], C3E.joint, k % 2 ? C3E.stone : C3E.stoneShade);
  }
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle, les murs de la salle et la lanterne de la télégraphiste, la seule allumée de la ruine ; le
  // bureau ; le premier poteau.
  add('ruine', 0, (b) => {
    posed(b, (l) => {
      plinth(l);
      roomWalls(l);
      desk(l);
    });
    firstPole(b);
  });
  // La salle (corps 1) referme le toit ouvert et relève le pan tombé.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        roomRoofOpen(l);
        panDown(l);
      }),
    corps1,
  );
  // Le tableau (corps 2) se relève.
  add('ruine', 0, (b) => posed(b, boardDown), corps2);
  // Le haut allume les lampes témoins, éteintes jusque-là.
  add('ruine', 0, (b) => posed(b, (l) => lamps(l, false)), haut);
  // Les abords retendent les fils tombés et effacent l'herbe sèche.
  add(
    'ruine',
    0,
    (b) => {
      firstWiresDown(b);
      posed(b, (l) => dryTufts3e(l, DRY, groundAt));
    },
    abords,
  );

  // ---- La salle : son toit d'ardoise sous la neige, son auvent.
  add(0, 0, (b) =>
    posed(b, (l) => {
      roomRoof(l);
      awning(l);
    }),
  );
  // ---- Le tableau redressé contre le mur du fond, ses cordons rangés ; le casque sur le bureau.
  add(0, 0.5, (b) =>
    posed(b, (l) => {
      boardUp(l);
      headset(l);
    }),
  );
  // ---- Le haut : les lampes témoins allumées ensemble ; la lanterne de la façade.
  add(1, 0, (b) =>
    posed(b, (l) => {
      lamps(l, true);
      armLantern3e(l, ROOM.x0 + 0.25, floor() + 2.2, ROOM.z1 + 0.02, 0, 1, true);
    }),
  );
  // ---- Les abords : les fils du premier poteau, le chemin de pierre claire, la lanterne du chemin.
  add(2, 0, (b) => {
    firstWires(b);
    posed(b, (l) => {
      alley(l);
      pathLantern3e(l, PATH_LANTERN, groundAt);
    });
  });
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de la salle, loin du chemin et de la scène. */
const TRACE_SPOTS_P = {
  bench: { x: -5.9, z: 0.2 },
  pot: { x: 0.75, z: ROOM.z0 + ROOM.wall + 0.25 + DESK.d / 2 },
  ladder: { x: POLE.x - 0.35, z: POLE.z + 0.3 },
  crate: { x: 4.8, z: 3.0 },
} as const;

/** Les mêmes, dans le repère du lieu. */
const TRACE_SPOTS = {
  bench: local(TRACE_SPOTS_P.bench.x, TRACE_SPOTS_P.bench.z),
  pot: local(TRACE_SPOTS_P.pot.x, TRACE_SPOTS_P.pot.z),
  ladder: local(TRACE_SPOTS_P.ladder.x, TRACE_SPOTS_P.ladder.z),
  crate: local(TRACE_SPOTS_P.crate.x, TRACE_SPOTS_P.crate.z),
} as const;

/** Dessine une trace dans le repère de la salle, posée au centre du lieu. */
const traceIn = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => inWorld(b, c, draw, YAW);

/** Un banc de bois et une sacoche de cuir posée dessus, contre le pignon gauche (Le réseau informatique). */
function benchAndSatchel(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.bench;
    const y = groundAt(x, z);
    for (const s of [-1, 1]) l.box({ x, y: y - 0.1, z: z + s * 0.6 }, [0.38, 0.55, 0.12], C3E.woodShade);
    l.box({ x, y: y + 0.42, z }, [0.44, 0.08, 1.5], C3E.woodShade, C3E.wood);
    l.box({ x, y: y + 0.5, z: z + 0.25 }, [0.2, 0.28, 0.4], C3E.leather);
    l.beam({ x, y: y + 0.78, z: z + 0.1 }, { x, y: y + 0.92, z: z + 0.25 }, 0.03, C3E.leather);
    l.beam({ x, y: y + 0.92, z: z + 0.25 }, { x, y: y + 0.78, z: z + 0.4 }, 0.03, C3E.leather);
  });
}

/** Deux pinces debout dans un pot de grès, au bout du bureau (Objets connectés). */
function pliersInPot(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.pot;
    const y = floor() + DESK.h;
    l.prism({ x, y, z }, 0.09, 0.08, 0.18, 8, C3E.stoneShade, C3E.stone);
    for (const [dx, lean] of [
      [-0.03, 0.2],
      [0.03, -0.2],
    ] as const)
      l.beam({ x: x + dx, y: y + 0.08, z }, { x: x + dx + lean * 0.4, y: y + 0.36, z }, 0.035, C3E.iron);
  });
}

/** Une échelle de bois appuyée au premier poteau (Lire un programme). */
function ladder(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.ladder;
    const y = groundAt(x, z);
    drawPosed(l, { x, y: y - 0.05, z, yaw: 0, pitch: 0.2 }, (k) => {
      for (const s of [-1, 1]) k.box({ x: s * 0.22, y: 0, z: 0 }, [0.07, 3.0, 0.07], C3E.wood);
      for (let r = 0; r < 5; r++) k.box({ x: 0, y: 0.35 + r * 0.55, z: 0 }, [0.44, 0.05, 0.05], C3E.newWood);
    });
  });
}

/** Une caisse de bois ouverte, pleine d'isolateurs de verre (Données et tableaux). */
function crateOfInsulators(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.crate;
    const y = groundAt(x, z);
    l.box({ x, y: y - 0.05, z, yaw: 0.3 }, [0.8, 0.45, 0.55], C3E.woodShade, C.hollow);
    for (const [dx, dz] of [
      [-0.2, -0.1],
      [0.05, 0.1],
      [0.22, -0.08],
    ] as const)
      l.prism({ x: x + dx, y: y + 0.32, z: z + dz }, 0.08, 0.05, 0.14, 6, C.glass);
  });
}

/** Les quatre traces, une par mission, chacune avec sa partie : le corps (2), le haut, les abords. */
const TRACES = {
  'computer-networks': { at: TRACE_SPOTS.bench, lift: 1.2, stage: 0, row: 0, draw: benchAndSatchel },
  'connected-objects': { at: TRACE_SPOTS.pot, lift: 1.4, stage: 0, row: 0.5, draw: pliersInPot },
  algorithms: { at: TRACE_SPOTS.ladder, lift: 1.8, stage: 1, row: 0, draw: ladder },
  'data-tables': { at: TRACE_SPOTS.crate, lift: 1, stage: 2, row: 0, draw: crateOfInsulators },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette : à l'ouest-nord-ouest, vers la salle et le Lac au-delà, dos au pic. */
const SCENE_START = capOf(290);

/** Le milieu de la scène, depuis le centre du lieu : sur l'herbe devant la salle, à gauche du chemin. */
const SCENE_SPOT = (() => {
  const p = local(-3.4, 4.6);
  return { dx: p.x, dz: p.z, half: [2.4, 1.2] as [number, number] } as const;
})();

/** Le rang des fiches : sa hauteur à l'échelle 1 ; une fiche choisie se soulève d'un cran. */
const PLUGS = { height: 0.62, lift: 0.28, plug: 0.34 } as const;

/** Une fiche de bois à tête ronde, debout ; toutes pareilles. */
function plug(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.05 * s, 0.045 * s, 0.2 * s, 6, C3E.iron);
  b.drum({ x: at.x, y: at.y + 0.18 * s, z: at.z }, 0.14 * s, 0.16 * s, 8, C3E.woodShade, C3E.newWood);
}

export const STANDARD: PlaceArt = {
  role: 'La télégraphiste',
  model,
  traceStage: 0,
  // La scénette : Kéo et la télégraphiste de part et d'autre de son milieu ; son sol, l'herbe du creux.
  ...scene3e(SITE, { start: SCENE_START, spot: SCENE_SPOT, floor: SITE.ground, top: 3.2, pitch: 4 }),
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x6a5444);
  },
  answer: {
    size: { height: PLUGS.height + PLUGS.lift + PLUGS.plug, half: 0.3 },
    facing: true,
    // Un petit bureau de bois, sous le rang des fiches.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PLUGS.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.46 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.08 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Une fiche, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      plug(b, { x: at.x, y: at.y + (PLUGS.height + (picked ? PLUGS.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
  reach: (c, posed) => poleLine(c, posed(2, 0)),
};

/** Le plan du Standard, pour les tests. */
export const STANDARD_LAYOUT = {
  room: ROOM,
  awning: AWNING,
  board: BOARD,
  lamps: LAMPS,
  pole: POLE,
  line: LINE,
  fanalAt: FANAL_AT,
  fanalHook: FANAL_HOOK,
  facing: FACING,
  local,
  base,
  floor,
  door: SITE.door,
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
