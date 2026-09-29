import { useLayoutEffect, type RefObject } from 'react';

/**
 * Les bulles du bas du monde (tutoriel, mot de la baleine, rallumage) se posent entre ce qui occupe le haut de la scène
 * et la barre du bas, dont la hauteur change avec la taille du texte (deux lignes de boutons sur téléphone, DA-24).
 * On mesure l'un et l'autre et on les donne à la scène (`--barre-h`, `--haut-h`) : une bulle ne passe jamais sous la
 * barre ni sur le haut (DA-25).
 */
export function usePlaceDesBulles(stageRef: RefObject<HTMLElement | null>, voyage: boolean) {
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Le haut occupé : les lignes du haut (la Carte, les paroles) et le bouton Pause, en haut à droite. Relus à chaque
    // mesure : le bouton Pause disparaît pendant un voyage et revient ensuite (nouveau nœud).
    const trouver = () => ({
      bar: stage.querySelector<HTMLElement>('.world-bar'),
      tops: [...stage.querySelectorAll<HTMLElement>('.world-overlay-top, [data-tuto="menu"]')],
    });
    const { bar, tops } = trouver();
    const place = () => {
      const { bar, tops } = trouver();
      const s = stage.getBoundingClientRect();
      // Une barre masquée (bulle ouverte sur téléphone en grand texte) ne prend plus de place.
      const barre = bar && bar.getClientRects().length ? Math.ceil(s.bottom - bar.getBoundingClientRect().top) : 0;
      stage.style.setProperty('--barre-h', `${Math.max(0, barre)}px`);
      const haut = Math.max(0, ...tops.map((e) => e.getBoundingClientRect().bottom - s.top));
      stage.style.setProperty('--haut-h', `${Math.ceil(haut)}px`);
    };
    place();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(place);
    for (const el of [stage, bar, ...tops]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [stageRef, voyage]);
}
