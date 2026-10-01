import { useLayoutEffect, type RefObject } from 'react';

/**
 * Les bulles du bas du monde (tutoriel, mot de la baleine, rallumage) se posent entre ce qui occupe le haut de la scène
 * et la barre du bas, dont la hauteur change avec la taille du texte (deux lignes de boutons sur téléphone, DA-24).
 * On mesure l'un et l'autre et on les donne à la scène (`--barre-h`, `--haut-h`) : une bulle ne passe jamais sous la
 * barre ni sur le haut (DA-25). On donne aussi la largeur de la colonne de droite (Pause et le choix de l'archipel,
 * `--colonne-w`) : le panneau du haut s'arrête avant elle, aucun bouton ne se pose sur son texte (DA-31). Et son bas
 * (`--colonne-bas`) : « Recentrer » se pose dessous, qu'il y ait ou non le choix de l'archipel.
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
      colonne: [...stage.querySelectorAll<HTMLElement>('[data-tuto="menu"], .world-archipel-button')],
    });
    const { bar, tops, colonne } = trouver();
    // N'écrire une variable que si elle change : chaque écriture réagence ce que l'on observe.
    const poser = (nom: string, px: number) => {
      const v = `${px}px`;
      if (stage.style.getPropertyValue(nom) !== v) stage.style.setProperty(nom, v);
    };
    const place = () => {
      const { bar, tops, colonne } = trouver();
      const s = stage.getBoundingClientRect();
      poser('--colonne-w', Math.ceil(Math.max(0, ...colonne.map((e) => e.getBoundingClientRect().width))));
      poser('--colonne-bas', Math.ceil(Math.max(0, ...colonne.map((e) => e.getBoundingClientRect().bottom - s.top))));
      // Une barre masquée (bulle ouverte sur téléphone en grand texte) ne prend plus de place.
      const barre = bar && bar.getClientRects().length ? Math.ceil(s.bottom - bar.getBoundingClientRect().top) : 0;
      poser('--barre-h', Math.max(0, barre));
      poser('--haut-h', Math.ceil(Math.max(0, ...tops.map((e) => e.getBoundingClientRect().bottom - s.top))));
    };
    place();
    if (typeof ResizeObserver === 'undefined') return;
    // Après le premier placement, synchrone, les suivants attendent l'image d'après : mesurer et écrire dans le rappel
    // de l'observateur ferait une boucle (« ResizeObserver loop completed with undelivered notifications »).
    let image = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(place);
    });
    for (const el of [stage, bar, ...tops, ...colonne]) if (el) observer.observe(el);
    return () => {
      cancelAnimationFrame(image);
      observer.disconnect();
    };
  }, [stageRef, voyage]);
}
