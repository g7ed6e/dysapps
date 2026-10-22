// La Dynamo (lot 3 du monde ouvert du 4e, l'Épaule, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-epaule-v1`) : « le petit poste de l'épaule : il parlait à l'usine par la lumière et le son, au bout
// d'une ligne de poteaux ». Le cœur, sans figure : le poste de pierre grise, son toit de tôle et son clocheton (un petit
// toit sur quatre montants, où pend la cloche de fer sombre, jamais une tour) ; devant sa façade, à droite de la porte, la
// dynamo, un tambour court de cuivre patiné brun-rouge (jamais le cuivre orange du lot 1) sur son socle, et sa grande roue
// à manivelle ; les trois poteaux de bois et leurs fils, qui descendent au sud-est vers le bord qui regarde l'usine, à
// l'est du chemin du pont, sans jamais le croiser. Rien ne tourne, rien ne clignote. Le sol est plat (intention, § 2).
// Le signe de l'absence du 4e : au bout des poteaux, au bord de l'épaule, un pied de fer porte la fourche vide du miroir à
// signaux et ses deux goujons nus, tournée vers l'usine (le miroir est chez les Ferrailleurs). Avant comme après, jamais
// une étape.
//
// La ruine (intention, § 6) : les murs du poste entiers, son toit tombé en travers de la porte, d'un seul pan, un bout à
// terre ; le clocheton couché au pied du mur est ; la cloche posée au sol contre le mur ouest, intacte ; la dynamo de
// travers sur son socle, penchée de 20°, la roue couchée à côté, la courroie en tas ; le deuxième poteau penché vers le
// sud-ouest, les fils en boucles lâches ; les lampes du premier et du troisième en place, éteintes. Une seule lumière, la
// lanterne de l'électricienne, au mur, à droite de la porte. Trois parties (1 + 1 + 1) : le corps (la dynamo droite, la
// roue et sa courroie, le toit reposé) ; le haut (le clocheton et sa cloche, la lampe du premier poteau) ; les abords (les
// poteaux debout, les fils tendus, la lampe du troisième, le chemin dallé). Code pur (placeArt.ts).
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { COURSE_HEIGHTS, courses, EPAULE_COLORS, lantern, quadToward, SINK, slab, strut } from './epauleKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { PATH_NODES_4E, PLACES_4E } from './plan4e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Dynamo : celles de l'Épaule (./epauleKit.ts) ; le cuivre patiné brun-rouge du tambour et du touret
 * (jamais `COLORS_4E.copper`, qui se lit orange au soleil bas) ; la cloche de fer sombre, jamais bronze ; la tôle du toit,
 * du fer bruni ; les isolateurs gris-bleu, mats ; le bois brun des poteaux ; l'électricienne en pion.
 */
const C = {
  ...EPAULE_COLORS,
  copper: 0x7e5444,
  copperTop: 0x8e6250,
  bell: 0x5c504c,
  sheet: 0x6a5c56,
  sheetTop: 0x7a6a62,
  insulator: 0x8a9aa4,
  insulatorTop: 0x96a6b0,
  // Les nervures de la tôle du pan tombé, un cran plus sombres que le fer rouillé.
  rib: 0x5a3e36,
  pole: 0x7a6250,
  poleTop: 0x86705e,
  tar: 0x5e4e48,
  // L'électricienne, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon gris, veste vert-de-gris.
  trousers: 0x5c6670,
  jacket: 0x6a7a68,
} as const;

// ---------- Le repère ----------

/** Le centre du lieu et le sol sous lui. */
const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'dynamo')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt4e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

// ---------- Le plan ----------

/**
 * Le poste : ses bords, ses murs, leur hauteur ; le faîte d'est en ouest, sa hauteur au-dessus des murs ; sa porte au
 * milieu de la façade sud, sa fenêtre à gauche. Le clocheton sur le faîte, 6,5 au plus.
 */
const POSTE = { x0: -2.5, x1: 2.5, z0: -4, z1: 0, wall: 0.45, h: 3.2, ridge: 1.5, door: { w: 1.2, h: 2.2 }, window: { x: -1.5, y: 1.25, w: 0.8, h: 0.8 } } as const;
const POSTE_Y = (() => {
  let hi = -Infinity;
  for (const x of [POSTE.x0, 0, POSTE.x1]) for (const z of [POSTE.z0, POSTE.z1]) hi = Math.max(hi, localGround(x, z));
  return hi + 0.04;
})();
const BELFRY = { half: 0.36, post: 0.1, h: 0.85, roof: 0.6, r: 0.66 } as const;

/** La dynamo, son socle, sa grande roue à manivelle (son axe le long de z) : rien ne tourne. */
const DYNAMO = { x: 2.6, z: 1.4, socle: { w: 1.4, h: 0.55, d: 1.0 }, r: 0.55, len: 0.9, tilt: (20 * Math.PI) / 180 } as const;
const WHEEL = { x: 3.95, z: 1.4, r: 0.85, y: 1.0, spokes: 3 } as const;

/** La lanterne de l'électricienne, au mur à droite de la porte : la seule allumée de la ruine. */
const KEEPER_LANTERN = { x: 0.95, z: 0.1, h: 2.35 } as const;

/** Les trois poteaux, du poste vers le bord qui regarde l'usine ; leur hauteur, leur traverse ; le deuxième penche dans la ruine. */
const POLES = [
  { x: 5, z: 4 },
  { x: 10, z: 9 },
  { x: 15, z: 14 },
] as const;
const POLE = { h: 4.4, t: 0.22, arm: 0.6, tilt: (20 * Math.PI) / 180 } as const;

/** Le pied du miroir à signaux, au bout des poteaux, au bord : sa fourche vide tournée vers l'usine (au sud-sud-est). */
const MIRROR = { x: 17, z: 16, h: 1.7, yaw: Math.atan2(0.33, 0.94) } as const;

/** Le chemin dallé, de la porte du lieu à celle du poste (les abords) ; hors des chemins du réseau, sous la porte du lieu. */
const PAVED = { z0: 0.6, z1: 6.2, w: 1.2, count: 6 } as const;

/** Le pas de la porte du lieu, depuis le centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_4E.find((p) => p.id === 'dynamo')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention, § 9) : au nord, de la porte vers le poste ; le toit tombé en travers de
 * la porte au centre, la dynamo et sa roue à droite de la porte, le premier poteau à droite ; au-delà, la mer et le ciel.
 * Le cône est hors du cadre, à gauche.
 */
const DOOR_LOOK: Vec2 = { x: 0, z: -2 };
const DOOR_VIEW = Math.atan2(DOOR_AT.x - DOOR_LOOK.x, DOOR_AT.z - DOOR_LOOK.z);

/** La vue d'arrivée, basse comme aux Fabriques. */
const DOOR_FRAME = { height: -2.2, back: 1.6 } as const;

/** Le point du nom sur la Carte : au-dessus du toit, jamais sur la lanterne ni sur le clocheton. */
const MAP_POINT: Vec3 = { x: -1.4, y: POSTE.h + POSTE.ridge + 2, z: (POSTE.z0 + POSTE.z1) / 2 };

// ---------- Le poste ----------

/** Les murs du poste (toujours entiers) : ses quatre murs, ses deux pignons de pierre ; l'ombre de sa porte et de sa fenêtre. */
function poste(b: FacetBuilder): void {
  const P = POSTE;
  const y = POSTE_Y;
  const t = P.wall;
  const xm = (P.x0 + P.x1) / 2,
    zm = (P.z0 + P.z1) / 2;
  const dw = P.door.w / 2;
  b.box({ x: xm, y: y + SINK, z: P.z0 + t / 2 }, [P.x1 - P.x0, P.h - SINK, t], C.stoneShade, C.stone);
  b.box({ x: (P.x0 - dw) / 2, y: y + SINK, z: P.z1 - t / 2 }, [-dw - P.x0, P.h - SINK, t], C.stoneShade, C.stone);
  b.box({ x: (P.x1 + dw) / 2, y: y + SINK, z: P.z1 - t / 2 }, [P.x1 - dw, P.h - SINK, t], C.stoneShade, C.stone);
  b.box({ x: 0, y: y + P.door.h, z: P.z1 - t / 2 }, [P.door.w, P.h - P.door.h, t], C.stoneShade, C.stone);
  // Les assises (retouche 1, point 9) : sur le dos, et sur la façade de part et d'autre de la porte.
  courses(b, { x: xm, y, z: P.z0 + t / 2 }, [P.x1 - P.x0, P.h, t], COURSE_HEIGHTS);
  courses(b, { x: (P.x0 - dw) / 2, y, z: P.z1 - t / 2 }, [-dw - P.x0, P.h, t], COURSE_HEIGHTS);
  courses(b, { x: (P.x1 + dw) / 2, y, z: P.z1 - t / 2 }, [P.x1 - dw, P.h, t], COURSE_HEIGHTS);
  // Les pignons, un cran plus clairs que les longs pans, et leurs assises.
  for (const x of [P.x0 + t / 2, P.x1 - t / 2]) {
    b.box({ x, y: y + SINK, z: zm }, [t, P.h - SINK, P.z1 - P.z0 - 2 * t], C.stone, C.stoneSun);
    courses(b, { x, y, z: zm }, [t, P.h, P.z1 - P.z0 - 2 * t], COURSE_HEIGHTS);
    const half = (P.z1 - P.z0) / 2;
    b.extrude({ x: x - t / 2, y: y + P.h, z: zm, yaw: Math.PI / 2 }, [[-half, 0], [half, 0], [0, P.ridge]], t, C.stone, C.stoneSun);
  }
  // L'ombre de la porte (un brun chaud) et la fenêtre sans vitre, à gauche de la porte.
  b.plate({ x: 0, y, z: P.z1 + 0.01 }, [[-dw, 0], [dw, 0], [dw, P.door.h], [-dw, P.door.h]], C.hollow);
  const W = P.window;
  b.plate({ x: W.x, y: y + W.y, z: P.z1 + 0.01 }, [[-W.w / 2, 0], [W.w / 2, 0], [W.w / 2, W.h], [-W.w / 2, W.h]], C.hollow);
}

/** Le toit de tôle du poste (le corps), un peu débordant. */
function roof(b: FacetBuilder): void {
  const P = POSTE;
  const y = POSTE_Y + P.h;
  const zm = (P.z0 + P.z1) / 2,
    half = (P.z1 - P.z0) / 2;
  const o = 0.35;
  const ridge = y + P.ridge + 0.1;
  const e = y + 0.1 - (o * P.ridge) / half;
  slab(b, [[P.x0 - o, e, P.z1 + o], [P.x1 + o, e, P.z1 + o], [P.x1 + o, ridge, zm], [P.x0 - o, ridge, zm]], 0.1, C.sheet, C.sheetTop);
  slab(b, [[P.x0 - o, ridge, zm], [P.x1 + o, ridge, zm], [P.x1 + o, e, P.z0 - o], [P.x0 - o, e, P.z0 - o]], 0.1, C.sheet, C.sheetTop);
}

/**
 * Le pan de toit tombé en travers de la porte (la ruine) : d'un seul tenant, à sa largeur réelle (la moitié du toit,
 * débord compris), sa tôle de fer rouillé brun éteint, deux nervures sombres ; son haut appuyé sur la façade au-dessus de
 * la porte, son bout à terre à l'ouest, un peu décollé du mur (retouche 1, directeur artistique, point 11 : il se lisait
 * comme une perche fine). Il laisse libre la lanterne de l'électricienne, à droite de la porte.
 */
const FALLEN_ROOF = { top: { x: -0.4, y: 2.9 }, foot: { x: -3.4, y: -0.1 }, half: 1.3, lean: 0.3, ribs: [-0.45, 0.45] } as const;

function fallenRoof(b: FacetBuilder): void {
  const F = FALLEN_ROOF;
  const y0 = POSTE_Y;
  const ax = F.top.x - F.foot.x,
    ay = F.top.y - F.foot.y;
  const len = Math.hypot(ax, ay);
  // En travers du pan, dans le plan de la façade.
  const w = [-ay / len, ax / len] as const;
  // Un point du pan : à `s` le long (0 au pied, 1 en haut), à `o` en travers ; décollé du mur d'autant plus qu'il est bas.
  const p = (s: number, o: number, d = 0): P3 => {
    const x = F.foot.x + ax * s + w[0] * o,
      y = F.foot.y + ay * s + w[1] * o;
    return [x, y0 + y, POSTE.z1 + 0.06 + F.lean * Math.max(0, 3.2 - y) + d];
  };
  const out: P3 = [0, 0.3, 1];
  quadToward(b, [p(0, -F.half), p(1, -F.half), p(1, F.half), p(0, F.half)], out, C.rust);
  quadToward(b, [p(0, -F.half, -0.08), p(1, -F.half, -0.08), p(1, F.half, -0.08), p(0, F.half, -0.08)], [0, -0.3, -1], C.rustTop);
  for (const o of F.ribs) quadToward(b, [p(0.02, o - 0.05, 0.012), p(0.98, o - 0.05, 0.012), p(0.98, o + 0.05, 0.012), p(0.02, o + 0.05, 0.012)], out, C.rib);
}

/** Le clocheton : quatre montants, un petit toit en pointe basse, la cloche de fer sombre pendue dedans. */
function belfry(b: FacetBuilder, at: Vec3): void {
  const B = BELFRY;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: at.x + sx * B.half, y: at.y - 0.2, z: at.z + sz * B.half }, [B.post, B.h + 0.2, B.post], C.newShade, C.newWood);
  b.prism({ x: at.x, y: at.y + B.h, z: at.z, yaw: Math.PI / 4 }, B.r, 0, B.roof, 4, C.sheet);
  bell(b, { x: at.x, y: at.y + 0.2, z: at.z });
}

/** La cloche de fer sombre, son anneau. */
function bell(b: FacetBuilder, at: Vec3): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.28, 0.12, 0.42, 6, C.bell, C.bell);
}

// ---------- La dynamo ----------

/** Le socle de pierre grise de la dynamo : toujours là. */
function socle(b: FacetBuilder): void {
  const D = DYNAMO;
  const g = localGround(D.x, D.z);
  b.box({ x: D.x, y: g + SINK, z: D.z }, [D.socle.w, D.socle.h - SINK, D.socle.d], C.stoneShade, C.stoneSun);
}

/** Le tambour de cuivre sur son socle : droit (le corps), ou de travers, penché de 20° (la ruine). */
function drum(b: FacetBuilder, straight: boolean): void {
  const D = DYNAMO;
  const y = localGround(D.x, D.z) + D.socle.h;
  drawPosed(b, { x: D.x - (straight ? 0 : 0.15), y: y + D.r, z: D.z, yaw: straight ? 0 : 0.35, pitch: straight ? 0 : D.tilt }, (l) => {
    l.drum({ x: 0, y: 0, z: -D.len / 2, pitch: Math.PI / 2 }, D.r, D.len, 8, C.copper, C.copperTop);
    l.drum({ x: 0, y: 0, z: D.len / 2, pitch: Math.PI / 2 }, 0.16, 0.22, 4, C.iron, C.ironTop);
  });
}

/** La grande roue de fer bruni : sa jante, ses rayons, son moyeu, sa manivelle (dans son repère, debout dans le plan x, y). */
function wheel(l: FacetBuilder): void {
  const W = WHEEL;
  l.band({ x: 0, y: 0, z: -0.06, pitch: Math.PI / 2 }, W.r, 0.12, 8, C.iron);
  for (let k = 0; k < W.spokes; k++) {
    const a = (Math.PI * k) / W.spokes + Math.PI / 8;
    l.beam({ x: -Math.cos(a) * W.r, y: -Math.sin(a) * W.r, z: 0 }, { x: Math.cos(a) * W.r, y: Math.sin(a) * W.r, z: 0 }, 0.07, C.iron);
  }
  l.beam({ x: 0, y: 0, z: 0.05 }, { x: 0.4, y: -0.25, z: 0.18 }, 0.07, C.iron);
  l.box({ x: 0.4, y: -0.25, z: 0.18 }, [0.07, 0.07, 0.3], C.newWood);
}

/** La roue debout sur son axe et sa courroie de cuir vers le tambour (le corps). */
function wheelStanding(b: FacetBuilder): void {
  const W = WHEEL;
  const g = localGround(W.x, W.z);
  drawPosed(b, { x: W.x, y: g + W.y, z: W.z, yaw: 0 }, wheel);
  b.box({ x: W.x, y: g - 0.3, z: W.z - 0.25 }, [0.18, W.y + 0.3, 0.14], C.iron, C.ironTop);
  const dy = localGround(DYNAMO.x, DYNAMO.z) + DYNAMO.socle.h + DYNAMO.r;
  const z = DYNAMO.z + DYNAMO.len / 2 + 0.1;
  for (const s of [-1, 1]) strut(b, [DYNAMO.x, dy + s * 0.16, z], [W.x, g + W.y + s * (W.r - 0.05), z], 0.04, C.leather);
}

/** La roue couchée à côté du socle, la courroie en tas (la ruine). */
function wheelDown(b: FacetBuilder): void {
  const at = { x: 4.3, z: 2.6 };
  const g = localGround(at.x, at.z);
  drawPosed(b, { x: at.x, y: g + 0.08, z: at.z, yaw: 0.4, pitch: -Math.PI / 2 }, wheel);
  b.prism({ x: 2.9, y: g - 0.03, z: 2.75 }, 0.32, 0.2, 0.16, 5, C.leather);
}

/** La lanterne de l'électricienne, au mur à droite de la porte : toujours là, toujours allumée. */
function keeperLantern(b: FacetBuilder): void {
  const L = KEEPER_LANTERN;
  b.beam({ x: L.x, y: POSTE_Y + L.h, z: POSTE.z1 }, { x: L.x, y: POSTE_Y + L.h, z: L.z + 0.4 }, 0.07, C.iron);
  lantern(b, { x: L.x, y: POSTE_Y + L.h - 0.04, z: L.z + 0.4 }, true);
}

// ---------- Les poteaux ----------

/** Les points d'attache d'un poteau : le bout de ses deux isolateurs, dans son repère penché ou non. */
function poleTop(k: number, tilted: boolean): [P3, P3] {
  const p = POLES[k];
  const g = localGround(p.x, p.z);
  // La traverse est en travers des fils (la direction des poteaux, au sud-est) : le long de (1 ; −1).
  const across = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
  const lean = tilted ? POLE.tilt : 0;
  // Penché vers le sud-ouest (−1 ; 1) : la tête recule dans cette direction.
  const dx = -Math.sin(lean) * Math.SQRT1_2 * POLE.h,
    dz = Math.sin(lean) * Math.SQRT1_2 * POLE.h;
  const y = g + Math.cos(lean) * POLE.h + 0.12;
  return [-1, 1].map((s) => [p.x + dx + across.x * s * POLE.arm * 0.8, y, p.z + dz + across.z * s * POLE.arm * 0.8] as P3) as [P3, P3];
}

/** Un poteau de bois brun, sa courte traverse au sommet, ses deux isolateurs gris-bleu ; penché (la ruine) ou droit. */
function pole(b: FacetBuilder, k: number, tilted: boolean): void {
  const p = POLES[k];
  const g = localGround(p.x, p.z);
  // Le poteau penche vers le sud-ouest : dans son repère tourné de −45°, vers +z.
  drawPosed(b, { x: p.x, y: g, z: p.z, yaw: tilted ? -Math.PI / 4 : 0, pitch: tilted ? POLE.tilt : 0 }, (l) => {
    l.box({ x: 0, y: SINK, z: 0 }, [POLE.t, POLE.h - SINK, POLE.t], C.pole, C.poleTop);
  });
  const [a, c] = poleTop(k, tilted);
  const mid: P3 = [(a[0] + c[0]) / 2, a[1] - 0.12, (a[2] + c[2]) / 2];
  b.beam({ x: a[0], y: mid[1] - 0.06, z: a[2] }, { x: c[0], y: mid[1] - 0.06, z: c[2] }, 0.12, C.pole);
  for (const q of [a, c]) b.box({ x: q[0], y: q[1] - 0.14, z: q[2] }, [0.1, 0.16, 0.1], C.insulator, C.insulatorTop);
}

/** La lampe d'un poteau : sa petite cage de fer et son verre, sur un court bras ; allumée ou éteinte. */
function poleLamp(b: FacetBuilder, k: number, lit: boolean): void {
  const p = POLES[k];
  const g = localGround(p.x, p.z);
  const y = g + POLE.h - 0.9;
  b.beam({ x: p.x, y, z: p.z }, { x: p.x - 0.4, y, z: p.z - 0.4 }, 0.07, C.iron);
  lantern(b, { x: p.x - 0.4, y: y - 0.04, z: p.z - 0.4 }, lit, 0.9);
}

/** Un fil tendu en courbe douce entre deux points (deux brins, son creux au milieu). */
function wire(b: FacetBuilder, a: P3, c: P3, sag: number): void {
  const m: P3 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - sag, (a[2] + c[2]) / 2];
  strut(b, a, m, 0.025, C.iron);
  strut(b, m, c, 0.025, C.iron);
}

/** Le départ des fils, au pignon est du poste. */
const GABLE_HOOKS: [P3, P3] = (() => {
  const y = POSTE_Y + POSTE.h - 0.3;
  return [
    [POSTE.x1 + 0.05, y, -1.6],
    [POSTE.x1 + 0.05, y, -2.4],
  ];
})();

/** Les fils tendus : du pignon au premier poteau, puis d'un poteau à l'autre (les abords). */
function wiresTaut(b: FacetBuilder): void {
  const tops = POLES.map((_, k) => poleTop(k, false));
  for (let s = 0; s < 2; s++) {
    wire(b, GABLE_HOOKS[s], tops[0][s], 0.3);
    wire(b, tops[0][s], tops[1][s], 0.45);
    wire(b, tops[1][s], tops[2][s], 0.45);
  }
}

/**
 * Un fil lâche qui pend entre deux points en boucle douce (une chaînette en `n` brins), son creux à `low` au-dessus du sol
 * (retouche 1, directeur artistique, point 11 : le fil du deuxième poteau tombait en V aigu jusqu'au sol).
 */
function looseWire(b: FacetBuilder, a: P3, c: P3, low: number, n = 6): void {
  const mx = (a[0] + c[0]) / 2,
    mz = (a[2] + c[2]) / 2;
  const bottom = localGround(mx, mz) + low;
  const sag = Math.max(0, (a[1] + c[1]) / 2 - bottom);
  const at = (t: number): P3 => [a[0] + (c[0] - a[0]) * t - 0.35 * Math.sin(Math.PI * t), a[1] + (c[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (c[2] - a[2]) * t + 0.35 * Math.sin(Math.PI * t)];
  for (let k = 0; k < n; k++) strut(b, at(k / n), at((k + 1) / n), 0.025, C.iron);
}

/** Les fils de la ruine : du pignon au premier poteau, tendus ; ceux du deuxième poteau en boucles lâches. */
function wiresLoose(b: FacetBuilder): void {
  const t0 = poleTop(0, false);
  const t1 = poleTop(1, true);
  const t2 = poleTop(2, false);
  for (let s = 0; s < 2; s++) wire(b, GABLE_HOOKS[s], t0[s], 0.3);
  looseWire(b, t0[0], t1[0], 0.9);
  looseWire(b, t1[1], t2[1], 1.3);
}

/** Le pied du miroir à signaux, au bord : un pied de fer, sa fourche vide à deux bras, ses deux goujons nus ; toujours là. */
function mirrorFoot(b: FacetBuilder): void {
  const M = MIRROR;
  const g = localGround(M.x, M.z);
  drawPosed(b, { x: M.x, y: g, z: M.z, yaw: M.yaw }, (l) => {
    l.box({ x: 0, y: SINK, z: 0 }, [0.2, M.h - SINK, 0.2], C.iron, C.ironTop);
    for (const s of [-1, 1]) {
      l.beam({ x: 0, y: M.h - 0.05, z: 0 }, { x: s * 0.42, y: M.h + 0.5, z: 0.05 }, 0.1, C.iron);
      l.box({ x: s * 0.42 - s * 0.12, y: M.h + 0.44, z: 0.05 }, [0.24, 0.07, 0.07], C.ironTop);
    }
  });
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const corps = { stage: 0 as const, row: 0 };
  const haut = { stage: 1 as const, row: 0 };
  const abords = { stage: 2 as const, row: 0 };

  // Toujours là : les murs du poste, sa porte et sa fenêtre ; le socle de la dynamo ; la lanterne de l'électricienne ; le
  // premier et le troisième poteau debout ; le pied du miroir et sa fourche vide.
  add('ruine', 0, (b) => {
    poste(b);
    socle(b);
    keeperLantern(b);
    pole(b, 0, false);
    pole(b, 2, false);
    mirrorFoot(b);
  });

  // ---- La ruine ----
  // Le corps la relève : le pan de toit tombé, le tambour de travers, la roue couchée et la courroie en tas.
  add(
    'ruine',
    0,
    (b) => {
      fallenRoof(b);
      drum(b, false);
      wheelDown(b);
    },
    corps,
  );
  // Le haut la relève : le clocheton couché au pied du mur est, la cloche au sol contre le mur ouest ; la lampe éteinte
  // du premier poteau.
  add(
    'ruine',
    0,
    (b) => {
      const g = localGround(POSTE.x1 + 1.2, -2.2);
      drawPosed(b, { x: POSTE.x1 + 1.3, y: g + BELFRY.half + 0.05, z: -2.2, yaw: 0.3, pitch: Math.PI / 2 }, (l) => belfry(l, { x: 0, y: -BELFRY.h / 2, z: 0 }));
      bell(b, { x: POSTE.x0 - 0.45, y: localGround(POSTE.x0 - 0.45, -1.4) - 0.02, z: -1.4 });
      poleLamp(b, 0, false);
    },
    haut,
  );
  // Les abords la relèvent : le deuxième poteau penché, les fils lâches, la lampe éteinte du troisième.
  add(
    'ruine',
    0,
    (b) => {
      pole(b, 1, true);
      wiresLoose(b);
      poleLamp(b, 2, false);
    },
    abords,
  );

  // ---- Le corps : la dynamo remise droite, la roue relevée et sa courroie ; le toit reposé.
  add(0, 0, (b) => {
    drum(b, true);
    wheelStanding(b);
    roof(b);
  });
  // ---- Le haut : le clocheton remonté sur le faîte, la cloche dedans ; la lampe du premier poteau, allumée.
  add(1, 0, (b) => {
    belfry(b, { x: 0, y: POSTE_Y + POSTE.h + POSTE.ridge + 0.05, z: (POSTE.z0 + POSTE.z1) / 2 });
    poleLamp(b, 0, true);
  });
  // ---- Les abords : le deuxième poteau debout, les fils tendus ; la lampe du troisième, allumée ; le chemin dallé.
  add(2, 0, (b) => {
    pole(b, 1, false);
    wiresTaut(b);
    poleLamp(b, 2, true);
    const P = PAVED;
    for (let k = 0; k < P.count; k++) {
      const z = P.z0 + ((P.z1 - P.z0) * (k + 0.5)) / P.count;
      const len = ((P.z1 - P.z0) / P.count) * 0.86;
      const x = k % 2 ? 0.06 : -0.06;
      b.plate({ x, y: localGround(x, z) + 0.04, z, pitch: -Math.PI / 2 }, [[-P.w / 2, -len / 2], [P.w / 2, -len / 2], [P.w / 2, len / 2], [-P.w / 2, len / 2]], k % 2 ? C.stoneSun : C.stone);
    }
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu ; aucune sur un chemin. */
const TRACE_SPOTS = {
  'light-sound': { x: -1.6, z: 0.6 },
  'electric-circuits': { x: -3.6, z: 1.2 },
  'chemical-reactions': { x: 5.6, z: 4.6 },
} as const;

/** Dessine au centre du lieu (`c`), dans le monde, sur le sol sous `p`. */
function inWorld(b: FacetBuilder, c: Vec3, p: Vec2, draw: (l: FacetBuilder, g: number) => void): void {
  drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw: 0 }, (l) => draw(l, localGround(p.x, p.z)));
}

/** Un banc de veille sous la fenêtre, une caisse à outils de bois fermée posée dessus (Lumière et son). */
function benchAndBox(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['light-sound'];
  inWorld(b, c, p, (l, g) => {
    l.box({ x: p.x, y: g + 0.42, z: p.z }, [1.3, 0.08, 0.38], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.box({ x: p.x + s * 0.5, y: g - 0.3, z: p.z }, [0.1, 0.72, 0.32], C.newShade);
    l.box({ x: p.x + 0.2, y: g + 0.5, z: p.z }, [0.55, 0.28, 0.3], C.newShade, C.newWood);
    l.box({ x: p.x + 0.2, y: g + 0.78, z: p.z }, [0.3, 0.06, 0.06], C.iron);
  });
}

/** Un grand touret de bois sur son pied, enroulé de fil de cuivre patiné (Circuits et loi d'Ohm). */
function cableDrum(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['electric-circuits'];
  inWorld(b, c, p, (l, g) => {
    for (const s of [-1, 1]) l.box({ x: p.x + s * 0.42, y: g - 0.2, z: p.z }, [0.1, 0.95, 0.5], C.newShade);
    l.drum({ x: p.x - 0.36, y: g + 0.62, z: p.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.55, 0.1, 6, C.newShade, C.newWood);
    l.drum({ x: p.x + 0.26, y: g + 0.62, z: p.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.55, 0.1, 6, C.newShade, C.newWood);
    l.prism({ x: p.x - 0.26, y: g + 0.62, z: p.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.36, 0.36, 0.52, 6, C.copper, C.copperTop);
  });
}

/** Un tonnelet de goudron au pied du premier poteau, sa brosse à long manche debout dedans (Transformations chimiques). */
function tarKeg(b: FacetBuilder, c: Vec3): void {
  const p = TRACE_SPOTS['chemical-reactions'];
  inWorld(b, c, p, (l, g) => {
    l.prism({ x: p.x, y: g - 0.05, z: p.z }, 0.28, 0.25, 0.55, 6, C.newShade, C.tar);
    l.band({ x: p.x, y: g + 0.3, z: p.z }, 0.285, 0.06, 6, C.iron);
    l.box({ x: p.x + 0.05, y: g + 0.3, z: p.z }, [0.05, 1.15, 0.05], C.newWood);
    l.box({ x: p.x + 0.05, y: g + 1.4, z: p.z }, [0.16, 0.12, 0.08], C.rope);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : des objets du poste, jamais la notion, rien à lire. */
const TRACES = {
  'light-sound': { at: TRACE_SPOTS['light-sound'], lift: 1, stage: 0, row: 0, draw: benchAndBox },
  'electric-circuits': { at: TRACE_SPOTS['electric-circuits'], lift: 1, stage: 1, row: 0, draw: cableDrum },
  'chemical-reactions': { at: TRACE_SPOTS['chemical-reactions'], lift: 1, stage: 2, row: 0, draw: tarKeg },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 8) : à l'est-nord-est, à 75°, vers la Dalle et la mer du
 * nord ; les poteaux hors du cadre à droite ; le pont, la coulée et la cuvette derrière la caméra : aucune lave. Elle
 * regarde vers −(sin cap, cos cap).
 */
const SCENE_COMPASS = (75 * Math.PI) / 180;
const SCENE_START = Math.atan2(-Math.sin(SCENE_COMPASS), Math.cos(SCENE_COMPASS));

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'électricienne). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/**
 * Le milieu de la scène, depuis le centre du lieu : devant la porte du poste, à côté de la dynamo. Retouche 1 (directeur
 * artistique, point 12 : Kéo entrait dans le socle) : un peu plus au sud et à l'ouest, Kéo libre devant la machine.
 */
const SCENE_SPOT = { dx: 1.0, dz: 4.7, half: [2.3, 1.0] as [number, number] } as const;

/** L'écart de Kéo et de l'électricienne au milieu de la scène. */
const SCENE_HALF = 1.9;

/** Le sol de la scène, un cran au-dessus de la terre (questionScene.ts, `sceneSpot`). */
const SCENE_RISE = 0.06;

/** L'électricienne en pion (son modèle 3D prend sa place) : bottes, pantalon gris, veste vert-de-gris. */
function electrician(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.28, 0.24, 0.42, 8, C.jacket);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.jacket);
}

/** La planche des isolateurs sur ses tréteaux : sa hauteur, le cran d'un isolateur choisi, sa taille. */
const BOARD = { height: 0.5, lift: 0.3, insulator: 0.3, r: 0.17 } as const;

export const DYNAMO_PLACE: PlaceArt = {
  role: 'L’électricienne',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse : le sol est plat, rien ne la cache.
    pitch: (13 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la façade, la dynamo et le banc sont au lieu ; les abords (./dynamoSurroundings.ts) ajoutent une
  // caisse d'isolateurs fermée et deux pierres basses. Il reste l'électricienne en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) electrician(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.insulator, half: BOARD.r + 0.04 },
    facing: true,
    // Une planche sur deux tréteaux, sous la rangée des isolateurs.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.45 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.4 * s], C.woodShade);
      }
    },
    // Un isolateur de verre gris-bleu, mat, en cloche ; choisi, il se soulève d'un cran ; il ne s'allume jamais.
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s;
      b.prism({ x: at.x, y, z: at.z }, BOARD.r * s, BOARD.r * 0.55 * s, BOARD.insulator * s, 6, C.insulator, C.insulatorTop);
    },
  },
  // Les trois missions en R : le sol seul, rien de l'item ; les isolateurs portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, face au poste.
  exit: { x: DOOR_AT.x + 0.9, z: DOOR_AT.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Dynamo, pour les tests et ses abords : le poste, la dynamo, les poteaux, le miroir, la caméra. */
export const DYNAMO_LAYOUT = {
  poste: POSTE,
  posteY: POSTE_Y,
  belfry: BELFRY,
  dynamo: DYNAMO,
  wheel: WHEEL,
  poles: POLES,
  pole: POLE,
  mirror: MIRROR,
  paved: PAVED,
  keeperLantern: KEEPER_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorLook: DOOR_LOOK,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  heightAtCenter: H0,
  /** Le bois neuf et le cuivre patiné (ses abords en posent). */
  colors: { wood: C.newWood, woodShade: C.newShade, insulator: C.insulator, insulatorTop: C.insulatorTop },
} as const;
