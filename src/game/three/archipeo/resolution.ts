// La finesse du rendu qui s'adapte à l'appareil (piste B de la mesure iPad, choix du mainteneur du 24 octobre 2026,
// « Bandes et résolution ») : au 5e, au 4e et au 3e, l'iPad de référence restait à 43-45 images par seconde, le coût
// venant des pixels. Quand l'image médiane d'une fenêtre dépasse `SLOW_MS` (sans atteindre `CAPPED_MS`) deux fenêtres
// de suite, le rapport de pixels descend d'un cran (2, puis 1,75, puis 1,5), jamais en dessous ; il ne remonte pas tant
// que le monde vit (pas de va-et-vient de netteté). La médiane ignore les à-coups isolés (une texture, un lieu qui se refait) : seul un coût qui dure
// fait descendre. Le repli d'urgence à 1, sous 22 images par seconde, reste à part (`SLOW_FRAME_MS` de ./scene.ts).

/** Les crans du rapport de pixels, du plus fin au plus grossier. */
const RESOLUTION_STEPS = [2, 1.75, 1.5] as const;
/** Une image médiane plus longue que cela (moins de 50 images par seconde) : la fenêtre est lente. */
const SLOW_MS = 20;
/**
 * Au-delà, la fenêtre ne compte pas : une image médiane de 30 ms et plus est celle d'un écran bridé à 30 images par
 * seconde (le mode économie d'énergie d'iOS), où moins de pixels ne gagnerait rien ; un appareil qui peine vraiment
 * a son repli d'urgence à 1 (`SLOW_FRAME_MS` de ./scene.ts).
 */
const CAPPED_MS = 30;
/** Les images d'une fenêtre (environ une seconde et demie à 60 images par seconde). */
export const WINDOW_FRAMES = 90;
/** Les fenêtres lentes de suite avant de descendre d'un cran. */
export const SLOW_WINDOWS = 2;
/** Le temps laissé au monde pour se poser, au début et après chaque cran, avant de mesurer. */
export const SETTLE_MS = 3000;

export interface Resolution {
  /** Une image de `ms` millisecondes, à l'instant `now` : le nouveau rapport de pixels s'il change, sinon `null`. */
  frame(ms: number, now: number): number | null;
}

/** `start` : le rapport de pixels du départ (celui de l'écran, plafonné à 2). */
export function createResolution(start: number, now: number): Resolution {
  // Les crans possibles sous le départ : un écran ×1,5 ne descend pas, un écran ×1 non plus.
  const steps = RESOLUTION_STEPS.filter((s) => s < start);
  let next = 0;
  let from = now + SETTLE_MS;
  let slow = 0;
  const times: number[] = [];
  return {
    frame(ms, at) {
      if (next >= steps.length || at < from) return null;
      times.push(ms);
      if (times.length < WINDOW_FRAMES) return null;
      times.sort((a, b) => a - b);
      const median = times[times.length >> 1];
      times.length = 0;
      slow = median > SLOW_MS && median < CAPPED_MS ? slow + 1 : 0;
      if (slow < SLOW_WINDOWS) return null;
      slow = 0;
      from = at + SETTLE_MS;
      return steps[next++];
    },
  };
}
