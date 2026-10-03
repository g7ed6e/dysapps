// Le signe de la créature qui se souvient (GD-4, étape 1) : quand une mission de son île a des questions à revoir
// aujourd'hui, la créature fait un geste lent et court (un petit saut), une fois, à l'arrivée de la caméra sur son île ;
// puis l'icône de la notion se pose au-dessus d'elle, seule, fixe, sans clignoter, sans texte. Avec « Réduire les
// animations », pas de geste : l'icône seule, tout de suite. Du code pur, sans Three.js : la 3D (three/signes.ts) le
// lit, la vue simple montre l'icône sur la Carte. Ce que la vue reçoit (`SigneDeCreature`) est dans le contrat, ./view.ts.

/** Le geste : un seul saut lent, d'un demi-bloc au plus, qui commence un peu après le début du vol de la caméra. */
export const GESTE_DU_SIGNE = {
  /** Le temps laissé à la caméra pour arriver sur l'île avant le geste. */
  attenteMs: 700,
  /** La durée du saut : lent (un pas de créature dure 1,8 s). */
  dureeMs: 1400,
  /** La hauteur du saut, en blocs. */
  hauteur: 0.45,
} as const;

/** L'icône au-dessus de la créature : sa taille à l'écran, en pixels CSS, et sa hauteur au-dessus de la tête, en blocs. */
export const ICONE_DU_SIGNE = { css: 40, auDessus: 1.1 } as const;

/**
 * La hauteur du saut, en blocs, `ms` millisecondes après le début du geste : 0 avant et après ; une seule bosse douce
 * entre les deux (un demi-sinus), sans rebond.
 */
export function hauteurDuSigne(ms: number): number {
  if (!(ms > 0) || ms >= GESTE_DU_SIGNE.dureeMs) return 0;
  return GESTE_DU_SIGNE.hauteur * Math.sin((Math.PI * ms) / GESTE_DU_SIGNE.dureeMs);
}

/** L'icône se montre : sans geste prévu (ou avec moins d'animations), tout de suite ; sinon une fois le geste fini. */
export function iconeDuSigneVisible(debutDuGeste: number | null, maintenant: number, reduit: boolean): boolean {
  if (reduit || debutDuGeste === null) return true;
  return maintenant >= debutDuGeste + GESTE_DU_SIGNE.dureeMs;
}
