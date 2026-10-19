// La Nef du 5e, le dirigeable (GD-22, lot 4 ; GD-21, la Nef en trois temps ; intention du directeur artistique du
// 19 octobre 2026) : au bout du ponton de la Lisière, sur un ber de bois dans l'eau de l'anse, le long du ponton, la
// proue vers le large ; immobile à quai. Ses trois temps : la nacelle (la coque du voilier) et sa lanterne, là dès
// l'arrivée (la grille la reprend de la forme d'avant, `kept`) ; l'enveloppe et ses cordes ; le gouvernail en croix,
// fixé sur l'enveloppe. Ce qui ne sert plus au voilier est rangé sur le bout du ponton (la voile pliée, le mât et la
// vergue couchés), et part quand sa sœur arrive (world/nefModels.ts, `NEF_SISTERS`). Son obstacle, au nord, au-delà des
// Aiguilles, en mer : le mur de nuages, de grands volumes ronds et pleins, immobiles, plus hauts que les aiguilles ;
// derrière lui, au nord-est, le panache du 4e. Le départ : la Nef monte à la verticale au-dessus de la canopée, vire au
// nord et file vers le mur, à l'écart de la Montée, et le mur s'écarte vers le nord ; le panache reste. Code pur.
import { FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { LISIERE_PONTON } from './lisiere';
import { berLocal, type BerColors, type NefFlight, type NefLook, type NefSite } from './nef';
import { LISIERE, QUAY_5E } from './plan5e';
import { SHADOW_DIR_5E } from './sky';

/** Les parties du dirigeable (ses os) qui arrivent à chaque temps : la nacelle et sa lanterne, l'enveloppe et ses cordes, le gouvernail. */
export const NEF_5E_TEMPS = { 1: ['coque', 'lanterne'], 2: ['ballon', 'suspentes'], 3: ['empennage'] } as const satisfies Readonly<Record<1 | 2 | 3, readonly string[]>>;

/**
 * Le modèle du dirigeable (`2-dirigeable/final-1704.glb`) : à l'échelle du voilier (la coque est la même : la nacelle à
 * la hauteur de Kéo, l'enveloppe au-dessus), le milieu de sa coque (x de 1,3 à 3,7, z de 1,4 à 6,9 ; la proue vers −z).
 */
const MODEL = { scale: 0.65, center: { x: 2.5, z: 4.15 } } as const;

/** La hauteur de la Nef sur son ber : le dessous de la nacelle (−0,5 case) dans les couples. */
const LIFT = { ber: 0.37 } as const;

/** Le poste, dans le repère de la Lisière : à gauche du ponton (vers l'anse), le long de lui, la proue vers son bout. */
const BERTH_LOCAL = { x: LISIERE_PONTON.x + 2.5, z: 25 } as const;

/** Le poste dans le monde : la proue suit `z` du repère, vers le bout du ponton et le large. */
const BERTH = (() => {
  const p = LISIERE.toWorld(BERTH_LOCAL.x, BERTH_LOCAL.z);
  return { x: p.x, z: p.z, yaw: Math.atan2(Math.sin(LISIERE.yaw + Math.PI), Math.cos(LISIERE.yaw + Math.PI)) };
})();

/** Le bois du ber, celui du ponton de la Lisière ; la bouée, à la couleur de la bande de la Nef. */
const BER_COLORS: BerColors = { ber: 0xa68672, berDark: 0x8c766a, buoy: 0x2f6fa8, buoyTop: 0xf2eee4 };

/** Le gréement déposé : la toile de la voile et sa bande, le bois du mât et de la vergue. */
const RIG_COLORS = { sail: 0xf2eee4, band: 0x2f6fa8, spar: 0x9f9279 } as const;

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
  return ([1, 2, 3] as const).find((k) => (NEF_5E_TEMPS[k] as readonly string[]).includes(sister)) ?? 2;
}

/** Les pièces du gréement encore rangées sur le ponton à un temps (aucune après le départ). */
export function rigShown(look: NefLook): RigPiece[] {
  if (look === 4) return [];
  return RIG_PIECES.filter((p) => look < rigLeaves(p));
}

/**
 * Le gréement déposé (directeur artistique, point 5), sur le bout du ponton, rangé, jamais jeté : la voile pliée
 * (blanche, barrée de sa bande bleue), le mât et la vergue couchés le long du ponton. Un dessin simple, en code.
 */
function rigging(b: FacetBuilder, look: NefLook): void {
  const shown = rigShown(look);
  const x = LISIERE_PONTON.x;
  const y = QUAY_5E.deck;
  if (shown.includes('mat')) b.beam({ x: x - 0.7, y: y + 0.12, z: 26.6 }, { x: x - 0.7, y: y + 0.12, z: 31.6 }, 0.24, RIG_COLORS.spar);
  if (shown.includes('vergue')) b.beam({ x: x - 0.25, y: y + 0.09, z: 27.4 }, { x: x - 0.25, y: y + 0.09, z: 31.2 }, 0.18, RIG_COLORS.spar);
  if (shown.includes('voile')) {
    b.box({ x: x + 0.55, y, z: 29.2 }, [0.95, 0.3, 1.7], RIG_COLORS.sail);
    b.box({ x: x + 0.55, y: y - 0.01, z: 29.2 }, [0.97, 0.32, 0.3], RIG_COLORS.band);
  }
}

/** Le ber et ce qui l'accompagne (la bouée après le départ, le gréement tant qu'il reste), posés dans le monde. */
function berWith(look: NefLook): Facets {
  const b = new FacetBuilder();
  berLocal(b, BERTH_LOCAL, look === 4, BER_COLORS, 1);
  rigging(b, look);
  return placeFacets(b.build(), { x: LISIERE.origin.x, y: 0, z: LISIERE.origin.z, yaw: LISIERE.yaw });
}

/**
 * Le mur de nuages (directeur artistique, point 6) : au nord, au-delà des Aiguilles et de la côte nord du plateau, en
 * mer, huit grands volumes ronds et pleins, de tailles inégales, qui se chevauchent, plus hauts que les aiguilles du
 * plateau (49 au plus) et moins que la Montée vue de la Lisière. Il se distingue de la brume par sa forme, sa place et sa
 * hauteur ; son dessous et son côté à l'ombre un cran plus sombres (un gris-bleu de la famille de la brume).
 */
export const NEF_WALL: readonly { x: number; z: number; r: number; h: number }[] = [
  { x: -110, z: -205, r: 22, h: 52 },
  { x: -70, z: -216, r: 28, h: 62 },
  { x: -26, z: -204, r: 20, h: 55 },
  { x: 16, z: -220, r: 30, h: 66 },
  { x: 60, z: -207, r: 22, h: 57 },
  { x: 100, z: -222, r: 27, h: 63 },
  { x: 140, z: -209, r: 20, h: 54 },
  { x: 176, z: -224, r: 24, h: 60 },
];

/** Le panache du 4e (point 6) : une seule colonne immobile, gris brun, jamais noire, derrière le mur, au nord-est. */
export const NEF_PLUME = { x: 150, z: -300, h: 98 } as const;

const WALL_COLORS = { lit: 0xebe7dc, shade: 0xc3c9c6, under: 0xb2bcbe } as const;
const PLUME_COLORS = { side: 0x8a8074, lit: 0x9d958a } as const;

/** Le profil d'un volume du mur : du pied sous l'eau au sommet arrondi (rayon et hauteur relatifs). */
const DOME: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.95, 0.35],
  [0.75, 0.68],
  [0.4, 0.92],
  [0, 1],
];
const WALL_SIDES = 9;

/** Le soleil, à plat : un pan qui le regarde est clair. */
const SUN = { x: -SHADOW_DIR_5E.x, z: -SHADOW_DIR_5E.z } as const;

/** Le mur, décalé de `shift` vers le nord (son retrait au départ de la Nef). */
export function wallFacets(shift = 0): Facets {
  const b = new FacetBuilder();
  NEF_WALL.forEach((v, i) => {
    const turn = i * 0.9;
    const rings = DOME.map(([r, y], k) =>
      Array.from({ length: WALL_SIDES }, (_, j): [number, number, number] => {
        const a = turn + (2 * Math.PI * j) / WALL_SIDES;
        return [v.x + r * v.r * Math.cos(a), k === 0 ? -1 : y * v.h, v.z - shift + r * v.r * Math.sin(a)];
      }),
    );
    for (let k = 0; k < rings.length - 1; k++) {
      const lo = rings[k];
      const hi = rings[k + 1];
      for (let j = 0; j < WALL_SIDES; j++) {
        const n = (j + 1) % WALL_SIDES;
        // Le pan regarde-t-il le soleil ? Le dessous, toujours plus sombre.
        const a = turn + (2 * Math.PI * (j + 0.5)) / WALL_SIDES;
        const sunny = Math.cos(a) * SUN.x + Math.sin(a) * SUN.z > 0;
        const color = k === 0 ? WALL_COLORS.under : sunny ? WALL_COLORS.lit : WALL_COLORS.shade;
        if (k === rings.length - 2) b.triangle(lo[n], lo[j], hi[j], color);
        else b.quad(lo[n], lo[j], hi[j], hi[n], color);
      }
    }
  });
  return b.build();
}

/** Le panache : une colonne qui s'élargit en montant, son haut arrondi. */
function plumeFacets(): Facets {
  const b = new FacetBuilder();
  const { x, z, h } = NEF_PLUME;
  const SIDES = 7;
  const profile: readonly [number, number][] = [
    [6, -1],
    [7, h * 0.6],
    [10, h * 0.85],
    [12, h * 0.95],
  ];
  const rings = profile.map(([r, y]) => Array.from({ length: SIDES }, (_, j): [number, number, number] => [x + r * Math.cos((2 * Math.PI * j) / SIDES), y, z + r * Math.sin((2 * Math.PI * j) / SIDES)]));
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < SIDES; j++) {
      const n = (j + 1) % SIDES;
      b.quad(rings[k][n], rings[k][j], rings[k + 1][j], rings[k + 1][n], k === rings.length - 2 ? PLUME_COLORS.lit : PLUME_COLORS.side);
    }
  const top: [number, number, number] = [x, h, z];
  const last = rings[rings.length - 1];
  for (let j = 0; j < SIDES; j++) b.triangle(last[(j + 1) % SIDES], last[j], top, PLUME_COLORS.lit);
  return b.build();
}

/** Le mur touché (un point du sol, de l'eau ou d'un volume) : une zone large, jamais un détail à viser. */
export function wallTouched(p: Vec2): boolean {
  return NEF_WALL.some((v) => Math.hypot(p.x - v.x, p.z - v.z) <= v.r + 10);
}

/** La Nef touchée : son poste, ber compris, avec une marge (une cible large). */
export function nef5eTouched(p: Vec2): boolean {
  const l = LISIERE.toLocal(p);
  return Math.abs(l.x - BERTH_LOCAL.x) <= 2.2 && Math.abs(l.z - BERTH_LOCAL.z) <= 4.6;
}

/**
 * Le départ, par les airs (point 7) : huit secondes au plus, qu'un toucher termine ; le mur s'écarte de `wallShift`
 * vers le nord à partir de `wallFrom` du temps ; le départ finit `outOfView` secondes après que la Nef a quitté l'image.
 */
export const NEF_5E_DEPARTURE = { seconds: 8, wallFrom: 0.3, wallShift: 120, outOfView: 0.5, climb: 22 } as const;

/**
 * Le chemin du départ, dans le monde : du ber, à la verticale au-dessus de la canopée, puis au nord, à l'écart de la
 * Montée (à l'est de sa ligne vue du quai), vers le mur et au-delà, en montant.
 */
const ROUTE: readonly [number, number, number][] = [
  [BERTH.x, LIFT.ber, BERTH.z],
  [BERTH.x, NEF_5E_DEPARTURE.climb, BERTH.z],
  [BERTH.x - 10, 30, BERTH.z - 35],
  [165, 42, -90],
  [130, 55, -215],
  [110, 62, -330],
];
const LEGS = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1], p[2] - ROUTE[i][2]));
const ROUTE_LENGTH = LEGS.reduce((s, l) => s + l, 0);
/** Le regard de la proue, en avant sur le chemin : le cap tourne doucement au sortir de la montée verticale. */
const LOOK_AHEAD = 18;

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
  const flat = Math.hypot(dx, dz);
  // La proue du modèle regarde vers −z de son repère : un cap `yaw` la tourne vers (−sin, −cos). Pendant la montée, le
  // cap du ber ; puis, à mesure que le chemin s'aplatit devant elle, celui de sa route.
  const heading = Math.atan2(-dx, -dz);
  const w = Math.min(1, flat / LOOK_AHEAD);
  const turn = Math.atan2(Math.sin(heading - BERTH.yaw), Math.cos(heading - BERTH.yaw));
  out.x = here[0];
  out.y = here[1];
  out.z = here[2];
  out.yaw = BERTH.yaw + turn * w;
  const k = t <= NEF_5E_DEPARTURE.wallFrom ? 0 : (t - NEF_5E_DEPARTURE.wallFrom) / (1 - NEF_5E_DEPARTURE.wallFrom);
  out.shiftX = 0;
  out.shiftZ = -NEF_5E_DEPARTURE.wallShift * k * k;
  return out;
}

/** Le mur, avant le départ, et écarté, après lui (faits une fois chacun). */
let wallBefore: Facets | null = null;
let wallAfter: Facets | null = null;
let plume: Facets | null = null;
const obstacleFacets = () => (wallBefore ??= wallFacets());
const afterFacets = () => (wallAfter ??= wallFacets(NEF_5E_DEPARTURE.wallShift));
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
  seconds: NEF_5E_DEPARTURE.seconds,
  outOfView: NEF_5E_DEPARTURE.outOfView,
  flight: nef5eFlight,
};

/** Ce que coûtent le ber et le gréement au plus, le mur et le panache (le modèle se compte à part : la vue le charge). */
export function nef5eSiteTriangles(): { ber: number; wall: number; plume: number } {
  return { ber: Math.max(berWith(1).triangles, berWith(4).triangles), wall: wallFacets().triangles, plume: plumeFacets().triangles };
}

/** Les triangles du dirigeable entier (le fichier `2-dirigeable/final-1704.glb`, toutes ses parties). */
export const NEF_5E_MODEL_TRIANGLES = 1704;
