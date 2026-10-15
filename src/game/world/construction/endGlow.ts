// La lueur de fin d'un grand projet (proposition du directeur artistique du 10 octobre 2026, « le 4e et le 3e d'Archipéo
// au niveau du 6e et du 5e », DP-09 : la réussite a sa conséquence visible ; retenue par le mainteneur le même jour,
// « Allumer » ; Blocland l'avait déjà, world/blockMesh.ts). Quand un grand projet est fini, son bloc `litWhenDone`
// (world/monuments.ts : la cabine du portique, les bobines de la tour des signaux, les hublots de la fusée, les
// lanternons du château d'eau, la ceinture de la colonne des solides) prend la lueur fixe des fenêtres, comme le feu du
// phare du large : sa couleur le jour, la lueur la nuit, allumé le premier, sans pulser ; éteint et délavé sur une île
// fermée. C'est la seule lueur nouvelle du lot.
//
// Tout tient ici : pour la retirer, mettre `LUEUR_DE_FIN` à `false` (les blocs redeviennent ceux de leur famille, peints
// comme les autres ; rien d'autre ne change). Code pur, sans Three.js.
import type { VoxelCube } from '../cube';

/** La lueur de fin d'un grand projet est-elle dessinée ? (Retenue par le mainteneur le 10 octobre 2026.) */
export const LUEUR_DE_FIN = true;

/**
 * Les blocs qui prennent la lueur de fin : ceux qu'un grand projet fini allume (`VoxelCube.lit`, world/terrain/monuments.ts),
 * posés, sur une île ouverte (délavés, ils restent éteints). Vide si la lueur de fin n'est pas dessinée.
 */
export function allumesALaFin(cubes: readonly VoxelCube[]): Set<VoxelCube> {
  const out = new Set<VoxelCube>();
  if (!LUEUR_DE_FIN) return out;
  for (const c of cubes) if (c.lit && !c.ghost && !c.muted && !c.sol && !c.decor) out.add(c);
  return out;
}
