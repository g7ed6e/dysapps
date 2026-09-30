// Ce que la caméra et les étiquettes d'Archipéo gardent en vue (revue d'ensemble du directeur artistique, DA-17 et
// DA-18) : les grands repères, visibles de loin, que la vue d'une île ou de l'archipel ne coupe jamais et qu'aucune
// étiquette ne couvre. Aujourd'hui le seul grand phare des Îles du Ciel. Code pur, sans Three.js ; seul l'habillage
// d'Archipéo le lit (`reperes: 'cadres'`) : Blocland garde son cadrage.
import type { BiomeId } from '../biomes';
import { archipelagoOfIsland } from './archipels';
import type { ArchipelagoId } from './archipelago';
import { GRAND_PHARE_3E } from './decor/3e';
import { viewZone } from './terrain';

export interface RepereCadre {
  /** L'île qui le porte. */
  ile: BiomeId;
  /** Le centre de son pied, en cases du monde. */
  x: number;
  y: number;
  /** Le bas et le haut de ce qui se voit (en hauteur du monde, en cases). */
  pied: number;
  haut: number;
  /** Son rayon, en cases : la largeur de la colonne qu'aucune étiquette ne couvre. */
  rayon: number;
  /** Le pivot ajouté à la vue de l'archipel depuis certaines îles (radians), pour que son sommet se découpe sur le ciel. */
  pivot?: Partial<Record<BiomeId, number>>;
}

export const REPERES_CADRES: readonly RepereCadre[] = [GRAND_PHARE_3E];

/**
 * Comment la caméra garde le repère en vue : sa cible glisse de `vers` (en part du chemin) vers le pied du repère, et
 * elle recule de `recul` fois. Dans la vue de l'archipel (autour du bonhomme), dès que l'île du repère est dans la zone
 * cadrée, sauf depuis cette île même, que la vue montre déjà, et depuis une île d'où la vue pivote pour lui (son
 * `pivot` y joue seul : l'île de la vue reste au premier plan) ; dans la vue d'une
 * île, quand c'est la sienne (le panneau de l'île couvre la moitié droite de l'écran : le
 * repère, au fond de l'île, passait au-dessus du cadre).
 */
export const CADRAGE_DU_REPERE = {
  zone: { vers: 0.4, recul: 1.1 },
  ile: { vers: 0.3, recul: 1.3 },
} as const;

/** Les repères cadrés d'un archipel. */
export function reperesDe(a: ArchipelagoId): RepereCadre[] {
  return REPERES_CADRES.filter((r) => archipelagoOfIsland(r.ile) === a);
}

/**
 * Le repère qu'une vue garde en vue : celui de l'île ouverte (`island`), sinon, autour du bonhomme posé sur `zone`,
 * celui dont le pied est dans la zone cadrée (son île et ses voisines par un ouvrage) ; `null` s'il n'y en a pas.
 */
export function repereDeLaVue(island: BiomeId | null, zone: BiomeId | null): RepereCadre | null {
  if (island) return REPERES_CADRES.find((r) => r.ile === island) ?? null;
  if (!zone) return null;
  const a = archipelagoOfIsland(zone);
  const z = viewZone(zone);
  return reperesDe(a).find((r) => r.x >= z.minX && r.x <= z.maxX && r.y >= z.minY && r.y <= z.maxY) ?? null;
}
