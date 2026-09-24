import { RichText } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import type { ScreenProps } from './registry';

/**
 * Écran générique « qcm » : un mot ou une phrase, des réponses à choisir.
 * Champs de l'item : prompt (ou word), choices, answer, et éventuellement spoken (texte lu).
 * Un prompt contenant « … » affiche une case à compléter.
 */
export function QcmItem({ items, answered, onAnswer }: ScreenProps) {
  const item = items[0];
  const prompt = String(item.prompt ?? item.word ?? '');
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const spoken = String(item.spoken ?? prompt);
  const chosen = answered?.detail?.chosen;
  const isSentence = prompt.includes('…') || prompt.length > 20;

  return (
    <div className="panel question">
      <div className="question-head">
        {isSentence ? (
          <p className="question-prompt">
            <RichText text={prompt} />
          </p>
        ) : (
          <p className="question-prompt item-word">
            <Syllabified text={prompt} />
          </p>
        )}
        <SpeakButton text={spoken} label="Écouter" />
      </div>
      <div className={`choices${choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          const isWrong = answered && chosen === choice && choice !== answer;
          return (
            <button
              key={choice}
              type="button"
              className={`choice${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
            >
              <span>
                <RichText text={choice} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
