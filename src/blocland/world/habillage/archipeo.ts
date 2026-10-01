// L'habillage d'Archipéo : le ciel en dégradé, le sol à facettes, la mer et sa faune, les modèles dessinés, les
// sentinelles.
import type { Habillage } from './types';

export const HABILLAGE_ARCHIPEO = {
  univers: 'archipeo',
  ciel: 'degrade',
  brume: 'bancs',
  large: 'mer-et-faune',
  sol: 'facettes',
  personnages: 'modeles',
  etiquettes: 'nettes',
  dessin2D: 'peint',
  figures: 'modeles',
  defi: 'sentinelle',
  reperes: 'cadres',
  pose: 'eclats',
} as const satisfies Readonly<Habillage> & { univers: 'archipeo' };
