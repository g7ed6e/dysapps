// L'habillage de Blocland : le monde en blocs, la 2D en pixels, les figures en cubes, le défi dans l'arène.
import type { Habillage } from './types';

export const HABILLAGE_BLOCLAND = {
  univers: 'blocland',
  ciel: 'palette',
  brume: 'voiles',
  large: 'blocs',
  sol: 'cubes',
  personnages: 'cubes',
  etiquettes: 'voilees',
  dessin2D: 'pixels',
  figures: 'cubes',
  defi: 'arene',
  reperes: 'libres',
  atelier: 'fabrique',
  pose: 'geste',
  signe: 'plaque',
  signesDesObjets: 'bulles',
  blocDesIles: 'avant-le-nom',
} as const satisfies Readonly<Habillage> & { univers: 'blocland' };
