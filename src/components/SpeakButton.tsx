import { useState } from 'react';
import { useSettings } from '../core/SettingsContext';
import { isSpeechAvailable, type Lang } from '../core/speech';
import { Icon } from './Icon';

interface Props {
  text: string;
  label?: string;
  compact?: boolean;
  /** Langue du texte lu (voix anglaise pour `en`). */
  lang?: Lang;
}

/** Bouton « haut-parleur » qui lit un texte à voix haute. */
export function SpeakButton({ text, label = 'Écouter', compact = false, lang = 'fr' }: Props) {
  const { speak, stop } = useSettings();
  const [speaking, setSpeaking] = useState(false);
  if (!isSpeechAvailable()) return null;

  const onClick = () => {
    if (speaking) {
      stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, () => setSpeaking(false), lang);
  };

  return (
    <button
      type="button"
      className={`speak-button${compact ? ' compact' : ''}`}
      onClick={onClick}
      aria-label={speaking ? 'Arrêter la lecture' : `${label} : ${text}`}
      aria-pressed={speaking}
    >
      <Icon name={speaking ? 'stop' : 'speaker'} />
      {!compact && <span>{speaking ? 'Stop' : label}</span>}
    </button>
  );
}
