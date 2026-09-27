import { mesuresDepuis, renduDepuis, styleDepuis } from './rendu';

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

it('lit l’option de style du lot R1, seulement avec le rendu Archipéo', () => {
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=b#/aventure')).toBe('b');
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=c#/aventure')).toBe('c');
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo#/aventure')).toBeNull();
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=z#/aventure')).toBeNull();
  expect(styleDepuis('https://dysapps.fr/?style=a#/aventure')).toBeNull();
});
