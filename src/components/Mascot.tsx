import { useEffect } from 'react';
import { useSettings } from '../core/SettingsContext';
import { SpeakButton } from './SpeakButton';

export type MascotMood = 'content' | 'reflechit' | 'bravo' | 'encourage';

interface Props {
  message: string;
  mood?: MascotMood;
  /** Lit automatiquement le message si l'élève a activé la lecture automatique. */
  autoSpeak?: boolean;
}

/** Plume, la mascotte chouette qui guide et encourage l'élève. */
export function Mascot({ message, mood = 'content', autoSpeak = true }: Props) {
  const { settings, speak } = useSettings();

  useEffect(() => {
    if (autoSpeak && settings.autoRead) speak(message);
    // On ne relit que si le message change.
  }, [message]);

  return (
    <div className={`mascot mascot-${mood}`}>
      <MascotFace mood={mood} />
      <div className="mascot-bubble" role="status" aria-live="polite">
        <p>{message}</p>
        <SpeakButton text={message} compact />
      </div>
    </div>
  );
}

function MascotFace({ mood }: { mood: MascotMood }) {
  const mouth =
    mood === 'bravo' ? 'M38 64 q12 12 24 0' : mood === 'reflechit' ? 'M40 66 h20' : 'M40 64 q10 7 20 0';
  return (
    <svg className="mascot-face" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M22 30 L30 8 L42 26 Z M78 30 L70 8 L58 26 Z" fill="var(--mascot-ears)" />
      <ellipse cx="50" cy="55" rx="36" ry="38" fill="var(--mascot-body)" />
      <ellipse cx="50" cy="66" rx="20" ry="22" fill="var(--mascot-belly)" />
      <circle cx="36" cy="44" r="12" fill="#fff" />
      <circle cx="64" cy="44" r="12" fill="#fff" />
      <circle cx={mood === 'reflechit' ? 39 : 36} cy={mood === 'reflechit' ? 41 : 45} r="6" fill="#1f2a37" />
      <circle cx={mood === 'reflechit' ? 67 : 64} cy={mood === 'reflechit' ? 41 : 45} r="6" fill="#1f2a37" />
      <path d="M46 52 L50 58 L54 52 Z" fill="#f2a541" />
      <path d={mouth} stroke="#1f2a37" strokeWidth="3" fill="none" strokeLinecap="round" />
      {mood === 'bravo' && <text x="78" y="22" fontSize="18">✨</text>}
    </svg>
  );
}
