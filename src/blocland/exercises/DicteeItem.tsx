import { useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { useSettings } from '../../core/SettingsContext';
import type { ScreenProps } from './registry';

/**
 * Dictée à choix : on entend un mot (rien à lire d'abord), puis on choisit la bonne écriture parmi 2 ou 3.
 * Sert à « Oreille du mineur » (paires proches : vin / fin) et au « Coffre à mots » (mots-outils : toujours / toujour).
 * Champs de l'item : word (lu), choices, answer (= word), hint (indice affiché après la réponse), sentence (contexte lu, facultatif).
 */
export function DicteeItem({ items, answered, onAnswer, exerciseId }: ScreenProps) {
  const { settings, speak } = useSettings();
  const item = items[0];
  const word = String(item.word);
  const spoken = String(item.sentence ?? word);
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? word);
  const chosen = answered?.detail?.chosen;

  // Le mot est lu dès que l'écran apparaît (si la lecture automatique est activée).
  useEffect(() => {
    if (settings.autoRead) speak(spoken);
    // Une lecture par item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, item.key]);

  return (
    <div className="panel question">
      <div className="question-head dictee-head">
        <p className="question-prompt dictee-prompt">
          <Icon name="speaker" /> Écoute, puis choisis le bon bloc.
        </p>
        <SpeakButton text={spoken} label="Réécouter" />
      </div>
      <div className="choices short" role="group" aria-label="Écritures possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          const isWrong = answered && chosen === choice && choice !== answer;
          return (
            <button
              key={choice}
              type="button"
              className={`choice letter-block${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
