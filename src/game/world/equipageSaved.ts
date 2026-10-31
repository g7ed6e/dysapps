// Retenir le lieu d'un équipier dans le monde (GD-27, lot 5, piste B), sur l'état d'une partie ; l'assainissement est
// dans engine/equipage.ts. Écrit une fois par équipier, jamais changé : son lieu est un repère fixe (référent dys).
import type { EquipageSaved, EquipageSavedId } from '../engine/equipage';
import type { World } from '../engine/state';

/** Retient le lieu de chaque équipier de `places` qui n'en a pas encore ; le même état si rien n'est nouveau. */
export function keepEquipage<S extends { world: World }>(state: S, places: Readonly<Partial<Record<EquipageSavedId, string>>>): S {
  const kept: EquipageSaved = { ...(state.world.equipage ?? {}) };
  let changed = false;
  for (const [id, place] of Object.entries(places) as [EquipageSavedId, string | undefined][]) {
    if (!place || kept[id]) continue;
    kept[id] = place;
    changed = true;
  }
  return changed ? { ...state, world: { ...state.world, equipage: kept } } : state;
}
