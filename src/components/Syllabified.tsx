import { useMemo } from 'react';
import { syllabify } from '../core/syllables';
import { keepTogether } from '../core/typography';
import { splitForeignWords } from '../core/foreignWords';
import { useSettings } from '../core/SettingsContext';
import { ForeignWordSpan, useForeignWords } from './ForeignWords';

interface Props {
  text: string;
  /** Force l'affichage, quel que soit le réglage. */
  force?: boolean;
}

/**
 * Les syllabes d'un texte français, en couleurs alternées : la découpe est purement visuelle. Un mot composé ou une
 * inversion verbe-pronom (« taille-crayon », « est-il ») ne se coupe pas à son trait d'union (`keepTogether`). Les
 * couleurs repartent à chaque mot (`syllabify`) et un morceau gardé ne coupe jamais un mot : l'alternance est celle du
 * texte d'un seul tenant, sans décalage d'un morceau à l'autre (Syllabified.test.tsx).
 */
function Syllables({ text, label }: { text: string; label: string }) {
  const runs = useMemo(() => keepTogether(text).map((run) => ({ ...run, pieces: syllabify(run.text) })), [text]);
  const pieces = (list: ReturnType<typeof syllabify>, at: number) =>
    list.map((p, i) =>
      p.syllable === null ? (
        <span key={`${at}-${i}`} aria-hidden="true">
          {p.text}
        </span>
      ) : (
        <span key={`${at}-${i}`} className={`syl syl-${p.syllable % 2}`} aria-hidden="true">
          {p.text}
        </span>
      ),
    );
  return (
    <span className="syllables" aria-label={label} role="text">
      {runs.map((run, k) =>
        run.keep ? (
          <span key={k} className="mot-lie" aria-hidden="true">
            {pieces(run.pieces, k)}
          </span>
        ) : (
          pieces(run.pieces, k)
        ),
      )}
    </span>
  );
}

/** Un texte sans syllabes, ses mots composés gardés ensemble à l'affichage. */
function Plain({ text }: { text: string }) {
  const runs = useMemo(() => keepTogether(text), [text]);
  if (!runs.some((r) => r.keep)) return <>{text}</>;
  return (
    <>
      {runs.map((run, k) =>
        run.keep ? (
          <span key={k} className="mot-lie">
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
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
  if (runs.length === 1 && !runs[0].word) return on ? <Syllables text={text} label={text} /> : <Plain text={text} />;
  return (
    <span className="foreign-words">
      {runs.map((r, i) =>
        r.word ? <ForeignWordSpan key={i} text={r.text} lang={r.word.lang} /> : on && /\p{L}/u.test(r.text) ? <Syllables key={i} text={r.text} label={r.text} /> : <span key={i}><Plain text={r.text} /></span>,
      )}
    </span>
  );
}
