// Le kit des Collines du Large (5e) : l'intention du directeur artistique du 9 octobre 2026 (« le 5e d'Archipéo au
// niveau du 6e », docs/univers/archipeo/cadrage.md, « Le 5e »). Tout peint, aucune lueur nouvelle ; le code commun du 6e
// (./shared.ts, ../heart.ts) fait le reste : liaisons et jetée, quai, Gardien et son socle, décor du cœur, mares, barrière,
// porte, marche, toits des bâtiments, verre hors d'un mur, lissage des monuments et des petites constructions.
// - Les familles (../families.ts) : la glace, la dalle, la strate, le sel et la tourbe en pierre (un mur plein de leur
//   matière) ; le panneau et le lambris en bardage, le bambou en clins verticaux ; le vitrail en verrière (jamais une
//   pièce, sauf au lanterneau du kiosque, dessiné avec son toit) ; l'enluminure (le logis à étage en avancée) et la rizière (dans un mur, comme la terre de la Ferme) en
//   colombage ; la rizière seule au sol en plate-bande ; la toile en toile tendue (les plis de la tenture, sans galon).
// - Les couleurs : poteaux #795643, remplissage #D9C7A8, pilotis #6E4C30, galon #CCA22E, l'eau comme au 6e ; le
//   soubassement et le chaperon dans la pierre sombre du phare du large #66726F ; la pierre grise #7D8A86 des lieux du
//   village (`masonry`) ; la neige des congères #B3C1C7 (`snow`).
// - Les lieux : l'école et la salle des trophées en mur plein de pierre grise, leurs toits dans l'ardoise de l'île
//   (#224C5F) ; le reste comme au 6e (piliers par colonne, toit d'un seul tenant, faîte d'or, trophées plus petits que
//   leur case, tenture de velours) ; la Halle comme au 6e.
// - Les trois pièges du 6e, évités : une tuile se lit par sa place (dans les murs d'un bâtiment, ou portée par le sol ou
//   par un mur, c'est un mur plein ; dans les rangs d'un toit, un toit) ; les poteaux de la jetée sont ceux du port du
//   5e ; l'école est de pierre, pas de colombage de brique.
// - L'écart au fantôme (le référent dys) : la glace bâtie prend la glace du sol du 5e (palette.ts, #A6BAC2) ; le sel et
//   le dessus de la toile sont menés vers le gris neutre jusqu'à 70 d'écart RVB avec Brume (`ghostApart`) ; les congères
//   sont dans la neige du kit.
// - L'auvent rayé de l'échoppe du Marché (toile et ardoise, une colonne sur deux) et celui du Comptoir (tuile et terre
//   cuite) sont peints à plat (`flat`) ; le toit du kiosque est un toit en pavillon (../hippedRoof.ts, retouches du
//   9 octobre 2026, troisième tour : quatre grands pans, quatre petites croupes, sans redans), le damier peint dessus par
//   la matière de chaque colonne de son rang bas ; au faîte, une seule verrière basse dans le vitrail, plus claire que le
//   toit (`monumentPieces`). Tant que le toit n'est pas fini, ses cases posées restent peintes à plat. Ses poteaux de
//   tourbe en poteaux carrés de 0,3 case dans leur teinte (#44382A sur les côtés, sous le toit : sombres par la lumière,
//   pas par la couleur), son plancher de lambris bardé.
// Le verre et les lanternes ne deviennent jamais des pièces.
import { materialsOf } from '../families';
import { bacDePierre, PIECE_SEULE_ET_BASSE } from '../lowPieces';
import { restOf } from '../heart';
import { darkPost, HEART, paddyBed, slab } from '../heartPieces';
import { crownLantern, inCase, roofOverColumn, type HippedRoof } from '../hippedRoof';
import { piecesDeToit } from '../roofs';
import { etapesDe } from '../../construction/buildings';
import type { VoxelCube } from '../../cube';
import type { IdDePiece } from '../choices';
import type { DessinDePiece } from '../rooms';
import { FINISHES, piecesSurPilotis, postsOf, villagePlaces } from './shared';
import type { Kit } from './types';

/** Le kiosque à musique (world/monuments.ts) : son toit en damier de toile et de tuile, peint à plat. */
const KIOSQUE = 'monument:landmark-5e-2';
/**
 * Les échoppes (world/architect.ts : le Marché, de toile ; le Comptoir, de tuile) : l'auvent rayé de leur toit, peint à
 * plat (l'intention le dit du Marché ; le Comptoir le suit, pour que les deux échoppes se lisent pareilles).
 */
const ECHOPPES = new Set(['maths-5e-proportionality', 'english-5e-vocabulary']);

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Peint à plat : l'auvent rayé des échoppes (les rangs de leur toit), le toit en damier du kiosque. */
function isFlat(c: VoxelCube): boolean {
  if (c.place === KIOSQUE) return c.texture === 'toile' || c.texture === 'tuile';
  return ECHOPPES.has(c.tag ?? '') && !c.place && !c.petiteConstruction && etapesDe('5e', 1, 2).has(cle(c.x, c.y, c.z));
}

const ROOF_TEXTURES = new Set(['toile', 'tuile']);

/** Le toit du kiosque, lu sur son plan (fantômes compris) : le pavillon, ses cases, et les bouts de toit des coins coupés. */
interface KioskRoof {
  roof: HippedRoof;
  /** Les cases du plan du kiosque (clé `x,y,z`). */
  at: ReadonlyMap<string, VoxelCube>;
  /** Un bloc du toit est-il encore en fantôme ? (La verrière attend le toit fini.) */
  unfinished: boolean;
  /** Les colonnes vides des coins coupés que le bord du toit passe, par case du rang bas qui les porte. */
  corners: ReadonlyMap<string, readonly (readonly [number, number])[]>;
}

const kioskRoofs = new WeakMap<readonly VoxelCube[], KioskRoof | null>();

/** Le toit en pavillon du kiosque, d'après les cases de son rang bas (le centre, la demi-largeur, la coupe des coins). */
function kioskRoofOf(plan: readonly VoxelCube[]): KioskRoof | null {
  const known = kioskRoofs.get(plan);
  if (known !== undefined) return known;
  const at = new Map<string, VoxelCube>();
  for (const c of plan) if (Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z)) at.set(cle(c.x, c.y, c.z), c);
  const toit = [...at.values()].filter((c) => ROOF_TEXTURES.has(c.texture ?? ''));
  let out: KioskRoof | null = null;
  if (toit.length) {
    const base = Math.min(...toit.map((c) => c.z));
    const bas = toit.filter((c) => c.z === base);
    const cx = bas.reduce((s, c) => s + c.x + 0.5, 0) / bas.length;
    const cy = bas.reduce((s, c) => s + c.y + 0.5, 0) / bas.length;
    const half = Math.max(...bas.map((c) => Math.max(Math.abs(c.x + 0.5 - cx), Math.abs(c.y + 0.5 - cy)))) + 0.5;
    const cut = Math.max(...bas.map((c) => Math.abs(c.x + 0.5 - cx) + Math.abs(c.y + 0.5 - cy))) + 0.5;
    const roof: HippedRoof = { cx, cy, base, half, cut };
    // Les coins coupés : une colonne vide sous le bord du toit va à sa voisine vers le centre, le long de son plus grand écart.
    const corners = new Map<string, [number, number][]>();
    const dans = new Set(bas.map((c) => `${c.x},${c.y}`));
    const [x0, x1] = [Math.floor(cx - half), Math.ceil(cx + half)];
    const [y0, y1] = [Math.floor(cy - half), Math.ceil(cy + half)];
    for (let x = x0; x < x1; x++)
      for (let y = y0; y < y1; y++) {
        if (dans.has(`${x},${y}`) || !roofOverColumn(roof, x, y).length) continue;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const pas: [number, number][] = Math.abs(dx) >= Math.abs(dy) ? [[-Math.sign(dx), 0], [0, -Math.sign(dy)]] : [[0, -Math.sign(dy)], [-Math.sign(dx), 0]];
        const porteur = pas.map(([px, py]) => `${x + px},${y + py}`).find((k) => dans.has(k));
        if (!porteur) continue;
        const l = corners.get(porteur) ?? [];
        l.push([x, y]);
        corners.set(porteur, l);
      }
    out = { roof, at, unfinished: toit.some((c) => c.ghost), corners };
  }
  kioskRoofs.set(plan, out);
  return out;
}

/**
 * Le toit du kiosque d'un seul tenant : chaque case posée de son rang bas porte le toit en pavillon au-dessus de sa
 * colonne (et les bouts des coins coupés), sauf sous un fantôme (elle reste peinte à plat) ; une case du rang du dessus
 * ne dessine rien sur une case posée (le pavillon passe à travers) ; la case du milieu du lanterneau porte la verrière,
 * une fois le toit fini, les autres vitraux rien. `undefined` : le dessin ordinaire.
 */
function kioskPieces(c: VoxelCube, plan: readonly VoxelCube[]): DessinDePiece | null | undefined {
  if (c.place !== KIOSQUE) return undefined;
  const k = kioskRoofOf(plan);
  if (!k) return undefined;
  const { roof, at } = k;
  if (ROOF_TEXTURES.has(c.texture ?? '')) {
    if (c.z === roof.base) {
      const dessus = at.get(cle(c.x, c.y, c.z + 1));
      if (dessus?.ghost) return undefined;
      const facettes = [roofOverColumn(roof, c.x, c.y), ...(k.corners.get(`${c.x},${c.y}`) ?? []).map(([x, y]) => roofOverColumn(roof, x, y))].flat();
      return inCase(facettes, c.x, c.y, c.z);
    }
    const dessous = at.get(cle(c.x, c.y, roof.base));
    return dessous && !dessous.ghost ? null : undefined;
  }
  if (c.texture === 'vitrail' && !k.unfinished) {
    const milieu = c.x === Math.floor(roof.cx) && c.y === Math.floor(roof.cy) && c.z === roof.base + 2;
    return milieu ? inCase(crownLantern(roof), c.x, c.y, c.z) : null;
  }
  return undefined;
}

/** Ce qui fait masse sans être un toit, au-dessus d'une tuile : elle le porte, c'est un mur. */
const ROOFS = new Set(['toit', 'tuile', 'lanterne']);

/**
 * Une tuile posée en mur : dans un monument hors du toit du kiosque (la tour rayée du phare du large, son sommet) ; dans
 * les murs d'un bâtiment (la première étape de son plan : l'échoppe du Comptoir) ; dans une petite construction, portée
 * par le sol, par une tuile en mur, ou sous un mur qu'elle porte (le four de Vélin). Ailleurs (le couvercle de la
 * glacière, le toit de la cabane de Frimas, les rangs du toit de l'échoppe), un toit.
 */
function tileInWall(c: VoxelCube, plan: (x: number, y: number, z: number) => string | undefined): boolean {
  if (isFlat(c)) return false;
  if (c.place) return true;
  if (!c.petiteConstruction) return etapesDe('5e', 0, 1).has(cle(c.x, c.y, c.z));
  for (let z = c.z; ; z--) {
    const below = plan(c.x, c.y, z - 1);
    const above = plan(c.x, c.y, z + 1);
    if (z === c.z && above !== undefined && !ROOFS.has(above)) return true;
    if (below === undefined) return true;
    if (below !== 'tuile') return false;
  }
}

/** La forme d'un mur, lue sur le nom de sa pièce (`mur.forme.pied.tete`). */
const parts = (piece: IdDePiece) => piece.split('.');

/**
 * L'enluminure d'une petite construction : posée seule sur un pied (le plateau de l'écritoire de Vélin), une dalle ;
 * sinon (le coffre de Sillon), bardée dans sa teinte, et non dans le brun du kit.
 */
function enluminure(piece: IdDePiece, c: VoxelCube) {
  if (!c.petiteConstruction) return undefined;
  const [, forme, pied] = parts(piece);
  return forme === 'seul' && pied === 'haut' ? slab(HEART.slab.desk) : 'bardage';
}

/** Les poteaux de tourbe du kiosque (huit colonnes de trois cases) : des poteaux carrés de 0,3 case, dans leur teinte. */
function tourbe(piece: IdDePiece, c: VoxelCube) {
  const [, forme, , tete] = parts(piece);
  return c.place === KIOSQUE && forme === 'seul' ? darkPost(tete === 'chaperon') : undefined;
}

/** La rizière seule au sol (rien dessus, au pied : la cour du moulin du Delta) : une plate-bande. */
function riziere(piece: IdDePiece) {
  const [, , pied, tete] = parts(piece);
  return pied !== 'haut' && tete === 'chaperon' ? paddyBed() : undefined;
}

export const KIT_5E: Kit = {
  // La table commune, pour les familles que le kit dessine ; la verrière (le vitrail) et la toile tendue en plus du 6e.
  matieres: materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']),
  couleurs: {
    poteau: 0x795643,
    remplissage: 0xd9c7a8,
    soubassement: 0x66726f,
    chaperon: 0x66726f,
    bardage: 0xb1815e,
    pilotis: 0x6e4c30,
    tole: 0xa4aab0,
    joint: 0x7e848a,
    galon: 0xcca22e,
    braise: 0xc0764a,
    nappe: 0x178078,
    lisere: 0xe5ebe3,
    flanc: 0x142b38,
    feuille: 0x4e8f36,
    paille: 0xe8c66f,
    masonry: 0x7d8a86,
    snow: 0xb3c1c7,
  },
  murs: { colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tole', toile: 'cloth', verre: 'glazing' },
  bardes: [],
  pieces: { toit: piecesDeToit(), colombage: piecesSurPilotis(), pierre: { [PIECE_SEULE_ET_BASSE]: bacDePierre() } },
  finitions: FINISHES,
  byMaterial: { bambou: () => 'verticalBoards', riziere, enluminure, tourbe },
  tilesInWalls: tileInWall,
  flat: isFlat,
  monumentPieces: kioskPieces,
  ghostApart: ['glace', 'sel', 'toile'],
  // Les lieux du village (./shared.ts) : l'école et les piliers de la salle des trophées en mur plein de pierre grise.
  lieux: villagePlaces({ school: { famille: 'pierre', dessin: 'masonry' }, pillars: { famille: 'pierre', dessin: 'masonry' } }),
  lissage: true,
  // Les poteaux de bois des liaisons et de la jetée du port des Collines du Large.
  poteaux: postsOf('5e'),
  reste: restOf,
};
