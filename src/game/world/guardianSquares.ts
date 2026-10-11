// Les carrés des Gardiens (GD-11), figés par GD-12 (« Une forme par île », décision du mainteneur du 8 octobre 2026) :
// chaque île garde le carré de 5 × 5 cases que la recherche de GD-11 (`guardianSpot`, ./terrain/creatures.ts) lui a
// donné, en cases depuis l'origine de son cœur, le lieu pas tourné, avec le palier qui l'a donné. Une île qui prend une
// forme garde ce carré (la recherche, sur sa nouvelle côte, en trouverait un autre) ; sa forme le tient toujours sur sa
// terre (./map.ts). Pour les îles sans forme, la recherche le retrouve : terrain.test.ts compare les 52 carrés à cette
// table. Trois carrés ont bougé avec la cinquième mission (GD-14, 9 octobre 2026) : le Hangar des inventions, le Manoir
// du passé et le Belvédère de Thalès, dont une borne de plus touchait le carré. Le Manoir du passé a ensuite pris sa forme
// (GD-12, 5e) : en (0, 14), l'étiquette de l'île se posait sur la tête du Gardien et le toit du manoir bâti lui couvrait le
// pied (81 % vu, DA, 9 octobre 2026) ; la recherche refaite sur sa terre nouvelle lui donne (15, 15), où il se voit entier
// dans les deux univers. Deux carrés du 6e ont bougé avec les proportions du 6e (GD-16, 11 octobre 2026) : la Forêt des
// sons, dont le Grand Chêne sortait de la vue de l'île en (16, 19), passe en (-6, 4), où il tient entier dans le cadre
// et se voit entier ; la Vallée du vivant, dont l'étiquette de l'île cachait le Cerf en (-1, 13) (86 % vu), passe en
// (14, 3), où il se voit entier, au palier 1. Données pures ; seul import, l'archipel d'une île (`fillsGuardianSquare`).
import type { BiomeId } from '../biomes';
import { archipelagoOfIsland } from './archipelagos';

/** Le côté du carré d'un Gardien, en cases (`GUARDIAN_SQUARE`, ./terrain/creatures.ts). */
export const GUARDIAN_SQUARE_SIDE = 5;

/** Un carré de Gardien figé : son coin (en cases depuis l'origine du cœur), le palier de la recherche qui l'a donné. */
export interface GuardianSquare {
  x: number;
  y: number;
  palier: 1 | 2 | 3;
  repli?: true;
}

/** Les 58 carrés des Gardiens de GD-11, la LV2 par défaut. */
export const GD11_GUARDIAN_SQUARES: Readonly<Partial<Record<BiomeId, Readonly<GuardianSquare>>>> = {
  'french-6e-phonology': { x: -6, y: 4, palier: 3 },
  'french-6e-grammar-spelling': { x: 17, y: 11, palier: 3 },
  'french-6e-letter-confusion': { x: 14, y: 3, palier: 3 },
  'french-6e-reading': { x: 16, y: 13, palier: 3 },
  'french-6e-word-spelling': { x: 14, y: 4, palier: 1 },
  'maths-6e-calculation': { x: -6, y: 3, palier: 3 },
  'maths-6e-fractions': { x: 14, y: 3, palier: 1 },
  'maths-6e-decimals': { x: -3, y: 14, palier: 1 },
  'english-6e-vocabulary': { x: -4, y: 15, palier: 3 },
  'english-6e-grammar': { x: -3, y: 14, palier: 3 },
  'history-6e-antiquity': { x: 2, y: 15, palier: 3 },
  'geography-6e-living': { x: -2, y: 13, palier: 3 },
  'life-earth-sciences-6e-living-world': { x: 14, y: 3, palier: 1 },
  'physics-chemistry-6e-matter-energy': { x: -2, y: 13, palier: 1 },
  'technology-6e-objects': { x: 15, y: 13, palier: 1 },
  'civics-6e-democratic-society': { x: 13, y: -1, palier: 1 },
  'maths-5e-signed-numbers': { x: -3, y: 14, palier: 3 },
  'maths-5e-proportionality': { x: 17, y: 18, palier: 3 },
  'french-5e-homophones': { x: -2, y: 14, palier: 1 },
  'french-5e-conjugation': { x: 15, y: 15, palier: 3 },
  'english-5e-vocabulary': { x: 16, y: 15, palier: 3 },
  'english-5e-grammar': { x: 15, y: 15, palier: 3 },
  'lv2-5e-introductions': { x: 14, y: 3, palier: 1 },
  'history-5e-middle-ages': { x: -2, y: 13, palier: 3 },
  'geography-5e-resources': { x: -2, y: 14, palier: 3 },
  'life-earth-sciences-5e-active-planet': { x: 1, y: 13, palier: 3 },
  'physics-chemistry-5e-matter-universe': { x: -2, y: 13, palier: 1 },
  'technology-5e-design': { x: -2, y: 13, palier: 3 },
  'civics-5e-equality-solidarity': { x: 13, y: -2, palier: 1 },
  'lca-5e-legends': { x: 14, y: -2, palier: 1 },
  'civics-4e-rights-freedoms': { x: 14, y: 0, palier: 3 },
  'lca-4e-cities': { x: -4, y: 15, palier: 1 },
  'maths-4e-powers': { x: 15, y: 10, palier: 1 },
  'maths-4e-algebra': { x: 16, y: 17, palier: 3 },
  'french-4e-agreement': { x: 0, y: 14, palier: 3 },
  'french-4e-vocabulary': { x: -2, y: 13, palier: 1 },
  'english-4e-comprehension': { x: 14, y: 2, palier: 3 },
  'lv2-4e-daily-life': { x: 16, y: 4, palier: 3 },
  'english-4e-grammar': { x: -3, y: 15, palier: 3 },
  'history-4e-revolutions': { x: 13, y: -2, palier: 1 },
  'geography-4e-globalization': { x: 13, y: 0, palier: 1 },
  'life-earth-sciences-4e-cells-evolution': { x: 13, y: -2, palier: 1 },
  'physics-chemistry-4e-signals-circuits': { x: -4, y: 5, palier: 3 },
  'technology-4e-modeling': { x: -2, y: 13, palier: 3 },
  'maths-3e-geometry': { x: -3, y: 3, palier: 3 },
  'maths-3e-functions': { x: -5, y: 14, palier: 3 },
  'maths-3e-statistics': { x: 14, y: 3, palier: 1 },
  'french-3e-close-reading': { x: 13, y: 16, palier: 1 },
  'english-3e-comprehension': { x: -3, y: 13, palier: 1 },
  'english-3e-grammar': { x: 14, y: 4, palier: 1 },
  'lv2-3e-travel': { x: -4, y: 15, palier: 3 },
  'history-3e-twentieth-century': { x: 12, y: -1, palier: 1 },
  'geography-3e-france': { x: -2, y: 13, palier: 1 },
  'life-earth-sciences-3e-human-body': { x: 12, y: -2, palier: 1 },
  'physics-chemistry-3e-motion-energy': { x: -2, y: 13, palier: 3 },
  'technology-3e-digital': { x: -2, y: 13, palier: 1 },
  'civics-3e-democratic-life': { x: 13, y: -2, palier: 1 },
  'lca-3e-ideas': { x: 12, y: 17, palier: 1 },
};

/**
 * La case (relative à l'origine du cœur, le lieu pas tourné) est-elle sur le carré figé du Gardien d'une île qui a pris
 * sa forme (`forme` : la sienne) ? Sur ces îles, ce qui se calculait autour du Gardien (les arrivées des liaisons) se
 * calcule désormais autour de son carré figé.
 */
export function onFixedGuardianSquare(id: BiomeId, hasShape: boolean, x: number, y: number): boolean {
  const g = hasShape ? GD11_GUARDIAN_SQUARES[id] : undefined;
  return !!g && x >= g.x && y >= g.y && x < g.x + GUARDIAN_SQUARE_SIDE && y < g.y + GUARDIAN_SQUARE_SIDE;
}

/**
 * Les Gardiens d'Archipéo plus hauts dans le monde que la sentinelle commune (5,2 cases, socle compris), en cases, socle
 * compris : le Grand Chêne est le plus grand arbre de son île et de son archipel (demande du mainteneur, 10 octobre 2026),
 * une case au moins au-dessus des arbres ordinaires du 6e (directeur artistique). Sa large couronne tient alors sur les
 * cinq cases de son carré. Dans Blocland, il fait déjà 6,5 blocs (13 couches à l'échelle 0,5), contre 5 au plus pour un
 * arbre. Données pures, lues par la grille, le dessin des Gardiens et le décor.
 */
export const GUARDIAN_WORLD_HEIGHTS: Readonly<Partial<Record<BiomeId, number>>> = { 'french-6e-phonology': 6 };

/**
 * Les Gardiens qui restent couchés, plus bas que les arbres de leur île : aucun arbre de plus de trois blocs ne pousse à
 * deux cases ou moins de leur carré, il y devient un buisson (piste B2 du directeur artistique, retenue par le
 * mainteneur le 11 octobre 2026, GD-16). Le Hanneton de bronze : un scarabée est plat ; le dresser changerait son
 * caractère.
 */
export const LYING_GUARDIANS: ReadonlySet<BiomeId> = new Set<BiomeId>(['maths-6e-calculation']);

/** La hauteur, en blocs, au-delà de laquelle un arbre ne pousse pas près d'un Gardien couché (`LYING_GUARDIANS`). */
export const TREE_HEIGHT_BESIDE_A_LYING_GUARDIAN = 3;

/** La distance, en cases, du carré d'un Gardien couché où un arbre trop haut devient un buisson. */
export const TREE_CLEARANCE_OF_A_LYING_GUARDIAN = 2;

/** Le plus haut d'un arbre ordinaire du 6e dans Archipéo, au-dessus du sol : une case sous le Grand Chêne. */
export const TALLEST_TREE_6E = (GUARDIAN_WORLD_HEIGHTS['french-6e-phonology'] ?? 0) - 1;

/**
 * Le Gardien d'Archipéo de cette île prend-il toute la place de son carré (proposition 4 du rapport sur les proportions
 * du 6e, retenue par le mainteneur le 11 octobre 2026) ? Les quatre rangées du fond, son bloc d'or sur la rangée de
 * devant, jusqu'à la hauteur de la sentinelle commune : un Gardien large et bas (couché, à quatre
 * pattes, à large couronne) n'y perd plus de hauteur. Le 6e seulement, pour l'instant.
 */
export const fillsGuardianSquare = (id: BiomeId): boolean => archipelagoOfIsland(id) === '6e';

/**
 * Ce que prend, au plus, un Gardien qui remplit son carré (`fillsGuardianSquare`), en cases, autour du milieu de sa
 * place : sa demi-largeur et sa demi-profondeur, les quatre rangées du fond dans les deux sens. La statue ne tourne
 * pas avec son lieu (GD-9) : ainsi elle tient sur son carré et laisse libre son bloc d'or quelle que soit son
 * orientation, et garde la même taille.
 */
const GUARDIAN_SQUARE_ROOM = { half: (GUARDIAN_SQUARE_SIDE - 1) / 2 } as const;

/**
 * Les Gardiens longs et bas qui prennent tout leur carré, de l'avant au fond, leur bloc d'or posé à côté du carré, sur
 * la case voisine de sa rangée de devant (piste D1 du directeur artistique, retenue par le mainteneur le 11 octobre 2026,
 * GD-16) : le Taureau de terre, le Lion de pierre et le Castor de glaise, que les quatre rangées du fond laissaient sous
 * les arbres de leur île dans Archipéo. La case, relative au coin du carré (le lieu pas tourné), du côté où le sol est
 * libre (terrain.test.ts le vérifie). Le bloc d'or étant un cube du monde, les deux univers le posent là.
 */
export const GUARDIAN_GOLD_BESIDE: Readonly<Partial<Record<BiomeId, { x: number; y: number }>>> = {
  'french-6e-grammar-spelling': { x: -1, y: 0 },
  'english-6e-vocabulary': { x: GUARDIAN_SQUARE_SIDE, y: 0 },
  'geography-6e-living': { x: -1, y: 0 },
};

/**
 * La place d'un Gardien qui remplit son carré (`GUARDIAN_SQUARE_ROOM`) ; tout le carré, la même dans les deux sens,
 * pour un Gardien dont le bloc d'or est à côté (`GUARDIAN_GOLD_BESIDE`).
 */
export function guardianSquareRoom(id: BiomeId): { half: number } {
  return GUARDIAN_GOLD_BESIDE[id] ? { half: GUARDIAN_SQUARE_SIDE / 2 } : GUARDIAN_SQUARE_ROOM;
}
