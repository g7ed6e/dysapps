// Les univers (lot 6) : Archipéo et Blocland habillent le même jeu de leurs textes. Tant que `UNIVERS_OUVERT` est
// fausse, l'élève ne voit que les textes d'avant le lot 6 (ceux de Blocland), quel que soit le rendu : la bascule
// tient en une ligne. Voir docs/conception/cadrage-archipeo.md, « Les fils du lot 6 ».
import { ARCHIPEO } from './archipeo';
import { BLOCLAND } from './blocland';
import type { TextesUnivers, UniversId } from './types';

export type { TextesUnivers, UniversId } from './types';

/** Fausse jusqu'à la bascule du lot 6. */
export const UNIVERS_OUVERT = false;

const TEXTES: Record<UniversId, TextesUnivers> = { archipeo: ARCHIPEO, blocland: BLOCLAND };

/**
 * L'univers dont l'élève lit les textes : celui qu'il a choisi une fois l'univers ouvert (Archipéo s'il n'a rien
 * choisi), Blocland avant.
 */
export function universAffiche(choisi?: UniversId, ouvert: boolean = UNIVERS_OUVERT): UniversId {
  return ouvert ? (choisi ?? 'archipeo') : 'blocland';
}

export function textesDe(univers: UniversId): TextesUnivers {
  return TEXTES[univers];
}

/**
 * Les textes de l'univers affiché, pour un composant. Le réglage « Univers » (fil A du lot 6) viendra ici ; d'ici là,
 * ce sont ceux de Blocland.
 */
export function useTextes(): TextesUnivers {
  return textesDe(universAffiche());
}
