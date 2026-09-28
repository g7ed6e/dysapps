// Le registre des formes du décor d'Archipéo (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) :
// pour chaque genre de décor, la fonction qui le dessine en primitives. Il remplace le `switch` de ../decorMesh.ts ;
// chaque sous-lot écrit ses formes dans son fichier (./6e.ts…, R5 celles du quai et du cœur des îles) et les range ici
// par une seule ligne. Un décor bâti sans forme propre se dessine en boîtes (`enBoites`).
import { FORMES_COMMUNES } from './communes';
import { FORMES_6E } from './6e';
import { FORMES_5E } from './5e';
import { FORMES_4E, RETOUCHES_4E } from './4e';
import { FORMES_3E } from './3e';
import { formeHorsGrille } from './horsGrille';
import { enBoites, type Forme } from './outils';
import type { ArchipelagoId } from '../map';

export const FORMES: Readonly<Record<string, Forme>> = { ...FORMES_COMMUNES, ...FORMES_6E, ...FORMES_5E, ...FORMES_4E, ...FORMES_3E };

/**
 * Les genres communs qu'un archipel redessine à sa façon (les écueils bas et les rochers de pierre chaude du 4e) : une
 * ligne par sous-lot. Les cubes de Blocland ne changent pas, seule la forme d'Archipéo.
 */
const RETOUCHES: Partial<Record<ArchipelagoId, Record<string, Forme>>> = { '4e': RETOUCHES_4E };

/** La forme d'un genre de décor dans un archipel (sa retouche, son décor hors de la grille), sinon ses cubes en boîtes. */
export function formeDe(genre: string, a?: ArchipelagoId): Forme {
  return (a && (RETOUCHES[a]?.[genre] ?? formeHorsGrille(a, genre))) || FORMES[genre] || enBoites;
}
