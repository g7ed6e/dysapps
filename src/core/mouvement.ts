import { useSyncExternalStore } from 'react';

/**
 * Moins d'animations : l'appareil le demande (préférence système « Réduire les animations », lue par le navigateur
 * sous `prefers-reduced-motion`). Le réglage de l'appli du même nom est retiré le 28/09/2026 et inscrit au plan pour
 * un lot ultérieur (docs/univers/archipeo/cadrage.md) ; d'ici là, seule la préférence de l'appareil fige le monde,
 * la cinématique du voyage, les créatures et le Filon.
 */
const REQUETE = '(prefers-reduced-motion: reduce)';

/** L'appareil demande-t-il moins d'animations ? Faux quand le navigateur ne sait pas le dire. */
export function moinsDAnimations(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(REQUETE).matches);
}

function suivre(rappel: () => void): () => void {
  const requete = typeof window !== 'undefined' ? window.matchMedia?.(REQUETE) : undefined;
  requete?.addEventListener?.('change', rappel);
  return () => requete?.removeEventListener?.('change', rappel);
}

/** `moinsDAnimations`, suivi dans un composant : change si la préférence de l'appareil change. */
export function useMoinsDAnimations(): boolean {
  return useSyncExternalStore(suivre, moinsDAnimations, () => false);
}
