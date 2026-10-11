// Pour les tests et le budget mesuré en Node : les bâtiments importés lus sur le disque, comme la vue les charge
// (../importedBuildings.ts).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BiomeId } from '../biomes';
import { lireGlb } from './characters/imported/glb';
import { BUILDING_FILES, BUILDING_MODELS, registerBuilding } from './buildingModels';

// Par l'adresse du module (et non `__dirname`) : `npm run rendu:budget` le charge aussi, en module ES.
const MODELS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/univers/archipeo/batiments/modeles');

/** Le chemin d'un fichier d'un bâtiment. */
export const buildingPath = (id: BiomeId, file: (typeof BUILDING_FILES)[number]): string => resolve(MODELS_DIR, BUILDING_MODELS[id]!.folder, file);

/** Charge depuis le disque tous les fichiers des bâtiments importés qui existent. */
export function loadBuildingsFromDisk(): void {
  for (const id of Object.keys(BUILDING_MODELS) as BiomeId[])
    for (const file of BUILDING_FILES) {
      const path = buildingPath(id, file);
      if (!existsSync(path)) continue;
      const bytes = readFileSync(path);
      registerBuilding(id, file, lireGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)));
    }
}
