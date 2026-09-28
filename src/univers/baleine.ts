// Les pages du mot de la baleine, dans les mots d'un univers : world/whale.ts dit quelles étapes sont atteintes, ceci
// dit ce que la baleine en dit.
import { ARRIVAL_STEPS } from '../blocland/arrivals';
import { getBiome, type BiomeId } from '../blocland/biomes';
import { getArchipelago } from '../blocland/world/archipelago';
import type { WhaleMoment } from '../blocland/world/whale';
import type { TextesUnivers } from './types';

const nameOf = (island: BiomeId) => getBiome(island)?.name ?? island;

/** Une page, deux pour l'arrivée (la phrase de la baleine, puis la bulle pratique sur le navire). */
export function pagesBaleine(m: WhaleMoment, textes: TextesUnivers): string[] {
  const b = textes.baleine;
  switch (m.kind) {
    case 'arrivee':
      return [b.arrivee[m.archipelago], ...ARRIVAL_STEPS[m.archipelago].slice(1)];
    case 'gardiens':
      return [b.gardiens(getArchipelago(m.archipelago).name)];
    case 'port':
      return [b.port(nameOf(m.island))];
    case 'ouvrage':
      return [b.ouvrage(nameOf(m.island))];
  }
}
