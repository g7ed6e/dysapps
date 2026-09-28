// Le modelé dessiné des Îles du Ciel (3e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-3e (docs/conception/cadrage-archipeo.md §6). Une île absente garde son relief de marche.
import type { BiomeId } from '../../biomes';
import type { Modele } from './types';

export const MODELES_3E: Partial<Record<BiomeId, Modele>> = {};
