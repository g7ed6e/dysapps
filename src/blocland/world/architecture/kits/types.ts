// Le kit d'un archipel (lot 7 d'Archipéo, l'architecture modulaire) : la table « bloc vers matière », unique pour
// l'archipel (décision du directeur artistique : la matière du bloc reste lisible par famille), et les pièces dessinées,
// par famille. Une pièce que le kit ne dessine pas laisse le bloc taillé tel quel : un kit vide ne change rien.
import type { TextureKind } from '../../pixels';
import type { IdDePiece } from '../choix';
import type { DessinDePiece } from '../pieces';

/**
 * La famille d'une matière : le bois (colombages, planches, pilotis), la pierre (soubassement, mur plein), le toit.
 * Le verre et les lanternes n'ont pas de famille : ils restent ce qu'ils sont (vitres, lanternes).
 */
export type Famille = 'bois' | 'pierre' | 'toit';

export interface Kit {
  /** La table « bloc vers matière » : la famille de chaque texture de bloc (une texture absente n'est pas remplacée). */
  matieres: Partial<Record<TextureKind, Famille>>;
  /** Les pièces dessinées, par famille et par nom de pièce (./choix.ts). */
  pieces: Partial<Record<Famille, Partial<Record<IdDePiece, DessinDePiece>>>>;
}

/** Un kit vide : aucun bloc remplacé. */
export const kitVide = (): Kit => ({ matieres: {}, pieces: {} });
