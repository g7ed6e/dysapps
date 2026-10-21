// Le retour au monde continu depuis l'écran d'une mission d'un lieu du monde ouvert seulement (GD-24) : l'écran ne
// charge rien du monde continu (`world/continu/isolation.test.ts`), il nomme l'île ; la page du monde continu trouve le
// lieu de son plan qui la reprend (`placeFromParam`) et ouvre sa liste, le focus sur la mission.
import type { BlockId, IleId } from '../biomes';

/** Le paramètre d'adresse qui nomme l'île d'un lieu du monde continu : `/adventure?ile=maths-4e-data`. */
export const PARAM_ILE = 'ile';

/** L'adresse qui ramène au lieu d'une île, sa liste ouverte, le focus sur une mission. */
export const islandReturn = (island: IleId, mission?: string) =>
  `/adventure?${PARAM_ILE}=${island}${mission ? `&mission=${encodeURIComponent(mission)}` : ''}`;

/**
 * Le lieu du monde ouvert dont un lieu seul fait gagner le bloc (GD-24 : l'Étalon gagne celui de la Forge, confirmé par
 * le directeur artistique le 21 octobre 2026), avec son article : le bilan dit à quoi servent ces blocs par ce lieu,
 * jamais par une île de la grille. Le nom est celui du plan du monde continu (`world/continu/plan4e.ts`), que cet écran
 * ne lit pas : un test vérifie qu'ils sont les mêmes (`forge4e.test.ts`).
 */
const OPEN_WORLD_PLACE_OF_BLOCK: Partial<Record<BlockId, string>> = { 'maths-4e-powers': 'la Forge' };

/** Le lieu du monde ouvert d'un bloc (« la Forge »), ou rien. */
export const openWorldPlaceOfBlock = (block: BlockId): string | undefined => OPEN_WORLD_PLACE_OF_BLOCK[block];
