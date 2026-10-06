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

/**
 * SC-3, provisoire : les neuf îles de sciences de 5e à 3e reprennent l'espèce de 6e de leur matière, en attendant
 * l'artiste technique 3D (décision du directeur artistique, SC-3).
 */
const PROVISOIRES_SC3 = {
  'life-earth-sciences-5e-active-planet': ESPECES_6E['life-earth-sciences-6e-living-world'],
  'physics-chemistry-5e-matter-universe': ESPECES_6E['physics-chemistry-6e-matter-energy'],
  'technology-5e-design': ESPECES_6E['technology-6e-objects'],
  'life-earth-sciences-4e-cells-evolution': ESPECES_6E['life-earth-sciences-6e-living-world'],
  'physics-chemistry-4e-signals-circuits': ESPECES_6E['physics-chemistry-6e-matter-energy'],
  'technology-4e-modeling': ESPECES_6E['technology-6e-objects'],
  'life-earth-sciences-3e-human-body': ESPECES_6E['life-earth-sciences-6e-living-world'],
  'physics-chemistry-3e-motion-energy': ESPECES_6E['physics-chemistry-6e-matter-energy'],
  'technology-3e-digital': ESPECES_6E['technology-6e-objects'],
};

/** Une espèce par île : le type l'exige (une île sans créature ne compile pas), le test de painted.test.ts le vérifie. */
export const ESPECES: Record<BiomeId, Espece> = { ...ESPECES_6E, ...ESPECES_5E, ...ESPECES_4E, ...ESPECES_3E, ...PROVISOIRES_SC3 };

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
