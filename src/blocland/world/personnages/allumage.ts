// Le degré d'allumage d'un Gardien posé dans le monde (lot R6), sans ses modèles : la vue 3D le lit sur le
// placement que leur donne la grille, sans charger les sentinelles.

/**
 * Le degré d'allumage d'un Gardien posé dans le monde : 1 s'il est rallumé (son défi réussi), 0 sinon. Les Gardiens
 * rallumés arrivent de la grille avec `beaten` (../terrain.ts, `guardianPlacements`) ; le moment du rallumage, et son
 * mot, viennent de Rallumage.tsx (lot 6, GD-8).
 */
export function allumageDuGardien(c: object): 0 | 1 {
  return 'beaten' in c && c.beaten === true ? 1 : 0;
}

/** Les fondus de la sentinelle au défi, en secondes : une épreuve réussie, puis la victoire. */
export const FONDU = { reussite: 0.6, victoire: 1.5 } as const;

/**
 * Les lueurs d'une sentinelle au défi : rien avant la première réussite, puis un premier pas qui se voit (0,3), et
 * pleines quand il y a assez de réussites (`needed`).
 */
export function lueursDuDefi(won: number, needed: number): number {
  return won <= 0 ? 0 : 0.3 + 0.7 * Math.min(1, won / Math.max(1, needed));
}
