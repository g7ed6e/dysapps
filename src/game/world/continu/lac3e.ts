/**
 * Le Détour du Lac (le Cirque du 3e, GD-25, lot 5 ; proposition du consultant d'Archipéo, § 6), sur le mécanisme des
 * autres Détours (./detours.ts, ./cadran3e.ts, ./bergerie3e.ts, ./cedre3e.ts) : « un petit lac rond au fond du creux, sous
 * la montagne ». Kéo s'y arrête, la vue se tourne vers l'est-sud-est, à travers le lac, vers le Fanal, le pic entier au-
 * delà, sa pointe comprise (relecture des Alpages, (a) 7) ; « Le Lac » s'écrit une fois et se dit, et Kéo ajoute une
 * phrase, écrite dessous. Une sente reste tracée pour de bon après la première arrivée, depuis la porte du Standard, en
 * passant au sud de sa scène et du lac. Ni compteur, ni récompense, ni mission, ni étape.
 *
 * La place : `DETOUR_SPOTS_3E.lac`, descendue au lot du Cirque de la pente de la levée nord, où l'eau ne tiendrait pas à
 * plat, sur le replat du creux, le plus plat des environs (rien n'y pousse : ./terrain3e.ts garde les places réservées). Une eau d'ardoise mate et
 * immobile, sans reflet qui scintille (jamais presque noire), dans sa berge basse d'herbe grise ; quatre blocs ronds de
 * granit autour, jamais devant le Fanal ; les trois pierres plates des Détours, de part et d'autre de la sente, jamais
 * dessus. 175 triangles au plus. Le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, type Vec2 } from './geometry';
import type { P3 } from './place4eKit';
import { COLORS_3E, DETOUR_SPOTS_3E, PATH_NODES_3E } from './plan3e';

/** Le cap de l'arrivée : à l'est-sud-est, à travers le lac, le Fanal à gauche du milieu, le pic à droite. */
const CAP_DEG = 118;
const CAP = (CAP_DEG * Math.PI) / 180;
/** Devant Kéo, et à sa droite. */
const LOOK: Vec2 = { x: Math.sin(CAP), z: -Math.cos(CAP) };
const RIGHT: Vec2 = { x: Math.cos(CAP), z: Math.sin(CAP) };

/** La vue du Lac à l'arrivée : la caméra plus bas que celle des Détours, pour garder le pic entier dans le cadre. */
const LAC_VIEW = { height: -4.5, back: 1.4, turn: 0 } as const;

/**
 * Le budget du Lac (proposition, § 6) : 175 triangles au plus sans la sente, dans le maillage des lieux, sans appel de
 * plus ; et sa sente, une fois tracée, au plus `sente` de plus (elle est longue : de la porte du Standard).
 */
export const LAC_BUDGET = { triangles: 175, sente: 420 } as const;

/** Le centre du lac : la place réservée. */
const LAKE: Vec2 = DETOUR_SPOTS_3E.lac;

/** Le lac : le rayon de l'eau, la largeur et la hauteur de sa berge au-dessus de l'eau, ses pans. */
const WATER = { r: 3.4, bank: 0.55, rim: 0.06, sides: 12 } as const;

/** Là où Kéo s'arrête : à l'ouest-nord-ouest du lac, le lac devant lui, à droite, jamais caché derrière lui. */
const AT: Vec2 = {
  x: LAKE.x - LOOK.x * 5.6 - RIGHT.x * 3.2,
  z: LAKE.z - LOOK.z * 5.6 - RIGHT.z * 3.2,
};

/** La sente, de la porte du Standard jusqu'à Kéo, au sud de la scène du Standard, puis au sud du lac : la porte, trois coudes, Kéo. */
const SENTE_LINE: readonly Vec2[] = (() => {
  const door = PATH_NODES_3E.find((n) => n.id === 'standard')!.at;
  return [door, { x: door.x - 1.8, z: door.z + 7.2 }, { x: door.x - 13.5, z: door.z + 7.6 }, { x: door.x - 40.9, z: door.z - 10 }, AT];
})();

/**
 * Le Lac, un Détour comme les autres (son nom : la proposition, § 6). `face` va de la vue vers Kéo : la caméra regarde à
 * l'opposé (`detourCap`). `says` : la phrase de Kéo, écrite sous le nom et lue après lui (proposition, au directeur du
 * contenu).
 */
export const LAC: Detour = {
  id: 'lac',
  land: 'cirque',
  name: 'Le Lac',
  kind: 'lac',
  at: AT,
  radius: 2.2,
  foot: AT,
  face: Math.atan2(-LOOK.z, -LOOK.x),
  sente: SENTE_LINE,
  view: LAC_VIEW,
  says: 'L’eau du lac vient de la neige du pic.',
};

/**
 * Les couleurs : l'eau d'ardoise mate (un gris bleu, jamais presque noir, sans reflet), sa berge d'herbe grise (celle du
 * Cirque) et son flanc ; les blocs de granit ; les trois pierres des Détours.
 */
const C = {
  water: 0x6d8299,
  bank: COLORS_3E.cirque,
  bankSide: 0x7f8d71,
  block: COLORS_3E.granite,
  blockTop: COLORS_3E.graniteSun,
  flat: 0xc9c0ae,
  flatSide: 0xa9a08f,
} as const;

/** Le sol sous un point. */
type Ground = (x: number, z: number) => number;

/** Les quatre blocs ronds autour du lac : leur cap depuis son centre, leur distance au bord, leur taille ; aucun entre Kéo et le Fanal. */
const BLOCKS = [
  { deg: 250, out: 0.9, s: 0.75 },
  { deg: 165, out: 1.4, s: 0.5 },
  { deg: 205, out: 1.0, s: 0.6 },
  { deg: 285, out: 1.6, s: 0.45 },
] as const;

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus) : leur cap relatif, leur rayon, leur taille. */
export const LAC_STONES = [
  { deg: -40, r: 2.0, size: 0.5 },
  { deg: 45, r: 2.1, size: 0.45 },
  { deg: 120, r: 1.9, size: 0.4 },
] as const;

/** Le sens de la sente, de Kéo vers son dernier coude. */
const DOWN: Vec2 = (() => {
  const from = SENTE_LINE[SENTE_LINE.length - 2];
  const len = distance(from, AT);
  return { x: (from.x - AT.x) / len, z: (from.z - AT.z) / len };
})();

/** Le pied d'une pierre de `LAC_STONES`, dans le monde. */
export const lacStoneAt = (k: number): Vec2 => {
  const a = (LAC_STONES[k].deg * Math.PI) / 180;
  const c = Math.cos(a),
    s = Math.sin(a);
  return { x: AT.x + (DOWN.x * c - DOWN.z * s) * LAC_STONES[k].r, z: AT.z + (DOWN.z * c + DOWN.x * s) * LAC_STONES[k].r };
};

/** Le milieu d'un bloc, dans le monde. */
const blockAt = (k: number): Vec2 => {
  const a = (BLOCKS[k].deg * Math.PI) / 180;
  const r = WATER.r + WATER.bank + BLOCKS[k].out;
  return { x: LAKE.x + Math.sin(a) * r, z: LAKE.z - Math.cos(a) * r };
};

/** Le niveau de l'eau : un rien au-dessus du plus haut du sol sous le lac, pour qu'aucune herbe ne la perce. */
function waterLevel(ground: Ground): number {
  let hi = -Infinity;
  for (let k = 0; k < WATER.sides; k++)
    for (const r of [0, WATER.r * 0.5, WATER.r + WATER.bank]) {
      const a = (k * 2 * Math.PI) / WATER.sides;
      hi = Math.max(hi, ground(LAKE.x + Math.cos(a) * r, LAKE.z + Math.sin(a) * r));
    }
  return hi + 0.03;
}

/** L'eau, un disque plat à douze pans, et sa berge basse d'herbe grise, qui descend sous le sol tout autour. */
function lake(b: FacetBuilder, ground: Ground): void {
  const y = waterLevel(ground);
  b.prism({ x: LAKE.x, y: y - 0.4, z: LAKE.z }, WATER.r + 0.05, WATER.r + 0.05, 0.4, WATER.sides, C.water, C.water);
  b.annulus({ x: LAKE.x, y: y - 0.45, z: LAKE.z }, WATER.r, WATER.r + WATER.bank, 0.45 + WATER.rim, WATER.sides, C.bankSide, C.bank, false);
}

function blocks(b: FacetBuilder, ground: Ground): void {
  BLOCKS.forEach((k, i) => {
    const p = blockAt(i);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.2, z: p.z, yaw: i }, k.s, k.s * 0.65, k.s * 1.1, 5, C.block, C.blockTop);
  });
}

function stones(b: FacetBuilder, ground: Ground): void {
  LAC_STONES.forEach((s, k) => {
    const p = lacStoneAt(k);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.05, z: p.z, yaw: LAC.face + k }, s.size, s.size * 0.85, 0.22, 4, C.flatSide, C.flat);
  });
}

/** La sente du Lac, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret, le long de ses coudes. */
function sente(b: FacetBuilder, ground: Ground): void {
  const line = SENTE_LINE;
  for (let k = 0; k < line.length - 1; k++) {
    const a = line[k],
      c = line[k + 1];
    const len = distance(a, c);
    const dx = (c.x - a.x) / len,
      dz = (c.z - a.z) / len;
    const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, ground(a.x + dx * t, a.z + dz * t) + SENTE.lift, a.z + dz * t - dx * o];
    // Elle s'arrête un pas avant Kéo, aux pierres.
    const end = k === line.length - 2 ? len - 1.2 : len;
    for (let s = 0; s < end; s += SENTE.dash + SENTE.gap) {
      const e = Math.min(end, s + SENTE.dash);
      b.quad(p(s, SENTE.half), p(s, -SENTE.half), p(e, -SENTE.half), p(e, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor du Lac, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : l'eau et sa berge, les blocs,
 * les pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la sente : le plafond de
 * 175 triangles (proposition, § 6).
 */
export function lacFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  lake(b, ground);
  blocks(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan du Lac, pour les tests : son centre, son eau, ses blocs, la sente, les couleurs. */
export const LAC_LAYOUT = {
  look: LOOK,
  lake: LAKE,
  water: WATER,
  colors: C,
  blocks: BLOCKS.map((k, i) => ({ ...blockAt(i), s: k.s })),
  senteLine: SENTE_LINE,
  waterLevel,
  /** La distance d'un point à la sente. */
  clearOfSente: (p: Vec2) => distanceToPolyline(p, SENTE_LINE),
} as const;
