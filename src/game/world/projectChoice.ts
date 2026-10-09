// Le choix du projet, en 4e et en 3e (GD-10, choix du mainteneur le 8 octobre 2026 : « dans le monde ») : tous les
// projets d'un archipel sont en fantôme sur leur îlot, et toucher un îlot ouvre son panneau ; poser une première pièce,
// c'est le choisir, sans écran de choix. Un seul objectif mis en avant : parmi les projets où l'élève peut poser une pièce
// maintenant, un seul porte la bulle « à faire », celui-ci. Code pur, déduit de la sauvegarde seule.
import type { GameState } from '../engine/state';
import type { ArchipelagoId } from './archipelagos';
import { monumentsOf } from './monuments';
import { canPay, nextPiece, pieceIsFree, piecesBuilt, projectOf, type Project } from './projects';

/** L'élève peut-il poser la pièce suivante maintenant (une recette que son stock paie, ou une pièce déjà commencée) ? */
export function projectReady(state: Pick<GameState, 'world' | 'stock'>, project: Project): boolean {
  const index = nextPiece(state, project);
  if (index === null) return false;
  return pieceIsFree(state, project, index) || project.pieces[index].recipes.some((r) => canPay(state.stock, r));
}

/**
 * Le projet mis en avant dans un archipel, parmi ceux qui ne sont pas finis : d'abord un projet où l'élève peut poser une
 * pièce maintenant (le plus avancé, puis le premier dans l'ordre), sinon un projet commencé (le plus avancé), sinon le
 * premier. `null` sans projet à faire.
 */
export function suggestedProject(state: Pick<GameState, 'world' | 'stock'>, a: ArchipelagoId): Project | null {
  const open = monumentsOf(a)
    .map((m) => projectOf(m.id))
    .filter((p): p is Project => p !== undefined && nextPiece(state, p) !== null);
  if (open.length === 0) return null;
  // Le tri garde l'ordre des monuments à avancement égal.
  const byProgress = [...open].sort((p, q) => piecesBuilt(state, q) - piecesBuilt(state, p));
  return byProgress.find((p) => projectReady(state, p)) ?? byProgress[0];
}
