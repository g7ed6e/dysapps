// Catalogue des exercices Blocland (JSON chargés statiquement, plus ceux dérivés des données existantes).
import { SETS } from '../../apps/homophones/data';
import type { BiomeId } from '../biomes';
import type { ExerciseDef } from './types';
import { MATHS_EXERCISES } from './maths';
import { COLLEGE_EXERCISES } from './college';
import foretEchauffement from './data/foret-echauffement-001.json';
import chasseAn from './data/foret-chasse-son-an.json';
import chasseOn from './data/foret-chasse-son-on.json';
import chasseOi from './data/foret-chasse-son-oi.json';
import chasseIn from './data/foret-chasse-son-in.json';
import chasseCh from './data/foret-chasse-son-ch.json';
import chasseS from './data/foret-chasse-son-s.json';
import filonB from './data/mine-filon-b.json';
import filonD from './data/mine-filon-d.json';
import filonP from './data/mine-filon-p.json';
import filonQ from './data/mine-filon-q.json';
import trou1 from './data/carriere-mot-troue-1.json';
import trou2 from './data/carriere-mot-troue-2.json';
import ascMousso from './data/tour-ascension-mousso.json';
import ascTunel from './data/tour-ascension-tunel.json';
import ascPont from './data/tour-ascension-pont.json';
import rimesEau from './data/foret-rimes-eau.json';
import rimesOn from './data/foret-rimes-on.json';
import rimesEtte from './data/foret-rimes-ette.json';
import oreille1 from './data/mine-oreille-1.json';
import oreille2 from './data/mine-oreille-2.json';
import coffre1 from './data/carriere-coffre-1.json';
import coffre2 from './data/carriere-coffre-2.json';
import familles1 from './data/carriere-familles-1.json';
import familles2 from './data/carriere-familles-2.json';
import enclos1 from './data/ferme-enclos-1.json';
import enclos2 from './data/ferme-enclos-2.json';
import recolte1 from './data/ferme-recolte-1.json';
import recolte2 from './data/ferme-recolte-2.json';

/** Tri des graines : les phrases à trous viennent de la quête Homophones (a/à, et/est, on/ont, son/sont, ce/se). */
const GRAINES_SETS = ['a', 'et', 'on', 'son', 'ce'];
const graines: ExerciseDef[] = SETS.filter((s) => GRAINES_SETS.includes(s.id)).map((set) => ({
  id: `ferme-graines-${set.id}`,
  biome: 'ferme',
  type: 'graines',
  level: 1,
  instruction: `Complète chaque phrase avec ${set.label}. Astuce : ${set.hint}`,
  target: set.label,
  items: set.sentences.map((s, i) => ({
    key: `${set.id}-${i}`,
    prompt: s.text,
    spoken: s.text.replace('…', ' (mot manquant) '),
    choices: set.choices,
    answer: s.answer,
    rule: set.rules[s.answer],
    hint: set.hint,
  })),
  feedback: { correct: 'Bien trié !', wrong: '{rule} Astuce : {hint}' },
  reward: { block: 'terre', amount: 4, xp: 12 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

export const EXERCISES: ExerciseDef[] = [
  foretEchauffement,
  chasseAn,
  chasseOn,
  chasseOi,
  chasseIn,
  chasseCh,
  chasseS,
  filonB,
  filonD,
  filonP,
  filonQ,
  trou1,
  trou2,
  ...graines,
  ascMousso,
  ascTunel,
  ascPont,
  rimesEau,
  rimesOn,
  rimesEtte,
  oreille1,
  oreille2,
  coffre1,
  coffre2,
  familles1,
  familles2,
  enclos1,
  enclos2,
  recolte1,
  recolte2,
  ...MATHS_EXERCISES,
  ...COLLEGE_EXERCISES,
] as ExerciseDef[];

/** Exercices d'un type dans un biome, par niveau croissant. */
export function exercisesOf(biome: BiomeId, type: string): ExerciseDef[] {
  return EXERCISES.filter((e) => e.biome === biome && e.type === type).sort((a, b) => a.level - b.level);
}

/**
 * L'exercice à jouer : au niveau demandé (ou le plus proche en dessous), et parmi ceux-là
 * le moins joué, pour varier les contenus.
 */
export function pickExercise(biome: BiomeId, type: string, level: number, progress: Record<string, { attempts: number }> = {}): ExerciseDef | undefined {
  const all = exercisesOf(biome, type);
  if (all.length === 0) return undefined;
  const below = all.filter((e) => e.level <= level);
  const target = below.length ? below[below.length - 1].level : all[0].level;
  const candidates = all.filter((e) => e.level === target);
  return candidates.reduce((best, e) => ((progress[e.id]?.attempts ?? 0) < (progress[best.id]?.attempts ?? 0) ? e : best), candidates[0]);
}

export function getExercise(id: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.id === id);
}
