/** Ramène `v` entre `lo` et `hi`. */
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Une rampe douce de 0 à 1 pour `t` entre 0 et 1 (le smoothstep sans bornes). */
export const smooth = (t: number): number => t * t * (3 - 2 * t);

/** La rampe douce entre deux seuils : 0 avant `e0`, 1 après `e1`. */
export const smoothstep = (e0: number, e1: number, x: number): number => smooth(clamp((x - e0) / (e1 - e0), 0, 1));
