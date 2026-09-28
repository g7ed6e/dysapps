// Le registre des formes du décor d'Archipéo (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) :
// pour chaque genre de décor, la fonction qui le dessine en primitives. Il remplace le `switch` de ../decorMesh.ts ;
// chaque sous-lot écrit ses formes dans son fichier (./6e.ts…, R5 celles du quai et du cœur des îles) et les range ici
// par une seule ligne. Un décor bâti sans forme propre se dessine en boîtes (`enBoites`).
import { FORMES_COMMUNES } from './communes';
import { FORMES_6E } from './6e';
import { FORMES_5E, LOINTAIN_5E } from './5e';
import { FORMES_4E } from './4e';
import { FORMES_3E } from './3e';
import type { Lointain } from './lointain';
import { enBoites, type Forme } from './outils';
import type { ArchipelagoId } from '../map';

export const FORMES: Readonly<Record<string, Forme>> = { ...FORMES_COMMUNES, ...FORMES_6E, ...FORMES_5E, ...FORMES_4E, ...FORMES_3E };

/** La forme d'un genre de décor, sinon ses cubes en boîtes. */
export function formeDe(genre: string): Forme {
  return FORMES[genre] ?? enBoites;
}

/**
 * Le lointain de chaque archipel qui en a un (./lointain.ts) : chaque sous-lot décrit le sien dans son fichier et le
 * range ici par une seule ligne. Le 6e le reçoit à la revue d'ensemble seulement.
 */
export const LOINTAINS: Readonly<Partial<Record<ArchipelagoId, Lointain>>> = { '5e': LOINTAIN_5E };
