/**
 * Le Détour de la Dalle (lot 3 du monde ouvert du 4e, l'Épaule ; intention du directeur artistique du 22 octobre 2026,
 * « Le Détour de la Dalle ») : sur le mécanisme de l'Épave (./epave4e.ts) : un endroit hors des chemins, que l'élève
 * trouve en marchant ; Kéo s'y arrête, la vue se tourne vers la mer, « La Dalle » s'écrit une fois, Kéo dit sa phrase, et
 * une sente reste tracée pour de bon après la première arrivée. Ni compteur, ni récompense, ni mission.
 *
 * La place : au bord de l'épaule, sur la roche, à douze unités de la mer (./plan4e.ts, `DALLE_4E`). Une seule dalle plate
 * de basalte clair (le dessus des Orgues), à peine inclinée, posée sur quatre colonnes hexagonales basses, un bout d'orgue
 * sorti de terre ; côté mer, au nord de la dalle, un muret de trois gros blocs bruts ; une lanterne d'ocre sur un poteau
 * bas au pied de la dalle, allumée dès le départ. Rien d'autre : pas de banc (la dalle en tient lieu), pas de silhouette
 * assise, rien à lire. La vue regarde au nord-nord-est, jamais à l'est de 55° (l'embouchure de la coulée est à 106°). Le
 * dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { hexColumn, lantern } from './epauleKit';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { DALLE_4E } from './plan4e';

/** Vers la mer depuis Kéo : au nord-nord-est, vingt degrés à l'est du nord (intention, « L'arrivée ») ; et sa droite. */
const SEA: Vec2 = { x: Math.sin(DALLE_4E.look), z: -Math.cos(DALLE_4E.look) };
const RIGHT: Vec2 = { x: -SEA.z, z: SEA.x };

/**
 * La vue de la Dalle à l'arrivée : la caméra se tourne vers la mer, recule un peu et descend vers Kéo (à sa hauteur, la
 * correction du mainteneur), comme à l'Épave. Retouche 1 (directeur artistique, point 13 ; consultant UX UI, point 11 :
 * Kéo, grand au centre, cachait la dalle, et le muret restait hors du cadre) : un peu plus haute et plus reculée, pour
 * que la dalle, le muret et la mer se lisent au-delà de Kéo.
 */
const DALLE_VIEW = { height: -1.6, back: 1.35, turn: 0 } as const;

/**
 * Le budget de la Dalle (intention, « Le coût ») : 175 triangles au plus sans la sente, dans le maillage des lieux ; et sa
 * sente, une fois tracée, au plus `sente` de plus.
 */
export const DALLE_BUDGET = { triangles: 175, sente: 170 } as const;

/** Là où Kéo s'arrête : sur la roche, au sud de la dalle, face à la mer. */
const AT: Vec2 = { x: DALLE_4E.at.x, z: DALLE_4E.at.z };

/**
 * La Dalle, un Détour comme les autres. `face` va de la mer vers Kéo : la caméra regarde à l'opposé (`detourCap`). Kéo
 * dit sa phrase à l'arrivée (`says`, contenu, qui fait foi).
 */
export const DALLE: Detour = {
  id: 'dalle',
  land: 'epaule',
  name: 'La Dalle',
  kind: 'dalle',
  at: AT,
  radius: 2.5,
  foot: AT,
  face: Math.atan2(-SEA.z, -SEA.x),
  sente: [{ x: DALLE_4E.senteFrom.x, z: DALLE_4E.senteFrom.z }, AT],
  view: DALLE_VIEW,
  // Les îles du ciel ne sont pas dans la scène du 4e : la phrase ne promet que ce qu'on voit (retouche 1, point 2).
  says: 'D’ici, on voit toute la mer.',
};

/**
 * Les couleurs : le basalte clair des Orgues (la dalle, ses colonnes), tiré vers le gris comme lui (retouche 1, point 13 :
 * un cran trop brun), les blocs bruts du muret ; la lanterne de l'Épaule.
 */
const C = {
  slab: 0x8a8682,
  slabSide: 0x6c6865,
  column: 0x6c6865,
  columnJoint: 0x63605d,
  block: 0x6e6a67,
  blockTop: 0x7c7874,
  pole: 0x6e645c,
} as const;

/** Le sol sous un point, jamais sous l'eau. */
type Ground = (x: number, z: number) => number;

/**
 * La dalle : son milieu (à `ahead` de Kéo vers la mer), sa longueur (en travers), sa profondeur, son épaisseur, sa pente
 * (3°), la hauteur de son dessous au-dessus du sol ; ses quatre colonnes (rayon, place depuis son milieu).
 */
const SLAB = { ahead: 3.2, long: 5, deep: 3, thick: 0.4, tilt: (3 * Math.PI) / 180, lift: 0.62, column: 0.36, legs: [1.8, 0.85] as const } as const;

/**
 * Le muret : ses trois blocs bruts, côté mer (à `ahead` de Kéo), leur décalage en travers, leur taille, leur cap. Plus
 * hauts que la dalle (retouche 1, point 13), pour qu'ils se voient derrière elle à l'arrivée, comme sur la planche.
 */
const WALL = [
  { ahead: 5.5, side: -1.9, s: [1.2, 1.45, 1.0], yaw: 0.3 },
  { ahead: 5.8, side: 0.15, s: [1.35, 1.7, 1.1], yaw: -0.2 },
  { ahead: 5.4, side: 2.2, s: [1.1, 1.3, 0.95], yaw: 0.6 },
] as const;

/** La lanterne : sur un poteau bas, au pied de la dalle, à droite de Kéo ; la hauteur de son poteau. */
const LAMP = { ahead: 1.3, side: 2.7, pole: 1.35 } as const;

/** Un point à `ahead` de Kéo vers la mer et `side` sur sa droite. */
const from = (ahead: number, side: number): Vec2 => ({ x: AT.x + SEA.x * ahead + RIGHT.x * side, z: AT.z + SEA.z * ahead + RIGHT.z * side });

/** Le cap d'un volume aligné sur la dalle (son `x` en travers, vers la droite de Kéo). */
const YAW = Math.atan2(-RIGHT.z, RIGHT.x);

/** La dalle sur ses quatre colonnes hexagonales basses. */
function slab(b: FacetBuilder, ground: Ground): void {
  const S = SLAB;
  const c = from(S.ahead, 0);
  const y = ground(c.x, c.z) + S.lift;
  b.box({ x: c.x, y, z: c.z, yaw: YAW, pitch: S.tilt }, [S.long, S.thick, S.deep], C.slabSide, C.slab);
  for (const sa of [-1, 1])
    for (const ss of [-1, 1]) {
      const p = from(S.ahead + sa * S.legs[1], ss * S.legs[0]);
      const g = ground(p.x, p.z);
      hexColumn(b, p.x, p.z, S.column, 0.3 * (sa + 2 * ss), g - 0.4, () => y + 0.05, [C.column, C.columnJoint], C.slab);
    }
}

/** Le muret de trois gros blocs bruts, côté mer. */
function wall(b: FacetBuilder, ground: Ground): void {
  for (const w of WALL) {
    const p = from(w.ahead, w.side);
    b.box({ x: p.x, y: ground(p.x, p.z) - 0.3, z: p.z, yaw: YAW + w.yaw }, [w.s[0], w.s[1] + 0.3, w.s[2]], C.block, C.blockTop);
  }
}

/** La lanterne d'ocre sur son poteau bas, allumée dès le départ. */
function lamp(b: FacetBuilder, ground: Ground): void {
  const p = from(LAMP.ahead, LAMP.side);
  const y = ground(p.x, p.z);
  b.box({ x: p.x, y: y - 0.3, z: p.z }, [0.12, LAMP.pole + 0.3, 0.12], C.pole);
  lantern(b, { x: p.x, y: y + LAMP.pole + 0.02, z: p.z }, true, 0.9);
}

/** La sente de la Dalle, en pointillé sur la roche : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par tiret. */
function sente(b: FacetBuilder, ground: Ground): void {
  const [a, c] = DALLE.sente;
  const len = distance(a, c);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const p = (t: number, o: number): readonly [number, number, number] => [a.x + dx * t + dz * o, Math.max(0, ground(a.x + dx * t, a.z + dz * t)) + SENTE.lift, a.z + dz * t - dx * o];
  for (let s = 0; s < len; s += SENTE.dash + SENTE.gap) {
    const e = Math.min(len, s + SENTE.dash);
    for (let t = s; t < e - 1e-6; t += 0.7) {
      const t1 = Math.min(e, t + 0.7);
      b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
    }
  }
}

/**
 * Le décor de la Dalle, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : la dalle sur ses colonnes,
 * le muret, la lanterne, et sa sente une fois trouvée (`found`), dans le monde comme sur la Carte. Sans la sente : le
 * plafond de 175 triangles.
 */
export function dalleFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  slab(b, ground);
  wall(b, ground);
  lamp(b, ground);
  if (found) sente(b, ground);
  return b.build();
}

/** Le plan de la Dalle, pour les tests : vers la mer, la dalle, le muret, la lanterne. */
export const DALLE_LAYOUT = { sea: SEA, slab: SLAB, wall: WALL, lamp: LAMP, at: AT, from } as const;
