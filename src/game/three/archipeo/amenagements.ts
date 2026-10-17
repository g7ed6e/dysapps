// Les aménagements du monde ouvert, vus par la vue (GD-20, point 4, piste B, lot L0) : le dessin de chaque petite
// construction du 6e, celui de la grille d'Archipéo (world/objects/), tracé ici dans son atelier, de près, sans feu (le
// monde ouvert n'a pas de nuit, et les lanternes restent éteintes : leurs vitres en verre mat), puis donné au monde
// continu qui le pose (world/continu/amenagements.ts). Un aménagement se montre quand sa petite construction est posée
// dans la sauvegarde (`world.parts`, comme dans la grille) : posé dans la grille, il l'est ici, et inversement, sans rien
// de neuf dans la sauvegarde. C'est le seul fichier qui lise à la fois la grille et le monde continu pour eux. Sans
// Three.js : testé sous jsdom.
import { AMENAGEMENTS, MATTE_GLASS, amenagementById, placeAmenagement, type DrawnObject, type PlacedAmenagement } from '../../world/continu/amenagements';
import type { PlaceId } from '../../world/continu/plan6e';
import { Pinceau, type V3 } from '../../world/decor/brush';
import { estPosee } from '../../world/fixtures';
import { ASSEMBLIES } from '../../world/objects/assemblies';
import { paintFor } from '../../world/objects/pieces';
import { SILHOUETTES, type ObjectDrawing } from '../../world/objects/silhouettes';
import { Workshop, type Tint } from '../../world/objects/workshop';
import { BIOMES } from '../../biomes';

/** Les dessins du 6e (ceux de la grille), par identifiant de petite construction. */
const DRAWINGS: Readonly<Record<string, ObjectDrawing>> = { ...SILHOUETTES, ...ASSEMBLIES };

/** Un atelier dont les vitres (le feu de la grille) restent dans l'opaque, en verre mat : une lanterne éteinte. */
class MatteWorkshop extends Workshop {
  override tri(a: V3, b: V3, c: V3, inside: V3, t: Tint, pane = false): void {
    super.tri(a, b, c, inside, pane ? MATTE_GLASS : t, false);
  }

  override quad(a: V3, b: V3, c: V3, d: V3, inside: V3, t: Tint, pane = false): void {
    super.quad(a, b, c, d, inside, pane ? MATTE_GLASS : t, false);
  }
}

/** Le dessin de la grille d'un aménagement, de près, en facettes brutes dans le repère de sa forme. */
export function drawnObject(id: string): DrawnObject {
  const draw = DRAWINGS[id];
  const island = id.replace(/-fixture-\d+$/, '');
  if (!draw || !BIOMES.some((b) => b.id === island)) throw new Error(`Aménagement sans dessin : ${id}`);
  const at = new MatteWorkshop(new Pinceau(), null, (x, y, z) => [x, z, y]);
  draw(at, paintFor('6e', island, false), false);
  const f = at.opaque.fin();
  return { positions: f.positions, normals: f.normals, colors: f.colors, marks: [...at.marks] };
}

const placed = new Map<string, PlacedAmenagement>();

/** Un aménagement posé dans le monde (fait une fois : son sol ne change pas). */
export function placedAmenagement(id: string, ground: (x: number, z: number) => number): PlacedAmenagement {
  let p = placed.get(id);
  if (!p) {
    const a = amenagementById(id);
    if (!a) throw new Error(`Aménagement inconnu : ${id}`);
    placed.set(id, (p = placeAmenagement(a, drawnObject(id), ground)));
  }
  return p;
}

/** Les aménagements posés dans une sauvegarde, lieu par lieu (leurs identifiants, dans l'ordre de la table). */
export function posedAmenagements(parts: Record<string, string[]>): Record<PlaceId, string[]> {
  const out = {} as Record<PlaceId, string[]>;
  for (const a of AMENAGEMENTS) (out[a.place] ??= []).push(...(estPosee(parts, a.id) ? [a.id] : []));
  return out;
}

/** Ce que coûtent les dix-neuf aménagements posés, dans le maillage des lieux : leurs triangles, aucun appel de plus. */
export function amenagementsCost(): { triangles: number; calls: number } {
  return { triangles: AMENAGEMENTS.reduce((n, a) => n + drawnObject(a.id).positions.length / 9, 0), calls: 0 };
}
