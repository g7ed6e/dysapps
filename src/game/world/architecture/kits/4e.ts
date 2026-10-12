// Le kit des Anciens Ateliers (4e) : l'intention du directeur artistique du 10 octobre 2026 (« le 4e et le 3e d'Archipéo
// au niveau du 6e et du 5e », docs/univers/archipeo/cadrage.md, « Le 4e et le 3e »). Tout est peint ; une seule lueur
// s'ajoute, celle de la fin d'un grand projet (world/construction/endGlow.ts). Le code commun du 6e et du 5e
// (./shared.ts, ../heart.ts) fait le reste : liaisons et jetée, quai, Gardien et son socle, décor du cœur, mares,
// barrière, porte, marche, toits des bâtiments, verre hors d'un mur, lissage des monuments et des petites constructions.
// - Les familles (../families.ts) : l'ardoise, le grès, le pavé et la fresque en pierre ; le quartz et le pétale (un
//   enduit rose) en pierre ; l'osier, le liège et le bardeau en bardage ; le métal (acier, rail, fonte, conteneur, bobine,
//   engrenage, ressort) en tôle teintée (`tintedSheet` : la tôle dans la teinte de sa matière, ses joints à ×0,8), l'aimant
//   gardant le zinc `tole` ; le calque (une verrière dépolie : le bureau d'Ixe) et le miroir en verrière ; le parchemin en
//   toile tendue ; le velours en tenture dans un mur de bâtiment (la loge de Puck), en volume lissé uni ailleurs (les
//   gradins de l'amphithéâtre) ; le pétale seul au sol en plate-bande dans sa teinte.
// - Les couleurs (la fiche du 4e, chaude, fin de journée) : poteaux #884D40, remplissage #D2C1A2 (80 d'écart avec Brume,
//   au lieu de 70 pour le #D9C7A8 du 6e), soubassement et chaperon #534E51, la pierre des lieux #6F473D (`masonry`),
//   bardage #9C7C4B, pilotis #6E4C30 ; galon, nappe, liseré, flanc, feuille et paille comme au 5e.
// - Les lieux : l'école et les piliers de la salle des trophées en mur plein #6F473D ; la Halle en colombage ; les toits
//   dans la couverture de l'île (ardoise #3E3636 ou terre cuite).
// - Le Jardin des heures (LV2-4) n'a pas de colombage (docs/univers/archipeo/intentions/4e-anciens-ateliers.md, §7) : ses
//   bâtiments de bois sont bardés (`bardes`).
// - Les pièges du 6e et du 5e, évités : le port est celui du 4e (`postsOf('4e')`) ; aucune étape de plan n'est lue sur un
//   autre archipel ; les grands projets (le portique des docks, la tour des signaux) se lisent pièce par pièce par le
//   lissage, fantômes compris (le soubassement par colonne ne change pas pendant le chantier).
// - L'écart au fantôme (le référent dys) : le marbre, le calque, le verre, le quartz, la lentille, la pierre de taille, la
//   fresque, la toile, l'acier et le parchemin sont tenus à 70 au moins de Brume (`ghostApart`).
// - Les objets dessinés (la piste 3 « hybride » au 4e, intention du directeur artistique du 12 octobre 2026) : les pièces
//   communes des cours dans les couleurs du kit (le poteau #6E4C30, les lisses #884D40, la pierre #534E51, la dalle de grès
//   clair #C9B79A, le fer, l'ardoise #3E3636 et les vitres de la lanterne), les trophées, le quai, les lieux du village
//   (leurs chaînes, leur corniche, leurs chapiteaux dans le grès clair #C9B79A, `placeTrim` : la pierre sombre du
//   soubassement ne se lisait pas sur la brique), les petites constructions et le décor du cœur (world/objects/).
// Le verre et les lanternes ne deviennent jamais des pièces.
import { materialsOf } from '../families';
import { bacDePierre, PIECE_SEULE_ET_BASSE } from '../lowPieces';
import { restOf } from '../heart';
import { piecesDeToit } from '../roofs';
import { bedWhenAlone, FINISHES, piecesSurPilotis, postsOf, veloursOf, villagePlaces } from './shared';
import { yardPiecesOf } from '../yardPieces';
import type { Kit } from './types';

// Les pièces communes de la cour (../yardPieces.ts), comme au 6e et au 5e : la barrière, la marche et la lanterne sur
// poteau de toutes les cours des Anciens Ateliers.
const YARD = yardPiecesOf('4e', FINISHES);

export const KIT_4E: Kit = {
  // La table commune, pour les familles que le kit dessine, et le velours (le précieux des murs et des gradins).
  matieres: { ...materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']), velours: 'precieux' },
  couleurs: {
    poteau: 0x884d40,
    remplissage: 0xd2c1a2,
    soubassement: 0x534e51,
    chaperon: 0x534e51,
    bardage: 0x9c7c4b,
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
    masonry: 0x6f473d,
    // Le grès clair des lieux du village dessinés (chaînes, corniche, appuis, clocheton, bases et chapiteaux : 3,8:1 sur
    // la brique, là où la pierre sombre #534E51 n'en tenait que 1,1).
    placeTrim: 0xc9b79a,
    // Les pièces de la cour et des objets dessinés (intention du directeur artistique du 12 octobre 2026) : le poteau et
    // les lisses de la barrière, la pierre sombre (le pied de la lanterne, les côtés de la marche), la dalle de grès clair,
    // le fer et l'ardoise du 4e (le toit de la lanterne), ses vitres (allumées la nuit, sans clignoter).
    yardPost: 0x6e4c30,
    yardRail: 0x884d40,
    yardStone: 0x534e51,
    yardSlab: 0xc9b79a,
    lanternFrame: 0x3a2a22,
    lanternRoof: 0x3e3636,
    lanternGlass: 0xe8c877,
  },
  murs: { colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tintedSheet', toile: 'cloth', verre: 'glazing' },
  // Le Jardin des heures : pas de colombage.
  bardes: ['lv2-4e-daily-life'],
  pieces: { toit: piecesDeToit(), colombage: piecesSurPilotis(), pierre: { [PIECE_SEULE_ET_BASSE]: bacDePierre() } },
  // La barrière en poteaux et lisses, la marche et la lanterne : dans les cours, les pièces communes (`YARD`).
  finitions: YARD.finitions,
  yardLantern: YARD.lanterne,
  // Les objets dessinés (world/fixtureModels.ts, world/objects/) : les petites constructions posées, le bloc d'or des
  // Gardiens rallumés, les objets du quai, le décor du cœur et les trois lieux de l'île-école, comme au 6e et au 5e.
  objetsDessines: true,
  // L'aimant garde le zinc ; le velours selon sa place ; le pétale seul au sol en plate-bande.
  byMaterial: { aimant: () => 'tole', velours: veloursOf('4e'), petale: bedWhenAlone },
  ghostApart: ['marbre', 'calque', 'verre', 'quartz', 'lentille', 'taille', 'fresque', 'toile', 'acier', 'parchemin'],
  // Les lieux du village (./shared.ts) : l'école et les piliers de la salle des trophées en mur plein de pierre ; la Halle
  // en colombage.
  lieux: villagePlaces({ school: { famille: 'pierre', dessin: 'masonry' }, pillars: { famille: 'pierre', dessin: 'masonry' } }),
  lissage: true,
  // Les poteaux de bois des liaisons et de la jetée du port des Anciens Ateliers.
  poteaux: postsOf('4e'),
  reste: restOf,
};
