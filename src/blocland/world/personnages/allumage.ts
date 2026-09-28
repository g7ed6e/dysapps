// Le degré d'allumage d'un Gardien posé dans le monde (lot R6), sans ses modèles : les vues 3D et 2D le lisent sur le
// placement que leur donne la grille, sans charger les sentinelles.

/**
 * Le degré d'allumage d'un Gardien posé dans le monde : 1 s'il est vaincu (son défi réussi), 0 sinon. Les Gardiens
 * vaincus arrivent de la grille avec `beaten` (../terrain.ts, `guardianPlacements`) ; le rallumage progressif, et son
 * mot, viennent au lot 6.
 */
export function allumageDuGardien(c: object): 0 | 1 {
  return 'beaten' in c && c.beaten === true ? 1 : 0;
}
