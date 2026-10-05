// Le panneau qui glisse depuis le bas du monde (île, menu, trophées, blocs, école, lieu, monuments, archipels) : un
// dialogue, son en-tête (le titre avec son icône, une ligne dessous, la croix) et son contenu. Écrit une fois pour tous
// (qualité du code, lot 8).
import type { ReactNode, Ref } from 'react';
import { Icon, type AnyIconName } from '../components/Icon';

interface Props {
  /** L'identifiant du panneau (`panneau-…`). */
  id: string;
  /** Les classes qui s'ajoutent à `island-sheet`. */
  className: string;
  /** L'identifiant du titre, qui nomme le dialogue. */
  titleId: string;
  icon: AnyIconName;
  title: ReactNode;
  /** La ligne sous le titre, s'il y en a une. */
  subtitle?: ReactNode;
  /** Ce qui passe avant le titre (le portrait de la créature d'une île). */
  before?: ReactNode;
  /** Le titre reçoit le focus quand la page le lui rend (`tabIndex` −1). */
  titleRef?: Ref<HTMLHeadingElement>;
  /** Ce que la croix dit aux lecteurs d'écran. */
  closeLabel?: string;
  /** La croix prend le focus à l'ouverture. */
  autoFocusClose?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ id, className, titleId, icon, title, subtitle, before, titleRef, closeLabel = 'Fermer le panneau', autoFocusClose, onClose, children }: Props) {
  return (
    <section id={id} className={`island-sheet ${className}`} role="dialog" aria-labelledby={titleId} aria-modal="true">
      <div className="island-sheet-head">
        {before}
        <div className="island-sheet-titles">
          <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="island-sheet-title">
            <Icon name={icon} /> {title}
          </h2>
          {subtitle !== undefined && <p className="island-sheet-module">{subtitle}</p>}
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label={closeLabel} onClick={onClose} autoFocus={autoFocusClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </section>
  );
}
