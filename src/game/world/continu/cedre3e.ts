/**
 * Le Détour du Cèdre (les Prairies du 3e, GD-25, lot 4 ; proposition du consultant d'Archipéo, § 8, relecture des lieux
 * du directeur artistique et planche `selection-prairies-v1`), sur le mécanisme des autres Détours (./detours.ts,
 * ./cadran3e.ts, ./bergerie3e.ts) : « un cèdre seul aux branches plates, au milieu de la plus petite Prairie ». Kéo s'y
 * arrête, la vue se tourne au nord-ouest (320°), vers le pic et la petite arche, le soleil dans le dos ; « Le Cèdre » s'écrit
 * une fois et se dit, et Kéo ajoute une phrase, écrite dessous. Une sente reste tracée pour de bon après la première
 * arrivée, depuis le chemin des Ondes. Ni compteur, ni récompense, ni mission, ni étape.
 *
 * La place : `DETOUR_SPOTS_3E.cedre`, au milieu de la plus petite Prairie, loin des rives et du chemin. Un cèdre aux
 * branches en plateaux étagés (quatre, du plus large en bas au plus petit en haut, chacun un peu décalé, ce n'est pas un
 * sapin), sur un tronc épais gris-brun ; il se tient devant Kéo, à sa droite, jamais dans l'axe (relecture du Versant,
 * (b) 1), entre le pic, à gauche, et la petite arche, à droite, sans couvrir ni l'un ni l'autre (relecture des Prairies). Les trois
 * pierres plates des Détours, de part et d'autre de la sente, jamais dessus. 175 triangles au plus. Le dessin reçoit son
 * sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, type Vec2 } from './geometry';
import type { P3 } from './place4eKit';
import { DETOUR_SPOTS_3E, PATH_NODES_3E } from './plan3e';

/**
 * Le cap de l'arrivée : le nord-ouest (320°), le pic entier, pointe comprise, à gauche, la petite arche à droite (relecture
 * des Prairies : Kéo parle de la montagne ; le Palais sort du cadre, c'est accepté, et le zeppelin aussi, tout entier, au
 * téléphone comme sur tablette). La proposition, § 8, regardait le nord.
 */
const CAP_DEG = 320;
const CAP = (CAP_DEG * Math.PI) / 180;
/** Devant Kéo, et à sa droite. */
const LOOK: Vec2 = { x: Math.sin(CAP), z: -Math.cos(CAP) };
const RIGHT: Vec2 = { x: Math.cos(CAP), z: Math.sin(CAP) };

/**
 * La vue du Cèdre à l'arrivée : la caméra plus bas que celle qui suit (comme à la Bergerie), pour que le pic entier,
 * pointe comprise, passe sous le nom et dans le cadre ; le haut du cèdre aussi.
 */
const CEDRE_VIEW = { height: -4, back: 1.3, turn: 0 } as const;

/**
 * Le budget du Cèdre (proposition, § 8) : 175 triangles au plus sans la sente, dans le maillage des lieux, sans appel de
 * plus ; et sa sente, une fois tracée, au plus `sente` de plus.
 */
export const CEDRE_BUDGET = { triangles: 175, sente: 170 } as const;

/** Le pied du cèdre : la place réservée. */
const SPOT = DETOUR_SPOTS_3E.cedre;

/**
 * Le cèdre : son tronc (rayon au pied et en haut, hauteur) ; ses plateaux, du bas vers le haut : leur hauteur, leur rayon,
 * leur épaisseur, leur décalage (`dx` à droite de Kéo, `df` devant lui) et leur tour, pour qu'aucun ne soit l'empilement
 * régulier d'un sapin.
 */
const TRUNK = { r0: 0.62, r1: 0.38, h: 5.6 } as const;
export const TIERS = [
  { y: 2.3, r: 3.6, t: 0.36, dx: 0.5, df: 0.2, yaw: 0.2 },
  { y: 3.6, r: 3.0, t: 0.34, dx: -0.75, df: -0.3, yaw: 0.65 },
  { y: 4.75, r: 2.3, t: 0.32, dx: 0.55, df: 0.35, yaw: 1.1 },
  { y: 5.75, r: 1.4, t: 0.3, dx: -0.2, df: -0.1, yaw: 0.4 },
] as const;

/**
 * Où Kéo se tient depuis le pied du cèdre : `f` en arrière, `s` à gauche. Avec le cap tourné vers le pic (relecture des
 * Prairies), le cèdre se range entre le pic, à gauche, et la petite arche, à droite, sans cacher ni l'un ni l'autre.
 */
const BACK_OFF = { f: 7.4, s: 4.3 } as const;

/** Là où Kéo s'arrête : le cèdre devant lui à droite, hors de l'axe de la vue ; la sente vient de l'ouest, loin du tronc. */
const AT: Vec2 = {
  x: SPOT.x - LOOK.x * BACK_OFF.f - RIGHT.x * BACK_OFF.s,
  z: SPOT.z - LOOK.z * BACK_OFF.f - RIGHT.z * BACK_OFF.s,
};

/** Le point du chemin des Ondes (de `sa2-a` à `sa2-b`, puis aux Ondes) le plus proche de Kéo, d'où part la sente. */
const SENTE_FROM: Vec2 = (() => {
  const node = (id: string) => PATH_NODES_3E.find((n) => n.id === id)!.at;
  const line = [node('sa2-a'), node('sa2-b'), node('ondes')];
  let best = line[0];
  for (let k = 0; k < line.length - 1; k++) {
    const a = line[k],
      c = line[k + 1];
    const dx = c.x - a.x,
      dz = c.z - a.z;
    const t = Math.min(1, Math.max(0, ((AT.x - a.x) * dx + (AT.z - a.z) * dz) / (dx * dx + dz * dz)));
    const p = { x: a.x + dx * t, z: a.z + dz * t };
    if (distance(p, AT) < distance(best, AT)) best = p;
  }
  return best;
})();

/** Le sens de la sente, de Kéo vers le chemin. */
const DOWN: Vec2 = (() => {
  const len = distance(SENTE_FROM, AT);
  return { x: (SENTE_FROM.x - AT.x) / len, z: (SENTE_FROM.z - AT.z) / len };
})();

/** Un point à `r` de Kéo, à `deg` degrés du sens de la sente (positif : vers la droite en descendant). */
const around = (deg: number, r: number): Vec2 => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: AT.x + (DOWN.x * c - DOWN.z * s) * r,
    z: AT.z + (DOWN.z * c + DOWN.x * s) * r,
  };
};

/**
 * Le Cèdre, un Détour comme les autres (son nom : la proposition, § 8). `face` va de la vue vers Kéo : la caméra regarde
 * à l'opposé (`detourCap`). `says` : la phrase de Kéo, écrite sous le nom et lue après lui (proposition, au directeur du
 * contenu).
 */
export const CEDRE: Detour = {
  id: 'cedre',
  land: 'prairies',
  name: 'Le Cèdre',
  kind: 'cedre',
  at: AT,
  radius: 2.2,
  foot: AT,
  face: Math.atan2(-LOOK.z, -LOOK.x),
  sente: [SENTE_FROM, AT],
  view: CEDRE_VIEW,
  says: 'Un seul arbre, et toute la montagne en face.',
};

/**
 * Les couleurs : le tronc gris-brun, son dessus un cran plus clair ; le vert profond des plateaux, leur dessus au soleil
 * plus clair, leur dessous à l'ombre (jamais presque noir) ; les trois pierres des Détours.
 */
const C = {
  trunk: 0x7a6c5e,
  trunkTop: 0x8c7e6e,
  needles: 0x56765a,
  needlesTop: 0x6e8f68,
  needlesUnder: 0x4a6650,
  flat: 0xc9c0ae,
  flatSide: 0xa9a08f,
} as const;

/** Le sol sous un point. */
type Ground = (x: number, z: number) => number;

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus) : leur place, leur rayon. */
export const CEDRE_STONES = [
  { deg: -42, r: 2.0, size: 0.5 },
  { deg: 40, r: 2.1, size: 0.45 },
  { deg: 125, r: 1.9, size: 0.4 },
] as const;

/** Le pied d'une pierre de `CEDRE_STONES`, dans le monde. */
export const cedreStoneAt = (k: number): Vec2 => around(CEDRE_STONES[k].deg, CEDRE_STONES[k].r);

/** Le milieu d'un plateau, dans le monde. */
const tierAt = (k: number): Vec2 => ({
  x: SPOT.x + RIGHT.x * TIERS[k].dx + LOOK.x * TIERS[k].df,
  z: SPOT.z + RIGHT.z * TIERS[k].dx + LOOK.z * TIERS[k].df,
});

/** Le tronc : un fût à cinq pans enfoncé dans l'herbe, plus large au pied, jusque sous le dernier plateau. */
function trunk(b: FacetBuilder, ground: Ground): void {
  const g = ground(SPOT.x, SPOT.z);
  b.prism({ x: SPOT.x, y: g - 0.3, z: SPOT.z, yaw: 0.2 }, TRUNK.r0, TRUNK.r1, TRUNK.h + 0.3, 5, C.trunk, C.trunkTop);
}

/**
 * Les plateaux : chacun un disque épais à six pans, son dessous à l'ombre, son flanc vert, son dessus clair au soleil ;
 * le plus haut, à cinq pans et sans dessous (on ne le voit que d'en bas, de loin), plat lui aussi : jamais la pointe
 * d'un sapin.
 */
function tiers(b: FacetBuilder, ground: Ground): void {
  const g = ground(SPOT.x, SPOT.z);
  TIERS.forEach((t, k) => {
    const p = tierAt(k);
    if (k === TIERS.length - 1) {
      b.prism({ x: p.x, y: g + t.y, z: p.z, yaw: t.yaw }, t.r, t.r * 0.8, t.t, 5, C.needles, C.needlesTop);
      return;
    }
    // Le dessous, un peu plus étroit et à l'ombre ; puis le plateau, qui s'amincit vers le haut.
    b.prism({ x: p.x, y: g + t.y - t.t * 0.4, z: p.z, yaw: t.yaw }, t.r * 0.82, t.r, t.t * 0.4, 6, C.needlesUnder);
    b.prism({ x: p.x, y: g + t.y, z: p.z, yaw: t.yaw }, t.r, t.r * 0.9, t.t, 6, C.needles, C.needlesTop);
  });
}

function stones(b: FacetBuilder, ground: Ground): void {
  CEDRE_STONES.forEach((s, k) => {
    const p = cedreStoneAt(k);
    b.prism({ x: p.x, y: ground(p.x, p.z) - 0.05, z: p.z, yaw: CEDRE.face + k }, s.size, s.size * 0.85, 0.22, 4, C.flatSide, C.flat);
  });
}

/** La sente du Cèdre, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret, comme à la Bergerie. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = CEDRE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, ground(a.x + dx * t, a.z + dz * t) + SENTE.lift, a.z + dz * t - dx * o];
  // Elle s'arrête un pas avant Kéo, aux pierres.
  const end = len - 1.2;
  for (let s = 0; s < end; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(end, s + SENTE.dash);
    b.quad(p(s, SENTE.half), p(s, -SENTE.half), p(e, -SENTE.half), p(e, SENTE.half), SENTE.color);
  }
}

/**
 * Le décor du Cèdre, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : le tronc, les plateaux, les
 * pierres, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la sente : le plafond de 175
 * triangles (proposition, § 8).
 */
export function cedreFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  trunk(b, ground);
  tiers(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan du Cèdre, pour les tests : le pied, les plateaux dans le monde, la sente, les couleurs. */
export const CEDRE_LAYOUT = {
  look: LOOK,
  spot: SPOT,
  trunk: TRUNK,
  senteFrom: SENTE_FROM,
  colors: C,
  tiers: TIERS.map((t, k) => ({ ...tierAt(k), r: t.r, y: t.y })),
  /** La distance d'un point à la sente. */
  clearOfSente: (p: Vec2) => distanceToPolyline(p, [SENTE_FROM, AT]),
} as const;
