// La mission jouée dans un lieu du monde ouvert (lot 4, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) :
// le lanceur d'exercice commun (ExerciseRunner), avec les mêmes items, la même correction, les mêmes étoiles et le même
// barème, posé sur la scène. La phrase, la ligne de calcul, la règle, une action et le résultat sont dans une colonne
// sur fond uni, à gauche ; chaque réponse est une étiquette et l'objet du lieu qui la porte (cloche, panier, levier,
// caisse), touchables ensemble. Sur tablette, les objets sont dans le tiers du milieu, leur étiquette au-dessus ; sur un
// téléphone couché, les étiquettes en rangée en bas, les objets juste au-dessus, la consigne en icône (lue en entier au
// premier item), la règle à droite : rien ne défile. Rien à lire n'est peint dans la 3D. « Vue simple » rouvre l'écran
// classique de la même mission. Au Phare, une scénette (piste 1, lot 2, ../../world/continu/scenette.ts) : le rôle de
// l'habitant en tête du panneau, Kéo et la gardienne au milieu, les cloches en rangée en bas, « Valider » en bas à
// droite sur tablette ; à la réussite, la lampe du Phare s'allume. Les Quais (lot 3), les Filets et les Écluses (lot 4)
// ont la leur, la colonne à gauche (le docker, la pêcheuse, l'éclusier). Dans une scénette, « Vue simple » montre la même
// question en liste sur fond uni, sans quitter la manche (les cloches choisies le restent), « Valider » sous la liste ;
// « Scène », à la même place, y ramène.
import { Fragment, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { ForeignWordsProvider, Marked } from '../../../components/ForeignWords';
import { RichText, frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { seeded } from '../../../core/random';
import { useSettings } from '../../../core/SettingsContext';
import { texteGrand } from '../../../core/settings';
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
import { scenetteLayout, scenetteOf } from '../../world/continu/scenette';
import { bellRounds, isItemScene, placeInstruction, placeItems, type ItemScene } from '../../world/continu/questions';
import type { LabelOnScreen, OpenWorld } from './scene';
import { WorldDone } from './WorldDone';
import { filledGap, overflows, wordsCut } from './fit';

/** Ce que l'écran d'un lieu demande à la scène : l'item à montrer, combien de réponses il a, s'il a une règle. */
interface ItemShown {
  scene: ItemScene;
  answered: boolean;
  right: number[];
  /** Les réponses choisies, pas encore validées (les cloches du Phare). */
  picked: number[];
  count: number;
  aid: boolean;
}

interface QuestionContextValue {
  layout: QuestionLayout;
  /** « Vue simple » dans une scénette : la question en liste, sur fond uni, sans quitter la manche en cours. */
  simple: boolean;
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
  const { settings } = useSettings();
  const grandTexte = texteGrand(settings);
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
  const scenette = scenetteOf(place);
  const layout = useMemo(() => {
    const base = questionLayout({ count, bells: place === 'phare', aid: hasAid, widen }, size.w || 1, size.h || 1);
    return scenette ? scenetteLayout({ count, widen, small: place === 'phare', words: place === 'phare', column: place !== 'phare' && !grandTexte, grand: grandTexte, aid: hasAid }, size.w || 1, size.h || 1, base) : base;
  }, [count, hasAid, place, size, widen, scenette, grandTexte]);
  // La rangée des réponses à droite de la colonne (les Quais sur un écran bas) : le résultat reste dans la colonne.
  const rowBeside = layout.low && layout.slots.length > 0 && Math.min(...layout.slots.map((sl) => sl.hit.left)) >= layout.panel.left + layout.panel.width;
  const [finished, setFinished] = useState(false);
  // La réussite de la mission (une étoile au moins) : dans une scénette, la lampe du lieu s'allume.
  const [success, setSuccess] = useState(false);
  // Un mot de réponse coupé dans son étiquette (les cloches en grand texte) : on ne répond que dans « Vue simple »,
  // proposé d'emblée, la voix gardée ; les étiquettes ne passent jamais sur deux rangées.
  const [answersOut, setAnswersOut] = useState(false);
  // Sur tablette, un mot coupé fait d'abord tomber l'image devant les mots (comme sur un écran bas), puis seulement
  // propose « Vue simple » (référent dys : « pantalon » en OpenDyslexic).
  const [bare, setBare] = useState(false);
  // « Vue simple » dans une scénette : la même question, en liste sur fond uni, à la même place de la mission (les
  // cloches déjà choisies restent choisies) ; ailleurs, l'écran classique de la mission (`onSimpleView`).
  const [simple, setSimple] = useState(false);
  // Sur un écran bas, en « Vue simple », la consigne se replie en une ligne (le rôle, son début, sa voix) pour que les
  // cloches se voient dès l'ouverture ; un toucher sur la ligne ou « Lire la suite » la déplie.
  // Au plus grand texte, elle s'ouvre dépliée au premier item (comme la consigne lue avant « Commencer » sur un écran
  // bas), puis se replie dès l'item suivant (référent dys).
  const [consigneOpen, setConsigneOpen] = useState(false);
  const sceneKey = item ? JSON.stringify(item.scene) : '';
  const firstScene = useRef('');
  const lastScene = useRef('');
  useEffect(() => {
    if (!sceneKey) return;
    if (!firstScene.current) firstScene.current = sceneKey;
    if (lastScene.current && lastScene.current !== sceneKey) setConsigneOpen(false);
    lastScene.current = sceneKey;
  }, [sceneKey]);
  const openSimple = useMemo(
    () =>
      scenette
        ? () => {
            setConsigneOpen(grandTexte && layout.low && sceneKey === firstScene.current);
            setSimple(true);
          }
        : onSimpleView,
    [scenette, onSimpleView, grandTexte, layout.low, sceneKey],
  );
  const offer = !simple && ((layout.low && widen >= WIDEN_OFFER) || (!layout.low && answersOut));
  // Sur un écran bas, la consigne s'affiche en entier une fois, au premier item, puis devient une icône.
  const [introDone, setIntroDone] = useState(false);
  const intro = layout.low && !introDone && !finished && !offer && !simple;
  const simpleLow = simple && layout.low && !finished;
  // « Vue simple » ouverte d'elle-même au plus grand texte : une seule fois par question.
  const autoSimple = useRef(false);
  const startItems = useCallback(() => {
    setIntroDone(true);
    // La consigne élargie pour être lue en entier : la colonne reprend sa largeur pour la scène.
    if (scenette) setWiden((n) => (n === WIDEN_FULL ? 0 : n));
  }, [scenette]);
  // Mesuré avant l'affichage, à chaque item, réponse ou cran : une colonne qui déborde (en hauteur ou en largeur) prend
  // le cran suivant ; une consigne qui ne tient pas en pleine largeur mène droit à « Vue simple » ; un mot coupé aussi.
  // Sur tablette, seule une scénette se mesure : ses mots de réponse (le panneau prend la hauteur de son texte).
  useLayoutEffect(() => {
    // Rien ne se mesure avant que la page ait sa taille (la place des réponses en dépend).
    if (!size.w || simple || (!layout.low && !layout.scenette) || finished || answersOut) return;
    const root = box.current;
    if (!root) return;
    if (wordsCut(root.querySelectorAll<HTMLElement>('.world-answer-label'))) {
      if (!layout.low && !bare) {
        setBare(true);
        return;
      }
      setAnswersOut(true);
      setWiden(WIDEN_OFFER);
      return;
    }
    const grandScene = scenette && grandTexte;
    if (offer || (!layout.low && !grandScene)) return;
    const column = root.querySelector<HTMLElement>('.quiz.in-world');
    if (!column || !overflows(column)) return;
    // Au plus grand texte, une scénette dont le panneau déborderait s'ouvre en « Vue simple », une fois (sur un écran
    // bas, après l'avoir essayée en pleine largeur) : la consigne y est entière, et c'est le panneau qui défile (sur un
    // téléphone, la question n'y tient pas sans défiler ; « Valider » reste dans sa bande, en bas). Revenu à la scène,
    // l'élève garde les crans d'avant.
    if (grandScene && !autoSimple.current && !column.classList.contains('has-sheet') && (!layout.low || !intro || widen >= WIDEN_FULL)) {
      autoSimple.current = true;
      openSimple();
      return;
    }
    if (!layout.low) return;
    // Dans une scénette, la consigne lue en entier au premier item prend d'abord toute la largeur (aux Quais, elle est
    // longue) ; « Commencer » rend la colonne à la scène. Ailleurs, ou si elle ne tient toujours pas : « Vue simple ».
    if (intro) setWiden(scenette && widen < WIDEN_FULL ? WIDEN_FULL : WIDEN_OFFER);
    else if (column.classList.contains('has-sheet')) setSheetWide(true);
    else setWiden((n) => Math.min(WIDEN_OFFER, n + 1));
  }, [layout, intro, finished, offer, widen, item, sheetWide, answersOut, size.w, simple, bare, scenette, grandTexte, openSimple]);
  // Le panneau de « Vue simple » défile : il s'ouvre en haut (le rôle, la consigne), et `data-suite` dit qu'il reste
  // de quoi lire plus bas (une ombre au-dessus de « Valider ») ou plus haut.
  useEffect(() => {
    if (!simple || finished) return;
    const panel = box.current?.querySelector<HTMLElement>('.quiz.in-world');
    if (!panel) return;
    panel.scrollTop = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const below = panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;
      const above = panel.scrollTop > 1;
      const next = below && above ? 'deux' : below ? 'bas' : above ? 'haut' : '';
      if (panel.dataset.suite !== next) panel.dataset.suite = next;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(panel);
    const mutation = new MutationObserver(schedule);
    mutation.observe(panel, { childList: true, subtree: true });
    panel.addEventListener('scroll', schedule, { passive: true });
    update();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      panel.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
      delete panel.dataset.suite;
    };
  }, [simple, finished, loaded]);
  useEffect(() => {
    if (!size.w || !size.h || !item || finished) return;
    setLabels(world.question({ place, layout, item }));
  }, [world, place, layout, item, size, finished]);
  // La fin de la mission : la caméra revient au lieu, où la pièce remise en marche se voit derrière le bilan ; dans une
  // scénette, elle reste, et la lampe s'allume à la réussite.
  useEffect(() => {
    if (!finished) return;
    if (scenette) world.scenetteEnd(success);
    else world.question(null);
    setLabels([]);
  }, [world, finished, scenette, success]);
  // En partant (« Revenir », Quitter, « Vue simple »), la scène reprend son cadrage.
  useEffect(() => () => void world.question(null), [world]);

  const show = useCallback((next: ItemShown | null) => {
    setItem((prev) => (next && prev && sameItem(prev, next) ? prev : next));
  }, []);

  const ready = loaded && picked ? { def: loaded, level: picked.level } : null;
  const instruction = ready ? placeInstruction(place, ready.level, ready.def.instruction) : '';
  const context = useMemo(() => ({ layout, show, instruction, simple }), [layout, show, instruction, simple]);

  const exerciseId = ready?.def.id;
  const stage = useMemo<RunnerStage | null>(() => {
    if (!exerciseId) return null;
    const extra: ReactNode = (
      <>
        {intro && (
          <button type="button" className="button primary world-question-start" onClick={startItems}>
            <Icon name="play" /> Commencer
          </button>
        )}
        {simpleLow && (
          <button
            type="button"
            className="button world-consigne-more"
            aria-expanded={consigneOpen}
            aria-controls="consigne-ligne"
            onClick={() => setConsigneOpen((open) => !open)}
          >
            <Icon name="book" />
            <span className="world-consigne-more-word">{consigneOpen ? 'Replier' : 'Lire la suite'}</span>
          </button>
        )}
        {offer && (
          // Le texte choisi ne tient pas ici : le repli franc, sans réduire le texte ; la voix reste (« Lire la phrase »).
          // Dans une scénette, un bouton secondaire sous le rôle, jamais un bouton plein avant la consigne (référent dys).
          <button type="button" className={`button${scenette ? '' : ' primary'} world-question-offer`} onClick={openSimple}>
            <Icon name="liste" /> Vue simple
          </button>
        )}
      </>
    );
    // Le rôle de l'habitant en tête du panneau, et la place de sa phrase d'accueil (vide tant que le mainteneur n'a pas
    // tranché : la consigne reste la seule phrase, lue).
    // En « Vue simple » sur un écran bas : une seule ligne, le rôle puis le début de la consigne (la consigne entière
    // reste le titre du panneau pour les lecteurs d'écran), sa voix toujours visible.
    const head: ReactNode = scenette ? (
      simpleLow ? (
        <div className="world-scenette-head world-consigne-line">
          <p className="world-consigne-fold" id="consigne-ligne">
            <strong className="world-scenette-role">{scenette.role}</strong>{' '}
            <span aria-hidden="true">
              {frenchTypography(instruction)
                .split(' ')
                .map((word, i) => (
                  <Fragment key={i}>
                    {i > 0 && ' '}
                    <span className="world-consigne-word">
                      <Syllabified text={word} />
                    </span>
                  </Fragment>
                ))}
              <span className="world-consigne-ellipsis" hidden>
                {' …'}
              </span>
            </span>
          </p>
          <SpeakButton text={frenchTypography(instruction)} label="Consigne" compact />
        </div>
      ) : (
        <div className="world-scenette-head">
          <p className="world-scenette-role">{scenette.role}</p>
          {scenette.greeting && <p className="world-scenette-greeting">{scenette.greeting}</p>}
        </div>
      )
    ) : null;
    return {
      head,
      screens:
        place === 'phare'
          ? (items, seed) => bellRounds(placeItems(place, exerciseId, items), seeded(`${seed}:cloches`))
          : (items) => placeItems(place, exerciseId, items).map((it) => [it]),
      Screen: place === 'phare' ? BellScreen : PlaceChoiceScreen,
      instruction,
      back: { label: `Revenir ${lieu.at}`, onClick: onClose },
      extra,
      Done: WorldDone,
      className:
        simple && !finished
          ? `in-world scenette simple${layout.low ? ' simple-bas' : ''}${consigneOpen ? ' consigne-ouverte' : ''}`
          : `in-world${scenette ? ' scenette' : ''}${layout.low ? ' low' : ''}${layout.low && widen >= WIDEN_FULL ? ' full' : ''}${offer ? ' offer' : ''}${intro ? ' intro' : ''}${finished ? ' finished' : ''}${sheetWide ? ' sheet-wide' : ''}${answersOut || (scenette && layout.low && offer) ? ' answers-out' : ''}${rowBeside ? ' rangee-a-cote' : ''}${bare ? ' sans-image' : ''}`,
    };
  }, [
    exerciseId,
    instruction,
    place,
    lieu.at,
    onClose,
    openSimple,
    intro,
    startItems,
    offer,
    widen,
    layout.low,
    finished,
    sheetWide,
    answersOut,
    scenette,
    simple,
    bare,
    simpleLow,
    consigneOpen,
    rowBeside,
  ]);

  // La ligne repliée se coupe après un mot entier, jamais au milieu : les mots qui passeraient à la ligne sont cachés,
  // « … » après le dernier qui tient (refait au changement de taille, de texte ou de police).
  useLayoutEffect(() => {
    const line = box.current?.querySelector<HTMLElement>('.world-consigne-fold');
    if (!line) return;
    const fit = () => {
      const words = [...line.querySelectorAll<HTMLElement>('.world-consigne-word')];
      const ellipsis = line.querySelector<HTMLElement>('.world-consigne-ellipsis');
      for (const w of words) w.hidden = false;
      if (!ellipsis) return;
      ellipsis.hidden = true;
      if (consigneOpen) return;
      // La première ligne de la consigne : celle du rôle, ou la suivante quand le rôle a sa ligne (au plus grand texte).
      const role = line.querySelector<HTMLElement>('.world-scenette-role');
      const ownLine = role && getComputedStyle(role).display === 'block';
      const first = (ownLine ? (words[0] ?? line) : (role ?? line)).getBoundingClientRect();
      const onFirstLine = (el: HTMLElement) => el.getBoundingClientRect().top < first.top + first.height / 2;
      let cut = words.findIndex((w) => !onFirstLine(w));
      if (cut < 0) return;
      for (let i = cut; i < words.length; i++) words[i].hidden = true;
      ellipsis.hidden = false;
      while (cut > 0 && !onFirstLine(ellipsis)) words[--cut].hidden = true;
    };
    fit();
    let alive = true;
    void document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
    };
  }, [stage, consigneOpen, size.w, settings]);

  const style = {
    '--question-left': `${layout.panel.left}px`,
    '--question-top': `${layout.panel.top}px`,
    '--question-width': `${layout.panel.width}px`,
    '--question-max-height': `${layout.panel.maxHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={`world-question${scenette ? ' scenette' : ''}`}
      ref={box}
      style={style}
      onClick={(e) => {
        // La ligne repliée de la consigne se déplie aussi au toucher (le clavier passe par « Lire la suite »).
        if (simpleLow && e.target instanceof Element && e.target.closest('.world-consigne-fold')) setConsigneOpen((open) => !open);
      }}
    >
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
              onComplete={(completion) => {
                setSuccess(completion.stars >= 1);
                setFinished(true);
              }}
              onReplay={() => {
                setFinished(false);
                setSuccess(false);
                setIntroDone(false);
                setWiden(0);
                setSheetWide(false);
                setAnswersOut(false);
                setBare(false);
                firstScene.current = '';
                lastScene.current = '';
                setItem(null);
                setRun((r) => r + 1);
              }}
            />
          </ForeignWordsProvider>
        </QuestionContext.Provider>
      )}
      {/* « Vue simple » : hors de la colonne, au-dessus de tout, à côté de la pause ; rien ne le recouvre. */}
      {/* Un seul « Vue simple » : celui du panneau quand le repli est proposé. */}
      {ready && stage && !finished && !offer && !simple && (
        <button type="button" className="button world-question-simple" onClick={openSimple}>
          <Icon name="liste" /> Vue simple
        </button>
      )}
      {/* En « Vue simple » d'une scénette, à la même place : le retour à la scène, les cloches choisies gardées. */}
      {ready && stage && !finished && simple && (
        <button type="button" className="button world-question-simple" onClick={() => setSimple(false)}>
          <Icon name="mountain" /> Scène
        </button>
      )}
      {!finished &&
        !simple &&
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
  a.right.every((r, i) => r === b.right[i]) &&
  a.picked.length === b.picked.length &&
  a.picked.every((r, i) => r === b.picked[i]);

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

/**
 * La règle : sous la question dans la colonne, ou à droite sur un écran bas (en « Vue simple », toujours dans la liste,
 * jamais posée sur elle).
 */
function PlaceAid({ aid, layout, simple }: { aid: AidData; layout: QuestionLayout; simple: boolean }) {
  const box = simple ? null : layout.aid;
  const style: CSSProperties | undefined = box
    ? {
        left: `${Math.round(box.left)}px`,
        top: `${Math.round(box.top)}px`,
        width: `${Math.round(box.right - box.left)}px`,
        maxHeight: `${Math.round(box.bottom - box.top)}px`,
      }
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
  const { instruction, layout, simple } = useQuestion();
  // En « Vue simple », la consigne garde sa ligne et sa voix en tête du panneau.
  if (!layout.low || simple) return null;
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
  const { layout, show, simple } = useQuestion();
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
  // Les réponses tentées et fausses (barrées) : leur objet le montre aussi dans la scène (une caisse penchée).
  const tried = choices.flatMap((c, i) => (c !== answer && (ruledOut?.includes(c) || (answered && chosen === c)) ? [i] : []));
  const triedKey = tried.join(',');
  useEffect(() => {
    if (!scene) return;
    const picked = triedKey ? triedKey.split(',').map(Number) : [];
    show({ scene, answered: Boolean(answered), right: answered && rightIndex >= 0 ? [rightIndex] : [], picked, count: choices.length, aid: Boolean(aid) });
  }, [show, scene, answered, rightIndex, choices.length, aid, triedKey]);
  if (!item || !scene) return null;
  // Après « Bravo », le mot juste entre dans le trou : la phrase se lit entière.
  const gap = filledGap(prompt, answer, answered?.results);
  const filled = gap !== null && rightIndex >= 0;
  const whole = gap ? `${gap.before}${answer}${gap.after}` : prompt;

  return (
    <div className="question world-place">
      <div className={`world-question-prompt${filled ? ' filled' : ''}`}>
        <div className="question-head">
          <p className="question-prompt">
            {filled ? (
              <>
                <RichText text={gap?.before ?? ''} />
                <strong className="world-filled">{answer}</strong>
                <RichText text={gap?.after ?? ''} />
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
        {aid && <PlaceAid aid={aid} layout={layout} simple={simple} />}
      </div>
      <div className="world-answers" role="group" aria-label="Réponses possibles">
        {choices.map((choice, i) => {
          const slot = layout.slots[i] ?? layout.slots[0];
          // En « Vue simple », les réponses sont une liste qui passe à la ligne : rien n'est posé sur la scène.
          const styles = simple ? { hit: undefined, label: undefined } : slotStyles(slot);
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
  const { layout, show, simple } = useQuestion();
  const { speak } = useSettings();
  useStopOnLeave();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const scene = placeSceneOf(items[0]);
  const right = useMemo(() => (answered ? items.flatMap((it, i) => (it.correct ? [i] : [])) : []), [items, answered]);
  const chosen = useMemo(() => items.flatMap((it, i) => (picked.has(it.key) ? [i] : [])), [items, picked]);
  useEffect(() => {
    if (!scene) return;
    show({ scene, answered: Boolean(answered), right, picked: chosen, count: items.length, aid: false });
  }, [show, scene, answered, right, chosen, items.length]);
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
  // Sa place vient de scenetteLayout (en bas à droite, 3 % du bord) ; la feuille de style la reprend.
  const validateBox = simple ? null : (layout.scenette?.validate ?? null);

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
          {!answered && !validateBox && !simple && (
            <button type="button" className="button primary validate-button" onClick={validate}>
              <Icon name="check" /> Valider
            </button>
          )}
        </div>
      </div>
      {/* Dans une scénette, sur tablette : « Valider » en bas à droite, sous la rangée des cloches. */}
      {!answered && validateBox && (
        <button type="button" className="button primary validate-button world-validate" onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
      <ul className="world-answers" aria-label="Cloches à trier">
        {items.map((it, i) => {
          const slot = layout.slots[i] ?? layout.slots[0];
          // En « Vue simple », les cloches sont une liste qui passe à la ligne : rien n'est posé sur la scène.
          const styles = simple ? { hit: undefined, label: undefined } : slotStyles(slot);
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
      {/* En « Vue simple » : « Valider » sous la liste, comme sous la rangée dans la scène ; sa bande reste au bas du
          panneau qui défile, toujours atteignable. */}
      {!answered && simple && (
        <div className="world-simple-validate">
          <button type="button" className="button primary validate-button" onClick={validate}>
            <Icon name="check" /> Valider
          </button>
        </div>
      )}
    </div>
  );
}
