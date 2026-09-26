import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { Icon } from '../components/Icon';

interface Props {
  /** Nom du pli (classe `island-fold-<nom>`). */
  name: string;
  /** L'en-tête, tel qu'il était (un `h3.island-sheet-heading`). */
  heading: ReactNode;
  /** L'état en une ligne, lisible quand le pli est fermé. */
  status?: string;
  /** Ouvert quand il y a quelque chose à faire ; sinon replié. */
  defaultOpen: boolean;
  /** Change quand le contexte change (autre île, ouvrage mis en avant) : le choix de l'élève est alors oublié. */
  resetKey: string;
  children: ReactNode;
}

interface FoldableProps extends Omit<Props, 'resetKey'> {
  /** La clé du pli ; sans clé, la section s'affiche telle quelle (en-tête puis contenu), comme en vue simple. */
  fold?: string;
}

/** Une section qui se replie dans le panneau 3D (`fold` donné) et reste dépliée ailleurs. */
export function Foldable({ fold, heading, children, ...rest }: FoldableProps) {
  if (fold === undefined)
    return (
      <>
        {heading}
        {children}
      </>
    );
  return (
    <IslandFold heading={heading} resetKey={fold} {...rest}>
      {children}
    </IslandFold>
  );
}

/**
 * Une section repliable du panneau d'île. Ouverte d'elle-même quand il y a quelque chose à faire (un bloc à poser, un
 * ouvrage à construire, le navire prêt), repliée sinon : le panneau reste court. L'élève peut ouvrir ou fermer ; son
 * choix tient tant que le contexte ne change pas. L'état est calculé au rendu, jamais dans un effet, pour que les
 * défilements des enfants (« mis en avant ») trouvent leur section ouverte.
 */
export function IslandFold({ name, heading, status, defaultOpen, resetKey, children }: Props) {
  const [user, setUser] = useState<{ key: string; open: boolean } | null>(null);
  const open = user?.key === resetKey ? user.open : defaultOpen;
  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    // L'événement suit aussi les changements que React applique : on ne retient que ceux de l'élève.
    if (e.currentTarget.open !== open) setUser({ key: resetKey, open: e.currentTarget.open });
  };
  return (
    <details className={`island-fold island-fold-${name}`} open={open} onToggle={onToggle}>
      <summary className="island-fold-summary">
        <span className="island-fold-chevron" aria-hidden="true">
          <Icon name={open ? 'chevronDown' : 'chevronRight'} />
        </span>
        <span className="island-fold-head">
          {heading}
          {status && !open && <span className="island-fold-status">{status}</span>}
        </span>
      </summary>
      {children}
    </details>
  );
}
