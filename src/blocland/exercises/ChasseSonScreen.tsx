import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import type { ScreenProps } from './registry';
import { CARD_CLASS, cardState, sortSummary } from './sortCards';

/**
 * Chasse au son : 4 mots avec pictogramme, l'élève tape ceux où il entend le son cible, puis valide.
 * Champs de l'item : word, correct, image (pictogramme), heard (son entendu, pour la correction).
 */
export function ChasseSonScreen({ items, answered, onAnswer, target }: ScreenProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

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
    // La correction nomme toutes les erreurs : les bons mots oubliés et chaque intrus touché.
    const summary = sortSummary(
      items,
      picked,
      {
        missed: (words) => `Tu as oublié ${words} : on y entend [${target}].`,
        intruder: (word, heard) => `Dans ${word}, on entend ${heard}, pas [${target}].`,
      },
      (it) => String(it.heard),
    );
    onAnswer({
      results,
      detail: firstWrong ? { word: firstWrong.word, heard: firstWrong.heard, missed: !picked.has(firstWrong.key), summary } : {},
    });
  };

  return (
    <div className="panel question">
      <p className="question-prompt sound-target">
        Le son <strong>[{target}]</strong>
      </p>
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
                {state === 'intruder' && <span className="word-note">pas [{target}]</span>}
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
