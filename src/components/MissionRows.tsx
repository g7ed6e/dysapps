// Des missions en lignes (GD-20) : l'icône, le titre et l'étiquette sur une ligne de 64 px au moins, toute la ligne est
// la cible. Écrit pour la porte de l'école du monde continu (lot 2, `SubjectApps` en lignes), généralisé au panneau d'un
// lieu (point 8 : un lieu porte toutes les missions de son île) : une ligne y peut porter un signe (la mission se joue
// dans le lieu) et une seule y peut être mise en avant (la prochaine mission).
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type AnyIconName } from './Icon';

export interface MissionRow {
  /** L'identifiant de la mission, unique dans la liste. */
  id: string;
  icon: AnyIconName;
  title: string;
  /** L'étiquette, à droite : « Nouveau », le record, les étoiles. */
  tag: ReactNode;
  /** Les classes qui s'ajoutent à la ligne (la couleur d'une matière). */
  className?: string;
  /** Une ligne qui mène à une page (une mission du portail), avec l'état de la navigation (d'où l'on vient). */
  to?: { pathname: string; state?: unknown };
  /** Une ligne qui fait un geste (une mission d'un lieu, jouée sur place). */
  onSelect?: () => void;
  /** Ce qui passe entre le titre et l'étiquette (le signe « Dans le lieu »). */
  sign?: ReactNode;
  /** La ligne mise en avant : la prochaine mission (une seule par liste). */
  suggested?: boolean;
}

/**
 * Les lignes. Sans `to` ni `onSelect`, une ligne est fermée (« Bientôt »). `focus` : la ligne qui prend le focus à
 * l'ouverture (la mission dont on revient).
 */
export function MissionRows({ rows, focus, label }: { rows: readonly MissionRow[]; focus?: string | null; label?: string }) {
  const focused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    focused.current?.focus();
  }, [focus]);
  return (
    <ul className="apps apps-compact" aria-label={label}>
      {rows.map((row) => {
        const content = (
          <>
            <span className="app-icon">
              <Icon name={row.icon} size="1.8rem" />
            </span>
            <span className="app-title">{row.title}</span>
            {row.sign}
            {row.tag}
          </>
        );
        const className = `panel app-card${row.className ? ` ${row.className}` : ''}${row.suggested ? ' suggested' : ''}`;
        const ref = row.id === focus ? (el: HTMLElement | null) => void (focused.current = el) : undefined;
        return (
          <li key={row.id}>
            {row.to ? (
              <Link ref={ref} to={row.to.pathname} state={row.to.state} className={className} aria-current={row.suggested ? 'step' : undefined}>
                {content}
              </Link>
            ) : row.onSelect ? (
              <button ref={ref} type="button" className={className} aria-current={row.suggested ? 'step' : undefined} onClick={row.onSelect}>
                {content}
              </button>
            ) : (
              <div className={`${className} locked`} aria-disabled="true">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
