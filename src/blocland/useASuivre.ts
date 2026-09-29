import { useEffect, useRef, useState } from 'react';

/**
 * Un texte qui défile dans sa fenêtre : dit s'il reste une suite plus bas, pour la montrer d'un repère (la Carte en
 * grand texte). Recalculé quand on fait défiler, quand la fenêtre change de taille et quand `cle` change.
 */
export function useASuivre<T extends HTMLElement>(cle: unknown) {
  const ref = useRef<T>(null);
  const [suite, setSuite] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setSuite(false);
      return;
    }
    const check = () => setSuite(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    // La fenêtre, et ce qu'elle contient : le texte change de hauteur quand la police arrive.
    for (const node of [el, ...el.children]) observer?.observe(node);
    return () => {
      el.removeEventListener('scroll', check);
      observer?.disconnect();
    };
  }, [cle]);
  return [ref, suite] as const;
}
