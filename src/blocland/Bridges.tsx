import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, blockCount, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { Foldable } from './IslandFold';
import { playDone, playNope } from './sound';
import { CONDITION_OF, KIND_NAME, buildableBridges, conditionMet, conditionText, otherEnd, payableBlocks, type BridgeDef } from './world/archipelago';
import { ouvrageName, ouvragesParSuggestion } from './world/goals';

interface Props {
  island: BiomeId;
  /** Ouvrage construit : l'île d'en face s'ouvre (la caméra y vole, la créature accueille). */
  onBuilt?: (to: BiomeId) => void;
  /** L'ouvrage touché dans le monde : on le fait voir en premier. */
  highlight?: string | null;
  /** Dans le panneau 3D : la section se replie quand aucun ouvrage n'est constructible (la clé change avec l'île). */
  fold?: string;
  /**
   * L'ouvrage du prochain objectif de l'île (`nextGoalInfo`, `Goal.ouvrage`) : le seul dont « Construire » est le bouton
   * principal ; `null` : l'objectif n'est pas un ouvrage (le Bloc-Navire), aucun ne l'est. Sans objectif (une île
   * fermée), le suggéré de ceux qu'on peut faire (`ouvragesParSuggestion`), comme le choisirait l'objectif.
   */
  objectif?: string | null;
}

/** « le pont », « l'escalier taillé »… */
function withArticle(kind: BridgeDef['kind']): string {
  const name = KIND_NAME[kind].toLowerCase();
  return /^[aeiouy]/.test(name) ? `l’${name}` : `le ${name}`;
}

/**
 * Les ouvrages que l'on peut construire depuis (ou vers) une île : un pont, un bac, un escalier taillé, un tunnel,
 * un col. Chacun coûte quelques blocs, de n'importe quel type gagné sur une île ; l'escalier demande aussi un plan
 * terminé, et plus aucun ouvrage n'attend un Gardien vaincu (GD-7). Un seul bouton par ouvrage : « Construire » en
 * bouton principal pour l'ouvrage du prochain objectif de l'île, en bouton secondaire pour les autres ; ce qui manque
 * est dit clairement.
 */
export function Bridges({ island, onBuilt, highlight = null, fold, objectif }: Props) {
  const { state, buildBridge } = useBlocland();
  const { settings, speak } = useSettings();
  const [said, setSaid] = useState<string | null>(null);
  // Le message d'un ouvrage construit ne suit pas sur une autre île.
  useEffect(() => setSaid(null), [island]);
  // L'ouvrage touché dans le monde : on amène sa proposition sous les yeux.
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!highlight) return;
    // Par `dataset`, jamais dans un sélecteur : `highlight` vient de l'adresse (`?worksite=`).
    const el = [...(list.current?.querySelectorAll<HTMLElement>('[data-bridge]') ?? [])].find((e) => e.dataset.bridge === highlight);
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, island]);
  const world = { progress: state.progress, plans: state.world.parts };
  const bridges = buildableBridges(state.world.links, island, world, settings.lv2);
  const have = payableBlocks(state.stock);
  if (!bridges.length && !said) return null;

  const build = (b: BridgeDef, name: string) => {
    const r = buildBridge(b.id);
    let text: string;
    const what = withArticle(b.kind);
    if (r.ok) {
      const used = Object.entries(r.used)
        .map(([id, n]) => blockCount(id as keyof typeof BLOCKS, n))
        .join(', ');
      const built = b.kind === 'pont' || b.kind === 'bac' ? 'construit' : b.kind === 'tunnel' ? 'percé' : b.kind === 'sentier' ? 'tracé' : 'taillé';
      text = `${what.charAt(0).toUpperCase()}${what.slice(1)} vers ${name} est ${built} ! Il t’a coûté ${used}. L’île est ouverte.`;
      if (settings.sounds) playDone();
      onBuilt?.(otherEnd(b, island));
    } else if (r.reason === 'blocs') {
      text = `Il manque encore ${r.missing} bloc${(r.missing ?? 0) > 1 ? 's' : ''}. Fais une mission pour en gagner.`;
      if (settings.sounds) playNope();
    } else if (r.reason === 'plan') {
      text = conditionText(b, state.world.links) ?? 'Il reste une étape avant de construire.';
      if (settings.sounds) playNope();
    } else text = `${what.charAt(0).toUpperCase()}${what.slice(1)} ne peut pas être construit pour l’instant.`;
    setSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  const heading = (
    <h3 id={`ponts-${island}`} className="island-sheet-heading">
      <Icon name="ouvrage" /> Ouvrages
    </h3>
  );
  const readyOnes = bridges.filter((b) => have >= b.cost && conditionMet(b, state.world.links, world));
  // Un seul bouton principal : l'ouvrage du prochain objectif (même règle que `nextGoalInfo` sans objectif donné).
  const possibles = bridges.filter((b) => conditionMet(b, state.world.links, world));
  const principal = objectif !== undefined ? objectif : (ouvragesParSuggestion(state, possibles, island)[0]?.id ?? null);
  // L'ouvrage que le pli replié nomme, avec les mots de la Carte : le principal ; sans lui (l'objectif est le navire), le
  // premier dans l'ordre de la suggestion.
  const enTete = bridges.find((b) => b.id === principal) ?? ouvragesParSuggestion(state, possibles.length ? possibles : bridges, island)[0];
  const manque = enTete ? enTete.cost - have : 0;
  const status = readyOnes.length
    ? `${readyOnes.length} possible${readyOnes.length > 1 ? 's' : ''} · tu as ${have} bloc${have > 1 ? 's' : ''}`
    : enTete && manque > 0
      ? `Encore ${manque} bloc${manque > 1 ? 's' : ''} pour ${ouvrageName(enTete.kind, getBiome(otherEnd(enTete, island))?.name ?? '')}`
      : enTete
        ? (conditionText(enTete, state.world.links) ?? '')
        : '';
  // L'ouvrage suggéré en tête de la liste ; les autres gardent l'ordre fixe des ouvrages.
  const liste = enTete ? [enTete, ...bridges.filter((b) => b !== enTete)] : bridges;
  // Ouvert quand un ouvrage est constructible, vient d'être touché dans le monde, ou vient d'être construit.
  const defaultOpen = readyOnes.length > 0 || bridges.some((b) => b.id === highlight) || said !== null;
  return (
    <Foldable fold={fold} name="ouvrages" heading={heading} status={status} defaultOpen={defaultOpen}>
      <section className="bridges" aria-labelledby={`ponts-${island}`}>
        {bridges.length > 0 && (
          <p className="bridges-have">
            Tu as <strong>{have}</strong> bloc{have > 1 ? 's' : ''} pour construire. Un ouvrage ouvre l’île d’en face.
          </p>
        )}
        <ul ref={list} className="island-actions bridges-list" aria-label="Ouvrages à construire">
          {liste.map((b) => {
            const other = getBiome(otherEnd(b, island))!;
            const enough = have >= b.cost;
            const met = conditionMet(b, state.world.links, world);
            const ready = enough && met;
            const condition = CONDITION_OF[b.kind];
            const title = `${KIND_NAME[b.kind]} vers ${other.name}`;
            // Pas encore possible : une ligne compacte qui dit ce qu'il manque, sans bouton grisé.
            if (!ready)
              return (
                <li
                  key={b.id}
                  data-bridge={b.id}
                  className={`island-quest locked bridge-item bridge-compact bridge-${b.kind}${highlight === b.id ? ' bridge-highlight' : ''}`}
                  aria-disabled="true"
                >
                  <span className="island-quest-icon bridge-icon">
                    <Icon name={condition === 'plan' ? 'hammer' : 'blocks'} />
                  </span>
                  <span className="island-quest-text">
                    <span className="island-quest-title">{title}</span>
                    <span className="island-quest-desc">
                      {!enough && `Encore ${b.cost - have} bloc${b.cost - have > 1 ? 's' : ''} (${b.cost} en tout)`}
                      {!enough && !met && ' · '}
                      {!met && conditionText(b, state.world.links)}
                    </span>
                  </span>
                </li>
              );
            return (
              <li key={b.id} data-bridge={b.id} className={`island-quest bridge-item bridge-${b.kind}${highlight === b.id ? ' bridge-highlight' : ''}`}>
                <span className="island-quest-icon bridge-icon">
                  <Icon name={condition === 'plan' ? 'hammer' : 'blocks'} />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{title}</span>
                  <span className="island-quest-desc">{b.cost} blocs</span>
                </span>
                <button type="button" className={b.id === principal ? 'button primary' : 'button'} onClick={() => build(b, other.name)}>
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
    </Foldable>
  );
}
