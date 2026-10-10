// Un bouton du monde à icône seule (la barre du bas, les accès directs du haut à gauche) : son nom est dit aux lecteurs
// d'écran, écrit dessous en grand texte quand `mot` est demandé, et montré dans une petite étiquette quand le doigt
// reste posé une demi-seconde (consultant UX UI et référent dys, 10 octobre 2026 : une icône seule ne se reconnaît pas
// toujours). Un bouton « vide » (rien à reprendre, aucune révision) reste à sa place, délavé : le toucher dit pourquoi,
// dans la même étiquette, au lieu de ne rien faire.
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Icon, type AnyIconName } from '../components/Icon';

/** Le temps du doigt posé avant que le nom ne s'affiche, et le temps qu'il reste affiché. */
const APPUI_LONG_MS = 500;
const ETIQUETTE_MS = 2200;

interface Props {
  icon: AnyIconName;
  /** Le nom du bouton, dit aux lecteurs d'écran et montré au doigt posé. */
  name: string;
  /** Le mot écrit dessous en grand texte (la barre du bas : île, Carte, Blocs) ; sans lui, l'icône reste seule. */
  word?: ReactNode;
  /** Rien à faire ici pour l'instant : la phrase courte qui le dit au toucher. */
  empty?: string;
  /** Une pastille chiffrée (les révisions, les commandes, les blocs). */
  count?: ReactNode;
  className?: string;
  pressed?: boolean;
  controls?: string;
  tuto?: string;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

export function WorldButton({ icon, name, word, empty, count, className, pressed, controls, tuto, onClick, buttonRef, children }: Props) {
  const [etiquette, setEtiquette] = useState<string | null>(null);
  const appui = useRef(0);
  const cacher = useRef(0);
  const appuiLong = useRef(false);
  useEffect(
    () => () => {
      window.clearTimeout(appui.current);
      window.clearTimeout(cacher.current);
    },
    [],
  );
  const montrer = (texte: string) => {
    setEtiquette(texte);
    window.clearTimeout(cacher.current);
    cacher.current = window.setTimeout(() => setEtiquette(null), ETIQUETTE_MS);
  };
  const lever = () => window.clearTimeout(appui.current);
  return (
    <span className={`world-button${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        ref={buttonRef}
        className={`button${word === undefined ? ' icone-seule' : ''}${empty ? ' vide' : ''}`}
        aria-label={empty ? `${name} : ${empty}` : name}
        aria-disabled={empty ? true : undefined}
        aria-pressed={pressed}
        aria-controls={controls}
        data-tuto={tuto}
        onPointerDown={() => {
          appuiLong.current = false;
          window.clearTimeout(appui.current);
          appui.current = window.setTimeout(() => {
            appuiLong.current = true;
            montrer(name);
          }, APPUI_LONG_MS);
        }}
        onPointerUp={lever}
        onPointerLeave={lever}
        onPointerCancel={lever}
        // Le doigt posé longtemps ne fait que montrer le nom : il n'ouvre rien en se levant.
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (appuiLong.current) {
            appuiLong.current = false;
            return;
          }
          if (empty) montrer(empty);
          else onClick();
        }}
      >
        <Icon name={icon} />
        {word !== undefined && <span className="world-bar-text">{word}</span>}
        {children}
        {count !== undefined && <span className="world-bar-count">{count}</span>}
      </button>
      {/* L'étiquette se lit aussi aux lecteurs d'écran : c'est la réponse au toucher d'un bouton vide. */}
      <span className={`world-button-label${etiquette ? ' on' : ''}`} role="status" aria-live="polite">
        {etiquette}
      </span>
    </span>
  );
}
