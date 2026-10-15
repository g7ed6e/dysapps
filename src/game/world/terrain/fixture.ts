// La place d'une petite construction livrée (GD-7), écrite dans world/fixtures.ts, et ses cases dans le monde.
import { type BiomeId, BIOMES } from '../../biomes';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, placeEcrite } from '../fixtures';
import { islandDef } from '../map';
import { turnCell, turnPoint } from '../placement';
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
 * La pose d'une petite construction dans le monde, comme `poserLIle` la dessine : son coin sur l'île, l'origine de
 * l'île et son orientation (GD-9 : l'île tourne d'un bloc autour du milieu de son cœur, ses petites constructions
 * avec elle, `turnCell`). `case` : la clé « x,y,z » du monde d'une case de la forme ; `point` : un point de la forme (en
 * cases, depuis son coin et le sol) dans le repère de Three du monde (X = x, Y = la hauteur, Z = y). `null` sans place.
 */
export function poseDeLaPetiteConstruction(
  id: BiomeId,
  fixture: string,
): { case: (x: number, y: number, z: number) => string; point: (x: number, y: number, z: number) => [number, number, number] } | null {
  const place = placeDeLaPetiteConstruction(id, fixture);
  if (!place) return null;
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  const q = islandDef(id).quarts;
  return {
    case: (x, y, z) => {
      const t = turnCell(place.x + x, place.y + y, q);
      return `${ox + t.x},${oy + t.y},${oz + z + 1}`;
    },
    point: (x, y, z) => {
      const t = turnPoint(place.x + x, place.y + y, q);
      return [ox + t.x, oz + 1 + z, oy + t.y];
    },
  };
}

/**
 * Les cases de la petite construction d'une commande (GD-7, PR 3), en clés « x,y,z » du monde, là où `poserLIle` la
 * dessine, son eau comprise, tournées avec l'île (GD-9) : la vague de la livraison les pose (world/wave.ts). Vide si
 * elle n'a pas de place.
 */
export function casesDeLaPetiteConstructionDansLeMonde(id: BiomeId, fixture: string): Set<string> {
  const out = new Set<string>();
  const pose = poseDeLaPetiteConstruction(id, fixture);
  if (!pose) return out;
  for (const c of casesDeLaPetiteConstruction(fixture) ?? []) out.add(pose.case(c.x, c.y, c.z));
  for (const [x, y, z] of eauDeLaPetiteConstruction(fixture)) out.add(pose.case(x, y, z));
  return out;
}
