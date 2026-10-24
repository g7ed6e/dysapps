// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (le nom de
// son lieu), une flèche au bord de l'écran quand elle est hors champ, la distance en points dessous ; « Y aller »,
// toujours à la même place, y mène d'un coup (piste 1 : le trajet est toujours sauté ; on marche en touchant le monde).
// À l'arrivée, le panneau du lieu s'ouvre : toutes les missions de son île (GD-20, point 8, ./PlacePanel.tsx) ; une
// mission choisie se joue dans le lieu (./WorldQuestion.tsx), avec le lanceur d'exercice commun, dans la scénette du lieu
// (« Vue simple » y montre la même question en liste), ou sur l'écran habituel tant que sa scénette n'est pas faite ;
// puis le bilan, la pose de la partie gagnée, et la liste rouverte, le focus sur la ligne jouée. Les pièces
// durables des lieux se tirent des étoiles gardées : rien de neuf dans la sauvegarde. La Carte des lieux ouverts (piste 1,
// lot 3) s'ouvre du bouton « Carte », comme ailleurs dans le jeu : l'île vue de haut, un lieu ouvert touché y dépose
// Kéo. Les terres (GD-20, point 3, « vraies terres, vrais ponts ») : quatre bras de mer coupent l'île en cinq terres ; au
// départ, la Pointe du Phare est ouverte ; une terre fermée est derrière son pont tombé, sous la brume ; toucher l'un de
// ses lieux, son pont, ou son cadenas sur la Carte, ouvre sa fiche (./ClosedLandSheet.tsx), où « Relier » paie la terre
// entière : la caméra immobile, le pont se pose (ses piles, son tablier, ses garde-corps et ses lanternes), un toc de bois,
// la brume de la terre se lève, puis « Le pont est rebâti. ». À l'ouverture, et quand les
// liaisons changent, une terre ouverte reçoit toutes ses liaisons de la grille, sans rien débiter (`ensureLands`) ; les
// terres sont lues dans la grille par ./landLinks.ts. Chargé à la demande.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon, type AnyIconName } from '../../../components/Icon';
import { islandStateIcon } from '../../world/islandState';
import { WorldButton } from '../../WorldButton';
import { Loading } from '../../../components/Loading';
import { frenchTypography } from '../../../components/math/RichText';
import { useProgress } from '../../../core/ProgressContext';
import { useSettings } from '../../../core/SettingsContext';
import { useMoinsDAnimations } from '../../../core/motion';
import { isSpeechAvailable } from '../../../core/speech';
import { useTextes } from '../../../universes';
import { useBlocland } from '../../BloclandContext';
import { paruresPoseBlock } from '../../useParuresBuilder';
import { vehiclePoseBlock } from '../../useVehicleBuilder';
import { getIle, type BiomeId, type IleId } from '../../biomes';
import { cheminDeRevision, revisionsDeLIle, usePlusTard } from '../../reminders';
import { todayISO } from '../../engine';
import { exercisesOf, questProgress } from '../../exercises';
import { mesuresDemandees, meterShown } from '../../rendering';
import { playArrival, playBurner, playDetourWind, playReactor, playSail, playWhaleBlow, playWoodTap } from '../../sound';
import { detourById, type DetourId } from '../../world/continu/detours';
import { SettingsButton, WorldShortcuts } from '../../WorldShortcuts';
import { getArchipelago, payableBlocks, type ArchipelagoId } from '../../world/archipelago';
import { firstBefore, isBridgeSpot, isLinkedLand, landById, landOf, landOfBridgeSpot, landPrice, landsAfter, type BridgeSpot, type LinkedLand } from '../../world/continu/lands';
import type { PartShape } from '../../world/continu/construction';
import { LOOK_UP } from '../../world/continu/camera';
import { bornesDuMondeOuvert, firstToPlayAt, keepClear, keoZone, missionsOfPlace, nextMission, overlaps, playsInPlace, type MarkOnScreen, type Obstacle, type ScreenRect } from '../../world/continu/mission';
import { hasScenette, placeById, placeRecord, planFor, type OpenWorldLevel, type PlaceId } from '../../world/continu/levelPlan';
import { scenetteOf } from '../../world/continu/scenette';
import type { PortSpot } from '../../world/continu/plan6e';
import { traceDone } from '../../world/continu/questions';
import { REVISION_PHRASES } from '../../world/continu/remise';
import { hasWorldHabitant } from '../../world/continu/worldHabitants';
import { bornesDesLieuxSeuls, modeleDuMonde } from '../../world/model';
import { gameAsShown } from '../../world/stories';
import { SpeakButton } from '../../../components/SpeakButton';
import { ClosedLandSheet, afterLabel, closedLandLabel, linkActionLabel, linkableLabel } from './ClosedLandSheet';
import { constructionState, fanalRestored, placeConstruction, posedShapes, restoredLine } from './constructionParts';
import { posedAmenagements } from './amenagements';
import { arrivalPlace, gridLand, gridLands, openWorldLands, playedIslands } from './landLinks';
import { MapLabels } from './MapLabels';
import { PlacePanel, earnPlacesOf, placeFromParam, placeResume } from './PlacePanel';
import { PARAM_ILE } from '../../world/openWorldReturn';
import { PLACES_BUTTON_LABEL, PLACES_SHEET_ID, PlacesSheet, placesRows, usePlacesList } from './PlacesSheet';
import { PortPanels, portFromParam, portResume, type PortPanel } from './PortPanels';
import { NEF_LEAVES, NEF_TITLE, NefParuresSheet, NefSheet, nefAtRest, nefLookOf, nefReady, nefReadyLabel, nefSail, nefStageOf } from './NefSheet';
import { paruresFeux, paruresLook } from '../../world/nefParures';
import { EarnPlaces } from '../../PlanSection';
import type { VehicleStage } from '../../world/vehicle';
import { portState } from './portState';
import { createOpenWorld, type BridgeLayEvents, type LockOnScreen, type MapSpotOnScreen, type OpenWorld } from './scene';
import { usePlaceAddress, usePoseGuard } from './usePlaceReturn';
import { WorldQuestion } from './WorldQuestion';
import { measureTour, type TourDeMesure } from './measureTour';
import { WorldRevision } from './WorldRevision';
import { revisionPlanOf, type RevisionPlan } from './revisionOf';
import { CommandsSheet, HabitantLine } from './HabitantLine';
import { HabitantSigns, placeSigns } from './HabitantSigns';
import { Remise } from './Remise';
import { commandLines, entraideLineOf, entraideListLine, entraideRemiseOf, entraideSuggestion, habitantLineOf, habitantSigns, hasOpenWorldErrands, readyCommande, remiseOf, suggestedAction, type HabitantGo, type RemiseRequest, type SuggestedAction } from './remiseOf';
import { LevelPicker } from './LevelPicker';
import './openWorld.css';

declare global {
  interface Window {
    /** Le monde ouvert, pour les captures et les mesures (en développement, ou avec `?mesures`). */
    __dysappsMondeOuvert?: Pick<OpenWorld, 'goTo' | 'goToPort' | 'assemble' | 'skip' | 'info' | 'portAt' | 'remiseView' | 'standAt' | 'turn' | 'ride' | 'view' | 'playFinal'> & {
      /** La dernière partie d'un lieu, posée de nouveau sous les yeux (la pose, puis la lueur de la Montée : les captures). */
      poseAgain(place: PlaceId): boolean;
      /** Le tour de la mesure automatique dans ce niveau (`?mesures=auto`, ./measureTour.ts). */
      tour: TourDeMesure;
    };
  }
}

/**
 * Les lieux dont la voix a déjà dit le nom depuis le lancement de l'application : à pied, elle le dit à la première
 * arrivée seulement (choix du mainteneur, 17 octobre 2026, « une fois par partie » ; rien en sauvegarde). Depuis la liste
 * des lieux ou la marque, elle le dit déjà au toucher : le lieu compte alors comme nommé. Sans lecture automatique, rien
 * n'est compté.
 */
const named = new Set<PlaceId | 'port'>();

/** Le mot du geste chez l'habitant : « Livrer », « Donner », « Apporter » (ceux de l'univers). */
const gestureWord = (kind: SuggestedAction['kind'] | undefined, textes: ReturnType<typeof useTextes>): string =>
  kind === 'donner' ? (textes.quetes?.donner ?? 'Donner') : kind === 'apporter' ? (textes.quetes?.apporter ?? 'Apporter') : (textes.commandes?.livrer ?? 'Livrer');

/**
 * Ce que la page d'un niveau reçoit d'un voyage entre niveaux (piste A, choix du mainteneur du 23 octobre 2026) : la
 * première arrivée par la Nef (`arrivee`), ou un retour par le fondu (`fondu`).
 */
type VoyageState = { voyage: 'arrivee' | 'fondu' };

/** Le fondu du voyage entre niveaux : une demi-seconde en tout (index.md, « Le passage »). */
const LEVEL_FADE_MS = 500;

/** Le voile du fondu se lève au plus tard après ce délai, même si le monde du niveau n'est pas encore prêt. */
const FADE_SAFETY_MS = 4000;

/** Le son du départ attend la fin de la voix, au plus ce délai. */
const SOUND_AFTER_VOICE_MS = 2500;

/** Le titre d'une mission d'une île, pour la dire. */
const missionTitle = (island: string, mission: string) => getIle(island)?.exercises.find((x) => x.id === mission)?.title ?? '';

/**
 * Le monde ouvert d'un niveau (`level`, choisi par la fabrique de disposition) : la page lit son plan (GD-22) et le
 * passe à la scène.
 */
export default function OpenWorldPage({ level }: { level: OpenWorldLevel }) {
  const plan = planFor(level);
  // Le 6e seul a les Détours, les commandes et l'entraide des habitants, et les scénettes de tous ses lieux (GD-22, lot
  // 2) ; chaque niveau a son lieu de départ et sa Nef (GD-22, lot 4 : la Lisière et le dirigeable).
  const sixth = level === '6e';
  // Les habitants du niveau font signe dans le monde (leurs pastilles, leur ligne dans le panneau du lieu) : au 6e, au-
  // dessus de leur place dans la scénette ; au 5e, près de leur lieu, hors de la scénette (choix du mainteneur du 21
  // octobre 2026, « Garder au 5e » ; ../../world/continu/worldHabitants.ts). Leurs commandes et leur entraide seulement
  // là où elles se livrent dans le monde ouvert (`hasOpenWorldErrands` : au 6e) ; ailleurs, leurs révisions dues.
  const habitantsShown = sixth || plan.places.some((p) => hasWorldHabitant(p.id));
  const errands = useMemo(() => hasOpenWorldErrands(plan), [plan]);
  const { biomeId } = useParams();
  const { state, linkLand, ensureOpenWorldLands, deliver, tapStory, findDetour, lightDetour, launch, moveTo, batisseur } = useBlocland();
  const textes = useTextes();
  // Les noms du lieu de départ du niveau : l'Escale au 6e, la Lisière au 5e ; ses bâtiments gardent leur nom.
  const departNames = useMemo(() => (textes.depart ? { ...textes.depart, nom: textes.depart.noms?.[level as '5e'] ?? textes.depart.nom } : undefined), [textes.depart, level]);
  const { settings, speak } = useSettings();
  // La voix de l'arrivée, lue par la scène faite une fois (`onArrive`) : le réglage du moment.
  // Rend vrai si la voix l'a dit : lecture automatique coupée, le lieu reste à nommer.
  const arrivalVoice = useRef<(name: string) => boolean>(() => false);
  useEffect(() => {
    arrivalVoice.current = (name) => {
      if (settings.autoRead) speak(frenchTypography(name));
      return settings.autoRead;
    };
  }, [settings.autoRead, speak]);
  const reduceMotion = useMoinsDAnimations();

  // Les missions des quatre lieux et leur état : le modèle du monde, commun aux deux univers. `modeleDuMonde` lit la
  // LV2 par `lv2Courante()`, pas par un argument : `settings.lv2` refait le modèle quand l'élève la change.
  const vu = useMemo(() => gameAsShown(state, textes), [state, textes]);
  // `settings.lv2` n'est pas lu dans le calcul, il le refait (voir plus haut) : la règle le croit inutile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(vu, level, textes.archipels, textes.libelles), [vu, level, textes, settings.lv2]);
  // Les bornes du monde ouvert : une mission réussie ici garde ses étoiles même si son île n'est pas encore reliée par
  // les ponts de la grille (sinon « Nouveau » au retour, la mission reproposée, la brume restée, jusqu'au rechargement).
  // Avec celles des lieux du monde ouvert seulement (GD-24), que la grille n'a pas.
  const bornes = useMemo(
    () => [...bornesDuMondeOuvert(modele.bornes, (ile, m) => questProgress(ile, m, vu.progress)?.stars ?? null), ...bornesDesLieuxSeuls(vu, level)],
    [modele, vu, level],
  );
  // Les terres (GD-20, point 3, « vraies terres ») : les terres fermées (aucun de leurs lieux relié dans la grille ni
  // joué), celles pas encore reliables, et le pont suggéré par la prochaine destination.
  const lands = useMemo(() => openWorldLands(plan, state.world.links, bornes, modele.destination.ouvrage, modele.destination.island), [plan, state.world.links, bornes, modele.destination.ouvrage, modele.destination.island]);
  /** La terre fermée d'un lieu, ou rien. */
  const closedLandOf = useCallback((id: PlaceId): LinkedLand | null => {
    const land = landOf(id);
    return isLinkedLand(land) && lands.closed.includes(land) ? land : null;
  }, [lands]);
  const isClosed = useCallback((id: PlaceId): boolean => closedLandOf(id) !== null, [closedLandOf]);
  // La terre à relier d'abord d'une terre pas encore reliable (le Couchant pour le Large, le Levant pour les Crêtes ; au
  // 5e, les Roselières, puis les Contreforts, pour les Aiguilles).
  const afterOf = (land: LinkedLand): LinkedLand | null => (lands.waiting.includes(land) ? firstBefore(land, lands.closed) : null);
  // Le cadenas d'une terre pas encore reliable, sur la Carte, dit la phrase d'ordre.
  const orderLabel = (land: LinkedLand): string | null => {
    const after = afterOf(land);
    return after ? afterLabel(land, after) : null;
  };
  // À l'ouverture du monde, et chaque fois que les liaisons de la grille changent en cours de session (un lieu relié par
  // la grille, une mission jouée : relecture de l'expert frontend) : une terre ouverte reçoit toutes ses liaisons, sans
  // rien débiter (sans rien à écrire, rien ne change : la même référence, aucune boucle).
  useEffect(() => {
    ensureOpenWorldLands(gridLands(plan), playedIslands(plan, bornes));
  }, [plan, state.world.links, bornes, ensureOpenWorldLands]);
  // La construction de chaque lieu (GD-20, lot 1) : les parties de la grille, mêmes identifiants, même sauvegarde.
  // `partiesDe` lit l'option latin ou grec par `lcaCourante()` : `settings.lca` refait les constructions quand l'élève
  // la change (le lieu du latin et du grec compte les missions de l'option, GD-14) ; la règle le croit inutile.
  const constructions = useMemo(() => {
    const of = (id: PlaceId) => {
      const biome = getIle(placeById(id).island);
      return biome ? placeConstruction(biome.id, state.world.parts) : { shapes: [], posed: [], built: [] };
    };
    return placeRecord(plan, of);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, state.world.parts, settings.lca]);
  // La Nef du lieu de départ (GD-21 ; GD-22, lot 4) : son dernier temps (la voile au 6e, le gouvernail au 5e) vient avec
  // autant de lieux achevés que la grille demande de Gardiens (le monde continu n'en a pas) ; son temps, montré sur le ber.
  const nefStage = nefStageOf(level);
  const achieved = useMemo(() => Object.values(constructions).filter((c) => constructionState(c) === 'restauree').length, [constructions]);
  const sail = useMemo(() => nefSail(state, achieved, nefStage), [state, achieved, nefStage]);
  // Au 3e (`nefAtRest`), la Nef est au repos, entière : ni temps à construire, ni départ ; sa fiche pose ses trois
  // parures (GD-25), les feux arrivant avec deux lieux restaurés.
  const nefResting = nefAtRest(level);
  // Les pièces du Rafiot rendues au Fanal du 3e (la fin des Ferrailleurs, jouée au Fanal restauré) : au 4e, le pont du
  // Rafiot est vide (consultant d'Archipéo, relecture de la PR du 3e). La scène le lit à sa création.
  const piecesReturnedNow = useMemo(() => level === '4e' && fanalRestored(state.world.parts), [level, state.world.parts]);
  const piecesReturned = useRef(piecesReturnedNow);
  useEffect(() => {
    piecesReturned.current = piecesReturnedNow;
  }, [piecesReturnedNow]);
  const nefLookNow = useMemo(() => (nefResting ? 3 : nefLookOf(state, sail.kit, nefStage)), [nefResting, state, sail.kit, nefStage]);
  const feux = useMemo(() => paruresFeux(state.progress, achieved), [state.progress, achieved]);
  const paruresNow = useMemo(() => (nefResting ? paruresLook(state.world.parts, state.progress, achieved) : 0), [nefResting, state.world.parts, state.progress, achieved]);
  // La Nef prête (GD-21, « Prête ») : le passage prêt passe en tête de la suggestion, avant toute commande et toute
  // mission, aux deux niveaux ; la marque se pose sur elle, « Y aller » mène au quai et ouvre sa fiche. Partie (le
  // voyage fait), elle n'est plus prête.
  const nefFirst = useMemo(() => !nefResting && nefReady(state, nefStage, sail.kit), [nefResting, state, nefStage, sail.kit]);
  // La pastille de la Nef (GD-25, choix du mainteneur du 23 octobre 2026) : le bloc que « Poser » poserait sur sa fiche
  // (une parure au 3e, le temps en cours ailleurs), ou rien ; jamais quand la marque de la suggestion est sur elle.
  const nefSign = useMemo(() => (nefFirst ? null : nefResting ? paruresPoseBlock(state) : vehiclePoseBlock(state, nefStage.biome)), [nefFirst, nefResting, state, nefStage.biome]);
  // Le lieu où se tient Kéo, arrivé (rien pendant la marche, ni à l'Escale) : la suggestion et les pastilles le lisent.
  const [here, setHere] = useState<PlaceId | null>(null);
  // La prochaine mission, jamais celle d'un lieu fermé : aucune ne s'y joue. Celle du lieu où se tient Kéo d'abord, tant
  // qu'il y en reste une à jouer (le rang 2 de la suggestion) : la bulle, la marque et le panneau la suivent.
  const nextFree = useMemo(() => nextMission(plan, bornes, modele.destination, (id) => !isClosed(id), here), [plan, bornes, modele.destination, isClosed, here]);
  // La commande prête dans la suggestion (GD-20, « Une seule prochaine action mise en avant ») : à son rang, après le lieu
  // où se tient Kéo tant qu'il y reste une mission jamais jouée, avant la prochaine mission d'un autre lieu. Quand elle la
  // porte, la bulle dit sa phrase, avec « Livrer » si Kéo est chez l'habitant, sinon « Y aller » ; la marque va à son
  // lieu ; sa pastille est la seule pleine ; aucune mission n'est mise en avant.
  const readyCmd = useMemo(() => (errands ? readyCommande(plan, state, (p) => !isClosed(p), modele.destination.commande, here) : null), [errands, plan, state, isClosed, modele.destination.commande, here]);
  const hereToPlay = Boolean(here && nextFree?.place.id === here && firstToPlayAt(nextFree.place, bornes));
  // L'étape d'entraide (lot L2), juste après la commande prête : un geste chez l'habitant (« Donner », « Apporter »),
  // porté comme une commande prête ; une mission à jouer chez lui, portée comme la prochaine mission, dans son lieu (la
  // première encore à jouer, sinon à reprendre, sinon la première), la bulle disant la phrase de l'étape.
  const stepSuggestion = useMemo(() => (errands ? entraideSuggestion(plan, vu, (p) => !isClosed(p)) : null), [errands, plan, vu, isClosed]);
  const suggestedAct = nefFirst ? null : suggestedAction(readyCmd, stepSuggestion, hereToPlay);
  const suggestedId = suggestedAct?.id ?? null;
  const suggestedCmd: SuggestedAction | null = suggestedAct && suggestedAct.kind !== 'mission' ? suggestedAct : null;
  const next = useMemo(() => {
    if (suggestedAct?.kind !== 'mission') return nextFree;
    const place = placeById(suggestedAct.place);
    const first = missionsOfPlace(place, bornes)[0];
    return nextMission(plan, bornes, undefined, (id) => id === place.id, place.id) ?? (first ? { place, mission: first.mission } : nextFree);
  }, [plan, suggestedAct?.kind, suggestedAct?.place, nextFree, bornes]);
  const nextPlace = suggestedCmd ? placeById(suggestedCmd.place) : (next?.place ?? null);
  // Les pastilles des habitants des lieux ouverts : leur commande prête (la suggérée seule pleine), sinon leurs révisions
  // dues sans « Plus tard » ; trois au plus ; jamais au lieu où se tient Kéo (la bulle et la ligne du panneau portent
  // déjà l'information, et la pastille ne recouvre jamais Kéo).
  const { remises } = usePlusTard();
  const revisionDue = useCallback(
    (p: PlaceId) => {
      const island = placeById(p).island as BiomeId;
      return !remises.has(island) && revisionsDeLIle(state.spaced, state.world.links, island, settings.lv2, todayISO(), true).length > 0;
    },
    [remises, state.spaced, state.world.links, settings.lv2],
  );
  const signs = useMemo(
    () =>
      !habitantsShown
        ? []
        : habitantSigns(plan, vu, {
            open: (p) => !isClosed(p) && p !== here,
            revisions: revisionDue,
            suggested: suggestedId ?? undefined,
            titre: textes.quetes?.titre,
          }),
    [habitantsShown, plan, vu, isClosed, here, revisionDue, suggestedId, textes.quetes?.titre],
  );
  // Kéo chez un habitant qui a des révisions dues (sa pastille s'éteint, Kéo est chez lui) : la bulle dit le rappel de la
  // ligne de l'habitant (référent dys et directeur artistique, relecture des habitants du 5e). Aux deux niveaux.
  const revisionHere = habitantsShown && here !== null && !isClosed(here) && revisionDue(here);
  // Plus rien à jouer, une terre fermée qu'on peut relier (le pont suggéré, sinon la première dans l'ordre) : la bulle dit
  // l'action (« Relier le Bastion »). Rien d'autre, jamais « rien à faire » (« Rien, ou l'action », choix du mainteneur du
  // 24 octobre 2026, aux quatre niveaux).
  const landToLink = lands.suggested ?? lands.closed.find((l) => !lands.waiting.includes(l)) ?? null;

  // Kéo part de l'endroit de l'Escale de l'adresse (le retour d'une mission de l'école, `?porte=maths`, ou d'une question
  // d'assemblage), sinon devant le lieu de l'adresse (`?lieu=quais`, GD-20, point 8 ; ou une île, `/adventure/<île>`),
  // sinon au quai de l'Escale, le lieu de départ (GD-20, lot 2).
  const [params] = useSearchParams();
  const location = useLocation();
  const [arrival] = useState(() => ({
    spot: portFromParam(params.get('porte')),
    assembled: Boolean((location.state as { assemble?: string } | null)?.assemble),
    // Le voyage entre niveaux (piste A) : la première arrivée par la Nef (`arrivee`, le carillon une fois), ou un retour
    // (`fondu` : le voile couvre la page dès qu'elle monte, et se lève quand le monde est prêt).
    voyage: (location.state as VoyageState | null)?.voyage ?? null,
  }));
  const lieuParam = placeFromParam(plan, params.get('lieu'), params.get(PARAM_ILE));
  const missionParam = params.get('mission');
  // Au 4e, l'île du port de la grille (le Gabarit) fait arriver à la Crique tant que le Bastion est fermé (`arrivalPlace`).
  const fromIsland = arrivalPlace(plan, biomeId, lands.closed);
  const [start] = useState<PlaceId | PortSpot>(() => arrival.spot ?? lieuParam ?? fromIsland ?? 'quai');
  // Le panneau ouvert de l'Escale : sa fiche, une porte, la galerie, le lieu d'assemblage, la Nef ; un à la fois.
  const [panel, setPanel] = useState<PortPanel | 'nef' | null>(null);
  // Kéo au quai de l'Escale, là où la Nef l'attend : la marque de la Nef prête s'y retire, comme celle d'un lieu.
  const [atQuai, setAtQuai] = useState(start === 'quai');
  // La Nef part (GD-21) : la scène seule, comme pendant une question, jusqu'à l'arrivée en 5e.
  const [departing, setDeparting] = useState(false);
  // Le fondu du voyage entre niveaux : il couvre la page qui part, puis celle qui arrive, jusqu'à ce que son monde soit prêt.
  const [fondu, setFondu] = useState(arrival.voyage === 'fondu' && !reduceMotion);
  const [finalPlaying, setFinalPlaying] = useState(false);
  // Le panneau ouvert d'un lieu (GD-20, point 8) : sa liste de missions, et la ligne qui y prend le focus (celle dont on
  // revient) ; pour un lieu d'une terre fermée, la fiche de sa terre ; jamais en même temps qu'un panneau de l'Escale.
  const [lieu, setLieu] = useState<{ place: PlaceId; focus: string | null } | null>(null);
  // La liste « Commandes » du monde ouvert (GD-20, point 4, lot L1), ouverte par l'accès direct : un panneau comme les autres.
  const [commandsOpen, setCommandsOpen] = useState(false);
  // La remise jouée (lots L1 et L2) : « Livrer », « Donner » ou « Apporter » touché chez l'habitant ; comme une
  // question, elle masque le reste.
  const [remise, setRemise] = useState<RemiseRequest | null>(null);
  const sheetOpen = Boolean(panel) || Boolean(lieu) || commandsOpen;
  const panelRef = useRef<HTMLDivElement>(null);
  const { progress, launchVoyage } = useProgress();
  const port = useMemo(() => portState(state, progress, level), [state, progress, level]);

  const host = useRef<HTMLDivElement>(null);
  const world = useRef<OpenWorld | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  // L'aiguille de la boussole (GD-20, rotation libre de la caméra) : tournée sans passer par React, à chaque image où la
  // caméra tourne ; le dernier angle est gardé pour l'aiguille recréée (retour de la Carte, d'un panneau, d'une partie).
  // `turned` : la caméra n'est pas vers le nord (sinon le bouton « Nord » n'a rien à faire).
  const needleRef = useRef<HTMLSpanElement | null>(null);
  const yawRef = useRef(0);
  const [turned, setTurned] = useState(false);
  const needle = useCallback((el: HTMLSpanElement | null) => {
    needleRef.current = el;
    if (el) el.style.transform = `rotate(${yawRef.current.toFixed(3)}rad)`;
  }, []);
  // Les cadenas des ponts des terres fermées, posés à chaque image par la scène (sans passer par React).
  const locksRef = useRef<HTMLDivElement>(null);
  // Les pastilles des habitants (GD-20, point 4, lot L1), posées à chaque image par la scène, comme les cadenas.
  const signsRef = useRef<HTMLDivElement>(null);
  // Le nombre de scènes faites : 0 avant la première ; refaite (« Réduire les animations » changé), elle reçoit de nouveau
  // la marque, la brume, la Carte et les lieux.
  const [ready, setReady] = useState(0);
  const [walking, setWalking] = useState(false);
  // La cabine de la Montée (GD-22, lot 3 ; arbitrage de la première relecture) : Kéo à l'arrêt à l'une de ses gares (le
  // bouton « Monter » ou « Descendre », à côté de « Y aller », qui reste le bouton principal), et où va la caisse pendant
  // qu'elle roule. À son arrivée, une phrase courte pour la voix et le lecteur d'écran, jamais écrite à l'écran
  // (`cabinSaid`, son numéro pour redire la même phrase).
  const [cabin, setCabin] = useState<{ side: 'bas' | 'haut' | null; riding: 'haut' | 'bas' | null }>({ side: null, riding: null });
  const [cabinSaid, setCabinSaid] = useState<{ text: string; n: number }>({ text: '', n: 0 });
  const cabinRiding = useRef<'haut' | 'bas' | null>(null);
  const onCabin = useCallback((c: { side: 'bas' | 'haut' | null; riding: 'haut' | 'bas' | null }) => {
    const was = cabinRiding.current;
    cabinRiding.current = c.riding;
    if (was && !c.riding) setCabinSaid((p) => ({ text: was === 'haut' ? 'Tu es en haut.' : 'Tu es en bas.', n: p.n + 1 }));
    setCabin(c);
  }, []);
  // La mission choisie dans le panneau d'un lieu : elle se joue dans sa scénette, ou sur l'écran habituel (`plain`, une
  // mission dont la scénette n'est pas encore faite).
  // `revision` : « Reprendre » chez l'habitant, la révision du lieu jouée dans sa scène (GD-20, point 4, lot L3).
  const [asking, setAsking] = useState<{ place: PlaceId; mission: string; plain: boolean; revision?: RevisionPlan } | null>(null);
  // La mission dont on revient : sa liste se rouvre après le bilan et la pose, le focus sur sa ligne.
  const [backTo, setBackTo] = useState<{ place: PlaceId; mission: string | null } | null>(null);
  // La Carte des lieux ouverts (lot 3) : un état de la page, pas une adresse (`/adventure/map` mène à la Carte du
  // monde en grille) ; ses lieux posés à chaque image par la scène, comme les cadenas.
  const [mapOpen, setMapOpen] = useState(false);
  // Ce que les rappels de la scène appellent sur la Carte : poser les étiquettes, choisir un lieu touché dans la 3D.
  const mapPlacer = useRef<((spots: readonly MapSpotOnScreen[], moving?: boolean) => void) | null>(null);
  // « Le pont est rebâti. », affichée un moment après le toc (et dite, si la voix est active), suivie de la phrase d'un
  // pont devenu reliable s'il y en a (« Le pont des Crêtes peut être rebâti. ») ; `n` : un autre pont ; `after` : dans
  // combien de millisecondes (jamais en même temps que le toc).
  // Le nom d'un Détour où Kéo s'est arrêté s'écrit de même, en haut (`top`), et part dès qu'il en repart (`detour`).
  // L'état d'un lieu qui s'anime à sa restauration (la Forge du 4e) s'écrit de même, avec l'icône de l'état (`icon`).
  const [said, setSaid] = useState<{ n: number; lines: readonly string[]; after: number; top?: boolean; detour?: DetourId; icon?: AnyIconName; voice?: string } | null>(null);
  // Les mots d'état de l'univers, lus par la scène faite une fois (« La Forge est restaurée. »).
  const stateWords = useRef(textes.etatsDIle);
  stateWords.current = textes.etatsDIle;
  // Le Détour où Kéo s'est arrêté (GD-20, déplacement libre, lot 2), ou aucun : au cairn éteint, « Rallumer ».
  const [detourHere, setDetourHere] = useState<DetourId | null>(null);
  // Ce que fait la page à l'arrivée sur un Détour, lu par la scène faite une fois : le réglage et l'état du moment.
  const detourArrive = useRef<(id: DetourId | null) => void>(() => undefined);
  const soundsOn = useRef(settings.sounds);
  // Où va le focus quand la fiche d'une terre se ferme (le nom d'un de ses lieux, qu'on vient de relier, sur la Carte),
  // sinon « Carte ».
  const focusAfter = useRef<string | null>(null);
  // Au plus grand texte, un lieu ouvert sans la place de son nom : la vue de départ de la Carte change (GD-20, « La Carte
  // au plus grand texte »).
  const reframeMap = useCallback((crowded: (spots: readonly MapSpotOnScreen[]) => number) => world.current?.reframeMap(crowded), []);
  const mapPick = useRef<(place: PlaceId | 'port' | BridgeSpot) => void>(() => {});
  const mapButton = useRef<HTMLButtonElement>(null);
  // La distance au prochain lieu, pour la voix (avis du référent dys) : relue à chaque image, mais l'état ne change
  // qu'avec le palier (un, deux ou trois points) : le libellé de la marque n'est refait que là.
  const [far, setFar] = useState<1 | 2 | 3>(1);
  const farRef = useRef(far);
  // Les célébrations (« Succès débloqué ») attendent la fin de la pose de la partie gagnée, pas seulement celle du bilan :
  // retenues dès qu'une question s'ouvre, rendues quand la pose est finie (ou quand rien ne se pose).
  const [posePending, setPosePending] = useState(false);
  // La scénette d'assemblage se joue (GD-20, lot 2) : les célébrations attendent qu'elle finisse, comme pendant une
  // pose ; un panneau ouvert les retient aussi (PortPanels).
  const [assembling, setAssembling] = useState(false);
  useHoldCelebrations(posePending || assembling || Boolean(remise) || finalPlaying);
  // La vue finale se termine aussi au clavier, comme au toucher : Échap, Entrée ou Espace (référent dys).
  useEffect(() => {
    if (!finalPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      world.current?.endFinal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finalPlaying]);

  // Les dimensions que la marque lit à chaque image, relues seulement quand la page, la marque ou un bouton change de
  // taille (jamais une mise en page forcée par image).
  const [layout] = useState(() => ({ width: 0, height: 0, markW: 0, markH: 0, obstacles: [] as Obstacle[], mark: { left: 0, top: 0, width: 0, height: 0, shown: false } }));
  // La dernière place demandée par la scène : la marque s'y repose quand sa taille change (hors champ, sa flèche et ses
  // points l'élargissent) sans attendre l'image suivante, qui ne vient pas si la scène est immobile (deuxième relecture
  // du lot 1 du 4e, consultant UX UI : « La Forg », coupée au bord droit).
  const lastMark = useRef<MarkOnScreen | null>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      // Le bord droit de « Carte » : sur un écran bas, « Y aller » se tient à sa droite, jamais dessus (openWorld.css).
      const carte = stage.querySelector<HTMLElement>('.open-world-map-button')?.getBoundingClientRect();
      const carteRight = carte ? `${Math.round(carte.right - s.left)}px` : '';
      if (stage.style.getPropertyValue('--open-world-carte') !== carteRight) stage.style.setProperty('--open-world-carte', carteRight);
      // Sur un écran étroit (un téléphone, au plus grand texte surtout), la rangée du bas, sur une ou deux lignes, déborde
      // au-dessus de « Carte » : elle se pose alors au-dessus de lui (seconde relecture du lot 3, consultant UX UI). Lu à
      // l'horizontale seulement (la rangée levée garde sa largeur : aucun aller-retour).
      placeGoRow(stage, s, carte);
      const carteTop = carte ? `${Math.round(s.bottom - carte.top)}px` : '';
      if (stage.style.getPropertyValue('--open-world-carte-dessus') !== carteTop) stage.style.setProperty('--open-world-carte-dessus', carteTop);
      layout.width = s.width;
      layout.height = s.height;
      const markW = markRef.current?.offsetWidth ?? 0;
      const markH = markRef.current?.offsetHeight ?? 0;
      const resized = markW !== layout.markW || markH !== layout.markH;
      layout.markW = markW;
      layout.markH = markH;
      // La colonne des accès directs d'abord : une zone réservée du bord gauche jusqu'à elle et un peu dessous, d'où la
      // marque ne sort que par le bas (consultant UX UI : 72 px depuis le bord, jusqu'à 184 + 16 px depuis le haut).
      const column = stage.querySelector<HTMLElement>('.world-shortcuts')?.getBoundingClientRect();
      const reserve: Obstacle[] = column ? [{ left: 0, top: 0, width: Math.max(COLUMN_ZONE.width, column.right - s.left + MARK_EDGE), height: column.bottom - s.top + COLUMN_ZONE.below, below: true }] : [];
      layout.obstacles = [
        ...reserve,
        ...[...stage.querySelectorAll<HTMLElement>('.world-settings, .open-world-camera, .open-world-go, .open-world-go-reason, .open-world-bar')].map((el) => {
          const r = el.getBoundingClientRect();
          // La rangée du bas (« Y aller », « Monter », « Passer le trajet ») : un écart double, la marque n'y colle jamais
          // (seconde relecture du lot 3, consultant UX UI : 16 px au moins, sur une ou deux lignes).
          const m = el.classList.contains('open-world-go') ? GO_CLEAR : 0;
          return { left: r.left - s.left - m, top: r.top - s.top - m, width: r.width + 2 * m, height: r.height + 2 * m };
        }),
        // La phrase du pont, le temps qu'elle est écrite : la marque n'est jamais dessous (référent dys,
        // consultant UX UI ; au plus grand texte, elle mordait la marque « Le Phare »).
        ...[...stage.querySelectorAll<HTMLElement>('.open-world-said[data-shown="oui"]')].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
        }),
      ];
      if (resized && lastMark.current) placeMark(markRef.current, arrowRef.current, lastMark.current, layout);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const el of stage.querySelectorAll('.open-world-mark, .world-settings, .open-world-camera, .open-world-go, .open-world-go-reason, .open-world-bar, .open-world-said')) observer.observe(el);
    measure();
    return () => observer.disconnect();
    // La marque et « Y aller » changent d'élément avec la suggestion et la marche : on les observe de nouveau, et la scène
    // prête (`ready`) ; la marque revient, un autre élément, au retour de la Carte
    // (`mapOpen`) ou quand Kéo quitte le lieu suggéré (`here`) : sans quoi sa largeur restait l'ancienne et la marque
    // passait sous le bord droit (deuxième relecture du lot 1 du 4e, consultant UX UI : « La Forg »).
  }, [layout, next, suggestedId, walking, asking, remise, sheetOpen, ready, mapOpen, here]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = createOpenWorld(el, {
      plan,
      start,
      piecesReturned: piecesReturned.current,
      reduceMotion,
      meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() },
      onDepart: () => {
        setWalking(true);
        setHere(null);
        setAtQuai(false);
        setPanel(null);
        setLieu(null);
        setCommandsOpen(false);
      },
      onPort: (spot) => {
        if (spot !== 'fiche') setAtQuai(spot === 'quai');
        setLieu(null);
        setPanel(spot === 'quai' ? 'fiche' : spot);
      },
      onAssembled: () => {
        setAssembling(false);
        setPanel('chantier');
      },
      // Kéo devant un lieu : son panneau s'ouvre, la liste de ses missions (GD-20, point 8).
      onArrive: (placeId) => {
        setWalking(false);
        setHere(placeId);
        if (placeId) setAtQuai(false);
        if (!placeId) return;
        if (!named.has(placeId) && arrivalVoice.current(placeById(placeId).name)) named.add(placeId);
        setPanel(null);
        setLieu({ place: placeId, focus: null });
      },
      onDetour: (id) => detourArrive.current(id),
      onCabin,
      onWhaleBlow: () => {
        if (soundsOn.current) playWhaleBlow();
      },
      onLocks: (locks) => placeLocks(locksRef.current, locks),
      onSigns: (signs) => placeSigns(signsRef.current, signs, layout),
      onYaw: (yaw) => {
        // Le nord à l'écran : l'aiguille tourne comme le monde.
        yawRef.current = yaw;
        if (needleRef.current) needleRef.current.style.transform = `rotate(${yaw.toFixed(3)}rad)`;
        setTurned(Math.abs(yaw) > 0.01);
      },
      // Un lieu d'une terre fermée, ou son pont tombé, touché dans le monde : la fiche de la terre (GD-20, point 3).
      onClosed: (land) => {
        setPanel(null);
        setLieu({ place: landById(land).places[0], focus: null });
      },
      onMapPlaces: (spots, moving) => mapPlacer.current?.(spots, moving),
      onMapPick: (placeId) => mapPick.current(placeId),
      onPosed: () => setPosePending(false),
      // Un lieu qui s'anime à sa restauration (la Forge du 4e) : son état, écrit avec son icône et dit, à la fin de
      // l'allumage ou au toucher qui le passe (tout de suite, avec « Réduire les animations ») ; puis la réplique de
      // l'habitant, s'il en a une (« Le feu de la montagne est revenu. »).
      // La vue finale du niveau (au 3e) : les boutons se cachent le temps qu'elle dure ; un toucher la termine.
      onFinalView: (on) => setFinalPlaying(on),
      onRestored: (placeId) => {
        const lines = [restoredLine(placeById(placeId), stateWords.current)];
        const end = hasScenette(placeId) ? scenetteOf(placeId).words?.end : undefined;
        if (end) lines.push(end);
        setSaid((was) => ({ n: (was?.n ?? 0) + 1, lines, after: 0, icon: islandStateIcon('restauree') }));
      },
      // La Nef, son ber ou le banc du large touché (GD-21) : sa fiche, Kéo reste où il est ; au repos (le 3e), la fiche
      // de ses parures (GD-25).
      onNef: () => {
        setLieu(null);
        setCommandsOpen(false);
        setPanel('nef');
      },
      onMark: (m) => {
        lastMark.current = m;
        placeMark(markRef.current, arrowRef.current, m, layout);
        if (m && m.far !== farRef.current) {
          farRef.current = m.far;
          setFar(m.far);
        }
      },
    });
    world.current = w;
    setReady((n) => n + 1);
    if (import.meta.env.DEV || mesuresDemandees())
      window.__dysappsMondeOuvert = {
        goTo: w.goTo,
        goToPort: w.goToPort,
        assemble: w.assemble,
        skip: w.skip,
        info: w.info,
        portAt: w.portAt,
        remiseView: w.remiseView,
        standAt: w.standAt,
        turn: w.turn,
        ride: w.ride,
        view: w.view,
        playFinal: w.playFinal,
        poseAgain: (place) => {
          const now = placesNow.current;
          const parts = now?.built[place] ?? [];
          return now !== null && parts.length > 0 && w.setPlaces(now, { place, parts: parts.slice(-1) });
        },
        tour: measureTour(plan),
      };
    return () => {
      w.dispose();
      world.current = null;
      // Une scène refaite pendant le départ de la Nef (l'écran tourné) ne le finit pas : la page reprend la main, la Nef
      // revient sur son ber, rien n'est parti (relecture de l'expert frontend).
      setDeparting(false);
      if (window.__dysappsMondeOuvert?.info === w.info) delete window.__dysappsMondeOuvert;
    };
    // La scène est faite une fois (et refaite si l'appareil change « Réduire les animations ») ; `start` ne change pas.
  }, [plan, start, reduceMotion, layout, onCabin]);

  // L'arrivée de la cabine, dite par la voix (avec la lecture automatique) ; le lecteur d'écran la lit dans sa zone.
  useEffect(() => {
    if (cabinSaid.text && settings.autoRead) speak(cabinSaid.text);
    // Seulement à une arrivée nouvelle, jamais quand le réglage change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabinSaid]);

  // Les Détours (GD-20, déplacement libre, lot 2) : arrivé, Kéo le trouve (sa sente reste tracée), le vent souffle un
  // instant et son nom s'écrit une fois, en haut, et se dit ; reparti, le nom reste écrit ses quatre secondes, pour
  // l'élève qui n'a pas fini de le lire (référent dys). Rien d'autre : ni compteur, ni récompense.
  useEffect(() => {
    soundsOn.current = settings.sounds;
    detourArrive.current = (id) => {
      setDetourHere(id);
      if (!id) return;
      findDetour(id);
      if (settings.sounds) playDetourWind();
      const d = detourById(id);
      // La Dalle (lot 3 du 4e) : Kéo dit sa phrase sous le nom. La voix marque une pause entre les deux, au premier
      // passage comme sur « Réécouter » (`voice` ; retouche 1 de l'Épaule, point 3). Au Replat (les Coteaux), la phrase
      // est seulement lue, jamais écrite (`saysAloudOnly`).
      setSaid((was) => ({ n: (was?.n ?? 0) + 1, lines: d.says && !d.saysAloudOnly ? [d.name, d.says] : [d.name], after: 0, top: true, detour: id, voice: d.says ? `${d.name}. ${d.says}` : undefined }));
    };
  }, [findDetour, settings.sounds]);
  useEffect(() => {
    world.current?.setDetours(state.world.detours ?? [], state.world.detoursLit ?? []);
  }, [state.world.detours, state.world.detoursLit, ready]);
  // Le cairn éteint où se tient Kéo, à rallumer, ou rien.
  const cairnToLight = detourHere !== null && detourById(detourHere).kind === 'cairn' && !(state.world.detoursLit ?? []).includes(detourHere) ? detourHere : null;
  const relightHere = cairnToLight !== null;

  useEffect(() => {
    world.current?.setMark(nefFirst ? 'nef' : (nextPlace?.id ?? null));
  }, [nefFirst, nextPlace, ready]);
  useEffect(() => {
    world.current?.setSigns(nefSign ? [...signs.map((s) => s.place), 'nef'] : signs.map((s) => s.place));
  }, [signs, nefSign, ready]);

  // L'Escale (GD-20, lot 2) : ses portes, ses trophées, l'état de la région, la pile, tirés de la sauvegarde.
  useEffect(() => {
    world.current?.setPort(port);
  }, [port, ready]);
  // L'adresse d'un lieu (`?lieu=quais&mission=make-ten`, « Ma dernière mission ») : Kéo y est déposé, sa liste s'ouvre, le
  // focus sur la mission de l'adresse si elle est du lieu ; à chaque navigation, même vers la même adresse.
  const jumpTo = useCallback((place: PlaceId) => {
    const w = world.current;
    if (!w) return false;
    w.goTo(place, true);
    return true;
  }, []);
  const openLieu = useCallback((place: PlaceId, focus: string | null) => setLieu({ place, focus }), []);
  usePlaceAddress({ place: lieuParam, mission: missionParam, navigation: location.key, ready, goTo: jumpTo, open: openLieu });
  // Au retour d'une mission de l'école, le panneau de sa porte se rouvre ; au retour d'une question d'assemblage
  // réussie, la scénette se joue d'abord (le bloc posé sur le râtelier), puis le panneau du lieu s'ouvre.
  const arrived = useRef(false);
  useEffect(() => {
    const w = world.current;
    if (!w || arrived.current || !arrival.spot) return;
    arrived.current = true;
    if (arrival.spot === 'chantier' && arrival.assembled) {
      setAssembling(true);
      w.assemble();
    } else setPanel(arrival.spot);
  }, [arrival, ready]);
  // Le panneau ouvert : la caméra garde ce qu'il concerne dans la part de l'écran qu'il laisse (au-dessus de lui sur
  // tablette, à sa droite sur un écran bas), relue quand il change de taille.
  useEffect(() => {
    const w = world.current;
    const stage = stageRef.current;
    const el = panelRef.current;
    if (!w || !stage) return;
    if (!sheetOpen || !el) {
      w.frame(null);
      return;
    }
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // En colonne à gauche (un écran bas) : la part à sa droite ; en bas : la part au-dessus.
      const column = r.top - s.top < 8 && r.width < s.width * 0.8;
      w.frame(column ? { left: r.right - s.left, top: 0, width: s.right - r.right, height: s.height } : { left: 0, top: 0, width: s.width, height: Math.max(1, r.top - s.top) }, panel === 'nef' ? 'nef' : lieu?.place);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [panel, lieu, commandsOpen, sheetOpen, ready]);
  // Un panneau fermé rend la main au bouton « Carte », comme la Carte (consultant UX UI).
  const hadPanel = useRef(false);
  useEffect(() => {
    if (sheetOpen) hadPanel.current = true;
    else if (hadPanel.current) {
      hadPanel.current = false;
      const after = focusAfter.current;
      focusAfter.current = null;
      const target = after ? stageRef.current?.querySelector<HTMLElement>(`.open-world-map-place[data-lieu="${after}"]`) : null;
      (target ?? mapButton.current)?.focus();
    }
  }, [sheetOpen]);
  const closePanel = useCallback(() => setPanel(null), []);
  const closeLieu = useCallback(() => setLieu(null), []);
  // Les habitants (GD-20, point 4, lot L1 « Livrer ») : « Livrer » ouvre la remise ; « Y aller » mène d'un coup au lieu de
  // la ressource (son nom dit, comme une ligne de la liste des lieux), ou au lieu de l'Escale où l'on assemble.
  // Le lieu où l'on assemble, dans sa forme « à », en entier : celui de docs/contenu/assemblage.md, comme dans la grille.
  const assemblyAt = textes.assemblage.a;
  const deliverAt = useCallback((commande: string) => {
    const r = remiseOf(commande);
    if (!r || !world.current) return;
    setLieu(null);
    setRemise(r);
  }, []);
  // « Donner », « Apporter » (lot L2) : la remise de l'étape d'entraide, telle qu'elle se présente maintenant.
  const entraideAt = useCallback(
    (story: string) => {
      const r = entraideRemiseOf(plan, vu, story);
      if (!r || !world.current) return;
      setLieu(null);
      setRemise(r);
    },
    [plan, vu],
  );
  /** Le geste que porte la suggestion, chez l'habitant où se tient Kéo. */
  const actAt = (a: SuggestedAction) => (a.kind === 'livrer' ? deliverAt(a.id) : entraideAt(a.id));
  // « Continuer » : le monde revient, le panneau du lieu se rouvre (comme au retour d'une mission).
  const closeRemise = useCallback(() => {
    if (remise) setLieu({ place: remise.place, focus: null });
    setRemise(null);
  }, [remise]);
  const goHabitant = useCallback(
    (go: HabitantGo) => {
      setLieu(null);
      setCommandsOpen(false);
      if ('port' in go) return world.current?.goToPort(go.port);
      if (settings.autoRead) {
        speak(frenchTypography(placeById(go.place).name));
        named.add(go.place);
      }
      world.current?.goTo(go.place, true);
    },
    [settings.autoRead, speak],
  );
  const openCommands = useCallback(() => {
    setPanel(null);
    setLieu(null);
    setCommandsOpen(true);
  }, []);
  const closeCommands = useCallback(() => setCommandsOpen(false), []);
  // Une ligne du panneau d'un lieu : la mission s'y joue, dans sa scénette ou sur l'écran habituel.
  const play = useCallback(
    (mission: string) => {
      if (!lieu) return;
      setLieu(null);
      setAsking({ place: lieu.place, mission, plain: !playsInPlace(placeById(lieu.place), mission) });
    },
    [lieu],
  );
  // « Reprendre » chez l'habitant (GD-20, point 4, lot L3, B2) : les questions dues des missions de ce lieu, jouées dans
  // sa scène ; s'il n'y en a aucune qui s'y revoie (les maths générées, l'Ascension), l'écran habituel, comme avant (B1).
  // Le temps que ses exercices se chargent, « Reprendre » est occupé (`aria-busy`) et un second toucher ne relance rien ;
  // si le chargement échoue (hors ligne, mise à jour en cours), l'écran habituel des révisions, comme sans plan.
  const navigate = useNavigate();
  const [reprendreBusy, setReprendreBusy] = useState(false);
  const reprendreRef = useRef(false);
  const reprendreAt = useCallback(async () => {
    if (!lieu || reprendreRef.current) return;
    const place = lieu.place;
    const dues = () => revisionsDeLIle(state.spaced, state.world.links, placeById(place).island as IleId, settings.lv2, todayISO(), true);
    reprendreRef.current = true;
    setReprendreBusy(true);
    try {
      // Au 5e, pas de scène où revoir : l'écran habituel des révisions.
      const plan = sixth ? await revisionPlanOf(state.spaced, state.world.links, place, settings.lv2) : null;
      if (plan) {
        setLieu(null);
        setAsking({ place, mission: plan.segments[0].type, plain: false, revision: plan });
        return;
      }
      const due = dues();
      if (due.length) navigate(cheminDeRevision(due[0]));
    } catch {
      const due = dues();
      if (due.length) navigate(cheminDeRevision(due[0]));
    } finally {
      reprendreRef.current = false;
      setReprendreBusy(false);
    }
  }, [sixth, lieu, state.spaced, state.world.links, settings.lv2, navigate]);
  const goPort = useCallback((spot: Exclude<PortSpot, 'quai'>) => {
    setPanel(null);
    world.current?.goToPort(spot);
  }, []);

  // Les terres dans la scène : la brume et les ponts tombés des terres fermées, les ponts rebâtis des autres.
  useEffect(() => {
    world.current?.setLands(lands);
    layAnnounced.current = false;
  }, [lands, ready]);

  // La Carte : les lieux ouverts sont ceux des terres ouvertes.
  const openPlaces = useMemo(() => plan.places.map((p) => p.id).filter((id) => !isClosed(id)), [plan, isClosed]);
  useEffect(() => {
    world.current?.map(mapOpen && !asking ? openPlaces : null);
  }, [mapOpen, asking, openPlaces, ready]);
  /**
   * Un lieu ouvert choisi sur la Carte : elle se ferme, Kéo y est déposé d'un coup (une coupe franche), et le focus
   * revient sur le bouton de la Carte (consultant UX UI).
   */
  const pickPlace = useCallback((placeId: PlaceId) => {
    setMapOpen(false);
    world.current?.map(null);
    world.current?.goTo(placeId, true);
    mapButton.current?.focus();
  }, []);
  /** L'Escale choisie sur la Carte : la Carte se ferme, Kéo est déposé au quai, la fiche du Port s'ouvre. */
  const pickPort = useCallback(() => {
    setMapOpen(false);
    world.current?.map(null);
    world.current?.goToPort('quai');
  }, []);
  const pickOnMap = useCallback((id: PlaceId | 'port') => (id === 'port' ? pickPort() : pickPlace(id)), [pickPlace, pickPort]);
  // Une terre fermée touchée sur la Carte (le cadenas de son pont, l'un de ses lieux) : sa fiche s'ouvre par-dessus, la
  // Carte reste ouverte.
  const openClosed = useCallback((land: LinkedLand) => setLieu({ place: landById(land).places[0], focus: null }), []);
  // Un lieu touché dans la 3D : ouvert (l'Escale l'est toujours), on y va ; d'une terre fermée, ou un pont, la fiche de
  // la terre s'ouvre.
  useEffect(() => {
    mapPick.current = (id) => {
      if (isBridgeSpot(id)) return openClosed(landOfBridgeSpot(id));
      if (id === 'port' || openPlaces.includes(id)) return pickOnMap(id);
      const land = landOf(id);
      if (isLinkedLand(land)) openClosed(land);
    };
  }, [openPlaces, pickOnMap, openClosed]);
  // La liste des lieux ouverts, sur la Carte (bouton « Lieux ») ; Échap ferme la liste d'abord, puis la Carte, comme un
  // panneau.
  const closeMap = useCallback(() => setMapOpen(false), []);
  const list = usePlacesList(mapOpen && !lieu, closeMap);
  const openList = list.open;
  const toggleList = list.toggle;
  /**
   * « Relier » (GD-20, point 3, « vraies terres ») : la terre entière, payée une fois ; la fiche se ferme, la caméra ne
   * bouge pas, le pont se pose (les piles, le tablier, les garde-corps et les lanternes, environ 3 s), un seul toc de
   * bois à la fin, puis la brume de la terre se lève en fondu (d'un coup avec « Réduire les animations », sur la Carte, ou
   * si le pont n'est pas à l'écran, avec le même toc). Puis « Le pont est rebâti. », jamais en même temps que le toc, et
   * la phrase du pont que celui-ci rend reliable (« Le pont des Crêtes peut être rebâti. »). Sur la Carte, le focus va sur
   * le nom d'un lieu de la terre.
   */
  // Une pose annoncée à la scène, en attente de ses terres (`setLands`, dans l'effet ci-dessus).
  const layAnnounced = useRef(false);
  const relier = useCallback(
    (land: LinkedLand) => {
      const before = lands.closed;
      const sounds = settings.sounds;
      let tappedAt = 0;
      const events: BridgeLayEvents = {
        tap: () => {
          tappedAt = performance.now();
          if (sounds) playWoodTap();
        },
        laid: () => {
          const linkable = landsAfter(land, before);
          const after = Math.max(0, SAID_AFTER_MS - (performance.now() - tappedAt));
          setSaid((was) => ({ n: (was?.n ?? 0) + 1, lines: [PONT_REBATI, ...linkable.map(linkableLabel)], after }));
        },
      };
      // Une pose déjà annoncée, les terres pas encore changées dans la scène : rien de payé, rien d'annoncé (une
      // seconde annonce effacerait la phrase de la première).
      if (layAnnounced.current) return;
      if (!linkLand(gridLand(land)).ok) return;
      // Payée, puis annoncée avant que les terres changent dans la scène (`setLands` vient d'un effet, après le rendu) :
      // la scène la pose quand elle les reçoit. Un paiement refusé n'annonce rien.
      const w = world.current;
      if (w) {
        layAnnounced.current = true;
        w.layLand(land, events);
      }
      if (mapOpen) focusAfter.current = landById(land).places[0];
      setLieu(null);
      if (!w) {
        events.tap();
        events.laid();
      }
    },
    [linkLand, lands.closed, mapOpen, settings.sounds],
  );
  // La phrase vient après le toc (jamais en même temps), reste écrite un moment, et se dit si la voix est active.
  const [saidShown, setSaidShown] = useState(false);
  const saidHide = useRef<number | undefined>(undefined);
  // Sur un petit écran (téléphone, étroit ou couché), une phrase à la fois, environ 4 s chacune, dans l'ordre (référent
  // dys, consultant UX UI, deuxième passe du lot 2) : `saidStep` est celle qu'on voit ; la voix, « Réécouter » et
  // `role="status"` gardent les deux. Ailleurs, les deux ensemble, 4 s par phrase.
  const small = useSmallScreen();
  const smallNow = useRef(small);
  useEffect(() => {
    smallNow.current = small;
  }, [small]);
  const [saidStep, setSaidStep] = useState(0);
  const saidAt = useRef({ step: 0, lines: 0 });
  /** Dans `ms` millisecondes : la phrase suivante (petit écran), ou la fin. */
  const nextSaid = useCallback((ms: number) => {
    const tick = () => {
      const at = saidAt.current;
      if (smallNow.current && at.step < at.lines - 1) {
        at.step += 1;
        setSaidStep(at.step);
        saidHide.current = window.setTimeout(tick, SAID_MS);
      } else setSaidShown(false);
    };
    window.clearTimeout(saidHide.current);
    saidHide.current = window.setTimeout(tick, ms);
  }, []);
  // Toucher la phrase ou son haut-parleur la garde écrite encore un moment, pour l'élève qui n'a pas fini de la lire
  // (référent dys) ; sur un petit écran, celle qu'il lit, puis la suivante.
  const holdSaid = useCallback(() => nextSaid(SAID_MS), [nextSaid]);
  useEffect(() => {
    if (!said) return;
    const show = window.setTimeout(() => {
      setSaidShown(true);
      if (settings.autoRead) speak(said.voice ?? said.lines.join(' '));
    }, said.after);
    saidAt.current = { step: 0, lines: said.lines.length };
    setSaidStep(0);
    // Deux phrases restent écrites deux fois plus longtemps : ensemble, ou l'une après l'autre sur un petit écran.
    nextSaid(said.after + (smallNow.current ? SAID_MS : SAID_MS * said.lines.length));
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(saidHide.current);
    };
    // La voix et son réglage ne relancent pas la phrase : seule une nouvelle pose (`said`) la relance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [said]);
  // La vue finale (au 3e) cache la phrase de la restauration du Fanal, posée juste avant elle : à la fin de la vue, la
  // phrase revient et reste écrite toute sa durée, sans que la voix la redise (consultant UX UI, « Le temps de lire »).
  const saidAtFinal = useRef<number | null>(null);
  useEffect(() => {
    if (finalPlaying) {
      saidAtFinal.current = said?.n ?? null;
      return;
    }
    const n = saidAtFinal.current;
    saidAtFinal.current = null;
    if (n === null || !said || said.n !== n) return;
    saidAt.current = { step: 0, lines: said.lines.length };
    setSaidStep(0);
    setSaidShown(true);
    nextSaid(smallNow.current ? SAID_MS : SAID_MS * said.lines.length);
    // Seule la fin de la vue finale relance la phrase ; une nouvelle pose passe par l'effet de `said`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPlaying]);
  // Une ligne touchée : comme une pastille de la Carte ; la voix dit le nom du lieu, celui du panneau qui s'ouvre à
  // l'arrivée (référent dys).
  const pickFromList = useCallback(
    (id: PlaceId | 'port') => {
      const name = id === 'port' ? departNames?.nom : placeById(id).name;
      if (settings.autoRead && name) {
        speak(frenchTypography(name));
        named.add(id);
      }
      pickOnMap(id);
    },
    [pickOnMap, settings.autoRead, speak, departNames],
  );
  const listRef = useRef<HTMLDivElement>(null);
  // La liste ouverte : « Retour » et « Lieux » se tiennent à côté d'elle, jamais dessous (au-dessus du panneau du bas sur
  // tablette, à droite de la colonne sur un écran bas), relus quand elle change de taille, avant que la page se dessine.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const el = listRef.current;
    if (!stage || !el || !openList) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const column = r.top - s.top < 8 && r.width < s.width * 0.8;
      stage.style.setProperty('--lieux-gauche', column ? `${Math.round(r.right - s.left)}px` : '0px');
      stage.style.setProperty('--lieux-bas', column ? '0px' : `${Math.round(s.bottom - r.top)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(el);
    measure();
    return () => {
      observer.disconnect();
      stage.style.removeProperty('--lieux-gauche');
      stage.style.removeProperty('--lieux-bas');
    };
  }, [openList]);

  useEffect(() => {
    if (!departing) world.current?.setNef(nefLookNow);
  }, [nefLookNow, departing, ready]);
  // Les parures de l'aéronef au repos (GD-25) : chacune descend à sa place quand elle est posée.
  useEffect(() => {
    if (nefResting) world.current?.setParures(paruresNow);
  }, [nefResting, paruresNow, ready]);
  // « Partir » : la fiche se ferme, la Nef glisse vers la passe ; à la fin (ou au toucher), le voyage se fait et l'élève
  // arrive en 5e, dans la disposition que choisit la fabrique (le monde ouvert du 5e derrière `?monde=ouvert`, GD-22).
  const departNef = useCallback(
    (stage: VehicleStage) => {
      const w = world.current;
      if (!w) return;
      setPanel(null);
      setDeparting(true);
      // L'annonce du départ (référent dys, retouche du lot 4) : courte, dans la zone du lecteur d'écran, et dite par la
      // voix avec la lecture automatique.
      // Le son du véhicule (la voile, le brûleur, le réacteur), après la voix, jamais en même temps qu'elle ; une fois,
      // même si la fin de la voix ne vient pas (sans synthèse, ou sur certains Android : expert frontend).
      let played = false;
      const sound = () => {
        if (played) return;
        played = true;
        if (settings.sounds) (stage.stage === 1 ? playSail : stage.stage === 2 ? playBurner : playReactor)();
      };
      if (settings.autoRead && isSpeechAvailable()) {
        speak(NEF_LEAVES, sound);
        window.setTimeout(sound, SOUND_AFTER_VOICE_MS);
      } else sound();
      w.departNef(() => {
        const r = launch(stage, sail.kit);
        setDeparting(false);
        if (!r.ok) return;
        launchVoyage(stage.reward.xp);
        navigate(`/adventure/${r.to}`, { replace: true, state: { voyage: 'arrivee' } satisfies VoyageState });
      });
    },
    [launch, launchVoyage, navigate, sail.kit, settings.autoRead, settings.sounds, speak],
  );
  // Quand le monde est prêt, après un voyage entre niveaux : à la première arrivée par la Nef, le carillon, une fois ;
  // après un retour, le nom du niveau, dans la zone du lecteur d'écran et à la voix (référent dys). Puis l'adresse
  // oublie le voyage : un rechargement ne le rejoue pas (expert frontend).
  const [levelSaid, setLevelSaid] = useState('');
  const voyageDone = useRef(false);
  useEffect(() => {
    if (!ready || voyageDone.current || !arrival.voyage) return;
    voyageDone.current = true;
    if (arrival.voyage === 'arrivee') {
      if (settings.sounds) playArrival();
    } else {
      const words = frenchTypography(`Les ${textes.archipels[level]}.`);
      setLevelSaid(words);
      if (settings.autoRead) speak(words);
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [ready, arrival.voyage, settings.sounds, settings.autoRead, speak, textes.archipels, level, navigate, location.pathname, location.search]);
  // Le retour d'un fondu : le voile se lève quand le monde est prêt, ou après quelques secondes au plus, pour ne jamais
  // laisser l'élève devant un voile qui prend les touchers (consultant UX UI).
  useEffect(() => {
    if (ready) setFondu(false);
  }, [ready]);
  useEffect(() => {
    if (!fondu) return;
    const lift = window.setTimeout(() => setFondu(false), FADE_SAFETY_MS);
    return () => window.clearTimeout(lift);
  }, [fondu]);
  // Un bouton de la rangée « Revenir » de la fiche de la Nef (piste A) : la fiche se ferme, le voile couvre la page en
  // un quart de seconde, puis Kéo passe au port de ce niveau et la page de ce niveau monte, Kéo au quai de son lieu de
  // départ ; d'un coup avec « Réduire les animations ». Rien d'autre ne change dans la sauvegarde que la place de Kéo.
  const leaving = useRef<number | null>(null);
  useEffect(() => () => {
    if (leaving.current !== null) window.clearTimeout(leaving.current);
  }, []);
  const goLevel = useCallback(
    (to: ArchipelagoId) => {
      if (leaving.current !== null) return;
      setPanel(null);
      const go = () => {
        leaving.current = null;
        moveTo(getArchipelago(to).port);
        navigate('/adventure', { replace: true, state: { voyage: 'fondu' } satisfies VoyageState });
      };
      if (reduceMotion) return go();
      setFondu(true);
      leaving.current = window.setTimeout(go, LEVEL_FADE_MS / 2);
    },
    [moveTo, navigate, reduceMotion],
  );
  // Les aménagements posés de chaque lieu (GD-20, point 4, lot L0) : les petites constructions livrées, la même sauvegarde.
  const amenagements = useMemo(() => posedAmenagements(state.world.parts), [state.world.parts]);
  // Les traces des scénettes de chaque lieu : une par mission jouée en scénette, dès sa première réussite (les étoiles
  // gardées ; GD-20, point 8).
  const traces = useMemo(() => {
    const of = (id: PlaceId): string[] => {
      const p = placeById(id);
      const biome = getIle(p.island);
      // Les missions restées sur l'écran habituel (lot L7 : Ascension, le Filon) laissent leur trace aussi.
      return biome ? [...p.scenes, ...(p.panels ?? [])].filter((m) => traceDone(exercisesOf(biome.id, m).map((e) => state.progress[e.id]?.stars ?? 0))) : [];
    };
    return placeRecord(plan, of);
  }, [plan, state.progress]);
  // Ce que la scène montre déjà, et le lieu de la dernière question : une partie arrivée pendant une question s'y pose
  // après le bilan, sous les yeux de l'élève ; les autres changements (une partie posée dans la grille) sont là, sans
  // pose. Rien ne change pendant une question : la partie attend la fin du bilan.
  const shownBuilt = useRef<Record<PlaceId, readonly PartShape[]> | null>(null);
  // Ce que la scène a reçu en dernier (`poseAgain`, les captures seulement).
  const placesNow = useRef<Parameters<OpenWorld['setPlaces']>[0] | null>(null);
  const askedPlace = useRef<PlaceId | null>(null);
  useEffect(() => {
    if (!asking) return;
    askedPlace.current = asking.place;
    setPosePending(true);
  }, [asking]);
  useEffect(() => {
    const w = world.current;
    if (!w || asking) return;
    const built: Record<PlaceId, readonly PartShape[]> = placeRecord(plan, (id) => posedShapes(constructions[id]));
    const before = shownBuilt.current;
    const place = askedPlace.current;
    shownBuilt.current = built;
    askedPlace.current = null;
    const fresh = before && place ? built[place].filter((s) => !before[place].includes(s)) : [];
    placesNow.current = { built, traces, amenagements };
    if (!w.setPlaces(placesNow.current, place && fresh.length ? { place, parts: fresh } : undefined)) setPosePending(false);
  }, [plan, constructions, traces, amenagements, asking, ready]);
  // L'état de chaque lieu sur la Carte, en icône et en mot (les mots d'état de l'univers).
  const states = useMemo(
    () => placeRecord(plan, (id) => constructionState(constructions[id])),
    [plan, constructions],
  );

  const closeQuestion = useCallback(() => {
    // Après une révision, la liste du lieu se rouvre sans ligne choisie : on n'y a joué aucune mission entière.
    if (asking) setBackTo({ place: asking.place, mission: asking.revision ? null : asking.mission });
    setAsking(null);
  }, [asking]);
  // Le retour d'une mission : après le bilan et la pose de la partie gagnée, la liste du lieu se rouvre, le focus sur la
  // ligne jouée (consultant UX UI).
  // Une pose qui ne dirait jamais sa fin (la scène arrêtée) ne retient ni la liste ni les célébrations.
  const poseOver = useCallback(() => setPosePending(false), []);
  usePoseGuard(posePending && !asking, poseOver);
  useEffect(() => {
    if (!backTo || asking || posePending) return;
    setLieu({ place: backTo.place, focus: backTo.mission });
    setBackTo(null);
  }, [backTo, asking, posePending]);
  // Kéo au quai, la fiche de la Nef ouverte : « Y aller » vers la Nef prête, ou sa pastille touchée.
  const goNef = () => {
    if (settings.autoRead) speak(frenchTypography(NEF_TITLE));
    world.current?.goToPort('quai');
    setLieu(null);
    setCommandsOpen(false);
    setPanel('nef');
  };
  const goNext = () => {
    // La Nef prête : Kéo au quai, sa fiche ouverte (« Partir »).
    if (nefFirst) return goNef();
    // La commande prête que porte la suggestion : « Livrer » chez l'habitant, sinon Kéo y va.
    if (suggestedCmd) {
      if (here === suggestedCmd.place) return actAt(suggestedCmd);
      if (settings.autoRead) {
        speak(frenchTypography(placeById(suggestedCmd.place).name));
        named.add(suggestedCmd.place);
      }
      world.current?.goTo(suggestedCmd.place, true);
      return;
    }
    if (!next) return;
    const title = missionTitle(next.place.island, next.mission);
    if (settings.autoRead) {
      speak(frenchTypography(`${next.place.name}. ${title}`));
      named.add(next.place.id);
    }
    world.current?.goTo(next.place.id, true);
  };
  // Court : le nom du lieu, puis la mission (consultant UX UI et référent dys) ; pour une commande, sa phrase « prête ».
  const label = nefFirst
    ? frenchTypography(`${NEF_TITLE}. ${nefReadyLabel(textes.archipels[nefStage.to])}`.replace(/\.$/, ''))
    : suggestedCmd
      ? frenchTypography(suggestedCmd.text.replace(/\.$/, '')) : next ? `${next.place.name}, ${missionTitle(next.place.island, next.mission)}` : '';
  // La marque dit aussi la distance, en mots, lue à la demande (jamais à chaque image).
  const markLabel = nefFirst || nextPlace ? `${label}, ${DISTANCE_WORDS[far]}` : '';
  // Le mot de la marque : la Nef prête, sinon le lieu suggéré (la marque se retire une fois Kéo arrivé au lieu suggéré,
  // ou au quai devant la Nef : directeur artistique, relecture des restes du 5e).
  const markWord = nefFirst ? (atQuai ? null : NEF_TITLE) : nextPlace && nextPlace.id !== here ? nextPlace.name : null;
  // Sur un Détour, « Y aller » repart vers le lieu de la marque : il porte l'icône de sa flèche, droite (elle ne tourne
  // pas vers le lieu comme celle de la marque), sans mot de plus (consultant UX UI, relecture du lot 16 du 5e, point 4) ;
  // ailleurs, les pas.
  const goIcon = detourHere ? 'nord' : 'footprints';
  // « Livrer », « Donner » ou « Apporter » dans la bulle : le geste suggéré est celui de l'habitant où se tient Kéo.
  const deliverHere = Boolean(suggestedCmd && here === suggestedCmd.place);

  // Les renvois à une île (« à gagner dans… », la fiche de la Nef, l'Entrepôt) disent le lieu du plan qui reprend ses
  // missions, et y mènent (consultant d'Archipéo, retouche du lot 4 : chaque cadre nomme ce qu'il montre).
  const earnPlaces = useMemo(() => earnPlacesOf(plan), [plan]);

  // Une question ou une remise : la scène seule, ni marque, ni accès directs, ni panneau.
  const playing = Boolean(asking) || Boolean(remise) || departing || finalPlaying;
  // La phrase du monde est à l'écran : la bulle sous « Y aller » se retire le temps qu'elle l'est.
  // La phrase d'un Détour ne reste pas posée sur la Carte : elle se rapporte à la vue de Kéo (retouche 1 de l'Épaule,
  // point 5).
  const saidOn = saidShown && !playing && !(mapOpen && said?.detour);

  return (
    <EarnPlaces.Provider value={earnPlaces}>
      <div className="world-page open-world">
        {/* `data-said` : la phrase du pont est écrite (sur un petit écran, la marque se masque le temps qu'elle l'est) ; le
            nom d'un Détour (`detour`) : la marque se masque partout le temps qu'il l'est, un seul nom à la fois à l'écran
            (au Détour de l'Épave, « L'Étalon » s'écrivait sous « L'Épave » : consultants d'Archipéo et UX UI). */}
        <div className="world-stage" data-scene data-said={saidOn ? (said?.detour ? 'detour' : 'oui') : undefined} ref={stageRef}>
          <div ref={host} className="open-world-canvas" />
          <div className={`open-world-fondu${fondu ? ' on' : ''}`} aria-hidden="true" />
          <p className="visually-hidden" role="status">
            {levelSaid}
          </p>
          {!ready && <Loading className="world-loading" text="Chargement du monde…" />}
          {/* La marque se retire une fois Kéo arrivé au lieu suggéré (relecture du lot L1) : la bulle porte le geste. */}
          {markWord && !playing && !mapOpen && !sheetOpen && (
            <button type="button" ref={markRef} className="open-world-mark" aria-label={markLabel} onClick={goNext}>
              <span className="open-world-arrow-box" aria-hidden="true">
                <span ref={arrowRef} className="open-world-arrow">
                  <Icon name="nord" />
                </span>
                {/* La distance en signe, jamais en texte (consultant UX UI) : un, deux ou trois points pleins, de près à loin. Pas
                    sur la Nef prête : trois points dont un vide s'y lisaient comme une étape qui manque, sous « Prête »
                    (consultant d'Archipéo, relecture des restes du 5e) ; la voix dit toujours la distance. */}
                {!nefFirst && (
                  <span className="open-world-distance">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </span>
              {/* Le nom du lieu seul : aucune icône de lieu n'existe encore (le sapin de l'île d'aujourd'hui ne dit pas le Phare). */}
              <span className="open-world-mark-word">{markWord}</span>
            </button>
          )}
          {/* Un cadenas sur le pont de chaque terre fermée : une icône sans texte, dite aux lecteurs d'écran (référent dys). */}
          {/* Les pastilles des habitants : jamais pendant une question, une remise, un panneau ni sur la Carte. */}
          <HabitantSigns signs={signs} hidden={playing || mapOpen || sheetOpen} onPick={(place) => world.current?.goTo(place)} root={signsRef} nef={nefSign} onNef={goNef} />
          <div ref={locksRef} className="open-world-locks" hidden={playing || mapOpen || sheetOpen}>
            {lands.closed.map((land) => (
              <span key={land} className="open-world-lock" data-terre={land} role="img" aria-label={closedLandLabel(land, afterOf(land))} hidden>
                <Icon name="lock" />
              </span>
            ))}
          </div>
          {/* La Carte : Kéo, chaque lieu à sa place sur l'île, en étiquettes de la page (rien n'est écrit dans la 3D). */}
          {mapOpen && !asking && (
            <MapLabels places={plan.places} openPlaces={openPlaces} closedLands={lands.closed} states={states} words={textes.etatsDIle} onPick={pickOnMap} placer={mapPlacer} onClosed={openClosed} orderLabel={orderLabel} suggested={lands.suggested} nextPlace={nefFirst ? null : (nextPlace?.id ?? null)} portName={departNames?.nom} upper={plan.upper} onCrowded={reframeMap} />
          )}
          {/* La liste des lieux ouverts : un voile léger sur la Carte, qu'un toucher ferme sans rien choisir (aucun toucher ne
              le traverse : ni la 3D ni une étiquette ne le reçoivent), et le panneau, en bas sur tablette, en colonne à
              gauche sur un écran bas. */}
          {openList && !asking && (
            <>
              <div className="open-world-voile" aria-hidden="true" onClick={list.close} />
              <div ref={listRef} className="open-world-panel open-world-panel-lieux-ouverts">
                <PlacesSheet rows={placesRows(plan, openPlaces, states, textes.etatsDIle, suggestedCmd || nefFirst ? null : (next?.place.id ?? null), departNames?.nom, amenagements)} onPick={pickFromList} onClose={list.close} />
              </div>
            </>
          )}
          {/* Les accès directs (décision « Sans Menu », GD-20, lot 1) : la colonne du monde en grille, telle quelle ; les
              commandes ouvrent la liste du monde ouvert (lot L1), sans la quête d'entraide (lot L2). Masquée pendant une
              question ou une remise. */}
          {!playing && !sheetOpen && <WorldShortcuts a={level} requestsOpen={commandsOpen} onRequests={errands ? openCommands : undefined} resumeFrom={portResume} resumeAt={placeResume} />}
          {!playing && !sheetOpen && <SettingsButton />}
          {/* Le niveau où l'on est, un seul bouton qui déplie les autres niveaux atteints (./LevelPicker.tsx, choix du mainteneur
              du 23 octobre 2026), à gauche de Réglages, la colonne de droite étant celle de la caméra ; le même fondu que la
              rangée de la fiche de la Nef. Ni pendant une question, un panneau ou la Carte, ni en mode bâtisseur, dont la
              barre a déjà ses niveaux. */}
          {!playing && !mapOpen && !sheetOpen && !batisseur && <LevelPicker here={level} links={state.world.links} onGo={goLevel} />}
          {commandsOpen && !playing && (
            <div ref={panelRef} className="open-world-panel open-world-panel-commandes">
              <CommandsSheet lines={commandLines(plan, state, assemblyAt)} entraide={entraideListLine(plan, vu, (p) => !isClosed(p), assemblyAt)} suggested={suggestedId} onGo={goHabitant} onClose={closeCommands} />
            </div>
          )}
          {/* Le panneau ouvert de l'Escale (GD-20, lot 2) : comme une question, il masque les accès directs, Réglages, la
              Carte et « Y aller » ; un seul panneau à la fois. */}
          {panel && !playing && (panel === 'nef' || departNames) && (
            <div ref={panelRef} className={`open-world-panel open-world-panel-${panel}`}>
              {panel === 'nef' && nefResting ? (
                <NefParuresSheet
                  look={paruresNow}
                  feux={feux.kit}
                  missing={feux.missing}
                  onMap={() => {
                    setPanel(null);
                    setMapOpen(true);
                  }}
                  here={level}
                  onReturn={goLevel}
                  onClose={closePanel}
                />
              ) : panel === 'nef' ? (
                <NefSheet
                  stage={nefStage}
                  kit={sail.kit}
                  missing={sail.missing}
                  onDepart={departNef}
                  onMap={() => {
                    setPanel(null);
                    setMapOpen(true);
                  }}
                  onReturn={goLevel}
                  onClose={closePanel}
                />
              ) : (
                <PortPanels panel={panel} names={departNames!} onGo={goPort} onNef={() => setPanel('nef')} onClose={closePanel} />
              )}
            </div>
          )}
          {/* Le panneau d'un lieu (GD-20, point 8) : comme celui d'une porte, il masque les accès directs, Réglages, la Carte
              et « Y aller ». */}
          {lieu && !playing && (
            <div ref={panelRef} className="open-world-panel open-world-panel-lieu">
              {closedLandOf(lieu.place) ? (
                // Un lieu d'une terre fermée (GD-20, point 3) : la fiche de la terre, « Relier », aucune mission ; pas
                // encore reliable, la terre à relier d'abord, dont le bouton ouvre la fiche.
                <ClosedLandSheet
                  land={closedLandOf(lieu.place)!}
                  after={afterOf(closedLandOf(lieu.place)!)}
                  onAfter={(land) => setLieu({ place: landById(land).places[0], focus: null })}
                  price={landPrice(closedLandOf(lieu.place)!)}
                  have={payableBlocks(state.stock)}
                  suggested={lands.suggested === closedLandOf(lieu.place)}
                  onLink={() => relier(closedLandOf(lieu.place)!)}
                  onClose={closeLieu}
                />
              ) : (
                <PlacePanel
                  place={placeById(lieu.place)}
                  missions={missionsOfPlace(placeById(lieu.place), bornes)}
                  suggested={!suggestedCmd && !nefFirst && next?.place.id === lieu.place ? next.mission : null}
                  focus={lieu.focus}
                  onPlay={play}
                  onClose={closeLieu}
                  habitant={habitantsShown && <HabitantLine place={lieu.place} line={errands ? habitantLineOf(state, lieu.place, assemblyAt) : null} entraide={errands ? entraideLineOf(plan, vu, lieu.place, assemblyAt) : null} suggested={suggestedId} onDeliver={deliverAt} onEntraide={entraideAt} onReprendre={() => void reprendreAt()} reprendreBusy={reprendreBusy} onGo={goHabitant} />}
                />
              )}
            </div>
          )}
          {/* La phrase du pont rebâti, sur fond uni, un moment (GD-20, point 3) : jamais pendant une question. La
              zone reste dans la page, vide le reste du temps, pour que les lecteurs d'écran annoncent la phrase ; le temps
              qu'elle est écrite, un haut-parleur la fait réentendre, et le toucher la garde écrite (référent dys). Sur la Carte, elle se tient en haut,
              hors des noms des lieux du sud. */}
          <div className={`open-world-said${mapOpen ? ' on-map' : said?.top ? ' on-top' : ''}`} data-shown={saidOn ? 'oui' : 'non'} data-etape={saidStep} onPointerDown={holdSaid} onFocus={holdSaid}>
            {saidOn && said?.icon && <Icon name={said.icon} />}
            <p role="status">{saidOn && said ? said.lines.map((line, i) => (
                  // Sur un petit écran, l'autre phrase reste lue par le lecteur d'écran, cachée à la vue.
                  <span key={line} className={small && i !== saidStep ? 'visually-hidden' : undefined}>
                    {i > 0 && ' '}
                    {line}
                  </span>
                )) : ''}</p>
            {saidOn && said && <SpeakButton text={said.voice ?? said.lines.join(' ')} label="Réécouter" compact />}
          </div>
          {asking && world.current && (
            asking.revision ? (
              <WorldRevision key={`${asking.place}-revision`} plan={asking.revision} world={world.current} onClose={closeQuestion} />
            ) : (
              <WorldQuestion key={`${asking.place}-${asking.mission}`} place={asking.place} mission={asking.mission} plain={asking.plain} world={world.current} onClose={closeQuestion} />
            )
          )}
          {remise && !asking && world.current && <Remise key={`${remise.kind}-${remise.id}`} world={world.current} request={remise} act={() => (remise.kind === 'livrer' ? deliver(remise.id) : tapStory(remise.id))} onClose={closeRemise} />}
          {/* La Carte : le même bouton que dans le reste du jeu, dans la barre du bas, à gauche (« Y aller » tient le milieu). */}
          {!playing && !sheetOpen && (
            <nav className={`open-world-bar${openList ? ' avec-liste' : ''}`} aria-label="Monde">
              {/* Un seul mot, toujours écrit sous l'icône, dans le bouton ; la Carte ouverte, il dit comment en sortir. */}
              <button
                type="button"
                ref={mapButton}
                className="button open-world-map-button"
                data-tuto="carte"
                onClick={() => setMapOpen(!mapOpen)}
              >
                <Icon name={mapOpen ? 'back' : 'map'} />
                <span className="open-world-map-word">{mapOpen ? 'Retour' : 'Carte'}</span>
              </button>
              {/* « Lieux », sur la Carte seulement, à droite de « Retour », un écart net entre eux : le mot toujours écrit sous
                  l'icône ; il ouvre et ferme la liste des lieux ouverts. */}
              {mapOpen && (
                <button
                  type="button"
                  ref={list.button}
                  className="button open-world-map-button open-world-lieux-button"
                  aria-label={PLACES_BUTTON_LABEL}
                  aria-expanded={openList}
                  aria-controls={PLACES_SHEET_ID}
                  onClick={toggleList}
                >
                  <Icon name="liste" />
                  <span className="open-world-map-word">Lieux</span>
                </button>
              )}
            </nav>
          )}
          {/* La caméra qui tourne autour de Kéo (GD-20, rotation libre) : deux doigts qui tournent, ou ces boutons, d'une
              main ; la boussole montre le nord et y ramène. Sous Réglages, au bord droit, sans mot ; le doigt posé écrit leur
              nom, comme tous les boutons du monde. Vers le nord, la boussole est délavée et son toucher le dit. */}
          {!playing && !mapOpen && !sheetOpen && (
            <div className="open-world-camera" role="group" aria-label="Caméra">
              <WorldButton
                icon={
                  <span ref={needle} className="open-world-needle" aria-hidden="true">
                    <CompassNeedle />
                  </span>
                }
                name="Nord"
                empty={turned ? undefined : 'déjà vers le nord'}
                onClick={() => world.current?.turn(0)}
              />
              <WorldButton icon="tournerGauche" name="Tourner vers la gauche" onClick={() => world.current?.turn(-1)} />
              <WorldButton icon="tournerDroite" name="Tourner vers la droite" onClick={() => world.current?.turn(1)} />
            </div>
          )}
          {!playing && !mapOpen && !sheetOpen && (
            <div className="open-world-go">
              {/* La phrase de ce que porte la suggestion chez un habitant (sa commande, l'étape d'entraide) ; quand rien
                  n'attend, le rappel des révisions, ou l'action d'une terre à relier, sinon rien. Jamais pendant qu'une
                  phrase du monde est écrite (l'état d'un lieu restauré, un pont rebâti, le nom d'un Détour) : une seule
                  bulle à la fois, la plus récente ; l'autre dépassait dessous (référent dys et consultant UX UI,
                  relecture des Fabriques). Elle revient ensuite. Jamais sur un Détour, où il n'y a jamais de mission (retouche 1 des Coteaux : au Replat, tout fini,
                  elle venait après le nom). */}
              {!walking && !relightHere && !saidOn && suggestedAct && <p className="open-world-go-reason">{frenchTypography(suggestedAct.text)}</p>}
              {/* « Relier le Bastion » est un vrai bouton, secondaire, qui ouvre la fiche de la terre (celle qu'ouvre le
                  toucher d'un de ses lieux) : avec son allure de bouton, un toucher qui ne répondait pas cassait « un
                  contrôle répond toujours » (consultant UX UI et référent dys, relecture des restes du 4e). */}
              {!next && !suggestedCmd && !nefFirst && !walking && !relightHere && !saidOn && detourHere === null && (revisionHere ? (
                <p className="open-world-go-reason">{frenchTypography(REVISION_PHRASES.reminder)}</p>
              ) : landToLink && (
                <button type="button" className="button open-world-go-reason open-world-go-link" onClick={() => openClosed(landToLink)}>
                  <Icon name="ouvrage" /> {linkActionLabel(landToLink)}
                </button>
              ))}
              <div className="open-world-go-row">
              {walking ? (
                // Pendant tout trajet (la marche, la cabine, la marche) : « Passer le trajet », à contraste plein, saute
                // jusqu'à l'arrivée.
                <button type="button" className="button" onClick={() => world.current?.skip()}>
                  <Icon name="play" /> Passer le trajet
                </button>
              ) : relightHere ? (
                // Au cairn éteint d'un Détour, un seul geste, à la place du bouton du monde (comme « Livrer ») ; ensuite,
                // la flamme reste, sans phrase ni « bravo ».
                <button type="button" className="button primary" onClick={() => cairnToLight && lightDetour(cairnToLight)}>
                  <Icon name="flame" /> Rallumer
                </button>
              ) : deliverHere ? (
                <button type="button" className="button primary" onClick={goNext}>
                  <Icon name="paquet" /> {gestureWord(suggestedCmd?.kind, textes)}
                </button>
              ) : suggestedCmd || nefFirst ? (
                <button type="button" className="button primary" aria-label={`Y aller : ${suggestedCmd ? placeById(suggestedCmd.place).name : NEF_TITLE}`} onClick={goNext}>
                  <Icon name={goIcon} /> Y aller
                </button>
              ) : (
                <button type="button" className="button primary" disabled={!next} aria-label={next ? `Y aller : ${label}` : undefined} onClick={goNext}>
                  <Icon name={goIcon} /> Y aller
                </button>
              )}
              {/* La cabine (GD-22, lot 3 ; arbitrage de la première relecture) : Kéo à l'arrêt près d'une gare, un bouton
                  secondaire à côté du bouton du monde, « Monter » au pied, « Descendre » en haut ; jamais pendant une
                  marche. */}
              {!walking && cabin.side && (
                <button type="button" className="button open-world-cabin" onClick={() => world.current?.ride()}>
                  <Icon name="cabine" /> {cabin.side === 'bas' ? 'Monter' : 'Descendre'}
                </button>
              )}
              </div>
            </div>
          )}
          {/* L'arrivée de la cabine : une phrase courte pour le lecteur d'écran, jamais écrite à l'écran. */}
          <p role="status" className="visually-hidden">
            {cabinSaid.text}
          </p>
          <p role="status" className="visually-hidden">
            {departing ? NEF_LEAVES : ''}
          </p>
        </div>
      </div>
    </EarnPlaces.Provider>
  );
}

/**
 * L'aiguille de la boussole : un losange, la moitié nord pleine, la moitié sud en contour (jamais une lettre ; référent
 * dys et consultant UX UI : une flèche seule se lisait « A »).
 */
function CompassNeedle() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false">
      <path d="M12 2 L17 12 L7 12 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 12 L17 12 L12 22 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.6" fill="var(--surface, #fff)" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Pose les cadenas des ponts des terres fermées, image par image, sans passer par React : chacun au-dessus de son pont
 * quand il se voit, caché sinon (jamais au bord de l'écran : seul le lieu suivant a sa flèche).
 */
function placeLocks(root: HTMLElement | null, locks: readonly LockOnScreen[]): void {
  if (!root) return;
  for (const el of root.children) {
    if (!(el instanceof HTMLElement)) continue;
    const lock = locks.find((l) => l.land === el.dataset.terre);
    const shown = Boolean(lock?.shown);
    if (el.hidden === shown) el.hidden = !shown;
    if (!lock || !shown) continue;
    // Le style n'est écrit que quand la place change (la caméra arrêtée : rien à refaire).
    const transform = `translate(${Math.round(lock.x)}px, ${Math.round(lock.y)}px)`;
    if (lockTransforms.get(el) === transform) continue;
    lockTransforms.set(el, transform);
    el.style.transform = transform;
  }
}

/** La phrase fixe du pont rebâti (GD-20, point 3) : la même pour toutes les terres, sans accord à faire. */
const PONT_REBATI = 'Le pont est rebâti.';
/**
 * Elle vient au moins tant de millisecondes après le toc (jamais en même temps), et reste écrite tant de millisecondes
 * par phrase. Le délai ne joue que dans la pose « d'un coup » (le toc et la fin dits ensemble) : après une pose animée,
 * le fondu de la brume dure plus longtemps et l'absorbe.
 */
const SAID_AFTER_MS = 450;
const SAID_MS = 4000;

/** Un petit écran : un téléphone, étroit ou couché (la même requête que `.open-world-said`, openWorld.css). */
const SMALL_SCREEN = '(max-width: 600px), (max-height: 500px)';
const smallScreen = () => typeof window.matchMedia === 'function' && window.matchMedia(SMALL_SCREEN).matches;
function subscribeSmallScreen(changed: () => void): () => void {
  const m = typeof window.matchMedia === 'function' ? window.matchMedia(SMALL_SCREEN) : null;
  m?.addEventListener('change', changed);
  return () => m?.removeEventListener('change', changed);
}
/** Vrai sur un petit écran, relu quand l'écran tourne ou change de taille. */
function useSmallScreen(): boolean {
  return useSyncExternalStore(subscribeSmallScreen, smallScreen);
}

/** L'écart entre « Y aller », sa bulle, la colonne de Kéo et les autres boutons, en pixels. */
const GO_GAP = 10;

/** Une bulle à côté de « Y aller » n'a pas plus de lignes : plus haute, elle passe au-dessus de lui, ou en haut. */
const BESIDE_LINES = 3;

/** La bulle n'est jamais plus étroite, en rem : plus étroite, elle passe ailleurs. */
const BUBBLE_MIN = 8;

/**
 * Pose la rangée du bas et sa bulle sans couvrir Kéo (choix du mainteneur, 23 octobre 2026 : la caméra ne bouge pas, ce
 * sont elles qui s'adaptent à l'écran et à la taille du texte). « Y aller » reste en bas
 * au milieu tant qu'il tient sous les pieds de Kéo ; plus haut (un grand texte, un téléphone), il passe en bas à
 * droite, loin de Kéo (`data-go-cote`). Sa bulle se pose à droite de lui (`data-go-bulle="cote"`), ou au-dessus de lui
 * quand il est en bas à droite (`dessus`), sinon en haut de l'écran entre les colonnes de boutons (`haut`) : la première
 * place qui ne couvre ni Kéo ni un bouton, qui tient dans l'écran et, à côté, en trois lignes au plus. Chaque essai
 * se mesure aussitôt (la mise en page se fait à la lecture, rien ne s'affiche entre deux essais) : pour un même écran,
 * un même texte et les mêmes réglages, la même place, toujours.
 */
function placeGoRow(stage: HTMLElement, s: DOMRect, carte: DOMRect | undefined): void {
  const go = stage.querySelector<HTMLElement>('.open-world-go');
  if (!go) return;
  const { box, zone, beside } = placeGo(stage, go, s, carte);
  placeBubble(stage, go, s, box, zone, beside);
}

/** Un rectangle de l'écran dans la scène `s`. */
const inStage = (r: DOMRect, s: DOMRect): ScreenRect => ({ left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height });

/** Pose un attribut d'état de la scène (`''` l'ôte), sans y toucher s'il n'a pas changé. */
function setStageFlag(stage: HTMLElement, key: 'goCote' | 'goBas' | 'goLeve' | 'goBulle', value: string): void {
  if ((stage.dataset[key] ?? '') === value) return;
  if (value) stage.dataset[key] = value;
  else delete stage.dataset[key];
}

/** Pose une variable de la scène (`null` l'ôte), sans y toucher si elle n'a pas changé. */
function setStageVar(stage: HTMLElement, name: string, px: number | null): void {
  const value = px === null ? '' : `${Math.round(px)}px`;
  if (stage.style.getPropertyValue(name) === value) return;
  if (value) stage.style.setProperty(name, value);
  else stage.style.removeProperty(name);
}

/**
 * « Y aller » : au milieu ; en bas à droite s'il monte dans la colonne de Kéo. S'il y mord la colonne de la caméra (un
 * téléphone couché au plus grand texte), il descend au plus près du bas (`data-go-bas`), puis, s'il la mord encore,
 * passe à sa gauche (`--open-world-go-droite`). Renvoie sa place et la colonne de Kéo, la même aux quatre niveaux (la caméra ne la garde plus nulle part : choix du mainteneur, 23 octobre 2026).
 */
function placeGo(stage: HTMLElement, go: HTMLElement, s: DOMRect, carte: DOMRect | undefined) {
  // Levée au-dessus de « Carte » quand elle déborde sur lui (un écran étroit), lu à l'horizontale seulement.
  const lift = () => {
    const r = go.getBoundingClientRect();
    setStageFlag(stage, 'goLeve', carte && r.width > 0 && r.left < carte.right + MARK_EDGE - 1 ? 'oui' : '');
  };
  setStageFlag(stage, 'goCote', '');
  setStageFlag(stage, 'goBas', '');
  setStageVar(stage, '--open-world-go-droite', null);
  lift();
  const zone = keoZone(s.width, s.height, LOOK_UP.footRoom);
  const beside = overlaps(inStage(go.getBoundingClientRect(), s), zone);
  if (beside) {
    setStageFlag(stage, 'goCote', 'oui');
    // Sous la colonne de la caméra, au plus près du bas d'abord ; sinon à sa gauche.
    const camera = stage.querySelector<HTMLElement>('.open-world-camera')?.getBoundingClientRect();
    const underCamera = () => camera !== undefined && overlaps(inStage(go.getBoundingClientRect(), s), inStage(camera, s));
    if (underCamera()) setStageFlag(stage, 'goBas', 'oui');
    if (camera && underCamera()) {
      setStageFlag(stage, 'goBas', '');
      setStageVar(stage, '--open-world-go-droite', s.right - camera.left + GO_GAP);
    }
    lift();
  }
  return { box: go.getBoundingClientRect(), zone, beside };
}

/**
 * La bulle de « Y aller » : à sa droite (jusqu'au bord de l'écran, ou jusqu'à la colonne de la caméra), au-dessus de
 * lui quand il est en bas à droite, sinon en haut entre les colonnes de boutons ; la première place qui ne couvre ni
 * Kéo ni un bouton et tient dans l'écran, à côté en trois lignes au plus, et jamais plus étroite que `BUBBLE_MIN` rem.
 */
function placeBubble(stage: HTMLElement, go: HTMLElement, s: DOMRect, goBox: DOMRect, zone: ScreenRect, beside: boolean): void {
  const bubble = go.querySelector<HTMLElement>('.open-world-go-reason');
  if (!bubble) {
    setStageFlag(stage, 'goBulle', '');
    setStageVar(stage, '--open-world-bulle', null);
    return;
  }
  // Les boutons que la bulle ne couvre jamais, « Y aller » compris.
  const buttons = [...stage.querySelectorAll<HTMLElement>('.world-settings, .world-shortcuts, .open-world-camera, .open-world-bar, .open-world-go-row')].map((el) => inStage(el.getBoundingClientRect(), s));
  const camera = stage.querySelector<HTMLElement>('.open-world-camera')?.getBoundingClientRect();
  const style = getComputedStyle(bubble);
  // L'interligne des réglages, toujours en pixels ici (`line-height` posé par les réglages) ; sans lui, le compte des
  // lignes ne limite rien.
  const lineHeight = parseFloat(style.lineHeight) || 0;
  const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  const least = BUBBLE_MIN * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  const tries: { place: 'cote' | 'dessus'; width: number }[] = beside
    ? [{ place: 'dessus', width: goBox.right - s.left - (zone.left + zone.width + GO_GAP) }]
    : [
        { place: 'cote', width: s.right - MARK_EDGE - (goBox.right + GO_GAP) },
        ...(camera ? [{ place: 'cote' as const, width: camera.left - GO_GAP - (goBox.right + GO_GAP) }] : []),
      ];
  for (const { place, width } of tries) {
    if (width < least) continue;
    setStageVar(stage, '--open-world-bulle', width);
    setStageFlag(stage, 'goBulle', place);
    const r = inStage(bubble.getBoundingClientRect(), s);
    const inside = r.left >= 0 && r.top >= 0 && r.left + r.width <= s.width && r.top + r.height <= s.height;
    const short = place !== 'cote' || lineHeight <= 0 || Math.round((bubble.clientHeight - padding) / lineHeight) <= BESIDE_LINES;
    if (inside && short && !overlaps(r, zone) && !buttons.some((o) => overlaps(r, o))) return;
  }
  setStageVar(stage, '--open-world-bulle', null);
  setStageFlag(stage, 'goBulle', 'haut');
}

/** La dernière place posée de chaque cadenas. */
const lockTransforms = new WeakMap<HTMLElement, string>();

/** La distance de la marque en mots, pour la voix : un, deux ou trois points. */
const DISTANCE_WORDS = { 1: 'tout près', 2: 'pas loin', 3: 'loin' } as const;

/** L'écart minimal entre la marque et le bord de l'écran ou un bouton, en pixels. */
const MARK_EDGE = 8;

/** Ce que la marque laisse en plus autour de la rangée du bas, au-delà de `MARK_EDGE`. */
const GO_CLEAR = 8;

/** La zone de la colonne des accès directs que la marque évite : sa largeur au moins, et sa marge sous la colonne. */
const COLUMN_ZONE = { width: 72, below: 16 } as const;

/**
 * Pose la marque à l'écran, image par image, sans passer par React et sans lire la mise en page (les dimensions sont
 * relues par le `ResizeObserver`) : sur son lieu, au-dessus du point, ou au bord, sa flèche tournée vers lui et la
 * distance en points dessous ; le panneau reste entier à l'écran et hors des boutons Réglages et « Y aller ».
 */
function placeMark(
  mark: HTMLElement | null,
  arrow: HTMLElement | null,
  m: MarkOnScreen | null,
  size: { width: number; height: number; markW: number; markH: number; obstacles: Obstacle[]; mark: ScreenRect & { shown: boolean } },
): void {
  // Là où la marque est posée, pour les pastilles qui l'évitent (HabitantSigns.tsx, `clearSign`) : écrit sur place.
  size.mark.shown = false;
  if (!mark) return;
  mark.hidden = !m;
  if (!m) return;
  mark.classList.toggle('hors-champ', !m.inside);
  const far = String(m.far);
  if (mark.dataset.loin !== far) mark.dataset.loin = far;
  const { markW: w, markH: h } = size;
  // Hors champ, centrée sur son point ; dans l'écran, au-dessus de lui, ou à sa droite (à côté de la lanterne du Phare).
  const box = !m.inside
    ? { left: m.x - w / 2, top: m.y - h / 2, width: w, height: h }
    : m.beside
      ? { left: m.x + MARK_EDGE, top: m.y - h / 2, width: w, height: h }
      : { left: m.x - w / 2, top: m.y - h, width: w, height: h };
  // Au Port : jamais sous la ligne de toit (ni sur un cartouche ni sur une porte), jamais sur Kéo ; elle remonte.
  if (m.inside) {
    let limit = m.ceiling ?? Infinity;
    if (m.keo && box.left < m.keo.left + m.keo.width && m.keo.left < box.left + w) limit = Math.min(limit, m.keo.top - MARK_EDGE);
    if (box.top + h > limit) box.top = limit - h;
  }
  // Les repères du niveau (au 3e, le Fanal, le pic, le zeppelin ; relecture du Cirque, correction 8) : hors champ, la
  // marque glisse le long du bord pour s'en écarter, les boutons gardant le dernier mot ; une marque lointaine qui ne peut
  // que les couvrir s'efface (sa flèche aussi), et revient dès qu'elle tient à côté.
  const landmarks = m.landmarks ?? [];
  const r = keepClear(box, m.inside ? size.obstacles : [...landmarks, ...size.obstacles], size.width, size.height, MARK_EDGE, MARK_EDGE);
  const covers = m.far === 3 && landmarks.some((l) => r.left < l.left + l.width && l.left < r.left + w && r.top < l.top + l.height && l.top < r.top + h);
  const efface = covers ? 'oui' : 'non';
  if (mark.dataset.efface !== efface) mark.dataset.efface = efface;
  size.mark.left = r.left;
  size.mark.top = r.top;
  size.mark.width = w;
  size.mark.height = h;
  size.mark.shown = !covers;
  mark.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
  if (arrow) arrow.style.transform = m.inside ? '' : `rotate(${m.angle}rad)`;
}
