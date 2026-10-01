// Le panneau replié de l'île où l'on est : il le reste quand on revient de la Carte, d'un panneau du village ou d'un
// exercice (le monde se remonte alors). Retenu le temps de la séance (sessionStorage) ; si le navigateur le refuse,
// le temps de la page.
import type { BiomeId } from './biomes';

const CLE = 'dysapps:panneau-replie';
let enMemoire: BiomeId | null = null;

/** L'île dont le panneau est replié, ou `null` si aucun ne l'est. */
export function panneauReplie(): BiomeId | null {
  try {
    return (sessionStorage.getItem(CLE) as BiomeId | null) ?? null;
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
