// Le kit d'un archipel (lot 7 d'Archipéo, l'architecture modulaire) : la table « bloc vers matière », unique pour
// l'archipel (décision du directeur artistique : la matière du bloc reste lisible par famille), les couleurs de
// l'archipel par rôle, la manière de peindre les murs de chaque famille, et les pièces dessinées, par famille. Un bloc
// que le kit ne peint ni ne dessine reste un bloc taillé tel quel : un kit vide ne change rien.
import type { Couleur } from '../../palette';
import type { TextureKind } from '../../pixels';
import type { IdDePiece } from '../choix';
import type { ManiereDuMur } from '../peinture';
import type { DessinDePiece, Role } from '../pieces';

export type { Role } from '../pieces';

/**
 * La famille d'une matière : le bois (colombages, bardages, pilotis), la pierre (soubassement, mur plein), le toit.
 * Le verre et les lanternes n'ont pas de famille : ils restent ce qu'ils sont (vitres, lanternes).
 */
export type Famille = 'bois' | 'pierre' | 'toit';

export interface Kit {
  /** La table « bloc vers matière » : la famille de chaque texture de bloc (une texture absente n'est pas remplacée). */
  matieres: Partial<Record<TextureKind, Famille>>;
  /** Les couleurs de l'archipel par rôle, de jour, avant le voile de l'archipel. */
  couleurs: Partial<Record<Role, Couleur>>;
  /** Comment peindre les murs de chaque famille (./peinture.ts) : un colombage, un mur plein ; absente, pas peinte. */
  murs: Partial<Record<Famille, ManiereDuMur>>;
  /** Les îles dont les bâtiments de bois sont bardés au lieu du colombage : les bâtiments du quai (au 6e, en attente). */
  bardes: readonly string[];
  /** Les pièces dessinées, par famille et par nom de pièce (./choix.ts). */
  pieces: Partial<Record<Famille, Partial<Record<IdDePiece, DessinDePiece>>>>;
}

/** Un kit vide : aucun bloc remplacé. */
export const kitVide = (): Kit => ({ matieres: {}, couleurs: {}, murs: {}, bardes: [], pieces: {} });

/** Le kit remplace-t-il quelque chose ? (Une pièce dessinée, ou une famille de murs peinte.) */
export const kitRempli = (kit: Kit): boolean =>
  Object.keys(kit.murs).length > 0 || Object.values(kit.pieces).some((p) => p !== undefined && Object.keys(p).length > 0);
