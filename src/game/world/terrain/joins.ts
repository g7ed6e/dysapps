// La construction qui réunit deux lieux (GD-9, point 10), entre leurs côtes : dans Blocland, une digue de cubes d'herbe
// sur la pierre, avec ses marches ; dans Archipéo, une jetée de pierre, simple. Une case posée est pleine jusqu'au pied
// de la terre des îles (`DEPTH`), sans dessous ; une case à poser est un fantôme du dessus. Tous ses cubes se touchent
// pour ouvrir son panneau, comme un monument.
import { BLOC, BLOCKS } from '../../biomes';
import type { World } from '../../engine';
import type { ArchipelagoId } from '../archipelagos';
import type { VoxelCube } from '../cube';
import { GRASS } from '../decor';
import { appliedJoins } from '../join';
import { planCells } from '../plans';
import { DEPTH, TEXTURES } from './base';

/** Les cubes des constructions qui réunissent deux lieux d'un archipel. `pierre` : une jetée de pierre (Archipéo). */
export function joinsBetween(a: ArchipelagoId, village: World, cubes: VoxelCube[], pierre: boolean): void {
  const roche = BLOCKS[BLOC.pierre].side;
  const dessus = pierre ? roche : GRASS;
  for (const j of appliedJoins(a)) {
    const place = `monument:${j.plan.id}` as const;
    const posees = new Set(village.parts[j.plan.id] ?? []);
    const cles = planCells(j.plan);
    const alt = j.shape.cells[0]?.z - j.shape.cells[0]?.k;
    j.shape.cells.forEach((c, i) => {
      const tag = j.pair[c.half === 'a' ? 0 : 1];
      if (!posees.has(cles[i].key)) {
        cubes.push({ x: c.x, y: c.y, z: c.z, color: dessus, texture: TEXTURES[dessus], tag, ghost: true, place });
        return;
      }
      cubes.push({ x: c.x, y: c.y, z: c.z, color: dessus, texture: TEXTURES[dessus], tag, place });
      for (let z = c.z - 1; z >= alt - DEPTH; z--) cubes.push({ x: c.x, y: c.y, z, color: roche, texture: 'pierre', tag, place, sansDessous: z === alt - DEPTH ? true : undefined });
    });
  }
}
