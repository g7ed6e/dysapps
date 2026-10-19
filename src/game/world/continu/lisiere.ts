// La Lisière, le lieu de départ du 5e (GD-22, lot 4 ; intention du directeur artistique du 19 octobre 2026) : l'Escale
// du 6e servie dans les matières du 5e (./port.ts dessine les mêmes bâtiments, à la même place de leur repère). La
// pierre grise des Passeurs pour la place, le quai et les soubassements ; le bois brun désaturé du rail de la Montée
// pour les murs, les pontons et le ber ; le bronze ocre pour les ferrures ; l'orange aux seules lanternes. Deux repères
// ne changent pas d'un niveau à l'autre : l'ardoise bleue du toit de l'école et celle, plus claire, de la galerie. Rien
// de ruiné sur la place ni sur le quai. Au bord de l'anse, la graine géante échouée ; au sud-est, sur la ligne de
// l'horizon, la lumière du Phare (vers le 6e). Tout va dans le maillage des lieux : aucun appel de plus. Code pur.
import { FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { ANSE_5E, COLORS_5E, LISIERE, LISIERE_LEVEL, LISIERE_PAVING, LISIERE_QUAY_SPOT, QUAY_5E } from './plan5e';
import type { PortSite } from './port';

/**
 * Les matières de la Lisière (directeur artistique, « Les matières du 5e ») : la pierre grise (`COLORS_5E.stone`, au
 * soleil `stoneSun`), le bois du rail de la Montée (montee5e.ts, `newWood`, autour de #A87A50 à l'écran sous la lumière
 * du 5e ; le bois #A9784A de l'Escale virait à l'orange vif, il ne revient pas), le bronze ocre des ferrures, la lanterne
 * d'ocre (`COLORS_5E.lantern`, que la vue du 5e dessine sans ombre). Les ardoises gardent celles de l'Escale.
 */
const LISIERE_COLORS = {
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

/** Le ponton dans le repère de l'anse (`ANSE_5E`) : son axe (il suit `z`, à ce `x`), de son pied à son bout. */
const PONTON = (() => {
  const foot = ANSE_5E.toLocal(QUAY_5E.from);
  const end = ANSE_5E.toLocal(QUAY_5E.to);
  return { x: (foot.x + end.x) / 2, z0: foot.z, z1: end.z } as const;
})();

/** Un point du repère de l'anse dans celui de la Lisière. */
const fromAnse = (x: number, z: number): readonly [number, number] => {
  const l = LISIERE.toLocal(ANSE_5E.toWorld(x, z));
  return [l.x, l.z];
};

/**
 * La Lisière : son repère, son pavage, sa pierre plate, son quai (au pied du ponton : la lanterne de la région, la
 * ligne des habitants au bord de la place, deux barques amarrées à droite du ponton, dans l'anse, le long de lui ; ni
 * chaperon ni bittes, le ponton tient lieu de quai), ses matières.
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
    lamp: [LISIERE_PAVING.quay.x1 - 0.4, LISIERE_PAVING.quay.z1 - 0.6],
    habitants: { z: 14.5, xs: [6, 16, 30] },
    boats: [0, 1].map((i) => fromAnse(PONTON.x - 2.6, PONTON.z0 + 6 + 4 * i)),
    boatYaw: ANSE_5E.yaw - LISIERE.yaw,
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

/**
 * La graine : au bord de l'anse, sur la vase entre le quai et l'eau, écartée de la Nef vers la rive du Hameau (consultant
 * d'Archipéo, retouche du lot 4), hors du pavage, de l'envol de la Nef et des chemins (dans le repère de la Lisière).
 */
const SEED = { at: LISIERE.toWorld(11, 20), yaw: 2.2, tilt: 0.62, foot: 0.45 } as const;

/**
 * Les couleurs de la graine : un brun-vert, son flanc un cran plus sombre (éclaircis d'un cran à la retouche du lot 4),
 * ses racines, ses deux jeunes feuilles, plus claires, qu'on lit de loin.
 */
const SEED_COLORS = { body: 0x7f7a52, shade: 0x6a6948, root: 0x6d5f4a, leaf: 0x9db86e } as const;

/**
 * La graine géante (directeur artistique, point 3) : échouée de biais dans la vase, un long fuseau de propagule
 * brun-vert, deux fois haut comme Kéo, quelques pointes de racines à son pied, une paire de jeunes feuilles d'environ une
 * unité au sommet. Immobile. Ni sur un chemin, ni entre la caméra et Kéo au quai, ni sur la route de la Nef.
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
  // Deux jeunes feuilles au sommet, d'une unité environ, vues des deux côtés.
  const top = along(3.75);
  for (const side of [-1, 1]) {
    const tip: [number, number, number] = [side * 0.95, top.y - 0.4 + 0.7, top.z + 0.25];
    const a: [number, number, number] = [0, top.y - 0.4, top.z - 0.1];
    const c: [number, number, number] = [side * 0.3, top.y - 0.4 + 0.55, top.z + 0.4];
    b.triangle(a, tip, c, SEED_COLORS.leaf);
    b.triangle(a, c, tip, SEED_COLORS.leaf);
  }
  return placeFacets(b.build(), { x: SEED.at.x, y: SEED.foot, z: SEED.at.z, yaw: SEED.yaw });
}

/** Où est la graine dans le monde (son pied). */
export const SEED_AT: Vec2 = SEED.at;

/** La place de la lumière du Phare depuis le pied du ponton (à 85 unités, au sud-est, là où la mer se lit encore), sa hauteur, sa taille (demi-largeur, demi-hauteur). */
const PHARE_SPOT = { east: 60, south: 60, high: 1.9, w: 1.35, h: 0.65 } as const;

/**
 * La lumière du Phare, vers le 6e (directeur artistique, point 3 de la retouche ; consultant d'Archipéo, point 3 ;
 * référent dys, point 3) : au sud-est de la Lisière, sur la mer, là où la mer visible rejoint le ciel (le brouillard du
 * lointain l'efface tout à fait au-delà de `WORLD_FOG.far` : plus loin, la lumière flottait au-dessus de la ligne). Un
 * seul point chaud, immobile, plus large que haut, deux fois plus grand qu'au premier passage (à l'œil) : la couleur des
 * lanternes du 5e (`COLORS_5E.lantern`, dessinée sans ombre), un liseré sombre derrière elle (le contraste contre le
 * ciel du couchant), et sous elle une petite tour gris-bleu. La vue ne les brouille presque pas (levelWorld.ts,
 * `thinFog`). 28 triangles.
 */
export const PHARE_LIGHT: Vec3 = (() => {
  const q = QUAY_5E.from;
  return { x: q.x + PHARE_SPOT.east, y: PHARE_SPOT.high, z: q.z + PHARE_SPOT.south };
})();

/** Le gris-bleu sombre de la tour et du liseré de la lumière du Phare. */
export const PHARE_DARK = 0x3f4e5c;

/** Un losange plat, plus large que haut, de demi-largeur `w` et de demi-hauteur `h`, tourné vers la Lisière (`yaw`). */
function diamond(b: FacetBuilder, at: Vec3, w: number, h: number, depth: number, yaw: number, color: number): void {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  // La largeur suit la droite de qui regarde depuis la Lisière, la profondeur va vers elle.
  const side = (k: number): [number, number, number] => [at.x + k * c, at.y, at.z - k * s];
  const fore = (k: number): [number, number, number] => [at.x + k * s, at.y, at.z + k * c];
  const ring = [side(w), fore(depth), side(-w), fore(-depth)];
  const up: [number, number, number] = [at.x, at.y + h, at.z];
  const down: [number, number, number] = [at.x, at.y - h, at.z];
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.triangle(ring[n], ring[k], up, color);
    b.triangle(ring[k], ring[n], down, color);
  }
}

export function phareLightFacets(): Facets {
  const b = new FacetBuilder();
  const p = PHARE_LIGHT;
  // Le cap qui regarde la Lisière depuis la lumière (0 : le nord ; la largeur du losange court en travers).
  const q = QUAY_5E.from;
  const yaw = Math.atan2(-(q.x - p.x), -(q.z - p.z));
  // Le liseré sombre, un peu plus grand, juste derrière la lumière.
  const { w, h } = PHARE_SPOT;
  const back = { x: p.x + 0.3 * Math.sin(yaw), y: p.y, z: p.z + 0.3 * Math.cos(yaw) };
  diamond(b, back, 1.25 * w, 1.3 * h, 0.2, yaw, PHARE_DARK);
  diamond(b, p, w, h, 0.35, yaw, COLORS_5E.lantern);
  // La petite tour, sous le point : quatre pans, de la mer jusqu'à lui.
  b.prism({ x: p.x, y: -1, z: p.z, yaw }, 0.55, 0.38, p.y - h + 1, 4, PHARE_DARK);
  return b.build();
}

/** Le décor de la Lisière qui ne change pas : la graine et la lumière du Phare. */
export function lisiereDecorFacets(): Facets {
  const b = new FacetBuilder();
  b.append(seedFacets());
  b.append(phareLightFacets());
  return b.build();
}

/** Le ponton, dans le repère de l'anse (`ANSE_5E` : la Nef, son ber et le gréement s'y rangent). */
export const LISIERE_PONTON = PONTON;
