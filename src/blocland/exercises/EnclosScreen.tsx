import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import type { ScreenProps } from './registry';

/**
 * Enclos : 4 sujets à ranger dans le bon enclos, singulier ou pluriel ; on choisit la forme du verbe, puis on valide.
 * Champs de l'item : subject, singular (forme du verbe), plural, answer ('singulier' | 'pluriel'), why (la marque du nombre).
 */
export function EnclosScreen({ items, answered, onAnswer }: ScreenProps) {
  const [choice, setChoice] = useState<Record<string, 'singulier' | 'pluriel'>>({});
  const complete = items.every((it) => choice[it.key]);

  const validate = () => {
    const results = items.map((it) => ({ key: it.key, correct: choice[it.key] === it.answer }));
    const firstWrong = items.find((_, i) => !results[i].correct);
    onAnswer({
      results,
      detail: firstWrong
        ? { subject: firstWrong.subject, why: firstWrong.why, verb: firstWrong.answer === 'pluriel' ? firstWrong.plural : firstWrong.singular }
        : {},
    });
  };

  return (
    <div className="panel question">
      <ul className="enclos-list" aria-label="Sujets à ranger">
        {items.map((it) => {
          const subject = String(it.subject);
          const picked = choice[it.key];
          const state = answered ? (picked === it.answer ? 'right' : 'wrong') : '';
          return (
            <li key={it.key} className={`enclos-row${state ? ` ${state}` : ''}`}>
              <span className="enclos-subject">
                <Syllabified text={subject} />
                <SpeakButton text={`${subject} ${picked === 'pluriel' ? String(it.plural) : String(it.singular)}`} label="Écouter" compact />
              </span>
              <span className="enclos-pens" role="group" aria-label={`Verbe pour ${subject}`}>
                {(['singulier', 'pluriel'] as const).map((n) => {
                  const form = String(n === 'pluriel' ? it.plural : it.singular);
                  const on = picked === n;
                  const isAnswer = answered && it.answer === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`choice enclos-pen${on ? ' picked' : ''}${isAnswer ? ' right' : ''}${answered && on && !isAnswer ? ' wrong' : ''}`}
                      aria-pressed={on}
                      disabled={Boolean(answered)}
                      onClick={() => setChoice((c) => ({ ...c, [it.key]: n }))}
                    >
                      {form}
                    </button>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
      {!answered && (
        <button type="button" className="button primary validate-button" disabled={!complete} onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
    </div>
  );
}
