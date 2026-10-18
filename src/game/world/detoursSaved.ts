// Les Détours du monde continu dans la sauvegarde (GD-20, déplacement libre, lot 2). Leur dessin et leur place restent
// dans world/continu/detours.ts, que le reste du jeu ne lit pas (la coupure du monde continu) : ce fichier n'en garde
// que les identifiants, les mêmes dans le même ordre (le test des Détours le vérifie).
import type { World } from '../engine/state';

/** Les cinq Détours, un par terre. */
export const DETOUR_IDS = ['butte-chantier', 'braise-herons', 'bout-large', 'colline-aube', 'haut-cretes'] as const;
export type DetourId = (typeof DETOUR_IDS)[number];

/** Les Détours dont le cairn se rallume : le seul de la Braise des Hérons. */
export const DETOUR_CAIRNS: readonly DetourId[] = ['braise-herons'];

/** Les Détours trouvés, dans l'ordre de `DETOUR_IDS`, sans doublon ni inconnu (la sauvegarde). */
export function sanitizeDetours(raw: unknown): DetourId[] {
  if (!Array.isArray(raw)) return [];
  return DETOUR_IDS.filter((id) => raw.includes(id));
}

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
