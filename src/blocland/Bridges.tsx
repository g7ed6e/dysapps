import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { playDone, playNope } from './sound';
import { CONDITION_OF, KIND_NAME, buildableBridges, conditionMet, conditionText, otherEnd, payableBlocks, type BridgeDef } from './world/archipelago';

interface Props {
  island: BiomeId;
}

/** « le pont », « l'escalier taillé »… */
function withArticle(kind: BridgeDef['kind']): string {
  const name = KIND_NAME[kind].toLowerCase();
  return /^[aeiouy]/.test(name) ? `l’${name}` : `le ${name}`;
}

/**
 * Les ouvrages que l'on peut construire depuis (ou vers) une île : un pont, un bac, un escalier taillé, un tunnel,
 * un col. Chacun coûte quelques blocs, de n'importe quel type gagné sur une île ; l'escalier demande aussi un plan
 * terminé, le tunnel et le col un Gardien vaincu. Un seul bouton par ouvrage ; ce qui manque est dit clairement.
 */
export function Bridges({ island }: Props) {
  const { state, buildBridge } = useBlocland();
  const { settings, speak } = useSettings();
  const [said, setSaid] = useState<string | null>(null);
  // Le message d'un ouvrage construit ne suit pas sur une autre île.
  useEffect(() => setSaid(null), [island]);
  const world = { progress: state.progress, plans: state.village.plans };
  const bridges = buildableBridges(state.village.bridges, island, world);
  const have = payableBlocks(state.inventory);
  if (!bridges.length && !said) return null;

  const build = (b: BridgeDef, name: string) => {
    const r = buildBridge(b.id);
    let text: string;
    const what = withArticle(b.kind);
    if (r.ok) {
      const used = Object.entries(r.used)
        .map(([id, n]) => `${n} ${BLOCKS[id as keyof typeof BLOCKS].name.toLowerCase()}`)
        .join(', ');
      const built = b.kind === 'pont' || b.kind === 'bac' ? 'construit' : b.kind === 'tunnel' ? 'percé' : 'taillé';
      text = `${what.charAt(0).toUpperCase()}${what.slice(1)} vers ${name} est ${built} ! Il t’a coûté ${used}. L’île est ouverte.`;
      if (settings.sounds) playDone();
    } else if (r.reason === 'blocs') {
      text = `Il manque encore ${r.missing} bloc${(r.missing ?? 0) > 1 ? 's' : ''}. Fais une quête pour en gagner.`;
      if (settings.sounds) playNope();
    } else if (r.reason === 'plan' || r.reason === 'gardien') {
      text = conditionText(b, state.village.bridges) ?? 'Il reste une étape avant de construire.';
      if (settings.sounds) playNope();
    } else text = `${what.charAt(0).toUpperCase()}${what.slice(1)} ne peut pas être construit pour l’instant.`;
    setSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  return (
    <section className="bridges" aria-labelledby={`ponts-${island}`}>
      <h3 id={`ponts-${island}`} className="island-sheet-heading">
        <Icon name="map" /> Ouvrages
      </h3>
      {bridges.length > 0 && (
        <p className="bridges-have">
          Tu as <strong>{have}</strong> bloc{have > 1 ? 's' : ''} pour construire. Un ouvrage ouvre l’île d’en face.
        </p>
      )}
      <ul className="island-actions bridges-list" aria-label="Ouvrages à construire">
        {bridges.map((b) => {
          const other = getBiome(otherEnd(b, island))!;
          const enough = have >= b.cost;
          const met = conditionMet(b, state.village.bridges, world);
          const ready = enough && met;
          const condition = CONDITION_OF[b.kind];
          const title = `${KIND_NAME[b.kind]} vers ${other.name}`;
          // Pas encore possible : une ligne compacte qui dit ce qu'il manque, sans bouton grisé.
          if (!ready)
            return (
              <li key={b.id} className={`island-quest locked bridge-item bridge-compact bridge-${b.kind}`} aria-disabled="true">
                <span className="island-quest-icon bridge-icon">
                  <Icon name={condition === 'gardien' ? 'shield' : condition === 'plan' ? 'hammer' : 'blocks'} />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{title}</span>
                  <span className="island-quest-desc">
                    {!enough && `Encore ${b.cost - have} bloc${b.cost - have > 1 ? 's' : ''} (${b.cost} en tout)`}
                    {!enough && !met && ' · '}
                    {!met && conditionText(b, state.village.bridges)}
                  </span>
                </span>
              </li>
            );
          return (
            <li key={b.id} className={`island-quest bridge-item bridge-${b.kind}`}>
              <span className="island-quest-icon bridge-icon">
                <Icon name={condition === 'gardien' ? 'shield' : condition === 'plan' ? 'hammer' : 'blocks'} />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{title}</span>
                <span className="island-quest-desc">{b.cost} blocs</span>
              </span>
              <button type="button" className="button primary" onClick={() => build(b, other.name)}>
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
