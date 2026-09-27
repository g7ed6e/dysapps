import { mesuresDepuis, renduDepuis } from './rendu';

it('garde le monde en blocs sans le drapeau', () => {
  expect(renduDepuis('https://dysapps.fr/#/aventure')).toBe('blocs');
  expect(renduDepuis('https://dysapps.fr/?rendu=autre#/aventure')).toBe('blocs');
});

it('lit le drapeau avant le #, pas dans la route (que la navigation remplace)', () => {
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure/foret')).toBe('archipeo');
  expect(renduDepuis('https://dysapps.fr/#/aventure?rendu=archipeo')).toBe('blocs');
});

it('lit le compteur de mesures', () => {
  expect(mesuresDepuis('https://dysapps.fr/#/aventure')).toBe(false);
  expect(mesuresDepuis('https://dysapps.fr/?mesures#/aventure')).toBe(true);
  expect(mesuresDepuis('https://dysapps.fr/?rendu=archipeo&mesures=1#/aventure')).toBe(true);
  expect(mesuresDepuis('https://dysapps.fr/?mesures=0#/aventure')).toBe(false);
});
