// Le modelé dessiné des Premiers Rivages (6e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-6e (docs/conception/cadrage-archipeo.md §6). Une île absente garde son relief de marche.
import type { BiomeId } from '../../biomes';
import type { Modele } from './types';

export const MODELES_6E: Partial<Record<BiomeId, Modele>> = {};
