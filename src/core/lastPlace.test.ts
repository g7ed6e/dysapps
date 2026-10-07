// « Ma dernière mission » : l'adresse d'aujourd'hui (mission déplacée comprise), jamais vers un lieu fermé.
import { EMPTY_STATE } from '../game/engine';
import { grantAccess } from '../game/world/archipelago';
import { lastPlace, rememberPlace } from './lastPlace';

const CINQUIEME = grantAccess([], ['maths-5e-signed-numbers', 'french-5e-conjugation']);

it('une mission arrivée dans un lieu fermé n’est pas reprise : « Reprendre » suit la suggestion', () => {
  localStorage.clear();
  // L'ancienne adresse des Crevasses mène au Fourneau de la Forge, fermée chez un élève de 5e.
  rememberPlace({ path: '/adventure/maths-5e-signed-numbers/subtracting', label: 'Crevasses' });
  expect(lastPlace(CINQUIEME)).toBeNull();
  expect(lastPlace(grantAccess(CINQUIEME, ['maths-4e-powers']))).toEqual({ path: '/adventure/maths-4e-powers/subtracting', label: 'Crevasses' });
  // Déplacée dans son propre lieu, ouvert : reprise à sa nouvelle adresse.
  rememberPlace({ path: '/adventure/french-5e-conjugation/subjunctive', label: 'Roseaux' });
  expect(lastPlace(CINQUIEME)).toEqual({ path: '/adventure/french-5e-conjugation/tense-recognition', label: 'Roseaux' });
});

it('une adresse hors des lieux (le portail, la Carte) se reprend toujours ; sans partie, rien n’est filtré', () => {
  localStorage.clear();
  rememberPlace({ path: '/app/tables', label: 'Tables' });
  expect(lastPlace(EMPTY_STATE.world.links)).toEqual({ path: '/app/tables', label: 'Tables' });
  rememberPlace({ path: '/adventure/maths-4e-powers/powers', label: 'Puissances' });
  expect(lastPlace(EMPTY_STATE.world.links)).toBeNull();
  expect(lastPlace()).toEqual({ path: '/adventure/maths-4e-powers/powers', label: 'Puissances' });
});
