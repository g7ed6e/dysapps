// Le plan du 5e en données (GD-22, lot 2, « toute l'île en grandes masses », ordre des lots choisi par le mainteneur le
// 18 octobre 2026, planche de rendu validée le 19 octobre 2026) : les Hautes Brumes, une seule île à deux étages. En bas,
// la forêt de racines au sud et à l'est, coupée de chenaux d'eau sombre, profonds, sans gué ; au nord, un plateau de
// pierre bordé de vraies falaises, hérissé d'aiguilles de basalte ; au centre, la Montée, la plus haute aiguille, dont la
// cabine est la seule voie du bas au plateau. Relevé sur le plan des lieux validé (archipeo/univers-challenge/niveaux/
// 5e/plan-5e.png, dans la Bibliothèque du projet) et la fiche du niveau (§ 4 et § 5) : les quatorze lieux, les quatre
// terres et leurs passages, le réseau des chemins. Les points sont écrits en pixels du plan (1 800 × 1 250), pour se relire
// contre l'image, et convertis en unités du monde (`fromPlan5e`). Les deux étages se font avec la hauteur du terrain
// seule (./terrain5e.ts), jamais un sol posé au-dessus d'un autre. Les noms sont ceux choisis par le mainteneur le
// 19 octobre 2026 (les terres, la Lisière, les Instants, le Gaillard). Code pur.
import type { Vec2 } from './geometry';
import type { Land } from './lands';
import type { PathNode } from './network';
import type { OpenPlace } from './plan6e';

/** Pixels du plan par unité du monde : l'île fait environ 430 unités d'est en ouest. */
const PLAN_SCALE = 3.2;
/** Le point du plan qui est l'origine du monde : le pied de la Montée, au centre de l'île. */
const PLAN_ORIGIN = { x: 900, y: 580 };

/** Un point du plan du 5e (en pixels de l'image) en unités du monde. */
const fromPlan5e = ([px, py]: readonly [number, number]): Vec2 => ({ x: (px - PLAN_ORIGIN.x) / PLAN_SCALE, z: (py - PLAN_ORIGIN.y) / PLAN_SCALE });


const poly = (points: readonly (readonly [number, number])[]): Vec2[] => points.map(fromPlan5e);

/**
 * Les couleurs du 5e (fiche du niveau, § 2 ; planche de rendu de près validée) : l'eau des racines, calme et sombre
 * (#1E5452, jamais plus sombre : le mainteneur refuse le presque-noir) ; la pierre des aiguilles, un gris chaud moussu
 * (#8E938B) ; la lanterne d'ocre ; le sol de la forêt en mousses et en olives, l'ocre des Contreforts. L'ocre et le gris
 * dominent, le vert reste discret.
 */
export const COLORS_5E = {
  /** L'eau des racines, au cœur des chenaux. */
  water: 0x1e5452,
  /** L'eau près des rives, un cran plus claire. */
  waterShallow: 0x2b6a62,
  /** Le large, autour de l'île. */
  sea: 0x24605c,
  /** La vase des rives, au ras de l'eau : un gris d'olive éteint. */
  mud: 0x6c6d58,
  /**
   * Le sol de la forêt, en bas, sous la canopée (retouche du lot 2, directeur artistique : « le vert est trop jaune ») :
   * une mousse sombre tirée vers le bleu-vert, discrète.
   */
  moss: 0x4f6a5a,
  /** Les flancs au soleil, en bas. */
  mossSun: 0x637a62,
  /** Les flancs à l'ombre, en bas (jamais presque noirs). */
  mossShade: 0x465f52,
  /** L'ocre des Contreforts, au pied des aiguilles. */
  ochre: 0xb39a64,
  /** La pierre des aiguilles, du plateau et des falaises : le gris chaud moussu de la fiche (§ 2). */
  stone: 0x8e938b,
  /** La pierre à l'ombre : un aplat plus sombre, jamais presque noir. */
  stoneShade: 0x777d77,
  /** La pierre claire, au soleil bas. */
  stoneSun: 0xaeb0a3,
  /** La mousse sur la pierre du plateau, grise, en taches. */
  plateauMoss: 0x7c8a6c,
  /** La lanterne d'ocre, le bronze rallumé. */
  lantern: 0xe0a84a,
  /** Les planches du ponton de la Lisière, et leur ombre. */
  plank: 0x9b7c58,
  plankShade: 0x7b6549,
} as const;

/** Le bord de l'île (la vase comprise), dans le sens des aiguilles d'une montre depuis le nord-ouest. */
export const COAST_5E = poly([
  [400, 118], [700, 84], [1000, 95], [1310, 135], [1525, 245], [1605, 445], [1625, 650], [1595, 850],
  [1525, 1005], [1400, 1068], [1100, 1078], [800, 1068], [550, 1040], [405, 948], [295, 800], [230, 580],
  [258, 380], [325, 245],
]);

/**
 * Le plateau du nord (le haut) : son bord sud est le pied de la falaise, d'ouest en est ; au nord, il dépasse la côte (la
 * falaise tombe dans la mer : aucune grève ne fait le tour du plateau par le bas). Il avance vers la Montée, qui se dresse
 * à son pied.
 */
export const PLATEAU_5E = poly([
  [150, 405], [250, 400], [480, 430], [620, 445], [780, 470], [860, 500], [950, 495], [1050, 470], [1250, 460],
  [1420, 430], [1580, 420], [1720, 415], [1720, -20], [150, -20],
]);

/** La hauteur du plateau au-dessus de l'eau, et la largeur de sa falaise (de son pied à son rebord). */
export const PLATEAU = { height: 13, cliff: 4 } as const;

/**
 * Les chenaux de la forêt (fiche, § 5 : « des chenaux profonds dans la Forêt, sans gué ») : une ligne et sa demi-largeur
 * (en unités). Le chenal de l'ouest, du pied de la falaise à la mer du sud, sépare les Contreforts ; le grand chenal, de
 * lui jusqu'à la mer du sud-est, passe au sud de la Montée, longe les Radeaux (leurs plateformes sont sur son eau) et
 * sépare les Roselières. Chacun n'a qu'un passage, le pont de sa terre. Retouche du lot 2 (directeur artistique : « l'eau
 * des chenaux ne se voit pas en 3D ») : un peu plus larges, la forêt tenue hors de l'eau (./terrain5e.ts). L'anse de la
 * Lisière, au nord du débarcadère : une baie courte ouverte sur la mer de l'est, où avance le ponton ; elle ne sépare
 * aucune terre.
 */
export const CHANNELS_5E = {
  ouest: { line: poly([[632, 418], [625, 520], [612, 620], [600, 700], [585, 830], [560, 950], [545, 1070]]), halfWidth: 6.5 },
  grand: { line: poly([[605, 698], [760, 700], [900, 695], [1000, 694], [1090, 716], [1150, 728], [1205, 745], [1240, 805], [1262, 920], [1245, 1010], [1230, 1100]]), halfWidth: 7 },
  anse: { line: poly([[1660, 850], [1590, 862], [1556, 880]]), halfWidth: 5.5 },
} as const satisfies Record<string, { line: readonly Vec2[]; halfWidth: number }>;

/** Un chenal, par son nom. */
export type ChannelId = keyof typeof CHANNELS_5E;

/**
 * Une aiguille de basalte (le décor du plateau, et quelques chicots au pied des aiguilles) : son pied, son rayon, sa
 * hauteur au-dessus du sol, son nombre de pans et l'angle du premier.
 */
export interface Needle {
  at: Vec2;
  radius: number;
  height: number;
  sides: number;
  turn: number;
}

const needle = (p: [number, number], radius: number, height: number, sides: number, turn: number): Needle => ({ at: fromPlan5e(p), radius, height, sides, turn });

/**
 * Les aiguilles du plateau (fiche, § 5 : « les aiguilles en sont les piliers »), loin des chemins et des lieux (un test le
 * vérifie) : une seule famille, effilée et facettée (retouche du lot 2, directeur artistique : les chicots trapus des
 * Contreforts sont retirés), toutes plus hautes que la tour du Donjon. La Montée, la plus haute, est un lieu
 * (./ruins5e.ts) ; toutes se dessinent par `spire` (./spire5e.ts).
 */
export const NEEDLES_5E: readonly Needle[] = [
  needle([560, 190], 5, 34, 6, 0.3),
  needle([905, 170], 6, 36, 7, 1.1),
  needle([1190, 222], 5, 33, 6, 0.7),
  needle([1440, 250], 4.5, 31, 5, 0.2),
  needle([690, 380], 4, 28, 6, 1.4),
  needle([1110, 420], 4, 27, 5, 0.9),
  needle([1450, 380], 4, 29, 6, 0.5),
  needle([480, 330], 4.5, 32, 6, 1.9),
  needle([330, 330], 4, 27, 5, 1.2),
  needle([760, 120], 4, 33, 6, 0.1),
];

/** Les lieux du 5e : leurs identifiants restent neutres, leurs noms sont ceux de la fiche (§ 4). */
export type PlaceId5e =
  | 'montee'
  | 'radeaux'
  | 'croisee'
  | 'instants'
  | 'semaphore'
  | 'gaillard'
  | 'donjon'
  | 'terrasses'
  | 'fumerolles'
  | 'etuve'
  | 'nacelles'
  | 'hameau'
  | 'auberge'
  | 'oracle';

/** Un lieu : son centre sur le plan (en pixels), et sa porte depuis lui (en unités). */
interface PlaceSpec extends Omit<OpenPlace<PlaceId5e>, 'center' | 'door' | 'scenes' | 'yaw' | 'touchRadius'> {
  plan: [number, number];
  door: Vec2;
}

/**
 * Les quatorze lieux (fiche, § 4 : la colonne « Île actuelle » donne l'île qu'ils remplacent), à leur place sur le plan
 * et à leur étage : le bas (la Forêt, les Contreforts) ou le plateau (les Aiguilles). Les Radeaux, validés en (1 175,
 * 700) par le directeur artistique, sont au bord du grand chenal, leurs plateformes sur son eau ; leur porte est au
 * nord-est, sur la terre. Aucune mission ne se joue encore en
 * scénette : toutes passent par l'écran habituel, depuis le panneau du lieu.
 */
const PLACE_SPECS: readonly PlaceSpec[] = [
  { id: 'montee', name: 'La Montée', at: 'à la Montée', agree: 'fs', island: 'maths-5e-signed-numbers', plan: [900, 585], door: { x: 0, z: 11 } },
  { id: 'radeaux', name: 'Les Radeaux', at: 'aux Radeaux', agree: 'mp', island: 'maths-5e-proportionality', plan: [1175, 700], door: { x: 5, z: -4 } },
  { id: 'croisee', name: 'La Croisée', at: 'à la Croisée', agree: 'fs', island: 'french-5e-homophones', plan: [1000, 840], door: { x: 0, z: 7.5 } },
  { id: 'instants', name: 'Les Instants', at: 'aux Instants', agree: 'mp', island: 'french-5e-conjugation', plan: [770, 800], door: { x: 3, z: 7.5 } },
  { id: 'semaphore', name: 'Le Sémaphore', at: 'au Sémaphore', agree: 'ms', island: 'english-5e-vocabulary', plan: [420, 240], door: { x: 2, z: 8 } },
  { id: 'gaillard', name: 'Le Gaillard', at: 'au Gaillard', agree: 'ms', island: 'english-5e-grammar', plan: [1340, 300], door: { x: -3, z: 8 } },
  { id: 'donjon', name: 'Le Donjon', at: 'au Donjon', agree: 'ms', island: 'history-5e-middle-ages', plan: [760, 212], door: { x: 0, z: 8 } },
  { id: 'terrasses', name: 'Les Terrasses', at: 'aux Terrasses', agree: 'fp', island: 'geography-5e-resources', plan: [400, 770], door: { x: 3, z: 7 } },
  { id: 'fumerolles', name: 'Les Fumerolles', at: 'aux Fumerolles', agree: 'fp', island: 'life-earth-sciences-5e-active-planet', plan: [400, 520], door: { x: 2, z: 7 } },
  { id: 'etuve', name: 'L’Étuve', at: 'à l’Étuve', agree: 'fs', island: 'physics-chemistry-5e-matter-universe', plan: [540, 665], door: { x: 0, z: 7 } },
  { id: 'nacelles', name: 'Les Nacelles', at: 'aux Nacelles', agree: 'fp', island: 'technology-5e-design', plan: [1060, 205], door: { x: 0, z: 8 } },
  { id: 'hameau', name: 'Le Hameau', at: 'au Hameau', agree: 'ms', island: 'civics-5e-equality-solidarity', plan: [1290, 880], door: { x: 0, z: 8 } },
  { id: 'auberge', name: 'L’Auberge', at: 'à l’Auberge', agree: 'fs', island: 'lv2-5e-introductions', plan: [1450, 985], door: { x: 0, z: 7.5 } },
  { id: 'oracle', name: 'L’Oracle', at: 'à l’Oracle', agree: 'ms', island: 'lca-5e-legends', plan: [760, 340], door: { x: 3, z: 7 } },
];

/** Le rayon de toucher d'un lieu du 5e : large, rien de précis à viser. */
const TOUCH_RADIUS = 7;

export const PLACES_5E: readonly OpenPlace<PlaceId5e>[] = PLACE_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  at: s.at,
  agree: s.agree,
  island: s.island,
  scenes: [],
  center: fromPlan5e(s.plan),
  yaw: 0,
  door: s.id,
  touchRadius: TOUCH_RADIUS,
}));

/** Les lieux du plateau, le haut (la terre des Aiguilles) : la Carte met un triangle « en haut » à côté de leur nom. */
export const UPPER_PLACES_5E: readonly PlaceId5e[] = ['semaphore', 'gaillard', 'donjon', 'nacelles', 'oracle'];

/**
 * Le lieu de départ du 5e, au sud-est (fiche, § 5) : le débarcadère de la Lisière, près du Hameau, au fond de l'anse.
 * Ce lot n'en pose que le quai, où Kéo arrive (le nœud du quai a le nom de celui de l'Escale, `port-quai`, que la page
 * connaît), et le ponton ; l'école, la galerie, l'Entrepôt et la Nef viennent avec leur lot.
 */
export const DEPARTURE_5E = { name: 'La Lisière', node: 'port-quai', at: fromPlan5e([1548, 915]) } as const;

/**
 * Le ponton de la Lisière (retouche du lot 2, consultant d'Archipéo : « le quai ne se voit pas ») : des planches sur
 * pieux, du quai vers le cœur de l'anse, au nord, devant Kéo et la caméra au départ ; deux lanternes d'ocre à son bout.
 * `from` : son pied, sur la rive ; `to` : son bout, sur l'eau ; `width` : sa largeur ; `deck` : la hauteur de ses planches
 * au-dessus de l'eau. Un décor : on n'y marche pas.
 */
export const QUAY_5E = { from: fromPlan5e([1549, 908]), to: fromPlan5e([1574, 862]), width: 2.6, deck: 0.7 } as const;

const node = (id: string, p: [number, number]): PathNode => ({ id, at: fromPlan5e(p) });

/** La porte d'un lieu : à son décalage de son centre, en unités. */
const doorNode = (s: PlaceSpec): PathNode => {
  const c = fromPlan5e(s.plan);
  return { id: s.id, at: { x: c.x + s.door.x, z: c.z + s.door.z } };
};

/**
 * Les nœuds : les portes des lieux, puis les coudes des chemins, terre par terre. Les Frondaisons : du quai de la Lisière
 * au Hameau et à l'Auberge, puis au nord vers les Radeaux, et à l'ouest vers la Montée, le pied de la cabine, le pont des
 * Roselières et celui des Contreforts. Le plateau : du haut de la cabine vers les cinq lieux des Aiguilles.
 */
export const PATH_NODES_5E: readonly PathNode[] = [
  ...PLACE_SPECS.map(doorNode),
  node(DEPARTURE_5E.node, [1548, 915]),
  node('lis-1', [1470, 905]),
  node('fro-1', [1385, 890]),
  node('aub-1', [1400, 1000]),
  node('fro-2', [1360, 790]),
  node('fro-3', [1250, 660]),
  node('fro-4', [1060, 630]),
  node('mon-1', [960, 625]),
  node('mon-2', [800, 600]),
  node('cab-bas', [938, 560]),
  node('cab-haut', [938, 455]),
  node('ros-1', [1078, 680]),
  node('ros-2', [1102, 792]),
  node('ros-3', [1060, 880]),
  node('ros-4', [880, 900]),
  node('con-1', [715, 575]),
  node('con-2', [530, 560]),
  node('con-3', [460, 590]),
  node('con-4', [480, 690]),
  node('aig-1', [900, 400]),
  node('aig-2', [840, 330]),
  node('aig-3', [620, 300]),
  node('aig-4', [1030, 360]),
  node('aig-5', [1210, 370]),
];

/** Les liaisons : sentiers, le pont de chaque terre et la cabine de la Montée. */
export const PATH_EDGES_5E: readonly (readonly [string, string])[] = [
  // Les Frondaisons.
  [DEPARTURE_5E.node, 'lis-1'],
  ['lis-1', 'fro-1'],
  ['fro-1', 'hameau'],
  ['fro-1', 'aub-1'],
  ['aub-1', 'auberge'],
  ['fro-1', 'fro-2'],
  ['fro-2', 'fro-3'],
  ['fro-3', 'radeaux'],
  ['fro-3', 'fro-4'],
  ['fro-4', 'mon-1'],
  ['mon-1', 'montee'],
  ['mon-1', 'cab-bas'],
  ['montee', 'mon-2'],
  ['mon-2', 'con-1'],
  ['fro-4', 'ros-1'],
  // Le pont des Roselières, sur le grand chenal, puis les Roselières.
  ['ros-1', 'ros-2'],
  ['ros-2', 'ros-3'],
  ['ros-3', 'croisee'],
  ['ros-3', 'ros-4'],
  ['ros-4', 'instants'],
  // Le pont des Contreforts, sur le chenal de l'ouest, puis les Contreforts.
  ['con-1', 'con-2'],
  ['con-2', 'con-3'],
  ['con-3', 'fumerolles'],
  ['con-3', 'con-4'],
  ['con-4', 'etuve'],
  ['con-4', 'terrasses'],
  // La cabine de la Montée, du pied de la falaise au plateau, puis les Aiguilles.
  ['cab-bas', 'cab-haut'],
  ['cab-haut', 'aig-1'],
  ['aig-1', 'aig-2'],
  ['aig-2', 'oracle'],
  ['aig-2', 'donjon'],
  ['aig-2', 'aig-3'],
  ['aig-3', 'semaphore'],
  ['aig-1', 'aig-4'],
  ['aig-4', 'nacelles'],
  ['aig-4', 'aig-5'],
  ['aig-5', 'gaillard'],
];

/**
 * Le passage de chaque terre qu'on relie : la liaison du réseau qui le franchit, de la terre d'avant à elle ; sa sorte (un
 * pont sur un chenal, ou la cabine de la Montée) et, pour un pont, son chenal.
 */
export const LINKS_5E = {
  roselieres: { bridge: ['ros-1', 'ros-2'], kind: 'pont', channel: 'grand' },
  contreforts: { bridge: ['con-1', 'con-2'], kind: 'pont', channel: 'ouest' },
  aiguilles: { bridge: ['cab-bas', 'cab-haut'], kind: 'cabine', channel: null },
} as const satisfies Record<string, { bridge: readonly [string, string]; kind: 'pont' | 'cabine'; channel: ChannelId | null }>;

/**
 * Les quatre terres du 5e (fiche, § 5, noms validés par le mainteneur le 19 octobre 2026), dans l'ordre : les Frondaisons,
 * le départ, puis les trois qu'on relie depuis elles (l'ordre entre elles reste à décider, fiche § 7, question 7 : aucune
 * n'attend l'autre).
 */
export const LANDS_5E: readonly Land[] = [
  { id: 'frondaisons', name: 'Les Frondaisons', places: ['montee', 'hameau', 'radeaux', 'auberge'], after: null, bridgeName: null },
  { id: 'roselieres', name: 'Les Roselières', places: ['croisee', 'instants'], after: 'frondaisons', bridgeName: 'Le pont des Roselières' },
  { id: 'contreforts', name: 'Les Contreforts', places: ['fumerolles', 'etuve', 'terrasses'], after: 'frondaisons', bridgeName: 'Le pont des Contreforts' },
  { id: 'aiguilles', name: 'Les Aiguilles', places: ['donjon', 'oracle', 'semaphore', 'nacelles', 'gaillard'], after: 'frondaisons', bridgeName: 'La cabine de la Montée' },
];

/**
 * Le terrain : l'étendue de la carte de hauteurs (le plan de 200 à 1 660 pixels d'ouest en est, de 40 à 1 110 du nord au
 * sud), le pas de sa grille et ses tuiles, comme au 6e.
 */
export const TERRAIN_5E = (() => {
  const step = 1.75;
  const tileCells = 18;
  const tile = step * tileCells;
  const min = fromPlan5e([200, 40]);
  const max = fromPlan5e([1660, 1110]);
  const tilesX = Math.ceil((max.x - min.x) / tile);
  const tilesZ = Math.ceil((max.z - min.z) / tile);
  return { minX: min.x, minZ: min.z, step, tileCells, coarse: 3, tilesX, tilesZ } as const;
})();
