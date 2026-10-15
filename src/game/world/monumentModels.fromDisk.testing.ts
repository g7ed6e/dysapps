// Pour les tests et le budget mesuré en Node : les monuments importés lus sur le disque, comme la vue les charge
// (../importedMonuments.ts).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireGlb } from './characters/imported/glb';
import { registerMonument, monumentStages, stageFile, MONUMENT_MODELS } from './monumentModels';

// Par l'adresse du module (et non `__dirname`) : `npm run rendu:budget` le charge aussi, en module ES.
const MODELS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/univers/archipeo/monuments/modeles');

/** Le chemin du fichier d'une étape d'un monument. */
export const monumentFile = (id: string, stage: number): string => {
  const { folder, stages } = MONUMENT_MODELS[id];
  return resolve(MODELS_DIR, folder, stageFile(stage, stages));
};

/** Charge depuis le disque toutes les étapes des monuments importés qui existent. */
export function loadMonumentsFromDisk(): void {
  for (const id of Object.keys(MONUMENT_MODELS))
    for (const stage of monumentStages(id)) {
      const file = monumentFile(id, stage);
      if (!existsSync(file)) continue;
      const bytes = readFileSync(file);
      registerMonument(id, stage, lireGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)));
    }
}
