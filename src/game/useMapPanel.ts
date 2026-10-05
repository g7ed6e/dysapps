import { useLayoutEffect, type RefObject } from 'react';

/**
 * Le panneau de la Carte (le chemin d'ouvrages vers une île pâle touchée) sur téléphone en grand texte (DA-31) : quand
 * il défile, on le marque (`data-suite` : « bas », « haut », « haut bas ») pour que des traits pointillés disent qu'il
 * continue. `contenu` change avec ce que montre le panneau (un autre chemin) : tout est remesuré et les nouveaux nœuds
 * observés.
 */
export function usePanneauDeLaCarte(stageRef: RefObject<HTMLElement | null>, ouverte: boolean, contenu: string) {
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !ouverte) return;
    const haut = stage.querySelector<HTMLElement>('.world-overlay-top');
    if (!haut) return;
    const marquer = () => {
      const suite = [haut.scrollTop > 1 ? 'haut' : '', haut.scrollHeight - haut.scrollTop - haut.clientHeight > 1 ? 'bas' : ''].filter(Boolean).join(' ');
      if ((haut.dataset.suite ?? '') !== suite) {
        if (suite) haut.dataset.suite = suite;
        else delete haut.dataset.suite;
      }
    };
    marquer();
    haut.addEventListener('scroll', marquer, { passive: true });
    let image = 0;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            cancelAnimationFrame(image);
            image = requestAnimationFrame(marquer);
          });
    observer?.observe(haut);
    for (const e of haut.children) observer?.observe(e);
    return () => {
      cancelAnimationFrame(image);
      observer?.disconnect();
      haut.removeEventListener('scroll', marquer);
      delete haut.dataset.suite;
    };
  }, [stageRef, ouverte, contenu]);
}
