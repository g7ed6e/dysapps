// Les anciennes adresses et les anciens identifiants mènent aux neufs ; ce qui n'est pas d'avant passe tel quel.
import { GRAINES_DU_DESSIN } from '../game/world/map';
import { LEGACY_PLACES, translateExerciseId, translateItemId, translateLinkId, translatePath } from './legacyIds';

it('une ancienne adresse de l’aventure mène à la même page sous les mots neutres', () => {
  expect(translatePath('/aventure')).toBe('/adventure');
  expect(translatePath('/aventure/carte')).toBe('/adventure/map');
  expect(translatePath('/aventure/foret')).toBe('/adventure/french-6e-phonology');
  expect(translatePath('/aventure/foret/chasse-son')).toBe('/adventure/french-6e-phonology/sound-hunt');
  expect(translatePath('/aventure/mine/gardien')).toBe('/adventure/french-6e-letter-confusion/challenge');
  expect(translatePath('/aventure/voyage/5e')).toBe('/adventure/passage/5e');
  expect(translatePath('/aventure/assemblage/poutre')).toBe('/adventure/assembly/compound-6e');
  expect(translatePath('/aventure/ecole?porte=francais')).toBe('/adventure/school?door=french');
  expect(translatePath('/aventure/plaine?chantier=navire')).toBe('/adventure/maths-6e-calculation?worksite=vehicle');
  expect(translatePath('/aventure/foret?chantier=foret-mine')).toBe(
    '/adventure/french-6e-phonology?worksite=french-6e-phonology-french-6e-letter-confusion',
  );
  expect(translatePath('/matiere/francais')).toBe('/matiere/french');
});

it('une adresse fausse le reste, et une adresse neuve ou hors de l’aventure ne bouge pas', () => {
  expect(translatePath('/aventure/foret/rimes/x')).toBe('/adventure/french-6e-phonology/rhymes/x');
  expect(translatePath('/aventure/inconnu')).toBe('/adventure/inconnu');
  expect(translatePath('/adventure/french-6e-phonology/rhymes')).toBe('/adventure/french-6e-phonology/rhymes');
  expect(translatePath('/app/tables')).toBe('/app/tables');
  expect(translatePath('/matiere/maths')).toBe('/matiere/maths');
});

it('les identifiants d’avant : exercices, questions, liaisons', () => {
  expect(translateExerciseId('foret-chasse-son-an')).toBe('french-6e-phonology-sound-hunt-an');
  expect(translateExerciseId('foret-gardien')).toBe('french-6e-phonology-challenge');
  expect(translateExerciseId('assemblage-poutre')).toBe('assembly-compound-6e');
  expect(translateExerciseId('french-6e-phonology-rhymes-on')).toBe('french-6e-phonology-rhymes-on');
  expect(translateItemId('assemblage-poutre:poutre-3')).toBe('assembly-compound-6e:compound-6e-3');
  expect(translateLinkId('voyage-4e')).toBe('passage-4e');
  expect(translateLinkId('foret-mine')).toBe('french-6e-phonology-french-6e-letter-confusion');
});

it('le dessin tire son hasard des noms d’avant : la même table que les lieux d’avant, à l’envers', () => {
  expect(Object.fromEntries(Object.entries(GRAINES_DU_DESSIN).map(([lieu, avant]) => [avant, lieu]))).toEqual(LEGACY_PLACES);
});

it('les autres anciennes adresses : pages du village, monuments, bloc demandé, mots inconnus', () => {
  expect(translatePath('/aventure/blocs')).toBe('/adventure/stock');
  expect(translatePath('/aventure/monde')).toBe('/adventure/world');
  expect(translatePath('/aventure/monuments')).toBe('/adventure/landmarks');
  expect(translatePath('/aventure/trophees')).toBe('/adventure/trophies');
  expect(translatePath('/aventure/ecole')).toBe('/adventure/school');
  expect(translatePath('/aventure/foret?chantier=plan')).toBe('/adventure/french-6e-phonology?worksite=part');
  expect(translatePath('/aventure/assemblage?bloc=poutre')).toBe('/adventure/assembly?bloc=compound-6e');
  expect(translatePath('/aventure/monument-observatoire')).toBe('/adventure/landmark-6e-1');
  expect(translatePath('/aventure/foret/constructor')).toBe('/adventure/french-6e-phonology/constructor');
});
