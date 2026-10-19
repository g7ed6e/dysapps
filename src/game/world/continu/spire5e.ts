// La forme des aiguilles du 5e (GD-22, lot 2, retouche : « une seule famille d'aiguilles, effilées et facettées ») : un
// fût à pans qui se resserre, un second, tourné d'un demi-pan et un peu penché (une arête de plus au soleil, un replat
// entre les deux), puis sa pointe. La même pour les aiguilles du plateau (./terrain5e.ts) et pour la Montée, la plus
// haute (./ruins5e.ts) : les silhouettes de l'île sont d'une seule famille. Quatre à six aplats par aiguille : la pierre
// de ses pans (au soleil, à l'ombre, par la lumière), la mousse grise de son replat, la pierre claire de sa pointe, que le
// soleil bas prend. Code pur.
import type { FacetBuilder } from './facets';
import { COLORS_5E } from './plan5e';

/** Une aiguille, dans le repère de qui la dessine : son pied, son rayon au pied, sa hauteur, ses pans, son quart de tour. */
export interface Spire {
  x: number;
  y: number;
  z: number;
  radius: number;
  height: number;
  sides: number;
  turn: number;
}

/**
 * Les proportions d'une aiguille : la part de la hauteur de chaque tronçon (le fût, le second fût, la pointe), le rayon
 * relatif en haut de chacun, le penché du second fût (en part du rayon) et la hauteur du replat moussu.
 */
const SPIRE = { low: 0.46, mid: 0.36, lowTop: 0.6, midBottom: 0.56, midTop: 0.28, lean: 0.12, ledge: 0.04 } as const;

/**
 * Un tronc de cône à `sides` pans, sans dessus ni dessous, d'un anneau à l'autre : leurs centres peuvent différer
 * (`shift`, vers l'est), et leurs pans aussi (`yaw0`, `yaw1` : un anneau tourné fait des pans en biais, sans jour entre
 * deux tronçons).
 */
function frustum(b: FacetBuilder, s: Spire, y0: number, r0: number, y1: number, r1: number, yaw0: number, yaw1: number, shift: number, color: number): void {
  const ring = (y: number, r: number, dx: number, yaw: number) =>
    Array.from({ length: s.sides }, (_, k) => {
      const a = yaw + (2 * Math.PI * k) / s.sides;
      return [s.x + dx + r * Math.cos(a), s.y + y, s.z + r * Math.sin(a)] as const;
    });
  const lo = ring(y0, r0, 0, yaw0);
  const hi = ring(y1, r1, shift, yaw1);
  for (let k = 0; k < s.sides; k++) {
    const n = (k + 1) % s.sides;
    if (r1 > 0) b.quad(lo[n], lo[k], hi[k], hi[n], color);
    else b.triangle(lo[n], lo[k], hi[k], color);
  }
}

/** Une aiguille : son fût, le replat moussu, le second fût penché d'un demi-pan, sa pointe claire. */
export function spire(b: FacetBuilder, s: Spire): number {
  const h = s.height;
  const r = s.radius;
  const yLow = h * SPIRE.low;
  const yMid = yLow + h * SPIRE.mid;
  const half = Math.PI / s.sides;
  const lean = r * SPIRE.lean;
  const turned = s.turn + half;
  frustum(b, s, 0, r, yLow, r * SPIRE.lowTop, s.turn, s.turn, 0, COLORS_5E.stone);
  // Le replat : une bande de mousse grise, du haut du fût au pied du second, qui tourne d'un demi-pan.
  frustum(b, s, yLow, r * SPIRE.lowTop, yLow + h * SPIRE.ledge, r * SPIRE.midBottom, s.turn, turned, 0, COLORS_5E.plateauMoss);
  frustum(b, s, yLow + h * SPIRE.ledge, r * SPIRE.midBottom, yMid, r * SPIRE.midTop, turned, turned, lean, COLORS_5E.stone);
  frustum(b, { ...s, x: s.x + lean }, yMid, r * SPIRE.midTop, h, 0, turned, turned, lean * 0.5, COLORS_5E.stoneSun);
  return spireTriangles(s.sides);
}

/** Les triangles d'une aiguille : trois troncs (deux par pan) et sa pointe (un par pan). */
export const spireTriangles = (sides: number): number => 7 * sides;

/** Le rayon d'une aiguille à une hauteur au-dessus de son pied (sur son fût, puis le second), pour y poser un rail. */
export function spireRadiusAt(s: Pick<Spire, 'radius' | 'height'>, y: number): number {
  const yLow = s.height * SPIRE.low;
  if (y <= yLow) return s.radius * (1 + ((SPIRE.lowTop - 1) * y) / yLow);
  const y0 = yLow + s.height * SPIRE.ledge;
  const y1 = yLow + s.height * SPIRE.mid;
  const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
  return s.radius * (SPIRE.midBottom + (SPIRE.midTop - SPIRE.midBottom) * t);
}
