// Les aménagements du monde ouvert, vus par la vue (GD-20, point 4, piste B, lot L0) : le dessin de chaque petite
// construction du 6e, celui de la grille d'Archipéo (world/objects/), tracé ici dans son atelier, de près, sans feu (le
// monde ouvert n'a pas de nuit, et les lanternes restent éteintes : leurs vitres en verre mat), puis donné au monde
// continu qui le pose (world/continu/amenagements.ts). Un aménagement se montre quand sa petite construction est posée
// dans la sauvegarde (`world.parts`, comme dans la grille) : posé dans la grille, il l'est ici, et inversement, sans rien
// de neuf dans la sauvegarde. C'est le seul fichier qui lise à la fois la grille et le monde continu pour eux. Sans
// Three.js : testé sous jsdom.
import { AMENAGEMENTS, ASSISE_TRIANGLES, MATTE_GLASS, QUAI_TRIANGLES, amenagementById, placeAmenagement, type DrawnObject, type PlacedAmenagement } from '../../world/continu/amenagements';
import type { PlaceId } from '../../world/continu/levelPlan';
import { Pinceau, type V3 } from '../../world/decor/brush';
import { estPosee } from '../../world/fixtures';
import { ASSEMBLIES } from '../../world/objects/assemblies';
import { OBJECT_COLORS, paintFor, tableOnLegs } from '../../world/objects/pieces';
import { SILHOUETTES, type ObjectDrawing } from '../../world/objects/silhouettes';
import { Workshop, type Tint } from '../../world/objects/workshop';
import { BIOMES, BLOC } from '../../biomes';

/** L'osier du panier de la potence. */
const WICKER = 0xb8894f;

/**
 * Le mât de la potence : un bois goudronné, sombre (relecture du lot L0, 17 octobre 2026 : le brun moyen du bois de la
 * grille se confondait avec la roche de l'éperon). Sa valeur tranche sur la façade de calcaire et sur la roche éclairée
 * (au moins 3:1 mesuré à l'écran), sans aller au noir ; ses deux cerclages, de fer brut gris (`MAST_IRON`), se lisent sur
 * lui et le disent mât, et non colonne. Un mât clair, essayé d'abord, se perdait dans les colonnes (1:1).
 */
const MAST_WOOD = { dessus: 0x5a4030, cote: 0x4a3526 } as const;
const MAST_IRON = 0x8e8c84;

/**
 * La grue des Archives dans le monde ouvert : une potence de façade (directeur artistique, avis sur le lot L0, 17 octobre
 * 2026, point 7, puis deuxième passe, point A), et non la grue de chantier de la grille, qui rappellerait celle des Quais.
 * Le mât de bois sur son pied de pierre, fin, cerclé de fer deux fois ; puis la flèche (le madrier livré, la matière du
 * bloc assemblé du 6e, comme dans la grille), qui part un peu sous le haut du mât (du jour sous l'architrave) vers
 * l'avant et l'ouest, à 45 degrés, au-dessus du socle, loin de l'éperon de roche ; sa jambe de force ; sous son bout, la
 * poulie, la corde et le panier d'osier qui pend à mi-hauteur. Ni treillis, ni contrepoids, ni caisse. La flèche, de
 * l'axe du mât à son bout, entre un quart et un tiers du mât (`jib`), dans la direction `toward` (x vers l'ouest une fois
 * posée, −y vers la caméra). Deux éléments : le mât, puis la flèche et ce qu'elle porte. Dans le repère de grille (x, y
 * au sol, z vers le haut).
 */
export const POTENCE = { mast: 3.0, jib: 0.8, side: 0.24, toward: [Math.SQRT1_2, -Math.SQRT1_2] } as const;

const potence: ObjectDrawing = (at, pe) => {
  const C = OBJECT_COLORS;
  const wood = pe.color(C.wood);
  const iron = pe.color(C.iron);
  const stone = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const mastWood = { dessus: pe.color(MAST_WOOD.dessus), cote: pe.color(MAST_WOOD.cote) };
  const [mx, my, top, side] = [0.5, 0.5, POTENCE.mast, POTENCE.side];
  const [ux, uy] = POTENCE.toward;
  /** Un point de la flèche, à `d` de l'axe du mât, à la hauteur `z`. */
  const along = (d: number, z: number): V3 => [mx + ux * d, my + uy * d, z];
  // Le pied de pierre, le mât, ses deux cercles de fer.
  at.block(mx, my, 0.5, 0.5, 0, 0.2, stone);
  at.block(mx, my, side, side, 0.2, top, mastWood, { bottom: true });
  for (const z of [0.95, 1.95]) at.block(mx, my, side + 0.06, side + 0.06, z, z + 0.1, pe.color(MAST_IRON), { bottom: true });
  at.part();
  // La flèche, de l'arrière du mât à son bout, son dessus une demi-épaisseur sous le haut du mât ; sa jambe de force ; sous
  // son bout, la poulie, la corde, le panier.
  const [jibTop, jibSide] = [top - 0.12, 0.22];
  const jibAxis = jibTop - jibSide / 2;
  at.beam(along(-0.1, jibAxis), along(POTENCE.jib, jibAxis), jibSide, pe.block(BLOC.poutre), true);
  at.beam(along(side / 2, jibAxis - 0.8), along(0.5, jibAxis - jibSide / 2), 0.08, wood);
  const hang = POTENCE.jib - 0.1;
  const pulley = jibAxis - jibSide / 2 - 0.08;
  const [wx, wy] = [-uy * 0.08, ux * 0.08];
  const h = along(hang, pulley);
  at.tube([h[0] - wx, h[1] - wy, pulley], [h[0] + wx, h[1] + wy, pulley], 0.08, 0.08, 6, iron, { a: iron, b: iron });
  at.beam(along(hang, pulley - 0.08), along(hang, 1.72), 0.035, pe.color(C.lightWood));
  at.prism(h[0], h[1], 0.11, 0.15, 1.4, 1.72, 6, pe.color(WICKER));
};

/** Le nichoir de la grille. */
const birdhouse = SILHOUETTES['life-earth-sciences-6e-living-world-fixture-1'];

/**
 * Le nichoir de la Mangrove dans le monde ouvert (deuxième passe du directeur artistique, point B) : celui de la grille,
 * tourné d'un quart de tour sur le platelage, son pignon et son toit à deux pentes vers la caméra ; ses trois trous, sur
 * le long côté, se cachent alors sous le toit. Sur la maison, côté pignon (−x de la grille), une entrée ronde, sombre, en
 * aplat, et son perchoir : un nouveau morceau, posé avec la maison (`elements` de la table). Même taille.
 */
const nichoir: ObjectDrawing = (at, pe, far) => {
  birdhouse(at, pe, far);
  at.part();
  at.standingDisc([0.17, 0.5, 1.34], 'nx', 0.14, 8, pe.color(OBJECT_COLORS.shadow));
  at.beam([0.18, 0.5, 1.12], [0.02, 0.5, 1.12], 0.06, pe.color(OBJECT_COLORS.wood), true);
};

/**
 * La lanterne d'entraide du Phare dans le monde ouvert (consultant d'Archipéo, avis sur les lots L2 et L3, 17 octobre
 * 2026) : sur le banc de la grille, une lanterne de quai qu'on porte à la main, et non la lanterne sur poteau des cours,
 * qui se lisait comme un lampadaire au pied de la tour (et se confondait avec la lanterne du Phare, en haut). Un socle et
 * un cadre de fer, quatre vitres en verre mat (éteinte : `MATTE_GLASS`), un toit en pointe et son anse au-dessus. Les
 * mêmes marques que celle de la grille (le plateau, puis les pieds et la lanterne) : un seul élément, posé d'un bloc.
 */
export const LANTERNE_DE_QUAI = { side: 0.62, glass: [0.66, 1.36], roof: 1.66, anse: 1.98 } as const;

const lanterneDeQuai: ObjectDrawing = (at, pe) => {
  const wood = pe.block(BLOC.bois);
  tableOnLegs(at, 0.04, 2.96, 0.14, 0.86, 0.56, 0.14, wood, [
    [0.36, 0.5],
    [2.64, 0.5],
  ], 0.32, { dessus: wood.dessus, cote: wood.cote });
  const frame = pe.role('lanternFrame');
  const iron = pe.color(OBJECT_COLORS.iron);
  const [cx, cy, s] = [1.5, 0.5, LANTERNE_DE_QUAI.side];
  const [g0, g1] = LANTERNE_DE_QUAI.glass;
  // Le socle, les vitres (en retrait du cadre), les quatre montants d'angle, le chapeau et le toit en pointe.
  at.block(cx, cy, s, s, 0.56, g0, frame, { bottom: true });
  at.block(cx, cy, s - 0.1, s - 0.1, g0, g1, { dessus: MATTE_GLASS.dessus, cote: MATTE_GLASS.cote }, { bottom: true, top: true });
  const post = 0.09;
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) at.block(cx + dx * (s / 2 - post / 2), cy + dy * (s / 2 - post / 2), post, post, g0, g1, frame, { bottom: true, top: true });
  at.block(cx, cy, s + 0.06, s + 0.06, g1, g1 + 0.07, frame, { bottom: false });
  at.prism(cx, cy, s / 2 + 0.06, 0.07, g1 + 0.07, LANTERNE_DE_QUAI.roof, 4, frame, Math.PI / 4);
  // L'anse : un arceau de fer, de part et d'autre de la pointe, qui dit « on la porte ».
  const [a, z0, z1] = [0.2, LANTERNE_DE_QUAI.roof - 0.06, LANTERNE_DE_QUAI.anse];
  at.beam([cx - a, cy, z0], [cx - a * 0.7, cy, z1], 0.055, iron, true);
  at.beam([cx - a * 0.7, cy, z1], [cx + a * 0.7, cy, z1], 0.055, iron, true);
  at.beam([cx + a * 0.7, cy, z1], [cx + a, cy, z0], 0.055, iron, true);
};

/**
 * Les dessins du 6e, par identifiant de petite construction : ceux de la grille ; la grue des Archives, sa potence de
 * façade ; le nichoir de la Mangrove, son entrée au pignon ; la lanterne d'entraide du Phare, une lanterne de quai.
 */
const DRAWINGS: Readonly<Record<string, ObjectDrawing>> = {
  ...SILHOUETTES,
  ...ASSEMBLIES,
  'french-6e-word-spelling-fixture-1': potence,
  'life-earth-sciences-6e-living-world-fixture-1': nichoir,
  'french-6e-phonology-fixture-2': lanterneDeQuai,
};

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
  const biome = BIOMES.find((b) => b.id === island);
  if (!draw || !biome) throw new Error(`Aménagement sans dessin : ${id}`);
  const at = new MatteWorkshop(new Pinceau(), null, (x, y, z) => [x, z, y]);
  // La palette de la classe de son île (le niveau de son lieu).
  draw(at, paintFor(biome.classe, island, false), false);
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

/**
 * Ce que coûtent les dix-neuf aménagements posés, dans le maillage des lieux : leurs triangles (et ceux des assises et du
 * morceau de quai du lavoir), aucun appel de plus.
 */
export function amenagementsCost(): { triangles: number; calls: number } {
  return { triangles: AMENAGEMENTS.reduce((n, a) => n + drawnObject(a.id).positions.length / 9 + (a.assise || a.scene ? ASSISE_TRIANGLES : 0) + (a.quai ? QUAI_TRIANGLES : 0), 0), calls: 0 };
}
