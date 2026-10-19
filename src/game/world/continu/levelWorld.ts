// Ce que la vue du monde ouvert lit d'un niveau pour le dessiner (GD-22, lot 2) : sa carte de hauteurs et son sol, son
// réseau des chemins et leur dessin, ses tuiles, son eau, son ciel et sa lumière. Le 6e garde tout ce qu'il avait (les
// mêmes fonctions, appelées de même) ; le 5e prend les siennes (./terrain5e.ts, ./paths5e.ts, ./sea.ts, ./sky.ts). Ce
// que le 5e n'a pas encore (l'Escale, la Nef, les Détours, les scénettes) reste du 6e : la vue le coupe par `sixth` ; la
// faune a celle de chaque niveau (./wildlife.ts, ./wildlife5e.ts). Code pur.
import type { Facets } from './facets';
import type { Vec2 } from './geometry';
import type { OpenWorldLevel } from './levelPlan';
import type { Network } from './network';
import { NETWORK_5E, RIBBONS_5E, pathRibbons5e } from './paths5e';
import { NETWORK_6E, RIBBONS_6E, pathRibbons, type RibbonNet } from './paths';
import { portFloor } from './plan6e';
import { TERRAIN_5E } from './plan5e';
import { WATER_TONES, WATER_TONES_5E, seaPixels, seaPixels5e } from './sea';
import { HEIGHT_LIGHT_5E, HORIZON_COLOR, HORIZON_COLOR_5E, LIGHT, LIGHT_5E, SHADOW_DIR, SHADOW_DIR_5E, SKY_OF, type HeightLight, type SceneLight, type SkyStops } from './sky';
import { buildHeightField, heightOnMesh, type HeightField } from './terrain';
import { buildHeightField5e, groundOn5e, tileFacets5e, tileFlora5e, tileGround5e } from './terrain5e';
import { TILES_6E, type TileSource } from './tiles';

/** Les quatre teintes de l'eau que lit le matériau de la mer. */
interface WaterTones {
  readonly clear: number;
  readonly shelf: number;
  readonly lagoon: number;
  readonly night: number;
}

/** Ce que la vue lit d'un niveau. */
export interface LevelWorld {
  /** Le monde est-il celui du 6e (l'Escale, la Nef, les Détours, les scénettes, les remises) ? */
  readonly sixth: boolean;
  /** La carte de hauteurs (faite une fois, gardée). */
  field(): HeightField;
  /** Le sol où l'on marche, sur cette carte (au 6e, la pierre de l'Escale là où elle est). */
  ground(field: HeightField): (x: number, z: number) => number;
  /** Le réseau des chemins. */
  readonly net: Network;
  /** Le même réseau, pour le dessus de ses rubans (l'anneau de Kéo, la marque du toucher). */
  readonly ribbons: RibbonNet;
  /** Le dessin des chemins. */
  pathFacets(ground: (x: number, z: number) => number): Facets;
  /** Ses tuiles. */
  readonly tiles: TileSource;
  /** L'image de l'eau, et ses teintes. */
  seaPixels(): Uint8Array;
  readonly water: WaterTones;
  /** La lumière, le ciel, l'horizon (le fond et le brouillard), le sens des ombres peintes. */
  readonly light: SceneLight;
  readonly sky: SkyStops;
  readonly horizon: number;
  readonly shadowDir: Vec2;
  /** La lumière et le brouillard par la hauteur (au 5e, ses deux étages) ; rien au 6e, à plat. */
  readonly heightLight: HeightLight | null;
}

const WORLD_6E: LevelWorld = {
  sixth: true,
  field: buildHeightField,
  ground: (field) => (x, z) => portFloor(x, z) ?? heightOnMesh(field, x, z),
  net: NETWORK_6E,
  ribbons: RIBBONS_6E,
  pathFacets: pathRibbons,
  tiles: TILES_6E,
  seaPixels,
  water: WATER_TONES,
  light: LIGHT,
  sky: SKY_OF['6e'],
  horizon: HORIZON_COLOR,
  shadowDir: SHADOW_DIR,
  heightLight: null,
};

const WORLD_5E: LevelWorld = {
  sixth: false,
  field: buildHeightField5e,
  ground: (field) => (x, z) => groundOn5e(field, x, z),
  net: NETWORK_5E,
  ribbons: RIBBONS_5E,
  pathFacets: pathRibbons5e,
  tiles: { grid: TERRAIN_5E, facets: tileFacets5e, ground: tileGround5e, flora: tileFlora5e },
  seaPixels: seaPixels5e,
  water: WATER_TONES_5E,
  light: LIGHT_5E,
  sky: SKY_OF['5e'],
  horizon: HORIZON_COLOR_5E,
  shadowDir: SHADOW_DIR_5E,
  heightLight: HEIGHT_LIGHT_5E,
};

/** Ce que la vue lit du niveau `level`. */
export const levelWorld = (level: OpenWorldLevel): LevelWorld => (level === '5e' ? WORLD_5E : WORLD_6E);
