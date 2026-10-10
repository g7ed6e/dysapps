// Pour les tests et le budget mesuré en Node : les monuments importés lus sur le disque, comme la vue les charge
// (../importedMonuments.ts).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireGlb } from './characters/imported/glb';
import { enregistrerUnMonument, etapesDuMonument, fichierDeLEtape, MODELES_DES_MONUMENTS } from './monumentModels';

// Par l'adresse du module (et non `__dirname`) : `npm run rendu:budget` le charge aussi, en module ES.
const DOSSIER_DES_MODELES = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/univers/archipeo/monuments/modeles');

/** Le chemin du fichier d'une étape d'un monument. */
export const fichierDuMonument = (id: string, etape: number): string => {
  const { nom, etapes } = MODELES_DES_MONUMENTS[id];
  return resolve(DOSSIER_DES_MODELES, nom, fichierDeLEtape(etape, etapes));
};

/** Charge depuis le disque toutes les étapes des monuments importés qui existent. */
export function chargerLesMonumentsDuDisque(): void {
  for (const id of Object.keys(MODELES_DES_MONUMENTS))
    for (const etape of etapesDuMonument(id)) {
      const f = fichierDuMonument(id, etape);
      if (!existsSync(f)) continue;
      const b = readFileSync(f);
      enregistrerUnMonument(id, etape, lireGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
    }
}
