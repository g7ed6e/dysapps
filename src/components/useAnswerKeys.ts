import { useEffect, type RefObject } from 'react';

/**
 * Répondre au clavier (utile avec une dyspraxie, sur ordinateur) : les touches 1 à 9 touchent la 1re à la 9e réponse
 * de l'écran (boutons de réponse ou cartes à trier), Entrée valide un tri, puis passe à la suite quand le bandeau de
 * résultat est ouvert. Rien ne se passe pendant la saisie dans un champ, ni avec Ctrl, Alt ou Cmd.
 */
export function useAnswerKeys(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const section = sectionRef.current;
      if (!section || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const next = section.querySelector<HTMLButtonElement>('.result-sheet .next-button');
      if (e.key === 'Enter') {
        // Un bouton qui a le focus garde son comportement normal (Entrée l'active déjà).
        if (target instanceof HTMLButtonElement && section.contains(target)) return;
        const action = next ?? section.querySelector<HTMLButtonElement>('.validate-button:not(:disabled)');
        if (action) {
          e.preventDefault();
          action.click();
        }
        return;
      }
      if (next || !/^[1-9]$/.test(e.key)) return;
      const answers = [...section.querySelectorAll<HTMLButtonElement>('.question .choice, .question .word-card')];
      const pick = answers[Number(e.key) - 1];
      if (pick && !pick.disabled) {
        e.preventDefault();
        pick.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sectionRef]);
}
