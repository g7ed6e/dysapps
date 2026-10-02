import { DEFAULT_SETTINGS, retenirReglages } from '../core/settings';
import { CATALOG } from './exercises';
import { questsToReview } from './review';
import { subjectInfo, visibleSubjects } from '../apps/registry';
import { bridgesOf, buildableBridges, grantAccess } from './world/archipelago';
import { getBiome, missionsJouables } from './biomes';
import { bossId, guardianStatus, isBossUnlocked, typesWithContent } from './boss';
import { exercisesOf } from './exercises';

const relais = getBiome('relais')!;

it('le Relais des voyageurs ouvre les missions de la LV2 choisie, au même rang dans les deux langues', () => {
  const es = missionsJouables(relais, 'es');
  const de = missionsJouables(relais, 'de');
  expect(es.map((x) => x.id)).toEqual(['es-hola', 'es-numeros', 'es-familia', 'es-el-la']);
  expect(de.map((x) => x.id)).toEqual(['de-hallo', 'de-zahlen', 'de-familie', 'de-der-die-das']);
  // Autant de bornes quelle que soit la langue : le monde ne change pas avec le réglage.
  expect(de).toHaveLength(es.length);
  expect(missionsJouables(relais, 'none')).toEqual([]);
  // Les autres îles ne changent pas.
  const comptoir = getBiome('comptoir')!;
  expect(missionsJouables(comptoir, 'de')).toEqual(comptoir.exercises);
  expect(missionsJouables(comptoir, 'none')).toEqual(comptoir.exercises);
});

it('sans LV2, le Gardien du Relais ne propose pas de défi ; chaque langue a ses propres étoiles', () => {
  expect(typesWithContent(relais)).toEqual(missionsJouables(relais).map((x) => x.id));
  expect(isBossUnlocked({ ...relais, exercises: missionsJouables(relais, 'none') }, {})).toBe(false);
});

it('la matière LV2 prend le nom de la langue choisie, et disparaît avec « Pas de LV2 »', () => {
  expect(subjectInfo('lv2', 'es').title).toBe('Espagnol');
  expect(subjectInfo('lv2', 'de').title).toBe('Allemand');
  expect(subjectInfo('anglais', 'de').title).toBe('Anglais');
  expect(visibleSubjects('es')).toContain('lv2');
  expect(visibleSubjects('none')).not.toContain('lv2');
  expect(visibleSubjects('none')).toEqual(['francais', 'maths', 'anglais']);
});

it('avec « Pas de LV2 », aucun pont ne mène au Relais ; avec une LV2, le pont depuis le Comptoir est proposé', () => {
  // Le Comptoir ouvert : le pont vers le Relais devient possible.
  const faits = grantAccess([], ['comptoir']);
  const versRelais = (lv2: 'es' | 'none') => buildableBridges(faits, 'relais', undefined, lv2).map((b) => b.id);
  expect(versRelais('none')).toEqual([]);
  expect(buildableBridges(faits, 'comptoir', undefined, 'none').some((b) => b.to === 'relais' || b.from === 'relais')).toBe(false);
  expect(bridgesOf('relais').map((b) => [b.from, b.to])).toEqual([['comptoir', 'relais']]);
  expect(versRelais('es')).toHaveLength(bridgesOf('relais').length);
});

it('« À revoir » ne propose que les missions de la LV2 choisie', () => {
  const ids = CATALOG.filter((m) => m.biome === 'relais').map((m) => m.id);
  const spaced = ids.map((id) => ({ itemId: `${id}:1`, due: '2026-01-01', stage: 0, streak: 0 }));
  const bridges = grantAccess([], ['relais']);
  try {
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'de' });
    const types = questsToReview(spaced, bridges, '2026-09-28').map((q) => q.type);
    expect(types).toEqual(['de-hallo', 'de-zahlen', 'de-familie', 'de-der-die-das']);
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'none' });
    expect(questsToReview(spaced, bridges, '2026-09-28')).toEqual([]);
  } finally {
    retenirReglages(null);
  }
});

it('la Diligence battue en espagnol reste vaincue quand l’élève passe à l’allemand ou à « Pas de LV2 »', () => {
  const bridges = grantAccess([], ['relais']);
  // Deux étoiles à chaque mission espagnole, puis le défi gagné.
  const progress: Record<string, { stars: number }> = { [bossId('relais')]: { stars: 2 } };
  for (const x of missionsJouables(relais, 'es')) progress[exercisesOf('relais', x.id)[0].id] = { stars: 2 };
  try {
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'es' });
    expect(guardianStatus(relais, progress, bridges)).toBe('beaten');
    // Les missions allemandes n'ont pas d'étoile : le défi n'est pas débloqué en allemand, mais la victoire reste.
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'de' });
    expect(isBossUnlocked(relais, progress)).toBe(false);
    expect(guardianStatus(relais, progress, bridges)).toBe('beaten');
    expect(guardianStatus(relais, progress, bridges, true)).toBe('beaten');
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'none' });
    expect(guardianStatus(relais, progress, bridges)).toBe('beaten');
  } finally {
    retenirReglages(null);
  }
});
