// Le visage du joueur, vu de face, pour le médaillon « toi » de la Carte (world/labelCanvas.ts, `drawMedaillon`) et le
// bouton Recentrer (../../VisageDuBonhomme.tsx) : dans Blocland, les 8 × 8 pixels de la tête du bonhomme en blocs
// (../../Avatar.ts) ; dans Archipéo, le visage du bonhomme en facettes peintes (./bonhomme.ts), tiré de son modèle et
// de ses couleurs (choix « 1a » du mainteneur, 4 octobre 2026) : la tête à six pans, la peau et son menton plus sombre,
// les cheveux courts en bataille, les oreilles, les deux yeux. Ni bouche ni nez : le modèle n'en a pas. Des données
// seulement, sans Three.js ni React.
import { VISAGE_DU_BONHOMME } from '../../Avatar';
import type { Habillage } from '../habillage/types';
import type { Couleur } from '../palette';
import { BONHOMME, OEIL } from './couleurs';

/** Un visage en pixels : des lignes de couleurs, de haut en bas, de gauche à droite. */
type VisageEnPixels = readonly (readonly string[])[];
/** Une facette du visage peint : un polygone dans un carré de 24 de côté (y vers le bas), et sa couleur. */
export interface FacetteDuVisage {
  couleur: string;
  points: readonly (readonly [number, number])[];
}
/** Un visage : en pixels (Blocland), ou en facettes (Archipéo). */
export type Visage = VisageEnPixels | { readonly facettes: readonly FacetteDuVisage[] };

/** Le côté du carré des facettes. */
export const COTE_DU_VISAGE = 24;

const css = (c: Couleur): string => `#${c.toString(16).padStart(6, '0')}`;
/** Le menton, à l'ombre : la peau un peu plus sombre, comme une facette tournée vers le bas. */
const PEAU_A_L_OMBRE = '#bf8a66';

/** Le miroir d'une facette autour du milieu du carré. */
const miroir = (points: readonly (readonly [number, number])[]): [number, number][] => points.map(([x, y]) => [COTE_DU_VISAGE - x, y]);

const OREILLE: [number, number][] = [
  [4.4, 12],
  [6.2, 11.4],
  [6.2, 15.6],
  [4.8, 15.2],
];
const OEIL_GAUCHE: [number, number][] = [
  [8.9, 12.8],
  [10.7, 12.8],
  [10.7, 15],
  [8.9, 15],
];

/** Le visage du bonhomme d'Archipéo, en facettes, de l'arrière vers l'avant. */
export const VISAGE_DU_BONHOMME_PEINT: { readonly facettes: readonly FacetteDuVisage[] } = {
  facettes: [
    { couleur: css(BONHOMME.peau), points: OREILLE },
    { couleur: css(BONHOMME.peau), points: miroir(OREILLE) },
    // La tête à six pans, vue de face : le front, les tempes, les joues.
    {
      couleur: css(BONHOMME.peau),
      points: [
        [7, 8],
        [17, 8],
        [18.8, 12],
        [18, 17],
        [6, 17],
        [5.2, 12],
      ],
    },
    {
      couleur: PEAU_A_L_OMBRE,
      points: [
        [6, 17],
        [18, 17],
        [15, 20.6],
        [9, 20.6],
      ],
    },
    // Les cheveux courts en bataille : une calotte, trois mèches qui dépassent, une frange découpée.
    {
      couleur: css(BONHOMME.cheveux),
      points: [
        [5, 12.4],
        [5.2, 8.4],
        [7, 5.6],
        [9.2, 4.6],
        [10.4, 2.8],
        [12.4, 4.2],
        [14.6, 2.8],
        [15.6, 4.6],
        [18, 5.6],
        [19.4, 8.4],
        [19, 12.4],
        [17.4, 9.6],
        [14.2, 9.4],
        [12.6, 7.8],
        [11.2, 9.6],
        [7.4, 9.8],
        [6.2, 12.6],
      ],
    },
    { couleur: css(OEIL), points: OEIL_GAUCHE },
    { couleur: css(OEIL), points: miroir(OEIL_GAUCHE) },
  ],
};

/** Le visage du joueur : celui de ses personnages (en cubes ou en modèles dessinés, ligne `personnages` de l'habillage). */
export const visageDuJoueur = (habillage: Pick<Habillage, 'personnages'>): Visage =>
  habillage.personnages === 'modeles' ? VISAGE_DU_BONHOMME_PEINT : VISAGE_DU_BONHOMME;
