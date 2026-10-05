// Les habillages des univers (J6, rangés par J7) : un fichier par univers, des données seulement.
import type { UniversId } from '../../../univers/types';
import { HABILLAGE_ARCHIPEO } from './archipeo';
import { HABILLAGE_BLOCLAND } from './blocland';
import type { Habillage } from './types';

export type { Habillage } from './types';

export const HABILLAGES = {
  blocland: HABILLAGE_BLOCLAND,
  archipeo: HABILLAGE_ARCHIPEO,
} as const satisfies { readonly [U in UniversId]: Readonly<Habillage> & { univers: U } };
