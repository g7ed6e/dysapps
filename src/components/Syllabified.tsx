import { useMemo } from 'react';
import { syllabify } from '../core/syllables';
import { splitForeignWords } from '../core/foreignWords';
import { useSettings } from '../core/SettingsContext';
import { ForeignWordSpan, useForeignWords } from './ForeignWords';

interface Props {
  text: string;
  /** Force l'affichage, quel que soit le réglage. */
  force?: boolean;
}

/** Les syllabes d'un texte français, en couleurs alternées : la découpe est purement visuelle. */
function Syllables({ text, label }: { text: string; label: string }) {
  const pieces = useMemo(() => syllabify(text), [text]);
  return (
    <span className="syllables" aria-label={label} role="text">
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

/**
 * Texte avec les syllabes en couleurs alternées (si le réglage est activé).
 * Les lecteurs d'écran lisent le texte d'un bloc : la découpe est purement visuelle. Sur l'île du latin et du grec, les
 * mots marqués (`useForeignWords`) restent sans syllabes, dans leur langue ; le français autour garde les siennes.
 */
export function Syllabified({ text, force = false }: Props) {
  const { settings } = useSettings();
  const words = useForeignWords();
  const on = force || settings.syllables;
  const runs = useMemo(() => splitForeignWords(text, words), [text, words]);
  if (runs.length === 1 && !runs[0].word) return on ? <Syllables text={text} label={text} /> : <>{text}</>;
  return (
    <span className="foreign-words">
      {runs.map((r, i) =>
        r.word ? <ForeignWordSpan key={i} text={r.text} lang={r.word.lang} /> : on && /\p{L}/u.test(r.text) ? <Syllables key={i} text={r.text} label={r.text} /> : <span key={i}>{r.text}</span>,
      )}
    </span>
  );
}
