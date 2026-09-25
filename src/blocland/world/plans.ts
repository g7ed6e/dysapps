// Les plans du village : un bâtiment en ruine par île, à reconstruire bloc par bloc.
// Chaque plan est un fichier JSON (cellules relatives à la zone des plans de l'île).
import type { BiomeId, BlockId } from '../biomes';
import carriereFour from './plans/carriere-four.json';
import fermeEtable from './plans/ferme-etable.json';
import foretCabane from './plans/foret-cabane.json';
import mineForge from './plans/mine-forge.json';
import tourPhare from './plans/tour-phare.json';

export interface PlanCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
}

export interface PlanDef {
  id: string;
  biome: BiomeId;
  name: string;
  /** Coin du bâtiment dans la zone des plans de l'île. */
  origin: { x: number; y: number };
  cells: PlanCell[];
  reward: { xp: number; chest: Partial<Record<BlockId, number>> };
  /** Ce que dit la créature quand le plan est terminé. */
  done: string;
}

/** Zone des plans de chaque île (coordonnées relatives à l'île) : plate, sans décor. */
export const PLAN_ZONE = { x: 6, y: 7, w: 6, h: 5 };

export const PLANS: PlanDef[] = [foretCabane, mineForge, carriereFour, fermeEtable, tourPhare] as PlanDef[];

export function plansFor(biome: BiomeId): PlanDef[] {
  return PLANS.filter((p) => p.biome === biome);
}

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Cellules d'un plan en coordonnées relatives à l'île (z = 0 : premier bloc sur le sol). */
export function planCells(plan: PlanDef): (PlanCell & { key: string })[] {
  return plan.cells.map((c) => {
    const x = PLAN_ZONE.x + plan.origin.x + c.x;
    const y = PLAN_ZONE.y + plan.origin.y + c.y;
    return { x, y, z: c.z, block: c.block, key: cellKey(x, y, c.z) };
  });
}
