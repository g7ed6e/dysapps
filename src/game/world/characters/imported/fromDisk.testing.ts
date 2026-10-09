// Pour les tests et le budget mesuré en Node : les personnages importés lus sur le disque, comme la vue les charge
// (../../../../importedCharacters.ts).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { lireGlb } from './glb';
import { enregistrer, FICHIER, ILES_IMPORTEES, nomDuModele, type Genre, type Niveau } from './models';

const DOSSIER_DES_MODELES = resolve(__dirname, '../../../../../docs/univers/archipeo/personnages/modeles');

/** Le chemin du fichier d'un modèle. */
export const fichierDuModele = (nom: string, niveau: Niveau): string => resolve(DOSSIER_DES_MODELES, nom, FICHIER[niveau]);

/** Charge depuis le disque tous les modèles importés qui existent (de près et de loin). */
export function chargerLesModelesDuDisque(): void {
  for (const id of ILES_IMPORTEES)
    for (const genre of ['gardien', 'creature'] as Genre[])
      for (const niveau of ['pres', 'loin'] as Niveau[]) {
        const nom = nomDuModele(genre, id);
        if (!nom) continue;
        const f = fichierDuModele(nom, niveau);
        if (!existsSync(f)) continue;
        const b = readFileSync(f);
        enregistrer(genre, id, niveau, lireGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
      }
}
