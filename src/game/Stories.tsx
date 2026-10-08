// Les quêtes des habitants à l'écran (GD-10) : la ligne de la quête de la région, en tête de la section des commandes
// (panneau de l'île, menu, vue simple), et le geste d'une étape faite d'un toucher, partagé avec la fiche de la créature.
// Peu de texte (mainteneur, 8 octobre 2026) : l'image de l'objet, « 2/3 » (lu « Étape 2 sur 3 »), la phrase courte de
// l'étape, et une seule action.
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, getBiome, type BiomeId } from './biomes';
import { Creature } from './Creatures';
import { playDone } from './sound';
import { BlockIcon } from './Voxel';
import { useTextes } from '../universes';
import type { PetiteConstructionAPoser } from './world/placedFixtures';
import { canTapStep, stepText, storyPlace, type Story, type StoryStep } from './world/stories';
import { lienDeLaDestination } from './world/destination';
import type { GameState } from './engine';

/** L'image de l'objet d'une quête et son étape (« 2/3 »), lue « Étape 2 sur 3 ». */
export function StoryBadge({ story, index }: { story: Story; index: number }) {
  const mots = useTextes().quetes;
  const bloc = BLOCKS[story.item];
  const lu = mots ? `${mots.titre}. ${mots.etape(index + 1, story.steps.length)}.` : '';
  return (
    <span className="quete-signe" aria-label={lu} role="img">
      <BlockIcon top={bloc.top} side={bloc.side} size={24} />
      <span aria-hidden="true">
        {index + 1}/{story.steps.length}
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
  { tapStory, onLivree, sons }: { tapStory: (id: string) => { ok: true; state: GameState; finished: boolean } | { ok: false }; onLivree?: (c: PetiteConstructionAPoser) => boolean; sons: boolean },
): { text: string; finished: boolean } | null {
  const r = tapStory(story.id);
  if (!r.ok) return null;
  if (r.finished) {
    const sonPris = onLivree?.({ id: story.id, biome: storyPlace(story), fixture: story.fixture }) ?? false;
    if (sons && !sonPris) playDone();
    return { text: story.done, finished: true };
  }
  if (sons) playDone();
  const next = r.state.world.stories?.find((o) => o.id === story.id);
  return { text: next ? stepText(story.steps[next.step]) : story.done, finished: false };
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

interface LineProps {
  story: Story;
  index: number;
  state: Pick<GameState, 'stock'>;
  /** L'île du panneau : le toucher de l'étape s'y fait si l'étape est chez son habitant. */
  island?: BiomeId;
  highlight?: boolean;
  /** La quête finie ici : la phrase de la fin (vide pendant la pose de l'objet), à la place de l'étape. */
  said: string | null;
  onTap: () => void;
  onAller?: (island: BiomeId, story?: string) => void;
}

/** La ligne de la quête de la région : l'habitant de l'étape, l'objet et « 2/3 », la phrase, une action. */
export function StoryLine({ story, index, state, island, highlight = false, said, onTap, onAller }: LineProps) {
  const step = story.steps[index];
  const ici = island === step.place;
  const phrase = said ?? stepText(step);
  const fini = said !== null;
  const tap = !fini && ici && canTapStep(state, step);
  const to = lienDeLaDestination({ island: step.place, ...(step.kind === 'mission' ? {} : { story: story.id }) });
  const aller = (e: MouseEvent) => {
    if (!onAller) return;
    e.preventDefault();
    onAller(step.place, step.kind === 'mission' ? undefined : story.id);
  };
  return (
    <li data-commande={story.id} className={`island-quest bridge-item commande-item quete-item${fini ? ' commande-livree' : highlight ? ' bridge-highlight' : ''}`}>
      <span className="island-quest-icon commande-habitant">
        <Creature biome={step.place} label={getBiome(step.place)?.creature.name ?? ''} className="creature-small" />
      </span>
      <span className="island-quest-text">
        <span className="island-quest-title">
          <StoryBadge story={story} index={index} />
        </span>
        <span className={`island-quest-desc${fini ? ' commande-posee' : ''}`} role={fini ? 'status' : undefined} aria-live={fini ? 'polite' : undefined}>
          {phrase && <Syllabified text={phrase} />}
        </span>
      </span>
      {phrase && <SpeakButton text={phrase} compact />}
      {tap ? (
        <StepButton step={step} onClick={onTap} />
      ) : fini || (ici && step.kind === 'mission') ? null : (
        <Link to={to} className="button" onClick={aller}>
          <Icon name="play" /> Y aller
        </Link>
      )}
    </li>
  );
}
