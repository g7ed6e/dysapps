// Les phrases de la pose au bilan d'une mission, écrites et lues, hors du lanceur (`ExerciseRunner.tsx`) : du texte pur,
// sans React, que les tests du monde ouvert importent sans tirer tout l'écran (expert frontend, lot 5 du 5e).
import type { Completion } from './engine';
import { minuscule } from './world/parts';

/** Une phrase de la pose au bilan, et l'XP qui la suit s'il y en a (« Étape finie : le corps du Hameau. +40 XP. »). */
export interface PoseLine {
  text: string;
  xp?: number;
}

/**
 * Les phrases de la pose au bilan, écrites et lues. Dans la grille : « Partie posée : le toit de la cabane. » par partie,
 * puis la réplique et l'XP de chaque plan fini. Au monde ouvert du 5e, l'étape du lieu, jamais le nom d'un plan ni sa
 * réplique (directeur du contenu pédagogique, lot 5 du 5e : `stagePoseWords`).
 */
export interface PoseWords {
  lines(pose: NonNullable<Completion['pose']>): readonly PoseLine[];
}

/**
 * La phrase de la pose, écrite et lue : « Partie posée : le toit de la cabane. », l’accord porté par « partie », quel que
 * soit le nom ; puis la réplique et l'XP de chaque plan fini.
 */
export function phraseDeLaPose(pose: NonNullable<Completion['pose']>, words?: PoseWords): string {
  if (words) return words.lines(pose).map((l) => (l.xp === undefined ? l.text : `${l.text} +${l.xp} XP.`)).join(' ');
  return [...pose.posees.map((p) => `Partie posée : ${minuscule(p.nom)}.`), ...pose.plansFinis.map((p) => `${p.done} +${p.reward.xp} XP.`)].join(' ');
}
