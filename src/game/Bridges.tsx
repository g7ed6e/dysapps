import { useEffect, useRef, useState } from 'react';
import { thePlace } from './world/placeArticle';
import { Icon, IconButton } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, blockCount, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { Foldable } from './IslandFold';
import { playDone, playNope } from './sound';
import { CONDITION_OF, KIND_NAME, buildableBridges, conditionMet, conditionText, isBiomeUnlocked, linkKind, opensAnIsland, otherEnd, payableBlocks, reachableIslands, type BridgeDef, type BridgeKind } from './world/archipelago';
import { noDirectLinkHint, ouvrageName, ouvragesParSuggestion } from './world/goals';

interface Props {
  island: BiomeId;
  /** Ouvrage construit : l'île d'en face s'ouvre (la caméra y vole, la créature accueille). */
  onBuilt?: (to: BiomeId) => void;
  /** L'ouvrage touché dans le monde : on le fait voir en premier. */
  highlight?: string | null;
  /** Dans le panneau 3D : la section se replie quand aucun ouvrage n'est constructible (la clé change avec l'île). */
  fold?: string;
  /**
   * L'ouvrage du prochain objectif de l'île (`nextGoalInfo`, `Goal.ouvrage`) : le seul dont « Poser » est le bouton
   * principal ; `null` : l'objectif n'est pas un ouvrage (la Nef), aucun ne l'est. Sans objectif (une île
   * fermée), le suggéré de ceux qu'on peut faire (`ouvragesParSuggestion`), comme le choisirait l'objectif.
   */
  objectif?: string | null;
}

/** « le pont », « le bac », « le sentier ». */
export function withArticle(kind: BridgeKind): string {
  const name = KIND_NAME[kind].toLowerCase();
  return /^[aeiouy]/.test(name) ? `l’${name}` : `le ${name}`;
}

/**
 * Construire un ouvrage depuis une île ouverte qu'il touche : les blocs payés, le son, l'île d'en face ouverte
 * (`onBuilt`), et la phrase qui le dit (ou ce qui manque), lue si la lecture est automatique. Le pli Ouvrages et la
 * fiche d'un ouvrage (lot 2 de « Toucher le monde »).
 */
export function useConstruireUnOuvrage(island: BiomeId, onBuilt?: (to: BiomeId) => void) {
  const { state, buildBridge } = useBlocland();
  const { settings, speak } = useSettings();
  const [said, setSaid] = useState<string | null>(null);
  // Le message d'un ouvrage construit ne suit pas sur une autre île.
  useEffect(() => setSaid(null), [island]);
  /**
   * Poser une liaison. La phrase nomme l'île d'arrivée : celle qu'elle ouvre, ou, pour un raccourci, l'autre île que
   * celle du panneau ; jamais l'île de départ.
   */
  const build = (b: BridgeDef) => {
    const links = state.world.links;
    const kind = linkKind(b, links);
    const open = reachableIslands(links);
    const ouvre = opensAnIsland(b, open);
    const arrivee = ouvre ? (open.has(b.from) ? b.to : b.from) : otherEnd(b, island);
    const name = thePlace(getBiome(arrivee)?.name ?? arrivee);
    const r = buildBridge(b.id);
    let text: string;
    const what = withArticle(kind);
    if (r.ok) {
      const used = Object.entries(r.used)
        .map(([id, n]) => blockCount(id as keyof typeof BLOCKS, n))
        .join(', ');
      const built = kind === 'pont' || kind === 'bac' ? 'posé' : kind === 'tunnel' ? 'percé' : kind === 'sentier' ? 'tracé' : 'taillé';
      text = `${what.charAt(0).toUpperCase()}${what.slice(1)} vers ${name} est ${built} ! Il t’a coûté ${used}.${ouvre ? ' L’île est ouverte.' : ''}`;
      if (settings.sounds) playDone();
      onBuilt?.(arrivee);
    } else if (r.reason === 'blocs') {
      text = `Il manque encore ${r.missing} bloc${(r.missing ?? 0) > 1 ? 's' : ''}. Fais une mission pour en gagner.`;
      if (settings.sounds) playNope();
    } else if (r.reason === 'plan') {
      text = conditionText(b, state.world.links) ?? 'Il reste une étape avant de construire.';
      if (settings.sounds) playNope();
    } else text = `${what.charAt(0).toUpperCase()}${what.slice(1)} ne peut pas être posé pour l’instant.`;
    setSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };
  return { said, build };
}

/**
 * Les liaisons que l'on peut poser depuis (ou vers) une île : un pont, un bac, ou un sentier entre deux lieux réunis
 * (GD-9). Chacune coûte le même prix dans sa région, en blocs de n'importe quel type gagné sur une île ; aucune
 * n'attend un Gardien vaincu (GD-7) ni un plan terminé (GD-9). Un seul bouton par liaison : « Poser » en bouton
 * principal pour celle du prochain objectif de l'île, en bouton secondaire pour les autres ; ce qui manque est dit
 * clairement. Vers un lieu fermé, le pli s'appelle « Relier » et liste les départs possibles.
 */
export function Bridges({ island, onBuilt, highlight = null, fold, objectif }: Props) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const { said, build } = useConstruireUnOuvrage(island, onBuilt);
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
  // Un lieu fermé (GD-9, « Relier ») : ses départs possibles, le lieu relié le plus proche d'abord.
  const ferme = !isBiomeUnlocked(island, state.world.links);
  if (!bridges.length && !said) {
    if (!ferme) return null;
    return (
      <section className="bridges" aria-label="Relier">
        <p className="bridges-have">
          <Syllabified text={noDirectLinkHint(island, state.world.links)} />
        </p>
      </section>
    );
  }

  const heading = (
    <h3 id={`ponts-${island}`} className="island-sheet-heading">
      <Icon name="ouvrage" /> {ferme ? 'Relier' : 'Ouvrages'}
    </h3>
  );
  const readyOnes = bridges.filter((b) => have >= b.cost && conditionMet(b, state.world.links, world));
  // Un seul bouton principal : l'ouvrage du prochain objectif (même règle que `nextGoalInfo` sans objectif donné).
  const possibles = bridges.filter((b) => conditionMet(b, state.world.links, world));
  // Vers un lieu fermé, le principal est le départ le plus proche (le premier de `buildableBridges`).
  const principal = objectif !== undefined ? objectif : ferme ? (possibles[0]?.id ?? null) : (ouvragesParSuggestion(state, possibles, island)[0]?.id ?? null);
  // L'ouvrage que le pli replié nomme, avec les mots de la Carte : le principal ; sans lui (l'objectif est le navire), le
  // premier dans l'ordre de la suggestion.
  const enTete = bridges.find((b) => b.id === principal) ?? (ferme ? bridges[0] : ouvragesParSuggestion(state, possibles.length ? possibles : bridges, island)[0]);
  const manque = enTete ? enTete.cost - have : 0;
  const status = readyOnes.length
    ? `${readyOnes.length} possible${readyOnes.length > 1 ? 's' : ''} · tu as ${have} bloc${have > 1 ? 's' : ''}`
    : enTete && manque > 0
      ? `Encore ${manque} bloc${manque > 1 ? 's' : ''} pour ${ouvrageName(linkKind(enTete, state.world.links), getBiome(otherEnd(enTete, island))?.name ?? '')}`
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
        {bridges.length > 0 &&
          (ferme ? (
            // Vers une île fermée (GD-9, piste A) : les blocs en poche en signes, sans phrase ; le plus proche en premier.
            <p className="bridges-have">
              <span className="visually-hidden">{`Tu as ${have} bloc${have > 1 ? 's' : ''}.`}</span>
              <span className="signe" aria-hidden="true">
                <Icon name="cube" /> <strong>{have}</strong>
              </span>
            </p>
          ) : (
            <p className="bridges-have">
              Tu as <strong>{have}</strong> bloc{have > 1 ? 's' : ''}.
            </p>
          ))}
        <ul ref={list} className="island-actions bridges-list" aria-label={ferme ? 'Départs de l’ouvrage' : 'Ouvrages à poser'}>
          {liste.map((b) => {
            const other = getBiome(otherEnd(b, island))!;
            const enough = have >= b.cost;
            const met = conditionMet(b, state.world.links, world);
            const ready = enough && met;
            const kind = linkKind(b, state.world.links);
            const condition = CONDITION_OF[kind];
            const title = `${KIND_NAME[kind]} ${ferme ? 'depuis' : 'vers'} ${thePlace(other.name)}`;
            // Pas encore possible : une ligne compacte qui dit ce qu'il manque, sans bouton grisé.
            if (!ready)
              return (
                <li
                  key={b.id}
                  data-bridge={b.id}
                  className={`island-quest locked bridge-item bridge-compact bridge-${kind}${highlight === b.id ? ' bridge-highlight' : ''}`}
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
            // Vers une île fermée : l'ouvrage, le nom du départ et son coût en signes ; « Poser » écrit sur le plus proche
            // seulement, le marteau seul sur les autres (son mot dessous en grand texte).
            if (ferme)
              return (
                <li key={b.id} data-bridge={b.id} className={`island-quest bridge-item bridge-${kind}${highlight === b.id ? ' bridge-highlight' : ''}`}>
                  <span className="island-quest-icon bridge-icon">
                    <Icon name="ouvrage" />
                  </span>
                  <span className="island-quest-text">
                    <span className="visually-hidden">{`${title}, ${b.cost} blocs`}</span>
                    <span aria-hidden="true">
                      <span className="island-quest-title">{other.name}</span>
                      <span className="island-quest-desc signe">
                        <Icon name="cube" /> {b.cost}
                      </span>
                    </span>
                  </span>
                  {b.id === principal ? (
                    <button type="button" className="button primary" onClick={() => build(b)}>
                      <Icon name="hammer" /> Poser
                    </button>
                  ) : (
                    <IconButton icone="hammer" nom={`Poser depuis ${thePlace(other.name)}`} mot="Poser" onClick={() => build(b)} />
                  )}
                </li>
              );
            return (
              <li key={b.id} data-bridge={b.id} className={`island-quest bridge-item bridge-${kind}${highlight === b.id ? ' bridge-highlight' : ''}`}>
                <span className="island-quest-icon bridge-icon">
                  <Icon name={condition === 'plan' ? 'hammer' : 'blocks'} />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{title}</span>
                  <span className="island-quest-desc">{b.cost} blocs</span>
                </span>
                <button type="button" className={b.id === principal ? 'button primary' : 'button'} onClick={() => build(b)}>
                  <Icon name="hammer" /> Poser
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
