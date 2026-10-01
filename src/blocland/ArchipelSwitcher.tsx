// Le sélecteur d'archipel du monde : un petit bouton sous le bouton Menu, qui dit où l'on est (« 6e ») et, touché,
// liste les archipels déjà atteints. En choisir un y emmène d'un fondu court, sans la cinématique du Bloc-Navire
// (réservée au premier voyage vers un archipel).
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { ARCHIPELAGOS, isArchipelagoReached, type ArchipelagoId } from './world/archipelago';
import { useTextes } from '../univers';

interface Props {
  current: ArchipelagoId;
  bridges: string[];
  /** Aller dans un archipel déjà atteint. */
  onGo: (to: ArchipelagoId) => void;
  /** Ce qu'il faut pour les archipels fermés (les quatre archipels). */
  onMore: () => void;
}

export function ArchipelSwitcher({ current, bridges, onGo, onMore }: Props) {
  const [open, setOpen] = useState(false);
  const textes = useTextes();
  const box = useRef<HTMLDivElement>(null);
  const reached = ARCHIPELAGOS.filter((a) => isArchipelagoReached(a.classe, bridges));
  // Fermé d'un toucher ailleurs ou avec Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  // Un seul archipel atteint : rien à choisir.
  if (reached.length < 2) return null;
  return (
    <div className="world-archipel" data-couvre="bouton" ref={box}>
      <button
        type="button"
        className="button world-archipel-button"
        aria-expanded={open}
        aria-controls="liste-archipels"
        aria-label={`Archipel de ${current}, les ${textes.archipels[current]} : changer d’archipel`}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="ship" /> {current}
      </button>
      {open && (
        <div id="liste-archipels" className="panel world-archipel-list" role="group" aria-label="Changer d’archipel">
          <ul>
            {ARCHIPELAGOS.map((a) => {
              const ok = reached.includes(a);
              const isHere = a.classe === current;
              return (
                <li key={a.classe}>
                  <button
                    type="button"
                    className={`world-archipel-item${isHere ? ' here' : ''}`}
                    disabled={!ok || isHere}
                    onClick={() => {
                      setOpen(false);
                      onGo(a.classe);
                    }}
                  >
                    <strong>{a.classe}</strong> Les {textes.archipels[a.classe]}{' '}
                    <span className="world-archipel-state">{isHere ? 'Tu es ici' : ok ? '' : 'Fermé'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="world-archipel-more"
            onClick={() => {
              setOpen(false);
              onMore();
            }}
          >
            <Icon name="map" /> Les quatre archipels
          </button>
        </div>
      )}
    </div>
  );
}
