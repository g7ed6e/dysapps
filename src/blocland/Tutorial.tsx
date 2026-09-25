import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';

const STORAGE_KEY = 'tutos';

interface Seen {
  [id: string]: boolean;
}

export function hasSeenTutorial(id: string): boolean {
  return Boolean(loadJSON<Seen>(STORAGE_KEY, {})[id]);
}

export function markTutorialSeen(id: string, seen = true): void {
  saveJSON(STORAGE_KEY, { ...loadJSON<Seen>(STORAGE_KEY, {}), [id]: seen });
}

interface Props {
  /** Identifiant du tutoriel (mémorisé sur l'appareil : on ne le montre qu'une fois). */
  id: string;
  /** Trois bulles au plus : une idée par bulle, lue à voix haute. */
  steps: string[];
  /** Forcer l'affichage (bouton « Revoir l'aide »). */
  replay?: number;
}

/** Tutoriel d'entrée : quelques bulles courtes, une à la fois, lues à voix haute, à voir une seule fois. */
export function Tutorial({ id, steps, replay = 0 }: Props) {
  const { settings, speak } = useSettings();
  const [open, setOpen] = useState(() => !hasSeenTutorial(id));
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (replay > 0) {
      setStep(0);
      setOpen(true);
    }
  }, [replay]);

  const text = steps[step];
  useEffect(() => {
    if (open && settings.autoRead && text) speak(frenchTypography(text));
    // Relu à chaque nouvelle bulle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  if (!open || !text) return null;
  const last = step >= steps.length - 1;
  const close = () => {
    markTutorialSeen(id);
    setOpen(false);
  };
  return (
    <section className="panel tutorial" role="dialog" aria-labelledby={`tuto-${id}`} aria-live="polite">
      <p id={`tuto-${id}`} className="tutorial-step">
        <span className="tutorial-count" aria-hidden="true">
          {step + 1}/{steps.length}
        </span>
        <Syllabified text={text} />
      </p>
      <div className="tutorial-actions">
        <SpeakButton text={text} />
        {last ? (
          <button type="button" className="button primary" onClick={close}>
            <Icon name="check" /> J’ai compris
          </button>
        ) : (
          <button type="button" className="button primary" onClick={() => setStep((s) => s + 1)}>
            Suivant <Icon name="play" />
          </button>
        )}
        {!last && (
          <button type="button" className="button" onClick={close}>
            Passer
          </button>
        )}
      </div>
    </section>
  );
}
