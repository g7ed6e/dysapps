// Le Kiosque (les Alpages du 3e, GD-25, lot 3 ; proposition du consultant d'Archipéo, § 3, relecture des lieux du
// directeur artistique, correction 15, et planche `selection-alpages-v1`, de près et de loin graine 2026) : « le kiosque
// des alpages, où arrivaient les nouvelles du monde et les témoignages ». Sur le gabarit du Jardin (./jardin3e.ts), avec
// le kit du 3e (./place3eKit.ts). Au milieu du pâturage : un kiosque rond ouvert sur six poteaux de bois, sur son socle de
// granit, sa coupole basse d'ardoise (jamais de cobalt : correction 9) et son épi de fer ; dedans, le comptoir rond et le
// poste de radio de bois à grille ronde ; sous l'avant-toit, quatre cadres unis et gris ; autour, quatre présentoirs
// debout, garnis de feuilles pliées grises, sans écriture ; la boîte aux lettres de fer sur son pied ; au nord, le banc en
// arc de cercle.
//
// La ruine, d'après le texte, cassée du côté de la porte (relecture du Versant, (b) 5) : la coupole glissée au sud-ouest, basculée
// dans l'herbe à côté du socle ; les deux poteaux du sud penchés ; les présentoirs couchés et vides, les cadres à plat
// dans l'herbe ; le comptoir bas, le poste ouvert ; la boîte aux lettres debout, sa porte ouverte ; l'herbe sèche autour du
// socle. Une seule lumière, la lanterne de la journaliste, à un poteau debout. Trois parties (1 + 1 + 1) : le corps (les six
// poteaux, le plancher, le comptoir) ; le haut (la coupole, son épi, la lanterne du kiosque) ; les abords (les présentoirs,
// les cadres, la boîte refermée, le banc, la lanterne du chemin). Une trace par mission, avec sa partie. La porte est un
// peu à l'est de l'axe (relecture du Versant, (b) 1) : Kéo s'y arrête à côté du kiosque, jamais devant. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, armLantern3e, dryTuft3e, habitant3e, lantern3e, onCircle, postLantern3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres au Kiosque, en plus des matières des Passeurs (`C3E`) : le gris des feuilles pliées et des cadres
 * (unis, jamais une image) ; le fer de la grille du poste ; le ruban des rouleaux ; la veste de la journaliste (un brun
 * éteint) ; le bois peint des chaises de café.
 */
const C = {
  paper: 0xc9cbcd,
  paperShade: 0xaeb1b5,
  frame: 0xa7acb3,
  ribbon: 0x9a6a58,
  coat: 0x7a6656,
  chair: 0x8f9a8c,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('kiosque');

/** Le plan du sol sous le kiosque : le pâturage, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-7, 7], [-7, 10]);

/** Le socle de granit, rond à dix pans, et le plancher de bois dessus. */
const PLINTH = { r: 4.0, h: 0.3, sides: 10, floor: 3.65 } as const;

/** Les six poteaux : leur rayon, leurs caps (depuis le nord), leur hauteur, leur section ; les deux du sud penchent dans la ruine. */
const POSTS = { r: 3.4, caps: [30, 90, 150, 210, 270, 330] as const, h: 2.5, w: 0.22, leaning: [150, 210] as const } as const;

/** La coupole basse d'ardoise : son avant-toit, son dôme, son chapeau, l'épi de fer. */
const DOME = { eave: 4.1, mid: 3.2, top: 1.0, cap: 0.28, eaveH: 0.32, domeH: 0.9, capH: 0.32, spike: 0.75, snow: 0.45 } as const;

/** Le comptoir rond, au milieu ; le poste de radio sur lui, au nord. */
const COUNTER = { r0: 1.0, r1: 1.45, h: 1.0, low: 0.72 } as const;
const RADIO = { at: { x: 0, z: -1.22 }, size: [0.55, 0.42, 0.32] as const } as const;

/** Les présentoirs, à leur cap autour du kiosque ; les deux qui sont couchés dans la ruine. */
const STANDS = { r: 5.1, caps: [50, 85, 120, 305] as const, fallen: [85, 305] as const } as const;

/** Les cadres sous l'avant-toit (entre deux poteaux) ; ceux qui gisent à plat dans la ruine, et où. */
const FRAMES = { caps: [0, 60, 240, 300] as const, y: 2.0, fallen: [{ x: -2.4, z: 4.6, yaw: 0.4 }, { x: 1.4, z: 5.0, yaw: -0.7 }] as const } as const;

/** La boîte aux lettres de fer sur son pied. */
const MAILBOX = { cap: 268, r: 5.3 } as const;

/** Le banc en arc de cercle, au nord : son rayon, ses caps de bout en bout. */
const BENCH = { r: 5.8, from: -20, to: 20, h: 0.45, w: 0.42 } as const;

/** La lanterne du chemin (les abords), dehors, à l'ouest de la porte, hors du chemin. */
const PATH_LANTERN = { x: 4.6, z: 11.3, h: 1.4 } as const;

/** L'herbe sèche de la ruine, autour du socle, du côté de la porte. */
const DRY = [
  { x: -3.6, z: 3.2, s: 1 },
  { x: 2.9, z: 3.6, s: 0.8 },
  { x: -4.4, z: -1.2, s: 0.9 },
  { x: 4.3, z: 0.4, s: 0.85 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 3) : au nord, de la porte au sud-est ; le kiosque à gauche de Kéo, jamais derrière lui
 * (relecture du Versant, (b) 1) ; l'arête ouest derrière, le soleil dans le dos.
 */
const DOOR_VIEW = capOf(0);

/** La vue d'arrivée basse, à hauteur de Kéo, un peu reculée : la coupole entière dans le cadre. */
const DOOR_FRAME = { height: -2.2, back: 1.5 } as const;

/** Le point du nom sur la Carte, au-dessus de la coupole, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return planeY(0, 0) + POSTS.h + DOME.eaveH + DOME.domeH + 1.4;
  },
  z: 0,
};

// ---------- Les volumes ----------

/** Le sol du socle : le plus bas de son pourtour. */
const plinthBase = once(() => Math.min(...[0, 90, 180, 270].map((d) => onCircle(PLINTH.r, d)).map((p) => planeY(p.x, p.z))) - 0.05);

/** Le dessus du socle, où se posent les poteaux et le comptoir. */
const deck = (): number => plinthBase() + PLINTH.h;

/** Le cap d'un point (en degrés) en lacet d'un repère dont le nord local regarde ce cap. */
const yawOf = (deg: number): number => (-deg * Math.PI) / 180;

/** Un poteau droit, de son pied sur le socle au bas de l'avant-toit. */
function post(b: FacetBuilder, deg: number): void {
  const p = onCircle(POSTS.r, deg);
  b.box({ x: p.x, y: deck() - 0.05, z: p.z, yaw: yawOf(deg) }, [POSTS.w, POSTS.h + 0.05, POSTS.w], C3E.woodShade, C3E.wood);
}

/** Un poteau penché vers le dehors, sa tête plus bas (la ruine). */
function leaningPost(b: FacetBuilder, deg: number): void {
  const foot = onCircle(POSTS.r, deg);
  const head = onCircle(POSTS.r + 1.1, deg + 6);
  b.beam({ x: foot.x, y: deck() - 0.05, z: foot.z }, { x: head.x, y: deck() + POSTS.h - 0.5, z: head.z }, POSTS.w, C3E.woodShade);
}

/** Le socle de granit, toujours là. */
function plinth(b: FacetBuilder): void {
  b.prism({ x: 0, y: plinthBase() - 0.3, z: 0, yaw: Math.PI / PLINTH.sides }, PLINTH.r, PLINTH.r, PLINTH.h + 0.3, PLINTH.sides, C3E.graniteShade, C3E.granite);
}

/** La coupole d'ardoise et son épi, dans un repère dont le bas de l'avant-toit est en y = 0. */
function dome(l: FacetBuilder): void {
  const D = DOME;
  l.prism({ x: 0, y: 0, z: 0 }, D.eave, D.mid, D.eaveH, 12, C3E.slate, C3E.slateTop);
  l.prism({ x: 0, y: D.eaveH, z: 0 }, D.mid, D.top, D.domeH, 12, C3E.slateTop, C3E.slate);
  // La couronne de neige sur le haut de la coupole (relecture des Alpages, (a) 3) : seule la Coupole se lit en dôme bleu.
  const k = D.snow;
  l.prism({ x: 0, y: D.eaveH + D.domeH * (1 - k) - 0.01, z: 0 }, D.top + (D.mid - D.top) * k + 0.03, D.top + 0.03, D.domeH * k + 0.02, 12, C3E.snow, C3E.snow);
  l.prism({ x: 0, y: D.eaveH + D.domeH, z: 0 }, D.top, D.cap, D.capH, 8, C3E.snow, C3E.snow);
  l.prism({ x: 0, y: D.eaveH + D.domeH + D.capH, z: 0 }, 0.1, 0, D.spike, 6, C3E.iron);
}

/**
 * La coupole tombée (la ruine) : penchée de `FALLEN_DOME.pitch` vers le nord-ouest, son bord bas sur le socle, son bord
 * haut vers la porte ; dessous, le plancher de bois de l'avant-toit et trois chevrons, que la porte voit.
 */
const FALLEN_DOME = { x: -0.6, z: -0.4, lift: 1.05, pitch: 0.3 } as const;
function domeFallen(b: FacetBuilder): void {
  const F = FALLEN_DOME;
  drawPosed(b, { x: F.x, y: deck() + F.lift, z: F.z, yaw: (-3 * Math.PI) / 4, pitch: F.pitch }, (l) => {
    dome(l);
    drawPosed(l, { x: 0, y: 0, z: 0, yaw: 0, pitch: Math.PI }, (u) => {
      u.prism({ x: 0, y: 0, z: 0 }, DOME.eave - 0.08, DOME.eave - 0.08, 0.04, 12, C3E.woodShade, C3E.wood);
      for (const x of [-1.6, 0, 1.6]) u.box({ x, y: 0.04, z: 0 }, [0.16, 0.14, 2 * Math.sqrt(DOME.eave ** 2 - x * x) - 0.6], C3E.woodShade, C3E.newWood);
    });
  });
}

/** Le comptoir rond, haut (`h`) ou bas et fendu (la ruine), et le poste dessus, son couvercle fermé ou ouvert. */
function counter(b: FacetBuilder, h: number, fresh: boolean): void {
  b.annulus({ x: 0, y: deck() - 0.05, z: 0 }, COUNTER.r0, COUNTER.r1, h + 0.05, 10, fresh ? C3E.wood : C3E.woodShade, fresh ? C3E.newWood : C3E.wood);
  const [w, rh, d] = RADIO.size;
  const y = deck() + h;
  b.box({ x: RADIO.at.x, y, z: RADIO.at.z }, [w, rh, d], C3E.woodShade, C3E.wood);
  // La grille ronde, côté sud, de fer : un disque plat sur la face.
  b.drum({ x: RADIO.at.x, y: y + rh / 2, z: RADIO.at.z + d / 2, pitch: Math.PI / 2 }, 0.13, 0.03, 8, C3E.iron, C3E.ironTop);
  if (fresh) b.box({ x: RADIO.at.x, y: y + rh, z: RADIO.at.z }, [w + 0.04, 0.05, d + 0.04], C3E.woodShade, C3E.newWood);
  else b.box({ x: RADIO.at.x, y: y + rh, z: RADIO.at.z - d / 2, pitch: -1.2 }, [w + 0.04, 0.05, d + 0.04], C3E.woodShade, C3E.wood);
}

/** Un présentoir debout : deux pieds, un plan incliné, trois piles de feuilles pliées grises, sans écriture. */
function stand(l: FacetBuilder, full: boolean): void {
  for (const x of [-0.42, 0.42]) l.box({ x, y: -0.1, z: 0 }, [0.07, 1.25, 0.07], C3E.woodShade);
  l.box({ x: 0, y: 0.55, z: -0.18, pitch: -0.45 }, [0.98, 0.7, 0.05], C3E.woodShade, C3E.wood);
  l.box({ x: 0, y: 0.5, z: 0.05 }, [0.98, 0.05, 0.16], C3E.woodShade, C3E.wood);
  if (!full) return;
  for (const x of [-0.3, 0, 0.3]) l.box({ x, y: 0.62, z: -0.13, pitch: -0.45 }, [0.24, 0.3, 0.05], C.paperShade, C.paper);
}

/** Les présentoirs debout (les abords), à leur cap, le dos au kiosque. */
function standsUp(b: FacetBuilder): void {
  for (const deg of STANDS.caps) {
    const p = onCircle(STANDS.r, deg);
    drawPosed(b, { x: p.x, y: planeY(p.x, p.z), z: p.z, yaw: yawOf(deg + 180) }, (l) => stand(l, true));
  }
}

/** Deux présentoirs couchés et vides (la ruine), sur le flanc, à la place de deux des quatre. */
function standsFallen(b: FacetBuilder): void {
  for (const deg of STANDS.fallen) {
    const p = onCircle(STANDS.r + 0.4, deg);
    drawPosed(b, { x: p.x, y: planeY(p.x, p.z) + 0.05, z: p.z, yaw: yawOf(deg + 90), pitch: Math.PI / 2 - 0.1 }, (l) => stand(l, false));
  }
}

/** Un cadre uni et gris, sans image, pendu sous l'avant-toit entre deux poteaux, tourné vers le dehors. */
function frameHung(b: FacetBuilder, deg: number): void {
  const p = onCircle(POSTS.r * 0.88, deg);
  const top = deck() + POSTS.h;
  b.box({ x: p.x, y: deck() + FRAMES.y, z: p.z, yaw: yawOf(deg) }, [0.62, 0.46, 0.05], C3E.woodShade, C.frame);
  b.box({ x: p.x, y: deck() + FRAMES.y + 0.06, z: p.z, yaw: yawOf(deg) }, [0.5, 0.34, 0.07], C.frame);
  b.beam({ x: p.x, y: deck() + FRAMES.y + 0.46, z: p.z }, { x: p.x, y: top, z: p.z }, 0.03, C3E.iron);
}

/** La boîte aux lettres de fer sur son pied, sa porte fermée ou ouverte (la ruine). */
function mailbox(b: FacetBuilder, open: boolean | null): void {
  const p = onCircle(MAILBOX.r, MAILBOX.cap);
  const y = planeY(p.x, p.z);
  const yaw = yawOf(MAILBOX.cap + 180);
  if (open === null) {
    b.box({ x: p.x, y: y - 0.2, z: p.z, yaw }, [0.12, 1.2, 0.12], C3E.iron);
    b.box({ x: p.x, y: y + 1.0, z: p.z, yaw }, [0.42, 0.52, 0.34], C3E.iron, C3E.ironTop);
    b.prism({ x: p.x, y: y + 1.52, z: p.z, yaw: yaw + Math.PI / 4 }, 0.3, 0.2, 0.08, 4, C3E.ironTop);
    return;
  }
  // La porte, sur la face tournée vers le kiosque : à plat, ou ouverte d'un quart de tour.
  drawPosed(b, { x: p.x, y: y + 1.04, z: p.z, yaw }, (l) => {
    if (open) l.box({ x: -0.38, y: 0, z: -0.2, yaw: Math.PI / 2 }, [0.4, 0.42, 0.03], C3E.ironTop);
    else l.box({ x: 0, y: 0, z: -0.18 }, [0.38, 0.42, 0.03], C3E.ironTop);
  });
}

/** Le banc en arc de cercle, au nord, en trois tronçons sur leurs pieds de granit. */
function bench(b: FacetBuilder): void {
  const n = 3;
  const step = (BENCH.to - BENCH.from) / n;
  for (let k = 0; k < n; k++) {
    const deg = BENCH.from + step * (k + 0.5);
    const p = onCircle(BENCH.r, deg);
    const g = planeY(p.x, p.z);
    const len = 2 * BENCH.r * Math.sin((step * Math.PI) / 360) - 0.08;
    b.box({ x: p.x, y: g - 0.1, z: p.z, yaw: yawOf(deg) }, [0.3, BENCH.h + 0.1, BENCH.w - 0.1], C3E.graniteShade, C3E.granite);
    b.box({ x: p.x, y: g + BENCH.h, z: p.z, yaw: yawOf(deg) }, [len, 0.1, BENCH.w], C3E.woodShade, C3E.wood);
  }
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle ; les quatre poteaux debout et, à celui de l'ouest, la lanterne de la journaliste, la seule
  // allumée de la ruine ; le pied et le coffre de la boîte aux lettres.
  add('ruine', 0, (b) => {
    plinth(b);
    for (const deg of POSTS.caps) if (!(POSTS.leaning as readonly number[]).includes(deg)) post(b, deg);
    const w = onCircle(POSTS.r + POSTS.w / 2, 270);
    armLantern3e(b, w.x, deck() + POSTS.h - 0.5, w.z, -1, 0, true);
    mailbox(b, null);
  });
  // Le corps relève les deux poteaux penchés, le comptoir bas et le poste ouvert.
  add(
    'ruine',
    0,
    (b) => {
      for (const deg of POSTS.leaning) leaningPost(b, deg);
      counter(b, COUNTER.low, false);
    },
    corps,
  );
  // Le haut relève la coupole tombée de travers sur le comptoir (relecture des Alpages, (a) 2) : son bord du nord-ouest
  // dans l'herbe, celui du sud-est relevé sur le haut du poteau de l'est, vers la porte ; on voit son volume, son épi et
  // son dessous de bois, jamais un aplat d'ardoise couché dans l'herbe.
  add('ruine', 0, (b) => domeFallen(b), haut);
  // Les abords relèvent les présentoirs couchés, les cadres à plat, la porte ouverte de la boîte et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) => {
      standsFallen(b);
      for (const f of FRAMES.fallen) b.box({ x: f.x, y: planeY(f.x, f.z) - 0.02, z: f.z, yaw: f.yaw }, [0.62, 0.06, 0.46], C3E.woodShade, C.frame);
      mailbox(b, true);
      for (const d of DRY) dryTuft3e(b, d.x, planeY(d.x, d.z), d.z, d.s);
    },
    abords,
  );

  // ---- Le corps : les six poteaux droits, le plancher, le comptoir rond, le poste fermé.
  add(0, 0, (b) => {
    for (const deg of POSTS.leaning) post(b, deg);
    b.prism({ x: 0, y: deck() - 0.02, z: 0, yaw: Math.PI / PLINTH.sides }, PLINTH.floor, PLINTH.floor, 0.08, PLINTH.sides, C3E.woodShade, C3E.wood);
    counter(b, COUNTER.h, true);
  });
  // ---- Le haut : la coupole reposée, son épi ; la lanterne du kiosque, pendue au milieu.
  add(1, 0, (b) => {
    drawPosed(b, { x: 0, y: deck() + POSTS.h, z: 0, yaw: 0 }, dome);
    lantern3e(b, { x: 0, y: deck() + POSTS.h - 0.05, z: 0 }, true);
  });
  // ---- Les abords : les présentoirs garnis, les cadres raccrochés, la boîte refermée, le banc, la lanterne du chemin.
  add(2, 0, (b) => {
    standsUp(b);
    for (const deg of FRAMES.caps) frameHung(b, deg);
    mailbox(b, false);
    bench(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  cafe: onCircle(5.6, 200),
  bag: onCircle(POSTS.r + POSTS.w / 2 + 0.05, 90),
  stool: onCircle(6.9, 335),
} as const;

/** Une petite table ronde et deux chaises de café, devant le comptoir (Les guerres totales ; correction 15). */
function cafe(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.cafe;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z }, [0.08, 0.8, 0.08], C3E.iron);
    l.prism({ x, y: y + 0.75, z }, 0.36, 0.36, 0.05, 8, C3E.woodShade, C3E.newWood);
    for (const s of [-1, 1]) {
      const cx = x + s * 0.62;
      for (const [dx, dz] of [
        [-0.15, -0.15],
        [0.15, -0.15],
        [-0.15, 0.15],
        [0.15, 0.15],
      ] as const)
        l.box({ x: cx + dx, y: y - 0.05, z: z + dz }, [0.04, 0.5, 0.04], C.chair);
      l.box({ x: cx, y: y + 0.45, z }, [0.38, 0.05, 0.38], C.chair);
      l.box({ x: cx + s * 0.17, y: y + 0.5, z }, [0.04, 0.42, 0.36], C.chair);
    }
  });
}

/** Un sac de facteur de cuir pendu à un crochet, au poteau de l'est (Le monde depuis 1945). */
function bag(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bag;
    const y = deck() + 1.55;
    l.beam({ x: x - 0.1, y: y + 0.12, z }, { x: x + 0.05, y: y + 0.12, z }, 0.03, C3E.iron);
    l.box({ x: x + 0.12, y: y - 0.62, z, yaw: Math.PI / 2 }, [0.46, 0.4, 0.14], C3E.leather);
    l.box({ x: x + 0.13, y: y - 0.32, z, yaw: Math.PI / 2 }, [0.48, 0.12, 0.16], C3E.leather);
    l.beam({ x: x + 0.12, y: y - 0.25, z: z - 0.2 }, { x: x + 0.05, y: y + 0.12, z }, 0.04, C3E.leather);
    l.beam({ x: x + 0.12, y: y - 0.25, z: z + 0.2 }, { x: x + 0.05, y: y + 0.12, z }, 0.04, C3E.leather);
  });
}

/** Un tabouret haut et une caisse de bois, à côté d'un présentoir (Une République repensée). */
function stool(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.stool;
    const y = planeY(x, z);
    for (const [dx, dz] of [
      [-0.13, -0.13],
      [0.13, -0.13],
      [-0.13, 0.13],
      [0.13, 0.13],
    ] as const)
      l.box({ x: x + dx, y: y - 0.05, z: z + dz }, [0.05, 0.85, 0.05], C3E.woodShade);
    l.prism({ x, y: y + 0.8, z }, 0.2, 0.2, 0.06, 8, C3E.woodShade, C3E.newWood);
    l.box({ x: x + 0.62, y: y - 0.05, z: z + 0.1, yaw: 0.3 }, [0.55, 0.45, 0.45], C3E.woodShade, C3E.newWood);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : le corps, le haut, les abords. */
const TRACES = {
  'total-wars': { at: TRACE_SPOTS.cafe, lift: 1, stage: 0, row: 0, draw: cafe },
  'world-since-1945': { at: TRACE_SPOTS.bag, lift: 1.4, stage: 1, row: 0, draw: bag },
  republic: { at: TRACE_SPOTS.stool, lift: 1.1, stage: 2, row: 0, draw: stool },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 3) : au nord-est, vers le comptoir, l'arête ouest et le pic au bord droit. */
const SCENE_START = capOf(45);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la journaliste). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : au sud-ouest, hors du socle, le comptoir devant, entre les poteaux. */
const SCENE_SPOT = { dx: -5.4, dz: 4.2, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la journaliste au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe du pâturage. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La planche des rouleaux : sa hauteur à l'échelle 1 ; un rouleau choisi se soulève d'un cran. */
const SHELF = { height: 0.55, lift: 0.3, roll: 0.18 } as const;

/** Un rouleau de papier fermé d'un ruban, sans écriture, couché en travers ; tous pareils. */
function roll(b: FacetBuilder, at: Vec3, s: number): void {
  const len = 0.4 * s;
  b.drum({ x: at.x - len / 2, y: at.y + 0.09 * s, z: at.z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.09 * s, len, 8, C.paperShade, C.paper);
  b.band({ x: at.x - 0.04 * s, y: at.y + 0.09 * s, z: at.z, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.095 * s, 0.08 * s, 8, C.ribbon);
}

export const KIOSQUE: PlaceArt = {
  role: 'La journaliste',
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
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x5a4a3e);
  },
  answer: {
    size: { height: SHELF.height + SHELF.lift + SHELF.roll, half: 0.3 },
    facing: true,
    // Une planche de bois sur deux tréteaux, sous le rang des rouleaux.
    base(b, mid, y, z, span, s, ground) {
      const top = y + SHELF.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.44 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.08 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Un rouleau, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      roll(b, { x: at.x, y: at.y + (SHELF.height + (picked ? SHELF.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.4, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Kiosque, pour les tests. */
export const KIOSQUE_LAYOUT = {
  plinth: PLINTH,
  posts: POSTS,
  dome: DOME,
  stands: STANDS,
  mailbox: MAILBOX,
  bench: BENCH,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
