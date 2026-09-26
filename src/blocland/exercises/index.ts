// Catalogue des exercices Blocland (JSON chargés statiquement, plus ceux dérivés des données existantes).
import { SETS } from '../../apps/homophones/data';
import type { BiomeId } from '../biomes';
import type { ExerciseDef } from './types';
import { MATHS_EXERCISES } from './maths';
import { COLLEGE_EXERCISES } from './college';
import carrefourAiguillage1 from './data/carrefour-aiguillage-1.json';
import carrefourAiguillage2 from './data/carrefour-aiguillage-2.json';
import carrefourBifurcation1 from './data/carrefour-bifurcation-1.json';
import carrefourBifurcation2 from './data/carrefour-bifurcation-2.json';
import maraisRives1 from './data/marais-rives-1.json';
import maraisRives2 from './data/marais-rives-2.json';
import maraisBrume1 from './data/marais-brume-1.json';
import maraisBrume2 from './data/marais-brume-2.json';
import maraisRoseaux1 from './data/marais-roseaux-1.json';
import maraisRoseaux2 from './data/marais-roseaux-2.json';
import foretEchauffement from './data/foret-echauffement-001.json';
import foretEchauffement2 from './data/foret-echauffement-002.json';
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
import filonMix1 from './data/mine-filon-mix-1.json';
import filonMix2 from './data/mine-filon-mix-2.json';
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
import falaiseCorde1 from './data/falaise-corde-1.json';
import falaiseCorde2 from './data/falaise-corde-2.json';
import falaiseParoi1 from './data/falaise-paroi-1.json';
import falaiseParoi2 from './data/falaise-paroi-2.json';
import falaiseSommet1 from './data/falaise-sommet-1.json';
import falaiseSommet2 from './data/falaise-sommet-2.json';
import cabinetRacines1 from './data/cabinet-racines-1.json';
import cabinetRacines2 from './data/cabinet-racines-2.json';
import cabinetSens1 from './data/cabinet-sens-1.json';
import cabinetNuances1 from './data/cabinet-nuances-1.json';
import textesInferences1 from './data/textes-inferences-1.json';
import textesInferences2 from './data/textes-inferences-2.json';
import textesFigures1 from './data/textes-figures-1.json';
import textesFigures2 from './data/textes-figures-2.json';
import textesRouages1 from './data/textes-rouages-1.json';
import textesRouages2 from './data/textes-rouages-2.json';

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

/** Panneaux (Carrefour des homophones) : les autres jeux de la quête Homophones, avec la règle affichée. */
const PANNEAUX_SETS: Record<string, number> = { ces: 1, ou: 1, la: 1, leur: 1, quand: 2, peu: 2, cest: 2 };
const panneaux: ExerciseDef[] = SETS.filter((s) => s.id in PANNEAUX_SETS).map((set) => ({
  id: `carrefour-panneaux-${set.id}`,
  biome: 'carrefour',
  type: 'panneaux',
  level: PANNEAUX_SETS[set.id],
  instruction: `Complète chaque phrase avec ${set.label}. La règle est affichée : lis-la avant de répondre.`,
  target: set.label,
  items: set.sentences.map((s, i) => ({
    key: `${set.id}-${i}`,
    prompt: s.text,
    spoken: s.text.replace('…', ' (mot manquant) '),
    choices: set.choices,
    answer: s.answer,
    hint: set.hint,
    explanation: set.rules[s.answer],
    aid: { kind: 'rule-card', props: { title: set.label, lines: Object.values(set.rules) } },
  })),
  feedback: { correct: 'Bonne route !', wrong: '{explanation}' },
  reward: { block: 'panneau', amount: 4, xp: 14 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

export const EXERCISES: ExerciseDef[] = [
  foretEchauffement,
  foretEchauffement2,
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
  filonMix1,
  filonMix2,
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
  ...panneaux,
  carrefourAiguillage1,
  carrefourAiguillage2,
  carrefourBifurcation1,
  carrefourBifurcation2,
  maraisRives1,
  maraisRives2,
  maraisBrume1,
  maraisBrume2,
  maraisRoseaux1,
  maraisRoseaux2,
  falaiseCorde1,
  falaiseCorde2,
  falaiseParoi1,
  falaiseParoi2,
  falaiseSommet1,
  falaiseSommet2,
  cabinetRacines1,
  cabinetRacines2,
  cabinetSens1,
  cabinetNuances1,
  textesInferences1,
  textesInferences2,
  textesFigures1,
  textesFigures2,
  textesRouages1,
  textesRouages2,
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

/**
 * Progression d'une quête, toutes variantes et tous niveaux confondus : meilleures étoiles, meilleur score,
 * parties cumulées. `undefined` si aucune n'a été jouée. (La liste des quêtes ne doit pas afficher « Nouveau »
 * parce que la prochaine partie tombe sur une variante ou un niveau pas encore joué.)
 */
export function questProgress(
  biome: BiomeId,
  type: string,
  progress: Record<string, { stars: number; attempts: number; best: number }>,
): { stars: number; attempts: number; best: number } | undefined {
  const played = exercisesOf(biome, type)
    .map((e) => progress[e.id])
    .filter((p) => p !== undefined);
  if (played.length === 0) return undefined;
  return {
    stars: Math.max(...played.map((p) => p.stars)),
    attempts: played.reduce((n, p) => n + p.attempts, 0),
    best: Math.max(...played.map((p) => p.best)),
  };
}

export function getExercise(id: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.id === id);
}
