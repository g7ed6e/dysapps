// Trouver un Détour du monde continu et rallumer son cairn, sur l'état d'une partie (GD-20, déplacement libre, lot 2) ;
// leurs identifiants et leur assainissement sont dans engine/detours.ts.
import { sanitizeDetours, type DetourId } from '../engine/detours';
import type { World } from '../engine/state';

/** Les Détours dont le cairn se rallume : le seul de la Braise des Hérons. */
export const DETOUR_CAIRNS: readonly DetourId[] = ['braise-herons'];

/** Un Détour trouvé : sa sente reste tracée. Le même état s'il l'était déjà (rien à écrire). */
export function findDetour<S extends { world: World }>(state: S, id: DetourId): S {
  const found = state.world.detours ?? [];
  if (found.includes(id)) return state;
  return { ...state, world: { ...state.world, detours: sanitizeDetours([...found, id]) } };
}

/** Le cairn d'un Détour trouvé, rallumé pour de bon. Le même état s'il l'était déjà, ou si ce n'est pas un cairn trouvé. */
export function lightDetour<S extends { world: World }>(state: S, id: DetourId): S {
  const lit = state.world.detoursLit ?? [];
  if (lit.includes(id) || !DETOUR_CAIRNS.includes(id) || !(state.world.detours ?? []).includes(id)) return state;
  return { ...state, world: { ...state.world, detoursLit: sanitizeDetours([...lit, id]) } };
}
