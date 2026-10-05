import { useEffect } from 'react';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { Creature3D } from './Creature3D';
import type { BiomeDef } from './biomes';
import { useTextes } from '../univers';

interface Props {
  biome: BiomeDef;
  text: string;
  /** Lit le message à l'arrivée si la lecture automatique est activée (une seule consigne à la fois). */
  autoSpeak?: boolean;
  /** Ce qui se lit juste après le message, dans la même lecture (la proposition de la créature qui se souvient). */
  ensuite?: string;
}

/** La créature du biome parle : une bulle courte, lue à voix haute, relançable au haut-parleur. */
export function CreatureBubble({ biome, text, autoSpeak = true, ensuite }: Props) {
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const spoken = frenchTypography(text);

  useEffect(() => {
    // Une seule lecture : l'accueil, puis la suite (pas deux voix qui se coupent).
    if (autoSpeak && settings.autoRead) speak(ensuite ? `${spoken} ${ensuite}` : spoken);
    // Relu seulement quand le message change.
  }, [spoken]);

  return (
    <div className="creature-bubble">
      <Creature3D biome={biome.id} label={`${biome.creature.name}, ${textes.especes[biome.id]}`} className="creature-large" />
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
