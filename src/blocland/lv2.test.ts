import { subjectInfo, visibleSubjects } from '../apps/registry';
import { bridgesOf, buildableBridges, grantAccess } from './world/archipelago';
import { getBiome, missionsJouables } from './biomes';
import { isBossUnlocked, typesWithContent } from './boss';

const relais = getBiome('relais')!;

it('le Relais des voyageurs ouvre les missions de la LV2 choisie, au même rang dans les deux langues', () => {
  const es = missionsJouables(relais, 'es');
  const de = missionsJouables(relais, 'de');
  expect(es.map((x) => x.id)).toEqual(['es-hola', 'es-numeros', 'es-familia', 'es-el-la']);
  expect(de.map((x) => x.id)).toEqual(['de-hallo', 'de-zahlen', 'de-familie', 'de-der-die-das']);
  // Autant de bornes quelle que soit la langue : le monde ne change pas avec le réglage.
  expect(de).toHaveLength(es.length);
  expect(missionsJouables(relais, 'aucune')).toEqual([]);
  // Les autres îles ne changent pas.
  const comptoir = getBiome('comptoir')!;
  expect(missionsJouables(comptoir, 'de')).toEqual(comptoir.exercises);
  expect(missionsJouables(comptoir, 'aucune')).toEqual(comptoir.exercises);
});

it('sans LV2, le Gardien du Relais ne propose pas de défi ; chaque langue a ses propres étoiles', () => {
  expect(typesWithContent(relais)).toEqual(missionsJouables(relais).map((x) => x.id));
  expect(isBossUnlocked({ ...relais, exercises: missionsJouables(relais, 'aucune') }, {})).toBe(false);
});

it('la matière LV2 prend le nom de la langue choisie, et disparaît avec « Pas de LV2 »', () => {
  expect(subjectInfo('lv2', 'es').title).toBe('Espagnol');
  expect(subjectInfo('lv2', 'de').title).toBe('Allemand');
  expect(subjectInfo('anglais', 'de').title).toBe('Anglais');
  expect(visibleSubjects('es')).toContain('lv2');
  expect(visibleSubjects('aucune')).not.toContain('lv2');
  expect(visibleSubjects('aucune')).toEqual(['francais', 'maths', 'anglais']);
});

it('avec « Pas de LV2 », aucun pont ne mène au Relais ; avec une LV2, le pont depuis le Comptoir est proposé', () => {
  // Le Comptoir ouvert : le pont vers le Relais devient possible.
  const faits = grantAccess([], ['comptoir']);
  const versRelais = (lv2: 'es' | 'aucune') => buildableBridges(faits, 'relais', undefined, lv2).map((b) => b.id);
  expect(versRelais('aucune')).toEqual([]);
  expect(buildableBridges(faits, 'comptoir', undefined, 'aucune').some((b) => b.to === 'relais' || b.from === 'relais')).toBe(false);
  expect(bridgesOf('relais').map((b) => [b.from, b.to])).toEqual([['comptoir', 'relais']]);
  expect(versRelais('es')).toHaveLength(bridgesOf('relais').length);
});
