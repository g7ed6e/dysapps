// Le bilan d'une mission jouée dans un lieu du monde ouvert (lot 4, retours UX UI et dys) : les trois étoiles, une
// rangée de pastilles « icône + nombre » sur une ligne, sans phrases ; le détail de l'écran classique derrière
// « Détail » ; un seul bouton, « Continuer », fixe sous le bilan et toujours visible. Les célébrations (« Succès
// débloqué ») attendent que le bilan se ferme (WorldQuestion les retient).
// Le bilan d'une révision dans la scène (GD-20, point 4, lot L3, `revised`) : un seul, à la fin du passage ; sa phrase
// (« Tu as revu 5 questions. ») à la place des étoiles, rien qui dise un score ou un échec, les pastilles de tout le
// passage, et ni « Détail » (celui d'une mission) ni rien d'autre que « Continuer ».
import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { BLOCKS, ofBlock } from '../../biomes';
import type { StageDoneProps } from '../../ExerciseRunner';
import { Stars } from '../../Stars';
import { BlockIcon } from '../../Voxel';
import { Syllabified } from '../../../components/Syllabified';
import { SpeakButton } from '../../../components/SpeakButton';
import { frenchTypography } from '../../../components/math/RichText';
import type { BlockId } from '../../biomes';

/** Ce qu'un passage de révision a donné, tous ses morceaux réunis. */
export interface RevisedSummary {
  /** La phrase de fin, remplie (« Tu as revu 5 questions. »). */
  said: string;
  blocks: { block: BlockId; n: number }[];
  xp: number;
}

/** Le titre du bilan, dit aux lecteurs d'écran (les étoiles le montrent). */
function titleOf(completion: StageDoneProps['completion']): string {
  if (completion.perfect) return 'Sans faute !';
  return completion.stars === 3 ? 'Superbe !' : completion.stars === 2 ? 'Bien joué !' : 'Terminé !';
}

export function WorldDone({ completion, detail, pause, back, revised }: StageDoneProps & { revised?: RevisedSummary }) {
  const [open, setOpen] = useState(false);
  const chest = completion.chestBlock ? BLOCKS[completion.chestBlock] : null;
  const parts = completion.pose?.posees.length ?? 0;
  const streak = completion.streak.extended ? completion.streak.streak.current : 0;
  return (
    <div className="panel summary reward-panel world-done">
      <div className="world-done-body">
        {revised ? (
          <div className="world-done-revised">
            <h2 id="fin-titre">
              <Syllabified text={frenchTypography(revised.said)} />
            </h2>
            <SpeakButton text={frenchTypography(revised.said)} compact />
          </div>
        ) : (
          <>
            <h2 id="fin-titre" className="visually-hidden">
              {titleOf(completion)}
            </h2>
            <Stars count={completion.stars} size="2.4rem" />
          </>
        )}
        <ul className="world-done-pills">
          {(revised?.blocks ?? [{ block: completion.block, n: completion.blocks }]).map(({ block: id, n }) => (
            <li key={id} aria-label={`${n} bloc${n > 1 ? 's' : ''} ${ofBlock(id)}`}>
              <BlockIcon top={BLOCKS[id].top} side={BLOCKS[id].side} size={32} />
              <span aria-hidden="true">+{n}</span>
            </li>
          ))}
          <li aria-label={`${revised?.xp ?? completion.xp} XP`}>
            <Icon name="zap" size="1.4rem" />
            <span aria-hidden="true">+{revised?.xp ?? completion.xp}</span>
          </li>
          {parts > 0 && (
            <li aria-label={`${parts} partie${parts > 1 ? 's' : ''} posée${parts > 1 ? 's' : ''}`}>
              <Icon name="home" size="1.4rem" />
              <span aria-hidden="true">+{parts}</span>
            </li>
          )}
          {chest && completion.chestBlock && (
            <li aria-label={`Coffre : 6 blocs ${ofBlock(completion.chestBlock)}`}>
              <BlockIcon top={chest.top} side={chest.side} size={32} />
              <span aria-hidden="true">+6</span>
            </li>
          )}
          {streak > 0 && (
            <li aria-label={`${streak} jour${streak > 1 ? 's' : ''} d’affilée`}>
              <Icon name="flame" size="1.4rem" />
              <span aria-hidden="true">{streak}</span>
            </li>
          )}
        </ul>
        {!revised && (
          <button type="button" className="button world-done-detail" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name="liste" /> Détail
          </button>
        )}
        {open && !revised && <div className="world-done-more">{detail}</div>}
      </div>
      {pause ?? (
        <button type="button" className="button primary world-done-continue" autoFocus onClick={back.onClick}>
          <Icon name="chevronRight" /> Continuer
        </button>
      )}
    </div>
  );
}
