// Ce que la vue du monde ouvert lit d'un niveau pour le dessiner (GD-22, lot 2) : sa carte de hauteurs et son sol, son
// réseau des chemins et leur dessin, ses tuiles, son eau, son ciel et sa lumière. Le 6e garde tout ce qu'il avait (les
// mêmes fonctions, appelées de même) ; le 5e prend les siennes (./terrain5e.ts, ./paths5e.ts, ./sea.ts, ./sky.ts). Ce
// que le 5e n'a pas encore (l'Escale, la Nef, les Détours, la faune, les scénettes) reste du 6e : la vue le coupe par
// `sixth`. Code pur.
import type { Facets } from './facets';
import type { Vec2 } from './geometry';
import { LISIERE_SITE, LISIERE_VIEW, lisiereDecorFacets } from './lisiere';
import { NEF_6E, type NefSite } from './nef';
import { NEF_5E } from './nef5e';
import { ESCALE, type PortSite } from './port';
import type { OpenWorldLevel, PlaceId } from './levelPlan';
import type { Network } from './network';
import { NETWORK_5E, RIBBONS_5E, pathRibbons5e } from './paths5e';
import { NETWORK_6E, RIBBONS_6E, pathRibbons, type RibbonNet } from './paths';
import { portFloor } from './plan6e';
import { TERRAIN_5E, lisiereFloor } from './plan5e';
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

/** Le lieu de départ d'un niveau : sa place (./port.ts dessine ses bâtiments), sa Nef, la caméra à son quai. */
interface Departure {
  port: PortSite;
  nef: NefSite;
  /** La pierre du lieu de départ sous un point du monde, ou rien (lue à chaque image : rien n'y est créé). */
  floor(x: number, z: number): number | null;
  /** Le cap de la caméra à l'arrivée au quai (0 : le nord). */
  viewYaw: number;
  /** Le cap de la caméra devant une façade (une porte, la galerie, l'assemblage). */
  facadeYaw: number;
  /**
   * Le haut que le regard levé cadre quand Kéo se tient au quai (au 5e, le sommet de la Montée, au fond : directeur
   * artistique, lot 4) ; rien au 6e.
   */
  lookAt: PlaceId | null;
  /** Ce qui ne change jamais autour du lieu de départ (au 5e, la graine géante et la lumière du Phare), ou rien. */
  decor(): Facets | null;
}

/** Ce que la vue lit d'un niveau. */
export interface LevelWorld {
  /** Le monde est-il celui du 6e (les Détours, la faune, les habitants, les remises) ? */
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
  /** Son lieu de départ et sa Nef. */
  readonly departure: Departure;
}

const DEPARTURE_6E: Departure = { port: ESCALE, nef: NEF_6E, floor: portFloor, viewYaw: 0, facadeYaw: 0, lookAt: null, decor: () => null };

let decor5e: Facets | null = null;
const DEPARTURE_5E_SITE: Departure = {
  port: LISIERE_SITE,
  nef: NEF_5E,
  floor: lisiereFloor,
  viewYaw: LISIERE_VIEW.yaw,
  facadeYaw: LISIERE_SITE.frame.yaw,
  lookAt: 'montee',
  decor: () => (decor5e ??= lisiereDecorFacets()),
};

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
  departure: DEPARTURE_6E,
};

const WORLD_5E: LevelWorld = {
  sixth: false,
  field: buildHeightField5e,
  ground: (field) => (x, z) => lisiereFloor(x, z) ?? groundOn5e(field, x, z),
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
  departure: DEPARTURE_5E_SITE,
};

/** Ce que la vue lit du niveau `level`. */
export const levelWorld = (level: OpenWorldLevel): LevelWorld => (level === '5e' ? WORLD_5E : WORLD_6E);
