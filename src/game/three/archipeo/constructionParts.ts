// Les parties de la construction d'un lieu du monde continu (GD-20, lot 1) : celles de la grille, lues telles quelles
// (world/parts.ts), mêmes identifiants, même ordre, même sauvegarde (`world.parts`, les cases posées plan par plan) ;
// une partie posée dans la grille l'est ici, et inversement, sans rien de neuf dans la sauvegarde. Chaque partie
// devient les tranches d'étapes qu'elle pose dans le lieu, qui se rebâtit lui-même (world/continu/construction.ts) : le plan `<lieu>-1`
// est le corps, `-2` le haut, `-3` les abords ; un plan coupé en deux ou en trois rangées (GD-14) en tranches qui se
// suivent, de bas en haut. Sans Three.js : testé sous jsdom.
import type { BiomeId } from '../../biomes';
import type { PartShape, Stage } from '../../world/continu/construction';
import type { OpenPlace } from '../../world/continu/levelPlan';
import type { IslandStateId } from '../../world/islandState';
import { partiePosee, partiesDe } from '../../world/parts';
import { plansFor, type PlanDef } from '../../world/plans';
import type { PoseLine, PoseWords } from '../../ExerciseRunner';

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

/**
 * Les lieux dont le nom est celui d'un site, jamais suivi du mot d'achèvement de l'univers sur la Carte (consultant
 * Archipéo, lot L8b : « Les Ruines », jamais « restaurées ») : leur bouton dit à la place le geste du lieu, accordé
 * (relecture dys de L8 : « Les Ruines, relevées » ; « relever » est le geste, consultant Archipéo). Dans le nom que
 * dit le bouton seulement : rien ne change à l'écran, où le ✓ reste. « En chantier » reste dit.
 */
const SITE_DONE_WORDS: Partial<Record<OpenPlace['id'], string>> = { ruins: 'Relevée' };

/** Le mot d'état d'un lieu que dit son bouton sur la Carte, ou rien (sans état). */
export function mapStateWord(place: OpenPlace, state: 'en-chantier' | 'restauree' | null, words: Readonly<Record<IslandStateId, string>>): string | null {
  if (!state) return null;
  const site = state === 'restauree' ? SITE_DONE_WORDS[place.id] : undefined;
  return stateWord(state, site ? { ...words, restauree: site } : words, place.agree);
}

/** Les étapes d'un lieu, dans l'ordre où elles se posent (GD-20 : le corps, le haut, les abords). */
const STAGE_WORDS: Readonly<Record<Stage, string>> = { 0: 'le corps', 1: 'le haut', 2: 'les abords' };

/** « du Hameau », « de la Montée », « des Radeaux », « de l’Auberge » : le complément d'un lieu, depuis sa forme « à ». */
export const ofOpenPlace = (place: Pick<OpenPlace, 'at'>): string => place.at.replace(/^aux /, 'des ').replace(/^au /, 'du ').replace(/^à /, 'de ');

/** Les étapes que pose une partie (« le corps », « le haut et les abords »), sa part d'une étape coupée (1 sur 3) et si elle en pose plusieurs (l'accord : « Étapes finies »). */
function partWords(shape: PartShape): { words: string; share: string; many: boolean } {
  const stages = [...new Set(shape.map((s) => s.stage))];
  const words = stages.map((st) => STAGE_WORDS[st]).join(' et ');
  const only = shape.length === 1 ? shape[0] : null;
  if (!only || only.to - only.from > 0.999) return { words, share: '', many: stages.length > 1 };
  const total = Math.round(1 / (only.to - only.from));
  return { words, share: `, ${Math.round(only.to * total)} sur ${total}`, many: false };
}

/**
 * Les mots de la pose au bilan d'un lieu du monde ouvert du 5e (directeur du contenu pédagogique, lot 5 du 5e, puis
 * retouche 2) : une phrase par partie posée, nommée par les étapes qu'elle pose, jamais par le nom d'un plan ni sa
 * réplique. Une partie qui finit son plan (ou ses plans) : « Étape finie : le corps du Hameau. », et l'XP des plans finis,
 * sans « Partie posée » en plus ; sinon « Partie posée : le corps de la Montée, 1 sur 2. » ; une partie de deux étapes
 * (un lieu à deux parties) : « le haut et les abords de l’Imprimerie », et « Étapes finies » quand elle les finit toutes deux. Sans React : testé sous jsdom.
 */
export function stagePoseWords(island: BiomeId, place: Pick<OpenPlace, 'at'>): PoseWords {
  const of = ofOpenPlace(place);
  const plans = plansFor(island);
  const stageOfPlan = (plan: PlanDef): Stage => Math.max(0, Math.min(2, plans.findIndex((p) => p.id === plan.id))) as Stage;
  return {
    lines(pose) {
      const finished = new Map(pose.plansFinis.map((p) => [p.id, p]));
      const told = new Set<string>();
      const lines: PoseLine[] = pose.posees.map((partie) => {
        const shape = partShapes(island)[partie.rang - 1] ?? [];
        const own = [...new Set(partie.cases.map((c) => c.plan.id))];
        const ends = own.filter((id) => finished.has(id));
        const { words, share, many } = partWords(shape);
        if (ends.length && ends.length === own.length) {
          for (const id of ends) told.add(id);
          return { text: `${many ? 'Étapes finies' : 'Étape finie'} : ${words} ${of}.`, xp: ends.reduce((sum, id) => sum + finished.get(id)!.reward.xp, 0) };
        }
        return { text: `Partie posée : ${words} ${of}${share}.` };
      });
      // Un plan fini qu'aucune phrase n'a dit (une partie qui en finit un et en commence un autre) : sa phrase à lui.
      for (const plan of pose.plansFinis) if (!told.has(plan.id)) lines.push({ text: `Étape finie : ${STAGE_WORDS[stageOfPlan(plan)]} ${of}.`, xp: plan.reward.xp });
      return lines;
    },
  };
}
