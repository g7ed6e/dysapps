// Les pages du mot des grandes étapes, dans les mots d'un univers : world/whale.ts dit quelles étapes sont atteintes,
// ceci dit ce qui en est dit, et qui le dit (la baleine dans Archipéo, la créature de l'île-école dans Blocland, GD-1).
import { pagesDArrivee } from '../blocland/arrivals';
import { getBiome, type BiomeDef, type BiomeId } from '../blocland/biomes';
import { getArchipelago } from '../blocland/world/archipelago';
import type { WhaleMoment } from '../blocland/world/whale';
import type { TextesUnivers } from './types';

const nameOf = (island: BiomeId) => getBiome(island)?.name ?? island;

/** Une page, deux pour l'arrivée hors de la 6e (la phrase d'arrivée, puis la bulle pratique sur le navire). */
export function pagesBaleine(m: WhaleMoment, textes: TextesUnivers): string[] {
  const b = textes.baleine;
  switch (m.kind) {
    case 'arrivee':
      return [b.arrivee[m.archipelago], ...pagesDArrivee(m.archipelago, textes.archipels)];
    case 'gardiens':
      return [b.gardiens(textes.archipels[m.archipelago])];
    case 'port':
      return [b.port(nameOf(m.island))];
    case 'ouvrage':
      return [b.ouvrage(nameOf(m.island))];
  }
}

/** Qui dit le mot d'une étape : `null` pour la baleine, sinon l'île-école de l'archipel, dont la créature parle. */
export function quiParle(m: WhaleMoment, textes: TextesUnivers): BiomeDef | null {
  if (textes.baleine.parle === 'baleine') return null;
  return getBiome(getArchipelago(m.archipelago).school) ?? null;
}

/** « de » devant un nom propre : « de Mousso », « d’Ixe ». */
const de = (nom: string) => (/^[aeiouyéèêàâîïôû]/i.test(nom) ? `d’${nom}` : `de ${nom}`);

/** Le titre de la bulle : « Le mot de la baleine », ou le nom de la créature qui parle, écrit (« Le mot de Mousso »). */
export function titreDuMot(m: WhaleMoment, textes: TextesUnivers): string {
  const ecole = quiParle(m, textes);
  return ecole ? `Le mot ${de(ecole.creature.name)}` : 'Le mot de la baleine';
}
