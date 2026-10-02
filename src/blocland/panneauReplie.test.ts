import { panneauReplie, retenirPanneauReplie } from './panneauReplie';

it('retient l’île dont le panneau est replié, et l’oublie quand un panneau s’ouvre', () => {
  retenirPanneauReplie('foret');
  expect(panneauReplie()).toBe('foret');
  retenirPanneauReplie(null);
  expect(panneauReplie()).toBeNull();
});

it('une valeur lue qui n’est pas une île ne replie rien', () => {
  sessionStorage.setItem('dysapps:panel-folded', 'atlantide');
  expect(panneauReplie()).toBeNull();
});
