// Le kit des Îles du Ciel (3e) : l'intention du directeur artistique du 10 octobre 2026 (« le 4e et le 3e d'Archipéo au
// niveau du 6e et du 5e », docs/univers/archipeo/cadrage.md, « Le 4e et le 3e »). Tout est peint ; une seule lueur
// s'ajoute, celle de la fin d'un grand projet (world/construction/endGlow.ts). Le code commun du 6e et du 5e
// (./shared.ts, ../heart.ts) fait le reste.
// - Ni colombage ni pilotis (docs/univers/archipeo/intentions/3e-iles-du-ciel.md, §7 : « le village à colombages » est
//   interdit) : les bâtiments de bois de toutes les îles sont bardés (`bardes`), la Halle aussi, sur un rang de pierre de
//   taille ; aucune pièce sur pilotis.
// - Les familles (../families.ts) : le grès, le savon et la cire en pierre ; le quartz en mur plein (le dôme de Stat) ;
//   le bardeau (les murs du Refuge, en clins ; ni balcon ni toit de bardeau) et l'acajou en bardage ; le métal (antenne,
//   ressort, engrenage) et la reliure (la cuve du château d'eau, le fuselage de la fusée, le Kiosque des témoins) en tôle
//   teintée (`tintedSheet`), l'aimant gardant le zinc `tole` ; le prisme (les murs de la lanterne de Fi) et le miroir en
//   verrière ; le parchemin en toile tendue ; le laurier dans les formes communes.
// - Les couleurs : la pierre de taille du bâti #C2BBAD (`masonry`, 80 d'écart avec Brume ; le #DBDADD du lot 7 ne vaut
//   que pour le décor, le socle du grand phare), soubassement et chaperon #8C8F99, bardage #A1805E ; le dessus des toits
//   d'ardoise du bâti dans la neige #B3C1C7 (`snowyRoofs`, le rôle `snow`, 71 d'écart : l'ardoise enneigée de
//   world/roofs.ts est Brume lui-même) ; les rives #1C3440 (world/roofs.ts, inchangées) ; le reste comme au 5e.
// - Les lieux : l'école, les piliers de la salle des trophées et le rang de pierre de la Halle en mur plein #C2BBAD ; le
//   bois de la Halle bardé ; les toits enneigés.
// - Le temple de marbre : son toit de prismes, un anneau d'une rangée sans pente, peint à plat (`flat`) ; son faîte de
//   miroirs en verrière basse, d'un seul tenant (`monumentPieces`).
// - Les huit lanternons de la couronne du château d'eau : chacun en retrait de sa case (`insetBlocks`), un joint entre
//   deux voisins, pour qu'ils ne se fondent pas en un seul volume.
// - La coupole de lentilles de l'observatoire des étoiles : un toit en pavillon, comme le kiosque du 5e
//   (../hippedRoof.ts, `monumentPieces`). Le dôme de Stat reste en gradins lissés (son plan, de 5 sur 4, n'est pas carré :
//   le pavillon n'a qu'une demi-largeur).
// - Les pièges du 6e et du 5e, évités : le port est celui du 3e (`postsOf('3e')`) ; aucune étape de plan n'est lue sur un
//   autre archipel ; les grands projets (la fusée, le château d'eau, la colonne des solides) se lisent pièce par pièce par
//   le lissage, fantômes compris.
// - L'écart au fantôme (le référent dys) : le marbre, le quartz, le verre, la lentille, le miroir, la pierre de taille, le
//   prisme, la toile, le parchemin, le savon et l'antenne sont tenus à 70 au moins de Brume (`ghostApart`).
// - Les objets dessinés (la piste 3 « hybride » au 3e, intention du directeur artistique du 12 octobre 2026) : les pièces
//   communes des cours dans les couleurs du kit (le poteau #6E4C30, les lisses #795643, la pierre #8C8F99, la dalle de
//   pierre de taille #C2BBAD, le fer, les rives #1C3440 au toit de la lanterne, sans neige, et ses vitres), les trophées,
//   le quai, les lieux du village (la Halle en bardage seul, sans croix, sur son rang de pierre de taille ; leurs toits
//   enneigés, tournés vers le ciel dans la neige du kit, leurs rives #1C3440), les petites constructions et le décor du
//   cœur (world/objects/).
// Le verre et les lanternes ne deviennent jamais des pièces.
import { materialsOf } from '../families';
import { lowGlazing } from '../heartPieces';
import { hippedRoofPieces } from '../hippedRoof';
import { bacDePierre, PIECE_SEULE_ET_BASSE } from '../lowPieces';
import { restOf } from '../heart';
import { piecesDeToit } from '../roofs';
import { islandsOf } from '../../archipelago';
import type { VoxelCube } from '../../cube';
import { bedWhenAlone, FINISHES, postsOf, veloursOf, villagePlaces } from './shared';
import { yardPiecesOf } from '../yardPieces';
import type { Kit } from './types';

// Les pièces communes de la cour (../yardPieces.ts), comme au 6e et au 5e : la barrière, la marche et la lanterne sur
// poteau de toutes les cours des Îles du Ciel.
const YARD = yardPiecesOf('3e', FINISHES);

/** Le temple de marbre (world/monuments.ts) : son toit de prismes et son faîte de miroirs. */
const TEMPLE = 'monument:landmark-3e-2';

/** Le toit de prismes du temple, un anneau d'une rangée : peint à plat. */
const isFlat = (c: VoxelCube) => c.place === TEMPLE && c.texture === 'prisme';

/**
 * La coupole de lentilles de l'observatoire des étoiles (world/monuments.ts) : un toit en pavillon (../hippedRoof.ts),
 * comme le kiosque du 5e, sur son rang bas ; au faîte, la case du milieu du rang du dessus porte la verrière basse, où
 * se pose la grande lunette.
 */
const observatoryDome = hippedRoofPieces({ place: 'monument:landmark-3e-1', roofs: new Set(['lentille']), crown: { texture: 'lentille', rise: 1 } });

/** Les huit lanternons de prisme de la couronne du château d'eau (world/monuments.ts), chacun en retrait de sa case. */
const isLantern = (c: VoxelCube) => c.place === 'monument:landmark-3e-4' && c.texture === 'prisme';

/**
 * Ce que le kit dessine d'un seul tenant : le faîte de miroirs du temple, une verrière basse, une rangée d'un seul tenant
 * le long de x (un quart de tour) ; la coupole de l'observatoire des étoiles.
 */
function monumentPieces(c: VoxelCube, plan: readonly VoxelCube[]) {
  if (c.place === TEMPLE) return c.texture === 'miroir' ? { piece: lowGlazing(), rotation: 1 as const } : undefined;
  return observatoryDome(c, plan);
}

let toutesLesIles: readonly string[] | undefined;

export const KIT_3E: Kit = {
  // La table commune, pour les familles que le kit dessine, et le velours (le précieux des murs).
  matieres: { ...materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']), velours: 'precieux' },
  couleurs: {
    poteau: 0x795643,
    remplissage: 0xd9c7a8,
    soubassement: 0x8c8f99,
    chaperon: 0x8c8f99,
    bardage: 0xa1805e,
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
    masonry: 0xc2bbad,
    snow: 0xb3c1c7,
    // Les pièces de la cour et des objets dessinés (intention du directeur artistique du 12 octobre 2026) : le poteau et
    // les lisses de la barrière, la pierre grise (le pied de la lanterne, les côtés de la marche), la dalle de pierre de
    // taille du bâti, le fer, les rives du 3e au toit de la lanterne (sans neige : la pièce est trop petite), ses vitres
    // (allumées la nuit, sans clignoter).
    yardPost: 0x6e4c30,
    yardRail: 0x795643,
    yardStone: 0x8c8f99,
    yardSlab: 0xc2bbad,
    lanternFrame: 0x3a2a22,
    lanternRoof: 0x1c3440,
    lanternGlass: 0xe8c877,
  },
  murs: { colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tintedSheet', toile: 'cloth', verre: 'glazing' },
  // Ni colombage : le bois de toutes les îles est bardé (la Halle comprise, sur l'île-école). Lues au premier appel (la
  // carte des îles n'est lue qu'une fois le monde demandé, comme le port de `postsOf`).
  get bardes() {
    return (toutesLesIles ??= islandsOf('3e').map((b) => b.id));
  },
  // Ni pilotis : aucune pièce de colombage.
  pieces: { toit: piecesDeToit(), pierre: { [PIECE_SEULE_ET_BASSE]: bacDePierre() } },
  // La barrière en poteaux et lisses, la marche et la lanterne : dans les cours, les pièces communes (`YARD`).
  finitions: YARD.finitions,
  yardLantern: YARD.lanterne,
  // Les objets dessinés (world/fixtureModels.ts, world/objects/) : les petites constructions posées, le bloc d'or des
  // Gardiens rallumés, les objets du quai, le décor du cœur et les trois lieux de l'île-école, comme au 6e et au 5e.
  objetsDessines: true,
  byMaterial: { aimant: () => 'tole', velours: veloursOf('3e'), petale: bedWhenAlone },
  flat: isFlat,
  monumentPieces,
  insetBlocks: isLantern,
  ghostApart: ['marbre', 'quartz', 'verre', 'lentille', 'miroir', 'taille', 'prisme', 'toile', 'parchemin', 'savon', 'antenne'],
  snowyRoofs: true,
  // Les lieux du village (./shared.ts) : l'école, les piliers de la salle et le rang de pierre de la Halle en mur plein de
  // pierre de taille ; le bois de la Halle bardé.
  lieux: villagePlaces({
    school: { famille: 'pierre', dessin: 'masonry' },
    pillars: { famille: 'pierre', dessin: 'masonry' },
    assembly: { wood: { famille: 'colombage' }, stone: { famille: 'pierre', dessin: 'masonry' } },
  }),
  lissage: true,
  // Les poteaux de bois des liaisons et de la jetée du port des Îles du Ciel.
  poteaux: postsOf('3e'),
  reste: restOf,
};
