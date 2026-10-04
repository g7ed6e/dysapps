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
    const root = document.documentElement;
    const margin = 12;
    const box = (selector: string) => {
      const rects = [...section.querySelectorAll<HTMLElement>(selector)].map((e) => e.getBoundingClientRect());
      if (!rects.length) return null;
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
    };
    // Le haut utile de l'écran : sous le bouton Pause du mode concentration (plus de barre du haut).
    const topOf = () =>
      Math.max(0, ...[...document.querySelectorAll('.focus-pause')].map((e) => e.getBoundingClientRect().bottom));

    /** Choisit le bandeau fixe ou dans la page, et réserve sous la question la place de ce qui reste en bas. */
    const place = () => {
      delete section.dataset.bandeau;
      const topbar = topOf();
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
        // Le bouton qui flotte en bas ne cache jamais l'élément qui reçoit le focus (WCAG 2.4.11).
        root.style.scrollPaddingBottom = `${Math.ceil(sheetHeight) + margin}px`;
      } else {
        root.style.removeProperty('scroll-padding-bottom');
      }
      section.style.setProperty('--sheet-h', `${Math.ceil(sheetHeight)}px`);
      return { inPage, sheetHeight, topbar };
    };

    const { inPage, sheetHeight, topbar } = place();
    const floor = window.innerHeight - sheetHeight - margin;
    const room = floor - topbar - margin;
    // Du plus complet au plus serré : on garde ce qui tient au-dessus du bandeau. L'aide peut se lire en défilant.
    // Dans la page, le résultat se montre avec les réponses marquées : en entier, sinon « Pas cette fois » et le plus
    // de lignes possible du message, qui commence par la bonne réponse (« La bonne réponse : « a » »).
    const marked = '.question .right, .question .wrong, .question .missed';
    const firstLines = (n: number) => {
      const answers = box(marked);
      const message = section.querySelector<HTMLElement>('.feedback-compact .feedback-body');
      if (!answers || !message) return null;
      const line = parseFloat(getComputedStyle(message).lineHeight) || 0;
      return { top: answers.top, bottom: message.getBoundingClientRect().top + n * line };
    };
    const withResult = inPage
      ? [box(`.question-prompt, ${marked}, .feedback-compact`), box(`${marked}, .feedback-compact`), firstLines(2), firstLines(1)]
      : [];
    const choices = [
      ...withResult,
      ...[
        '.consigne, .question',
        '.consigne, .question-head, .question-prompt, .question .right, .question .wrong, .question .missed',
        '.question-prompt, .question .right, .question .wrong, .question .missed',
        '.question .right, .question .wrong, .question .missed',
      ].map(box),
    ].filter((b) => b !== null);
    if (choices.length) {
      const target = choices.find((b) => b.bottom - b.top <= room) ?? choices[choices.length - 1];
      const delta = Math.min(target.bottom - floor, target.top - topbar - margin);
      if (delta > 0) {
        window.scrollBy({ top: delta, behavior: moinsDAnimations() ? 'auto' : 'smooth' });
      }
    }

    // L'appareil tourné : le choix entre fixe et dans la page se refait, sans faire défiler. Seulement si la largeur
    // change : sur téléphone, la barre d'adresse qui se replie en défilant change la hauteur, et le bandeau sauterait.
    let frame = 0;
    let largeur = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === largeur) return;
      largeur = window.innerWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      section.style.removeProperty('--sheet-h');
      delete section.dataset.bandeau;
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [sectionRef, open]);
}
