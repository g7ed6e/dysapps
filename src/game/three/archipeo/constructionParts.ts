// Les parties de la construction d'un lieu du monde continu (GD-20, lot 1) : celles de la grille, lues telles quelles
// (world/parts.ts), mêmes identifiants, même ordre, même sauvegarde (`world.parts`, les cases posées plan par plan) ;
// une partie posée dans la grille l'est ici, et inversement, sans rien de neuf dans la sauvegarde. Chaque partie
// devient les tranches d'étapes qu'elle pose dans le lieu, qui se rebâtit lui-même (world/continu/construction.ts) : le plan `<lieu>-1`
// est le corps, `-2` le haut, `-3` les abords ; un plan coupé en deux ou en trois rangées (GD-14) en tranches qui se
// suivent, de bas en haut. Sans Three.js : testé sous jsdom.
import type { BiomeId } from '../../biomes';
import type { PartShape, Stage } from '../../world/continu/construction';
import type { OpenPlace } from '../../world/continu/plan6e';
import type { IslandStateId } from '../../world/islandState';
import { partiePosee, partiesDe } from '../../world/parts';
import { plansFor } from '../../world/plans';

/** La construction d'un lieu vue par le monde continu : ses parties dans l'ordre, et le nombre de celles qui sont posées. */
export interface PlaceConstruction {
  /** Chaque partie, dans l'ordre de la grille, en tranches d'étapes. */
  shapes: PartShape[];
  /** Les parties posées (pas forcément les premières : une sauvegarde d'avant GD-6 peut en avoir posé d'autres). */
  posed: boolean[];
}

const SHAPES = new Map<BiomeId, PartShape[]>();

/** Les parties de la construction d'un lieu, en tranches d'étapes (calculées une fois par lieu). */
export function partShapes(island: BiomeId): PartShape[] {
  const cached = SHAPES.get(island);
  if (cached) return cached;
  const plans = plansFor(island);
  const parties = partiesDe(island);
  // Combien de parties touchent chaque plan : un plan coupé en `m` rangées donne `m` tranches.
  const cuts = plans.map((plan) => parties.filter((p) => p.cases.some((c) => c.plan.id === plan.id)).length);
  const seen = plans.map(() => 0);
  const shapes = parties.map((partie) =>
    partie.cases.flatMap(({ plan }) => {
      const i = plans.findIndex((p) => p.id === plan.id);
      if (i < 0 || i > 2) return [];
      const k = seen[i]++;
      const m = Math.max(1, cuts[i]);
      return [{ stage: i as Stage, from: k / m, to: (k + 1) / m }];
    }),
  );
  SHAPES.set(island, shapes);
  return shapes;
}

/** La construction d'un lieu dans une sauvegarde : ses parties et celles qui sont posées. */
export function placeConstruction(island: BiomeId, parts: Record<string, string[]>): PlaceConstruction {
  return { shapes: partShapes(island), posed: partiesDe(island).map((p) => partiePosee(p, parts)) };
}

/** Les parties posées d'une construction, en tranches (ce que la scène dessine). */
export const posedShapes = (c: PlaceConstruction): PartShape[] => c.shapes.filter((_, i) => c.posed[i]);

/** L'état d'un lieu sur la Carte, déduit de ses parties : en chantier (au moins une posée), achevé (toutes), ou rien. */
export function constructionState(c: PlaceConstruction): 'en-chantier' | 'restauree' | null {
  const n = c.posed.filter(Boolean).length;
  if (!n || !c.shapes.length) return null;
  return n === c.shapes.length ? 'restauree' : 'en-chantier';
}

/**
 * Le mot d'état d'un lieu sur la Carte, accordé à son nom : le mot de l'univers est écrit pour une île, au féminin
 * singulier (« Restaurée ») ; le Phare est « Restauré », les Quais et les Filets « Restaurés », les Écluses
 * « Restaurées ». « En chantier » ne s'accorde pas. (« Achevé » est le mot neutre du jeu commun, GD-20.)
 */
export function stateWord(state: 'en-chantier' | 'restauree', words: Readonly<Record<IslandStateId, string>>, agree: OpenPlace['agree']): string {
  const word = words[state];
  if (state !== 'restauree' || !word.endsWith('e')) return word;
  const masculine = word.slice(0, -1);
  return { ms: masculine, mp: `${masculine}s`, fs: word, fp: `${word}s` }[agree];
}
