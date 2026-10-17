// Les aménagements du monde ouvert, vus par la vue (GD-20, point 4, piste B, lot L0) : le dessin de chaque petite
// construction du 6e, celui de la grille d'Archipéo (world/objects/), tracé ici dans son atelier, de près, sans feu (le
// monde ouvert n'a pas de nuit, et les lanternes restent éteintes : leurs vitres en verre mat), puis donné au monde
// continu qui le pose (world/continu/amenagements.ts). Un aménagement se montre quand sa petite construction est posée
// dans la sauvegarde (`world.parts`, comme dans la grille) : posé dans la grille, il l'est ici, et inversement, sans rien
// de neuf dans la sauvegarde. C'est le seul fichier qui lise à la fois la grille et le monde continu pour eux. Sans
// Three.js : testé sous jsdom.
import { AMENAGEMENTS, ASSISE_TRIANGLES, MATTE_GLASS, amenagementById, placeAmenagement, type DrawnObject, type PlacedAmenagement } from '../../world/continu/amenagements';
import type { PlaceId } from '../../world/continu/plan6e';
import { Pinceau, type V3 } from '../../world/decor/brush';
import { estPosee } from '../../world/fixtures';
import { ASSEMBLIES } from '../../world/objects/assemblies';
import { paintFor } from '../../world/objects/pieces';
import { SILHOUETTES, type ObjectDrawing } from '../../world/objects/silhouettes';
import { Workshop, type Tint } from '../../world/objects/workshop';
import { OBJECT_COLORS } from '../../world/objects/pieces';
import { BIOMES, BLOC } from '../../biomes';

/** L'osier du panier de la potence. */
const WICKER = 0xb8894f;

/**
 * La grue des Archives dans le monde ouvert : une potence de façade (directeur artistique, avis sur le lot L0, 17 octobre
 * 2026, point 7), et non la grue de chantier de la grille, qui rappellerait celle des Quais. Le mât de bois sur son pied
 * de pierre, cerclé de fer ; puis la flèche courte (le madrier livré, la matière du bloc assemblé du 6e, comme dans la
 * grille), sa jambe de force, la poulie, la corde et le panier d'osier qui pend à mi-hauteur. Ni treillis, ni
 * contrepoids, ni caisse. La flèche part le long de x (vers l'ouest une fois posée), longue d'au plus un tiers du mât.
 * Deux éléments : le mât, puis la flèche et ce qu'elle porte. Dans le repère de grille (x, y au sol, z vers le haut).
 */
export const POTENCE = { mast: 3.0, jib: 0.5 } as const;

const potence: ObjectDrawing = (at, pe) => {
  const C = OBJECT_COLORS;
  const wood = pe.color(C.wood);
  const iron = pe.color(C.iron);
  const stone = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const [mx, my, top] = [0.5, 0.5, POTENCE.mast];
  // Le pied de pierre, le mât, ses deux cercles de fer.
  at.block(mx, my, 0.5, 0.5, 0, 0.2, stone);
  at.block(mx, my, 0.3, 0.3, 0.2, top, wood, { bottom: true });
  for (const z of [0.95, 1.95]) at.block(mx, my, 0.36, 0.36, z, z + 0.1, iron, { bottom: true });
  at.part();
  // La flèche, de l'arrière du mât à son bout ; sa jambe de force ; la poulie, la corde, le panier.
  const end = mx + POTENCE.jib;
  at.box(mx - 0.15, end, my - 0.11, my + 0.11, top - 0.22, top, pe.block(BLOC.poutre), {});
  at.beam([mx + 0.15, my, top - 0.75], [mx + 0.42, my, top - 0.22], 0.08, wood);
  const hang = end - 0.1;
  at.roller('y', my - 0.08, my + 0.08, hang, top - 0.3, 0.08, 6, iron);
  at.beam([hang, my, top - 0.38], [hang, my, 1.72], 0.035, pe.color(C.lightWood));
  at.prism(hang, my, 0.11, 0.15, 1.4, 1.72, 6, pe.color(WICKER));
};

/**
 * Les dessins du 6e, par identifiant de petite construction : ceux de la grille ; la grue des Archives, sa potence de
 * façade.
 */
const DRAWINGS: Readonly<Record<string, ObjectDrawing>> = { ...SILHOUETTES, ...ASSEMBLIES, 'french-6e-word-spelling-fixture-1': potence };

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

/** Ce que coûtent les dix-neuf aménagements posés, dans le maillage des lieux : leurs triangles (et ceux des assises), aucun appel de plus. */
export function amenagementsCost(): { triangles: number; calls: number } {
  return { triangles: AMENAGEMENTS.reduce((n, a) => n + drawnObject(a.id).positions.length / 9 + (a.assise || a.scene ? ASSISE_TRIANGLES : 0), 0), calls: 0 };
}
