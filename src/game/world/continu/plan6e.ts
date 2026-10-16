// Le plan du 6e en données (prototype du monde ouvert d'Archipéo, piste B « chemins aimantés », choix du mainteneur
// du 14 octobre 2026) : la côte en anneau, le lagon et sa passe, l'îlot du Phare, la falaise nord, la rivière de l'est,
// relevés sur le plan des lieux confirmé le 13 octobre 2026 (archipeo/univers-challenge/niveaux/plan-6e.png, dans la
// Bibliothèque du projet) ; les quatre lieux du prototype ; le réseau des chemins (sentiers, digue, pontons). Les points
// sont écrits en pixels du plan (1 800 × 1 250), pour se relire contre l'image, et convertis en unités du monde
// (`fromPlan`). Piste 1, lot 1 (choix du mainteneur du 14 octobre 2026) : l'île agrandie autour de Kéo, environ 120 pas
// du Phare aux Quais ; les lieux gardent leur taille, posés au bord de leur rivage. Code pur.
import type { Vec2 } from './geometry';

/**
 * Un pas de Kéo, en unités du monde : un demi-mètre, Kéo (2,4 unités dans la scène) mesurant un mètre et demi. Les
 * distances du monde se règlent en pas (deambuler-scenettes.md, « Échelle »).
 */
export const KEO_STEP = 0.8;

/**
 * Pixels du plan par unité du monde. Piste 1, lot 1 : 2,8 (il était de 14) : le monde est cinq fois plus grand, l'anneau
 * fait environ 380 unités d'est en ouest ; du Phare aux Quais, environ 120 pas (premier essai, à régler avec des élèves).
 */
const PLAN_SCALE = 2.8;
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

/**
 * Le bassin des Quais, au sud du quai : l'eau devant laquelle la barque s'amarre pendant une question (le quai regardait
 * la mer du sud quand l'île était petite ; agrandie, la mer est trop loin). Son bord nord est droit, tenu par le bord de
 * quai de pierre (`DOCK_EDGE`) ; ses autres rives sont irrégulières (lot 3, directeur artistique : pas une piscine).
 */
export const DOCK = poly([
  [1056, 818],
  [1112, 818],
  [1121, 827],
  [1117, 841],
  [1104, 853],
  [1079, 849],
  [1061, 855],
  [1049, 843],
  [1051, 828],
]);

/** Le bord de quai de pierre, le long de la rive nord du bassin, d'ouest en est : là où la barque accoste. */
export const DOCK_EDGE = { from: fromPlan([1057, 818]), to: fromPlan([1111, 818]) };

/** Le haut pays de l'est, d'où descend la rivière (les Écluses « en haut »). */
export const UPLAND = { center: fromPlan([1215, 330]), radius: 130 / PLAN_SCALE, height: 6 };

/** La rivière, des Écluses à l'estuaire, et sa demi-largeur (en unités : un ruisseau de quelques pas, pas un fleuve). */
export const RIVER = { line: poly([[1222, 418], [1258, 550], [1242, 730], [1292, 842], [1400, 912], [1490, 960]]), halfWidth: 2.4 };

/**
 * La grève plate des Marais salants (GD-20, point 8, lot L5), sur la côte est, face au large : le sol y est aplani à
 * cette hauteur dans ce rayon (en unités), puis rejoint le sien sur `fade` unités ; seulement sur la terre (la côte ne
 * bouge pas).
 */
export const SALT_FLAT = { center: fromPlan([1430, 652]), radius: 9, fade: 5, height: 0.55 } as const;

/**
 * Les lieux du prototype. `saltworks` : les Marais salants (lot L5), le premier lieu neuf, qui reprend l'île des
 * nombres décimaux ; son identifiant reste neutre tant que son nom n'est pas décidé (carte posée au mainteneur).
 */
export type PlaceId = 'phare' | 'quais' | 'filets' | 'ecluses' | 'saltworks';

export interface OpenPlace {
  id: PlaceId;
  /** Le nouveau nom (fiche du 6e, § 4 ; pas encore validé : il ne s'affiche que derrière le drapeau). */
  name: string;
  /** « au Phare », « aux Quais » : pour les phrases. */
  at: string;
  /**
   * Le genre et le nombre de son nom (le Phare : masculin singulier ; les Écluses : féminin pluriel), pour accorder le
   * mot d'état de la Carte (« restauré », « restaurées »).
   */
  agree: 'ms' | 'mp' | 'fs' | 'fp';
  /**
   * L'île d'aujourd'hui dont il reprend les missions (ses repères stables : identifiant, matière, icône). Le lieu porte
   * toutes les missions de son île (GD-20, point 8, choix du mainteneur du 15 octobre 2026) : sa liste est celle des
   * bornes de l'île (le modèle du monde, ./mission.ts, `missionsOfPlace`), jamais écrite ici.
   */
  island: string;
  /**
   * Les missions de l'île qui se jouent déjà en scénette dans le lieu (les autres se jouent sur l'écran habituel, depuis
   * le panneau du lieu, le temps de la transition) : le Troupeau aux Filets ; aux Quais, toutes (GD-20, point 8, lot
   * L1) ; aux Écluses, toutes (lot L2) ; au Phare, toutes (lot L3) ; aux Filets, toutes (lot L4) ; aux Marais salants,
   * toutes (lot L5).
   */
  scenes: readonly string[];
  /** Le centre du modèle au sol, et son quart de tour (en radians autour de la verticale). */
  center: Vec2;
  yaw: number;
  /** Le nœud du chemin où Kéo s'arrête devant lui. */
  door: string;
  /** Le rayon de toucher autour du centre : large (rien de précis à viser). */
  touchRadius: number;
}

/**
 * Un lieu : son centre sur le plan (en pixels, posé au bord de son rivage à la nouvelle échelle), et sa porte, à
 * quelques pas de lui, en unités du monde (les lieux gardent leur taille quand l'île grandit).
 */
interface PlaceSpec extends Omit<OpenPlace, 'center' | 'door'> {
  /** Le centre sur le plan, en pixels. */
  plan: [number, number];
  /** La porte, depuis le centre, en unités. */
  door: Vec2;
}

const PLACE_SPECS: readonly PlaceSpec[] = [
  { id: 'phare', name: 'Le Phare', at: 'au Phare', agree: 'ms', island: 'french-6e-phonology', scenes: ['syllables', 'sound-hunt', 'rhymes'], plan: [880, 590], door: { x: 0, z: 6.14 }, yaw: 0, touchRadius: 5.5 },
  {
    id: 'quais',
    name: 'Les Quais',
    at: 'aux Quais',
    agree: 'mp',
    island: 'maths-6e-calculation',
    scenes: ['times-tables', 'make-ten', 'doubles-halves', 'word-problems', 'measures'],
    plan: [1085, 783],
    door: { x: -1.71, z: -2 },
    yaw: 0,
    touchRadius: 5.5,
  },
  { id: 'filets', name: 'Les Filets', at: 'aux Filets', agree: 'mp', island: 'french-6e-grammar-spelling', scenes: ['word-classes', 'sorting', 'e-er-ez', 'plurals'], plan: [1061, 222], door: { x: -0.86, z: 3.29 }, yaw: 0.35, touchRadius: 5.5 },
  { id: 'ecluses', name: 'Les Écluses', at: 'aux Écluses', agree: 'fp', island: 'maths-6e-fractions', scenes: ['number-line', 'equivalence', 'sharing', 'place-value', 'fraction-sums'], plan: [1226, 404], door: { x: -3.14, z: -0.71 }, yaw: 0, touchRadius: 5.5 },
  // Les Marais salants (lot L5) : sur la grève plate de la côte est, face au large ; le nom affiché est un nom de
  // travail (le mainteneur peut choisir « Les Salins » ou « La Saline »), écrit ici seulement.
  {
    id: 'saltworks',
    name: 'Les Marais salants',
    at: 'aux Marais salants',
    agree: 'mp',
    island: 'maths-6e-decimals',
    scenes: ['ordering', 'operations', 'scale', 'large-numbers', 'rounding-products'],
    plan: [1430, 652],
    door: { x: -7.2, z: -0.8 },
    yaw: 0,
    touchRadius: 6.5,
  },
];

export const PLACES: readonly OpenPlace[] = PLACE_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  at: s.at,
  agree: s.agree,
  island: s.island,
  scenes: s.scenes,
  center: fromPlan(s.plan),
  yaw: s.yaw,
  door: s.id,
  touchRadius: s.touchRadius,
}));

/** Un lieu par son identifiant. */
export const placeById = (id: PlaceId): OpenPlace => PLACES.find((p) => p.id === id)!;

/** Le lieu qui reprend les missions d'une île, s'il y en a un. */
export const placeOfIsland = (island: string): OpenPlace | undefined => PLACES.find((p) => p.island === island);

/** Un nœud du réseau des chemins. */
export interface PathNode {
  id: string;
  at: Vec2;
}

const node = (id: string, p: [number, number]): PathNode => ({ id, at: fromPlan(p) });

/** La porte d'un lieu : à son décalage de son centre, en unités. */
const doorNode = (s: PlaceSpec): PathNode => {
  const c = fromPlan(s.plan);
  return { id: s.id, at: { x: c.x + s.door.x, z: c.z + s.door.z } };
};

/**
 * L'Escale, le lieu de départ du monde continu (GD-20, lot 2) : le Port, sur la rive sud du lagon, là où la digue
 * venue du Phare touche terre, à l'ouest des Quais ; « le Port et le Phare » sont le lieu de départ, reliés par la
 * digue. Son repère : l'origine au pied du quai, sur le rivage, `x` le long du rivage vers l'est, `z` vers l'intérieur
 * des terres (au sud) ; `yaw` le tourne pour suivre le rivage. Le quai avance dans l'eau ; derrière lui, une place de
 * pierre qui monte doucement du quai, et le long du rivage, façades au sud (vers la caméra qui suit Kéo, toujours
 * tournée vers le nord), la galerie des succès, puis l'école, et au fond le lieu d'assemblage. Rien ne se pose devant
 * une porte ; le côté ouest du quai reste libre pour la Nef (lot 5).
 */
export const PORT = (() => {
  const origin = { x: 0, z: 91.1 };
  const yaw = 0.2;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  return {
    origin,
    yaw,
    /** Un point du repère du Port dans le monde. */
    toWorld: (lx: number, lz: number): Vec2 => ({ x: origin.x + lx * c + lz * s, z: origin.z - lx * s + lz * c }),
    /** Un point du monde dans le repère du Port. */
    toLocal: (p: Vec2): Vec2 => {
      const dx = p.x - origin.x,
        dz = p.z - origin.z;
      return { x: dx * c - dz * s, z: dx * s + dz * c };
    },
  } as const;
})();

/**
 * Le pavage du Port, dans son repère : le quai, de la pointe dans l'eau jusqu'à la place, et la place, le long des
 * façades. Kéo y marche sur la pierre (`portFloor`), les chemins n'y sont pas dessinés.
 */
export const PORT_PAVING = {
  quay: { x0: -3, x1: 3, z0: -9, z1: 6.5 },
  square: { x0: -3.5, x1: 36.5, z0: 6.5, z1: 12.5 },
} as const;

/** La hauteur du quai, au-dessus de l'eau, et la pente de la place qui en monte (par unité vers l'intérieur). */
const PORT_LEVEL = { quay: 0.75, rise: 0.115, from: 1 } as const;

/** La hauteur de la pierre du Port en un point de son repère (le quai à plat, puis la place qui monte). */
export const portLevel = (lz: number): number => PORT_LEVEL.quay + PORT_LEVEL.rise * Math.max(0, lz - PORT_LEVEL.from);

const PORT_COS = Math.cos(PORT.yaw);
const PORT_SIN = Math.sin(PORT.yaw);

/**
 * La pierre du Port sous un point du monde (`x`, `z`), ou rien hors du pavage : Kéo s'y tient, au-dessus du sol. Lue à
 * chaque image (les pieds de Kéo, la caméra) : rien n'y est créé.
 */
export function portFloor(x: number, z: number): number | null {
  const dx = x - PORT.origin.x,
    dz = z - PORT.origin.z;
  const lx = dx * PORT_COS - dz * PORT_SIN,
    lz = dx * PORT_SIN + dz * PORT_COS;
  const { quay: q, square: s } = PORT_PAVING;
  const inside = (lx >= q.x0 && lx <= q.x1 && lz >= q.z0 && lz <= q.z1) || (lx >= s.x0 && lx <= s.x1 && lz >= s.z0 && lz <= s.z1);
  return inside ? portLevel(lz) : null;
}

/** Les matières de l'école, une porte chacune, dans l'ordre de la barre (Français, Maths, Anglais). */
export type PortSubject = 'french' | 'maths' | 'english';
export const PORT_SUBJECTS: readonly PortSubject[] = ['french', 'maths', 'english'];

/**
 * Les endroits du Port où Kéo se tient : le quai (le départ), chaque porte de l'école, la galerie des succès, le lieu
 * d'assemblage. Chacun a son nœud de chemin, `port-<endroit>`.
 */
export type PortSpot = 'quai' | PortSubject | 'succes' | 'chantier';

/** Le nœud du chemin d'un endroit du Port. */
export const portNode = (spot: PortSpot): string => `port-${spot}`;

/**
 * Où Kéo se tient au quai, dans le repère du Port : au pied de la place, côté est, pour que la galerie entre dans le
 * champ du départ, le Phare au fond, au bout de la digue.
 */
export const PORT_QUAY_SPOT: readonly [number, number] = [1.5, 4];

/** Les nœuds du Port, dans son repère : le quai, le pied de la place, puis devant chaque façade, à trois unités d'elle. */
const PORT_NODES: readonly { id: string; at: readonly [number, number] }[] = [
  { id: portNode('quai'), at: PORT_QUAY_SPOT },
  { id: 'port-place', at: [0, 9.5] },
  { id: portNode('succes'), at: [13, 9.5] },
  { id: portNode('french'), at: [19.3, 9.5] },
  { id: portNode('maths'), at: [22.5, 9.5] },
  { id: portNode('english'), at: [25.7, 9.5] },
  { id: portNode('chantier'), at: [34, 9.5] },
];

/** Les nœuds : les portes des lieux, les coudes des sentiers, la digue et le ponton, puis l'Escale. */
export const PATH_NODES: readonly PathNode[] = [
  ...PLACE_SPECS.map(doorNode),
  node('digue', [945, 664]),
  node('ponton', [1008, 704]),
  node('est-1', [1152, 730]),
  node('est-2', [1196, 625]),
  node('est-3', [1194, 525]),
  node('est-4', [1150, 452]),
  node('nord-1', [1092, 402]),
  node('nord-2', [1062, 330]),
  node('crete', [1128, 300]),
  // Vers les Marais salants (lot L5) : des Écluses, une passerelle sur la rivière juste sous le bassin d'aval, puis la
  // terre de l'est, le long de la côte, jusqu'à la grève, où le chemin arrive par l'ouest, à côté des bassins (le tracé
  // des liaisons viendra plus tard).
  node('sel-1', [1213, 428]),
  node('sel-2', [1246, 434]),
  node('sel-3', [1300, 448]),
  node('sel-4', [1350, 480]),
  node('sel-5', [1392, 528]),
  node('sel-6', [1418, 592]),
  ...PORT_NODES.map(({ id, at }) => ({ id, at: PORT.toWorld(at[0], at[1]) })),
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
  ['ecluses', 'sel-1'],
  ['sel-1', 'sel-2'],
  ['sel-2', 'sel-3'],
  ['sel-3', 'sel-4'],
  ['sel-4', 'sel-5'],
  ['sel-5', 'sel-6'],
  ['sel-6', 'saltworks'],
  // L'Escale : la digue du Phare jusqu'au quai, puis la place, le long des façades.
  ['phare', portNode('quai')],
  [portNode('quai'), 'port-place'],
  ['port-place', portNode('succes')],
  [portNode('succes'), portNode('french')],
  [portNode('french'), portNode('maths')],
  [portNode('maths'), portNode('english')],
  [portNode('english'), portNode('chantier')],
];

/**
 * Le terrain : l'étendue de la carte de hauteurs (le plan de 362 à 1 496 pixels d'ouest en est, de 86 à 1 024 du nord
 * au sud), le pas de sa grille, et ses tuiles carrées de `tileCells` cases de côté. Les tuiles ont deux niveaux de
 * détail : de près, chaque case ; de loin, une case sur `coarse` en chaque sens (`tileCells` en est un multiple).
 */
export const TERRAIN = (() => {
  const step = 1.25;
  const tileCells = 24;
  const tile = step * tileCells;
  const min = fromPlan([362, 86]);
  const max = fromPlan([1496, 1024]);
  const tilesX = Math.ceil((max.x - min.x) / tile);
  const tilesZ = Math.ceil((max.z - min.z) / tile);
  return { minX: min.x, minZ: min.z, step, tileCells, coarse: 3, tilesX, tilesZ } as const;
})();

/** La hauteur du dessus de la digue et des pontons, au-dessus de l'eau (0). */
export const DECK_HEIGHT = 0.45;
