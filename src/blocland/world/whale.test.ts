import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { islandsOf } from './archipelago';
import { planCells, plansFor } from './plans';
import { reachedWhaleMoments } from './whale';

it('au début, la baleine n’a qu’un mot en 6e : elle se présente', () => {
  const m = reachedWhaleMoments(sanitizeState({}), '6e');
  expect(m.map((x) => x.kind)).toEqual(['arrivee']);
  expect(m[0].pages[0]).toMatch(/^Je suis la baleine/);
  // Un archipel pas encore atteint : rien.
  expect(reachedWhaleMoments(sanitizeState({}), '5e')).toEqual([]);
});

it('les grandes étapes, de la plus grande à la plus petite', () => {
  const guardians = Object.fromEntries(islandsOf('6e').map((b) => [`${b.id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  const plans = Object.fromEntries(plansFor('plaine').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ progress: { ...guardians, [exercisesOf('foret', 'rimes')[0].id]: { stars: 2, attempts: 1, best: 1 } }, village: { plans, bridges: ['foret-mine'] } });
  const m = reachedWhaleMoments(state, '6e');
  expect(m.map((x) => x.kind)).toEqual(['arrivee', 'gardiens', 'port', 'ouvrage']);
  expect(m[1].pages[0]).toBe('Tous les Gardiens des Premiers Rivages ont reconnu ton savoir. Je l’ai vu depuis le large.');
  expect(m[2].pages[0]).toMatch(/^Plaine des nombres est restaurée\./);
  // Le sentier de la Forêt ouvre la Mine ; le pont gratuit vers la Plaine ne compte pas.
  expect(m[3]).toMatchObject({ island: 'mine', pages: ['Un chemin s’ouvre vers Mine des lettres. L’archipel s’agrandit.'] });
});

it('l’arrivée en 5e garde la clé de l’ancienne bulle et sa page pratique', () => {
  const m = reachedWhaleMoments(sanitizeState({ village: { bridges: ['voyage-5e'], at: 'marche' } }), '5e');
  expect(m[0]).toMatchObject({ id: 'archipel-5e', kind: 'arrivee', island: 'marche' });
  expect(m[0].pages).toHaveLength(2);
  expect(m[0].pages.join(' ')).not.toMatch(/rallum/);
});
