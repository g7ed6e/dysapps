// Ce que les kits d'Archipéo ont en commun (le 6e, la référence, puis le 5e, 9 octobre 2026) : les murs de bois sur
// pilotis, les poteaux de bois des liaisons et de la jetée du port, les lieux du village (l'école, la salle des trophées,
// la Halle aux matériaux) et la finition (la porte, la marche, la barrière). Chaque kit les reprend avec ce qui lui est
// propre (son port, la pierre de ses lieux). Code pur, sans Three.js.
import { boiteDansLaCase, type DessinDePiece, type Facette } from '../rooms';
import { barriereDe, marcheDe } from '../lowPieces';
import { bell } from '../precious';
import { dockPosts } from '../../harbor';
import { getArchipelago } from '../../archipelago';
import type { ArchipelagoId } from '../../archipelagos';
import type { VillagePlaceId, VoxelCube } from '../../cube';
import type { TextureKind } from '../../pixels';
import { MOTIF, type ManiereDuMur } from '../paint';
import type { IdDeMur, Forme, Tete, IdDePiece } from '../choices';
import { estUnPilier } from '../../trophyHall';
import { HALLE } from '../../terrain';
import type { CaseDuLieu, Famille, LieuDuKit } from './types';

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

/** Les murs de bois sur pilotis, une pièce par forme et par tête. */
export function piecesSurPilotis(): Partial<Record<IdDeMur, DessinDePiece>> {
  const out: Partial<Record<IdDeMur, DessinDePiece>> = {};
  const formes: Forme[] = ['seul', 'bout', 'droit', 'angle', 'te', 'croix'];
  for (const tete of ['chaperon', 'toit', 'mur'] as const) {
    const d = surPilotis(tete);
    for (const forme of formes) out[`mur.${forme}.pilotis.${tete}`] = d;
  }
  return out;
}

/**
 * Les poteaux de bois que le kit d'un archipel dessine : ceux d'une liaison (un bac, une lanterne à son bout) et ceux de
 * la jetée de son port (world/harbor.ts). Les colonnes de la jetée sont calculées au premier appel (la carte des îles
 * n'est lue qu'une fois le monde demandé), puis gardées. Ceux du décor du cœur des îles passent par le reste
 * (../heart.ts).
 */
export function postsOf(a: ArchipelagoId): (c: VoxelCube) => boolean {
  let memo: { port: string; cells: Set<string> } | undefined;
  const jetty = () => {
    if (!memo) {
      const port = getArchipelago(a).port;
      memo = { port, cells: new Set(dockPosts(port).map((p) => `${p.x},${p.y}`)) };
    }
    return memo;
  };
  return (c) => {
    if (c.bridge) return true;
    const j = jetty();
    return c.tag === j.port && !c.decor && j.cells.has(`${c.x},${c.y}`);
  };
}

/** Un pilier de la salle des trophées, lu par colonne (GD-3) : les bouts de la salle de départ et le bord de chaque travée. */
const pilier = ({ x, y, d }: CaseDuLieu) => estUnPilier(x, y, d);
/**
 * Les rangs de la halle du lieu où l'on assemble (world/terrain.ts, `atelierModel`, `HALLE`) : à partir de son premier
 * rang ; devant, la cour (la potence, le bloc suspendu, les blocs de la recette), que le reste dessine (../heart.ts).
 */
const dansLaHalle = ({ y }: CaseDuLieu) => y >= HALLE.rang;
/** La souche du clocheton de l'école : la case du toit sous lui, au milieu de la façade, au deuxième rang (schoolModel). */
const souche = ({ x, y, z, w }: CaseDuLieu) => x === (w - 1) / 2 && y === 1 && z === 5;
/** La cloche, sur le fût du clocheton (la souche et la case au-dessus d'elle). */
const isBell = ({ x, y, z, w, texture }: CaseDuLieu) => x === (w - 1) / 2 && y === 1 && z === 7 && texture === 'or';
const BELL = bell();

/** Le mur d'un lieu du village : sa famille, et sa manière quand sa famille ne la dit pas seule. */
interface PlaceWall {
  famille: Famille;
  dessin?: ManiereDuMur;
}

/**
 * Les lieux du village d'un kit (world/terrain.ts), d'après le mur de l'école (ses murs de brique aux coins de pierre de
 * taille, les trois rangs posés sur le sol) et celui des piliers de marbre de la salle des trophées (sans décharge : des
 * piliers isolés, lus par colonne, ceux des travées aussi, GD-3) :
 * - l'école : son toit à deux pans en pentes ; la porte, les deux fenêtres et le fût du clocheton restent au reste, et la
 *   souche du clocheton prend sa pierre de taille : un seul fût de deux cases (décision du directeur artistique, 1er
 *   octobre) ; sa cloche d'or est un tronc de pyramide évasé posé sur le fût (../precious.ts) ;
 * - la salle des trophées : son toit de pierre de taille en pentes, dans la couverture de l'île, d'un seul tenant d'un
 *   bout à l'autre (le pignon au bout de la halle, aucun au milieu), et son faîte d'or en faîte, qui s'allonge avec
 *   elle ; le fond de velours (le fond des trophées) est une tenture peinte (ses plis, son galon d'or) ; les socles de
 *   marbre vont au reste, et les trophées sont dessinés par world/construction.ts ;
 * - la Halle aux matériaux (le lieu où l'on assemble, dans son dessin d'Archipéo : `atelierModel('halle')`) : ses murs
 *   de bois sur leur rang de pierre en colombage (le rang de pierre devient le soubassement, comme aux maisons), son toit
 *   à deux pentes en pentes et son faîte ; la porte reste ouverte. Le dessin de Blocland (la Fabrique) n'est jamais
 *   repris : la construction taillée est celle d'Archipéo.
 */
export function villagePlaces(walls: { school: PlaceWall; pillars: PlaceWall }): Partial<Record<VillagePlaceId, LieuDuKit>> {
  const pillars = { ...walls.pillars, sansDecharge: true };
  return {
    school: (m) =>
      m.z <= 3 && (m.texture === 'brique' || m.texture === 'taille')
        ? walls.school
        : isBell(m)
          ? { famille: 'precieux', dessin: BELL }
          : m.texture === 'toit' && souche(m)
            ? { matiere: 'taille' }
            : m.texture === 'toit'
              ? { famille: 'toit' }
              : undefined,
    trophies: (m) =>
      m.texture === 'marbre' && m.z <= 3 && pilier(m)
        ? pillars
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
}

/** La finition (la porte en vantail, la marche basse, la barrière en poteaux et lisses), la même dans chaque kit. */
export const FINISHES: Partial<Record<TextureKind, (piece: IdDePiece, c: VoxelCube) => DessinDePiece | ManiereDuMur | undefined>> = {
  porte: () => 'vantail',
  escalier: marcheDe,
  marche: marcheDe,
  barriere: barriereDe,
};
