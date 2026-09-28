import { mesuresDepuis, renduDepuis, styleDepuis } from './rendu';

// Le serveur de développement lit l'adresse ; l'application publiée non (troisième argument).
const dev = true;

it('garde le monde en blocs sans le drapeau', () => {
  expect(renduDepuis('https://dysapps.fr/#/aventure', {}, dev)).toBe('blocs');
  expect(renduDepuis('https://dysapps.fr/?rendu=autre#/aventure', {}, dev)).toBe('blocs');
});

it('lit le drapeau avant le #, pas dans la route (que la navigation remplace)', () => {
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure/foret', {}, dev)).toBe('archipeo');
  expect(renduDepuis('https://dysapps.fr/#/aventure?rendu=archipeo', {}, dev)).toBe('blocs');
});

it('lit le compteur de mesures', () => {
  expect(mesuresDepuis('https://dysapps.fr/#/aventure')).toBe(false);
  expect(mesuresDepuis('https://dysapps.fr/?mesures#/aventure')).toBe(true);
  expect(mesuresDepuis('https://dysapps.fr/?rendu=archipeo&mesures=1#/aventure')).toBe(true);
  expect(mesuresDepuis('https://dysapps.fr/?mesures=0#/aventure')).toBe(false);
});

it('lit l’option de style du lot R1, seulement avec le rendu Archipéo', () => {
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=b#/aventure', {}, dev)).toBe('b');
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=c#/aventure', {}, dev)).toBe('c');
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo#/aventure', {}, dev)).toBeNull();
  expect(styleDepuis('https://dysapps.fr/?rendu=archipeo&style=z#/aventure', {}, dev)).toBeNull();
  expect(styleDepuis('https://dysapps.fr/?style=a#/aventure', {}, dev)).toBeNull();
});

it('suit l’univers choisi : Blocland (ou rien, l’univers par défaut) en blocs, Archipéo en Archipéo', () => {
  const ici = 'https://dysapps.fr/#/aventure';
  expect(renduDepuis(ici, {}, dev)).toBe('blocs');
  expect(renduDepuis(ici, { univers: 'blocland' }, dev)).toBe('blocs');
  expect(renduDepuis(ici, { univers: 'archipeo' }, dev)).toBe('archipeo');
  expect(styleDepuis(ici, { univers: 'archipeo' }, dev)).toBeNull();
  expect(styleDepuis('https://dysapps.fr/?style=b#/aventure', { univers: 'archipeo' }, dev)).toBe('b');
  expect(styleDepuis('https://dysapps.fr/?style=b#/aventure', { univers: 'blocland' }, dev)).toBeNull();
});

it('sur le serveur de développement, l’adresse l’emporte sur l’univers, dans les deux sens', () => {
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure', { univers: 'blocland' }, dev)).toBe('archipeo');
  expect(renduDepuis('https://dysapps.fr/?rendu=blocs#/aventure', { univers: 'archipeo' }, dev)).toBe('blocs');
});

it('dans l’application publiée, aucune adresse ne fait passer un appareil à Archipéo (décision 8)', () => {
  const publiee = false;
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure', { univers: 'blocland' }, publiee)).toBe('blocs');
  expect(renduDepuis('https://dysapps.fr/?rendu=archipeo#/aventure', {}, publiee)).toBe('blocs');
  expect(renduDepuis('https://dysapps.fr/?rendu=blocs#/aventure', { univers: 'archipeo' }, publiee)).toBe('archipeo');
  expect(styleDepuis('https://dysapps.fr/?style=b#/aventure', { univers: 'archipeo' }, publiee)).toBeNull();
});
