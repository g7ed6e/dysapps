// La Lutherie (les Prairies du 3e, GD-25, lot 4 ; proposition du consultant d'Archipéo, § 5, relecture des lieux du
// directeur artistique, correction 3, et planche `selection-prairies-v1`, de près et de loin graine 42) : « l'atelier où
// les Passeurs accordaient leurs instruments, chacun à son registre ». Sur le gabarit du Palais (./palais3e.ts), avec le
// kit du 3e (./place3eKit.ts). Un atelier de bois gris sur son socle de granit, à grandes fenêtres, son toit d'ardoise
// raide un peu enneigé au faîte ; devant, la galerie couverte ; dessous, le cœur du lieu : cinq instruments à cordes
// debout côte à côte contre leur râtelier, du plus grand au plus petit, en un seul rang ; à droite, l'établi, son
// diapason et ses bobines de corde. Ni partition, ni note écrite ; aucun son.
//
// L'atelier regarde l'est, la porte du lieu (`FACING`) : tout se dessine dans son repère (`x` le long de la façade, vers la
// droite de qui la regarde ; `z` vers le devant), tourné d'un bloc. Kéo s'arrête devant la porte de l'atelier : les
// instruments à sa gauche, jamais derrière lui (relecture du Versant, (b) 1) ; la Coupole derrière l'atelier, à droite.
//
// La ruine, d'après le texte, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : le pan avant du toit
// tombé, appuyé contre la façade, penché, son dessous de bois vers la porte (relecture des Alpages, (b) 1 : jamais à plat),
// les chevrons à nu ; le haut de la façade ébréché à droite, les deux grandes fenêtres sans vitres ; l'établi fendu ; les
// instruments couchés côte à côte sur le plancher, toujours du plus grand au plus petit ; la galerie tombée, un seul
// poteau debout, un autre couché dans l'herbe ; l'herbe sèche. Une seule lumière, la lanterne de l'accordeur, au poteau
// resté debout. Cinq parties (3 + 1 + 1) : les murs (la façade refaite, les fenêtres vitrées) ; l'établi ; les
// instruments debout ; le haut (le toit d'ardoise, la lanterne de l'atelier) ; les abords (la galerie, ses deux bancs,
// l'allée de pierre claire, la lanterne du chemin). Une trace par mission, avec sa partie. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTuft3e, habitant3e, postLantern3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise, sheet } from './place4eKit';

/**
 * Les couleurs propres à la Lutherie, en plus des matières des Passeurs (`C3E`) : le vernis des instruments, chaud, et
 * leur manche, un cran plus sombre (jamais presque noir) ; le creux d'une fenêtre vide ; la vitre éteinte ; les cordes en
 * bobines ; le bois clair des planchettes ; la veste de l'accordeur.
 */
const C = {
  varnish: 0xa8673e,
  varnishTop: 0xbd7d4f,
  neck: 0x6e4c36,
  hollow: 0x5c5650,
  glass: 0xa9bccc,
  string: 0xd8cfb4,
  plank: 0xc8b894,
  coat: 0x7a6a58,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('lutherie');

/** Le plan du sol sous l'atelier, sa galerie et son allée : la deuxième Prairie est une table plate. */
const planeY = groundPlane4e(SITE.ground, [-6, 11], [-9, 9]);

/** Le cap où regarde la façade (en degrés depuis le nord) : l'est, vers la porte du lieu ; la vue d'arrivée regarde l'ouest. */
const FACING = 90;
const TURN = ((FACING - 180) * Math.PI) / 180;
/** Le lacet du repère de l'atelier (`drawPosed`) : son `x` vers la droite de qui regarde la façade, son `z` vers le devant. */
const YAW = -TURN;

/** Un point du repère de l'atelier dans le repère du lieu. */
const local = (x: number, z: number): Vec2 => ({ x: x * Math.cos(TURN) - z * Math.sin(TURN), z: x * Math.sin(TURN) + z * Math.cos(TURN) });

/** Le sol sous un point du repère de l'atelier. */
const groundAt = (x: number, z: number): number => {
  const p = local(x, z);
  return planeY(p.x, p.z);
};

/** Dessine dans le repère de l'atelier. */
const posed = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: 0, z: 0, yaw: YAW }, draw);

/**
 * Le corps de l'atelier : de `x0` à `x1` le long de la façade, de `z0` (le dos) à `z1` (la façade) ; la hauteur de ses
 * murs ; son socle de granit, qui porte aussi le plancher de la galerie ; le toit raide (son débord, la hauteur du faîte,
 * la part enneigée au faîte) ; la limite du pan de façade ébréché dans la ruine (`broken`).
 */
const BODY = { x0: -4.6, x1: 4.6, z0: -3.6, z1: 0.4, h: 3.0, plinth: 0.3, eave: 0.35, ridge: 2.5, snow: 0.28, broken: 1.2 } as const;

/** La galerie couverte, devant la façade : son bord, la hauteur de son toit au mur et au bord, ses deux poteaux. */
const GALLERY = { z1: 2.9, wallY: 2.75, edgeY: 2.25, posts: [-4.4, 4.4] as const, post: 0.2 } as const;

/** La porte de l'atelier, sur la façade : sa place, sa largeur, son haut. */
const DOOR_ATELIER = { x: 0.5, w: 1.0, h: 2.2 } as const;

/** Les grandes fenêtres : celle de la façade, derrière l'établi ; celles des deux pignons. */
const WINDOWS = { front: { x: 2.85, w: 2.0 }, side: { z: -1.6, w: 1.8 }, y0: 1.05, y1: 2.55 } as const;

/** Le râtelier et les cinq instruments, du plus grand au plus petit : leur place le long de la façade et leur hauteur. */
const RACK = { x0: -4.2, x1: -0.5, z: 0.75, y: 1.1 } as const;
const INSTRUMENTS = [
  { x: -3.65, h: 2.2 },
  { x: -2.8, h: 1.75 },
  { x: -2.05, h: 1.36 },
  { x: -1.42, h: 1.04 },
  { x: -0.9, h: 0.78 },
] as const;

/** L'établi, devant la grande fenêtre : son milieu, sa longueur, sa largeur, sa hauteur. */
const BENCH = { x: 2.85, z: 1.05, w: 2.3, d: 0.8, h: 0.85 } as const;

/** Le pan avant du toit tombé, appuyé contre la façade (la ruine) : de `x0` à `x1`, son pied sur le plancher. */
const FALLEN_PAN = { x0: 1.3, x1: 4.4, foot: 2.35 } as const;

/** L'allée de pierre claire, du bord de la galerie vers la porte du lieu : sa demi-largeur, son bout. */
const ALLEY = { half: 0.9, end: 7.6 } as const;

/** La lanterne du chemin (les abords), à gauche de l'allée, hors du chemin ; les deux bancs, sous la galerie. */
const PATH_LANTERN = { x: -2.6, z: 6.6, h: 1.4 } as const;
const BENCHES = [{ x: -4.0 }, { x: 4.0 }] as const;

/** L'herbe sèche de la ruine, au bord de la galerie et au pied du pignon. */
const DRY = [
  { x: 3.6, z: 3.6, s: 1 },
  { x: -2.2, z: 3.5, s: 0.8 },
  { x: 5.5, z: 1.2, s: 0.9 },
  { x: -5.4, z: -0.6, s: 0.85 },
] as const;

/** La porte du lieu, dans le repère de l'atelier : devant la porte de l'atelier, au-delà de l'allée. */
const DOOR = (() => {
  const c = Math.cos(TURN),
    s = Math.sin(TURN);
  return { x: SITE.door.x * c + SITE.door.z * s, z: -SITE.door.x * s + SITE.door.z * c };
})();

// ---------- La vue ----------

/**
 * Le cap d'arrivée (correction 3) : à l'ouest, de la porte à l'est ; l'atelier au soleil, les instruments à gauche de
 * Kéo ; derrière l'atelier, à droite, la Coupole ; au loin, la montagne.
 */
const DOOR_VIEW = capOf(FACING - 180 + 360);

/** La vue d'arrivée un peu montée, juste assez pour voir sous la galerie (relecture des Alpages, (b) 7), un peu reculée. */
const DOOR_FRAME = { height: -1.6, back: 1.0 } as const;

// ---------- Les volumes ----------

/** Le pied de l'atelier : le plus bas du sol sous ses coins et le bord de sa galerie. */
const base = once(() => Math.min(...[BODY.x0, BODY.x1].flatMap((x) => [BODY.z0, GALLERY.z1].map((z) => groundAt(x, z)))) - 0.05);

/** Le plancher : le dessus du socle, sous l'atelier et sa galerie. */
const floor = (): number => base() + BODY.plinth;

/** Le point du nom sur la Carte, au-dessus du faîte, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + BODY.h + BODY.ridge + 1.6;
  },
  z: 0,
};

/** Le socle de granit, sous l'atelier et sa galerie. */
function plinth(l: FacetBuilder): void {
  l.box({ x: (BODY.x0 + BODY.x1) / 2, y: base() + SINK_3E, z: (BODY.z0 + GALLERY.z1) / 2 }, [BODY.x1 - BODY.x0 + 0.3, BODY.plinth - SINK_3E, GALLERY.z1 - BODY.z0 + 0.2], C3E.graniteShade, C3E.granite);
}

/** Un pan de mur de bois, de `x0` à `x1` sur la façade (`z1`) ou au dos (`z0`), jusqu'à `h` (un haut ébréché : `h1` au bout). */
function frontWall(l: FacetBuilder, x0: number, x1: number, h: number, h1 = h): void {
  const n = h1 === h ? 1 : 3;
  for (let k = 0; k < n; k++) {
    const a = x0 + ((x1 - x0) * k) / n,
      c = x0 + ((x1 - x0) * (k + 1)) / n;
    const top = h + ((h1 - h) * (k + 0.5)) / n;
    l.box({ x: (a + c) / 2, y: floor() - 0.05, z: BODY.z1 - 0.15 }, [c - a + 0.01, top + 0.05, 0.3], C3E.woodShade, C3E.wood);
  }
}

/** Le dos et les deux pignons, toujours debout, avec le haut des pignons sous le toit. */
function backAndGables(l: FacetBuilder): void {
  const y = floor() - 0.05;
  const d = BODY.z1 - BODY.z0;
  l.box({ x: (BODY.x0 + BODY.x1) / 2, y, z: BODY.z0 + 0.15 }, [BODY.x1 - BODY.x0, BODY.h + 0.05, 0.3], C3E.woodShade, C3E.wood);
  for (const x of [BODY.x0 + 0.15, BODY.x1 - 0.15]) {
    l.box({ x, y, z: (BODY.z0 + BODY.z1) / 2 }, [0.3, BODY.h + 0.05, d], C3E.woodShade, C3E.wood);
    // Le haut du pignon, un triangle de planches sous le faîte.
    l.gableRoof({ x, y: floor() + BODY.h, z: (BODY.z0 + BODY.z1) / 2 }, 0.3, d, BODY.ridge - 0.1, C3E.wood, C3E.wood);
  }
}

/** Une grande fenêtre : vitrée, ou vide (le creux, jamais presque noir) ; ses montants de bois neuf. */
function windowPane(l: FacetBuilder, at: Vec3, w: number, glazed: boolean, yaw = 0): void {
  const h = WINDOWS.y1 - WINDOWS.y0;
  l.box({ x: at.x, y: at.y + WINDOWS.y0, z: at.z, yaw }, [w, h, 0.08], glazed ? C.glass : C.hollow);
  if (!glazed) return;
  l.box({ x: at.x, y: at.y + WINDOWS.y0 + h * 0.5, z: at.z, yaw }, [w, 0.07, 0.11], C3E.newWood);
  l.box({ x: at.x, y: at.y + WINDOWS.y0, z: at.z, yaw }, [0.07, h, 0.11], C3E.newWood);
}

/** Les deux fenêtres des pignons et celle de la façade. */
function windows(l: FacetBuilder, glazed: boolean): void {
  windowPane(l, { x: WINDOWS.front.x, y: floor(), z: BODY.z1 + 0.02 }, WINDOWS.front.w, glazed);
  for (const x of [BODY.x0 - 0.02, BODY.x1 + 0.02]) windowPane(l, { x, y: floor(), z: WINDOWS.side.z }, WINDOWS.side.w, glazed, Math.PI / 2);
}

/** Le toit d'ardoise raide entier, et la neige au faîte. */
function roof(l: FacetBuilder): void {
  const y = floor() + BODY.h;
  const sx = BODY.x1 - BODY.x0 + 2 * BODY.eave;
  const sz = BODY.z1 - BODY.z0 + 2 * BODY.eave;
  const at = { x: (BODY.x0 + BODY.x1) / 2, y, z: (BODY.z0 + BODY.z1) / 2 };
  l.gableRoof(at, sx, sz, BODY.ridge, C3E.slate, C3E.wood);
  const k = BODY.snow;
  l.gableRoof({ ...at, y: y + BODY.ridge * (1 - k) + 0.02 }, sx + 0.02, sz * k, BODY.ridge * k, C3E.snow, C3E.snow);
}

/** Le pan arrière seul (la ruine), et les chevrons à nu du pan avant, sans faîtage qui dépasse. */
function backPanAndRafters(l: FacetBuilder): void {
  const y = floor() + BODY.h;
  const zm = (BODY.z0 + BODY.z1) / 2;
  const sx = BODY.x1 - BODY.x0 + 2 * BODY.eave;
  const x0 = BODY.x0 - BODY.eave,
    x1 = BODY.x1 + BODY.eave;
  sheet(
    l,
    [
      [x1, y - 0.25, BODY.z0 - BODY.eave],
      [x0, y - 0.25, BODY.z0 - BODY.eave],
      [x0, y + BODY.ridge - 0.12, zm],
      [x1, y + BODY.ridge - 0.12, zm],
    ],
    0.12,
    C3E.slate,
    C3E.wood,
  );
  // La neige du faîte, sur le pan resté.
  l.box({ x: (x0 + x1) / 2, y: y + BODY.ridge - 0.08, z: zm - 0.35 }, [sx, 0.08, 0.7], C3E.snow);
  for (const x of [-3.2, -1.2, 0.8, 2.8]) l.beam({ x, y: y - 0.05, z: BODY.z1 - 0.1 }, { x, y: y + BODY.ridge * 0.92, z: zm }, 0.14, C3E.woodShade);
}

/** Le pan avant tombé, appuyé contre la façade : son dessous de bois et ses lattes tournés vers la porte. */
function fallenPan(l: FacetBuilder): void {
  const P = FALLEN_PAN;
  const top = floor() + BODY.h - 0.9,
    zTop = BODY.z1 + 0.12,
    zFoot = P.foot;
  sheet(
    l,
    [
      [P.x0, top, zTop],
      [P.x1, top, zTop],
      [P.x1 + 0.2, floor() + 0.02, zFoot],
      [P.x0 - 0.1, floor() + 0.02, zFoot],
    ],
    0.12,
    C3E.wood,
    C3E.slate,
  );
  for (const t of [0.3, 0.65]) {
    const yy = top + (floor() - top) * t + 0.14;
    const zz = zTop + (zFoot - zTop) * t + 0.05;
    l.beam({ x: P.x0 + 0.05, y: yy, z: zz }, { x: P.x1 + 0.1, y: yy, z: zz }, 0.08, C3E.woodShade);
  }
}

/** Un instrument à cordes debout, de hauteur `h`, son pied en (0, 0, 0) : deux tables arrondies, la taille, le manche, la volute. */
function instrument(l: FacetBuilder, h: number): void {
  const s = h / 1.95;
  // Les deux tables, des disques à six pans tournés vers le devant ; la grande en bas.
  l.drum({ x: 0, y: 0.42 * s, z: -0.1 * s, pitch: Math.PI / 2 }, 0.36 * s, 0.2 * s, 6, C.varnish, C.varnishTop);
  l.drum({ x: 0, y: 0.92 * s, z: -0.1 * s, pitch: Math.PI / 2 }, 0.27 * s, 0.2 * s, 6, C.varnish, C.varnishTop);
  // Le manche, la volute un cran plus large.
  l.box({ x: 0, y: 1.1 * s, z: 0 }, [0.09 * s, 0.68 * s, 0.09 * s], C.neck);
  l.box({ x: 0, y: 1.76 * s, z: 0 }, [0.13 * s, 0.17 * s, 0.13 * s], C.neck);
  // La pique, courte, sous le corps.
  l.box({ x: 0, y: 0, z: 0 }, [0.05 * s, 0.1 * s, 0.05 * s], C.neck);
}

/** Les cinq instruments debout contre le râtelier, du plus grand au plus petit, un peu penchés vers le mur. */
function instrumentsUp(l: FacetBuilder): void {
  for (const it of INSTRUMENTS) drawPosed(l, { x: it.x, y: floor(), z: RACK.z + 0.32, yaw: 0, pitch: -0.08 }, (k) => instrument(k, it.h));
}

/** Les mêmes, couchés côte à côte sur le plancher de la galerie (la ruine), toujours rangés, la tête vers le mur. */
function instrumentsDown(l: FacetBuilder): void {
  for (const it of INSTRUMENTS) drawPosed(l, { x: it.x + 0.05, y: floor() + 0.02, z: GALLERY.z1 - 0.15, yaw: 0, pitch: -Math.PI / 2 }, (k) => instrument(k, it.h * 0.98));
}

/** Le râtelier : une lisse basse de bois neuf sur deux pieds, contre le mur, derrière les instruments. */
function rack(l: FacetBuilder): void {
  for (const x of [RACK.x0, RACK.x1]) l.box({ x, y: floor() - 0.02, z: RACK.z }, [0.1, RACK.y + 0.06, 0.1], C3E.woodShade);
  l.box({ x: (RACK.x0 + RACK.x1) / 2, y: floor() + RACK.y - 0.04, z: RACK.z }, [RACK.x1 - RACK.x0 + 0.1, 0.1, 0.14], C3E.woodShade, C3E.newWood);
}

/** Le feutre de cuir posé sur la lisse du râtelier, où s'appuient les instruments debout. */
function rackFelt(l: FacetBuilder): void {
  l.box({ x: (RACK.x0 + RACK.x1) / 2, y: floor() + RACK.y + 0.06, z: RACK.z + 0.02 }, [RACK.x1 - RACK.x0 - 0.1, 0.04, 0.16], C3E.leather);
}

/** L'établi refait : son plateau sur quatre pieds ; dessus, le diapason debout et deux bobines de corde. */
function benchUp(l: FacetBuilder): void {
  const B = BENCH;
  const y = floor();
  l.box({ x: B.x, y: y + B.h - 0.1, z: B.z }, [B.w, 0.1, B.d], C3E.woodShade, C3E.newWood);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) l.box({ x: B.x + sx * (B.w / 2 - 0.1), y: y - 0.02, z: B.z + sz * (B.d / 2 - 0.1) }, [0.1, B.h - 0.06, 0.1], C3E.woodShade);
  // Le diapason de fer, debout sur son pied : la tige et ses deux branches, jamais en croix.
  const t = y + B.h;
  l.box({ x: B.x - 0.6, y: t, z: B.z }, [0.12, 0.04, 0.12], C3E.iron);
  l.box({ x: B.x - 0.6, y: t + 0.04, z: B.z }, [0.03, 0.12, 0.03], C3E.iron);
  l.box({ x: B.x - 0.6, y: t + 0.15, z: B.z }, [0.12, 0.03, 0.03], C3E.iron);
  for (const s of [-1, 1]) l.box({ x: B.x - 0.6 + s * 0.045, y: t + 0.17, z: B.z }, [0.025, 0.26, 0.03], C3E.iron, C3E.ironTop);
  // Deux bobines de corde.
  for (const [dx, r] of [
    [0.15, 0.13],
    [0.5, 0.1],
  ] as const) {
    l.drum({ x: B.x + dx, y: t, z: B.z }, r, 0.16, 6, C.string, C3E.newWood);
  }
}

/** L'établi fendu (la ruine) : son plateau en deux moitiés qui s'affaissent vers le milieu, deux pieds debout. */
function benchDown(l: FacetBuilder): void {
  const B = BENCH;
  const y = floor();
  for (const s of [-1, 1]) {
    l.box({ x: B.x + s * (B.w / 2 - 0.1), y: y - 0.02, z: B.z }, [0.1, B.h - 0.06, B.d - 0.1], C3E.woodShade);
    drawPosed(l, { x: B.x + s * (B.w / 4 + 0.05), y: y + B.h * 0.62, z: B.z, yaw: s > 0 ? Math.PI : 0, pitch: 0 }, (k) =>
      drawPosed(k, { x: 0, y: 0, z: 0, yaw: Math.PI / 2, pitch: 0.38 }, (m) => m.box({ x: 0, y: -0.05, z: 0 }, [B.d, 0.1, B.w / 2 - 0.1], C3E.woodShade, C3E.wood)),
    );
  }
}

/** La galerie couverte : ses deux poteaux (celui de gauche toujours là), la poutre, le toit d'ardoise en appentis. */
function gallery(l: FacetBuilder): void {
  const G = GALLERY;
  const y = floor();
  l.box({ x: G.posts[1], y: y - 0.02, z: G.z1 - 0.15 }, [G.post, G.edgeY - 0.1, G.post], C3E.woodShade, C3E.wood);
  l.box({ x: 0, y: y + G.edgeY - 0.12, z: G.z1 - 0.15 }, [G.posts[1] - G.posts[0] + G.post, 0.2, 0.2], C3E.woodShade, C3E.wood);
  const x0 = BODY.x0 - 0.15,
    x1 = BODY.x1 + 0.15;
  sheet(
    l,
    [
      [x1, y + G.wallY, BODY.z1],
      [x0, y + G.wallY, BODY.z1],
      [x0, y + G.edgeY, G.z1 + 0.25],
      [x1, y + G.edgeY, G.z1 + 0.25],
    ],
    0.1,
    C3E.slate,
    C3E.wood,
  );
}

/** Le poteau de gauche de la galerie, toujours debout, et la lanterne de l'accordeur, la seule allumée de la ruine. */
function leftPost(l: FacetBuilder): void {
  const G = GALLERY;
  const y = floor();
  l.box({ x: G.posts[0], y: y - 0.02, z: G.z1 - 0.15 }, [G.post, G.edgeY - 0.1, G.post], C3E.woodShade, C3E.wood);
  armLantern3e(l, G.posts[0], y + 1.95, G.z1 - 0.15, 0, 1, true);
}

/** Un banc de bois sous la galerie, contre le mur. */
function benchSeat(l: FacetBuilder, x: number): void {
  const y = floor();
  for (const s of [-1, 1]) l.box({ x: x + s * 0.45, y: y - 0.02, z: 1.0 }, [0.1, 0.45, 0.36], C3E.woodShade);
  l.box({ x, y: y + 0.42, z: 1.0 }, [1.2, 0.08, 0.42], C3E.woodShade, C3E.newWood);
}

/** L'allée de pierre claire, du bord de la galerie vers la porte du lieu, en dalles. */
function alley(l: FacetBuilder): void {
  const n = 3;
  const from = GALLERY.z1 + 0.15;
  const step = (ALLEY.end - from) / n;
  for (let k = 0; k < n; k++) {
    const z = from + (k + 0.5) * step;
    l.box({ x: DOOR_ATELIER.x, y: groundAt(DOOR_ATELIER.x, z) - 0.06, z }, [2 * ALLEY.half, 0.1, step - 0.08], C3E.joint, k % 2 ? C3E.stone : C3E.stoneShade);
  }
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle et le plancher, le dos et les pignons, la façade à gauche du pan ébréché et sa porte ; le
  // râtelier ; le poteau de gauche de la galerie et la lanterne de l'accordeur, la seule allumée de la ruine.
  add('ruine', 0, (b) =>
    posed(b, (l) => {
      plinth(l);
      backAndGables(l);
      frontWall(l, BODY.x0, DOOR_ATELIER.x - DOOR_ATELIER.w / 2, BODY.h);
      frontWall(l, DOOR_ATELIER.x + DOOR_ATELIER.w / 2, BODY.broken, BODY.h);
      // Le linteau de la porte, et le battant de bois, entrouvert.
      l.box({ x: DOOR_ATELIER.x, y: floor() + DOOR_ATELIER.h, z: BODY.z1 - 0.15 }, [DOOR_ATELIER.w, BODY.h - DOOR_ATELIER.h, 0.3], C3E.woodShade, C3E.wood);
      l.box({ x: DOOR_ATELIER.x - DOOR_ATELIER.w / 2 + 0.05, y: floor(), z: BODY.z1 + 0.35, yaw: -1.2 }, [DOOR_ATELIER.w - 0.05, DOOR_ATELIER.h - 0.05, 0.07], C3E.woodShade, C3E.newWood);
      rack(l);
      leftPost(l);
    }),
  );
  // Les murs (corps 1) relèvent le pan de façade ébréché et les fenêtres vides.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        frontWall(l, BODY.broken, BODY.x1, BODY.h - 0.5, BODY.h - 1.4);
        windows(l, false);
      }),
    corps1,
  );
  // L'établi (corps 2) relève l'établi fendu.
  add('ruine', 0, (b) => posed(b, benchDown), corps2);
  // Les instruments (corps 3) relèvent les instruments couchés.
  add('ruine', 0, (b) => posed(b, instrumentsDown), corps3);
  // Le haut relève le pan avant tombé, le pan arrière seul et les chevrons à nu.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        backPanAndRafters(l);
        fallenPan(l);
      }),
    haut,
  );
  // Les abords relèvent le poteau couché dans l'herbe et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        const y = groundAt(5.6, 3.6);
        l.box({ x: 5.6, y: y - 0.05, z: 3.6, yaw: 0.5 }, [GALLERY.post, GALLERY.post, GALLERY.edgeY], C3E.woodShade, C3E.wood);
        for (const d of DRY) dryTuft3e(l, d.x, groundAt(d.x, d.z), d.z, d.s);
      }),
    abords,
  );

  // ---- Les murs : la façade refaite et les grandes fenêtres vitrées.
  add(0, 0, (b) =>
    posed(b, (l) => {
      frontWall(l, BODY.broken, BODY.x1, BODY.h);
      windows(l, true);
    }),
  );
  // ---- L'établi, ses outils.
  add(0, 1 / 3, (b) => posed(b, benchUp));
  // ---- Les instruments debout, du plus grand au plus petit.
  add(0, 2 / 3, (b) =>
    posed(b, (l) => {
      instrumentsUp(l);
      rackFelt(l);
    }),
  );
  // ---- Le haut : le toit d'ardoise sous la neige ; la lanterne de l'atelier, à droite de sa porte.
  add(1, 0, (b) =>
    posed(b, (l) => {
      roof(l);
      armLantern3e(l, DOOR_ATELIER.x + DOOR_ATELIER.w / 2 + 0.35, floor() + 2.15, BODY.z1 + 0.02, 0, 1, true);
    }),
  );
  // ---- Les abords : la galerie, ses deux bancs, l'allée de pierre claire, la lanterne du chemin.
  add(2, 0, (b) =>
    posed(b, (l) => {
      gallery(l);
      for (const s of BENCHES) benchSeat(l, s.x);
      alley(l);
      const p = PATH_LANTERN;
      postLantern3e(l, p.x, groundAt(p.x, p.z), p.z, p.h, true);
    }),
  );
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de l'atelier, loin du chemin et de la scène. */
const TRACE_SPOTS_P = {
  saw: { x: BODY.x0 - 0.12, z: WINDOWS.side.z },
  planks: { x: BODY.x1 + 0.45, z: -2.9 },
  case: { x: 1.45, z: 0.75 },
  stand: { x: -6.0, z: 2.2 },
  stools: { x: -2.6, z: 2.1 },
} as const;

/** Les mêmes, dans le repère du lieu. */
const TRACE_SPOTS = {
  saw: local(TRACE_SPOTS_P.saw.x, TRACE_SPOTS_P.saw.z),
  planks: local(TRACE_SPOTS_P.planks.x, TRACE_SPOTS_P.planks.z),
  case: local(TRACE_SPOTS_P.case.x, TRACE_SPOTS_P.case.z),
  stand: local(TRACE_SPOTS_P.stand.x, TRACE_SPOTS_P.stand.z),
  stools: local(TRACE_SPOTS_P.stools.x, TRACE_SPOTS_P.stools.z),
} as const;

/** Dessine une trace dans le repère de l'atelier, posée au centre du lieu. */
const traceIn = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => inWorld(b, c, draw, YAW);

/** Une scie à main et un rabot, côte à côte sur l'appui de la fenêtre du pignon sud (Subjonctif et conditionnel). */
function sawAndPlane(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.saw;
    const y = floor() + WINDOWS.y0 - 0.12;
    // L'appui de bois, en saillie.
    l.box({ x: x - 0.12, y, z }, [0.3, 0.08, WINDOWS.side.w + 0.2], C3E.woodShade, C3E.newWood);
    // La scie : sa lame de fer couchée, sa poignée de bois.
    l.box({ x: x - 0.15, y: y + 0.08, z: z - 0.45 }, [0.16, 0.02, 0.62], C3E.ironTop);
    l.box({ x: x - 0.15, y: y + 0.08, z: z - 0.05 }, [0.12, 0.08, 0.18], C3E.leather);
    // Le rabot : son corps de bois, sa poignée.
    l.box({ x: x - 0.15, y: y + 0.08, z: z + 0.45 }, [0.14, 0.12, 0.4], C3E.wood, C3E.newWood);
    l.box({ x: x - 0.15, y: y + 0.2, z: z + 0.4 }, [0.05, 0.08, 0.1], C3E.leather);
  });
}

/** Des planchettes de bois clair liées en pile, debout contre le pignon nord (Accords difficiles). */
function planks(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.planks;
    const y = groundAt(x, z);
    for (let k = 0; k < 4; k++) l.box({ x: x + k * 0.06, y: y - 0.05, z: z + k * 0.02, pitch: 0, yaw: 0 }, [0.05, 1.35 - k * 0.04, 0.3], C.plank, C3E.newWood);
    for (const h of [0.35, 1.0]) l.box({ x: x + 0.09, y: y + h, z }, [0.3, 0.06, 0.34], C3E.leather);
  });
}

/** Un étui d'instrument fermé, debout, près de la porte de l'atelier (Connotation). */
function instrumentCase(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.case;
    const y = floor();
    l.prism({ x, y: y - 0.02, z, yaw: Math.PI / 6 }, 0.22, 0.16, 0.6, 6, C3E.leather, C3E.leather);
    l.prism({ x, y: y + 0.58, z, yaw: Math.PI / 6 }, 0.16, 0.09, 0.42, 6, C3E.leather, C3E.leather);
    l.box({ x, y: y + 0.6, z: z + 0.14 }, [0.05, 0.08, 0.05], C3E.bronze);
  });
}

/** Un pupitre à musique vide, debout sur son pied rond, au bord de l'herbe (Ponctuation et relief). */
function musicStand(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.stand;
    const y = groundAt(x, z);
    l.prism({ x, y: y - 0.05, z }, 0.28, 0.24, 0.08, 6, C3E.iron, C3E.ironTop);
    l.box({ x, y: y, z }, [0.05, 1.05, 0.05], C3E.iron);
    l.box({ x, y: y + 1.0, z, pitch: -0.35 }, [0.62, 0.42, 0.03], C3E.iron, C3E.ironTop);
    l.box({ x, y: y + 0.98, z: z + 0.06 }, [0.62, 0.04, 0.08], C3E.iron);
  });
}

/** Deux tabourets de bois côte à côte, sous la galerie (Écrire juste). */
function stools(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.stools;
    const y = floor();
    for (const dx of [-0.32, 0.32]) {
      l.prism({ x: x + dx, y: y - 0.02, z }, 0.12, 0.1, 0.5, 6, C3E.woodShade);
      l.prism({ x: x + dx, y: y + 0.48, z }, 0.2, 0.2, 0.07, 6, C3E.woodShade, C3E.newWood);
    }
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : les murs, l'établi, les instruments, le haut, les abords. */
const TRACES = {
  'verb-moods': { at: TRACE_SPOTS.saw, lift: 1.6, stage: 0, row: 0, draw: sawAndPlane },
  'complex-agreements': { at: TRACE_SPOTS.planks, lift: 1.6, stage: 0, row: 1 / 3, draw: planks },
  connotation: { at: TRACE_SPOTS.case, lift: 1.3, stage: 0, row: 2 / 3, draw: instrumentCase },
  'emphasis-punctuation': { at: TRACE_SPOTS.stand, lift: 1.4, stage: 1, row: 0, draw: musicStand },
  'verb-stems': { at: TRACE_SPOTS.stools, lift: 1, stage: 2, row: 0, draw: stools },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la scénette (proposition, § 5) : à l'ouest-nord-ouest, vers la Coupole au loin, le soleil dans le
 * dos ; l'atelier à gauche, hors du cadre.
 */
const SCENE_START = capOf(290);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'accordeur). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : sur l'herbe, au nord de l'atelier, devant son pignon. */
const SCENE_SPOT = (() => {
  const p = local(9.4, -3.0);
  return { dx: p.x, dz: p.z, half: [2.4, 1.2] as [number, number] } as const;
})();

/** L'écart de Kéo et de l'accordeur au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe de la Prairie. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** L'établi des chevilles : sa hauteur à l'échelle 1 ; une cheville choisie se soulève d'un cran. */
const PEGS = { height: 0.62, lift: 0.28, peg: 0.26 } as const;

/** Une cheville de bois, debout, sa tête plate ; toutes pareilles. */
function peg(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.035 * s, 0.05 * s, 0.16 * s, 6, C3E.newWood);
  b.box({ x: at.x, y: at.y + 0.15 * s, z: at.z }, [0.16 * s, 0.1 * s, 0.05 * s], C.neck);
}

export const LUTHERIE: PlaceArt = {
  role: 'L’accordeur',
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
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x7a6a5a);
  },
  answer: {
    size: { height: PEGS.height + PEGS.lift + PEGS.peg, half: 0.3 },
    facing: true,
    // Un petit établi de bois, sous le rang des chevilles.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PEGS.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.46 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.1 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Une cheville, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      peg(b, { x: at.x, y: at.y + (PEGS.height + (picked ? PEGS.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Lutherie, pour les tests. */
export const LUTHERIE_LAYOUT = {
  body: BODY,
  gallery: GALLERY,
  instruments: INSTRUMENTS,
  rack: RACK,
  bench: BENCH,
  facing: FACING,
  local,
  /** Un point du repère du lieu dans le repère de l'atelier (l'inverse de `local`). */
  toFrame: (x: number, z: number): Vec2 => ({ x: x * Math.cos(TURN) + z * Math.sin(TURN), z: -x * Math.sin(TURN) + z * Math.cos(TURN) }),
  base,
  floor,
  hollow: C.hollow,
  planeY,
  door: SITE.door,
  doorInFrame: DOOR,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
