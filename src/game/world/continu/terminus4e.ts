// Le Terminus (lot 3 du monde ouvert du 4e, l'Épaule, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-epaule-v1`) : « la gare du minerai, en haut de la ligne : la montagne versait son minerai dans la
// trémie, et les bennes partaient vers la Forge ». Le cœur, sans figure : la trémie, le quai, la voie et son butoir, les
// galeries, la remise. Le lieu est au pied du cône (intention, § 2) : le flanc monte au sud-ouest, le replat de l'Épaule
// est plat au nord-est, 5,2 sous le centre. La voie prolonge les rails du lot 1 depuis leur dernier point, au pas de la
// porte, vers le nord-nord-ouest, jusqu'au butoir, le long du pied ; le quai et la trémie s'adossent au flanc, sur leur
// terre-plein et son mur de soutènement ; les deux galeries s'ouvrent en encoche dans le flanc, leur bouche tournée vers la
// porte ; la remise et la voie de garage sont sur le replat, à droite de la voie. Tout s'aligne sur la voie : le lieu se
// dessine dans le repère de la voie (`t` le long d'elle, du bout des rails au butoir ; `v` en travers, vers le replat).
// Le signe de l'absence du 4e : au bout nord du quai, la potence de la cloche de départ, un court bras de fer sur un
// poteau bas, et au bout du bras la chape vide et ses deux goujons nus (la cloche est chez les Ferrailleurs). Avant comme
// après, jamais une étape.
//
// La ruine (intention, § 6) : la trémie debout mais penchée de 7° vers le flanc, un pied cassé au tiers, deux planches
// manquantes sur sa face nord, sa goulotte tombée de travers sur le quai ; la bordure du quai déchaussée, sa rampe
// effondrée en pente douce ; la remise à mi-hauteur, sans toit, sa charpente tombée dedans ; la benne couchée sur le flanc
// à côté de la voie de garage ; les cadres des galeries tombés en travers des bouches ; le butoir cassé, un madrier à
// terre. Une seule lumière, la lanterne du cheminot, contre le pignon sud de la remise, au-dessus de son banc. Cinq parties
// (3 + 1 + 1) : le quai refait, la trémie redressée, les murs de la remise ; le haut (le toit de la remise, la passerelle de
// la galerie haute à la trémie, la lanterne du quai) ; les abords (les cadres reboisés, le butoir refait, la benne relevée,
// vide, sur la voie de garage, la lanterne du chemin). Sous la goulotte, la voie reste libre : la place de la benne de la
// ligne, réservée (intention, § 10). Code pur (placeArt.ts).
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { CHAPE, chape, COURSE_HEIGHTS, courses, EPAULE_COLORS, lantern, quadToward, SINK, slab } from './epauleKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

type P3 = readonly [number, number, number];

/**
 * Les couleurs du Terminus : celles de l'Épaule (./epauleKit.ts) ; le ballast de la ligne (`COLORS_4E`) ; la tôle du
 * toit de la remise, du fer bruni ; les sacs de toile des réponses ; le cheminot en pion.
 */
const C = {
  ...EPAULE_COLORS,
  ballast: COLORS_4E.ballast,
  sheet: 0x6a5c56,
  sheetTop: 0x7a6a62,
  // La terre du flanc taillée autour des bouches des galeries : la roche du 4e, au soleil et à l'ombre (jamais le basalte
  // presque noir du cône).
  earth: COLORS_4E.rock,
  earthSun: COLORS_4E.rockSun,
  sack: 0xc2b294,
  sackTop: 0xd0c2a6,
  wedge: 0x8c766a,
  // Le cheminot, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon gris, veste de toile bleue.
  trousers: 0x5c6670,
  jacket: 0x56687a,
} as const;

// ---------- Le repère ----------

/** Le centre du lieu et le sol sous lui. */
const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'terminus')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt4e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * La voie : du dernier point des rails du lot 1 (au pas de la porte) au butoir, au nord-nord-ouest, le long du pied du
 * flanc ; `start` : où son ballast commence (la porte reste libre) ; son lit, le dessus du ballast, descend en pente douce
 * (`y0`, `slope`), à la hauteur des rails du lot 1 à leur bout, et la tient sur un remblai côté replat.
 */
const TRACK = { from: { x: 7.8, z: 2.8 }, to: { x: 3.0, z: -7.4 }, start: 0.3, y0: -3.2, slope: -0.08, ballast: 1.15, gauge: 0.7, rail: 0.12, sleeper: 1.6 } as const;
const LENGTH = Math.hypot(TRACK.to.x - TRACK.from.x, TRACK.to.z - TRACK.from.z);
/** Le long de la voie (vers le butoir) ; en travers (vers le replat, à l'est). */
const D: Vec2 = { x: (TRACK.to.x - TRACK.from.x) / LENGTH, z: (TRACK.to.z - TRACK.from.z) / LENGTH };
const N: Vec2 = { x: -D.z, z: D.x };
const TRACK_YAW = Math.atan2(D.x, D.z);

/** Un point du repère de la voie (`t`, `v`) dans le repère du lieu, et l'inverse. */
const tv = (t: number, v: number): Vec2 => ({ x: TRACK.from.x + D.x * t + N.x * v, z: TRACK.from.z + D.z * t + N.z * v });
const toTrack = (p: Vec2): { t: number; v: number } => {
  const dx = p.x - TRACK.from.x,
    dz = p.z - TRACK.from.z;
  return { t: dx * D.x + dz * D.z, v: dx * N.x + dz * N.z };
};
/** Le sol sous un point du repère de la voie. */
const tGround = (t: number, v: number): number => {
  const p = tv(t, v);
  return localGround(p.x, p.z);
};
/** Le dessus du ballast, et celui des rails. */
const bed = (t: number): number => TRACK.y0 + TRACK.slope * t;
const railTop = (t: number): number => bed(t) + 0.2;

/**
 * Dessine dans le repère de la voie, posé au bout des rails : son `x` est `−v` (le flanc à `+x`), son `z` est `t`. Les
 * points `[x, y, z]` s'y écrivent `pt(t, v, y)`.
 */
const inTrack = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: TRACK.from.x, y: 0, z: TRACK.from.z, yaw: TRACK_YAW }, draw);
const pt = (t: number, v: number, y: number): P3 => [-v, y, t];

// ---------- Le plan, dans le repère de la voie ----------

/**
 * Le quai, côté flanc : le long de la voie (`t0` à `t1`), du mur de soutènement (`v0`) à la bordure (`v1`). Son dessus suit
 * la pente de la voie, au-dessus du flanc partout sous lui (il se fait son terre-plein), et au moins à 1,1 au-dessus du
 * rail (intention, § 3) ; sa bordure de dalles claires côté voie ; sa rampe au bout sud.
 */
const QUAI = { t0: 1.6, t1: 10.4, v0: -2.9, v1: -0.95, kerb: 0.3, wall: 0.7 } as const;
const QUAI_LIFT = (() => {
  let hi = -Infinity;
  for (let t = QUAI.t0; t <= QUAI.t1 + 1e-9; t += 0.4) for (let v = QUAI.v0; v <= QUAI.v1 + 1e-9; v += 0.35) hi = Math.max(hi, tGround(t, v) - TRACK.slope * t);
  return Math.max(hi + 0.08, TRACK.y0 + 0.2 + 1.1);
})();
const quaiTop = (t: number): number => QUAI_LIFT + TRACK.slope * t;

/**
 * La trémie, à cheval sur la voie, son côté ouest au-dessus du quai : sa caisse de planches (`along` le long de la voie,
 * `across` en travers), du bas de l'entonnoir (`mouth`, sa bouche `mouthHalf`) au haut de la caisse (`top`), en hauteur
 * au-dessus du rail ; ses quatre pieds épais, liés par des traverses, jamais en croix ; sa penche de la ruine (7°).
 */
const HOPPER = { t: 6.6, along: 3.5, across: 4.5, box: 3.35, top: 3.8, plank: 0.12, mouth: 1.8, mouthHalf: 0.6, leg: 0.35, legT: 1.4, legV: 1.6, tilt: 0.12 } as const;
const HOPPER_RAIL = railTop(HOPPER.t);

/** Les deux galeries, en encoche dans le flanc, leur bouche tournée vers la porte : la haute (à gauche du quai), la basse (derrière le butoir). */
const GALLERIES = [
  { x: -2.6, z: -2.1 },
  { x: -1.9, z: -9.6 },
] as const;
/**
 * Une bouche de galerie : sa largeur, sa hauteur ; l'encoche taillée dans la terre du flanc autour d'elle (retouche 1,
 * directeur artistique, point 2 : plus de bloc de pierre grise) : la tête de terre juste autour du cadre (`head`, son
 * débord au-delà du cadre, en largeur et en hauteur) ; le talus (retouche 2, point A) : le front qui retombe sur `brow`
 * vers l'arrière, et de chaque côté le bord de la tête qui descend jusqu'au sol, son écart (`spread`) selon la hauteur
 * à rattraper ; `sink` : ce que ses coins s'enfoncent sous le flanc.
 */
const MOUTH = { w: 1.8, h: 2.0, head: { side: 0.3, over: 0.36 }, brow: 1.4, spread: { k: 0.45, min: 0.4, max: 1.4 }, sink: 0.05 } as const;

/** La remise, sur le replat, son long côté parallèle à la voie, sa grande porte tournée vers la voie de garage. */
const REMISE = { t0: 5.4, t1: 11.0, v0: 5.0, v1: 9.2, wall: 0.45, h: 3.0, ridge: 1.4, door: [7.2, 9.8] as const, doorH: 2.5 } as const;
const REMISE_Y = (() => {
  let hi = -Infinity;
  for (const t of [REMISE.t0, (REMISE.t0 + REMISE.t1) / 2, REMISE.t1]) for (const v of [REMISE.v0, (REMISE.v0 + REMISE.v1) / 2, REMISE.v1]) hi = Math.max(hi, tGround(t, v));
  return hi + 0.04;
})();

/** La voie de garage, parallèle à la voie côté remise (hors de la ligne) ; son heurtoir au bout nord ; la benne vide. */
const SIDING = { v: 2.7, t0: 3.6, t1: 9.6 } as const;
const SIDING_Y = Math.max(tGround(SIDING.t0, SIDING.v), tGround(SIDING.t1, SIDING.v)) + 0.12;
const BENNE = { t: 5.0, w: 1.3, l: 1.9, h: 0.8, ruin: { t: 4.6, v: 4.0 } } as const;

/** La potence de la cloche, au bout nord du quai : son poteau bas, son bras vers la voie. */
const POTENCE = { t: 10.0, v: -2.4, h: 1.8, arm: 0.9 } as const;

/** La lanterne du cheminot (la seule allumée de la ruine), sur son poteau contre le pignon sud de la remise, et son banc. */
const KEEPER_LANTERN = { t: 5.0, v: 5.6, h: 2.3 } as const;
const BENCH = { t: 4.85, v: 6.6, len: 1.4 } as const;
/** La lanterne du quai (le haut), et celle du chemin (les abords), près de la porte, hors du chemin, dans le repère du lieu. */
const QUAI_LANTERN = { t: 8.7, v: -2.6, h: 2.0 } as const;
const PATH_LANTERN = { x: 9.5, z: 1.6, h: 1.35 } as const;

/** Le pas de la porte du lieu, depuis le centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_4E.find((p) => p.id === 'terminus')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention, § 9) : de la porte vers le nord-ouest, à 328°, le long du pied du flanc ;
 * la trémie au centre, un peu à droite, le butoir et la galerie basse derrière elle ; à gauche le quai et la galerie
 * haute, puis le flanc qui monte hors du cadre ; à droite la remise, la lanterne du cheminot, le replat et la mer. La
 * caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_COMPASS = (334 * Math.PI) / 180;
const DOOR_LOOK: Vec2 = { x: DOOR_AT.x + 10 * Math.sin(DOOR_COMPASS), z: DOOR_AT.z - 10 * Math.cos(DOOR_COMPASS) };
const DOOR_VIEW = Math.atan2(DOOR_AT.x - DOOR_LOOK.x, DOOR_AT.z - DOOR_LOOK.z);

/** La vue d'arrivée, basse, comme aux Fabriques : un peu plus bas que la caméra qui suit, un peu reculée. */
const DOOR_FRAME = { height: -0.4, back: 1.6 } as const;

/** Le point du nom sur la Carte : au-dessus de la remise, jamais sur la trémie ni sur une galerie. */
const MAP_POINT: Vec3 = (() => {
  const p = tv((REMISE.t0 + REMISE.t1) / 2, (REMISE.v0 + REMISE.v1) / 2);
  return { x: p.x, y: REMISE_Y + REMISE.h + REMISE.ridge + 2, z: p.z };
})();

// ---------- La voie ----------

/** La voie du lieu : son ballast en remblai, ses traverses, ses deux rails ; toujours là (la ruine les a gardés). */
function track(l: FacetBuilder): void {
  const T = TRACK;
  const [a, c] = [T.start, LENGTH];
  slab(l, [pt(a, -T.ballast, bed(a)), pt(a, T.ballast, bed(a)), pt(c, T.ballast, bed(c)), pt(c, -T.ballast, bed(c))], 1.7, C.ballast, C.ballast);
  const n = Math.ceil((c - a) / T.sleeper);
  for (let k = 0; k < n; k++) {
    const t = a + ((c - a) * (k + 0.5)) / n;
    l.box({ x: 0, y: bed(t) - 0.02, z: t }, [1.5, 0.1, 0.32], C.woodShade, C.wood);
  }
  for (const s of [-1, 1]) {
    const v = (s * T.gauge) / 2;
    slab(l, [pt(a, v - T.rail / 2, railTop(a)), pt(a, v + T.rail / 2, railTop(a)), pt(c - 0.4, v + T.rail / 2, railTop(c - 0.4)), pt(c - 0.4, v - T.rail / 2, railTop(c - 0.4))], 0.14, C.rust, C.rustTop);
  }
}

/** Le butoir au bout de la voie : refait (un bloc de bois neuf cerclé de fer), ou cassé (son madrier à terre). */
function buffer(l: FacetBuilder, whole: boolean): void {
  const t = LENGTH - 0.2;
  const y = bed(t);
  if (whole) {
    l.box({ x: 0, y, z: t }, [1.4, 0.85, 0.6], C.newShade, C.newWood);
    l.box({ x: 0, y: y + 0.45, z: t }, [1.46, 0.16, 0.66], C.iron);
    return;
  }
  l.box({ x: 0.2, y, z: t, yaw: 0.15 }, [1.0, 0.45, 0.6], C.woodShade, C.wood);
  l.box({ x: -1.5, y: tGround(t - 0.3, 1.5) - 0.05, z: t - 0.3, yaw: 0.9 }, [0.35, 0.3, 1.5], C.woodShade, C.wood);
}

// ---------- Le quai ----------

/**
 * Le corps du quai, son mur de soutènement côté flanc, ses joints d'assise côté voie : toujours là. Retouche 1 (directeur
 * artistique, point 3 : le terre-plein formait une proue grise qui sortait du flanc en pointe) : le mur de soutènement
 * est un pan droit, de niveau avec le quai (le flanc retombe dessus là où il est plus haut), fermé au bout sud par un
 * retour d'équerre, sans arête vers la caméra ; la pierre grise à ses assises.
 */
/**
 * La rampe du bout sud du quai (retouche 2, directeur artistique, point B : c'est la forme en plan qui faisait la proue,
 * pas la hauteur de la marche) : un plan bas de terre tassée, séparé de la pierre, posé côté flanc, là où le sol est le
 * plus haut (`v0` à `v1`), qui descend du bord du quai au sol à `from`, au pied du pan d'équerre qui finit le quai.
 */
const RAMP = { from: -0.2, v0: QUAI.v0 + 0.1, v1: -1.85, edge: 0.14 } as const;
/** Le sol sous le pied de la rampe, au plus haut de sa largeur : la rampe y finit au ras du sol, jamais en marche. */
const rampLo = (): number => Math.max(tGround(RAMP.from, RAMP.v0), tGround(RAMP.from, RAMP.v1)) + 0.02;

function quai(l: FacetBuilder): void {
  const Q = QUAI;
  slab(l, [pt(Q.t0, Q.v0, quaiTop(Q.t0)), pt(Q.t0, Q.v1, quaiTop(Q.t0)), pt(Q.t1, Q.v1, quaiTop(Q.t1)), pt(Q.t1, Q.v0, quaiTop(Q.t1))], 3.4, C.stone, C.stoneSun);
  // Les joints d'assise, sur la face côté voie et sur le bout nord.
  for (const dy of [0.5, 1.15]) {
    const y0 = quaiTop(Q.t0) - dy,
      y1 = quaiTop(Q.t1) - dy;
    quadToward(l, [pt(Q.t0, Q.v1 + 0.006, y0), pt(Q.t1, Q.v1 + 0.006, y1), pt(Q.t1, Q.v1 + 0.006, y1 + 0.07), pt(Q.t0, Q.v1 + 0.006, y0 + 0.07)], [-1, 0, 0], C.joint);
    quadToward(l, [pt(Q.t1 + 0.006, Q.v0, y1), pt(Q.t1 + 0.006, Q.v1, y1), pt(Q.t1 + 0.006, Q.v1, y1 + 0.07), pt(Q.t1 + 0.006, Q.v0, y1 + 0.07)], [0, 0, 1], C.joint);
  }
  // Le mur de soutènement, de pierre sèche, d'un seul pan droit, 0,45 au-dessus du quai, du haut de la rampe au bout nord
  // (pas plus au sud : il couperait le regard de la caméra vers Kéo à la porte, de l'ouest).
  const wallTop = (t: number) => quaiTop(Math.max(t, Q.t0)) + 0.45;
  slab(l, [pt(Q.t0, Q.v0 - Q.wall, wallTop(Q.t0)), pt(Q.t0, Q.v0, wallTop(Q.t0)), pt(Q.t1, Q.v0, wallTop(Q.t1)), pt(Q.t1, Q.v0 - Q.wall, wallTop(Q.t1))], 3.6, C.stoneShade, C.stone);
  // Le bout sud, d'équerre : un pan vertical perpendiculaire au quai, sans biseau, ses joints d'assise comme sur le long
  // côté ; le mur de soutènement et la bordure s'arrêtent au même plan (retouche 2, point B).
  for (const dy of [0.5, 1.15]) {
    const y = quaiTop(Q.t0) - dy;
    quadToward(l, [pt(Q.t0 - 0.006, Q.v0, y), pt(Q.t0 - 0.006, Q.v1, y), pt(Q.t0 - 0.006, Q.v1, y + 0.07), pt(Q.t0 - 0.006, Q.v0, y + 0.07)], [0, 0, -1], C.joint);
  }
  quadToward(l, [pt(Q.t0, Q.v0 + 0.006, wallTop(Q.t0) - 0.3), pt(Q.t1, Q.v0 + 0.006, wallTop(Q.t1) - 0.3), pt(Q.t1, Q.v0 + 0.006, wallTop(Q.t1) - 0.23), pt(Q.t0, Q.v0 + 0.006, wallTop(Q.t0) - 0.23)], [-1, 0, 0], C.joint);
}

/** La bordure de dalles claires côté voie : entière, ou dans la ruine en deux morceaux et deux dalles déchaussées. */
function kerb(l: FacetBuilder, whole: boolean): void {
  const Q = QUAI;
  const v0 = Q.v1 - Q.kerb;
  const strip = (a: number, c: number) => slab(l, [pt(a, v0, quaiTop(a) + 0.07), pt(a, Q.v1, quaiTop(a) + 0.07), pt(c, Q.v1, quaiTop(c) + 0.07), pt(c, v0, quaiTop(c) + 0.07)], 0.12, C.stoneShade, C.stoneSun);
  if (whole) {
    strip(Q.t0, Q.t1);
    return;
  }
  strip(Q.t0, 4.2);
  strip(5.6, Q.t1);
  for (const [t, v, yaw] of [
    [4.5, -1.75, 0.5],
    [5.3, -2.4, -0.3],
  ] as const) {
    const y = quaiTop(t) - 0.02;
    l.box({ x: -v, y, z: t, yaw, pitch: 0.15 }, [0.32, 0.14, 0.7], C.stoneShade, C.stoneSun);
  }
}

/**
 * La rampe : un plan de terre tassée, bordé côté voie d'un madrier, du bord du quai au sol (retouche 2, point B) ; dans
 * la ruine, ravinée, plus basse au bord du quai, son madrier tombé de travers.
 */
function ramp(l: FacetBuilder, whole: boolean): void {
  const Q = QUAI,
    R = RAMP;
  const lo = rampLo();
  const hi = whole ? quaiTop(Q.t0) - 0.02 : quaiTop(Q.t0) - 0.45;
  // Assez épaisse pour toucher le sol partout sous elle, qui descend vers la voie.
  const deep = hi - Math.min(tGround(Q.t0, R.v1), tGround(R.from, R.v1)) + 0.2;
  slab(l, [pt(R.from, R.v0, lo), pt(R.from, R.v1, lo), pt(Q.t0, R.v1, hi), pt(Q.t0, R.v0, hi)], deep, C.earth, C.earthSun);
  if (whole) {
    slab(l, [pt(R.from, R.v1, lo + 0.1), pt(R.from, R.v1 + R.edge, lo + 0.1), pt(Q.t0, R.v1 + R.edge, hi + 0.1), pt(Q.t0, R.v1, hi + 0.1)], deep + 0.1, C.woodShade, C.wood);
    return;
  }
  l.box({ x: -(R.v1 + 0.5), y: tGround(0.7, R.v1 + 0.5) - 0.04, z: 0.7, yaw: 0.35 }, [0.16, 0.14, 1.7], C.woodShade, C.wood);
}

/** La potence de la cloche : son poteau bas, son court bras de fer vers la voie, la chape vide au bout ; toujours là. */
function potence(l: FacetBuilder): void {
  const P = POTENCE;
  const y = quaiTop(P.t);
  l.box({ x: -P.v, y: y - 0.3, z: P.t }, [0.22, P.h + 0.3, 0.22], C.iron, C.ironTop);
  const end = { x: -(P.v + P.arm), y: y + P.h - 0.08, z: P.t };
  l.beam({ x: -P.v, y: y + P.h - 0.08, z: P.t }, end, 0.12, C.iron);
  chape(l, { x: end.x, y: end.y - 0.06 - CHAPE.h, z: end.z }, Math.PI / 2);
}

// ---------- La trémie ----------

/**
 * La trémie, dans son repère (posé au-dessus de la voie, au rail ; `x` le long de la voie vers le sud, `z` en travers vers
 * le flanc) : la caisse de planches, son dessus ouvert (l'ombre du minerai) ; l'entonnoir en pyramide renversée jusqu'à
 * sa bouche ; la goulotte au-dessus de la voie (debout) ; quatre pieds et leurs traverses. `ruin` : un pied cassé au
 * tiers, deux planches manquantes sur la face nord, sans goulotte (tombée sur le quai). Retouche 1 (directeur artistique,
 * point 1 : elle se lisait comme une table) : le dessus ouvert, quatre bords de planches minces, le dedans un cran plus
 * sombre (`hollow`, jamais noir) ; un rebord plus bas, pour que la pyramide renversée se lise depuis la porte ; deux
 * joints de planches sur chaque face de l'entonnoir.
 */
function hopper(l: FacetBuilder, ruin: boolean): void {
  const H = HOPPER;
  const ax = H.along / 2,
    az = H.across / 2,
    m = H.mouthHalf;
  const side = ruin ? C.woodShade : C.newShade;
  const face = ruin ? C.wood : C.newWood;
  // Le rebord : quatre planches minces sur chant, le dessus ouvert ; dans la ruine, la face nord a perdu deux planches.
  const rim = H.top - H.box,
    t = H.plank;
  for (const sz of [-1, 1]) l.box({ x: 0, y: H.box, z: sz * (az - t / 2) }, [H.along, rim, t], side, face);
  l.box({ x: ax - t / 2, y: H.box, z: 0 }, [t, rim, H.across - 2 * t], side, face);
  if (ruin)
    for (const sz of [-1, 1]) l.box({ x: -ax + t / 2, y: H.box, z: sz * (az * 0.62) }, [t, rim, az * 0.76 - t], side, face);
  else l.box({ x: -ax + t / 2, y: H.box, z: 0 }, [t, rim, H.across - 2 * t], side, face);
  // Le dedans, sous le rebord : l'ombre du minerai, un brun chaud, qu'on voit d'en haut par le dessus ouvert.
  l.plate({ x: 0, y: H.box + 0.04, z: 0, pitch: -Math.PI / 2 }, [[-ax + t, -az + t], [ax - t, -az + t], [ax - t, az - t], [-ax + t, az - t]], C.hollow);
  const corners = [
    [ax, az],
    [-ax, az],
    [-ax, -az],
    [ax, -az],
  ] as const;
  const mouth = corners.map(([x, z]) => [(x / ax) * m, (z / az) * m] as const);
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    const out: P3 = [(corners[k][0] + corners[n][0]) / 2, -0.6, (corners[k][1] + corners[n][1]) / 2];
    quadToward(l, [[corners[k][0], H.box, corners[k][1]], [corners[n][0], H.box, corners[n][1]], [mouth[n][0], H.mouth, mouth[n][1]], [mouth[k][0], H.mouth, mouth[k][1]]], out, k % 2 ? side : face);
    // Deux joints de planches sur la face, au tiers et aux deux tiers de l'entonnoir, à peine hors de la face.
    for (const f of [1 / 3, 2 / 3]) {
      const at = (c: readonly [number, number], q: readonly [number, number], g: number): P3 => {
        const x = c[0] + (q[0] - c[0]) * g,
          z = c[1] + (q[1] - c[1]) * g;
        return [x + Math.sign(out[0]) * 0.012, H.box + (H.mouth - H.box) * g, z + Math.sign(out[2]) * 0.012];
      };
      const g0 = f - 0.035,
        g1 = f + 0.035;
      quadToward(l, [at(corners[k], mouth[k], g0), at(corners[n], mouth[n], g0), at(corners[n], mouth[n], g1), at(corners[k], mouth[k], g1)], out, C.joint);
    }
  }
  if (!ruin) l.box({ x: 0, y: H.mouth - 0.6, z: 0 }, [0.9, 0.62, 0.9], side, C.hollow);
  // Les pieds : côté flanc sur le quai, côté replat sur le sol, enfoncés ; la traverse de chaque côté, le long de la voie.
  const westFoot = quaiTop(H.t) - HOPPER_RAIL - 0.3;
  const eastFoot = Math.min(tGround(H.t - H.legT, H.legV), tGround(H.t + H.legT, H.legV)) - HOPPER_RAIL + SINK;
  for (const sz of [1, -1]) {
    const foot = sz > 0 ? westFoot : eastFoot;
    for (const sx of [1, -1]) {
      const broken = ruin && sz < 0 && sx < 0;
      const from = broken ? foot + ((H.box - foot) * 2) / 3 : foot;
      l.box({ x: sx * H.legT, y: from, z: sz * H.legV }, [H.leg, H.box - from + 0.02, H.leg], side, face);
      if (broken) l.box({ x: sx * H.legT, y: foot, z: sz * H.legV }, [H.leg, (H.box - foot) / 3, H.leg], side, face);
    }
    const y = sz > 0 ? 2.5 : 1.2;
    if (!ruin || sz > 0) l.box({ x: 0, y, z: sz * H.legV }, [2 * H.legT, 0.22, 0.22], side, face);
  }
  // Les deux planches manquantes de la face nord : l'ombre du dedans, sous le trou du rebord.
  if (ruin) l.plate({ x: -ax - 0.01, y: H.box - 0.25, z: 0, yaw: -Math.PI / 2 }, [[-az * 0.24, 0], [az * 0.24, 0], [az * 0.24, 0.25 + rim], [-az * 0.24, 0.25 + rim]], C.hollow);
}

/** La trémie à sa place, debout, ou dans la ruine penchée vers le flanc. */
function hopperAt(l: FacetBuilder, ruin: boolean): void {
  drawPosed(l, { x: 0, y: HOPPER_RAIL, z: HOPPER.t, yaw: Math.PI / 2, pitch: ruin ? HOPPER.tilt : 0 }, (h) => hopper(h, ruin));
}

/** La goulotte tombée de travers sur le quai (la ruine). */
function fallenChute(l: FacetBuilder): void {
  const t = 5.9;
  l.box({ x: 2.0, y: quaiTop(t) - 0.02, z: t, yaw: 0.5, pitch: 0.08 }, [0.9, 0.55, 1.2], C.woodShade, C.hollow);
}

// ---------- Les galeries ----------

/** Le cap d'une galerie : sa bouche tournée vers la porte (vue de face à l'arrivée, jamais de profil). */
const galleryYaw = (g: Vec2): number => Math.atan2(DOOR_AT.x - g.x, DOOR_AT.z - g.z);

/**
 * L'encoche dans le flanc et l'ombre de la bouche (un brun chaud, jamais presque noir) : toujours là. Retouche 2
 * (directeur artistique, point A : en trois-quarts, la tête et les joues se lisaient comme des panneaux posés devant la
 * pente) : la seule face verticale est la tête, derrière le plan du cadre, autour de la bouche ; ses bords descendent en
 * biais jusqu'au sol du flanc de chaque côté, et tout le reste (le front au-dessus, les deux côtés) est un talus de terre
 * qui retombe vers l'arrière sur la pente, ses coins posés au sol : aucune tranche verticale, d'aucun côté.
 */
function galleryMouth(b: FacetBuilder, g: Vec2): void {
  const M = MOUTH;
  const y = localGround(g.x, g.z);
  const yaw = galleryYaw(g);
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
  /** Le sol du flanc dans le repère de la bouche, depuis le sol sous elle, un peu enfoncé. */
  const gl = (x: number, z: number): number => localGround(g.x + x * cy + z * sy, g.z - x * sy + z * cy) - y - M.sink;
  const half = M.w / 2 + 0.22 + M.head.side;
  const top = M.h + 0.26 + M.head.over;
  drawPosed(b, { x: g.x, y, z: g.z, yaw }, (l) => {
    // La tête : trois pans de terre autour de la bouche, du sol (enfoncés) au front.
    const foot = (x: number) => gl(x, 0) - 0.3;
    const pan = (x0: number, x1: number, y0: number, y1: number, y0b = y0) => l.quad([x0, y0, 0], [x1, y0b, 0], [x1, y1, 0], [x0, y1, 0], C.earthSun);
    pan(-half, -M.w / 2, foot(-half), top, foot(-M.w / 2));
    pan(M.w / 2, half, foot(M.w / 2), top, foot(half));
    pan(-M.w / 2, M.w / 2, M.h, top);
    const deep = Math.min(foot(-M.w / 2), foot(M.w / 2)) + 0.2;
    l.plate({ x: 0, y: 0, z: 0.01 }, [[-M.w / 2, deep], [M.w / 2, deep], [M.w / 2, M.h], [-M.w / 2, M.h]], C.hollow);
    // Le talus : le front qui retombe vers l'arrière, et de chaque côté le bord de la tête qui descend en biais jusqu'au
    // sol, puis le côté qui rejoint le coin arrière du front.
    const back: P3[] = [-1, 1].map((s) => [s * half, gl(s * half, -M.brow), -M.brow] as const);
    l.quad([-half, top, 0], [half, top, 0], back[1], back[0], C.earth);
    for (const s of [-1, 1] as const) {
      const spread = Math.min(M.spread.max, Math.max(M.spread.min, (top - gl(s * half, 0)) * M.spread.k));
      const out: P3 = [s * (half + spread), gl(s * (half + spread), 0), 0];
      const edge: P3 = [s * half, foot(s * half), 0];
      const crest: P3 = [s * half, top, 0];
      const rear = back[s === -1 ? 0 : 1];
      // Le bord de la tête, de face, puis le côté du talus, chacun tourné vers le dehors.
      if (s === 1) {
        l.triangle(edge, out, crest, C.earthSun);
        l.triangle(crest, out, rear, C.earth);
      } else {
        l.triangle(edge, crest, out, C.earthSun);
        l.triangle(crest, rear, out, C.earth);
      }
    }
  });
}

/** Le cadre de bois de la bouche : reboisé (deux montants, un chapeau), ou tombé en travers (la ruine). */
function galleryFrame(b: FacetBuilder, g: Vec2, whole: boolean): void {
  const M = MOUTH;
  drawPosed(b, { x: g.x, y: localGround(g.x, g.z), z: g.z, yaw: galleryYaw(g) }, (l) => {
    if (whole) {
      for (const s of [-1, 1]) l.box({ x: s * (M.w / 2 + 0.1), y: -0.3, z: 0.38 }, [0.24, M.h + 0.3, 0.24], C.newShade, C.newWood);
      l.box({ x: 0, y: M.h, z: 0.38 }, [M.w + 0.6, 0.26, 0.3], C.newShade, C.newWood);
      return;
    }
    l.beam({ x: -M.w / 2, y: 0.12, z: 0.45 }, { x: M.w / 2 - 0.1, y: M.h - 0.3, z: 0.4 }, 0.22, C.wood);
    l.box({ x: 0.3, y: -0.02, z: 1.0, yaw: 0.35 }, [M.w + 0.4, 0.24, 0.26], C.woodShade, C.wood);
  });
}

// ---------- La remise ----------

/**
 * Un pan de mur de la remise, dans le repère de la voie : le long de `t` (en `v`) ou en travers (en `t`, un pignon, un
 * cran plus clair que le long pan) ; ses assises (retouche 1, point 9).
 */
function remiseWall(l: FacetBuilder, alongT: boolean, at: number, from: number, to: number, h: number): void {
  const R = REMISE;
  const len = to - from,
    mid = (from + to) / 2;
  const y = REMISE_Y + SINK;
  if (alongT) {
    l.box({ x: -at, y, z: mid }, [R.wall, h - SINK, len], C.stoneShade, C.stone);
    courses(l, { x: -at, y: REMISE_Y, z: mid }, [R.wall, h, len], COURSE_HEIGHTS);
  } else {
    l.box({ x: -mid, y, z: at }, [len, h - SINK, R.wall], C.stone, C.stoneSun);
    courses(l, { x: -mid, y: REMISE_Y, z: at }, [len, h, R.wall], COURSE_HEIGHTS);
  }
}

/** La remise debout (le corps 3) : ses quatre murs jusqu'à l'avant-toit, sa grande porte ouverte contre la façade. */
function remiseStanding(l: FacetBuilder): void {
  const R = REMISE;
  const w = R.wall / 2;
  const [d0, d1] = R.door;
  remiseWall(l, true, R.v0 + w, R.t0, d0, R.h);
  remiseWall(l, true, R.v0 + w, d1, R.t1, R.h);
  l.box({ x: -(R.v0 + w), y: REMISE_Y + R.doorH, z: (d0 + d1) / 2 }, [R.wall, R.h - R.doorH, d1 - d0], C.stoneShade, C.stone);
  remiseWall(l, true, R.v1 - w, R.t0, R.t1, R.h);
  remiseWall(l, false, R.t0 + w, R.v0, R.v1, R.h);
  remiseWall(l, false, R.t1 - w, R.v0, R.v1, R.h);
  // L'ombre de la porte, un peu en retrait ; sa porte de bois neuf, ouverte à plat contre la façade, au sud.
  l.plate({ x: -(R.v0 - 0.01), y: REMISE_Y, z: (d0 + d1) / 2, yaw: Math.PI / 2 }, [[-(d1 - d0) / 2, 0], [(d1 - d0) / 2, 0], [(d1 - d0) / 2, R.doorH], [-(d1 - d0) / 2, R.doorH]], C.hollow);
  l.box({ x: -(R.v0 - 0.08), y: REMISE_Y - 0.02, z: d0 - (d1 - d0) / 2 - 0.05 }, [0.14, R.doorH - 0.05, d1 - d0 - 0.1], C.newShade, C.newWood);
}

/** Le toit de la remise (le haut) : ses deux pignons de pierre, ses deux pans de tôle de fer bruni, jamais orange. */
function remiseRoof(l: FacetBuilder): void {
  const R = REMISE;
  const vm = (R.v0 + R.v1) / 2,
    half = (R.v1 - R.v0) / 2;
  const y = REMISE_Y + R.h;
  for (const t of [R.t0, R.t1 - R.wall]) l.extrude({ x: -vm, y, z: t }, [[-half, 0], [half, 0], [0, R.ridge]], R.wall, C.stone, C.stoneSun);
  const o = 0.35;
  const ridge = y + R.ridge + 0.1;
  const e = y + 0.1 - (o * R.ridge) / half;
  slab(l, [pt(R.t0 - o, R.v0 - o, e), pt(R.t1 + o, R.v0 - o, e), pt(R.t1 + o, vm, ridge), pt(R.t0 - o, vm, ridge)], 0.1, C.sheet, C.sheetTop);
  slab(l, [pt(R.t0 - o, vm, ridge), pt(R.t1 + o, vm, ridge), pt(R.t1 + o, R.v1 + o, e), pt(R.t0 - o, R.v1 + o, e)], 0.1, C.sheet, C.sheetTop);
}

/** La remise en ruine : ses murs à mi-hauteur, cassés à des hauteurs inégales (1,3 à 2,1) ; sa charpente tombée dedans. */
function remiseRuin(l: FacetBuilder): void {
  const R = REMISE;
  const w = R.wall / 2;
  const [d0, d1] = R.door;
  remiseWall(l, true, R.v0 + w, R.t0, d0, 1.6);
  remiseWall(l, true, R.v0 + w, d1, R.t1, 2.1);
  remiseWall(l, true, R.v1 - w, R.t0, 8.0, 1.3);
  remiseWall(l, true, R.v1 - w, 8.0, R.t1, 1.9);
  remiseWall(l, false, R.t0 + w, R.v0, R.v1, 1.5);
  remiseWall(l, false, R.t1 - w, R.v0, R.v1, 2.0);
  const vm = (R.v0 + R.v1) / 2;
  l.beam({ x: -(R.v0 + 0.8), y: REMISE_Y + 0.1, z: 6.2 }, { x: -(R.v1 - 0.7), y: REMISE_Y + 1.25, z: 9.9 }, 0.24, C.woodShade);
  l.beam({ x: -vm, y: REMISE_Y + 0.12, z: 6.0 }, { x: -(vm + 0.9), y: REMISE_Y + 0.15, z: 10.2 }, 0.22, C.wood);
}

// ---------- La voie de garage, la benne ----------

/** La voie de garage : son ballast, ses traverses, ses deux rails, son heurtoir au bout nord ; toujours là. */
function siding(l: FacetBuilder): void {
  const S = SIDING;
  const len = S.t1 - S.t0,
    mid = (S.t0 + S.t1) / 2;
  l.box({ x: -S.v, y: SIDING_Y - 0.5, z: mid }, [1.9, 0.5, len], C.ballast);
  for (let k = 0; k < 4; k++) l.box({ x: -S.v, y: SIDING_Y - 0.02, z: S.t0 + (len * (k + 0.5)) / 4 }, [1.5, 0.1, 0.32], C.woodShade, C.wood);
  for (const s of [-1, 1]) l.box({ x: -(S.v + (s * TRACK.gauge) / 2), y: SIDING_Y + 0.06, z: mid }, [TRACK.rail, 0.12, len], C.rust, C.rustTop);
  l.box({ x: -S.v, y: SIDING_Y, z: S.t1 + 0.2 }, [1.2, 0.7, 0.6], C.woodShade, C.wood);
}

/** La benne, sans numéro ni marque : sa caisse ouverte (vide), son châssis, ses roues de chaque côté. */
function benne(l: FacetBuilder, rusty: boolean): void {
  const B = BENNE;
  const iron = rusty ? C.rust : C.iron,
    top = rusty ? C.rustTop : C.ironTop;
  l.box({ x: 0, y: 0, z: 0 }, [B.w - 0.3, 0.3, B.l - 0.2], C.iron, C.ironTop);
  l.box({ x: 0, y: 0.28, z: 0 }, [B.w, B.h, B.l], iron, C.hollow);
  const hex = Array.from({ length: 6 }, (_, k) => [0.24 * Math.cos((Math.PI * k) / 3), 0.24 * Math.sin((Math.PI * k) / 3)] as const);
  for (const s of [-1, 1]) for (const dz of [-0.55, 0.55]) l.plate({ x: s * ((B.w - 0.3) / 2 + 0.01), y: 0.06, z: dz, yaw: (s * Math.PI) / 2 }, hex, top);
}

/** La benne couchée sur le flanc, à côté de la voie de garage, côté remise (la ruine). */
function benneLying(l: FacetBuilder): void {
  const R = BENNE.ruin;
  const y = tGround(R.t, R.v);
  drawPosed(l, { x: -R.v, y: y + BENNE.l / 2 - 0.15, z: R.t, yaw: 0.25, pitch: Math.PI / 2 }, (k) => benne(k, true));
}

/** La benne relevée, vide, sur la voie de garage (les abords). */
function benneStanding(l: FacetBuilder): void {
  drawPosed(l, { x: -SIDING.v, y: SIDING_Y + 0.18, z: BENNE.t, yaw: 0 }, (k) => benne(k, false));
}

// ---------- Les lanternes, le banc, la passerelle ----------

/** La lanterne du cheminot, sur son poteau contre le pignon sud de la remise, et son banc dessous : toujours là. */
function keeperCorner(l: FacetBuilder): void {
  const L = KEEPER_LANTERN;
  l.box({ x: -L.v, y: REMISE_Y + SINK, z: L.t }, [0.2, L.h - SINK, 0.2], C.woodShade, C.wood);
  l.beam({ x: -L.v, y: REMISE_Y + L.h - 0.1, z: L.t }, { x: -L.v, y: REMISE_Y + L.h - 0.1, z: L.t - 0.5 }, 0.08, C.woodShade);
  lantern(l, { x: -L.v, y: REMISE_Y + L.h - 0.14, z: L.t - 0.5 }, true);
  const B = BENCH;
  const y = tGround(B.t, B.v);
  l.box({ x: -B.v, y: y + 0.4, z: B.t }, [B.len, 0.08, 0.38], C.woodShade, C.wood);
  for (const s of [-1, 1]) l.box({ x: -(B.v + s * (B.len / 2 - 0.15)), y: y - 0.3, z: B.t }, [0.1, 0.7, 0.32], C.woodShade);
}

/** La lanterne du quai (le haut) : sur un poteau au bout sud du quai, son bras vers la voie ; allumée dès qu'elle est posée. */
function quaiLantern(l: FacetBuilder): void {
  const L = QUAI_LANTERN;
  const y = quaiTop(L.t);
  l.box({ x: -L.v, y: y - 0.3, z: L.t }, [0.16, L.h + 0.3, 0.16], C.iron, C.ironTop);
  l.beam({ x: -L.v, y: y + L.h - 0.08, z: L.t }, { x: -(L.v + 0.5), y: y + L.h - 0.08, z: L.t }, 0.07, C.iron);
  lantern(l, { x: -(L.v + 0.5), y: y + L.h - 0.12, z: L.t }, true);
}

/**
 * La passerelle de chargement (le haut) : de la bouche de la galerie haute au bord ouest du haut de la trémie, un tablier
 * de planches neuves sur deux poteaux, un garde-corps d'un seul côté (rien en croix).
 */
function passerelle(b: FacetBuilder): void {
  const g = GALLERIES[0];
  const yaw = galleryYaw(g);
  const from = { x: g.x + Math.sin(yaw) * 0.6, z: g.z + Math.cos(yaw) * 0.6 };
  const to = tv(HOPPER.t, -HOPPER.across / 2);
  const y0 = localGround(from.x, from.z) + 0.06,
    y1 = HOPPER_RAIL + HOPPER.top;
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  const ux = (to.x - from.x) / len,
    uz = (to.z - from.z) / len;
  const w = 0.45;
  const p = (s: number, side: number, y: number): P3 => [from.x + ux * s - uz * side * w, y, from.z + uz * s + ux * side * w];
  slab(b, [p(0, 1, y0), p(0, -1, y0), p(len, -1, y1), p(len, 1, y1)], 0.12, C.newShade, C.newWood);
  for (const f of [0.38, 0.72]) {
    const s = len * f;
    const at = { x: from.x + ux * s, z: from.z + uz * s };
    const y = y0 + (y1 - y0) * f;
    b.box({ x: at.x, y: localGround(at.x, at.z) - 0.4, z: at.z, yaw: Math.atan2(ux, uz) }, [0.24, y - localGround(at.x, at.z) + 0.3, 0.24], C.newShade, C.newWood);
  }
  const r0 = p(0.2, 1, y0 + 0.9),
    r1 = p(len - 0.2, 1, y1 + 0.9);
  b.beam({ x: r0[0], y: r0[1], z: r0[2] }, { x: r1[0], y: r1[1], z: r1[2] }, 0.09, C.newShade);
  for (const s of [0.2, len - 0.2]) {
    const q = p(s, 1, 0);
    const y = y0 + ((y1 - y0) * s) / len;
    b.box({ x: q[0], y: y - 0.05, z: q[2] }, [0.1, 0.95, 0.1], C.newShade);
  }
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const corps1 = { stage: 0 as const, row: 0 };
  const corps2 = { stage: 0 as const, row: 1 / 3 };
  const corps3 = { stage: 0 as const, row: 2 / 3 };
  const abords = { stage: 2 as const, row: 0 };

  // Toujours là : la voie, le corps du quai et son mur, la potence et sa chape vide, la voie de garage, les blocs des
  // galeries et l'ombre de leurs bouches, la lanterne du cheminot et son banc.
  add('ruine', 0, (b) => {
    inTrack(b, (l) => {
      track(l);
      quai(l);
      potence(l);
      siding(l);
      keeperCorner(l);
    });
    for (const g of GALLERIES) galleryMouth(b, g);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : la bordure déchaussée, la rampe effondrée.
  add(
    'ruine',
    0,
    (b) =>
      inTrack(b, (l) => {
        kerb(l, false);
        ramp(l, false);
      }),
    corps1,
  );
  // Le corps 2 la relève : la trémie penchée, sa goulotte tombée sur le quai.
  add(
    'ruine',
    0,
    (b) =>
      inTrack(b, (l) => {
        hopperAt(l, true);
        fallenChute(l);
      }),
    corps2,
  );
  // Le corps 3 la relève : la remise à mi-hauteur, sa charpente tombée.
  add('ruine', 0, (b) => inTrack(b, remiseRuin), corps3);
  // Les abords la relèvent : les cadres tombés des galeries, le butoir cassé, la benne couchée.
  add(
    'ruine',
    0,
    (b) => {
      for (const g of GALLERIES) galleryFrame(b, g, false);
      inTrack(b, (l) => {
        buffer(l, false);
        benneLying(l);
      });
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le quai refait, sa bordure remise, sa rampe relevée.
  add(0, 0, (b) =>
    inTrack(b, (l) => {
      kerb(l, true);
      ramp(l, true);
    }),
  );
  // ---- Le corps 2 sur 3 : la trémie redressée sur ses quatre pieds, sa goulotte au-dessus de la voie.
  add(0, 1 / 3, (b) => inTrack(b, (l) => hopperAt(l, false)));
  // ---- Le corps 3 sur 3 : les murs de la remise jusqu'à l'avant-toit, sa grande porte.
  add(0, 2 / 3, (b) => inTrack(b, remiseStanding));
  // ---- Le haut : le toit de la remise ; la passerelle ; la lanterne du quai, allumée dès qu'elle est posée.
  add(1, 0, (b) => {
    inTrack(b, (l) => {
      remiseRoof(l);
      quaiLantern(l);
    });
    passerelle(b);
  });
  // ---- Les abords : les cadres des galeries reboisés ; le butoir refait ; la benne relevée, vide, sur la voie de
  // garage ; la lanterne du chemin, près de la porte, hors du chemin.
  add(2, 0, (b) => {
    for (const g of GALLERIES) galleryFrame(b, g, true);
    inTrack(b, (l) => {
      buffer(l, true);
      benneStanding(l);
    });
    const P = PATH_LANTERN;
    const y = localGround(P.x, P.z);
    b.box({ x: P.x, y: y - 0.3, z: P.z }, [0.12, P.h + 0.3, 0.12], C.iron);
    lantern(b, { x: P.x, y: y + P.h + 0.02, z: P.z }, true, 0.85);
  });
}

// ---------- Les traces ----------

/** Dessine dans le repère de la voie, posé au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw: 0 }, (w) => inTrack(w, draw));
}

/** Où se pose chaque trace, dans le repère de la voie ; aucune sur un chemin, aucune au sud-est de la porte. */
const TRACE_SPOTS = {
  future: { t: 9.0, v: -1.75 },
  modals: { t: 4.7, v: -2.15 },
  'present-perfect': { t: 6.3, v: 4.3 },
  traditions: { t: 3.4, v: 7.6 },
  forms: { t: LENGTH - 0.3, v: 2.1 },
} as const;

/** Une malle cerclée de fer au bout nord du quai, prête à partir (Le futur). */
function trunk(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { t, v } = TRACE_SPOTS.future;
    const y = quaiTop(t);
    l.box({ x: -v, y, z: t, yaw: 0.1 }, [0.62, 0.45, 0.95], C.leather, C.leather);
    l.gableRoof({ x: -v, y: y + 0.45, z: t, yaw: Math.PI / 2 + 0.1 }, 0.95, 0.62, 0.16, C.leather, C.leather);
    for (const d of [-0.3, 0.3]) l.box({ x: -v + 0.03 * d, y: y - 0.01, z: t + d, yaw: 0.1 }, [0.66, 0.47, 0.06], C.iron);
  });
}

/** Deux pics de mineur debout côte à côte dans un petit râtelier, contre un pied de la trémie (Les modaux). */
function picks(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { t, v } = TRACE_SPOTS.modals;
    const y = quaiTop(t);
    l.box({ x: -v, y: y + 0.55, z: t }, [0.14, 0.1, 0.9], C.newShade, C.newWood);
    for (const d of [-0.4, 0.4]) l.box({ x: -v, y, z: t + d }, [0.12, 0.6, 0.1], C.newShade);
    for (const d of [-0.18, 0.18]) {
      l.box({ x: -v + 0.08, y: y + 0.02, z: t + d }, [0.07, 1.05, 0.07], C.newWood);
      l.box({ x: -v + 0.08, y: y + 1.05, z: t + d }, [0.5, 0.09, 0.09], C.iron);
    }
  });
}

/** Un chariot à bras appuyé contre la remise, une caisse fermée dessus (Le present perfect). */
function handCart(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { t, v } = TRACE_SPOTS['present-perfect'];
    const y = tGround(t, v);
    l.box({ x: -v, y: y + 0.38, z: t }, [0.7, 0.08, 1.0], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.beam({ x: -v + s * 0.3, y: y + 0.42, z: t - 0.5 }, { x: -v + s * 0.3, y: y + 0.7, z: t - 1.15 }, 0.06, C.newShade);
    for (const s of [-1, 1]) l.drum({ x: -v + s * 0.42, y: y + 0.28, z: t + 0.2, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.28, 0.06, 6, C.iron, C.newWood);
    l.box({ x: -v, y: y + 0.46, z: t + 0.05 }, [0.5, 0.42, 0.55], C.newShade, C.newWood);
  });
}

/** Une petite table de bois et deux tabourets devant la remise, un panier d'osier fermé sur la table (Les traditions). */
function table(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { t, v } = TRACE_SPOTS.traditions;
    const y = tGround(t, v);
    l.box({ x: -v, y: y + 0.72, z: t }, [1.0, 0.07, 0.7], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.box({ x: -v + s * 0.38, y: y - 0.2, z: t }, [0.1, 0.92, 0.5], C.newShade);
    for (const s of [-1, 1]) l.prism({ x: -v + s * 0.85, y: y - 0.1, z: t + 0.1 }, 0.18, 0.18, 0.55, 6, C.newShade, C.newWood);
    l.prism({ x: -v, y: y + 0.79, z: t }, 0.2, 0.17, 0.24, 6, C.rope, C.canvas);
  });
}

/** Une pile de traverses de bois neuves, rangée près du butoir (Les formes). */
function sleepers(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { t, v } = TRACE_SPOTS.forms;
    const y = tGround(t, v);
    const rows = [
      [-0.36, 0],
      [0, 0],
      [0.36, 0],
      [-0.18, 1],
      [0.18, 1],
    ] as const;
    for (const [dt, k] of rows) l.box({ x: -v, y: y - 0.05 + k * 0.17, z: t + dt }, [1.5, 0.17, 0.3], C.newShade, C.newWood);
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : des objets de la gare, jamais la notion, rien à lire. */
const TRACES = {
  future: { at: tv(TRACE_SPOTS.future.t, TRACE_SPOTS.future.v), lift: 1, stage: 0, row: 0, draw: trunk },
  modals: { at: tv(TRACE_SPOTS.modals.t, TRACE_SPOTS.modals.v), lift: 1, stage: 0, row: 1 / 3, draw: picks },
  'present-perfect': { at: tv(TRACE_SPOTS['present-perfect'].t, TRACE_SPOTS['present-perfect'].v), lift: 1, stage: 0, row: 2 / 3, draw: handCart },
  traditions: { at: tv(TRACE_SPOTS.traditions.t, TRACE_SPOTS.traditions.v), lift: 1, stage: 1, row: 0, draw: table },
  forms: { at: tv(TRACE_SPOTS.forms.t, TRACE_SPOTS.forms.v), lift: 1, stage: 2, row: 0, draw: sleepers },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 8) : à l'est-nord-est, à 75° ; la voie de garage et sa
 * benne au premier plan à gauche, le replat, les Orgues au bord droit, la mer du nord à gauche ; le flanc et la trémie
 * derrière la caméra, ni cratère ni fente dans le cadre. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_COMPASS = (72 * Math.PI) / 180;
const SCENE_START = Math.atan2(-Math.sin(SCENE_COMPASS), Math.cos(SCENE_COMPASS));

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le cheminot). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/**
 * Le milieu de la scène, depuis le centre du lieu : sur le replat, à l'est de la remise, à dix unités au nord du chemin.
 * Retouche 1 (directeur artistique, point 5) : plus près, la caméra de la scénette tombait sur le flanc, au-dessus du quai,
 * qui couvrait le bas du cadre et les sacs ; d'ici, elle se tient au bout de la voie de garage, sur le replat.
 */
const SCENE_SPOT = { dx: 19.0, dz: -3.5, half: [2.3, 1.0] as [number, number] } as const;

/** L'écart de Kéo et du cheminot au milieu de la scène. */
const SCENE_HALF = 1.9;

/** Le sol de la scène, un cran au-dessus du replat (questionScene.ts, `sceneSpot`). */
const SCENE_RISE = 0.1;

/** Le cheminot en pion (son modèle 3D prend sa place) : bottes, pantalon gris, veste de toile bleue. */
function cheminot(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.28, 0.24, 0.42, 8, C.jacket);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.jacket);
}

/** La planche basse des sacs sur ses deux cales : sa hauteur, le cran d'un sac choisi, la taille d'un sac. */
const BOARD = { height: 0.32, lift: 0.3, sack: 0.46 } as const;

/**
 * Un sac de toile plein de minerai, rond et mou, sans lettre (retouche 1, directeur artistique, point 5 : ils se lisaient
 * comme des cailloux) : un ventre renflé à six pans, plus large au milieu qu'au pied, qui se resserre vers le col ; le col
 * noué d'une corde, et la toile qui rebique au-dessus du nœud.
 */
function sack(b: FacetBuilder, at: Vec3, s: number): void {
  const r = (BOARD.sack / 2) * s,
    h = BOARD.sack * s;
  b.prism({ x: at.x, y: at.y, z: at.z }, r * 0.82, r, h * 0.32, 6, C.sack, C.sack);
  b.prism({ x: at.x, y: at.y + h * 0.32, z: at.z }, r, r * 0.42, h * 0.5, 6, C.sack, C.sackTop);
  b.prism({ x: at.x, y: at.y + h * 0.82, z: at.z }, r * 0.24, r * 0.24, h * 0.1, 5, C.rope, C.rope);
  b.prism({ x: at.x, y: at.y + h * 0.92, z: at.z }, r * 0.2, r * 0.42, h * 0.16, 5, C.sack, C.sackTop);
}

export const TERMINUS: PlaceArt = {
  role: 'Le cheminot',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse, le regard presque à l'horizontale (retouche 1, point 5) : le replat, la mer à gauche et l'horizon dans le cadre.
    pitch: (8 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la voie de garage, la benne et le banc sont au lieu ; les abords (./terminusSurroundings.ts)
  // ajoutent deux pierres basses et une glène de câble. Il reste le cheminot en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) cheminot(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.sack, half: BOARD.sack / 2 + 0.04 },
    // La caméra de la scénette regarde en biais (`site.start`) : la planche se tourne avec elle, sous la rangée.
    facing: true,
    // Une planche basse sur deux cales de bois, sous la rangée des sacs.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.55 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.3, top - 0.08 * s - foot, 0.5 * s], C.wedge);
      }
    },
    // Un sac posé sur la planche ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      sack(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : le sol seul, rien de l'item ; les sacs portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la trémie, hors de la voie.
  exit: { x: DOOR_AT.x + 0.9, z: DOOR_AT.z - 0.3 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Terminus, pour les tests et ses abords : le repère de la voie, le quai, la trémie, la remise, la caméra. */
export const TERMINUS_LAYOUT = {
  track: TRACK,
  length: LENGTH,
  tv,
  toTrack,
  bed,
  railTop,
  quai: QUAI,
  quaiTop,
  hopper: HOPPER,
  hopperRail: HOPPER_RAIL,
  galleries: GALLERIES,
  remise: REMISE,
  remiseY: REMISE_Y,
  siding: SIDING,
  sidingY: SIDING_Y,
  benne: BENNE,
  potence: POTENCE,
  keeperLantern: KEEPER_LANTERN,
  quaiLantern: QUAI_LANTERN,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorLook: DOOR_LOOK,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  heightAtCenter: H0,
  /** Le bois neuf et le fer bruni (ses abords en posent) ; le ballast et les rails de la voie (les tests). */
  colors: { wood: C.newWood, woodShade: C.newShade, iron: C.iron, ironTop: C.ironTop, rope: C.rope, ballast: C.ballast, rail: C.rust, railTop: C.rustTop },
} as const;
