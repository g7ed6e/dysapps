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

it('une fois l’univers ouvert, l’univers choisit le rendu à la place des réglages expérimentaux', () => {
  const ici = 'https://dysapps.fr/#/aventure';
  const choix = { renduArchipeo: true, styleArchipeo: 'b' } as const;
  // Fermé : l'univers enregistré ne change rien.
  expect(renduDepuis(ici, { ...choix, renduArchipeo: false, univers: 'archipeo' }, false)).toBe('blocs');
  // Ouvert : Blocland (ou rien, l'univers par défaut) dessine en blocs, même avec l'ancien réglage expérimental ;
  // Archipéo en Archipéo.
  expect(renduDepuis(ici, { ...choix, univers: 'blocland' }, true)).toBe('blocs');
  expect(renduDepuis(ici, { ...choix, renduArchipeo: false, univers: 'archipeo' }, true)).toBe('archipeo');
  expect(renduDepuis(ici, { ...choix, renduArchipeo: false }, true)).toBe('blocs');
  expect(styleDepuis(ici, { ...choix, univers: 'blocland' }, true)).toBeNull();
  // L'adresse l'emporte encore jusqu'à la bascule, qui retire le drapeau.
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure', { ...choix, univers: 'blocland' }, true)).toBe('archipeo');
});
