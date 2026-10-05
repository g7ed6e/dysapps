import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { VEHICLE_STAGES } from './vehicle';
import { worksiteFor } from './worksite';
import { BLOC } from '../biomes';

const [coque] = VEHICLE_STAGES;

it('le bilan ne renvoie jamais au bâtiment de l’île, qui se pose tout seul (GD-6) : d’abord l’ouvrage qui en part', () => {
  const some = sanitizeState({ stock: { [BLOC.bois]: 2 }, world: { place: 'french-6e-phonology' } });
  expect(worksiteFor(some, 'french-6e-phonology', BLOC.bois)).toMatchObject({
    kind: 'ouvrage',
    text: 'Le pont vers Mine des lettres : 2 blocs sur 4.',
    have: 2,
    need: 4,
    ready: false,
  });
  const rich = sanitizeState({ stock: { [BLOC.bois]: 12 }, world: { place: 'french-6e-phonology' } });
  expect(worksiteFor(rich, 'french-6e-phonology', BLOC.bois)).toMatchObject({ text: 'Le pont vers Mine des lettres : tu peux le construire !', ready: true });
});

it('le bâtiment fini ou non, le bilan parle de l’ouvrage le moins cher qui en part', () => {
  const plans = Object.fromEntries(plansFor('french-6e-phonology').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ stock: { [BLOC.bois]: 2 }, world: { place: 'french-6e-phonology', parts: plans } });
  expect(worksiteFor(state, 'french-6e-phonology', BLOC.bois)).toMatchObject({
    kind: 'ouvrage',
    text: 'Le pont vers Mine des lettres : 2 blocs sur 4.',
    to: '/adventure/french-6e-phonology?worksite=french-6e-phonology-french-6e-letter-confusion',
  });
  const five = sanitizeState({ stock: { [BLOC.bois]: 5 }, world: { place: 'french-6e-phonology', parts: plans } });
  expect(worksiteFor(five, 'french-6e-phonology', BLOC.bois).text).toBe('Le pont vers Mine des lettres : tu peux le construire !');
});

it('sur le port, les blocs servent le Bloc-Navire', () => {
  const plans = Object.fromEntries(plansFor('maths-6e-calculation').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ stock: { [BLOC.sable]: 4 }, world: { place: 'maths-6e-calculation', parts: plans, links: ['maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals'] } });
  const site = worksiteFor(state, 'maths-6e-calculation', BLOC.sable);
  expect(site).toMatchObject({ kind: 'navire', to: '/adventure/maths-6e-calculation?worksite=vehicle' });
  expect(site.text).toMatch(/^Le Bloc-Navire, la coque et la voile : \d+ blocs sur les \d+ qui manquent\.$/);
  expect(coque.biome).toBe('maths-6e-calculation');
});

it('un bloc qui ne sert à rien aujourd’hui est dit tel quel', () => {
  // La Forêt toute construite, ses ouvrages aussi : son bois n'a plus de chantier sur l'île.
  const plans = Object.fromEntries(plansFor('french-6e-phonology').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ stock: { [BLOC.lanterne]: 3 }, world: { place: 'french-6e-phonology', parts: plans, links: ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar'] } });
  const site = worksiteFor(state, 'french-6e-phonology', BLOC.lanterne);
  expect(['aucun', 'monument']).toContain(site.kind);
  if (site.kind === 'aucun') expect(site.text).toBe('Aucun chantier n’attend tes blocs de lanterne pour l’instant : ils restent dans Mes blocs.');
  expect(site.to).toMatch(/^\/adventure\//);
});
