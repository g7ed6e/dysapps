import type { BlockId } from './biomes';
import type { FillResult } from './engine';
import { planCells, type PlanDef } from './world/plans';

export type { Burst } from './world/view';

/**
 * Pose d'un coup toutes les cases d'un plan posé case par case (le Bloc-Navire, un monument) que l'inventaire permet,
 * dans l'ordre du plan. Le contexte suit l'inventaire à chaque pose : une case dont le bloc manque est sautée. Le
 * bâtiment d'une île ne passe plus par ici : ses parties se posent toutes seules, une par mission réussie (GD-6).
 */
export function placeAll(
  plan: PlanDef,
  done: string[],
  fillPlan: (plan: PlanDef, x: number, y: number, z: number) => FillResult,
): { placed: number; last: { x: number; y: number; z: number; block: BlockId } | null; completed: boolean } {
  const already = new Set(done);
  let placed = 0;
  let last: { x: number; y: number; z: number; block: BlockId } | null = null;
  let completed = false;
  for (const c of planCells(plan)) {
    if (already.has(c.key)) continue;
    const r = fillPlan(plan, c.x, c.y, c.z);
    if (!r.ok) continue;
    placed += 1;
    last = { x: c.x, y: c.y, z: c.z, block: r.block };
    if (r.completed) completed = true;
  }
  return { placed, last, completed };
}
