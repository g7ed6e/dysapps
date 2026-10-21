// Le Détour du Perchoir (GD-22, lot 16 ; intention du directeur artistique du 21 octobre 2026, « Le Détour du Perchoir ») :
// le quatrième Détour du 5e, aux Aiguilles, parti avec le dernier lieu de la terre. On s'arrête au pied d'une aiguille, sur
// une dalle bordée d'un muret bas, et on regarde la terre des Aiguilles et, au-delà, le mur de nuages. Pas de récompense,
// pas de compteur, pas de mission ni d'étape ; rien à lire. Sa place, sa dalle, son muret et sa sente sont au plan
// (./plan5e.ts, `PERCHOIR_5E`).
//
// La silhouette : une dalle de quatre tuiles de pierre chaude, aux joints d'un gris sombre, à fleur du sol (sans marche) ;
// un muret bas de cinq gros blocs de pierre grise (0,6 de haut environ, sous le regard de Kéo) en équerre sur ses côtés
// nord et est, ouvert à l'ouest, du côté de la sente, et au sud ; une lanterne d'ocre sur le coin du muret, allumée dès le
// départ, fixe (une lueur qui invite, jamais un rallumage) ; dehors, les trois pierres plates des Détours. Ni banc, ni
// marche, ni anneau, ni longue-vue. Distinct du Creux (un tronc), de la Hutte (une cabane) et de la Faille (un pont de
// racines) : une terrasse de pierre. Code pur.
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance } from './geometry';
import { COLORS_5E, PERCHOIR_5E } from './plan5e';
import { SENTE_5E } from './creux5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/**
 * La vue du Perchoir à l'arrivée (retouche 1) : la caméra descend de 3 (elle reste à 4 au-dessus de Kéo, au lieu de 15 pour la
 * vue commune), sans reculer plus, cap nord : environ 9° de plongée, l'horizon au tiers haut de l'image, la terre des
 * Aiguilles et le mur de nuages dans le cadre.
 */
const PERCHOIR_VIEW = { height: -3, back: 1, turn: 0 } as const;

/** Le Détour du Perchoir : sur sa terre, les Aiguilles ; Kéo arrive sur la dalle, devant le muret. */
export const PERCHOIR: Detour = {
  id: 'perchoir',
  land: 'aiguilles',
  name: 'Le Perchoir',
  kind: 'perchoir',
  at: PERCHOIR_5E.at,
  radius: 1.3,
  foot: PERCHOIR_5E.at,
  face: PERCHOIR_5E.face,
  sente: PERCHOIR_5E.sente,
  view: PERCHOIR_VIEW,
};

/**
 * Les couleurs : les dalles chaudes et leurs joints, les gros blocs gris (la pierre du plateau, avec un chaperon de dalle
 * chaude dessus : il bloque la marche, il se lit par sa forme et par son ton), la lanterne d'ocre et son bronze, les pierres
 * plates des Détours.
 */
const C = {
  tile: 0xcfc6b4,
  tileSide: 0xb4ab98,
  joint: 0x777d77,
  block: COLORS_5E.stone,
  blockTop: 0xcfc6b4,
  lantern: COLORS_5E.lantern,
  bronze: 0xb8954f,
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
} as const;

/** Le sol sous un point du monde. */
const groundAt = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** La dalle : son dessus au-dessus du sol (`top`), son pied enfoncé dessous (`sink`), l'écart des joints entre ses tuiles (`gap`). */
const SLAB = { top: 0.12, sink: 0.3, gap: 0.08 } as const;

/** Les blocs du muret : le côté nord, d'ouest en est, puis le côté est, du nord au sud ; la hauteur de chacun (jamais deux pareils) et son désaxement. */
const WALL_BLOCKS = [
  { side: 'north', from: -2, to: -0.5, h: 0.58 },
  { side: 'north', from: -0.5, to: 1, h: 0.64 },
  { side: 'north', from: 1, to: 2.5, h: 0.6 },
  { side: 'east', from: -1.5, to: 0, h: 0.54 },
  { side: 'east', from: 0, to: 1.5, h: 0.62 },
] as const;

/** Là où pose la lanterne : sur le coin nord-est du muret, depuis le centre de la dalle. */
export const PERCHOIR_LANTERN = { dx: PERCHOIR_5E.half.x + PERCHOIR_5E.wall.thick / 2, dz: -PERCHOIR_5E.half.z - PERCHOIR_5E.wall.thick / 2, r: 0.2, h: 0.4 } as const;

/** La dalle : quatre tuiles (deux sur deux) sur un fond de joints. Quarante-deux triangles. */
function slab(b: FacetBuilder, g: number): void {
  const { center: c, half: h } = PERCHOIR_5E;
  const w = (2 * h.x) / 2,
    d = (2 * h.z) / 2;
  b.quad([c.x - h.x, g + 0.02, c.z - h.z], [c.x - h.x, g + 0.02, c.z + h.z], [c.x + h.x, g + 0.02, c.z + h.z], [c.x + h.x, g + 0.02, c.z - h.z], C.joint);
  for (const i of [0, 1])
    for (const j of [0, 1]) {
      const x = c.x - h.x + w * (i + 0.5);
      const z = c.z - h.z + d * (j + 0.5);
      b.box({ x, y: g - SLAB.sink, z }, [w - SLAB.gap, SLAB.sink + SLAB.top, d - SLAB.gap], C.tileSide, C.tile);
    }
}

/** Le muret : cinq gros blocs, en équerre sur les côtés nord et est de la dalle. Cinquante triangles. */
function wall(b: FacetBuilder, g: number): void {
  const { center: c, half: h, wall: wl } = PERCHOIR_5E;
  for (const k of WALL_BLOCKS) {
    const len = k.to - k.from - 0.06;
    const mid = (k.from + k.to) / 2;
    const north = k.side === 'north';
    const x = north ? c.x + mid : c.x + h.x + wl.thick / 2;
    const z = north ? c.z - h.z - wl.thick / 2 : c.z + mid;
    b.box({ x, y: g - 0.25, z }, north ? [len, k.h + 0.25, wl.thick] : [wl.thick, k.h + 0.25, len], C.block, C.blockTop);
  }
}

/** La hauteur du dessus du muret au coin de la lanterne. */
const wallTop = (g: number): number => g + WALL_BLOCKS[2].h;

/** La lanterne d'ocre, à quatre pans, son chapeau de bronze en pointe : seize triangles. */
function lantern(b: FacetBuilder, g: number): void {
  const { center: c } = PERCHOIR_5E;
  const L = PERCHOIR_LANTERN;
  const x = c.x + L.dx,
    z = c.z + L.dz,
    y = wallTop(g);
  b.prism({ x, y, z, yaw: Math.PI / 4 }, L.r, L.r, L.h, 4, C.lantern);
  b.prism({ x, y: y + L.h, z, yaw: Math.PI / 4 }, L.r * 1.4, 0, 0.18, 4, C.bronze);
}

/** Les trois pierres plates, à l'ouest de la sente, au pied de la dalle (jamais dessus). */
function stones(b: FacetBuilder): void {
  const e = PERCHOIR_5E.bend;
  for (const [k, s] of [
    { dx: -1.4, dz: 1.6, r: 0.5 },
    { dx: 1.5, dz: 2.9, r: 0.45 },
    { dx: -2.6, dz: -1.8, r: 0.4 },
  ].entries()) {
    const x = e.x + s.dx,
      z = e.z + s.dz;
    b.prism({ x, y: groundAt(x, z) - 0.05, z, yaw: k * 1.3 }, s.r, s.r * 0.85, 0.22, 4, C.stoneSide, C.stone);
  }
}

/**
 * La sente : de la même largeur que celle du Creux, mais continue d'un bout à l'autre de chaque tronçon (un trait par
 * tronçon, un vide à peine au coude) et de terre brune : sur la pierre grise du plateau, une terre pâle ne se lirait pas (1,8:1). Le corps est brun moyen ; son liseré, plus
 * sombre, fait 3:1 au moins sur le plateau (un test le vérifie), et c'est lui qui donne la forme.
 */
export const SENTE_PERCHOIR = { ...SENTE_5E, dash: 12, gap: 0.2, color: 0x6b5a42, edge: 0x4a3d2b, edgeWidth: 0.13 } as const;

/** La sente : par tronçon, un corps brun et ses deux liserés sombres (six triangles), sur un sol presque plat. */
function sente(b: FacetBuilder): void {
  const line = PERCHOIR_5E.sente;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const dx = (c.x - a.x) / len,
      dz = (c.z - a.z) / len;
    const H = SENTE_PERCHOIR.half;
    const p = (t: number, o: number) => [a.x + dx * t + dz * o, groundAt(a.x + dx * t, a.z + dz * t) + SENTE_PERCHOIR.lift, a.z + dz * t - dx * o] as const;
    const W = SENTE_PERCHOIR.edgeWidth;
    let s = carry;
    while (s < len) {
      const e = Math.min(len, s + SENTE_PERCHOIR.dash);
      b.quad(p(s, H - W), p(s, -(H - W)), p(e, -(H - W)), p(e, H - W), SENTE_PERCHOIR.color);
      // Le liseré sombre, de chaque côté du corps.
      b.quad(p(s, H), p(s, H - W), p(e, H - W), p(e, H), SENTE_PERCHOIR.edge);
      b.quad(p(s, -(H - W)), p(s, -H), p(e, -H), p(e, -(H - W)), SENTE_PERCHOIR.edge);
      s = e + SENTE_PERCHOIR.gap;
    }
    carry = s - len;
  }
}

/**
 * Le Perchoir : la dalle, le muret, la lanterne, les trois pierres ; sa sente, si elle est trouvée (`found`). Dans le
 * maillage des lieux : aucun appel de plus.
 */
export function perchoirFacets(found: boolean): Facets {
  const b = new FacetBuilder();
  const g = groundAt(PERCHOIR_5E.center.x, PERCHOIR_5E.center.z);
  slab(b, g);
  wall(b, g);
  lantern(b, g);
  stones(b);
  if (found) sente(b);
  return b.build();
}

/** Les triangles du Perchoir seul (sans sa sente), et avec sa sente : le budget (175 au plus, sente comprise). */
export const perchoirTriangles = (): { perchoir: number; withSente: number } => ({ perchoir: perchoirFacets(false).triangles, withSente: perchoirFacets(true).triangles });

/** Le plafond du Perchoir, sente comprise (intention du directeur artistique du lot 16). */
export const PERCHOIR_TRIANGLES_MAX = 175;

/**
 * Ce qu'on ne marche pas au Perchoir (./freeWalk.ts) : les deux côtés du muret, des boîtes dans le repère de la dalle (le
 * centre en 0, `x` vers l'est, `z` vers le sud). La dalle reste libre : Kéo s'y tient.
 */
export const PERCHOIR_BLOCKED = (() => {
  const { half: h, wall: wl } = PERCHOIR_5E;
  const m = 0.15;
  return [
    { x0: -h.x - m, x1: h.x + wl.thick + m, z0: -h.z - wl.thick - m, z1: -h.z + 0.05 },
    { x0: h.x - 0.05, x1: h.x + wl.thick + m, z0: -h.z - wl.thick - m, z1: h.z + m },
  ] as const;
})();
