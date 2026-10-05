// Le mode bâtisseur : une copie de la partie où tout se construit. Les blocs ne manquent jamais, les ponts sont posés
// et les Gardiens comptent comme vaincus (le Bloc-Navire peut partir). Il vit en mémoire seulement : la sauvegarde est
// gelée pendant qu'il est ouvert, et le quitter recharge la vraie partie.
import { BLOCKS, BIOMES, type BlockId } from './biomes';
import { STARS_TO_BEAT, bossId } from './bossCore';
import type { GameState } from './engine';
import { ARCHIPELAGOS, grantAccess, relierLaRegion } from './world/archipelago';

/** Les blocs de chaque sorte, remis à ce compte après chaque pose. */
export const BLOCS_DU_BATISSEUR = 999;

/** L'inventaire plein. */
function inventairePlein(): Partial<Record<BlockId, number>> {
  return Object.fromEntries(Object.keys(BLOCKS).map((b) => [b, BLOCS_DU_BATISSEUR])) as Partial<Record<BlockId, number>>;
}

/** Remet l'inventaire plein (après une pose, un pont). */
export function remplir(state: GameState): GameState {
  return { ...state, stock: inventairePlein() };
}

/** La copie de la partie qu'ouvre le mode bâtisseur. Les plans déjà posés restent posés. */
export function bacASable(state: GameState): GameState {
  const progress = { ...state.progress };
  for (const b of BIOMES) {
    const id = bossId(b.id);
    const avant = progress[id];
    if ((avant?.stars ?? 0) < STARS_TO_BEAT) progress[id] = { stars: STARS_TO_BEAT, attempts: avant?.attempts ?? 0, best: avant?.best ?? 1 };
  }
  // Chaque région toute reliée (GD-9) : les liaisons de l'élève, puis la plus courte vers chaque lieu encore fermé.
  const relie = ARCHIPELAGOS.reduce<string[]>((links, a) => relierLaRegion(a.classe, links), [...state.world.links]);
  const bridges = grantAccess(relie, BIOMES.map((b) => b.id));
  return { ...state, progress, stock: inventairePlein(), world: { ...state.world, links: bridges } };
}
