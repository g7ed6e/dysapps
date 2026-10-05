// Le socle des îles : leur place dans le monde, la hauteur du sol, les couches de terre et de roche dessous, la
// maison du bonhomme, les couleurs et textures du sol.
import { coeurDe, CORE, type Ground, islandDef, type IslandDef, type LandCell, versLeMonde } from '../map';
import { fadeRgb, hexToRgb } from '../../../core/color';
import { BASALT, CRYSTAL, GRASS, HAY, LAVA, LEAF, MOSS, PINE, SNOW, TRUNK, WATER } from '../decor';
import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { ARCHIPELAGOS } from '../archipelago';

/** Côté du cœur d'origine d'une île (en blocs) : le repère des clés ; l'étendue du cœur d'une île est `coeurDe` (./map). */
export const ISLAND = CORE;

/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;

/** Couches de roche qui s'amincissent sous une île en altitude (elle flotte). */
const TAPER = 3;

/** Couleur délavée d'une île verrouillée (même calcul que la texture délavée en 3D). */
export function fade(color: string): string {
  const [r, g, b] = fadeRgb(...hexToRgb(color)).map(Math.round);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

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

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };

/** Où le bonhomme se tient sur une île (coordonnées du monde, z sous ses pieds : le dessus du bloc de sol). */
export function avatarHome(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  // Le bloc de sol du cœur est en z = altitude (+ 1 sur le plateau) : on se tient sur son dessus, comme les créatures.
  const z = def.altitude + groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y) + 1;
  // Sur le lieu tourné (GD-9) : sa place tourne avec lui.
  return { ...versLeMonde(def, AVATAR_HOME.x, AVATAR_HOME.y), z };
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
 * au-dessus. Mémorisé par liste de cases (celles de `landCells` et de `bossIsletCells` le sont déjà).
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
