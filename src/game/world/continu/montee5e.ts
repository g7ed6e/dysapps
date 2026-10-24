// La Montée finie (GD-22, lot 3, « le lieu central fini, comme témoin de qualité » ; intention du directeur artistique
// du 19 octobre 2026, planche de rendu de près validée par le mainteneur). La plus haute aiguille de l'île (./spire5e.ts),
// au centre, et sur sa face sud le rail gradué, le cœur du lieu : ses encoches, son trait de zéro au ras de l'eau, ses
// poulies au sommet, sa lanterne d'ocre. À ne pas confondre avec la cabine, qui roule sur son propre rail à chevalets, de
// sa gare du pied, au nord-est, jusqu'au plateau (./bridges.ts) : il n'y a qu'une caisse, celle du passage.
//
// Avant : une belle ruine en chantier (le rail de bois gris cassé aux trois cinquièmes, son bout qui pend, la lanterne
// éteinte au bout ; l'échafaudage au pied, l'échelle, les cordes, les planches, un godet tombé). Le corps : le rail
// remonté en trois travées de bois neuf, le bas, le milieu, puis le haut (la cassure disparaît). Le haut : les poulies du
// sommet, puis la lanterne d'ocre, dessinée sans ombre comme celle du Phare (sa couleur, `COLORS_5E.lantern`, que la vue
// du 5e dessine sans ombre) : elle s'allume quand le haut est posé, jamais à une réussite. Les abords : le bassin de
// pierre au pied, puis le ponton d'approche et ses deux lanternes ; l'échafaudage part. La scénette, partagée par les cinq
// missions, se tient au pied, sur un plancher devant le bassin, face au trait de zéro : Kéo, la fontainière, et une
// rangée de godets pendus à une poutre, un par réponse, sans chiffre ni signe ; le godet choisi penche. Chaque mission
// réussie laisse une trace sans figure, posée avec le haut. Rien à lire dans la 3D. Code pur (placeArt.ts).
import { FacetBuilder, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, DialShown, PlaceArt, SiteGround, Sphere } from './placeArt';
import { hangingLantern, lowRock, mangroveTree, rootArch } from './monteeSurroundings';
import { COLORS_5E } from './plan5e';
import { tuft } from './surroundingsKit';
import { spire, spireRadiusAt, type Spire } from './spire5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
const SINK = -0.8;

/**
 * La hauteur de la Montée au-dessus de son pied : la plus haute aiguille, qui dépasse la canopée de toute l'île (retouche
 * du lot 2 : 46 ne suffisait pas depuis la Lisière).
 */
export const MONTEE_HEIGHT = 60;

/** Le rayon du pied de la Montée, et ses pans (un pan regarde le sud, où se pose le rail). */
const MONTEE_RADIUS = 7.5;
const MONTEE_SIDES = 7;

/** L'aiguille de la Montée, dans son repère. */
const SPIRE: Spire = {
  x: 0,
  y: SINK,
  z: 0,
  radius: MONTEE_RADIUS,
  height: MONTEE_HEIGHT - SINK,
  sides: MONTEE_SIDES,
  turn: Math.PI / 2 + Math.PI / MONTEE_SIDES,
};

/**
 * Les couleurs de la Montée : la palette du lot 2 (la pierre, l'eau des racines, l'ocre), le bois gris de la ruine, le
 * bois neuf du rail remonté (un brun désaturé, plus chaud que le gris), le bronze, la corde. Rien de presque noir.
 */
const C = {
  stone: COLORS_5E.stone,
  stoneShade: COLORS_5E.stoneShade,
  stoneSun: COLORS_5E.stoneSun,
  moss: COLORS_5E.plateauMoss,
  water: COLORS_5E.water,
  lantern: COLORS_5E.lantern,
  // Le bois gris de la ruine et son ombre (comme au 6e : délavé, jamais sombre).
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  // Le bois neuf du rail : la planche, ses montants, ses encoches (un brun d'ombre, jamais noir). Des tons gris-bruns :
  // la lumière chaude du 5e (sky.ts, `LIGHT_5E`) les tire vers le brun ; à l'écran, la planche au soleil donne un bois
  // brun désaturé autour de #A87A50 (première relecture du lot 3 : #B0763F donnait un orange, #BA6E18), les encoches
  // un brun sombre autour de #554031. L'orange reste à la lueur et à la lanterne.
  newWood: 0xa68672,
  newShade: 0x8c766a,
  notch: 0x605658,
  // Le trait de zéro passé, puis repeint (la trace du Thermomètre) : un crème franc, jamais le blanc pur.
  zeroFaded: 0xa99f8b,
  zero: 0xefe3c2,
  // Le bronze éteint de la ruine, le bronze relevé des poulies et de la lanterne.
  bronzeWorn: 0x9c8452,
  bronze: 0xb8954f,
  // La vitre éteinte de la lanterne : un gris-vert clair, proche de la brume.
  glassOff: 0xbfc4b8,
  // Le fer des chaînes et des cerclages : un gris chaud, jamais noir.
  iron: 0x6f6a60,
  ironLight: 0x8a8478,
  rope: 0xd8c49a,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  // Les godets : leur bois, leur cercle de fer.
  bucket: 0xa9784a,
  bucketShade: 0x8a6440,
  // La fontainière (concept habitant-fontainiere) : chemise sarcelle, tablier de cuir, pantalon bleu, bottes grises,
  // cheveux bruns, louche de laiton, chaîne de cuivre.
  shirt: 0x3f9aa0,
  apron: 0xb8743f,
  apronShade: 0x9c6034,
  trousers: 0x2f4e6e,
  boots: 0x55595a,
  hair: 0x5a3826,
  head: 0xe3b48a,
  brass: 0xd4a93a,
  chain: 0xa0703a,
} as const;

/** Le rail gradué : l'écart de ses deux montants, la largeur de sa planche, son épaisseur, le pas de ses encoches. */
const RAIL = { gauge: 0.9, board: 1.5, thick: 0.18, notch: 1.5, top: 0.74 } as const;

/** Le bas du rail (sous l'eau du bassin), les limites de ses trois travées, son haut (aux trois quarts de l'aiguille). */
export const RAIL_SPANS = [-0.5, 14, 29, MONTEE_HEIGHT * RAIL.top] as const;

/** La cassure du rail de la ruine : sa hauteur et le vide qu'elle laisse. */
const BREAK = { at: MONTEE_HEIGHT * 0.6, gap: 1.3 } as const;

/** Le bassin de pierre au pied du rail (dans le repère du lieu) : ses bords, la hauteur de sa margelle et de son eau. */
const BASIN = { x0: -5.2, x1: 5.2, z0: 6.2, z1: 11.4, rim: 0.5, wall: 0.45, water: 0.16 } as const;

/** Le trait de zéro, au ras de l'eau du bassin. */
const ZERO = BASIN.water + 0.02;

/** Le ponton d'approche : du chemin, au sud, jusqu'au pied du rail ; sa demi-largeur, son plancher, ses deux lanternes (au bout nord). */
const PONTOON = { half: 1.1, from: 13.6, to: 8.1, deck: 0.5, lantern: 8.7 } as const;

/** Les poulies du sommet : leur rayon, leur avancée devant le rail, leur écart. */
const PULLEY = { r: 0.55, out: 1.5, spread: 0.75 } as const;

/** La lanterne d'ocre, au-dessus des poulies : son pied au-dessus du haut du rail, son rayon, sa hauteur. */
const LANTERN = { lift: 1.2, r: 0.42, h: 0.8, out: 0.7 } as const;

/** Le devant de la pierre de la face sud à la hauteur `y` (dans le repère du lieu), où se pose le dos du rail. */
function railFace(y: number): number {
  return spireRadiusAt(SPIRE, y - SINK) * Math.cos(Math.PI / MONTEE_SIDES) + 0.3;
}

/** Le devant de la planche du rail à la hauteur `y`. */
const boardFront = (y: number): number => railFace(y) + RAIL.thick;

/**
 * Une planche penchée contre la pierre, de `y0` à `y1`, en `x`, de demi-largeur `half` et d'épaisseur `thick` : sa face,
 * ses deux chants et son dessus (six triangles et deux ; le dos contre la pierre ne se voit jamais).
 */
function slab(b: FacetBuilder, x: number, half: number, y0: number, y1: number, out: number, thick: number, face: number, side: number): void {
  const z0 = railFace(y0) + out;
  const z1 = railFace(y1) + out;
  const p = (dx: number, y: number, z: number) => [x + dx, y, z] as const;
  b.quad(p(-half, y0, z0 + thick), p(half, y0, z0 + thick), p(half, y1, z1 + thick), p(-half, y1, z1 + thick), face);
  b.quad(p(half, y0, z0), p(half, y1, z1), p(half, y1, z1 + thick), p(half, y0, z0 + thick), side);
  b.quad(p(-half, y0, z0 + thick), p(-half, y1, z1 + thick), p(-half, y1, z1), p(-half, y0, z0), side);
  b.quad(p(-half, y1, z1 + thick), p(half, y1, z1 + thick), p(half, y1, z1), p(-half, y1, z1), side);
}

/** Les deux montants du rail, de `y0` à `y1` (bois gris de la ruine, ou neuf). */
function uprights(b: FacetBuilder, y0: number, y1: number, color: number, t = 0.42): void {
  for (const x of [-RAIL.gauge, RAIL.gauge]) b.beam({ x, y: y0, z: railFace(y0) + t / 2 }, { x, y: y1, z: railFace(y1) + t / 2 }, t, color);
}

/** Une travée neuve du rail : la planche, ses montants, ses encoches (une plus longue tous les cinq crans), sans chiffre. */
function newSpan(b: FacetBuilder, y0: number, y1: number): void {
  slab(b, 0, RAIL.board / 2, y0, y1, 0, RAIL.thick, C.newWood, C.newShade);
  uprights(b, y0, y1, C.newShade, 0.3);
  const first = Math.ceil((y0 - ZERO) / RAIL.notch);
  for (let k = first; ZERO + k * RAIL.notch < y1 - 0.2; k++) {
    if (k === 0) continue;
    const y = ZERO + k * RAIL.notch;
    const long = k % 5 === 0;
    const w = long ? 1.1 : 0.6;
    b.box({ x: -RAIL.board / 2 + w / 2, y, z: boardFront(y) - 0.04 }, [w, 0.12, 0.12], C.notch);
  }
}

/** Le trait de zéro : une bande en travers de la planche, au ras de l'eau, un peu plus large qu'elle. */
function zeroMark(b: FacetBuilder, color: number, lift = 0): void {
  b.box({ x: 0, y: ZERO - 0.11, z: boardFront(ZERO) - 0.08 + lift }, [RAIL.board + 0.5, 0.22, 0.2 + lift], color);
}

/** La lanterne au bout du rail, sur son bras : sa cage de bronze, sa vitre (éteinte ou d'ocre), son toit pointu. */
function lantern(b: FacetBuilder, glass: number, frame: number): void {
  const y = RAIL_SPANS[3] + LANTERN.lift;
  const z = railFace(y) + LANTERN.out;
  b.beam({ x: 0, y: y - 0.3, z: railFace(y) }, { x: 0, y: y - 0.3, z: z }, 0.16, frame);
  b.prism({ x: 0, y, z }, LANTERN.r, LANTERN.r, LANTERN.h, 6, glass);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    b.box({ x: Math.cos(a) * (LANTERN.r + 0.04), y, z: z + Math.sin(a) * (LANTERN.r + 0.04) }, [0.09, LANTERN.h, 0.09], frame);
  }
  b.prism({ x: 0, y: y + LANTERN.h, z, yaw: Math.PI / 4 }, LANTERN.r + 0.22, 0, 0.6, 4, frame);
}

/** Le haut du rail : la potence en travers, ses deux poulies de bronze (des roues debout, face au sud). */
function pulleys(b: FacetBuilder): void {
  const y = RAIL_SPANS[3] - 0.4;
  const z = railFace(y);
  b.beam({ x: -1.6, y, z: z + 0.2 }, { x: 1.6, y, z: z + 0.2 }, 0.32, C.newShade);
  for (const side of [-1, 1]) {
    b.beam({ x: side * PULLEY.spread, y, z: z + 0.2 }, { x: side * PULLEY.spread, y, z: z + PULLEY.out + 0.2 }, 0.22, C.newShade);
    b.drum({ x: side * PULLEY.spread - 0.1, y: y - PULLEY.r * 0.2, z: z + PULLEY.out, pitch: Math.PI / 2, yaw: Math.PI / 2 }, PULLEY.r, 0.2, 8, C.bronze, C.bronze);
  }
}

/** Le point où pend ce qui passe sur une poulie (`side` : −1 à l'ouest, +1 à l'est), devant elle. */
function pulleyRim(side: number): Vec3 {
  const y = RAIL_SPANS[3] - 0.4;
  return { x: side * (PULLEY.spread + PULLEY.r), y: y - PULLEY.r * 0.2, z: railFace(y) + PULLEY.out };
}

/** Un godet : un seau de bois évasé, son cercle de fer, son anse ; `tilt` le penche de côté autour de son anse. */
function bucket(b: FacetBuilder, at: Vec3, s: number, tilt = 0, colors: { body: number; shade: number } = { body: C.bucket, shade: C.bucketShade }): void {
  const n = 8;
  const h = 0.46 * s;
  const r0 = 0.24 * s;
  const r1 = 0.32 * s;
  // L'anse : le point d'attache, au-dessus du seau ; le seau tourne autour de lui (autour de l'axe z, de côté).
  const pivot = { x: at.x, y: at.y + h + 0.18 * s };
  const c = Math.cos(tilt),
    sn = Math.sin(tilt);
  const turn = (x: number, y: number, z: number) => {
    const dx = x - pivot.x,
      dy = y - pivot.y;
    return [pivot.x + dx * c - dy * sn, pivot.y + dx * sn + dy * c, z] as const;
  };
  const ring = (r: number, y: number) => Array.from({ length: n }, (_, k) => turn(at.x + r * Math.cos((2 * Math.PI * k) / n + 0.2), y, at.z + r * Math.sin((2 * Math.PI * k) / n + 0.2)));
  const lo = ring(r0, at.y);
  const mid = ring((r0 + r1) / 2 + 0.012 * s, at.y + h * 0.45);
  const mid2 = ring((r0 + r1) / 2 + 0.012 * s, at.y + h * 0.6);
  const hi = ring(r1, at.y + h);
  const inner = ring(r1 * 0.86, at.y + h * 0.8);
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(lo[m], lo[k], hi[k], hi[m], k % 2 ? colors.body : colors.shade);
    // Le cercle de fer, à mi-hauteur.
    b.quad(mid[m], mid[k], mid2[k], mid2[m], C.iron);
    // Le dedans, vu par le haut : un fond plus sombre, sous le bord.
    b.quad(hi[m], hi[k], inner[k], inner[m], colors.shade);
  }
  const bottom = turn(at.x, at.y, at.z);
  for (let k = 0; k < n; k++) b.triangle(bottom, lo[k], lo[(k + 1) % n], colors.shade);
  // L'anse : deux brins de fer, du bord au point d'attache.
  const top = turn(pivot.x, pivot.y, at.z);
  for (const side of [-1, 1]) {
    const [x, y, z] = turn(at.x + side * r1, at.y + h, at.z);
    b.beam({ x, y, z }, { x: top[0], y: top[1], z: top[2] }, 0.04 * s, C.iron);
  }
}

/**
 * Le sol de forêt du lieu (première relecture du lot 3 : le pied de l'aiguille et la clairière du sud étaient nus), dans
 * le repère du lieu, le sud vers +z. Au pied de l'aiguille, trois racines en arceaux qui sortent de la pierre, hors du
 * rail et de la gare de la cabine. Dans la clairière, au sud du chemin, des plaques de litière, des touffes de mousse
 * basses ; sur ses bords seulement, des roches basses et des arceaux : rien de haut dans l'anneau de la scénette.
 */
/** Le palétuvier à la lanterne, à l'ouest du ponton, dans le repère du lieu : sa place, sa taille, son cap. */
const LANTERN_TREE = { x: -9.4, z: 8.1, s: 1.15, yaw: 0.3 } as const;

const FLOOR = {
  // Les racines du pied : de la pierre (le rayon du pied de l'aiguille, un peu dedans) vers le dehors, et leur hauteur.
  footRoots: [
    [Math.PI, 3.8, 1.4],
    [2.5, 3.2, 1.1],
    [0.45, 3.6, 1.2],
  ],
  footFrom: 6.3,
  // Les plaques de litière de la clairière : leur milieu et leur rayon.
  litter: [
    [-4.5, 20, 1.8],
    [3.5, 23, 2.1],
    [-10, 22.5, 1.6],
    [9, 20.5, 1.7],
    [-1, 27, 1.9],
    [11.5, 26, 1.5],
  ],
  tufts: [
    [-8.6, -2],
    [-9.6, 3],
    [7.9, -1.2],
    [8.8, 6.4],
    [-6, 18],
    [-3, 21.6],
    [2.5, 19],
    [6, 22.6],
    [-9, 24.2],
    [10, 18.8],
    [0.5, 25.6],
    [-13, 20],
    [13.5, 23.6],
    [4, 28],
  ],
  // Les bords de la clairière : roches basses (rayon, hauteur), arceaux (d'un pied à l'autre, hauteur).
  rocks: [
    [-16, 19, 1.3, 0.55],
    [15, 17.6, 1.1, 0.45],
    [-12.5, 27, 1.0, 0.4],
    [17, 24, 1.2, 0.5],
  ],
  arches: [
    [-19, 21, -16.6, 24.4, 1.3],
    [18.4, 19.6, 20, 23.2, 1.2],
    [-6, 29, -2.6, 29.6, 1.0],
  ],
  litterColor: 0x6e6a52,
} as const;

function forestFloor(b: FacetBuilder, ground: SiteGround): void {
  const at = (x: number, z: number) => ground.at(x, z);
  for (const [a, len, h] of FLOOR.footRoots) {
    const from = { x: FLOOR.footFrom * Math.cos(a), z: FLOOR.footFrom * Math.sin(a) };
    const to = { x: (FLOOR.footFrom + len) * Math.cos(a + 0.12), z: (FLOOR.footFrom + len) * Math.sin(a + 0.12) };
    rootArch(b, from, to, h, 0.34, at);
  }
  // La litière : un disque à sept pans, irrégulier, à peine au-dessus du sol.
  FLOOR.litter.forEach(([cx, cz, r], i) => {
    const n = 7;
    const y = (x: number, z: number) => at(x, z) + 0.05;
    const c: [number, number, number] = [cx, y(cx, cz), cz];
    const ring = Array.from({ length: n }, (_, k) => {
      const ang = (2 * Math.PI * (k + 0.3 * Math.sin(i * 3 + k))) / n;
      const rr = r * (0.75 + 0.25 * Math.cos(i * 5 + k * 2));
      const x = cx + rr * Math.cos(ang),
        z = cz + rr * Math.sin(ang);
      return [x, y(x, z), z] as [number, number, number];
    });
    for (let k = 0; k < n; k++) b.triangle(c, ring[(k + 1) % n], ring[k], FLOOR.litterColor);
  });
  FLOOR.tufts.forEach(([x, z], i) => tuft(b, { x, y: at(x, z) - 0.02, z }, i + 31, [COLORS_5E.mossSun, COLORS_5E.plateauMoss], 1.2));
  FLOOR.rocks.forEach(([x, z, r, h], i) => lowRock(b, { x, y: at(x, z) - 0.1, z }, r, h, i + 51));
  for (const [x0, z0, x1, z1, h] of FLOOR.arches) rootArch(b, { x: x0, z: z0 }, { x: x1, z: z1 }, h, 0.3, at);
}

/** Le dessus d'un godet pendu, au-dessus de son fond, à l'échelle 1 : là où sa corde rejoint son anse. */
const BUCKET_TOP = 0.64;

/**
 * Les volumes de la Montée, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; `door` :
 * sa porte, au sud, sur le chemin.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const top = RAIL_SPANS[3];
  // L'aiguille, toujours là.
  add('ruine', 0, (b) => {
    spire(b, SPIRE);
  });
  // Le sol de forêt, toujours là : les racines au pied de l'aiguille, la clairière du sud et ses bords.
  add('ruine', 0, (b) => forestFloor(b, ground));
  // Le palétuvier de l'ouest et sa lanterne pendue (planche, vue du haut) : éteinte dans la ruine, d'ocre avec le haut,
  // comme la lanterne du sommet ; au lieu, pour qu'on les voie toutes les deux de loin.
  const T = LANTERN_TREE;
  const tree = new FacetBuilder();
  const { branch } = mangroveTree(tree, T.x, T.z, T.s, T.yaw, (x, z) => ground.at(x, z));
  add('ruine', 0, (b) => b.append(tree.build()));
  add('ruine', 0, (b) => hangingLantern(b, branch, false), { stage: 1, row: 0.5 });
  add(1, 0.5, (b) => hangingLantern(b, branch, true));
  // Le rail de la ruine, en bois gris, par travées : chacune s'en va quand la travée neuve se pose à sa place. La
  // troisième porte la cassure, le vide, le haut resté accroché et son bout qui pend.
  add('ruine', 0, (b) => uprights(b, RAIL_SPANS[0], RAIL_SPANS[1], C.wornShade), { stage: 0, row: 0 });
  add('ruine', 0, (b) => uprights(b, RAIL_SPANS[1], RAIL_SPANS[2], C.wornShade), { stage: 0, row: 0.34 });
  add(
    'ruine',
    0,
    (b) => {
      uprights(b, RAIL_SPANS[2], BREAK.at, C.wornShade);
      uprights(b, BREAK.at + BREAK.gap, top, C.wornWood, 0.38);
      b.beam({ x: RAIL.gauge, y: BREAK.at + BREAK.gap, z: railFace(BREAK.at) + 0.6 }, { x: 2.6, y: BREAK.at - 3.5, z: railFace(BREAK.at) + 1.4 }, 0.35, C.wornWood);
    },
    { stage: 0, row: 0.67 },
  );
  // Le trait de zéro passé, à peine lisible, sur le bas du rail de la ruine.
  add('ruine', 0, (b) => zeroMark(b, C.zeroFaded), { stage: 0, row: 0 });
  // La lanterne éteinte, au bout du rail : le haut la rallume.
  add('ruine', 0, (b) => lantern(b, C.glassOff, C.bronzeWorn), { stage: 1, row: 0 });
  // Le chantier au pied du rail : l'échafaudage (quatre poteaux, deux planchers), l'échelle qui y monte, les cordes
  // tendues jusqu'au sol, la pile de planches, un godet tombé. Les abords l'enlèvent.
  add(
    'ruine',
    0,
    (b) => {
      const z0 = railFace(0) + 0.55;
      const z1 = z0 + 1.3;
      const tall = 6.2;
      for (const x of [-2.1, 2.1])
        for (const z of [z0, z1]) {
          const g = ground.at(x, z);
          b.beam({ x, y: g - 0.3, z }, { x, y: tall, z }, 0.2, C.wornShade);
        }
      for (const y of [2.6, tall - 0.1]) {
        b.box({ x: 0, y, z: (z0 + z1) / 2 }, [4.6, 0.12, 1.5], C.wornShade, C.wornWood);
        b.beam({ x: -2.1, y: y - 0.9, z: z1 }, { x: 2.1, y: y + 0.6, z: z1 }, 0.1, C.wornWood);
      }
      // L'échelle, à l'ouest, posée contre le plancher du haut.
      const foot = { x: -3.1, z: z1 + 1.6 };
      const gy = ground.at(foot.x, foot.z);
      for (const dx of [-0.25, 0.25]) b.beam({ x: foot.x + dx, y: gy - 0.1, z: foot.z }, { x: -2.6 + dx, y: tall, z: z1 }, 0.09, C.wornWood);
      for (let k = 1; k < 8; k++) {
        const u = k / 8;
        const y = gy + (tall - gy) * u;
        const x = foot.x + (-2.6 - foot.x) * u;
        const z = foot.z + (z1 - foot.z) * u;
        b.beam({ x: x - 0.25, y, z }, { x: x + 0.25, y, z }, 0.06, C.wornWood);
      }
      // Deux cordes, du haut de l'échafaudage à deux piquets.
      for (const [x, z] of [
        [4.4, 9.4],
        [-4.6, 8.6],
      ] as const) {
        const g = ground.at(x, z);
        b.beam({ x: Math.sign(x) * 2.1, y: tall, z: z0 }, { x, y: g + 0.35, z }, 0.05, C.rope);
        b.beam({ x, y: g - 0.2, z }, { x, y: g + 0.45, z }, 0.12, C.wornShade);
      }
      // La pile de planches, à l'est, hors du plancher de la scène.
      const pile = { x: 6.6, z: 8.6 };
      const py = ground.at(pile.x, pile.z);
      for (let k = 0; k < 4; k++) b.box({ x: pile.x + (k % 2) * 0.12, y: py - 0.1 + k * 0.16, z: pile.z, yaw: 0.25 + 0.06 * k }, [3.2, 0.16, 0.5], C.wornShade, C.wornWood);
      // Le godet tombé, couché sur le flanc, à l'ouest.
      const fall = { x: -6.2, z: 9.2 };
      const fy = ground.at(fall.x, fall.z);
      b.prism({ x: fall.x, y: fy + 0.3, z: fall.z, yaw: 0.7, pitch: Math.PI / 2 - 0.15 }, 0.3, 0.38, 0.5, 8, C.wornShade, C.wornWood);
    },
    { stage: 2, row: 0 },
  );
  // Le corps : le rail remonté, en trois travées de bois neuf, du bas vers le haut ; le trait de zéro à son pied.
  add(0, 0, (b) => {
    newSpan(b, RAIL_SPANS[0], RAIL_SPANS[1]);
    zeroMark(b, C.zeroFaded, 0.02);
  });
  add(0, 0.34, (b) => newSpan(b, RAIL_SPANS[1], RAIL_SPANS[2]));
  add(0, 0.67, (b) => newSpan(b, RAIL_SPANS[2], top));
  // Le haut : les poulies du sommet, puis la lanterne d'ocre, allumée dès qu'elle est posée (jamais à une réussite).
  add(1, 0, (b) => pulleys(b));
  add(1, 0.5, (b) => lantern(b, C.lantern, C.bronze));
  // Les abords : le bassin de pierre au pied du rail (sa margelle, son eau calme), puis le ponton d'approche sur ses pieux
  // et ses deux lanternes d'ocre, du chemin jusqu'au pied du rail.
  add(2, 0, (b) => {
    const B = BASIN;
    const g = ground.foot((B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2, 4);
    const low = g.low - 0.4;
    const rimTop = g.top + B.wall;
    const water = g.top + B.water;
    const w = B.x1 - B.x0;
    const d = B.z1 - B.z0;
    b.box({ x: (B.x0 + B.x1) / 2, y: low, z: B.z1 - B.rim / 2 }, [w, rimTop - low, B.rim], C.stoneShade, C.stoneSun);
    b.box({ x: (B.x0 + B.x1) / 2, y: low, z: B.z0 + B.rim / 2 }, [w, rimTop - low, B.rim], C.stoneShade, C.stoneSun);
    for (const x of [B.x0 + B.rim / 2, B.x1 - B.rim / 2]) b.box({ x, y: low, z: (B.z0 + B.z1) / 2 }, [B.rim, rimTop - low, d - 2 * B.rim], C.stoneShade, C.stoneSun);
    b.quad([B.x0 + B.rim, water, B.z1 - B.rim], [B.x1 - B.rim, water, B.z1 - B.rim], [B.x1 - B.rim, water, B.z0 + B.rim], [B.x0 + B.rim, water, B.z0 + B.rim], C.water);
  });
  add(2, 0.5, (b) => {
    const P = PONTOON;
    const y = ground.foot(0, (P.from + P.to) / 2, 1).top + P.deck;
    const len = P.from - P.to;
    const n = 9;
    for (let k = 0; k < n; k++) {
      const z = P.to + (len * (k + 0.5)) / n;
      b.box({ x: 0, y: y - 0.1, z }, [2 * P.half, 0.1, len / n - 0.06], C.plankShade, C.plank);
    }
    for (const x of [-P.half + 0.12, P.half - 0.12]) b.beam({ x, y: y - 0.2, z: P.to }, { x, y: y - 0.2, z: P.from }, 0.2, C.plankShade);
    for (let k = 0; k <= 3; k++) {
      const z = P.to + (len * k) / 3;
      for (const x of [-P.half + 0.12, P.half - 0.12]) b.box({ x, y: ground.at(x, z) - 0.5, z }, [0.18, y - ground.at(x, z) + 0.4, 0.18], C.plankShade);
    }
    // Les deux lanternes, de part et d'autre du bout nord, au pied du rail (derrière la scène de la scénette) : un poteau,
    // une vitre d'ocre, un chapeau de bronze.
    for (const x of [-P.half - 0.15, P.half + 0.15]) {
      b.box({ x, y: y - 0.1, z: P.lantern }, [0.14, 1.3, 0.14], C.newShade);
      b.box({ x, y: y + 1.2, z: P.lantern }, [0.3, 0.32, 0.3], C.lantern);
      b.prism({ x, y: y + 1.52, z: P.lantern, yaw: Math.PI / 4 }, 0.26, 0, 0.24, 4, C.bronze);
    }
  });
}

// ---------- La scénette ----------

/** Le plancher de la scène : sa demi-largeur, sa profondeur, sa hauteur au-dessus du sol le plus haut sous lui. */
const SCENE_FLOOR = { half: 4.6, depth: 2.6, rise: 0.62 } as const;

/** Le milieu de la scène, depuis le centre du lieu : devant le bassin, face au trait de zéro. */
const SCENE_SPOT = { dx: 0, dz: 10.7 } as const;

/**
 * La fontainière (concept habitant-fontainiere), immobile, le visage nu : ses bottes, son pantalon bleu, sa chemise
 * sarcelle, son tablier de cuir et sa ceinture, la chaîne de cuivre à sa ceinture, la louche de laiton à la main, ses
 * cheveux bruns noués. Sans `body`, rien (son modèle 3D prendra sa place, ./habitants.ts).
 */
function fontainiere(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.32, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.27, 0.26, 0.48, 8, C.shirt);
  // Le tablier, devant elle (vers la caméra, au sud), de la poitrine aux genoux ; sa ceinture.
  b.box({ x: at.x, y: at.y + 0.3, z: at.z + 0.24 }, [0.44, 0.62, 0.06], C.apronShade, C.apron);
  b.box({ x: at.x, y: at.y + 0.68, z: at.z + 0.01 }, [0.56, 0.06, 0.52], C.bucketShade);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  // Les cheveux : une calotte posée haut, le visage nu devant, et le nœud derrière.
  sphere(b, { x: at.x, y: at.y + 1.19, z: at.z - 0.04 }, 0.21, 8, 3, C.hair);
  sphere(b, { x: at.x, y: at.y + 1.08, z: at.z - 0.2 }, 0.07, 6, 4, C.hair);
  // Les bras : le droit le long du corps, le gauche (vers l'est) un peu écarté, la louche à la main.
  b.beam({ x: at.x - 0.3, y: at.y + 0.94, z: at.z }, { x: at.x - 0.36, y: at.y + 0.5, z: at.z + 0.04 }, 0.12, C.shirt);
  b.beam({ x: at.x + 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + 0.42, y: at.y + 0.52, z: at.z + 0.1 }, 0.12, C.shirt);
  b.beam({ x: at.x + 0.42, y: at.y + 0.5, z: at.z + 0.12 }, { x: at.x + 0.46, y: at.y + 0.2, z: at.z + 0.18 }, 0.05, C.brass);
  b.prism({ x: at.x + 0.46, y: at.y + 0.12, z: at.z + 0.18 }, 0.06, 0.11, 0.09, 6, C.brass);
  // La chaîne de cuivre, pendue à la ceinture, à droite.
  b.beam({ x: at.x - 0.16, y: at.y + 0.68, z: at.z + 0.27 }, { x: at.x - 0.2, y: at.y + 0.42, z: at.z + 0.3 }, 0.05, C.chain);
}

/** Le plancher de la scène : des planches sur des pieux, du sol jusqu'à la hauteur de la scène. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const n = 6;
  for (let k = 0; k < n; k++) {
    const x = floor.x - F.half + ((k + 0.5) * 2 * F.half) / n;
    b.box({ x, y: floor.y - 0.16, z: floor.z }, [(2 * F.half) / n - 0.05, 0.16, F.depth], C.plankShade, C.plank);
  }
  for (const dx of [-F.half + 0.25, 0, F.half - 0.25])
    for (const dz of [-F.depth / 2 + 0.2, F.depth / 2 - 0.2]) {
      const x = floor.x + dx,
        z = floor.z + dz;
      const g = standingHeight(heightAt5e({ x, z }));
      b.box({ x, y: g - 0.4, z }, [0.2, floor.y - g + 0.25, 0.2], C.plankShade);
    }
}

/** La poutre des godets : sa hauteur au-dessus de la rangée, à l'échelle 1 ; la section de ses poteaux. */
const BEAM = { height: 1.55, post: 0.16 } as const;

/** Le sol (à sa hauteur où l'on se tient) en un point du lieu, depuis son centre, dans le monde. */
function groundOf(c: Vec3, dx: number, dz: number): Vec3 {
  const x = c.x + dx,
    z = c.z + dz;
  return { x, y: standingHeight(heightAt5e({ x, z })), z };
}

/** Le haut du sol du centre jusqu'au point du lieu `y` (le repère du lieu, dans le monde). */
const lifted = (c: Vec3, x: number, y: number, z: number): Vec3 => ({ x: c.x + x, y: c.y + y, z: c.z + z });

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const MONTEE_TRACE_SPOTS = {
  thermometer: { x: 0, z: 7.4 },
  adding: { x: 1.9, z: 7.4 },
  fractions: { x: 0, z: 6 },
  'order-of-operations': { x: -2.2, z: 6.6 },
  'conversions-angles': { x: -1.8, z: 5 },
} as const;

/** La chaîne à godets (Plus et moins, `adding`) : de la poulie de l'est jusque dans le bassin, tendue, ses godets pendus tous les quatre pas. */
function bucketChain(b: FacetBuilder, c: Vec3): void {
  const from = pulleyRim(1);
  const toY = ZERO - 0.3;
  const to = { x: from.x, y: toY, z: railFace(0) + PULLEY.out };
  b.beam(lifted(c, from.x, from.y, from.z), lifted(c, to.x, to.y, to.z), 0.09, C.iron);
  b.beam(lifted(c, from.x - 0.25, from.y, from.z - 0.2), lifted(c, to.x - 0.25, to.y, to.z - 0.2), 0.07, C.ironLight);
  const n = 10;
  for (let k = 1; k <= n; k++) {
    const u = k / (n + 1);
    const y = to.y + (from.y - to.y) * u;
    const z = to.z + (from.z - to.z) * u;
    bucket(b, lifted(c, from.x + 0.3, y - 0.62, z + 0.05), 0.75);
  }
}

/**
 * Les ancres des câbles partagés (première relecture du lot 3 : des blocs au bout d'une corde se lisaient comme des poids
 * pendus) : une dalle de pierre basse, enfoncée dans le sol (sous son point le plus bas, elle ne flotte jamais), son
 * anneau de bronze debout dessus, assez grand pour se voir de la caméra du lieu ; le câble descend jusqu'à l'anneau.
 */
const ANCHOR = { x: 7.4, z: 7.2, slab: [1.7, 1.2] as const, rise: 0.16, ring: 0.3 } as const;

/** Les câbles partagés des poulies (Fractions, `fractions`) : du bloc des poulies, deux câbles vers deux ancres au sol, de part et d'autre du bassin. */
function sharedCables(b: FacetBuilder, c: Vec3): void {
  const y = RAIL_SPANS[3] - 0.4;
  const hub = { x: 0, y: y + 0.1, z: railFace(y) + PULLEY.out };
  const [w, d] = ANCHOR.slab;
  for (const side of [-1, 1]) {
    const x = side * ANCHOR.x;
    const g = groundOf(c, x, ANCHOR.z);
    // Le sol le plus bas et le plus haut sous la dalle : elle s'y enfonce, son dessus juste au-dessus du plus haut.
    let low = g.y,
      high = g.y;
    for (const dx of [-w / 2, w / 2])
      for (const dz of [-d / 2, d / 2]) {
        const h = groundOf(c, x + dx, ANCHOR.z + dz).y;
        low = Math.min(low, h);
        high = Math.max(high, h);
      }
    const top = high + ANCHOR.rise;
    b.box({ x: g.x, y: low - 0.3, z: g.z, yaw: side * 0.25 }, [w, top - low + 0.3, d], C.stoneShade, C.stoneSun);
    // L'anneau de bronze, debout sur la dalle, face au sud (la caméra du lieu le voit rond) ; son piton.
    const ring = { x: g.x - side * 0.15, y: top + ANCHOR.ring + 0.04, z: g.z };
    b.box({ x: ring.x, y: top - 0.02, z: ring.z }, [0.16, 0.08, 0.16], C.bronze);
    b.annulus({ x: ring.x, y: ring.y, z: ring.z - 0.04, pitch: Math.PI / 2 }, ANCHOR.ring - 0.1, ANCHOR.ring, 0.08, 8, C.bronze);
    b.beam(lifted(c, hub.x + side * 0.3, hub.y, hub.z), { x: ring.x, y: ring.y + ANCHOR.ring, z: ring.z }, 0.06, C.rope);
  }
}

/**
 * Les contrepoids équilibrés (Priorités ; première relecture du lot 3 : une pierre à chaque poulie, à la même hauteur) :
 * de chaque poulie, un bras court vers le dehors, au-delà de la chaîne à godets à l'est et de la cuve jaugée à l'ouest ;
 * à son bout, une corde et une pierre ronde, les deux à la même hauteur.
 */
const COUNTERWEIGHT = { arm: 3, hang: 30 } as const;

function counterweights(b: FacetBuilder, c: Vec3): void {
  const y = RAIL_SPANS[3] - 0.4;
  const z0 = railFace(y) + PULLEY.out;
  const z1 = railFace(COUNTERWEIGHT.hang) + PULLEY.out;
  for (const side of [-1, 1]) {
    const x = side * COUNTERWEIGHT.arm;
    b.beam(lifted(c, side * PULLEY.spread, y, z0), lifted(c, x + side * 0.1, y, z0), 0.16, C.newShade);
    b.beam(lifted(c, x, y, z0), lifted(c, x, COUNTERWEIGHT.hang + 0.9, z1), 0.06, C.rope);
    b.drum({ x: c.x + x, y: c.y + COUNTERWEIGHT.hang, z: c.z + z1, pitch: Math.PI / 2 }, 0.48, 0.42, 8, C.stone, C.stoneSun);
    b.band({ x: c.x + x, y: c.y + COUNTERWEIGHT.hang + 0.82, z: c.z + z1, pitch: Math.PI / 2 }, 0.12, 0.05, 6, C.bronze);
  }
}

/** La cuve jaugée du sommet (Mesures et angles) : une cuve de bois sur sa console, à l'ouest des poulies, ses trois cercles de jauge. */
function gaugedVat(b: FacetBuilder, c: Vec3): void {
  const y = RAIL_SPANS[3] - 1.4;
  const z = railFace(y) + 0.9;
  const x = -2.1;
  b.beam(lifted(c, x + 0.4, y - 0.1, railFace(y)), lifted(c, x + 0.4, y - 0.1, z + 0.4), 0.18, C.newShade);
  b.prism({ x: c.x + x, y: c.y + y, z: c.z + z }, 0.62, 0.7, 1.0, 8, C.bucket, C.water);
  for (const k of [0.25, 0.5, 0.75]) b.band({ x: c.x + x, y: c.y + y + k, z: c.z + z }, 0.63 + 0.08 * k + 0.01, 0.05, 8, C.iron);
}

/** Le trait de zéro repeint (Thermomètre) : la bande crème, franche, sur le trait passé. */
function zeroRepainted(b: FacetBuilder, c: Vec3): void {
  const f = new FacetBuilder();
  zeroMark(f, C.zero, 0.05);
  const z = f.build();
  for (let i = 0; i < z.positions.length; i += 3) {
    z.positions[i] += c.x;
    z.positions[i + 1] += c.y;
    z.positions[i + 2] += c.z;
  }
  b.append(z);
}

/**
 * L'échelle graduée du geste « régler » (GD-26, Plus et moins) : dressée entre Kéo et la
 * fontainière, au-devant du plancher (avis du directeur artistique : au moins 40 % de la hauteur), un échelon par nombre de −10 à 10 (`step` entre deux) ; seuls le zéro (crème, large) et les dizaines
 * (bronze) se distinguent, sans rien d'écrit. `back` : son recul derrière le milieu de la scène (négatif : en avant) ; `foot` : la hauteur du
 * premier échelon au-dessus du plancher ; `half` : la demi-largeur entre ses montants.
 */
const LADDER = { back: -1.15, foot: -0.35, step: 0.21, half: 0.55, bucket: 1.3 } as const;

/**
 * Le réglage de la Montée : l'échelle, la cheville d'ocre au départ, et le godet posé sur l'échelon réglé (sa forme
 * et sa place le disent, jamais sa couleur seule). `c` : le centre du lieu à son sol.
 */
function ladderFacets(c: Vec3, { count, min, max, start }: DialShown): Facets {
  const b = new FacetBuilder();
  const L = LADDER;
  const F = SCENE_FLOOR;
  // Le plancher : au-dessus du sol le plus haut sous lui, comme la scène le pose.
  let top = -Infinity;
  for (const dx of [-F.half, 0, F.half]) for (const dz of [-F.depth / 2, 0, F.depth / 2]) top = Math.max(top, groundOf(c, SCENE_SPOT.dx + dx, SCENE_SPOT.dz + dz).y);
  const floorY = top + F.rise;
  const x = c.x + SCENE_SPOT.dx;
  const z = c.z + SCENE_SPOT.dz - L.back;
  const g = groundOf(c, SCENE_SPOT.dx, SCENE_SPOT.dz - L.back).y;
  const rungY = (n: number) => floorY + L.foot + (n - min) * L.step;
  const head = rungY(max) + 0.3;
  // Les deux montants de fer, plantés dans le sol : sombres, ils détachent l'échelle du bois du chantier derrière.
  for (const side of [-1, 1]) b.box({ x: x + side * L.half, y: g + SINK, z }, [0.14, head - g - SINK, 0.14], C.iron);
  for (let n = min; n <= max; n++) {
    const mark = n === 0 ? { w: 1.5, h: 0.12, color: C.zero } : n % 10 === 0 ? { w: 1.2, h: 0.1, color: C.bronze } : { w: 2 * L.half, h: 0.06, color: C.plank };
    b.box({ x, y: rungY(n) - mark.h / 2, z }, [mark.w, mark.h, 0.08], mark.color);
  }
  // La cheville d'ocre, à gauche de l'échelon de départ : d'où part le bond.
  b.box({ x: x - L.half - 0.2, y: rungY(start) - 0.07, z: z + 0.04 }, [0.34, 0.14, 0.16], C.lantern);
  // Le godet, devant l'échelle, posé sur l'échelon réglé.
  bucket(b, { x, y: rungY(count) + 0.03, z: z + 0.36 }, L.bucket);
  return b.build();
}

export const MONTEE: PlaceArt = {
  role: 'La fontainière',
  model,
  traceStage: 1,
  // La scène : un plancher de planches devant le bassin, face au trait de zéro ; l'aiguille derrière, le rail au milieu.
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [SCENE_FLOOR.half, SCENE_FLOOR.depth / 2], fine: true },
  site: {
    rise: SCENE_FLOOR.rise,
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.3, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) fontainiere(b, at, sphere);
  },
  answer: {
    size: { height: BEAM.height, half: 0.4 },
    // La poutre des godets : deux poteaux plantés au bout de la rangée, la poutre en travers, au-dessus des godets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BEAM.height * s;
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.25);
        b.box({ x, y: Math.min(ground, y) - 0.3, z }, [BEAM.post, top - Math.min(ground, y) + 0.4, BEAM.post], C.plankShade);
      }
      b.box({ x: mid, y: top, z }, [span + 0.8, 0.16, 0.18], C.plankShade, C.plank);
    },
    // Un godet pendu à sa corde ; choisi, il penche de côté (sa forme le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      const top = at.y + BEAM.height * s;
      const foot = { x: at.x, y: at.y + 0.42 * s, z: at.z };
      b.beam({ x: at.x, y: top, z: at.z }, { x: at.x, y: foot.y + BUCKET_TOP * s, z: at.z }, 0.04 * s, C.rope);
      bucket(b, foot, s, picked ? 0.5 : 0);
    },
  },
  // Les cinq missions en R : le plancher seul, rien de l'item ; les godets portent les réponses.
  rest() {},
  dial: ladderFacets,
  traces: {
    thermometer: { at: MONTEE_TRACE_SPOTS.thermometer, lift: 1, draw: zeroRepainted },
    adding: { at: MONTEE_TRACE_SPOTS.adding, lift: 4, draw: bucketChain },
    fractions: { at: MONTEE_TRACE_SPOTS.fractions, lift: 4, draw: sharedCables },
    'order-of-operations': { at: MONTEE_TRACE_SPOTS['order-of-operations'], lift: 4, draw: counterweights },
    'conversions-angles': { at: MONTEE_TRACE_SPOTS['conversions-angles'], lift: 4, draw: gaugedVat },
  },
  // Kéo au retour : sur le chemin, à l'est de la porte, face au rail.
  exit: { x: 3, z: 14.6 },
};

/**
 * La lueur de la Montée restaurée (intention, § 2 : « une lueur d'ocre monte une seule fois le long du rail, du zéro au
 * sommet, lentement ») : une bande de la couleur de la lanterne, sans ombre, posée sur la planche ; la vue la fait monter,
 * dans le repère du lieu, de `from` à `to`, en suivant la pierre (`railFace`). Son origine est son milieu, en bas.
 */
export const MONTEE_GLOW = { from: ZERO, to: RAIL_SPANS[3], seconds: 3.2, height: 2.4 } as const;

export function monteeGlowBand(): Facets {
  const b = new FacetBuilder();
  b.box({ x: 0, y: 0, z: 0 }, [RAIL.board + 0.1, MONTEE_GLOW.height, 0.06], C.lantern);
  return b.build();
}

/** Le devant de la planche à la hauteur `y` du lieu : là où la vue pose la lueur. */
export const monteeGlowFront = (y: number): number => boardFront(y) + 0.04;
