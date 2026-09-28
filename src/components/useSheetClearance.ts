import { useLayoutEffect, type RefObject } from 'react';
import { moinsDAnimations } from '../core/mouvement';

/**
 * Le bandeau de résultat est fixé en bas de l'écran : il ne doit cacher ni la question, ni la réponse touchée,
 * ni la bonne réponse, ni l'aide. Quand il s'ouvre, on réserve sa hauteur sous la question (variable `--sheet-h`)
 * et on fait défiler juste ce qu'il faut pour que la consigne et la question restent au-dessus. Si elles sont trop
 * hautes pour l'écran (téléphone, aide dessinée), on garde au moins l'énoncé et les réponses marquées (bonne réponse,
 * réponse touchée). Le haut de ce qu'on montre ne passe jamais sous la barre du haut.
 */
export function useSheetClearance(sectionRef: RefObject<HTMLElement | null>, open: boolean) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!open || !section) return;
    const sheet = section.querySelector<HTMLElement>('.result-sheet');
    if (!sheet) return;
    const sheetHeight = sheet.getBoundingClientRect().height;
    section.style.setProperty('--sheet-h', `${Math.ceil(sheetHeight)}px`);
    const cleanup = () => {
      section.style.removeProperty('--sheet-h');
    };

    const margin = 12;
    const topbar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
    const floor = window.innerHeight - sheetHeight - margin;
    const room = floor - topbar - margin;
    const box = (selector: string) => {
      const rects = [...section.querySelectorAll<HTMLElement>(selector)].map((e) => e.getBoundingClientRect());
      if (!rects.length) return null;
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
    };
    // Du plus complet au plus serré : on garde ce qui tient au-dessus du bandeau. L'aide peut se lire en défilant.
    const choices = [
      '.consigne, .question',
      '.consigne, .question-head, .question-prompt, .question .right, .question .wrong, .question .missed',
      '.question-prompt, .question .right, .question .wrong, .question .missed',
      '.question .right, .question .wrong, .question .missed',
    ]
      .map(box)
      .filter((b) => b !== null);
    if (!choices.length) return cleanup;
    const target = choices.find((b) => b.bottom - b.top <= room) ?? choices[choices.length - 1];

    const delta = Math.min(target.bottom - floor, target.top - topbar - margin);
    if (delta > 0) {
      window.scrollBy({ top: delta, behavior: moinsDAnimations() ? 'auto' : 'smooth' });
    }
    return cleanup;
  }, [sectionRef, open]);
}
