// Le geste de pose de Blocland (GD-1, point 4) : quand le dernier bloc d'un plan du village est posé, ce bloc descend
// d'un peu plus d'une case et s'enclenche dans sa case, en un seul cran net : il accélère, puis s'arrête d'un coup, sans
// rebond, sans secousse de caméra, sans flash ni poussière. Le « clac » de pose (../sound.ts) sonne à l'arrêt.
// Calcul pur, sans Three.js : la 3D (three/cubes.ts) lit ces valeurs. Le bâtiment d'une île se pose tout seul (GD-6) : son
// « clac » sonne à l'écran de fin de mission (ExerciseRunner.tsx).

/** La hauteur de départ (en cases, au-dessus de la case) et la durée de la descente : moins d'une seconde. */
export const GESTE_DE_POSE = { hauteur: 1.5, dureeMs: 360 } as const;

/**
 * La hauteur du bloc au-dessus de sa case, `ms` millisecondes après le début du geste : une chute qui accélère
 * (`hauteur × (1 − k²)`), puis 0 pour toujours, sans dépasser ni remonter.
 */
export function hauteurDuGeste(ms: number): number {
  const k = Math.min(1, Math.max(0, ms / GESTE_DE_POSE.dureeMs));
  return GESTE_DE_POSE.hauteur * (1 - k * k);
}

/** Le geste est-il fini, `ms` millisecondes après son début ? */
export const gesteFini = (ms: number): boolean => ms >= GESTE_DE_POSE.dureeMs;

