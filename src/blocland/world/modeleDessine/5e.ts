// Le modelé dessiné des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-5e (docs/conception/cadrage-archipeo.md §6). Une île absente garde son relief de marche.
import type { BiomeId } from '../../biomes';
import type { Modele } from './types';

export const MODELES_5E: Partial<Record<BiomeId, Modele>> = {};
