import { SpeakButton } from '../../components/SpeakButton';
import type { ScreenProps } from './registry';

/**
 * Mot troué : le mot a un trou, on tape le bloc de lettres qui le comble (3 blocs, dont 1 piège plausible).
 * Champs de l'item : word, before, after, answer, choices.
 */
export function MotTroueScreen({ items, answered, onAnswer }: ScreenProps) {
  const item = items[0];
  const word = String(item.word);
  const before = String(item.before ?? '');
  const after = String(item.after ?? '');
  const answer = String(item.answer);
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const chosen = answered?.detail?.chosen as string | undefined;
  const filled = answered ? answer : null;

  return (
    <div className="panel question">
      <div className="question-head">
        <p className="question-prompt gap-word" aria-label={`Mot à compléter : ${before}, trou, ${after}`}>
          <span>{before}</span>
          <span className={`gap${filled ? ' filled' : ''}`}>{filled ?? '…'}</span>
          <span>{after}</span>
        </p>
        <SpeakButton text={word} label="Écouter le mot" />
      </div>
      <div className="choices short letter-blocks" role="group" aria-label="Blocs de lettres">
        {choices.map((c) => {
          const isAnswer = answered && c === answer;
          const isWrong = answered && chosen === c && c !== answer;
          return (
            <button
              key={c}
              type="button"
              className={`choice letter-block${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: c === answer }], detail: { chosen: c } })}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
