// Le registre des formes du décor d'Archipéo (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) :
// pour chaque genre de décor, la fonction qui le dessine en primitives. Il remplace le `switch` de ../decorMesh.ts ;
// chaque sous-lot écrit ses formes dans son fichier (./6e.ts…, R5 celles du quai et du cœur des îles) et les range ici
// par une seule ligne. Un décor bâti sans forme propre se dessine en boîtes (`enBoites`).
import { FORMES_COMMUNES } from './communes';
import { FORMES_6E } from './6e';
import { FORMES_5E, LOINTAIN_5E, ORNEMENTS_5E, VARIANTES_5E } from './5e';
import { FORMES_4E } from './4e';
import { FORMES_3E } from './3e';
import type { Lointain } from './lointain';
import { enBoites, type Forme, type Ornement } from './outils';
import type { ArchipelagoId } from '../map';

export const FORMES: Readonly<Record<string, Forme>> = { ...FORMES_COMMUNES, ...FORMES_6E, ...FORMES_5E, ...FORMES_4E, ...FORMES_3E };

/**
 * Les variantes d'un genre commun propres à un archipel (le banc du 5e, des roches moussues ; les écueils du 4e) :
 * chaque sous-lot écrit les siennes dans son fichier et les range ici par une seule ligne, sans toucher aux formes
 * communes ni à celles d'un autre archipel.
 */
export const VARIANTES: Readonly<Partial<Record<ArchipelagoId, Readonly<Record<string, Forme>>>>> = { '5e': VARIANTES_5E };

/** La forme d'un genre de décor dans un archipel : sa variante, sinon sa forme, sinon ses cubes en boîtes. */
export function formeDe(genre: string, a?: ArchipelagoId): Forme {
  return (a && VARIANTES[a]?.[genre]) || (FORMES[genre] ?? enBoites);
}

/** Les ornements de chaque archipel qui en a (./outils.ts, `Ornement`), rangés par une seule ligne. */
export const ORNEMENTS: Readonly<Partial<Record<ArchipelagoId, Ornement>>> = { '5e': ORNEMENTS_5E };

/**
 * Le lointain de chaque archipel qui en a un (./lointain.ts) : chaque sous-lot décrit le sien dans son fichier et le
 * range ici par une seule ligne. Le 6e le reçoit à la revue d'ensemble seulement.
 */
export const LOINTAINS: Readonly<Partial<Record<ArchipelagoId, Lointain>>> = { '5e': LOINTAIN_5E };
