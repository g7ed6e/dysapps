import { BLOC, getBiome, missionsJouables, type BiomeId } from '../biomes';
import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { NOMS_ARCHIPELS } from './archipelago';
import { textesDe } from '../../universes';
import { laDestinationEstLeNavire, nextDestination as nextDestinationDe } from './destination';
import { nextGoalInfo } from './goals';
import { VEHICLE_STAGES } from './vehicle';

const mots = textesDe('blocland').libelles;
type Etat = Parameters<typeof nextDestinationDe>[0];
const nextDestination = (state: Etat) => nextDestinationDe(state, NOMS_ARCHIPELS, mots);

/** Les `n` premières missions d'une île, jouées une fois (toutes, sans `n`). */
const joue = (ile: BiomeId, n?: number) =>
  Object.fromEntries(
    missionsJouables(getBiome(ile)!)
      .slice(0, n)
      .map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }]),
  );

it('au début, la destination est l’île du bonhomme, à explorer', () => {
  expect(nextDestination(sanitizeState({}))).toMatchObject({ island: 'french-6e-phonology', name: 'Forêt des sons', text: 'Une île à explorer : ses missions t’attendent.' });
});

it('l’île où l’élève est allé passe devant tant qu’il y reste une mission jamais jouée ou un objectif prêt', () => {
  // Une mission jouée sur la Forêt : il en reste, la Forêt reste la destination (la Plaine attend, jamais jouée).
  const foret = sanitizeState({ progress: joue('french-6e-phonology', 1), world: { place: 'french-6e-phonology', links: [] } });
  expect(nextDestination(foret)).toMatchObject({ island: 'french-6e-phonology', text: 'Tu y es : d’autres missions t’attendent.' });
  // Assez de blocs pour un ouvrage qui part de la Forêt : on peut le construire tout de suite.
  const riche = sanitizeState({ progress: joue('french-6e-phonology', 1), stock: { [BLOC.bois]: 5 }, world: { place: 'french-6e-phonology', links: [] } });
  expect(nextDestination(riche)).toMatchObject({ island: 'french-6e-phonology', text: expect.stringMatching(/^Tu peux poser .*\. Il ouvre une île (de français|de maths|d’anglais)\.$/) });
  // L'objectif prêt est un ouvrage : la destination le désigne aussi.
  expect(nextDestination(riche).ouvrage).toBe(nextGoalInfo(riche, 'french-6e-phonology', NOMS_ARCHIPELS, mots)?.ouvrage);
  expect(nextDestination(riche).ouvrage).toBeTruthy();
  // Une île, sans ouvrage à proposer : pas d'ouvrage.
  expect(nextDestination(foret).ouvrage).toBeUndefined();
  // Toutes les missions de la Forêt jouées, rien de prêt : la Plaine, ouverte et jamais jouée.
  const finie = sanitizeState({ progress: joue('french-6e-phonology'), world: { place: 'french-6e-phonology', links: [] } });
  expect(nextDestination(finie)).toMatchObject({ island: 'maths-6e-calculation', text: 'Une île à explorer : ses missions t’attendent.' });
});

it('ensuite, l’ouvrage qui ouvre une île de la matière la moins jouée, depuis l’île d’où il part, avec sa raison', () => {
  // La Forêt, la Plaine, la Mine et la Rivière jouées en entier ; le bonhomme sur la Forêt. Français : 5 missions sur
  // 5 îles ; maths : 8 sur 3 ; anglais : aucune ; toutes les liaisons coûtent 4 blocs (GD-9).
  const iles: BiomeId[] = ['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion', 'maths-6e-fractions'];
  const progress = Object.assign({}, ...iles.map((id) => joue(id)));
  const world = { place: 'french-6e-phonology', links: ['french-6e-phonology-french-6e-letter-confusion', 'maths-6e-calculation-maths-6e-fractions'] };
  const paye = sanitizeState({ progress, stock: { [BLOC.bois]: 4 }, world });
  expect(nextDestination(paye)).toMatchObject({ island: 'french-6e-phonology', text: 'Tu peux poser le pont vers Baie des mots. Il ouvre une île d’anglais.', have: 4, need: 4 });
  // La destination dit quelle liaison : la flèche de la Carte se pose sur elle, pas sur l'île.
  expect(nextDestination(paye).ouvrage).toBe('french-6e-phonology-english-6e-vocabulary');
  // Le panneau de la Forêt met la même liaison en avant (son seul « Poser » principal).
  expect(nextGoalInfo(paye, 'french-6e-phonology', NOMS_ARCHIPELS, mots)?.ouvrage).toBe('french-6e-phonology-english-6e-vocabulary');
  const pauvre = sanitizeState({ progress, stock: { [BLOC.bois]: 1 }, world });
  // Sans blocs, aucune liaison ne se paie : la suggestion reprend l'ordre des matières (l'anglais, jamais joué).
  expect(nextDestination(pauvre)).toMatchObject({ island: 'french-6e-phonology', text: 'Encore 3 blocs pour le pont vers Baie des mots. Il ouvre une île d’anglais.', have: 1, need: 4, ouvrage: 'french-6e-phonology-english-6e-vocabulary' });
  // La même sauvegarde, la même suggestion : rien ne change tant que l'élève n'a rien fait.
  expect(nextDestination(structuredClone(paye))).toEqual(nextDestination(paye));
});

it('le Bloc-Navire prêt à partir passe devant tout', () => {
  const [coque] = VEHICLE_STAGES;
  const plans = Object.fromEntries(plansFor('maths-6e-calculation').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const hull = { ...plans, [coque.id]: planCells(coque).map((c) => c.key) };
  const gardiens = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  const state = sanitizeState({ progress: { ...gardiens, ...joue('french-6e-phonology', 1) }, world: { place: 'french-6e-phonology', parts: hull, links: ['french-6e-phonology-french-6e-letter-confusion'] } });
  expect(nextDestination(state)).toMatchObject({ island: 'maths-6e-calculation', text: 'Le Bloc-Navire est prêt : embarque vers les Îles Brumeuses !' });
});

it('sans objectif, la destination est le port, avec ce qu’il faut pour le village', () => {
  const plans = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation'].flatMap((b) => plansFor(b as never)).map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ progress: { ...joue('french-6e-phonology', 1), ...joue('maths-6e-calculation', 1) }, world: { place: 'french-6e-phonology', parts: plans, links: ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals'] } });
  expect(nextDestination(state).text).toMatch(/\.$/);
});

it('la destination est le Bloc-Navire quand c’est le port et que sa phrase est l’objectif du navire (« Y aller » ouvre sa fiche)', () => {
  const objectif = (state: Etat) => nextGoalInfo(state, 'maths-6e-calculation', NOMS_ARCHIPELS, mots);
  // Au début : une île à explorer, pas le navire.
  const debut = sanitizeState({});
  expect(laDestinationEstLeNavire(nextDestination(debut), objectif(debut))).toBe(false);
  // Le navire prêt à partir : le port, sa phrase est celle du navire.
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  const pret = sanitizeState({ progress, world: { parts: { [coque.id]: planCells(coque).map((c) => c.key) }, links: ['french-6e-phonology-french-6e-letter-confusion'], place: 'maths-6e-calculation' } });
  const d = nextDestination(pret);
  expect(d.island).toBe('maths-6e-calculation');
  expect(laDestinationEstLeNavire(d, objectif(pret))).toBe(true);
  // Un ouvrage ou une commande n'est jamais le navire.
  expect(laDestinationEstLeNavire({ ...d, ouvrage: 'x' }, objectif(pret))).toBe(false);
  expect(laDestinationEstLeNavire({ ...d, commande: 'x' }, objectif(pret))).toBe(false);
});
