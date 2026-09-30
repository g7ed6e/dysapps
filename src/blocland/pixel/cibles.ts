/**
 * Les cibles du toucher en 2D : un panneau ou une créature peut se dessiner plus petit que le doigt (sur téléphone, un
 * panneau de mission fait environ 36 × 44 px). Sa zone de toucher s'agrandit alors, autour de son milieu, jusqu'à la
 * taille minimale des cibles (48 px, principes dys), sans changer son dessin.
 */

/** Un rectangle de l'écran, en pixels du canevas. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Vrai : la cible se touche aussi dans sa zone agrandie ; sinon, seulement sur son dessin. */
  agrandir?: boolean;
}

/** Taille minimale d'une cible tactile, en pixels CSS (principes dys). */
export const CIBLE_MIN_PX = 48;

/** Le rectangle, agrandi autour de son milieu pour faire au moins `min` de large et de haut. */
export function agrandirCible<R extends Rect>(r: R, min: number): R {
  const w = Math.max(r.w, min);
  const h = Math.max(r.h, min);
  return { ...r, x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h };
}

const dedans = (r: Rect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/**
 * La cible touchée au point (x, y), les cibles rangées du plus lointain au plus proche. Un toucher sur le dessin même
 * d'une cible la prend (la plus proche d'abord) ; sinon, parmi les cibles marquées `agrandir` dont la zone agrandie à `min`
 * contient le point, celle dont le milieu est le plus près du doigt (à égalité, la plus proche) : une marge ne vole pas
 * le toucher d'une cible voisine.
 */
export function cibleAu<R extends Rect>(
  cibles: readonly R[],
  x: number,
  y: number,
  min: number,
): R | null {
  for (let i = cibles.length - 1; i >= 0; i--)
    if (dedans(cibles[i], x, y)) return cibles[i];
  let meilleure: R | null = null;
  let meilleureDistance = Infinity;
  for (let i = cibles.length - 1; i >= 0; i--) {
    const c = cibles[i];
    if (!c.agrandir || !dedans(agrandirCible(c, min), x, y)) continue;
    const d = Math.hypot(c.x + c.w / 2 - x, c.y + c.h / 2 - y);
    if (d < meilleureDistance) {
      meilleure = c;
      meilleureDistance = d;
    }
  }
  return meilleure;
}
