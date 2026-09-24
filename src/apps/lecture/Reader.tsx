import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { frenchTypography } from '../../components/math/RichText';
import { isSpeechAvailable } from '../../core/speech';
import { useSettings } from '../../core/SettingsContext';
import { Syllabified } from '../../components/Syllabified';
import { segmentsOf, type ReadingText } from './data';
import { useReadAloud } from './useReadAloud';

interface Props {
  text: ReadingText;
  /** Version compacte (rappel du texte pendant les questions). */
  compact?: boolean;
}

/**
 * Texte adapté : une ligne par vers ou par phrase, couleurs alternées,
 * lecture à voix haute qui surligne la ligne lue, mots difficiles expliqués.
 */
export function Reader({ text, compact = false }: Props) {
  const segments = segmentsOf(text);
  const { current, playing, start, stop } = useReadAloud(segments);
  const [alternate, setAlternate] = useState(true);
  const { settings, update } = useSettings();
  const speech = isSpeechAvailable();
  let index = 0;

  return (
    <article className={`reader${alternate ? ' alternate' : ''}${text.kind === 'vers' ? ' verse' : ''}`} aria-labelledby={`titre-${text.id}${compact ? '-c' : ''}`}>
      {!compact && (
        <header className="reader-head">
          <h2 id={`titre-${text.id}`} className="reader-title">
            {text.title}
          </h2>
          <p className="reader-source">
            {text.author} · {text.source}
          </p>
        </header>
      )}

      <div className="reader-tools">
        {speech &&
          (playing ? (
            <button type="button" className="button" onClick={stop}>
              <Icon name="stop" /> Arrêter
            </button>
          ) : (
            <button type="button" className="button primary" onClick={() => start(0)}>
              <Icon name="speaker" /> Écouter le texte
            </button>
          ))}
        <label className="toggle">
          <input type="checkbox" checked={alternate} onChange={(e) => setAlternate(e.target.checked)} />
          Lignes en couleurs alternées
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.syllables} onChange={(e) => update({ syllables: e.target.checked })} />
          Syllabes en couleurs
        </label>
      </div>
      {speech && <p className="reader-tip">Touche une ligne pour l’écouter seule.</p>}

      <div className="reader-text panel">
        {compact && (
          <h3 id={`titre-${text.id}-c`} className="visually-hidden">
            {text.title}
          </h3>
        )}
        {text.paragraphs.map((paragraph, p) => (
          <div key={p} className="reader-paragraph">
            {paragraph.map((segment) => {
              const i = index++;
              const content = (
                <>
                  {text.kind === 'vers' && (
                    <span className="line-number" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                  <span className="segment-text">
                    <Syllabified text={frenchTypography(segment)} />
                  </span>
                </>
              );
              return speech ? (
                <button
                  key={i}
                  type="button"
                  className={`segment${current === i ? ' reading' : ''}`}
                  aria-current={current === i ? 'true' : undefined}
                  onClick={() => start(i, true)}
                >
                  {content}
                </button>
              ) : (
                <p key={i} className="segment">
                  {content}
                </p>
              );
            })}
          </div>
        ))}
      </div>

      {!compact && text.glossary.length > 0 && (
        <section className="glossary panel" aria-labelledby={`mots-${text.id}`}>
          <h3 id={`mots-${text.id}`}>
            <Icon name="book" /> Mots difficiles
          </h3>
          <dl>
            {text.glossary.map((g) => (
              <div key={g.word}>
                <dt>{g.word}</dt>
                <dd>{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
