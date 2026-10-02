// Le kit des Premiers Rivages (6e, lot 7b d'Archipéo), la référence des autres archipels : l'intention du directeur
// artistique du 30 septembre 2026 (avis « Aligné », docs/univers/archipeo/cadrage.md, « L'intention du 6e »).
// - Le bois : le colombage (poteaux #795643 sur un remplissage crème #D8D9C9, peint, 0 triangle) ; bardé (#B1815E) aux
//   pignons (et, en attente, sur les bâtiments de bois du quai : `bardes`) ; des pilotis (#6E4C30) là où il touche
//   l'eau et où le sol manque dessous.
// - La pierre : un mur plein, de sa matière ; le soubassement et le chaperon en pierre #8A8F84.
// - Les toits : les pentes de ./toits.ts, dans la couverture de leur île (world/toits.ts : ardoise, ou terre cuite à la
//   Ferme et à la Mine).
// - L'école, la salle des trophées et la Halle aux matériaux (décision du directeur artistique, 30 septembre 2026 : des
//   lieux du village, au milieu des maisons) : leurs murs en colombage, leurs toits en pentes (`LIEUX_6E`).
// Le verre et les lanternes ne deviennent jamais des pièces ; les monuments gardent leurs blocs taillés.
import { boiteDansLaCase, type DessinDePiece, type Facette } from '../pieces';
import { MOTIF } from '../peinture';
import { piecesDeToit } from '../toits';
import type { IdDeMur, Forme, Tete } from '../choix';
import type { VillagePlaceId } from '../../cube';
import { estUnPilier } from '../../salle';
import { HALLE } from '../../terrain';
import type { CaseDuLieu, Kit, LieuDuKit } from './types';

/** La hauteur des pilotis sous le plancher : celle du soubassement, qu'ils remplacent. */
export const PILOTIS = { haut: 0.35, cote: 0.14 } as const;

/**
 * Un mur de bois sur pilotis : le plancher et le colombage au-dessus des pilotis (sa sablière basse posée sur eux), et
 * quatre poteaux aux coins de la case, jusqu'au bas de la case (le reste du pieu est dans l'eau).
 */
function surPilotis(tete: Tete): DessinDePiece {
  const motif = MOTIF.colombage | MOTIF.sabliereBasse | (tete === 'toit' ? MOTIF.sabliereHaute : 0) | (tete === 'chaperon' ? MOTIF.chaperon : 0);
  const corps = boiteDansLaCase(0, 1, 0, 1, PILOTIS.haut, 1, motif, 'remplissage');
  const c = PILOTIS.cote;
  const pieux: Facette[] = [];
  for (const [x0, y0] of [
    [0, 0],
    [1 - c, 0],
    [0, 1 - c],
    [1 - c, 1 - c],
  ])
    // Les quatre côtés d'un pieu (le dessus est sous le plancher, le dessous dans l'eau).
    pieux.push(...boiteDansLaCase(x0, x0 + c, y0, y0 + c, 0, PILOTIS.haut, 0, 'pilotis').facettes.filter((f) => f.normale[2] === 0));
  // Le dessus du corps : du chaperon s'il n'y a rien au-dessus.
  const facettes = corps.facettes.map((f) => (f.normale[2] > 0 && tete === 'chaperon' ? { ...f, motif: MOTIF.pierreEntiere } : f));
  return { facettes: [...facettes, ...pieux], couvre: corps.couvre };
}

function piecesSurPilotis(): Partial<Record<IdDeMur, DessinDePiece>> {
  const out: Partial<Record<IdDeMur, DessinDePiece>> = {};
  const formes: Forme[] = ['seul', 'bout', 'droit', 'angle', 'te', 'croix'];
  for (const tete of ['chaperon', 'toit', 'mur'] as const) {
    const d = surPilotis(tete);
    for (const forme of formes) out[`mur.${forme}.pilotis.${tete}`] = d;
  }
  return out;
}

/** Un pilier de la salle des trophées, lu par colonne (GD-3) : les bouts de la salle de départ et le bord de chaque travée. */
const pilier = ({ x, y, d }: CaseDuLieu) => estUnPilier(x, y, d);
/**
 * Les rangs de la halle du lieu où l'on assemble (world/terrain.ts, `atelierModel`, `HALLE`) : à partir de son premier
 * rang ; devant, la cour (la potence, le bloc suspendu, les blocs de la recette), qui reste en blocs.
 */
const dansLaHalle = ({ y }: CaseDuLieu) => y >= HALLE.rang;
/** La souche du clocheton de l'école : la case du toit sous lui, au milieu de la façade, au deuxième rang (schoolModel). */
const souche = ({ x, y, z, w }: CaseDuLieu) => x === (w - 1) / 2 && y === 1 && z === 5;

/**
 * Les lieux du village des Premiers Rivages (world/terrain.ts) :
 * - l'école : ses murs de brique aux coins de pierre de taille (les trois rangs posés sur le sol) en colombage, son toit
 *   à deux pans en pentes ; la porte, les deux fenêtres, le clocheton et sa cloche d'or restent des blocs, et la souche
 *   du clocheton prend sa pierre de taille : un seul fût de deux cases (décision du directeur artistique, 1er octobre) ;
 * - la salle des trophées : ses piliers de marbre en colombage, sans décharge (des piliers isolés : poteaux et
 *   sablières seulement), ceux de ses travées aussi (GD-3 : la halle s'allonge, une travée tous les six succès après
 *   les douze premiers) ; son toit de pierre de taille en pentes, dans la couverture de l'île, d'un seul tenant d'un
 *   bout à l'autre (le pignon au bout de la halle, aucun au milieu), et son faîte d'or en faîte, qui s'allonge avec
 *   elle ; le fond de velours (le fond des trophées), les socles de marbre et les trophées restent des blocs ;
 * - la Halle aux matériaux (le lieu où l'on assemble, dans son dessin d'Archipéo : `atelierModel('halle')`) : ses murs
 *   de bois sur leur rang de pierre en colombage (le rang de pierre devient le soubassement, comme aux maisons), son toit
 *   à deux pentes en pentes et son faîte ; la porte reste ouverte, et la cour (la potence, le bloc suspendu, les blocs de
 *   la recette) reste en blocs. Le dessin de Blocland (la Fabrique) n'est jamais repris : la construction taillée est
 *   celle d'Archipéo.
 */
export const LIEUX_6E: Partial<Record<VillagePlaceId, LieuDuKit>> = {
  school: (m) =>
    m.z <= 3 && (m.texture === 'brique' || m.texture === 'taille')
      ? { famille: 'bois' }
      : m.texture === 'toit' && souche(m)
        ? { matiere: 'taille' }
        : m.texture === 'toit'
          ? { famille: 'toit' }
          : undefined,
  trophies: (m) =>
    m.texture === 'marbre' && m.z <= 3 && pilier(m)
      ? { famille: 'bois', sansDecharge: true }
      : m.z === 4 && m.texture === 'taille'
        ? { famille: 'toit', couverture: true }
        : // Le faîte d'or, au rang du milieu : la salle a une profondeur impaire (TROPHY_SIZE, 3 cases), sinon il n'y en a pas.
          m.z === 5 && m.y === (m.d - 1) / 2 && m.texture === 'or'
          ? { famille: 'toit' }
          : undefined,
  assembly: (m) =>
    !dansLaHalle(m)
      ? undefined
      : m.z <= HALLE.haut && (m.texture === 'planches' || m.texture === 'pierre')
        ? { famille: 'bois' }
        : m.texture === 'toit'
          ? { famille: 'toit' }
          : undefined,
};

export const KIT_6E: Kit = {
  // La Ferme (terre) : le torchis d'un colombage, dans la famille du bois (décision du directeur artistique, 30/09).
  matieres: { planches: 'bois', terre: 'bois', pierre: 'pierre', galet: 'pierre', brique: 'pierre', obsidienne: 'pierre', toit: 'toit' },
  couleurs: { poteau: 0x795643, remplissage: 0xd8d9c9, soubassement: 0x8a8f84, chaperon: 0x8a8f84, bardage: 0xb1815e, pilotis: 0x6e4c30 },
  murs: { bois: 'colombage', pierre: 'plein' },
  // En attente (décision du directeur artistique, 30/09) : au 6e, le bardage reste aux pignons. Les îles au quai ou au
  // ponton (la Baie, la Rivière, la Tour) n'ont aucun mur de bois (la cabine de la Baie reste en blocs) : la règle attend
  // les bâtiments de bois qu'on y posera.
  bardes: ['english-6e-vocabulary', 'maths-6e-fractions', 'french-6e-reading'],
  pieces: { toit: piecesDeToit(), bois: piecesSurPilotis() },
  lieux: LIEUX_6E,
};
