// La Nef du 5e, le dirigeable (GD-22, lot 4 ; GD-21, la Nef en trois temps ; intention du directeur artistique du
// 19 octobre 2026, et sa retouche) : dans l'anse de la Lisière, sur un ber de bois, le long du ponton, la proue vers le
// large ; immobile à quai. Ses trois temps : la nacelle (la coque du voilier) et sa lanterne, là dès l'arrivée (la
// grille la reprend de la forme d'avant, `kept`) ; l'enveloppe et ses cordes ; le gouvernail en croix, fixé sur
// l'enveloppe. Ce qui ne sert plus au voilier est rangé sur le ponton, près de la Nef (la voile pliée, le mât et la
// vergue couchés), et part quand sa sœur touche le ber (world/nefModels.ts, `NEF_SISTERS`). Son obstacle, au nord,
// au-delà des Aiguilles, en mer : le mur de nuages, des cumulus pleins et épaulés, immobiles, plus hauts que les
// aiguilles ; derrière lui, le panache du 4e, des boules de fumée empilées. Le départ : la Nef monte en biais au ras des
// cimes, vire au nord et file vers le mur, à l'écart de la Montée ; dès qu'elle vire, le mur s'ouvre en brèche (les deux
// cumulus du milieu glissent l'un vers l'ouest, l'autre vers l'est, et tout le mur recule) ; elle passe par la brèche, à
// côté du panache, sur le ciel clair. Code pur.
import { FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { LISIERE_PONTON } from './lisiere';
import { berLocal, type BerColors, type NefFlight, type NefLook, type NefSite } from './nef';
import { ANSE_5E, QUAY_5E } from './plan5e';
import { SHADOW_DIR_5E } from './sky';

/** Les parties du dirigeable (ses os) qui arrivent à chaque temps : la nacelle et sa lanterne, l'enveloppe et ses cordes, le gouvernail. */
export const NEF_5E_TEMPS = { 1: ['coque', 'lanterne'], 2: ['ballon', 'suspentes'], 3: ['empennage'] } as const satisfies Readonly<Record<1 | 2 | 3, readonly string[]>>;

/**
 * Le modèle du dirigeable (`2-dirigeable/final-1704.glb`) : à l'échelle du voilier (la coque est la même : la nacelle à
 * la hauteur de Kéo, l'enveloppe au-dessus), le milieu de sa coque (x de 1,3 à 3,7, z de 1,4 à 6,9 ; la proue vers −z).
 */
const MODEL = { scale: 0.65, center: { x: 2.5, z: 4.15 } } as const;

/**
 * La hauteur de la Nef sur son ber, comme au 6e (directeur artistique, retouche du lot 4 : la nacelle levée, les couples
 * en V visibles sous elle).
 */
const LIFT = { ber: 0.85 } as const;

/** Le poste, dans le repère de l'anse : à gauche du ponton (vers la rive), le long de lui, la proue vers son bout. */
const BERTH_LOCAL = { x: LISIERE_PONTON.x + 2.5, z: 25 } as const;

/** Le poste dans le monde : la proue suit `z` du repère de l'anse, vers le bout du ponton et le large. */
const BERTH = (() => {
  const p = ANSE_5E.toWorld(BERTH_LOCAL.x, BERTH_LOCAL.z);
  return { x: p.x, z: p.z, yaw: Math.atan2(Math.sin(ANSE_5E.yaw + Math.PI), Math.cos(ANSE_5E.yaw + Math.PI)) };
})();

/**
 * Le vert île de la bande de la Nef (consultant d'Archipéo, retouche du lot 4 : la bouée et la bande accordées), repris
 * par la bouée et par la bande de la voile pliée.
 */
const NEF_BAND = 0x438b82;

/** Le bois du ber, celui du ponton de la Lisière ; la bouée, à la couleur de la bande de la Nef. */
const BER_COLORS: BerColors = { ber: 0xa68672, berDark: 0x8c766a, buoy: NEF_BAND, buoyTop: 0xf2eee4 };

/** Le gréement déposé : la toile de la voile et sa bande, le bois du mât et de la vergue. */
const RIG_COLORS = { sail: 0xf2eee4, band: NEF_BAND, spar: 0x9f9279 } as const;

/**
 * Les pièces du gréement, et la partie du dirigeable dont l'arrivée les fait partir : sa sœur dans la mue de la grille
 * (world/nefModels.ts, `NEF_SISTERS[2]`, que le monde continu ne lit pas : un test vérifie qu'elles s'accordent).
 */
export const RIG_SISTERS = { voile: 'ballon', mat: 'suspentes', vergue: 'empennage' } as const;
type RigPiece = keyof typeof RIG_SISTERS;
const RIG_PIECES = Object.keys(RIG_SISTERS) as RigPiece[];

/** Le temps où une pièce du gréement part : celui de la partie neuve qui la reprend. */
function rigLeaves(piece: RigPiece): 1 | 2 | 3 {
  const sister: string = RIG_SISTERS[piece];
  const temps = ([1, 2, 3] as const).find((k) => (NEF_5E_TEMPS[k] as readonly string[]).includes(sister));
  if (temps === undefined) throw new Error(`nef5e : la sœur ${sister} de ${piece} n'est dans aucun temps`);
  return temps;
}

/**
 * Les pièces du gréement encore rangées sur le ponton à un temps (aucune après le départ). La vue passe le temps d'avant
 * tant qu'une partie descend : une pièce ne part que quand sa sœur touche le ber.
 */
export function rigShown(look: NefLook): RigPiece[] {
  if (look === 4) return [];
  return RIG_PIECES.filter((p) => look < rigLeaves(p));
}

/**
 * Où se range le gréement, dans le repère de l'anse (directeur artistique, retouche du lot 4) : sur le ponton, entre
 * son pied et la Nef (`z` de 19 à 24), devant Kéo au quai, jamais entre lui et la caméra.
 */
export const RIG_SPAN = { z0: 19.2, z1: 24 } as const;

/**
 * Le gréement déposé (directeur artistique, point 5), sur le ponton, rangé, jamais jeté : la voile pliée (blanche,
 * barrée de sa bande vert île), le mât et la vergue couchés le long du ponton. Un dessin simple, en code.
 */
function rigging(b: FacetBuilder, look: NefLook): void {
  const shown = rigShown(look);
  const x = LISIERE_PONTON.x;
  const y = QUAY_5E.deck;
  const { z0, z1 } = RIG_SPAN;
  if (shown.includes('mat')) b.beam({ x: x - 0.7, y: y + 0.12, z: z0 }, { x: x - 0.7, y: y + 0.12, z: z1 }, 0.24, RIG_COLORS.spar);
  if (shown.includes('vergue')) b.beam({ x: x - 0.25, y: y + 0.09, z: z0 + 0.6 }, { x: x - 0.25, y: y + 0.09, z: z1 - 0.6 }, 0.18, RIG_COLORS.spar);
  if (shown.includes('voile')) {
    const mid = (z0 + z1) / 2;
    b.box({ x: x + 0.55, y, z: mid }, [0.95, 0.3, 1.7], RIG_COLORS.sail);
    b.box({ x: x + 0.55, y: y - 0.01, z: mid }, [0.97, 0.32, 0.3], RIG_COLORS.band);
  }
}

/** Le ber et ce qui l'accompagne (la bouée après le départ, le gréement tant qu'il reste), posés dans le monde. */
function berWith(look: NefLook): Facets {
  const b = new FacetBuilder();
  berLocal(b, BERTH_LOCAL, look === 4, BER_COLORS, 1);
  rigging(b, look);
  return placeFacets(b.build(), { x: ANSE_5E.origin.x, y: 0, z: ANSE_5E.origin.z, yaw: ANSE_5E.yaw });
}

/** Un cumulus du mur : son milieu, son rayon, sa hauteur ; son épaule (décalée de `shoulder` fois son rayon, en `x`). */
interface Cumulus {
  x: number;
  z: number;
  r: number;
  h: number;
  shoulder: number;
  /** Au départ, le sens où il glisse pour ouvrir la brèche (−1 : vers l'ouest, 1 : vers l'est, 0 : il ne glisse pas). */
  side: -1 | 0 | 1;
}

/**
 * Le mur de nuages (directeur artistique, point 6 et retouche A ; consultant d'Archipéo, retouche 7) : au nord, au-delà
 * des Aiguilles et de la côte nord du plateau, en mer, neuf cumulus pleins, plus larges que hauts, chacun épaulé d'un
 * dôme plus bas, de tailles inégales (du simple au double avec leurs épaules), à des écarts inégaux, qui se chevauchent ;
 * plus hauts que les aiguilles du plateau (49 au plus), plus bas que la Montée. Les deux du milieu (vus du quai) ferment
 * la brèche : au départ, ils glissent l'un vers l'ouest, l'autre vers l'est.
 */
export const NEF_WALL: readonly Cumulus[] = [
  { x: -262, z: -212, r: 34, h: 52, shoulder: 0.62, side: 0 },
  { x: -196, z: -224, r: 40, h: 58, shoulder: -0.6, side: 0 },
  { x: -132, z: -206, r: 28, h: 50, shoulder: 0.66, side: 0 },
  { x: -82, z: -220, r: 36, h: 57, shoulder: -0.62, side: 0 },
  { x: -36, z: -208, r: 30, h: 54, shoulder: -0.64, side: -1 },
  { x: 16, z: -220, r: 32, h: 56, shoulder: 0.6, side: 1 },
  { x: 66, z: -210, r: 26, h: 51, shoulder: 0.66, side: 0 },
  { x: 116, z: -224, r: 40, h: 59, shoulder: -0.58, side: 0 },
  { x: 166, z: -210, r: 30, h: 53, shoulder: 0.62, side: 0 },
];

/**
 * Le panache du 4e (directeur artistique, retouche B ; consultant d'Archipéo, retouche 8) : derrière la brèche vue du
 * quai, des boules de fumée empilées qui grossissent en montant et s'ouvrent en nuage au sommet, légèrement penchées
 * vers l'est ; gris froid, plus sombre que le mur, jamais noir ; aucune arête droite de haut en bas. `[hauteur, rayon,
 * déport vers l'est]` de chaque boule.
 */
export const NEF_PLUME = { x: -62, z: -292, balls: [[6, 7, 0], [18, 8.5, 2], [34, 10.5, 5], [53, 13.5, 9], [76, 18, 14]] } as const;

/** Les couleurs du mur (le côté au soleil, l'ombre gris-bleu, le dessous) et du panache (l'ombre, le soleil, le haut). */
export const WALL_COLORS = { lit: 0xebe7dc, shade: 0xa7b3bc, under: 0x96a3ad } as const;
export const PLUME_COLORS = { side: 0x857e78, lit: 0x958e88, top: 0x9c968f } as const;

/** Le profil d'un dôme : du pied sous l'eau au sommet arrondi, presque plat (rayon et hauteur relatifs ; et celui d'une épaule). */
const DOME: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.94, 0.42],
  [0.6, 0.9],
  [0, 1],
];
const SHOULDER: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.72, 0.84],
  [0, 1],
];

/** Le soleil, à plat : un pan qui le regarde est clair. */
const SUN = { x: -SHADOW_DIR_5E.x, z: -SHADOW_DIR_5E.z } as const;

/** Un dôme de `sides` pans, à son profil, ses couleurs selon le soleil (le pied dans l'eau, son anneau du bas plus sombre). */
function dome(b: FacetBuilder, x: number, z: number, r: number, h: number, sides: number, profile: readonly (readonly [number, number])[], turn: number): void {
  const rings = profile.map(([rr, y], k) =>
    Array.from({ length: sides }, (_, j): [number, number, number] => {
      const a = turn + (2 * Math.PI * j) / sides;
      return [x + rr * r * Math.cos(a), k === 0 ? -1 : y * h, z + rr * r * Math.sin(a)];
    }),
  );
  for (let k = 0; k < rings.length - 1; k++) {
    const lo = rings[k];
    const hi = rings[k + 1];
    for (let j = 0; j < sides; j++) {
      const n = (j + 1) % sides;
      const a = turn + (2 * Math.PI * (j + 0.5)) / sides;
      const sunny = Math.cos(a) * SUN.x + Math.sin(a) * SUN.z > 0;
      const color = k === 0 ? WALL_COLORS.under : sunny ? WALL_COLORS.lit : WALL_COLORS.shade;
      if (k === rings.length - 2) b.triangle(lo[n], lo[j], hi[j], color);
      else b.quad(lo[n], lo[j], hi[j], hi[n], color);
    }
  }
}

/** Les sommets d'un dôme, et ceux d'une épaule (pour le sens de glissement de chacun de leurs sommets). */
const DOME_SIDES = 8;
const SHOULDER_SIDES = 7;
const DOME_VERTICES = 3 * DOME_SIDES * (2 * (DOME.length - 2) + 1);
const SHOULDER_VERTICES = 3 * SHOULDER_SIDES * (2 * (SHOULDER.length - 2) + 1);

/**
 * Le mur, reculé de `back` vers le nord et ouvert de `open` (chaque cumulus du milieu glissé d'autant, l'un vers l'ouest,
 * l'autre vers l'est).
 */
export function wallFacets(back = 0, open = 0): Facets {
  const b = new FacetBuilder();
  NEF_WALL.forEach((v, i) => {
    const x = v.x + v.side * open;
    const z = v.z - back;
    const turn = i * 0.9;
    dome(b, x, z, v.r, v.h, DOME_SIDES, DOME, turn);
    dome(b, x + v.shoulder * v.r, z + 0.18 * v.r, 0.55 * v.r, 0.62 * v.h, SHOULDER_SIDES, SHOULDER, turn + 0.4);
  });
  return b.build();
}

/** Le sens de glissement de chaque sommet du mur (dans l'ordre de `wallFacets`) : la vue ouvre la brèche sans rien refaire. */
export function wallSides(): Float32Array {
  const sides = new Float32Array(NEF_WALL.length * (DOME_VERTICES + SHOULDER_VERTICES));
  let k = 0;
  for (const v of NEF_WALL) for (let n = 0; n < DOME_VERTICES + SHOULDER_VERTICES; n++) sides[k++] = v.side;
  return sides;
}

/** Une boule de fumée : un pôle bas, deux anneaux de six pans, un pôle haut ; ses pans au soleil plus clairs. */
function smokeBall(b: FacetBuilder, x: number, y: number, z: number, r: number, turn: number, top: boolean): void {
  const SIDES = 6;
  const ring = (dy: number, rr: number, t: number) => Array.from({ length: SIDES }, (_, j): [number, number, number] => [x + rr * Math.cos(t + (2 * Math.PI * j) / SIDES), y + dy, z + rr * Math.sin(t + (2 * Math.PI * j) / SIDES)]);
  const lo = ring(-0.38 * r, 0.93 * r, turn);
  const hi = ring(0.38 * r, 0.93 * r, turn + Math.PI / SIDES);
  const down: [number, number, number] = [x, y - r, z];
  const up: [number, number, number] = [x, y + r, z];
  const shade = (j: number) => {
    const a = turn + (2 * Math.PI * (j + 0.5)) / SIDES;
    return Math.cos(a) * SUN.x + Math.sin(a) * SUN.z > 0 ? PLUME_COLORS.lit : PLUME_COLORS.side;
  };
  for (let j = 0; j < SIDES; j++) {
    const n = (j + 1) % SIDES;
    b.triangle(lo[j], lo[n], down, PLUME_COLORS.side);
    b.triangle(lo[n], lo[j], hi[j], shade(j));
    b.triangle(hi[j], hi[n], lo[n], shade(j));
    b.triangle(hi[n], hi[j], up, top ? PLUME_COLORS.top : shade(j));
  }
}

/** Le panache : ses boules, de la mer au nuage du sommet. */
function plumeFacets(): Facets {
  const b = new FacetBuilder();
  const { x, z, balls } = NEF_PLUME;
  balls.forEach(([y, r, east], i) => smokeBall(b, x + east, y, z, r, i * 0.7, i === balls.length - 1));
  return b.build();
}

/** Le mur touché (un point du sol, de l'eau ou d'un volume) : une zone large, jamais un détail à viser. */
export function wallTouched(p: Vec2): boolean {
  return NEF_WALL.some((v) => Math.hypot(p.x - v.x, p.z - v.z) <= v.r + 10);
}

/** La Nef touchée : son poste, ber compris, avec une marge (une cible large). */
export function nef5eTouched(p: Vec2): boolean {
  const l = ANSE_5E.toLocal(p);
  return Math.abs(l.x - BERTH_LOCAL.x) <= 2.2 && Math.abs(l.z - BERTH_LOCAL.z) <= 4.6;
}

/**
 * Le départ, par les airs (directeur artistique, retouche 1 et 2 ; consultant d'Archipéo, retouche 1) : huit secondes
 * au plus, qu'un toucher termine. Le mur s'ouvre de `open` (chaque cumulus du milieu) et recule de `back`, de `openFrom`
 * (la Nef vire) à `openTo` du temps ; la Nef reste dans l'image de la caméra du quai tout le long, et le départ finit
 * `outOfView` secondes après qu'elle est passée au-delà de la brèche (à `pointBeyond` unités de la caméra, un point) ou
 * a quitté l'image, mais jamais avant que le mur soit ouvert.
 */
export const NEF_5E_DEPARTURE = { seconds: 8, openFrom: 0.19, openTo: 0.72, open: 30, back: 30, outOfView: 0.5, pointBeyond: 400 } as const;

/**
 * Le chemin du départ, dans le monde : du ber, la Nef se lève en biais au-dessus de l'anse, puis monte au ras des cimes
 * vers le nord-ouest (l'envol que la forêt laisse libre, plan5e.ts, `NEF_TAKEOFF_5E`), vire au nord, passe au-dessus du
 * plateau, plus haut que les aiguilles qu'elle longe, à l'écart de la Montée (à droite d'elle vue du quai), et file par
 * la brèche, à côté du panache, en montant (lot4/route : la caméra du quai la garde dans l'image tout le long).
 */
const ROUTE: readonly [number, number, number][] = [
  [BERTH.x, LIFT.ber, BERTH.z],
  [203.6, 3.5, 92.6],
  [194, 8, 82],
  [180, 13, 64],
  [100, 44, -70],
  [-11, 55, -215],
  [-28, 62, -300],
];
const LEGS = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1], p[2] - ROUTE[i][2]));
const ROUTE_LENGTH = LEGS.reduce((s, l) => s + l, 0);
/** Le regard de la proue, en avant sur le chemin. */
const LOOK_AHEAD = 18;
/** La Nef quitte le cap du ber et prend celui de sa route sur ses `TURN` premières unités de chemin (elle vire). */
const TURN = 12;

/** Un point du chemin à `d` unités de son début (rempli dans `out`). */
function along(d: number, out: [number, number, number]): [number, number, number] {
  let rest = Math.min(ROUTE_LENGTH, Math.max(0, d));
  let i = 0;
  while (i < LEGS.length - 1 && rest > LEGS[i]) rest -= LEGS[i++];
  const a = ROUTE[i];
  const b = ROUTE[i + 1];
  const f = LEGS[i] > 0 ? Math.min(1, rest / LEGS[i]) : 1;
  for (let k = 0; k < 3; k++) out[k] = a[k] + (b[k] - a[k]) * f;
  return out;
}

const here: [number, number, number] = [0, 0, 0];
const ahead: [number, number, number] = [0, 0, 0];

/** Lente au départ, puis de plus en plus vite, sans roulis ni balancement. */
const easeIn = (u: number) => u ** 2.2;

/** Où est la Nef au départ, à la fraction `u` (0 à 1) du temps (rempli dans `out`, rien n'est créé). */
export function nef5eFlight(u: number, out: NefFlight): NefFlight {
  const t = Math.min(1, Math.max(0, u));
  const d = easeIn(t) * ROUTE_LENGTH;
  along(d, here);
  along(d + LOOK_AHEAD, ahead);
  const dx = ahead[0] - here[0];
  const dz = ahead[2] - here[2];
  // La proue du modèle regarde vers −z de son repère : un cap `yaw` la tourne vers (−sin, −cos). Sur le ber, le cap du
  // ber ; puis, à mesure qu'elle se lève, celui de sa route.
  const heading = Math.atan2(-dx, -dz);
  const v = Math.min(1, d / TURN);
  const w = v * v * (3 - 2 * v);
  const turn = Math.atan2(Math.sin(heading - BERTH.yaw), Math.cos(heading - BERTH.yaw));
  out.x = here[0];
  out.y = here[1];
  out.z = here[2];
  out.yaw = BERTH.yaw + turn * w;
  const { openFrom, openTo } = NEF_5E_DEPARTURE;
  const o = Math.min(1, Math.max(0, (t - openFrom) / (openTo - openFrom)));
  const k = o * o * (3 - 2 * o);
  out.shiftX = 0;
  out.shiftZ = -NEF_5E_DEPARTURE.back * k;
  out.open = NEF_5E_DEPARTURE.open * k;
  return out;
}

/** Le mur, avant le départ, et ouvert, après lui (faits une fois chacun). */
let wallBefore: Facets | null = null;
let wallAfter: Facets | null = null;
let plume: Facets | null = null;
let sides: Float32Array | null = null;
const obstacleFacets = () => (wallBefore ??= wallFacets());
const afterFacets = () => (wallAfter ??= wallFacets(NEF_5E_DEPARTURE.back, NEF_5E_DEPARTURE.open));
const plumeOnce = () => (plume ??= plumeFacets());

/** La Nef du 5e (GD-22, lot 4). */
export const NEF_5E: NefSite = {
  form: 2,
  temps: NEF_5E_TEMPS,
  model: MODEL,
  lift: LIFT,
  berth: BERTH,
  ber: berWith,
  obstacle: obstacleFacets,
  after: afterFacets,
  stays: plumeOnce,
  obstacleTouched: wallTouched,
  touched: nef5eTouched,
  obstacleSides: () => (sides ??= wallSides()),
  seconds: NEF_5E_DEPARTURE.seconds,
  outOfView: NEF_5E_DEPARTURE.outOfView,
  obstacleDone: NEF_5E_DEPARTURE.openTo,
  pointBeyond: NEF_5E_DEPARTURE.pointBeyond,
  flight: nef5eFlight,
};

/** Ce que coûtent le ber et le gréement au plus, le mur et le panache (le modèle se compte à part : la vue le charge). */
export function nef5eSiteTriangles(): { ber: number; wall: number; plume: number } {
  return { ber: Math.max(berWith(1).triangles, berWith(4).triangles), wall: wallFacets().triangles, plume: plumeFacets().triangles };
}

/** Les triangles du dirigeable entier (le fichier `2-dirigeable/final-1704.glb`, toutes ses parties). */
export const NEF_5E_MODEL_TRIANGLES = 1704;
