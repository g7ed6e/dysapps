// Pour les tests et le budget mesuré en Node : les formes de la Nef importée lues sur le disque, comme la vue les charge
// (../importedNef.ts).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireGlb } from './characters/imported/glb';
import { NEF_MODELS, registerNef } from './nefModels';

// Par l'adresse du module (et non `__dirname`) : `npm run rendu:budget` le charge aussi, en module ES.
const MODELS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/univers/archipeo/nef/modeles');

/** Charge depuis le disque les formes de la Nef qui existent. */
export function loadNefFromDisk(): void {
  for (const [form, file] of Object.entries(NEF_MODELS)) {
    const path = resolve(MODELS_DIR, file);
    if (!existsSync(path)) continue;
    const bytes = readFileSync(path);
    registerNef(Number(form), lireGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)));
  }
}
