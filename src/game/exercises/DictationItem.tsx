import { useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { useSettings } from '../../core/SettingsContext';
import { langAttr } from '../../core/speech';
import type { ScreenProps } from './registry';

/**
 * Dictée à choix : on entend un mot (rien à lire d'abord), puis on choisit la bonne écriture parmi 2 ou 3.
 * Sert à « Oreille du mineur » (paires proches : vin / fin) et au « Coffre à mots » (mots-outils : toujours / toujour).
 * Champs de l'item : word (lu), choices, answer (= word), hint (indice affiché après la réponse), sentence (contexte lu, facultatif).
 * En anglais (`lang: 'en'`), le mot est lu en voix anglaise. La ligne affichée suit l'item : avec une phrase, elle dit qu'on
 * écoute la phrase et qu'on écrit le mot.
 */
export function DicteeItem({ items, answered, onAnswer, ruledOut, exerciseId, lang = 'fr' }: ScreenProps) {
  const { settings, speak } = useSettings();
  const item = items[0];
  const word = String(item.word);
  const spoken = String(item.sentence ?? word);
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? word);
  const chosen = answered?.detail?.chosen;

  // Le mot est lu dès que l'écran apparaît (si la lecture automatique est activée).
  useEffect(() => {
    if (settings.autoRead) speak(spoken, undefined, lang);
    // Une lecture par item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, item.key]);

  return (
    <div className="panel question">
      <div className="question-head dictee-head">
        <p className="question-prompt dictee-prompt">
          <Icon name="speaker" /> {item.sentence ? 'Écoute la phrase, puis choisis l’écriture du mot.' : 'Écoute, puis choisis la bonne écriture.'}
        </p>
        <SpeakButton text={spoken} label="Réécouter" lang={lang} />
      </div>
      <div className="choices short" role="group" aria-label="Écritures possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          return (
            <button
              key={choice}
              type="button"
              className={`choice letter-block${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              lang={langAttr(item.choicesLang === 'fr' ? 'fr' : lang)}
              disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
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
