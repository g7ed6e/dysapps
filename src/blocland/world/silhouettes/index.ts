// Le registre des reliefs (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) : le relief propre de
// chaque île, un fichier par archipel (./6e.ts…), écrit en repère d'île (./types.ts). Chaque sous-lot de R4b n'écrit
// que le fichier de son archipel ; ../map.ts les lit pour tirer le paysage de chaque île.
import type { BiomeId } from '../../biomes';
import { SILHOUETTES_6E } from './6e';
import { SILHOUETTES_5E } from './5e';
import { SILHOUETTES_4E } from './4e';
import { SILHOUETTES_3E } from './3e';
import type { Silhouette } from './types';

export type { Pic, Silhouette } from './types';

/** Le relief de chaque archipel, île par île. */
export const SILHOUETTES = { '6e': SILHOUETTES_6E, '5e': SILHOUETTES_5E, '4e': SILHOUETTES_4E, '3e': SILHOUETTES_3E } as const;

const TOUTES: Partial<Record<BiomeId, Silhouette>> = Object.assign({}, ...Object.values(SILHOUETTES));

/** Le relief propre d'une île (sans pic si son archipel ne l'a pas écrit). */
export function silhouetteDe(id: BiomeId): Silhouette {
  return TOUTES[id] ?? { pics: [] };
}
