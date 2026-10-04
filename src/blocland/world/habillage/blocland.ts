// L'habillage de Blocland : le monde en blocs, la 2D en pixels, les figures en cubes.
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
  reperes: 'libres',
  atelier: 'fabrique',
  pose: 'geste',
  formeDesSignes: 'plaque',
  signesDesObjets: 'bulles',
  blocDesIles: 'avant-le-nom',
} as const satisfies Readonly<Habillage> & { univers: 'blocland' };
