// Les Gardiens sur leur île (GD-11) : leur carré, leur place, le bloc d'or du Gardien rallumé, et le Gardien en pierre
// ou rallumé.
import { type BiomeDef, type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { type ArchipelagoId, islandDef } from '../map';
import type { VoxelCube } from '../cube';
import { turnCell, turnModel, turnPlacedModel, turnPoint } from '../placement';
import { guardianStatus } from '../../boss';
import { etendue, gardienDuMonde, gardienProfond, GUARDIAN_SQUARE, guardianSpot, SENTINELLE_DANS_LE_MONDE } from './creatures';
import { GUARDIAN_WORLD_HEIGHTS } from '../guardianSquares';
import { TEXTURES } from './base';

/**
 * Le milieu du Gardien dans son carré (repère du cœur, le lieu pas tourné) : au milieu de ses quatre rangées du fond, la
 * rangée de devant (côté caméra) gardant la place de son bloc d'or ; au milieu du carré pour un Gardien long.
 */
function milieuDuGardien(id: BiomeId): { x: number; y: number } {
  const s = guardianSpot(id);
  return { x: s.x + GUARDIAN_SQUARE / 2, y: s.y + (gardienProfond(id) ? GUARDIAN_SQUARE / 2 : (GUARDIAN_SQUARE + 1) / 2) };
}

/**
 * Le milieu du Gardien sur son carré (`milieuDuGardien` : une demi-case vers le fond quand son bloc d'or est devant
 * lui), en cases du monde (une case : son coin bas), le lieu tourné, et la hauteur que vise la caméra du rallumage
 * (lot 6) : le pied du Gardien plus 1,6 bloc à son échelle (`echelle`, l'habillage) ; à l'échelle 1, le milieu d'une
 * sentinelle de 5,2 blocs (DA-5 : world/characters/sentinel.ts, `HAUTEUR_DANS_LE_MONDE` ; un test y tient les deux
 * ensemble), et d'autant plus haut que le Gardien est plus haut que la sentinelle (`GUARDIAN_WORLD_HEIGHTS`, le Grand
 * Chêne), à l'échelle de l'habillage elle aussi : dans Blocland, le Grand Chêne (6,5 blocs, le plus haut des Gardiens
 * du 6e) se vise 0,2 bloc plus haut. La grille y ancre le Gardien (world/grid.ts).
 */
export function guardianCenter(id: BiomeId, echelle = 1): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const milieu = milieuDuGardien(id);
  const m = turnPoint(milieu.x, milieu.y, def.quarts);
  const plus = ((GUARDIAN_WORLD_HEIGHTS[id] ?? SENTINELLE_DANS_LE_MONDE.hauteur) - SENTINELLE_DANS_LE_MONDE.hauteur) / 2;
  return { x: def.core.x + m.x - 0.5, y: def.core.y + m.y - 0.5, z: def.altitude + 1 + (1.6 + plus) * echelle };
}

/**
 * Le Gardien en couleurs, tourné avec son lieu (GD-9) : les cubes du Gardien posé une fois rallumé (`guardianPlacements`),
 * que le fondu du rallumage refait couche par couche (three/characters.ts).
 */
export function gardienTourne(id: BiomeId): ReturnType<typeof gardienDuMonde> {
  return turnModel(gardienDuMonde(id), islandDef(id).quarts);
}

/** Les cases du carré du Gardien d'une île, en cases du monde, le lieu tourné : le bonhomme n'y marche pas. */
export function guardianCells(id: BiomeId): { x: number; y: number }[] {
  const def = islandDef(id);
  const s = guardianSpot(id);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < GUARDIAN_SQUARE; i++)
    for (let j = 0; j < GUARDIAN_SQUARE; j++) {
      const t = turnCell(s.x + i, s.y + j, def.quarts);
      out.push({ x: def.core.x + t.x, y: def.core.y + t.y });
    }
  return out;
}

/**
 * La case du bloc d'or d'un Gardien rallumé (repère du cœur, le lieu pas tourné) : collé à lui, une case devant (côté
 * caméra), dans son carré ; à côté de lui, à droite, pour un Gardien long (DA, 8 octobre 2026).
 */
export function trophySpot(id: BiomeId): { x: number; y: number } {
  const s = guardianSpot(id);
  return { x: s.x + (gardienProfond(id) ? GUARDIAN_SQUARE - 1 : Math.floor(GUARDIAN_SQUARE / 2)), y: s.y };
}

/** Le bloc d'or d'un Gardien rallumé, sur un socle de pierre, devant lui (cubes du monde, le lieu pas tourné : il tourne avec l'île). */
export function guardianTrophy(biome: BiomeDef, cubes: VoxelCube[]): void {
  const def = islandDef(biome.id);
  const t = trophySpot(biome.id);
  const [x, y, z] = [def.core.x + t.x, def.core.y + t.y, def.altitude];
  const block = (zz: number, color: string, top?: string) => cubes.push({ x, y, z: zz, color, top, texture: TEXTURES[color], tag: biome.id });
  block(z + 1, BLOCKS[BLOC.pierre].side);
  block(z + 2, BLOCKS[BLOC.or].side, BLOCKS[BLOC.or].top);
}

/**
 * La pierre éteinte d'une couleur (pour la statue d'un Gardien qui attend d'être rallumé) : un gris froid, un peu bleu,
 * plus sombre que la couleur, qui suit sa luminosité. Froid et sombre pour que les Gardiens déjà gris (le Golem, le Lion
 * de pierre, le Titan…) se voient éteints, puis rallumés dès la première épreuve (GD-8, consultant de Blocland). Les
 * tests reconnaissent cette pierre à sa teinte (vert = rouge + 8, bleu = vert + 16) : la changer, c'est changer `estPierre`.
 */
function stoneOf(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  const g = Math.round(64 + (lum / 255) * 76);
  return `#${(((g - 8) << 16) | (g << 8) | (g + 16)).toString(16).padStart(6, '0')}`;
}

/** Un Gardien éteint, en statue de pierre : chaque cube, et son dessus, en pierre éteinte (`stoneOf` ; le fondu du rallumage part de ces gris). */
export function statueDe<C extends { color: string; top?: string }>(cubes: readonly C[]): C[] {
  return cubes.map((c) => ({ ...c, color: stoneOf(c.color), top: c.top === undefined ? undefined : stoneOf(c.top) }));
}

/**
 * Un Gardien qui se rallume au défi (GD-8) : ses couleurs reviennent des pieds vers la tête, `part` de sa hauteur
 * (entre 0, tout en pierre, et 1, tout en couleurs) ; le reste en pierre.
 */
export function gardienEnPartieRallume<C extends { z: number; color: string; top?: string }>(cubes: readonly C[], part: number): C[] {
  if (part <= 0) return statueDe(cubes);
  if (part >= 1) return [...cubes];
  const zs = cubes.map((c) => c.z);
  const bas = Math.min(...zs);
  const seuil = bas + part * (Math.max(...zs) - bas + 1);
  return cubes.map((c) => (c.z < seuil ? c : { ...c, color: stoneOf(c.color), top: c.top === undefined ? undefined : stoneOf(c.top) }));
}

/** Un Gardien posé sur son île : ses cubes, son coin, son échelle de dessin et les cases de son carré. */
export interface GuardianPlacement {
  id: BiomeId;
  kind: 'guardian';
  still: true;
  beaten: boolean;
  cubes: VoxelCube[];
  /** Le coin de ses cubes dans le monde (pas forcément sur une case : son milieu est celui de sa place). */
  origin: { x: number; y: number; z: number };
  /** L'échelle de son dessin autour de son pied (GD-11 : 0,5 dans Blocland, 1 dans Archipéo, l'habillage). */
  echelle: number;
  /** Les cases de son carré : le bonhomme n'y marche pas. */
  cases: { x: number; y: number }[];
}

/**
 * Les Gardiens visibles, chacun sur son île (GD-11) : éteints, en statue de pierre, tant que leur défi n'est pas réussi ;
 * rallumés, en couleurs, ensuite (GD-8). Avec `sentinelles` (les deux univers depuis GD-8), ceux des îles ouvertes sont
 * là avant que leur défi soit prêt. `echelle` : celle de leur dessin (l'habillage, `echelleDesGardiens`), autour de leur
 * pied, au milieu de leur place : leurs cubes restent ceux du modèle, de même forme.
 */
export function guardianPlacements(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  bridges: string[],
  sentinelles = false,
  keptOpen: readonly string[] = [],
  echelle = 1,
): GuardianPlacement[] {
  const out: GuardianPlacement[] = [];
  for (const b of BIOMES) {
    if (b.classe !== a) continue;
    const status = guardianStatus(b, progress, bridges, sentinelles, keptOpen);
    if (status === 'hidden') continue;
    const beaten = status === 'beaten';
    const modele = beaten ? gardienDuMonde(b.id) : statueDe(gardienDuMonde(b.id));
    const def = islandDef(b.id);
    const e = etendue(modele);
    const m = milieuDuGardien(b.id);
    // Le milieu de ses cubes au milieu de sa place ; sur le lieu tourné (GD-9), il tourne avec lui.
    const origine = { x: def.core.x + m.x - (e.x0 + e.x1) / 2, y: def.core.y + m.y - (e.y0 + e.y1) / 2, z: def.altitude + 1 };
    const pose = turnPlacedModel(def.core, origine, modele, def.quarts);
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes: pose.cubes, origin: pose.origine, echelle, cases: guardianCells(b.id) });
  }
  return out;
}
