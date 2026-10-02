// Le panneau replié de l'île où l'on est : il le reste quand on revient de la Carte, d'un panneau du village ou d'un
// exercice (le monde se remonte alors). Retenu le temps de la séance (sessionStorage) ; si le navigateur le refuse,
// le temps de la page.
import { getBiome, type BiomeId } from './biomes';

const CLE = 'dysapps:panel-folded';
let enMemoire: BiomeId | null = null;

/** L'île dont le panneau est replié, ou `null` si aucun ne l'est. */
export function panneauReplie(): BiomeId | null {
  try {
    // Une valeur qui n'est pas une île (ancienne, ou écrite à la main) ne replie rien.
    const lue = sessionStorage.getItem(CLE);
    return (lue && getBiome(lue)?.id) || null;
  } catch {
    return enMemoire;
  }
}

/** Retient l'île dont on vient de replier le panneau ; `null` quand un panneau s'ouvre. */
export function retenirPanneauReplie(id: BiomeId | null): void {
  enMemoire = id;
  try {
    if (id) sessionStorage.setItem(CLE, id);
    else sessionStorage.removeItem(CLE);
  } catch {
    // Stockage indisponible : la mémoire de la page suffit.
  }
}
