// Une mission du portail dans sa grille (homophones, verbes irréguliers, vocabulaire, lecture) : son numéro, son titre,
// ce qu'elle travaille, et le record ou le mot pour la jouer. Écrite une fois pour les quatre (qualité du code, lot 8).
import type { ReactNode } from 'react';
import { RecordTag } from './RecordTag';

interface Props {
  /** La couleur de la carte : `level-1`, `level-2` ou `level-3`. */
  tone: number;
  number: number;
  title: ReactNode;
  /** Une ligne sous le titre (l'auteur d'un texte). */
  grade?: ReactNode;
  /** La langue de ce qu'elle travaille, quand ce n'est pas le français. */
  lang?: string;
  /** Le record, en pour cent, s'il y en a un. */
  record: number | undefined;
  /** Le mot pour la jouer, tant qu'elle n'a pas de record. */
  playLabel?: string;
  onPlay: () => void;
  /** Ce qu'elle travaille, chaque élément dans son `span`. */
  children: ReactNode;
}

export function LevelCard({ tone, number, title, grade, lang, record, playLabel = 'Jouer', onPlay, children }: Props) {
  return (
    <li>
      <button type="button" className={`panel level-card level-${tone}`} onClick={onPlay}>
        <span className="level-number" aria-hidden="true">
          {number}
        </span>
        <span className="level-title">{title}</span>
        {grade !== undefined && <span className="level-grade">{grade}</span>}
        <span className="level-sets" lang={lang}>
          {children}
        </span>
        {record !== undefined ? <RecordTag record={record} /> : <span className="tag tag-new">{playLabel}</span>}
      </button>
    </li>
  );
}
