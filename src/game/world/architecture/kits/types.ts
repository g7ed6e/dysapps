// Le kit d'un archipel (lot 7 d'Archipéo, l'architecture modulaire) : la table « bloc vers matière », unique pour
// l'archipel (décision du directeur artistique : la matière du bloc reste lisible par famille), les couleurs de
// l'archipel par rôle, la manière de peindre les murs de chaque famille, et les pièces dessinées, par famille. Un bloc
// que le kit ne peint ni ne dessine reste un bloc taillé tel quel : un kit vide ne change rien.
import type { VillagePlaceId, VoxelCube } from '../../cube';
import type { Couleur } from '../../palette';
import type { TextureKind } from '../../pixels';
import type { IdDePiece } from '../choices';
import type { ManiereDuMur } from '../paint';
import type { DessinDePiece, Role } from '../rooms';
import type { MaterialFamily } from '../families';

/**
 * La famille d'une matière : celle de la table commune (../families.ts). Le kit d'un archipel dit lesquelles il dessine
 * (`matieres`) ; le verre et les lanternes restent ce qu'ils sont (vitres, lanternes) tant qu'aucun kit ne les dessine.
 */
export type Famille = MaterialFamily;

/**
 * Le dessin d'une matière de la finition (la porte, la barrière, la marche), qui ne se lit pas sur sa seule famille : une
 * manière de peindre son bloc, ou une pièce dessinée, d'après la pièce choisie par son voisinage et son bloc.
 */
type DessinDeFinition = (piece: IdDePiece, c: VoxelCube) => DessinDePiece | ManiereDuMur | undefined;

/**
 * Une case du modèle d'un lieu du village (world/terrain.ts : `schoolModel`, `trophyModel`, et les trophées posés),
 * relative au coin du lieu (z = 1 : le rang posé sur le sol), la taille du lieu (`w` × `d`) et la texture de son bloc.
 */
export interface CaseDuLieu {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  texture: string;
}

/**
 * Ce que le kit fait d'un bloc d'un lieu du village : sa famille (un mur de bois ou de pierre, un toit ; sans famille, il
 * reste un bloc taillé), s'il prend la couverture de son île (world/roofs.ts) ou la couleur d'une autre matière
 * (`matiere`) au lieu de la sienne, et si son colombage se passe de décharge (`sansDecharge`, un pilier isolé) ;
 * `undefined` : il reste le bloc qu'il est.
 */
interface BlocDuKit {
  famille?: Famille;
  couverture?: boolean;
  matiere?: TextureKind;
  sansDecharge?: boolean;
}
export type LieuDuKit = (m: CaseDuLieu) => BlocDuKit | undefined;

export interface Kit {
  /** La table « bloc vers matière » : la famille de chaque texture de bloc (une texture absente n'est pas remplacée). */
  matieres: Partial<Record<TextureKind, Famille>>;
  /** Les couleurs de l'archipel par rôle, de jour, avant le voile de l'archipel. */
  couleurs: Partial<Record<Role, Couleur>>;
  /** Comment peindre les murs de chaque famille (./paint.ts) : un colombage, un mur plein ; absente, pas peinte. */
  murs: Partial<Record<Famille, ManiereDuMur>>;
  /** Les îles dont les bâtiments de bois sont bardés au lieu du colombage : les bâtiments du quai (au 6e, en attente). */
  bardes: readonly string[];
  /** Les pièces dessinées, par famille et par nom de pièce (./choices.ts). */
  pieces: Partial<Record<Famille, Partial<Record<IdDePiece, DessinDePiece>>>>;
  /** La finition, matière par matière (la porte, la barrière, la marche) : elle passe avant `pieces` et `murs`. */
  finitions?: Partial<Record<TextureKind, DessinDeFinition>>;
  /**
   * Les lieux du village qui prennent le kit (l'école, la salle des trophées, le lieu où l'on assemble) : la famille de chacun de leurs blocs, lue
   * sur sa place dans le modèle du lieu, pas sur la seule texture (la table « bloc vers matière » reste celle des plans).
   * Un lieu absent garde son dessin.
   */
  lieux?: Partial<Record<VillagePlaceId, LieuDuKit>>;
}

/** Un kit vide : aucun bloc remplacé. */
export const kitVide = (): Kit => ({ matieres: {}, couleurs: {}, murs: {}, bardes: [], pieces: {} });

/** Le kit remplace-t-il quelque chose ? (Une pièce dessinée, ou une famille de murs peinte.) */
export const kitRempli = (kit: Kit): boolean =>
  Object.keys(kit.murs).length > 0 || Object.values(kit.pieces).some((p) => p !== undefined && Object.keys(p).length > 0);
