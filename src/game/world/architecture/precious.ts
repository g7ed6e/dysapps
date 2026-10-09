// Le précieux de la table commune (intention du directeur artistique, 9 octobre 2026) : le lingot (le trophée d'or), le
// cristal (le trophée de cristal) et la cloche de l'école. Des volumes simples, opaques, jamais une lueur ni une
// transparence : le lingot et la cloche sont des troncs de pyramide (10 triangles, ceux qu'un cube montre), le cristal un
// prisme carré coiffé d'une pyramide (12 triangles, dont 9 dessinés : son flanc et sa pente du fond, tournés vers le
// velours, ne le sont pas ; world/construction.ts), aux proportions du cristal du décor (world/decor/common.ts) réduites.
// Dessinés dans leur case, en coordonnées de grille (x, y de 0 à 1, z : hauteur), centrés ; rien ne sort de la case.
// Code pur, sans Three.js.
import type { DessinDePiece, Facette, V3 } from './rooms';

/** Les mesures du précieux, en part de case. */
export const PRECIOUS = {
  /** Le lingot : sa base (x, y), son dessus, sa hauteur ; bas, plus large que profond. */
  ingot: { base: [0.8, 0.5], dessus: [0.6, 0.32], haut: 0.3 },
  /** Le cristal : le côté de son prisme, la hauteur du prisme, puis celle de sa pointe. */
  crystal: { cote: 0.28, prisme: 0.4, pointe: 0.26 },
  /** La cloche : sa largeur en bas (évasée), en haut, et sa hauteur ; posée sur la souche du clocheton. */
  bell: { bas: 0.8, dessus: 0.36, hauteur: 0.45 },
} as const;

/** La normale d'un polygone plan (ses trois premiers points, dans le sens direct vu du dehors). */
export function normalOf(p: V3[]): V3 {
  const [a, b, c] = p;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n);
  return [n[0] / l, n[1] / l, n[2] / l];
}

const facet = (points: V3[], face: 'dessus' | 'cote'): Facette => ({ points, normale: normalOf(points), face, motif: 0 });

/**
 * Un tronc de pyramide centré dans la case, de la base (`bx` × `by`, à `z0`) au dessus (`hx` × `hy`, à `z1`) : son dessus
 * et ses quatre flancs (le dessous, posé, n'est pas dessiné ; l'assemblage cache ce qui touche un bloc plein).
 */
export function frustum(bx: number, by: number, hx: number, hy: number, z0: number, z1: number): Facette[] {
  const b = (sx: number, sy: number): V3 => [0.5 + (sx * bx) / 2, 0.5 + (sy * by) / 2, z0];
  const h = (sx: number, sy: number): V3 => [0.5 + (sx * hx) / 2, 0.5 + (sy * hy) / 2, z1];
  return [
    facet([h(-1, -1), h(1, -1), h(1, 1), h(-1, 1)], 'dessus'),
    facet([b(-1, -1), b(1, -1), h(1, -1), h(-1, -1)], 'cote'),
    facet([b(1, -1), b(1, 1), h(1, 1), h(1, -1)], 'cote'),
    facet([b(1, 1), b(-1, 1), h(-1, 1), h(1, 1)], 'cote'),
    facet([b(-1, 1), b(-1, -1), h(-1, -1), h(-1, 1)], 'cote'),
  ];
}

/** Le lingot d'or : un tronc de pyramide bas (10 triangles). */
export function ingot(): DessinDePiece {
  const { base, dessus, haut } = PRECIOUS.ingot;
  return { facettes: frustum(base[0], base[1], dessus[0], dessus[1], 0, haut), couvre: 0 };
}

/** Le cristal : un prisme carré (ses quatre flancs) coiffé d'une pyramide (quatre faces) : 12 triangles. */
export function crystal(): DessinDePiece {
  const { cote, prisme, pointe } = PRECIOUS.crystal;
  const flancs = frustum(cote, cote, cote, cote, 0, prisme).slice(1);
  const s: V3 = [0.5, 0.5, prisme + pointe];
  const c = (sx: number, sy: number): V3 => [0.5 + (sx * cote) / 2, 0.5 + (sy * cote) / 2, prisme];
  const pointes = [
    [c(-1, -1), c(1, -1), s],
    [c(1, -1), c(1, 1), s],
    [c(1, 1), c(-1, 1), s],
    [c(-1, 1), c(-1, -1), s],
  ].map((p) => facet(p, 'dessus'));
  return { facettes: [...flancs, ...pointes], couvre: 0 };
}

/** La cloche : un tronc de pyramide évasé vers le bas, posé au pied de sa case (10 triangles). */
export function bell(): DessinDePiece {
  const { bas, dessus, hauteur } = PRECIOUS.bell;
  return { facettes: frustum(bas, bas, dessus, dessus, 0, hauteur), couvre: 0 };
}

/** La hauteur d'un trophée dessiné, là où se pose celui du dessus (le haut du prisme pour le cristal : sa pointe entre dans le trophée posé sur lui). */
export const RESTING_HEIGHT = { ingot: PRECIOUS.ingot.haut, crystal: PRECIOUS.crystal.prisme } as const;
