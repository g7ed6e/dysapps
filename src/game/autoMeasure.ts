// La mesure automatique (`?mesures=auto`, ./AutoMeasure.tsx) : ce qui se calcule sans la page. Les images d'une fenêtre
// de mesure résumées (images par seconde, la plus longue), la partie de la pose (une seule mission de l'île jouée, comme
// la famille `pose` de scripts/rendu/mesures.mjs) et le tableau à copier.
import { BIOMES, type BiomeId } from './biomes';
import { EMPTY_STATE, type GameState, type World } from './engine/state';
import { sanitizeState } from './engine/sanitize';
import type { toutConstruitAvecLesCommandes } from './world/budget';

/** La progression d'une partie de mesure, telle que world/budget.ts la prépare (les étoiles en nombre). */
type Progression = ReturnType<typeof toutConstruitAvecLesCommandes>['progress'];

/** Une ligne du tableau : une étape, ce que dessine sa dernière image, et ses images. */
export interface LigneDeMesure {
  etape: string;
  appels: number;
  triangles: number;
  /** Images par seconde sur la fenêtre de mesure. */
  ips: number;
  /** La plus longue image de la fenêtre, en millisecondes. */
  pire: number;
}

/** Les écarts entre images d'une fenêtre (en ms), résumés : images par seconde et la plus longue. */
export function resumerLesImages(ecarts: readonly number[]): { ips: number; pire: number } {
  const total = ecarts.reduce((n, e) => n + e, 0);
  if (!ecarts.length || total <= 0) return { ips: 0, pire: 0 };
  return { ips: Math.round((ecarts.length * 1000) / total), pire: Math.round(Math.max(...ecarts)) };
}

/** Une partie en mémoire, sur l'île `place`, relue comme une sauvegarde (`sanitizeState`) : l'appareil n'y est pour rien. */
export function partieDeMesure(progress: Progression, world: World, place: BiomeId): GameState {
  return sanitizeState({ ...EMPTY_STATE, progress, world: { ...world, place } });
}

/**
 * La partie de la pose : l'île `ile` n'a que sa première mission terminée (ses autres exercices et son Gardien retirés),
 * sans quoi l'ouverture poserait aussitôt les parties suivantes ; le reste tout construit.
 */
export function partieDeLaPose(progress: Progression, world: World, ile: BiomeId): GameState {
  const premiere = BIOMES.find((b) => b.id === ile)?.exercises[0]?.id;
  const garde = (cle: string) => !cle.startsWith(`${ile}-`) || (premiere !== undefined && cle.startsWith(`${ile}-${premiere}-`));
  return partieDeMesure(Object.fromEntries(Object.entries(progress).filter(([k]) => garde(k))), world, ile);
}

/** Le tableau à copier, en Markdown : l'appareil, une ligne par étape, puis ce qui n'a pas pu se mesurer (`notes`). */
export function tableauDesMesures(lignes: readonly LigneDeMesure[], appareil: string, notes: readonly string[] = []): string {
  const nombre = (n: number) => n.toLocaleString('fr-FR');
  return [
    `Mesure automatique · ${appareil}`,
    '',
    '| Étape | Appels | Triangles | Images/s | Plus longue image (ms) |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...lignes.map((l) => `| ${l.etape} | ${nombre(l.appels)} | ${nombre(l.triangles)} | ${l.ips} | ${l.pire} |`),
    ...(notes.length ? ['', ...notes] : []),
  ].join('\n');
}
