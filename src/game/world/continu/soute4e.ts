// La Soute (lot 2 du monde ouvert du 4e, GD-24 ; intention du directeur artistique du 21 octobre 2026, planche
// `selection-fabriques-v1`, rangée 1, validée par le mainteneur le même jour à 20 h 04) : « le quai d'où les machines de
// l'usine partaient vers tous les ports du monde ». Le cœur, sans figure : le quai de chargement et le navire de charge,
// un cargo des Passeurs (un vapeur à coque de fer rivetée, sa timonerie basse, sa cheminée courte et sans fumée), amarré
// le long du quai, jamais en travers du bassin à flot ; à l'ouest du quai, la halle de brique, longue et basse, parallèle
// à lui, ses grandes portes sur le quai. Tout s'aligne sur le bassin à flot, dont l'axe penche de 4° sur le nord : le lieu
// se dessine dans le repère du quai (`u` vers le bassin, `v` le long du quai, du nord au sud ; `QUAY_YAW`).
// Le signe de l'absence du 4e : la grande bitte du quai, et sur son flanc un support de fer vide, deux goujons nus
// (l'anneau d'amarrage de bronze est sur le Rafiot). Avant comme après, jamais une étape.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Les murs de la halle debout jusqu'à mi-hauteur, cassés à
// des hauteurs inégales, un pan de toit couché en biais à l'intérieur, ses deux grandes portes couchées sur le quai ; le
// quai, ses planches arrachées par endroits ; le navire qui gîte vers le bassin, sa cale ouverte, ses panneaux d'écoutille
// de travers, sans couler ; cinq caisses éparpillées, chacune un gros motif clair qui se lit par sa forme (rayures,
// chevrons, losange, cercle : jamais une lettre, un chiffre ni un drapeau) ; le chariot à bras renversé, un filet en tas.
// Une seule lumière, la lanterne du magasinier. Trois parties : le corps (les murs, les portes ouvertes), le haut (le toit,
// la poutre de chargement basse et sa poulie, la lanterne de la halle), les abords (le quai refait, le navire redressé et
// couvert, les bittes, les filets pendus, la lanterne du chemin). Une trace par mission, avec sa partie. Ni grue ni
// portique ; jamais le mot « entrepôt » ; rien ne bouge. Le fer rouillé est d'un brun éteint (jamais la rouille claire du
// lot 1, qui se lit orange au soleil bas : relecture de la Forge), le fer restauré bruni sombre ; la pierre des Passeurs
// grise, à assises. Code pur (placeArt.ts).
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { BASSIN_4E, COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { inWorld, lantern, localGround4e, slab } from './place4eKit';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Soute. La pierre grise des Passeurs, plus froide que celle du lot 1 (relecture de la Forge : elle se
 * lisait crème au soleil bas) ; la brique de l'usine (`COLORS_4E`) ; le fer rouillé de la ruine, brun éteint, et le fer
 * bruni sombre restauré ; le bois gris de la ruine, le bois neuf brun ; la tôle du toit, brun gris, jamais orange ; le
 * cuir, la toile et la corde ; la peinture claire des motifs ; l'ombre des baies et de la cale.
 */
const C = {
  stone: 0x8f8b88,
  stoneSun: 0xa29d98,
  stoneShade: 0x77736f,
  joint: 0x67635f,
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  rust: 0x6a483e,
  rustTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  deck: 0x8e7a66,
  sheet: 0x7c6a62,
  sheetShade: 0x6a5c56,
  hollow: 0x4f4744,
  glass: 0x5e6a70,
  leather: 0x7a5a44,
  trunk: 0x6e5444,
  canvas: 0xb8a88a,
  rope: 0x9a8668,
  paint: 0xd9ccb2,
  // Les caisses des réponses : un bois clair, sans motif (jamais confondues avec les caisses peintes de la ruine).
  answer: 0xc8ae8e,
  answerTop: 0xd4bc9c,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0x9c8452,
  // Le magasinier, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon bleu gris, veste moutarde.
  boots: 0x55595a,
  trousers: 0x5c6670,
  jacket: 0xb8963e,
  head: 0xe3b48a,
} as const;

// ---------- Le repère ----------

/** Le centre du lieu et le sol sous lui. */
const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'soute')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

/** L'eau du bassin, dans le repère du lieu (la mer est à 0). */
const WATER = -H0;

/** Le cap du quai : l'axe du bassin à flot au droit de la Soute (de son coude à la baie), son `v` vers le sud. */
const BASSIN_A = BASSIN_4E.line[1];
const BASSIN_B = BASSIN_4E.line[2];
const QUAY_YAW = Math.atan2(BASSIN_B.x - BASSIN_A.x, BASSIN_B.z - BASSIN_A.z);
const QC = Math.cos(QUAY_YAW);
const QS = Math.sin(QUAY_YAW);

/** Un point du repère du quai (`u`, `v`) dans le repère du lieu. */
const quayToLocal = (u: number, v: number): Vec2 => ({ x: u * QC + v * QS, z: -u * QS + v * QC });
/** Un point du repère du lieu dans celui du quai. */
const localToQuay = (p: Vec2): { u: number; v: number } => ({ u: p.x * QC - p.z * QS, v: p.x * QS + p.z * QC });

/** Le sol sous un point du repère du quai. */
const qGround = (u: number, v: number): number => {
  const p = quayToLocal(u, v);
  return localGround(p.x, p.z);
};

/** Le bord de l'eau, en `u` : la distance du centre à l'axe du bassin, moins sa demi-largeur. */
const EDGE = (() => {
  const a = { x: BASSIN_A.x - CENTER.x, z: BASSIN_A.z - CENTER.z };
  return a.x * QC - a.z * QS - BASSIN_4E.halfWidth;
})();

/** Dessine dans le repère du quai (posé au centre du lieu). */
const inQuay = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: 0, z: 0, yaw: QUAY_YAW }, draw);

// ---------- Le plan, dans le repère du quai ----------

/** Le quai : de la halle au bord de l'eau, du nord au sud ; son dessus, au-dessus du sol plus haut que lui. */
const QUAY = { u0: 10.45, u1: EDGE - 0.05, v0: -14, v1: 6 } as const;
const QUAY_TOP = (() => {
  let hi = -Infinity;
  for (let u = QUAY.u0; u <= QUAY.u1; u += 0.5) for (let v = QUAY.v0; v <= QUAY.v1; v += 0.5) hi = Math.max(hi, qGround(u, v));
  return hi + 0.08;
})();
/** La bande de planches du quai : sa largeur (en `u`), son épaisseur ; dans la ruine, ses trois morceaux (deux trous). */
const PLANKS = { u0: 12.0, u1: 16.4, t: 0.08, whole: [-13.5, 5.6] as const, ruin: [[-13.5, -8.2], [-6.6, -0.8], [1.0, 5.6]] as const } as const;
/** Le dessus des planches. */
const DECK_TOP = QUAY_TOP + PLANKS.t;

/** La halle : ses bords, ses murs, leur hauteur ; ses deux baies sur le quai (en `v`), leur hauteur ; le faîte du toit. */
const HALL = { u0: 4.5, u1: 10.5, v0: -13, v1: 0.5, wall: 0.5, h: 3.2, ridge: 1.6, doors: [[-10.3, -7.7], [-5.0, -2.4]] as const, doorH: 2.6 } as const;

/** Le navire : son milieu (`u`, `v`), sa demi-longueur, sa demi-largeur, son franc-bord, son tirant ; sa gîte dans la ruine. */
const SHIP = { u: EDGE + 4.1, v: -3, half: 8.5, beam: 2.5, freeboard: 1.5, draught: 0.6, list: 0.13 } as const;

/** La grande bitte du quai et son support vide (le signe de l'absence) ; les deux bittes neuves des abords. */
const BOLLARD = { u: EDGE - 1.0, v: -1.2, r: 0.4, h: 0.9 } as const;
const SMALL_BOLLARDS = [
  { u: EDGE - 0.9, v: -10.6 },
  { u: EDGE - 0.9, v: 5.0 },
] as const;

/** La poutre de chargement (le haut) : ses deux poteaux en travers du quai, sa hauteur (sous 5), sa poulie. */
const BEAM = { v: -6.4, u0: 11.6, u1: EDGE - 0.6, h: 4.4, pulley: EDGE - 1.6 } as const;

/** La lanterne du magasinier, la seule allumée de la ruine, sur son poteau au coin sud-est de la halle ; celle du chemin. */
const KEEPER_LANTERN = { u: 11.35, v: 1.5, h: 2.4 } as const;
const PATH_LANTERN = { u: 4.0, v: 9.8, h: 1.35 } as const;

/** Le pas de la porte du lieu, depuis le centre (au sud-ouest de la halle). */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_4E.find((p) => p.id === 'soute')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » : de la porte, le long du quai, vers le nord-nord-est (la halle à gauche, le quai au
 * milieu, le navire à droite) ; au-delà, le Bastion et la grue du Gabarit. Le volcan est à l'opposé du bassin (à
 * l'ouest-nord-ouest) : il se voit de dos (intention, « L'arrivée »). La caméra regarde vers −(sin cap, cos cap).
 */
const DOOR_LOOK = quayToLocal(14.5, -4);
const DOOR_VIEW = Math.atan2(DOOR_AT.x - DOOR_LOOK.x, DOOR_AT.z - DOOR_LOOK.z);

/** La vue d'arrivée, à hauteur de Kéo (correction du mainteneur) : 3 plus bas que la caméra qui suit, un peu reculée. */
const DOOR_FRAME = { height: -3, back: 1.2 } as const;

/** Le point du nom sur la Carte : au-dessus de la halle, jamais sur le navire. */
const MAP_POINT: Vec3 = (() => {
  const p = quayToLocal(7.5, -6);
  return { x: p.x, y: HALL.h + HALL.ridge + 2, z: p.z };
})();

// ---------- Les petits volumes ----------

/** Les motifs des caisses : des formes nettes et grosses, qui se distinguent par la forme (directeur artistique, 4). */
type Motif = 'stripes' | 'chevrons' | 'diamond' | 'circle';

/** Les aplats d'un motif dans un carré de côté 1 centré (x, y), convexes. */
function motifShapes(m: Motif): (readonly (readonly [number, number])[])[] {
  if (m === 'stripes')
    return [-0.27, 0, 0.27].map((y) => [
      [-0.38, y - 0.08],
      [0.38, y - 0.08],
      [0.38, y + 0.08],
      [-0.38, y + 0.08],
    ]);
  if (m === 'chevrons')
    return [-0.2, 0.14].flatMap((y) => [
      [
        [-0.38, y],
        [0, y + 0.22],
        [0, y + 0.38],
        [-0.38, y + 0.16],
      ],
      [
        [0, y + 0.22],
        [0.38, y],
        [0.38, y + 0.16],
        [0, y + 0.38],
      ],
    ]);
  if (m === 'diamond')
    return [
      [
        [0, -0.4],
        [0.4, 0],
        [0, 0.4],
        [-0.4, 0],
      ],
    ];
  return [Array.from({ length: 8 }, (_, k) => [0.34 * Math.cos((Math.PI * k) / 4 + Math.PI / 8), 0.34 * Math.sin((Math.PI * k) / 4 + Math.PI / 8)] as const)];
}

/**
 * Une caisse de bois peinte d'un gros motif clair, sur son dessus et sur sa face `+z` (dans son repère) : côté `s`, posée
 * en `at` au cap `yaw`.
 */
function crate(b: FacetBuilder, at: Vec3, s: number, yaw: number, motif: Motif): void {
  b.box({ x: at.x, y: at.y, z: at.z, yaw }, [s, s, s], C.newShade, C.newWood);
  const shapes = motifShapes(motif).map((o) => o.map(([x, y]) => [x * s, y * s] as const));
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw }, (l) => {
    for (const o of shapes) {
      l.plate({ x: 0, y: s / 2, z: s / 2 + 0.006 }, o, C.paint);
      l.plate({ x: 0, y: s + 0.006, z: 0, pitch: -Math.PI / 2 }, o, C.paint);
    }
  });
}

// ---------- La halle ----------

/** Un pan de mur de brique de la halle, dans le repère du quai : le long de `v` (en `u`) ou de `u` (en `v`). */
function hallWall(l: FacetBuilder, alongV: boolean, at: number, from: number, to: number, h: number): void {
  const len = to - from,
    mid = (from + to) / 2,
    t = HALL.wall;
  if (alongV) l.box({ x: at, y: SINK, z: mid }, [t, h - SINK, len], C.brickShade, C.brick);
  else l.box({ x: mid, y: SINK, z: at }, [len, h - SINK, t], C.brickShade, C.brick);
}

/** La halle restaurée (le corps) : ses quatre murs à 3,2, ses deux baies, leurs portes ouvertes contre la façade. */
function hallStanding(l: FacetBuilder): void {
  const H = HALL;
  const ue = H.u1 - H.wall / 2;
  hallWall(l, true, H.u0 + H.wall / 2, H.v0, H.v1, H.h);
  hallWall(l, false, H.v0 + H.wall / 2, H.u0, H.u1, H.h);
  hallWall(l, false, H.v1 - H.wall / 2, H.u0, H.u1, H.h);
  // La façade sur le quai : trois pans pleins entre les baies, et le linteau au-dessus des deux.
  const [[a0, a1], [b0, b1]] = H.doors;
  for (const [from, to] of [
    [H.v0, a0],
    [a1, b0],
    [b1, H.v1],
  ] as const)
    hallWall(l, true, ue, from, to, H.h);
  l.box({ x: ue, y: H.doorH, z: (a0 + b1) / 2 }, [H.wall, H.h - H.doorH, b1 - a0], C.brickShade, C.brick);
  for (const [from, to] of H.doors) {
    // L'ombre de la baie, un peu en retrait ; la porte, ouverte à plat contre la façade, au nord de sa baie.
    l.plate({ x: ue - 0.05, y: 0, z: (from + to) / 2, yaw: Math.PI / 2 }, [
      [-(to - from) / 2, QUAY_TOP],
      [(to - from) / 2, QUAY_TOP],
      [(to - from) / 2, H.doorH],
      [-(to - from) / 2, H.doorH],
    ], C.hollow);
    l.box({ x: H.u1 + 0.1, y: QUAY_TOP - 0.02, z: from - (to - from) / 2 - 0.05 }, [0.16, H.doorH - QUAY_TOP - 0.05, to - from - 0.1], C.newShade, C.newWood);
    l.box({ x: H.u1 + 0.19, y: QUAY_TOP + 0.5, z: from - (to - from) / 2 - 0.05 }, [0.04, 0.14, to - from - 0.2], C.iron);
  }
}

/** Le toit de la halle (le haut) : ses deux pignons de brique, ses deux pans de tôle brun gris, un peu débordants. */
function hallRoof(l: FacetBuilder): void {
  const H = HALL;
  const um = (H.u0 + H.u1) / 2;
  const half = (H.u1 - H.u0) / 2;
  for (const v of [H.v0 + H.wall, H.v1]) l.extrude({ x: um, y: H.h, z: v - H.wall }, [[-half, 0], [half, 0], [0, H.ridge]], H.wall, C.brickShade, C.brick);
  const o = 0.35;
  const ridge = H.h + H.ridge + 0.1;
  // Les deux pans, de l'avant-toit (débordant de `o`) au faîte.
  const e = H.h + 0.1 - (o * H.ridge) / half;
  slab(l, [[H.u0 - o, e, H.v0 - o], [H.u0 - o, e, H.v1 + o], [um, ridge, H.v1 + o], [um, ridge, H.v0 - o]], 0.1, C.sheetShade, C.sheet);
  slab(l, [[um, ridge, H.v0 - o], [um, ridge, H.v1 + o], [H.u1 + o, e, H.v1 + o], [H.u1 + o, e, H.v0 - o]], 0.1, C.sheetShade, C.sheet);
}

/**
 * La halle en ruine : ses murs debout à des hauteurs inégales (1,3 à 2,3), le pignon sud bas ; un pan de toit couché en
 * biais à l'intérieur ; ses deux grandes portes couchées sur le quai, devant leurs baies.
 */
function hallRuin(l: FacetBuilder): void {
  const H = HALL;
  const ue = H.u1 - H.wall / 2;
  const uw = H.u0 + H.wall / 2;
  for (const [from, to, h] of [
    [H.v0, -8.5, 1.6],
    [-8.5, -3.5, 2.3],
    [-3.5, H.v1, 1.3],
  ] as const)
    hallWall(l, true, uw, from, to, h);
  hallWall(l, false, H.v0 + H.wall / 2, H.u0, H.u1, 2.0);
  hallWall(l, false, H.v1 - H.wall / 2, H.u0, 7.6, 1.0);
  hallWall(l, false, H.v1 - H.wall / 2, 7.6, H.u1, 0.6);
  const [[a0, a1], [b0, b1]] = H.doors;
  for (const [from, to, h] of [
    [H.v0, a0, 2.2],
    [a1, b0, 1.7],
    [b1, H.v1, 1.4],
  ] as const)
    hallWall(l, true, ue, from, to, h);
  // Les têtes de mur cassées en gradins : un dernier rang de brique au bout de trois pans.
  for (const [u, v, len, h] of [
    [uw, -10.2, 2.4, 1.6],
    [uw, -4.6, 1.6, 2.3],
    [ue, -12.2, 1.4, 2.2],
  ] as const)
    l.box({ x: u, y: h - 0.02, z: v }, [H.wall, 0.5, len], C.brickShade, C.brick);
  // Le pan de toit tombé : de la tête du mur ouest jusqu'au sol, en biais.
  slab(l, [[5.0, 1.5, -11.4], [5.0, 1.5, -6.2], [8.6, 0.05, -6.6], [8.6, 0.05, -11.8]], 0.08, C.rust, C.rustTop);
  // Les deux grandes portes, couchées sur le quai.
  for (const [[from, to], yaw] of [
    [H.doors[0], 0.12],
    [H.doors[1], -0.18],
  ] as const)
    l.box({ x: H.u1 + 1.6, y: QUAY_TOP - 0.02, z: (from + to) / 2, yaw }, [2.4, 0.16, to - from], C.woodShade, C.wood);
}

// ---------- Le quai ----------

/** Le quai de pierre grise : son parement sur l'eau, ses deux joints d'assise, sa margelle ; toujours là. */
function quay(l: FacetBuilder): void {
  const Q = QUAY;
  const len = Q.v1 - Q.v0,
    vm = (Q.v0 + Q.v1) / 2;
  l.box({ x: (Q.u0 + Q.u1) / 2, y: WATER - 0.5, z: vm }, [Q.u1 - Q.u0, QUAY_TOP - WATER + 0.5, len], C.stone, C.stoneSun);
  // Les assises du parement, sur l'eau : deux joints sombres, en long.
  for (const y of [QUAY_TOP - 0.42, WATER + 0.3])
    l.quad([Q.u1 + 0.006, y, Q.v1], [Q.u1 + 0.006, y, Q.v0], [Q.u1 + 0.006, y + 0.07, Q.v0], [Q.u1 + 0.006, y + 0.07, Q.v1], C.joint);
  // La margelle, au bord de l'eau, un cran plus haute.
  l.box({ x: Q.u1 - 0.35, y: QUAY_TOP - 0.05, z: vm }, [0.75, 0.15, len + 0.02], C.stoneShade, C.stoneSun);
}

/** Les planches du quai : entières (`whole`), ou dans la ruine, en trois morceaux. */
function planks(l: FacetBuilder, whole: boolean): void {
  const P = PLANKS;
  const parts = whole ? [P.whole] : P.ruin;
  for (const [a, c] of parts) l.box({ x: (P.u0 + P.u1) / 2, y: QUAY_TOP - 0.02, z: (a + c) / 2 }, [P.u1 - P.u0, P.t + 0.02, c - a], whole ? C.newShade : C.woodShade, whole ? C.newWood : C.wood);
}

/**
 * La grande bitte du quai, de fer rouillé brun éteint, et sur son flanc ouest le support de fer vide et ses deux goujons
 * nus (le signe de l'absence du 4e) : la même avant et après.
 */
function bollard(l: FacetBuilder): void {
  const B = BOLLARD;
  l.prism({ x: B.u, y: QUAY_TOP - 0.3, z: B.v }, B.r, B.r * 0.9, B.h + 0.3, 8, C.rust, C.rustTop);
  l.prism({ x: B.u, y: QUAY_TOP + B.h, z: B.v }, B.r + 0.12, B.r + 0.12, 0.14, 8, C.rust, C.rustTop);
  l.box({ x: B.u - B.r - 0.02, y: QUAY_TOP + 0.24, z: B.v }, [0.1, 0.46, 0.46], C.rust, C.rustTop);
  for (const dv of [-0.12, 0.12]) l.box({ x: B.u - B.r - 0.2, y: QUAY_TOP + 0.43, z: B.v + dv }, [0.28, 0.08, 0.08], C.ironTop);
}

/** Une bitte neuve, de fer bruni (les abords). */
function smallBollard(l: FacetBuilder, u: number, v: number): void {
  l.prism({ x: u, y: QUAY_TOP - 0.3, z: v }, 0.26, 0.24, 0.85, 6, C.iron, C.ironTop);
}

/** La lanterne du magasinier, sur son poteau, au coin sud-est de la halle : la seule allumée de la ruine. */
function keeperLantern(l: FacetBuilder): void {
  const L = KEEPER_LANTERN;
  l.box({ x: L.u, y: SINK, z: L.v }, [0.2, QUAY_TOP + L.h - SINK, 0.2], C.woodShade, C.wood);
  l.beam({ x: L.u, y: QUAY_TOP + L.h - 0.1, z: L.v }, { x: L.u + 0.5, y: QUAY_TOP + L.h - 0.1, z: L.v }, 0.08, C.woodShade);
  lantern(l, { x: L.u + 0.5, y: QUAY_TOP + L.h - 0.14, z: L.v }, true);
}

// ---------- Le navire ----------

/** Le contour du pont du navire (dans son repère : `x` de la poupe à la proue, vers le nord ; `z` vers le bassin). */
function hullOutline(w: number): (readonly [number, number])[] {
  const h = SHIP.half;
  return [
    [-h, -w],
    [-h, w],
    [h - 3.4, w],
    [h - 1.3, w * 0.7],
    [h, 0],
    [h - 1.3, -w * 0.7],
    [h - 3.4, -w],
  ];
}

/**
 * Le cargo des Passeurs, dans son repère (le pont à `freeboard` au-dessus de l'eau, en 0) : sa coque de fer rivetée (deux
 * rangées de rivets par bord), son pont de bois, son hiloire et sa cale (ouverte, ou couverte de panneaux), sa timonerie
 * basse à l'arrière et sa cheminée courte, sans fumée. `restored` : le fer bruni ; sinon la rouille brune.
 */
function cargo(l: FacetBuilder, restored: boolean): void {
  const S = SHIP;
  const side = restored ? C.iron : C.rust;
  const sideTop = restored ? C.ironTop : C.rustTop;
  const top = hullOutline(S.beam).map(([x, z]) => [x, S.freeboard, z] as P3);
  const bot = hullOutline(S.beam * 0.82).map(([x, z]) => [x * 0.97, -S.draught, z] as P3);
  const n = top.length;
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    l.quad(bot[k], bot[m], top[m], top[k], side);
  }
  for (let k = 1; k < n - 1; k++) l.triangle(top[0], top[k], top[k + 1], C.deck);
  // Le liston, sous le bord du pont, et les rivets : deux rangées sur chaque bord droit.
  for (const s of [-1, 1]) {
    const z = s * (S.beam + 0.012);
    const flip = (q: P3[]): P3[] => (s > 0 ? q : [q[1], q[0], q[3], q[2]]);
    const [a, c, d, e] = flip([
      [-S.half, S.freeboard - 0.28, z],
      [S.half - 3.4, S.freeboard - 0.28, z],
      [S.half - 3.4, S.freeboard - 0.12, z],
      [-S.half, S.freeboard - 0.12, z],
    ]);
    l.quad(a, c, d, e, sideTop);
    for (const y of [S.freeboard - 0.55, S.freeboard - 0.95])
      for (let i = 0; i < 9; i++) {
        const x = -S.half + 0.9 + i * 1.3;
        const zz = s * (S.beam - ((S.freeboard - y) * S.beam * 0.18) / (S.freeboard + S.draught) + 0.03);
        const [p, q, r, t] = flip([
          [x - 0.07, y - 0.07, zz],
          [x + 0.07, y - 0.07, zz],
          [x + 0.07, y + 0.07, zz],
          [x - 0.07, y + 0.07, zz],
        ]);
        l.quad(p, q, r, t, sideTop);
      }
  }
  // L'hiloire de la cale, au milieu du pont ; ouverte (l'ombre de la cale, et deux panneaux de travers sur le pont), ou
  // couverte de ses panneaux de bois.
  const hatch = { x: 1.2, w: 4.2, d: 3.0 };
  l.box({ x: hatch.x, y: S.freeboard - 0.05, z: 0 }, [hatch.w, 0.45, hatch.d], side, restored ? C.newWood : C.hollow);
  if (restored) for (const dx of [-1.05, 0, 1.05]) l.box({ x: hatch.x + dx, y: S.freeboard + 0.4, z: 0 }, [0.12, 0.06, hatch.d + 0.02], C.newShade);
  else
    for (const [x, z, yaw] of [
      [-2.2, -0.9, 0.35],
      [-2.0, 0.9, -0.2],
    ] as const)
      l.box({ x, y: S.freeboard + 0.02, z, yaw }, [1.1, 0.1, 1.5], C.woodShade, C.wood);
  // La timonerie de bois, à la poupe : ses vitres sombres face à la proue ; la cheminée courte et ronde, devant elle,
  // sans fumée (jamais une cheminée d'usine : correction du mainteneur).
  const wh = { x: -S.half + 1.6, w: 2.2, d: 3.0, h: 1.9 };
  l.box({ x: wh.x, y: S.freeboard, z: 0 }, [wh.w, wh.h, wh.d], restored ? C.newShade : C.woodShade, sideTop);
  l.box({ x: wh.x, y: S.freeboard + wh.h, z: 0 }, [wh.w + 0.3, 0.12, wh.d + 0.3], side, sideTop);
  l.plate({ x: wh.x + wh.w / 2 + 0.006, y: S.freeboard, z: 0, yaw: Math.PI / 2 }, [
    [-1.1, 1.05],
    [1.1, 1.05],
    [1.1, 1.55],
    [-1.1, 1.55],
  ], C.glass);
  const funnel = { x: -S.half + 3.7, r: 0.4, h: 1.5 };
  l.prism({ x: funnel.x, y: S.freeboard - 0.05, z: 0 }, funnel.r, funnel.r * 0.92, funnel.h, 8, side, C.hollow);
  l.band({ x: funnel.x, y: S.freeboard + funnel.h - 0.45, z: 0 }, funnel.r * 0.94, 0.2, 8, restored ? C.stoneSun : C.stone);
}

/** Le navire posé le long du quai : redressé, ou gîtant vers le bassin (la ruine), sans jamais couler. */
function ship(l: FacetBuilder, restored: boolean): void {
  // Dans son repère, `x` vers la proue : un quart de tour l'aligne sur le quai (la proue au nord) ; la gîte, autour de `x`.
  drawPosed(l, { x: SHIP.u, y: WATER, z: SHIP.v, yaw: Math.PI / 2, pitch: restored ? 0 : SHIP.list }, (q) => cargo(q, restored));
}

/** Le bord du pont du navire côté quai, au point `v` (pour les amarres), selon sa gîte. */
const shipRail = (v: number, restored: boolean): P3 => {
  const lift = restored ? 0 : SHIP.beam * Math.sin(SHIP.list);
  return [SHIP.u - SHIP.beam + 0.2, WATER + SHIP.freeboard + lift - 0.05, v];
};

// ---------- La ruine : les débris ----------

/** Les cinq caisses éparpillées, chacune son motif ; la cinquième posée en travers sur la quatrième. */
const RUIN_CRATES: readonly { u: number; v: number; s: number; yaw: number; motif: Motif; on?: true }[] = [
  { u: 12.5, v: -4.6, s: 0.9, yaw: 0.3, motif: 'stripes' },
  { u: 15.5, v: -8.2, s: 0.85, yaw: 0.7, motif: 'diamond' },
  { u: 13.6, v: -11.6, s: 1.0, yaw: -0.2, motif: 'chevrons' },
  { u: 13.6, v: -11.6, s: 0.75, yaw: 0.5, motif: 'circle', on: true },
  { u: 11.9, v: 6.6, s: 0.9, yaw: -0.4, motif: 'diamond' },
];

/** Le chariot à bras renversé, ses roues en l'air, au bout sud du quai. */
const CART = { u: 13.2, v: 8.4, yaw: 0.4 } as const;

function cart(l: FacetBuilder): void {
  const g = qGround(CART.u, CART.v);
  drawPosed(l, { x: CART.u, y: g, z: CART.v, yaw: CART.yaw }, (q) => {
    q.box({ x: 0, y: -0.1, z: 0 }, [1.0, 0.45, 1.5], C.woodShade, C.wood);
    q.beam({ x: -0.6, y: 0.48, z: -0.2 }, { x: 0.6, y: 0.48, z: -0.2 }, 0.08, C.rust);
    for (const s of [-1, 1]) {
      q.drum({ x: s * 0.62 - (s > 0 ? 0 : 0.1), y: 0.48, z: -0.2, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.36, 0.1, 6, C.woodShade, C.wood);
      q.beam({ x: s * 0.36, y: 0.32, z: 0.7 }, { x: s * 0.36, y: 0.18, z: 1.7 }, 0.08, C.woodShade);
    }
  });
}

/** Le filet de chargement en tas, sur le quai. */
function netHeap(l: FacetBuilder): void {
  l.prism({ x: 16.0, y: DECK_TOP - 0.05, z: -5.4, yaw: 0.3 }, 0.8, 0.35, 0.35, 6, C.rope, C.rope);
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const corps = { stage: 0 as const, row: 0 };
  const abords = { stage: 2 as const, row: 0 };

  // Toujours là : le quai et sa margelle, la grande bitte et son support vide, la lanterne du magasinier.
  add('ruine', 0, (b) =>
    inQuay(b, (l) => {
      quay(l);
      bollard(l);
      keeperLantern(l);
    }),
  );

  // ---- La ruine ----
  // Le corps la relève : la halle cassée, son toit tombé, ses portes couchées ; le chariot renversé.
  add(
    'ruine',
    0,
    (b) =>
      inQuay(b, (l) => {
        hallRuin(l);
        cart(l);
      }),
    corps,
  );
  // Les abords la relèvent : les planches arrachées, le navire qui gîte, sa cale ouverte ; les caisses et le filet.
  add(
    'ruine',
    0,
    (b) =>
      inQuay(b, (l) => {
        planks(l, false);
        ship(l, false);
        const rope = shipRail(BOLLARD.v + 0.4, false);
        l.beam({ x: rope[0], y: rope[1], z: rope[2] }, { x: BOLLARD.u + 0.1, y: QUAY_TOP + BOLLARD.h - 0.2, z: BOLLARD.v }, 0.06, C.rope);
        for (const c of RUIN_CRATES) {
          const onQuay = c.v <= QUAY.v1;
          const y = c.on ? DECK_TOP + 0.97 : onQuay ? DECK_TOP - 0.03 : qGround(c.u, c.v) - 0.03;
          crate(l, { x: c.u, y, z: c.v }, c.s, c.yaw, c.motif);
        }
        netHeap(l);
      }),
    abords,
  );

  // ---- Le corps : la halle debout, ses portes ouvertes contre la façade.
  add(0, 0, (b) => inQuay(b, hallStanding));
  // ---- Le haut : le toit de tôle ; la poutre de chargement basse sur ses deux poteaux, sa poulie et son crochet ; la
  // lanterne de la halle, allumée dès qu'elle est posée (jamais à une réussite).
  add(1, 0, (b) =>
    inQuay(b, (l) => {
      hallRoof(l);
      const B = BEAM;
      for (const u of [B.u0, B.u1]) l.box({ x: u, y: QUAY_TOP - 0.3, z: B.v }, [0.3, B.h + 0.3, 0.3], C.newShade, C.newWood);
      l.box({ x: (B.u0 + B.u1) / 2, y: QUAY_TOP + B.h, z: B.v }, [B.u1 - B.u0 + 0.6, 0.34, 0.34], C.newShade, C.newWood);
      l.drum({ x: B.pulley, y: QUAY_TOP + B.h - 0.3, z: B.v - 0.08, yaw: 0, pitch: Math.PI / 2 }, 0.24, 0.16, 6, C.iron, C.ironTop);
      l.box({ x: B.pulley + 0.24, y: QUAY_TOP + 2.3, z: B.v }, [0.05, B.h - 2.6, 0.05], C.rope);
      l.box({ x: B.pulley + 0.24, y: QUAY_TOP + 2.05, z: B.v }, [0.18, 0.26, 0.08], C.iron);
      l.box({ x: HALL.u1 + 0.25, y: QUAY_TOP + 2.95, z: -6.35 }, [0.5, 0.07, 0.07], C.iron);
      lantern(l, { x: HALL.u1 + 0.45, y: QUAY_TOP + 2.95, z: -6.35 }, true);
    }),
  );
  // ---- Les abords : le quai refait ; le navire redressé, couvert ; les bittes neuves et les amarres ; deux filets pendus
  // au pignon sud de la halle ; la lanterne du chemin.
  add(2, 0, (b) =>
    inQuay(b, (l) => {
      planks(l, true);
      ship(l, true);
      for (const p of SMALL_BOLLARDS) {
        smallBollard(l, p.u, p.v);
        const r = shipRail(p.v + (p.v < 0 ? 1.2 : -1.2), true);
        l.beam({ x: r[0], y: r[1], z: r[2] }, { x: p.u, y: QUAY_TOP + 0.45, z: p.v }, 0.06, C.rope);
      }
      const r = shipRail(BOLLARD.v + 0.4, true);
      l.beam({ x: r[0], y: r[1], z: r[2] }, { x: BOLLARD.u + 0.1, y: QUAY_TOP + BOLLARD.h - 0.2, z: BOLLARD.v }, 0.06, C.rope);
      for (const u of [6.0, 8.8]) {
        const v = HALL.v1 + 0.02;
        l.plate({ x: u, y: 0, z: v }, [
          [-0.75, 0.9],
          [0.75, 0.9],
          [0.55, 2.55],
          [-0.55, 2.55],
        ], C.rope);
        l.box({ x: u, y: 2.55, z: v + 0.05 }, [1.3, 0.08, 0.1], C.woodShade);
      }
      const P = PATH_LANTERN;
      const g = qGround(P.u, P.v);
      l.box({ x: P.u, y: g - 0.3, z: P.v }, [0.12, P.h + 0.3, 0.12], C.iron);
      lantern(l, { x: P.u, y: g + P.h + 0.02, z: P.v }, true, 0.85);
    }),
  );
}

// ---------- Les traces ----------

/** Dessine dans le repère du quai, puis pose le dessin au centre du lieu (`c`), dans le monde. */
const traceInQuay = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => inWorld(b, c, draw, QUAY_YAW);

/** Où se pose chaque trace, dans le repère du quai ; aucune sur un chemin. */
const TRACE_SPOTS = {
  urbanization: { u: HALL.u1 + 0.45, v: -0.9 },
  mobilities: { u: 13.8, v: -8.7 },
  globalization: { u: EDGE - 2.1, v: -3.9 },
} as const;

/** Un diable de bois à deux roues, debout contre le mur de la halle, au coin sud-est (L'urbanisation du monde). */
function handTruck(b: FacetBuilder, c: Vec3): void {
  traceInQuay(b, c, (l) => {
    const { u, v } = TRACE_SPOTS.urbanization;
    const y = DECK_TOP;
    for (const dv of [-0.24, 0.24]) l.beam({ x: u + 0.35, y: y + 0.2, z: v + dv }, { x: u - 0.05, y: y + 1.45, z: v + dv }, 0.08, C.newShade);
    l.beam({ x: u + 0.2, y: y + 0.85, z: v - 0.26 }, { x: u + 0.2, y: y + 0.85, z: v + 0.26 }, 0.06, C.newShade);
    l.box({ x: u + 0.5, y, z: v }, [0.32, 0.05, 0.56], C.iron);
    for (const dv of [-0.33, 0.33]) l.drum({ x: u + 0.38, y: y + 0.2, z: v + dv - 0.04, yaw: 0, pitch: Math.PI / 2 }, 0.2, 0.08, 6, C.iron, C.newWood);
  });
}

/**
 * Trois bagages côte à côte sous la poutre, dans le désordre (jamais en escalier : correction 3 du directeur artistique) :
 * un sac de toile, une malle bombée, une valise plate (Les mobilités humaines).
 */
function luggage(b: FacetBuilder, c: Vec3): void {
  traceInQuay(b, c, (l) => {
    const { u, v } = TRACE_SPOTS.mobilities;
    const y = DECK_TOP;
    l.prism({ x: u - 0.85, y, z: v, yaw: 0.3 }, 0.3, 0.2, 0.55, 6, C.canvas, C.canvas);
    l.beam({ x: u - 0.85, y: y + 0.55, z: v }, { x: u - 0.85, y: y + 0.66, z: v + 0.02 }, 0.08, C.rope);
    l.box({ x: u, y, z: v, yaw: 0.05 }, [0.62, 0.45, 0.9], C.trunk, C.trunk);
    l.gableRoof({ x: u, y: y + 0.45, z: v, yaw: Math.PI / 2 + 0.05 }, 0.9, 0.62, 0.18, C.trunk, C.trunk);
    for (const dv of [-0.28, 0.28]) l.box({ x: u, y: y - 0.01, z: v + dv, yaw: 0.05 }, [0.66, 0.47, 0.06], C.iron);
    l.box({ x: u + 0.8, y, z: v + 0.1, yaw: -0.15 }, [0.48, 0.22, 0.72], C.leather, C.leather);
    l.box({ x: u + 0.8, y: y + 0.22, z: v + 0.1, yaw: -0.15 }, [0.06, 0.07, 0.26], C.iron);
  });
}

/** Un filet de chargement plein de caisses à motifs, posé sur le quai au bord du navire (Mers, ports et mondialisation). */
function cargoNet(b: FacetBuilder, c: Vec3): void {
  traceInQuay(b, c, (l) => {
    const { u, v } = TRACE_SPOTS.globalization;
    const y = DECK_TOP;
    l.prism({ x: u, y: y - 0.02, z: v, yaw: 0.2 }, 1.05, 0.95, 0.12, 6, C.rope, C.rope);
    crate(l, { x: u - 0.35, y: y + 0.08, z: v - 0.3 }, 0.62, 0.15, 'stripes');
    crate(l, { x: u + 0.38, y: y + 0.08, z: v + 0.15 }, 0.62, -0.25, 'circle');
    crate(l, { x: u - 0.02, y: y + 0.7, z: v - 0.08 }, 0.56, 0.4, 'chevrons');
    for (const s of [-1, 1]) l.beam({ x: u + s * 0.8, y: y + 0.08, z: v }, { x: u + s * 0.1, y: y + 1.35, z: v - 0.05 }, 0.05, C.rope);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : des objets du quai, jamais la notion. */
const TRACES = {
  urbanization: { at: quayToLocal(TRACE_SPOTS.urbanization.u, TRACE_SPOTS.urbanization.v), lift: 1, stage: 0, row: 0, draw: handTruck },
  mobilities: { at: quayToLocal(TRACE_SPOTS.mobilities.u, TRACE_SPOTS.mobilities.v), lift: 1, stage: 1, row: 0, draw: luggage },
  globalization: { at: quayToLocal(TRACE_SPOTS.globalization.u, TRACE_SPOTS.globalization.v), lift: 1, stage: 2, row: 0, draw: cargoNet },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention, § 6) : le long du quai, vers le nord ; la halle à gauche, le
 * navire à droite, la poutre au fond. Elle regarde vers −(sin cap, cos cap) : le `−v` du quai.
 */
const SCENE_START = QUAY_YAW;

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le magasinier) : le `+u` du quai. */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, dans le repère du quai : sur les planches, au sud de la bitte, devant la halle. */
const SCENE_QUAY = { u: 14.3, v: 3.4 } as const;
const SCENE_AT = quayToLocal(SCENE_QUAY.u, SCENE_QUAY.v);
const SCENE_SPOT = { dx: SCENE_AT.x, dz: SCENE_AT.z, half: [2.3, 1.1] as [number, number] } as const;

/** L'écart de Kéo et du magasinier au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène (les planches du quai) au-dessus du plus haut du sol sous elle (questionScene.ts). */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return DECK_TOP - top;
})();

/** Le magasinier en pion (son modèle 3D prend sa place) : bottes, pantalon, veste moutarde. */
function keeper(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.28, 0.24, 0.42, 8, C.jacket);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.jacket);
}

/** La planche des caisses sur ses tréteaux : sa hauteur, le cran d'une caisse choisie, le côté d'une caisse. */
const BOARD = { height: 0.5, lift: 0.3, crate: 0.4 } as const;

export const SOUTE: PlaceArt = {
  role: 'Le magasinier',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse (intention, § 6) : le quai est plat, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : le quai, la bitte et son support vide, la halle sont au lieu ; les abords (./souteSurroundings.ts)
  // ajoutent des tonneaux et une glène. Il reste le magasinier en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) keeper(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.crate, half: BOARD.crate / 2 + 0.02 },
    facing: true,
    // Une planche sur deux tréteaux, sous la rangée des caisses.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.5 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.45 * s], C.woodShade);
      }
    },
    // Une petite caisse de bois clair, sans motif ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur).
    object(b, at, s, _i, _count, picked) {
      b.box({ x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, [BOARD.crate * s, BOARD.crate * s, BOARD.crate * s], C.answer, C.answerTop);
    },
  },
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers le quai.
  exit: { x: DOOR_AT.x + 0.8, z: DOOR_AT.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Soute, pour les tests et ses abords : le repère du quai, la halle, le quai, le navire, la caméra. */
export const SOUTE_LAYOUT = {
  quayYaw: QUAY_YAW,
  quayToLocal,
  localToQuay,
  edge: EDGE,
  quay: QUAY,
  quayTop: QUAY_TOP,
  deckTop: DECK_TOP,
  hall: HALL,
  ship: SHIP,
  water: WATER,
  bollard: BOLLARD,
  beam: BEAM,
  keeperLantern: KEEPER_LANTERN,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorLook: DOOR_LOOK,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneQuay: SCENE_QUAY,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  /** Le bois des tonneaux et la corde (ses abords en posent). */
  colors: { wood: C.newWood, woodShade: C.newShade, iron: C.iron, rope: C.rope },
} as const;
