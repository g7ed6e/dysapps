import { useEffect } from 'react';
import { useSettings } from '../core/SettingsContext';
import { SpeakButton } from './SpeakButton';
import { frenchTypography } from './math/RichText';

export type FeedbackTone = 'info' | 'bien' | 'rate' | 'indice';

interface Props {
  /** Onomatopée affichée en grand (« BIEN VU ! »). Optionnelle. */
  shout?: string;
  message: string;
  tone?: FeedbackTone;
  /** Lit automatiquement le message si la lecture automatique est activée. */
  autoSpeak?: boolean;
  /** À changer pour relire un message identique (ex. une nouvelle question). */
  speakKey?: string | number;
  /** Version compacte sur une ligne (bandeau de résultat). */
  compact?: boolean;
}

/** Bulle de BD qui annonce le résultat, les combos et les indices. */
export function Feedback({ shout, message, tone = 'info', autoSpeak = true, speakKey, compact = false }: Props) {
  const { settings, speak } = useSettings();
  const text = shout ? `${shout} ${message}` : message;

  useEffect(() => {
    if (autoSpeak && settings.autoRead) speak(text);
    // On ne relit que lorsqu'un nouveau message arrive.
  }, [text, speakKey]);

  return (
    <div className={`feedback feedback-${tone}${compact ? ' feedback-compact' : ''}`} role="status" aria-live="polite">
      {shout && (
        <p className="feedback-shout" key={speakKey}>
          {shout}
        </p>
      )}
      <div className="feedback-body">
        <p>{frenchTypography(message)}</p>
        <SpeakButton text={text} compact />
      </div>
    </div>
  );
}
