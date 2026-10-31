// Ce qu'un toucher dans la 3D ouvre (GD-20, point 4, lot L1 « Livrer » ; consultant UX UI, « Le toucher d'un aménagement
// posé », 17 octobre 2026, recommandations 1, 2 et 4, validées par le directeur artistique). Une seule règle pour les
// dix-neuf aménagements, sans exception de place :
// - toucher un aménagement posé ouvre son lieu, toujours le sien, même s'il est hors du rayon de toucher du lieu ou dans
//   celui d'un autre : l'élève a visé une chose précise, pas le sol ;
// - la cible est son dessin à l'écran, plus un disque invisible autour de lui, du même rayon que celui d'un pont tombé
//   (`BRIDGE_TOUCH.pixels`, 48 px de diamètre au moins, à toute distance) : le dessin gagne quand on le touche en plein,
//   le disque rattrape le doigt qui le rate ; rien ne s'allume, rien ne bouge ;
// - entre deux aménagements, le plus proche du doigt ; entre deux lieux, le plus proche du point touché, jamais le
//   premier de la liste.
// Ce qu'il ouvre (la marche jusqu'au lieu, puis son panneau ; la fiche d'une terre fermée) reste à la scène. Code pur.
import { BRIDGE_TOUCH } from './bridges';
import { distance, type Vec2 } from './geometry';
import type { OpenPlace, PlaceId } from './levelPlan';
import type { ScreenBox } from './questionScene';

/** Le lieu, parmi `places` (ceux du plan), dont le rayon de toucher prend `p` : le plus proche de son centre, s'il y en a plusieurs ; sinon rien. */
export function nearestPlace(p: Vec2, places: readonly Pick<OpenPlace, 'id' | 'center' | 'touchRadius'>[]): PlaceId | null {
  let best: PlaceId | null = null;
  let bestD = Infinity;
  for (const pl of places) {
    const d = distance(p, pl.center);
    if (d <= pl.touchRadius && d < bestD) {
      best = pl.id;
      bestD = d;
    }
  }
  return best;
}

/** Un aménagement montré, à l'écran : son lieu (ou ce qu'il désigne, `T` : un équipier), et la boîte de son dessin projeté, en pixels. */
export interface ObjectTarget<T = PlaceId> {
  place: T;
  rect: ScreenBox;
}

/** Le rayon du disque invisible autour d'un aménagement, à l'écran, en pixels : celui d'un pont tombé. */
export const OBJECT_TOUCH_PIXELS = BRIDGE_TOUCH.pixels;

/** La distance à l'écran d'un point au dessin d'un aménagement : nulle dedans, sinon jusqu'au plus proche de ses bords. */
const toRect = (x: number, y: number, r: ScreenBox): number => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));

/** Le centre d'une boîte à l'écran. */
const centerOf = (r: ScreenBox) => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });

/**
 * Le lieu de l'aménagement touché en (`x`, `y`), en pixels : dans son dessin, ou à `OBJECT_TOUCH_PIXELS` de son centre
 * au plus ; le dessin touché en plein d'abord (le plus proche de son centre, si deux se recouvrent), puis le disque le
 * plus proche. Rien sinon.
 */
export function touchedObject<T = PlaceId>(x: number, y: number, targets: readonly ObjectTarget<T>[], pixels: number = OBJECT_TOUCH_PIXELS): T | null {
  let best: T | null = null;
  let bestKey = Infinity;
  for (const t of targets) {
    const c = centerOf(t.rect);
    const toCenter = Math.hypot(x - c.x, y - c.y);
    const inside = toRect(x, y, t.rect) === 0;
    if (!inside && toCenter > pixels) continue;
    // Dans le dessin, la clé est la distance au centre ; dans le disque seulement, elle passe après tous les dessins.
    const key = (inside ? 0 : 1e6) + toCenter;
    if (key < bestKey) {
      best = t.place;
      bestKey = key;
    }
  }
  return best;
}

/** La boîte à l'écran de points projetés (les coins d'une boîte du monde), en pixels. */
export function screenRect(points: readonly { x: number; y: number }[]): ScreenBox {
  return {
    left: Math.min(...points.map((p) => p.x)),
    top: Math.min(...points.map((p) => p.y)),
    right: Math.max(...points.map((p) => p.x)),
    bottom: Math.max(...points.map((p) => p.y)),
  };
}
