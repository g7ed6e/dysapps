// Ce que la vue du monde ouvert lit d'un niveau pour le dessiner (GD-22, lot 2) : sa carte de hauteurs et son sol, son
// réseau des chemins et leur dessin, ses tuiles, son eau, son ciel et sa lumière. Le 6e garde tout ce qu'il avait (les
// mêmes fonctions, appelées de même) ; le 5e prend les siennes (./terrain5e.ts, ./paths5e.ts, ./sea.ts, ./sky.ts). Ce
// que le 5e n'a pas encore (l'Escale, la Nef, les Détours, les scénettes) reste du 6e : la vue le coupe par `sixth` ; la
// faune a celle de chaque niveau (./wildlife.ts, ./wildlife5e.ts). Code pur.
import { WORLD_FOG, type DetourView } from './camera';
import type { CameraScript } from './cameraPath';
import { AIGUILLES_COLORS, CRIQUE_SITE, CRIQUE_VIEW, NEF_4E, SKY_ISLAND_COLORS, criqueDecorFacets, criqueLook } from './crique4e';
import { RAFIOT_HULL_COLORS, RAFIOT_SMOKE_COLORS } from './rafiot';
import { rafiot6eFacets } from './rafiot6e';
import { mergeFacets, type Facets } from './facets';
import { FANAL_TOWER_3E } from './fanal3e';
import { FAR_ISLES_3E, FAR_ISLES_FOG_3E, FINAL_VIEW_3E, FINAL_VIEW_SECONDS_3E, farArchipelagos3e, finalViewPose3e } from './finalView3e';
import { FORGE_GLOW_DRAWN } from './forge4e';
import { FUMEROLLES_STEAM } from './fumerolles5e';
import type { Vec2, Vec3 } from './geometry';
import { LISIERE_SITE, LISIERE_VIEW, PHARE_DARK, lisiereDecorFacets } from './lisiere';
import { NEF_6E, type NefSite } from './nef';
import { NEF_5E, PLUME_COLORS, WALL_COLORS } from './nef5e';
import { NEF_3E, PARVIS_ARRIVAL, PARVIS_LOOK, PARVIS_SITE, PARVIS_VIEW, nefParuresLocal, parvisDecorFacets, zeppelinBox3e, zeppelinFacets, type NefParure } from './parvis3e';
import { ESCALE, type PortSite } from './port';
import type { OpenWorldLevel, PlaceId } from './levelPlan';
import type { Network } from './network';
import { NETWORK_3E, RIBBONS_3E, pathRibbons3e } from './paths3e';
import { NETWORK_4E, RIBBONS_4E, pathRibbons4e } from './paths4e';
import { NETWORK_5E, RIBBONS_5E, pathMapEdges5e, pathRibbons5e } from './paths5e';
import { CLIFF_MAP_COLORS, cliffMapLine } from './mist5e';
import { NETWORK_6E, RIBBONS_6E, pathRibbons, type RibbonNet } from './paths';
import { portFloor } from './plan6e';
import { PARVIS, PEAK_3E, PLACES_3E, TERRAIN_3E, parvisFloor } from './plan3e';
import { COLORS_4E, CRIQUE, TERRAIN_4E, criqueFloor } from './plan4e';
import { COLORS_5E, TERRAIN_5E, lisiereFloor } from './plan5e';
import { SEA_TEXTURE_3E, WATER_TONES, WATER_TONES_3E, WATER_TONES_4E, WATER_TONES_5E, seaPixels, seaPixels3e, seaPixels4e, seaPixels5e } from './sea';
import {
  FOG_3E,
  FOG_4E,
  HEIGHT_LIGHT_3E,
  HEIGHT_LIGHT_4E,
  HEIGHT_LIGHT_5E,
  HORIZON_COLOR,
  HORIZON_COLOR_3E,
  HORIZON_COLOR_4E,
  HORIZON_COLOR_5E,
  LIGHT,
  LIGHT_3E,
  LIGHT_4E,
  LIGHT_5E,
  SHADOW_DIR,
  SHADOW_DIR_3E,
  SHADOW_DIR_4E,
  SHADOW_DIR_5E,
  SKY_OF,
  type HeightLight,
  type SceneLight,
  type SkyStops,
} from './sky';
import { buildHeightField, heightOnMesh, type HeightField } from './terrain';
import { buildHeightField3e, ground3e, mapOverlay3e, tileFacets3e, tileFlora3e, tileGround3e } from './terrain3e';
import { buildHeightField4e, groundOn4e, mapOverlay4e, tileFacets4e, tileFlora4e, tileGround4e } from './terrain4e';
import { buildHeightField5e, groundOn5e, tileFacets5e, tileFlora5e, tileGround5e } from './terrain5e';
import { TILES_6E, type TileSource } from './tiles';

/** Les quatre teintes de l'eau que lit le matériau de la mer. */
interface WaterTones {
  readonly clear: number;
  readonly shelf: number;
  readonly lagoon: number;
  readonly night: number;
}

/** Une couleur peu voilée par le brouillard du lointain, et la part du brouillard qu'elle garde (de 0 à 1). */
export interface ThinFog {
  readonly color: number;
  readonly fog: number;
  /** Dessinée sans ombre : la vue garde sa couleur telle quelle (le panache, une fumée). */
  readonly unlit?: boolean;
}

/** La part du brouillard que gardent la lumière du Phare et sa tour, le mur, puis le panache. */
const THIN_FOG_5E = { phare: 0.12, wall: 0.6, plume: 0.45 } as const;

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
  /** Ou un haut fixe que le regard levé cadre au quai (au 4e, le cratère du volcan : ./crique4e.ts, `criqueLook`). */
  lookTop?: Vec3;
  /**
   * Ce qui ne change jamais autour du lieu de départ (au 5e, la graine géante et la lumière du Phare), ou rien ; au 4e,
   * `returned` : les pièces du Rafiot rendues au Fanal du 3e (le pont du Rafiot vide).
   */
  decor(returned?: boolean): Facets | null;
  /**
   * Un décor du monde qui n'est pas sur la Carte (au 3e, le zeppelin des Ferrailleurs : un décor, pas un repère ; fiche du
   * 3e, § 5 bis), dessiné avec `decor` hors de la Carte ; rien ailleurs.
   */
  offMap?(): Facets;
  /**
   * Les parures posées de la Nef au repos (au 3e, GD-25 : la figure de proue, le pavois, les feux), dans le repère de la
   * Nef ; rien ailleurs.
   */
  parures?(posed: readonly NefParure[]): Facets;
  /**
   * La vue d'arrivée au quai, tourné vers son cap (au 3e, `PARVIS_ARRIVAL` : la caméra monte et recule pour que la mer de
   * nuages se lise entre la terre et l'horizon) ; rien : la caméra qui suit, le regard levé seulement.
   */
  readonly quayView?: DetourView;
}

/** Ce que la vue lit d'un niveau. */
export interface LevelWorld {
  /** Le monde est-il celui du 6e (les Détours, les habitants, les remises) ? */
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
  /** L'image de l'eau, et ses teintes ; le carré du monde qu'elle couvre, s'il n'est pas celui du 6e (`SEA_TEXTURE`). */
  seaPixels(): Uint8Array;
  readonly seaTexture?: { readonly size: number; readonly half: number };
  readonly water: WaterTones;
  /** La lumière, le ciel, l'horizon (le fond et le brouillard), le sens des ombres peintes. */
  readonly light: SceneLight;
  readonly sky: SkyStops;
  readonly horizon: number;
  readonly shadowDir: Vec2;
  /** La lumière et le brouillard par la hauteur (au 5e, ses deux étages) ; rien au 6e, à plat. */
  readonly heightLight: HeightLight | null;
  /**
   * Les couleurs que le brouillard du lointain ne prend qu'en partie (`fog`, la part qu'elles en gardent) : au 5e, la
   * lumière du Phare et sa tour, au ras de l'horizon, presque sans brume ; le mur de nuages et le panache, moins voilés
   * que le reste (directeur artistique, retouche du lot 4). La vue les lit avec `heightLight` ; rien au 6e.
   */
  readonly thinFog: readonly ThinFog[];
  /** Son lieu de départ et sa Nef. */
  readonly departure: Departure;
  /**
   * Le brouillard du lointain : où il commence et où il couvre tout (les tuiles de loin s'arrêtent là). Au 6e et au 5e,
   * `WORLD_FOG` ; au 4e, plus loin (`FOG_4E`).
   */
  readonly fog: { readonly near: number; readonly far: number };
  /**
   * Ce que la Carte ajoute au monde, dans le maillage des lieux (expert frontend, retouche 1 du lot 1 : un choix du
   * niveau, plus une branche de la vue) : rien au 6e ; au 5e, le trait de sa falaise et le bord des chemins du plateau ;
   * au 4e, les hachures du sommet et le dessin de ses coupures. `ground` : le sol où l'on marche.
   */
  mapOverlay(ground: (x: number, z: number) => number): Facets;
  /**
   * Les repères du niveau que la marque d'un lieu lointain ne couvre jamais (au 3e, le Fanal, le pic, le zeppelin ;
   * relecture du Cirque, correction 8) : leurs boîtes dans le monde, et le lieu qu'est le repère, s'il en est un (sa
   * propre marque se pose au-dessus de lui). Rien ailleurs.
   */
  readonly landmarks?: readonly Landmark[];
  /**
   * La vue finale du niveau (au 3e, GD-25 : ./finalView3e.ts), jouée une fois, à la fin de l'allumage du lieu `place` (la
   * fin des Ferrailleurs, au Fanal restauré) : sa durée, sa pose à chaque instant depuis celle de la caméra, ce qu'elle
   * seule montre (les archipels au loin), et ce que dure son image fixe avec « Réduire les animations ». Rien ailleurs.
   */
  readonly finalView?: FinalView;
  /**
   * Le Rafiot des Ferrailleurs à quai (GD-23, lot 2 ; GD-27 ; GD-28 : au 6e, la seule trace de la bande, ./rafiot6e.ts) :
   * amarré près d'un lieu éteint (`restored` dit si un lieu est rallumé), parti quand ils le sont tous ; dans le maillage
   * des lieux, refait avec eux. Rien ailleurs (au 4e, il est dans `Departure.decor`).
   */
  rafiot?(restored: (place: PlaceId) => boolean): Facets | null;
}

/** La vue finale d'un niveau (`LevelWorld.finalView`) : un script de caméra, et ce qu'elle seule dessine. */
interface FinalView extends CameraScript {
  readonly place: PlaceId;
  facets(): Facets;
}

/** Un repère du niveau : sa boîte dans le monde, et le lieu qu'il est, s'il en est un. */
interface Landmark {
  readonly min: Vec3;
  readonly max: Vec3;
  readonly place?: PlaceId;
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
  thinFog: [],
  departure: DEPARTURE_6E,
  fog: WORLD_FOG,
  mapOverlay: () => mergeFacets([]),
  rafiot: rafiot6eFacets,
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
  thinFog: [
    ...[COLORS_5E.lantern, PHARE_DARK].map((color) => ({ color, fog: THIN_FOG_5E.phare })),
    ...Object.values(WALL_COLORS).map((color) => ({ color, fog: THIN_FOG_5E.wall })),
    ...Object.values(PLUME_COLORS).map((color) => ({ color, fog: THIN_FOG_5E.plume, unlit: true })),
    // La vapeur des Fumerolles, sans ombre, voilée comme tout le reste (retouche 2 du lot 9).
    ...FUMEROLLES_STEAM.map((color) => ({ color, fog: 1, unlit: true })),
  ],
  departure: DEPARTURE_5E_SITE,
  fog: WORLD_FOG,
  mapOverlay: (ground) => mergeFacets([cliffMapLine(), pathMapEdges5e(ground, CLIFF_MAP_COLORS.dark)]),
};

const decor4e = new Map<boolean, Facets>();
const DEPARTURE_4E_SITE: Departure = {
  port: CRIQUE_SITE,
  nef: NEF_4E,
  floor: criqueFloor,
  viewYaw: CRIQUE_VIEW.yaw,
  facadeYaw: CRIQUE.yaw,
  lookAt: null,
  get lookTop() {
    return criqueLook();
  },
  decor: (returned = false) => {
    let f = decor4e.get(returned);
    if (!f) decor4e.set(returned, (f = criqueDecorFacets(returned)));
    return f;
  },
};

/**
 * La part du brouillard du lointain que garde le panache du volcan (comme celui du 5e) ; au lot 4, les îles du ciel et
 * les Aiguilles, au loin (sans ombre, comme la lumière du Phare du 5e) ; la coque du Rafiot, sans ombre, voilée comme
 * tout le reste (retouche 1 : éclairée, elle tirait sur l'orange).
 */
const THIN_FOG_4E = { plume: 0.45, islands: 0.7, aiguilles: 0.8, hull: 1 } as const;

/**
 * Le 4e (lot 1 du monde ouvert du 4e) : sa lumière chaude, à plat (aucun étage : la lumière par la hauteur n'y sert qu'à
 * éclaircir le brouillard sur le haut du volcan, qu'on voit de toute l'île), la lave figée et le panache dessinés sans
 * ombre (une lueur fixe, une fumée), la Crique et son aéronef.
 */
const WORLD_4E: LevelWorld = {
  sixth: false,
  field: buildHeightField4e,
  ground: (field) => (x, z) => criqueFloor(x, z) ?? groundOn4e(field, x, z),
  net: NETWORK_4E,
  ribbons: RIBBONS_4E,
  pathFacets: pathRibbons4e,
  tiles: { grid: TERRAIN_4E, facets: tileFacets4e, ground: tileGround4e, flora: tileFlora4e },
  seaPixels: seaPixels4e,
  water: WATER_TONES_4E,
  light: LIGHT_4E,
  sky: SKY_OF['4e'],
  horizon: HORIZON_COLOR_4E,
  shadowDir: SHADOW_DIR_4E,
  heightLight: HEIGHT_LIGHT_4E,
  thinFog: [
    { color: COLORS_4E.lava, fog: 1, unlit: true },
    // La Forge (lot 2) : la gueule allumée et les trois teintes de son allumage, sans ombre comme la lave.
    ...FORGE_GLOW_DRAWN.map((color) => ({ color, fog: 1, unlit: true })),
    ...[COLORS_4E.smoke, COLORS_4E.smokeShade, ...Object.values(RAFIOT_SMOKE_COLORS)].map((color) => ({ color, fog: THIN_FOG_4E.plume, unlit: true })),
    // La Crique, lot 4 : les îles du ciel et les Aiguilles, au loin, sans ombre ; la coque du Rafiot, sans ombre.
    ...Object.values(SKY_ISLAND_COLORS).map((color) => ({ color, fog: THIN_FOG_4E.islands, unlit: true })),
    ...Object.values(AIGUILLES_COLORS).map((color) => ({ color, fog: THIN_FOG_4E.aiguilles, unlit: true })),
    ...Object.values(RAFIOT_HULL_COLORS).map((color) => ({ color, fog: THIN_FOG_4E.hull, unlit: true })),
  ],
  departure: DEPARTURE_4E_SITE,
  fog: FOG_4E,
  mapOverlay: () => mapOverlay4e(),
};

/**
 * Les repères du 3e (relecture du Cirque, correction 8) : le Fanal, sa tour entière ; le pic, de son pied à sa pointe ; le
 * zeppelin et son rocher.
 */
const LANDMARKS_3E: readonly Landmark[] = (() => {
  const fanal = PLACES_3E.find((p) => p.id === 'fanal')!.center;
  const T = FANAL_TOWER_3E;
  const P = PEAK_3E;
  return [
    { min: { x: fanal.x - T.r0 - 1, y: 0, z: fanal.z + T.z - T.r0 - 1 }, max: { x: fanal.x + T.r0 + 1, y: T.y1 + 6, z: fanal.z + T.z + T.r0 + 1 }, place: 'fanal' },
    { min: { x: P.at.x - P.radius, y: 0, z: P.at.z - P.radius }, max: { x: P.at.x + P.radius, y: P.height, z: P.at.z + P.radius } },
    zeppelinBox3e(),
  ];
})();

let decor3e: Facets | null = null;
let farIsles3e: Facets | null = null;
let zeppelin3e: Facets | null = null;
const DEPARTURE_3E_SITE: Departure = {
  port: PARVIS_SITE,
  nef: NEF_3E,
  floor: parvisFloor,
  viewYaw: PARVIS_VIEW.yaw,
  facadeYaw: PARVIS.yaw,
  lookAt: null,
  lookTop: PARVIS_LOOK,
  decor: () => (decor3e ??= parvisDecorFacets()),
  offMap: () => (zeppelin3e ??= zeppelinFacets()),
  parures: nefParuresLocal,
  quayView: PARVIS_ARRIVAL,
};

/**
 * Le 3e (lot 1 du monde ouvert du 3e, GD-25) : un matin froid et clair, à plat (la lumière par la hauteur n'y sert qu'à
 * éclaircir le brouillard sur le pic, qu'on voit de toutes les terres) ; la mer de nuages sur le plan de l'eau ; le sol
 * où l'on marche passe sur la pierre du Parvis et sur la chaussée des deux petites arches des Prairies. Rien n'y est
 * dessiné sans ombre (aucune lueur, aucune fumée).
 */
const WORLD_3E: LevelWorld = {
  sixth: false,
  field: buildHeightField3e,
  ground: ground3e,
  net: NETWORK_3E,
  ribbons: RIBBONS_3E,
  pathFacets: pathRibbons3e,
  tiles: { grid: TERRAIN_3E, facets: tileFacets3e, ground: tileGround3e, flora: tileFlora3e },
  seaPixels: seaPixels3e,
  seaTexture: SEA_TEXTURE_3E,
  water: WATER_TONES_3E,
  light: LIGHT_3E,
  sky: SKY_OF['3e'],
  horizon: HORIZON_COLOR_3E,
  shadowDir: SHADOW_DIR_3E,
  heightLight: HEIGHT_LIGHT_3E,
  // Les archipels de la vue finale, au loin (./finalView3e.ts), et les lanternes d'ocre : la lumière du port des
  // Ferrailleurs se lit sur l'horizon nord.
  thinFog: [FAR_ISLES_3E.stone, FAR_ISLES_3E.stoneShade, FAR_ISLES_3E.green, FAR_ISLES_3E.tower, FAR_ISLES_3E.smoke, FAR_ISLES_3E.light].map((color) => ({ color, fog: FAR_ISLES_FOG_3E })),
  departure: DEPARTURE_3E_SITE,
  fog: FOG_3E,
  mapOverlay: () => mapOverlay3e(),
  landmarks: LANDMARKS_3E,
  finalView: {
    place: 'fanal',
    seconds: FINAL_VIEW_SECONDS_3E,
    still: FINAL_VIEW_3E.still,
    pose: finalViewPose3e,
    facets: () => (farIsles3e ??= farArchipelagos3e()),
  },
};

const WORLDS: Readonly<Record<OpenWorldLevel, LevelWorld>> = { '6e': WORLD_6E, '5e': WORLD_5E, '4e': WORLD_4E, '3e': WORLD_3E };

/** Ce que la vue lit du niveau `level`. */
export const levelWorld = (level: OpenWorldLevel): LevelWorld => WORLDS[level];
