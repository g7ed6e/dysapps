// La révision jouée dans la scène du lieu (GD-20, point 4, piste B « La remise », lot L3, B2 ; arbitrages du directeur
// artistique, point 1, et les sept conditions du directeur du contenu pédagogique) : « Reprendre », chez l'habitant,
// joue les questions dues des missions de ce lieu, et de ce lieu seulement, dans sa scène, mission par mission.
// - Les mêmes items, sous la même clé : seuls ceux qui sont dus, tels que la mission les écrit (`revisionItems`).
// - Jamais deux missions mêlées : un passage est une suite de morceaux, un par exercice, chacun avec sa consigne.
// - 8 questions au plus par passage (`REVISION_MAX`), dans l'ordre des dates de la file (`dueItems`), regroupées par
//   exercice dans l'ordre où elles viennent ; le reste attend la fois suivante.
// - Un exercice dont les items se tirent à chaque partie (les maths générées : `def.generate`) ne se revoit jamais ici :
//   un autre calcul ne passe jamais pour « l'item à revoir ». Ni un exercice dont les écrans se suivent (`ordered`) ou
//   prennent tous les items d'un coup (l'Ascension). Ceux-là gardent « Reprendre » sur l'écran habituel (B1).
// Sans React ni Three.js : testé sous jsdom.
import type { BiomeId } from '../../biomes';
import { dueItems, todayISO, type SpacedItem } from '../../engine';
import { CATALOG, loadExercise } from '../../exercises';
import { SCREEN_TYPES } from '../../exercises/registry';
import type { ExerciseDef } from '../../exercises/types';
import { revisionsDeLIle } from '../../reminders';
import type { Lv2Choice } from '../../../core/settings';
import { placeById, type PlaceId } from '../../world/continu/plan6e';

/** Les questions d'un passage, au plus (directeur du contenu pédagogique, condition 6 : la longueur d'un exercice). */
export const REVISION_MAX = 8;

/** Un morceau du passage : un exercice, et les clés de ses items dus, dans l'ordre de leurs dates. */
interface RevisionSegment {
  exercise: string;
  /** La mission (le type de l'exercice) : sa scène, sa consigne. */
  type: string;
  level: number;
  keys: string[];
}

/** Un passage de révision dans un lieu : ses morceaux, et le nombre de questions (le repère « 2 sur 5 »). */
export interface RevisionPlan {
  place: PlaceId;
  segments: RevisionSegment[];
  total: number;
}

/** L'exercice d'un item de la file, et sa clé (« <exercice>:<clé> »). */
const splitItem = (itemId: string) => ({ exercise: itemId.slice(0, itemId.lastIndexOf(':')), key: itemId.slice(itemId.lastIndexOf(':') + 1) });

/**
 * Les morceaux d'un passage : les `max` premières questions dues qui peuvent se revoir ici (`eligible`), dans l'ordre de
 * la file, regroupées par exercice dans l'ordre où chacun vient pour la première fois.
 */
export function planRevision(due: readonly { exercise: string; key: string }[], eligible: (exercise: string, key: string) => boolean, max = REVISION_MAX): { exercise: string; keys: string[] }[] {
  const out: { exercise: string; keys: string[] }[] = [];
  let n = 0;
  for (const d of due) {
    if (n >= max) break;
    if (!eligible(d.exercise, d.key)) continue;
    const seg = out.find((s) => s.exercise === d.exercise);
    if (seg) {
      if (seg.keys.includes(d.key)) continue;
      seg.keys.push(d.key);
    } else out.push({ exercise: d.exercise, keys: [d.key] });
    n++;
  }
  return out;
}

/** Un exercice peut-il se revoir question par question dans la scène ? Ni généré, ni ordonné, des écrans d'un ou de quelques items. */
export function revisableInScene(def: Pick<ExerciseDef, 'type' | 'generate'>): boolean {
  const t = SCREEN_TYPES[def.type];
  return Boolean(t) && !def.generate && !t.ordered && typeof t.batch === 'number';
}

/**
 * Le passage de révision d'un lieu, aujourd'hui : les questions dues de ses missions (celles que l'habitant propose,
 * `revisionsDeLIle`) qui peuvent se revoir ici ; rien s'il n'y en a aucune (« Reprendre » garde alors l'écran habituel).
 * Les exercices se chargent un à un, dans l'ordre de la file, et le chargement s'arrête dès que le passage a ses
 * `REVISION_MAX` questions : une longue file ne charge que les premiers (avis de l'expert frontend, lots L2 et L3).
 */
export async function revisionPlanOf(
  spaced: SpacedItem[],
  links: string[],
  place: PlaceId,
  lv2?: Lv2Choice,
  today = todayISO(),
  load: (id: string) => Promise<ExerciseDef | undefined> = loadExercise,
): Promise<RevisionPlan | null> {
  const island = placeById(place).island as BiomeId;
  const types = new Set(revisionsDeLIle(spaced, links, island, lv2, today).map((q) => q.type));
  const metas = new Map(CATALOG.filter((m) => m.biome === island && types.has(m.type)).map((m) => [m.id, m]));
  const due = dueItems(spaced, today).flatMap((s) => {
    const d = splitItem(s.itemId);
    const meta = metas.get(d.exercise);
    return meta ? [{ ...d, type: meta.type, level: meta.level }] : [];
  });
  const defs = new Map<string, ExerciseDef | undefined>();
  const eligible = (exercise: string, key: string) => {
    const def = defs.get(exercise);
    return Boolean(def && revisableInScene(def) && def.items.some((it) => it.key === key));
  };
  const taken = new Set<string>();
  for (const d of due) {
    if (taken.size >= REVISION_MAX) break;
    if (!defs.has(d.exercise)) defs.set(d.exercise, await load(d.exercise));
    if (eligible(d.exercise, d.key)) taken.add(`${d.exercise}:${d.key}`);
  }
  const loaded = due.filter((d) => defs.has(d.exercise));
  const segments = planRevision(loaded, eligible).map((s) => {
    const meta = loaded.find((d) => d.exercise === s.exercise);
    return { ...s, type: meta?.type ?? '', level: meta?.level ?? 1 };
  });
  if (!segments.length) return null;
  return { place, segments, total: segments.reduce((n, s) => n + s.keys.length, 0) };
}
