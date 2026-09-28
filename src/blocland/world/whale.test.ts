import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { islandsOf } from './archipelago';
import { planCells, plansFor } from './plans';
import { pagesBaleine } from '../../univers/baleine';
import { textesDe } from '../../univers';
import { reachedWhaleMoments } from './whale';

// Les mots de Blocland, ceux d'avant le lot 6 ; ceux d'Archipéo sont vérifiés dans src/univers/.
const pages = (m: Parameters<typeof pagesBaleine>[0]) => pagesBaleine(m, textesDe('blocland'));

it('au début, la baleine n’a qu’un mot en 6e : elle se présente', () => {
  const m = reachedWhaleMoments(sanitizeState({}), '6e');
  expect(m.map((x) => x.kind)).toEqual(['arrivee']);
  expect(pages(m[0])[0]).toMatch(/^Je suis la baleine/);
  // Un archipel pas encore atteint : rien.
  expect(reachedWhaleMoments(sanitizeState({}), '5e')).toEqual([]);
});

it('les grandes étapes, de la plus grande à la plus petite', () => {
  const guardians = Object.fromEntries(islandsOf('6e').map((b) => [`${b.id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  const plans = Object.fromEntries(plansFor('plaine').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ progress: { ...guardians, [exercisesOf('foret', 'rimes')[0].id]: { stars: 2, attempts: 1, best: 1 } }, village: { plans, bridges: ['foret-mine'] } });
  const m = reachedWhaleMoments(state, '6e');
  expect(m.map((x) => x.kind)).toEqual(['arrivee', 'gardiens', 'port', 'ouvrage']);
  expect(pages(m[1])[0]).toBe('Tous les Gardiens des Premiers Rivages ont reconnu ton savoir. Je l’ai vu depuis le large.');
  expect(pages(m[2])[0]).toMatch(/^Plaine des nombres est restaurée\./);
  // Le sentier de la Forêt ouvre la Mine ; le pont gratuit vers la Plaine ne compte pas.
  expect(m[3]).toMatchObject({ island: 'mine' });
  expect(pages(m[3])).toEqual(['Un chemin s’ouvre vers Mine des lettres. L’archipel s’agrandit.']);
});

it('l’arrivée en 5e garde la clé de l’ancienne bulle et sa page pratique', () => {
  const m = reachedWhaleMoments(sanitizeState({ village: { bridges: ['voyage-5e'], at: 'marche' } }), '5e');
  expect(m[0]).toMatchObject({ id: 'archipel-5e', kind: 'arrivee', island: 'marche' });
  expect(pages(m[0])).toHaveLength(2);
  expect(pages(m[0]).join(' ')).not.toMatch(/rallum/);
});
