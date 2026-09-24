import { RichText } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import type { ItemProps } from './registry';

/**
 * Type générique « qcm » : un mot ou une question, des réponses à choisir.
 * Champs de l'item : prompt, choices, answer, et éventuellement spoken (texte lu).
 */
export function QcmItem({ item, answered, onAnswer }: ItemProps) {
  const prompt = String(item.prompt ?? item.word ?? '');
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const spoken = String(item.spoken ?? prompt);

  return (
    <div className="panel question">
      <div className="question-head">
        <p className="question-prompt item-word">
          <Syllabified text={prompt} />
        </p>
        <SpeakButton text={spoken} label="Écouter" />
      </div>
      <div className={`choices${choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          const isWrong = answered && answered.chosen === choice && choice !== answer;
          return (
            <button
              key={choice}
              type="button"
              className={`choice${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => onAnswer(choice === answer, { chosen: choice, answer, heard: item.heard, word: prompt })}
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
