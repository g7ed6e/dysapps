// Les Radeaux (GD-22, lot 6 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée par
// le mainteneur, `selection-radeaux-v3`) : « un marché de radeaux amarrés sur le grand chenal, où l'on pèse, compte et
// compare ». Le cœur, sans figure, est la grappe de balances : trois radeaux carrés de rondins, en échelon devant le quai,
// chacun son comptoir et sa balance, autour du portique vide du grand fléau (deux poteaux plantés dans le chenal, chacun
// sa fourche en V à deux bras et sa broche de fer nue, sans traverse, le même avant comme après : jamais une étape).
// Autour : le quai de planches le long de la rive nord, la cabane du marchand sur le quai, adossée à la rive, sa façade
// tournée vers l'est-sud-est (vue de la porte comme de la scénette), son comptoir de façade ; la rampe d'accès, les
// barques d'étal. Une seule rive bâtie : en face, la forêt des Roselières.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Le radeau du quai à plat, ses amarres rompues ; le deuxième
// penché de 20°, un bord sous l'eau, sa balance glissée contre le bord bas ; du troisième, un coin de rondins hors de
// l'eau. La cabane fendue, son toit de planches à demi effondré, un pan d'enduit tombé qui montre les lattes, son auvent
// de toile délavée tendu de travers sur une perche qui penche, et sa lanterne allumée sur une perche courte : la seule
// lumière (le marchand vit là). Deux toiles couchées à plat, leurs perches cassées couchées parallèles ; deux plateaux sur
// la vase ; deux lanternes éteintes (l'une penchée sur le radeau qui penche, l'autre à plat sur le quai) ; peu de débris.
// Rien de croisé, rien sur le chemin.
//
// Cinq parties (3+1+1) : le corps en trois (le quai et la cabane ; les trois radeaux et leurs amarres ; les comptoirs et
// les balances), le haut (les auvents, la grande perche du marchand et sa lanterne, celle du radeau du fond), les abords
// (la rampe et sa barrière, deux barques d'étal, des sacs et des paniers, la lanterne de la rampe). Une trace par mission,
// posée avec SA partie (`TraceArt.row`, choix « Par partie » du mainteneur). Rien ne bouge : ni radeau ni toile ni eau.
// Rien à lire dans la 3D. Code pur (placeArt.ts).
import { type Stage } from './construction';
import { FacetBuilder, type Placement } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { rootArch } from './monteeSurroundings';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/**
 * Les couleurs des Radeaux : les matières des Passeurs (le bois brun désaturé neuf et usé, les rondins et leurs bouts,
 * l'enduit passé, la corde, le fer, le bronze en ferrures, le vert-de-gris du motif), la toile propre au lieu (un
 * bleu-gris mat de la famille de l'ardoise #5B7C99, plus pâle ; délavée dans la ruine, #6F8089), les jetons du bois pâle
 * des pelles du Hameau, des fruits sourds (brique, olive : jamais l'ocre, qui se lirait comme une lanterne). La seule
 * lumière : l'ocre des lanternes ; éteintes, leur vitre #BFC4B8.
 */
const C = {
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  log: 0x8a6a4e,
  logTop: 0x977657,
  logEnd: 0xb59a74,
  wornLog: 0x8f8170,
  wornLogTop: 0x9a8c78,
  wall: 0xb9ae98,
  wallTop: 0xc6bca6,
  wornWall: 0xaea38d,
  laths: 0x8c766a,
  crack: 0x6e6152,
  door: 0x7d6650,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  rope: 0xd8c49a,
  iron: 0x6f6a60,
  pan: 0x8f8a7e,
  bronze: 0xb8954f,
  verdigris: 0x6f9a8a,
  cloth: 0x7d97ad,
  clothUnder: 0x6c8599,
  wornCloth: 0x6f8089,
  lantern: COLORS_5E.lantern,
  unlit: 0xbfc4b8,
  basket: 0xae8c60,
  basketShade: 0x957650,
  brick: 0x9a5a43,
  olive: 0x7d7f4a,
  sack: 0xbfa27a,
  sackShade: 0xa88d68,
  token: 0xd6bf94,
  niche: 0x5e5048,
  boatInside: 0x6e5a4a,
  // Le marchand, en pion (son modèle 3D prend sa place, ./habitants.ts) : gilet brun, chemise claire, pantalon gris-brun.
  shirt: 0xd8c7a4,
  vest: 0x7a5c44,
  trousers: 0x6b5a4a,
  boots: 0x55595a,
  head: 0xe3b48a,
  cap: 0x5f6f7a,
} as const;

/**
 * La rive nord, droite à l'échelle du lieu : le bord de l'eau passe 4 unités au sud du centre et file vers l'est-sud-est
 * (relevé sur `heightAt5e`). Le repère de la rive : `u` le long d'elle, vers l'est ; `v` vers l'eau (0 au bord, négatif
 * sur la terre). `SHORE.yaw` : le cap d'un pavé dont le grand côté suit la rive.
 */
const SHORE = { z: 4, angle: 0.28 } as const;
const SHORE_COS = Math.cos(SHORE.angle);
const SHORE_SIN = Math.sin(SHORE.angle);
const SHORE_YAW = -SHORE.angle;

/** Un point du repère de la rive dans le repère du lieu. */
function shore(u: number, v: number): Vec2 {
  return { x: u * SHORE_COS - v * SHORE_SIN, z: SHORE.z + u * SHORE_SIN + v * SHORE_COS };
}

/** La hauteur du dessus des planches du quai, au-dessus de l'eau (0). */
const DECK = 0.72;

/** Le quai : de `u0` à `u1` le long de la rive, de `v0` (sur la vase) à `v1` (au-dessus de l'eau), en trois longues planches. */
const QUAY = { u0: -10.5, u1: 8, v0: -2.4, v1: 1.2, strips: 3, thick: 0.16 } as const;

/**
 * La cabane du marchand, sur le quai, adossée à la rive : sa place (repère de la rive), sa largeur le long de sa façade,
 * sa profondeur, son mur ; sa façade regarde l'est-sud-est (`face`, depuis le sud vers l'est) : vue de la porte, au
 * nord-est, comme de la scénette, qui la regarde de face.
 */
const CABIN = { u: -7.6, v: -0.9, w: 3.2, d: 2.4, wall: 2, face: (65 * Math.PI) / 180 } as const;

/** Le centre de la cabane dans le repère du lieu. */
const CABIN_AT = shore(CABIN.u, CABIN.v);

/** La normale de la façade (vers l'est-sud-est) et l'axe de la façade (de gauche à droite, vu de face). */
const FACE_N = { x: Math.sin(CABIN.face), z: Math.cos(CABIN.face) } as const;
const FACE_T = { x: Math.cos(CABIN.face), z: -Math.sin(CABIN.face) } as const;

/** Un point de la façade : `t` le long d'elle (de gauche à droite, vu de face), `n` devant elle (0 sur le mur). */
function onFacade(t: number, n: number): Vec2 {
  const fx = CABIN_AT.x + FACE_N.x * (CABIN.d / 2),
    fz = CABIN_AT.z + FACE_N.z * (CABIN.d / 2);
  return { x: fx + FACE_T.x * t + FACE_N.x * n, z: fz + FACE_T.z * t + FACE_N.z * n };
}

/**
 * Les trois radeaux, carrés (5 sur 5), en échelon devant le quai : leur centre dans le repère de la rive. Le premier, au
 * quai ; le deuxième, du milieu, derrière le portique ; le troisième, au fond, vers l'est.
 */
const RAFTS = [
  { u: -3.6, v: 4.0 },
  { u: 2.0, v: 5.6 },
  { u: 7.6, v: 7.2 },
] as const;
const RAFT = { size: 5, thick: 0.42, float: 0.12 } as const;

/** Le portique du grand fléau : ses deux poteaux (repère de la rive), la hauteur de leur fourche au-dessus du sol du lieu. */
const PORTICO = { posts: [{ u: 0.7, v: 2.2 }, { u: 3.3, v: 2.2 }], top: 5, arm: 0.8, spread: 0.45 } as const;

/** La rampe d'accès, de la rive au quai : son haut, son bas (repère de la rive), sa largeur. */
const RAMP = { u: 5, top: -5.6, bottom: QUAY.v0 + 0.2, half: 0.9 } as const;

/** La grande perche du marchand (le haut), à l'écart du portique, plus basse que ses fourches ; sa perche courte (la ruine). */
const PERCH = { tall: { t: 1.95, n: 0.25, h: 3.6 }, short: { t: 1.9, n: 0.55, h: 1.5 } } as const;

/** Le transfert d'un placement (bascule autour de x, quart de tour, déplacement), comme ./facets.ts. */
function placer({ x, y, z, yaw = 0, pitch = 0 }: Placement, roll = 0): (px: number, py: number, pz: number) => [number, number, number] {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch),
    cr = Math.cos(roll),
    sr = Math.sin(roll);
  return (px0, py0, pz) => {
    // La bascule autour de z d'abord (un radeau qui penche sur un bord), puis autour de x, puis le cap.
    const px = px0 * cr - py0 * sr;
    const py = px0 * sr + py0 * cr;
    const y1 = py * cp - pz * sp;
    const z1 = py * sp + pz * cp;
    return [x + px * cy + z1 * sy, y + y1, z - px * sy + z1 * cy];
  };
}

/**
 * Une perche : trois pans debout, sans dessus (on ne la voit jamais d'en haut d'assez près), de `y0` à `y1`. Six
 * triangles.
 */
function pole(b: FacetBuilder, x: number, z: number, y0: number, y1: number, w: number, color: number): void {
  const p = Array.from({ length: 3 }, (_, k) => [x + w * Math.cos((2 * Math.PI * k) / 3 + 0.5), z + w * Math.sin((2 * Math.PI * k) / 3 + 0.5)] as const);
  for (let k = 0; k < 3; k++) {
    const [ax, az] = p[k];
    const [cx, cz] = p[(k + 1) % 3];
    b.quad([cx, y0, cz], [ax, y0, az], [ax, y1, az], [cx, y1, cz], color);
  }
}

/** Une lanterne posée au sommet d'une perche (`top`) : sa vitre à six pans (allumée d'ocre, sans ombre, ou éteinte) et son chapeau de bronze. */
function lanternOn(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.prism({ x: top.x, y: top.y, z: top.z }, 0.17 * s, 0.17 * s, 0.36 * s, 6, lit ? C.lantern : C.unlit);
  b.prism({ x: top.x, y: top.y + 0.36 * s, z: top.z, yaw: Math.PI / 4 }, 0.24 * s, 0, 0.18 * s, 4, C.bronze);
}

/** Une lanterne sur perche, debout : la perche, puis la lanterne. Vingt-huit triangles. */
function perchLantern(b: FacetBuilder, x: number, z: number, foot: number, h: number, lit: boolean): void {
  pole(b, x, z, foot - 0.2, foot + h, 0.07, C.newShade);
  lanternOn(b, { x, y: foot + h, z }, lit);
}

/** Une corde tendue (une amarre) : un ruban, son dessus et un flanc. Quatre triangles. */
function rope(b: FacetBuilder, a: Vec3, c: Vec3, w = 0.07): void {
  const dx = c.x - a.x,
    dz = c.z - a.z;
  const l = Math.hypot(dx, dz) || 1;
  const nx = (-dz / l) * w,
    nz = (dx / l) * w;
  b.quad([a.x - nx, a.y, a.z - nz], [a.x + nx, a.y, a.z + nz], [c.x + nx, c.y, c.z + nz], [c.x - nx, c.y, c.z - nz], C.rope);
  b.quad([a.x + nx, a.y - w, a.z + nz], [c.x + nx, c.y - w, c.z + nz], [c.x + nx, c.y, c.z + nz], [a.x + nx, a.y, a.z + nz], C.rope);
}

/**
 * Un radeau carré de rondins liés côte à côte (`at` : son centre au ras de l'eau, son cap ; `roll` : penché sur un
 * bord) : ses flancs (les bouts des rondins sur deux côtés, d'un ton plus clair), son dessus en quatre longues facettes
 * de deux tons (jamais les rondins un à un), deux liens de corde en travers. Vingt-huit triangles.
 */
function raft(b: FacetBuilder, at: Placement, roll = 0, worn = false): void {
  const t = placer(at, roll);
  const h = RAFT.size / 2,
    T = RAFT.thick;
  const log = worn ? C.wornLog : C.log;
  const top = worn ? C.wornLogTop : C.logTop;
  const v = (x: number, y: number, z: number) => t(x, y, z);
  // Les flancs : les rondins le long de x ; leurs bouts sur les faces ±x.
  b.quad(v(-h, 0, h), v(h, 0, h), v(h, T, h), v(-h, T, h), log);
  b.quad(v(h, 0, -h), v(-h, 0, -h), v(-h, T, -h), v(h, T, -h), log);
  b.quad(v(h, 0, h), v(h, 0, -h), v(h, T, -h), v(h, T, h), C.logEnd);
  b.quad(v(-h, 0, -h), v(-h, 0, h), v(-h, T, h), v(-h, T, -h), C.logEnd);
  // Le dessus : quatre longues facettes.
  for (let k = 0; k < 4; k++) {
    const z0 = -h + (k * RAFT.size) / 4,
      z1 = z0 + RAFT.size / 4;
    b.quad(v(-h, T, z0), v(-h, T, z1), v(h, T, z1), v(h, T, z0), k % 2 ? top : log);
  }
  // Deux liens de corde en travers des rondins : leur dessus et les deux flancs.
  for (const x of [-1.4, 1.4]) {
    const w = 0.09,
      e = 0.015;
    b.quad(v(x - w, T + e, -h - e), v(x - w, T + e, h + e), v(x + w, T + e, h + e), v(x + w, T + e, -h - e), C.rope);
    b.quad(v(x - w, 0.08, h + e), v(x + w, 0.08, h + e), v(x + w, T + e, h + e), v(x - w, T + e, h + e), C.rope);
    b.quad(v(x + w, 0.08, -h - e), v(x - w, 0.08, -h - e), v(x - w, T + e, -h - e), v(x + w, T + e, -h - e), C.rope);
  }
}

/** Le centre d'un radeau dans le repère du lieu. */
const raftAt = (k: number): Vec2 => shore(RAFTS[k].u, RAFTS[k].v);

/** Le comptoir d'un radeau : un plateau de bois sur un pied plein, posé près du bord du quai. */
const COUNTER = { du: -0.6, dv: -1.1, len: 2.2, depth: 0.7, h: 0.85 } as const;

/** Le milieu du comptoir du radeau `k`, dans le repère du lieu. */
const counterAt = (k: number): Vec2 => shore(RAFTS[k].u + COUNTER.du, RAFTS[k].v + COUNTER.dv);

/** Une balance : un pied droit (son chapeau de bronze), un fléau de bois horizontal, deux plateaux ronds égaux, de niveau, posés sur ses bouts. */
const SCALE = { foot: 0.55, beam: 1.5, pan: 0.3 } as const;

function scale(b: FacetBuilder, at: Vec3, yaw: number): void {
  b.box({ x: at.x, y: at.y, z: at.z, yaw }, [0.14, SCALE.foot, 0.14], C.newShade, C.bronze);
  b.box({ x: at.x, y: at.y + SCALE.foot, z: at.z, yaw }, [SCALE.beam, 0.09, 0.1], C.newWood);
  for (const s of [-1, 1]) {
    const x = at.x + Math.cos(yaw) * s * (SCALE.beam / 2 - 0.12),
      z = at.z - Math.sin(yaw) * s * (SCALE.beam / 2 - 0.12);
    b.prism({ x, y: at.y + SCALE.foot + 0.09, z }, SCALE.pan * 0.82, SCALE.pan, 0.06, 5, C.pan);
  }
}

/** Le comptoir et la balance du radeau `k`, posés (le corps, troisième partie). */
function counterAndScale(b: FacetBuilder, k: number, deck: number): void {
  const c = counterAt(k);
  b.box({ x: c.x, y: deck, z: c.z, yaw: SHORE_YAW }, [COUNTER.len * 0.7, COUNTER.h - 0.08, COUNTER.depth * 0.6], C.newShade);
  b.box({ x: c.x, y: deck + COUNTER.h - 0.08, z: c.z, yaw: SHORE_YAW }, [COUNTER.len, 0.08, COUNTER.depth], C.newShade, C.newWood);
  scale(b, { x: c.x, y: deck + COUNTER.h, z: c.z }, SHORE_YAW);
}

/** Un poids : un cône tronqué uni de fer gris, un anneau en haut (un disque debout) ; jamais de chiffre ni de marque. */
function weight(b: FacetBuilder, at: Vec3, s: number, yaw = 0): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw }, 0.2 * s, 0.12 * s, 0.26 * s, 6, C.iron);
  b.prism({ x: at.x, y: at.y + 0.26 * s + 0.07 * s, z: at.z - 0.025 * s, yaw, pitch: Math.PI / 2 }, 0.07 * s, 0.07 * s, 0.05 * s, 6, C.iron);
}

/** Le sol d'un point du lieu, et le pied d'un pieu (sous l'eau s'il y en a). */
const pileFoot = (ground: SiteGround, p: Vec2): number => Math.min(ground.at(p.x, p.z), ground.water) - 0.4;

/** Les trois longues planches du quai, de `u0` à `u1`, et ses pieux au bord de l'eau ; `y` : le dessus des planches. */
function quayStrips(b: FacetBuilder, y: number, pieces: readonly (readonly [number, number, number, number?])[], worn: boolean): void {
  const step = (QUAY.v1 - QUAY.v0) / QUAY.strips;
  for (const [k, u0, u1, tilt = 0] of pieces) {
    const v = QUAY.v0 + step * (k + 0.5);
    const c = shore((u0 + u1) / 2, v);
    b.box({ x: c.x, y: y - QUAY.thick - Math.abs(tilt) * 0.6, z: c.z, yaw: SHORE_YAW + tilt * 0.3, pitch: tilt }, [u1 - u0, QUAY.thick, step - 0.05], worn ? C.wornShade : C.plankShade, worn ? C.wornWood : C.plank);
  }
}

/** La cabane debout (le corps) : ses murs d'enduit, son toit de planches, sa porte au chambranle de bois et au motif des racines. */
function cabin(b: FacetBuilder, deck: number): void {
  const { x, z } = CABIN_AT;
  b.box({ x, y: deck - 0.1, z, yaw: CABIN.face }, [CABIN.w, CABIN.wall + 0.1, CABIN.d], C.wall, C.wallTop);
  b.gableRoof({ x, y: deck + CABIN.wall, z, yaw: CABIN.face }, CABIN.w + 0.5, CABIN.d + 0.5, 0.9, C.newWood, C.wall);
  facadeDoor(b, deck, C.door);
  // Le chambranle : deux montants et le linteau, et dessus le motif des racines entrelacées (une onde en vert-de-gris,
  // sans lettre ni chiffre).
  const D = DOOR;
  const q = (t0: number, t1: number, y0: number, y1: number, color: number, lift = 0.03) => {
    const a = onFacade(t0, lift),
      c = onFacade(t1, lift);
    b.quad([a.x, y0, a.z], [c.x, y0, c.z], [c.x, y1, c.z], [a.x, y1, a.z], color);
  };
  q(D.t - D.half - 0.12, D.t - D.half, deck, deck + D.h + 0.12, C.newShade);
  q(D.t + D.half, D.t + D.half + 0.12, deck, deck + D.h + 0.12, C.newShade);
  q(D.t - D.half - 0.12, D.t + D.half + 0.12, deck + D.h, deck + D.h + 0.14, C.newShade);
  const wave = [-0.45, -0.15, 0.15, 0.45];
  for (let i = 0; i < 3; i++) {
    const y0 = deck + D.h + 0.22 + (i % 2 ? 0.08 : 0),
      y1 = deck + D.h + 0.22 + (i % 2 ? 0 : 0.08);
    const a = onFacade(D.t + wave[i], 0.04),
      c = onFacade(D.t + wave[i + 1], 0.04);
    b.quad([a.x, y0, a.z], [c.x, y1, c.z], [c.x, y1 + 0.07, c.z], [a.x, y0 + 0.07, a.z], C.verdigris);
  }
}

/** La porte de la cabane, à droite de la façade (vue de face) : sa place le long de la façade, sa demi-largeur, sa hauteur. */
const DOOR = { t: 0.95, half: 0.36, h: 1.2 } as const;

function facadeDoor(b: FacetBuilder, deck: number, color: number): void {
  const a = onFacade(DOOR.t - DOOR.half, 0.015),
    c = onFacade(DOOR.t + DOOR.half, 0.015);
  b.quad([a.x, deck, a.z], [c.x, deck, c.z], [c.x, deck + DOOR.h, c.z], [a.x, deck + DOOR.h, a.z], color);
}

/** Le comptoir de façade : un bloc de bois devant le mur, à gauche de la porte, son plateau débordant. */
const FRONT_COUNTER = { t: -0.25, n: 0.45, len: 1.4, depth: 0.6, h: 0.9 } as const;

function frontCounter(b: FacetBuilder, deck: number): void {
  const F = FRONT_COUNTER;
  const c = onFacade(F.t, F.n);
  b.box({ x: c.x, y: deck, z: c.z, yaw: CABIN.face }, [F.len - 0.15, F.h - 0.08, F.depth - 0.15], C.newShade);
  b.box({ x: c.x, y: deck + F.h - 0.08, z: c.z, yaw: CABIN.face }, [F.len, 0.08, F.depth], C.newShade, C.newWood);
}

/**
 * Un auvent de toile : un rectangle à une seule pente (jamais un triangle ni un pan levé), son dessus et son dessous,
 * du bord haut (`hi`, à la hauteur `yHi`) au bord bas (`lo`, à `yLo`) ; `half` : sa demi-largeur, le long de `along`.
 */
function awning(b: FacetBuilder, hi: Vec2, lo: Vec2, along: Vec2, half: number, yHi: number, yLo: number, color: number, under: number): void {
  const p = (c: Vec2, s: number, y: number) => [c.x + along.x * s * half, y, c.z + along.z * s * half] as const;
  const a = p(hi, -1, yHi),
    c = p(hi, 1, yHi),
    d = p(lo, 1, yLo),
    e = p(lo, -1, yLo);
  b.quad(a, e, d, c, color);
  b.quad(a, c, d, e, under);
}

/** L'auvent d'un radeau (le haut) au-dessus de son comptoir : deux perches hautes côté quai, deux basses côté eau. */
function raftAwning(b: FacetBuilder, k: number, deck: number): void {
  const R = RAFTS[k];
  const hi = shore(R.u + COUNTER.du, R.v + COUNTER.dv - 0.9),
    lo = shore(R.u + COUNTER.du, R.v + COUNTER.dv + 1.1);
  const along = { x: SHORE_COS, z: SHORE_SIN };
  const half = 1.45;
  const yHi = deck + 2.1,
    yLo = deck + 1.6;
  for (const s of [-1, 1]) {
    pole(b, hi.x + along.x * s * half, hi.z + along.z * s * half, deck, yHi, 0.05, C.newShade);
    pole(b, lo.x + along.x * s * half, lo.z + along.z * s * half, deck, yLo, 0.05, C.newShade);
  }
  awning(b, hi, lo, along, half, yHi, yLo, C.cloth, C.clothUnder);
}

/** Un panier rond : un tronc de cône à six pans, et son tas de fruits ronds (un dôme bas). */
function basket(b: FacetBuilder, at: Vec3, s: number, fruit: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.2 * s, 0.25 * s, 0.22 * s, 6, C.basketShade, C.basket);
  b.prism({ x: at.x, y: at.y + 0.22 * s, z: at.z, yaw: 0.4 }, 0.21 * s, 0, 0.13 * s, 5, fruit);
}

/** Un sac de toile noué : son corps, son col serré, sa tête nouée. */
function tiedSack(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw: 0.3 }, 0.2 * s, 0.13 * s, 0.32 * s, 6, C.sackShade, C.sack);
  b.prism({ x: at.x, y: at.y + 0.32 * s, z: at.z, yaw: 0.3 }, 0.07 * s, 0, 0.12 * s, 4, C.sack);
}

/** Une barque d'étal plate, la proue relevée, le dedans plus sombre que le flanc ; un banc. */
const HULL: readonly (readonly [number, number])[] = [
  [-1.05, 0],
  [0.85, 0],
  [1.55, 0.78],
  [-1.3, 0.5],
];

function boat(b: FacetBuilder, at: Vec2, yaw: number, water: number): void {
  const y = water - 0.2;
  b.extrude({ x: at.x - 0.45 * Math.sin(yaw), y, z: at.z - 0.45 * Math.cos(yaw), yaw }, HULL, 0.9, C.boatInside, C.newWood);
  b.box({ x: at.x, y: y + 0.36, z: at.z, yaw }, [0.32, 0.18, 0.8], C.plank);
}

/** Les deux barques d'étal des abords, à flot : à l'ouest, devant la cabane ; à l'est, passé le radeau du fond. */
const BOATS = [
  { u: -9, v: 2.6 },
  { u: 12, v: 4.6 },
] as const;

/** Le bois de chauffe, une simple pile contre une racine, avant comme après (sans appentis). */
const WOODPILE = { u: -11.5, v: -3.4 } as const;

/** La racine en arceau qui cadre, sur la rive, à l'ouest de la cabane. */
const ROOT = { from: { u: -12.6, v: -1.6 }, to: { u: -10.4, v: -4.4 }, h: 1.1 } as const;

/**
 * Les volumes des Radeaux, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu (`water` :
 * le niveau de l'eau) ; `door` : sa porte, au nord-est, sur la rive.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const W = ground.water;
  const deck = W + DECK;
  const raftDeck = W + RAFT.float + RAFT.thick;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : la racine qui cadre, le bois de chauffe contre elle, et le portique vide du grand fléau (deux poteaux
  // plantés dans le chenal, chacun sa fourche en V à deux bras courts et sa broche de fer nue ; aucune traverse).
  add('ruine', 0, (b) => {
    const f = shore(ROOT.from.u, ROOT.from.v),
      t = shore(ROOT.to.u, ROOT.to.v);
    rootArch(b, f, t, ROOT.h, 0.32, at);
    const w = shore(WOODPILE.u, WOODPILE.v);
    const g = at(w.x, w.z);
    for (const [dx, dy, dz] of [
      [0, 0.16, -0.22],
      [0, 0.16, 0.22],
      [0.05, 0.44, 0],
    ])
      b.prism({ x: w.x + dx, y: g + dy, z: w.z + dz - 0.65, yaw: 0.5, pitch: Math.PI / 2 }, 0.17, 0.17, 1.3, 4, C.log, C.logEnd);
  });
  add('ruine', 0, (b) => {
    for (const P of PORTICO.posts) {
      const p = shore(P.u, P.v);
      const foot = pileFoot(ground, p) - 0.6;
      b.box({ x: p.x, y: foot, z: p.z, yaw: SHORE_YAW }, [0.3, PORTICO.top - foot, 0.3], C.wornShade, C.wornWood);
      // La fourche : deux bras qui s'écartent en V dans le travers du chenal (`v`), la broche le long de la rive.
      const top = { x: p.x, y: PORTICO.top, z: p.z };
      for (const s of [-1, 1]) {
        const tip = shore(P.u, P.v + s * PORTICO.spread);
        b.beam(top, { x: tip.x, y: PORTICO.top + PORTICO.arm, z: tip.z }, 0.16, C.wornWood);
      }
      const inward = P.u < 2 ? 1 : -1;
      const pin = shore(P.u + inward * 0.45, P.v);
      b.beam({ x: p.x, y: PORTICO.top + 0.28, z: p.z }, { x: pin.x, y: PORTICO.top + 0.28, z: pin.z }, 0.07, C.iron);
    }
  });

  // La ruine du quai : il tient, quelques planches manquent, son bout ouest affaissé vers l'eau. Le corps le refait.
  add(
    'ruine',
    0,
    (b) => {
      quayStrips(
        b,
        deck,
        [
          [0, QUAY.u0 + 1.8, QUAY.u1],
          [1, QUAY.u0 + 2.2, -1.6],
          [1, 0.6, QUAY.u1],
          [2, -6.2, -2.4],
          [2, 2.4, QUAY.u1 - 1.2],
          [2, QUAY.u0, -7, 0.12],
        ],
        true,
      );
      for (const u of [-5, 4]) {
        const p = shore(u, QUAY.v1 - 0.25);
        pole(b, p.x, p.z, pileFoot(ground, p), deck - QUAY.thick, 0.11, C.wornShade);
      }
    },
    corps1,
  );
  // La cabane en ruine : ses murs fendus, son toit de planches à demi effondré (un pan tient, l'autre tombe dedans), un pan
  // d'enduit tombé qui montre les lattes, sa porte ; son auvent de toile délavée tendu de travers sur une perche qui penche.
  add(
    'ruine',
    0,
    (b) => {
      const { x, z } = CABIN_AT;
      b.box({ x, y: deck - 0.1, z, yaw: CABIN.face }, [CABIN.w, CABIN.wall + 0.1, CABIN.d], C.wornWall, C.wornWall);
      const r = placer({ x, y: deck + CABIN.wall, z, yaw: CABIN.face });
      // Le pan qui tient (côté façade), puis celui qui tombe dans la cabane.
      const hw = (CABIN.w + 0.5) / 2,
        hd = (CABIN.d + 0.5) / 2;
      b.quad(r(-hw, 0, hd), r(hw, 0, hd), r(hw, 0.9, 0), r(-hw, 0.9, 0), C.wornWood);
      b.quad(r(-hw * 0.2, 0.75, 0), r(hw, 0.8, 0), r(hw * 0.9, -0.9, -hd * 0.7), r(-hw * 0.4, -0.7, -hd * 0.8), C.wornShade);
      facadeDoor(b, deck, C.door);
      // Le pan d'enduit tombé : les lattes à nu sur le mur, la plaque au pied ; une fente qui descend du toit.
      const l0 = onFacade(-1.45, 0.02),
        l1 = onFacade(-0.55, 0.02);
      b.quad([l0.x, deck + 0.9, l0.z], [l1.x, deck + 0.8, l1.z], [l1.x, deck + 1.7, l1.z], [l0.x, deck + 1.8, l0.z], C.laths);
      const f0 = onFacade(0.35, 0.025),
        f1 = onFacade(0.48, 0.025);
      b.quad([f0.x, deck + 1.2, f0.z], [f1.x, deck + 1.2, f1.z], [f1.x, deck + 1.98, f1.z], [f0.x, deck + 1.98, f0.z], C.crack);
      const slab = onFacade(-1.0, 0.75);
      b.box({ x: slab.x, y: deck, z: slab.z, yaw: CABIN.face + 0.3 }, [0.85, 0.08, 0.7], C.wornWall);
      // L'auvent délavé, de travers, sur sa perche qui penche.
      const hi = onFacade(0, 0.05),
        lo = onFacade(0.1, 1.45);
      const pf = onFacade(1.25, 1.35);
      b.beam({ x: pf.x, y: deck, z: pf.z }, { x: pf.x - FACE_N.x * 0.15, y: deck + 1.35, z: pf.z - FACE_N.z * 0.15 }, 0.08, C.wornShade);
      const along = FACE_T;
      const p = (c: Vec2, s: number, y: number) => [c.x + along.x * s * 1.3, y, c.z + along.z * s * 1.3] as const;
      const a = p(hi, -1, deck + 1.95),
        c = p(hi, 1, deck + 1.95),
        d = p(lo, 1, deck + 1.35),
        e = p(lo, -1, deck + 0.95);
      b.quad(a, e, d, c, C.wornCloth);
      b.quad(a, c, d, e, C.clothUnder);
    },
    corps1,
  );
  // La lanterne du marchand, allumée dès la ruine (la seule), sur sa perche courte près de la porte ; la grande perche la
  // remplace avec le haut.
  add(
    'ruine',
    0,
    (b) => {
      const p = onFacade(PERCH.short.t, PERCH.short.n);
      perchLantern(b, p.x, p.z, deck, PERCH.short.h, true);
    },
    haut,
  );
  // Les radeaux de la ruine : celui du quai à plat, ses amarres rompues qui pendent dans l'eau ; le deuxième penché de
  // 20°, un bord sous l'eau, sa balance glissée contre le bord bas et sa lanterne éteinte qui penche ; du troisième, un
  // coin de rondins. Sur eux, deux toiles couchées à plat et leurs perches cassées, couchées parallèles. Le corps les
  // remet à flot.
  add(
    'ruine',
    0,
    (b) => {
      const r0 = raftAt(0),
        r1 = raftAt(1),
        r2 = raftAt(2);
      const y0 = W + RAFT.float - 0.08;
      raft(b, { x: r0.x, y: y0, z: r0.z, yaw: SHORE_YAW + 0.12 }, 0, true);
      // Le deuxième : penché autour de son axe le long de la rive, le bord côté chenal sous l'eau.
      const tilt = (20 * Math.PI) / 180;
      raft(b, { x: r1.x, y: W - 0.15, z: r1.z, yaw: SHORE_YAW - 0.1, pitch: tilt }, 0, true);
      // Le troisième : un coin seul hors de l'eau.
      b.box({ x: r2.x - 1.4, y: W - 1.2, z: r2.z - 1.2, yaw: SHORE_YAW + 0.785, pitch: 0.5 }, [1.6, 1.5, 1.6], C.wornLog, C.wornLogTop);
      // Les bouts d'amarre rompus, du radeau du quai dans l'eau.
      for (const du of [-1.2, 1.2]) {
        const a = shore(RAFTS[0].u + du, RAFTS[0].v - RAFT.size / 2),
          c = shore(RAFTS[0].u + du + 0.2, RAFTS[0].v - RAFT.size / 2 - 0.9);
        b.beam({ x: a.x, y: y0 + RAFT.thick, z: a.z }, { x: c.x, y: W - 0.25, z: c.z }, 0.06, C.rope);
      }
      // Les balances renversées : sur le radeau du quai, couchée, un plateau tombé ; sur le deuxième, glissée contre le
      // bord bas.
      const top0 = y0 + RAFT.thick;
      const s0 = shore(RAFTS[0].u - 0.4, RAFTS[0].v - 0.6);
      b.box({ x: s0.x, y: top0, z: s0.z, yaw: SHORE_YAW + 0.5 }, [SCALE.foot, 0.14, 0.14], C.wornShade);
      b.box({ x: s0.x + 0.5, y: top0, z: s0.z + 0.4, yaw: SHORE_YAW + 0.4 }, [SCALE.beam, 0.09, 0.1], C.wornWood);
      b.prism({ x: s0.x - 0.8, y: top0, z: s0.z + 0.9 }, SCALE.pan * 0.82, SCALE.pan, 0.06, 5, C.pan);
      // Le dessus du radeau penché à `dv` de son axe (vers le chenal) : la balance glisse jusqu'au bord de l'eau.
      const tiltTop = (dv: number) => W - 0.15 + RAFT.thick * Math.cos(tilt) - dv * Math.sin(tilt);
      const s1 = shore(RAFTS[1].u + 0.3, RAFTS[1].v + 0.35);
      b.box({ x: s1.x, y: tiltTop(0.35), z: s1.z, yaw: SHORE_YAW, pitch: tilt }, [SCALE.beam, 0.09, 0.1], C.wornWood);
      const s2 = shore(RAFTS[1].u + 1.2, RAFTS[1].v - 0.1);
      b.box({ x: s2.x, y: tiltTop(-0.1), z: s2.z, yaw: SHORE_YAW, pitch: tilt }, [0.14, 0.14, SCALE.foot], C.wornShade);
      // La lanterne éteinte qui penche sur le radeau qui penche.
      const lp = shore(RAFTS[1].u - 1.6, RAFTS[1].v - 1.2);
      const ly = tiltTop(-1.2) - 0.05;
      const lt = { x: lp.x + 0.35, y: ly + 1.5, z: lp.z + 0.35 };
      b.beam({ x: lp.x, y: ly, z: lp.z }, lt, 0.1, C.wornShade);
      lanternOn(b, lt, false);
      // Les deux toiles couchées à plat (jamais dressées), et leurs perches cassées, couchées parallèles.
      const cloth = (c: Vec2, y: number, du: number, dv: number, yaw: number, pitch = 0) => {
        const t = placer({ x: c.x, y, z: c.z, yaw: SHORE_YAW + yaw, pitch });
        b.quad(t(-du, 0, -dv), t(-du, 0, dv), t(du, 0, dv), t(du, 0, -dv), C.wornCloth);
      };
      cloth(shore(RAFTS[0].u + 0.9, RAFTS[0].v + 0.8), top0 + 0.02, 1.2, 0.9, 0.15);
      cloth(shore(RAFTS[1].u - 0.6, RAFTS[1].v - 0.6), tiltTop(-0.6) + 0.02, 1.1, 0.8, 0, tilt);
      for (const dv of [1.75, 2.05]) {
        const a = shore(RAFTS[0].u - 1.6, RAFTS[0].v + dv),
          c = shore(RAFTS[0].u + 1.2, RAFTS[0].v + dv);
        b.beam({ x: a.x, y: top0 + 0.04, z: a.z }, { x: c.x, y: top0 + 0.04, z: c.z }, 0.08, C.wornShade);
      }
    },
    corps2,
  );
  // Les débris du quai : la lanterne éteinte tombée à plat, un panier renversé et ses fruits, une caisse éventrée (le
  // corps les range) ; deux plateaux couchés sur la vase au ras de l'eau, au bord du quai (jamais posés sur l'eau) et
  // trois poids (les balances les reprennent). Rien sur le chemin de la porte.
  add(
    'ruine',
    0,
    (b) => {
      const l0 = shore(-1.5, -1.4),
        l1 = shore(0.2, -1.6);
      b.beam({ x: l0.x, y: deck + 0.06, z: l0.z }, { x: l1.x, y: deck + 0.06, z: l1.z }, 0.1, C.wornShade);
      // La lanterne, couchée au bout de sa perche : sa vitre éteinte et son chapeau, à plat.
      b.prism({ x: l1.x, y: deck + 0.17, z: l1.z, yaw: SHORE_YAW + Math.PI / 2, pitch: Math.PI / 2 }, 0.17, 0.17, 0.36, 6, C.unlit);
      b.prism({ x: l1.x, y: deck + 0.17, z: l1.z, yaw: SHORE_YAW - Math.PI / 2, pitch: Math.PI / 2 }, 0.2, 0, 0.16, 4, C.bronze);
      const k = shore(-4.6, -1.9);
      b.prism({ x: k.x, y: deck + 0.22, z: k.z, yaw: 0.4, pitch: Math.PI / 2 }, 0.22, 0.18, 0.22, 6, C.basketShade, C.basket);
      for (const [du, dv] of [
        [0.5, 0.4],
        [0.8, -0.1],
      ])
        b.prism({ x: k.x + du, y: deck, z: k.z + dv }, 0.09, 0, 0.12, 4, C.brick);
      const crate = shore(-2.6, -2.0);
      b.box({ x: crate.x, y: deck, z: crate.z, yaw: SHORE_YAW + 0.4 }, [0.6, 0.45, 0.5], C.wornShade, C.wornWood);
      b.box({ x: crate.x + 0.6, y: deck, z: crate.z + 0.2, yaw: SHORE_YAW + 0.9 }, [0.65, 0.05, 0.22], C.wornWood);
    },
    corps1,
  );
  add(
    'ruine',
    0,
    (b) => {
      for (const u of [-11.2, -12.1]) {
        const p = shore(u, 0.15);
        b.prism({ x: p.x, y: Math.max(at(p.x, p.z), W) - 0.02, z: p.z }, SCALE.pan * 0.82, SCALE.pan, 0.06, 5, C.pan);
      }
      for (const [u, v] of [
        [1.4, -1.3],
        [2.0, -1.6],
        [1.7, -0.9],
      ]) {
        const p = shore(u, v);
        weight(b, { x: p.x, y: deck, z: p.z }, 1, u);
      }
    },
    corps3,
  );
  // La rampe cassée : deux planches tombées de travers et un poteau. Les abords la refont.
  add(
    'ruine',
    0,
    (b) => {
      const a = shore(RAMP.u - 0.3, RAMP.top + 0.6),
        c = shore(RAMP.u + 0.2, RAMP.bottom + 0.4);
      b.box({ x: a.x, y: at(a.x, a.z) - 0.1, z: a.z, yaw: SHORE_YAW + 1.7, pitch: 0.1 }, [1.8, 0.1, 0.8], C.wornShade, C.wornWood);
      b.box({ x: c.x, y: deck - 0.35, z: c.z, yaw: SHORE_YAW + 1.3, pitch: -0.2 }, [1.6, 0.1, 0.7], C.wornShade, C.wornWood);
      const p = shore(RAMP.u + RAMP.half + 0.2, RAMP.top + 1.2);
      pole(b, p.x, p.z, at(p.x, p.z) - 0.2, at(p.x, p.z) + 0.55, 0.08, C.wornShade);
    },
    abords,
  );

  // Le corps, 1 sur 3 : le quai entier, la cabane redressée (enduit refait, porte, chambranle aux racines), sans son
  // auvent, et son comptoir de façade.
  add(0, 0, (b) => {
    quayStrips(
      b,
      deck,
      Array.from({ length: QUAY.strips }, (_, k) => [k, QUAY.u0, QUAY.u1] as const),
      false,
    );
    for (const u of [-6, -0.5, 5]) {
      const p = shore(u, QUAY.v1 - 0.25);
      pole(b, p.x, p.z, pileFoot(ground, p), deck - QUAY.thick, 0.11, C.plankShade);
    }
    cabin(b, deck);
    frontCounter(b, deck);
  });
  // Le corps, 2 sur 3 : les trois radeaux à plat, en rondins neufs, en échelon ; leurs amarres courtes, tendues et
  // parallèles (deux par lien : au quai, puis d'un radeau au suivant), jamais croisées.
  add(0, 1 / 3, (b) => {
    const y0 = W + RAFT.float;
    RAFTS.forEach((_, k) => {
      const c = raftAt(k);
      raft(b, { x: c.x, y: y0, z: c.z, yaw: SHORE_YAW });
    });
    const h = RAFT.size / 2;
    const tie = (a: Vec2, c: Vec2) => rope(b, { x: a.x, y: raftDeck - 0.05, z: a.z }, { x: c.x, y: raftDeck - 0.05, z: c.z });
    for (const du of [-1.4, 1.4]) tie(shore(RAFTS[0].u + du, QUAY.v1 - 0.1), shore(RAFTS[0].u + du, RAFTS[0].v - h + 0.1));
    for (let k = 0; k < 2; k++) {
      const a = RAFTS[k],
        c = RAFTS[k + 1];
      for (const dv of [0.6, 1.6]) tie(shore(a.u + h - 0.1, c.v - h + dv), shore(c.u - h + 0.1, c.v - h + dv));
    }
  });
  // Le corps, 3 sur 3 : les trois comptoirs des radeaux et leurs balances redressées, les fléaux à plat, les plateaux de niveau.
  add(0, 2 / 3, (b) => {
    for (let k = 0; k < RAFTS.length; k++) counterAndScale(b, k, raftDeck);
  });
  // Le haut : les auvents tendus (celui de la cabane, et un au-dessus du comptoir des deux premiers radeaux) ; la grande
  // perche du marchand, sa lanterne allumée avec elle ; la lanterne sur perche du radeau du fond.
  add(1, 0, (b) => {
    const hi = onFacade(-0.3, 0.02),
      lo = onFacade(-0.3, 1.2);
    for (const s of [-1, 1]) {
      const p = { x: lo.x + FACE_T.x * s * 1.25, z: lo.z + FACE_T.z * s * 1.25 };
      pole(b, p.x, p.z, deck, deck + 1.55, 0.05, C.newShade);
    }
    awning(b, hi, lo, FACE_T, 1.25, deck + CABIN.wall - 0.05, deck + 1.55, C.cloth, C.clothUnder);
    raftAwning(b, 0, raftDeck);
    raftAwning(b, 1, raftDeck);
    const t = onFacade(PERCH.tall.t, PERCH.tall.n);
    perchLantern(b, t.x, t.z, deck, PERCH.tall.h, true);
    const f = shore(RAFTS[2].u + 1.6, RAFTS[2].v + 1.4);
    perchLantern(b, f.x, f.z, raftDeck, 1.9, true);
  });
  // Les abords : la rampe de la rive au quai et sa barrière basse ; deux barques d'étal à flot, la proue relevée ; un sac
  // et un panier rangés ; une lanterne sur perche en tête de rampe.
  add(2, 0, (b) => {
    const top = shore(RAMP.u, RAMP.top),
      bottom = shore(RAMP.u, RAMP.bottom);
    const gTop = at(top.x, top.z);
    const len = Math.hypot(top.x - bottom.x, top.z - bottom.z);
    // La planche de la rampe, en long dans le travers de la rive, penchée de la rive (haut) au quai (bas).
    const pitch = Math.atan2(gTop - deck, len);
    const mid = { x: (top.x + bottom.x) / 2, z: (top.z + bottom.z) / 2 };
    b.box({ x: mid.x, y: (gTop + deck) / 2 - 0.14, z: mid.z, yaw: SHORE_YAW, pitch }, [2 * RAMP.half, 0.14, len], C.plankShade, C.plank);
    const rail = (v: number) => shore(RAMP.u - RAMP.half - 0.1, v);
    const r0 = rail(RAMP.top + 0.3),
      r1 = rail(RAMP.bottom - 0.1);
    const g0 = at(r0.x, r0.z);
    pole(b, r0.x, r0.z, g0 - 0.2, g0 + 0.75, 0.06, C.newShade);
    pole(b, r1.x, r1.z, deck - 0.1, deck + 0.75, 0.06, C.newShade);
    b.beam({ x: r0.x, y: g0 + 0.7, z: r0.z }, { x: r1.x, y: deck + 0.7, z: r1.z }, 0.07, C.newWood);
    boat(b, shore(BOATS[0].u, BOATS[0].v), SHORE_YAW + 0.25, W);
    boat(b, shore(BOATS[1].u, BOATS[1].v), SHORE_YAW - 0.35, W);
    const s = shore(-3.8, -2.0);
    tiedSack(b, { x: s.x, y: deck, z: s.z }, 1.1);
    const k = shore(-3.1, -2.05);
    basket(b, { x: k.x, y: deck, z: k.z }, 1, C.olive);
    const l = shore(RAMP.u + RAMP.half + 0.3, RAMP.top + 0.2);
    perchLantern(b, l.x, l.z, at(l.x, l.z), 1.8, true);
  });
}

// ---------- Les traces ----------

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder, deck: number, raftDeck: number) => void): void {
  const l = new FacetBuilder();
  draw(l, -c.y + DECK, -c.y + RAFT.float + RAFT.thick);
  const f = l.build();
  for (let i = 0; i < f.positions.length; i += 3) {
    f.positions[i] += c.x;
    f.positions[i + 1] += c.y;
    f.positions[i + 2] += c.z;
  }
  b.append(f);
}

/** Le dessus du comptoir de façade, au point `t` de sa longueur (de −0,5 à 0,5) : où se posent les paniers et le sac. */
const onCounter = (t: number): Vec2 => onFacade(FRONT_COUNTER.t + t * FRONT_COUNTER.len, FRONT_COUNTER.n);

/** Mission 1 (les étals) : trois paniers ronds pareils, alignés sur le comptoir de façade, chacun son tas de fruits ronds. */
function baskets(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l, deck) => {
    for (const t of [-0.36, -0.12, 0.12]) {
      const p = onCounter(t);
      basket(l, { x: p.x, y: deck + FRONT_COUNTER.h, z: p.z }, 0.85, C.brick);
    }
  });
}

/** Mission 2 (les remises) : un sac de toile noué, de la taille d'un panier, à côté des paniers sur le comptoir. */
function counterSack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l, deck) => {
    const p = onCounter(0.36);
    tiedSack(l, { x: p.x, y: deck + FRONT_COUNTER.h, z: p.z }, 0.85);
  });
}

/**
 * Mission 3 (les balances) : au bord du radeau le plus proche, une corde à nœuds enroulée debout sur un taquet de bois
 * (un disque à six pans, ses nœuds à peine visibles : jamais une graduation ni un rouleau à plat), et à côté une perche
 * de pilote debout dans son anneau de fer.
 */
const CLEAT = { du: 1.5, dv: -1.9 } as const;

function knottedRope(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l, _deck, raftDeck) => {
    const p = shore(RAFTS[0].u + CLEAT.du, RAFTS[0].v + CLEAT.dv);
    l.box({ x: p.x, y: raftDeck, z: p.z, yaw: SHORE_YAW }, [0.5, 0.16, 0.18], C.newShade, C.newWood);
    l.prism({ x: p.x, y: raftDeck + 0.16 + 0.3, z: p.z - 0.06 * Math.cos(SHORE_YAW), yaw: SHORE_YAW, pitch: Math.PI / 2 }, 0.3, 0.3, 0.12, 6, C.rope);
    const q = shore(RAFTS[0].u + CLEAT.du + 0.75, RAFTS[0].v + CLEAT.dv + 0.05);
    l.prism({ x: q.x, y: raftDeck, z: q.z }, 0.11, 0.11, 0.12, 5, C.iron, C.iron);
    pole(l, q.x, q.z, raftDeck, raftDeck + 2.1, 0.05, C.newWood);
  });
}

/**
 * Mission 4 (les formules) : sous l'auvent de la cabane, debout contre le mur à gauche du comptoir, un casier de bois à
 * trois niches côte à côte, à l'échelle d'un panier ; deux niches gardent un jeton rond, la troisième est vide, et un
 * jeton attend sur le rebord à côté.
 */
const CASE = { t: -1.25, w: 0.6, h: 0.75, d: 0.28 } as const;

function pigeonholes(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l, deck) => {
    const K = CASE;
    const m = onFacade(K.t, K.d / 2 + 0.01);
    l.box({ x: m.x, y: deck, z: m.z, yaw: CABIN.face }, [K.w, K.h, K.d], C.newShade, C.newWood);
    const y0 = deck + K.h - 0.3,
      y1 = deck + K.h - 0.08;
    for (let i = 0; i < 3; i++) {
      const t0 = K.t - K.w / 2 + 0.04 + (i * (K.w - 0.08)) / 3 + 0.015,
        t1 = t0 + (K.w - 0.08) / 3 - 0.03;
      const a = onFacade(t0, K.d + 0.012),
        e = onFacade(t1, K.d + 0.012);
      l.quad([a.x, y0, a.z], [e.x, y0, e.z], [e.x, y1, e.z], [a.x, y1, a.z], C.niche);
      if (i === 2) continue;
      const j = onFacade((t0 + t1) / 2, K.d + 0.03);
      token(l, { x: j.x, y: y0 + 0.11, z: j.z }, 0.075, true);
    }
    const r = onFacade(K.t + K.w / 2 + 0.12, K.d * 0.6);
    l.prism({ x: r.x, y: deck + 0.42, z: r.z }, 0.08, 0.08, 0.03, 6, C.token);
    l.box({ x: r.x, y: deck, z: r.z, yaw: CABIN.face }, [0.2, 0.42, 0.2], C.newShade, C.newWood);
  });
}

/** Un jeton rond de bois pâle, face à la façade (debout, `standing`) ou couché à plat. */
function token(b: FacetBuilder, at: Vec3, r: number, standing: boolean): void {
  if (standing) {
    const p = Array.from({ length: 6 }, (_, k) => [r * Math.cos((Math.PI * k) / 3), r * Math.sin((Math.PI * k) / 3)] as const);
    b.plate({ x: at.x, y: at.y, z: at.z, yaw: CABIN.face }, p, C.token);
  } else b.prism({ x: at.x, y: at.y, z: at.z }, r, r, 0.035, 6, C.token);
}

/**
 * Mission 5 (les statistiques) : au bord du quai, un grand sac de toile ouvert, deux fois la taille d'un panier, d'où
 * sortent des jetons ronds et des jetons carrés (la forme les distingue, jamais la couleur), quelques-uns à sa bouche,
 * aucun sur le chemin.
 */
const BIG_SACK = { u: -1.8, v: 0.5 } as const;

function openSack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l, deck) => {
    const p = shore(BIG_SACK.u, BIG_SACK.v);
    l.prism({ x: p.x, y: deck, z: p.z, yaw: 0.2 }, 0.38, 0.32, 0.55, 6, C.sackShade, C.niche);
    for (const [du, dv, round] of [
      [0, 0, true],
      [0.12, 0.1, false],
      [-0.1, 0.05, false],
    ] as const) {
      const q = shore(BIG_SACK.u + du, BIG_SACK.v + dv);
      if (round) token(l, { x: q.x, y: deck + 0.56, z: q.z }, 0.09, false);
      else l.box({ x: q.x, y: deck + 0.56, z: q.z, yaw: 0.5 }, [0.15, 0.04, 0.15], C.token);
    }
    for (const [du, dv, round] of [
      [0.55, 0.15, true],
      [0.62, -0.25, false],
      [0.85, 0.05, true],
    ] as const) {
      const q = shore(BIG_SACK.u + du, BIG_SACK.v + dv);
      if (round) token(l, { x: q.x, y: deck, z: q.z }, 0.09, false);
      else l.box({ x: q.x, y: deck, z: q.z, yaw: 0.9 }, [0.16, 0.04, 0.16], C.token);
    }
  });
}

// ---------- La scénette ----------

/**
 * La scène : sur le quai, devant la façade de la cabane, que la caméra regarde de face (son cap de départ, `start`, est
 * celui de la façade). Kéo à gauche, côté eau, le marchand à droite, devant la porte : ni l'un ni l'autre ne cache le
 * comptoir de façade ni le casier (à gauche de la porte, entre eux).
 */
const SCENE_SPOT = onFacade(0, 2.05);

/** La demi-largeur et la demi-profondeur du point de la scène (`sceneSpot`), où le sol est relevé. */
const SCENE_HALF_SPOT: [number, number] = [1.2, 0.8];

/** La demi-largeur de Kéo et du marchand l'un de l'autre, le long de la façade. */
const SCENE_HALF = 1.55;

/** Le plancher de la scène, sur le quai : sa demi-largeur (le long de la façade), sa profondeur. */
const SCENE_FLOOR = { half: 3, depth: 2.2 } as const;

/**
 * La hauteur du plancher de la scène au-dessus du point de la scène (`sceneSpot`, le plus haut du sol sous elle) : celle
 * du quai, deux centimètres au-dessus.
 */
const SCENE_RISE = (() => {
  const c = PLACES_5E.find((p) => p.id === 'radeaux')!.center;
  let y = -Infinity;
  for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) y = Math.max(y, standingHeight(heightAt5e({ x: c.x + SCENE_SPOT.x + i * SCENE_HALF_SPOT[0], z: c.z + SCENE_SPOT.z + k * SCENE_HALF_SPOT[1] })));
  return Math.max(0, DECK + 0.02 - y);
})();

/** Le plancher de la scène : trois longues planches le long de la façade, sur deux pieux, à la hauteur du quai. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  for (let k = 0; k < 3; k++) {
    const n = -F.depth / 2 + ((k + 0.5) * F.depth) / 3;
    b.box({ x: floor.x + FACE_N.x * n, y: floor.y - 0.14, z: floor.z + FACE_N.z * n, yaw: CABIN.face }, [2 * F.half, 0.14, F.depth / 3 - 0.05], C.plankShade, C.plank);
  }
  for (const s of [-1, 1]) {
    const x = floor.x + FACE_T.x * s * (F.half - 0.3) + FACE_N.x * (F.depth / 2 - 0.2),
      z = floor.z + FACE_T.z * s * (F.half - 0.3) + FACE_N.z * (F.depth / 2 - 0.2);
    pole(b, x, z, floor.y - 1.4, floor.y - 0.14, 0.1, C.plankShade);
  }
}

/** Le marchand en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu. */
function merchant(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.32, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.28, 0.26, 0.48, 8, C.shirt);
  b.box({ x: at.x, y: at.y + 0.52, z: at.z + 0.2, yaw: 0 }, [0.5, 0.45, 0.1], C.vest);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 1.24, z: at.z - 0.02 }, 0.22, 0.2, 0.08, 8, C.cap);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.5, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La planche des réponses sur ses tréteaux : sa hauteur à l'échelle 1 ; un poids choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  'proportion-tables': onCounter(-0.12),
  percentages: onCounter(0.36),
  ratios: shore(RAFTS[0].u + CLEAT.du, RAFTS[0].v + CLEAT.dv),
  formulas: onFacade(CASE.t, 0.3),
  statistics: shore(BIG_SACK.u, BIG_SACK.v),
} as const;

/** La place de Kéo et du marchand dans la scène, depuis son milieu : de part et d'autre, le long de la façade. */
const keoSpot = { dx: -FACE_T.x * SCENE_HALF, dz: -FACE_T.z * SCENE_HALF } as const;
const merchantSpot = { dx: FACE_T.x * SCENE_HALF, dz: FACE_T.z * SCENE_HALF } as const;

export const RADEAUX: PlaceArt = {
  role: 'Le marchand',
  model,
  // L'étape la plus basse qui porte une trace : le corps. Chaque trace se montre avec SA partie (`row`), dès que sa
  // mission est réussie : les trois premières avec les trois parties du corps, puis le haut, puis les abords.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.x, dz: SCENE_SPOT.z, half: SCENE_HALF_SPOT },
  site: {
    rise: SCENE_RISE,
    keo: { dx: keoSpot.dx, dz: keoSpot.dz, scale: 0.6, yaw: Math.PI - 0.4 + CABIN.face },
    habitant: { dx: merchantSpot.dx, dz: merchantSpot.dz },
    subject: { halfWidth: 3.2, bottom: -0.5, top: 3.1, depth: 0 },
    pitch: (14 * Math.PI) / 180,
    start: CABIN.face,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) merchant(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.4, half: 0.3 },
    // La longue planche de comptoir sur deux tréteaux, sous la rangée des poids (comme la planche à pain du Hameau).
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.6 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.5 * s], C.newShade);
      }
    },
    // Un poids de fer posé sur la planche ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur).
    object(b, at, s, _i, _count, picked) {
      weight(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s * 1.6);
    },
  },
  // Les cinq missions en R : le plancher seul, rien de l'item ; les poids portent les réponses.
  rest() {},
  traces: {
    'proportion-tables': { at: TRACE_SPOTS['proportion-tables'], lift: 1, stage: 0, row: 0, draw: baskets },
    percentages: { at: TRACE_SPOTS.percentages, lift: 1, stage: 0, row: 1 / 3, draw: counterSack },
    ratios: { at: TRACE_SPOTS.ratios, lift: 1, stage: 0, row: 2 / 3, draw: knottedRope },
    formulas: { at: TRACE_SPOTS.formulas, lift: 0.8, stage: 1, draw: pigeonholes },
    statistics: { at: TRACE_SPOTS.statistics, lift: 0.8, stage: 2, draw: openSack },
  },
  // Kéo au retour : sur la rive, en haut de la rampe, face au quai.
  exit: shore(RAMP.u - 1.6, RAMP.top - 0.6),
};

/**
 * Les hauteurs qui se comparent, au-dessus du sol du centre du lieu : le haut des fourches du portique, le plus haut du
 * lieu (sous la canopée, loin sous la Montée), le pied de ses fourches ; et, au-dessus de l'eau, le haut de la lanterne de
 * la grande perche (plus basse que les fourches).
 */
export const RADEAUX_HEIGHTS = { top: PORTICO.top + PORTICO.arm, forks: PORTICO.top, perchAboveWater: DECK + PERCH.tall.h + 0.54 } as const;

/** Les centres des trois radeaux et des deux poteaux du portique, dans le repère du lieu (les tests). */
export const RADEAUX_LAYOUT = { rafts: RAFTS.map((_, k) => raftAt(k)), raftHalf: RAFT.size / 2, posts: PORTICO.posts.map((p) => shore(p.u, p.v)), cabin: CABIN_AT, scene: SCENE_SPOT } as const;
