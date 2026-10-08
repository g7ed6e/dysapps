// Les quêtes des habitants (GD-10) : l'arrivée (une par région, après le premier ouvrage), les trois sortes d'étapes,
// l'objet posé à la fin, la suggestion, le signe de l'habitant et la sauvegarde.
import { BLOC, getBiome, missionsJouables, type BiomeId } from '../biomes';
import { exercisesOf } from '../exercises';
import { sanitizeState, type GameState } from '../engine';
import { textesDe } from '../../universes';
import { NOMS_ARCHIPELS } from './archipelago';
import { nextDestination as nextDestinationDe } from './destination';
import { casesDeLaPetiteConstruction } from './fixtures';
import { signesDesCreatures } from '../reminders';
import {
  STORIES,
  canTapStep,
  gameAsShown,
  getStory,
  isStoryDone,
  openStoryOf,
  startStory,
  stepText,
  storyAfterMission,
  storyPlace,
  tapStoryStep,
  withoutStories,
} from './stories';

const mots = textesDe('blocland').libelles;
const nextDestination = (state: GameState) => nextDestinationDe(state, NOMS_ARCHIPELS, mots);

const joue = (...iles: BiomeId[]) =>
  Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));

const FORET = 'french-6e-phonology';
const PLAINE = 'maths-6e-calculation';
const PONT_FERME = 'french-6e-phonology-french-6e-grammar-spelling';
const LANTERNE = 'story-6e-1';
const etat = (raw: Record<string, unknown>) => sanitizeState(raw);

describe('le contenu', () => {
  it('trois quêtes en 6e, chacune avec son objet posé chez l’habitant de sa dernière étape', () => {
    expect(STORIES.filter((s) => s.region === '6e').map((s) => s.id)).toEqual(['story-6e-1', 'story-6e-2', 'story-6e-3']);
    for (const s of STORIES) {
      expect(s.fixture.startsWith(`${storyPlace(s)}-fixture-`)).toBe(true);
      expect(casesDeLaPetiteConstruction(s.fixture)?.length).toBeGreaterThan(0);
      expect(s.steps[s.steps.length - 1].kind).not.toBe('mission');
    }
  });
  it('la phrase d’une étape « donner » dit les blocs donnés', () => {
    expect(stepText(getStory(LANTERNE)!.steps[1])).toBe('Donne 2 blocs de bois à Coco.');
  });
});

describe('l’arrivée', () => {
  it('attend le premier ouvrage de la région, comme une commande', () => {
    const sans = etat({ progress: joue(FORET, PLAINE), world: { links: [] } });
    expect(startStory(sans, '6e').started).toBeNull();
    const avec = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME] } });
    const r = startStory(avec, '6e');
    expect(r.started?.id).toBe(LANTERNE);
    expect(r.state.world.stories).toEqual([{ id: LANTERNE, step: 0 }]);
  });
  it('une seule quête ouverte par région', () => {
    const ouverte = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME], stories: [{ id: LANTERNE, step: 0 }] } });
    expect(startStory(ouverte, '6e').started).toBeNull();
  });
  it('la suivante arrive une fois la précédente finie, si tous ses lieux sont ouverts', () => {
    const lanterne = getStory(LANTERNE)!;
    const parts = { [lanterne.fixture]: casesDeLaPetiteConstruction(lanterne.fixture)!.map((c) => c.key) };
    const finie = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME], parts } });
    expect(isStoryDone(finie.world, lanterne)).toBe(true);
    // Le portillon passe chez Rouxel : il attend que son lieu soit ouvert.
    expect(startStory(finie, '6e').started).toBeNull();
    const portillon = getStory('story-6e-2')!;
    const links = [PONT_FERME, 'maths-6e-calculation-french-6e-word-spelling'];
    expect(portillon.steps.map((e) => e.place)).toContain('french-6e-word-spelling');
    expect(startStory({ ...finie, world: { ...finie.world, links } }, '6e').started?.id).toBe('story-6e-2');
  });
});

describe('les étapes', () => {
  const ouverte = (stock: Partial<Record<string, number>>, step = 0) =>
    etat({ progress: joue(FORET, PLAINE), stock, world: { links: [PONT_FERME], stories: [{ id: LANTERNE, step }] } });

  it('une mission réussie chez l’habitant de l’étape la fait passer, pas ailleurs', () => {
    const s = ouverte({});
    expect(storyAfterMission(s, FORET)).toBe(s);
    expect(storyAfterMission(s, PLAINE).world.stories).toEqual([{ id: LANTERNE, step: 1 }]);
  });
  it('« donner » attend assez de blocs et les prend au stock', () => {
    const peu = ouverte({ [BLOC.bois]: 1 }, 1);
    expect(canTapStep(peu, openStoryOf(peu.world, '6e')!.step)).toBe(false);
    expect(tapStoryStep(peu, LANTERNE).ok).toBe(false);
    const assez = ouverte({ [BLOC.bois]: 3 }, 1);
    const r = tapStoryStep(assez, LANTERNE);
    expect(r.ok && r.finished).toBe(false);
    expect(r.state.stock[BLOC.bois]).toBe(1);
    expect(r.state.world.stories).toEqual([{ id: LANTERNE, step: 2 }]);
  });
  it('la dernière étape pose l’objet chez l’habitant et ferme la quête', () => {
    const s = ouverte({}, 2);
    const r = tapStoryStep(s, LANTERNE);
    expect(r.ok && r.finished).toBe(true);
    expect(r.state.world.stories).toBeUndefined();
    expect(isStoryDone(r.state.world, getStory(LANTERNE)!)).toBe(true);
    // Rien n'arrive deux fois.
    expect(tapStoryStep(r.state, LANTERNE).ok).toBe(false);
  });
});

describe('la suggestion et le signe', () => {
  it('une étape faisable d’un toucher devient la prochaine destination, chez son habitant', () => {
    const s = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME], stories: [{ id: LANTERNE, step: 2 }] } });
    const d = nextDestination(s);
    expect(d.story).toBe(LANTERNE);
    expect(d.island).toBe(FORET);
  });
  it('le signe de l’habitant de l’étape suggérée est l’objet de la quête', () => {
    const s = etat({ progress: joue(FORET, PLAINE), world: { links: [PONT_FERME], stories: [{ id: LANTERNE, step: 2 }] } });
    const signe = signesDesCreatures(s, '6e', [], undefined, LANTERNE).find((x) => x.id === FORET);
    expect(signe).toBeDefined();
  });
});

describe('la sauvegarde', () => {
  it('ne garde que les quêtes connues, pas finies, à une étape valide, une par région', () => {
    const lanterne = getStory(LANTERNE)!;
    const s = etat({
      world: {
        links: [],
        stories: [{ id: 'inconnue', step: 0 }, { id: LANTERNE, step: 9 }, { id: LANTERNE, step: 1 }, { id: 'story-6e-2', step: 0 }],
      },
    });
    expect(s.world.stories).toEqual([{ id: LANTERNE, step: 1 }]);
    const finie = etat({ world: { links: [], parts: { [lanterne.fixture]: casesDeLaPetiteConstruction(lanterne.fixture)!.map((c) => c.key) }, stories: [{ id: LANTERNE, step: 1 }] } });
    expect(finie.world.stories).toBeUndefined();
  });
  it('un univers sans quêtes ne les montre pas, la sauvegarde restant la même', () => {
    const s = etat({ world: { links: [], stories: [{ id: LANTERNE, step: 1 }] } });
    expect(withoutStories(s).world.stories).toBeUndefined();
    expect(gameAsShown(s, { commandes: {}, quetes: {} })).toBe(s);
    expect(s.world.stories).toEqual([{ id: LANTERNE, step: 1 }]);
  });
});
