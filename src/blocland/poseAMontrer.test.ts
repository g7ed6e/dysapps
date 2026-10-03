// La pose à montrer dans le monde (GD-6) : retenue par « Voir le bâtiment », prise une seule fois par l'île.
import { oublierLesPoses, prendreLaPose, retenirLaPose } from './poseAMontrer';
import { partiesDe } from './world/parties';

beforeEach(oublierLesPoses);

it('se prend une fois, sur son île seulement, et ne se rejoue pas', () => {
  const [cabane] = partiesDe('french-6e-phonology');
  retenirLaPose('french-6e-phonology', [cabane]);
  expect(prendreLaPose('french-6e-letter-confusion')).toBeNull();
  expect(prendreLaPose('french-6e-phonology')).toEqual([cabane]);
  // Au retour sur l'île : plus rien à jouer.
  expect(prendreLaPose('french-6e-phonology')).toBeNull();
  // « Voir le bâtiment » de nouveau (retour à l'écran de fin) : la même pose n'est pas rejouée.
  retenirLaPose('french-6e-phonology', [cabane]);
  expect(prendreLaPose('french-6e-phonology')).toBeNull();
});

it('rien à retenir sans partie posée', () => {
  retenirLaPose('french-6e-phonology', []);
  expect(prendreLaPose('french-6e-phonology')).toBeNull();
});
