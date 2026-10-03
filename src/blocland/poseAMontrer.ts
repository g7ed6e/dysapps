import type { BiomeId } from './biomes';
import { partiesDe, type Partie } from './world/parties';

/**
 * La pose à montrer dans le monde (GD-6, Blocland) : « Voir le bâtiment », à l'écran de fin d'une mission qui a posé
 * une partie, la retient ; le monde la prend en arrivant sur l'île et la joue en vague, une seule fois. La partie est
 * déjà enregistrée (à l'écran de fin) : ce mot, gardé le temps de la visite (`sessionStorage`), ne dit que quoi
 * montrer. Quitter pendant la pose, revenir, recharger la page : la partie est là, posée, sans que la pose se rejoue.
 * Les captures d'un lot de rendu (`scripts/rendu/mesures.mjs`, famille `pose`) l'écrivent elles-mêmes.
 */
const CLE = 'dysapps:pose';
/** Les poses déjà montrées pendant la visite (« lieu:rangs ») : un retour à l'écran de fin ne la rejoue pas. */
const CLE_MONTREES = 'dysapps:poses-montrees';

interface PoseRetenue {
  biome: BiomeId;
  /** Les rangs des parties posées (1 pour la première du bâtiment). */
  rangs: number[];
}

function lire<T>(cle: string): T | null {
  try {
    const brut = sessionStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    if (valeur === null) sessionStorage.removeItem(cle);
    else sessionStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // Stockage indisponible (navigation privée stricte) : la partie se montre posée, sans vague.
  }
}

const cleDeLaPose = (p: PoseRetenue) => `${p.biome}:${p.rangs.join(',')}`;

/** Retient les parties que la mission vient de poser, à montrer sur leur île. */
export function retenirLaPose(biome: BiomeId, parties: readonly Partie[]): void {
  if (!parties.length) return;
  const pose = { biome, rangs: parties.map((p) => p.rang) };
  if ((lire<string[]>(CLE_MONTREES) ?? []).includes(cleDeLaPose(pose))) return;
  ecrire(CLE, pose);
}

/** Prend la pose à montrer sur cette île, une fois : ensuite, plus rien à jouer. */
export function prendreLaPose(biome: BiomeId): Partie[] | null {
  const pose = lire<PoseRetenue>(CLE);
  if (!pose || pose.biome !== biome || !Array.isArray(pose.rangs)) return null;
  ecrire(CLE, null);
  ecrire(CLE_MONTREES, [...(lire<string[]>(CLE_MONTREES) ?? []), cleDeLaPose(pose)]);
  const parties = partiesDe(biome).filter((p) => pose.rangs.includes(p.rang));
  return parties.length ? parties : null;
}

/** Pour les tests : rien en attente, rien de montré. */
export function oublierLesPoses(): void {
  ecrire(CLE, null);
  ecrire(CLE_MONTREES, null);
}
