import { DEFAULT_SETTINGS, retenirReglages } from '../core/settings';
import { CATALOG } from './exercises';
import { questsToReview } from './review';
import { subjectInfo, visibleSubjects } from '../apps/registry';
import { bridgesOf, buildableBridges, grantAccess } from './world/archipelago';
import { getBiome, missionsJouables } from './biomes';
import { bossId, guardianStatus, isBossUnlocked, typesWithContent } from './boss';
import { exercisesOf } from './exercises';

const relais = getBiome('lv2-5e-introductions')!;

it('le Relais des voyageurs ouvre les missions de la LV2 choisie, au même rang dans les deux langues', () => {
  const es = missionsJouables(relais, 'es');
  const de = missionsJouables(relais, 'de');
  expect(es.map((x) => x.id)).toEqual(['es-greetings', 'es-numbers', 'es-family', 'es-articles']);
  expect(de.map((x) => x.id)).toEqual(['de-greetings', 'de-numbers', 'de-family', 'de-articles']);
  // Autant de bornes quelle que soit la langue : le monde ne change pas avec le réglage.
  expect(de).toHaveLength(es.length);
  expect(missionsJouables(relais, 'none')).toEqual([]);
  // Les autres îles ne changent pas.
  const comptoir = getBiome('english-5e-vocabulary')!;
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
  expect(subjectInfo('english', 'de').title).toBe('Anglais');
  expect(visibleSubjects('es')).toContain('lv2');
  expect(visibleSubjects('none')).not.toContain('lv2');
  expect(visibleSubjects('none')).toEqual(['french', 'maths', 'english', 'history-geography', 'life-earth-sciences', 'physics-chemistry', 'technology']);
});

it('avec « Pas de LV2 », aucun pont ne mène au Relais ; avec une LV2, le pont depuis le Comptoir est proposé', () => {
  // Le Comptoir ouvert : le pont vers le Relais devient possible.
  const faits = grantAccess([], ['english-5e-vocabulary']);
  const versRelais = (lv2: 'es' | 'none') => buildableBridges(faits, 'lv2-5e-introductions', undefined, lv2).map((b) => b.id);
  expect(versRelais('none')).toEqual([]);
  expect(buildableBridges(faits, 'english-5e-vocabulary', undefined, 'none').some((b) => b.to === 'lv2-5e-introductions' || b.from === 'lv2-5e-introductions')).toBe(false);
  // Depuis GD-9, chaque paire de lieux de la région a sa liaison : le Relais en a une avec chacun, dont le Comptoir.
  expect(bridgesOf('lv2-5e-introductions').map((b) => b.id)).toContain('english-5e-vocabulary-lv2-5e-introductions');
  // Avec une LV2, les départs proposés vers le Relais, le plus court d'abord (celui de « Relier ») : le Comptoir, par un
  // pont, et, depuis que les îles ont grandi (GD-11, 8 octobre 2026), le Marché, par un bac de 45 cases.
  expect(versRelais('es')).toEqual(['english-5e-vocabulary-lv2-5e-introductions', 'maths-5e-proportionality-lv2-5e-introductions']);
});

it('« À revoir » ne propose que les missions de la LV2 choisie', () => {
  const ids = CATALOG.filter((m) => m.biome === 'lv2-5e-introductions').map((m) => m.id);
  const spaced = ids.map((id) => ({ itemId: `${id}:1`, due: '2026-01-01', stage: 0, streak: 0 }));
  const bridges = grantAccess([], ['lv2-5e-introductions']);
  try {
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'de' });
    const types = questsToReview(spaced, bridges, '2026-09-28').map((q) => q.type);
    expect(types).toEqual(['de-greetings', 'de-numbers', 'de-family', 'de-articles']);
    retenirReglages({ ...DEFAULT_SETTINGS, lv2: 'none' });
    expect(questsToReview(spaced, bridges, '2026-09-28')).toEqual([]);
  } finally {
    retenirReglages(null);
  }
});

it('la Diligence battue en espagnol reste vaincue quand l’élève passe à l’allemand ou à « Pas de LV2 »', () => {
  const bridges = grantAccess([], ['lv2-5e-introductions']);
  // Deux étoiles à chaque mission espagnole, puis le défi gagné.
  const progress: Record<string, { stars: number }> = { [bossId('lv2-5e-introductions')]: { stars: 2 } };
  for (const x of missionsJouables(relais, 'es')) progress[exercisesOf('lv2-5e-introductions', x.id)[0].id] = { stars: 2 };
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
