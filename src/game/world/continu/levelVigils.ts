// Les veillées de chaque niveau (GD-23, « trois veillées par niveau » ; GD-27, « Par quels canaux le récit se raconte » ;
// lots 3 et 3 bis) : le lieu qui porte le feu du niveau (la lanterne du Phare au 6e, la lanterne de tête du mât du
// Sémaphore au 5e, la gueule du fourneau de la Forge au 4e, le Fanal au 3e ; GD-27, « La chaîne des feux ») et la partie
// posée qui l'allume ; l'équipier qui monte à bord et le lieu où il le fait ; les plans de chaque veillée (./vigils6e.ts,
// ./vigils5e.ts, ./vigils4e.ts, ./vigils3e.ts) ; et la ligne de chacune, une seule, littérale, le lieu nommé
// (docs/contenu/monde-ouvert.md, « Les veillées »). Au 3e, la vue finale de GD-25 tient lieu de départ : aucune veillée
// de départ (directeur artistique, 30 octobre 2026). Code pur ; la page lance les veillées (OpenWorldPage.tsx,
// `playVigil`), la scène joue leurs plans.
import type { PartShape } from './construction';
import { placeById, type OpenPlace, type OpenWorldLevel, type PlaceId } from './levelPlan';
import PHRASES from './mondeOuvert.json';
import type { Vigil } from './vigil';
import { VIGILS_3E } from './vigils3e';
import { VIGILS_4E } from './vigils4e';
import { VIGILS_5E } from './vigils5e';
import { VIGILS_6E } from './vigils6e';

/** Les veillées d'un niveau, trois au plus (deux au 4e, une au 3e), dans l'ordre où l'élève les voit. */
export type VigilKind = 'arrival' | 'boarding' | 'departure';

/** L'embarquement d'un équipier : le lieu rallumé où il monte à bord, son rôle (jamais un prénom, GD-19), ses plans. */
interface Boarding {
  readonly place: PlaceId;
  readonly who: string;
  readonly vigil: Vigil;
}

/** Les veillées d'un niveau. */
export interface LevelVigils {
  /** Le lieu qui porte le feu du niveau. */
  readonly fire: PlaceId;
  /** Le feu est allumé : la partie posée qui l'allume (le haut, ou les abords), lue sur les parties posées du lieu. */
  fireLit(parts: readonly PartShape[]): boolean;
  /** Les plans sur le feu : l'arrivée (éteint) et le départ (tel qu'il est). */
  readonly fireVigil: Vigil;
  /** Les plans sur le feu allumé, s'ils diffèrent (au 5e, le second plan serre sur la tête du mât, où la lanterne est montée). */
  readonly fireVigilLit?: Vigil;
  /** L'embarquement, ou rien : personne ne monte à bord à ce niveau. */
  readonly boarding: Boarding | null;
  /** Le niveau a une veillée de départ (au 3e, la vue finale en tient lieu). */
  readonly departure: boolean;
}

const BY_LEVEL: Readonly<Record<OpenWorldLevel, LevelVigils>> = { '6e': VIGILS_6E, '5e': VIGILS_5E, '4e': VIGILS_4E, '3e': VIGILS_3E };

/** Les veillées du niveau. */
export const levelVigils = (level: OpenWorldLevel): LevelVigils => BY_LEVEL[level];

/** La veillée `kind` du niveau, le feu allumé ou non (`lit`), ou rien (aucun embarquement, aucun départ). */
export function vigilOf(v: LevelVigils, kind: VigilKind, lit = false): Vigil | null {
  if (kind === 'boarding') return v.boarding?.vigil ?? null;
  if (kind === 'departure' && !v.departure) return null;
  return (lit && v.fireVigilLit) || v.fireVigil;
}

/**
 * La forme, écrite au masculin singulier (« {Feu} est allumé. »), accordée au lieu comme les mots d'état
 * (constructionParts.ts, `restoredLine`) : « La Forge est allumée. »
 */
function agreed(line: string, agree: OpenPlace['agree']): string {
  const plural = agree === 'mp' || agree === 'fp';
  const feminine = agree === 'fs' || agree === 'fp';
  return line.replace(' est ', plural ? ' sont ' : ' est ').replace(/(\S+)\.$/, (_, word: string) => `${word}${feminine ? 'e' : ''}${plural ? 's' : ''}.`);
}

/**
 * La ligne de la veillée `kind` : le feu nommé et son état (`lit`), accordé à son nom, ou l'équipier qui monte à bord,
 * par son rôle ; vide si le niveau n'a pas cette veillée.
 */
export function vigilWords(v: LevelVigils, kind: VigilKind, lit: boolean): string {
  if (kind === 'boarding') return v.boarding ? PHRASES.boarding.replace('{Équipier}', v.boarding.who) : '';
  const fire = placeById(v.fire);
  return agreed(lit ? PHRASES.fireLit : PHRASES.fireOut, fire.agree).replace('{Feu}', fire.name);
}

/**
 * La veillée commence par une coupe : son premier plan est trop loin de Kéo pour y glisser lentement (le feu du 5e, du
 * 4e et du 3e est à l'autre bout du niveau), la caméra y est dès le début (`travel` nul), sous le voile du fondu que la
 * page lève ; à la fin, le voile couvre le retour derrière Kéo. Au 6e, le Phare est à portée : elle glisse.
 */
export const vigilCuts = (v: Vigil): boolean => v.shots[0].travel === 0;
