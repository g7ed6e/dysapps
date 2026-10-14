// La mission jouée dans un lieu du monde ouvert (lot 4, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) :
// le lanceur d'exercice commun (ExerciseRunner), avec les mêmes items, la même correction, les mêmes étoiles et le même
// barème, posé sur la scène. La consigne, la phrase et le résultat sont dans une colonne sur fond uni (à gauche, ou en
// haut sur un écran étroit) ; les réponses sont des boutons en bas de l'écran, chacun sous l'objet du lieu qui la porte
// (cloche, panier, levier, caisse) ; la scène de l'item se montre dans le reste, la caméra fixe. Rien à lire n'est peint
// dans la 3D. « Vue simple » rouvre l'écran classique de la même mission.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { ForeignWordsProvider, Marked } from '../../../components/ForeignWords';
import { RichText, frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { seeded } from '../../../core/random';
import { useSettings } from '../../../core/SettingsContext';
import { useLoaded } from '../../../core/useLoaded';
import { useBlocland } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import { levelFor } from '../../engine';
import { ExerciseRunner, type RunnerStage } from '../../ExerciseRunner';
import { loadExercise, pickExercise } from '../../exercises';
import type { ScreenProps } from '../../exercises/registry';
import { CARD_CLASS, cardState, sortSummary } from '../../exercises/sortCards';
import type { ExerciseItem } from '../../exercises/types';
import { exercisesToReview } from '../../review';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { questionLayout, type QuestionLayout } from '../../world/continu/questionScene';
import { bellRounds, placeInstruction, placeItems, type ItemScene, type PlacedItem } from '../../world/continu/questions';
import type { LabelOnScreen, OpenWorld } from './scene';

/** Ce que l'écran d'un lieu demande à la scène : l'item à montrer, et combien de réponses il a. */
interface ItemShown {
  scene: ItemScene;
  answered: boolean;
  right: number[];
  count: number;
}

interface QuestionContextValue {
  layout: QuestionLayout;
  show(item: ItemShown | null): void;
}

const QuestionContext = createContext<QuestionContextValue | null>(null);

/** Le nombre de réponses tant que l'écran ne l'a pas dit. */
const DEFAULT_COUNT = 3;

interface Props {
  place: PlaceId;
  mission: string;
  world: OpenWorld;
  /** Fin de la question (« Revenir au Phare », Quitter) : la page rend la main au monde. */
  onClose(): void;
  /** « Vue simple » : l'écran classique de la même mission. */
  onSimpleView(): void;
}

export function WorldQuestion({ place, mission, world, onClose, onSimpleView }: Props) {
  const { state } = useBlocland();
  const lieu = placeById(place);
  const biome = getBiome(lieu.island);
  const [run, setRun] = useState(0);
  // L'exercice est choisi comme sur l'écran classique (ExercisePage) : au lancement et à chaque « Rejouer ».
  const picked = useMemo(
    () => (biome ? pickExercise(biome.id, mission, levelFor(state, mission), state.progress, exercisesToReview(state.spaced)) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome?.id, mission, run],
  );
  const loaded = useLoaded(async () => (picked ? ((await loadExercise(picked.id)) ?? null) : null), [picked]);

  // La taille de la page, relue au redimensionnement : la place des réponses, de la colonne et de la scène en dépend.
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);

  const [item, setItem] = useState<ItemShown | null>(null);
  const [labels, setLabels] = useState<LabelOnScreen[]>([]);
  const layout = useMemo(() => questionLayout(item?.count ?? DEFAULT_COUNT, size.w || 1, size.h || 1), [item?.count, size]);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!size.w || !size.h || !item || finished) return;
    setLabels(world.question({ place, layout, item }));
  }, [world, place, layout, item, size, finished]);
  // La fin de la mission : la caméra revient au lieu, où la pièce remise en marche se voit derrière le bilan.
  useEffect(() => {
    if (!finished) return;
    world.question(null);
    setLabels([]);
  }, [world, finished]);
  // En partant (« Revenir », Quitter, « Vue simple »), la scène reprend son cadrage.
  useEffect(() => () => void world.question(null), [world]);

  const show = useCallback((next: ItemShown | null) => {
    setItem((prev) => (next && prev && sameItem(prev, next) ? prev : next));
  }, []);
  const context = useMemo(() => ({ layout, show }), [layout, show]);

  const stage = useMemo<RunnerStage | null>(() => {
    if (!loaded || !picked) return null;
    const simple = (
      <button type="button" className="button world-question-simple" onClick={onSimpleView}>
        <Icon name="liste" /> Vue simple
      </button>
    );
    return {
      screens:
        place === 'phare'
          ? (items, seed) => bellRounds(placeItems(place, loaded.id, items), seeded(`${seed}:cloches`))
          : (items) => placeItems(place, loaded.id, items).map((it) => [it]),
      Screen: place === 'phare' ? BellScreen : PlaceChoiceScreen,
      instruction: placeInstruction(place, picked.level, loaded.instruction),
      back: { label: `Revenir ${lieu.at}`, onClick: onClose },
      extra: simple,
      className: 'in-world',
    };
  }, [loaded, picked, place, lieu.at, onClose, onSimpleView]);

  const style = {
    '--question-left': `${layout.panel.left}px`,
    '--question-top': `${layout.panel.top}px`,
    '--question-width': `${layout.panel.width}px`,
    '--question-max-height': `${layout.panel.maxHeight}px`,
  } as CSSProperties;

  return (
    <div className="world-question" ref={box} style={style}>
      {!biome || loaded === null ? null : !stage ? (
        <Loading className="world-loading" />
      ) : (
        <QuestionContext.Provider value={context}>
          <ForeignWordsProvider words={biome.foreignWords}>
            <ExerciseRunner
              key={`${loaded!.id}-${run}`}
              biome={biome}
              def={loaded!}
              stage={stage}
              onComplete={() => setFinished(true)}
              onReplay={() => {
                setFinished(false);
                setItem(null);
                setRun((r) => r + 1);
              }}
            />
          </ForeignWordsProvider>
        </QuestionContext.Provider>
      )}
      {!finished &&
        labels.map((l) => (
          <span
            key={l.text}
            className="world-question-label"
            aria-hidden="true"
            style={{
              transform: `translate(${Math.round(l.x)}px, ${Math.round(l.y)}px)`,
            }}
          >
            {l.text}
          </span>
        ))}
    </div>
  );
}

// L'écran refait ses items à chaque rendu : la scène se compare par valeur, pour ne pas la refaire pour rien.
const sameItem = (a: ItemShown, b: ItemShown) =>
  JSON.stringify(a.scene) === JSON.stringify(b.scene) &&
  a.answered === b.answered &&
  a.count === b.count &&
  a.right.length === b.right.length &&
  a.right.every((r, i) => r === b.right[i]);

function useQuestion(): QuestionContextValue {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error('Un écran de lieu se pose dans une question du monde ouvert.');
  return ctx;
}

/** La place d'un bouton de réponse à l'écran. */
const answerStyle = (layout: QuestionLayout, i: number): CSSProperties => {
  const b = layout.buttons[i] ?? layout.buttons[0];
  return {
    left: `${Math.round(b.x - layout.width / 2)}px`,
    top: `${Math.round(b.y)}px`,
    width: `${Math.round(layout.width)}px`,
    height: `${layout.height}px`,
    minHeight: `${layout.height}px`,
  };
};

/**
 * Les Filets, les Écluses, les Quais : la phrase du lieu (et la ligne de calcul de référence aux Quais), l'indice sur
 * demande, une réponse par objet du lieu. La correction est celle de l'écran classique (CalculationScreen).
 */
function PlaceChoiceScreen({ items, answered, onAnswer, ruledOut, onHelp }: ScreenProps) {
  const { layout, show } = useQuestion();
  const item = items[0] as PlacedItem;
  const prompt = String(item.prompt ?? '');
  const spoken = String(item.spoken ?? prompt);
  const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
  const answer = String(item.answer ?? '');
  const hint = String(item.hint ?? '');
  const chosen = answered?.detail?.chosen;
  const [hintShown, setHintShown] = useState(false);
  const rightIndex = choices.indexOf(answer);
  useEffect(() => {
    show({
      scene: item.placeScene,
      answered: Boolean(answered),
      right: answered && rightIndex >= 0 ? [rightIndex] : [],
      count: choices.length,
    });
  }, [show, item.placeScene, answered, rightIndex, choices.length]);

  return (
    <div className="question world-place">
      <div className="world-question-prompt">
        <div className="question-head">
          <p className="question-prompt">
            <RichText text={prompt} />
          </p>
          <SpeakButton text={spoken} label="Écouter" shown={prompt} compact />
        </div>
        <div className="world-question-actions">
          {item.referenceLine && (
            <p className="world-question-reference">
              <RichText text={item.referenceLine} />
            </p>
          )}
          {hint && !answered && !hintShown && (
            <button
              type="button"
              className="button"
              onClick={() => {
                setHintShown(true);
                onHelp();
              }}
            >
              <Icon name="lightbulb" /> Un indice
            </button>
          )}
        </div>
        {hint && !answered && hintShown && (
          <p className="calcul-hint" role="status">
            <Icon name="lightbulb" /> <Marked text={hint} /> <SpeakButton text={hint} compact />
          </p>
        )}
      </div>
      <div className="world-answers" role="group" aria-label="Réponses possibles">
        {choices.map((choice, i) => {
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          return (
            <button
              key={choice}
              type="button"
              style={answerStyle(layout, i)}
              className={`choice${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
              onClick={() =>
                onAnswer({
                  results: [{ key: item.key, correct: choice === answer }],
                  detail: { chosen: choice },
                })
              }
            >
              <RichText text={choice} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Le Phare : les mots d'une manche portés par des cloches (six au plus). Toucher une cloche dit son mot et la marque
 * (ou la démarque) ; « Valider » corrige la manche, comme la Chasse au son.
 */
function BellScreen({ items, answered, onAnswer, target }: ScreenProps) {
  const { layout, show } = useQuestion();
  const { speak } = useSettings();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const scene = (items[0] as PlacedItem).placeScene;
  const right = useMemo(() => (answered ? items.flatMap((it, i) => (it.correct ? [i] : [])) : []), [items, answered]);
  useEffect(() => {
    show({ scene, answered: Boolean(answered), right, count: items.length });
  }, [show, scene, answered, right, items.length]);

  const toggle = (it: ExerciseItem) => {
    if (answered) return;
    speak(String(it.word));
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(it.key)) next.delete(it.key);
      else next.add(it.key);
      return next;
    });
  };
  const validate = () => {
    const results = items.map((it) => ({
      key: it.key,
      correct: picked.has(it.key) === Boolean(it.correct),
    }));
    const firstWrong = items.find((_, i) => !results[i].correct);
    const summary = sortSummary(
      items,
      picked,
      {
        missed: (words) => `Tu as oublié ${words} : on y entend [${target}].`,
        intruder: (word, heard) => `Dans ${word}, on entend ${heard}, pas [${target}].`,
      },
      (it) => String(it.heard),
    );
    onAnswer({
      results,
      detail: firstWrong
        ? {
            word: firstWrong.word,
            heard: firstWrong.heard,
            missed: !picked.has(firstWrong.key),
            summary,
          }
        : {},
    });
  };
  const words = items.map((it) => String(it.word));

  return (
    <div className="question world-place">
      <div className="world-question-prompt">
        <div className="world-question-actions">
          <p className="question-prompt sound-target">
            Le son <strong>[{target}]</strong>
          </p>
          <SpeakButton text={frenchTypography(words.join(', '))} label="Écouter les cloches" />
          {!answered && (
            <button type="button" className="button primary validate-button" onClick={validate}>
              <Icon name="check" /> Valider
            </button>
          )}
        </div>
      </div>
      <ul className="world-answers" aria-label="Cloches à trier">
        {items.map((it, i) => {
          const on = picked.has(it.key);
          const st = answered ? cardState(it, on) : null;
          return (
            <li key={it.key}>
              <button
                type="button"
                style={answerStyle(layout, i)}
                className={`word-card${on ? ' picked' : ''}${st ? CARD_CLASS[st] : ''}`}
                aria-pressed={on}
                disabled={Boolean(answered)}
                onClick={() => toggle(it)}
              >
                {typeof it.image === 'string' && it.image && (
                  <span className="word-picto" aria-hidden="true">
                    {it.image}
                  </span>
                )}
                <span className="word-text">
                  <Syllabified text={String(it.word)} />
                </span>
                {st === 'found' && <Icon name="check" className="word-mark" />}
                {st === 'missed' && <span className="word-note">oublié</span>}
                {st === 'intruder' && <span className="word-note">pas [{target}]</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
