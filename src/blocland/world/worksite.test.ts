import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { VEHICLE_STAGES } from './vehicle';
import { worksiteFor } from './worksite';

const [coque] = VEHICLE_STAGES;

it('le bilan nomme le plan de l’île que servent les blocs, avec sa jauge', () => {
  const cabane = plansFor('foret')[0];
  const need = cabane.cells.length;
  const some = sanitizeState({ inventory: { bois: 12 }, village: { at: 'foret' } });
  expect(worksiteFor(some, 'foret', 'bois')).toMatchObject({
    kind: 'plan',
    text: `La cabane de Mousso, sur Forêt des sons : 12 blocs sur les ${need} qui manquent.`,
    have: 12,
    need,
    ready: false,
    to: '/aventure/foret?chantier=plan',
  });
  const rich = sanitizeState({ inventory: { bois: need }, village: { at: 'foret' } });
  expect(worksiteFor(rich, 'foret', 'bois')).toMatchObject({ text: 'La cabane de Mousso : tu as tous tes blocs. Va les poser !', ready: true });
});

it('sans plan à servir sur l’île, le bilan parle de l’ouvrage le moins cher qui en part', () => {
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ inventory: { bois: 2 }, village: { at: 'foret', plans } });
  expect(worksiteFor(state, 'foret', 'bois')).toMatchObject({
    kind: 'ouvrage',
    text: 'Le sentier vers Mine des lettres : 2 blocs sur 3.',
    to: '/aventure/foret?chantier=foret-mine',
  });
  const five = sanitizeState({ inventory: { bois: 5 }, village: { at: 'foret', plans } });
  expect(worksiteFor(five, 'foret', 'bois').text).toBe('Le sentier vers Mine des lettres : tu peux le construire !');
});

it('sur le port, les blocs servent le Bloc-Navire', () => {
  const plans = Object.fromEntries(plansFor('plaine').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ inventory: { sable: 4 }, village: { at: 'plaine', plans, bridges: ['plaine-riviere', 'plaine-volcan'] } });
  const site = worksiteFor(state, 'plaine', 'sable');
  expect(site).toMatchObject({ kind: 'navire', to: '/aventure/plaine?chantier=navire' });
  expect(site.text).toMatch(/^Le Bloc-Navire, la coque et la voile : \d+ blocs sur les \d+ qui manquent\.$/);
  expect(coque.biome).toBe('plaine');
});

it('un bloc qui ne sert à rien aujourd’hui est dit tel quel', () => {
  // La Forêt toute construite, ses ouvrages aussi : son bois n'a plus de chantier sur l'île.
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ inventory: { lanterne: 3 }, village: { at: 'foret', plans, bridges: ['foret-mine', 'foret-ferme', 'foret-horloge'] } });
  const site = worksiteFor(state, 'foret', 'lanterne');
  expect(['garder', 'aucun', 'monument']).toContain(site.kind);
  if (site.kind === 'aucun') expect(site.text).toBe('Aucun chantier n’attend tes blocs de lanterne pour l’instant : ils restent dans Mes blocs.');
  expect(site.to).toMatch(/^\/aventure\//);
});
