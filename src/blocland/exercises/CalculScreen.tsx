import { createElement, useState } from 'react';
import { Icon } from '../../components/Icon';
import { RichText } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { AID_COMPONENTS, type AidData } from './maths';
import type { ScreenProps } from './registry';

/** Redessine une aide visuelle décrite en données. */
export function Aid({ aid }: { aid: AidData }) {
  const component = AID_COMPONENTS[aid.kind];
  return component ? createElement(component as (p: Record<string, unknown>) => ReturnType<typeof createElement>, aid.props) : null;
}

/**
 * Écran « calcul » : une seule opération, le nombre lu à voix haute, l'aide visuelle toujours affichée
 * (grille de points, boîte de dix, droite par bonds…), des réponses rangées dans l'ordre croissant,
 * un indice sur demande. Champs de l'item : prompt, spoken, choices, answer, hint, explanation, aid, figure.
 */
export function CalculScreen({ items, answered, onAnswer, onHelp }: ScreenProps) {
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

  return (
    <div className="panel question calcul">
      <div className="question-head">
        <p className="question-prompt calcul-prompt">
          <RichText text={prompt} />
        </p>
        <SpeakButton text={spoken} label="Écouter" />
      </div>
      {figure && <div className="calcul-figure">{<Aid aid={figure} />}</div>}
      {aid && (
        <div className="aid calcul-aid">
          <Aid aid={aid} />
        </div>
      )}
      <div className="choices short" role="group" aria-label="Réponses possibles">
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
