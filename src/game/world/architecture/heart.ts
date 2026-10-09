// Le reste (intention du directeur artistique, 9 octobre 2026, lot « eau, quai, liaisons, cœur, barrière » au 6e, puis
// le lot du 5e) : le dessin de chaque bloc posé que ni le plan d'un bâtiment, ni sa cour, ni un monument, ni un lieu du village, ni les
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
// - Au 5e (les Collines du Large, le même reste : ce qui suit n'est posé ni au 6e ni ailleurs) : les auvents (la toile du
//   Marché, la tuile du Comptoir) en nappes minces, la toile ou la tuile seule au sol en ballot ; la tour de lambris du
//   Manoir comme la cabine (bardée, son chapeau) ; le thermomètre et la stalagmite de glace, le rocher à strates en
//   piliers lissés ; les congères (le nuage), le tas de sel et les sacs de farine du Fournil en tas bas ; le rocher de
//   tuf de la Grotte en rocher ; le montoir de dalles et le plateau
//   d'enluminure en dalles ; la rizière en plate-bande ; les planches des panneaux indicateurs jusqu'à leur poteau ;
//   l'or en haut d'un poteau (les roseaux du Marais) en épi plus petit que sa case ; le pied de planches d'un pupitre en
//   caisse ; le verre posé sur un bloc (le thermomètre) en verrière ; l'escalier en marches ; dans une petite
//   construction, la tuile d'un toit comme le toit, celle posée sur la glace (la glacière) en couvercle mince.
// Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import type { Rotation } from './choices';
import { familyOf } from './families';
import { awning, beam, bead, cap, chalkLoaf, coneCorner, coneSide, coneStep, crate, darkPost, deck, dialSlab, EMPTY, foliage, hangingCrate, HEART, lid, mound, paddyBed, pavilion, reedHead, rock, signBoard, slab, snowDrift, spire, thermometerTube, trunk, waterNeighbours, waterSheet, wheat } from './heartPieces';
import type { RestContext, RestDrawing } from './kits/types';
import { stepOf, woodenPost } from './lowPieces';
import { SIDES } from './neighborhood';
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
/** La case du sommet du cône des Décimaux, quand elle n'est pas sur un cône entier : la braise mate. */
const EMBER = uniform('braise', 0, 0);

/** Les six voisines d'une case : ses quatre côtés (`SIDES`), puis dessus et dessous. */
const DIRS6: readonly (readonly [number, number, number])[] = [...SIDES.map(([x, y]) => [x, y, 0] as const), [0, 0, 1], [0, 0, -1]];

/** Ce qu'une pierre bâtie porte : un cadran, de l'or, une lanterne. */
const BUILT_ON = new Set(['cadran', 'or', 'lanterne']);

const tex = (c: VoxelCube | undefined) => (c ? (c.texture ?? 'couleur') : undefined);
const keyOf = (c: VoxelCube) => `${c.x},${c.y},${c.z}`;

/** Les cases d'une même matière reliées à `c` (de face en face, au plus `max`). */
function sameMaterial(c: VoxelCube, at: RestContext['at'], max = 64): VoxelCube[] {
  const t = tex(c);
  const seen = new Set<string>([keyOf(c)]);
  const out = [c];
  for (let i = 0; i < out.length && out.length < max; i++) {
    const d = out[i];
    for (const [dx, dy, dz] of DIRS6) {
      const n = at(d.x + dx, d.y + dy, d.z + dz);
      if (!n || tex(n) !== t) continue;
      const k = keyOf(n);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

/**
 * Le cône des Décimaux, lu sur son volume de pierre : une première rangée de 3 × 3 autour de son axe, une colonne sur
 * l'axe jusqu'à `top`, de l'or juste au-dessus (la braise).
 */
interface Cone {
  x: number;
  y: number;
  base: number;
  top: number;
}

/** Le verdict d'un volume de pierre, retenu pour chacune de ses cases. */
interface StoneVolume {
  /** Il porte un cadran, de l'or ou une lanterne : un pilier (l'Horloge, la pile du feu de port), pas un rocher. */
  built: boolean;
  cone: Cone | null;
}

/** Les verdicts déjà rendus, par monde lu (`at` : un par construction) et par case. */
const volumes = new WeakMap<RestContext['at'], Map<string, StoneVolume>>();

/** Le volume de pierre d'une case : son verdict, calculé une fois pour toutes ses cases. */
function stoneVolume(c: VoxelCube, at: RestContext['at']): StoneVolume {
  let known = volumes.get(at);
  if (!known) volumes.set(at, (known = new Map()));
  const v = known.get(keyOf(c));
  if (v) return v;
  const cells = sameMaterial(c, at);
  const out: StoneVolume = { built: cells.some((d) => BUILT_ON.has(tex(at(d.x, d.y, d.z + 1)) ?? '')), cone: coneOf(cells, at) };
  for (const d of cells) known.set(keyOf(d), out);
  return out;
}

/** Le cône d'un volume de pierre, s'il en a exactement la forme (sinon il reste un pilier lissé). */
function coneOf(cells: readonly VoxelCube[], at: RestContext['at']): Cone | null {
  const tops = cells.filter((d) => tex(at(d.x, d.y, d.z + 1)) === 'or');
  if (tops.length !== 1) return null;
  const t = tops[0];
  const base = Math.min(...cells.map((d) => d.z));
  if (t.z <= base || cells.length !== 9 + (t.z - base)) return null;
  const fits = cells.every((d) => (d.z === base ? Math.abs(d.x - t.x) <= 1 && Math.abs(d.y - t.y) <= 1 : d.x === t.x && d.y === t.y && d.z <= t.z));
  return fits ? { x: t.x, y: t.y, base, top: t.z } : null;
}

/** La largeur de la cheminée du cône à `h` cases au-dessus de sa première rangée (de 1 à `HEART.cone.top` au sommet). */
function coneWidth(k: Cone, h: number): number {
  const height = k.top - k.base + HEART.cone.ember;
  return 1 - ((1 - HEART.cone.top) * h) / height;
}

/** Le quart de tour d'un pan de la jupe (vers +x, +y, −x, −y) et d'un coin (+x +y, −x +y, −x −y, +x −y). */
const SIDE_TURN = new Map<string, Rotation>([
  ['1,0', 0],
  ['0,1', 1],
  ['-1,0', 2],
  ['0,-1', 3],
]);
const CORNER_TURN = new Map<string, Rotation>([
  ['1,1', 0],
  ['-1,1', 1],
  ['-1,-1', 2],
  ['1,-1', 3],
]);

/**
 * Une pierre du cône des Décimaux : sur la première rangée, le cœur en pilier (caché), les bords en pans de jupe, les
 * coins en croupes ; au-dessus, la cheminée en troncs de pyramide qui se resserrent.
 */
function coneStone(c: VoxelCube, k: Cone): RestDrawing {
  if (c.z > k.base) return { family: 'pierre', piece: coneStep(coneWidth(k, c.z - k.base - 1), coneWidth(k, c.z - k.base), 1, false) };
  const d = `${c.x - k.x},${c.y - k.y}`;
  const side = SIDE_TURN.get(d);
  if (side !== undefined) return { family: 'pierre', piece: coneSide(), rotation: side };
  const corner = CORNER_TURN.get(d);
  if (corner !== undefined) return { family: 'pierre', piece: coneCorner(), rotation: corner };
  return { family: 'pierre', paint: PILLAR };
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

/** Les tours bardées du cœur, coiffées d'un chapeau sombre : la cabine (6e), la tour de lambris du Manoir (5e). */
const CLAD_TOWERS = new Set(['cabine', 'lambris']);

/**
 * L'auvent du cœur (la toile du Marché, la tuile du Comptoir) : une nappe mince en haut de sa case quand une voisine de
 * même matière le prolonge ; seule (la toile ou la pile de tuiles posée au sol), un ballot plus petit que sa case, la
 * toile en plis de tenture, la tuile en clins.
 */
function awningOf(c: VoxelCube, at: RestContext['at']): RestDrawing {
  if (hasSideNeighbour(c, at)) return { family: 'toile', piece: awning() };
  return crateOf(c, at, tex(c) === 'toile' ? MOTIF.plein | MOTIF.vertical : MOTIF.bardage);
}

/**
 * Le panneau d'un poteau indicateur (le panneau posé contre un poteau de bois, à la même hauteur) : une planche mince
 * jusqu'à lui ; ailleurs (posé au sol), une caisse bardée.
 */
function signOf(c: VoxelCube, at: RestContext['at']): RestDrawing {
  const post = SIDES.find(([dx, dy]) => tex(at(c.x + dx, c.y + dy, c.z)) === 'tronc');
  return post ? { family: 'bardage', piece: signBoard(post) } : crateOf(c, at, MOTIF.bardage);
}

/** Le décor du cœur d'une île, le quai, le Gardien. */
function heartOf(c: VoxelCube, at: RestContext['at']): RestDrawing | undefined {
  const above = at(c.x, c.y, c.z + 1);
  const below = at(c.x, c.y, c.z - 1);
  switch (tex(c)) {
    case 'planches':
      // Le bouchon d'un poteau de la jetée (sa lanterne pas encore allumée) : le poteau continue ; posé au sol sous un
      // autre bloc (le pied du pupitre du Bourg, 5e), une caisse qui le porte ; sinon, le tablier.
      if (tex(below) === 'tronc') return { family: 'vegetal', piece: woodenPost(!above) };
      if (!below && above && !['planches', 'lanterne', 'escalier', 'marche'].includes(tex(above) ?? '')) return crateOf(c, at, MOTIF.bardage);
      return deckOf(c, at);
    case 'pierre': {
      if (tex(above) === 'or' && !below) return { family: 'pierre', paint: CAPPED };
      const v = stoneVolume(c, at);
      if (v.cone) return coneStone(c, v.cone);
      if (v.built) return { family: 'pierre', paint: PILLAR };
      return { family: 'pierre', piece: rock(seedOf(c), false) };
    }
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
      if (t === 'pierre' && below) {
        // Le sommet du cône : la dernière case de sa cheminée, son dessus seul en braise, ses flancs de pierre.
        const k = stoneVolume(below, at).cone;
        if (k) return { family: 'precieux', piece: coneStep(coneWidth(k, k.top - k.base), HEART.cone.top, HEART.cone.ember, true) };
      }
      if (t === 'pierre' && tex(at(c.x, c.y, c.z - 2)) === 'pierre') return { family: 'precieux', paint: EMBER };
      if (!below) return { family: 'vegetal', piece: wheat() };
      // En haut d'un poteau de bois (les roseaux du Marais, 5e) : un épi plus petit que sa case.
      if (t === 'tronc') return { family: 'vegetal', piece: reedHead() };
      // En haut du tube du thermomètre (le Glacier, 5e) : le même épi, plus petit que sa case, et non un cube d'or.
      if (t === 'verre' && tex(at(c.x, c.y, c.z - 2)) === 'glace') return { family: 'precieux', piece: reedHead() };
      return { family: 'precieux', paint: GOLD };
    }
    case 'cabine':
    case 'lambris':
      return tex(above) === tex(c) || tex(below) === tex(c) ? { family: 'bardage', paint: CLAD } : crateOf(c, at, MOTIF.bardage);
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
      // Posé sur un autre bloc : une verrière ; sur la glace (le thermomètre du Glacier, 5e), son tube de verre uni ; au
      // sol, une mare.
      if (isWindow(c, at)) return undefined;
      if (tex(below) === 'glace') return { family: 'verre', piece: thermometerTube() };
      return below && tex(below) !== 'verre' ? { family: 'verre', paint: GLAZED } : waterOf(c, at, HEART.water.pond);
    // Le 5e.
    case 'glace':
    case 'strate':
      return { family: 'pierre', paint: PILLAR };
    case 'nuage':
      return { family: 'pierre', piece: snowDrift() };
    case 'sel':
      // Le tas : ce qui porte un autre sel en pilier lissé, chaque sommet en tas bas.
      return tex(above) === 'sel' ? { family: 'pierre', paint: PILLAR } : { family: 'pierre', piece: mound() };
    case 'dalle':
      return { family: 'pierre', piece: slab(HEART.slab.mounting) };
    // Les sacs de farine du Fournil (EMC 5e) : des tas bas ; le rocher de tuf de la Grotte (latin-grec 5e) : un rocher.
    case 'farine':
      return { family: 'pierre', piece: mound() };
    case 'tuf':
      return { family: 'pierre', piece: rock(seedOf(c), false) };
    case 'enluminure':
      return { family: 'colombage', piece: slab(HEART.slab.desk) };
    case 'riziere':
      return { family: 'colombage', piece: paddyBed() };
    case 'escalier':
      return { family: 'finition', piece: stepOf(above !== undefined) };
    case 'toile':
    case 'tuile':
      return awningOf(c, at);
    case 'panneau':
      return signOf(c, at);
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
  // Le chapeau d'une tour bardée ; sous la bougie de la tour du Manoir (5e), de toute sa case, peint.
  if (tex(below) === 'lambris' && above) return { family: 'bardage', paint: PILLAR };
  if (CLAD_TOWERS.has(tex(below) ?? '')) return { family: 'bardage', piece: cap() };
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

/** Le reste : le dessin d'un bloc que rien d'autre ne prend (voir l'en-tête), ou `undefined`. Les kits du 6e et du 5e. */
export function restOf(c: VoxelCube, ctx: RestContext): RestDrawing | undefined {
  const { origin, at } = ctx;
  const t = c.texture;
  switch (origin) {
    case 'coeur':
      return heartOf(c, at);
    case 'liaison':
      return t === 'planches' ? deckOf(c, at) : undefined;
    case 'petite':
      if (t === 'eau') return waterOf(c, at, HEART.water.level);
      // Un toit seul : un pavillon ; une rangée de toits (qui ne fait pas de pente) : un toit plat, peint dans la couverture
      // (la tuile, dans sa matière : le toit de la cabane de Frimas, au 5e).
      // Une tuile posée sur la glace, rien dessus (le couvercle de la glacière, au 5e) : un couvercle mince.
      // Une rangée le long de x : un quart de tour, pour qu'elle se dessine d'un seul tenant (./assembly.ts).
      if (t === 'tuile' && tex(at(c.x, c.y, c.z - 1)) === 'glace' && !at(c.x, c.y, c.z + 1)) {
        const alongX = [1, -1].some((dx) => tex(at(c.x + dx, c.y, c.z)) === 'tuile');
        return { family: 'toit', piece: lid(), rotation: alongX ? 1 : 0 };
      }
      if (t === 'toit' || t === 'tuile') return hasSideNeighbour(c, at) ? roofOf(c, at) : { family: 'toit', piece: pavilion() };
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
