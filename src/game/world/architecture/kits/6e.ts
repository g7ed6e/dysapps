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
//   lieux du village, au milieu des maisons) : leurs murs en colombage, leurs toits en pentes (`LIEUX_6E`).
// - La table commune « matière → famille » (../families.ts, décision du mainteneur du 8 octobre 2026) : le colombage
//   (planches, terre, poutre, chaume), le bardage (cabine, carton : des clins dans la teinte de la matière, chaperon de
//   pierre ; le bois des monuments et des petites constructions aussi, dans le brun du kit), la pierre (un mur plein
//   dans sa teinte ; seule et basse, un bac dans sa teinte, cerné d'un rebord gris), le toit (toit, tuile), la finition
//   (la porte en vantail dans son encadrement, la marche basse dans la teinte de sa matière :
//   ../lowPieces.ts ; la barrière en poteaux et lisses attend le budget). Les monuments, la cour des îles et les petites constructions des
//   commandes et des quêtes la prennent aussi (../index.ts).
// - Le métal, le précieux et le végétal (intention du directeur artistique, 9 octobre 2026 ; mot du mainteneur,
//   « on continue ») : l'aimant en tôle peinte (plaques zinc clair #A4AAB0, joints verticaux #7E848A tous les quarts de
//   case, mats ; soubassement à partir de trois rangées, chaperon mince sans toit, aux pignons aussi ; seule et basse,
//   une jardinière reste un cube peint : le bac coûte 18 triangles, le cube 10) ; le velours du fond de la salle des
//   trophées en tenture peinte (plis, galon d'or #CCA22E) ; la cloche de l'école en tronc de pyramide d'or (../precious.ts),
//   les trophées d'or et de cristal en lingot et en cristal (world/construction.ts) ; les poteaux de bois des liaisons
//   et de la jetée en poteaux carrés (`poteaux`). Toile, feuilles, herbe, mousse, sapin et eau : aucun n'est posé par
//   un plan au 6e.
// Le verre et les lanternes ne deviennent jamais des pièces.
import { boiteDansLaCase, type DessinDePiece, type Facette } from '../rooms';
import { materialsOf } from '../families';
import { bacDePierre, marcheDe, PIECE_SEULE_ET_BASSE } from '../lowPieces';
import { bell } from '../precious';
import { dockPosts } from '../../harbor';
import { getArchipelago } from '../../archipelago';
import type { VoxelCube } from '../../cube';
import { MOTIF } from '../paint';
import { piecesDeToit } from '../roofs';
import type { IdDeMur, Forme, Tete } from '../choices';
import type { VillagePlaceId } from '../../cube';
import { estUnPilier } from '../../trophyHall';
import { HALLE } from '../../terrain';
import type { CaseDuLieu, Kit, LieuDuKit } from './types';

/** La hauteur des pilotis sous le plancher : celle du soubassement, qu'ils remplacent. */
const PILOTIS = { haut: 0.35, cote: 0.14 } as const;

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
/** La cloche, sur le fût du clocheton (la souche et la case au-dessus d'elle). */
const isBell = ({ x, y, z, w, texture }: CaseDuLieu) => x === (w - 1) / 2 && y === 1 && z === 7 && texture === 'or';
const BELL = bell();

/**
 * Les colonnes des poteaux de la jetée du port des Premiers Rivages (world/harbor.ts) : calculées au premier appel (la
 * carte des îles n'est lue qu'une fois le monde demandé), puis gardées.
 */
const jettyPosts = (() => {
  let memo: { port: string; cells: Set<string> } | undefined;
  return () => {
    if (!memo) {
      const port = getArchipelago('6e').port;
      memo = { port, cells: new Set(dockPosts(port).map((p) => `${p.x},${p.y}`)) };
    }
    return memo;
  };
})();
/**
 * Un poteau de bois que le kit dessine : celui d'une liaison (un bac, une lanterne à son bout) ou de la jetée du port.
 * Le décor du cœur des îles garde ses troncs (une autre pull request).
 */
function isPost(c: VoxelCube): boolean {
  if (c.bridge) return true;
  const jetty = jettyPosts();
  return c.tag === jetty.port && !c.decor && jetty.cells.has(`${c.x},${c.y}`);
}

/**
 * Les lieux du village des Premiers Rivages (world/terrain.ts) :
 * - l'école : ses murs de brique aux coins de pierre de taille (les trois rangs posés sur le sol) en colombage, son toit
 *   à deux pans en pentes ; la porte, les deux fenêtres et le fût du clocheton restent des blocs, et la souche du
 *   clocheton prend sa pierre de taille : un seul fût de deux cases (décision du directeur artistique, 1er octobre) ; sa
 *   cloche d'or, révisée le 9 octobre 2026, est un tronc de pyramide évasé posé sur le fût (../precious.ts) ;
 * - la salle des trophées : ses piliers de marbre en colombage, sans décharge (des piliers isolés : poteaux et
 *   sablières seulement), ceux de ses travées aussi (GD-3 : la halle s'allonge, une travée tous les six succès après
 *   les douze premiers) ; son toit de pierre de taille en pentes, dans la couverture de l'île, d'un seul tenant d'un
 *   bout à l'autre (le pignon au bout de la halle, aucun au milieu), et son faîte d'or en faîte, qui s'allonge avec
 *   elle ; le fond de velours (le fond des trophées), révisé le 9 octobre 2026, est une tenture peinte (ses plis, son
 *   galon d'or) ; les socles de marbre restent des blocs, et les trophées sont dessinés par world/construction.ts ;
 * - la Halle aux matériaux (le lieu où l'on assemble, dans son dessin d'Archipéo : `atelierModel('halle')`) : ses murs
 *   de bois sur leur rang de pierre en colombage (le rang de pierre devient le soubassement, comme aux maisons), son toit
 *   à deux pentes en pentes et son faîte ; la porte reste ouverte, et la cour (la potence, le bloc suspendu, les blocs de
 *   la recette) reste en blocs. Le dessin de Blocland (la Fabrique) n'est jamais repris : la construction taillée est
 *   celle d'Archipéo.
 */
const LIEUX_6E: Partial<Record<VillagePlaceId, LieuDuKit>> = {
  school: (m) =>
    m.z <= 3 && (m.texture === 'brique' || m.texture === 'taille')
      ? { famille: 'colombage' }
      : isBell(m)
        ? { famille: 'precieux', dessin: BELL }
        : m.texture === 'toit' && souche(m)
        ? { matiere: 'taille' }
        : m.texture === 'toit'
          ? { famille: 'toit' }
          : undefined,
  trophies: (m) =>
    m.texture === 'marbre' && m.z <= 3 && pilier(m)
      ? { famille: 'colombage', sansDecharge: true }
      : // Le fond de velours : une tenture peinte (ses plis, son galon d'or), 0 triangle.
        m.texture === 'velours' && m.z <= 3 && m.y === m.d - 1
        ? { famille: 'precieux', dessin: 'tenture' }
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
        ? { famille: 'colombage' }
        : m.texture === 'toit'
          ? { famille: 'toit' }
          : undefined,
};

export const KIT_6E: Kit = {
  // La table commune, pour les familles que le kit dessine (la Ferme, en terre : le torchis d'un colombage, décision du
  // directeur artistique du 30/09).
  matieres: materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal']),
  couleurs: { poteau: 0x795643, remplissage: 0xd9c7a8, soubassement: 0x8a8f84, chaperon: 0x8a8f84, bardage: 0xb1815e, pilotis: 0x6e4c30, tole: 0xa4aab0, joint: 0x7e848a, galon: 0xcca22e },
  murs: { colombage: 'colombage', bardage: 'bardage', pierre: 'plein', metal: 'tole' },
  // En attente (décision du directeur artistique, 30/09) : au 6e, le bardage reste aux pignons. Les îles au quai ou au
  // ponton (la Baie, la Rivière, la Tour) n'ont aucun mur de bois (la cabine de la Baie reste en blocs) : la règle attend
  // les bâtiments de bois qu'on y posera.
  bardes: ['english-6e-vocabulary', 'maths-6e-fractions', 'french-6e-reading'],
  pieces: { toit: piecesDeToit(), colombage: piecesSurPilotis(), pierre: { [PIECE_SEULE_ET_BASSE]: bacDePierre() } },
  // La barrière attend le budget (une exception nommée, ../families.ts) : son dessin est prêt (`barriereDe`).
  finitions: { porte: () => 'vantail', escalier: marcheDe, marche: marcheDe },
  lieux: LIEUX_6E,
  // Le lissage (mot du mainteneur, 8 octobre 2026) : un volume par matière dans les monuments, les petites
  // constructions, les cours et les piliers du cœur.
  lissage: true,
  poteaux: isPost,
};
