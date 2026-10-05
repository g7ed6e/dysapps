// L'habillage de Blocland : le monde en blocs, les figures en cubes.
import type { Habillage } from './types';

export const HABILLAGE_BLOCLAND = {
  univers: 'blocland',
  ciel: 'palette',
  brume: 'voiles',
  large: 'blocs',
  sol: 'cubes',
  personnages: 'cubes',
  etiquettes: 'voilees',
  figures: 'cubes',
  reperes: 'libres',
  atelier: 'fabrique',
  pose: 'geste',
  formeDesSignes: 'plaque',
  blocDesIles: 'avant-le-nom',
} as const satisfies Readonly<Habillage> & { univers: 'blocland' };
