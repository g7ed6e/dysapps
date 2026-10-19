// La Lisière, le lieu de départ du 5e (GD-22, lot 4 ; intention du directeur artistique du 19 octobre 2026) : l'Escale
// du 6e servie dans les matières du 5e (./port.ts dessine les mêmes bâtiments, à la même place de leur repère). La
// pierre grise des Passeurs pour la place, le quai et les soubassements ; le bois brun désaturé du rail de la Montée
// pour les murs, les pontons et le ber ; le bronze ocre pour les ferrures ; l'orange aux seules lanternes. Deux repères
// ne changent pas d'un niveau à l'autre : l'ardoise bleue du toit de l'école et celle, plus claire, de la galerie. Rien
// de ruiné sur la place ni sur le quai. Dans l'anse, près du ponton, la graine géante échouée ; au sud-est, au ras de
// l'horizon, la lumière du Phare (vers le 6e). Tout va dans le maillage des lieux : aucun appel de plus. Code pur.
import { FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { COLORS_5E, LISIERE, LISIERE_LEVEL, LISIERE_PAVING, LISIERE_QUAY_SPOT, QUAY_5E } from './plan5e';
import { LAMP_COLOR } from './places';
import type { PortSite } from './port';

/**
 * Les matières de la Lisière (directeur artistique, « Les matières du 5e ») : la pierre grise (`COLORS_5E.stone`, au
 * soleil `stoneSun`), le bois du rail de la Montée (montee5e.ts, `newWood`, autour de #A87A50 à l'écran sous la lumière
 * du 5e ; le bois #A9784A de l'Escale virait à l'orange vif, il ne revient pas), le bronze ocre des ferrures, la lanterne
 * d'ocre (`COLORS_5E.lantern`, que la vue du 5e dessine sans ombre). Les ardoises gardent celles de l'Escale.
 */
export const LISIERE_COLORS = {
  stone: COLORS_5E.stone,
  stoneSide: COLORS_5E.stoneShade,
  coping: COLORS_5E.stoneSun,
  plinth: COLORS_5E.stoneShade,
  // Les murs de bois : la façade, et les flancs un cran plus sombres.
  white: 0xa68672,
  wall: 0x8c766a,
  frame: COLORS_5E.stoneSun,
  slate: 0x5b7c99,
  paleSlate: 0x8aa3b8,
  shingle: 0x8c766a,
  wood: 0xa68672,
  darkWood: 0x8c766a,
  newWood: 0xb59a82,
  door: 0x6f5c4c,
  inside: 0x9c8a70,
  socle: COLORS_5E.stoneSun,
  bollard: 0x9c8452,
  lamp: COLORS_5E.lantern,
  habitant: [0x8c9f7a, 0xb5866a, 0x7f93a8],
  skin: 0xd9b38c,
} as const;

/** Le ponton dans le repère de la Lisière : son pied et son axe (il suit `z`, à ce `x`). */
const PONTON = (() => {
  const foot = LISIERE.toLocal(QUAY_5E.from);
  const end = LISIERE.toLocal(QUAY_5E.to);
  return { x: (foot.x + end.x) / 2, z0: foot.z, z1: end.z } as const;
})();

/**
 * La Lisière : son repère, son pavage, sa pierre plate, son quai (au pied du ponton : la lanterne de la région, la
 * ligne des habitants au bord de la place, deux barques amarrées à droite du ponton, dans l'anse ; ni chaperon ni
 * bittes, le ponton tient lieu de quai), ses matières.
 */
export const LISIERE_SITE: PortSite = {
  frame: LISIERE,
  paving: LISIERE_PAVING,
  level: () => LISIERE_LEVEL,
  quaySpot: LISIERE_QUAY_SPOT,
  colors: LISIERE_COLORS,
  quay: {
    coping: false,
    bollards: [],
    lamp: [LISIERE_PAVING.quay.x0 + 0.4, LISIERE_PAVING.square.z1 - 0.4],
    habitants: { z: 14.5, xs: [6, 16, 30] },
    boats: [PONTON.x - 2.6, PONTON.x - 2.6].map((x, i) => [x, PONTON.z0 + 6 + 4 * i] as const),
  },
};

/** La caméra à l'arrivée au quai de la Lisière (question 4 du directeur artistique, réponse recommandée) : vers la Montée. */
export const LISIERE_VIEW = {
  /**
   * Le cap de la caméra (0 : le nord), un peu à droite de la Montée : la Montée au fond, à gauche du milieu, la rangée
   * à sa gauche, la Nef sur son ber à droite. Le changer ici.
   */
  yaw: 0.8,
} as const;

const SEED = { at: LISIERE.toWorld(4, 22), yaw: 2.2, tilt: 0.62 } as const;

/** Les couleurs de la graine : un brun-vert, son flanc plus sombre, ses racines, ses deux jeunes feuilles. */
const SEED_COLORS = { body: 0x6f6a45, shade: 0x5a5a3c, root: 0x6d5f4a, leaf: 0x7f9a5c } as const;

/**
 * La graine géante (directeur artistique, point 3) : dans l'anse, près du ponton, échouée de biais dans la vase, un
 * long fuseau de propagule brun-vert, deux fois haut comme Kéo, quelques pointes de racines à son pied, une paire de
 * jeunes feuilles au sommet. Immobile. Ni sur un chemin, ni entre la caméra et Kéo au quai, ni sur la route de la Nef.
 */
export function seedFacets(): Facets {
  const b = new FacetBuilder();
  const tilt = SEED.tilt;
  const along = (l: number) => ({ y: l * Math.cos(tilt), z: l * Math.sin(tilt) });
  // Le fuseau : trois troncs de cône le long de l'axe penché, de la vase à la pointe.
  const parts: readonly [number, number, number, number][] = [
    // [début, longueur, rayon bas, rayon haut]
    [0, 1.3, 0.34, 0.5],
    [1.3, 1.5, 0.5, 0.36],
    [2.8, 1.0, 0.36, 0.1],
  ];
  parts.forEach(([l, h, r0, r1], i) => {
    const p = along(l);
    b.prism({ x: 0, y: p.y - 0.4, z: p.z, pitch: tilt }, r0, r1, h, 7, i === 1 ? SEED_COLORS.body : SEED_COLORS.shade, SEED_COLORS.body);
  });
  // Les pointes des racines, au pied, dans la vase.
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.4;
    b.beam({ x: 0.2 * Math.cos(a), y: -0.2, z: 0.2 * Math.sin(a) }, { x: 0.75 * Math.cos(a), y: -0.55, z: 0.75 * Math.sin(a) }, 0.1, SEED_COLORS.root);
  }
  // Deux jeunes feuilles au sommet, vues des deux côtés.
  const top = along(3.75);
  for (const side of [-1, 1]) {
    const tip: [number, number, number] = [side * 0.55, top.y - 0.4 + 0.45, top.z + 0.15];
    const a: [number, number, number] = [0, top.y - 0.4, top.z - 0.08];
    const c: [number, number, number] = [side * 0.2, top.y - 0.4 + 0.35, top.z + 0.25];
    b.triangle(a, tip, c, SEED_COLORS.leaf);
    b.triangle(a, c, tip, SEED_COLORS.leaf);
  }
  return placeFacets(b.build(), { x: SEED.at.x, y: 0.1, z: SEED.at.z, yaw: SEED.yaw });
}

/** Où est la graine dans le monde (son pied). */
export const SEED_AT: Vec2 = SEED.at;

/**
 * La lumière du Phare, vers le 6e (directeur artistique, point 8) : au sud-est de la Lisière, au ras de l'horizon, un
 * seul point chaud, immobile, de la couleur de la lampe du 6e (`LAMP_COLOR`) : la vue la dessine sans ombre et le
 * brouillard du lointain ne l'efface qu'à peine. Huit triangles.
 */
export const PHARE_LIGHT: Vec3 = { x: 500, y: 3, z: 400 };

export function phareLightFacets(): Facets {
  const b = new FacetBuilder();
  const { x, y, z } = PHARE_LIGHT;
  const r = 2.6;
  const ring: [number, number, number][] = [0, 1, 2, 3].map((k) => [x + r * Math.cos((k * Math.PI) / 2), y, z + r * Math.sin((k * Math.PI) / 2)]);
  const up: [number, number, number] = [x, y + r * 1.3, z];
  const down: [number, number, number] = [x, y - r * 1.3, z];
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.triangle(ring[n], ring[k], up, LAMP_COLOR);
    b.triangle(ring[k], ring[n], down, LAMP_COLOR);
  }
  return b.build();
}

/** Le décor de la Lisière qui ne change pas : la graine et la lumière du Phare. */
export function lisiereDecorFacets(): Facets {
  const b = new FacetBuilder();
  b.append(seedFacets());
  b.append(phareLightFacets());
  return b.build();
}

/** Le ponton, dans le repère de la Lisière (la Nef et le gréement s'y rangent). */
export const LISIERE_PONTON = PONTON;
