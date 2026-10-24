// La mission jouée dans un lieu du monde ouvert (lot 4, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) :
// le lanceur d'exercice commun (ExerciseRunner), avec les mêmes items, la même correction, les mêmes étoiles et le même
// barème, posé sur la scène. La phrase, la ligne de calcul, la règle, une action et le résultat sont dans une colonne
// sur fond uni, à gauche ; chaque réponse est une étiquette et l'objet du lieu qui la porte (cloche, panier, levier,
// caisse), touchables ensemble. Sur tablette, les objets sont dans le tiers du milieu, leur étiquette au-dessus ; sur un
// téléphone couché, les étiquettes en rangée en bas, les objets juste au-dessus, la consigne en icône (lue en entier au
// premier item), la règle à droite : rien ne défile. Rien à lire n'est peint dans la 3D. Chaque lieu a sa scénette
// (la question vue de loin est retirée avec le lot 4 de la piste 1). Au Phare, une scénette (piste 1, lot 2, ../../world/continu/scenette.ts) : le rôle de
// l'habitant en tête du panneau, Kéo et la gardienne au milieu, les cloches en rangée en bas, « Valider » en bas à
// droite sur tablette quand on les marque (ses trois missions, GD-20, point 8, lot L3). Les Quais (lot 3), les Filets et les Écluses (lot 4)
// ont la leur, la colonne à gauche (le docker, la pêcheuse, l'éclusier) ; aux Filets, l'Enclos se range (GD-20, point 8,
// lot L4, SortScreen.tsx). Dans une scénette, « Vue simple » montre la même
// question en liste sur fond uni, sans quitter la manche (les cloches choisies le restent), « Valider » sous la liste ;
// « Scène », à la même place, y ramène. Une mission dont la scénette n'est pas encore faite (GD-20, point 8, le temps de la
// transition) se joue ici aussi, sur l'écran habituel (`plain` : l'écran de la grille, sur un panneau uni), avec le même
// bilan et le même retour au lieu.
import { Fragment, type ComponentType, useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { ForeignWordsProvider, Marked } from '../../../components/ForeignWords';
import { RichText, frenchTypography } from '../../../components/math/RichText';
import { gluedEnds } from '../../../core/typography';
import { isSpeechAvailable, langAttr, type Lang } from '../../../core/speech';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { fractionWords } from '../../../core/fractions';
import { seeded } from '../../../core/random';
import { useSettings } from '../../../core/SettingsContext';
import { texteGrand } from '../../../core/settings';
import { useRememberPlace } from '../../../core/lastPlace';
import { useLoaded } from '../../../core/useLoaded';
import { useBlocland } from '../../BloclandContext';
import { getIle } from '../../biomes';
import { levelFor, type Completion } from '../../engine';
import { ExerciseRunner, type RunnerRevision, type RunnerStage, type StageDoneProps } from '../../ExerciseRunner';
import { loadExercise, pickExercise } from '../../exercises';
import { Aid } from '../../exercises/Aid';
import { NoticeQuestion } from '../../exercises/CalculationScreen';
import type { ScreenProps } from '../../exercises/registry';
import { exercisesToReview } from '../../review';
import { hasScenette, placeById, type PlaceId } from '../../world/continu/levelPlan';
import { placePoseWords } from './constructionParts';
import { ANSWER_LAYOUT, WIDEN_FULL, WIDEN_OFFER, questionLayout } from '../../world/continu/questionScene';
import { scenetteLayout, scenetteOf, type Scenette } from '../../world/continu/scenette';
import { BELLS_PER_ROUND, BELLS_PER_SMALL_ROUND, bellRounds, gestureScreens, itemGesture, missionIs, phareGesture, placeInstruction, placeItems, placeRuleLine, sceneDrawsFigure, RANGE_PER_GRAND_ROUND, RANGE_PER_ROUND, RANGE_PER_SMALL_ROUND, rangeGesture, rangeRounds } from '../../world/continu/questions';
import type { LabelOnScreen, OpenWorld } from './scene';
import { BellScreen, BellTarget } from './BellScreen';
import { DialScreen } from './DialScreen';
import { SortScreen } from './SortScreen';
import { ConsigneIcon, IconLabel, PlaceAid, PlaceCarnet, PlaceDocument, QuestionContext, aidOf, figureOf, placeSceneOf, sameItem, slotStyles, useQuestion, useStopOnLeave, type ItemShown } from './placeScreen';
import { WorldDone } from './WorldDone';
import { filledGap, inVisibleScene, labelBesideBar, overflows, wordsCut } from './fit';


/** Le nombre de réponses tant que l'écran ne l'a pas dit. */
const DEFAULT_COUNT = 3;

/**
 * Les habitants déjà présentés depuis le lancement de l'application : leur phrase (`greeting`) ne s'écrit qu'à la
 * première rencontre (rien en sauvegarde ; directeur artistique, relecture de L7).
 */
const greeted = new Set<PlaceId>();

interface Props {
  place: PlaceId;
  mission: string;
  /** L'écran habituel, sans scène : une mission dont la scénette n'est pas encore faite (GD-20, point 8). */
  plain?: boolean;
  world: OpenWorld;
  /** Fin de la question (« Revenir au Phare », Quitter) : la page rend la main au monde. */
  onClose(): void;
  /** Un morceau d'une révision dans la scène du lieu (GD-20, point 4, lot L3, WorldRevision.tsx), à la place d'une partie. */
  revision?: WorldRevisionPart;
}

/**
 * Un morceau d'une révision jouée dans la scène du lieu (GD-20, point 4, lot L3) : l'exercice et le niveau de la file,
 * ses clés dues, le repère compté sur tout le passage ; `entry` (« Tu revois 5 questions. ») ouvre la consigne du
 * premier morceau. À la fin d'un morceau, `onPart` reçoit ce qu'il a donné ; le dernier montre le bilan `Done`.
 */
export interface WorldRevisionPart {
  exercise: string;
  level: number;
  keys: readonly string[];
  offset: number;
  total: number;
  last: boolean;
  entry: string | null;
  onPart(completion: Completion): void;
  Done: ComponentType<StageDoneProps>;
}

/** La scénette d'un lieu qui n'en a pas (le 5e, GD-22, lot 2) : ni rôle ni phrase d'accueil. */
const NO_SCENETTE: Scenette = { role: '', greeting: null, placement: 'rangee' };

export function WorldQuestion({ place, mission, plain = false, world, onClose, revision }: Props) {
  const { state, completeRevision } = useBlocland();
  const { settings } = useSettings();
  const grandTexte = texteGrand(settings);
  // Les célébrations (« Succès débloqué », niveau) attendent la fin de la question et de son bilan : rien ne surgit
  // pendant qu'on lit (monde ouvert seulement).
  useHoldCelebrations(true);
  const lieu = placeById(place);
  const biome = getIle(lieu.island);
  // Au 5e et dans les lieux construits du 4e, le bilan nomme la partie posée par l'étape du lieu, jamais par le nom du
  // plan ni sa réplique (directeur du contenu pédagogique, lot 5 du 5e ; lot 2 du 4e) ; au 6e, comme la grille.
  const poseWords = useMemo(() => placePoseWords(lieu), [lieu]);
  // « Ma dernière mission » (accès direct) y ramène, comme à une mission de la grille : la liste de son lieu s'ouvre.
  const missionTitle = biome?.exercises.find((e) => e.id === mission)?.title;
  // Une révision n'est pas « Ma dernière mission » : seule une partie y ramène.
  useRememberPlace(biome && missionTitle && !revision ? { path: `/adventure/${biome.id}/${mission}`, label: `${missionTitle} · ${biome.name}` } : null);
  const [run, setRun] = useState(0);
  // L'exercice est choisi comme sur l'écran classique (ExercisePage) : au lancement et à chaque « Rejouer ».
  const picked = useMemo(
    () =>
      revision
        ? { id: revision.exercise, level: revision.level }
        : biome
          ? pickExercise(biome.id, mission, levelFor(state, mission), state.progress, exercisesToReview(state.spaced))
          : undefined,
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
  // Un écran bas (un téléphone couché) : la scénette y prend la bulle comme sur tablette (GD-26), mais « Vue simple »
  // garde sa ligne repliée, et les manches y sont plus courtes.
  const lowScreen = (size.h || 1) < ANSWER_LAYOUT.low;
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
  // Dans une scénette en colonne, un mot de réponse coupé fait d'abord passer la rangée sous la colonne, sur toute la
  // largeur (« Elles sont égales », Deux rives, GD-20, point 8, lot L2), avant de faire tomber l'image ou de proposer
  // « Vue simple ».
  const [wideRow, setWideRow] = useState(false);
  // Un lieu du 5e n'a pas encore de scénette (GD-22, lot 2) : ses missions se jouent toujours sur l'écran habituel,
  // sans habitant ni phrase d'accueil.
  const scenette = hasScenette(place) ? scenetteOf(place) : NO_SCENETTE;
  // La première rencontre de l'habitant depuis le lancement : sa phrase s'écrit au premier item seulement.
  const [meeting] = useState(() => scenette.greeting !== null && !greeted.has(place));
  const [greetItem, setGreetItem] = useState<string | null>(null);
  const layout = useMemo(() => {
    const base = questionLayout({ count, bells: place === 'phare', aid: hasAid, widen }, size.w || 1, size.h || 1);
    // Les cloches portent des mots (la Chasse au son, les Rimes-échelle) ou un nombre (l'Abattage syllabique).
    // Le geste « ranger » : les sujets sont des mots, et leurs étiquettes se mesurent comme celles des cloches.
    const words = (place === 'phare' && mission !== 'syllables') || (place === 'filets' && mission === 'word-classes');
    // « Valider » n'a sa place que pour marquer les cloches ou ranger ; ailleurs, un toucher répond.
    const validate = place === 'phare' || (picked !== undefined && rangeGesture(place, picked.id) !== null) || Boolean(item?.gesture);
    // Au téléphone couché, la jauge des Marais salants garde la colonne à gauche (la disposition B) : sous la bulle, ses
    // graduations passeraient sous 8 px l'une de l'autre.
    const column = item?.scene.kind === 'jauge' && lowScreen;
    return scenetteLayout({ count, widen, small: place === 'phare', words, grand: grandTexte, aid: hasAid, wideRow, validate, column }, size.w || 1, size.h || 1, base);
  }, [count, hasAid, place, mission, size, widen, grandTexte, wideRow, picked, item?.scene.kind, item?.gesture]);
  // La rangée des réponses à droite de la colonne (les Quais sur un écran bas) : le résultat reste dans la colonne.
  const rowBeside = layout.low && layout.slots.length > 0 && Math.min(...layout.slots.map((sl) => sl.hit.left)) >= layout.panel.left + layout.panel.width;
  const [finished, setFinished] = useState(false);
  // La réussite de la mission (une étoile au moins) : dans une scénette posée, l'objet de la réussite va à sa place.
  const [success, setSuccess] = useState(false);
  // Un mot de réponse coupé dans son étiquette (les cloches en grand texte) : on ne répond que dans « Vue simple »,
  // proposé d'emblée, la voix gardée ; les étiquettes ne passent jamais sur deux rangées.
  const [answersOut, setAnswersOut] = useState(false);
  // Sur tablette, un mot coupé fait d'abord tomber l'image devant les mots (comme sur un écran bas), puis seulement
  // propose « Vue simple » (référent dys : « pantalon » en OpenDyslexic).
  const [bare, setBare] = useState(false);
  // « Vue simple » dans une scénette : la même question, en liste sur fond uni, à la même place de la mission (les
  // cloches déjà choisies restent choisies).
  const [simple, setSimple] = useState(false);
  // Sur un écran bas, en « Vue simple », la consigne se replie en une ligne (le rôle, son début, sa voix) pour que les
  // cloches se voient dès l'ouverture ; un toucher sur la ligne ou « Lire la suite » la déplie.
  // Elle s'ouvre repliée, même au plus grand texte (le rôle et le début de la consigne, lue à voix haute, « Lire la
  // suite » la déplie) : la rangée et « Valider » restent visibles dès l'ouverture (référent dys, GD-20, point 8) ; dépliée,
  // elle se replie à l'item suivant (la clé de l'item, pas sa scène : aux Quais, tous les items ont la même).
  const [consigneOpen, setConsigneOpen] = useState(false);
  const itemKey = item ? item.key || JSON.stringify(item.scene) : '';
  const lastItem = useRef('');
  useEffect(() => {
    if (!itemKey) return;
    if (lastItem.current && lastItem.current !== itemKey) setConsigneOpen(false);
    lastItem.current = itemKey;
  }, [itemKey]);
  const openSimple = useCallback(() => {
    setConsigneOpen(false);
    setSimple(true);
  }, []);
  useEffect(() => {
    if (meeting && itemKey && greetItem === null) setGreetItem(itemKey);
  }, [meeting, itemKey, greetItem]);
  const offer = !simple && ((layout.low && widen >= WIDEN_OFFER) || (!layout.low && answersOut));
  // Les réponses sorties de la scène (l'offre de « Vue simple ») : la scène ne dessine plus leurs objets, qui resteraient
  // sans étiquette et sembleraient se toucher (retouche 3 du lot 5 du 5e, les miches du Hameau en portrait).
  const objectsOut = answersOut || (layout.low && offer);
  // Sur un écran bas, la consigne s'affiche en entier une fois, au premier item, puis devient une icône.
  const [introDone, setIntroDone] = useState(false);
  // Le focus à reposer après la bascule de la barre (« Scène », « Vue simple »).
  const refocus = useRef(false);
  const backToScene = useCallback(() => {
    setSimple(false);
    refocus.current = true;
  }, []);
  // La bulle de l'habitant (GD-26) : dans une scénette, la consigne repliée en une ligne et la phrase de l'item, en haut ;
  // la scène prend l'écran. Ni « Commencer » ni phrase d'accueil : la consigne se lit dans la bulle.
  const bulle = !plain && !simple && !finished && hasScenette(place);
  const intro = !bulle && layout.low && !introDone && !finished && !offer && !simple;
  // La phrase de l'habitant, à la première rencontre : au premier item sur tablette ; sur un écran bas, avec
  // « Commencer » seulement (consultant UX UI) ; jamais dans la ligne repliée. Comptée comme vue une fois affichée.
  const greeting = scenette.greeting && greetItem === itemKey && (!layout.low || intro) ? scenette.greeting : null;
  useEffect(() => {
    if (greeting) greeted.add(place);
  }, [greeting, place]);
  // La « Vue simple » serrée des écrans bas (la consigne repliée en une ligne, « Scène » et la pause dans la ligne
  // d'en-tête) : sur un écran bas, et au plus grand texte aussi sur tablette, où la consigne entière poussait la phrase
  // sous le pli (mesure de 1024 × 768 au plus grand texte, deuxième passe de L6a ; les réponses, lot L7). Dans une
  // scénette, la bulle (GD-26) a la même ligne repliée.
  const foldedSimple = lowScreen || grandTexte;
  const simpleLow = simple && foldedSimple && !finished;
  const tight = simpleLow || bulle;
  // « Vue simple » ouverte d'elle-même (une bulle trop haute, une étiquette coupée) : une seule fois par visite, tant
  // que la question reste montée ; revenu à « Scène », l'élève garde son choix.
  const autoSimple = useRef(false);
  const startItems = useCallback(() => {
    setIntroDone(true);
    // La consigne élargie pour être lue en entier : la colonne reprend sa largeur pour la scène.
    setWiden((n) => (n === WIDEN_FULL ? 0 : n));
  }, []);
  // Mesuré avant l'affichage, à chaque item, réponse ou cran : une colonne qui déborde (en hauteur ou en largeur) prend
  // le cran suivant ; une consigne qui ne tient pas en pleine largeur mène droit à « Vue simple » ; un mot coupé aussi.
  // Sur tablette, seule une scénette se mesure : ses mots de réponse (le panneau prend la hauteur de son texte).
  useLayoutEffect(() => {
    // Rien ne se mesure avant que la page ait sa taille (la place des réponses en dépend), ni sur l'écran habituel.
    // Ni avant que l'item soit connu : la place de la règle (à côté de la scène) en dépend, et la règle encore dans le
    // panneau le ferait déborder.
    if (!size.w || !item || plain || simple || finished || answersOut) return;
    const root = box.current;
    if (!root) return;
    const column = root.querySelector<HTMLElement>('.quiz.in-world');
    if (wordsCut(root.querySelectorAll<HTMLElement>('.world-answer-label'))) {
      if (!wideRow && (bulle || layout.panel.left + layout.panel.width < Math.min(...layout.slots.map((sl) => sl.hit.left)))) {
        setWideRow(true);
        return;
      }
      if (!layout.low && !bare) {
        setBare(true);
        return;
      }
      // Dans la bulle (GD-26), une étiquette coupée ouvre « Vue simple » d'office, une fois par visite ; au plus grand texte
      // aussi, sur tablette : la phrase et les réponses à l'ouverture plutôt que l'offre de « Vue simple » (lot L7,
      // deuxième passe : les Vitraux des phrases, le Coffre à mots, les Marais salants).
      if ((bulle || (grandTexte && !layout.low)) && !autoSimple.current) {
        autoSimple.current = true;
        openSimple();
        return;
      }
      setAnswersOut(true);
      setWiden(WIDEN_OFFER);
      return;
    }
    if (offer) return;
    // Au plus grand texte, un carnet qui ne montre pas trois lignes de son rappel (référent dys, PR 1 de GD-26) : « Vue
    // simple », où le rappel est entier.
    const carnet = root.querySelector<HTMLElement>('.world-carnet');
    if (bulle && grandTexte && carnet && carnet.scrollHeight > carnet.clientHeight + 1 && !autoSimple.current) {
      const line = parseFloat(getComputedStyle(carnet).lineHeight) || 32;
      // Les lignes du rappel qu'on voit sous son titre : du haut de la première au bas du carnet.
      const first = carnet.querySelector<HTMLElement>('li') ?? carnet;
      const shown = (carnet.getBoundingClientRect().bottom - first.getBoundingClientRect().top) / line;
      if (shown < 3) {
        autoSimple.current = true;
        openSimple();
        return;
      }
    }
    // Une bulle plus haute que sa place (35 % de l'écran, GD-26) : une phrase coupée par son bas mène à « Vue simple ».
    if (!column || !overflows(column)) return;
    // Une scénette dont le panneau déborderait s'ouvre en « Vue simple », une fois (sur un écran bas, après l'avoir
    // essayée en pleine largeur) : la consigne y est entière, et c'est le panneau qui défile (« Valider » reste dans sa
    // bande, en bas). Revenu à la scène, l'élève garde son choix et les crans d'avant jusqu'à la fin de la visite.
    const opensSimple = grandTexte || !layout.low;
    const triedFullWidth = !layout.low || !intro || widen >= WIDEN_FULL;
    if (opensSimple && !autoSimple.current && !column.classList.contains('has-sheet') && triedFullWidth) {
      autoSimple.current = true;
      openSimple();
      return;
    }
    if (!layout.low) return;
    // Dans une scénette, la consigne lue en entier au premier item prend d'abord toute la largeur (aux Quais, elle est
    // longue) ; « Commencer » rend la colonne à la scène. Ailleurs, ou si elle ne tient toujours pas : « Vue simple ».
    if (intro) setWiden(widen < WIDEN_FULL ? WIDEN_FULL : WIDEN_OFFER);
    else if (column.classList.contains('has-sheet')) setSheetWide(true);
    else setWiden((n) => Math.min(WIDEN_OFFER, n + 1));
  }, [layout, intro, finished, offer, widen, item, sheetWide, answersOut, size.w, plain, simple, bare, grandTexte, openSimple, wideRow, bulle]);
  // La barre du haut change de bouton à la bascule (« Scène », « Vue simple ») : le focus, resté sur le bouton parti,
  // passe à celui qui le remplace.
  useEffect(() => {
    if (!refocus.current) return;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) {
      refocus.current = false;
      return;
    }
    const host = box.current;
    const next = host?.querySelector<HTMLElement>(':scope > .world-question-simple') ?? host?.querySelector<HTMLElement>('.world-consigne-more');
    if (!next) return;
    refocus.current = false;
    next.focus({ preventScroll: true });
  }, [simple, itemKey]);
  // « Vue simple » proposé dans la bulle : la bulle repart de son haut, le rôle et la consigne d'abord (relectures de la
  // PR 1 de GD-26 : au téléphone, le bouton posé sur la bulle cachait la consigne).
  useEffect(() => {
    if (!offer || !bulle) return;
    const panel = box.current?.querySelector<HTMLElement>('.quiz.in-world');
    if (panel) panel.scrollTop = 0;
  }, [offer, bulle]);
  // Chaque item de « Vue simple » s'ouvre en haut du panneau, sa phrase d'abord, même si l'élève avait descendu jusqu'aux
  // réponses de l'item d'avant (relecture de L2, au plus grand texte sur téléphone).
  useEffect(() => {
    if (!simple || !itemKey) return;
    const panel = box.current?.querySelector<HTMLElement>('.quiz.in-world');
    if (panel) panel.scrollTop = 0;
  }, [simple, itemKey]);
  // Le panneau de « Vue simple » défile : il s'ouvre en haut (le rôle, la consigne), et `data-suite` dit qu'il reste
  // de quoi lire plus bas (une ombre au-dessus de « Valider ») ou plus haut. `data-repere` montre un chevron sur un trait
  // pointillé (« Suite plus bas ») tant qu'il reste quoi que ce soit sous le bord, une réponse, une figure ou l'indice
  // (relecture du lot L5, consultant UX UI : l'indice coupé net ne se signalait pas) : sans « Valider » (les paniers,
  // les leviers, les caisses, les sacs), au bas du panneau ; avec lui, à droite dans sa bande. Il part une fois en bas
  // du panneau, et se rallume quand une consigne se déplie ou qu'une figure s'ajoute.
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
      if (below !== 'repere' in panel.dataset) {
        if (below) panel.dataset.repere = '';
        else delete panel.dataset.repere;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(panel);
    const mutation = new MutationObserver(schedule);
    // Déplier la consigne ne change que des attributs (la classe du panneau, `hidden` de la suite) : sans eux, le repère
    // restait éteint quand la consigne dépliée pousse les réponses sous le bord (sonde des plis du lot L5).
    mutation.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    panel.addEventListener('scroll', schedule, { passive: true });
    update();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      panel.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
      delete panel.dataset.suite;
      delete panel.dataset.repere;
    };
  }, [simple, finished, loaded]);
  useEffect(() => {
    if (plain || !size.w || !size.h || !item || finished) return;
    const shown = world.question({ place, mission, layout, item, answersOut: objectsOut });
    // Un repère dont le point sort de la scène visible (sous le panneau, au bord de l'écran) ne se montre pas.
    const r = box.current?.querySelector('.quiz.in-world')?.getBoundingClientRect();
    const origin = box.current?.getBoundingClientRect();
    const panel = r && origin ? { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top } : null;
    const visible = (all: LabelOnScreen[]) => all.filter((l) => inVisibleScene(l, size.w, size.h, panel));
    setLabels(visible(shown));
    // `intro` : sur un téléphone couché, le panneau de « Commencer » couvre la scène ; il se réduit à la colonne au
    // premier item, et les repères se recalculent (sans lui, les deux entiers de la jauge des Marais salants restaient
    // cachés jusqu'à la première réponse, lot L5).
    // La caméra tournée à deux doigts pendant la scénette (« caméra libre ») : les repères suivent le décor.
    return world.onSceneTurn((labels) => setLabels(visible(labels)));
  }, [world, place, mission, plain, layout, item, size, finished, intro, objectsOut]);
  // Un repère de la scène ne passe jamais sous les boutons du haut (« Vue simple », la pause, à droite d'elle) : sur un
  // téléphone couché, l'entier du haut de la jauge les touchait (relecture du lot L5, consultant UX UI). Il descend alors
  // sous son point, ou se cache ; mesuré une fois par pose des repères, jamais à chaque image.
  useLayoutEffect(() => {
    const host = box.current;
    const button = host?.querySelector(':scope > .world-question-simple')?.getBoundingClientRect();
    if (!host || !labels.length) return;
    for (const el of host.querySelectorAll<HTMLElement>(':scope > .world-question-label')) {
      delete el.dataset.place;
      if (!button?.height) continue;
      const r = el.getBoundingClientRect();
      // La pause est à droite de « Vue simple », jusqu'au bord : la barre va de lui au bord de l'écran.
      const bar = { left: button.left, top: button.top, right: window.innerWidth, bottom: button.bottom };
      const lift = parseFloat(getComputedStyle(el).marginTop) || 0;
      const at = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      const place = labelBesideBar(at, { ...at, top: at.top - lift, bottom: at.bottom - lift }, bar);
      if (place !== 'place') el.dataset.place = place;
    }
  }, [labels]);
  // La fin de la mission : la caméra revient au lieu, où la pièce remise en marche se voit derrière le bilan ; dans une
  // scénette, elle reste (au Phare, les cloches s'effacent ; ailleurs, la réussite se pose).
  useEffect(() => {
    if (plain || !finished) return;
    world.scenetteEnd(success);
    setLabels([]);
  }, [world, plain, finished, success]);
  // En partant (« Revenir », Quitter, « Vue simple »), la scène reprend son cadrage.
  useEffect(() => () => void world.question(null), [world]);

  const show = useCallback((next: ItemShown | null) => {
    setItem((prev) => (next && prev && sameItem(prev, next) ? prev : next));
  }, []);

  const ready = loaded && picked ? { def: loaded, level: picked.level } : null;
  // En « Vue simple », un item dont la scène remplace la figure se joue tel que la référence l'écrit, consigne comprise
  // (directeur du contenu pédagogique, 16 octobre 2026) ; la scène garde la consigne du lieu.
  const referenceView = simple && item !== null && sceneDrawsFigure(item.scene);
  const placed = ready ? (referenceView ? ready.def.instruction : placeInstruction(place, ready.def.id, ready.level, ready.def.instruction, item?.scene)) : '';
  // La révision le dit en ouvrant sa consigne, sans date ni échec (« Tu revois 5 questions. »), lue avec elle.
  const entry = revision?.entry ?? null;
  const instruction = placed && entry ? `${entry} ${placed}` : placed;
  // Dans la bulle (GD-26), la consigne courte : celle de l'item (son geste), sinon celle du niveau ; la consigne entière
  // reste dans « Vue simple » et pour les lecteurs d'écran.
  // Un lieu qui a sa consigne à lui (le Phare, l'Enclos, les Écluses, la jauge) la garde : la consigne courte du niveau
  // ne remplace que la consigne de référence.
  const short = item?.short ?? (ready && placed === ready.def.instruction ? ready.def.shortInstruction : undefined);
  const bubbleLine = short ? (entry ? `${entry} ${short}` : short) : instruction;
  // La fin d'un morceau de révision : la file et les blocs d'une révision, jamais la session de l'application.
  const runnerRevision = useMemo<RunnerRevision | undefined>(
    () =>
      revision
        ? { keys: revision.keys, offset: revision.offset, total: revision.total, more: !revision.last, complete: (def, results) => completeRevision(def, results, revision.last) }
        : undefined,
    [revision, completeRevision],
  );
  const Done = revision?.Done ?? WorldDone;
  const context = useMemo(() => ({ place, layout, show, instruction, simple, lowScreen }), [place, layout, show, instruction, simple, lowScreen]);

  const exerciseId = ready?.def.id;
  const readyLevel = ready?.level ?? 1;
  const bellTarget = String(ready?.def.target ?? '');
  // Au plus grand texte sur un écran bas, des manches de quatre cloches (relecture de L3 : la manche tient au-dessus de
  // « Valider ») ; le nombre se fixe au premier découpage d'une partie : une rotation ne refait pas les manches en cours.
  const smallBells = grandTexte && lowScreen;
  const roundCut = useRef<{ key: string; perRound: number } | null>(null);
  const bellsPerRound = useCallback(
    (seed: string): number => {
      const key = `${run}:${seed}`;
      if (roundCut.current?.key !== key) roundCut.current = { key, perRound: smallBells ? BELLS_PER_SMALL_ROUND : BELLS_PER_ROUND };
      return roundCut.current.perRound;
    },
    [run, smallBells],
  );
  // Le geste « ranger » : quatre sujets par manche, trois sur un écran bas, deux au plus grand texte sur un écran bas
  // (relecture de L4 : la manche tient au-dessus de « Valider ») ; fixé de même au premier découpage.
  const sortCut = useRef<{ key: string; perRound: number } | null>(null);
  const sortsPerRound = useCallback(
    (seed: string): number => {
      const key = `${run}:${seed}`;
      if (sortCut.current?.key !== key) sortCut.current = { key, perRound: lowScreen ? (grandTexte ? RANGE_PER_GRAND_ROUND : RANGE_PER_SMALL_ROUND) : RANGE_PER_ROUND };
      return sortCut.current.perRound;
    },
    [run, lowScreen, grandTexte],
  );
  const stage = useMemo<RunnerStage | null>(() => {
    if (!exerciseId) return null;
    // L'écran habituel (le temps de la transition) : l'écran de la grille, ses items, sa consigne, sur un panneau uni ;
    // le bilan et le retour du lieu. Ni rôle, ni scène, ni « Vue simple » : la même forme dans tous les lieux.
    if (plain) return { instruction, back: { label: `Revenir ${lieu.at}`, onClick: onClose }, Done, revision: runnerRevision, pose: poseWords, className: `in-world ecran-habituel${finished ? ' finished' : ''}` };
    const extra: ReactNode = (
      <>
        {intro && (
          <button type="button" className="button primary world-question-start" onClick={startItems}>
            <Icon name="play" /> Commencer
          </button>
        )}
        {/* La consigne courte de la bulle (GD-26) tient sur sa ligne : pas de « Lire la suite » ; la consigne entière est
            dans « Vue simple ». */}
        {tight && !(bulle && bubbleLine !== instruction) && (
          <button
            type="button"
            className="button world-consigne-more"
            aria-expanded={consigneOpen}
            aria-controls="consigne-ligne"
            // Au plus grand texte, le bouton n'est qu'une icône : son nom est toujours dit (référent dys).
            aria-label={consigneOpen ? 'Replier la consigne' : 'Lire la suite de la consigne'}
            title={consigneOpen ? 'Replier la consigne' : 'Lire la suite de la consigne'}
            onClick={() => setConsigneOpen((open) => !open)}
          >
            <Icon name="book" />
            <span className="world-consigne-more-word">{consigneOpen ? 'Replier' : 'Lire la suite'}</span>
          </button>
        )}
        {simple && (
          // Le repère de défilement (data-repere, plus haut) : un chevron vers le bas sur un trait pointillé, au bas du
          // panneau, tant que des réponses restent plus bas ; sa place est toujours tenue (rien ne bouge quand il part).
          <div className="world-repere" role="img" aria-label="Suite plus bas">
            <Icon name="chevronDown" />
          </div>
        )}
        {offer && (
          // Le texte choisi ne tient pas ici : le repli franc, sans réduire le texte ; la voix reste (« Lire la phrase »).
          // Dans une scénette, un bouton secondaire sous le rôle, jamais un bouton plein avant la consigne (référent dys).
          <button type="button" className="button world-question-offer" onClick={openSimple}>
            <Icon name="liste" /> Vue simple
          </button>
        )}
      </>
    );
    // Le rôle de l'habitant en tête du panneau, et la place de sa phrase d'accueil (vide tant que le mainteneur n'a pas
    // tranché : la consigne reste la seule phrase, lue).
    // En « Vue simple » sur un écran bas : une seule ligne, le rôle puis le début de la consigne (la consigne entière
    // reste le titre du panneau pour les lecteurs d'écran), sa voix toujours visible.
    // Au Phare, toutes les missions aux mêmes cloches (GD-20, point 8, lot L3) : marquer puis « Valider », en manches de
    // six (la Chasse au son, les Rimes-échelle), ou toucher la cloche de sa réponse, un mot par item (l'Abattage
    // syllabique). Ailleurs, un item par écran.
    const marks = place === 'phare' && phareGesture(exerciseId) === 'marquer';
    // Aux Filets, l'Enclos se range (GD-20, point 8, lot L4) : toucher un sujet, puis son panier, par manches de quatre.
    const ranges = rangeGesture(place, exerciseId) !== null;
    // Au plus grand texte sur un écran bas, la cible des cloches prend la ligne de la consigne repliée, sous le rôle :
    // toujours affichée, avant les mots, sans ligne de plus (relecture de L3) ; la consigne reste dite, et dépliée, la
    // cible après elle.
    const target = marks && grandTexte && simpleLow ? bellTarget : '';
    // À l'Enclos, au plus grand texte sur un écran bas, la ligne de règle prend la ligne de la consigne repliée, avant
    // elle ; la consigne reste dite, et dépliée, après la règle. La manche passe alors sous « Valider » et le panneau
    // défile (dérogation du 16 octobre 2026, choix du mainteneur : ce seul réglage, l'Enclos seulement).
    const rule = ranges && grandTexte && simpleLow ? placeRuleLine(place, exerciseId, readyLevel) : null;
    const line = bulle ? bubbleLine : instruction;
    const head: ReactNode = tight ? (
        <div className="world-scenette-head world-consigne-line">
          <p className="world-consigne-fold" id="consigne-ligne">
            <strong className="world-scenette-role">
              <RoleName role={scenette.role} />
            </strong>{' '}
            {rule && (
              <>
                <span className="world-consigne-regle">{frenchTypography(rule)}</span>{' '}
              </>
            )}
            <span aria-hidden="true" hidden={(Boolean(target) || Boolean(rule)) && !consigneOpen}>
              {frenchTypography(line)
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
            {target && (
              <>
                {' '}
                <span className="sound-target world-consigne-cible">
                  <BellTarget target={target} rhymes={missionIs(exerciseId ?? '', 'rhymes')} />
                </span>
              </>
            )}
          </p>
          <SpeakButton text={frenchTypography(line)} label="Consigne" compact />
        </div>
      ) : (
        <div className="world-scenette-head">
          <p className="world-scenette-role">
            <RoleName role={scenette.role} />
          </p>
          {greeting && (
            <p className="world-scenette-greeting">
              <Syllabified text={frenchTypography(greeting)} />
              <SpeakButton text={frenchTypography(greeting)} compact />
            </p>
          )}
        </div>
      );
    return {
      head,
      screens: marks
        ? (items, seed) => bellRounds(placeItems(place, exerciseId, items), seeded(`${seed}:cloches`), bellsPerRound(seed))
        : ranges
          ? (items, seed) => rangeRounds(placeItems(place, exerciseId, items), sortsPerRound(seed))
          : (items, seed) => gestureScreens(placeItems(place, exerciseId, items, fractionWords, simple), sortsPerRound(seed)),
      Screen: marks ? BellScreen : ranges ? SortScreen : GestureScreen,
      instruction,
      back: { label: `Revenir ${lieu.at}`, onClick: onClose },
      extra,
      Done,
      revision: runnerRevision,
      pose: poseWords,
      className:
        simple && !finished
          ? `in-world scenette simple${foldedSimple ? ' simple-bas' : ''}${consigneOpen ? ' consigne-ouverte' : ''}`
          : `in-world scenette${layout.low ? ' low' : ''}${layout.low && widen >= WIDEN_FULL ? ' full' : ''}${offer ? ' offer' : ''}${intro ? ' intro' : ''}${finished ? ' finished' : ''}${sheetWide ? ' sheet-wide' : ''}${objectsOut ? ' answers-out' : ''}${rowBeside ? ' rangee-a-cote' : ''}${bare ? ' sans-image' : ''}${hasAid ? ' avec-rappel' : ''}${bulle ? ' bulle simple-bas' : ''}`,
    };
  }, [
    exerciseId,
    bubbleLine,
    bellsPerRound,
    sortsPerRound,
    bellTarget,
    grandTexte,
    plain,
    instruction,
    place,
    lieu.at,
    onClose,
    Done,
    runnerRevision,
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
    foldedSimple,
    consigneOpen,
    rowBeside,
    tight,
    readyLevel,
    greeting,
    poseWords,
    hasAid,
    bulle,
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
      line.classList.remove('role-seul', 'premier-mot', 'role-large');
      const panel = line.closest<HTMLElement>('.quiz.in-world');
      if (panel) delete panel.dataset.livre;
      if (!ellipsis) return;
      ellipsis.hidden = true;
      // La cible des cloches tient la ligne à la place de la consigne : rien à couper.
      if (consigneOpen || line.querySelector('.world-consigne-cible, .world-consigne-regle')) return;
      const role = line.querySelector<HTMLElement>('.world-scenette-role');
      const ownLine = () => role !== null && getComputedStyle(role).display === 'block';
      // Coupe la consigne sur sa première ligne : celle du rôle, ou la suivante quand le rôle a sa ligne (au plus grand
      // texte) ; rend le nombre de mots gardés.
      const cutLine = () => {
        for (const w of words) w.hidden = false;
        ellipsis.hidden = true;
        const first = (ownLine() ? (words[0] ?? line) : (role ?? line)).getBoundingClientRect();
        const onFirstLine = (el: HTMLElement) => el.getBoundingClientRect().top < first.top + first.height / 2;
        let cut = words.findIndex((w) => !onFirstLine(w));
        if (cut < 0) return words.length;
        for (let i = cut; i < words.length; i++) words[i].hidden = true;
        ellipsis.hidden = false;
        while (cut > 0 && !onFirstLine(ellipsis)) words[--cut].hidden = true;
        return cut;
      };
      // Le rôle en cadre à côté de la consigne (au plus grand texte, lot L2) : si pas un mot n'y tient à côté de lui, il
      // reprend sa ligne, jamais une consigne réduite à « … ».
      if (cutLine() === 0 && words.length > 0 && role && !ownLine()) {
        line.classList.add('role-seul');
        cutLine();
      }
      // Le rôle sur sa ligne, plus large qu'elle (« L’horticultrice », « La sculptrice » au téléphone, au plus grand
      // texte) : il passe à la ligne entre ses mots, au lieu d'être rogné par la ligne (retouche 1 des Coteaux du 4e).
      if (role && ownLine() && role.getBoundingClientRect().right > line.getBoundingClientRect().right + 0.5) {
        line.classList.add('role-large');
        cutLine();
      }
      // La ligne garde toujours au moins le premier mot de la consigne (« Lis … », « Choisis … »), jamais « … » seul
      // (directeur artistique, L8) : la ligne prend alors sa largeur, les boutons passent après elle.
      if (words.length > 0 && words[0].hidden) {
        words[0].hidden = false;
        ellipsis.hidden = words.length === 1;
        line.classList.add('premier-mot');
        // « Lire la suite » passé à la rangée d'après ne s'épingle pas : épinglé en haut, il couvrait le premier mot quand
        // le panneau défile (directeur artistique, L8).
        const more = panel?.querySelector<HTMLElement>(':scope > .world-consigne-more');
        const row = line.closest<HTMLElement>('.world-consigne-line') ?? line;
        if (panel && more && more.getBoundingClientRect().top >= row.getBoundingClientRect().bottom - 1) panel.dataset.livre = 'dessous';
      }
    };
    fit();
    let alive = true;
    void document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
    };
    // Refaite aussi quand « Vue simple » s'ouvre d'office (le rôle passe alors sur sa ligne) : sinon la consigne entière.
  }, [stage, consigneOpen, size.w, settings, simple, layout.low, foldedSimple, bulle]);

  const style = {
    '--question-left': `${layout.panel.left}px`,
    '--question-top': `${layout.panel.top}px`,
    '--question-width': `${layout.panel.width}px`,
    '--question-max-height': `${layout.panel.maxHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={`world-question${plain ? ' ecran-habituel' : ' scenette'}`}
      ref={box}
      style={style}
      onClick={(e) => {
        // La ligne repliée de la consigne se déplie aussi au toucher (le clavier passe par « Lire la suite »).
        if (tight && e.target instanceof Element && e.target.closest('.world-consigne-fold')) setConsigneOpen((open) => !open);
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
                // Un morceau de révision : le suivant prend sa place (WorldRevision) ; le dernier montre le bilan, sans
                // réussite posée dans la scène (une révision ne remet rien en marche).
                revision?.onPart(completion);
                if (revision && !revision.last) return;
                setSuccess(!revision && completion.stars >= 1);
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
                setWideRow(false);
                lastItem.current = '';
                setItem(null);
                setRun((r) => r + 1);
              }}
            />
          </ForeignWordsProvider>
        </QuestionContext.Provider>
      )}
      {/* « Vue simple » : hors de la colonne, au-dessus de tout, à côté de la pause ; rien ne le recouvre. */}
      {/* Un seul « Vue simple » : celui du panneau quand le repli est proposé. */}
      {ready && stage && !plain && !finished && !offer && !simple && (
        <button type="button" className="button world-question-simple" onClick={openSimple}>
          <Icon name="liste" /> <span className="world-question-simple-word">Vue simple</span>
        </button>
      )}
      {/* En « Vue simple » d'une scénette, à la même place : le retour à la scène, les cloches choisies gardées. */}
      {ready && stage && !plain && !finished && simple && (
        <button type="button" className="button world-question-simple" onClick={backToScene}>
          <Icon name="mountain" /> <span className="world-question-simple-word">Scène</span>
        </button>
      )}
      {!finished &&
        !simple &&
        labels.map((l, i) => (
          <span
            key={`${i}-${l.text}`}
            className={`world-question-label${l.center ? ' centre' : ''}`}
            aria-hidden="true"
            style={{ transform: `translate(${Math.round(l.x)}px, ${Math.round(l.y)}px)${l.center ? ' translateX(-50%)' : ''}` }}
          >
            <RichText text={l.text} />
          </span>
        ))}
    </div>
  );
}

/**
 * Une fraction suivie d'un signe de ponctuation (« 2/8. », « 3/4 ? », l'espace avant « ? » devenue insécable) : ils ne
 * se séparent pas en fin de ligne. Deux fractions comparées (« 3/5 et 3/10. », Deux rives) restent sur une seule ligne,
 * leur signe avec elles : les deux fractions en colonne ne prennent qu'une ligne haute (GD-20, point 8, lot L3 : une
 * ligne de la phrase de moins au plus grand texte sur téléphone). Un mot composé (« sont-elles », « a-t-on ») ne se
 * coupe pas à son trait d'union : RichText le garde entier (`keepTogether`). De même, le trou d'une phrase (« … ») garde
 * son point final (« s'appelle une … . » : le point passait seul à la ligne au plus grand texte sur téléphone).
 */
const FRACTION_STUCK = /(\d+\/\d+ (?:ou|et) \d+\/\d+(?:[ \u00a0\u202f]?[.,;:!?])?|\d+\/\d+[ \u00a0\u202f]?[.,;:!?]|(?<!\/)…[ \u00a0\u202f]?[.,;:!?])/u;

/**
 * Le rôle de l'habitant, une coupure permise après l'apostrophe d'une élision (« L’ » de « L’horticultrice ») : trop
 * large pour sa ligne (au téléphone, au plus grand texte), il passe à la ligne entre l'article et le nom, jamais au
 * milieu du mot (retouche 1 des Coteaux du 4e : « L’horticultri » rogné). Rien ne change quand il tient.
 */
function RoleName({ role }: { role: string }) {
  const parts = role.split('’');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              ’<wbr />
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/**
 * La phrase complétée par la réponse : la réponse reste avec le mot qui lui est collé avant ou après (« l'» + « air »),
 * à l'affichage seulement (`gluedEnds`).
 */
function FilledText({ before, answer, after, lang = 'fr' }: { before: string; answer: string; after: string; lang?: Lang }) {
  const { head, tail, lead, rest } = gluedEnds(before, after);
  return (
    <>
      {head && <RichText text={head} lang={lang} />}
      <span className="mot-lie">
        {tail && <RichText text={tail} lang={lang} />}
        <strong className="world-filled">{answer}</strong>
        {lead && <RichText text={lead} lang={lang} />}
      </span>
      {rest && <RichText text={rest} lang={lang} />}
    </>
  );
}

/**
 * La phrase d'un lieu (Deux rives : « Compare 3/5 et 3/10. ») : le texte enrichi, sans que le point passe seul à la ligne
 * après une fraction en colonne. Propre au monde ouvert : RichText, commun aux deux univers, ne change pas.
 */
export function PlaceText({ text }: { text: string }) {
  return (
    <>
      {text.split(FRACTION_STUCK).map((part, i) =>
        i % 2 ? (
          <span key={i} className="world-nobreak">
            {/* Le point final contre le trou, sans l'espace de la source (« une …. ») : avec elle, au grand texte, un blanc
                entier les séparait (référent dys et consultant UX UI, relecture des restes du 5e). */}
            <RichText text={part.replace(/…[ \u00a0\u202f]+(?=[.,]$)/u, '…')} />
          </span>
        ) : (
          part && <RichText key={i} text={part} />
        ),
      )}
    </>
  );
}

/**
 * Les Filets, les Écluses, les Quais, les Marais salants : la phrase du lieu (et la ligne de calcul de référence aux
 * Quais), ou la question et son document (Mesures et figures), la figure de l'item quand la scène ne la remplace pas (la
 * grille, le schéma coté, la figure exacte restent dans le panneau, GD-20, point 8), la règle de l'item, l'indice sur
 * demande, une réponse par objet du lieu. La correction est celle de l'écran classique (CalculationScreen).
 */
/**
 * L'écran d'un item selon son geste (GD-26) : ranger ou placer (SortScreen), régler (DialScreen), toucher (une réponse
 * par objet du lieu).
 */
function GestureScreen(props: ScreenProps) {
  const gesture = itemGesture(props.items[0]);
  if (gesture === 'ranger' || gesture === 'placer') return <SortScreen {...props} />;
  if (gesture === 'régler') return <DialScreen {...props} />;
  return <PlaceChoiceScreen {...props} />;
}

function PlaceChoiceScreen({ items, answered, onAnswer, ruledOut, onHelp, lang = 'fr' }: ScreenProps) {
  const { layout, show, simple } = useQuestion();
  useStopOnLeave();
  const { settings, speak } = useSettings();
  const item = items[0];
  const scene = placeSceneOf(item);
  const prompt = String(item?.prompt ?? '');
  const spoken = String(item?.spoken ?? prompt);
  const choices = Array.isArray(item?.choices) ? item.choices.map(String) : [];
  const answer = String(item?.answer ?? '');
  const hint = String(item?.hint ?? '');
  const referenceLine = typeof item?.referenceLine === 'string' ? item.referenceLine : '';
  const question = typeof item?.question === 'string' ? item.question : '';
  // Au rivage nord (lot L7) : le mot à compléter sous la phrase, ce que dit la voix, ce qu'écrit chaque réponse.
  const gapWord = typeof item?.gapWord === 'string' ? item.gapWord : '';
  const listen = item?.listen === 'mot' || item?.listen === 'reecouter' ? item.listen : null;
  const labels = Array.isArray(item?.choiceLabels) && item.choiceLabels.length === choices.length ? item.choiceLabels.map(String) : choices;
  const speakOnOpen = item?.speakOnOpen === true;
  // Une langue vivante (le large, lot L9) : la phrase, le document et la voix dans la langue de l'exercice, sans syllabes
  // en couleurs ; chaque réponse dans sa langue (`choicesLang`, comme l'écran habituel). L'indice reste en français.
  const promptLang: Lang = lang;
  const choicesLang: Lang = item?.choicesLang === 'fr' ? 'fr' : lang;
  // Ears (`listenOnly`) et Story time (`listenFirst`), relecture du contenu de L9 : le mot ou l'histoire s'écrivent après
  // la réponse, ou dès l'ouverture sans synthèse vocale (on ne demande jamais d'écouter ce qu'on ne peut pas entendre).
  const listenOnly = item?.listenOnly === true;
  const listenFirst = item?.listenFirst === true;
  const written = Boolean(answered) || !isSpeechAvailable();
  // Aux Écluses, la scène dessine la figure (le sas, l'échelle) et les barres de Deux rives (les deux sas) ; aux Marais
  // salants, la droite graduée (la jauge du bassin) : elles reviennent dans « Vue simple », qui couvre la scène.
  const drawn = scene !== null && sceneDrawsFigure(scene);
  const figure = scene && (simple || (scene.kind !== 'sas' && scene.kind !== 'echelle' && scene.kind !== 'jauge')) ? figureOf(item) : null;
  const aid = scene?.kind === 'lockPair' && !simple ? null : aidOf(item);
  // Dans la bulle (GD-26), la question seule en tête ; son document, la figure et la règle dans le carnet, à gauche de la
  // scène, toujours ouvert pendant l'action.
  const inBubble = !simple && scene !== null;
  const docInCarnet = Boolean(question) && inBubble;
  // Story time en « Vue simple » : la question en tête, les réponses, puis l'histoire à écouter (elle ne s'écrit qu'après
  // la réponse), dans cet ordre.
  const listenAside = simple && listenFirst && Boolean(question);
  // L'Abattage syllabique au Phare : le mot est l'objet appris, écrit sans syllabes en couleurs (elles donneraient la
  // réponse) ; les trois cloches portent les nombres de l'item.
  const word = scene?.kind === 'cloches';
  const chosen = answered?.detail?.chosen;
  const [hintShown, setHintShown] = useState(false);
  const rightIndex = choices.indexOf(answer);
  // Les réponses tentées et fausses (barrées) : leur objet le montre aussi dans la scène (une caisse penchée).
  const tried = choices.flatMap((c, i) => (c !== answer && (ruledOut?.includes(c) || (answered && chosen === c)) ? [i] : []));
  const triedKey = tried.join(',');
  const itemKeyOf = String(item?.key ?? '');
  // Le décor neutre (lot L6a) : l'objet témoin ne réagit qu'après une bonne réponse (jamais à une correction) ; la scène ne
  // l'apprend qu'alors.
  const right = Boolean(answered?.results.length) && Boolean(answered?.results.every((r) => r.correct));
  // De même pour l'objet de la bonne réponse marqué en R (lot L9 : la bouée reçoit son voyant, la malle se ferme).
  const shownAnswered = scene?.kind === 'column' || scene?.kind === 'restMark' ? right : Boolean(answered);
  useEffect(() => {
    if (!scene) return;
    const picked = triedKey ? triedKey.split(',').map(Number) : [];
    show({
      key: itemKeyOf,
      scene,
      answered: shownAnswered,
      right: answered && rightIndex >= 0 ? [rightIndex] : [],
      picked,
      count: choices.length,
      aid: (Boolean(aid) && !drawn) || docInCarnet || (Boolean(figure) && inBubble),
    });
  }, [show, itemKeyOf, scene, answered, shownAnswered, rightIndex, choices.length, aid, triedKey, drawn, docInCarnet, figure, inBubble]);
  // Les dictées (le Coffre à mots, l'Oreille du mineur) : le mot ou sa phrase dits à l'ouverture de l'item, comme sur
  // leur écran de référence, si la lecture automatique est choisie.
  // Une lecture par item : la voix, la phrase et le réglage du moment, lus sans relancer la lecture quand ils changent.
  const readOnOpen = useEffectEvent(() => {
    if (speakOnOpen && settings.autoRead) speak(spoken, undefined, lang);
  });
  useEffect(() => readOnOpen(), [itemKeyOf, speakOnOpen]);
  if (!item || !scene) return null;
  // Après « Bravo », le mot juste entre dans le trou : la phrase se lit entière (ou le mot sous elle, `gapWord`).
  const gap = question || gapWord ? null : filledGap(prompt, answer, answered?.results);
  const wordGap = gapWord ? filledGap(gapWord, answer, answered?.results) : null;
  const filled = gap !== null && rightIndex >= 0;
  const whole = gap ? `${gap.before}${answer}${gap.after}` : prompt;

  // Les réponses : posées sur la rangée, sous la scène (GD-26) ; en « Vue simple », après la question (Story time : avant
  // l'histoire à écouter).
  // Deux rives : ses trois réponses sur une seule rangée, la plus longue (« Elles sont égales ») passant à la ligne dans
  // son étiquette plutôt que sous les deux fractions (GD-20, point 8, lot L3, au plus grand texte sur téléphone).
  const answersBlock = (
    <div className={`world-answers${scene?.kind === 'lockPair' ? ' une-rangee' : ''}`} role="group" aria-label="Réponses possibles">
      {choices.map((choice, i) => {
        const slot = layout.slots[i] ?? layout.slots[0];
        // En « Vue simple », ou quand elles restent dans la colonne, les réponses sont une liste qui passe à la ligne :
        // rien n'est posé sur la scène.
        const styles = simple || !slot ? { hit: undefined, label: undefined } : slotStyles(slot);
        const isAnswer = answered && choice === answer;
        // Au deuxième essai, la réponse déjà tentée reste barrée.
        const isWrong = Boolean(answered && chosen === choice && choice !== answer) || Boolean(ruledOut?.includes(choice));
        return (
          <button
            key={choice}
            type="button"
            style={styles.hit}
            className={`choice world-answer${isAnswer ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
            data-choisie={answered && chosen === choice ? '' : undefined}
            disabled={Boolean(answered) || Boolean(ruledOut?.includes(choice))}
            onClick={() => onAnswer({ results: [{ key: item.key, correct: choice === answer }], detail: { chosen: choice } })}
          >
            <span className="world-answer-label" style={styles.label} lang={langAttr(choicesLang)}>
              <RichText text={labels[i]} lang={choicesLang} />
            </span>
          </button>
        );
      })}
    </div>
  );


  return (
    <div className="question world-place">
      <div className={`world-question-prompt${filled ? ' filled' : ''}`}>
        {question && (listenAside || docInCarnet) ? (
          // En C, la question seule en tête (épinglée en haut du panneau quand il défile) ; son document après les
          // réponses.
          <div className="question-head">
            <p className="question-prompt notice-question">
              <Syllabified text={frenchTypography(question)} />
            </p>
            <SpeakButton text={frenchTypography(question)} label="Question" compact />
          </div>
        ) : question ? (
          <NoticeQuestion question={question} prompt={prompt} spoken={spoken} image="" lang="fr" />
        ) : listenOnly ? (
          // Ears : pas de phrase (la consigne la dit) ; le bouton de la voix, son nom écrit ; le mot écrit après la réponse.
          <div className="question-head world-listen">
            <SpeakButton text={spoken} lang={lang} label={settings.autoRead ? 'Réécouter' : 'Écouter le mot'} />
            {written && (
              <p className="question-prompt item-word" lang={langAttr(lang)}>
                <RichText text={spoken} lang={lang} />
              </p>
            )}
          </div>
        ) : (
          <div className="question-head">
            <p className={`question-prompt${word ? ' item-word' : ''}`} lang={langAttr(promptLang)}>
              {filled ? (
                <FilledText before={gap?.before ?? ''} answer={answer} after={gap?.after ?? ''} lang={promptLang} />
              ) : promptLang === 'fr' ? (
                <PlaceText text={prompt} />
              ) : (
                <RichText text={prompt} lang={promptLang} />
              )}
            </p>
            <SpeakButton
              text={filled ? whole : spoken}
              lang={lang}
              label={word || listen === 'mot' ? 'Écouter le mot' : listen === 'reecouter' ? (settings.autoRead ? 'Réécouter' : 'Écouter') : 'Lire la phrase'}
              shown={whole}
              compact
            />
          </div>
        )}
        {gapWord && (
          <p className={`question-prompt gap-word world-gap-word${wordGap ? ' filled' : ''}`}>
            {wordGap ? (
              <>
                {wordGap.before}
                <strong className="world-filled">{answer}</strong>
                {wordGap.after}
              </>
            ) : (
              <RichText text={gapWord} />
            )}
          </p>
        )}
        {referenceLine && !layout.low && (
          <p className="world-question-reference">
            <RichText text={referenceLine} />
          </p>
        )}
        {listenAside && answersBlock}
        {listenAside && written && <PlaceDocument text={prompt} spoken={spoken} lang={lang} label="Écouter" />}
        {listenAside && !written && (
          // Story time avant la réponse : l'histoire s'écoute, elle ne s'écrit pas encore (StoryScreen).
          <div className="notice world-document recit">
            <p className="recit-listen">
              <Icon name="speaker" /> {lang === 'en' ? 'Écoute l’histoire en anglais.' : 'Écoute l’histoire.'}
            </p>
            <SpeakButton text={spoken} label="Écouter" lang={lang} />
          </div>
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
        {/* La figure après la phrase et l'indice : la prochaine action reste dans le panneau sans défiler (tablette). */}
        {inBubble && layout.aid && (docInCarnet || figure || aid) ? (
          <PlaceCarnet box={layout.aid}>
            {docInCarnet && (!listenFirst || written) && <PlaceDocument text={prompt} spoken={spoken} lang={lang} label={listenFirst ? 'Écouter' : undefined} />}
            {docInCarnet && listenFirst && !written && (
              // Story time avant la réponse : l'histoire s'écoute, elle ne s'écrit pas encore (StoryScreen).
              <div className="notice world-document recit">
                <p className="recit-listen">
                  <Icon name="speaker" /> {lang === 'en' ? 'Écoute l’histoire en anglais.' : 'Écoute l’histoire.'}
                </p>
                <SpeakButton text={spoken} label="Écouter" lang={lang} />
              </div>
            )}
            {figure && (
              <div className="calcul-figure world-question-figure">
                <Aid aid={figure} />
              </div>
            )}
            {aid && <Aid aid={aid} lang={lang} />}
          </PlaceCarnet>
        ) : (
          <>
            {figure && (
              <div className="calcul-figure world-question-figure">
                <Aid aid={figure} />
              </div>
            )}
            {aid && <PlaceAid aid={aid} layout={layout} simple={simple} lang={lang} />}
          </>
        )}
      </div>
      {!listenAside && answersBlock}
    </div>
  );
}

