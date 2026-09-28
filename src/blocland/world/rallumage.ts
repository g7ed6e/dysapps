// Le moment du rallumage (lot 6, fil B2), sans React : quels Gardiens rallumés au défi attendent encore de se rallumer
// dans le monde, sur cet appareil. Le moment ne se garde pas dans la sauvegarde : il se déduit de la progression et de
// ce que l'appareil a déjà vu (comme le mot de la baleine).
import { BIOMES, type BiomeId } from '../biomes';
import { isBossBeaten } from '../boss';
import type { ArchipelagoId } from './archipelago';

/** Au plus trois moments de suite : au-delà, les autres sentinelles s'allument sans moment. */
export const MOMENTS_DE_SUITE = 3;

/**
 * Le déroulé d'un moment, en millisecondes : l'attente avant (la fin d'une arrivée), la caméra qui glisse vers la
 * sentinelle, le fondu, la vue qui reste, et le temps entre deux sentinelles.
 */
export const DEROULE = { attente: 1200, camera: 1000, fondu: 1800, reste: 1500, entreDeux: 500 } as const;

/** Les Gardiens dont l'appareil a vu le rallumage (ou qu'il a notés vus sans moment). */
export type RallumagesVus = Partial<Record<BiomeId, boolean>>;

/** Les Gardiens rallumés au défi, dans l'ordre des îles, dans l'archipel `a` ou partout. */
export function gardiensRallumes(progress: Record<string, { stars: number }>, a?: ArchipelagoId): BiomeId[] {
  return BIOMES.filter((b) => (!a || b.classe === a) && isBossBeaten(b.id, progress)).map((b) => b.id);
}

/** Les Gardiens de l'archipel `a` dont le rallumage n'a pas encore été vu dans le monde, dans l'ordre des îles. */
export function aRallumer(progress: Record<string, { stars: number }>, a: ArchipelagoId, vus: RallumagesVus): BiomeId[] {
  return gardiensRallumes(progress, a).filter((id) => !vus[id]);
}

/**
 * Ce qu'il faut noter vu sans moment : tout Gardien rallumé quand le moment n'est pas montré (un univers sans
 * sentinelles, la bascule, une première ouverture) ; sinon, ceux qui dépassent les trois moments de suite.
 */
export function vusSansMoment(progress: Record<string, { stars: number }>, a: ArchipelagoId, vus: RallumagesVus, actif: boolean): BiomeId[] {
  if (!actif) return gardiensRallumes(progress).filter((id) => !vus[id]);
  return aRallumer(progress, a, vus).slice(MOMENTS_DE_SUITE);
}
