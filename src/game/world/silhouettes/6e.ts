// Le relief de marche des Premiers Rivages (6e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../drawnModel/6e.ts (U2).
// La forme de chaque île (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026) : choisie à la main,
// d'après son sujet ou son nom (docs/gameplay/propositions/GD-12.md, §2), tournée pour garder la mer entre voisines.
// Son trait va jusqu'à sept cases du cœur (`FEATURE_BOX`, mainteneur, 8 octobre 2026) ; `short` le garde à cinq, pour
// un lieu au bord du cadre ou trop près d'une voisine de ce côté.
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_6E = {
  // La Forêt des sons, île-école : un galet, la clairière ronde autour de l'école.
  'french-6e-phonology': { pics: [], forme: { forme: 'galet', vers: 'devant' } },
  // La Ferme des accords : un trèfle, trois champs, trois enclos, ses deux lobes au fond (devant, à sept cases, ils
  // venaient à deux cases d'eau du Volcan).
  'french-6e-grammar-spelling': { pics: [], forme: { forme: 'trefle', vers: 'fond' } },
  // La Mine : un seul pic au fond de l'île, sur la pointe de sa goutte, où court le filon. Le coin du fond à gauche reste
  // carré : sa petite construction se tient contre lui.
  'french-6e-letter-confusion': { pics: [{ x: 9, y: 19, h: 7, r: 5 }], forme: { forme: 'goutte', vers: 'fond' }, squareCorners: ['fond-gauche'] },
  // La Tour du lecteur : une presqu'île, le bras à gauche, vers le large au bord de l'archipel ; la tour regarde loin,
  // au bout du chemin de lecture. Son îlot, l'observatoire, est sur la place libre à sa droite (monuments.ts). Au bord
  // du cadre, son bras reste à cinq cases.
  'french-6e-reading': { pics: [], forme: { forme: 'presquile', vers: 'gauche', short: true } },
  // La Carrière des mots : un haricot, le creux à droite, le front de taille.
  'french-6e-word-spelling': { pics: [], forme: { forme: 'haricot', vers: 'droite' } },
  // La Plaine des nombres, île-port : un croissant ouvert devant, la rade du Bloc-Navire.
  'maths-6e-calculation': { pics: [], forme: { forme: 'croissant', vers: 'devant', quai: true } },
  // La Rivière des fractions : une cacahuète, le petit lobe devant ; la rivière partage l'île en deux parts.
  'maths-6e-fractions': { pics: [], forme: { forme: 'cacahuete', vers: 'devant' } },
  // Le Volcan : un cône au fond de l'île, son cratère au centre, sur la pointe de sa goutte, qui reste à cinq cases :
  // à sept, elle venait à deux cases d'eau de la Ferme.
  'maths-6e-decimals': { pics: [{ x: 8, y: 19, h: 8, r: 6 }], forme: { forme: 'goutte', vers: 'fond', short: true } },
  // La Baie des mots : un croissant, la baie de son nom. Ouvert à gauche, vers le large au bord de l'archipel : à droite
  // (la proposition du cadrage), sa baie regardait l'Horloge, sa voisine, à quatre cases. Au bord du cadre, ses cornes
  // restent à cinq cases.
  'english-6e-vocabulary': { pics: [], forme: { forme: 'croissant', vers: 'gauche', short: true } },
  // L'Horloge des verbes : un galet, le cadran, son renflement devant (au fond, à sept cases, il sortait du cadre).
  'english-6e-grammar': { pics: [], forme: { forme: 'galet', vers: 'fond' } },
  // La Fouille des siècles : un haricot, le creux au fond ; le chantier de fouille entame le bord.
  'history-6e-antiquity': { pics: [], forme: { forme: 'haricot', vers: 'fond' } },
  // La Pointe des paysages : une presqu'île, le bras devant, à droite ; la pointe de son nom, un littoral.
  'geography-6e-living': { pics: [], forme: { forme: 'presquile', vers: 'devant' } },
  // La Vallée du vivant : une cacahuète, le petit lobe à gauche ; deux versants et la vallée au col.
  'life-earth-sciences-6e-living-world': { pics: [], forme: { forme: 'cacahuete', vers: 'gauche' } },
  // Le Laboratoire des éléments : un trèfle, les états de la matière côte à côte.
  'physics-chemistry-6e-matter-energy': { pics: [], forme: { forme: 'trefle', vers: 'fond' } },
  // Le Hangar des inventions : une presqu'île, le bras à droite ; la cale d'où sortent les inventions.
  'technology-6e-objects': { pics: [], forme: { forme: 'presquile', vers: 'droite' } },
  // Le Préau des délégués : un croissant ouvert devant, ses deux cornes en hémicycle autour de la baie, comme les
  // délégués assis en rond (proposition de l'artiste technique 3D, validée par le directeur artistique le 9 octobre 2026 ; l'autre
  // forme qui tient à sa place sans toucher le cadre : le galet, la cour ronde).
  'civics-6e-democratic-society': { pics: [], forme: { forme: 'croissant', vers: 'devant' } },
} satisfies Partial<Record<BiomeId, Silhouette>>;
