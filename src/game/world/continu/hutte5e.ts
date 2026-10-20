/**
 * Le Détour de la Hutte (GD-22, lot 8 ; intention du directeur artistique du 20 octobre 2026, « Le Détour de la Hutte ») :
 * le deuxième Détour du 5e, après le Creux des Frondaisons (./creux5e.ts), sur le mécanisme de ceux du 6e (./detours.ts) : un endroit hors des chemins, que l'élève trouve en
 * marchant ; Kéo s'y arrête, la vue monte, « La Hutte » s'écrit une fois, et une sente reste tracée pour de bon après la
 * première arrivée. Ni compteur, ni récompense, ni mission.
 *
 * La place : la rive sud du grand chenal, dans les Roselières, à l'ouest du pont et à dix-huit unités de lui, là où le
 * sol sec descend vers l'eau profonde (contre `heightAt5e`). La cabane, carrée et fermée, sur de courts pilotis, son toit
 * à deux pans épais, la porte ouverte sur l'ombre face au chenal ; un banc contre le mur, la barque plate tirée sur la
 * rive, la lanterne d'ocre pendue sous l'avant-toit, allumée dès le départ, et les trois pierres plates au pied, comme aux
 * autres Détours. Rien à lire. Elle se distingue par la forme de l'abri du tailleur (un auvent à un pan, ouvert) et de la
 * case ronde de la cordière.
 *
 * Sa place est dans le plan du 5e (./plan5e.ts, `HUTTE_5E`), que lit aussi la forêt (elle s'en écarte, ./terrain5e.ts) ;
 * le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets, type Placement } from './facets';
import { distance, type Vec2 } from './geometry';
import { reeds } from './instants5e';
import { COLORS_5E, HUTTE_5E } from './plan5e';

/** Le chenal, regardé depuis la rive : vers l'eau (`SEA`, le nord-nord-est) et le long de la rive vers l'est (`EAST`). */
const SEA: Vec2 = { x: 0.238, z: -0.971 };
const EAST: Vec2 = { x: 0.971, z: 0.238 };

/** La cabane : son centre, sa largeur, sa profondeur, ses pilotis, ses murs, son toit. */
const CABIN = { at: HUTTE_5E.cabin, w: 2.4, d: 2.2, stilts: 0.45, wall: 1.5, ridge: 1.1, eave: 0.35, thick: 0.22 } as const;

/** Le cap de la cabane : sa porte (le +z de son repère) face au chenal. */
const CABIN_YAW = Math.atan2(SEA.x, SEA.z);

const around = (c: Vec2, sea: number, east: number): Vec2 => ({ x: c.x + SEA.x * sea + EAST.x * east, z: c.z + SEA.z * sea + EAST.z * east });

/** Là où Kéo s'arrête : devant la cabane, à l'est de la porte, face à l'eau. */
const AT: Vec2 = { x: HUTTE_5E.at.x, z: HUTTE_5E.at.z };

/** La Hutte, un Détour comme les autres (son nom : le consultant d'Archipéo ; « la Hutte », h aspiré). */
export const HUTTE: Detour = {
  id: 'hutte',
  land: 'roselieres',
  name: 'La Hutte',
  kind: 'cabane',
  at: AT,
  radius: 2.5,
  foot: AT,
  face: Math.atan2(SEA.z, SEA.x),
  sente: [{ x: HUTTE_5E.senteFrom.x, z: HUTTE_5E.senteFrom.z }, AT],
};

/** Les couleurs (directeur artistique) : les roseaux secs des murs, le chaume, le bois gris, l'ombre de la porte, jamais noire. */
const C = {
  reed: 0xb59a62,
  reedShade: 0x9c8452,
  thatch: 0x9a7f4c,
  thatchEdge: 0x84693f,
  wood: 0x8c766a,
  woodShade: 0x76635a,
  door: 0x4e4034,
  hull: 0x7d6a55,
  hullInside: 0x5f5142,
  rope: 0xd8c49a,
  bronze: 0xb8954f,
  lantern: COLORS_5E.lantern,
  // Les trois pierres : celles des Détours du 6e (./detours.ts).
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
} as const;

/** Le sol sous un point, jamais sous l'eau. */
type Ground = (x: number, z: number) => number;

/** Un point du repère de la cabane (`x` vers l'ouest, `z` vers le chenal) posé dans le monde, à la hauteur `y`. */
function inCabin(lx: number, y: number, lz: number, yaw = 0): Placement {
  const c = Math.cos(CABIN_YAW),
    s = Math.sin(CABIN_YAW);
  return { x: CABIN.at.x + lx * c + lz * s, y, z: CABIN.at.z - lx * s + lz * c, yaw: CABIN_YAW + yaw };
}

/** La cabane : ses quatre pilotis, son plancher, ses murs de roseaux, son toit épais, sa porte, son banc, sa lanterne. */
function cabin(b: FacetBuilder, ground: Ground): void {
  const base = ground(CABIN.at.x, CABIN.at.z);
  const floor = base + CABIN.stilts;
  const hw = CABIN.w / 2,
    hd = CABIN.d / 2;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const p = inCabin(sx * (hw - 0.15), 0, sz * (hd - 0.15));
    const foot = ground(p.x, p.z) - 0.2;
    b.band({ x: p.x, y: foot, z: p.z }, 0.09, floor - foot, 3, C.woodShade);
  }
  b.box(inCabin(0, floor, 0), [CABIN.w + 0.2, 0.12, CABIN.d + 0.2], C.woodShade, C.wood);
  const sill = floor + 0.12;
  b.box(inCabin(0, sill, 0), [CABIN.w, CABIN.wall, CABIN.d], C.reedShade, C.reed);
  // Le toit à deux pans, épais : un pentagone (ses avant-toits, son faîtage) tiré de l'arrière à l'avant, qui déborde.
  const a = hw + CABIN.eave;
  const L = CABIN.d + 2 * CABIN.eave;
  b.extrude(
    inCabin(0, sill + CABIN.wall, -L / 2),
    [
      [-a, 0],
      [a, 0],
      [a, CABIN.thick],
      [0, CABIN.ridge],
      [-a, CABIN.thick],
    ],
    L,
    C.thatchEdge,
    C.thatch,
  );
  // La porte ouverte, sur l'ombre : un aplat sur le mur du chenal, un peu à l'ouest.
  b.plate(
    inCabin(0.35, sill, hd + 0.01),
    [
      [-0.36, 0],
      [0.36, 0],
      [0.36, 1.15],
      [-0.36, 1.15],
    ],
    C.door,
  );
  // Le banc, contre le mur, à l'est de la porte.
  b.box(inCabin(-0.62, floor, hd + 0.22), [0.86, 0.5, 0.34], C.woodShade, C.wood);
  // La lanterne d'ocre, pendue sous l'avant-toit à l'angle est : sa corde, sa vitre allumée, son chapeau.
  const lamp = inCabin(-(hw + 0.12), 0, hd + 0.22);
  const top = sill + CABIN.wall;
  const y = top - 0.22 - 0.34;
  b.band({ x: lamp.x, y: y + 0.34, z: lamp.z }, 0.025, 0.22, 3, C.rope);
  b.box({ x: lamp.x, y, z: lamp.z }, [0.26, 0.34, 0.26], C.lantern);
  b.prism({ x: lamp.x, y: y + 0.34, z: lamp.z, yaw: Math.PI / 4 }, 0.24, 0, 0.14, 4, C.bronze);
}

/** La barque plate, tirée sur la rive à l'ouest de la cabane, sa pointe vers l'eau : un fond plat, deux bouts relevés. */
function boat(b: FacetBuilder, ground: Ground): void {
  const p = around(CABIN.at, 3.7, -1.8);
  const y = Math.max(0, ground(p.x, p.z)) - 0.05;
  // Son profil (de l'arrière à la pointe, en x ; sa hauteur, en y), tiré sur sa largeur : les flancs aux deux faces, le
  // dedans de la barque d'un bois plus sombre.
  const len = 2.5,
    wide = 0.9;
  const yaw = CABIN_YAW - Math.PI / 2 + 0.35;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  b.extrude(
    { x: p.x - s * (wide / 2), y, z: p.z - c * (wide / 2), yaw, pitch: 0 },
    [
      [-len / 2 + 0.3, 0],
      [len / 2 - 0.4, 0],
      [len / 2, 0.34],
      [-len / 2, 0.34],
    ],
    wide,
    C.hullInside,
    C.hull,
  );
}

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus), comme aux autres Détours. */
function stones(b: FacetBuilder, ground: Ground): void {
  const spots = [
    { sea: -0.6, east: -2.4, r: 0.55 },
    { sea: -0.2, east: 2.5, r: 0.5 },
    { sea: 0.7, east: -3.2, r: 0.4 },
  ];
  for (const [k, s] of spots.entries()) {
    const p = around(AT, s.sea, s.east);
    b.prism({ x: p.x, y: Math.max(0, ground(p.x, p.z)) - 0.05, z: p.z, yaw: HUTTE.face + k }, s.r, s.r * 0.85, 0.22, 5, C.stoneSide, C.stone);
  }
}

/**
 * Les deux touffes de roseaux des Instants (./instants5e.ts, `reeds`), le long de la sente, dans sa moitié côté chemin,
 * de part et d'autre et jamais dessus (directeur artistique, retouche du lot 8) : de loin, elles disent l'eau et la
 * Roselière avant la cabane. `along` : la part de la sente depuis son départ ; `side` : l'écart, au sud (+) ou au nord.
 * Vingt-quatre triangles, sente tracée ou non.
 */
export const HUTTE_REEDS = [
  { along: 0.28, side: 1.3, h: 1.4 },
  { along: 0.46, side: -1.2, h: 1.25 },
] as const;

/** Le pied d'une touffe de `HUTTE_REEDS`, dans le monde. */
export function hutteReedAt(k: number): Vec2 {
  const [a, c] = HUTTE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const r = HUTTE_REEDS[k];
  return { x: a.x + dx * len * r.along + dz * r.side, z: a.z + dz * len * r.along - dx * r.side };
}

function reedTufts(b: FacetBuilder, ground: Ground): void {
  HUTTE_REEDS.forEach((r, k) => {
    const p = hutteReedAt(k);
    reeds(b, { x: p.x, y: Math.max(0, ground(p.x, p.z)), z: p.z }, 41 + k * 5, r.h);
  });
}

/** La sente de la Hutte, en pointillé sur le sol : celle du Creux (./creux5e.ts, `SENTE_5E`), lisible sur la mousse du 5e. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = HUTTE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number) => {
    const x = a.x + dx * t + dz * o,
      z = a.z + dz * t - dx * o;
    return [x, Math.max(0, ground(a.x + dx * t, a.z + dz * t)) + SENTE.lift, z] as const;
  };
  for (let s = 0; s < len; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(len, s + SENTE.dash);
    for (let t = s; t < e - 1e-6; t += 0.5) {
      const t1 = Math.min(e, t + 0.5);
      b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor de la Hutte, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : la cabane, sa barque, ses
 * pierres, les deux touffes de roseaux le long de la sente, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la sente : le plafond de 175
 * triangles (intention, « Le coût »).
 */
export function hutteFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  cabin(b, ground);
  boat(b, ground);
  stones(b, ground);
  reedTufts(b, ground);
  if (found) sente(b, ground);
  return b.build();
}
