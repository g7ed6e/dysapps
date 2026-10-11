// Kéo, le bonhomme d'Archipéo (décision du mainteneur, 11 octobre 2026) : un modèle importé par archipel, dans la tenue
// de cet archipel (explorateur au 6e, ciré à la 5e, mécanicienne à la 4e, cartographe à la 3e), fait par TRELLIS.2 et
// retravaillé comme les créatures (docs/univers/archipeo/personnages/modeles.md). Code pur, sans DOM : le registre des
// tenues et la mise au format du bonhomme (deux blocs de haut, les pieds en 0, le visage vers −Z, son squelette). Ce qui
// charge le fichier est à part (../../../importedCharacters.ts, `loadKeo` ; le disque pour les tests :
// ./fromDisk.testing.ts). Tant que sa tenue n'est pas chargée (ou hors ligne), le bonhomme dessiné en code reste
// (../avatar.ts). Une seule version : Kéo est le même de près et de loin (1 500 triangles, un seul à l'écran).
import type { ArchipelagoId } from '../../archipelago';
import { TAILLE_DU_BONHOMME } from '../avatar';
import type { FacettesDePersonnage } from '../painted';
import type { ModeleLu } from './glb';
import { importedFacets } from './models';

/** Le dossier de la tenue de chaque archipel (docs/univers/archipeo/personnages/modeles/<nom>/). */
export const KEO_OUTFITS: Record<ArchipelagoId, string> = {
  '6e': '6e-keo-creature-explorateur',
  '5e': '5e-keo-creature-cire',
  '4e': '4e-keo-creature-mecanicienne',
  '3e': '3e-keo-creature-cartographe',
};

/** Les quarts de tour qui tournent les quatre tenues face à l'élève (relevés sur les modèles : le visage, les pointes des pieds). */
const KEO_QUARTER_TURNS = 1;

/** Le fichier de Kéo, dans le dossier d'une tenue : la version de près seulement. */
export const KEO_FILE = 'final-1500.glb';

const charges = new Map<ArchipelagoId, FacettesDePersonnage>();

/** Kéo dans la tenue de cet archipel, s'il est chargé (ne pas modifier les tableaux rendus). */
export function loadedKeo(archipel: ArchipelagoId): FacettesDePersonnage | null {
  return charges.get(archipel) ?? null;
}

/** Range la tenue lue d'un archipel (par la vue ou par un test), mise au format du bonhomme. */
export function registerKeo(archipel: ArchipelagoId, lu: ModeleLu): FacettesDePersonnage {
  const f = importedFacets(lu, KEO_QUARTER_TURNS, TAILLE_DU_BONHOMME, 'pres');
  charges.set(archipel, f);
  return f;
}
