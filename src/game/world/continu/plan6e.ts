// Le plan du 6e en données (prototype du monde ouvert d'Archipéo, piste B « chemins aimantés », choix du mainteneur
// du 14 octobre 2026) : la côte en anneau, le lagon et sa passe, l'îlot du Phare, la falaise nord, la rivière de l'est,
// relevés sur le plan des lieux confirmé le 13 octobre 2026 (archipeo/univers-challenge/niveaux/plan-6e.png, dans la
// Bibliothèque du projet) ; les quatre lieux du prototype ; le réseau des chemins (sentiers, digue, pontons) ; les
// cadrages prévus, un par rivage. Les points sont écrits en pixels du plan (1 800 × 1 250), pour se relire contre
// l'image, et convertis en unités du monde (`fromPlan`). Code pur.
import type { Vec2 } from './geometry';

/** Pixels du plan par unité du monde : l'anneau fait environ 77 unités d'est en ouest (Kéo en mesure 2). */
const PLAN_SCALE = 14;
/** Le point du plan qui est l'origine du monde : le pied du Phare, au milieu du lagon. */
const PLAN_ORIGIN = { x: 880, y: 590 };

/** Un point du plan (en pixels de l'image) en unités du monde. */
export const fromPlan = ([px, py]: readonly [number, number]): Vec2 => ({ x: (px - PLAN_ORIGIN.x) / PLAN_SCALE, z: (py - PLAN_ORIGIN.y) / PLAN_SCALE });

const poly = (points: readonly (readonly [number, number])[]): Vec2[] => points.map(fromPlan);

/** Les couleurs du 6e (fiche du niveau, § 2), et ce qui les accompagne dans la palette du pack. */
export const COLORS_6E = {
  /** Lagon : eau claire, peu profonde. */
  lagoon: 0x2fb5a6,
  /** Bleu lagon du pack : l'eau profonde, le large. */
  deepSea: 0x178078,
  /** Rivage : herbe, mousse sur la pierre. */
  grass: 0x6cbf4e,
  /** L'herbe du haut de la falaise nord, plus sombre (le plan). */
  cliffTop: 0x4e8f3a,
  /** Sable chaud : plages. */
  sand: 0xe3c08a,
  /** La roche des pentes raides (la falaise, les berges de la rivière). */
  rock: 0x9c8466,
  /** Le sable mouillé, juste sous l'eau. */
  wetSand: 0xc9ad78,
  /** Les sentiers, un peu plus sombres que la plage pour se lire sur l'herbe. */
  path: 0xd6bb86,
  /** Le bois des pontons et de la digue (le sable chaud, plus sombre). */
  wood: 0xa9784a,
} as const;

/** Le bord extérieur de l'anneau (sable compris), dans le sens des aiguilles d'une montre depuis le nord. */
export const COAST = poly([
  [880, 112], [1010, 160], [1090, 250], [1160, 340], [1300, 410], [1440, 500], [1465, 610], [1440, 700],
  [1360, 810], [1300, 880], [1220, 940], [1100, 965], [1000, 960], [800, 972], [640, 1005], [510, 985],
  [420, 920], [395, 800], [400, 650], [398, 560], [410, 480], [480, 360], [635, 205], [745, 130],
]);

/** Le lagon, l'eau claire au milieu de l'anneau. */
export const LAGOON = poly([
  [680, 382], [800, 372], [940, 400], [1060, 420], [1140, 470], [1182, 560], [1182, 660], [1150, 725],
  [1060, 790], [950, 832], [800, 860], [735, 838], [660, 780], [600, 680], [592, 600], [610, 500],
]);

/** La passe de l'ouest : la Nef y entre, le lagon s'ouvre sur le large. */
export const PASS = poly([[380, 572], [612, 578], [612, 646], [380, 652]]);

/** L'îlot du Phare, au milieu du lagon. */
export const ISLET = poly([[800, 560], [840, 532], [930, 538], [968, 596], [944, 650], [880, 670], [820, 646], [794, 602]]);

/** La falaise du nord : la Vigie en haut, les Archives dessous (hors du prototype, mais le relief est là). */
export const CLIFF = poly([[640, 240], [760, 190], [830, 196], [866, 262], [846, 350], [800, 366], [690, 372], [650, 328]]);

/** Le haut pays de l'est, d'où descend la rivière (les Écluses « en haut »). */
export const UPLAND = { center: fromPlan([1215, 330]), radius: 130 / PLAN_SCALE, height: 3.2 };

/** La rivière, des Écluses à l'estuaire, et sa demi-largeur. */
export const RIVER = { line: poly([[1222, 418], [1258, 550], [1242, 730], [1292, 842], [1400, 912], [1490, 960]]), halfWidth: 13 / PLAN_SCALE };

/** Les lieux du prototype. */
export type PlaceId = 'phare' | 'quais' | 'filets' | 'ecluses';

/** Les rivages, chacun son cadrage. */
export type ShoreId = 'lagon' | 'est' | 'nord';

export interface OpenPlace {
  id: PlaceId;
  /** Le nouveau nom (fiche du 6e, § 4 ; pas encore validé : il ne s'affiche que derrière le drapeau). */
  name: string;
  /** « au Phare », « aux Quais » : pour les phrases. */
  at: string;
  /** L'île d'aujourd'hui dont il reprend la mission (ses repères stables : identifiant, matière, icône). */
  island: string;
  /** Le centre du modèle au sol, et son quart de tour (en radians autour de la verticale). */
  center: Vec2;
  yaw: number;
  /** Le nœud du chemin où Kéo s'arrête devant lui. */
  door: string;
  /** Le rayon de toucher autour du centre : large (rien de précis à viser). */
  touchRadius: number;
}

export const PLACES: readonly OpenPlace[] = [
  { id: 'phare', name: 'Le Phare', at: 'au Phare', island: 'french-6e-phonology', center: fromPlan([880, 590]), yaw: 0, door: 'phare', touchRadius: 5.5 },
  { id: 'quais', name: 'Les Quais', at: 'aux Quais', island: 'maths-6e-calculation', center: fromPlan([1112, 806]), yaw: 0, door: 'quais', touchRadius: 5.5 },
  { id: 'filets', name: 'Les Filets', at: 'aux Filets', island: 'french-6e-grammar-spelling', center: fromPlan([1052, 232]), yaw: 0.35, door: 'filets', touchRadius: 5.5 },
  { id: 'ecluses', name: 'Les Écluses', at: 'aux Écluses', island: 'maths-6e-fractions', center: fromPlan([1240, 382]), yaw: 0, door: 'ecluses', touchRadius: 5.5 },
];

/** Un lieu par son identifiant. */
export const placeById = (id: PlaceId): OpenPlace => PLACES.find((p) => p.id === id)!;

/** Le lieu qui reprend la mission d'une île, s'il y en a un. */
export const placeOfIsland = (island: string): OpenPlace | undefined => PLACES.find((p) => p.island === island);

/** Un nœud du réseau des chemins : sa place et son rivage (le cadrage qui le montre). */
export interface PathNode {
  id: string;
  at: Vec2;
  shore: ShoreId;
}

const node = (id: string, p: [number, number], shore: ShoreId): PathNode => ({ id, at: fromPlan(p), shore });

/** Les nœuds : les portes des lieux, les coudes des sentiers, la digue et le ponton. */
export const PATH_NODES: readonly PathNode[] = [
  node('phare', [880, 676], 'lagon'),
  node('digue', [945, 664], 'lagon'),
  node('ponton', [1008, 704], 'lagon'),
  node('quais', [1088, 778], 'lagon'),
  node('est-1', [1152, 730], 'lagon'),
  node('est-2', [1196, 625], 'est'),
  node('est-3', [1194, 525], 'est'),
  node('est-4', [1150, 452], 'est'),
  node('ecluses', [1196, 372], 'est'),
  node('nord-1', [1092, 402], 'nord'),
  node('nord-2', [1062, 330], 'nord'),
  node('filets', [1040, 278], 'nord'),
  node('crete', [1128, 300], 'nord'),
];

/** Les liaisons entre nœuds : sentiers, digue (Phare – Quais) et ponton (les Quais). */
export const PATH_EDGES: readonly (readonly [string, string])[] = [
  ['phare', 'digue'],
  ['digue', 'ponton'],
  ['ponton', 'quais'],
  ['quais', 'est-1'],
  ['est-1', 'est-2'],
  ['est-2', 'est-3'],
  ['est-3', 'est-4'],
  ['est-4', 'ecluses'],
  ['est-4', 'nord-1'],
  ['nord-1', 'nord-2'],
  ['nord-2', 'filets'],
  ['filets', 'crete'],
  ['crete', 'ecluses'],
];

/**
 * Un cadrage prévu : le point visé au sol, et le rayon autour de lui qui doit tenir à l'écran. La caméra regarde
 * toujours vers le nord, d'en haut, au même angle : jamais libre, jamais de roulis.
 */
export interface Framing {
  shore: ShoreId;
  target: Vec2;
  radius: number;
}

export const FRAMINGS: readonly Framing[] = [
  { shore: 'lagon', target: fromPlan([996, 650]), radius: 15 },
  { shore: 'est', target: fromPlan([1196, 452]), radius: 14 },
  { shore: 'nord', target: fromPlan([1086, 294]), radius: 11.5 },
];

/** Le cadrage d'un rivage. */
export const framingOf = (shore: ShoreId): Framing => FRAMINGS.find((f) => f.shore === shore)!;

/** Le terrain : l'étendue de la carte de hauteurs, le pas de sa grille et son découpage en tuiles. */
export const TERRAIN = { minX: -37, maxX: 44, minZ: -36, maxZ: 31, step: 1.1, tiles: 2 } as const;

/** La hauteur du dessus de la digue et des pontons, au-dessus de l'eau (0). */
export const DECK_HEIGHT = 0.45;
