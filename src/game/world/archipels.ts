// Les archipels comme règle du jeu : un par classe, dans l'ordre du voyage, et l'archipel de chaque île. Sans
// coordonnées : la place des îles est dans ./map.ts (la disposition en grille), qui réexporte ces noms.
import { BIOMES, type BiomeId, type Classe } from '../biomes';

/** Un archipel par classe : la scène 3D, la Carte et la mer sont celles d'un archipel. */
export type ArchipelagoId = Classe;

/** Les archipels, du premier (le départ) au dernier. */
export const ARCHIPELAGO_IDS: ArchipelagoId[] = ['6e', '5e', '4e', '3e'];

/** La classe (l'archipel) d'une île. */
export function archipelagoOfIsland(id: BiomeId): ArchipelagoId {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) throw new Error(`Île inconnue : ${id}`);
  return biome.classe;
}
