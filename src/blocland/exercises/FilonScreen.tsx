import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useSettings } from '../../core/SettingsContext';
import type { ScreenProps } from './registry';

/** Durée de passage d'un bloc, en secondes, selon le niveau (la vitesse ne monte qu'après 90 % de réussite). */
const DURATIONS = [8, 6, 4.5, 3.5, 3];

/**
 * Filon : un bloc-lettre traverse la galerie ; piocher seulement la lettre cible.
 * Laisser passer une autre lettre est juste. Avec « réduire les animations », le bloc attend.
 * Champs de l'item : letter, correct, tip (repère pour la correction), et `target` quand la lettre à piocher change à chaque bloc.
 */
export function FilonScreen({ items, answered, onAnswer, level, target }: ScreenProps) {
  const item = items[0];
  const { settings } = useSettings();
  const [slow, setSlow] = useState(false);
  const timer = useRef<number | null>(null);
  const done = useRef(false);
  const duration = DURATIONS[Math.min(DURATIONS.length - 1, Math.max(0, level - 1))] * (slow ? 1.5 : 1);
  const moving = !settings.reduceMotion;

  const decide = (mined: boolean) => {
    if (done.current) return;
    done.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    onAnswer({ results: [{ key: item.key, correct: mined === Boolean(item.correct) }], detail: { mined, letter: item.letter, target: wanted } });
  };

  // Le bloc sort de la galerie sans être pioché : c'est « laisser passer ».
  useEffect(() => {
    if (!moving || answered) return;
    timer.current = window.setTimeout(() => decide(false), duration * 1000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.key, duration, moving]);

  const letter = String(item.letter);
  const wanted = String(item.target ?? target);
  const state = answered ? (answered.results[0].correct ? 'right' : 'wrong') : '';

  return (
    <div className="panel question filon">
      <p className="question-prompt">
        Pioche seulement la lettre <strong className="filon-target">{wanted}</strong>
      </p>
      <div className="filon-lane" style={{ ['--filon-duration' as string]: `${duration}s` }}>
        <button
          type="button"
          className={`filon-block${moving && !answered ? ' moving' : ''}${state ? ` ${state}` : ''}`}
          aria-label={`Bloc avec la lettre ${letter}. Piocher`}
          disabled={Boolean(answered)}
          onClick={() => decide(true)}
        >
          {letter}
        </button>
      </div>
      {!answered && (
        <div className="filon-controls">
          <button type="button" className="button" onClick={() => decide(false)}>
            Laisser passer <Icon name="play" />
          </button>
          {moving && (
            <label className="toggle">
              <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
              Plus lent
            </label>
          )}
        </div>
      )}
    </div>
  );
}
