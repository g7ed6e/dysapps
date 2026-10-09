// Charge les personnages importés d'Archipéo (./world/characters/imported/models.ts) : les fichiers .glb des modèles
// retravaillés, servis avec le reste de l'application (Vite leur donne une adresse, le service worker les garde pour
// jouer hors ligne). Chargé à la demande avec les personnages d'Archipéo : Blocland ne les télécharge jamais.
import type { ArchipelagoId } from './world/archipelago';
import { archipelagoOfIsland } from './world/archipelagos';
import { lireGlb } from './world/characters/imported/glb';
import { enregistrer, FICHIER, ILES_IMPORTEES, modeleImporte, nomDuModele, type Genre, type Niveau } from './world/characters/imported/models';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/<nom>/final-200.glb »). */
const ADRESSES = import.meta.glob('../../docs/univers/archipeo/personnages/modeles/*/final-*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const adresseDe = (nom: string, niveau: Niveau): string | undefined => ADRESSES[`../../docs/univers/archipeo/personnages/modeles/${nom}/${FICHIER[niveau]}`];

const enCours = new Map<ArchipelagoId, Promise<void>>();

/**
 * Charge les modèles importés d'un archipel, ses Gardiens et ses créatures, de près et de loin (une fois par archipel).
 * Un fichier qui manque ou ne se lit pas est passé : son personnage garde le modèle dessiné en code.
 */
export function chargerLesModeles(archipel: ArchipelagoId): Promise<void> {
  let p = enCours.get(archipel);
  if (!p) {
    const iles = ILES_IMPORTEES.filter((id) => archipelagoOfIsland(id) === archipel);
    const taches = iles.flatMap((id) =>
      (['gardien', 'creature'] as Genre[]).flatMap((genre) =>
        (['pres', 'loin'] as Niveau[]).map(async (niveau) => {
          if (modeleImporte(genre, id, niveau)) return;
          const nom = nomDuModele(genre, id);
          const url = nom ? adresseDe(nom, niveau) : undefined;
          if (!url) return;
          try {
            const r = await fetch(url);
            if (r.ok) enregistrer(genre, id, niveau, lireGlb(await r.arrayBuffer()));
          } catch {
            // Hors ligne sans le fichier, ou un fichier abîmé : le modèle dessiné en code reste.
          }
        }),
      ),
    );
    p = Promise.all(taches).then(() => undefined);
    enCours.set(archipel, p);
  }
  return p;
}
