import { useLayoutEffect, type RefObject } from 'react';
import { moinsDAnimations } from '../core/mouvement';

/**
 * Le bandeau de résultat est fixé en bas de l'écran : il ne doit cacher ni la question, ni la réponse touchée,
 * ni la bonne réponse, ni l'aide. Quand il s'ouvre, on réserve sa hauteur sous la question (variable `--sheet-h`)
 * et on fait défiler juste ce qu'il faut pour que la consigne et la question restent au-dessus. Si elles sont trop
 * hautes pour l'écran (téléphone, aide dessinée), on garde au moins l'énoncé et les réponses marquées (bonne réponse,
 * réponse touchée). Le haut de ce qu'on montre ne passe jamais sous la barre du haut ni sous le bouton Pause.
 *
 * DA-23 : aux grandes tailles de texte, le bandeau ne laisse plus la place à l'énoncé et aux réponses, ou sa
 * correction devrait défiler dans une fenêtre de moins de trois lignes. Il n'est alors plus fixé : il suit la question dans la
 * page (`data-bandeau="page"` sur la section), qui défile d'un seul tenant ; seul le bouton pour continuer reste
 * collé en bas de l'écran.
 */
export function useSheetClearance(sectionRef: RefObject<HTMLElement | null>, open: boolean) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!open || !section) return;
    const sheet = section.querySelector<HTMLElement>('.result-sheet');
    if (!sheet) return;
    const cleanup = () => {
      section.style.removeProperty('--sheet-h');
      delete section.dataset.bandeau;
    };

    const margin = 12;
    // Le haut utile de l'écran : sous la barre du haut, ou sous le bouton Pause du mode concentration.
    const topbar = Math.max(
      0,
      ...[...document.querySelectorAll('.topbar, .focus-pause')].map((e) => e.getBoundingClientRect().bottom),
    );
    const box = (selector: string) => {
      const rects = [...section.querySelectorAll<HTMLElement>(selector)].map((e) => e.getBoundingClientRect());
      if (!rects.length) return null;
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
    };
    const essentials = box('.question-prompt, .question .right, .question .wrong, .question .missed');
    const body = sheet.querySelector<HTMLElement>('.result-sheet-body');

    let sheetHeight = sheet.getBoundingClientRect().height;
    const roomAbove = window.innerHeight - sheetHeight - 2 * margin - topbar;
    // La correction défile dans le bandeau ; trop à l'étroit (moins de trois lignes visibles), elle passe dans la page.
    const bodyCramped =
      body !== null &&
      body.scrollHeight > body.clientHeight + 1 &&
      body.clientHeight < 3 * (parseFloat(getComputedStyle(body).lineHeight) || 0);
    const inPage = bodyCramped || (essentials !== null && essentials.bottom - essentials.top > roomAbove);
    if (inPage) {
      section.dataset.bandeau = 'page';
      sheetHeight = sheet.querySelector('.next-button')?.getBoundingClientRect().height ?? 0;
    }
    section.style.setProperty('--sheet-h', `${Math.ceil(sheetHeight)}px`);

    const floor = window.innerHeight - sheetHeight - margin;
    const room = floor - topbar - margin;
    // Du plus complet au plus serré : on garde ce qui tient au-dessus du bandeau. L'aide peut se lire en défilant.
    // Dans la page, le début du résultat (« Pas cette fois » et la bonne réponse) se montre avec les réponses marquées.
    const marked = '.question .right, .question .wrong, .question .missed';
    const withResult = inPage
      ? [`.question-prompt, ${marked}, .feedback-compact`, `${marked}, .feedback-compact`, `${marked}, .feedback-compact .feedback-shout`]
      : [];
    const choices = [
      ...withResult,
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
