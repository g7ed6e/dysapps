// La carte de Blocland : quatre archipels, un par classe, dans un seul repère de coordonnées. Chaque île a un cœur de
// 16 × 16 (bornes de mission, zone des plans, créature, décor) posé sur une terre bien plus large aux côtes irrégulières
// (baies, caps), avec ses collines, ses pics, ses lacs, sa végétation. Les archipels occupent des bandes de y disjointes :
// les Premiers Rivages (6e) au niveau de la mer, les Îles Brumeuses (5e), les Anciens Ateliers (4e) et les Îles du Ciel (3e),
// chacun à son altitude, qui est une ambiance : les Îles du Ciel flottent au-dessus des nuages.
import type { BiomeId } from '../biomes';
import { archipelagoOfIsland, type ArchipelagoId } from './archipels';
import { silhouetteDe } from './silhouettes';

export { ARCHIPELAGO_IDS, archipelagoOfIsland, type ArchipelagoId } from './archipels';

export type RegionId = 'basses-terres' | 'marais' | 'feu' | 'montagne' | 'hauteurs';
export type Relief = 'plat' | 'collines' | 'montagne' | 'volcan';

export interface IslandDef {
  id: BiomeId;
  region: RegionId;
  /** Origine (x, y) du repère de l'île dans le monde : le coin du cœur d'origine 16 × 16 (ses bornes : `coeurDe`). */
  core: { x: number; y: number };
  /** Altitude du sol : 0 (mer), 3 (collines), 6 (monts), 9 (sommets). */
  altitude: number;
  /** Terre en plus autour du cœur (de ses bornes, `coeurDe`) : à gauche (x plus petit), à droite, devant (y plus petit), derrière. */
  ext: { left: number; right: number; front: number; back: number };
  relief: Relief;
  seed: number;
  /**
   * De combien l'île a été déplacée (en cases) depuis la place où sa côte, son relief et son décor ont été tirés : le
   * bruit qui les dessine est lu à cette place (`tirage`), et l'île garde son dessin quand on l'écarte. Les voisines de
   * la Forêt, écartées quand son cœur est passé à 20 (01/10/2026).
   */
  deplacee?: { x: number; y: number };
}

/**
 * Côté du cœur d'origine (16) : le repère des clés de sauvegarde et des plans, posé sur `IslandDef.core`. L'étendue du
 * cœur d'une île ne se lit plus ici mais avec `coeurDe` (ou `bornesDuCoeur`), qui suit le réglage de son île.
 */
export const CORE = 16;

/**
 * Côté du cœur des îles qui en ont un plus grand que `CORE` : les îles-écoles, qui portent les lieux du village (l'école,
 * la salle des trophées), passent de 16 × 16 à 20 × 20 (décision du mainteneur, 01/10/2026), une à la fois. Il grandit
 * également des deux côtés autour du cœur d'origine : à 20, le cœur couvre [−2, 18) en coordonnées relatives à
 * `IslandDef.core`, qui reste l'origine du repère de l'île (et des clés de sauvegarde) ; son milieu ne bouge pas.
 * C'est de la vraie terre en plus : la côte (`ext`) garde sa largeur autour du cœur agrandi, la terre de l'île gagne
 * deux cases de chaque côté, et ses voisines s'écartent d'autant dans `MAP` (choix du mainteneur, 01/10/2026). Les
 * marges du cœur (l'anneau de deux cases autour du cœur d'origine) sont plates, avec le décor de la côte
 * (`margesDuCoeur`, allégé île par île : `DECOR_DES_MARGES`). La Forêt d'abord, puis le Marché, l'Atelier et le Phare.
 */
export const COTE_DU_COEUR: Partial<Record<BiomeId, number>> = { foret: 20, marche: 20, atelier: 20, phare: 20 };

/** Des bornes de cases : [x0, x1) × [y0, y1), bornes hautes exclues. */
export interface Bornes {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const bornesLocales = new Map<BiomeId, Readonly<Bornes>>();

/** Les bornes du cœur d'une île relatives à son origine `def.core` (0..16 aujourd'hui, −2..18 à 20 de côté). */
export function bornesDuCoeur(def: IslandDef): Readonly<Bornes> {
  let b = bornesLocales.get(def.id);
  if (!b) {
    const cote = COTE_DU_COEUR[def.id] ?? CORE;
    // (CORE − cote) / 2 plutôt que −marge : 0 et non −0 pour un cœur de 16.
    const debut = (CORE - cote) / 2;
    b = Object.freeze({ x0: debut, y0: debut, x1: cote + debut, y1: cote + debut });
    bornesLocales.set(def.id, b);
  }
  return b;
}

/** Les bornes du cœur d'une île en cases du monde (bornes hautes exclues). */
export function coeurDe(def: IslandDef): Bornes {
  const b = bornesDuCoeur(def);
  return { x0: def.core.x + b.x0, y0: def.core.y + b.y0, x1: def.core.x + b.x1, y1: def.core.y + b.y1 };
}
/** Altitude par classe (uniforme dans un archipel). */
export const ALTITUDE: Record<ArchipelagoId, number> = { '6e': 0, '5e': 3, '4e': 6, '3e': 9 };
/** Un archipel du ciel : pas de mer, les îles flottent au-dessus d'un plancher de nuages (les Îles du Ciel). */
export const DANS_LE_CIEL: Record<ArchipelagoId, boolean> = { '6e': false, '5e': false, '4e': false, '3e': true };

const e = (left: number, right: number, front: number, back: number) => ({ left, right, front, back });

/**
 * Les trente et une îles, placées à la main. Les Premiers Rivages (6e) : la Forêt et la Plaine au centre. Les trois autres archipels
 * sont des bandes plus au nord (y ≈ 300, 600, 900), jamais visibles depuis la 6e : chaque archipel est sa propre scène.
 * Dans chaque archipel, l'île-port est celle dont le quai (devant, côté −y) accueille le Bloc-Navire.
 */
export const MAP: IslandDef[] = [
  // Premiers Rivages (6e), au niveau de la mer. Port : la Plaine. La Forêt, île-école, a un cœur de 20 (`COTE_DU_COEUR`)
  // et sa côte autour : sa terre a deux cases de plus de chaque côté. Ses voisines se sont écartées d'autant (01/10/2026)
  // pour garder les bras de mer et la longueur des ouvrages (à deux cases près), chacune avec son dessin (`deplacee`) :
  // la Ferme de 2 vers l'ouest, la Mine de 2 vers l'est, la Plaine de 2 devant ; derrière, la Baie (2 vers l'ouest) et
  // l'Horloge d'une case seulement, pour que la mer semée au large ne s'étende pas d'un rang (l'îlot du Gardien de
  // l'Horloge est à deux cases d'eau de la Forêt, comme celui de la Forêt l'est de la Plaine). Les îles du bord (la
  // Tour, la Carrière, le Volcan, la Rivière) ne bougent pas : rien de la Forêt ne les approche, et l'archipel garde sa
  // colonne centrale (le cadrage des caméras) et sa largeur (la mer). L'isthme de la Ferme à la Tour, les ponts de la
  // Mine à la Carrière et à la Rivière, et le bac de la Ferme au Volcan y perdent deux cases.
  { id: 'foret', region: 'basses-terres', core: { x: 67, y: 59 }, altitude: 0, ext: e(6, 5, 3, 6), relief: 'collines', seed: 11 },
  { id: 'ferme', region: 'basses-terres', core: { x: 25, y: 61 }, deplacee: { x: -2, y: 0 }, altitude: 0, ext: e(3, 4, 2, 4), relief: 'plat', seed: 12 },
  { id: 'mine', region: 'montagne', core: { x: 98, y: 61 }, deplacee: { x: 2, y: 0 }, altitude: 0, ext: e(3, 4, 2, 5), relief: 'montagne', seed: 13 },
  { id: 'tour', region: 'basses-terres', core: { x: -3, y: 56 }, altitude: 0, ext: e(2, 3, 2, 3), relief: 'plat', seed: 14 },
  { id: 'carriere', region: 'montagne', core: { x: 136, y: 56 }, altitude: 0, ext: e(3, 3, 2, 4), relief: 'collines', seed: 15 },
  { id: 'plaine', region: 'basses-terres', core: { x: 64, y: 19 }, deplacee: { x: 0, y: -2 }, altitude: 0, ext: e(5, 5, 3, 2), relief: 'plat', seed: 16 },
  { id: 'riviere', region: 'marais', core: { x: 109, y: 19 }, altitude: 0, ext: e(4, 4, 3, 3), relief: 'plat', seed: 17 },
  { id: 'volcan', region: 'feu', core: { x: 21, y: 19 }, altitude: 0, ext: e(4, 4, 2, 6), relief: 'volcan', seed: 18 },
  // Îles Brumeuses (5e), sur les collines : deux paires d'isthmes l'une devant l'autre. Port : le Marché. Le Marché,
  // île-école, a un cœur de 20 et sa côte autour (01/10/2026) : le Glacier s'écarte de 2 vers l'ouest (l'isthme garde
  // sa largeur), le Comptoir et le Manoir de 2 vers l'est (le pont du Comptoir au Manoir reste droit), chacun avec son
  // dessin (`deplacee`) ; le grand phare du large recule (monuments.ts). Le Marais, le Carrefour et le Relais ne bougent
  // pas : le pont du Marché au Marais était long (30 cases), celui du Comptoir au Relais y perd deux cases ; écarter
  // aussi le Relais, pour garder la colonne centrale, élargissait la mer semée de 157 triangles de décor, au-delà de son
  // enveloppe : la colonne recule d'une case, et les caméras du 5e tournent de 0,8°.
  { id: 'glacier', region: 'montagne', core: { x: 38, y: 320 }, deplacee: { x: -2, y: 0 }, altitude: 3, ext: e(4, 4, 3, 6), relief: 'montagne', seed: 21 },
  { id: 'marche', region: 'marais', core: { x: 69, y: 317 }, altitude: 3, ext: e(3, 4, 2, 3), relief: 'plat', seed: 22 },
  { id: 'carrefour', region: 'basses-terres', core: { x: 40, y: 362 }, altitude: 3, ext: e(4, 4, 3, 4), relief: 'collines', seed: 23 },
  { id: 'marais', region: 'marais', core: { x: 69, y: 367 }, altitude: 3, ext: e(4, 4, 2, 4), relief: 'plat', seed: 24 },
  // Anciens Ateliers (4e), sur les monts : une crête en ligne brisée. Port : l'Atelier. L'Atelier, île-école, a un cœur
  // de 20 et sa côte autour (01/10/2026) : la Forge s'écarte de 2 vers l'ouest, la Falaise de 2 vers l'est, chacune
  // avec son dessin (`deplacee`) ; leurs ponts vers l'Atelier gardent leur longueur, ceux de la Forge à la Gare et de
  // la Falaise au Cabinet y perdent deux cases. Les îles du bout de la crête ne bougent pas : l'archipel garde sa
  // colonne centrale et sa largeur. La grue suit la côte repoussée (decor/4e.ts).
  { id: 'forge', region: 'feu', core: { x: 28, y: 618 }, deplacee: { x: -2, y: 0 }, altitude: 6, ext: e(3, 4, 2, 5), relief: 'montagne', seed: 31 },
  { id: 'atelier', region: 'hauteurs', core: { x: 62, y: 632 }, altitude: 6, ext: e(3, 3, 2, 4), relief: 'collines', seed: 32 },
  { id: 'falaise', region: 'montagne', core: { x: 96, y: 618 }, deplacee: { x: 2, y: 0 }, altitude: 6, ext: e(3, 4, 2, 7), relief: 'montagne', seed: 33 },
  { id: 'cabinet', region: 'hauteurs', core: { x: 126, y: 632 }, altitude: 6, ext: e(3, 3, 2, 4), relief: 'collines', seed: 34 },
  // Îles du Ciel (3e), sur les sommets : un arc, le Phare devant au centre. Port : le Phare. Le Phare, île-école, a un
  // cœur de 20 et sa côte autour (01/10/2026) : le Belvédère s'écarte de 2 vers l'ouest, l'Observatoire des données de
  // 2 vers l'est (leurs ponts vers le Phare gardent leur longueur, ceux du Studio et du Château y perdent deux cases),
  // chacun avec son dessin (`deplacee`). L'Observatoire des textes avance de 2 vers le Phare : la mer de nuages, qui
  // n'avait plus de marge, garde ses rangs (le devant du Phare l'a agrandie de deux cases, le fond la reprend), et le
  // col n'y perd que deux cases. Les îles du bord (le Studio, le Château, le Refuge) ne bougent pas : la colonne
  // centrale et la largeur restent. Le temple de marbre suit le Belvédère, le grand phare la côte repoussée (decor/3e.ts).
  { id: 'belvedere', region: 'montagne', core: { x: 18, y: 930 }, deplacee: { x: -2, y: 0 }, altitude: 9, ext: e(3, 3, 2, 6), relief: 'montagne', seed: 41 },
  { id: 'phare', region: 'hauteurs', core: { x: 58, y: 912 }, altitude: 9, ext: e(3, 3, 3, 3), relief: 'collines', seed: 42 },
  { id: 'donnees', region: 'hauteurs', core: { x: 98, y: 930 }, deplacee: { x: 2, y: 0 }, altitude: 9, ext: e(4, 3, 3, 3), relief: 'collines', seed: 43 },
  { id: 'textes', region: 'hauteurs', core: { x: 58, y: 958 }, deplacee: { x: 0, y: -2 }, altitude: 9, ext: e(3, 3, 2, 5), relief: 'collines', seed: 44 },
  // Anglais 6e : derrière la Ferme et la Forêt, les deux îles se touchent (un isthme).
  { id: 'baie', region: 'basses-terres', core: { x: 36, y: 102 }, deplacee: { x: -2, y: 1 }, altitude: 0, ext: e(4, 3, 2, 4), relief: 'plat', seed: 51 },
  { id: 'horloge', region: 'basses-terres', core: { x: 68, y: 102 }, deplacee: { x: 0, y: 1 }, altitude: 0, ext: e(3, 4, 2, 4), relief: 'collines', seed: 52 },
  // Anglais 5e : une colonne à droite du Marché et du Marais.
  { id: 'comptoir', region: 'basses-terres', core: { x: 103, y: 320 }, deplacee: { x: 2, y: 0 }, altitude: 3, ext: e(3, 4, 2, 4), relief: 'plat', seed: 61 },
  { id: 'manoir', region: 'hauteurs', core: { x: 103, y: 366 }, deplacee: { x: 2, y: 0 }, altitude: 3, ext: e(3, 4, 2, 4), relief: 'collines', seed: 62 },
  // LV2 5e : à l'est du Comptoir, dans son alignement (le pont reste droit), en bout de chemin : rien n'en dépend.
  { id: 'relais', region: 'basses-terres', core: { x: 133, y: 320 }, altitude: 3, ext: e(2, 3, 2, 4), relief: 'plat', seed: 94 },
  // Anglais 4e : aux deux bouts de la crête, la Gare avant la Forge, le Théâtre après le Cabinet.
  { id: 'theatre', region: 'hauteurs', core: { x: 158, y: 618 }, altitude: 6, ext: e(3, 4, 2, 4), relief: 'collines', seed: 71 },
  // LV2 4e : au bout est de la crête, après le Théâtre, un cran plus bas (le rythme de la crête), en bout de chemin : rien
  // n'en dépend.
  { id: 'jardin', region: 'basses-terres', core: { x: 190, y: 632 }, altitude: 6, ext: e(2, 3, 2, 4), relief: 'plat', seed: 95 },
  { id: 'gare', region: 'feu', core: { x: -2, y: 632 }, altitude: 6, ext: e(4, 3, 2, 4), relief: 'collines', seed: 72 },
  // Anglais 3e : de part et d'autre de l'arc, le Studio avant le Belvédère, le Château après l'Observatoire des données.
  { id: 'studio', region: 'hauteurs', core: { x: -14, y: 912 }, altitude: 9, ext: e(3, 4, 2, 4), relief: 'collines', seed: 81 },
  { id: 'chateau', region: 'hauteurs', core: { x: 130, y: 912 }, altitude: 9, ext: e(4, 3, 2, 4), relief: 'collines', seed: 82 },
  // LV2 3e : à l'est du Château, un cran derrière, en bout de chemin : rien n'en dépend. Un refuge d'altitude, bas et
  // arrondi (intention du 3e, §3), son lac d'altitude au fond, sur l'herbe (`LACS`).
  { id: 'refuge', region: 'montagne', core: { x: 158, y: 926 }, altitude: 9, ext: e(2, 2, 2, 9), relief: 'plat', seed: 96 },
];

/** Les îles d'un archipel, dans l'ordre de MAP. */
export function mapOf(a: ArchipelagoId): IslandDef[] {
  return MAP.filter((d) => archipelagoOfIsland(d.id) === a);
}

/**
 * Les isthmes : deux îles voisines de même niveau, côte à côte, partagent une bande de terre. Le monde n'est plus
 * un semis d'îles : quatre paires forment de petits continents. L'ouvrage entre elles est un sentier.
 */
export const ISTHMUSES: [BiomeId, BiomeId][] = [
  ['foret', 'mine'],
  ['ferme', 'tour'],
  ['glacier', 'marche'],
  ['carrefour', 'marais'],
  ['baie', 'horloge'],
];

/** L'île avec laquelle une île partage un isthme, s'il y en a un. */
export function isthmusOf(id: BiomeId): BiomeId | null {
  const pair = ISTHMUSES.find(([a, b]) => a === id || b === id);
  return pair ? (pair[0] === id ? pair[1] : pair[0]) : null;
}

export function islandDef(id: BiomeId): IslandDef {
  const def = MAP.find((i) => i.id === id);
  if (!def) throw new Error(`Île inconnue : ${id}`);
  return def;
}

/**
 * Une case du monde ramenée à la place où le dessin de l'île (sa côte, son relief, son décor) a été tiré : avant son
 * déplacement (`IslandDef.deplacee`), et autour de son cœur d'origine. Autour d'un cœur agrandi, la terre d'avant est
 * repoussée d'autant de chaque côté : l'île garde sa silhouette, de la vraie terre en plus ; le long du cœur, le dessin
 * d'avant s'étire sur la largeur du cœur agrandi.
 */
export function tirage(def: IslandDef, x: number, y: number): { x: number; y: number } {
  const b = bornesDuCoeur(def);
  const avant = (rel: number, b0: number, b1: number) =>
    rel < b0 ? rel - b0 : rel >= b1 ? rel - b1 + CORE : b0 === 0 && b1 === CORE ? rel : Math.floor(((rel - b0) * CORE) / (b1 - b0));
  const ox = def.core.x - (def.deplacee?.x ?? 0);
  const oy = def.core.y - (def.deplacee?.y ?? 0);
  return { x: ox + avant(x - def.core.x, b.x0, b.x1), y: oy + avant(y - def.core.y, b.y0, b.y1) };
}

/** Bruit déterministe dans [0, 1) pour une case. */
export function noise(seed: number, x: number, y: number): number {
  let h = (seed * 374761393 + x * 668265263 + y * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bruit lissé (interpolation bilinéaire d'un bruit sur une grille de `cell` cases). */
export function smoothNoise(seed: number, x: number, y: number, cell = 4): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = (x - gx * cell) / cell;
  const fy = (y - gy * cell) / cell;
  const n00 = noise(seed, gx, gy);
  const n10 = noise(seed, gx + 1, gy);
  const n01 = noise(seed, gx, gy + 1);
  const n11 = noise(seed, gx + 1, gy + 1);
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = n00 + (n10 - n00) * s(fx);
  const b = n01 + (n11 - n01) * s(fx);
  return a + (b - a) * s(fy);
}

/** L'île qui « possède » l'isthme (la première de la paire) et sa voisine, ou null. */
function isthmusPair(def: IslandDef): { owner: IslandDef; other: IslandDef } | null {
  const pair = ISTHMUSES.find(([a]) => a === def.id);
  if (!pair) return null;
  return { owner: def, other: islandDef(pair[1]) };
}

/** Les rangées de l'isthme entre deux îles côte à côte, pour une colonne x : bornes [y0, y1), bords adoucis par un bruit. */
function isthmusRows(owner: IslandDef, other: IslandDef, x: number): { y0: number; y1: number } {
  const a = coeurDe(owner);
  const b = coeurDe(other);
  const y0 = Math.max(a.y0, b.y0) + 1;
  const y1 = Math.min(a.y1, b.y1) - 1;
  const tx = tirage(owner, x, 0).x;
  const n0 = Math.floor(smoothNoise(owner.seed + 17, tx, 0, 3) * 2.5);
  const n1 = Math.floor(smoothNoise(owner.seed + 19, tx, 7, 3) * 2.5);
  return { y0: y0 + n0, y1: y1 - n1 };
}

/** La case (x, y) est-elle sur l'isthme que possède cette île ? (Jamais sur la terre propre de la voisine.) */
export function inIsthmus(def: IslandDef, x: number, y: number): boolean {
  const pair = isthmusPair(def);
  if (!pair) return false;
  const { owner, other } = pair;
  const left = owner.core.x < other.core.x ? owner : other;
  const right = left === owner ? other : owner;
  if (x < coeurDe(left).x1 || x >= coeurDe(right).x0) return false;
  const { y0, y1 } = isthmusRows(owner, other, x);
  if (y < y0 || y >= y1) return false;
  return !isLandProper(other, x, y);
}

/** Boîte englobante de la terre d'une île (bornes hautes exclues), isthme compris. */
export function landBox(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  const c = coeurDe(def);
  const box = { x0: c.x0 - def.ext.left, y0: c.y0 - def.ext.front, x1: c.x1 + def.ext.right, y1: c.y1 + def.ext.back };
  const pair = isthmusPair(def);
  if (pair) {
    const o = coeurDe(pair.other);
    box.x0 = Math.min(box.x0, o.x1);
    box.x1 = Math.max(box.x1, o.x0);
  }
  return box;
}

export function inCore(def: IslandDef, x: number, y: number): boolean {
  const b = bornesDuCoeur(def);
  const lx = x - def.core.x;
  const ly = y - def.core.y;
  return lx >= b.x0 && lx < b.x1 && ly >= b.y0 && ly < b.y1;
}

/** La case (x, y) du monde est-elle dans le cœur d'origine 16 × 16 de l'île (le repère des clés, `IslandDef.core`) ? */
export function inCoeurDOrigine(def: IslandDef, x: number, y: number): boolean {
  const lx = x - def.core.x;
  const ly = y - def.core.y;
  return lx >= 0 && lx < CORE && ly >= 0 && ly < CORE;
}

const margesCache = new Map<BiomeId, LandCell[]>();

/**
 * Le décor des marges allégé, île par île, quand celui de la côte n'y tient pas dans l'enveloppe du décor de son
 * archipel (world/budget.ts) : `genre`, un seul genre, le plus bas de la côte de l'île ; `unSurDeux`, une case sur deux
 * de son rythme ; `derriere`, rien devant le cœur d'origine (la rangée des bornes reste dégagée, côté caméra). Le Marché
 * (5e, 01/10/2026) : le port reste bas (intention du 5e, §3), des roseaux sur les côtés et derrière.
 */
export const DECOR_DES_MARGES: Partial<Record<BiomeId, { genre?: Decor; unSurDeux?: true; derriere?: true }>> = {
  marche: { genre: 'roseau', unSurDeux: true, derriere: true },
};

/**
 * Les marges du cœur d'une île dont le cœur est plus grand que `CORE` : l'anneau entre le cœur d'origine et le cœur
 * agrandi (`coeurDe`), vide pour les autres îles. Une terre plate (h = 0) et constructible, au sol du cœur. Sa rangée
 * extérieure porte le décor de la côte à son rythme (le même bruit que `landscape`) pour ne pas laisser un terrain vide ;
 * sa rangée intérieure, qui borde le cœur d'origine, reste nue : un passage tout autour, et le décor tient dans son
 * enveloppe. Le rendu y pose ce décor sans jamais cacher une borne (terrain.ts, `cacheUneBorne`). Mémorisé.
 */
export function margesDuCoeur(def: IslandDef): LandCell[] {
  const cached = margesCache.get(def.id);
  if (cached) return cached;
  const c = coeurDe(def);
  // Le sol à plat de la côte de l'île (comme dans `computeLandscape`), qui choisit son décor.
  const sol: Ground = def.id === 'glacier' ? 'glace' : def.region === 'feu' ? 'basalte' : def.region === 'marais' ? 'mousse' : 'herbe';
  const out: LandCell[] = [];
  for (let x = c.x0; x < c.x1; x++)
    for (let y = c.y0; y < c.y1; y++) {
      if (inCoeurDOrigine(def, x, y)) continue;
      const t = tirage(def, x, y);
      const fine = noise(def.seed + 3, t.x, t.y);
      // La rangée qui borde le cœur d'origine reste nue : un passage tout autour, où l'on marche et construit.
      const bord = inCoeurDOrigine(def, x - 1, y) || inCoeurDOrigine(def, x + 1, y) || inCoeurDOrigine(def, x, y - 1) || inCoeurDOrigine(def, x, y + 1);
      const coin = inCoeurDOrigine(def, x - 1, y - 1) || inCoeurDOrigine(def, x + 1, y - 1) || inCoeurDOrigine(def, x - 1, y + 1) || inCoeurDOrigine(def, x + 1, y + 1);
      const allege = DECOR_DES_MARGES[def.id];
      let decor = !bord && !coin && fine > 0.62 ? pickDecor(def, sol, 0, fine) : undefined;
      if (decor && allege) {
        if (allege.genre) decor = allege.genre;
        if (allege.unSurDeux && (t.x + t.y) % 2) decor = undefined;
        if (allege.derriere && y < def.core.y) decor = undefined;
      }
      out.push({ x, y, h: 0, ground: sol, decor });
    }
  margesCache.set(def.id, out);
  return out;
}

/** Distance normalisée au cœur (0 sur le cœur, 1 au bord de la boîte). */
function coreDistance(def: IslandDef, x: number, y: number): number {
  const b = bornesDuCoeur(def);
  const c = { x0: def.core.x + b.x0, y0: def.core.y + b.y0, x1: def.core.x + b.x1, y1: def.core.y + b.y1 };
  const dx = x < c.x0 ? (c.x0 - x) / (def.ext.left + 0.5) : x >= c.x1 ? (x - (c.x1 - 1)) / (def.ext.right + 0.5) : 0;
  const dy = y < c.y0 ? (c.y0 - y) / (def.ext.front + 0.5) : y >= c.y1 ? (y - (c.y1 - 1)) / (def.ext.back + 0.5) : 0;
  return Math.hypot(dx, dy);
}

/**
 * La case (x, y) du monde fait-elle partie de la terre de l'île ? Le cœur toujours ; autour, une côte
 * irrégulière : baies et caps dessinés par un bruit lissé, plus un léger grain.
 */
export function isLand(def: IslandDef, x: number, y: number): boolean {
  return isLandProper(def, x, y) || inIsthmus(def, x, y);
}

/** La terre propre d'une île (sans l'isthme). */
function isLandProper(def: IslandDef, x: number, y: number): boolean {
  if (inCore(def, x, y)) return true;
  const b = bornesDuCoeur(def);
  const x0 = def.core.x + b.x0 - def.ext.left;
  const y0 = def.core.y + b.y0 - def.ext.front;
  const x1 = def.core.x + b.x1 + def.ext.right;
  const y1 = def.core.y + b.y1 + def.ext.back;
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  const d = coreDistance(def, x, y);
  const t = tirage(def, x, y);
  const coast = (smoothNoise(def.seed, t.x, t.y, 5) - 0.5) * 0.7 + (noise(def.seed + 1, t.x, t.y) - 0.5) * 0.15;
  return d + coast < 0.92;
}

/** Toutes les cases de terre d'une île. */
export function landCells(def: IslandDef): { x: number; y: number }[] {
  const { x0, y0, x1, y1 } = landBox(def);
  const out: { x: number; y: number }[] = [];
  for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) if (isLand(def, x, y)) out.push({ x, y });
  return out;
}

/** Nature du sol d'une case hors du cœur. */
export type Ground = 'herbe' | 'sable' | 'roche' | 'neige' | 'eau' | 'lave' | 'glace' | 'basalte' | 'mousse';

/** Un élément de décor posé sur la terre autour du cœur. */
export type Decor = 'arbre' | 'sapin' | 'buisson' | 'fleur' | 'rocher' | 'roseau' | 'cristal' | 'souche' | 'champignon';

export interface LandCell {
  x: number;
  y: number;
  /** Hauteur du sol au-dessus de l'altitude de l'île (négatif : creux d'un lac ou d'un cratère). */
  h: number;
  ground: Ground;
  decor?: Decor;
}

/** Les pics d'une île, à sa place dans le monde : son relief, écrit en repère d'île (./silhouettes/). */
function peaks(def: IslandDef): { x: number; y: number; h: number; r: number }[] {
  return silhouetteDe(def.id).pics.map((p) => ({ x: def.core.x + p.x, y: def.core.y + p.y, h: p.h, r: p.r }));
}

/**
 * Les lacs dessinés à la main (en cases relatives au coin du cœur ; `x`, `y` le coin, `w` × `d`) : le lac d'altitude du
 * Refuge des carnets (DA, LV2-5), sur l'herbe, loin du bord, derrière le cœur, à gauche de la poste dans la vue de
 * l'île, bordé d'une rangée de pierre plate (la roche, au ras du sol : pas de ponton), puis d'une rive d'herbe nue. Sur une île qui a son lac, le hasard n'en creuse pas d'autre.
 */
export const LACS: Partial<Record<BiomeId, { x: number; y: number; w: number; d: number }>> = {
  refuge: { x: 6, y: 17, w: 4, d: 2 },
};

/**
 * La place d'une case par rapport au lac dessiné de son île : dedans, sur sa bordure de pierre, sur la rive d'herbe nue
 * qui l'entoure (aucun arbre ne le cache à la caméra de l'île), ou ailleurs.
 */
function auLac(def: IslandDef, x: number, y: number): 'lac' | 'bord' | 'rive' | null {
  const l = LACS[def.id];
  if (!l) return null;
  const [dx, dy] = [x - def.core.x, y - def.core.y];
  const dans = (m: number) => dx >= l.x - m && dx < l.x + l.w + m && dy >= l.y - m && dy < l.y + l.d + m;
  return dans(0) ? 'lac' : dans(1) ? 'bord' : dans(2) ? 'rive' : null;
}

const landscapeCache = new Map<BiomeId, LandCell[]>();

/** Le paysage d'une île : chaque case de terre hors du cœur avec sa hauteur, son sol et son décor (mémorisé). */
export function landscape(def: IslandDef): LandCell[] {
  const cached = landscapeCache.get(def.id);
  if (cached) return cached;
  const out = computeLandscape(def);
  landscapeCache.set(def.id, out);
  return out;
}

function computeLandscape(def: IslandDef): LandCell[] {
  const cells = landCells(def);
  const isLandAt = (x: number, y: number) => isLand(def, x, y);
  const pk = peaks(def);
  const out: LandCell[] = [];
  for (const c of cells) {
    if (inCore(def, c.x, c.y)) continue;
    const t = tirage(def, c.x, c.y);
    const n = smoothNoise(def.seed + 7, t.x, t.y, 4);
    const fine = noise(def.seed + 3, t.x, t.y);
    const edge = !isLandAt(c.x - 1, c.y) || !isLandAt(c.x + 1, c.y) || !isLandAt(c.x, c.y - 1) || !isLandAt(c.x, c.y + 1);
    const nearCore = coreDistance(def, c.x, c.y) < 0.35;
    if (inIsthmus(def, c.x, c.y)) {
      // L'isthme : une bande plate qui relie deux îles, herbe et sable au bord, quelques buissons.
      const sandy = edge && def.altitude === 0 && def.region !== 'feu';
      const ground: Ground = sandy ? 'sable' : def.region === 'feu' ? 'basalte' : def.region === 'marais' ? 'mousse' : def.id === 'glacier' ? 'glace' : 'herbe';
      out.push({ x: c.x, y: c.y, h: 0, ground, decor: !edge && fine > 0.8 ? pickDecor(def, ground, 0, fine) : undefined });
      continue;
    }
    // Hauteur : collines douces, puis les pics par-dessus.
    let h = def.relief === 'plat' ? (n > 0.8 ? 1 : 0) : Math.min(2, Math.floor(n * 3));
    let crater = false;
    for (const p of pk) {
      const d = Math.hypot(c.x - p.x, c.y - p.y) / p.r;
      if (d < 1) {
        const ph = Math.round(p.h * (1 - d * d));
        if (def.relief === 'volcan' && d < 0.3) {
          crater = true;
          h = Math.max(h, p.h - 2);
        } else h = Math.max(h, ph);
      }
    }
    if (edge) h = Math.min(h, 1);
    if (nearCore) h = Math.min(h, 1);
    // Sol.
    let ground: Ground = 'herbe';
    if (def.region === 'feu') ground = 'basalte';
    else if (def.region === 'hauteurs') ground = h > 0 ? 'roche' : 'herbe';
    else if (def.region === 'marais') ground = 'mousse';
    if (def.id === 'glacier') ground = 'glace';
    if (h >= 3) ground = def.region === 'feu' ? 'basalte' : 'roche';
    if (h >= 5 && def.region !== 'feu') ground = 'neige';
    if (def.id === 'glacier' && h >= 2) ground = 'neige';
    if (crater) ground = 'lave';
    if (edge && def.altitude === 0 && h === 0 && def.region !== 'feu') ground = 'sable';
    // Lacs et mares : dans un creux, loin du bord et du cœur ; le lac dessiné d'une île, et sa bordure de pierre.
    let decor: Decor | undefined;
    const lac = auLac(def, c.x, c.y);
    if (lac === 'lac') {
      out.push({ x: c.x, y: c.y, h: 0, ground: 'eau' });
      continue;
    }
    if (lac === 'bord' || lac === 'rive') {
      out.push({ x: c.x, y: c.y, h: 0, ground: lac === 'bord' ? 'roche' : 'herbe' });
      continue;
    }
    if (!LACS[def.id] && !edge && !nearCore && h === 0 && smoothNoise(def.seed + 11, t.x, t.y, 3) > 0.78 && def.relief !== 'volcan') {
      ground = 'eau';
      h = -1;
    } else if (h <= 2 && !edge && fine > 0.62) {
      decor = pickDecor(def, ground, h, fine);
    }
    out.push({ x: c.x, y: c.y, h, ground, decor });
  }
  return out;
}

function pickDecor(def: IslandDef, ground: Ground, h: number, r: number): Decor | undefined {
  if (ground === 'eau' || ground === 'lave' || ground === 'sable') return undefined;
  const t = (r - 0.62) / 0.38; // 0..1
  switch (def.region) {
    case 'basses-terres':
      return t > 0.8 ? 'arbre' : t > 0.55 ? 'buisson' : t > 0.42 ? 'fleur' : t > 0.34 ? 'champignon' : undefined;
    case 'marais':
      return t > 0.85 ? 'arbre' : t > 0.5 ? 'roseau' : t > 0.3 ? 'champignon' : undefined;
    case 'feu':
      return t > 0.85 ? 'souche' : t > 0.6 ? 'rocher' : undefined;
    case 'montagne':
      if (ground === 'neige' || ground === 'glace') return t > 0.85 ? 'rocher' : undefined;
      return t > 0.75 ? 'sapin' : t > 0.55 ? 'rocher' : t > 0.4 && h === 0 ? 'fleur' : undefined;
    case 'hauteurs':
      return t > 0.8 ? 'cristal' : t > 0.6 ? 'rocher' : t > 0.45 && h === 0 ? 'sapin' : undefined;
  }
}

/** Hauteur du sol hors du cœur (compatibilité : la même que dans `landscape`). */
export function reliefHeight(def: IslandDef, x: number, y: number): number {
  if (inCore(def, x, y)) return 0;
  const cell = landscape(def).find((c) => c.x === x && c.y === y);
  return cell ? Math.max(0, cell.h) : 0;
}
