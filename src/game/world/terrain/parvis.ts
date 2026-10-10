// Le parvis d'une île au cœur d'herbe (DA, captures emc-4e-3e-1, 10 octobre 2026) : aux quatre îles d'EMC et de
// latin-grec du 4e et du 3e, le cœur est d'herbe, et le bloc de l'île n'est plus au sol qu'en une allée qui mène du bord
// de devant du cœur (celui des bornes, vers la caméra) à la zone des plans, bordée de pierre de chaque côté. Ce qui se
// construit s'y détache, de près comme sur la Carte, le jour comme la nuit. Code pur, commun aux deux univers : le sol
// d'Archipéo lit les mêmes cubes (world/landMesh.ts).
import type { BiomeId } from '../../biomes';
import { bornesDuCoeur, islandDef } from '../map';
import { PLAN_ZONE } from '../plans';

/** Les îles au cœur d'herbe qui gardent leur bloc en parvis. */
export const ILES_A_PARVIS: ReadonlySet<BiomeId> = new Set<BiomeId>([
  'civics-4e-rights-freedoms',
  'lca-4e-cities',
  'civics-3e-democratic-life',
  'lca-3e-ideas',
]);

/**
 * L'allée : deux cases de large, au milieu de la zone des plans (x 10 et 11 pour la zone 8 à 13), une bordure d'une case
 * de chaque côté ; elle va du bord de devant du cœur (y0) jusqu'à la rangée qui touche la zone des plans.
 */
const ALLEE = { large: 2, bordure: 1 } as const;

/** Ce qu'est la case (x, y) du cœur (coordonnées depuis le coin du cœur d'origine, l'île pas tournée) : l'allée, sa bordure, ou rien. */
export function caseDuParvis(id: BiomeId, x: number, y: number): 'allee' | 'bordure' | null {
  if (!ILES_A_PARVIS.has(id)) return null;
  const b = bornesDuCoeur(islandDef(id));
  if (y < b.y0 || y >= PLAN_ZONE.y) return null;
  const x0 = PLAN_ZONE.x + (PLAN_ZONE.w - ALLEE.large) / 2;
  if (x >= x0 && x < x0 + ALLEE.large) return 'allee';
  if ((x >= x0 - ALLEE.bordure && x < x0) || (x >= x0 + ALLEE.large && x < x0 + ALLEE.large + ALLEE.bordure)) return 'bordure';
  return null;
}
