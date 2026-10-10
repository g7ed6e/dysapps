// Les carrés des Gardiens (GD-11), figés par GD-12 (« Une forme par île », décision du mainteneur du 8 octobre 2026) :
// chaque île garde le carré de 5 × 5 cases que la recherche de GD-11 (`guardianSpot`, ./terrain/creatures.ts) lui a
// donné, en cases depuis l'origine de son cœur, le lieu pas tourné, avec le palier qui l'a donné. Une île qui prend une
// forme garde ce carré (la recherche, sur sa nouvelle côte, en trouverait un autre) ; sa forme le tient toujours sur sa
// terre (./map.ts). Pour les îles sans forme, la recherche le retrouve : terrain.test.ts compare les 52 carrés à cette
// table. Trois carrés ont bougé avec la cinquième mission (GD-14, 9 octobre 2026) : le Hangar des inventions, le Manoir
// du passé et le Belvédère de Thalès, dont une borne de plus touchait le carré. Le Manoir du passé a ensuite pris sa forme
// (GD-12, 5e) : en (0, 14), l'étiquette de l'île se posait sur la tête du Gardien et le toit du manoir bâti lui couvrait le
// pied (81 % vu, DA, 9 octobre 2026) ; la recherche refaite sur sa terre nouvelle lui donne (15, 15), où il se voit entier
// dans les deux univers. Données pures, sans import.
import type { BiomeId } from '../biomes';

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
  'french-6e-phonology': { x: 16, y: 19, palier: 3 },
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
  'life-earth-sciences-6e-living-world': { x: -1, y: 13, palier: 3 },
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
