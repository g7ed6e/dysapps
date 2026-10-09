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
  /** Le texte affiché, quand le texte lu est écrit pour la voix : c'est lui que le nom accessible reprend. */
  shown?: string;
}

/**
 * Bouton « haut-parleur » qui lit un texte à voix haute. Son nom accessible reprend le texte affiché (`shown`) quand le
 * texte lu est écrit pour la voix (le « lu » d'un mot latin, « rossamm ») : cette écriture ne doit fuir ni vers un
 * lecteur d'écran ou le braille, ni vers le Contrôle vocal (principes dys, « Le latin et le grec »).
 */
export function SpeakButton({ text, label = 'Écouter', compact = false, lang = 'fr', shown }: Props) {
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
      aria-label={speaking ? 'Arrêter la lecture' : `${label} : ${shown ?? text}`}
      aria-pressed={speaking}
    >
      <Icon name={speaking ? 'stop' : 'speaker'} />
      {!compact && <span>{speaking ? 'Stop' : label}</span>}
    </button>
  );
}
