// Un défi ouvert avant les programmes de 2025-2026 reste ouvert jusqu'à ce qu'il soit réussi : la règle se lit, à la
// migration vers le format 4, avec les missions et la progression d'avant ; une partie neuve garde la règle entière.
import { getBiome } from '../game/biomes';
import { bossDef, guardianStatus, isBossOpen, isBossUnlocked } from '../game/boss';
import type { ExerciseItem } from '../game/exercises/types';
import { sanitizeState } from '../game/engine';
import { grantAccess } from '../game/world/archipelago';
import { translateGame } from './migration';
import { challengesOpenBeforeAdditions, challengesOpenBeforeMove } from './movedChallenges';

const P = (stars: number) => ({ stars, attempts: 1, best: 0.8 });
const LINKS = grantAccess([], ['maths-5e-signed-numbers', 'french-5e-conjugation', 'maths-4e-powers', 'french-4e-vocabulary']);
const format3 = (progress: Record<string, unknown>) => ({ version: 3, progress, world: { parts: {}, log: [], links: LINKS } });

/** Deux étoiles dans chaque mission du Marais d'avant, Roseaux du subjonctif compris. */
const MARAIS = {
  'french-5e-conjugation-past-tenses-1': P(2),
  'french-5e-conjugation-future-tense-1': P(3),
  'french-5e-conjugation-subjunctive-1': P(2),
  'french-5e-conjugation-tense-choice-1': P(2),
};

it('le Marais : un élève qui avait des étoiles dans chaque mission, subjonctif compris, garde son défi ouvert', () => {
  const marais = getBiome('french-5e-conjugation')!;
  const s = sanitizeState(format3(MARAIS));
  // Les Roseaux sont partis aux Liens du Cabinet, les Reflets sont arrivés sans étoile : la règle d'aujourd'hui dirait non.
  expect(s.progress['french-4e-vocabulary-conjunctions-3']).toEqual(P(2));
  expect(isBossUnlocked(marais, s.progress)).toBe(false);
  expect(s.world.challengesKeptOpen).toEqual(['french-5e-conjugation']);
  expect(isBossUnlocked(marais, s.progress, s.world.challengesKeptOpen)).toBe(true);
  expect(isBossOpen(marais, s.progress, s.world.challengesKeptOpen)).toBe(true);
  expect(guardianStatus(marais, s.progress, s.world.links, true, s.world.challengesKeptOpen)).toBe('ready');
  // La partie relue (au format 4) garde le champ ; la migration ne repasse pas.
  expect(sanitizeState(s).world.challengesKeptOpen).toEqual(['french-5e-conjugation']);
});

it('la Forge et le Glacier : une mission arrivée ou partie ne referme pas un défi ouvert', () => {
  const forge = {
    'maths-4e-powers-powers-1': P(2),
    'maths-4e-powers-square-roots-2': P(3),
    'maths-4e-powers-scientific-notation-1': P(2),
  };
  // Au Glacier, les fractions n'avaient d'étoiles qu'au niveau 3, parti au Fourneau de la Forge.
  const glacier = {
    'maths-5e-signed-numbers-thermometer-1': P(2),
    'maths-5e-signed-numbers-adding-1': P(2),
    'maths-5e-signed-numbers-subtracting-1': P(2),
    'maths-5e-signed-numbers-fractions-3': P(3),
  };
  const s = sanitizeState(format3({ ...forge, ...glacier }));
  expect(s.world.challengesKeptOpen).toEqual(['maths-4e-powers', 'maths-5e-signed-numbers']);
  // Les Icebergs ont perdu leur niveau étoilé, mais pas leurs étoiles (gardées au niveau 2). Le Glacier a reçu deux
  // missions depuis (GD-14) : la règle d'aujourd'hui dit non, le champ le garde ouvert quoi qu'il arrive.
  expect(s.progress['maths-5e-signed-numbers-fractions-2']).toEqual({ stars: 3, attempts: 0, best: 0.8 });
  expect(isBossUnlocked(getBiome('maths-5e-signed-numbers')!, s.progress)).toBe(false);
  for (const id of ['maths-4e-powers', 'maths-5e-signed-numbers']) expect(isBossOpen(getBiome(id)!, s.progress, s.world.challengesKeptOpen), id).toBe(true);
  // Sans rien de ce qui part au Fourneau, la Forge a une mission sans étoile : son défi reste ouvert quand même.
  const f = sanitizeState(format3(forge));
  expect(f.world.challengesKeptOpen).toEqual(['maths-4e-powers']);
  expect(isBossUnlocked(getBiome('maths-4e-powers')!, f.progress)).toBe(false);
  expect(isBossOpen(getBiome('maths-4e-powers')!, f.progress, f.world.challengesKeptOpen)).toBe(true);
});

it('un défi qui n’était pas ouvert ne s’ouvre pas ; un défi réussi quitte le champ', () => {
  const { 'french-5e-conjugation-tense-choice-1': _, ...presque } = MARAIS;
  expect(challengesOpenBeforeMove(presque)).toEqual([]);
  expect(sanitizeState(format3(presque)).world.challengesKeptOpen).toBeUndefined();
  // Déjà réussi avant la mise à jour : rien à garder, le Gardien est rallumé.
  expect(challengesOpenBeforeMove({ ...MARAIS, 'french-5e-conjugation-challenge': P(3) })).toEqual([]);
  // Réussi après : le lieu sort du champ à la lecture suivante.
  const s = sanitizeState(format3(MARAIS));
  const apres = sanitizeState({ ...s, progress: { ...s.progress, 'french-5e-conjugation-challenge': P(2) } });
  expect(apres.world.challengesKeptOpen).toBeUndefined();
  expect(isBossOpen(getBiome('french-5e-conjugation')!, apres.progress, apres.world.challengesKeptOpen)).toBe(true);
});

it('seulement à la migration d’une sauvegarde plus ancienne : une partie neuve ou déjà au dernier format garde la règle entière', () => {
  expect(sanitizeState({}).world.challengesKeptOpen).toBeUndefined();
  const format4 = { ...format3(MARAIS), version: 5 };
  expect((translateGame(format4) as typeof format4).world).toEqual(format4.world);
  expect(sanitizeState(format4).world.challengesKeptOpen).toBeUndefined();
  // Un lieu inconnu ou en double, dans une sauvegarde abîmée, est ignoré.
  const abimee = sanitizeState({ version: 5, world: { parts: {}, log: [], links: [], challengesKeptOpen: ['nulle-part', 'maths-4e-powers', 'maths-4e-powers', 3] } });
  expect(abimee.world.challengesKeptOpen).toEqual(['maths-4e-powers']);
});

it('le défi gardé ouvert du Marais tire les Reflets au niveau 1, avec leur tableau des temps affiché', async () => {
  const s = sanitizeState(format3(MARAIS));
  const def = await bossDef(getBiome('french-5e-conjugation')!, s, () => 0.5);
  const reflets = (def.items as unknown as { screenType: string; exerciseId: string; items: ExerciseItem[] }[]).filter((r) => r.screenType === 'tense-recognition');
  expect(reflets.length).toBeGreaterThan(0);
  for (const r of reflets) {
    expect(r.exerciseId).toBe('french-5e-conjugation-tense-recognition-1');
    for (const item of r.items) expect(item.aid, item.key).toBeTruthy();
  }
});

it('les missions ajoutées le 9 octobre 2026 (GD-14, format 5) ne referment pas un défi ouvert, pour chaque langue de la LV2', () => {
  const format4 = (progress: Record<string, unknown>) => ({ version: 4, progress, world: { parts: {}, log: [], links: [] } });
  // Le Nid : deux étoiles dans les quatre missions d'avant, rien aux Mesures arrivées depuis.
  const nid = {
    'maths-6e-calculation-times-tables-1': P(2),
    'maths-6e-calculation-make-ten-2': P(3),
    'maths-6e-calculation-doubles-halves-1': P(2),
    'maths-6e-calculation-word-problems-1': P(2),
  };
  // Le Relais des voyageurs : l'espagnol seul, sans les Frases arrivées depuis.
  const relais = {
    'lv2-5e-introductions-es-greetings-1': P(2),
    'lv2-5e-introductions-es-numbers-1': P(2),
    'lv2-5e-introductions-es-family-1': P(2),
    'lv2-5e-introductions-es-articles-1': P(2),
  };
  const s = sanitizeState(format4({ ...nid, ...relais }));
  expect(s.world.challengesKeptOpen).toEqual(['lv2-5e-introductions', 'maths-6e-calculation']);
  const calcul = getBiome('maths-6e-calculation')!;
  expect(isBossUnlocked(calcul, s.progress)).toBe(false);
  expect(isBossOpen(calcul, s.progress, s.world.challengesKeptOpen)).toBe(true);
  // Une mission d'avant sans étoile, ou le défi déjà réussi : rien à garder.
  const { 'maths-6e-calculation-word-problems-1': _, ...presque } = nid;
  expect(challengesOpenBeforeAdditions(presque)).toEqual([]);
  expect(challengesOpenBeforeAdditions({ ...nid, 'maths-6e-calculation-challenge': P(3) })).toEqual([]);
  // Une partie déjà au format 5 ne repasse pas par la règle.
  expect(sanitizeState({ ...format4(nid), version: 5 }).world.challengesKeptOpen).toBeUndefined();
});
