import { RichText } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import type { ScreenProps } from './registry';

/**
 * Familles-craft : on assemble un mot à partir d'une racine et d'un préfixe ou d'un suffixe.
 * Champs de l'item : meaning (ce que le mot veut dire), root, slot ('prefix' | 'suffix'), choices, answer, word (le mot assemblé).
 */
export function FamillesScreen({ items, answered, onAnswer }: ScreenProps) {
  const item = items[0];
  const root = String(item.root);
  const slot = item.slot === 'suffix' ? 'suffix' : 'prefix';
  const answer = String(item.answer);
  const word = String(item.word);
  const meaning = String(item.meaning ?? '');
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const chosen = answered?.detail?.chosen as string | undefined;
  const piece = answered ? answer : '…';
  const gap = <span className={`gap${answered ? ' filled' : ''}`}>{piece}</span>;

  return (
    <div className="panel question">
      <div className="question-head">
        <p className="question-prompt">
          <RichText text={meaning} />
        </p>
        <SpeakButton text={`${meaning} La racine est ${root}.`} label="Écouter" />
      </div>
      <p
        className="gap-word craft-word"
        aria-label={`Mot à assembler : ${slot === 'prefix' ? 'morceau manquant, puis' : ''} ${root} ${slot === 'suffix' ? ', puis morceau manquant' : ''}`}
      >
        {slot === 'prefix' ? gap : null}
        <span className="craft-root">{root}</span>
        {slot === 'suffix' ? gap : null}
      </p>
      <div className="choices short letter-blocks" role="group" aria-label={slot === 'prefix' ? 'Préfixes' : 'Suffixes'}>
        {choices.map((c) => {
          const isAnswer = answered && c === answer;
          const isWrong = answered && chosen === c && c !== answer;
          return (
            <button
              key={c}
              type="button"
              className={`choice letter-block${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: c === answer }], detail: { chosen: c, word } })}
            >
              {slot === 'prefix' ? `${c}-` : `-${c}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
