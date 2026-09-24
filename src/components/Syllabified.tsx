import { useMemo } from 'react';
import { syllabify } from '../core/syllables';
import { useSettings } from '../core/SettingsContext';

interface Props {
  text: string;
  /** Force l'affichage, quel que soit le réglage. */
  force?: boolean;
}

/**
 * Texte avec les syllabes en couleurs alternées (si le réglage est activé).
 * Les lecteurs d'écran lisent le texte d'un bloc : la découpe est purement visuelle.
 */
export function Syllabified({ text, force = false }: Props) {
  const { settings } = useSettings();
  const on = force || settings.syllables;
  const pieces = useMemo(() => (on ? syllabify(text) : null), [on, text]);
  if (!pieces) return <>{text}</>;
  return (
    <span className="syllables" aria-label={text} role="text">
      {pieces.map((p, i) =>
        p.syllable === null ? (
          <span key={i} aria-hidden="true">
            {p.text}
          </span>
        ) : (
          <span key={i} className={`syl syl-${p.syllable % 2}`} aria-hidden="true">
            {p.text}
          </span>
        ),
      )}
    </span>
  );
}
