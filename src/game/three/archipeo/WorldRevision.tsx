// La révision jouée dans la scène du lieu (GD-20, point 4, piste B « La remise », lot L3, B2) : « Reprendre », chez
// l'habitant, joue les questions dues des missions de ce lieu, dans sa scène, mission par mission (WorldQuestion, un
// morceau après l'autre, chacun avec sa consigne et sa scénette, ou le panneau posé pour une mission de panneau). Le
// repère compte les questions de tout le passage (« 2 sur 5 ») ; la consigne du premier morceau dit que c'est une
// révision (« Tu revois 5 questions. »), sans date ni rappel d'échec ; la file s'enregistre à la fin de chaque morceau ;
// un seul bilan, à la fin (« Tu as revu 5 questions. »), avec ce que tout le passage a donné.
import { useCallback, useMemo, useRef, useState } from 'react';
import type { BlockId } from '../../biomes';
import type { Completion } from '../../engine';
import type { StageDoneProps } from '../../ExerciseRunner';
import { playsInPlace } from '../../world/continu/mission';
import { REVISION_PHRASES, filled, questionsWord } from '../../world/continu/remise';
import { placeById } from '../../world/continu/levelPlan';
import type { RevisionPlan } from './revisionOf';
import type { OpenWorld } from './scene';
import { WorldDone, type RevisedSummary } from './WorldDone';
import { WorldQuestion, type WorldRevisionPart } from './WorldQuestion';

interface Props {
  plan: RevisionPlan;
  world: OpenWorld;
  /** Fin du passage (« Continuer », Quitter) : la page rend la main au monde. */
  onClose(): void;
}

/** Ce que les morceaux ont donné, réunis : les blocs par sorte, l'XP. */
export function revisedSummary(parts: readonly Completion[], total: number): RevisedSummary {
  const blocks = new Map<BlockId, number>();
  for (const c of parts) blocks.set(c.block, (blocks.get(c.block) ?? 0) + c.blocks);
  return {
    said: filled(REVISION_PHRASES.done, { questions: questionsWord(total) }),
    blocks: [...blocks].filter(([, n]) => n > 0).map(([block, n]) => ({ block, n })),
    xp: parts.reduce((n, c) => n + c.xp, 0),
  };
}

export function WorldRevision({ plan, world, onClose }: Props) {
  const [index, setIndex] = useState(0);
  // Ce que chaque morceau a donné : lu par le bilan du dernier (un ref, pour ne pas refaire la question en cours).
  const parts = useRef<Completion[]>([]);
  const segment = plan.segments[index];
  const offset = plan.segments.slice(0, index).reduce((n, s) => n + s.keys.length, 0);
  const last = index === plan.segments.length - 1;
  const onPart = useCallback(
    (completion: Completion) => {
      parts.current = [...parts.current.slice(0, index), completion];
      if (!last) setIndex(index + 1);
    },
    [index, last],
  );
  const Done = useCallback(
    (p: StageDoneProps) => {
      // Le coffre et la série du jour viennent du morceau qui les a donnés : le bilan les montre une fois.
      const chest = parts.current.find((c) => c.chestBlock);
      const streak = parts.current.find((c) => c.streak.extended)?.streak ?? p.completion.streak;
      return <WorldDone {...p} completion={{ ...p.completion, chestBlock: chest?.chestBlock, streak }} revised={revisedSummary(parts.current, plan.total)} />;
    },
    [plan.total],
  );
  const part = useMemo<WorldRevisionPart>(
    () => ({
      exercise: segment.exercise,
      level: segment.level,
      keys: segment.keys,
      offset,
      total: plan.total,
      last,
      entry: index === 0 ? filled(REVISION_PHRASES.entry, { questions: questionsWord(plan.total) }) : null,
      onPart,
      Done,
    }),
    [segment, offset, plan.total, last, index, onPart, Done],
  );
  return (
    <WorldQuestion
      key={`${plan.place}-${index}`}
      place={plan.place}
      mission={segment.type}
      plain={!playsInPlace(placeById(plan.place), segment.type)}
      world={world}
      onClose={onClose}
      revision={part}
    />
  );
}
