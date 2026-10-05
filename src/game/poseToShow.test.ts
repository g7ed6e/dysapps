// La pose à montrer dans le monde (GD-6) : retenue par « Voir le bâtiment », prise une seule fois par l'île.
import { oublierLesPoses, prendreLaPose, retenirLaPose } from './poseToShow';
import { partiesDe } from './world/parts';

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

it('une valeur abîmée dans le stockage ne plante pas : elle est ignorée', () => {
  const [cabane] = partiesDe('french-6e-phonology');
  for (const brut of ['{', '42', 'null', '"texte"', '{"biome":3,"rangs":[1]}', '{"biome":"french-6e-phonology","rangs":"1"}']) {
    sessionStorage.setItem('dysapps:pose', brut);
    expect(() => prendreLaPose('french-6e-phonology')).not.toThrow();
    expect(prendreLaPose('french-6e-phonology')).toBeNull();
  }
  // Des rangs mêlés : seuls les entiers comptent.
  sessionStorage.setItem('dysapps:pose', JSON.stringify({ biome: 'french-6e-phonology', rangs: [1, '2', 1.5, null] }));
  expect(prendreLaPose('french-6e-phonology')).toEqual([cabane]);
  // Une liste des poses montrées abîmée : retenir et prendre marchent encore.
  for (const brut of ['{"a":1}', '[1, null, {}]', '"x"']) {
    oublierLesPoses();
    sessionStorage.setItem('dysapps:poses-montrees', brut);
    expect(() => retenirLaPose('french-6e-phonology', [cabane])).not.toThrow();
    expect(prendreLaPose('french-6e-phonology')).toEqual([cabane]);
  }
});
