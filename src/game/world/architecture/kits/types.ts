// Le kit d'un archipel (lot 7 d'Archipéo, l'architecture modulaire) : la table « bloc vers matière », unique pour
// l'archipel (décision du directeur artistique : la matière du bloc reste lisible par famille), les couleurs de
// l'archipel par rôle, la manière de peindre les murs de chaque famille, et les pièces dessinées, par famille. Un bloc
// que le kit ne peint ni ne dessine reste un bloc taillé tel quel : un kit vide ne change rien.
import type { VillagePlaceId, VoxelCube } from '../../cube';
import type { Couleur } from '../../palette';
import type { TextureKind } from '../../pixels';
import type { IdDePiece, Rotation } from '../choices';
import type { ManiereDuMur, PeintureDuMur } from '../paint';
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
 * (`matiere`) au lieu de la sienne, son dessin quand il ne se lit pas sur sa famille (`dessin`), et si son colombage se
 * passe de décharge (`sansDecharge`, un pilier isolé) ;
 * `undefined` : il reste le bloc qu'il est.
 */
interface BlocDuKit {
  famille?: Famille;
  /**
   * Son dessin, quand sa famille ne le dit pas seule (le précieux : la cloche de l'école, une pièce ; le velours de la
   * salle des trophées, une tenture peinte).
   */
  dessin?: DessinDePiece | ManiereDuMur;
  couverture?: boolean;
  matiere?: TextureKind;
  sansDecharge?: boolean;
}
export type LieuDuKit = (m: CaseDuLieu) => BlocDuKit | undefined;

/** D'où vient un bloc que le plan ne prend pas : le cœur d'une île, une liaison, une petite construction, un bâtiment, une cour, un lieu du village. */
export type RestOrigin = 'coeur' | 'liaison' | 'petite' | 'batiment' | 'cour' | 'lieu';

/** Ce que le dessin du reste lit autour d'un bloc. */
export interface RestContext {
  origin: RestOrigin;
  /** Le bloc posé d'une case (ni fantôme, ni décor, ni borne), s'il y en a un. */
  at: (x: number, y: number, z: number) => VoxelCube | undefined;
  /** La case du bloc dans le modèle de son lieu du village, ou `null`. */
  place: CaseDuLieu | null;
}

/**
 * Le dessin d'un bloc que le plan ne prend pas (le reste) : une pièce dessinée, ou un mur peint (sa peinture), dont le
 * dessus peut ne jamais être vu (`hiddenTop` : un toit caché sous un autre, qui n'émet pas son dessus).
 */
export type RestDrawing =
  | { family: Famille; piece: DessinDePiece; rotation?: Rotation }
  | { family: Famille; paint: PeintureDuMur; hiddenTop?: boolean };

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
   * Le dessin d'une matière d'une autre famille que sa famille ne dit pas seule (au 5e : le bambou en clins verticaux, la
   * rizière seule et basse en plate-bande, l'enluminure d'une petite construction) : comme la finition, avant `pieces` et
   * `murs` ; `undefined` : le dessin de sa famille.
   */
  byMaterial?: Partial<Record<TextureKind, DessinDeFinition>>;
  /**
   * Une tuile posée en mur, et non en toit (au 5e : les murs de l'échoppe du Comptoir, le four de Vélin, la tour rayée du
   * phare du large) : un mur plein de sa matière, lu comme un mur par ses voisines. `plan` : la texture de chaque case du
   * plan du bloc, fantômes compris.
   */
  tilesInWalls?: (c: VoxelCube, plan: (x: number, y: number, z: number) => string | undefined) => boolean;
  /**
   * Un bloc que le kit peint à plat, sans pièce ni mur, d'après sa place (au 5e : l'auvent rayé de l'échoppe du Marché,
   * le toit en damier du kiosque tant qu'il n'est pas fini) : sa matière unie, sans dessus sous un autre bloc posé.
   */
  flat?: (c: VoxelCube) => boolean;
  /**
   * Les blocs d'un monument que le kit dessine d'un seul tenant (au 5e : le toit en pavillon du kiosque et sa verrière),
   * lus sur tout le plan du monument (`plan` : ses blocs, fantômes compris) : la pièce de la case (et son quart de tour,
   * pour une rangée qui file le long de x : au 3e, le faîte du temple), `null` (rien : une case que le dessin d'une autre
   * traverse), ou `undefined` (le dessin ordinaire).
   */
  monumentPieces?: (c: VoxelCube, plan: readonly VoxelCube[]) => DessinDePiece | { piece: DessinDePiece; rotation: Rotation } | null | undefined;
  /** Les matières tenues loin du fantôme Brume (../heartPieces.ts, `apartFromGhost` ; au 5e : la glace, le sel, la toile). */
  ghostApart?: readonly TextureKind[];
  /**
   * Les toits enneigés (au 3e) : le dessus d'un toit d'ardoise du bâti (pas du décor) prend la neige du kit (le rôle
   * `snow`, loin du fantôme Brume), au lieu de l'ardoise enneigée de world/roofs.ts, qui est Brume lui-même.
   */
  snowyRoofs?: boolean;
  /**
   * Les lieux du village qui prennent le kit (l'école, la salle des trophées, le lieu où l'on assemble) : la famille de chacun de leurs blocs, lue
   * sur sa place dans le modèle du lieu, pas sur la seule texture (la table « bloc vers matière » reste celle des plans).
   * Un lieu absent garde son dessin.
   */
  lieux?: Partial<Record<VillagePlaceId, LieuDuKit>>;
  /**
   * Le lissage (../volumes.ts) : dans les plans à part (les monuments, les petites constructions, les cours, les piliers
   * du cœur), les cases voisines d'une même matière se lisent comme un seul volume, d'une seule teinte, sans chaperon ni
   * dessus de pierre par case. Les bâtiments des plans et les lieux du village n'en ont pas besoin : leurs murs sont
   * déjà réunis, leurs toits en pente.
   */
  lissage?: boolean;
  /**
   * Les poteaux de bois (le végétal, `tronc`) que le kit dessine en poteaux carrés (../lowPieces.ts, `woodenPost`) :
   * au 6e, ceux des liaisons (les bacs, les lanternes à leurs bouts) et de la jetée. Ils ne sont d'aucun plan.
   */
  poteaux?: (c: VoxelCube) => boolean;
  /**
   * Le reste (au 6e, ../heart.ts) : le dessin des blocs posés que ni le plan, ni les lieux, ni les poteaux ne prennent
   * (le décor du cœur, le quai, les tabliers des liaisons, l'eau, les toits cachés, le verre hors d'un mur, la cour de la
   * Halle) ; `undefined` : il reste un bloc taillé.
   */
  reste?: (c: VoxelCube, ctx: RestContext) => RestDrawing | undefined;
}

/** Un kit vide : aucun bloc remplacé. */
export const kitVide = (): Kit => ({ matieres: {}, couleurs: {}, murs: {}, bardes: [], pieces: {} });

/** Le kit remplace-t-il quelque chose ? (Une pièce dessinée, ou une famille de murs peinte.) */
export const kitRempli = (kit: Kit): boolean =>
  Object.keys(kit.murs).length > 0 || Object.values(kit.pieces).some((p) => p !== undefined && Object.keys(p).length > 0);
