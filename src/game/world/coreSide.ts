// Le côté du cœur des îles, en cases : une règle du jeu, sans la carte. La grille (./map.ts, qui les réexporte) en tire
// les bornes du cœur ; la sauvegarde (./savedLayout.ts) les bornes où une borne déplacée peut se lire.
import type { BiomeId } from '../biomes';

/**
 * Côté du cœur d'origine (16) : le repère des clés de sauvegarde et des plans, posé sur `IslandDef.core`. L'étendue du
 * cœur d'une île ne se lit plus ici mais avec `coeurDe` (ou `bornesDuCoeur`), qui suit le réglage de son île.
 */
export const CORE = 16;

/**
 * Côté du cœur de chaque île (GD-11, décision du mainteneur du 8 octobre 2026, « Agrandir les îles », « Tout autour »,
 * « Côte amincie ») : le cœur grandit de trois cases de chaque côté autour du cœur d'origine (`CORE`), de 16 à 22, pour
 * que le Gardien ait sa place sur son île ; la côte (`ext`) s'amincit d'une case de chaque côté (une case au moins) :
 * deux cases de terre nettes en plus par côté, sous le plafond de Blocland (100 000 triangles au pire). `IslandDef.core`
 * reste l'origine du repère de l'île (et des clés de sauvegarde) : à 22, le cœur couvre [−3, 19) ; son milieu ne bouge
 * pas. Les marges du cœur (l'anneau autour du cœur d'origine) sont plates et ne portent que leurs jalons
 * (`margesDuCoeur`).
 */
export const DEFAULT_CORE_SIDE = 22;

/**
 * Côté du cœur des îles-écoles, qui portent les lieux du village (l'école, la salle des trophées) : 20 depuis le
 * 1er octobre 2026 (décision du mainteneur), 26 depuis GD-11 (trois cases de plus de chaque côté, comme les autres
 * îles). La Forêt, le Marché, l'Atelier et le Phare.
 */
export const COTE_DU_COEUR: Readonly<Partial<Record<BiomeId, number>>> = Object.freeze({ 'french-6e-phonology': 26, 'maths-5e-proportionality': 26, 'maths-4e-algebra': 26, 'maths-3e-functions': 26 });
