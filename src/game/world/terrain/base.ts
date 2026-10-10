// Le socle des îles : leur place dans le monde, la hauteur du sol, les couches de terre et de roche dessous, la
// maison du bonhomme, les couleurs et textures du sol.
import { coeurDe, CORE, type Ground, islandDef, type IslandDef, type LandCell, toWorld } from '../map';
import { fadeRgb, hexToRgb } from '../../../core/color';
import { BASALT, CRYSTAL, GRASS, HAY, LAVA, LEAF, MOSS, PINE, SNOW, TRUNK, WATER } from '../decor';
import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { ARCHIPELAGOS } from '../archipelago';
import { ILES_A_PARVIS } from './parvis';

/** Côté du cœur d'origine d'une île (en blocs) : le repère des clés ; l'étendue du cœur d'une île est `coeurDe` (./map). */
export const ISLAND = CORE;

/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;

/** Couches de roche qui s'amincissent sous une île en altitude (elle flotte). */
const TAPER = 3;

/** Couleur délavée d'une île verrouillée (même calcul que la texture délavée en 3D). */
export function fade(color: string): string {
  let delavee = DELAVEES.get(color);
  if (delavee === undefined) {
    const [r, g, b] = fadeRgb(...hexToRgb(color)).map(Math.round);
    DELAVEES.set(color, (delavee = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`));
  }
  return delavee;
}

/** Les couleurs déjà délavées : une île fermée en demande des milliers, de quelques dizaines de couleurs. */
const DELAVEES = new Map<string, string>();

/** Textures 3D par couleur de décor (les couleurs servent aussi à la vue simple et aux îles verrouillées). */
export const TEXTURES: Record<string, string> = {
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
  [BLOCKS[BLOC.mosaique].side]: 'mosaique',
  [BLOCKS[BLOC.chaume].side]: 'chaume',
  [BLOCKS[BLOC.enluminure].side]: 'enluminure',
  [BLOCKS[BLOC.riziere].side]: 'riziere',
  [BLOCKS[BLOC.fonte].side]: 'fonte',
  [BLOCKS[BLOC.conteneur].side]: 'conteneur',
  [BLOCKS[BLOC.reliure].side]: 'reliure',
  [BLOCKS[BLOC.gres].side]: 'gres',
  [BLOCKS[BLOC.fossile].side]: 'fossile',
  [BLOCKS[BLOC.aimant].side]: 'aimant',
  [BLOCKS[BLOC.carton].side]: 'carton',
  [BLOCKS[BLOC.craie].side]: 'craie',
  [BLOCKS[BLOC.strate].side]: 'strate',
  [BLOCKS[BLOC.sel].side]: 'sel',
  [BLOCKS[BLOC.bambou].side]: 'bambou',
  [BLOCKS[BLOC.farine].side]: 'farine',
  [BLOCKS[BLOC.tuf].side]: 'tuf',
  [BLOCKS[BLOC.petale].side]: 'petale',
  [BLOCKS[BLOC.bobine].side]: 'bobine',
  [BLOCKS[BLOC.liege].side]: 'liege',
  [BLOCKS[BLOC.pave].side]: 'pave',
  [BLOCKS[BLOC.fresque].side]: 'fresque',
  [BLOCKS[BLOC.acajou].side]: 'acajou',
  [BLOCKS[BLOC.laurier].side]: 'laurier',
  [BLOCKS[BLOC.savon].side]: 'savon',
  [BLOCKS[BLOC.ressort].side]: 'ressort',
  [BLOCKS[BLOC.cire].side]: 'cire',
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
export const GROUND_COLOR: Record<Ground, string> = {
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

/**
 * Les îles entrées au jeu au milieu de la liste des îles (`BIOMES`) : les îles d'histoire-géographie (HG-2 en 6e, HG-3 de
 * la 5e à la 3e) et de sciences (SC-2 en 6e, SC-3 de la 5e à la 3e), rangées avant les îles de LV2. La forme du plateau d'une île se tire de son rang (`groundHeight`) ; compté sans elles, le
 * rang des îles d'avant ne bouge pas, ni leur relief.
 */
const VENUES_AU_MILIEU: readonly string[] = [
  'history-6e-antiquity',
  'geography-6e-living',
  // Les îles de sciences de 6e (SC-2).
  'life-earth-sciences-6e-living-world',
  'physics-chemistry-6e-matter-energy',
  'technology-6e-objects',
  // Les îles d'histoire-géographie de 5e à 3e (HG-3, DA, 6 octobre 2026).
  'history-5e-middle-ages',
  'geography-5e-resources',
  'history-4e-revolutions',
  'geography-4e-globalization',
  'history-3e-twentieth-century',
  'geography-3e-france',
  // Les îles de sciences de 5e à 3e (SC-3, DA, 6 octobre 2026).
  'life-earth-sciences-5e-active-planet',
  'physics-chemistry-5e-matter-universe',
  'technology-5e-design',
  'life-earth-sciences-4e-cells-evolution',
  'physics-chemistry-4e-signals-circuits',
  'technology-4e-modeling',
  'life-earth-sciences-3e-human-body',
  'physics-chemistry-3e-motion-energy',
  'technology-3e-digital',
];

/**
 * Les îles entrées au milieu de la liste après les précédentes (l'EMC, EMC-2 ; le latin-grec, LCA-2 ; de la 6e à la 3e) : elles ne
 * comptent dans le rang d'aucune île, pas même des îles venues au milieu (`VENUES_AU_MILIEU`), dont le relief ne bouge
 * pas non plus.
 */
const ENTREES_ENSUITE: readonly string[] = [
  'civics-6e-democratic-society',
  'civics-5e-equality-solidarity',
  'lca-5e-legends',
  'civics-4e-rights-freedoms',
  'lca-4e-cities',
  'civics-3e-democratic-life',
  'lca-3e-ideas',
];

let rangsDuDessin: readonly number[] | undefined;

/**
 * Le rang qui tire la forme du plateau d'une île : son rang dans `BIOMES`, sans les îles entrées ensuite avant elle
 * (`ENTREES_ENSUITE`), ni, pour les îles d'avant, sans les îles venues au milieu avant elle.
 */
const rangDuDessin = (index: number): number =>
  (rangsDuDessin ??= BIOMES.map((b, i) => {
    const avant = BIOMES.slice(0, i);
    const rang = i - avant.filter((x) => ENTREES_ENSUITE.includes(x.id)).length;
    if (VENUES_AU_MILIEU.includes(b.id) || ENTREES_ENSUITE.includes(b.id)) return rang;
    return rang - avant.filter((x) => VENUES_AU_MILIEU.includes(x.id)).length;
  }))[index] ?? index;

export function groundHeight(index: number, x: number, y: number): number {
  const lx = x - LAYOUT_PAD.x;
  const ly = y - LAYOUT_PAD.y;
  if (lx < 0 || ly < 0 || lx >= LAYOUT || ly >= LAYOUT) return 0;
  if (x >= FIN_DU_PLATEAU_DES_ECOLES && estIndexDEcole(index)) return 0;
  // Sur une île à parvis, le plateau tombait presque entier sur l'allée et sa bordure : sa marche d'herbe chevauchait le
  // parvis près du bord de devant, et une bande d'une case restait seule à côté (DA, captures emc-4e-3e-2, 10 octobre
  // 2026). Le cœur y reste plat : le parvis va d'un seul niveau du bord de devant à l'ouvrage, dans les deux univers.
  const id = BIOMES[index]?.id;
  if (id && ILES_A_PARVIS.has(id)) return 0;
  const fromBack = LAYOUT - 1 - lx;
  const shape = rangDuDessin(index) % 3;
  // Le plateau est à l'arrière-droite, devant la zone des plans (qui reste plate).
  const inner = lx >= 7 && ly >= 2 && ly <= 5;
  if (!inner) return 0;
  if (shape === 0) return fromBack + Math.abs(ly - LAYOUT / 2 + 0.5) < 7.5 ? 1 : 0;
  if (shape === 1) return ly <= LAYOUT / 2 + 1 || fromBack < 2 ? 1 : 0;
  return fromBack < 3 || (ly >= 4 && ly <= LAYOUT - 5) ? 1 : 0;
}

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };

/** Où le bonhomme se tient sur une île (coordonnées du monde, z sous ses pieds : le dessus du bloc de sol). */
export function avatarHome(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  // Le bloc de sol du cœur est en z = altitude (+ 1 sur le plateau) : on se tient sur son dessus, comme les créatures.
  const z = def.altitude + groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y) + 1;
  // Sur le lieu tourné (GD-9) : sa place tourne avec lui.
  return { ...toWorld(def, AVATAR_HOME.x, AVATAR_HOME.y), z };
}

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
 * au-dessus. Mémorisé par liste de cases (celles de `landCells` le sont déjà).
 */
export function taperLayers(cells: readonly { x: number; y: number }[]): readonly { x: number; y: number; d: number }[] {
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

/** Roche sous le sol d'une case de paysage, selon la région et la hauteur. */
export function underground(def: IslandDef, cell: LandCell, depthBelowTop: number): string {
  if (def.region === 'feu') return BASALT;
  if (cell.h - depthBelowTop >= 2 || def.region === 'hauteurs' || def.region === 'montagne') return BLOCKS[BLOC.pierre].side;
  return BLOCKS[BLOC.terre].side;
}

export function isSchoolIsland(id: BiomeId): boolean {
  return ARCHIPELAGOS.some((a) => a.school === id);
}

/** L'origine du repère d'une île : le coin de son cœur, à l'altitude de l'île (le point 0, 0, 0 de l'île). */
export function origineDe(id: BiomeId): { x: number; y: number; z: number } {
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: ox, y: oy, z: oz };
}
