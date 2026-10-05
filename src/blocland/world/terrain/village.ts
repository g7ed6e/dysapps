// Les lieux du village sur l'île de l'école : l'école, la salle des trophées et le lieu où l'on assemble, leur place,
// leur porte et leur modèle en cubes.
import { EMPRISE_DE_LA_SALLE, modeleDeLaSalle, SALLE_DE_DEPART } from '../salle';
import type { PlaceId, VillagePlaceId, VoxelCube } from '../cube';
import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { type ArchipelagoId, islandDef } from '../map';
import { getArchipelago } from '../archipelago';
import { recetteDeLArchipel } from '../assemblage';
import { fade, groundHeight, isSchoolIsland } from './socle';
import { type BorneVue, cacheUneBorne } from './bornes';

/** Encombrement de l'école : 5 cases de large (x), 4 de profondeur (y), la façade et sa porte côté caméra (y bas). */
const SCHOOL_SIZE = { w: 5, d: 4 };

/**
 * Le coin de l'école dans le cœur de son île : au milieu à droite, derrière la dernière borne, une case libre entre elle
 * et le bord du cœur ; sa porte en (14, 2). La rangée de devant ne porte que les bornes (redistribution « Trois
 * bandes », choix du mainteneur, 02/10/2026 ; elle était devant, en (11, 1)).
 */
const SCHOOL_AT = { x: 12, y: 3 };

/**
 * La salle des trophées : son emprise de 8 × 3 cases, réservée dès le départ (GD-3, ./salle.ts), au milieu du cœur
 * (derrière les bornes, devant la zone des plans). La salle de départ (4 × 3, ouverte devant) en tient la droite, de
 * x = 4 à 7 ; ses travées s'ajoutent à gauche. Sa porte (x = 6) ne bouge pas.
 */
export const TROPHY_SIZE = EMPRISE_DE_LA_SALLE;

export const TROPHY_AT = { x: 0, y: 8 };

/**
 * Le lieu où l'on assemble les blocs (GD-2) : 3 × 5 cases, à droite au fond du cœur agrandi des îles-écoles, derrière
 * l'école et à côté de la zone des plans, hors de l'emprise que la salle des trophées prend en grandissant (GD-3 : de
 * (0,8) à (7,10)) ; la halle au fond (trois rangs), la cour devant (deux rangs : la potence, les blocs empilés). La
 * porte au milieu, sa case devant la cour. Loin de la créature (et de ses pas), des bornes et du port. Au bord droit,
 * en (15, 11) : une allée d'une case (x = 14) entre elle et la zone des plans, plus profonde d'une rangée sur les
 * îles-écoles (`zoneDesPlans` ; redistribution « Trois bandes », 02/10/2026).
 */
export const ASSEMBLAGE_SIZE = { w: 3, d: 5 };

const ASSEMBLAGE_AT = { x: 15, y: 11 };

/** Les lieux du village, posés sur l'île de l'école de chaque archipel : leur coin dans le cœur, leur taille, la colonne de leur porte. */
export const VILLAGE_PLACES: Record<VillagePlaceId, { at: { x: number; y: number }; size: { w: number; d: number }; door: number }> = {
  school: { at: SCHOOL_AT, size: SCHOOL_SIZE, door: 2 },
  trophies: { at: TROPHY_AT, size: TROPHY_SIZE, door: SALLE_DE_DEPART.x + 2 },
  assembly: { at: ASSEMBLAGE_AT, size: ASSEMBLAGE_SIZE, door: 1 },
};

export const PLACE_IDS = Object.keys(VILLAGE_PLACES) as VillagePlaceId[];

/** Un lieu posé sur une île : le coin de sa façade (coordonnées du monde) et son sol (z relatif au sol de l'île). */
export interface PlaceSpot {
  x: number;
  y: number;
  h: number;
}

/** La place d'un lieu du village sur l'île de l'école de son archipel, `null` ailleurs. */
export function placeSpot(place: VillagePlaceId, id: BiomeId): PlaceSpot | null {
  if (!isSchoolIsland(id)) return null;
  const { at, size } = VILLAGE_PLACES[place];
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  let h = 0;
  for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) h = Math.max(h, groundHeight(index, at.x + dx, at.y + dy));
  return { x: def.core.x + at.x, y: def.core.y + at.y, h };
}

/** Les cases qu'occupent les lieux du village (coordonnées relatives au cœur), toute leur emprise. */
export function casesDuVillage(id: BiomeId): [number, number][] {
  const out: [number, number][] = [];
  if (!isSchoolIsland(id)) return out;
  for (const place of PLACE_IDS) {
    const { at, size } = VILLAGE_PLACES[place];
    for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) out.push([at.x + dx, at.y + dy]);
  }
  return out;
}

/** Les mêmes cases, en clés « x,y ». */
export const placeCells = (id: BiomeId): Set<string> => new Set(casesDuVillage(id).map(([x, y]) => `${x},${y}`));

/**
 * Les lieux du village d'une île-école tels que la vue de l'île les voit (coordonnées du cœur), pour `cacheUnLieu` :
 * chaque case de leur emprise, l'emprise réservée de la salle des trophées comprise, sur ses deux premiers rangs au-dessus
 * du sol (socles et trophées, porte, rez-de-chaussée), comme deux bornes l'une sur l'autre. Vide ailleurs.
 */
export function lieuxVus(id: BiomeId): BorneVue[] {
  const out: BorneVue[] = [];
  for (const place of PLACE_IDS) {
    const spot = placeSpot(place, id);
    if (!spot) continue;
    const { at, size } = VILLAGE_PLACES[place];
    for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) for (const rang of [0, 1]) out.push({ x: at.x + dx, y: at.y + dy, base: spot.h + rang });
  }
  return out;
}

/**
 * Le cube (x, y, z) (coordonnées du cœur, z au-dessus du sol de l'île) se tient-il entre la caméra de l'île et un lieu
 * du village (`lieuxVus`) ? Le même rayon que pour une borne (`cacheUneBorne`) : la créature d'une île-école n'y va pas.
 */
export function cacheUnLieu(lieux: readonly BorneVue[], vers: readonly [number, number, number], x: number, y: number, z: number): boolean {
  return lieux.length > 0 && cacheUneBorne(lieux, vers, x, y, z);
}

/**
 * Les cases qu'occupent les lieux du village d'un archipel (coordonnées du monde, sur l'île de son école) : toute leur
 * emprise, la place réservée des travées de la salle des trophées comprise. Le bonhomme n'y marche pas (paths.ts,
 * `walkGround`) : toucher la place d'une travée à venir l'envoie à la case libre la plus proche, comme ailleurs.
 */
export function casesDesLieux(a: ArchipelagoId): { x: number; y: number }[] {
  const id = getArchipelago(a).school;
  const { core } = islandDef(id);
  return casesDuVillage(id).map(([x, y]) => ({ x: core.x + x, y: core.y + y }));
}

/** Les cases devant la porte des lieux du village d'une île (coordonnées relatives au cœur), où le bonhomme s'arrête. */
export function portesDesLieux(id: BiomeId): string[] {
  if (!isSchoolIsland(id)) return [];
  return PLACE_IDS.map((place) => {
    const { at, door } = VILLAGE_PLACES[place];
    return `${at.x + door},${at.y - 1}`;
  });
}

/** La porte d'un lieu : la case devant elle, où le bonhomme s'arrête (coordonnées du monde, z : le sol sous ses pieds). */
export function placeDoor(place: VillagePlaceId, id: BiomeId): { x: number; y: number; z: number } | null {
  const s = placeSpot(place, id);
  if (!s) return null;
  const { at, door } = VILLAGE_PLACES[place];
  const index = BIOMES.findIndex((b) => b.id === id);
  return { x: s.x + door, y: s.y - 1, z: islandDef(id).altitude + groundHeight(index, at.x + door, at.y - 1) + 1 };
}

export function placeCube(place: PlaceId, x: number, y: number, z: number, block: keyof typeof BLOCKS, island: BiomeId, unlocked: boolean): VoxelCube {
  const b = BLOCKS[block];
  return { x, y, z, color: unlocked ? b.side : fade(b.side), top: b.top, texture: b.texture, tag: island, place, muted: unlocked ? undefined : true };
}

type ModelCube = { x: number; y: number; z: number; block: keyof typeof BLOCKS };

/**
 * Les cubes de l'école (coordonnées relatives à son coin, z = 1 au-dessus du sol) : murs de brique aux coins de pierre de
 * taille, une porte au milieu de la façade entre deux fenêtres, un toit à deux pans et un clocheton à cloche d'or.
 */
export function schoolModel(): ModelCube[] {
  const out: ModelCube[] = [];
  const { w, d } = SCHOOL_SIZE;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < d; y++)
      for (let z = 1; z <= 3; z++) {
        const corner = (x === 0 || x === w - 1) && (y === 0 || y === d - 1);
        const front = y === 0;
        const block = front && x === 2 && z <= 2 ? BLOC.porte : front && (x === 1 || x === 3) && z === 2 ? BLOC.verre : corner ? BLOC.taille : BLOC.brique;
        out.push({ x, y, z, block });
      }
  // Le toit : un rang débordant de tuiles rouges, puis le faîte au milieu.
  for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) out.push({ x, y, z: 4, block: BLOC.toit });
  for (let x = 0; x < w; x++) for (const y of [1, 2]) out.push({ x, y, z: 5, block: BLOC.toit });
  // Le clocheton au-dessus de la porte, et sa cloche.
  out.push({ x: 2, y: 1, z: 6, block: BLOC.taille });
  out.push({ x: 2, y: 1, z: 7, block: BLOC.or });
  return out;
}

// Les places des trophées dans l'emprise de la salle, dans l'ordre où elles se remplissent : sous le toit, jamais dessus
// (GD-3). Une place par succès.
export { TROPHY_SLOTS } from '../salle';

/**
 * La salle des trophées (coordonnées relatives au coin de son emprise) : un pavillon ouvert devant, des piliers de
 * marbre, un fond de velours rouge, des socles de marbre, un toit de pierre de taille au faîte d'or, et une travée de
 * plus tous les six succès après les douze premiers (./salle.ts). `trophies` : le bloc de chaque succès gagné, posé à
 * sa place (voir TROPHY_SLOTS).
 */
export function trophyModel(trophies: (keyof typeof BLOCKS)[] = []): ModelCube[] {
  return modeleDeLaSalle(trophies);
}

/**
 * La halle du lieu où l'on assemble (`atelierModel`) : son premier rang (devant lui, la cour, qui reste en blocs) et la
 * hauteur de ses murs dans la Halle d'Archipéo (le rang de pierre, puis le bois ; le toit au-dessus). Le kit du 6e les
 * lit pour reprendre la halle en colombage (world/architecture/kits/6e.ts).
 */
export const HALLE = { rang: 2, haut: 2 } as const;

/** La silhouette du lieu où l'on assemble, selon l'univers (l'habillage, `atelier`) : même place, même porte. */
export type Atelier = 'fabrique' | 'halle';

/**
 * Le lieu où l'on assemble les blocs (GD-2 ; coordonnées relatives à son coin, z = 1 au-dessus du sol) : une halle de
 * 3 × 3 au fond, sa grande porte ouverte au milieu de la façade (la halle est creuse derrière elle), et devant, dans la
 * cour, une potence qui porte le bloc assemblé de l'archipel, suspendu, et les blocs de sa recette empilés. Rien à lire.
 * - `fabrique` (Blocland) : des murs de brique sur un soubassement de pierre (ce qui la sépare des maisons), un toit plat
 *   de pierre de taille, une haute cheminée de pierre (son sommet à 7, au-dessus de la salle des trophées vue de la
 *   caméra de l'île), une potence de bois, d'où le bloc suspendu se détache.
 * - `halle` (Archipéo) : une halle basse en bois sur un socle de pierre, un toit à deux pentes, et une haute potence de
 *   bois (son bras à 6) qui porte le bloc assemblé au-dessus du toit de la salle des trophées : le repère du lieu.
 */
export function atelierModel(atelier: Atelier, a: ArchipelagoId): ModelCube[] {
  const out: ModelCube[] = [];
  const recette = recetteDeLArchipel(a);
  const suspendu = recette?.bloc ?? BLOC.bois;
  const [premier, second] = recette ? [recette.ingredients[0].bloc, recette.ingredients[recette.ingredients.length - 1].bloc] : ([BLOC.bois, BLOC.pierre] as const);
  const halle = atelier === 'halle';
  const haut = halle ? HALLE.haut : 3;
  // La halle : les rangs 2 à 4 ; la porte (x = 1) ouverte sur deux cases de haut, et creuse jusqu'au mur du fond.
  for (let x = 0; x < ASSEMBLAGE_SIZE.w; x++)
    for (let y = HALLE.rang; y < ASSEMBLAGE_SIZE.d; y++)
      for (let z = 1; z <= haut; z++) {
        if (x === 1 && y <= 3 && z <= 2) continue;
        out.push({ x, y, z, block: z === 1 ? BLOC.pierre : halle ? BLOC.bois : BLOC.brique });
      }
  if (halle) {
    // Le toit à deux pentes : un rang de tuiles, puis le faîte au milieu, dans le sens de la profondeur (le pignon en façade).
    for (let x = 0; x < ASSEMBLAGE_SIZE.w; x++) for (let y = HALLE.rang; y < ASSEMBLAGE_SIZE.d; y++) out.push({ x, y, z: haut + 1, block: BLOC.toit });
    for (let y = HALLE.rang; y < ASSEMBLAGE_SIZE.d; y++) out.push({ x: 1, y, z: haut + 2, block: BLOC.toit });
  } else {
    // Le toit plat, et la haute cheminée au coin du fond.
    for (let x = 0; x < ASSEMBLAGE_SIZE.w; x++) for (let y = HALLE.rang; y < ASSEMBLAGE_SIZE.d; y++) out.push({ x, y, z: 4, block: BLOC.taille });
    for (const z of [5, 6, 7]) out.push({ x: 2, y: 4, z, block: BLOC.pierre });
  }
  // La potence, sur le côté gauche de la cour : un mât de bois contre la façade, un bras vers l'avant, le bloc suspendu
  // dessous, une case sous le bras (rien ne le touche). Dans la Halle, plus haute : elle est son repère.
  const bras = halle ? 6 : 4;
  for (let z = 1; z <= bras; z++) out.push({ x: 0, y: 1, z, block: BLOC.bois });
  out.push({ x: 0, y: 0, z: bras, block: BLOC.bois });
  out.push({ x: 0, y: 0, z: bras - 2, block: suspendu });
  // Les blocs de la recette, empilés à droite de la cour.
  out.push({ x: 2, y: 0, z: 1, block: premier });
  out.push({ x: 2, y: 1, z: 1, block: premier });
  out.push({ x: 2, y: 1, z: 2, block: second });
  return out;
}
