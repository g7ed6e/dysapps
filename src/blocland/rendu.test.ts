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

it('lit aussi les réglages expérimentaux ; l’adresse l’emporte sur eux', () => {
  const archipeo = { renduArchipeo: true, styleArchipeo: 'textures' } as const;
  expect(renduDepuis('https://dysapps.fr/#/aventure', archipeo)).toBe('archipeo');
  expect(renduDepuis('https://dysapps.fr/#/aventure', { ...archipeo, renduArchipeo: false })).toBe('blocs');
  expect(styleDepuis('https://dysapps.fr/#/aventure', archipeo)).toBeNull();
  expect(styleDepuis('https://dysapps.fr/#/aventure', { ...archipeo, styleArchipeo: 'b' })).toBe('b');
  expect(styleDepuis('https://dysapps.fr/?style=c#/aventure', { ...archipeo, styleArchipeo: 'b' })).toBe('c');
  // Le style seul, sans le rendu Archipéo, ne change rien.
  expect(styleDepuis('https://dysapps.fr/#/aventure', { renduArchipeo: false, styleArchipeo: 'a' })).toBeNull();
});
