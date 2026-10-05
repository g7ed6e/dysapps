import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { RichText, frenchTypography } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { isSpeechAvailable, langAttr } from '../../core/speech';
import { Aid } from './Aid';
import type { AidData } from './maths';
import type { ScreenProps } from './registry';

/**
 * Écran « écoute d'une histoire » (Story time, Stories) : la question en français vient d'abord ; l'histoire, en anglais, ne
 * s'affiche pas : on l'écoute (bouton Écouter, et dès l'ouverture si la lecture automatique est active, après la
 * question). Une fois la réponse donnée, l'histoire s'affiche, une ligne par phrase, pour se corriger en la relisant.
 * Écran de l'anglais : l'invitation à écouter le dit (« en anglais ») ; une autre langue vivante la ferait varier avec `lang`.
 * Le lexique vient avant l'invitation à écouter, pour se lire d'abord. Sans synthèse vocale, l'histoire s'affiche dès
 * l'ouverture : on ne demande jamais d'écouter ce qu'on ne peut pas entendre.
 * Champs de l'item : question, prompt (l'histoire, une phrase par « \n »), spoken, choices, answer, hint, explanation, aid.
 */
export function RecitScreen({ items, answered, onAnswer, ruledOut, onHelp, lang = 'en' }: ScreenProps) {
  const item = items[0];
  const question = String(item.question ?? '');
  const story = String(item.prompt ?? '');
  const spoken = String(item.spoken ?? story.split('\n').join(' '));
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const hint = String(item.hint ?? '');
  const chosen = answered?.detail?.chosen;
  const [hintShown, setHintShown] = useState(false);
  const aid = item.aid as AidData | undefined;
  const choicesLang = item.choicesLang === 'fr' ? 'fr' : lang;
  const shown = Boolean(answered) || !isSpeechAvailable();

  return (
    <div className="panel question calcul">
      <div className="question-head">
        <p className="question-prompt notice-question">
          <Syllabified text={frenchTypography(question)} />
        </p>
        <SpeakButton text={frenchTypography(question)} label="Question" />
      </div>
      {aid && (
        <div className="aid calcul-aid">
          <Aid aid={aid} lang={lang} />
        </div>
      )}
      <div className="notice recit">
        {shown ? (
          <ul className="notice-text" role="list" lang={langAttr(lang)}>
            {story.split('\n').map((line, i) => (
              <li key={i} className="notice-line">
                <RichText text={line} lang={lang} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="recit-listen">
            <Icon name="speaker" /> Écoute l’histoire en anglais.
          </p>
        )}
        <SpeakButton text={spoken} label="Écouter" lang={lang} />
      </div>
      <div className={`choices${choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          return (
            <button
              key={choice}
              type="button"
              className={`choice${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
            >
              <span lang={langAttr(choicesLang)}>
                <RichText text={choice} lang={choicesLang} />
              </span>
            </button>
          );
        })}
      </div>
      {hint && !answered && (
        <div className="calcul-help">
          {hintShown ? (
            <p className="calcul-hint" role="status">
              <Icon name="lightbulb" /> {hint} <SpeakButton text={hint} compact />
            </p>
          ) : (
            <button
              type="button"
              className="button"
              onClick={() => {
                setHintShown(true);
                onHelp();
              }}
            >
              <Icon name="lightbulb" /> Un indice
            </button>
          )}
        </div>
      )}
    </div>
  );
}
