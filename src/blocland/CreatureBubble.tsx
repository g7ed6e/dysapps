import { useEffect } from 'react';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { Creature } from './Creatures';
import type { BiomeDef } from './biomes';

interface Props {
  biome: BiomeDef;
  text: string;
  /** Lit le message à l'arrivée si la lecture automatique est activée (une seule consigne à la fois). */
  autoSpeak?: boolean;
}

/** La créature du biome parle : une bulle courte, lue à voix haute, relançable au haut-parleur. */
export function CreatureBubble({ biome, text, autoSpeak = true }: Props) {
  const { settings, speak } = useSettings();
  const spoken = frenchTypography(text);

  useEffect(() => {
    if (autoSpeak && settings.autoRead) speak(spoken);
    // Relu seulement quand le message change.
  }, [spoken]);

  return (
    <div className="creature-bubble">
      <Creature biome={biome.id} label={`${biome.creature.name}, ${biome.creature.species}`} className="creature-large" />
      <div className="creature-says" role="status" aria-live="polite">
        <p className="creature-name">{biome.creature.name}</p>
        <p className="creature-text">
          <Syllabified text={spoken} />
        </p>
        <SpeakButton text={spoken} label="Réécouter" />
      </div>
    </div>
  );
}
