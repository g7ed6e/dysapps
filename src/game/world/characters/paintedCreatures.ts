// Les créatures d'Archipéo en facettes (lot R6), une par île : le registre des espèces (un fichier par archipel,
// ./species/) et leurs modèles, calculés une fois. À côté des modèles en cubes (./creatures.ts), qui gardent l'emprise
// au sol tant que la grille les lit.
import type { BiomeId } from '../../biomes';
import { ESPECES_6E } from './species/6e';
import { ESPECES_5E } from './species/5e';
import { ESPECES_4E } from './species/4e';
import { ESPECES_3E } from './species/3e';
import { creatureEnFacettes, type Espece } from './template';
import type { FacettesDePersonnage } from './painted';

/** Une espèce par île : le type l'exige (une île sans créature ne compile pas), le test de painted.test.ts le vérifie. */
export const ESPECES: Record<BiomeId, Espece> = { ...ESPECES_6E, ...ESPECES_5E, ...ESPECES_4E, ...ESPECES_3E };

const cache = new Map<BiomeId, FacettesDePersonnage>();

/** La créature d'une île en facettes (calculée une fois ; ne pas modifier les tableaux rendus). */
export function creaturePeinte(id: BiomeId): FacettesDePersonnage {
  let f = cache.get(id);
  if (!f) {
    f = creatureEnFacettes(ESPECES[id]);
    cache.set(id, f);
  }
  return f;
}
