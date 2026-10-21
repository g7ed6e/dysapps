// Le retour au monde continu depuis l'écran d'une mission d'un lieu du monde ouvert seulement (GD-24) : l'écran ne
// charge rien du monde continu (`world/continu/isolation.test.ts`), il nomme l'île ; la page du monde continu trouve le
// lieu de son plan qui la reprend (`placeFromParam`) et ouvre sa liste, le focus sur la mission.
import type { IleId } from '../biomes';

/** Le paramètre d'adresse qui nomme l'île d'un lieu du monde continu : `/adventure?ile=maths-4e-data`. */
export const PARAM_ILE = 'ile';

/** L'adresse qui ramène au lieu d'une île, sa liste ouverte, le focus sur une mission. */
export const islandReturn = (island: IleId, mission?: string) =>
  `/adventure?${PARAM_ILE}=${island}${mission ? `&mission=${encodeURIComponent(mission)}` : ''}`;
