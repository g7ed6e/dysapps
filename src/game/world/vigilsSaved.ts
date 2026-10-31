// Retenir une veillée vue (GD-23, GD-27, lot 3), sur l'état d'une partie ; ses identifiants et leur assainissement sont
// dans engine/vigils.ts.
import { sanitizeVigils, type VigilId } from '../engine/vigils';
import type { World } from '../engine/state';

/** Une veillée vue : elle ne se rejoue pas. Le même état si elle l'était déjà (rien à écrire). */
export function seeVigil<S extends { world: World }>(state: S, id: VigilId): S {
  const seen = state.world.vigils ?? [];
  if (seen.includes(id)) return state;
  return { ...state, world: { ...state.world, vigils: sanitizeVigils([...seen, id]) } };
}

/** La veillée `id` a été vue. */
export const vigilSeen = (world: World, id: VigilId): boolean => (world.vigils ?? []).includes(id);
