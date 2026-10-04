// Le terrain du village : une île par biome (cœur 16 × 16 avec bornes de mission, relief léger, décor et créature, posé sur une terre
// plus large au relief varié, à son altitude), reliées par des ponts et des rampes de bois.
// Générateur pur (sans Three.js) : testable, et partagé entre la 3D et la vue simple. Le décor (arbres, décor du cœur,
// repères, cascades, habillage de la mer) est dessiné par ./decor.ts, et posé ici.
import { BLOC, BIOMES, BLOCKS, missionsJouables, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { lv2Courante } from '../../core/settings';
import { ARCHIPELAGOS, BRIDGES, bridgeState, bridgesOf, getArchipelago, isBiomeUnlocked, islandsOf, otherEnd, reachableIslands, type BridgeDef } from './archipelago';
import { LOW, walkPath, type Cell, type WalkGround } from './paths';
import {
  CORE,
  COTE_DU_COEUR,
  archipelagoOfIsland,
  bornesDuCoeur,
  coeurDe,
  DANS_LE_CIEL,
  inCoeurDOrigine,
  inCore,
  isLand,
  islandDef,
  landBox,
  landCells,
  landscape,
  margesDuCoeur,
  smoothNoise,
  mapOf,
  tirage,
  noise,
  type ArchipelagoId,
  type Decor,
  type Ground,
  type IslandDef,
  type LandCell,
} from './map';
import { DOCK_DX, VEHICLE_DECK, dockBox, dockCells, dockOrigin, dockPosts, shoreY, vehicleRestZ } from './harbour';
import { villageStage } from './villageStage';
import { kitReady, launchedStages, stageBuildingAt } from './vehicle';
import { groundLevelAt } from './ground';
import { CREATURE_CUBES } from './personnages/creatures';
import { GUARDIAN_CUBES } from './personnages/gardiens';
import type { CubeDeModele } from './personnages/ascii';
import { guardianStatus } from '../boss';
import type { PlaceId, VillagePlaceId, VoxelCube } from './cube';
import type { World } from '../engine';
import { ORIGINE_DES_MONUMENTS, decalageDesPlans, isPlanDone, zoneDesPlans, planCells, planOrigin, plansFor, type PlanDef } from './plans';
import { MONUMENT_ISLET, monumentsOf, type MonumentDef } from './monuments';
import { EMPRISE_DE_LA_SALLE, SALLE_DE_DEPART, modeleDeLaSalle } from './salle';
import { recetteDeLArchipel } from './assemblage';
import { casesDeLaPetiteConstruction, eauDeLaPetiteConstruction, estPosee, placeEcrite } from './petitesConstructions';
import { commandeDeLIle } from './commandes';
import {
  BASALT,
  CRYSTAL,
  DARK,
  DECOR,
  GRASS,
  HAY,
  LAVA,
  LEAF,
  MOSS,
  PINE,
  PUFFS,
  SMOKE,
  SNOW,
  TRUNK,
  WATER,
  cascades,
  decorate,
  landmark,
  pontonEtBarque,
  semerLaMer,
  type Put,
} from './decor';

/** Côté du cœur d'origine d'une île (en blocs) : le repère des clés ; l'étendue du cœur d'une île est `coeurDe` (./map). */
export const ISLAND = CORE;
/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;
/** Couches de roche qui s'amincissent sous une île en altitude (elle flotte). */
export const TAPER = 3;


/** Couleur délavée d'une île verrouillée (même calcul que la texture délavée en 3D). */
export function fade(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c: number) => Math.round((c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45);
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`;
}

/** Textures 3D par couleur de décor (les couleurs servent aussi à la vue simple et aux îles verrouillées). */
const TEXTURES: Record<string, string> = {
  [TRUNK]: 'tronc',
  [LEAF]: 'feuilles',
  [GRASS]: 'herbe',
  [BLOCKS[BLOC.terre].side]: 'terre',
  [BLOCKS[BLOC.pierre].side]: 'pierre',
  [BLOCKS[BLOC.sable].side]: 'sable',
  [BLOCKS[BLOC.verre].side]: 'verre',
  [BLOCKS[BLOC.or].side]: 'or',
  [BLOCKS[BLOC.bois].side]: 'planches',
  [BLOCKS[BLOC.brique].side]: 'brique',
  [BLOCKS[BLOC.galet].side]: 'galet',
  [BLOCKS[BLOC.obsidienne].side]: 'obsidienne',
  [BLOCKS[BLOC.glace].side]: 'glace',
  [BLOCKS[BLOC.toile].side]: 'toile',
  [BLOCKS[BLOC.panneau].side]: 'panneau',
  [BLOCKS[BLOC.tourbe].side]: 'tourbe',
  [BLOCKS[BLOC.acier].side]: 'acier',
  [BLOCKS[BLOC.calque].side]: 'calque',
  [BLOCKS[BLOC.ardoise].side]: 'ardoise',
  [BLOCKS[BLOC.parchemin].side]: 'parchemin',
  [BLOCKS[BLOC.marbre].side]: 'marbre',
  [BLOCKS[BLOC.quartz].side]: 'quartz',
  [BLOCKS[BLOC.prisme].side]: 'prisme',
  [BLOCKS[BLOC.lentille].side]: 'lentille',
  [BLOCKS[BLOC.cabine].side]: 'cabine',
  [BLOCKS[BLOC.cadran].side]: 'cadran',
  [BLOCKS[BLOC.tuile].side]: 'tuile',
  [BLOCKS[BLOC.lambris].side]: 'lambris',
  [BLOCKS[BLOC.velours].side]: 'velours',
  [BLOCKS[BLOC.rail].side]: 'rail',
  [BLOCKS[BLOC.antenne].side]: 'antenne',
  [BLOCKS[BLOC.taille].side]: 'taille',
  [BLOCKS[BLOC.dalle].side]: 'dalle',
  [BLOCKS[BLOC.osier].side]: 'osier',
  [BLOCKS[BLOC.bardeau].side]: 'bardeau',
  [BLOCKS[BLOC.poutre].side]: 'poutre',
  [BLOCKS[BLOC.vitrail].side]: 'vitrail',
  [BLOCKS[BLOC.engrenage].side]: 'engrenage',
  [BLOCKS[BLOC.miroir].side]: 'miroir',
  [BLOCKS[BLOC.lanterne].side]: 'lanterne',
  [BLOCKS[BLOC.barriere].side]: 'barriere',
  [BLOCKS[BLOC.escalier].side]: 'escalier',
  [SNOW]: 'nuage',
  [HAY]: 'or',
  [MOSS]: 'mousse',
  [BASALT]: 'basalte',
  [LAVA]: 'lave',
  [WATER]: 'eau',
  [PINE]: 'sapin',
  [CRYSTAL]: 'cristal',
};

/** Couleur du dessus d'une case de paysage selon son sol. */
const GROUND_COLOR: Record<Ground, string> = {
  herbe: GRASS,
  sable: BLOCKS[BLOC.sable].side,
  roche: BLOCKS[BLOC.pierre].side,
  neige: SNOW,
  eau: WATER,
  lave: LAVA,
  glace: BLOCKS[BLOC.glace].side,
  basalte: BASALT,
  mousse: MOSS,
};

/** Coin (x, y) du cœur de l'île d'un biome et altitude de son sol. */
export function islandOrigin(index: number): { ox: number; oy: number; oz: number } {
  const def = islandDef(BIOMES[index].id);
  return { ox: def.core.x, oy: def.core.y, oz: def.altitude };
}

/** Centre du cœur d'une île (coordonnées de grille) et altitude, pour y amener la caméra. */
export function islandCenter(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const c = coeurDe(def);
  return { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2, z: def.altitude };
}

/** Étendue d'un archipel (coordonnées de grille), terres, îlots et port compris. */
export function worldBounds(a: ArchipelagoId): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  return bornesDesIles(a, mapOf(a));
}

/** Les bornes de quelques îles d'un archipel, et de son port (voir `worldBounds`). */
function bornesDesIles(a: ArchipelagoId, iles: IslandDef[]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const def of iles) {
    const b = landBox(def);
    // Deux cases de marge : la couronne d'un grand arbre, l'écume d'une cascade débordent de la terre.
    minX = Math.min(minX, b.x0 - 2);
    maxX = Math.max(maxX, b.x1 + 2);
    minY = Math.min(minY, b.y0 - ISLET_H - ISLET_GAP);
    maxY = Math.max(maxY, b.y1 + 2);
  }
  const dock = dockBox(getArchipelago(a).port);
  minX = Math.min(minX, dock.x0 - 2);
  maxX = Math.max(maxX, dock.x1 + 2);
  minY = Math.min(minY, dock.y0 - 2);
  return { minX, maxX, minY, maxY };
}

/**
 * L'étendue à cadrer dans la vue d'ensemble : les îles ouvertes et celles qu'un ouvrage proposé peut atteindre,
 * avec une marge. Au début, deux îles et leurs voisines ; le cadre s'élargit à mesure que le monde s'ouvre.
 */
export function overviewBounds(a: ArchipelagoId, bridges: string[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const open = reachableIslands(bridges);
  const shown = new Set<BiomeId>([...open].filter((id) => archipelagoOfIsland(id) === a));
  // Les liaisons du port (GD-7) comptent dès le départ, avec leur tracé : le cadre ne bouge pas quand on les ouvre.
  const etoiles = BRIDGES.filter((b) => b.etoile && archipelagoOfIsland(b.from) === a);
  for (const b of BRIDGES) {
    if (archipelagoOfIsland(b.from) !== a || (!b.etoile && bridgeState(b, bridges) === 'far')) continue;
    shown.add(b.from);
    shown.add(b.to);
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const b of etoiles)
    for (const c of bridgePath(b)) {
      minX = Math.min(minX, c.x);
      maxX = Math.max(maxX, c.x);
      minY = Math.min(minY, c.y);
      maxY = Math.max(maxY, c.y);
    }
  for (const id of shown) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0 - ISLET_H - ISLET_GAP);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX: minX - 4, maxX: maxX + 4, minY: minY - 4, maxY: maxY + 4 };
}

/** Pivot maximal de la caméra vers le cœur du continent (radians) : le nord reste reconnaissable. */
export const VIEW_YAW_MAX = (40 * Math.PI) / 180;

/**
 * La zone que la caméra cadre quand le bonhomme se tient sur une île : cette île et ses voisines (reliées par un
 * ouvrage, construit ou non). Sur une île du bord, les voisines tirent l'image vers le continent : moins de mer.
 *
 * L'île de la LV2 (le Relais au 5e, le Jardin des heures au 4e) n'élargit jamais le cadrage de sa voisine (DA, 28/09,
 * LV2-4) : avec « Pas de LV2 », la vue reste celle d'avant l'île ; avec une LV2, elle ne l'accueillerait que si son
 * Gardien et son étiquette tenaient entiers au-dessus des boutons en 1024 × 768, 1280 × 800 et 800 × 1280 sans que
 * l'île du bonhomme rapetisse, ce qui n'est pas le cas (au bout de la crête, l'étiquette sort de l'écran à gauche, de
 * 65 à 340 px ; au 5e, celle du Relais aussi) : cadrage d'avant, sans entre-deux. Depuis l'île de la LV2, la voisine compte.
 *
 * Les liaisons du port (GD-7, `etoile`) n'y comptent pas : l'île au bout d'un long bac n'est pas une voisine, la vue
 * reste celle d'avant.
 */
export function viewZone(home: BiomeId): { minX: number; maxX: number; minY: number; maxY: number } {
  const ids = new Set<BiomeId>([home]);
  for (const b of bridgesOf(home)) {
    if (b.etoile) continue;
    const other = otherEnd(b, home);
    if (BIOMES.find((x) => x.id === other)?.subject === 'lv2') continue;
    ids.add(other);
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const id of ids) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Le pivot de la caméra depuis une île : vers la colonne centrale du continent, borné à VIEW_YAW_MAX de part et
 * d'autre du nord (plein pivot à 50 cases du centre). Positif : la caméra se place à l'ouest et regarde vers l'est.
 */
export function viewYaw(home: BiomeId): number {
  const c = islandCenter(home);
  // Seul l'écart est-ouest compte : la caméra regarde toujours vers le nord, on la tourne vers la colonne centrale.
  const dx = colonneCentrale(archipelagoOfIsland(home)) - c.x;
  return VIEW_YAW_MAX * Math.max(-1, Math.min(1, dx / 50));
}

/**
 * Les îles de LV2 qui ne comptent pas dans la colonne centrale : le Refuge des carnets (3e), posé au bord de l'archipel,
 * ne fait pas pivoter les caméras des autres îles, qui gardent leur cadrage (DA, LV2-5). Le Relais des voyageurs (5e) et
 * le Jardin des heures (4e) y comptent : leurs lots ont validé avec eux le cadrage de leur archipel, qu'on ne rouvre pas.
 */
export const HORS_DE_LA_COLONNE: readonly BiomeId[] = ['lv2-3e-travel'];

const colonnes = new Map<ArchipelagoId, number>();
/**
 * La colonne centrale d'un archipel, vers laquelle pivotent les caméras des îles : le milieu est-ouest de ses îles (sauf
 * `HORS_DE_LA_COLONNE`) et de son port.
 */
export function colonneCentrale(a: ArchipelagoId): number {
  const connue = colonnes.get(a);
  if (connue !== undefined) return connue;
  const b = bornesDesIles(
    a,
    mapOf(a).filter((d) => !HORS_DE_LA_COLONNE.includes(d.id)),
  );
  const x = (b.minX + b.maxX) / 2;
  colonnes.set(a, x);
  return x;
}

/** Île la plus proche d'un point de la grille d'un archipel (pour le toucher : une île ou le pont qui y mène). */
export function islandAt(a: ArchipelagoId, x: number, y: number): BiomeId {
  const islands = islandsOf(a);
  let best: BiomeId = islands[0].id;
  let bestD = Infinity;
  for (const b of islands) {
    const c = islandCenter(b.id);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * Relief léger : un plateau d'un bloc de haut sur la moitié arrière de l'île (loin de la créature),
 * aux coins arrondis, différent selon l'île. Hauteur du sol (0 ou 1) pour une case de l'île.
 */
/**
 * Le décor et le relief du cœur sont dessinés sur une grille de 12 × 12 (LAYOUT), posée dans le cœur de 16 × 16
 * avec une marge : les trois rangées de devant accueillent les bornes de mission, les colonnes de côté restent libres.
 */
const LAYOUT = 12;
export const LAYOUT_PAD = { x: 2, y: 3 };

/**
 * Sur les quatre îles-écoles, le plateau s'arrête à la colonne 11 (x < `FIN_DU_PLATEAU_DES_ECOLES`) : il passait sous
 * l'école, qui se tient de (12, 3) à (16, 6) (redistribution « Trois bandes », choix du mainteneur, 02/10/2026 ; seule
 * exception au relief figé de Blocland, docs/univers/blocland/fiche.md). Le reste du relief ne bouge pas.
 */
export const FIN_DU_PLATEAU_DES_ECOLES = 12;
let indexDesEcoles: ReadonlySet<number> | undefined;
const estIndexDEcole = (index: number) =>
  (indexDesEcoles ??= new Set(ARCHIPELAGOS.map((a) => BIOMES.findIndex((b) => b.id === a.school)))).has(index);

export function groundHeight(index: number, x: number, y: number): number {
  const lx = x - LAYOUT_PAD.x;
  const ly = y - LAYOUT_PAD.y;
  if (lx < 0 || ly < 0 || lx >= LAYOUT || ly >= LAYOUT) return 0;
  if (x >= FIN_DU_PLATEAU_DES_ECOLES && estIndexDEcole(index)) return 0;
  const fromBack = LAYOUT - 1 - lx;
  const shape = index % 3;
  // Le plateau est à l'arrière-droite, devant la zone des plans (qui reste plate).
  const inner = lx >= 7 && ly >= 2 && ly <= 5;
  if (!inner) return 0;
  if (shape === 0) return fromBack + Math.abs(ly - LAYOUT / 2 + 0.5) < 7.5 ? 1 : 0;
  if (shape === 1) return ly <= LAYOUT / 2 + 1 || fromBack < 2 ? 1 : 0;
  return fromBack < 3 || (ly >= 4 && ly <= LAYOUT - 5) ? 1 : 0;
}

/**
 * Les bornes de mission d'une île : une par mission, alignées sur la rangée de devant (côté caméra), en cases relatives
 * au cœur. On touche une borne pour lancer sa mission.
 */
export const QUEST_ROW = 1;
/**
 * Les places des bornes d'une île-école, au pas de 4, centrées sur la visée de la caméra (le milieu du cœur, x = 8) :
 * trois missions prennent les trois du milieu, (4,1) (8,1) (12,1) ; (0,1) et (16,1) attendent une île à cinq missions
 * (redistribution « Trois bandes », choix du mainteneur, 02/10/2026). Seules les bornes se tiennent devant : l'école est
 * au milieu, derrière la dernière.
 */
export const PLACES_DES_BORNES_DES_ECOLES = [0, 4, 8, 12, 16] as const;
/**
 * Les colonnes des bornes d'une île-école à `n` missions, prises dans `PLACES_DES_BORNES_DES_ECOLES` à partir du milieu :
 * 1 → 8 ; 3 → 4, 8, 12 ; 5 → toutes. Un nombre pair ne se centre pas au pas de 4 : il penche d'une place vers la gauche
 * (x bas), 2 → 4, 8 et 4 → 0, 4, 8, 12, plutôt que de quitter la grille des places. Au-delà de 5, `null` : l'île reprend
 * le pas de 3 des autres îles. Aujourd'hui, les quatre îles-écoles ont 3 missions (troisBandes.test.ts).
 */
export function placesDesBornes(n: number): readonly number[] | null {
  const places = PLACES_DES_BORNES_DES_ECOLES;
  if (n > places.length) return null;
  const debut = Math.floor((places.length - n) / 2);
  return places.slice(debut, debut + n);
}
export function questStations(id: BiomeId): { typeId: string; x: number; y: number }[] {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) return [];
  const missions = missionsJouables(biome);
  const places = isSchoolIsland(id) ? placesDesBornes(missions.length) : null;
  if (places) return missions.map((ex, i) => ({ typeId: ex.id, x: places[i], y: QUEST_ROW }));
  return missions.map((ex, i) => ({ typeId: ex.id, x: 3 + 3 * i, y: QUEST_ROW }));
}

/** La direction de la vue d'une île (x, y de la grille, et hauteur) : de trois quarts avant-droite, plus haute que la vue du bonhomme. */
export const VUE_DE_L_ILE = { dx: 0.7, dy: -0.7, up: 0.9 };

/** Une borne telle que la vue de l'île la voit : sa case (coordonnées du monde, ou du cœur) et le dessus du sol sous elle. */
export interface BorneVue {
  x: number;
  y: number;
  base: number;
}

/** La distance de la caméra de la vue d'une île au point visé (en paysage ; la vue en portrait recule, three/camera.ts). */
export const DISTANCE_DE_LA_VUE_DE_L_ILE = 30;
/** La caméra vise un bloc au-dessus du point qu'elle regarde (le centre d'une île à son altitude, le bonhomme). */
export const VISEE_AU_DESSUS_DU_SOL = 1;

/** La direction de la vue d'une île, pivot compris (`viewYaw`), non normée : x, y de la grille, z en hauteur. */
function directionDeLaVue(id: BiomeId): [number, number, number] {
  const yaw = -viewYaw(id);
  const { dx, dy, up } = VUE_DE_L_ILE;
  return [dx * Math.cos(yaw) - dy * Math.sin(yaw), dx * Math.sin(yaw) + dy * Math.cos(yaw), up];
}

/** Vers la caméra de la vue d'une île, pivot compris (`viewYaw`), en cases : x, y de la grille, z en hauteur. */
export function versLaCamera(id: BiomeId): [number, number, number] {
  const v = directionDeLaVue(id);
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * La place de la caméra de la vue d'une île (x, y de la grille, z en hauteur), en paysage et sans le glissement vers un
 * grand repère d'Archipéo (world/cadrage.ts) : ce que calcule three/camera.ts dans le cas simple.
 */
export function cameraDeLIle(id: BiomeId): { x: number; y: number; z: number } {
  const c = islandCenter(id);
  const [dx, dy, up] = directionDeLaVue(id);
  const d = DISTANCE_DE_LA_VUE_DE_L_ILE;
  return { x: c.x + d * dx, y: c.y + d * dy, z: c.z + VISEE_AU_DESSUS_DU_SOL + d * up };
}

/**
 * La vue d'une île panneau ouvert, telle que la lit la règle de cadrage des petites constructions (GD-7, PR 3, directeur
 * artistique) : une tablette à l'horizontale (1024 × 768), le panneau de l'île à droite (26rem au texte de 20 px et son
 * liseré de 8 px : global.css, `.island-sheet`), la scène dans les 496 px de gauche, donc en portrait (three/camera.ts
 * recule alors de 1/√aspect), champ vertical de 40° (WorldCanvas.tsx). En bas, les deux rangées de boutons du monde ; en
 * haut à droite, Pause et l'archipel. En pixels CSS.
 */
export const VUE_DE_L_ILE_PANNEAU_OUVERT = { largeur: 496, hauteur: 768, champ: 40, bas: 130, boutons: { largeur: 100, hauteur: 130 } } as const;

/** Un point de la grille (x, y, z en hauteur, coordonnées du monde) à l'écran de la vue de l'île panneau ouvert, en pixels CSS. */
export type ProjectionDeLaVue = (x: number, y: number, z: number) => [number, number];

/**
 * La projection de la vue d'une île panneau ouvert (`VUE_DE_L_ILE_PANNEAU_OUVERT`), le calcul de three/camera.ts
 * (`framing`) et de `THREE.PerspectiveCamera.lookAt` refait sans Three.js : la scène y est en (x, hauteur, y).
 * `cube` : la taille d'une case à l'écran, au point visé, en pixels ; `oeil` : la place de la caméra (x, y de la grille,
 * z en hauteur).
 */
export function projectionDeLaVueDeLIle(id: BiomeId): { projeter: ProjectionDeLaVue; cube: number; oeil: { x: number; y: number; z: number } } {
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  const aspect = V.largeur / V.hauteur;
  const c = islandCenter(id);
  const [dx, dy, up] = directionDeLaVue(id);
  const d = DISTANCE_DE_LA_VUE_DE_L_ILE * (aspect < 1 ? 1 / Math.sqrt(Math.max(0.4, aspect)) : 1);
  const cible = [c.x, c.z + VISEE_AU_DESSUS_DU_SOL, c.y];
  const oeil = [c.x + d * dx, c.z + VISEE_AU_DESSUS_DU_SOL + d * up, c.y + d * dy];
  const norme = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const az = norme([oeil[0] - cible[0], oeil[1] - cible[1], oeil[2] - cible[2]]);
  // L'axe des x de la caméra : le haut (0, 1, 0) vectoriel l'arrière, puis celui des y : l'arrière vectoriel les x.
  const ax = norme([az[2], 0, -az[0]]);
  const ay = [az[1] * ax[2] - az[2] * ax[1], az[2] * ax[0] - az[0] * ax[2], az[0] * ax[1] - az[1] * ax[0]];
  const t = Math.tan((V.champ * Math.PI) / 360);
  const projeter: ProjectionDeLaVue = (x, y, z) => {
    const v = [x - oeil[0], z - oeil[1], y - oeil[2]];
    const profondeur = -(v[0] * az[0] + v[1] * az[1] + v[2] * az[2]);
    const px = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) / (profondeur * t * aspect);
    const py = (v[0] * ay[0] + v[1] * ay[1] + v[2] * ay[2]) / (profondeur * t);
    return [((px + 1) / 2) * V.largeur, ((1 - py) / 2) * V.hauteur];
  };
  return { projeter, cube: V.hauteur / (2 * d * t), oeil: { x: oeil[0], y: oeil[2], z: oeil[1] } };
}

/** Des points de la borne (socle et ardoise, deux cubes sur son sol), un peu en retrait de ses arêtes : u, v dans la case, w au-dessus du sol. */
const POINTS_DE_LA_BORNE: [number, number, number][] = [0.05, 0.5, 0.95].flatMap((u) =>
  [0.05, 0.5, 0.95].flatMap((v) => [1.05, 1.5, 2, 2.5, 2.95].map((w): [number, number, number] => [u, v, w])),
);
/** Le plus bas de ces points au-dessus du sol de la borne. */
const PIED_DE_LA_BORNE = 1.05;
/** La marge autour d'un cube de décor : le rendu Archipéo le dessine en volume un peu plus large, et la vue est en perspective. */
const MARGE_DEVANT_LA_BORNE = 0.1;
/**
 * Le plus haut qu'un cube du décor monte au-dessus du sol d'une borne, en cubes, marge comprise : un arbre ou un sapin
 * (feuillage à 5 cubes au-dessus de son sol, `BLOCS_DU_DECOR`) sur un relief qui monte de 2 blocs au plus dans le voisinage
 * des bornes, et deux de plus pour un relief ou un décor à venir.
 */
const HAUTEUR_MAX_DU_DECOR = 9;
/**
 * La portée, en cases : plus loin de la borne (en x ou en y), un cube du décor passe sous tous les rayons de la vue de
 * l'île, qui ne s'éloignent que de `hypot(dx, dy) / up` (1,1) case par bloc de montée ; une case de plus pour le feuillage,
 * qui déborde d'une case de son tronc.
 */
export const PORTEE_DEVANT_LA_BORNE = Math.ceil((HAUTEUR_MAX_DU_DECOR * Math.hypot(VUE_DE_L_ILE.dx, VUE_DE_L_ILE.dy)) / VUE_DE_L_ILE.up) + 1;

/** La case (x, y) est-elle assez près d'une borne pour qu'un décor posé là puisse la cacher (voir `PORTEE_DEVANT_LA_BORNE`) ? */
export function presDUneBorne(bornes: readonly BorneVue[], x: number, y: number, marge = 0): boolean {
  const p = PORTEE_DEVANT_LA_BORNE + marge;
  for (const b of bornes) if (Math.abs(x - b.x) <= p && Math.abs(y - b.y) <= p) return true;
  return false;
}

/**
 * Le cube (x, y, z) cache-t-il une borne dans la vue de l'île ? Un rayon part de chaque point de la borne vers la
 * caméra (vue de l'île, pivot compris) ; le cube, élargi de sa marge, ne doit en couper aucun. Seuls les cubes posés
 * près de la borne (`PORTEE_DEVANT_LA_BORNE`) et au-dessus de son sol sont essayés ; un cube que les rayons ne peuvent
 * atteindre à sa hauteur est écarté avant eux. Un cube collé à la borne, à sa hauteur, compte comme cachant quelle que
 * soit la direction de la vue : élargi de sa marge, il contient déjà des points de la borne.
 */
export function cacheUneBorne(bornes: readonly BorneVue[], vers: readonly [number, number, number], x: number, y: number, z: number): boolean {
  const m = MARGE_DEVANT_LA_BORNE;
  const minX = x - m;
  const minY = y - m;
  const minZ = z - m;
  const maxX = x + 1 + m;
  const maxY = y + 1 + m;
  const maxZ = z + 1 + m;
  const [vx, vy, vz] = vers;
  for (const b of bornes) {
    if (z + 1 <= b.base + 1 || Math.abs(x - b.x) > PORTEE_DEVANT_LA_BORNE || Math.abs(y - b.y) > PORTEE_DEVANT_LA_BORNE) continue;
    // Rejet précoce : les rayons montent ; à la hauteur du haut du cube, ils ne sont pas allés plus loin que `t` en x et en y.
    if (vz > 1e-9) {
      const t = (maxZ - b.base - PIED_DE_LA_BORNE) / vz;
      if (t < 0) continue;
      const bx0 = b.x + 0.05 + Math.min(0, vx * t);
      const bx1 = b.x + 0.95 + Math.max(0, vx * t);
      const by0 = b.y + 0.05 + Math.min(0, vy * t);
      const by1 = b.y + 0.95 + Math.max(0, vy * t);
      if (bx1 < minX || bx0 > maxX || by1 < minY || by0 > maxY) continue;
    }
    for (const [u, v, w] of POINTS_DE_LA_BORNE) {
      const ox = b.x + u;
      const oy = b.y + v;
      const oz = b.base + w;
      let t0 = 0;
      let t1 = Infinity;
      // Les trois dalles du cube, l'une après l'autre (x, y, puis la hauteur).
      for (let j = 0; j < 3 && t0 <= t1; j++) {
        const o = j === 0 ? ox : j === 1 ? oy : oz;
        const d = j === 0 ? vx : j === 1 ? vy : vz;
        const lo = j === 0 ? minX : j === 1 ? minY : minZ;
        const hi = j === 0 ? maxX : j === 1 ? maxY : maxZ;
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) t0 = Infinity;
          continue;
        }
        const a = (lo - o) / d;
        const c = (hi - o) / d;
        t0 = Math.max(t0, Math.min(a, c));
        t1 = Math.min(t1, Math.max(a, c));
      }
      if (t0 <= t1) return true;
    }
  }
  return false;
}

const rangeesDevant = new Map<BiomeId, ReadonlySet<string>>();
/**
 * La rangée de côte devant les bornes d'une île-école (l'île de l'école de son archipel, `school`) : la première rangée
 * de côte hors du cœur, côté caméra (y = bord avant du cœur − 1), de la case droit devant la première borne jusqu'à celle
 * que traverse l'axe de la caméra de la vue de l'île (`versLaCamera`, pivot compris) depuis la dernière, une case de plus
 * de chaque côté. Aucun décor n'y est posé : rien de rouge ni de touffu entre l'élève et les bornes (DA, 01/10/2026 :
 * trois champignons rouges devant celles de la Forêt). Cases du monde (« x,y ») ; vide hors des îles-écoles.
 * La bande reste dans la portée des bornes (`PORTEE_DEVANT_LA_BORNE`), où `poserLIle` essaie chaque élément du décor.
 */
export function rangeeDevantLesBornes(id: BiomeId): ReadonlySet<string> {
  const connue = rangeesDevant.get(id);
  if (connue) return connue;
  const out = new Set<string>();
  if (isSchoolIsland(id)) {
    const def = islandDef(id);
    const y = coeurDe(def).y0 - 1;
    const [vx, vy] = versLaCamera(id);
    for (const st of questStations(id)) {
      const bx = def.core.x + st.x + 0.5;
      const by = def.core.y + st.y + 0.5;
      // Où l'axe borne → caméra traverse le milieu de la rangée (la caméra est devant : vy < 0).
      const xr = vy < -1e-9 ? bx + (vx * (by - (y + 0.5))) / -vy : bx;
      const lo = Math.min(bx, xr) - 1.5;
      const hi = Math.max(bx, xr) + 1.5;
      for (let x = Math.ceil(lo - 0.5); x + 0.5 <= hi; x++) out.add(`${x},${y}`);
    }
  }
  rangeesDevant.set(id, out);
  return out;
}

/** Les cubes d'un objet haut du quai au-dessus de son sol (le mât et la toile d'un fanion, la fumée d'un foyer). */
const HAUTEURS_D_UN_OBJET_HAUT = [0, 1, 2, 3] as const;

const STEP = '#8f8f8f';

/**
 * Les ports d'attache d'une île (étape J5) : là où chacun de ses ouvrages la touche, la première case de l'ouvrage de
 * son côté, dans le repère de l'île. Une côte dessinée par île (R4b) les lit pour laisser l'ouvrage aborder.
 */
export function portsDAttache(id: BiomeId): { ouvrage: string; local: { x: number; y: number; z: number } }[] {
  const o = origineDe(id);
  return bridgesOf(id).map((def) => {
    const path = bridgePath(def);
    const c = def.from === id ? path[0] : path[path.length - 1];
    return { ouvrage: def.id, local: { x: c.x - o.x, y: c.y - o.y, z: c.z - o.z } };
  });
}

/**
 * Le tracé d'un ouvrage entre deux îles : de bord de terre à bord de terre, sur la ligne qui joint les deux cœurs.
 * Deux îles l'une devant l'autre : l'ouvrage part du côté droit du cœur (l'îlot du Gardien est devant, à gauche),
 * descend jusqu'au bord de l'île de devant, fait un coude, puis y entre. Une liaison du port en contour (`via`, GD-7)
 * passe par ses points de passage. Chaque case a son altitude (interpolée).
 */
export function bridgePath(def: BridgeDef): { x: number; y: number; z: number; climbing: boolean; dx: number; dy: number }[] {
  return casesDeLOuvrage(def).map((c) => ({ x: c.x, y: c.y, z: c.z, climbing: c.climbing, dx: c.dx, dy: c.dy }));
}

/**
 * Les cases d'un ouvrage (`bridgePath`), chacune avec son tronçon : le segment du tracé, d'un point au suivant (0 depuis
 * l'île `from`). La flèche de la Carte reste sur le premier depuis l'île de départ (`placesDeLaFleche`).
 */
export function casesDeLOuvrage(def: BridgeDef): { x: number; y: number; z: number; climbing: boolean; dx: number; dy: number; troncon: number }[] {
  const a = islandDef(def.from);
  const b = islandDef(def.to);
  const vertical = Math.abs(b.core.y - a.core.y) >= Math.abs(b.core.x - a.core.x);
  const anchor = (d: IslandDef) => {
    const c = coeurDe(d);
    return { x: vertical ? c.x1 - 1 : (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 };
  };
  const ca = anchor(a);
  const cb = anchor(b);
  const points = [ca];
  // Un bac en contour (GD-7) : ses points de passage, puis l'ancrage de l'île d'arrivée ; pas de coude calculé.
  if (def.via) points.push(...def.via);
  else if (vertical && ca.x !== cb.x) {
    const front = a.core.y < b.core.y ? a : b;
    const jog = coeurDe(front).y1 + front.ext.back + 1;
    points.push({ x: ca.x, y: jog }, { x: cb.x, y: jog });
  }
  points.push(cb);
  const cells: { x: number; y: number; troncon: number }[] = [];
  const seen = new Set<string>();
  for (let s = 0; s + 1 < points.length; s++) {
    const p = points[s];
    const q = points[s + 1];
    const steps = Math.max(1, Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(p.x + ((q.x - p.x) * i) / steps);
      const y = Math.floor(p.y + ((q.y - p.y) * i) / steps);
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x, y, troncon: s });
    }
  }
  // Un sentier suit la terre : de bord de cœur à bord de cœur, posé sur le sol. Les autres ouvrages franchissent
  // l'eau : on ne garde que la partie hors des deux terres.
  let first = cells.findIndex((c) => (def.kind === 'sentier' ? !inCore(a, c.x, c.y) : !isLand(a, c.x, c.y)));
  let last = cells.length - 1;
  while (last > 0 && (def.kind === 'sentier' ? inCore(b, cells[last].x, cells[last].y) : isLand(b, cells[last].x, cells[last].y))) last--;
  if (first < 0 || first > last) {
    first = 0;
    last = cells.length - 1;
  }
  const span = cells.slice(first, last + 1);
  let prevZ = a.altitude;
  return span.map((c, i) => {
    const z = def.kind === 'sentier' ? groundLevelAt(c.x, c.y) : Math.round(a.altitude + ((b.altitude - a.altitude) * (i + 1)) / (span.length + 1));
    const climbing = z !== prevZ;
    prevZ = z;
    const next = span[Math.min(i + 1, span.length - 1)];
    const prev = span[Math.max(i - 1, 0)];
    return { x: c.x, y: c.y, z, climbing, dx: Math.sign(next.x - prev.x), dy: Math.sign(next.y - prev.y), troncon: c.troncon };
  });
}

/** Une case d'une liaison, et le tronçon de son tracé où elle est (`casesDeLOuvrage`). */
export interface CaseDeLiaison extends Cell {
  troncon: number;
}

/**
 * L'indice de la dernière case du premier tronçon d'une liaison (`cases`, depuis l'île de départ), avant son premier
 * coude. Un décalage d'une seule case entre deux tronçons de même sens (le pas de côté d'un pont presque droit, quand ses
 * deux ancrages ne sont pas alignés) n'est pas un coude : le tracé y continue tout droit.
 */
export function premierCoude(cases: readonly CaseDeLiaison[]): number {
  const fin = (debut: number) => {
    let i = debut;
    while (i + 1 < cases.length && cases[i + 1].troncon === cases[debut].troncon) i++;
    return i;
  };
  const sens = (a: number, b: number) => `${Math.sign(cases[b].x - cases[a].x)},${Math.sign(cases[b].y - cases[a].y)}`;
  let coude = fin(0);
  if (coude === 0) return 0;
  const premier = sens(0, coude);
  // Un pas de côté d'une case, puis un tronçon dans le même sens que le premier : le tracé continue.
  while (coude + 2 < cases.length && fin(coude + 1) === coude + 1) {
    const suite = fin(coude + 2);
    if (suite === coude + 2 || sens(coude + 2, suite) !== premier) break;
    coude = suite;
  }
  return coude;
}

/** La flèche d'un ouvrage se pose à tant de cases de la première case d'eau, vers l'arrivée. */
export const FLECHE_APRES_LA_RIVE = 3;

/**
 * Les places de la flèche d'un ouvrage sur sa liaison (`cases`, de l'île de départ à l'île d'arrivée), de la voulue à
 * la dernière permise (décision du directeur artistique, GD-7, PR 2) : la première case d'eau du tracé, puis
 * `FLECHE_APRES_LA_RIVE` cases plus loin ; jamais au-delà du milieu de la liaison ni hors du premier tronçon (le premier
 * coude d'un ouvrage en contour) ; jamais sur une case de terre (`terre`, n'importe quelle île). Les suivantes : celles où
 * elle glisse vers l'arrivée quand une étiquette occupe sa place, aux mêmes limites. Sans aucune case d'eau (un sentier,
 * posé sur l'isthme), les cases du tracé comptent toutes. Vide pour une liaison sans case.
 */
export function placesDeLaFleche(cases: readonly CaseDeLiaison[], terre: (x: number, y: number) => boolean): Cell[] {
  if (!cases.length) return [];
  const eau = cases.some((c) => !terre(c.x, c.y)) ? (c: Cell) => !terre(c.x, c.y) : () => true;
  const milieu = Math.floor((cases.length - 1) / 2);
  const limite = Math.min(milieu, premierCoude(cases));
  const rive = cases.findIndex(eau);
  const cell = (c: CaseDeLiaison): Cell => ({ x: c.x, y: c.y, z: c.z });
  // La rive au-delà de la limite (une liaison qui longe une terre) : la flèche se pose sur la première case d'eau.
  if (rive > limite) return [cell(cases[rive])];
  const places = cases.slice(Math.min(rive + FLECHE_APRES_LA_RIVE, limite), limite + 1).filter(eau);
  return (places.length ? places : [cases[rive]]).map(cell);
}

/**
 * Au-delà de ce nombre de cases, un ouvrage est une longue traversée (GD-7) : un bac n'a plus qu'un poteau toutes les
 * quatre cases (`bridge`), et la caméra ne suit plus le bonhomme qui le prend, elle cadre son départ et son arrivée
 * (`cadreDeTraversee`).
 */
export const BAC_LONG = 36;

/**
 * Un ouvrage entre deux îles, selon sa nature : pont de planches (marches quand il monte), bac (poteaux et radeau
 * au fil de l'eau), escalier taillé dans la pierre, tunnel (galerie voûtée, lanternes), col (escalier à garde-fou).
 * Fantôme tant qu'il n'est pas construit.
 */
function bridge(def: BridgeDef, cubes: VoxelCube[], ghost: boolean, occupied: Set<string>): void {
  const path = bridgePath(def);
  const onPath = new Set(path.map((c) => `${c.x},${c.y}`));
  // Un cube d'ouvrage ne remplace jamais un cube du terrain (un buisson sur l'isthme, par exemple).
  const add = (x: number, y: number, z: number, color: string, texture: string, top?: string) => {
    const key = `${x},${y},${z}`;
    if (occupied.has(key)) return;
    occupied.add(key);
    cubes.push({ x, y, z, color, top, texture, tag: def.to, bridge: def.id, ghost: ghost || undefined });
  };
  // À côté du passage (pilier, garde-fou, poteau) : jamais sur une case du tracé, où le bonhomme marche.
  const beside = (x: number, y: number, z: number, color: string, texture: string) => {
    if (onPath.has(`${x},${y}`)) return;
    add(x, y, z, color, texture);
  };
  const n = path.length;
  path.forEach((c, i) => {
    // Perpendiculaire au tracé (pour les arches et le garde-fou).
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    switch (def.kind) {
      case 'sentier':
        // Des pierres de gué une case sur deux, posées sur le sol de l'isthme.
        if (i % 2 === 0) add(c.x, c.y, c.z + 1, BLOCKS[BLOC.galet].side, 'galet');
        break;
      case 'pont':
        add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS[BLOC.escalier].top : undefined);
        break;
      case 'bac': {
        // Un radeau de trois planches au milieu, des poteaux de bois qui tiennent la corde de halage : toutes les trois
        // cases, toutes les quatre sur un long bac (GD-7, `BAC_LONG`).
        const mid = Math.abs(i - (n - 1) / 2) <= 1;
        if (mid) {
          add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, 'planches');
          if (i === Math.floor((n - 1) / 2)) add(c.x + px, c.y + py, c.z, BLOCKS[BLOC.bois].side, 'planches');
        } else if (i % (n > BAC_LONG ? 4 : 3) === 0 || i === n - 1) add(c.x, c.y, c.z, TRUNK, 'tronc');
        break;
      }
      case 'escalier':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        break;
      case 'col':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        if (i % 2 === 0) beside(c.x + px, c.y + py, c.z + 1, BLOCKS[BLOC.barriere].side, 'barriere');
        break;
      case 'tunnel': {
        add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS[BLOC.escalier].top : undefined);
        // Une arche de pierre toutes les trois cases, une lanterne au sommet d'une arche sur deux.
        if (i % 3 === 1 && i < n - 1) {
          // Assez haute pour que le bonhomme (deux blocs) passe dessous : piliers de trois, clé de voûte au quatrième.
          for (const side of [-1, 1]) for (let up = 1; up <= 3; up++) beside(c.x + side * px, c.y + side * py, c.z + up, BLOCKS[BLOC.pierre].side, 'pierre');
          const lit = ((i - 1) / 3) % 2 === 0;
          add(c.x, c.y, c.z + 4, lit ? BLOCKS[BLOC.lanterne].side : BLOCKS[BLOC.pierre].side, lit ? 'lanterne' : 'pierre');
        }
        break;
      }
    }
  });
  // Une lanterne sur un poteau à chaque bout, à côté du passage (le bonhomme ne la traverse pas) : la nuit, les
  // chemins se devinent de loin.
  for (const c of [path[0], path[n - 1]]) {
    if (!c) continue;
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    const base = def.kind === 'sentier' ? c.z + 1 : c.z;
    beside(c.x + px, c.y + py, base, TRUNK, 'tronc');
    beside(c.x + px, c.y + py, base + 1, BLOCKS[BLOC.lanterne].side, 'lanterne');
  }
}

let sentierCache: Set<string> | null = null;
/** Les cases des sentiers (pierres de gué) et leurs voisines : le décor des isthmes les laisse libres (feuillages compris). */
function nearSentier(x: number, y: number): boolean {
  if (!sentierCache) sentierCache = new Set(BRIDGES.filter((b) => b.kind === 'sentier').flatMap((b) => bridgePath(b).map((c) => `${c.x},${c.y}`)));
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (sentierCache.has(`${x + dx},${y + dy}`)) return true;
  return false;
}

/**
 * Les abords des ouvrages d'une île dans les marges de son cœur (`margesDuCoeur`) : de l'amorce de chaque ouvrage au
 * cœur d'origine, la case du passage et ses voisines. Le décor des marges les laisse libres : le bonhomme y va tout
 * droit du cœur à l'ouvrage. Vide pour une île sans marges. Mémorisé (les ouvrages et les marges ne bougent pas).
 */
const abordsCache = new Map<BiomeId, ReadonlySet<string>>();

function abordsDansLesMarges(def: IslandDef): ReadonlySet<string> {
  const connus = abordsCache.get(def.id);
  if (connus) return connus;
  const out = new Set<string>();
  abordsCache.set(def.id, out);
  if (!margesDuCoeur(def).length) return out;
  for (const b of bridgesOf(def.id)) {
    const path = bridgePath(b);
    if (!path.length) continue;
    const depart = b.from === def.id;
    const bout = depart ? path[0] : path[path.length - 1];
    // Vers l'intérieur de l'île : à rebours du tracé à son départ, dans son sens à son arrivée.
    const [sx, sy] = depart ? [-bout.dx, -bout.dy] : [bout.dx, bout.dy];
    if (!sx && !sy) continue;
    for (let k = 0, x = bout.x, y = bout.y; k <= CORE && !inCoeurDOrigine(def, x, y); k++, x += sx, y += sy)
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(`${x + dx},${y + dy}`);
  }
  return out;
}

/**
 * Le pied des ouvrages d'une île, partout sur l'île (pas seulement dans les marges) : le bout de chaque ouvrage et ses
 * huit voisines. Le décor haut de la côte (arbre, sapin, rocher…) n'y pose rien, feuillage compris : le bonhomme
 * descend toujours d'un ouvrage sur le sol libre (un sapin bouchait la sortie du pont de la Plaine des nombres, et le
 * bonhomme passait au travers, 04/10/2026). Mémorisé (les ouvrages ne bougent pas).
 */
const piedsCache = new Map<BiomeId, ReadonlySet<string>>();

function piedsDesOuvrages(def: IslandDef): ReadonlySet<string> {
  const connus = piedsCache.get(def.id);
  if (connus) return connus;
  const out = new Set<string>();
  piedsCache.set(def.id, out);
  for (const b of bridgesOf(def.id)) {
    const path = bridgePath(b);
    if (!path.length) continue;
    const bout = b.from === def.id ? path[0] : path[path.length - 1];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(`${bout.x + dx},${bout.y + dy}`);
  }
  return out;
}

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };

/** Où le bonhomme se tient sur une île (coordonnées du monde, z sous ses pieds : le dessus du bloc de sol). */
export function avatarHome(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  // Le bloc de sol du cœur est en z = altitude (+ 1 sur le plateau) : on se tient sur son dessus, comme les créatures.
  const z = def.altitude + groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y) + 1;
  return { x: def.core.x + AVATAR_HOME.x, y: def.core.y + AVATAR_HOME.y, z };
}

/** Les cases où marche le bonhomme sur un ouvrage, dans le sens de `from` à l'autre bout (exportée pour les tests). */
export function tablier(def: BridgeDef, from: BiomeId): { x: number; y: number; z: number }[] {
  // Sur un ouvrage on marche sur le tablier (z + 1) ; sur un sentier, de pierre de gué en pierre de gué (la pierre est
  // posée sur le sol en z + 1, on marche dessus : z + 2).
  const deck =
    def.kind === 'sentier'
      ? bridgePath(def)
          .map((c, i) => ({ x: c.x, y: c.y, z: c.z + 2, stone: i % 2 === 0 }))
          .filter((c) => c.stone)
          .map(({ x, y, z }) => ({ x, y, z }))
      : bridgePath(def).map((c) => ({ x: c.x, y: c.y, z: c.z + 1 }));
  if (def.from !== from) deck.reverse();
  return deck;
}

/**
 * L'itinéraire du bonhomme d'une île à une autre, en marchant sur les ouvrages construits (le plus court chemin en
 * cases, GD-7 : un long bac du port ne sert que s'il raccourcit vraiment), ou `null` s'il n'y en a pas. Une suite de
 * points (x, y, z du sol sous ses pieds). Une île traversée n'est pas un détour par sa place : il va d'un ouvrage au
 * suivant. Avec la grille de marche (`ground`), il suit le sol et contourne arbres, bornes, maisons et créatures ; sans
 * elle, il va en ligne droite. Il s'arrête à sa place sur l'île d'arrivée, ou en `end` (la case du sol qu'on a touchée) ;
 * il part de sa place, ou de `start`.
 */
export function avatarRoute(
  from: BiomeId,
  to: BiomeId,
  bridges: string[],
  ground?: WalkGround,
  /**
   * `end` : là où il s'arrête sur l'île d'arrivée (la case touchée), plutôt qu'à sa place ; `start` : là d'où il part sur
   * l'île de départ (là où l'élève l'a envoyé), plutôt que de sa place.
   */
  { end, start }: { end?: { x: number; y: number; z: number }; start?: { x: number; y: number; z: number } } = {},
): { x: number; y: number; z: number }[] | null {
  if (from === to) return [end ?? avatarHome(from)];
  const depart = start ?? avatarHome(from);
  const arrivee = end ?? avatarHome(to);
  // À peu près le plus court chemin en cases (Dijkstra sur les îles) : sur une île, à vol d'oiseau du bout d'un ouvrage
  // au début du suivant (la marche réelle contourne parfois une borne ou un arbre) ; sur un ouvrage, sa longueur. Une
  // île est atteinte au bout d'un ouvrage : c'est de là qu'on repart.
  type Etape = { cout: number; at: { x: number; y: number; z: number }; via: BridgeDef | null; deck: { x: number; y: number; z: number }[] };
  const best = new Map<BiomeId, Etape>([[from, { cout: 0, at: depart, via: null, deck: [] }]]);
  const done = new Set<BiomeId>();
  for (;;) {
    let here: BiomeId | null = null;
    let e: Etape | null = null;
    for (const [id, etape] of best)
      if (!done.has(id) && (e === null || etape.cout < e.cout)) {
        here = id;
        e = etape;
      }
    if (here === null || e === null || here === to) break;
    done.add(here);
    for (const b of bridgesOf(here)) {
      if (bridgeState(b, bridges) !== 'built') continue;
      const there = otherEnd(b, here);
      if (done.has(there)) continue;
      const deck = tablier(b, here);
      if (!deck.length) continue;
      const bout = deck[deck.length - 1];
      // Sur l'île d'arrivée, le pas jusqu'à sa place (ou la case touchée) compte : deux ouvrages n'y abordent pas au même endroit.
      const fin = there === to ? Math.hypot(arrivee.x - bout.x, arrivee.y - bout.y) : 0;
      const cout = e.cout + Math.hypot(deck[0].x - e.at.x, deck[0].y - e.at.y) + routeLengths(deck)[deck.length - 1] + fin;
      const connu = best.get(there);
      if (!connu || cout < connu.cout) best.set(there, { cout, at: deck[deck.length - 1], via: b, deck });
    }
  }
  if (!best.has(to)) return null;
  const hops: { x: number; y: number; z: number }[][] = [];
  for (let at = to, e = best.get(at); e?.via; e = best.get(at)) {
    hops.unshift(e.deck);
    at = otherEnd(e.via, at);
  }
  const route: { x: number; y: number; z: number }[] = [depart];
  // Sur une île : de là où il est jusqu'au point suivant, à pied (ou tout droit, sans grille).
  const walkTo = (next: { x: number; y: number; z: number }) => {
    const here = route[route.length - 1];
    const path = ground ? walkPath(ground, here, next) : null;
    route.push(...(path ? path.slice(1) : [next]));
  };
  for (const deck of hops) {
    walkTo(deck[0]);
    route.push(...deck.slice(1));
  }
  walkTo(arrivee);
  return route;
}

/** Les cases des longues traversées (plus de `BAC_LONG` cases) d'un archipel, et l'ouvrage de chacune. */
const traverseesCache = new Map<ArchipelagoId, Map<string, string>>();
function casesDesTraversees(a: ArchipelagoId): Map<string, string> {
  let m = traverseesCache.get(a);
  if (!m) {
    m = new Map();
    for (const b of BRIDGES) {
      if (archipelagoOfIsland(b.from) !== a) continue;
      const path = bridgePath(b);
      if (path.length > BAC_LONG) for (const c of path) m.set(`${c.x},${c.y}`, b.id);
    }
    traverseesCache.set(a, m);
  }
  return m;
}

/** Un rectangle de la grille, en cases (bornes comprises). */
export interface CadreDeCases {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Le cadre de la caméra pendant un trajet qui prend une longue traversée (GD-7, plus de `BAC_LONG` cases sur un même
 * ouvrage) : tout le trajet, du départ à l'arrivée, et le cœur des deux îles du bout ; la caméra s'y pose et ne bouge
 * plus, le bonhomme traverse. `null` pour un trajet ordinaire : la caméra le suit.
 */
export function cadreDeTraversee(a: ArchipelagoId, route: readonly { x: number; y: number }[]): CadreDeCases | null {
  const cases = casesDesTraversees(a);
  const parOuvrage = new Map<string, number>();
  let longue = false;
  for (const c of route) {
    const id = cases.get(`${Math.round(c.x)},${Math.round(c.y)}`);
    if (!id) continue;
    const n = (parOuvrage.get(id) ?? 0) + 1;
    parOuvrage.set(id, n);
    if (n > BAC_LONG) longue = true;
  }
  if (!longue) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const ajouter = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const c of route) ajouter(c.x, c.y);
  // Les cœurs des deux îles du bout, entiers : l'île d'arrivée se reconnaît, pas seulement la case où il s'arrête.
  for (const c of [route[0], route[route.length - 1]]) {
    const k = coeurDe(islandDef(islandAt(a, c.x, c.y)));
    ajouter(k.x0, k.y0);
    ajouter(k.x1 - 1, k.y1 - 1);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Le chemin du bonhomme de son île jusqu'au pont du Bloc-Navire : le long de la rangée de devant (sous les bornes),
 * puis la jetée planche par planche, puis le bastingage et le pont. À rebours, c'est le débarquement.
 */
export function boardingRoute(port: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(port);
  const home = avatarHome(port);
  const o = dockOrigin(port);
  const top = def.altitude + 1;
  const route = [home, { x: def.core.x + 1, y: def.core.y, z: top }, { x: def.core.x + DOCK_DX, y: def.core.y, z: top }];
  for (const c of dockCells(port)) {
    route.push({ x: c.x, y: c.y, z: c.z + 1 });
    if (c.y === o.y + VEHICLE_DECK.y) break;
  }
  // Le bastingage (une case au-dessus du plancher), puis le pont.
  route.push({ x: o.x, y: o.y + VEHICLE_DECK.y, z: o.z + 2 }, { x: o.x + VEHICLE_DECK.x, y: o.y + VEHICLE_DECK.y, z: o.z + 1 });
  return route;
}

/** Distance à plat parcourue depuis le départ, à chaque point d'un itinéraire (la dernière est sa longueur). */
export function routeLengths(route: { x: number; y: number }[]): number[] {
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
  return cum;
}

/**
 * Le point d'un itinéraire à une distance donnée du départ : on avance au même pas quelle que soit la longueur des
 * segments (une case de pont, une pierre de gué sur deux, ou toute une île d'un coup).
 */
export function routeAt(route: { x: number; y: number; z: number }[], cum: number[], d: number): { x: number; y: number; z: number } {
  const last = route.length - 1;
  if (last <= 0 || d >= cum[last]) return { ...route[last] };
  let i = 0;
  while (i < last - 1 && cum[i + 1] <= d) i++;
  const span = cum[i + 1] - cum[i];
  const f = span > 0 ? Math.max(0, d - cum[i]) / span : 1;
  const a = route[i];
  const b = route[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
}

/** Tous les cubes du village, étiquetés par biome. Les îles verrouillées sont en pierre grise, sans créature. */
/** Les pas d'une créature qui se promène : une case à gauche ou en arrière (jamais vers les plans). */
export const CREATURE_STEPS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [0, 1],
  [-1, 1],
];

/**
 * Les personnages en cubes tournés d'un quart de tour dans le monde (sens direct, vu d'en haut) : le visage, côté y = 0
 * du modèle, passe du côté des x croissants. Au Refuge des carnets, la caméra de l'île et celle de l'archipel pivotent à
 * fond vers l'ouest (`viewYaw`) et regardent l'île par son côté est : Timbre la regarde de trois quarts, et le Papillon
 * lui montre ses ailes de biais, jamais par la tranche (DA, retouches LV2-5). Orientation fixe, sans animation ; les
 * portraits (défi, bulle, panneau) gardent le modèle de face.
 */
export const QUARTS_DE_TOUR: Partial<Record<BiomeId, number>> = { 'lv2-3e-travel': 1 };
/**
 * Les créatures seules (pas leur Gardien) tournées d'un quart de tour de plus, même sens. Au Marché des proportions
 * (5e), Bazar est long (sept cases du museau à la queue) : de face, il n'a aucune place hors de la vue de la salle des
 * trophées (GD-3) ; tourné, il se tient derrière elle, le visage du côté des x croissants, celui de la caméra. Le quart
 * de tour dans l'autre sens lui ferait tourner le dos à la caméra (retouches de GD-3).
 */
export const QUARTS_DE_TOUR_DE_LA_CREATURE: Partial<Record<BiomeId, number>> = { 'maths-5e-proportionality': 1 };
function tourner(cubes: CubeDeModele[], quarts = 0): CubeDeModele[] {
  let out = cubes;
  for (let i = 0; i < quarts; i++) {
    const maxY = Math.max(...out.map((c) => c.y));
    out = out.map((c) => ({ ...c, x: maxY - c.y, y: c.x }));
  }
  return out;
}
const personnagesTournes = new Map<string, CubeDeModele[]>();
const tourne = (genre: 'creature' | 'gardien', id: BiomeId, cubes: CubeDeModele[]) => {
  const cle = `${genre}:${id}`;
  let t = personnagesTournes.get(cle);
  const quarts = (QUARTS_DE_TOUR[id] ?? 0) + (genre === 'creature' ? (QUARTS_DE_TOUR_DE_LA_CREATURE[id] ?? 0) : 0);
  if (!t) personnagesTournes.set(cle, (t = tourner(cubes, quarts)));
  return t;
};
/** La créature d'une île telle qu'elle se tient dans le monde (voir `QUARTS_DE_TOUR` et `QUARTS_DE_TOUR_DE_LA_CREATURE`). */
export const creatureDuMonde = (id: BiomeId): CubeDeModele[] => tourne('creature', id, CREATURE_CUBES[id]);
/** Le Gardien d'une île tel qu'il se tient sur son îlot (voir `QUARTS_DE_TOUR`). */
export const gardienDuMonde = (id: BiomeId): CubeDeModele[] => tourne('gardien', id, GUARDIAN_CUBES[id]);

// Par île et par LV2 : la place de la créature évite les bornes, dont le nombre suit la LV2 sur l'île de la LV2.
const creatureSpots = new Map<string, CreatureSpot>();

export interface CreatureSpot {
  x: number;
  y: number;
  /** Les pas qu'elle peut faire sans rien toucher (toujours au moins « rester là »). */
  steps: [number, number][];
}

/**
 * Où la créature d'une île se tient (case relative au cœur) : la place la plus proche de (2, 4) où elle et ses pas
 * ne touchent ni le décor, ni la zone des plans, ni le bonhomme, ni une colline, ni l'eau. On préfère une place
 * d'où elle peut se promener ; sinon elle reste immobile. Sur une île-école, ni elle ni ses pas ne se tiennent entre la
 * caméra de l'île et un lieu du village, l'emprise réservée de la salle des trophées comprise (`cacheUnLieu`) : devant
 * le cœur, aucune place ne la tient hors de leur vue, elle va derrière la salle, sur les quatre îles-écoles (à la Forêt
 * des sons, un arbre du décor lui a laissé la place : `DECOR.foret`) (GD-3, retouches du directeur artistique).
 */
export function creatureSpot(id: BiomeId): CreatureSpot {
  const cle = `${id}:${lv2Courante()}`;
  const known = creatureSpots.get(cle);
  if (known) return known;
  const free = solLibre(id);
  const cubes = creatureDuMonde(id);
  const lieux = lieuxVus(id);
  const vers = versLaCamera(id);
  const coeur = bornesDuCoeur(islandDef(id));
  // La créature se tient sur le sol de l'île (z = 1 au-dessus, comme les lieux, sur un sol plat : voir `solLibre`).
  const libre = (x: number, y: number, [sx, sy]: [number, number]) => cubes.every((c) => free(x + sx + c.x, y + sy + c.y));
  /** Un cube de la créature (au pas `st`) se tient-il entre la caméra et un lieu du village ? */
  const cache = (x: number, y: number, [sx, sy]: [number, number]) => cubes.some((c) => cacheUnLieu(lieux, vers, x + sx + c.x, y + sy + c.y, c.z + 1));
  const fits = (x: number, y: number, st: [number, number]) => libre(x, y, st) && !cache(x, y, st);
  let best: CreatureSpot | null = null;
  let bestScore = Infinity;
  for (let x = coeur.x0 - 2; x < coeur.x1; x++) {
    for (let y = coeur.y0; y < coeur.y1; y++) {
      if (!fits(x, y, [0, 0])) continue;
      const steps = CREATURE_STEPS.filter((st) => fits(x, y, st));
      const score = Math.abs(x - 2) + Math.abs(y - 4) - 2 * (steps.length - 1);
      if (score < bestScore) {
        best = { x, y, steps };
        bestScore = score;
      }
    }
  }
  const spot = best ?? { x: 2, y: 4, steps: [[0, 0]] };
  creatureSpots.set(cle, spot);
  return spot;
}

// Par île et par LV2 : le sol libre où la créature et la petite construction de sa commande peuvent se poser.
const solsLibres = new Map<string, (x: number, y: number) => boolean>();

/**
 * Les cases du sol d'une île (relatives au cœur) où rien n'est posé : ni le décor, ni les bornes et leur pourtour, ni la
 * zone des plans, ni la place du bonhomme, ni un lieu ou la case devant sa porte, ni un ouvrage et ses abords, ni une
 * colline, ni l'eau. Hors du cœur, la terre plate et nue seulement.
 */
function solLibre(id: BiomeId): (x: number, y: number) => boolean {
  const cle = `${id}:${lv2Courante()}`;
  const known = solsLibres.get(cle);
  if (known) return known;
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const blocked = new Set<string>();
  DECOR[id](
    (x, y) => blocked.add(`${x + LAYOUT_PAD.x},${y + LAYOUT_PAD.y}`),
    (x, y) => groundHeight(index, x + LAYOUT_PAD.x, y + LAYOUT_PAD.y),
  );
  for (const st of questStations(id)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${st.x + dx},${st.y + dy}`);
  const zone = zoneDesPlans(id);
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) blocked.add(`${x},${y}`);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${AVATAR_HOME.x + dx},${AVATAR_HOME.y + dy}`);
  for (const k of placeCells(id)) blocked.add(k);
  // … ni sur la case devant la porte d'un lieu, où le bonhomme s'arrête.
  for (const k of portesDesLieux(id)) blocked.add(k);
  // Ni sur un ouvrage qui part de l'île, ni à côté (sa rampe, son pied sur la côte).
  for (const b of BRIDGES.filter((d) => d.from === id || d.to === id))
    for (const c of bridgePath(b)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${c.x + dx - def.core.x},${c.y + dy - def.core.y}`);
  // Le décor des marges du cœur (un cœur agrandi) : la créature ne s'y pose pas.
  for (const m of margesDuCoeur(def)) if (m.decor) blocked.add(`${m.x - def.core.x},${m.y - def.core.y}`);
  const coeur = bornesDuCoeur(def);
  for (let x = coeur.x0; x < coeur.x1; x++) for (let y = coeur.y0; y < coeur.y1; y++) if (groundHeight(index, x, y) > 0) blocked.add(`${x},${y}`);
  // Hors du cœur : la terre plate et nue seulement (pas l'eau, pas un arbre, pas une pente).
  const scenery = new Map(landscape(def).map((c) => [`${c.x - def.core.x},${c.y - def.core.y}`, c]));
  // … ni sous la couronne d'un arbre de la côte ou des marges, qui déborde de son tronc (le décor tel que l'île le pose).
  for (const c of [...scenery.values(), ...margesDuCoeur(def)]) {
    if (!c.decor) continue;
    const t = tirage(def, c.x, c.y);
    decorate((x, y) => blocked.add(`${x - def.core.x},${y - def.core.y}`), c.decor, c.x, c.y, noise(def.seed + 5, t.x, t.y));
  }
  const free = (x: number, y: number) => {
    if (blocked.has(`${x},${y}`)) return false;
    if (x >= coeur.x0 && y >= coeur.y0 && x < coeur.x1 && y < coeur.y1) return true;
    const c = scenery.get(`${x},${y}`);
    return Boolean(c) && c!.h === 0 && !c!.decor && c!.ground !== 'eau' && c!.ground !== 'lave';
  };
  solsLibres.set(cle, free);
  return free;
}

/** Jusqu'où, en cases, la petite construction cherche sa place autour de la créature. */
const PORTEE_DE_LA_PETITE_CONSTRUCTION = 8;

/**
 * Le rayon qui part du point (x, y, z) (repère de l'île, z en hauteur) vers la caméra de l'île (`camera`, même repère)
 * touche-t-il une case de `pleines` (clés « x,y,z ») avant de passer au-dessus de `plafond` ?
 */
function rayonArrete(pleines: ReadonlySet<string>, camera: { x: number; y: number; z: number }, x: number, y: number, z: number, plafond: number): boolean {
  const dx = camera.x - x;
  const dy = camera.y - y;
  const dz = camera.z - z;
  const l = Math.hypot(dx, dy, dz) || 1;
  for (let t = 0.2; t < l && z + (dz / l) * t <= plafond; t += 0.2) {
    if (pleines.has(`${Math.floor(x + (dx / l) * t)},${Math.floor(y + (dy / l) * t)},${Math.floor(z + (dz / l) * t)}`)) return true;
  }
  return false;
}

/** Un rectangle à l'écran, en pixels CSS. */
interface CadreALEcran {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Le rectangle à l'écran de cubes (coins `x, y, z` de leur case, coordonnées du monde) dans la vue de l'île panneau ouvert. */
function cadreALEcran(projeter: ProjectionDeLaVue, cubes: readonly { x: number; y: number; z: number }[]): CadreALEcran {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of cubes)
    for (let i = 0; i < 8; i++) {
      const [sx, sy] = projeter(c.x + (i & 1), c.y + ((i >> 1) & 1), c.z + ((i >> 2) & 1));
      r.x0 = Math.min(r.x0, sx);
      r.x1 = Math.max(r.x1, sx);
      r.y0 = Math.min(r.y0, sy);
      r.y1 = Math.max(r.y1, sy);
    }
  return r;
}

/** La silhouette à l'écran de cubes (coins `x, y, z` de leur case, coordonnées du monde) : l'enveloppe de leurs coins. */
function silhouette(projeter: ProjectionDeLaVue, cubes: readonly { x: number; y: number; z: number }[]): [number, number][] {
  const pts: [number, number][] = [];
  for (const c of cubes) for (let i = 0; i < 8; i++) pts.push(projeter(c.x + (i & 1), c.y + ((i >> 1) & 1), c.z + ((i >> 2) & 1)));
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const tour = (p: [number, number], q: [number, number], r: [number, number]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const bas: [number, number][] = [];
  const haut: [number, number][] = [];
  for (const p of pts) {
    while (bas.length >= 2 && tour(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop();
    bas.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    while (haut.length >= 2 && tour(haut[haut.length - 2], haut[haut.length - 1], pts[i]) <= 0) haut.pop();
    haut.push(pts[i]);
  }
  return [...bas.slice(0, -1), ...haut.slice(0, -1)];
}

/**
 * L'écart, en pixels, entre deux silhouettes convexes (le plus grand vide le long des normales de leurs côtés) ; négatif
 * quand elles se recouvrent.
 */
function ecartEntre(a: readonly [number, number][], b: readonly [number, number][]): number {
  let ecart = -Infinity;
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % poly.length];
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      const [nx, ny] = [(y1 - y0) / l, (x0 - x1) / l];
      let [aMin, aMax, bMin, bMax] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const [x, y] of a) {
        const d = x * nx + y * ny;
        aMin = Math.min(aMin, d);
        aMax = Math.max(aMax, d);
      }
      for (const [x, y] of b) {
        const d = x * nx + y * ny;
        bMin = Math.min(bMin, d);
        bMax = Math.max(bMax, d);
      }
      ecart = Math.max(ecart, bMin - aMax, aMin - bMax);
    }
  return ecart;
}

/**
 * Où se pose la petite construction d'une commande livrée (GD-7, PR 3) : le coin (x, y) de sa forme, relatif au cœur de
 * l'île. Une donnée fixe (`placeDeLaPetiteConstruction`, world/petitesConstructions.ts), que ce calcul refait et que le
 * test compare : rien ne se calcule au toucher de « Livrer ». Sur une autre île, `null` : le test l'interdit.
 */
export function placeDeLaPetiteConstruction(_id: BiomeId, fixture: string): { x: number; y: number } | null {
  return placeEcrite(fixture);
}

/**
 * Le calcul de la place d'une petite construction (GD-7, PR 3), à côté de la créature, lisible dans la vue de l'île
 * panneau ouvert (`VUE_DE_L_ILE_PANNEAU_OUVERT`). Lent (des dizaines de millisecondes) : seul le test l'appelle, pour
 * vérifier la table de `placeDeLaPetiteConstruction`. Une place convient quand :
 * - chaque case de la forme est sur le sol libre de l'île (`solLibre` : ni décor, ni borne et son pourtour, ni lieu ou
 *   la case devant sa porte, ni zone des plans, ni ouvrage et ses abords, ni colline, ni eau), hors de la rangée nue
 *   devant les bornes d'une île-école, du chemin du bonhomme vers le navire et de la cale sur l'île-port, à une case au
 *   moins de la créature et de ses pas (elle s'y promène sans la toucher) ;
 * - aucun de ses cubes ne cache, dans la vue de l'île, une borne (`cacheUneBorne`), un lieu du village (`cacheUnLieu`)
 *   ou la créature (le rayon de chaque cube de la créature vers la caméra ne la traverse pas) ;
 * - le dessus de chaque colonne de la forme se voit de la caméra : aucun cube de l'île tout construite (ses plans
 *   bâtis), ni la créature à sa place ou à l'un de ses pas, ni le bonhomme chez lui, ne s'y met devant ; et le bonhomme
 *   ne cache aucun de ses cubes (jamais derrière lui) ;
 * - elle se lit entière dans la vue de l'île panneau ouvert : à une case au moins (à l'écran) du bord du panneau et des
 *   autres bords, au-dessus des boutons du bas, hors de Pause et de l'archipel.
 * Puis, par ordre de préférence (une préférence ne tombe que si aucune place ne la tient) : jamais devant la rangée
 * des bornes (le passage du bonhomme) ; à l'écran, rien d'elle sur la silhouette d'une borne, puis une demi-case au
 * moins entre elles (une case nue entre elle et toute borne) ; les cubes posés au sol ne sont pas du bloc du sol de leur
 * case (sinon ils s'y fondent) ; le moins possible de ses cubes cachés en partie (milieu et coins de chacun) ; une case
 * nue autour d'elle (ni mur, ni tronc, ni borne au-dessus du sol), pour que sa silhouette se détache. Parmi les places
 * qui restent, la plus proche de la créature, en préférant le côté au devant : une forme posée entre la caméra et la
 * créature compte deux cases de plus par case d'avance. `null` si rien ne la tient.
 */
export function calculerLaPlaceDeLaPetiteConstruction(id: BiomeId, fixture: string): { x: number; y: number } | null {
  const examen = examenDeLaPetiteConstruction(id, fixture);
  if (!examen) return null;
  // Les préférences, de la plus forte à la plus faible : derrière la rangée des bornes, puis jamais sur une borne à
  // l'écran, puis une case (à l'écran) entre elle et toute borne, puis sur un autre sol, puis entière (le moins de points
  // cachés), puis dégagée ; à préférences égales, la plus proche (la première trouvée à score égal).
  const rang = (p: ExamenDUnePlace) => [p.derriere ? 0 : 1, p.libre ? 0 : 1, p.ecartee ? 0 : 1, p.sol ? 0 : 1, p.caches, p.degagee ? 0 : 1, p.score];
  const avant = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  let best: ExamenDUnePlace | null = null;
  for (const [ox, oy] of examen.candidates()) {
    const p = examen.examiner(ox, oy);
    if (p && (!best || avant(rang(p), rang(best)))) best = p;
  }
  return best ? { x: best.x, y: best.y } : null;
}

/** Ce que vaut une place qui tient les règles (voir `calculerLaPlaceDeLaPetiteConstruction`). */
export interface ExamenDUnePlace {
  x: number;
  y: number;
  /** La distance à la créature, plus le prix d'être devant elle ou près d'une borne à l'écran. */
  score: number;
  /** Derrière la rangée des bornes. */
  derriere: boolean;
  /** Rien d'elle sur la silhouette d'une borne (son socle, son ardoise, le repère au-dessus), à l'écran. */
  libre: boolean;
  /** Une demi-case au moins, à l'écran, entre elle et toute borne. */
  ecartee: boolean;
  /** Ses cubes posés au sol ne sont pas du bloc du sol de leur case. */
  sol: boolean;
  /** Une case nue autour d'elle. */
  degagee: boolean;
  /** Le nombre de points cachés de ses cubes (milieu et huit coins de chacun). */
  caches: number;
  /**
   * Chacun de ses cubes : son bloc, combien de ses neuf points (milieu et coins) se voient devant l'île tout construite, la
   * créature et le bonhomme, et s'il se fond dans le sol de sa case.
   */
  cubes: { x: number; y: number; z: number; block: BlockId; vus: number; commeLeSol: boolean }[];
}

/**
 * Le calcul des places d'une petite construction autour de la créature : les places à essayer (`candidates`), et ce que
 * vaut chacune (`examiner`, `null` si elle ne tient pas les règles). Seuls le test et `calculerLaPlaceDeLaPetiteConstruction`
 * s'en servent.
 */
export function examenDeLaPetiteConstruction(
  id: BiomeId,
  fixture: string,
): { candidates: () => Iterable<[number, number]>; examiner: (ox: number, oy: number) => ExamenDUnePlace | null } | null {
  const cases = casesDeLaPetiteConstruction(fixture) ?? [];
  const pied = [...new Map(cases.map((c) => [`${c.x},${c.y}`, { x: c.x, y: c.y }])).values()];
  if (!pied.length) return null;
  const dessus = pied.map((p) => ({ ...p, z: Math.max(...cases.filter((c) => c.x === p.x && c.y === p.y).map((c) => c.z)) + 1 }));
  const spot = creatureSpot(id);
  const free = solLibre(id);
  const creature = creatureDuMonde(id);
  const vers = versLaCamera(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const bornes = questStations(id).map((st) => ({ x: st.x, y: st.y, base: groundHeight(index, st.x, st.y) }));
  const lieux = lieuxVus(id);
  // Hors de la rangée nue devant les bornes (île-école) et du chemin du bonhomme vers le navire (île-port).
  const interdites = new Set<string>();
  for (const k of rangeeDevantLesBornes(id)) {
    const [x, y] = k.split(',').map(Number);
    interdites.add(`${x - def.core.x},${y - def.core.y}`);
  }
  for (const a of ARCHIPELAGOS)
    if (a.port === id) {
      const route = boardingRoute(id);
      for (let i = 1; i < route.length; i++) {
        const [p, q] = [route[i - 1], route[i]];
        const n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), 1);
        for (let t = 0; t <= n; t++)
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
              interdites.add(`${Math.round(p.x + ((q.x - p.x) * t) / n) - def.core.x + dx},${Math.round(p.y + ((q.y - p.y) * t) / n) - def.core.y + dy}`);
      }
    }
  // Jamais devant la rangée des bornes : c'est par là que le bonhomme arrive et passe d'une borne à l'autre.
  const devant = Math.min(...questStations(id).map((st) => st.y), Infinity);
  const aCote = new Set<string>();
  for (const [sx, sy] of [[0, 0], ...spot.steps])
    for (const c of creature) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) aCote.add(`${spot.x + sx + c.x + dx},${spot.y + sy + c.y + dy}`);
  // L'île tout construite, sans créature (elle est animée à part) et sans petite construction posée : ce qui peut se
  // mettre devant la forme.
  const plans = Object.fromEntries(plansFor(id).map((p) => [p.id, planCells(p).map((c) => c.key)]));
  // Sur l'île-port, sans les objets du quai : ce sont eux qui évitent la petite construction (`quaySpots`).
  const quai = `${id}/`;
  const ile = cubesDeLIle(id, {}, { parts: plans, log: [], links: BRIDGES.map((b) => b.id) }, false).filter((c) => !c.decor?.startsWith(quai));
  const pleines = new Set(ile.map((c) => `${c.x},${c.y},${c.z}`));
  // Le bloc du sol de chaque case (le cube à z = 0).
  const sol = new Map<string, string | undefined>();
  for (const c of ile) if (c.z === 0) sol.set(`${c.x},${c.y}`, c.texture ?? c.color);
  // … les lieux du village d'une île-école dans toute leur emprise et leur hauteur (la salle des trophées grandit avec
  // les succès : sa place réservée compte pleine) …
  for (const l of lieux) for (let z = 1; z <= 12; z++) pleines.add(`${l.x},${l.y},${l.base + z}`);
  // … et la créature, à sa place et à chacun de ses pas : elle ne se tient jamais devant la forme.
  for (const [sx, sy] of [[0, 0], ...spot.steps]) for (const c of creature) pleines.add(`${spot.x + sx + c.x},${spot.y + sy + c.y},${c.z + 1}`);
  // Le bonhomme, chez lui sur l'île (deux cubes de haut) : jamais devant la forme.
  const bonhomme = new Set<string>();
  const solDuBonhomme = groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y);
  for (const z of [1, 2]) bonhomme.add(`${AVATAR_HOME.x},${AVATAR_HOME.y},${solDuBonhomme + z}`);
  for (const k of bonhomme) pleines.add(k);
  const plafond = Math.max(...ile.map((c) => c.z), ...creature.map((c) => c.z + 1)) + 1;
  // La caméra de la vue de l'île panneau ouvert, dans le repère de l'île : les rayons vont vers elle (en perspective).
  const o = origineDe(id);
  const { projeter, cube, oeil } = projectionDeLaVueDeLIle(id);
  const camera = { x: oeil.x - o.x, y: oeil.y - o.y, z: oeil.z - o.z };
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  // Les bornes à l'écran (le socle, l'ardoise et le haut doré) : de préférence, la forme ne touche la silhouette d'aucune,
  // et une demi-case au moins (à l'écran) l'en sépare.
  const bornesALEcran = bornes.map((b) => silhouette(projeter, [1, 2, 3].map((z) => ({ x: o.x + b.x, y: o.y + b.y, z: o.z + b.base + z }))));
  const cadreDeLaForme = (ox: number, oy: number) => cadreALEcran(projeter, cases.map((c) => ({ x: o.x + ox + c.x, y: o.y + oy + c.y, z: o.z + c.z + 1 })));
  // Le plus petit écart, en pixels, entre un cube de la forme et une borne (négatif s'ils se recouvrent à l'écran).
  const ecartAuxBornes = (ox: number, oy: number) => {
    let min = Infinity;
    for (const c of cases) {
      const s = silhouette(projeter, [{ x: o.x + ox + c.x, y: o.y + oy + c.y, z: o.z + c.z + 1 }]);
      for (const b of bornesALEcran) min = Math.min(min, ecartEntre(s, b));
    }
    return min;
  };
  const dansLaVue = (r: CadreALEcran) => {
    if (r.x0 < cube || r.y0 < cube || r.x1 > V.largeur - cube || r.y1 > V.hauteur - V.bas - cube) return false;
    return !(r.x1 > V.largeur - V.boutons.largeur - cube && r.y0 < V.boutons.hauteur + cube);
  };
  // Sur l'île-port, la cale devant la barque amarrée reste nue (`quaySpots`). Les objets du quai (la barque, les caisses,
  // les fanions, le foyer), eux, évitent la petite construction, posée ou non (`quaySpots` lit sa place écrite) : ils ne
  // bougent jamais quand elle se pose.
  if (ARCHIPELAGOS.some((a) => a.port === id)) {
    const S = shoreY(id) - def.core.y;
    for (let x = DOCK_DX - 4; x < DOCK_DX; x++) for (let y = S; y <= S + 1; y++) interdites.add(`${x},${y}`);
  }
  const elle = creature.map((c) => ({ x: spot.x + c.x + 0.5, y: spot.y + c.y + 0.5, z: c.z + 1.5 }));
  // Vers la caméra, à plat : une forme dont le centre est de ce côté de la créature se tient devant elle.
  const plat = Math.hypot(vers[0], vers[1]) || 1;
  const [ux, uy] = [vers[0] / plat, vers[1] / plat];
  const cx = elle.reduce((n, e) => n + e.x, 0) / elle.length;
  const cy = elle.reduce((n, e) => n + e.y, 0) / elle.length;
  const px = pied.reduce((n, p) => n + p.x + 0.5, 0) / pied.length;
  const py = pied.reduce((n, p) => n + p.y + 0.5, 0) / pied.length;
  const largeur = Math.max(...pied.map((p) => p.x)) + 1;
  const profondeur = Math.max(...pied.map((p) => p.y)) + 1;

  // Une case libre autour de la forme : rien de posé au-dessus du sol (un mur, un tronc, une borne), pour que sa
  // silhouette se détache.
  const autour = new Set<string>();
  for (const p of pied) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) autour.add(`${p.x + dx},${p.y + dy}`);
  const degagee = (ox: number, oy: number) =>
    [...autour].every((k) => {
      const [x, y] = k.split(',').map(Number);
      for (let z = 1; z <= 4; z++) if (pleines.has(`${ox + x},${oy + y},${z}`)) return false;
      return true;
    });
  // Les cubes posés au sol ne sont pas du bloc du sol de leur case.
  const commeLeSol = (b: BlockId, x: number, y: number) => sol.get(`${x},${y}`) === (BLOCKS[b].texture ?? BLOCKS[b].side);
  // Des points d'un cube : son milieu et, un peu en retrait, ses huit coins ; il se voit entier quand chacun se voit (un
  // poteau devant lui en cache une partie).
  const pointsVus: readonly (readonly [number, number, number])[] = [[0.5, 0.5, 0.5], ...[0.15, 0.85].flatMap((u) => [0.15, 0.85].flatMap((v) => [0.15, 0.85].map((w) => [u, v, w] as const)))];
  const R = PORTEE_DE_LA_PETITE_CONSTRUCTION;
  function* candidates(): Iterable<[number, number]> {
    for (let ox = spot.x - R - largeur; ox <= spot.x + R; ox++) for (let oy = spot.y - R - profondeur; oy <= spot.y + R; oy++) yield [ox, oy];
  }
  const examiner = (ox: number, oy: number): ExamenDUnePlace | null => {
    const distance = Math.min(...pied.flatMap((p) => elle.map((e) => Math.abs(ox + p.x + 0.5 - e.x) + Math.abs(oy + p.y + 0.5 - e.y))));
    if (distance > R) return null;
    if (!pied.every((p) => free(ox + p.x, oy + p.y) && !aCote.has(`${ox + p.x},${oy + p.y}`) && !interdites.has(`${ox + p.x},${oy + p.y}`))) return null;
    if (cases.some((c) => cacheUneBorne(bornes, vers, ox + c.x, oy + c.y, c.z + 1) || cacheUnLieu(lieux, vers, ox + c.x, oy + c.y, c.z + 1))) return null;
    const forme = new Set(cases.map((c) => `${ox + c.x},${oy + c.y},${c.z + 1}`));
    if (elle.some((e) => rayonArrete(forme, camera, e.x, e.y, e.z, 4))) return null;
    if (dessus.some((d) => rayonArrete(pleines, camera, ox + d.x + 0.5, oy + d.y + 0.5, d.z + 1.02, plafond))) return null;
    if (cases.some((c) => rayonArrete(bonhomme, camera, ox + c.x + 0.5, oy + c.y + 0.5, c.z + 1.5, plafond))) return null;
    if (!dansLaVue(cadreDeLaForme(ox, oy))) return null;
    const ecart = ecartAuxBornes(ox, oy);
    const avance = (ox + px - cx) * ux + (oy + py - cy) * uy;
    const cubes = cases.map((c) => ({
      x: c.x,
      y: c.y,
      z: c.z,
      block: c.block,
      vus: pointsVus.filter(([u, v, w]) => !rayonArrete(pleines, camera, ox + c.x + u, oy + c.y + v, c.z + 1 + w, plafond)).length,
      commeLeSol: c.z === 0 && commeLeSol(c.block, ox + c.x, oy + c.y),
    }));
    return {
      x: ox,
      y: oy,
      // Trop près d'une borne à l'écran : d'autant plus loin dans l'ordre qu'elle s'en approche.
      score: distance + 2 * Math.max(0, avance - 1) + (4 * Math.max(0, cube / 2 - ecart)) / cube,
      derriere: pied.every((p) => oy + p.y >= devant),
      libre: ecart > 0,
      ecartee: ecart >= cube / 2,
      sol: cubes.every((c) => !c.commeLeSol),
      degagee: degagee(ox, oy),
      caches: cubes.reduce((n, c) => n + pointsVus.length - c.vus, 0),
      cubes,
    };
  };
  return { candidates, examiner };
}

/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(
  a: ArchipelagoId,
  bridges: string[],
): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number }; steps: [number, number][] }[] {
  return islandsOf(a)
    .filter((b) => isBiomeUnlocked(b.id, bridges))
    .map((b) => {
      const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
      const spot = creatureSpot(b.id);
      return { id: b.id, cubes: creatureDuMonde(b.id), origin: { x: ox + spot.x, y: oy + spot.y, z: oz + 1 }, steps: spot.steps };
    });
}

/** L'îlot du Gardien : une petite île devant la sienne (côté caméra), tenue dans ISLET_W × ISLET_H cases (les Gardiens font jusqu’à 9 × 8). */
export const ISLET_W = 13;
export const ISLET_H = 12;
/** Cases d'eau entre l'îlot et la terre de son île : les pas japonais les franchissent. */
export const ISLET_GAP = 3;
/** Centre de l'îlot (coordonnées locales) : le Gardien s'y dresse, au milieu de l'arène. */
const ISLET_CENTER = { x: 6, y: 5.5 };
/** Demi-axes de l'arène pavée (un carré aux coins arrondis, plus petit que le Gardien : il déborde sur l'herbe). */
const ARENA = { rx: 4.5, ry: 4 };

export function bossIsletOrigin(index: number): { x: number; y: number; z: number } {
  return origineDeLIlot(islandDef(BIOMES[index].id));
}

/**
 * Sur une île au cœur agrandi (`COTE_DU_COEUR`), l'îlot glisse de tant de cases vers la gauche, sur sa rangée : le
 * Gardien quitte l'axe de la caméra vers le cœur (créature, école, salle des trophées) et se tient devant la côte
 * gauche, l'eau s'ouvre en biais entre l'îlot et la terre (relecture du DA, 01/10/2026). À gauche sur les quatre
 * îles-écoles : à droite, le navire est à quai au Marché et à l'Atelier.
 */
export const ILOT_DE_COTE = 9;

/**
 * Les retouches de l'îlot d'une île-école, pour qu'il ait au moins trois cases d'eau de tous les côtés et se lise comme
 * celui de son île, plus près de sa côte que de toute autre terre (relectures du 01/10/2026, un test le tient) :
 * `glisse` remplace `ILOT_DE_COTE` ; `recul`, de combien de cases il se rapproche de sa terre ; `rogne`, combien de ses
 * rangées de devant il perd, hors de l'emprise de son Gardien. La Forêt : la Plaine, devant à droite, frôlait la
 * pointe de l'îlot (deux cases d'eau) ; il recule d'une case vers sa côte et perd sa rangée de devant. L'Atelier : la
 * Forge, à gauche, était plus près de l'îlot que l'Atelier lui-même ; il glisse de 7 cases au lieu de 9.
 */
export const RETOUCHES_DE_L_ILOT: Readonly<Partial<Record<BiomeId, Readonly<{ glisse?: number; recul?: number; rogne?: number }>>>> = Object.freeze({
  'french-6e-phonology': Object.freeze({ recul: 1, rogne: 1 }),
  'maths-4e-algebra': Object.freeze({ glisse: 7 }),
});

/**
 * Le coin de l'îlot du Gardien d'une île (voir `bossIsletOrigin`), pour qui tient déjà sa définition : devant la terre
 * de l'île, au droit du bord gauche de son cœur (`coeurDe`) et au-delà de sa côte ; il suit le cœur quand il grandit,
 * et glisse sur le côté s'il est agrandi (`ILOT_DE_COTE`, `RETOUCHES_DE_L_ILOT`), sans s'avancer vers la caméra.
 */
export function origineDeLIlot(def: IslandDef): { x: number; y: number; z: number } {
  const c = coeurDe(def);
  return { x: c.x0 - glisseDeLIlot(def.id), y: c.y0 - def.ext.front - ISLET_H - ISLET_GAP + reculDeLIlot(def.id), z: def.altitude };
}

/** De combien de cases l'îlot d'une île a glissé sur le côté (`ILOT_DE_COTE`) : sa côte et son décor restent tirés là où il était. */
function glisseDeLIlot(id: BiomeId): number {
  return COTE_DU_COEUR[id] ? (RETOUCHES_DE_L_ILOT[id]?.glisse ?? ILOT_DE_COTE) : 0;
}

/** De combien de cases l'îlot d'une île s'est rapproché de sa terre (`RETOUCHES_DE_L_ILOT`) : même dessin. */
function reculDeLIlot(id: BiomeId): number {
  return RETOUCHES_DE_L_ILOT[id]?.recul ?? 0;
}

/**
 * Le milieu de l'îlot du Gardien, en cases du monde, sous la mi-hauteur de sa sentinelle : la caméra du rallumage vise
 * un bloc au-dessus (lot 6), au milieu d'une sentinelle de 5,2 blocs posée sur l'îlot (DA-5 :
 * world/personnages/sentinelle.ts, `HAUTEUR_DANS_LE_MONDE` ; un test y tient les deux ensemble).
 */
export function bossIsletCenter(id: BiomeId): { x: number; y: number; z: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: o.x + ISLET_CENTER.x, y: o.y + ISLET_CENTER.y, z: o.z + 2.6 };
}

/** Coin local où poser un Gardien pour qu'il soit centré sur l'îlot. */
function guardianOffset(id: BiomeId): { x: number; y: number } {
  const g = gardienDuMonde(id);
  const mid = (vals: number[]) => (Math.min(...vals) + Math.max(...vals)) / 2;
  return { x: Math.round(ISLET_CENTER.x - mid(g.map((c) => c.x))), y: Math.round(ISLET_CENTER.y - mid(g.map((c) => c.y))) };
}

export interface IsletCell {
  /** Coordonnées du monde. */
  x: number;
  y: number;
  /** Pavé de l'arène (pierre, bordée de galet). */
  arena: boolean;
  /** Sous les pieds du Gardien. */
  guardian: boolean;
  /** Au bord de l'eau (une voisine n'est pas de la terre). */
  shore: boolean;
}

const isletCache = new Map<BiomeId, IsletCell[]>();
/**
 * La terre de l'îlot : une ellipse à la côte irrégulière (bruit lissé, comme les îles), qui porte toujours
 * l'emprise entière de son Gardien ; au milieu, l'arène pavée. Calculée une fois par île.
 */
export function bossIsletCells(id: BiomeId): IsletCell[] {
  const known = isletCache.get(id);
  if (known) return known;
  const def = islandDef(id);
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const off = guardianOffset(id);
  const under = new Set(gardienDuMonde(id).map((c) => `${off.x + c.x},${off.y + c.y}`));
  const glisse = glisseDeLIlot(id);
  const recul = reculDeLIlot(id);
  const rogne = RETOUCHES_DE_L_ILOT[id]?.rogne ?? 0;
  const land = new Set<string>();
  for (let x = 0; x < ISLET_W; x++)
    for (let y = 0; y < ISLET_H; y++) {
      const dx = (x - ISLET_CENTER.x) / (ISLET_W / 2);
      const dy = (y - ISLET_CENTER.y) / (ISLET_H / 2);
      // Sa côte est tirée là où il se tenait avant de glisser sur le côté : il garde sa forme.
      const t = tirage(def, o.x + glisse + x, o.y - recul + y);
      const coast = (smoothNoise(def.seed + 7, t.x, t.y, 3) - 0.5) * 0.3;
      // Ses rangées de devant rognées (`RETOUCHES_DE_L_ILOT`) ne portent que l'emprise du Gardien.
      if (under.has(`${x},${y}`) || (y >= rogne && Math.hypot(dx, dy) + coast < 0.98)) land.add(`${x},${y}`);
    }
  const cells: IsletCell[] = [];
  for (const key of land) {
    const [x, y] = key.split(',').map(Number);
    const ax = (x - ISLET_CENTER.x) / ARENA.rx;
    const ay = (y - ISLET_CENTER.y) / ARENA.ry;
    cells.push({
      x: o.x + x,
      y: o.y + y,
      arena: ax ** 4 + ay ** 4 <= 1,
      guardian: under.has(key),
      shore: [`${x - 1},${y}`, `${x + 1},${y}`, `${x},${y - 1}`, `${x},${y + 1}`].some((k) => !land.has(k)),
    });
  }
  isletCache.set(id, cells);
  return cells;
}

/**
 * Les pas japonais : des pierres en quinconce dans l'eau, du fond de l'îlot à la côte de l'île, dans l'axe du
 * Gardien. Posées au niveau du sol de l'île (en altitude, elles flottent comme elle). Quand l'îlot a glissé sur le
 * côté (`ILOT_DE_COTE`), le gué le plus court à trois colonnes au plus de l'axe.
 */
export function bossIsletSteps(id: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(id);
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const axe = o.x + Math.round(ISLET_CENTER.x);
  const ilot = bossIsletCells(id);
  let gue: { x: number; back: number; coast: number } | null = null;
  for (const d of glisseDeLIlot(id) ? [0, 1, -1, 2, -2, 3, -3] : [0]) {
    const x = axe + d;
    const colonne = ilot.filter((c) => c.x === x);
    if (!colonne.length) continue;
    const back = Math.max(...colonne.map((c) => c.y));
    // La côte, droit derrière (l'îlot est toujours devant sa terre : un test le tient) ; sans elle, pas de gué.
    let coast = back + 1;
    while (coast <= back + ISLET_H + ISLET_GAP && !isLand(def, x, coast)) coast++;
    if (!isLand(def, x, coast)) continue;
    if (!gue || coast - back < gue.coast - gue.back) gue = { x, back, coast };
  }
  if (!gue) return [];
  const steps: { x: number; y: number; z: number }[] = [];
  for (let y = gue.back + 1; y < gue.coast; y++) steps.push({ x: gue.x + ((y - gue.back) % 2 === 0 ? 1 : 0), y, z: def.altitude });
  return steps;
}

/** Le socle du bloc d'or d'un Gardien vaincu : devant lui, à sa droite, sur la terre de l'îlot. */
function trophySpot(id: BiomeId): { x: number; y: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const target = { x: o.x + ISLET_CENTER.x + 3, y: o.y + 1 };
  const free = bossIsletCells(id).filter((c) => !c.guardian && !c.shore);
  free.sort((p, q) => Math.abs(p.x - target.x) + Math.abs(p.y - target.y) - (Math.abs(q.x - target.x) + Math.abs(q.y - target.y)));
  return free[0];
}

/** Le sol de l'îlot hors de l'arène : celui qui domine sur l'île (sans les plages, l'eau ni la lave). */
function isletGround(def: IslandDef): string {
  const count = new Map<Ground, number>();
  for (const c of landscape(def)) if (c.ground !== 'sable' && c.ground !== 'eau' && c.ground !== 'lave') count.set(c.ground, (count.get(c.ground) ?? 0) + 1);
  let best: Ground = 'herbe';
  for (const [g, n] of count) if (n > (count.get(best) ?? 0)) best = g;
  return GROUND_COLOR[best];
}

/** Le petit décor de l'îlot : celui de l'île, sans les arbres (ils cacheraient le Gardien). */
const SMALL_DECOR: Decor[] = ['buisson', 'fleur', 'rocher', 'roseau', 'cristal', 'souche', 'champignon'];

/**
 * Une case du monde (x, y, et une hauteur z) en un nombre, pour les ensembles de cases chauds (ce qu'une île a déjà
 * posé, ce que ses voisines occupent) : sans chaîne construite à chaque cube. x et y de −4 096 à 4 095, z de −64 à 63.
 */
export function cleDeCube(x: number, y: number, z = 0): number {
  return ((x + 4096) * 8192 + (y + 4096)) * 128 + (z + 64);
}

const couchesCache = new WeakMap<readonly { x: number; y: number }[], readonly { x: number; y: number; d: number }[]>();

/**
 * Sous une terre en altitude, la roche s'amincit : chaque couche garde les cases dont les quatre voisines étaient
 * au-dessus. Mémorisé par liste de cases (celles de `landCells` et de `bossIsletCells` le sont déjà).
 */
function taperLayers(cells: readonly { x: number; y: number }[]): readonly { x: number; y: number; d: number }[] {
  const known = couchesCache.get(cells);
  if (known) return known;
  const out: { x: number; y: number; d: number }[] = [];
  let layer: readonly { x: number; y: number }[] = cells;
  let dessus = new Set(layer.map((c) => cleDeCube(c.x, c.y)));
  for (let d = 1; d <= TAPER; d++) {
    const ici = dessus;
    layer = layer.filter((c) => ici.has(cleDeCube(c.x - 1, c.y)) && ici.has(cleDeCube(c.x + 1, c.y)) && ici.has(cleDeCube(c.x, c.y - 1)) && ici.has(cleDeCube(c.x, c.y + 1)));
    dessus = new Set(layer.map((c) => cleDeCube(c.x, c.y)));
    for (const c of layer) out.push({ x: c.x, y: c.y, d });
    if (layer.length === 0) break;
  }
  couchesCache.set(cells, out);
  return out;
}

/**
 * L'îlot du Gardien en cubes : terre, sol de l'île, arène, petit décor, pas japonais, et le bloc d'or une fois vaincu.
 * Sans `pas` (une sentinelle qui attend, lot 6), l'îlot n'a pas encore ses pas japonais : le chemin s'ouvre avec le défi.
 */
function bossIslet(biome: BiomeDef, beaten: boolean, cubes: VoxelCube[], pas = true): void {
  const def = islandDef(biome.id);
  const gz = def.altitude;
  const tag = biome.id;
  const cells = bossIsletCells(biome.id);
  const at = new Map(cells.map((c) => [`${c.x},${c.y}`, c]));
  const block = (x: number, y: number, z: number, color: string, top?: string) =>
    cubes.push({ x, y, z, color, top, texture: TEXTURES[color], tag });
  // Le sol et la roche de l'îlot : en facettes dans le rendu Archipéo.
  const sol = (x: number, y: number, z: number, color: string) => cubes.push({ x, y, z, color, texture: TEXTURES[color], tag, sol: true });
  const ground = isletGround(def);
  const sandy = gz === 0 && def.region !== 'feu';
  for (const c of cells) {
    for (let d = 1; d <= DEPTH; d++) sol(c.x, c.y, gz - d, BLOCKS[BLOC.terre].side);
    // L'arène : pierre au milieu, galet sur son pourtour ; autour, le sol de l'île, et du sable au bord de la mer.
    const rim = c.arena && [`${c.x - 1},${c.y}`, `${c.x + 1},${c.y}`, `${c.x},${c.y - 1}`, `${c.x},${c.y + 1}`].some((k) => !at.get(k)?.arena);
    const top = c.arena ? (rim ? BLOCKS[BLOC.galet].side : BLOCKS[BLOC.pierre].side) : c.shore && sandy ? BLOCKS[BLOC.sable].side : ground;
    sol(c.x, c.y, gz, top);
  }
  if (gz > 0) for (const t of taperLayers(cells)) sol(t.x, t.y, gz - DEPTH - t.d, BLOCKS[BLOC.pierre].side);
  // Quelques touches du décor de l'île, hors de l'arène et loin des pieds du Gardien.
  const kinds = [...new Set(landscape(def).map((c) => c.decor).filter((k): k is Decor => !!k && SMALL_DECOR.includes(k)))];
  if (kinds.length === 0) kinds.push('rocher');
  const spots = cells
    .filter((c) => !c.arena && !c.guardian)
    .map((c) => {
      const t = tirage(def, c.x + glisseDeLIlot(def.id), c.y - reculDeLIlot(def.id));
      return { c, r: noise(def.seed + 8, t.x, t.y) };
    })
    .sort((p, q) => q.r - p.r)
    .slice(0, 5);
  const trophy = beaten ? trophySpot(biome.id) : null;
  // Deux touches voisines peuvent vouloir la même case (deux buissons qui se touchent) : un seul cube par case.
  const placed = new Set<string>();
  for (const { c, r } of spots) {
    decorate(
      (x, y, z, color) => {
        const cell = at.get(`${x},${y}`);
        if (!cell || cell.arena || cell.guardian || (trophy && x === trophy.x && y === trophy.y)) return;
        const key = `${x},${y},${z}`;
        if (placed.has(key)) return;
        placed.add(key);
        block(x, y, gz + z, color);
      },
      kinds[Math.floor(r * 97) % kinds.length],
      c.x,
      c.y,
      r,
    );
  }
  if (pas)
    for (const s of bossIsletSteps(biome.id)) {
      block(s.x, s.y, s.z, BLOCKS[BLOC.galet].side);
      if (s.z === 0) block(s.x, s.y, -1, BLOCKS[BLOC.galet].side);
    }
  // Vaincu : un bloc d'or sur un socle de pierre, devant la statue.
  if (trophy) {
    block(trophy.x, trophy.y, gz + 1, BLOCKS[BLOC.pierre].side);
    block(trophy.x, trophy.y, gz + 2, BLOCKS[BLOC.or].side, BLOCKS[BLOC.or].top);
  }
}

/** Gris de pierre de même luminosité qu'une couleur (pour la statue). */
function stoneOf(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  const g = Math.round(90 + (lum / 255) * 90);
  return `#${((g << 16) | (g << 8) | g).toString(16).padStart(6, '0')}`;
}

/**
 * Les Gardiens visibles : en couleurs s'ils attendent le défi, en statue de pierre s'ils sont vaincus. Avec
 * `sentinelles` (Archipéo, lot 6), ceux des îles ouvertes sont là avant que leur défi soit prêt.
 */
export function guardianPlacements(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  bridges: string[],
  sentinelles = false,
): { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] {
  const out: { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] = [];
  BIOMES.forEach((b, index) => {
    if (b.classe !== a) return;
    const status = guardianStatus(b, progress, bridges, sentinelles);
    if (status === 'hidden') return;
    const { x, y, z } = bossIsletOrigin(index);
    const off = guardianOffset(b.id);
    const beaten = status === 'beaten';
    const cubes = beaten ? gardienDuMonde(b.id).map((c) => ({ ...c, color: stoneOf(c.color), top: undefined })) : gardienDuMonde(b.id);
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes, origin: { x: x + off.x, y: y + off.y, z: z + 1 } });
  });
  return out;
}

/** Zone des plans d'une île en coordonnées du monde (bornes hautes exclues). */
export function planZoneOf(id: BiomeId): { x0: number; y0: number; x1: number; y1: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  const zone = zoneDesPlans(id);
  return { x0: ox + zone.x, y0: oy + zone.y, x1: ox + zone.x + zone.w, y1: oy + zone.y + zone.h };
}

/** Roche sous le sol d'une case de paysage, selon la région et la hauteur. */
function underground(def: IslandDef, cell: LandCell, depthBelowTop: number): string {
  if (def.region === 'feu') return BASALT;
  if (cell.h - depthBelowTop >= 2 || def.region === 'hauteurs' || def.region === 'montagne') return BLOCKS[BLOC.pierre].side;
  return BLOCKS[BLOC.terre].side;
}

/**
 * Les baleines replacées à la main, quand la clairière choisie par `whaleSpots` se cache derrière une île dans la vue
 * de l'archipel depuis le port (DA, 01/10/2026 : au 5e, celle de 91, 345 nageait derrière le Marché et seul son souffle
 * se voyait). `de` : la clairière choisie ; `vers` : la nouvelle, en eau libre ; le rond y garde trois cases de toute
 * terre, îlot ou ponton (`r` = éloignement − 3, comme ailleurs). Vérifié par terrain.test.ts et three/baleines.test.ts.
 */
export const BALEINES_REPLACEES: Readonly<Partial<Record<ArchipelagoId, readonly { de: { x: number; y: number }; vers: { x: number; y: number } }[]>>> = {
  '5e': [{ de: { x: 91, y: 345 }, vers: { x: 97, y: 344 } }],
};

const whaleCache = new Map<ArchipelagoId, { x: number; y: number; r: number }[]>();
export function whaleSpots(a: ArchipelagoId): { x: number; y: number; r: number }[] {
  const known = whaleCache.get(a);
  if (known) return known;
  // Les Îles du Ciel n'ont pas de mer : pas de baleines.
  if (DANS_LE_CIEL[a]) {
    whaleCache.set(a, []);
    return [];
  }
  const land: { x: number; y: number }[] = [];
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) land.push(c);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) land.push({ x: o.x + x, y: o.y + y });
  }
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) land.push({ x, y });
  // Les liaisons du port (GD-7) passent au large : une baleine n'y fait pas surface (les autres ouvrages, entre deux îles
  // proches, sont déjà loin des clairières).
  for (const br of BRIDGES) if (br.etoile && archipelagoOfIsland(br.from) === a) land.push(...bridgePath(br));
  const b = worldBounds(a);
  const clearance = (x: number, y: number) => {
    let best = Infinity;
    for (const c of land) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < best) best = d;
    }
    return best;
  };
  // Les baleines préfèrent le large : on note chaque clairière par sa largeur et son éloignement du centre.
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const candidates: { x: number; y: number; r: number; score: number }[] = [];
  for (let x = b.minX + 8; x <= b.maxX - 8; x += 3)
    for (let y = b.minY + 8; y <= b.maxY - 8; y += 3) {
      const r = clearance(x, y) - 3;
      candidates.push({ x, y, r, score: Math.min(r, 9) + Math.hypot(x - cx, y - cy) * 0.12 });
    }
  candidates.sort((p, q) => q.score - p.score);
  // Une baleine ne plonge pas sur l'îlot d'un monument (à deux cases près, comme `monumentBlocked`).
  const surUnMonument = (x: number, y: number, r: number) =>
    monumentsOf(a).some((m) => {
      const px = Math.max(m.islet.x, Math.min(x, m.islet.x + MONUMENT_ISLET - 1));
      const py = Math.max(m.islet.y, Math.min(y, m.islet.y + MONUMENT_ISLET - 1));
      return Math.hypot(px - x, py - y) < r + 2;
    });
  const spots: { x: number; y: number; r: number }[] = [];
  for (const c of candidates) {
    if (c.r < 4) continue;
    if (surUnMonument(c.x, c.y, Math.min(c.r, 9))) continue;
    if (spots.some((s) => Math.hypot(s.x - c.x, s.y - c.y) < s.r + c.r + 20)) continue;
    spots.push({ x: c.x, y: c.y, r: Math.min(c.r, 9) });
    if (spots.length === 4) break;
  }
  for (const { de, vers } of BALEINES_REPLACEES[a] ?? []) {
    const i = spots.findIndex((s) => s.x === de.x && s.y === de.y);
    if (i >= 0) spots[i] = { x: vers.x, y: vers.y, r: Math.min(clearance(vers.x, vers.y) - 3, 9) };
  }
  // Dans un ordre qui ne dépend que de leur place (d'ouest en est, puis de l'avant vers l'arrière) : chaque baleine garde son rythme
  // (`three/large.ts` le tire de son rang) quand une île grandit et que les notes des clairières changent.
  spots.sort((p, q) => p.x - q.x || p.y - q.y);
  whaleCache.set(a, spots);
  return spots;
}

const seaCache = new Map<ArchipelagoId, VoxelCube[]>();
/**
 * L'habillage de la mer : des rochers qui affleurent (galet et pierre, un à quatre cubes) et des bancs de sable au
 * ras de l'eau, semés au hasard (bruit fixe) dans l'eau libre, à cinq cases au moins de toute terre, de tout îlot,
 * de tout ouvrage et des ronds des baleines. Plus denses au large, autour du continent, là où l'écran montrait
 * la mer seule. Calculé une fois.
 */
export function seaDecor(a: ArchipelagoId): VoxelCube[] {
  const known = seaCache.get(a);
  if (known) return known;
  // Les Îles du Ciel : des nuages à la place de la mer, rien à semer.
  if (DANS_LE_CIEL[a]) {
    seaCache.set(a, []);
    return [];
  }
  const solid = new Set<string>();
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) solid.add(`${c.x},${c.y}`);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) solid.add(`${o.x + x},${o.y + y}`);
  }
  for (const def of BRIDGES.filter((br) => archipelagoOfIsland(br.from) === a))
    for (const c of bridgePath(def)) for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) solid.add(`${c.x + dx},${c.y + dy}`);
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0 - 1; x <= dock.x1 + 1; x++) for (let y = dock.y0 - 1; y <= dock.y1 + 1; y++) solid.add(`${x},${y}`);
  // Les îlots des monuments.
  for (const m of monumentsOf(a)) for (let x = 0; x < MONUMENT_ISLET; x++) for (let y = 0; y < MONUMENT_ISLET; y++) solid.add(`${m.islet.x + x},${m.islet.y + y}`);
  const whales = whaleSpots(a);
  const b = worldBounds(a);
  const free = (x: number, y: number) => {
    for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (solid.has(`${x + dx},${y + dy}`)) return false;
    return whales.every((w) => Math.hypot(w.x - x, w.y - y) > w.r + 4);
  };
  const cubes = semerLaMer(a, b, free);
  seaCache.set(a, cubes);
  return cubes;
}

/** Les nappes de brume des sommets (îles à 9) : centre, étendue et hauteur, en coordonnées de grille. */
export function mistPatches(a: ArchipelagoId): { x: number; y: number; z: number; w: number; h: number }[] {
  return mapOf(a)
    .filter((d) => d.altitude >= 9)
    .map((d) => {
      const b = landBox(d);
      return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: d.altitude - 1.5, w: b.x1 - b.x0 + 8, h: b.y1 - b.y0 + 8 };
    });
}

/** La fumée d'un foyer du quai : les cinq premières volutes, et les cases qu'elles surplombent. */
const HEARTH_PUFFS = PUFFS.slice(0, 5);
const SMOKE_DRIFT: [number, number][] = HEARTH_PUFFS.map(([dx, dy]) => [dx, dy]);

/** La longueur d'une barque (sa largeur est de 2). */
const BOAT_LENGTH = 4;

/** Une barque en cubes : un fond de 4 × 2 (la coque), la proue et la poupe relevées d'un bloc, le long de x ou de y. */
function boatCells(along: 'x' | 'y', overturned = false): { dx: number; dy: number; dz: number; end: boolean }[] {
  const out: { dx: number; dy: number; dz: number; end: boolean }[] = [];
  for (let i = 0; i < BOAT_LENGTH; i++)
    for (let j = 0; j < 2; j++) {
      const [dx, dy] = along === 'x' ? [i, j] : [j, i];
      const end = i === 0 || i === BOAT_LENGTH - 1;
      // Retournée (échouée), la coque est en haut et la proue et la poupe posent sur le sable.
      out.push({ dx, dy, dz: overturned ? 1 : 0, end: false });
      if (end) out.push({ dx, dy, dz: overturned ? 0 : 1, end: true });
    }
  return out;
}

/** Les objets du quai posés sur la terre de l'île-port : leur coin et leurs cases au sol. */
interface QuaySpot {
  x: number;
  y: number;
  /** Le niveau où poser l'objet (le dessus du sol + 1). */
  z: number;
  cells: [number, number][];
}

/**
 * Les places des objets du quai sur la terre de l'île-port (la barque tirée sur la grève, les fanions, les caisses, le
 * foyer), au plus près du pied de la jetée. Une place est de la terre plate et nue (le sol de l'île, rien dessus), jamais sur le
 * chemin du bonhomme vers le navire, ni sur la zone des plans, une borne, un lieu, la créature ou sa place à lui ;
 * les objets ne se touchent pas. Les places ne dépendent pas de l'état du village : un objet ne change pas de place.
 */
function quaySpots(port: BiomeId, cubes: VoxelCube[]): { boat: QuaySpot | null; flags: (QuaySpot | null)[]; crates: QuaySpot | null; hearth: QuaySpot | null } {
  const def = islandDef(port);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const top = new Map<string, VoxelCube>();
  for (const c of cubes) {
    // Une petite construction posée (GD-7, PR 3) ne compte pas : sa place est réservée plus bas, posée ou non, et les
    // objets du quai ne bougent pas quand elle se pose (le test le vérifie).
    if (c.petiteConstruction) continue;
    const k = `${c.x},${c.y}`;
    const t = top.get(k);
    if (!t || c.z > t.z) top.set(k, c);
  }
  const banned = new Set<string>();
  const ban = (x: number, y: number) => banned.add(`${x},${y}`);
  const core = (x: number, y: number) => ban(def.core.x + x, def.core.y + y);
  // Devant les bornes (voir `cacheUneBorne`) : ni mât de fanion ni fumée de foyer, qui cacheraient leur pied.
  const index = BIOMES.findIndex((b) => b.id === port);
  const bornes = questStations(port).map((st) => ({ x: def.core.x + st.x, y: def.core.y + st.y, base: def.altitude + groundHeight(index, st.x, st.y) }));
  const vers = versLaCamera(port);
  const zone = zoneDesPlans(port);
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) core(x, y);
  for (const st of questStations(port)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(st.x + dx, st.y + dy);
  for (const [x, y] of casesDuVillage(port)) core(x, y);
  // Devant la porte d'un lieu du village et une case autour : rien (les caisses du quai s'empilaient devant la porte de
  // l'école du Marché, à côté de la dernière borne ; relecture du consultant de Blocland, 02/10/2026).
  if (isSchoolIsland(port))
    for (const place of PLACE_IDS) {
      const { at, door } = VILLAGE_PLACES[place];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(at.x + door + dx, at.y - 1 + dy);
    }
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(AVATAR_HOME.x + dx, AVATAR_HOME.y + dy);
  // La petite construction de la commande de l'île (GD-7, PR 3), à sa place écrite, qu'elle soit posée ou non : les
  // objets du quai ne bougent jamais quand elle se pose. Sans case de marge : avec elle, la barque de la grève de la
  // Plaine, dont la boutique de Coco prend la place, n'en trouvait plus.
  const commande = commandeDeLIle(port);
  const place = commande ? placeDeLaPetiteConstruction(port, commande.fixture) : null;
  if (commande && place)
    for (const c of casesDeLaPetiteConstruction(commande.fixture) ?? [])
      core(place.x + c.x, place.y + c.y);
  // Les marges d'un cœur agrandi (le Marché, 01/10/2026) : le passage devant les bornes, où l'on marche et construit ; les
  // objets du quai restent sur la grève, devant elles, comme avant.
  for (const m of margesDuCoeur(def)) ban(m.x, m.y);
  // La rangée de côte devant les bornes d'une île-école reste nue (`rangeeDevantLesBornes`, DA, 01/10/2026).
  for (const k of rangeeDevantLesBornes(port)) banned.add(k);
  const spot = creatureSpot(port);
  for (const [sx, sy] of [[0, 0], ...spot.steps]) for (const c of creatureDuMonde(port)) core(spot.x + sx + c.x, spot.y + sy + c.y);
  // Le chemin du bonhomme vers le navire (en ligne droite, d'un point au suivant), jusqu'à la jetée.
  const route = boardingRoute(port);
  for (let i = 1; i < route.length; i++) {
    const [p, q] = [route[i - 1], route[i]];
    const n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), 1);
    for (let t = 0; t <= n; t++) ban(Math.round(p.x + ((q.x - p.x) * t) / n), Math.round(p.y + ((q.y - p.y) * t) / n));
  }
  // La cale, sur la côte devant la barque amarrée (à l'ouest de la jetée) : rien ne s'y pose, la barque reste lisible.
  for (let x = X - 4; x < X; x++) for (let y = S; y <= S + 1; y++) ban(x, y);
  // Les ouvrages qui partent de l'île-port, et une case autour.
  for (const b of BRIDGES.filter((d) => d.from === port || d.to === port))
    for (const c of bridgePath(b)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) ban(c.x + dx, c.y + dy);
  // Le niveau du sol de chaque case : le cœur (et son plateau), ou la terre autour.
  const land = new Map(landscape(def).map((c) => [`${c.x},${c.y}`, c]));
  const ground = (x: number, y: number): number | null => {
    if (inCore(def, x, y)) return def.altitude + groundHeight(index, x - def.core.x, y - def.core.y);
    const c = land.get(`${x},${y}`);
    return c && c.h >= 0 && !c.decor && c.ground !== 'eau' && c.ground !== 'lave' ? def.altitude + c.h : null;
  };
  /** Le dessus du sol nu d'une case libre, `null` si quelque chose y est posé ou si ce n'est pas de la terre. */
  const free = (x: number, y: number): number | null => {
    if (banned.has(`${x},${y}`) || y < S) return null;
    const t = top.get(`${x},${y}`);
    const z = ground(x, y);
    if (z === null || !t || t.z !== z || t.ghost || t.decor || t.quest || t.place || t.bridge || t.texture === 'eau' || t.texture === 'lave') return null;
    return z;
  };
  /** `air` : les cases que l'objet surplombe (la fumée), jamais au-dessus du chemin du bonhomme. */
  const find = (wantX: number, wantY: number, cells: [number, number][], air: [number, number][] = [], haut = false): QuaySpot | null => {
    let best: QuaySpot | null = null;
    let bestD = Infinity;
    // Un objet haut (le mât et la toile d'un fanion, la fumée d'un foyer : trois cubes au plus) ne cache pas une borne.
    const hauts = haut ? [...cells, ...air] : [];
    for (let x = X - 12; x <= X + 10; x++)
      for (let y = S; y <= def.core.y + 8; y++) {
        const zs = cells.map(([dx, dy]) => free(x + dx, y + dy));
        if (zs.some((z) => z === null || z !== zs[0])) continue;
        if (hauts.some(([dx, dy]) => HAUTEURS_D_UN_OBJET_HAUT.some((dz) => cacheUneBorne(bornes, vers, x + dx, y + dy, zs[0]! + dz)))) continue;
        // Au-dessus des cases surplombées, rien de plus haut qu'un bloc (pas d'arbre dans la fumée).
        if (air.some(([dx, dy]) => banned.has(`${x + dx},${y + dy}`) || y + dy < S || (top.get(`${x + dx},${y + dy}`)?.z ?? -Infinity) > zs[0]! + 1)) continue;
        // Au plus près de la côte d'abord, puis du pied de la jetée.
        const d = Math.abs(x - wantX) + 3 * Math.abs(y - wantY);
        if (d < bestD) {
          bestD = d;
          best = { x, y, z: zs[0]! + 1, cells };
        }
      }
    // Une case de marge : les objets ne se touchent pas.
    if (best) for (const [dx, dy] of cells) for (let ex = -1; ex <= 1; ex++) for (let ey = -1; ey <= 1; ey++) ban(best.x + dx + ex, best.y + dy + ey);
    return best;
  };
  const rect = (w: number, d: number): [number, number][] => Array.from({ length: w * d }, (_, i) => [i % w, Math.floor(i / w)]);
  const sea = archipelagoOfIsland(port) !== '3e';
  const boat = sea ? find(X - 5, S, rect(BOAT_LENGTH, 2)) : null;
  const crates = find(X - 2, S, rect(2, 1));
  // Un fanion de chaque côté du pied de la jetée, sa toile (une case à côté du mât) au-dessus du sol nu.
  const flags = [find(X - 2, S, [[0, 0], [-1, 0]], [], true), find(X + 2, S, [[0, 0], [1, 0]], [], true)];
  const hearth = find(X + 3, S + 1, [[0, 0]], SMOKE_DRIFT, true);
  return { boat, flags, crates, hearth };
}

/**
 * Le port de l'archipel : la jetée de planches qui descend de la côte vers le large, ses poteaux et ses lanternes, et ce
 * que montre l'état du village (`villageStage`), chaque état gardant ce qu'apportent les précédents : 1, lanternes
 * éteintes et une barque grise retournée sur la grève ; 2, lanternes allumées, la barque redressée ; 3, la barque amarrée
 * contre la jetée, un foyer qui fume ; 4, une seconde barque sur la grève, des caisses, deux fanions ; 5, une lanterne
 * sur chaque poteau et un feu de port au bout de la jetée. Rien sur la jetée ni à la place du navire ; pas de barque
 * dans les Îles du Ciel. Le Bloc-Navire amarré à côté n'est pas dans le terrain : il tangue, c'est un objet à part
 * (`vehiclePlacement`).
 */
function harbour(a: ArchipelagoId, village: Pick<World, 'parts' | 'links'>, cubes: VoxelCube[]): void {
  const port = getArchipelago(a).port;
  const rank = villageStage(village, a).rank;
  const def = islandDef(port);
  const rest = vehicleRestZ(a);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const spots = quaySpots(port, cubes);
  const lantern = (x: number, y: number, z: number) =>
    cubes.push({ x, y, z, color: BLOCKS[BLOC.lanterne].side, top: BLOCKS[BLOC.lanterne].top, texture: 'lanterne', tag: port });
  const cells = dockCells(port);
  for (const c of cells)
    cubes.push({ x: c.x, y: c.y, z: c.z, color: BLOCKS[BLOC.bois].side, top: c.step ? BLOCKS[BLOC.escalier].top : undefined, texture: c.step ? 'escalier' : 'planches', tag: port });
  for (const p of dockPosts(port)) {
    cubes.push({ x: p.x, y: p.y, z: p.z, color: TRUNK, texture: 'tronc', tag: port });
    // Éteintes, les lanternes du bout de la jetée ne sont qu'un bouchon de bois (pas de lueur la nuit).
    if (rank >= 5 || (p.lantern && rank >= 2)) lantern(p.x, p.y, p.z + 1);
    else if (p.lantern) cubes.push({ x: p.x, y: p.y, z: p.z + 1, color: BLOCKS[BLOC.bois].side, top: BLOCKS[BLOC.bois].top, texture: 'planches', tag: port });
  }
  // Le feu de port, au large du bout de la jetée (à l'ouest de la proue du navire) : un pilier de pierre et sa lanterne.
  if (rank >= 5) {
    const end = cells[cells.length - 1];
    for (let z = 0; z < 3; z++) cubes.push({ x: end.x, y: end.y - 1, z: rest + z, color: BLOCKS[BLOC.pierre].side, top: BLOCKS[BLOC.pierre].top, texture: 'pierre', tag: port });
    lantern(end.x, end.y - 1, rest + 3);
  }
  const prop = (kind: string, at: QuaySpot) => `${port}/${kind}@${at.x},${at.y}`;
  const boatAt = (x: number, y: number, z: number, along: 'x' | 'y', decor: string, overturned = false, faded = false) => {
    for (const c of boatCells(along, overturned)) {
      // La coque goudronnée, d'une couleur unie sombre (elle ne se confond pas avec les planches de la jetée, et n'ajoute
      // pas de matériau : la mine a déjà ce brun), la proue et la poupe en bois clair.
      const b = c.end ? BLOCKS[BLOC.bois] : { side: DARK, top: DARK, texture: undefined };
      cubes.push({ x: x + c.dx, y: y + c.dy, z: z + c.dz, color: faded ? fade(b.side) : b.side, top: faded ? fade(b.top) : b.top, texture: b.texture, tag: port, decor, muted: faded || undefined });
    }
  };
  // La barque de la grève : grise et retournée (1), redressée (2) ; elle part à l'eau (3) ; une seconde la remplace (4).
  if (spots.boat && rank !== 3) boatAt(spots.boat.x, spots.boat.y, spots.boat.z, 'x', prop('barque', spots.boat), rank === 1, rank === 1);
  // Amarrée à l'ouest de la jetée, entre les poteaux et l'îlot du Gardien (une case d'eau autour), au plus près de la côte.
  if (a !== '3e' && rank >= 3) {
    const bx = X - 3;
    const islet = new Set([...bossIsletCells(port), ...bossIsletSteps(port)].flatMap((c) => [-1, 0, 1].flatMap((ex) => [-1, 0, 1].map((ey) => `${c.x + ex},${c.y + ey}`))));
    const clear = (by: number) => [0, 1].every((dx) => Array.from({ length: BOAT_LENGTH }, (_, dy) => [bx + dx, by + dy]).every(([x, y]) => !isLand(def, x, y) && !islet.has(`${x},${y}`)));
    for (let by = S - BOAT_LENGTH; by > cells[cells.length - 1].y; by--)
      if (clear(by)) {
        boatAt(bx, by, rest, 'y', `${port}/barque@${bx},${by}`);
        break;
      }
  }
  if (rank >= 3 && spots.hearth) {
    // Le foyer : une pierre, et sa fumée qui monte au vent.
    const { x, y, z: base } = spots.hearth;
    const decor = prop('foyer', spots.hearth);
    cubes.push({ x, y, z: base, color: BLOCKS[BLOC.pierre].side, top: DARK, texture: 'pierre', tag: port, decor });
    for (const [dx, dy, dz] of HEARTH_PUFFS) cubes.push({ x: x + dx, y: y + dy, z: base + dz - 1, color: SMOKE, tag: port, decor });
  }
  if (rank >= 4) {
    if (spots.crates) {
      const { x, y, z: base } = spots.crates;
      const decor = prop('caisse', spots.crates);
      for (const [dx, dz] of [
        [0, 0],
        [1, 0],
        [0, 1],
      ])
        cubes.push({ x: x + dx, y, z: base + dz, color: BLOCKS[BLOC.bois].side, top: BLOCKS[BLOC.bois].top, texture: 'planches', tag: port, decor });
    }
    spots.flags.forEach((f) => {
      if (!f) return;
      const decor = prop('fanion', f);
      const base = f.z;
      for (let z = 0; z < 3; z++) cubes.push({ x: f.x, y: f.y, z: base + z, color: TRUNK, texture: 'tronc', tag: port, decor });
      // La toile flotte du côté opposé à la jetée.
      cubes.push({ x: f.x + f.cells[1][0], y: f.y, z: base + 2, color: BLOCKS[BLOC.toile].side, top: BLOCKS[BLOC.toile].top, texture: 'toile', tag: port, decor });
    });
  }
}

export interface VehiclePlacement {
  /** L'île-port où le navire est amarré. */
  port: BiomeId;
  /** Le coin local (0, 0, 0) du navire dans le monde. */
  origin: { x: number; y: number; z: number };
  /** Les cubes du navire, en coordonnées locales ; en fantôme, les cases encore à poser (ou le kit qui n'est pas arrivé). */
  cubes: VoxelCube[];
  /** Le navire flotte sur l'eau (il tangue) ou plane à hauteur de quai (les Îles du Ciel). */
  afloat: boolean;
  /** L'étape en chantier sur ce port, s'il y en a une. */
  building: string | null;
}

/**
 * Le Bloc-Navire au quai du port de l'archipel. Les étapes déjà parties sont dessinées entières (le navire les porte
 * partout où il accoste) ; celle qui se construit ici montre ses cases posées en dur et les autres en fantôme ; son kit
 * (voile, ballon, feux) arrive avec les Gardiens.
 */
export function vehiclePlacement(a: ArchipelagoId, progress: Record<string, { stars: number }>, village: World): VehiclePlacement {
  const port = getArchipelago(a).port;
  const origin = dockOrigin(port);
  const cubes: VoxelCube[] = [];
  const put = (c: { x: number; y: number; z: number; block: keyof typeof BLOCKS }, ghost: boolean) => {
    const bd = BLOCKS[c.block];
    cubes.push({ x: c.x, y: c.y, z: c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: port, ghost: ghost || undefined });
  };
  const bridges = village.links;
  for (const stage of launchedStages(bridges)) for (const c of [...stage.cells, ...stage.kit]) put(c, false);
  // Le chantier de ce port : l'étape qui s'y construit, si l'étape d'avant est partie.
  const building = stageBuildingAt(port, bridges);
  if (building) {
    const done = new Set(village.parts[building.id] ?? []);
    const placed = planCells(building);
    building.cells.forEach((c, i) => put(c, !done.has(placed[i].key)));
    const kit = kitReady(building, progress);
    for (const c of building.kit) put(c, !kit);
  }
  return { port, origin, cubes, afloat: !DANS_LE_CIEL[a], building: building?.id ?? null };
}

// ---------- Les lieux du village : l'école, la salle des trophées et le lieu où l'on assemble ----------

/** Encombrement de l'école : 5 cases de large (x), 4 de profondeur (y), la façade et sa porte côté caméra (y bas). */
export const SCHOOL_SIZE = { w: 5, d: 4 };
/**
 * Le coin de l'école dans le cœur de son île : au milieu à droite, derrière la dernière borne, une case libre entre elle
 * et le bord du cœur ; sa porte en (14, 2). La rangée de devant ne porte que les bornes (redistribution « Trois
 * bandes », choix du mainteneur, 02/10/2026 ; elle était devant, en (11, 1)).
 */
export const SCHOOL_AT = { x: 12, y: 3 };
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
export const ASSEMBLAGE_AT = { x: 15, y: 11 };

/** Les lieux du village, posés sur l'île de l'école de chaque archipel : leur coin dans le cœur, leur taille, la colonne de leur porte. */
export const VILLAGE_PLACES: Record<VillagePlaceId, { at: { x: number; y: number }; size: { w: number; d: number }; door: number }> = {
  school: { at: SCHOOL_AT, size: SCHOOL_SIZE, door: 2 },
  trophies: { at: TROPHY_AT, size: TROPHY_SIZE, door: SALLE_DE_DEPART.x + 2 },
  assembly: { at: ASSEMBLAGE_AT, size: ASSEMBLAGE_SIZE, door: 1 },
};
const PLACE_IDS = Object.keys(VILLAGE_PLACES) as VillagePlaceId[];

/** Un lieu posé sur une île : le coin de sa façade (coordonnées du monde) et son sol (z relatif au sol de l'île). */
export interface PlaceSpot {
  x: number;
  y: number;
  h: number;
}

function isSchoolIsland(id: BiomeId): boolean {
  return ARCHIPELAGOS.some((a) => a.school === id);
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
function casesDuVillage(id: BiomeId): [number, number][] {
  const out: [number, number][] = [];
  if (!isSchoolIsland(id)) return out;
  for (const place of PLACE_IDS) {
    const { at, size } = VILLAGE_PLACES[place];
    for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) out.push([at.x + dx, at.y + dy]);
  }
  return out;
}

/** Les mêmes cases, en clés « x,y ». */
const placeCells = (id: BiomeId): Set<string> => new Set(casesDuVillage(id).map(([x, y]) => `${x},${y}`));

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
function portesDesLieux(id: BiomeId): string[] {
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

function placeCube(place: PlaceId, x: number, y: number, z: number, block: keyof typeof BLOCKS, island: BiomeId, unlocked: boolean): VoxelCube {
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
export { TROPHY_SLOTS } from './salle';

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

// ---------- Les monuments, sur leur îlot au large ----------

/**
 * Où un îlot de monument ne va pas : la terre des îles et leur abord (trois cases), les îlots des Gardiens, le port et sa
 * jetée, les ouvrages et leur abord, la place des baleines. Sert à placer les monuments (une fois) et à le vérifier.
 */
export function monumentBlocked(a: ArchipelagoId): (x: number, y: number) => boolean {
  const solid = new Set<string>();
  const near = (x: number, y: number, r: number) => {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) solid.add(`${x + dx},${y + dy}`);
  };
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) near(c.x, c.y, 3);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) near(o.x + x, o.y + y, 2);
  }
  for (const def of BRIDGES.filter((br) => archipelagoOfIsland(br.from) === a)) for (const c of bridgePath(def)) near(c.x, c.y, 3);
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) near(x, y, 3);
  const whales = whaleSpots(a);
  return (x, y) => solid.has(`${x},${y}`) || whales.some((w) => Math.hypot(w.x - x, w.y - y) < w.r + 2);
}

/** L'îlot d'un monument est-il libre (toutes ses cases) ? */
export function monumentIsletFree(a: ArchipelagoId, x0: number, y0: number, blocked = monumentBlocked(a)): boolean {
  for (let x = x0; x < x0 + MONUMENT_ISLET; x++) for (let y = y0; y < y0 + MONUMENT_ISLET; y++) if (blocked(x, y)) return false;
  return true;
}

/**
 * Le point du monde où tombe la clé (0, 0, 0) d'un monument : une case de son plan (`planCells`, clé relative au cœur
 * de son île, figée par `ORIGINE_DES_MONUMENTS`) est dessinée en `monumentAnchor + case`. Le rendu suit l'îlot
 * (`m.islet`, la case (0, 0, 0) du plan au-dessus de son coin intérieur) ; les clés des sauvegardes, elles, ne bougent pas
 * si l'îlot ou le cœur bougent.
 */
export function monumentAnchor(m: MonumentDef): { x: number; y: number; z: number } {
  const fige = ORIGINE_DES_MONUMENTS[m.id];
  if (!fige) throw new Error(`Monument sans origine : ${m.id}`);
  return { x: m.islet.x + 1 - fige.x, y: m.islet.y + 1 - fige.y, z: (mapOf(m.archipelago)[0]?.altitude ?? 0) + 1 - fige.z };
}

/**
 * Le point du monde où tombe la clé (0, 0, 0) d'une étape du Bloc-Navire (plan du port) : une case de son plan est
 * dessinée en `ancreDuQuai + case`, comme le navire au quai (`dockOrigin`, ses cases locales). Le rendu suit le quai ;
 * les clés des sauvegardes restent celles de `ORIGINE_DU_QUAI`.
 */
export function ancreDuQuai(plan: PlanDef): { x: number; y: number; z: number } {
  const o = dockOrigin(plan.biome);
  const cle = planOrigin(plan);
  return { x: o.x - cle.x, y: o.y - cle.y, z: o.z - cle.z };
}

/**
 * Ce qui sépare la clé d'une case du Bloc-Navire de la case du plan de son île-port où elle est dessinée (le repère de
 * l'île, un cran plus bas : `rappelsDeLaVue`) : (0, 0, 0) tant que le quai est là où ses clés ont été figées.
 */
export function decalageDuQuai(plan: PlanDef): { x: number; y: number; z: number } {
  const a = ancreDuQuai(plan);
  const ile = origineDe(plan.biome);
  return { x: a.x - ile.x, y: a.y - ile.y, z: a.z - ile.z - 1 };
}

/** Le milieu de l'îlot d'un monument, à mi-hauteur du monument (pour y cadrer la caméra). */
export function monumentCenter(m: MonumentDef): { x: number; y: number; z: number } {
  return { x: m.islet.x + (MONUMENT_ISLET - 1) / 2, y: m.islet.y + (MONUMENT_ISLET - 1) / 2, z: (mapOf(m.archipelago)[0]?.altitude ?? 0) + 3 };
}

/**
 * Les îlots des monuments d'un archipel et leurs monuments : un îlot rond de sable (de neige dans les Îles du Ciel) au
 * niveau du sol de l'archipel, sa roche jusqu'à la mer (ou qui s'amincit sous lui dans le ciel), puis les cases du
 * monument, posées ou en fantôme. Tous leurs cubes se touchent pour ouvrir le panneau du monument.
 */
function monumentIslets(a: ArchipelagoId, village: World, cubes: VoxelCube[]): void {
  const alt = mapOf(a)[0]?.altitude ?? 0;
  const sky = DANS_LE_CIEL[a];
  const top = sky ? SNOW : BLOCKS[BLOC.sable].side;
  for (const m of monumentsOf(a)) {
    const place: PlaceId = `monument:${m.id}`;
    const n = MONUMENT_ISLET;
    const land: { x: number; y: number }[] = [];
    for (let dx = 0; dx < n; dx++)
      for (let dy = 0; dy < n; dy++) {
        // Les coins arrondis.
        const cx = Math.abs(dx - (n - 1) / 2);
        const cy = Math.abs(dy - (n - 1) / 2);
        if (cx + cy > n - 3) continue;
        land.push({ x: m.islet.x + dx, y: m.islet.y + dy });
      }
    for (const c of land) {
      cubes.push({ x: c.x, y: c.y, z: alt, color: top, texture: TEXTURES[top], tag: m.biome, place, sol: true });
      const bottom = sky ? alt - DEPTH : -DEPTH;
      for (let z = alt - 1; z >= bottom; z--) cubes.push({ x: c.x, y: c.y, z, color: BLOCKS[BLOC.pierre].side, texture: 'pierre', tag: m.biome, place, sol: true });
    }
    if (sky)
      for (const t of taperLayers(land)) cubes.push({ x: t.x, y: t.y, z: alt - DEPTH - t.d, color: BLOCKS[BLOC.pierre].side, texture: 'pierre', tag: m.biome, place, sol: true });
    const done = new Set(village.parts[m.id] ?? []);
    const o = monumentAnchor(m);
    for (const c of planCells(m)) {
      const bd = BLOCKS[c.block];
      cubes.push({ x: o.x + c.x, y: o.y + c.y, z: o.z + c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: m.biome, ghost: !done.has(c.key), place });
    }
  }
}

/** L'origine du repère d'une île : le coin de son cœur, à l'altitude de l'île (le point 0, 0, 0 de l'île). */
export function origineDe(id: BiomeId): { x: number; y: number; z: number } {
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: ox, y: oy, z: oz };
}

/**
 * Les cubes d'une île dans son repère (étape J5). Pour l'instant, l'île est calculée en cases du monde (map.ts place
 * son cœur dans le monde) puis ramenée à son origine ; R4b et la suite écrivent en repère d'île. Le sol, le paysage, le décor, les bornes, les lieux, l'îlot du
 * Gardien, la créature et les plans, en cases depuis le coin du cœur, z depuis l'altitude de l'île. Une case de plan
 * (c.x, c.y, c.z) y est le cube (c.x, c.y, c.z + 1). `voisins` : ce que les îles déjà posées occupent, en clés `cleDeCube` du monde
 * (une cascade ne tombe jamais sur la terre de l'île voisine) ; l'île y ajoute ses cubes.
 */
export function cubesDeLIle(
  id: BiomeId,
  progress: Record<string, { stars: number }>,
  village: World = { parts: {}, log: [], links: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  voisins: Set<number> = new Set(),
  /** Archipéo (lot 6) : l'îlot et la sentinelle, avant que le défi soit prêt. */
  sentinelles = false,
  /** La silhouette du lieu où l'on assemble (GD-2), selon l'univers (l'habillage). */
  atelier: Atelier = 'fabrique',
): VoxelCube[] {
  const index = BIOMES.findIndex((b) => b.id === id);
  const cubes: VoxelCube[] = [];
  poserLIle(BIOMES[index], index, progress, village, withCreatures, trophies, voisins, cubes, sentinelles, atelier);
  const { ox, oy, oz } = islandOrigin(index);
  for (const c of cubes) {
    c.x -= ox;
    c.y -= oy;
    c.z -= oz;
  }
  return cubes;
}

/**
 * Tous les cubes d'un archipel, en cases du monde : chaque île née dans son repère (`cubesDeLIle`) et posée à sa place
 * par la grille, puis ce qui est entre les îles (le port, les îlots des monuments, la mer habillée, les ouvrages).
 */
export function worldCubes(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  village: World = { parts: {}, log: [], links: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  /** Archipéo (lot 6) : l'îlot et la sentinelle de chaque île ouverte, avant que son défi soit prêt. */
  sentinelles = false,
  /** La silhouette du lieu où l'on assemble (GD-2), selon l'univers (l'habillage) : la Fabrique ou la Halle. */
  atelier: Atelier = 'fabrique',
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  // Tout ce qui est déjà posé dans la scène : une cascade ne tombe jamais sur la terre de l'île voisine.
  const placed = new Set<number>();
  for (const biome of BIOMES) {
    if (biome.classe !== a) continue;
    const o = origineDe(biome.id);
    for (const c of cubesDeLIle(biome.id, progress, village, withCreatures, trophies, placed, sentinelles, atelier)) {
      c.x += o.x;
      c.y += o.y;
      c.z += o.z;
      cubes.push(c);
    }
  }
  return entreLesIles(a, village, cubes);
}

/** Une île posée en cases du monde, ajoutée à `cubes` ; `placed` : ce que la scène occupe déjà (l'île y ajoute les siens). */
function poserLIle(
  biome: (typeof BIOMES)[number],
  index: number,
  progress: Record<string, { stars: number }>,
  village: World,
  withCreatures: boolean,
  trophies: (keyof typeof BLOCKS)[],
  placed: Set<number>,
  cubes: VoxelCube[],
  sentinelles = false,
  atelier: Atelier = 'fabrique',
): void {
  const def = islandDef(biome.id);
  const { ox, oy, oz } = islandOrigin(index);
  const unlocked = isBiomeUnlocked(biome.id, village.links);
  const block = BLOCKS[biome.block];
  // Les cœurs en herbe ; le Jardin des heures aussi (DA, LV2-4) : l'osier, son bloc, reste aux bordures, aux paniers et
  // à la serre ; et le Refuge des carnets (DA, LV2-5) : le bardeau reste aux murs.
  const grassy =
    biome.id === 'french-6e-phonology' ||
    biome.id === 'french-6e-grammar-spelling' ||
    biome.id === 'maths-6e-calculation' ||
    biome.id === 'maths-6e-fractions' ||
    biome.id === 'maths-5e-proportionality' ||
    biome.id === 'french-5e-homophones' ||
    biome.id === 'lv2-4e-daily-life' ||
    biome.id === 'lv2-3e-travel';
  const h = (x: number, y: number) => groundHeight(index, x, y);
  // Cubes du cœur (coordonnées relatives au cœur, z relatif au sol de l'île).
  // Cubes de la terre autour du cœur (coordonnées du monde). Île verrouillée : mêmes formes, couleurs délavées.
  const taken = new Set<number>();
  const putWorld = (x: number, y: number, z: number, color: string, decor?: string, sol?: true) => {
    taken.add(cleDeCube(x, y, z));
    placed.add(cleDeCube(x, y, oz + z));
    cubes.push({
      x,
      y,
      z: oz + z,
      color: unlocked ? color : fade(color),
      texture: TEXTURES[color],
      tag: biome.id,
      muted: unlocked ? undefined : true,
      decor: decor ? `${biome.id}/${decor}` : undefined,
      ...(sol ? { sol } : {}),
    });
  };
  // Le sol et la roche de l'île : le rendu Archipéo les dessine en facettes (world/landMesh.ts).
  const putSol = (x: number, y: number, z: number, color: string) => putWorld(x, y, z, color, undefined, true);
  // (Le décor du cœur est en coordonnées du cœur : son nom le dit, pour ne pas croiser celui du paysage.)
  const put: Put = (x, y, z, color, decor) => putWorld(ox + x, oy + y, z, color, decor && `cœur:${decor}`);
  // Le décor du cœur est dessiné sur la grille 12 × 12, décalée de la marge.
  // … sauf sur les cases des lieux du village (un feuillage voisin ne traverse pas leur toit).
  const placesAt = placeCells(biome.id);
  const putDecor: Put = (x, y, z, color, decor) =>
    !placesAt.has(`${LAYOUT_PAD.x + x},${LAYOUT_PAD.y + y}`) && put(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, z, color, decor);
  const land = landCells(def);
  for (const c of land) {
    if (!inCore(def, c.x, c.y)) continue;
    const x = c.x - ox;
    const y = c.y - oy;
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, -d, BLOCKS[BLOC.terre].side);
    const top = h(x, y);
    if (top > 0) putSol(c.x, c.y, 0, BLOCKS[BLOC.terre].side);
    putSol(c.x, c.y, top, grassy ? GRASS : block.side);
  }
  // Le paysage autour du cœur : collines, pics, lacs, cratère, sable des plages, neige des sommets, puis le décor.
  const scenery = landscape(def);
  for (const c of scenery) {
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, Math.min(0, c.h) - d, underground(def, c, c.h + d));
    for (let z = 0; z < c.h; z++) putSol(c.x, c.y, z, underground(def, c, c.h - z));
    putSol(c.x, c.y, c.h, GROUND_COLOR[c.ground]);
  }
  DECOR[biome.id](putDecor, (x, y) => h(x + LAYOUT_PAD.x, y + LAYOUT_PAD.y));
  // Les bornes de mission : un socle du bloc de l'île, une ardoise étoilée dessus. Délavées avec l'île quand elle est fermée.
  for (const st of questStations(biome.id)) {
    const quest = `${biome.id}:${st.typeId}`;
    const base = h(st.x, st.y);
    const tone = (c: string) => (unlocked ? c : fade(c));
    const muted = unlocked ? undefined : true;
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 1,
      color: tone(block.side),
      top: block.top,
      texture: block.texture,
      tag: biome.id,
      quest,
      muted,
    });
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 2,
      color: tone('#3a4a6a'),
      top: '#2f3d5c',
      texture: 'borne',
      tag: biome.id,
      quest,
      muted,
    });
    taken.add(cleDeCube(ox + st.x, oy + st.y, base + 1));
    taken.add(cleDeCube(ox + st.x, oy + st.y, base + 2));
  }
  // L'école, la salle des trophées et le lieu où l'on assemble (sur l'île de l'école de l'archipel) : on les touche pour
  // entrer, comme une borne.
  for (const place of PLACE_IDS) {
    const spot = placeSpot(place, biome.id);
    if (!spot) continue;
    const { at, size } = VILLAGE_PLACES[place];
    const modele = place === 'school' ? schoolModel() : place === 'trophies' ? trophyModel(trophies) : atelierModel(atelier, biome.classe);
    // Le soubassement rattrape une marche du sol, sous toute l'emprise du lieu ; pour la salle des trophées, sous ce qui
    // est bâti seulement : la place réservée d'une travée à venir reste le sol de l'île, sans dalle ni marque (GD-3).
    const bati = new Map<string, [number, number]>();
    if (place === 'trophies') for (const m of modele) bati.set(`${m.x},${m.y}`, [m.x, m.y]);
    else for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) bati.set(`${dx},${dy}`, [dx, dy]);
    const cases = bati.values();
    for (const [dx, dy] of cases)
      for (let z = h(at.x + dx, at.y + dy) + 1; z <= spot.h; z++) cubes.push(placeCube(place, spot.x + dx, spot.y + dy, oz + z, BLOC.taille, biome.id, unlocked));
    for (const m of modele) cubes.push(placeCube(place, spot.x + m.x, spot.y + m.y, oz + spot.h + m.z, m.block, biome.id, unlocked));
  }
  landmark(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && putWorld(x, y, z, color, decor));
  cascades(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && !placed.has(cleDeCube(x, y, oz + z)) && putWorld(x, y, z, color, decor));
  pontonEtBarque(def, scenery, (x, y, z, color, decor) => !taken.has(cleDeCube(x, y, z)) && !placed.has(cleDeCube(x, y, oz + z)) && putWorld(x, y, z, color, decor));
  const bornes = questStations(biome.id).map((st) => ({ x: ox + st.x, y: oy + st.y, base: h(st.x, st.y) }));
  const vers = versLaCamera(biome.id);
  // Sur une île-école, la rangée de côte devant les bornes reste nue (`rangeeDevantLesBornes`).
  const devant = rangeeDevantLesBornes(biome.id);
  // Le décor de la côte, puis celui des marges d'un cœur agrandi (au même rythme), hors des abords de ses ouvrages.
  const abords = abordsDansLesMarges(def);
  const pieds = piedsDesOuvrages(def);
  // Un élément assez près du pied d'un ouvrage pour que son feuillage y arrive (deux cases) : posé seulement s'il le laisse libre.
  const presDUnPied = (x: number, y: number) => {
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (pieds.has(`${x + dx},${y + dy}`)) return true;
    return false;
  };
  const marges = margesDuCoeur(def);
  // Les lieux du village en cases du monde : un élément de la côte ou des marges qui toucherait l'un d'eux (la Halle au
  // bord droit du cœur agrandi, 02/10/2026) n'est pas posé, plutôt que coupé.
  // En clés numériques (`cleDeCube`) : testées à chaque élément de décor, sans chaîne construite.
  // Devant la porte d'un lieu, et une case autour, rien non plus (un rocher de la côte se tenait à côté de la porte de la
  // Fabrique de l'Atelier, 02/10/2026).
  const lieuxDuMonde = new Set(casesDuVillage(biome.id).map(([x, y]) => cleDeCube(ox + x, oy + y)));
  if (lieuxDuMonde.size > 0)
    for (const place of PLACE_IDS) {
      const { at, door } = VILLAGE_PLACES[place];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) lieuxDuMonde.add(cleDeCube(ox + at.x + door + dx, oy + at.y - 1 + dy));
    }
  const presDUnLieu = (x: number, y: number) => {
    if (lieuxDuMonde.size === 0) return false;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (lieuxDuMonde.has(cleDeCube(x + dx, y + dy))) return true;
    return false;
  };
  for (let k = 0; k < scenery.length + marges.length; k++) {
    const c = k < scenery.length ? scenery[k] : marges[k - scenery.length];
    if (!c.decor || nearSentier(c.x, c.y)) continue;
    if (k >= scenery.length && abords.has(`${c.x},${c.y}`)) continue;
    const t = tirage(def, c.x, c.y);
    const r = noise(def.seed + 5, t.x, t.y);
    // Le décor ne remplace jamais un cube déjà posé (sol voisin plus haut, feuillage d'un autre arbre).
    // … ni ne déborde au-dessus du cœur d'origine (la zone des plans, les lieux et les bornes doivent rester libres).
    const poser: Put = (x, y, z, color, decor) => !inCoeurDOrigine(def, x, y) && !taken.has(cleDeCube(x, y, c.h + z)) && putWorld(x, y, c.h + z, color, decor);
    // Loin des bornes, rien ne peut en cacher une : posé directement. Près d'elles (une case de plus pour le feuillage),
    // un élément qui cacherait le pied d'une borne n'est pas posé (voir `cacheUneBorne`), ni un élément qui toucherait
    // la rangée de côte devant les bornes d'une île-école.
    const piedProche = pieds.size > 0 && !LOW.has(c.decor) && presDUnPied(c.x, c.y);
    if (!presDUneBorne(bornes, c.x, c.y, 1) && !presDUnLieu(c.x, c.y) && !piedProche) {
      decorate(poser, c.decor, c.x, c.y, r);
      continue;
    }
    const poses: [number, number, number, string, string | undefined][] = [];
    decorate((x, y, z, color, decor) => poses.push([x, y, z, color, decor]), c.decor, c.x, c.y, r);
    if (poses.some(([x, y, z]) => devant.has(`${x},${y}`) || lieuxDuMonde.has(cleDeCube(x, y)) || (piedProche && pieds.has(`${x},${y}`)) || cacheUneBorne(bornes, vers, x, y, c.h + z))) continue;
    for (const [x, y, z, color, decor] of poses) poser(x, y, z, color, decor);
  }
  // Une île en altitude flotte : sa roche s'amincit dessous.
  if (def.altitude > 0)
    for (const t of taperLayers(land)) if (!taken.has(cleDeCube(t.x, t.y, -DEPTH - t.d))) putSol(t.x, t.y, -DEPTH - t.d, BLOCKS[BLOC.pierre].side);
  // L'îlot du Gardien, devant l'île, dès qu'il accepte le défi : une petite île, son arène et ses pas japonais. Une
  // sentinelle (lot 6) est là dès l'ouverture de l'île, sans les pas japonais tant qu'elle attend.
  const guardian = guardianStatus(biome, progress, village.links, sentinelles);
  if (guardian !== 'hidden') bossIslet(biome, guardian === 'beaten', cubes, guardian !== 'waiting');
  if (unlocked && withCreatures) {
    const spot = creatureSpot(biome.id);
    for (const c of creatureDuMonde(biome.id))
      cubes.push({
        x: ox + spot.x + c.x,
        y: oy + spot.y + c.y,
        z: oz + c.z + 1,
        color: c.color,
        tag: biome.id,
      });
  }
  // La petite construction d'une commande livrée (GD-7, PR 3), à côté de la créature, en cubes posés.
  const commande = unlocked ? commandeDeLIle(biome.id) : undefined;
  if (commande && estPosee(village.parts, commande.fixture)) {
    const place = placeDeLaPetiteConstruction(biome.id, commande.fixture);
    if (place)
      for (const c of casesDeLaPetiteConstruction(commande.fixture) ?? []) {
        const bd = BLOCKS[c.block];
        cubes.push({
          x: ox + place.x + c.x,
          y: oy + place.y + c.y,
          z: oz + c.z + 1,
          color: bd.side,
          top: bd.top,
          texture: bd.texture,
          tag: biome.id,
          sansDessous: true,
          petiteConstruction: true,
          // Une porte montre son dessus : il prend le dessin de ses côtés, sans appel de dessin de plus.
          dessusCommeLesCotes: c.block === BLOC.porte || undefined,
        });
      }
    if (place)
      for (const [x, y, z] of eauDeLaPetiteConstruction(commande.fixture))
        cubes.push({ x: ox + place.x + x, y: oy + place.y + y, z: oz + z + 1, color: WATER, texture: TEXTURES[WATER], tag: biome.id, sansDessous: true, petiteConstruction: true });
  }
  // Les plans : cellules posées en dur ; fantômes seulement pour le plan en cours (le premier non terminé) d'une île ouverte.
  if (unlocked) {
    let ghostsShown = false;
    for (const plan of plansFor(biome.id)) {
      const done = new Set(village.parts[plan.id] ?? []);
      const finished = isPlanDone(plan, village.parts);
      if (!finished && ghostsShown) break;
      if (!finished) ghostsShown = true;
      // Dessinées au fond de la zone au Marché et à l'Atelier (`decalageDesPlans`) ; les clés restent celles du plan.
      const d = decalageDesPlans(plan);
      for (const c of planCells(plan)) {
        const bd = BLOCKS[c.block];
        const built = done.has(c.key);
        cubes.push({ x: ox + c.x + d.x, y: oy + c.y + d.y, z: oz + c.z + d.z + 1, color: bd.side, top: bd.top, texture: bd.texture, tag: biome.id, ghost: !built });
      }
    }
  }
}

/**
 * Les cases de la petite construction d'une commande (GD-7, PR 3), en clés « x,y,z » du monde, là où `poserLIle` la
 * dessine, son eau comprise : la vague de la livraison les pose (world/vague.ts). Vide si elle n'a pas de place.
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

/**
 * Les cases du monde où se posent des cases de plans d'île (une partie du bâtiment, GD-6), en clés « x,y,z » : là où
 * `poserLIle` dessine chacune (le coin du cœur, le décalage des plans du fond, un cran au-dessus du sol).
 */
export function casesDesPlansDansLeMonde(cases: readonly { plan: PlanDef; keys: readonly string[] }[]): Set<string> {
  const out = new Set<string>();
  for (const { plan, keys } of cases) {
    const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === plan.biome));
    const d = decalageDesPlans(plan);
    const voulues = new Set(keys);
    for (const c of planCells(plan)) if (voulues.has(c.key)) out.add(`${ox + c.x + d.x},${oy + c.y + d.y},${oz + c.z + d.z + 1}`);
  }
  return out;
}

/** Ce qui est entre les îles, en cases du monde, ajouté à `cubes` : le port, les îlots des monuments, la mer, les ouvrages. */
function entreLesIles(a: ArchipelagoId, village: World, cubes: VoxelCube[]): VoxelCube[] {
  // Le port : la jetée (le Bloc-Navire est un objet à part, voir vehiclePlacement).
  harbour(a, village, cubes);
  // Les monuments, chacun sur son îlot au large : bâtis, ou en fantômes à construire.
  monumentIslets(a, village, cubes);
  // La mer habillée : rochers et bancs de sable, loin de tout (jamais sous un ouvrage, ni sur l'îlot d'un monument).
  for (const c of seaDecor(a)) cubes.push(c);
  // Les ponts : en planches s'ils sont construits, en fantôme s'ils sont constructibles, absents s'ils sont trop loin.
  // Avec « Pas de LV2 », pas de fantôme vers l'île de la LV2 : il n'est pas proposé (`buildableBridges`), rien ne
  // l'annonce (DA, 28/09, LV2-4). Un pont déjà construit reste : la sauvegarde de l'élève ne perd rien.
  const occupied = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  const sansLv2 = lv2Courante() === 'none';
  const versLaLv2 = (def: BridgeDef) => [def.from, def.to].some((id) => BIOMES.find((x) => x.id === id)?.subject === 'lv2');
  for (const def of BRIDGES) {
    if (archipelagoOfIsland(def.from) !== a) continue;
    const state = bridgeState(def, village.links);
    if (state === 'far' || (state !== 'built' && sansLv2 && versLaLv2(def))) continue;
    bridge(def, cubes, state === 'buildable', occupied);
  }
  return cubes;
}
