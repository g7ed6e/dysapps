// La progression d'une matière, tous jeux confondus : les étoiles des îles de Blocland (de la 6e à la 3e), les
// records des applis, et une courte liste de quêtes à retravailler (les plus faibles d'abord). Code pur.
import { appsBySubject, bestScore, type Subject } from '../apps/registry';
import { biomesOf } from '../blocland/biomes';
import { isBossBeaten } from '../blocland/bossCore';
import { levelFor, type BloclandState } from '../blocland/engine';
import { pickExercise, questProgress } from '../blocland/exercises';
import { isBiomeUnlocked } from '../blocland/world/archipelago';
import type { AppStats } from './progress';

/** Sous ce record, une appli est à retravailler (comme les 2 étoiles d'une quête : 70 %). */
export const APP_REWORK_BELOW = 70;
/** Nombre de quêtes à retravailler montrées par matière. */
export const REWORK_SHOWN = 5;

export type ReworkItem =
  | { kind: 'quete'; id: string; title: string; where: string; stars: number; score: number; href: string }
  | { kind: 'appli'; id: string; title: string; record: number; score: number; href: string };

export interface SubjectProgress {
  subject: Subject;
  stars: { earned: number; max: number };
  islands: { open: number; total: number };
  guardians: { beaten: number; total: number };
  apps: { id: string; title: string; record: number | undefined }[];
  /** Les plus faibles d'abord, au plus REWORK_SHOWN. */
  rework: ReworkItem[];
  /** Nombre total de quêtes à retravailler (au-delà de celles montrées). */
  reworkTotal: number;
}

export function subjectProgress(
  subject: Subject,
  apps: Record<string, AppStats>,
  blocland: BloclandState,
): SubjectProgress {
  const biomes = biomesOf(subject);
  const { progress } = blocland;
  const bridges = blocland.village.bridges;
  let earned = 0;
  let max = 0;
  const rework: ReworkItem[] = [];
  for (const biome of biomes) {
    const open = isBiomeUnlocked(biome.id, bridges);
    for (const quest of biome.exercises) {
      max += 3;
      const done = questProgress(biome.id, quest.id, progress);
      earned += done?.stars ?? 0;
      // Une quête déjà jouée, pas encore à 3 étoiles, qu'on peut relancer tout de suite.
      if (!done || done.stars >= 3 || !open) continue;
      if (!pickExercise(biome.id, quest.id, levelFor(blocland, quest.id), progress)) continue;
      rework.push({
        kind: 'quete',
        id: `${biome.id}:${quest.id}`,
        title: quest.title,
        where: biome.name,
        stars: done.stars,
        score: done.best,
        href: `/aventure/${biome.id}/${quest.id}`,
      });
    }
  }
  const appList = appsBySubject(subject)
    .filter((a) => a.status === 'disponible')
    .map((a) => ({ id: a.id, title: a.title, record: bestScore(apps, a.id) }));
  for (const a of appList) {
    if (a.record === undefined || a.record >= APP_REWORK_BELOW) continue;
    rework.push({ kind: 'appli', id: a.id, title: a.title, record: a.record, score: a.record / 100, href: `/app/${a.id}` });
  }
  // Le plus faible d'abord ; à score égal, la quête qui a le moins d'étoiles.
  const starsOf = (r: ReworkItem) => (r.kind === 'quete' ? r.stars : 3);
  rework.sort((a, b) => a.score - b.score || starsOf(a) - starsOf(b));
  return {
    subject,
    stars: { earned, max },
    islands: { open: biomes.filter((b) => isBiomeUnlocked(b.id, bridges)).length, total: biomes.length },
    guardians: { beaten: biomes.filter((b) => isBossBeaten(b.id, progress)).length, total: biomes.length },
    apps: appList,
    rework: rework.slice(0, REWORK_SHOWN),
    reworkTotal: rework.length,
  };
}
