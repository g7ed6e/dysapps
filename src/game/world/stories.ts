// Les quêtes des habitants (GD-10, mot neutre `story`) : une petite histoire de trois ou quatre étapes qui passe d'un
// habitant à l'autre. Chaque étape est un geste qui existe déjà : réussir une mission d'un lieu (`mission`), donner des
// blocs du stock à un habitant (`give`), lui apporter l'objet d'un toucher (`bring`). La dernière étape se fait d'un
// toucher et pose l'objet chez l'habitant qui le reçoit (une petite construction, ./fixtures.ts), avec de l'XP. Code pur,
// sans React ni coordonnées du monde.
//
// Les quêtes et leurs phrases viennent de docs/contenu/quetes.md, que `npm run contenu` écrit dans stories.json. Les
// règles (GD-10) :
// - une quête ouverte au plus par région, en plus des commandes ; la suivante, dans l'ordre du fichier, arrive quand la
//   précédente est finie ;
// - elle arrive aux mêmes moments qu'une commande (fin d'une mission, ouvrage construit, livraison, étape faite), quand
//   la région a son premier ouvrage payé (`seuilAtteint`) et que tous les lieux de ses étapes sont ouverts ;
// - rien ne se perd, rien ne presse : ni délai, ni échec ; aucune quête n'ouvre ni ne ferme rien.
//
// La sauvegarde : `world.stories`, facultatif, les quêtes ouvertes et leur étape. Une quête finie en sort ; ce qui la dit
// finie, ce sont les cases de son objet dans `world.parts`, sans champ nouveau (comme une commande livrée).
import { frenchTypography } from '../../core/typography';
import { blockCount, type BiomeId, type BlockId } from '../biomes';
import type { GameState, World } from '../engine/state';
import { archipelagoOf, isBiomeUnlocked, type ArchipelagoId } from './archipelago';
import { casesDeLaPetiteConstruction, estPosee } from './fixtures';
import { sansCommandes, seuilAtteint } from './requests';
import STORIES_JSON from './stories.json';

/** Une étape : un lieu, un geste, une phrase courte qui nomme l'habitant. */
export type StoryStep =
  | { kind: 'mission'; place: BiomeId; text: string }
  | { kind: 'bring'; place: BiomeId; text: string }
  | { kind: 'give'; place: BiomeId; text: string; block: BlockId; count: number };

export interface Story {
  /** `story-<classe>-<n>`, qui ne change jamais. */
  id: string;
  region: ArchipelagoId;
  /** L'objet, avec son article (« la lanterne »). */
  name: string;
  /** Le bloc dont l'image montre l'objet (son signe). */
  item: BlockId;
  /** La petite construction posée à la fin (`<lieu>-fixture-<n>`), chez l'habitant de la dernière étape. */
  fixture: string;
  steps: readonly StoryStep[];
  /** La phrase de la fin (« Lanterne posée chez Mousso ! »). */
  done: string;
  /**
   * Le grand projet que la quête montre une fois finie (la dernière de sa région, à partir de la 5e) : son grand ouvrage
   * (`landmark-5e-1`), et le bouton qui y mène (« Voir le phare »). Le projet n'est jamais exigé.
   */
  project?: string;
  see?: string;
}

/** Une quête ouverte : son identifiant et l'étape en cours (à partir de 0). */
interface OpenStory {
  id: string;
  step: number;
}

/** L'XP d'une quête finie (GD-10), sans succès ni coffre. */
export const STORY_XP = 50;

/** Toutes les quêtes, dans l'ordre de docs/contenu/quetes.md. */
export const STORIES: readonly Story[] = STORIES_JSON as Story[];

export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}

/** Le lieu où se pose l'objet d'une quête : celui de sa dernière étape. */
export const storyPlace = (s: Story): BiomeId => s.steps[s.steps.length - 1].place;

/** La quête est finie : son objet est posé. */
export const isStoryDone = (world: Pick<World, 'parts'>, s: Story): boolean => estPosee(world.parts, s.fixture);

/** Les quêtes ouvertes, dans l'ordre d'arrivée. */
const openStories = (world: Pick<World, 'stories'>): readonly OpenStory[] => world.stories ?? [];

/** La quête ouverte d'une région, avec son étape en cours, ou `null`. */
export function openStoryOf(world: Pick<World, 'stories'>, region: ArchipelagoId): { story: Story; step: StoryStep; index: number } | null {
  for (const o of openStories(world)) {
    const story = getStory(o.id);
    if (story && story.region === region && story.steps[o.step]) return { story, step: story.steps[o.step], index: o.step };
  }
  return null;
}

/** L'étape en cours peut-elle se faire d'un toucher maintenant (`bring`, ou `give` avec assez de blocs) ? */
export function canTapStep(state: Pick<GameState, 'stock'>, step: StoryStep): boolean {
  if (step.kind === 'bring') return true;
  if (step.kind === 'give') return (state.stock[step.block] ?? 0) >= step.count;
  return false;
}

/** La quête peut-elle arriver : pas encore ouverte ni finie, les précédentes de sa région finies, ses lieux ouverts. */
function canStart(state: Pick<GameState, 'world'>, s: Story): boolean {
  const { world } = state;
  if (isStoryDone(world, s) || openStories(world).some((o) => o.id === s.id)) return false;
  const before = STORIES.slice(0, STORIES.indexOf(s)).filter((x) => x.region === s.region);
  if (!before.every((x) => isStoryDone(world, x))) return false;
  return s.steps.every((e) => isBiomeUnlocked(e.place, world.links));
}

const withStories = <S extends Pick<GameState, 'world'>>(state: S, stories: OpenStory[]): S => {
  const { stories: _before, ...world } = state.world;
  void _before;
  return { ...state, world: { ...world, ...(stories.length ? { stories } : {}) } };
};

/**
 * Aux moments où une commande peut arriver, dans la région `region` : sans quête ouverte et le seuil atteint, la
 * première quête qui peut arriver s'ouvre à sa première étape. `started` : la quête ouverte, sinon `null`.
 */
export function startStory<S extends Pick<GameState, 'progress' | 'world'>>(state: S, region: ArchipelagoId): { state: S; started: Story | null } {
  if (openStoryOf(state.world, region) || !seuilAtteint(state, region)) return { state, started: null };
  const next = STORIES.find((s) => s.region === region && canStart(state, s));
  if (!next) return { state, started: null };
  return { state: withStories(state, [...openStories(state.world), { id: next.id, step: 0 }]), started: next };
}

/** Le résultat d'une étape faite : la quête finie (son objet posé), sinon `null`. */
export type StepResult<S> = { ok: true; state: S; story: Story; finished: boolean } | { ok: false; state: S };

/** Passe à l'étape suivante ; à la dernière, l'objet se pose (toutes ses cases dans `world.parts`) et la quête sort. */
function advance<S extends Pick<GameState, 'world'>>(state: S, story: Story): { state: S; finished: boolean } {
  const open = openStories(state.world);
  const current = open.find((o) => o.id === story.id)!;
  if (current.step + 1 < story.steps.length)
    return { state: withStories(state, open.map((o) => (o.id === story.id ? { ...o, step: o.step + 1 } : o))), finished: false };
  const cells = casesDeLaPetiteConstruction(story.fixture) ?? [];
  const done = withStories(state, open.filter((o) => o.id !== story.id));
  return { state: { ...done, world: { ...done.world, parts: { ...done.world.parts, [story.fixture]: cells.map((c) => c.key) } } }, finished: true };
}

/** Une mission du lieu `place` terminée : l'étape `mission` en cours chez lui est faite. */
export function storyAfterMission<S extends Pick<GameState, 'world'>>(state: S, place: BiomeId): S {
  const open = openStoryOf(state.world, archipelagoOf(place).classe);
  if (!open || open.step.kind !== 'mission' || open.step.place !== place) return state;
  return advance(state, open.story).state;
}

/** Le toucher d'une étape `give` ou `bring` de la quête `id` : les blocs donnés sortent du stock. */
export function tapStoryStep<S extends Pick<GameState, 'stock' | 'world'>>(state: S, id: string): StepResult<S> {
  const story = getStory(id);
  const open = story ? openStoryOf(state.world, story.region) : null;
  if (!story || !open || open.story.id !== id || !canTapStep(state, open.step)) return { ok: false, state };
  const paid = open.step.kind === 'give' ? { ...state, stock: { ...state.stock, [open.step.block]: (state.stock[open.step.block] ?? 0) - open.step.count } } : state;
  const r = advance(paid, story);
  return { ok: true, state: r.state, story, finished: r.finished };
}

/** La phrase d'une étape, son jeton `{objet}` remplacé par les blocs donnés (« 2 blocs de bois »). */
export function stepText(step: StoryStep): string {
  return frenchTypography(step.kind === 'give' ? step.text.replaceAll('{objet}', blockCount(step.block, step.count)) : step.text);
}

/**
 * Le jeu sans les quêtes : pour un univers qui ne les montre pas (sans `quetes` dans ses textes), ni liste, ni signe,
 * ni objet dessiné. La sauvegarde, elle, ne change pas.
 */
export function withoutStories<S extends Pick<GameState, 'world'>>(state: S): S {
  const fixtures = new Set(STORIES.map((s) => s.fixture));
  if (state.world.stories === undefined && !Object.keys(state.world.parts).some((id) => fixtures.has(id))) return state;
  const cleared = withStories(state, []);
  return { ...cleared, world: { ...cleared.world, parts: Object.fromEntries(Object.entries(cleared.world.parts).filter(([id]) => !fixtures.has(id))) } };
}

/** Le jeu tel qu'un univers le montre : sans les commandes ni les quêtes qu'il ne montre pas (`commandes`, `quetes`). */
export function gameAsShown<S extends Pick<GameState, 'world'>>(state: S, textes: { commandes?: unknown; quetes?: unknown }): S {
  const avecCommandes = textes.commandes ? state : sansCommandes(state);
  return textes.quetes ? avecCommandes : withoutStories(avecCommandes);
}
