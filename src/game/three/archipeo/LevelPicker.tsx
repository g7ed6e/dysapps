// Le niveau où l'on est, à gauche de Réglages (changer de niveau comme dans la grille ; choix du mainteneur du 23 octobre
// 2026, piste « Un seul bouton qui s'ouvre ») : un bouton au nom du niveau (« 5e ») ; son toucher déplie, à sa gauche, un
// bouton par autre niveau atteint ; un toucher sur l'un d'eux lance le voyage (le fondu de la fiche de la Nef). Rien tant
// qu'un seul niveau est atteint.
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { useTextes } from '../../../universes';
import { reachedArchipelagos, type ArchipelagoId } from '../../world/archipelago';

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
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const reached = reachedArchipelagos(links).map((a) => a.classe);
  const others = reached.filter((a) => a !== here);
  const box = useRef<HTMLDivElement>(null);
  // Déplié, le focus va au premier niveau ; un toucher ailleurs (le monde, la caméra) le replie (référent dys).
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [open]);
  if (reached.length < 2) return null;
  return (
    // Échap, le focus dans le bouton ou ses niveaux, replie et rend le focus au bouton, sans fermer autre chose.
    <div
      ref={box}
      className="open-world-niveaux"
      onKeyDown={(e) => {
        if (!open || e.key !== 'Escape') return;
        e.stopPropagation();
        setOpen(false);
        toggle.current?.focus();
      }}
    >
      <button
        ref={toggle}
        type="button"
        className={`button open-world-niveau${open ? ' ouvert' : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Changer de niveau. Tu es en ${here}, les ${textes.archipels[here]}`}
        onClick={() => setOpen(!open)}
      >
        {here}
        <Icon name={open ? 'close' : 'chevronDown'} />
      </button>
      {open && (
        <ul id={listId} className="open-world-niveaux-liste" aria-label="Les autres niveaux">
          {others.map((to, i) => (
            <li key={to}>
              <button
                ref={i === 0 ? first : undefined}
                type="button"
                className="button"
                aria-label={`Aller en ${to}, les ${textes.archipels[to]}`}
                onClick={() => {
                  setOpen(false);
                  onGo(to);
                }}
              >
                {to}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
