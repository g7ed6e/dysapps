// Les révisions du jour : les items ratés reviennent à J+1, J+3, J+7, J+15 (répétition espacée, `engine.ts`). Ici, ce
// que l'appli en fait : quels exercices et quelles missions ont des items à revoir aujourd'hui.
import { getBiome, missionsJouables, type BiomeId } from './biomes';
import { dueItems, todayISO, type SpacedItem } from './engine';
import { CATALOG } from './exercises';
import { isBiomeUnlocked } from './world/archipelago';

/** L'exercice d'un item de la file (« french-6e-phonology-syllables-warmup-001:cabane » → « french-6e-phonology-syllables-warmup-001 »). */
const exerciseOf = (itemId: string) => itemId.slice(0, itemId.lastIndexOf(':'));
const keyOf = (itemId: string) => itemId.slice(itemId.lastIndexOf(':') + 1);

/** Les exercices qui ont des items à revoir aujourd'hui. */
export function exercisesToReview(spaced: SpacedItem[], today = todayISO()): Set<string> {
  return new Set(dueItems(spaced, today).map((s) => exerciseOf(s.itemId)));
}

/** Les clés des items d'un exercice à revoir aujourd'hui. */
export function reviewKeys(spaced: SpacedItem[], exerciseId: string, today = todayISO()): string[] {
  return dueItems(spaced, today)
    .filter((s) => exerciseOf(s.itemId) === exerciseId)
    .map((s) => keyOf(s.itemId));
}

export interface ReviewQuest {
  biome: BiomeId;
  type: string;
  /** « Abattage syllabique · Forêt des sons ». */
  label: string;
  path: string;
}

/** Les missions à reprendre aujourd'hui (une par île et par mission), sur les îles ouvertes, dans l'ordre du catalogue. */
export function questsToReview(spaced: SpacedItem[], bridges: string[], today = todayISO()): ReviewQuest[] {
  const ids = exercisesToReview(spaced, today);
  const seen = new Set<string>();
  const out: ReviewQuest[] = [];
  for (const meta of CATALOG) {
    if (!ids.has(meta.id)) continue;
    const key = `${meta.biome}/${meta.type}`;
    if (seen.has(key) || !isBiomeUnlocked(meta.biome, bridges)) continue;
    seen.add(key);
    const biome = getBiome(meta.biome);
    const title = biome && missionsJouables(biome).find((e) => e.id === meta.type)?.title;
    if (!biome || !title) continue;
    out.push({ biome: meta.biome, type: meta.type, label: `${title} · ${biome.name}`, path: `/aventure/${meta.biome}/${meta.type}` });
  }
  return out;
}
