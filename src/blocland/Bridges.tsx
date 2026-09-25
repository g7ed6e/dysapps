import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { playDone, playNope } from './sound';
import { buildableBridges, otherEnd, payableBlocks } from './world/archipelago';

interface Props {
  island: BiomeId;
}

/**
 * Les ponts que l'on peut construire depuis (ou vers) une île : un pont coûte quelques blocs, de n'importe quel
 * type gagné sur une île. Un seul bouton par pont ; ce qui manque est dit clairement, sans pénalité.
 */
export function Bridges({ island }: Props) {
  const { state, buildBridge } = useBlocland();
  const { settings, speak } = useSettings();
  const [said, setSaid] = useState<string | null>(null);
  const bridges = buildableBridges(state.village.bridges, island);
  const have = payableBlocks(state.inventory);
  if (!bridges.length && !said) return null;

  const build = (id: string, name: string) => {
    const r = buildBridge(id);
    let text: string;
    if (r.ok) {
      const used = Object.entries(r.used)
        .map(([b, n]) => `${n} ${BLOCKS[b as keyof typeof BLOCKS].name.toLowerCase()}`)
        .join(', ');
      text = `Le pont vers ${name} est construit ! Il t’a coûté ${used}. L’île est ouverte.`;
      if (settings.sounds) playDone();
    } else if (r.reason === 'blocs') {
      text = `Il manque encore ${r.missing} bloc${(r.missing ?? 0) > 1 ? 's' : ''}. Fais une quête pour en gagner.`;
      if (settings.sounds) playNope();
    } else text = 'Ce pont ne peut pas être construit pour l’instant.';
    setSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  return (
    <section className="bridges" aria-labelledby={`ponts-${island}`}>
      <h3 id={`ponts-${island}`} className="island-sheet-heading">
        <Icon name="map" /> Ponts
      </h3>
      {bridges.length > 0 && (
        <p className="bridges-have">
          Tu as <strong>{have}</strong> bloc{have > 1 ? 's' : ''} pour construire.
        </p>
      )}
      <ul className="island-actions bridges-list" aria-label="Ponts à construire">
        {bridges.map((b) => {
          const other = getBiome(otherEnd(b, island))!;
          const enough = have >= b.cost;
          return (
            <li key={b.id} className="island-quest bridge-item">
              <span className="island-quest-icon bridge-icon">
                <Icon name="blocks" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">Pont vers {other.name}</span>
                <span className="island-quest-desc">
                  {b.cost} blocs{enough ? '' : ` · il en manque ${b.cost - have}`}
                </span>
              </span>
              <button type="button" className={`button${enough ? ' primary' : ''}`} disabled={!enough} onClick={() => build(b.id, other.name)}>
                <Icon name="hammer" /> Construire
              </button>
            </li>
          );
        })}
      </ul>
      {said && (
        <p className="bridges-said" role="status" aria-live="polite">
          <Syllabified text={said} />
        </p>
      )}
    </section>
  );
}
