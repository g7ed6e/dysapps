// Charge la Nef importée d'Archipéo (./world/nefModels.ts) : ses trois formes, servies avec le reste de l'application
// (Vite leur donne une adresse, le build les compacte, le service worker les garde pour jouer hors ligne). Chargé à la
// demande par la Nef de la scène d'Archipéo (./three/ship.ts) : Blocland ne les télécharge jamais.
import { lireGlb } from './world/characters/imported/glb';
import { NEF_MODELS, nefParts, registerNef } from './world/nefModels';

/** L'adresse de chaque fichier, par son chemin dans le dépôt (« …/modeles/1-voilier/final-1264.glb »). */
const URLS = import.meta.glob<string>('../../docs/univers/archipeo/nef/modeles/*/*.glb', { query: '?url', import: 'default', eager: true });

let loading: { done: Promise<boolean>; missedAt?: number } | null = null;
/** Un chargement qui a manqué un fichier se refait, à un prochain appel, au plus tôt après ce délai. */
const RETRY_MS = 30_000;

/**
 * Charge les trois formes (une fois). Rend vrai si une forme nouvelle a été rangée (la Nef se repeint alors). Un fichier
 * qui manque ou ne se lit pas est passé : sa forme garde ses cubes ; il n'est redemandé qu'à un appel après `RETRY_MS`.
 */
export function loadNef(): Promise<boolean> {
  if (loading && (loading.missedAt === undefined || performance.now() - loading.missedAt < RETRY_MS)) return loading.done;
  const entry: { done: Promise<boolean>; missedAt?: number } = { done: Promise.resolve(false) };
  const tasks = Object.entries(NEF_MODELS)
    .filter(([form]) => !nefParts(Number(form)))
    .map(async ([form, file]): Promise<'stored' | 'absent' | 'missed'> => {
      const url = URLS[`../../docs/univers/archipeo/nef/modeles/${file}`];
      if (!url) return 'absent';
      try {
        const r = await fetch(url);
        if (!r.ok) return 'missed';
        registerNef(Number(form), lireGlb(await r.arrayBuffer()));
        return 'stored';
      } catch {
        // Hors ligne sans le fichier, ou un fichier abîmé : la forme garde ses cubes.
        return 'missed';
      }
    });
  entry.done = Promise.all(tasks).then((outcomes) => {
    if (outcomes.includes('missed')) entry.missedAt = performance.now();
    return outcomes.includes('stored');
  });
  loading = entry;
  return entry.done;
}
