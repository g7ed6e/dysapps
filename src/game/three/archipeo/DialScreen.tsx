// Le geste « régler » (GD-26, piste « Quatre gestes du métier ») : régler un nombre de crans avec « Un de moins » et
// « Un de plus », un cran par appui, puis « Valider ». À la Forge, les coups de soufflet de « 10 000 = 10 puissance
// combien ? » : chaque coup multiplie par 10, et la valeur ne s'allume qu'à « Valider » (avis du contenu : sinon l'élève
// règle jusqu'à ce que les nombres se ressemblent). La correction est celle de l'écran à choix : la réponse réglée
// (« 10⁴ ») face à celle de l'item, une seule fois. À la Montée, le godet sur l'échelle graduée de « −3 + 5 » : il part
// de −3 (`start`), descend sous zéro, un cran par appui, et « Valider » est actif dès le départ (rester sur −3 est une
// réponse) ; l'aide ne montre que le départ (`aid` du réglage), jamais le bond ni l'arrivée.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import type { ScreenProps } from '../../exercises/registry';
import type { ExerciseItem } from '../../exercises/types';
import { PlaceAid, PlaceCarnet, aidData, aidOf, placeSceneOf, slotStyles, useQuestion, useStopOnLeave } from './placeScreen';

/**
 * Le réglage d'un item : ses bornes (la plus petite qu'on peut valider, la plus grande), le réglage juste, la valeur de
 * chaque position, de la plus basse à la plus haute (« 10⁴ = 10 000 »). `start` : la position de départ (0 par défaut) ;
 * `unit` : des coups comptés depuis zéro (la Forge), ou des crans comptés depuis le départ (la Montée) ; `aid` : l'aide
 * du lieu, à la place de celle de l'item quand celle-ci dessine l'arrivée.
 */
export interface Dial {
  min: number;
  max: number;
  answer: number;
  values: string[];
  start: number;
  unit: 'coup' | 'cran';
  aid?: unknown;
}

/** Le réglage d'un item à régler, ou `null` s'il n'en a pas un d'entier. */
export function dialOf(item: ExerciseItem | undefined): Dial | null {
  const d = item?.dial as Partial<Dial> | undefined;
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  if (!d || !finite(d.min) || !finite(d.max) || !finite(d.answer) || !Array.isArray(d.values)) return null;
  const start = finite(d.start) ? d.start : 0;
  return { min: d.min, max: d.max, answer: d.answer, values: d.values.map(String), start, unit: d.unit === 'cran' ? 'cran' : 'coup', aid: d.aid };
}

/** La plus basse position du réglage : zéro coup à la Forge (on ne valide qu'à partir d'un), −10 à la Montée. */
export const lowestOf = (dial: Dial): number => Math.min(dial.start, dial.min);

/** La réponse réglée, écrite comme les choix de l'item (« 10⁴ ») : le début de sa valeur, avant « = ». */
const chosenOf = (dial: Dial, count: number): string => (dial.values[count - lowestOf(dial)] ?? '').split(' = ')[0];

/** Ce que dit le réglage, sans sa valeur : « 4 coups sur 7 », ou « 3 crans vers le bas » depuis le départ. */
export function dialWords(dial: Dial, count: number): string {
  if (dial.unit === 'coup') return `${count} coup${count > 1 ? 's' : ''} sur ${dial.max}`;
  const d = count - dial.start;
  if (d === 0) return 'Au départ';
  return `${Math.abs(d)} cran${Math.abs(d) > 1 ? 's' : ''} vers le ${d > 0 ? 'haut' : 'bas'}`;
}

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
  const short = typeof item?.shortInstruction === 'string' ? item.shortInstruction : undefined;
  const dialAid = dial?.aid;
  const aid = useMemo(() => (dialAid !== undefined ? aidData(dialAid) : aidOf(item)), [dialAid, item]);
  // Au départ, aucun coup (la lueur vaut 1), ou le godet sur le premier nombre. Au deuxième essai, le réglage tenté
  // reste, barré dans la correction.
  const start = dial?.start ?? 0;
  const [count, setCount] = useState(start);
  const itemKey = String(item?.key ?? '');
  useEffect(() => setCount(start), [itemKey, start]);
  const right = Boolean(answered?.results.length) && Boolean(answered?.results.every((r) => r.correct));
  const inBubble = !simple && scene !== null;
  const max = dial?.max ?? 0;
  const lowest = dial ? lowestOf(dial) : 0;
  useEffect(() => {
    if (!scene) return;
    // La scène montre les crans sans nombre (à la Forge, la lueur de la gueule monte d'un cran par coup ; à la Montée,
    // le godet monte ou descend d'un échelon).
    show({ key: itemKey, scene, answered: right, right: [], picked: [], count: SLOTS, aid: Boolean(aid) && inBubble, gesture: 'régler', short, dial: { count, max, min: lowest, start } });
  }, [show, itemKey, scene, right, aid, inBubble, short, count, max, lowest, start]);
  if (!item || !scene || !dial) return null;

  const tried = ruledOut ?? [];
  const chosen = chosenOf(dial, count);
  const validate = () => {
    if (answered || count < dial.min) return;
    onAnswer({ results: [{ key: item.key, correct: chosen === answer }], detail: { chosen } });
  };
  const at = (slot: number) => (simple ? { hit: undefined, label: undefined } : slotStyles(layout.slots[slot] ?? layout.slots[0]));
  const validateBox = simple ? null : layout.scenette.validate;
  // Les coups : un point plein par coup réglé, sans nombre écrit ni valeur (la valeur s'allume à « Valider »). Les crans
  // de la Montée n'en ont pas : le godet sur l'échelle les montre.
  const notches = dial.unit === 'coup' && (
    <span className="world-dial-crans" aria-hidden="true">
      {Array.from({ length: dial.max }, (_, i) => (
        <span key={i} className={`world-dial-cran${i < count ? ' plein' : ''}`} />
      ))}
    </span>
  );
  // « 0 coup sur 7 » : les points vides se disent aussi en mots (référent dys).
  const words = dialWords(dial, count);
  const unit = dial.unit === 'cran' ? 'Un cran' : 'Un coup';
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
          aria-label={`${unit} de moins`}
          disabled={Boolean(answered) || count <= lowest}
          onClick={() => setCount((c) => Math.max(lowest, c - 1))}
        >
          <span className="world-answer-label" style={minus.label}>
            <Icon name="moins" />
          </span>
        </button>
        <p style={middle.hit} className={`word-card world-answer world-dial-compte${verdict ? ` ${verdict}` : ''}`} role="status">
          <span className="world-answer-label" style={middle.label}>
            {notches}
            <span className="word-text">{words}</span>
            {/* La valeur ne s'allume qu'à « Valider » ; un réglage déjà tenté se dit barré. */}
            {answered && <span className="word-note">{frenchTypography(dial.values[count - lowest] ?? '')}</span>}
            {!answered && tried.includes(chosen) && <span className="word-note">déjà essayé</span>}
          </span>
        </p>
        <button
          type="button"
          style={plus.hit}
          className="choice world-answer world-dial-plus"
          aria-label={`${unit} de plus`}
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
