// Charge les bâtiments des plans importés d'Archipéo (./world/buildingModels.ts) : les fichiers .glb de l'étape 1 et du
// bâtiment entier, de près et de loin, servis avec le reste de l'application (Vite leur donne une adresse, le build les
// compacte, le service worker les garde pour jouer hors ligne). Chargé à la demande par la scène d'Archipéo
// (./three/cubes.ts) : Blocland ne les télécharge jamais. Comme les monuments (./importedMonuments.ts).
import type { ArchipelagoId } from './world/archipelago';
import { lireGlb } from './world/characters/imported/glb';
import { mapOf } from './world/map';
import { BUILDING_FILES, BUILDING_MODELS, isBuildingLoaded, registerBuilding } from './world/buildingModels';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/<dossier>/loin.glb »). */
const URLS = import.meta.glob<string>('../../docs/univers/archipeo/batiments/modeles/*/*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
});

const urlOf = (folder: string, file: string): string | undefined => URLS[`../../docs/univers/archipeo/batiments/modeles/${folder}/${file}`];

type Outcome = 'stored' | 'absent' | 'missed';
/** Le chargement de chaque archipel, et s'il a manqué un fichier, quand il a fini. */
const loading = new Map<ArchipelagoId, { done: Promise<boolean>; missedAt?: number }>();
/** Un chargement qui a manqué un fichier se refait, à un prochain appel, au plus tôt après ce délai. */
const RETRY_MS = 30_000;

/**
 * Charge les bâtiments importés d'un archipel, tous leurs fichiers (une fois par archipel). Rend vrai si un fichier
 * nouveau a été rangé (la scène refait alors sa construction). Un fichier qui manque ou ne se lit pas est passé : son
 * bâtiment, incomplet, garde ses blocs. Pas de minuterie : un fichier manqué n'est redemandé que si la fonction est
 * rappelée après `RETRY_MS`, par exemple à la prochaine scène de l'archipel.
 */
export function loadBuildings(archipel: ArchipelagoId): Promise<boolean> {
  const already = loading.get(archipel);
  if (already && (already.missedAt === undefined || performance.now() - already.missedAt < RETRY_MS)) return already.done;
  const tasks = mapOf(archipel)
    .map((def) => def.id)
    .filter((id) => BUILDING_MODELS[id] && !isBuildingLoaded(id))
    .flatMap((id) =>
      BUILDING_FILES.map(async (file): Promise<Outcome> => {
        const url = urlOf(BUILDING_MODELS[id]!.folder, file);
        if (!url) return 'absent';
        try {
          const r = await fetch(url);
          if (!r.ok) return 'missed';
          registerBuilding(id, file, lireGlb(await r.arrayBuffer()));
          return 'stored';
        } catch {
          // Hors ligne sans le fichier, ou un fichier abîmé : le bâtiment garde ses blocs.
          return 'missed';
        }
      }),
    );
  const entry: { done: Promise<boolean>; missedAt?: number } = { done: Promise.resolve(false) };
  entry.done = Promise.all(tasks).then((outcomes) => {
    if (outcomes.includes('missed')) entry.missedAt = performance.now();
    return outcomes.includes('stored');
  });
  loading.set(archipel, entry);
  return entry.done;
}
