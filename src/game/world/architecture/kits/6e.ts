// Le kit des Premiers Rivages (6e, lot 7b d'Archipéo), la référence des autres archipels : l'intention du directeur
// artistique du 30 septembre 2026 (avis « Aligné », docs/univers/archipeo/cadrage.md, « L'intention du 6e »).
// - Le bois : le colombage (poteaux #795643 sur un torchis crème chaud #D9C7A8, peint, 0 triangle : le crème froid
//   #D8D9C9, tiré de 35 % vers le Sable #DAA66A, pour qu'il se lise chaud à l'ombre et non gris-bleu, loin du fantôme
//   Brume #E5EBE3 ; retouches du directeur artistique, 8 octobre 2026) ; bardé (#B1815E) aux
//   pignons (et, en attente, sur les bâtiments de bois du quai : `bardes`) ; des pilotis (#6E4C30) là où il touche
//   l'eau et où le sol manque dessous.
// - La pierre : un mur plein, de sa matière ; le soubassement en pierre #8A8F84, au pied d'un mur d'au moins trois
//   rangées seulement ; le chaperon, mince, dans une teinte plus sombre de sa matière (retouches du 8 octobre 2026).
// - Les toits : les pentes de ./roofs.ts, dans la couverture de leur île (world/roofs.ts : ardoise, ou terre cuite à la
//   Ferme et à la Mine).
// - L'école, la salle des trophées et la Halle aux matériaux (décision du directeur artistique, 30 septembre 2026 : des
//   lieux du village, au milieu des maisons) : leurs murs en colombage, leurs toits en pentes (`villagePlaces`, ./shared.ts).
// - La table commune « matière → famille » (../families.ts, décision du mainteneur du 8 octobre 2026) : le colombage
//   (planches, terre, poutre, chaume), le bardage (cabine, carton : des clins dans la teinte de la matière, chaperon de
//   pierre ; le bois des monuments et des petites constructions aussi, dans le brun du kit), la pierre (un mur plein
//   dans sa teinte ; seule et basse, un bac dans sa teinte, cerné d'un rebord gris), le toit (toit, tuile), la finition
//   (la porte en vantail dans son encadrement, la marche basse dans la teinte de sa matière :
//   ../lowPieces.ts ; la barrière en poteaux et lisses, depuis le 9 octobre 2026). Les monuments, la cour des îles et les petites constructions des
//   commandes et des quêtes la prennent aussi (../index.ts).
// - Le métal, le précieux et le végétal (intention du directeur artistique, 9 octobre 2026 ; mot du mainteneur,
//   « on continue ») : l'aimant en tôle peinte (plaques zinc clair #A4AAB0, joints verticaux #7E848A tous les quarts de
//   case, mats ; soubassement à partir de trois rangées, chaperon mince sans toit, aux pignons aussi ; seule et basse,
//   une jardinière reste un cube peint : le bac coûte 18 triangles, le cube 10) ; le velours du fond de la salle des
//   trophées en tenture peinte (plis, galon d'or #CCA22E) ; la cloche de l'école en tronc de pyramide d'or (../precious.ts),
//   les trophées d'or et de cristal en lingot et en cristal (world/construction.ts) ; les poteaux de bois des liaisons
//   et de la jetée en poteaux carrés (`poteaux`). Toile, feuilles, herbe, mousse, sapin et eau : aucun n'est posé par
//   un plan au 6e.
// - Le reste (intention du directeur artistique, 9 octobre 2026, `reste` : ../heart.ts) : le décor du cœur des îles (un
//   volume par matière, peint ; les rochers, petits arbres et buissons des formes communes), le quai et les tabliers
//   des liaisons, l'eau en nappe, les pavillons des petites constructions, les toits cachés et plats peints dans la
//   couverture, le verre hors d'un mur en verrière, la cour de la Halle, la porte et le fût de l'école, les socles de
//   la salle des trophées.
// Le verre et les lanternes ne deviennent jamais des pièces.
import { materialsOf } from '../families';
import { bacDePierre, PIECE_SEULE_ET_BASSE } from '../lowPieces';
import { restOf } from '../heart';
import { piecesDeToit } from '../roofs';
import { FINISHES, piecesSurPilotis, postsOf, villagePlaces } from './shared';
import type { Kit } from './types';

export const KIT_6E: Kit = {
  // La table commune, pour les familles que le kit dessine (la Ferme, en terre : le torchis d'un colombage, décision du
  // directeur artistique du 30/09).
  matieres: materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal']),
  couleurs: {
    poteau: 0x795643,
    remplissage: 0xd9c7a8,
    soubassement: 0x8a8f84,
    chaperon: 0x8a8f84,
    bardage: 0xb1815e,
    pilotis: 0x6e4c30,
    tole: 0xa4aab0,
    joint: 0x7e848a,
    galon: 0xcca22e,
    // Le reste (../heart.ts, 9 octobre 2026) : la braise mate, l'eau en nappe (dessus, liseré Brume, flancs), le
    // nénuphar, la paille du blé.
    braise: 0xc0764a,
    nappe: 0x178078,
    lisere: 0xe5ebe3,
    flanc: 0x142b38,
    feuille: 0x4e8f36,
    paille: 0xe8c66f,
  },
  murs: { colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tole' },
  // En attente (décision du directeur artistique, 30/09) : au 6e, le bardage reste aux pignons. Les îles au quai ou au
  // ponton (la Baie, la Rivière, la Tour) n'ont aucun mur de bois (la cabine de la Baie reste en blocs) : la règle attend
  // les bâtiments de bois qu'on y posera.
  bardes: ['english-6e-vocabulary', 'maths-6e-fractions', 'french-6e-reading'],
  pieces: { toit: piecesDeToit(), colombage: piecesSurPilotis(), pierre: { [PIECE_SEULE_ET_BASSE]: bacDePierre() } },
  // La barrière en poteaux et lisses (`barriereDe`), branchée le 9 octobre 2026 : elle tient dans l'enveloppe.
  finitions: FINISHES,
  // Les lieux du village (./shared.ts) : les murs de brique et de pierre de taille de l'école, et les piliers de marbre
  // de la salle des trophées (sans décharge), en colombage.
  lieux: villagePlaces({ school: { famille: 'colombage' }, pillars: { famille: 'colombage' } }),
  // Le lissage (mot du mainteneur, 8 octobre 2026) : un volume par matière dans les monuments, les petites
  // constructions, les cours et les piliers du cœur.
  lissage: true,
  // Les poteaux de bois des liaisons et de la jetée des Premiers Rivages (./shared.ts).
  poteaux: postsOf('6e'),
  // Le reste (intention du directeur artistique, 9 octobre 2026) : le décor du cœur, le quai, les tabliers, l'eau, les
  // toits cachés, le verre hors d'un mur, la cour de la Halle, la porte et le fût de l'école, les socles de la salle.
  reste: restOf,
};
