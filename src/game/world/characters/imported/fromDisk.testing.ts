// Pour les tests et le budget mesuré en Node : les personnages importés lus sur le disque, comme la vue les charge
// (../../../../importedCharacters.ts).
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArchipelagoId } from '../../archipelago';
import { lireGlb } from './glb';
import { enregistrerKeo, FICHIER_DE_KEO, TENUES_DE_KEO } from './keo';
import { enregistrer, FICHIER, ILES_IMPORTEES, nomDuModele, type Genre, type Niveau } from './models';

// Par l'adresse du module (et non `__dirname`) : `npm run rendu:budget` le charge aussi, en module ES.
const DOSSIER_DES_MODELES = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../docs/univers/archipeo/personnages/modeles');

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

/** Le chemin du fichier de Kéo dans la tenue d'un archipel. */
const fichierDeKeo = (archipel: ArchipelagoId): string => resolve(DOSSIER_DES_MODELES, TENUES_DE_KEO[archipel], FICHIER_DE_KEO);

/** Charge depuis le disque Kéo dans les tenues qui existent, une par archipel. */
export function chargerKeoDuDisque(): void {
  for (const archipel of Object.keys(TENUES_DE_KEO) as ArchipelagoId[]) {
    const f = fichierDeKeo(archipel);
    if (!existsSync(f)) continue;
    const b = readFileSync(f);
    enregistrerKeo(archipel, lireGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
  }
}
