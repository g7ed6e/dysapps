// Le geste « régler » (GD-26, piste « Quatre gestes du métier ») : régler un nombre de crans avec « Un de moins » et
// « Un de plus », un cran par appui, puis « Valider ». À la Forge, les coups de soufflet de « 10 000 = 10 puissance
// combien ? » : chaque coup multiplie par 10, et la valeur ne s'allume qu'à « Valider » (avis du contenu : sinon l'élève
// règle jusqu'à ce que les nombres se ressemblent). La correction est celle de l'écran à choix : la réponse réglée
// (« 10⁴ ») face à celle de l'item, une seule fois.
import { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import type { ScreenProps } from '../../exercises/registry';
import type { ExerciseItem } from '../../exercises/types';
import { PlaceAid, PlaceCarnet, aidOf, placeSceneOf, slotStyles, useQuestion, useStopOnLeave } from './placeScreen';

/** Le réglage d'un item : ses bornes, le nombre de crans juste, la valeur de chaque nombre de crans (« 10⁴ = 10 000 »). */
export interface Dial {
  min: number;
  max: number;
  answer: number;
  values: string[];
}

/** Le réglage d'un item à régler, ou `null` s'il n'en a pas un d'entier. */
export function dialOf(item: ExerciseItem | undefined): Dial | null {
  const d = item?.dial as Partial<Dial> | undefined;
  if (!d || typeof d.min !== 'number' || typeof d.max !== 'number' || typeof d.answer !== 'number' || !Array.isArray(d.values)) return null;
  return { min: d.min, max: d.max, answer: d.answer, values: d.values.map(String) };
}

/** La réponse réglée, écrite comme les choix de l'item (« 10⁴ ») : le début de sa valeur, avant « = ». */
const chosenOf = (dial: Dial, count: number): string => (dial.values[count] ?? '').split(' = ')[0];

/** Les places de la rangée : « Un de moins », les crans, « Un de plus ». */
const SLOTS = 3;

export function DialScreen({ items, answered, onAnswer, ruledOut }: ScreenProps) {
  const { layout, show, simple } = useQuestion();
  useStopOnLeave();
  const item = items[0];
  const scene = placeSceneOf(item);
  const dial = dialOf(item);
  const prompt = String(item?.prompt ?? '');
  const spoken = String(item?.spoken ?? prompt);
  const answer = String(item?.answer ?? '');
  const aid = aidOf(item);
  const short = typeof item?.shortInstruction === 'string' ? item.shortInstruction : undefined;
  // Au départ, aucun coup : la lueur vaut 1. Au deuxième essai, le réglage tenté reste, barré dans la correction.
  const [count, setCount] = useState(0);
  const itemKey = String(item?.key ?? '');
  useEffect(() => setCount(0), [itemKey]);
  const right = Boolean(answered?.results.length) && Boolean(answered?.results.every((r) => r.correct));
  const inBubble = !simple && scene !== null;
  useEffect(() => {
    if (!scene) return;
    show({ key: itemKey, scene, answered: right, right: [], picked: [], count: SLOTS, aid: Boolean(aid) && inBubble, gesture: 'régler', short });
  }, [show, itemKey, scene, right, aid, inBubble, short]);
  if (!item || !scene || !dial) return null;

  const tried = ruledOut ?? [];
  const chosen = chosenOf(dial, count);
  const validate = () => {
    if (answered || count < dial.min) return;
    onAnswer({ results: [{ key: item.key, correct: chosen === answer }], detail: { chosen } });
  };
  const at = (slot: number) => (simple ? { hit: undefined, label: undefined } : slotStyles(layout.slots[slot] ?? layout.slots[0]));
  const validateBox = simple ? null : layout.scenette.validate;
  // Les crans : un point plein par coup réglé, sans nombre écrit ni valeur (la valeur s'allume à « Valider »).
  const notches = (
    <span className="world-dial-crans" aria-hidden="true">
      {Array.from({ length: dial.max }, (_, i) => (
        <span key={i} className={`world-dial-cran${i < count ? ' plein' : ''}`} />
      ))}
    </span>
  );
  const coups = `${count} coup${count > 1 ? 's' : ''}`;
  const verdict = answered ? (chosen === answer ? 'right' : 'wrong') : '';
  const minus = at(0);
  const middle = at(1);
  const plus = at(2);

  return (
    <div className="question world-place world-dial">
      <div className="world-question-prompt">
        <div className="question-head">
          <p className="question-prompt">{frenchTypography(prompt)}</p>
          <SpeakButton text={frenchTypography(spoken)} label="Question" compact />
        </div>
        {!answered && !validateBox && (
          <button type="button" className="button primary validate-button" disabled={count < dial.min} onClick={validate}>
            <Icon name="check" /> Valider
          </button>
        )}
        {aid && !inBubble && <PlaceAid aid={aid} layout={layout} simple={simple} />}
      </div>
      {aid && inBubble && layout.aid && (
        <PlaceCarnet box={layout.aid}>
          <PlaceAid aid={aid} layout={layout} simple />
        </PlaceCarnet>
      )}
      <div className="world-answers world-dial-rangee" role="group" aria-label="Réglage">
        <button
          type="button"
          style={minus.hit}
          className="choice world-answer world-dial-moins"
          aria-label="Un coup de moins"
          disabled={Boolean(answered) || count <= 0}
          onClick={() => setCount((c) => Math.max(0, c - 1))}
        >
          <span className="world-answer-label" style={minus.label}>
            <Icon name="moins" />
          </span>
        </button>
        <p style={middle.hit} className={`word-card world-answer world-dial-compte${verdict ? ` ${verdict}` : ''}`} role="status">
          <span className="world-answer-label" style={middle.label}>
            {notches}
            <span className="word-text">{coups}</span>
            {/* La valeur ne s'allume qu'à « Valider » ; un réglage déjà tenté se dit barré. */}
            {answered && <span className="word-note">{frenchTypography(dial.values[count] ?? '')}</span>}
            {!answered && tried.includes(chosen) && <span className="word-note">déjà essayé</span>}
          </span>
        </p>
        <button
          type="button"
          style={plus.hit}
          className="choice world-answer world-dial-plus"
          aria-label="Un coup de plus"
          disabled={Boolean(answered) || count >= dial.max}
          onClick={() => setCount((c) => Math.min(dial.max, c + 1))}
        >
          <span className="world-answer-label" style={plus.label}>
            <Icon name="plus" />
          </span>
        </button>
      </div>
      {!answered && validateBox && (
        <button type="button" className="button primary validate-button world-validate" disabled={count < dial.min} onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
    </div>
  );
}
