// La mission jouée dans un lieu du monde ouvert (lot 4, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) :
// le lanceur d'exercice commun (ExerciseRunner), avec les mêmes items, la même correction, les mêmes étoiles et le même
// barème, posé sur la scène. La phrase, la ligne de calcul, la règle, une action et le résultat sont dans une colonne
// sur fond uni, à gauche ; chaque réponse est une étiquette et l'objet du lieu qui la porte (cloche, panier, levier,
// caisse), touchables ensemble. Sur tablette, les objets sont dans le tiers du milieu, leur étiquette au-dessus ; sur un
// téléphone couché, les étiquettes en rangée en bas, les objets juste au-dessus, la consigne en icône (lue en entier au
// premier item), la règle à droite : rien ne défile. Rien à lire n'est peint dans la 3D. « Vue simple » rouvre l'écran
// classique de la même mission.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { ForeignWordsProvider, Marked } from '../../../components/ForeignWords';
import { RichText, frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { seeded } from '../../../core/random';
import { useSettings } from '../../../core/SettingsContext';
import { useLoaded } from '../../../core/useLoaded';
import { useBlocland } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import { levelFor } from '../../engine';
import { ExerciseRunner, type RunnerStage } from '../../ExerciseRunner';
import { loadExercise, pickExercise } from '../../exercises';
import { Aid } from '../../exercises/Aid';
import type { AidData } from '../../exercises/maths';
import type { ScreenProps } from '../../exercises/registry';
import { CARD_CLASS, cardState, sortSummary } from '../../exercises/sortCards';
import type { ExerciseItem } from '../../exercises/types';
import { exercisesToReview } from '../../review';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { WIDEN_FULL, WIDEN_OFFER, questionLayout, type AnswerSlot, type QuestionLayout } from '../../world/continu/questionScene';
import { bellRounds, isItemScene, placeInstruction, placeItems, type ItemScene } from '../../world/continu/questions';
import type { LabelOnScreen, OpenWorld } from './scene';
import { WorldDone } from './WorldDone';

/** Ce que l'écran d'un lieu demande à la scène : l'item à montrer, combien de réponses il a, s'il a une règle. */
interface ItemShown {
  scene: ItemScene;
  answered: boolean;
  right: number[];
  count: number;
  aid: boolean;
}

interface QuestionContextValue {
  layout: QuestionLayout;
  /** La consigne du lieu : l'icône qui la lit, sur un écran bas. */
  instruction: string;
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
  // Les célébrations (« Succès débloqué », niveau) attendent la fin de la question et de son bilan : rien ne surgit
  // pendant qu'on lit (monde ouvert seulement).
  useHoldCelebrations(true);
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

  // La taille de la page, relue au redimensionnement, une fois par image au plus (une rotation en envoie une rafale) :
  // la place des réponses, de la colonne et de la scène en dépend.
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
    };
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(measure);
    });
    observer.observe(el);
    measure();
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const [item, setItem] = useState<ItemShown | null>(null);
  const [labels, setLabels] = useState<LabelOnScreen[]>([]);
  const count = item?.count ?? DEFAULT_COUNT;
  const hasAid = item?.aid ?? false;
  // Sur un écran bas, la colonne s'élargit d'un cran quand la phrase n'y tient pas (un grand texte, une phrase longue
  // des Quais) : 38, 46, puis 54 % ; au-delà, la phrase passe en pleine largeur au-dessus des objets ; si elle n'y tient
  // toujours pas, « Vue simple » est proposé d'emblée (`WIDEN_OFFER`). Le cran reste pour la mission : la colonne ne
  // bouge plus d'un item à l'autre.
  const [widen, setWiden] = useState(0);
  // Le résultat d'un écran bas qui ne tient pas dans la colonne élargie : il prend toute la largeur au-dessus des objets.
  const [sheetWide, setSheetWide] = useState(false);
  const layout = useMemo(
    () => questionLayout({ count, bells: place === 'phare', aid: hasAid, centered: place === 'phare', widen }, size.w || 1, size.h || 1),
    [count, hasAid, place, size, widen],
  );
  const [finished, setFinished] = useState(false);
  const offer = layout.low && widen >= WIDEN_OFFER;
  // Sur un écran bas, la consigne s'affiche en entier une fois, au premier item, puis devient une icône.
  const [introDone, setIntroDone] = useState(false);
  const intro = layout.low && !introDone && !finished && !offer;
  // Mesuré avant l'affichage, à chaque item, réponse ou cran : une colonne qui déborde (en hauteur ou en largeur) prend
  // le cran suivant ; une consigne qui ne tient pas en pleine largeur mène droit à « Vue simple ».
  useLayoutEffect(() => {
    if (!layout.low || finished || offer) return;
    const column = box.current?.querySelector<HTMLElement>('.quiz.in-world');
    if (!column || !(column.scrollHeight > column.clientHeight + 1 || column.scrollWidth > column.clientWidth + 1)) return;
    if (intro) setWiden(WIDEN_OFFER);
    else if (column.classList.contains('has-sheet')) setSheetWide(true);
    else setWiden((n) => Math.min(WIDEN_OFFER, n + 1));
  }, [layout, intro, finished, offer, widen, item, sheetWide]);
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

  const ready = loaded && picked ? { def: loaded, level: picked.level } : null;
  const instruction = ready ? placeInstruction(place, ready.level, ready.def.instruction) : '';
  const context = useMemo(() => ({ layout, show, instruction }), [layout, show, instruction]);

  const exerciseId = ready?.def.id;
  const stage = useMemo<RunnerStage | null>(() => {
    if (!exerciseId) return null;
    const extra: ReactNode = (
      <>
        {intro && (
          <button type="button" className="button primary world-question-start" onClick={() => setIntroDone(true)}>
            <Icon name="play" /> Commencer
          </button>
        )}
        {offer && (
          // Le texte choisi ne tient pas ici : le repli franc, sans réduire le texte ; la voix reste (« Lire la phrase »).
          <button type="button" className="button primary world-question-offer" onClick={onSimpleView}>
            <Icon name="liste" /> Vue simple
          </button>
        )}
      </>
    );
    return {
      screens:
        place === 'phare'
          ? (items, seed) => bellRounds(placeItems(place, exerciseId, items), seeded(`${seed}:cloches`))
          : (items) => placeItems(place, exerciseId, items).map((it) => [it]),
      Screen: place === 'phare' ? BellScreen : PlaceChoiceScreen,
      instruction,
      back: { label: `Revenir ${lieu.at}`, onClick: onClose },
      extra,
      Done: WorldDone,
      className: `in-world${layout.low ? ' low' : ''}${layout.low && widen >= WIDEN_FULL ? ' full' : ''}${offer ? ' offer' : ''}${intro ? ' intro' : ''}${finished ? ' finished' : ''}${sheetWide ? ' sheet-wide' : ''}`,
    };
  }, [exerciseId, instruction, place, lieu.at, onClose, onSimpleView, intro, offer, widen, layout.low, finished, sheetWide]);

  const style = {
    '--question-left': `${layout.panel.left}px`,
    '--question-top': `${layout.panel.top}px`,
    '--question-width': `${layout.panel.width}px`,
    '--question-max-height': `${layout.panel.maxHeight}px`,
  } as CSSProperties;

  return (
    <div className="world-question" ref={box} style={style}>
      {!biome || loaded === null ? null : !ready || !stage ? (
        <Loading className="world-loading" />
      ) : (
        <QuestionContext.Provider value={context}>
          <ForeignWordsProvider words={biome.foreignWords}>
            <ExerciseRunner
              key={`${ready.def.id}-${run}`}
              biome={biome}
              def={ready.def}
              stage={stage}
              onComplete={() => setFinished(true)}
              onReplay={() => {
                setFinished(false);
                setIntroDone(false);
                setWiden(0);
                setSheetWide(false);
                setItem(null);
                setRun((r) => r + 1);
              }}
            />
          </ForeignWordsProvider>
        </QuestionContext.Provider>
      )}
      {/* « Vue simple » : hors de la colonne, au-dessus de tout, à côté de la pause ; rien ne le recouvre. */}
      {ready && stage && !finished && (
        <button type="button" className="button world-question-simple" onClick={onSimpleView}>
          <Icon name="liste" /> Vue simple
        </button>
      )}
      {!finished &&
        labels.map((l) => (
          <span key={l.text} className="world-question-label" aria-hidden="true" style={{ transform: `translate(${Math.round(l.x)}px, ${Math.round(l.y)}px)` }}>
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
  a.aid === b.aid &&
  a.right.length === b.right.length &&
  a.right.every((r, i) => r === b.right[i]);

function useQuestion(): QuestionContextValue {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error('Un écran de lieu se pose dans une question du monde ouvert.');
  return ctx;
}

/** La scène d'un item posé dans un lieu (`placeItems`), ou `null` si l'item n'en a pas. */
function placeSceneOf(item: ExerciseItem | undefined): ItemScene | null {
  const scene = item?.placeScene;
  return isItemScene(scene) ? scene : null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** La règle d'un item (la carte de règle, une aide de calcul), comme sur l'écran classique. */
function aidOf(item: ExerciseItem | undefined): AidData | null {
  const aid = item?.aid;
  if (!isRecord(aid) || typeof aid.kind !== 'string' || !isRecord(aid.props)) return null;
  return { kind: aid.kind, props: aid.props };
}

/** La cible de toucher d'une réponse (l'étiquette et l'objet), et la place de l'étiquette dedans. */
function slotStyles(slot: AnswerSlot): { hit: CSSProperties; label: CSSProperties } {
  const { hit, label } = slot;
  return {
    hit: { left: `${Math.round(hit.left)}px`, top: `${Math.round(hit.top)}px`, width: `${Math.round(hit.right - hit.left)}px`, height: `${Math.round(hit.bottom - hit.top)}px` },
    label: { top: `${Math.round(label.top - hit.top)}px`, height: `${Math.round(label.bottom - label.top)}px` },
  };
}

/** La règle : sous la question dans la colonne, ou à droite sur un écran bas. */
function PlaceAid({ aid, layout }: { aid: AidData; layout: QuestionLayout }) {
  const box = layout.aid;
  const style: CSSProperties | undefined = box
    ? { left: `${Math.round(box.left)}px`, top: `${Math.round(box.top)}px`, width: `${Math.round(box.right - box.left)}px`, maxHeight: `${Math.round(box.bottom - box.top)}px` }
    : undefined;
  return (
    <div className={`aid world-question-aid${box ? ' beside' : ''}`} style={style}>
      <Aid aid={aid} />
    </div>
  );
}

/** Une icône d'action de 48 px, son mot dessous en grand texte (et toujours dit aux lecteurs d'écran). */
function IconLabel({ children }: { children: string }) {
  return (
    <span className="world-icon-label" aria-hidden="true">
      {children}
    </span>
  );
}

/** L'icône qui lit la consigne, à côté de la phrase, sur un écran bas. */
function ConsigneIcon() {
  const { instruction, layout } = useQuestion();
  if (!layout.low) return null;
  return (
    <span className="world-icon world-consigne">
      <SpeakButton text={frenchTypography(instruction)} label="Lire la consigne" compact />
      <IconLabel>Consigne</IconLabel>
    </span>
  );
}

/** La voix se coupe quand l'écran change (la coupe entre deux items). */
function useStopOnLeave(): void {
  const { stop } = useSettings();
  useEffect(() => () => stop(), [stop]);
}

/**
 * Les Filets, les Écluses, les Quais : la phrase du lieu (et la ligne de calcul de référence aux Quais), la règle de
 * l'item, l'indice sur demande, une réponse par objet du lieu. La correction est celle de l'écran classique
 * (CalculationScreen).
 */
function PlaceChoiceScreen({ items, answered, onAnswer, ruledOut, onHelp }: ScreenProps) {
  const { layout, show } = useQuestion();
  useStopOnLeave();
  const item = items[0];
  const scene = placeSceneOf(item);
  const prompt = String(item?.prompt ?? '');
  const spoken = String(item?.spoken ?? prompt);
  const choices = Array.isArray(item?.choices) ? item.choices.map(String) : [];
  const answer = String(item?.answer ?? '');
  const hint = String(item?.hint ?? '');
  const referenceLine = typeof item?.referenceLine === 'string' ? item.referenceLine : '';
  const aid = aidOf(item);
  const chosen = answered?.detail?.chosen;
  const [hintShown, setHintShown] = useState(false);
  const rightIndex = choices.indexOf(answer);
  useEffect(() => {
    if (!scene) return;
    show({ scene, answered: Boolean(answered), right: answered && rightIndex >= 0 ? [rightIndex] : [], count: choices.length, aid: Boolean(aid) });
  }, [show, scene, answered, rightIndex, choices.length, aid]);
  if (!item || !scene) return null;
  // Après « Bravo », le mot juste entre dans le trou : la phrase se lit entière.
  const gap = prompt.indexOf('…');
  const filled = Boolean(answered?.results.every((r) => r.correct)) && gap >= 0 && rightIndex >= 0;
  const whole = filled ? `${prompt.slice(0, gap)}${answer}${prompt.slice(gap + 1)}` : prompt;

  return (
    <div className="question world-place">
      <div className={`world-question-prompt${filled ? ' filled' : ''}`}>
        <div className="question-head">
          <p className="question-prompt">
            {filled ? (
              <>
                <RichText text={prompt.slice(0, gap)} />
                <strong className="world-filled">{answer}</strong>
                <RichText text={prompt.slice(gap + 1)} />
              </>
            ) : (
              <RichText text={prompt} />
            )}
          </p>
          <SpeakButton text={filled ? whole : spoken} label="Lire la phrase" shown={whole} compact />
        </div>
        {referenceLine && !layout.low && (
          <p className="world-question-reference">
            <RichText text={referenceLine} />
          </p>
        )}
        <div className="world-question-actions">
          {/* Sur un écran bas, la ligne de calcul et les icônes sur une seule ligne. */}
          {referenceLine && layout.low && (
            <p className="world-question-reference">
              <RichText text={referenceLine} />
            </p>
          )}
          <ConsigneIcon />
          {/* Au deuxième essai, « Presque ! » redit déjà l'indice (sur tablette ; sur un écran bas, il ne dit que « Presque ! »). */}
          {hint && !answered && !hintShown && (!ruledOut || layout.low) && (
            <span className="world-icon world-hint-icon">
              <button
                type="button"
                className="button world-hint"
                aria-label="Un indice"
                onClick={() => {
                  setHintShown(true);
                  onHelp();
                }}
              >
                <Icon name="lightbulb" />
                <span className="world-hint-word">Un indice</span>
              </button>
              <IconLabel>Indice</IconLabel>
            </span>
          )}
        </div>
        {hint && !answered && hintShown && (!ruledOut || layout.low) && (
          <p className="calcul-hint" role="status">
            <Icon name="lightbulb" />
            <span>
              <Marked text={hint} />
            </span>
            <SpeakButton text={hint} compact />
          </p>
        )}
        {aid && <PlaceAid aid={aid} layout={layout} />}
      </div>
      <div className="world-answers" role="group" aria-label="Réponses possibles">
        {choices.map((choice, i) => {
          const slot = layout.slots[i] ?? layout.slots[0];
          const styles = slotStyles(slot);
          const isAnswer = answered && choice === answer;
          // Au deuxième essai, la réponse déjà tentée reste barrée.
          const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
          return (
            <button
              key={choice}
              type="button"
              style={styles.hit}
              className={`choice world-answer${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
              onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
            >
              <span className="world-answer-label" style={styles.label}>
                <RichText text={choice} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Le Phare : les mots d'une manche portés par des cloches (six au plus), en carillon au pied de la tour. Toucher une
 * cloche dit son mot et la marque (ou la démarque) ; « Valider » corrige la manche, comme la Chasse au son. Les mots
 * sont écrits sans couleur de syllabes : une couleur pourrait désigner le son demandé.
 */
function BellScreen({ items, answered, onAnswer, target }: ScreenProps) {
  const { layout, show } = useQuestion();
  const { speak } = useSettings();
  useStopOnLeave();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const scene = placeSceneOf(items[0]);
  const right = useMemo(() => (answered ? items.flatMap((it, i) => (it.correct ? [i] : [])) : []), [items, answered]);
  useEffect(() => {
    if (!scene) return;
    show({ scene, answered: Boolean(answered), right, count: items.length, aid: false });
  }, [show, scene, answered, right, items.length]);
  if (!scene) return null;

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
    const results = items.map((it) => ({ key: it.key, correct: picked.has(it.key) === Boolean(it.correct) }));
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
    onAnswer({ results, detail: firstWrong ? { word: firstWrong.word, heard: firstWrong.heard, missed: !picked.has(firstWrong.key), summary } : {} });
  };
  const words = items.map((it) => String(it.word));

  return (
    <div className="question world-place">
      <div className="world-question-prompt">
        <div className="world-question-actions">
          <p className="question-prompt sound-target">
            Le son <strong>[{target}]</strong>
          </p>
          <ConsigneIcon />
          {layout.low ? (
            <span className="world-icon">
              <SpeakButton text={frenchTypography(words.join(', '))} label="Écouter les cloches" compact />
              <IconLabel>Cloches</IconLabel>
            </span>
          ) : (
            <SpeakButton text={frenchTypography(words.join(', '))} label="Écouter les cloches" />
          )}
          {!answered && (
            <button type="button" className="button primary validate-button" onClick={validate}>
              <Icon name="check" /> Valider
            </button>
          )}
        </div>
      </div>
      <ul className="world-answers" aria-label="Cloches à trier">
        {items.map((it, i) => {
          const slot = layout.slots[i] ?? layout.slots[0];
          const styles = slotStyles(slot);
          const on = picked.has(it.key);
          const st = answered ? cardState(it, on) : null;
          return (
            <li key={it.key}>
              <button
                type="button"
                style={styles.hit}
                className={`word-card world-answer${on ? ' picked' : ''}${st ? CARD_CLASS[st] : ''}`}
                aria-pressed={on}
                disabled={Boolean(answered)}
                onClick={() => toggle(it)}
              >
                <span className="world-answer-label" style={styles.label}>
                  {typeof it.image === 'string' && it.image && (
                    <span className="word-picto" aria-hidden="true">
                      {it.image}
                    </span>
                  )}
                  <span className="word-text">{String(it.word)}</span>
                  {st === 'found' && <Icon name="check" className="word-mark" />}
                  {st === 'missed' && <span className="word-note">oublié</span>}
                  {st === 'intruder' && <span className="word-note">pas [{target}]</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
