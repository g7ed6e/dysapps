// Charge les monuments importés d'Archipéo (./world/monumentModels.ts) : les fichiers .glb des étapes de chantier et du
// modèle entier, servis avec le reste de l'application (Vite leur donne une adresse, le build les compacte, le service
// worker les garde pour jouer hors ligne). Chargé à la demande par la scène d'Archipéo (./three/cubes.ts) : Blocland ne
// les télécharge jamais.
import type { ArchipelagoId } from './world/archipelago';
import { lireGlb } from './world/characters/imported/glb';
import { monumentsOf } from './world/monuments';
import { registerMonument, monumentStages, stageFile, MONUMENT_MODELS, isMonumentLoaded } from './world/monumentModels';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/<dossier>/etape-1.glb »). */
const URLS = import.meta.glob<string>('../../docs/univers/archipeo/monuments/modeles/*/*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
});

const urlOf = (folder: string, file: string): string | undefined => URLS[`../../docs/univers/archipeo/monuments/modeles/${folder}/${file}`];

type Outcome = 'stored' | 'absent' | 'missed';
/** Le chargement de chaque archipel, et s'il a manqué un fichier, quand il a fini. */
const loading = new Map<ArchipelagoId, { done: Promise<boolean>; missedAt?: number }>();
/** Un chargement qui a manqué un fichier se refait, à un prochain appel, au plus tôt après ce délai. */
const RETRY_MS = 30_000;

/**
 * Charge les monuments importés d'un archipel, toutes leurs étapes (une fois par archipel). Rend vrai si un fichier
 * nouveau a été rangé (la scène refait alors sa construction). Un fichier qui manque ou ne se lit pas est passé : son
 * monument, incomplet, garde ses blocs. Pas de minuterie : un fichier manqué (réseau coupé, service worker en mise à
 * jour) n'est redemandé que si la fonction est rappelée après `RETRY_MS`, par exemple à la prochaine scène de l'archipel.
 */
export function loadMonuments(archipel: ArchipelagoId): Promise<boolean> {
  const already = loading.get(archipel);
  if (already && (already.missedAt === undefined || performance.now() - already.missedAt < RETRY_MS)) return already.done;
  const tasks = monumentsOf(archipel)
    .filter((m) => MONUMENT_MODELS[m.id] && !isMonumentLoaded(m.id))
    .flatMap((m) => {
      const { folder, stages } = MONUMENT_MODELS[m.id];
      return monumentStages(m.id).map(async (stage): Promise<Outcome> => {
        const url = urlOf(folder, stageFile(stage, stages));
        if (!url) return 'absent';
        try {
          const r = await fetch(url);
          if (!r.ok) return 'missed';
          registerMonument(m.id, stage, lireGlb(await r.arrayBuffer()));
          return 'stored';
        } catch {
          // Hors ligne sans le fichier, ou un fichier abîmé : le monument garde ses blocs.
          return 'missed';
        }
      });
    });
  const entry: { done: Promise<boolean>; missedAt?: number } = { done: Promise.resolve(false) };
  entry.done = Promise.all(tasks).then((outcomes) => {
    if (outcomes.includes('missed')) entry.missedAt = performance.now();
    return outcomes.includes('stored');
  });
  loading.set(archipel, entry);
  return entry.done;
}
