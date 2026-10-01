// Le geste de pose de Blocland (GD-1, point 4) : quand le dernier bloc d'un plan du village est posé, ce bloc descend
// d'un peu plus d'une case et s'enclenche dans sa case, en un seul cran net : il accélère, puis s'arrête d'un coup, sans
// rebond, sans secousse de caméra, sans flash ni poussière. Le « clac » de pose (../sound.ts) sonne à l'arrêt.
// Calcul pur, sans Three.js : la 3D (three/cubes.ts) et le son (usePlanBuilder.ts) lisent les mêmes valeurs.

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

/**
 * Le logo de Blocland qui se construit à l'écran titre : ses quatre cubes (le pied de l'île, le dessus d'herbe et de
 * terre, le tronc, le feuillage) se posent l'un après l'autre, de la même chute en un cran. Délais en millisecondes ;
 * le dernier cube est posé avant une seconde.
 */
export const LOGO_QUI_SE_CONSTRUIT = { chuteMs: 280, ecartMs: 170, cubes: 4 } as const;

/** La fin de la construction du logo : le dernier cube s'arrête à ce moment-là (en millisecondes). */
export const finDuLogo = (): number => LOGO_QUI_SE_CONSTRUIT.ecartMs * (LOGO_QUI_SE_CONSTRUIT.cubes - 1) + LOGO_QUI_SE_CONSTRUIT.chuteMs;
