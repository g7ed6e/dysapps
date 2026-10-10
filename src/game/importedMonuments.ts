// Charge les monuments importés d'Archipéo (./world/monumentModels.ts) : les fichiers .glb des étapes de chantier et du
// modèle entier, servis avec le reste de l'application (Vite leur donne une adresse, le build les compacte, le service
// worker les garde pour jouer hors ligne). Chargé à la demande par la scène d'Archipéo (./three/cubes.ts) : Blocland ne
// les télécharge jamais.
import type { ArchipelagoId } from './world/archipelago';
import { lireGlb } from './world/characters/imported/glb';
import { monumentsOf } from './world/monuments';
import { enregistrerUnMonument, etapesDuMonument, fichierDeLEtape, MODELES_DES_MONUMENTS, monumentCharge } from './world/monumentModels';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/<nom>/etape-1.glb »). */
const ADRESSES = import.meta.glob('../../docs/univers/archipeo/monuments/modeles/*/*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const adresseDe = (nom: string, fichier: string): string | undefined => ADRESSES[`../../docs/univers/archipeo/monuments/modeles/${nom}/${fichier}`];

/** Le chargement de chaque archipel, et s'il a manqué un fichier, quand il a fini. */
const enCours = new Map<ArchipelagoId, { p: Promise<boolean>; manque?: number }>();
/** Un chargement qui a manqué un fichier se refait au plus tôt après ce délai. */
const RELANCE_MS = 30_000;

/**
 * Charge les monuments importés d'un archipel, toutes leurs étapes (une fois par archipel). Rend vrai si un fichier
 * nouveau a été rangé (la scène refait alors sa construction). Un fichier qui manque ou ne se lit pas est passé : son
 * monument, incomplet, garde ses blocs.
 */
export function chargerLesMonuments(archipel: ArchipelagoId): Promise<boolean> {
  const deja = enCours.get(archipel);
  if (deja && (deja.manque === undefined || performance.now() - deja.manque < RELANCE_MS)) return deja.p;
  const taches = monumentsOf(archipel)
    .filter((m) => MODELES_DES_MONUMENTS[m.id] && !monumentCharge(m.id))
    .flatMap((m) => {
      const { nom, etapes } = MODELES_DES_MONUMENTS[m.id];
      return etapesDuMonument(m.id).map(async (etape): Promise<'range' | 'rien' | 'manque'> => {
        const url = adresseDe(nom, fichierDeLEtape(etape, etapes));
        if (!url) return 'rien';
        try {
          const r = await fetch(url);
          if (!r.ok) return 'manque';
          enregistrerUnMonument(m.id, etape, lireGlb(await r.arrayBuffer()));
          return 'range';
        } catch {
          // Hors ligne sans le fichier, ou un fichier abîmé : le monument garde ses blocs.
          return 'manque';
        }
      });
    });
  // Un fichier manqué (réseau coupé, service worker en mise à jour) se redemande plus tard, à un prochain appel.
  const chargement: { p: Promise<boolean>; manque?: number } = { p: Promise.resolve(false) };
  chargement.p = Promise.all(taches).then((faits) => {
    if (faits.includes('manque')) chargement.manque = performance.now();
    return faits.includes('range');
  });
  enCours.set(archipel, chargement);
  return chargement.p;
}
