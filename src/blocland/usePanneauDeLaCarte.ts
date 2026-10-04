import { useLayoutEffect, type RefObject } from 'react';

/**
 * Le panneau de la Carte sur téléphone en grand texte (DA-31) : pli fermé, il s'arrête sous « Y aller », entier, et la
 * suite (le pli « Les îles et leur état ») vient en le faisant défiler ; la Carte garde ainsi sa place sous lui. On
 * mesure le bas de « Y aller » dans le panneau (`--carte-panneau-max` sur la scène) et on marque le panneau
 * (`data-suite` : « bas », « haut », « haut bas ») pour que des traits pointillés disent qu'il continue. Ailleurs, et
 * pli ouvert, rien n'est posé : le panneau garde sa hauteur de toujours. `contenu` change avec ce que montre le panneau
 * (une autre destination, le chemin d'ouvrages) : tout est remesuré et les nouveaux nœuds observés.
 */
export function usePanneauDeLaCarte(stageRef: RefObject<HTMLElement | null>, ouverte: boolean, contenu: string) {
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !ouverte) return;
    const haut = stage.querySelector<HTMLElement>('.world-overlay-top');
    if (!haut) return;
    const telephone = typeof matchMedia === 'function' ? matchMedia('(max-width: 640px)') : null;
    const ecrire = (nom: string, v: string | null) => {
      if (stage.style.getPropertyValue(nom) === (v ?? '')) return;
      if (v === null) stage.style.removeProperty(nom);
      else stage.style.setProperty(nom, v);
    };
    const marquer = () => {
      const suite = [haut.scrollTop > 1 ? 'haut' : '', haut.scrollHeight - haut.scrollTop - haut.clientHeight > 1 ? 'bas' : ''].filter(Boolean).join(' ');
      if ((haut.dataset.suite ?? '') !== suite) {
        if (suite) haut.dataset.suite = suite;
        else delete haut.dataset.suite;
      }
    };
    const mesurer = () => {
      const aller = haut.querySelector<HTMLElement>('.world-map-actions .button.primary');
      const pli = haut.querySelector<HTMLDetailsElement>('.world-map-islands');
      const grand = document.documentElement.getAttribute('data-texte') === 'grand';
      if (!aller || !telephone?.matches || !grand || pli?.open) ecrire('--carte-panneau-max', null);
      else {
        // Sous « Y aller », la marge du bas de la ligne de la Carte, pour que le bouton ne touche pas le trait.
        const bas = aller.getBoundingClientRect().bottom - haut.getBoundingClientRect().top + haut.scrollTop + 8;
        ecrire('--carte-panneau-max', `${Math.ceil(bas)}px`);
      }
      marquer();
    };
    mesurer();
    haut.addEventListener('scroll', marquer, { passive: true });
    haut.addEventListener('toggle', mesurer, true);
    telephone?.addEventListener?.('change', mesurer);
    let image = 0;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            cancelAnimationFrame(image);
            image = requestAnimationFrame(mesurer);
          });
    observer?.observe(haut);
    for (const e of haut.children) observer?.observe(e);
    return () => {
      cancelAnimationFrame(image);
      observer?.disconnect();
      haut.removeEventListener('scroll', marquer);
      haut.removeEventListener('toggle', mesurer, true);
      telephone?.removeEventListener?.('change', mesurer);
      stage.style.removeProperty('--carte-panneau-max');
      delete haut.dataset.suite;
    };
  }, [stageRef, ouverte, contenu]);
}
