// La place d'une petite construction livrée (GD-7), écrite dans world/fixtures.ts, et ses cases dans le monde.
import { type BiomeId, BIOMES } from '../../biomes';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, placeEcrite } from '../fixtures';
import { islandOrigin } from './base';

/**
 * Où se pose la petite construction d'une commande livrée (GD-7, PR 3) : le coin (x, y) de sa forme, relatif au cœur de
 * l'île. Une donnée fixe (`placeDeLaPetiteConstruction`, world/fixtures.ts), que ce calcul refait et que le
 * test compare : rien ne se calcule au toucher de « Livrer ». Sur une autre île, `null` : le test l'interdit.
 */
export function placeDeLaPetiteConstruction(_id: BiomeId, fixture: string): { x: number; y: number } | null {
  return placeEcrite(fixture);
}

/**
 * Les cases de la petite construction d'une commande (GD-7, PR 3), en clés « x,y,z » du monde, là où `poserLIle` la
 * dessine, son eau comprise : la vague de la livraison les pose (world/wave.ts). Vide si elle n'a pas de place.
 */
export function casesDeLaPetiteConstructionDansLeMonde(id: BiomeId, fixture: string): Set<string> {
  const out = new Set<string>();
  const place = placeDeLaPetiteConstruction(id, fixture);
  if (!place) return out;
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  for (const c of casesDeLaPetiteConstruction(fixture) ?? []) out.add(`${ox + place.x + c.x},${oy + place.y + c.y},${oz + c.z + 1}`);
  for (const [x, y, z] of eauDeLaPetiteConstruction(fixture)) out.add(`${ox + place.x + x},${oy + place.y + y},${oz + z + 1}`);
  return out;
}
