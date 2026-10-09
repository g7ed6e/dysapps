// Le reste du 6e (intention du directeur artistique, 9 octobre 2026, lot « eau, quai, liaisons, cœur, barrière ») : le
// dessin de chaque bloc posé que ni le plan d'un bâtiment, ni sa cour, ni un monument, ni un lieu du village, ni les
// poteaux ne prennent. Tout se lit par la table des familles (./families.ts) et par ce qui est autour du bloc ; au cœur
// d'une île, aucune maison, donc jamais de colombage : le bois y est bardé dans sa teinte, comme aux monuments. Rien ne
// s'allume, rien n'est transparent, rien ne bouge, aucun chanfrein.
// - Le décor du cœur fait de main d'homme : un volume par matière (le lissage, ./volumes.ts), peint, un seul dessus ;
//   les tours (Horloge), piliers, socles, cabine et galerie en murs peints ; les caisses, dalles, perles, flèche, tas,
//   champ, pain de craie en pièces au coût d'un cube ou moins (./heartPieces.ts).
// - Ce qui pousse : le rocher, le petit arbre et le buisson des formes communes du décor, réduits à la case.
// - Le quai et les liaisons : la pile de pierre en mur plein lissé, le tablier en plancher mince.
// - L'eau (le puits de la Mine, la mare des Fractions) en nappe ; les toits des petites constructions en pavillons ; les
//   toits cachés et plats peints dans la couverture ; le verre hors d'un mur peint en verrière.
// - Les lieux : la potence et les caisses de la cour de la Halle, la porte et le fût du clocheton de l'école, les socles
//   de la salle des trophées.
// Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import type { TextureKind } from '../pixels';
import { familyOf } from './families';
import { beam, bead, cap, chalkLoaf, crate, darkPost, deck, dialSlab, EMPTY, foliage, hangingCrate, HEART, mound, pavilion, rock, slab, spire, trunk, waterNeighbours, waterSheet, wheat } from './heartPieces';
import type { RestContext, RestDrawing } from './kits/types';
import { woodenPost } from './lowPieces';
import { HEART_MOTIFS, MOTIF, type Fond, type PeintureDuMur } from './paint';
import { estUnePlaceDeTrophee } from '../trophyHall';

/** Un mur peint : son fond, le motif de ses quatre flancs (+x, +y, −x, −y), celui de son dessus. */
const paint = (fond: Fond, sides: readonly number[], top: number): PeintureDuMur => ({ fond, motifs: [...sides, top, 0] });
const uniform = (fond: Fond, side: number, top: number) => paint(fond, [side, side, side, side], top);

/** Un pilier lissé (un volume par matière) : sa matière, un seul dessus, ni soubassement ni chaperon. */
const PILLAR = uniform('matiere', MOTIF.plein, 0);
/** Un pilier à chaperon (le socle d'un Gardien, ceux de la salle des trophées) : une bande mince plus sombre en haut. */
const CAPPED = uniform('matiere', MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.pierreEntiere);
/** Le bloc d'or d'un Gardien : une case entière d'or mat (le rôle `galon`), un chaperon mince plus sombre, sans lueur. */
const GOLD = uniform('galon', MOTIF.plein | MOTIF.chaperon, MOTIF.plein | MOTIF.pierreEntiere);
/** Le bardage dans la teinte de la matière (la cabine) : ses clins, un seul dessus. */
const CLAD = uniform('matiere', MOTIF.bardage, 0);
/** La verrière : les petits bois peints sur la vitre de sa teinte. */
const GLAZED = uniform('matiere', HEART_MOTIFS.glazing, 0);
/** Une porte : son vantail dans son encadrement (le kit). */
const DOOR = uniform('matiere', MOTIF.vantail, 0);
/** Un toit peint dans la couverture de son île (sa matière, `toit` : world/roofs.ts). */
const ROOF = uniform('matiere', 0, 0);
/** La case du sommet du cône des Décimaux : la braise mate. */
const EMBER = uniform('braise', 0, 0);

/** Les voisines horizontales (+x, +y, −x, −y), comme `SIDES`. */
const SIDES: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const tex = (c: VoxelCube | undefined) => (c ? (c.texture ?? 'couleur') : undefined);

/** Les cases d'une même matière reliées à `c` (de face en face, au plus `max`). */
function sameMaterial(c: VoxelCube, at: RestContext['at'], max = 64): VoxelCube[] {
  const t = tex(c);
  const seen = new Set<string>([`${c.x},${c.y},${c.z}`]);
  const out = [c];
  for (let i = 0; i < out.length && out.length < max; i++) {
    const d = out[i];
    for (const [dx, dy, dz] of [...SIDES.map(([x, y]) => [x, y, 0] as const), [0, 0, 1] as const, [0, 0, -1] as const]) {
      const n = at(d.x + dx, d.y + dy, d.z + dz);
      const k = `${d.x + dx},${d.y + dy},${d.z + dz}`;
      if (!n || seen.has(k) || tex(n) !== t) continue;
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

/**
 * Une pierre bâtie (le pilier de l'Horloge, le cône des Décimaux, la pile du feu de port) : son volume porte un cadran,
 * de l'or ou une lanterne. Sinon, c'est une pierre posée là (isolée, ou un amas) : un rocher.
 */
function isBuiltStone(c: VoxelCube, at: RestContext['at']): boolean {
  return sameMaterial(c, at).some((d) => ['cadran', 'or', 'lanterne'].includes(tex(at(d.x, d.y, d.z + 1)) ?? ''));
}

/** Brique et sable : les perles du boulier, la borne de brique, la dune, le tas. */
const BEADS = new Set(['brique', 'sable']);

/**
 * Une perle du boulier : une brique ou un sable sans rien de tel au-dessus ni au-dessous, avec une voisine de brique ou
 * de sable sur un seul axe (une rangée : on compte par cinq), à la même hauteur ou d'un cran sur la pente.
 */
function isBead(c: VoxelCube, at: RestContext['at']): boolean {
  if (BEADS.has(tex(at(c.x, c.y, c.z + 1)) ?? '') || BEADS.has(tex(at(c.x, c.y, c.z - 1)) ?? '')) return false;
  const along = (dx: number, dy: number) => [-1, 0, 1].some((dz) => BEADS.has(tex(at(c.x + dx, c.y + dy, c.z + dz)) ?? '') || BEADS.has(tex(at(c.x - dx, c.y - dy, c.z + dz)) ?? ''));
  return along(1, 0) !== along(0, 1);
}

/** Une case a-t-elle une voisine de même matière, à côté (sur la même rangée) ? */
const hasSideNeighbour = (c: VoxelCube, at: RestContext['at']) => SIDES.some(([dx, dy]) => tex(at(c.x + dx, c.y + dy, c.z)) === tex(c));

/** Le tablier file-t-il le long de x ? Une voisine de planches ou d'escalier sur x, et aucune sur y. */
function deckAlongX(c: VoxelCube, at: RestContext['at']): boolean {
  const walk = (dx: number, dy: number) => [-1, 0, 1].some((dz) => ['planches', 'escalier', 'marche'].includes(tex(at(c.x + dx, c.y + dy, c.z + dz)) ?? ''));
  return (walk(1, 0) || walk(-1, 0)) && !(walk(0, 1) || walk(0, -1));
}

/** Le tablier d'une case de planches : un quart de tour le long de x (la rangée suit la marche, ./assembly.ts). */
function deckOf(c: VoxelCube, at: RestContext['at']): RestDrawing {
  const x = deckAlongX(c, at);
  return { family: 'vegetal', piece: deck(x), rotation: x ? 1 : 0 };
}

/** Le verre est-il pris dans un mur (une vitre, que world/construction.ts allume) ? La règle de `genresDesBlocs`. */
function isWindow(c: VoxelCube, at: RestContext['at']): boolean {
  const wall = (dx: number, dy: number, dz: number) => {
    const n = at(c.x + dx, c.y + dy, c.z + dz);
    return n !== undefined && n.texture !== 'lanterne' && n.texture !== 'verre';
  };
  const top = tex(at(c.x, c.y, c.z + 1));
  return ((wall(-1, 0, 0) && wall(1, 0, 0)) || (wall(0, -1, 0) && wall(0, 1, 0))) && wall(0, 0, -1) && top !== 'toit' && top !== 'tuile';
}

/** Une caisse (carton, cabine, chaume, la recette de la Halle) : bardée, ou au motif de sa famille. */
function crateOf(c: VoxelCube, at: RestContext['at'], motif: number, side?: number): RestDrawing {
  const above = at(c.x, c.y, c.z + 1);
  const below = at(c.x, c.y, c.z - 1);
  return { family: 'bardage', piece: crate(motif, tex(above) !== undefined && tex(above) !== 'couleur', tex(below) !== undefined, side) };
}

/** Une eau en nappe (le puits, la mare) : ses voisines d'eau à la même hauteur, un nénuphar si une feuille est posée dessus. */
function waterOf(c: VoxelCube, at: RestContext['at'], level: number): RestDrawing {
  const isWater = (dx: number, dy: number) => {
    const t = tex(at(c.x + dx, c.y + dy, c.z));
    return t === tex(c);
  };
  const lily = tex(at(c.x, c.y, c.z + 1)) === 'feuilles';
  const walled = waterNeighbours((dx, dy) => !isWater(dx, dy) && at(c.x + dx, c.y + dy, c.z) !== undefined);
  return { family: 'eau', piece: waterSheet(level, waterNeighbours(isWater), lily, walled) };
}

/** Un toit qui n'est pas une pente : caché sous un autre (son dessus jamais vu), ou plat. */
const roofOf = (c: VoxelCube, at: RestContext['at']): RestDrawing => ({ family: 'toit', paint: ROOF, hiddenTop: at(c.x, c.y, c.z + 1) !== undefined });

/** La graine du hasard d'un élément qui pousse : sa case. */
const seedOf = (c: VoxelCube) => `coeur@${c.x},${c.y},${c.z}`;

/** Le motif de sa famille sur une caisse de la recette : le bardage pour le bois, le mur plein pour la pierre. */
function familyMotif(t: string | undefined): number {
  const f = familyOf(t);
  return f === 'colombage' || f === 'bardage' ? MOTIF.bardage : f === 'pierre' ? MOTIF.plein : f === 'metal' ? MOTIF.bardage | MOTIF.vertical : 0;
}

/** Le décor du cœur d'une île, le quai, le Gardien. */
function heartOf(c: VoxelCube, at: RestContext['at']): RestDrawing | undefined {
  const above = at(c.x, c.y, c.z + 1);
  const below = at(c.x, c.y, c.z - 1);
  switch (tex(c)) {
    case 'planches':
      // Le bouchon d'un poteau de la jetée (sa lanterne pas encore allumée) : le poteau continue ; sinon, le tablier.
      return tex(below) === 'tronc' ? { family: 'vegetal', piece: woodenPost(!above) } : deckOf(c, at);
    case 'pierre':
      if (tex(above) === 'or' && !below) return { family: 'pierre', paint: CAPPED };
      if (isBuiltStone(c, at)) return { family: 'pierre', paint: PILLAR };
      return { family: 'pierre', piece: rock(seedOf(c), false) };
    case 'galet':
      return { family: 'pierre', piece: rock(seedOf(c), true) };
    case 'obsidienne':
      return { family: 'pierre', piece: rock(seedOf(c), false) };
    case 'cadran': {
      if (!below) return { family: 'pierre', piece: dialSlab() };
      // Le haut de la tour : le disque peint sur ses faces libres.
      const sides = SIDES.map(([dx, dy]) => (at(c.x + dx, c.y + dy, c.z) ? MOTIF.plein : MOTIF.plein | MOTIF.cadran));
      return { family: 'pierre', paint: paint('matiere', sides, 0) };
    }
    case 'or': {
      const t = tex(below);
      if (t === 'cadran') return { family: 'precieux', piece: spire() };
      if (t === 'pierre' && tex(at(c.x, c.y, c.z - 2)) === 'pierre') return { family: 'precieux', paint: EMBER };
      if (!below) return { family: 'vegetal', piece: wheat() };
      return { family: 'precieux', paint: GOLD };
    }
    case 'cabine':
      return tex(above) === 'cabine' || tex(below) === 'cabine' ? { family: 'bardage', paint: CLAD } : crateOf(c, at, MOTIF.bardage);
    case 'carton':
    case 'chaume':
      return crateOf(c, at, MOTIF.bardage);
    case 'mosaique':
      return { family: 'pierre', piece: slab(HEART.slab.mosaic) };
    case 'brique':
      return isBead(c, at) ? { family: 'pierre', piece: bead() } : { family: 'pierre', paint: PILLAR };
    case 'sable':
      if (isBead(c, at)) return { family: 'pierre', piece: bead() };
      return hasSideNeighbour(c, at) || tex(below) === 'sable' ? { family: 'pierre', paint: PILLAR } : { family: 'pierre', piece: mound() };
    case 'tronc': {
      // Le tronc d'un petit arbre (une feuille en haut de sa colonne), sinon un poteau de bois (la barrière de la Ferme).
      let z = c.z + 1;
      while (tex(at(c.x, c.y, z)) === 'tronc') z++;
      return tex(at(c.x, c.y, z)) === 'feuilles' ? { family: 'vegetal', piece: trunk() } : { family: 'vegetal', piece: woodenPost(!above) };
    }
    case 'feuilles': {
      const t = tex(below);
      if (t === 'verre' || t === 'eau') return { family: 'vegetal', piece: EMPTY };
      return { family: 'vegetal', piece: foliage(seedOf(c), t !== 'tronc') };
    }
    case 'mousse':
      return { family: 'vegetal', piece: foliage(seedOf(c), true) };
    case 'verre':
      return isWindow(c, at) ? undefined : waterOf(c, at, HEART.water.pond);
    case 'craie':
      return { family: 'pierre', piece: chalkLoaf() };
    case 'couleur':
      return darkOf(c, at);
    default:
      return undefined;
  }
}

/**
 * Le brun sombre posé sans matière (world/decor.ts) : le chaperon de la cabine, le poteau du réverbère, l'entrée de la
 * galerie de la Mine (son encadrement de bois sur la face vue, vers la caméra : −y).
 */
function darkOf(c: VoxelCube, at: RestContext['at']): RestDrawing {
  const below = at(c.x, c.y, c.z - 1);
  const above = at(c.x, c.y, c.z + 1);
  if (tex(below) === 'cabine') return { family: 'bardage', piece: cap() };
  const same = (dx: number, dy: number, dz = 0) => tex(at(c.x + dx, c.y + dy, c.z + dz)) === 'couleur';
  if (!SIDES.some(([dx, dy]) => same(dx, dy))) return { family: 'vegetal', piece: darkPost(!above) };
  // La face vue (−y) : l'encadrement aux bords du volume (u : la x de la grille sur cette face).
  const front = HEART_MOTIFS.gallery | (same(-1, 0) ? 0 : MOTIF.montante) | (same(1, 0) ? 0 : MOTIF.descendante) | (same(0, 0, 1) ? 0 : MOTIF.chaperon);
  return { family: 'pierre', paint: paint('matiere', [MOTIF.plein, MOTIF.plein, MOTIF.plein, front], 0) };
}

/** La cour de la Halle, l'école, la salle des trophées. */
function placeOf(c: VoxelCube, ctx: RestContext): RestDrawing | undefined {
  const { at, place: m } = ctx;
  const t = tex(c);
  if (t === 'toit' || (c.place === 'trophies' && t === 'taille' && m !== null && m.z >= 4)) {
    // La souche du clocheton de l'école (prise dans sa pierre de taille, ./kits/6e.ts) : le fût, d'un tenant.
    if (c.place === 'school' && m && m.x === (m.w - 1) / 2 && m.y === 1 && m.z === 5) return { family: 'pierre', paint: PILLAR };
    return roofOf(c, at);
  }
  if (c.place === 'school') {
    if (t === 'porte') return { family: 'finition', paint: DOOR };
    if (t === 'taille') return { family: 'pierre', paint: PILLAR };
    return undefined;
  }
  // Les socles de marbre (pas un trophée de marbre posé à sa place : world/construction.ts le dessine).
  if (c.place === 'trophies') return t === 'marbre' && m !== null && !estUnePlaceDeTrophee(m.x, m.y, m.z) ? { family: 'pierre', paint: CAPPED } : undefined;
  if (c.place === 'assembly' && m) {
    const above = at(c.x, c.y, c.z + 1);
    const below = at(c.x, c.y, c.z - 1);
    // La potence : le mât (le long de la façade), son bras au sommet, vers l'avant.
    if (m.x === 0 && m.y === 1) return { family: 'vegetal', piece: woodenPost(!above) };
    if (m.x === 0 && m.y === 0 && !above && below === undefined && SIDES.some(([dx, dy]) => tex(at(c.x + dx, c.y + dy, c.z)) === t)) {
      const x = tex(at(c.x + 1, c.y, c.z)) === t || tex(at(c.x - 1, c.y, c.z)) === t;
      return { family: 'vegetal', piece: beam(x) };
    }
    // Le bloc suspendu (rien dessous), puis les blocs de la recette, empilés : des caisses en retrait.
    if (!below) return m.z === 1 ? crateOf(c, at, familyMotif(c.texture), HEART.hallCrate) : { family: 'precieux', piece: hangingCrate() };
    return crateOf(c, at, familyMotif(c.texture), HEART.hallCrate);
  }
  return undefined;
}

/** Le reste du 6e : le dessin d'un bloc que rien d'autre ne prend (voir l'en-tête), ou `undefined`. */
export function restOf6e(c: VoxelCube, ctx: RestContext): RestDrawing | undefined {
  const { origin, at } = ctx;
  const t = c.texture as TextureKind | undefined;
  switch (origin) {
    case 'coeur':
      return heartOf(c, at);
    case 'liaison':
      return t === 'planches' ? deckOf(c, at) : undefined;
    case 'petite':
      if (t === 'eau') return waterOf(c, at, HEART.water.level);
      // Un toit seul : un pavillon ; une rangée de toits (qui ne fait pas de pente) : un toit plat, peint dans la couverture.
      if (t === 'toit') return hasSideNeighbour(c, at) ? roofOf(c, at) : { family: 'toit', piece: pavilion() };
      if (t === 'verre') return isWindow(c, at) ? undefined : { family: 'verre', paint: GLAZED };
      return undefined;
    case 'batiment':
    case 'cour':
      if (t === 'toit' || t === 'tuile') return roofOf(c, at);
      if (t === 'verre') return isWindow(c, at) ? undefined : { family: 'verre', paint: GLAZED };
      return undefined;
    case 'lieu':
      return placeOf(c, ctx);
  }
}
