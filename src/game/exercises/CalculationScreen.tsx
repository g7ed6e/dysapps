import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { RichText, frenchTypography } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { Marked } from '../../components/ForeignWords';
import { langAttr } from '../../core/speech';
import { Aid } from './Aid';
import type { AidData } from './maths';
import type { ScreenProps } from './registry';

/**
 * Écran « calcul » : une seule opération, le nombre lu à voix haute, l'aide visuelle toujours affichée
 * (grille de points, boîte de dix, droite par bonds…), des réponses rangées dans l'ordre croissant,
 * un indice sur demande. Champs de l'item : prompt, spoken, choices, answer, hint, explanation, aid, figure.
 * En anglais (`lang: 'en'`), l'énoncé et les réponses sont lus en voix anglaise ; l'indice et l'aide restent en français.
 * Un item peut porter une question en français (`question`) : elle vient d'abord, lue en voix française, et l'énoncé
 * devient un document à lire (panneau, menu, horaire), encadré, une ligne par « \n », lu dans sa langue ; un document
 * en français (Observatoire des textes) est découpé en syllabes quand le réglage est actif. Un document peut porter une
 * image (`image`, un emoji) : le visuel qui l'accompagne (Signs), affiché devant lui, sans jamais donner la réponse.
 * `listenToChoices` (les questions des blocs assemblés et des grands projets) : une réponse en langue étrangère a son
 * bouton Écouter, à côté d'elle.
 */
export function CalculationScreen({ items, answered, onAnswer, ruledOut, onHelp, lang = 'fr', listenToChoices = false }: ScreenProps & { listenToChoices?: boolean }) {
  const item = items[0];
  const prompt = String(item.prompt ?? '');
  const spoken = String(item.spoken ?? prompt);
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const hint = String(item.hint ?? '');
  const chosen = answered?.detail?.chosen;
  const [hintShown, setHintShown] = useState(false);
  const aid = item.aid as AidData | undefined;
  const figure = item.figure as AidData | undefined;
  const choicesLang = item.choicesLang === 'fr' ? 'fr' : lang;
  const question = typeof item.question === 'string' ? item.question : '';
  const image = typeof item.image === 'string' ? item.image : '';

  return (
    <div className="panel question calcul">
      {question ? (
        <>
          <div className="question-head">
            <p className="question-prompt notice-question">
              <Syllabified text={frenchTypography(question)} />
            </p>
            <SpeakButton text={frenchTypography(question)} label="Question" />
          </div>
          <div className="notice">
            {image && (
              <span className="notice-picto" aria-hidden="true">
                {image}
              </span>
            )}
            <ul className="notice-text" role="list" lang={langAttr(lang)}>
              {prompt.split('\n').map((line, i) => (
                <li key={i} className="notice-line">
                  {/* Un document en français est le texte à lire : il se découpe en syllabes, comme une consigne. */}
                  {lang === 'fr' ? <Syllabified text={frenchTypography(line)} /> : <RichText text={line} lang={lang} />}
                </li>
              ))}
            </ul>
            <SpeakButton text={spoken} label="Écouter" lang={lang} />
          </div>
        </>
      ) : (
        <div className="question-head">
          <p className="question-prompt calcul-prompt" lang={langAttr(lang)}>
            <RichText text={prompt} lang={lang} />
          </p>
          <SpeakButton text={spoken} label="Écouter" lang={lang} />
        </div>
      )}
      {figure && <div className="calcul-figure">{<Aid aid={figure} />}</div>}
      {aid && (
        <div className="aid calcul-aid">
          <Aid aid={aid} lang={lang} />
        </div>
      )}
      <div className={`choices${choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
        {choices.map((choice) => {
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          const button = (
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
          // Une question mêlée en anglais (GD-10) : chaque réponse s'écoute à part, à côté de son bouton, sans le toucher.
          return listenToChoices && choicesLang !== 'fr' ? (
            <div key={choice} className="choice-listen">
              {button}
              <SpeakButton text={choice} label="Écouter la réponse" compact lang={choicesLang} />
            </div>
          ) : (
            button
          );
        })}
      </div>
      {hint && !answered && (
        <div className="calcul-help">
          {hintShown ? (
            <p className="calcul-hint" role="status">
              <Icon name="lightbulb" /> <Marked text={hint} /> <SpeakButton text={hint} compact />
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

/** L'écran des questions mêlées (blocs assemblés, grands projets) : le même, chaque réponse en anglais s'écoute à part. */
export function AssemblyScreen(props: ScreenProps) {
  return <CalculationScreen {...props} listenToChoices />;
}
