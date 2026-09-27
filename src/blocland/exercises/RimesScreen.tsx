import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import type { ScreenProps } from './registry';
import { CARD_CLASS, cardState, sortSummary } from './sortCards';

/**
 * Rimes-échelle : un mot repère, 4 mots avec pictogramme ; l'élève tape ceux qui riment, puis valide.
 * Champs de l'item : word, correct, image, ending (la fin entendue, pour la correction).
 * Le mot repère est le `target` de l'exercice.
 */
export function RimesScreen({ items, answered, onAnswer, target }: ScreenProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const model = target ?? '';

  const toggle = (key: string) => {
    if (answered) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const validate = () => {
    const results = items.map((it) => ({ key: it.key, correct: picked.has(it.key) === Boolean(it.correct) }));
    const firstWrong = items.find((_, i) => !results[i].correct);
    // La correction nomme toutes les erreurs : les mots qui riment oubliés et chaque intrus touché.
    const summary = sortSummary(
      items,
      picked,
      {
        missed: (words) => `Tu as oublié ${words} : ça rime aussi avec ${model}.`,
        intruder: (word, ending) => `${word} finit par ${ending} : ça ne rime pas avec ${model}.`,
      },
      (it) => String(it.ending),
    );
    onAnswer({
      results,
      detail: firstWrong ? { word: firstWrong.word, ending: firstWrong.ending, missed: !picked.has(firstWrong.key), summary } : {},
    });
  };

  return (
    <div className="panel question">
      <div className="question-head">
        <p className="question-prompt sound-target">
          Rime avec <strong>{model}</strong>
        </p>
        <SpeakButton text={model} label="Écouter" />
      </div>
      <ul className="word-cards" aria-label="Mots à trier">
        {items.map((it) => {
          const word = String(it.word);
          const on = picked.has(it.key);
          const state = answered ? cardState(it, on) : null;
          return (
            <li key={it.key}>
              <button
                type="button"
                className={`word-card${on ? ' picked' : ''}${state ? CARD_CLASS[state] : ''}`}
                aria-pressed={on}
                disabled={Boolean(answered)}
                onClick={() => toggle(it.key)}
              >
                <span className="word-picto" aria-hidden="true">
                  {String(it.image ?? '')}
                </span>
                <span className="word-text">
                  <Syllabified text={word} />
                </span>
                {state === 'found' && <Icon name="check" className="word-mark" />}
                {state === 'missed' && <span className="word-note">oublié</span>}
                {state === 'intruder' && <span className="word-note">ne rime pas</span>}
              </button>
              <SpeakButton text={word} label="Écouter" compact />
            </li>
          );
        })}
      </ul>
      {!answered && (
        <button type="button" className="button primary validate-button" onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
    </div>
  );
}
