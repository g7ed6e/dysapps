// Toutes les petites constructions qui se posent chez un habitant, et leur lieu : celle de sa commande (GD-7,
// ./requests.ts) et les objets des quêtes qui finissent chez lui (GD-10, ./stories.ts). Le monde les dessine, l'île-port
// leur garde leur place et le budget les compte toutes, au même titre.
import type { BiomeId } from '../biomes';
import { COMMANDES } from './requests';
import { STORIES, storyPlace } from './stories';

export interface PlacedFixture {
  /** `<lieu>-fixture-<n>`, clé de `world.parts`. */
  fixture: string;
  /** Le lieu de l'habitant chez qui elle se pose. */
  biome: BiomeId;
}

export const PLACED_FIXTURES: readonly PlacedFixture[] = [
  ...COMMANDES.map((c) => ({ fixture: c.fixture, biome: c.biome })),
  ...STORIES.map((s) => ({ fixture: s.fixture, biome: storyPlace(s) })),
];

/** Les petites constructions d'un lieu, la commande d'abord. */
export const fixturesOfPlace = (biome: BiomeId): PlacedFixture[] => PLACED_FIXTURES.filter((f) => f.biome === biome);

/** Ce qu'il faut pour poser une petite construction sous les yeux de l'élève : sa commande ou sa quête, son lieu, sa forme. */
export interface PetiteConstructionAPoser {
  /** La commande livrée ou la quête finie : la phrase de la fin attend la fin de la pose. */
  id: string;
  biome: BiomeId;
  fixture: string;
}
