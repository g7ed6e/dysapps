import { planCells, plansFor } from './plans';
import { monumentsOf } from './monuments';
import { villageStage } from './villageStage';

const built = (ids: string[]) => Object.fromEntries(ids.flatMap((b) => plansFor(b as never)).map((p) => [p.id, planCells(p).map((c) => c.key)]));

it('le village passe par cinq états, déduits de la progression', () => {
  expect(villageStage({ parts: {}, links: [] }, '6e')).toMatchObject({ rank: 1, name: 'Abandonné', next: 'Termine un premier plan sur une île.' });
  // Un plan d'île terminé (la Forêt) : le village se réveille.
  const foret = built(['french-6e-phonology']);
  expect(villageStage({ parts: foret, links: [] }, '6e')).toMatchObject({
    rank: 2,
    next: 'Termine les plans de Plaine des nombres et construis un ouvrage qui part de Plaine des nombres.',
  });
  // Le pont gratuit de la Forêt à la Plaine ne compte pas : il faut un ouvrage payé qui parte du port.
  const plaine = built(['maths-6e-calculation']);
  expect(villageStage({ parts: plaine, links: ['french-6e-phonology-maths-6e-calculation'] }, '6e').rank).toBe(2);
  expect(villageStage({ parts: plaine, links: ['maths-6e-calculation-maths-6e-fractions'] }, '6e')).toMatchObject({ rank: 3, name: 'Reconstruction' });
  // Un monument terminé : développement.
  const [monument] = monumentsOf('6e');
  const withMonument = { ...plaine, [monument.id]: planCells(monument).map((c) => c.key) };
  expect(villageStage({ parts: withMonument, links: ['maths-6e-calculation-maths-6e-fractions'] }, '6e')).toMatchObject({ rank: 4, next: 'Fais partir le Bloc-Navire vers les Îles Brumeuses.' });
  // Le voyage fait : port, quel que soit le reste.
  expect(villageStage({ parts: {}, links: ['passage-5e'] }, '6e')).toMatchObject({ rank: 5, name: 'Port', next: null });
});

it('le 3e n’a pas de voyage suivant : il s’arrête à développement', () => {
  const s = villageStage({ parts: {}, links: [] }, '3e');
  expect(s.rank).toBe(1);
  expect(villageStage({ parts: {}, links: ['passage-4e'] }, '3e').rank).toBe(1);
});
