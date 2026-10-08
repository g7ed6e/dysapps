// Les quêtes des habitants à l'écran (GD-10) : la ligne de la quête de la région, en tête de la section des commandes
// (panneau de l'île, menu, vue simple), et le geste d'une étape faite d'un toucher, partagé avec la fiche de la créature.
// Peu de texte (mainteneur, 8 octobre 2026) : l'image de l'objet et une pastille par étape (lu « Étape 2 sur 3 »), la
// phrase courte de l'étape, et une seule action.
import { useEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { BIOMES, BLOCKS, getBiome, type BiomeId } from './biomes';
import { Creature } from './Creatures';
import { playDone } from './sound';
import { BlockIcon } from './Voxel';
import { useTextes } from '../universes';
import type { PetiteConstructionAPoser } from './world/placedFixtures';
import { canTapStep, stepText, storyPlace, type StepResult, type Story, type StoryStep } from './world/stories';
import { lienDeLaDestination } from './world/destination';
import { isBiomeUnlocked } from './world/archipelago';
import { nextPiece, projectOf } from './world/projects';
import { frenchTypography } from '../core/typography';
import type { GameState } from './engine';

/** Ce que dit le signe d'une quête, lu à la voix : « Entraide : la lanterne. Étape 2 sur 3. » */
export function storyBadgeReading(mots: { titre: string; etape: (n: number, total: number) => string }, story: Story, index: number): string {
  return `${mots.titre} : ${story.name}. ${mots.etape(index + 1, story.steps.length)}.`;
}

/**
 * Le signe d'une quête : l'image de l'objet, puis une pastille par étape, pleine pour une étape faite, cerclée pour
 * l'étape en cours (jamais « 2/3 », qui se lirait comme une fraction : référent dys). Lu « Entraide : la lanterne.
 * Étape 2 sur 3. »
 */
export function StoryBadge({ story, index }: { story: Story; index: number }) {
  const mots = useTextes().quetes;
  const bloc = BLOCKS[story.item];
  return (
    <span className="quete-signe" aria-label={mots ? storyBadgeReading(mots, story, index) : ''} role="img">
      <BlockIcon top={bloc.top} side={bloc.side} size={24} />
      <span className="quete-etapes" aria-hidden="true">
        {story.steps.map((_, k) => (
          <span key={k} className={`quete-etape${k < index ? ' faite' : k === index ? ' en-cours' : ''}`} />
        ))}
      </span>
    </span>
  );
}

/**
 * Le toucher d'une étape (« Donner », « Apporter ») : l'étape faite, et, à la dernière, l'objet posé par la scène
 * (`onLivree`, qui rend `true` si elle prend le son), sinon le carillon tout de suite. Rend la phrase à dire ensuite :
 * celle de la fin, ou celle de l'étape suivante ; `null` si rien n'a pu se faire.
 */
export function tapTheStep(
  story: Story,
  { tapStory, onLivree, sons }: { tapStory: (id: string) => StepResult<GameState>; onLivree?: (c: PetiteConstructionAPoser) => boolean; sons: boolean },
): { text: string; finished: boolean } | null {
  const r = tapStory(story.id);
  if (!r.ok) return null;
  if (r.finished) {
    const sonPris = onLivree?.({ id: story.id, biome: storyPlace(story), fixture: story.fixture }) ?? false;
    if (sons && !sonPris) playDone();
    return { text: frenchTypography(story.done), finished: true };
  }
  if (sons) playDone();
  const next = r.state.world.stories?.find((o) => o.id === story.id);
  return { text: next ? stepText(story.steps[next.step]) : frenchTypography(story.done), finished: false };
}

/** Le bouton d'une étape faite d'un toucher : « Donner » ou « Apporter ». */
export function StepButton({ step, onClick }: { step: StoryStep; onClick: () => void }) {
  const mots = useTextes().quetes;
  if (!mots || step.kind === 'mission') return null;
  return (
    <button type="button" className="button primary" onClick={onClick}>
      <Icon name="hammer" /> {step.kind === 'give' ? mots.donner : mots.apporter}
    </button>
  );
}

/**
 * La phrase d'une étape, avec ce que l'élève a déjà pour une étape « donner » pas encore faisable (« Tu en as 1 sur 2. »),
 * comme une commande.
 */
export function stepSentence(state: Pick<GameState, 'stock'>, step: StoryStep, tuEnAs?: (have: number, count: number) => string): string {
  const phrase = stepText(step);
  if (step.kind !== 'give' || !tuEnAs) return phrase;
  const have = state.stock[step.block] ?? 0;
  return have > 0 && have < step.count ? `${phrase} ${frenchTypography(tuEnAs(have, step.count))}` : phrase;
}

/**
 * Où mène « Y aller » pour une étape qui ne se fait pas encore d'un toucher : une étape « donner » sans assez de blocs,
 * l'île qui les donne si elle est ouverte (comme une commande) ; sinon l'île de l'habitant de l'étape.
 */
function stepDestination(state: Pick<GameState, 'stock' | 'world'>, step: StoryStep): BiomeId {
  if (step.kind !== 'give' || canTapStep(state, step)) return step.place;
  const donne = BIOMES.find((b) => b.block === step.block)?.id;
  return donne && isBiomeUnlocked(donne, state.world.links) ? donne : step.place;
}

interface LineProps {
  story: Story;
  index: number;
  state: Pick<GameState, 'stock' | 'world'>;
  /** L'île du panneau : le toucher de l'étape s'y fait si l'étape est chez son habitant. */
  island?: BiomeId;
  highlight?: boolean;
  /** La quête finie ici : la phrase de la fin (vide pendant la pose de l'objet), à la place de l'étape. */
  said: string | null;
  /** Une étape vient d'être faite ici : la phrase de la suivante est annoncée, et prend le focus. */
  announced?: boolean;
  onTap: () => void;
  onAller?: (island: BiomeId, story?: string) => void;
  /** Déjà sur l'île où se fait l'étape (une mission, ou gagner les blocs) : « Y aller » mène aux missions de l'île. */
  onMissionsHere?: () => void;
  /** « Tu y es : joue une mission ici. », écrit sur la ligne après « Y aller » sur place. */
  hereSaid?: string | null;
}

/** La ligne de la quête de la région : l'habitant de l'étape, l'objet et ses étapes, la phrase, une seule action. */
export function StoryLine({ story, index, state, island, highlight = false, said, announced = false, onTap, onAller, onMissionsHere, hereSaid = null }: LineProps) {
  const mots = useTextes().commandes;
  const step = story.steps[index];
  const fini = said !== null;
  const phrase = said ?? stepSentence(state, step, mots?.tuEnAs);
  const tap = !fini && island === step.place && canTapStep(state, step);
  const dest = stepDestination(state, step);
  const surPlace = !fini && !tap && island === dest;
  const lu = hereSaid && surPlace ? `${phrase} ${hereSaid}` : phrase;
  // Finie, la dernière quête de la région montre son projet, tant qu'il reste une pièce à poser (GD-10).
  const projet = fini && story.project ? projectOf(story.project) : undefined;
  const voir = projet && story.see && nextPiece(state, projet) !== null ? story.see : null;
  const desc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (announced || fini) desc.current?.focus();
  }, [announced, fini, index]);
  const to = lienDeLaDestination({ island: dest, ...(dest === step.place && step.kind !== 'mission' ? { story: story.id } : {}) });
  const aller = (e: MouseEvent) => {
    if (!onAller) return;
    e.preventDefault();
    onAller(dest, dest === step.place && step.kind !== 'mission' ? story.id : undefined);
  };
  return (
    <li data-commande={story.id} className={`island-quest bridge-item commande-item quete-item${fini ? ' commande-livree' : highlight ? ' bridge-highlight' : ''}`}>
      <span className="island-quest-icon commande-habitant">
        <Creature biome={step.place} label={getBiome(step.place)?.creature.name ?? ''} className="creature-small" />
      </span>
      <span className="island-quest-text">
        <span className="island-quest-title">
          <StoryBadge story={story} index={fini ? story.steps.length : index} />
        </span>
        <span
          ref={desc}
          tabIndex={-1}
          className={`island-quest-desc${fini ? ' commande-posee' : ''}`}
          role={fini || announced ? 'status' : undefined}
          aria-live={fini || announced ? 'polite' : undefined}
        >
          {phrase && <Syllabified text={phrase} />}
          {hereSaid && surPlace && (
            <span className="commande-ici">
              {' '}
              <Syllabified text={hereSaid} />
            </span>
          )}
        </span>
      </span>
      {lu && <SpeakButton text={lu} compact />}
      {tap ? (
        <StepButton step={step} onClick={onTap} />
      ) : fini ? (
        voir && (
          <Link to={`/adventure/${story.project}`} className="button">
            <Icon name="castle" /> {voir}
          </Link>
        )
      ) : surPlace ? (
        onMissionsHere && (
          <button type="button" className="button" onClick={onMissionsHere}>
            <Icon name="play" /> Y aller
          </button>
        )
      ) : (
        <Link to={to} className="button" onClick={aller}>
          <Icon name="play" /> Y aller
        </Link>
      )}
    </li>
  );
}
