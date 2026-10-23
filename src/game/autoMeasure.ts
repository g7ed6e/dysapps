// La mesure automatique (`?mesures=auto`, ./AutoMeasure.tsx) : ce qui se calcule sans la page. Les images d'une fenêtre
// de mesure résumées (images par seconde, la plus longue), la partie de la pose (une seule mission de l'île jouée, comme
// la famille `pose` de scripts/rendu/mesures.mjs), les niveaux du tour et le tableau à copier, un résumé par niveau
// en tête.
import { BIOMES, type BiomeId } from './biomes';
import { EMPTY_STATE, type GameState, type World } from './engine/state';
import { sanitizeState } from './engine/sanitize';
import type { toutConstruitAvecLesCommandes } from './world/budget';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './world/archipelagos';

/** La progression d'une partie de mesure, telle que world/budget.ts la prépare (les étoiles en nombre). */
type Progression = ReturnType<typeof toutConstruitAvecLesCommandes>['progress'];

/** Une ligne du tableau : une étape, ce que dessine sa dernière image, et ses images. */
export interface LigneDeMesure {
  /** Le niveau mesuré (6e, 5e, 4e, 3e) ; rien : une ligne hors des niveaux. */
  niveau?: string;
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

/** Les niveaux du tour, dans l'ordre : tous ceux de l'appareil (une partie toute construite les ouvre tous). */
export const NIVEAUX_MESURES: readonly ArchipelagoId[] = ARCHIPELAGO_IDS;

/** L'île d'arrivée d'un niveau : sa première île (au 6e, la Forêt des sons, le Phare du monde ouvert). */
export function ileDuNiveau(niveau: ArchipelagoId): BiomeId | undefined {
  return BIOMES.find((b) => b.classe === niveau)?.id;
}

/** Le résumé d'un niveau : ses images par seconde les plus basses, sa plus longue image, ce qu'il dessine au plus. */
export interface ResumeDuNiveau {
  niveau: string;
  ips: number;
  pire: number;
  triangles: number;
  appels: number;
}

/** Les lignes résumées par niveau, dans l'ordre du tour ; les lignes sans niveau n'y sont pas. */
export function resumeParNiveau(lignes: readonly LigneDeMesure[]): ResumeDuNiveau[] {
  const resumes = new Map<string, ResumeDuNiveau>();
  for (const l of lignes) {
    if (!l.niveau) continue;
    const r = resumes.get(l.niveau);
    if (!r) resumes.set(l.niveau, { niveau: l.niveau, ips: l.ips, pire: l.pire, triangles: l.triangles, appels: l.appels });
    else Object.assign(r, { ips: Math.min(r.ips, l.ips), pire: Math.max(r.pire, l.pire), triangles: Math.max(r.triangles, l.triangles), appels: Math.max(r.appels, l.appels) });
  }
  return [...resumes.values()];
}

/**
 * Le tableau à copier, en Markdown : l'appareil ; s'il y a des niveaux, une ligne par niveau d'abord (le pire de ses
 * étapes) ; une ligne par étape ; puis ce qui n'a pas pu se mesurer (`notes`).
 */
export function tableauDesMesures(lignes: readonly LigneDeMesure[], appareil: string, notes: readonly string[] = []): string {
  const nombre = (n: number) => n.toLocaleString('fr-FR');
  const resumes = resumeParNiveau(lignes);
  const parNiveau = resumes.length > 0;
  return [
    `Mesure automatique · ${appareil}`,
    ...(parNiveau
      ? [
          '',
          '| Niveau | Images/s, au plus bas | Plus longue image (ms) | Triangles, au plus | Appels, au plus |',
          '| --- | ---: | ---: | ---: | ---: |',
          ...resumes.map((r) => `| ${r.niveau} | ${r.ips} | ${r.pire} | ${nombre(r.triangles)} | ${nombre(r.appels)} |`),
        ]
      : []),
    '',
    `| ${parNiveau ? 'Niveau | ' : ''}Étape | Appels | Triangles | Images/s | Plus longue image (ms) |`,
    `| ${parNiveau ? '--- | ' : ''}--- | ---: | ---: | ---: | ---: |`,
    ...lignes.map((l) => `| ${parNiveau ? `${l.niveau ?? ''} | ` : ''}${l.etape} | ${nombre(l.appels)} | ${nombre(l.triangles)} | ${l.ips} | ${l.pire} |`),
    ...(notes.length ? ['', ...notes] : []),
  ].join('\n');
}
