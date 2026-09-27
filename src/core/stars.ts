/** Étoiles d'un score (0 à 1), les mêmes au portail et dans Blocland : 1 = terminé, 2 = ≥ 70 %, 3 = ≥ 90 %. */
export function starsFor(score: number): 1 | 2 | 3 {
  return score >= 0.9 ? 3 : score >= 0.7 ? 2 : 1;
}
