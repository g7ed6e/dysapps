// Le niveau où l'on est, à gauche de Réglages (changer de niveau comme dans la grille ; choix du mainteneur du 23 octobre
// 2026, piste « Un seul bouton qui s'ouvre », puis « ne pas séparer les boutons, et les déplier et replier tout seuls ») :
// une seule pastille au nom du niveau (« 5e ») ; son toucher la fait glisser vers la gauche, les autres niveaux atteints
// collés à lui ; elle se replie seule après un moment sans toucher, ou d'un toucher ailleurs. Un toucher sur un niveau
// lance le voyage (le fondu de la fiche de la Nef). Rien tant qu'un seul niveau est atteint.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { useTextes } from '../../../universes';
import { reachedArchipelagos, type ArchipelagoId } from '../../world/archipelago';

/**
 * La pastille dépliée se replie seule après ce délai sans geste (rien ne se perd : on la rouvre d'un toucher) ; assez
 * long pour une lecture lente ou la voix (référent dys), relancé par chaque geste, le pointeur ou le focus dedans.
 */
export const LEVEL_PICKER_FOLD_MS = 8000;

interface Props {
  here: ArchipelagoId;
  links: string[];
  /** Un niveau choisi : le fondu, puis le quai de son lieu de départ (`goLevel`). */
  onGo(to: ArchipelagoId): void;
}

export function LevelPicker({ here, links, onGo }: Props) {
  const textes = useTextes();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const fold = useRef<number | null>(null);
  const reached = reachedArchipelagos(links).map((a) => a.classe);
  const others = reached.filter((a) => a !== here);
  const close = useCallback(() => {
    // Le focus resté dans les niveaux revient au bouton, qui reste à sa place.
    if (box.current?.contains(document.activeElement) && document.activeElement !== toggle.current) toggle.current?.focus();
    setOpen(false);
  }, []);
  // Le compte à rebours du repli, relancé à chaque geste dans la pastille.
  const restart = useCallback(() => {
    if (fold.current !== null) window.clearTimeout(fold.current);
    fold.current = window.setTimeout(close, LEVEL_PICKER_FOLD_MS);
  }, [close]);
  // Dépliée, le focus va au premier niveau ; un toucher ailleurs (le monde, la caméra) la replie (référent dys).
  useEffect(() => {
    if (!open) return;
    // Sans défilement : la liste, encore étroite, décalerait la pastille (expert frontend).
    first.current?.focus({ preventScroll: true });
    restart();
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('pointerdown', away);
    return () => {
      window.removeEventListener('pointerdown', away);
      if (fold.current !== null) window.clearTimeout(fold.current);
      fold.current = null;
    };
  }, [open, restart, close]);
  if (reached.length < 2) return null;
  return (
    // Échap, le focus dans la pastille, la replie, sans fermer autre chose.
    <div
      ref={box}
      className={`open-world-niveaux${open ? ' ouvert' : ''}`}
      onPointerDown={open ? restart : undefined}
      onPointerMove={open ? restart : undefined}
      onFocus={open ? restart : undefined}
      onKeyDown={(e) => {
        if (!open) return;
        restart();
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        close();
      }}
    >
      {/* Les autres niveaux, toujours là pour glisser, mais hors d'atteinte repliés (`inert`). */}
      <div className="open-world-niveaux-glisse">
        <ul id={listId} className="open-world-niveaux-liste" aria-label="Les autres niveaux" inert={!open} aria-hidden={!open}>
          {others.map((to, i) => (
            <li key={to}>
              <button
                ref={i === 0 ? first : undefined}
                type="button"
                className="open-world-niveaux-choix"
                aria-label={`Aller en ${to}, les ${textes.archipels[to]}`}
                onClick={() => {
                  // Le focus revient au bouton avant que la liste ne devienne inerte.
                  close();
                  onGo(to);
                }}
              >
                {to}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button
        ref={toggle}
        type="button"
        className="open-world-niveau"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Changer de niveau. Tu es en ${here}, les ${textes.archipels[here]}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {here}
        {/* La flèche montre où la pastille va : vers la gauche repliée, vers la droite dépliée. */}
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}
