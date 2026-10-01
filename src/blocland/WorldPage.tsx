import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { useMoinsDAnimations } from '../core/mouvement';
import { NotFoundPage } from '../pages/NotFoundPage';
import { estIleLv2, getBiome, type BiomeId } from './biomes';
import type { QuestMark } from './world/view';
import { useBlocland } from './BloclandContext';
import { ArchipelsSheet } from './ArchipelsSheet';
import { InventorySheet } from './Inventory';
import { IslandSheet } from './IslandSheet';
import { SCHOOL_PATH, SCHOOL_TITLE, SchoolSheet } from './School';
import { MonumentSheet, MonumentsSheet } from './Monuments';
import { useMonumentBuilder } from './useMonumentBuilder';
import { getMonument, monumentsOf } from './world/monuments';
import { MenuSheet } from './MenuSheet';
import { ArchipelSwitcher } from './ArchipelSwitcher';
import { useBackOpensMenu } from './useBackOpensMenu';
import { TrophySheet } from './TrophySheet';
import { TROPHIES_PATH, trophies } from './trophies';
import { WorldCanvas } from './three';
import { Tutorial, hasSeenTutorial } from './Tutorial';
import { panneauReplie, retenirPanneauReplie } from './panneauReplie';
import { accueilDeLIle, decouverteDeLIle } from './decouvertes';
import { usePanneauDeLaCarte } from './usePanneauDeLaCarte';
import { usePlaceDesBulles } from './usePlaceDesBulles';
import { WhaleWordPanel, useWhaleWord } from './WhaleWord';
import { useAmbience } from './useAmbience';
import { VoyagePanel, voyageSentence } from './VoyagePanel';
import { playArrival, playBell, playBurner, playHorn, playReactor, playSail } from './sound';
import { RallumagePanel, toucherQuiSaute, useRallumage } from './Rallumage';
import { DEROULE } from './world/rallumage';
import { habillageDuMonde } from './habillage';
import { useTextes } from '../univers';
import {
  borneTouchee,
  capVers,
  embarquer,
  etapeDuVoyage,
  finDuTemps,
  ileDeLOuvrage,
  ilesDuModele,
  modeleDuMonde,
  nouveauVoyage,
  versLArrivee,
  voyageAJouer,
  type Voyage,
} from './world/modele';
import { VILLAGE_STAGES, villageStage } from './world/villageStage';
import { VEIL_MS, legTiming } from './world/voyage';
import { walkDuration } from './world/scene';
import { dispositionEnGrille, type BoutsDuTrajet } from './world/grille';
import type { Entite, Intention, Point } from './world/disposition';
import { resteDuTrajet } from './world/arrivee';
import type { Bonhomme } from './world/view';
import { isPlanDone, plansFor } from './world/plans';
import { Loading } from '../components/Loading';
import {
  creaturePlacements,
  guardianPlacements,
  vehiclePlacement,
  worldCubes,
} from './world/terrain';
import {
  KIND_NAME,
  archipelagoOf,
  getArchipelago,
  isBiomeUnlocked,
  remainingPath,
  type ArchipelagoId,
} from './world/archipelago';
import { stageTo } from './world/vehicle';
import { usePlanBuilder, type Burst } from './usePlanBuilder';
import { useVehicleBuilder } from './useVehicleBuilder';
import { UNIVERS } from '../core/univers';
import { useHoldCelebrations } from '../components/Celebrations';
import { useASuivre } from '../components/useASuivre';

const samePoint = (p: { x: number; y: number } | undefined, q: { x: number; y: number }) => Boolean(p) && p!.x === q.x && p!.y === q.y;

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran, un archipel à la fois (celui où se tient le bonhomme).
 * On touche une île : la caméra y vole et son panneau glisse depuis le bas (créature, missions, plan, Gardien, et sur le
 * port le Bloc-Navire) sans quitter le monde. On peut replier le panneau pour regarder l'île, puis le rouvrir, sans la
 * quitter. L'URL /aventure/:ile ouvre le panneau, pour revenir au même endroit après un exercice. /aventure/carte est la
 * Carte : tout l'archipel vu du ciel, un fanion sur le bonhomme ; on touche une île pour y aller. Embarquer sur le
 * Bloc-Navire change d'archipel (et de scène).
 */
export function WorldPage() {
  const { biomeId } = useParams();
  // « Voir le chantier » (bilan d'une mission) : la section du panneau à mettre en avant (plan, navire ou un ouvrage).
  const chantier = useSearchParams()[0].get('chantier');
  const navigate = useNavigate();
  const { settings, speak, stop } = useSettings();
  const univers = useUnivers();
  const reduceMotion = useMoinsDAnimations();
  const { state, moveTo, launch } = useBlocland();
  const { launchVoyage, progress } = useProgress();
  const mapOpen = biomeId === 'carte';
  // Les quatre archipels : un panneau HTML à la place de celui d'une île, le monde derrière.
  const mondeOpen = biomeId === 'monde';
  // « Mes blocs » : l'inventaire commenté, un panneau à la place de celui d'une île.
  const blocsOpen = biomeId === 'blocs';
  // L'école du village : ses trois portes, un panneau à la place de celui d'une île.
  const schoolOpen = biomeId === 'ecole';
  // Le menu du village (menu pause) : Reprendre, Continuer, les révisions, l'école, Missions, Succès, Réglages, Aide.
  const menuOpen = biomeId === 'menu';
  // La salle des trophées : un trophée par succès gagné dans le monde, le profil dans son panneau.
  const trophiesOpen = biomeId === 'trophees';
  // Le lieu du village ouvert (l'école ou la salle des trophées) : le bonhomme marche jusqu'à sa porte.
  const placeOpen = schoolOpen ? 'ecole' : trophiesOpen ? 'trophees' : null;
  // Les monuments : leur liste, ou un monument (son îlot au large, où la caméra va).
  const monumentsOpen = biomeId === 'monuments';
  const monument = biomeId ? getMonument(biomeId) : undefined;
  const panelOpen = mapOpen || mondeOpen || blocsOpen || schoolOpen || menuOpen || trophiesOpen || monumentsOpen || Boolean(monument);
  const island = biomeId && !panelOpen ? getBiome(biomeId) : undefined;
  // Le bonhomme : où il se tient ; l'archipel affiché est le sien.
  const at = state.village.at ?? 'foret';
  const archipelago = archipelagoOf(at);
  const a: ArchipelagoId = archipelago.classe;
  const trophyBlocks = useMemo(() => trophies(progress.badges), [progress.badges]);
  // Les sentinelles (lot 6) : dans un univers qui en a, et quand le monde les dessine (le rendu Archipéo), chaque
  // Gardien est là dès l'ouverture de son île, et celui qu'on vient de rallumer au défi attend le retour au village,
  // éteint, pour se rallumer sous les yeux de l'élève.
  const textes = useTextes();
  const [habillage] = useState(habillageDuMonde);
  const sentinelles = textes.sentinelles !== null && habillage.defi === 'sentinelle';
  const rallumage = useRallumage(state.progress, a, sentinelles);
  const eteints = rallumage.enAttente.join();
  const cubes = useMemo(
    () => worldCubes(a, state.progress, state.village, false, trophyBlocks, sentinelles),
    // La LV2 choisit les bornes de l'île de la LV2 (world/terrain.ts, `questStations`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, state.progress, state.village, trophyBlocks, sentinelles, settings.lv2],
  );
  const creatures = useMemo(
    () => [
      ...creaturePlacements(a, state.village.bridges),
      ...guardianPlacements(a, state.progress, state.village.bridges, sentinelles).map((c) => (eteints.split(',').includes(c.id) ? { ...c, beaten: false } : c)),
    ],
    [a, state.progress, state.village.bridges, sentinelles, eteints],
  );
  // La disposition en grille (world/grille.ts) : où sont les îles, les bornes, les ouvrages, et les trajets du bonhomme,
  // qui suit le sol et contourne arbres, bornes, maisons et créatures.
  const grille = useMemo(() => dispositionEnGrille(a, state.village.bridges, { cubes, creatures }), [a, state.village.bridges, cubes, creatures]);
  /** Où le bonhomme se tient sur une île (en cases du monde). */
  const seTenir = (id: BiomeId) => grille.versMonde(grille.seTenir(id));
  /**
   * Son chemin d'une île à une île ou à la porte d'un lieu, sur les ouvrages construits ; `null` s'il n'y en a pas. Vers
   * une île, il s'arrête en `arrivee` (la case du sol touchée) plutôt qu'à sa place ; il part de `depart` (là où il se
   * tient sur son île) plutôt que de sa place.
   */
  const chemin = (de: BiomeId, vers: Entite, bouts?: BoutsDuTrajet) => {
    const t = grille.trajet({ genre: 'ile', id: de }, vers, bouts);
    return t ? t.etapes.map(grille.versMonde) : null;
  };
  /** Un nouveau trajet part d'où le bonhomme se tient (la porte de l'école), pas forcément de la place de son île. */
  const fromHere = (prev: { x: number; y: number; z: number }[], route: { x: number; y: number; z: number }[]) => {
    const here = prev[prev.length - 1];
    if (!here || samePoint(here, route[0])) return route;
    const path = grille.raccord(here, route[0]);
    return path ? [...path, ...route.slice(1)] : [here, ...route];
  };
  // Le Bloc-Navire amarré au port de l'archipel : un objet à part, qui tangue.
  const vehicle = useMemo(() => vehiclePlacement(a, state.progress, state.village), [a, state.progress, state.village]);
  // Le panneau de l'île ouverte : replié, on reste sur l'île (la caméra aussi) ; il se rouvre à la demande. Replié, il
  // le reste après la Carte, un panneau du village ou un exercice (le monde se remonte) : panneauReplie.ts le retient.
  const [sheetOpen, setSheetOpen] = useState(() => !(island && panneauReplie() === island.id));
  /** Ouvrir ou replier le panneau de l'île ouverte, et le retenir. */
  const montrerLePanneau = (open: boolean) => {
    if (island) retenirPanneauReplie(open ? null : island.id);
    setSheetOpen(open);
  };
  // Aller sur une île (ou y revenir) : son panneau s'ouvre, même si c'est déjà l'île ouverte.
  const openIsland = (id: BiomeId) => {
    retenirPanneauReplie(null);
    setSheetOpen(true);
    navigate(`/aventure/${id}`);
  };
  // Fermer un panneau du village (Blocs, École, Trophées, Monuments) : retour au monde libre, sur l'île du bonhomme,
  // son panneau replié. Il se rouvre à la demande (le bouton de l'île dans la barre, ou un toucher sur l'île).
  const fermerLePanneau = () => {
    retenirPanneauReplie(at);
    navigate(`/aventure/${at}`);
  };
  // Les bornes de mission des îles de l'archipel, avec leur état : à faire, étoiles gagnées, ou fermée.
  // Le modèle du monde (world/modele.ts) : les îles, les bornes et leur état, en identifiants ; la grille dit où elles sont.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(state, a, textes.libelles), [a, state, settings.lv2, textes]);
  const quests = useMemo<QuestMark[]>(
    () =>
      modele.bornes.map((b) => ({
        id: b.id,
        biome: b.ile,
        typeId: b.mission,
        place: grille.placeDe({ genre: 'borne', id: b.id })!,
        state: b.etat,
      })),
    [modele, grille],
  );
  // La prochaine destination (la même que « Reprendre l'aventure » au menu), dite et marquée sur la Carte.
  const destination = modele.destination;
  const destinationText = `Prochaine destination : ${destination.name}. ${destination.text}`;
  // En grand texte, la phrase défile dans le panneau de la Carte : un repère dit qu'il y a une suite.
  // Le nom de chaque île ouverte de l'archipel, écrit au-dessus d'elle dans le monde ; sur la Carte, toutes les îles,
  // avec leur état en icône et en mot.
  const islandLabels = useMemo(
    () =>
      ilesDuModele(state, a)
        .filter((i) => mapOpen || i.ouverte)
        .map((i) => ({ id: i.id, text: i.nom, ...(mapOpen ? { state: { id: i.etat.id, name: textes.etatsDIle[i.etat.id] } } : {}) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, mapOpen, state.village.bridges, state.village.plans, state.progress, textes],
  );
  // Une borne touchée : sa mission si elle est jouable, sinon le panneau de son île (qui explique pourquoi).
  const onPickQuest = (id: BiomeId, typeId: string) => {
    if (borneTouchee(modele.bornes, id, typeId) === 'jouer') navigate(`/aventure/${id}/${typeId}`);
    else openIsland(id);
  };
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: island?.id ?? null, seq: 0 });
  // Tant que le tutoriel n'est pas vu, c'est le jour : une première minute lisible, même à 20 h. Ensuite, le réglage
  // « Vue du monde » : l'heure réelle, ou toujours le jour.
  const [jourDuTutoriel] = useState(() => !hasSeenTutorial('village-immersif'));
  const forceDay = jourDuTutoriel || settings.worldLight === 'jour';
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
  const ileDeLaBulle = useRef<BiomeId | null | undefined>(undefined);
  // Le mot de la baleine : aux grandes étapes de l'archipel, une fois le tutoriel fermé et hors voyage. Il attend un
  // instant (la fin d'une pose, d'une arrivée), puis la caméra cadre l'île concernée et la baleine passe au large.
  const [tutoDone, setTutoDone] = useState(() => hasSeenTutorial('village-immersif'));
  // Le mot de la baleine attend la fin des rallumages (« Tous les Gardiens… » vient après).
  const whale = useWhaleWord(state, a, tutoDone && rallumage.enAttente.length === 0);
  const [whaleOpen, setWhaleOpen] = useState<string | null>(null);
  const [whaleSeq, setWhaleSeq] = useState(0);
  // Le village de l'archipel monte d'un état pendant la séance (un plan, un ouvrage, un monument) : une phrase, lue à
  // voix haute, et une cloche. Rien n'est enregistré : l'état se déduit de la progression.
  const stageHere = archipelagoOf(state.village.at ?? 'foret').classe;
  const stageRank = villageStage(state.village, stageHere).rank;
  const lastStage = useRef({ a: stageHere, rank: stageRank });
  const [villageSaid, setVillageSaid] = useState<string | null>(null);
  useEffect(() => {
    const before = lastStage.current;
    lastStage.current = { a: stageHere, rank: stageRank };
    if (before.a !== stageHere || stageRank <= before.rank) return;
    const text = `Le village passe à l’état ${VILLAGE_STAGES[stageRank - 1].name} (${stageRank} sur 5). ${VILLAGE_STAGES[stageRank - 1].sight}`;
    // Après la phrase du plan ou de l'ouvrage qui vient de le faire monter.
    const timer = window.setTimeout(() => {
      setVillageSaid(text);
      if (settings.sounds) playBell();
      if (settings.autoRead) speak(frenchTypography(text));
    }, 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRank, stageHere]);
  // L'ouvrage touché dans le monde : on ouvre l'île ouverte qu'il touche, sa proposition mise en avant.
  const [highlight, setHighlight] = useState<string | null>(null);
  const onPickBridge = (id: string) => {
    const from = ileDeLOuvrage(id, state.village.bridges);
    if (!from) return;
    setHighlight(id);
    openIsland(from);
  };
  // Sur la Carte, l'île fermée touchée : on montre le chemin d'ouvrages qui y mène (balises dans le monde, liste ici).
  const [mapTarget, setMapTarget] = useState<BiomeId | null>(null);
  const remaining = useMemo(() => (mapTarget ? remainingPath(mapTarget, state.village.bridges) : []), [mapTarget, state.village.bridges]);
  const [destinationRef, destinationSuite] = useASuivre<HTMLSpanElement>(
    // La phrase n'existe que sans chemin à construire : la clé change quand elle apparaît.
    mapOpen && !(mapTarget && remaining.length) ? destinationText : null,
  );
  const trail = useMemo(() => (remaining.length ? remaining.flatMap((b) => grille.liaison(b.id).map((p) => grille.versIle(p))) : undefined), [remaining, grille]);
  const [replay, setReplay] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  // Revoir l'aide rouvre le tutoriel : comme la première fois, le reste attend qu'il soit fermé (DA-9).
  const revoirAide = () => {
    setTutoDone(false);
    setReplay((n) => n + 1);
  };
  useAmbience(forceDay);
  // La construction guidée de l'île ouverte : bouton du panneau ou case bleue touchée dans le monde ; et le chantier du
  // Bloc-Navire sur le port.
  const builder = usePlanBuilder(island?.id ?? archipelago.port);
  const ship = useVehicleBuilder(island?.id ?? archipelago.port);
  const monumentBuilder = useMonumentBuilder(monument ?? monumentsOf(a)[0]);
  // Les éclats : ceux du plan, du navire ou du monument, le dernier qui a bougé.
  const seqs = useRef({ plan: builder.burst.seq, ship: ship.burst.seq, monument: monumentBuilder.burst.seq, last: builder.burst as Burst });
  const now = { plan: builder.burst.seq, ship: ship.burst.seq, monument: monumentBuilder.burst.seq };
  if (ship.burst.seq !== seqs.current.ship) seqs.current = { ...now, last: ship.burst };
  else if (builder.burst.seq !== seqs.current.plan) seqs.current = { ...now, last: builder.burst };
  else if (monumentBuilder.burst.seq !== seqs.current.monument) seqs.current = { ...now, last: monumentBuilder.burst };
  const burst = useMemo(
    () => ({ ...seqs.current.last, seq: builder.burst.seq + ship.burst.seq + monumentBuilder.burst.seq }),
    [builder.burst, ship.burst, monumentBuilder.burst],
  );

  // Le voyage en cours (le Bloc-Navire) : le premier voyage vers un archipel (bouton « Embarquer » du port). Les voyages
  // déjà faits (retours, « Aller au port », liens et retours d'exercice vers une île d'un autre archipel, sélecteur
  // d'archipel) sont un fondu court (`hop`, plus bas). Une cinématique en deux temps : le départ dans cet archipel, puis, sous un voile, le changement
  // d'archipel et l'arrivée dans le suivant. Si le bonhomme n'est pas au port, il y marche d'abord (`approach`).
  // Arrivé au port d'en face, il marche jusqu'à l'île demandée (`dest`). Quand l'appareil demande moins d'animations : un écran
  // HTML fixe (le navire dessiné, la phrase, le bouton « Arriver »), puis le changement d'archipel d'un coup.
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [veil, setVeil] = useState(false);
  // L'élève a fait glisser la vue (la 3D le dit) : « Recentrer » la ramène à son cadrage, d'un appui (`recentrage`).
  const [vueDeplacee, setVueDeplacee] = useState(false);
  const [recentrage, setRecentrage] = useState(0);
  const timers = useRef<number[]>([]);
  const later = (f: () => void, ms: number) => timers.current.push(window.setTimeout(f, ms));
  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  // Un voyage déjà fait (retour, ou un archipel déjà atteint) : pas de cinématique, un fondu court vers l'île demandée,
  // et une ligne qui dit où l'on arrive. La cinématique reste pour le premier voyage vers un archipel.
  const [hopTo, setHopTo] = useState<ArchipelagoId | null>(null);
  const hop = (to: ArchipelagoId, dest: BiomeId) => {
    clearTimers();
    const land = () => {
      moveTo(dest);
      setWalk((w) => ({ route: [seTenir(dest)], seq: w.seq + 1 }));
      setFocus((f) => ({ island: dest, seq: f.seq + 1 }));
      setSheetOpen(true);
      if (biomeId !== dest) navigate(`/aventure/${dest}`);
    };
    setHopTo(to);
    later(() => setHopTo(null), 3500);
    if (reduceMotion) return land();
    setVeil(true);
    later(() => {
      land();
      later(() => setVeil(false), VEIL_MS / 3);
    }, VEIL_MS / 2);
  };
  const onBoard = (to: ArchipelagoId, back: boolean, dest: BiomeId = getArchipelago(to).port) => {
    if (back) return hop(to, dest);
    clearTimers();
    const trip = { to, from: a, back, dest, bridges: state.village.bridges, reduceMotion };
    if (reduceMotion) return setVoyage((v) => nouveauVoyage({ ...trip, approach: false }, v));
    const stage = etapeDuVoyage(to, back, state.village.bridges);
    const text = voyageSentence(to, back, a);
    if (settings.autoRead) speak(frenchTypography(text));
    // Le bonhomme n'est pas au port : il y marche d'abord, la caméra sur le port ; le départ suit.
    const port = archipelago.port;
    const route = at === port ? null : chemin(at, { genre: 'ile', id: port });
    if (route) {
      setWalk((w) => ({ route, seq: w.seq + 1 }));
      moveTo(port);
      setFocus((f) => ({ island: port, seq: f.seq + 1 }));
      setVoyage((v) => nouveauVoyage({ ...trip, approach: true }, v));
      later(() => sail(stage, back), walkDuration(route));
      return;
    }
    if (at !== port) {
      // Pas de chemin d'ouvrages jusqu'au port : il s'y trouve directement.
      moveTo(port);
      setWalk((w) => ({ route: [seTenir(port)], seq: w.seq + 1 }));
    }
    setVoyage((v) => nouveauVoyage({ ...trip, approach: false }, v));
    horn(stage, back);
  };
  /** Le départ commence : le bonhomme est au port, il embarque. */
  const sail = (stage: 1 | 2 | 3, back: boolean) => {
    clearTimers();
    setVoyage(embarquer);
    horn(stage, back);
  };
  const horn = (stage: 1 | 2 | 3, back: boolean) => {
    if (!settings.sounds) return;
    playHorn();
    later(() => (stage === 1 ? playSail : stage === 2 ? playBurner : playReactor)(), legTiming('depart', back).walk);
  };
  /** Le voyage est fait : l'état change (le voyage reste fait, le bonhomme est au port d'en face). */
  const applyArrival = (v: { to: ArchipelagoId; back: boolean }): BiomeId => {
    const port = getArchipelago(v.to).port;
    if (v.back) moveTo(port);
    else {
      const stage = stageTo(v.to);
      const r = stage ? launch(stage) : null;
      if (stage && r?.ok) launchVoyage(stage.reward.xp);
    }
    return port;
  };
  /** Au port d'en face : le bonhomme débarque, puis marche jusqu'à l'île demandée, dont le panneau s'ouvre. */
  const finish = (port: BiomeId, dest: BiomeId) => {
    clearTimers();
    setVoyage(null);
    setVeil(false);
    const route = dest === port ? null : chemin(port, { genre: 'ile', id: dest });
    setWalk((w) => ({ route: route ?? [seTenir(dest)], seq: w.seq + 1 }));
    if (dest !== port) moveTo(dest);
    setSheetOpen(true);
    setFocus((f) => ({ island: dest, seq: f.seq + 1 }));
    if (biomeId !== dest) navigate(`/aventure/${dest}`);
    if (settings.sounds) playArrival();
  };
  // L'écran fixe : « Arriver ».
  const arrive = () => {
    if (!voyage) return;
    finish(applyArrival(voyage), voyage.dest);
  };
  // La cinématique : la fin d'un temps (ou un toucher, une touche : on arrive tout de suite).
  const onLegEnd = () => {
    const next = finDuTemps(voyage);
    if (!voyage || !next) return;
    // Encore en route vers le port : un toucher le fait embarquer tout de suite.
    if (next === 'embarquer') return sail(voyage.stage, voyage.back);
    clearTimers();
    if (next === 'changer-d-archipel') {
      // Sous le voile : l'archipel change (la scène est reconstruite), puis l'arrivée se joue dans le nouveau.
      setVeil(true);
      later(() => {
        const port = applyArrival(voyage);
        // La caméra et le bonhomme passent au port d'en face : la scène nouvelle s'ouvre sur lui, pas sur la mer.
        setFocus((f) => ({ island: port, seq: f.seq + 1 }));
        setWalk((w) => ({ route: [seTenir(port)], seq: w.seq + 1 }));
        setVoyage(versLArrivee);
        later(() => setVeil(false), VEIL_MS / 3);
      }, VEIL_MS / 2);
    } else finish(getArchipelago(voyage.to).port, voyage.dest);
  };
  // Entrée, Espace ou Échap pendant le voyage : on arrive tout de suite (le canvas fait pareil quand il a le focus).
  useEffect(() => {
    if (!voyage || voyage.mode !== 'cinema') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onLegEnd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg, voyage?.mode, voyage?.approach]);

  // Le bonhomme : où il se tient, et son itinéraire quand on ouvre une autre île ouverte (il y marche).
  // La position fine ne se sauvegarde pas : à la reprise, il est à sa place.
  const [walk, setWalk] = useState<Bonhomme<Point>>(() => ({ route: [seTenir(at)], seq: 0 }));
  /** La case du sol où l'élève l'a envoyé sur son île (il y reste, sans revenir à sa place), ou `null`. */
  const flanee = useRef<Point | null>(null);
  /** Une autre île touchée sur le sol : la case touchée, que l'effet du changement d'île lit (et où il en était en route). */
  const arriveeDemandee = useRef<{ ile: BiomeId; sol: Point; enRoute?: Point } | null>(null);
  // Les vues reçoivent le trajet en ancrages : chaque point dans le repère de l'île la plus proche. Une disposition
  // à part, qui ne dépend que de l'archipel : `grille` change avec les cubes, et le bonhomme repartirait à chaque bloc posé.
  const repere = useMemo(() => dispositionEnGrille(a), [a]);
  const avatar = useMemo(() => ({ ...walk, route: walk.route.map((p) => repere.versIle(p)) }), [walk, repere]);

  // L'île de l'URL est cadrée (vol) à chaque changement ; le bonhomme s'y rend si un chemin d'ouvrages y mène.
  // Une île ouverte d'un autre archipel (« Aller au port », lien, retour d'exercice) : le Bloc-Navire y mène (voyage).
  // Une île d'un archipel pas encore atteint : la scène reste, la caméra cadre le port (le chantier du navire).
  useEffect(() => {
    // La case du sol touchée sur cette île (onIsland), lue une fois : elle ne vaut que pour ce changement d'île.
    const demande = arriveeDemandee.current;
    arriveeDemandee.current = null;
    // Pendant un voyage, rien ne change de cap : à l'arrivée, on va à l'île demandée au départ.
    if (voyage) return;
    // Le panneau replié de cette île le reste ; sur une autre île, le sien s'ouvre (et l'ancien repli s'oublie).
    const plier = island ? panneauReplie() === island.id : false;
    if (island && !plier) retenirPanneauReplie(null);
    setSheetOpen(!plier);
    // La bulle de la créature s'efface quand l'île change, pas à chaque passage : sous StrictMode, l'effet joué deux
    // fois garde la découverte dite au premier (elle n'est dite qu'une fois par appareil).
    if (ileDeLaBulle.current !== (island?.id ?? null)) {
      ileDeLaBulle.current = island?.id ?? null;
      setSaid(null);
    }
    if (!island) setHighlight(null);
    if (!mapOpen) setMapTarget(null);
    const cap = island ? capVers(island.id, a, state.village.bridges) : 'archipel';
    if (cap === 'port') {
      setFocus((f) => ({ island: archipelago.port, seq: f.seq + 1 }));
      return;
    }
    if (island && cap === 'voyage') {
      onBoard(archipelagoOf(island.id).classe, true, island.id);
      return;
    }
    // Un monument : la caméra va sur son îlot, au large ; le bonhomme reste où il est. Celui d'un autre archipel n'est
    // pas dans la scène : son panneau s'ouvre, la caméra revient au bonhomme.
    if (monument) {
      if (monument.archipelago === a) setFocus((f) => ({ island: monument.biome, spot: grille.placeDe({ genre: 'plan', id: monument.id })!, seq: f.seq + 1 }));
      else setFocus((f) => ({ island: null, seq: f.seq + 1 }));
      return;
    }
    // L'école ou la salle des trophées : le bonhomme marche jusqu'à sa porte, sur l'île de l'école de l'archipel.
    if (placeOpen) {
      const school = archipelago.school;
      setFocus((f) => ({ island: school, seq: f.seq + 1 }));
      const porte: Entite = { genre: 'lieu', id: placeOpen, ile: school };
      const route = chemin(at, porte) ?? chemin(school, porte)!;
      setWalk((w) => ({ route: fromHere(w.route, route), seq: w.seq + 1 }));
      moveTo(school);
      return;
    }
    setFocus((f) => ({ island: island?.id ?? null, seq: f.seq + 1 }));
    if (island) decouvrir(island.id, !plier);
    // Il va sur l'île : à sa place, ou à la case du sol touchée (la plus proche où il peut aller, sinon sa place). Déjà
    // sur l'île, à sa place ou là où l'élève l'a envoyé, il ne bouge pas.
    const touchee = island && demande?.ile === island.id ? demande : null;
    const but = island && touchee ? (grille.arrivee(island.id, touchee.sol, seTenir(island.id))?.case ?? seTenir(island.id)) : null;
    const ici = walk.route[walk.route.length - 1];
    const enPlace = samePoint(ici, seTenir(at)) || (flanee.current !== null && samePoint(ici, flanee.current));
    if (island && (island.id !== at || !enPlace || but) && isBiomeUnlocked(island.id, state.village.bridges)) {
      // Il part de là où il en est en route (`enRoute`), ou de la case où l'élève l'avait envoyé, sans repasser par sa place.
      const depart = touchee?.enRoute ?? (flanee.current && samePoint(ici, flanee.current) ? ici : undefined);
      // En route, `at` est déjà l'île où il allait (moveTo) : le trajet part de l'île où il se trouve, sans finir de
      // traverser l'ouvrage pour revenir sur ses pas.
      const de = touchee?.enRoute ? grille.ileEn(touchee.enRoute) : at;
      const route = chemin(de, { genre: 'ile', id: island.id }, { arrivee: but ?? undefined, depart });
      const vise = but ? { vise: true } : {};
      if (route) setWalk((w) => ({ route: fromHere(depart ? [depart] : w.route, route), seq: w.seq + 1, ...vise }));
      else setWalk((w) => ({ route: [but ?? seTenir(island.id)], seq: w.seq + 1 }));
      flanee.current = but;
      moveTo(island.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, mapOpen, placeOpen, monument?.id]);

  // Ce que le tutoriel ne dit plus, dit au moment où on le rencontre, une fois par appareil, par la créature de l'île :
  // les ouvrages au premier toucher d'une île pâle, le Bloc-Navire à la première arrivée au port (decouvertes.ts).
  function decouvrir(id: BiomeId, panneauOuvert: boolean) {
    const text = decouverteDeLIle(state, id, { port: archipelago.port, navire: Boolean(ship.stage), textes });
    if (!text) return;
    setSaid({ id, text });
    // Lue à la suite de ce que dit la créature à l'ouverture du panneau (l'indice d'île fermée, ou son accueil).
    const biome = getBiome(id);
    const avant = accueilDeLIle(state, id, Boolean(biome && estIleLv2(biome) && settings.lv2 === 'aucune'), textes);
    if (settings.autoRead) speak(frenchTypography(panneauOuvert ? `${avant} ${text}` : text));
  }

  useEffect(() => {
    if (island && chantier) setHighlight(chantier);
  }, [island?.id, chantier]);

  const whaleNext = voyage ? null : whale.word;
  useEffect(() => {
    if (!whaleNext) return setWhaleOpen(null);
    if (whaleOpen === whaleNext.id) return;
    const timer = window.setTimeout(() => {
      setWhaleOpen(whaleNext.id);
      setWhaleSeq((n) => n + 1);
      if (!island && !panelOpen) setFocus((f) => ({ island: whaleNext.island, seq: f.seq + 1 }));
    }, 1200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whaleNext?.id]);
  const whaleWord = whaleNext && whaleOpen === whaleNext.id ? whaleNext : null;
  const closeWhale = () => {
    whale.close();
    setWhaleOpen(null);
  };
  // Le moment du rallumage (lot 6) : hors voyage et sans panneau plein, une sentinelle après l'autre (trois au plus).
  // La caméra glisse vers elle, puis elle se rallume en fondu avec une cloche (une par retour) et son mot ; la vue reste
  // un instant, et l'élève reprend la main. Un toucher saute le moment : la sentinelle est allumée tout de suite.
  const [moment, setMoment] = useState<{ id: BiomeId; phase: 'camera' | 'fondu'; seq: number } | null>(null);
  const [motRallume, setMotRallume] = useState<BiomeId | null>(null);
  // La bulle du bas défile (grand texte, téléphone) : dit s'il reste du texte sous ses boutons (DA-25).
  const [bullesRef, bullesSuite] = useASuivre<HTMLDivElement>(whaleWord?.id ?? motRallume);
  usePlaceDesBulles(stageRef, !!voyage);
  usePanneauDeLaCarte(stageRef, mapOpen && !whaleWord && !motRallume, `${destinationText}|${mapTarget ?? ''}|${remaining.length}`);
  const clocheDuRetour = useRef(false);
  const aRallumer = !voyage && tutoDone && !panelOpen ? (rallumage.enAttente[0] ?? null) : null;
  // Un bandeau de récompense attend que le panneau ouvert se ferme (le tutoriel, le mot de la baleine, un rallumage, un
  // voyage), et aussi pendant l'instant qui précède le mot ou le rallumage attendu : il ne tombe jamais sur la phrase que
  // l'élève lit, ni ne s'affiche pour être caché aussitôt (DA-9).
  useHoldCelebrations(!tutoDone || !!voyage || !!whaleNext || !!aRallumer || !!moment || !!motRallume);
  useEffect(() => {
    if (!aRallumer || moment) return;
    const timer = window.setTimeout(
      () => {
        setMoment((m) => ({ id: aRallumer, phase: 'camera', seq: (m?.seq ?? 0) + 1 }));
        const spot = grille.placeDe({ genre: 'gardien', id: aRallumer });
        setFocus((f) => ({ island: aRallumer, ...(spot ? { spot } : {}), seq: f.seq + 1 }));
      },
      clocheDuRetour.current ? DEROULE.entreDeux : DEROULE.attente,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aRallumer, moment]);
  const direLeRallumage = (id: BiomeId) => {
    setMotRallume(id);
    if (!clocheDuRetour.current && settings.sounds) playBell();
    clocheDuRetour.current = true;
  };
  const finirLeRallumage = (id: BiomeId) => {
    rallumage.noterVu(id);
    setMoment(null);
  };
  useEffect(() => {
    if (!moment) return;
    const timer =
      moment.phase === 'camera'
        ? window.setTimeout(
            () => {
              setMoment({ ...moment, phase: 'fondu' });
              direLeRallumage(moment.id);
            },
            reduceMotion ? 0 : DEROULE.camera,
          )
        : window.setTimeout(() => finirLeRallumage(moment.id), reduceMotion ? DEROULE.reste : DEROULE.fondu + DEROULE.reste);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment?.seq, moment?.phase]);
  // Plus rien à rallumer : la prochaine fois, une cloche de nouveau.
  useEffect(() => {
    if (!rallumage.enAttente.length && !moment) clocheDuRetour.current = false;
  }, [rallumage.enAttente.length, moment]);
  const sauterLeRallumage = () => {
    if (!moment) return;
    if (moment.phase === 'camera') direLeRallumage(moment.id);
    finirLeRallumage(moment.id);
  };
  /** « Passer » (ou Échap, ou Entrée) : ce moment et ceux qui suivent, toutes les sentinelles allumées tout de suite. */
  const passerLesRallumages = () => {
    if (!moment) return;
    if (moment.phase === 'camera') direLeRallumage(moment.id);
    for (const id of rallumage.enAttente) rallumage.noterVu(id);
    setMoment(null);
  };
  useEffect(() => {
    if (!moment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter') return;
      // Entrée sur un bouton (« Écouter », « J’ai compris ») garde son rôle.
      if (e.key === 'Enter' && (e.target as Element | null)?.closest?.('button, a, input, select, textarea')) return;
      e.preventDefault();
      passerLesRallumages();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment?.seq, rallumage.enAttente.join()]);

  // Le bouton retour, dans le village sans panneau, ouvre le menu du village.
  useBackOpensMenu(!biomeId && !voyage, '/aventure/menu');

  if (biomeId && !panelOpen && !island) return <NotFoundPage />;
  const blocksTotal = Object.values(state.inventory).reduce((n, v) => n + (v ?? 0), 0);
  // La flèche « Commence ici » flotte sur la Forêt tant qu'aucune mission n'a été jouée ; sur le chantier du navire quand
  // le panneau du port est ouvert et qu'il reste des cases à poser.
  const shipyard = island && island.id === archipelago.port && ship.stage && ship.status && !ship.status.complete;
  // Sur la Carte, elle marque la prochaine destination.
  const flecheDuNavire = useMemo(
    () => repere.versIle({ x: vehicle.origin.x + 2, y: vehicle.origin.y + 5, z: vehicle.origin.z + 12 }, vehicle.port),
    [repere, vehicle.origin.x, vehicle.origin.y, vehicle.origin.z, vehicle.port],
  );
  const marker = shipyard
    ? flecheDuNavire
    : mapOpen
      ? destination.island
      : !island && a === '6e' && Object.keys(state.progress).length === 0
        ? 'foret'
        : null;
  // Le navire touché : le panneau du port, sa section Bloc-Navire mise en avant.
  const onPickVehicle = (port: BiomeId) => {
    setHighlight('navire');
    openIsland(port);
  };

  // Toucher le sol de l'île où il est : il y marche, jusqu'à la case touchée (ou la plus proche où il peut aller, sinon
  // sa place), un rond posé sur le but (sur sa case même, le rond seul, un court instant). Le panneau ne bouge pas (replié, il le reste) ni la caméra (pas de nouveau
  // cadrage, et une vue déplacée par un glissé le reste : « Recentrer » la ramène). En route (`enRoute`), le toucher
  // change son but sans attendre ; sur l'eau, ou sur son but même, il y arrive tout de suite.
  const flaner = (id: BiomeId, sol: Point, enRoute?: Point) => {
    const fin = walk.route[walk.route.length - 1];
    const arriver = () => setWalk((w) => ({ route: [fin], seq: w.seq + 1 }));
    if (enRoute && grille.surLEau(sol)) return arriver();
    const ici = enRoute ?? fin;
    const but = grille.arrivee(id, sol, ici)?.case ?? seTenir(id);
    if (enRoute && samePoint(but, fin)) return arriver();
    // Déjà sur cette case : il ne marche pas, le rond s'y pose un court instant (le toucher répond).
    if (!enRoute && samePoint(but, ici)) return setWalk((w) => ({ route: [ici], seq: w.seq + 1, flanerie: true, vise: true }));
    // Tout droit à pied si l'on peut ; sinon (au milieu d'un ouvrage), la fin du trajet en cours, puis à pied.
    const route = grille.raccord(ici, but) ?? (enRoute ? [...resteDuTrajet(walk.route, ici), ...(grille.raccord(fin, but) ?? [fin, but]).slice(1)] : [ici, but]);
    flanee.current = but;
    setWalk((w) => ({ route, seq: w.seq + 1, flanerie: true, vise: true }));
  };
  // Toucher une île : on y va (le bonhomme marche si un chemin y mène), jusqu'à la case du sol touchée s'il y en a une.
  // Sur la Carte, une île fermée montre son chemin. Sur l'île où l'on est, toucher le sol l'y fait marcher (`flaner`) ;
  // l'île choisie au clavier, le panneau replié, sa créature parle, pour que le geste réponde ; le bouton de l'île,
  // dans la barre du bas, rouvre le panneau.
  const onIsland = (id: BiomeId, sol?: Point, enRoute?: Point) => {
    if (mapOpen && !isBiomeUnlocked(id, state.village.bridges)) return setMapTarget(id);
    if (sol && !voyage && island?.id === id && at === id) return flaner(id, sol, enRoute);
    if (island?.id === id && !sheetOpen) return onCreature(id, 'creature');
    // Une autre île ouverte : l'effet du changement d'île l'y emmène, jusqu'à la case touchée.
    if (sol && island?.id !== id && isBiomeUnlocked(id, state.village.bridges)) arriveeDemandee.current = { ile: id, sol, ...(enRoute ? { enRoute } : {}) };
    openIsland(id);
  };
  // Ce que l'élève fait dans le monde : la vue renvoie une intention, la page décide.
  const onIntent = (i: Intention) => {
    switch (i.genre) {
      case 'ile':
        return onIsland(i.id, i.sol && grille.versMonde(i.sol), i.enRoute && grille.versMonde(i.enRoute));
      case 'borne':
        return onPickQuest(i.ile, i.mission);
      case 'lieu':
        return navigate(i.id === 'ecole' ? SCHOOL_PATH : i.id === 'trophees' ? TROPHIES_PATH : `/aventure/${i.id.slice('monument:'.length)}`);
      case 'ouvrage':
        return onPickBridge(i.id);
      case 'creature':
        return onCreature(i.id, i.gardien ? 'guardian' : 'creature');
      case 'navire':
        return onPickVehicle(i.port);
      case 'face':
        // En chantier : la case d'un plan de l'île, sinon du navire, sinon le sol touché (le bonhomme y va, comme pour
        // une île touchée), sinon on ouvre l'île touchée.
        if (island) builder.tryFill(i.ile, i.case) || ship.tryFill(i.ile, i.case) || onIsland(i.ile, i.sol && grille.versMonde(i.sol), i.enRoute && grille.versMonde(i.enRoute));
        return;
      case 'fin-du-voyage':
      case 'voyage-saute':
        return onLegEnd();
    }
  };
  const ouvrageLabel = (b: { kind: keyof typeof KIND_NAME; from: BiomeId; to: BiomeId; cost: number }) =>
    `${KIND_NAME[b.kind]} entre ${getBiome(b.from)?.name ?? b.from} et ${getBiome(b.to)?.name ?? b.to} (${b.cost} blocs)`;

  const onCreature = (id: BiomeId, kind: 'creature' | 'guardian') => {
    const biome = getBiome(id);
    if (!biome) return;
    if (kind === 'guardian') return navigate(`/aventure/${id}/gardien`);
    // La créature est ce qu'on touche d'abord sur une île : on ouvre son panneau (elle y accueille, à voix haute).
    // Sur son île, panneau ouvert ou replié, la toucher la fait parler.
    if (island?.id !== id) {
      setSaid(null);
      return openIsland(id);
    }
    const first = plansFor(id)[0];
    const home = first && isPlanDone(first, state.village.plans);
    const lines = home && Math.random() < 0.5 ? [textes.creatures[id].home] : textes.creatures[id].lines;
    const text = lines[Math.floor(Math.random() * lines.length)];
    setSaid({ id, text });
    if (settings.autoRead) speak(frenchTypography(text));
  };
  // Les bulles du haut (la Carte, les phrases du voyage, du village, d'une créature), une condition chacune.
  const ligneDuVoyage = voyage?.mode === 'cinema';
  // Une chose à la fois : le panneau de la Carte attend que le mot de la baleine ou du rallumage soit fermé (DA-25).
  const panneauDeLaCarte = mapOpen && !whaleWord && !motRallume;
  const phraseDuVillage = villageSaid && !whaleWord;
  const bulleEnHaut = Boolean(ligneDuVoyage || panneauDeLaCarte || hopTo || phraseDuVillage || said);
  /**
   * « Recentrer » : le focus passe d'abord au monde (le bouton va disparaître, le focus ne tombe pas sur la page), puis
   * la vue revient à son cadrage.
   */
  const recentrer = () => {
    stageRef.current?.querySelector<HTMLElement>('.voxel-canvas')?.focus();
    setRecentrage((n) => n + 1);
  };

  return (
    <div
      className={`world-page${(island && sheetOpen) || (panelOpen && !mapOpen) || voyage?.mode === 'panel' ? ' has-sheet' : ''}${whaleWord || motRallume ? ' bulle-ouverte' : ''}`}
    >
      <div className="world-stage" data-scene ref={stageRef} onPointerDownCapture={moment ? toucherQuiSaute(sauterLeRallumage) : undefined}>
        <Suspense fallback={<Loading className="world-loading" text="Chargement du village…" />}>
          <WorldCanvas
            archipelago={a}
            cubes={cubes}
            creatures={creatures}
            focus={focus}
            reduceMotion={reduceMotion}
            forceDay={forceDay}
            bridges={state.village.bridges}
            marker={marker}
            vehicle={vehicle}
            voyage={voyageAJouer(voyage)}
            avatar={avatar}
            map={mapOpen}
            home={at}
            trail={trail}
            quests={quests}
            islandLabels={voyage ? undefined : islandLabels}
            whalePass={whaleWord && !reduceMotion ? { island: whaleWord.island, seq: whaleSeq } : null}
            rallumage={moment?.phase === 'fondu' ? { id: moment.id, seq: moment.seq, dureeMs: DEROULE.fondu } : null}
            burst={burst}
            onIntent={onIntent}
            onVueDeplacee={setVueDeplacee}
            recentrage={recentrage}
            chantier={Boolean(island)}
            className="voxel-canvas-stage"
            label={`${UNIVERS[univers].nom} en 3D : les ${archipelago.name}, l’archipel de ${a}, ses îles reliées par des ouvrages à construire, et le Bloc-Navire au port`}
          />
        </Suspense>
        <div className={`world-veil${veil ? ' on' : ''}`} aria-hidden="true" />
        {/* Sous le bouton Menu : l'archipel où l'on est, et les autres déjà atteints, à un toucher. */}
        {!voyage && (
          <ArchipelSwitcher
            current={a}
            bridges={state.village.bridges}
            onGo={(to) => hop(to, getArchipelago(to).port)}
            onMore={() => navigate('/aventure/monde')}
          />
        )}
        {/* Le menu du village, toujours en haut à droite, comme la pause d'un jeu. */}
        {!voyage && (
          <button
            type="button"
            className="button world-menu-button"
            data-tuto="menu"
            data-couvre="bouton"
            aria-label="Menu"
            aria-pressed={menuOpen}
            aria-controls={menuOpen ? 'panneau-menu' : undefined}
            onClick={() => navigate(menuOpen ? '/aventure' : '/aventure/menu')}
          >
            <Icon name="pause" />
          </button>
        )}
        {/* Après un glissé : sous la colonne de droite (Pause, l'archipel), sans animation. Jamais sur une bulle du haut :
            le temps qu'elle est ouverte, il attend (la vue reste déplacée), et aucun bouton Fermer n'est couvert. */}
        {vueDeplacee && !voyage && !bulleEnHaut && (
          <button type="button" className="button world-recentrer" onClick={recentrer}>
            <Icon name="recentrer" /> Recentrer
          </button>
        )}
        <div className="world-overlay-top" data-couvre="scene">
          {ligneDuVoyage && (
            <div className="creature-line world-line voyage-line" role="status" aria-live="polite">
              <Syllabified text={voyageSentence(voyage.to, voyage.back, voyage.from)} />
              <SpeakButton text={voyageSentence(voyage.to, voyage.back, voyage.from)} compact />
              <button type="button" className="button" onClick={onLegEnd}>
                <Icon name="flag" /> Arriver
              </button>
            </div>
          )}
          {panneauDeLaCarte && (
            <div className="creature-line world-line world-map-line" role="status" aria-live="polite">
              {mapTarget && remaining.length ? (
                <>
                  <p>
                    <strong>Pour aller à {getBiome(mapTarget)?.name} :</strong> encore {remaining.length} ouvrage{remaining.length > 1 ? 's' : ''} à construire.
                  </p>
                  <ol className="world-map-path">
                    {remaining.map((b) => (
                      <li key={b.id}>{ouvrageLabel(b)}</li>
                    ))}
                  </ol>
                  <button type="button" className="button" onClick={() => onPickBridge(remaining[0].id)}>
                    <Icon name="hammer" /> Voir le premier ouvrage
                  </button>
                </>
              ) : (
                <>
                  {/* Écouter hors de la fenêtre qui défile : en grand texte, elle ne montre que des lignes entières (DA-31). */}
                  <p className={`world-map-destination${destinationSuite ? ' a-suivre' : ''}`}>
                    <span className="world-map-speak">
                      <SpeakButton text={destinationText} compact />
                      {destinationSuite && <Icon name="chevronDown" className="world-map-suite" />}
                    </span>
                    <span className="world-map-texte" ref={destinationRef}>
                      <Syllabified text={destinationText} />
                    </span>
                  </p>
                  <p className="world-map-actions">
                    <button type="button" className="button primary" onClick={() => openIsland(destination.island)}>
                      <Icon name="play" /> Y aller
                    </button>
                    <button type="button" className="button" onClick={() => navigate('/aventure/monde')}>
                      <Icon name="ship" /> Les quatre archipels
                    </button>
                  </p>
                  {/* Les îles et leur état, en mots : ce que la Carte dessine sur chaque île, lisible sans la voir. */}
                  {/* À l'ouverture, le titre du pli vient en haut du panneau, entier (DA-31). */}
                  <details className="world-map-islands" onToggle={(e) => e.currentTarget.open && titreDuPliEnHaut(e.currentTarget)}>
                    <summary>Les îles et leur état</summary>
                    <ul>
                      {modele.iles.map((b) => {
                        const st = b.etat;
                        return (
                          <li key={b.id}>
                            <button type="button" className="world-map-island" onClick={() => onIsland(b.id)}>
                              <span className="world-map-island-name">{b.nom}</span>
                              <span className={`island-state island-state-${st.id}`}>
                                <Icon name={st.icon} /> {textes.etatsDIle[st.id]}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="world-map-islands-note">Une île pâle s’ouvre par un ouvrage.</p>
                  </details>
                </>
              )}
            </div>
          )}
          {hopTo && (
            <div className="creature-line world-line hop-line" role="status" aria-live="polite">
              <Icon name="ship" /> Archipel de {hopTo} : les {getArchipelago(hopTo).name}
            </div>
          )}
          {phraseDuVillage && (
            <div className="creature-line world-line" role="status" aria-live="polite">
              <Icon name="flag" /> <Syllabified text={villageSaid} />
              <SpeakButton text={villageSaid} compact />
              <button type="button" className="icon-button" aria-label="Fermer" onClick={() => setVillageSaid(null)}>
                <Icon name="close" />
              </button>
            </div>
          )}
          {said && (
            <div className="creature-line world-line" role="status" aria-live="polite">
              <strong>{getBiome(said.id)?.creature.name} :</strong> <Syllabified text={said.text} />
              <SpeakButton text={said.text} compact />
              <button type="button" className="icon-button" aria-label="Fermer"
                onClick={() => {
                  stop();
                  setSaid(null);
                }}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
        </div>
        {/* Les bulles d'aide en bas, au-dessus de la barre : elles ne cachent pas l'île et la flèche dont elles parlent. */}
        <div className="world-overlay-bottom" data-couvre="bulle" ref={bullesRef}>
          {/* « Passer » tant que le mot n'est pas là : ensuite, « J’ai compris » ferme le moment. */}
          {moment && !motRallume && (
            <button type="button" className="button rallumage-passer" onClick={passerLesRallumages}>
              <Icon name="play" /> Passer
            </button>
          )}
          {motRallume ? (
            <RallumagePanel id={motRallume} onClose={() => setMotRallume(null)} aSuivre={bullesSuite} />
          ) : (
            whaleWord && <WhaleWordPanel word={whaleWord} onClose={closeWhale} aSuivre={bullesSuite} />
          )}
          <Tutorial
            id="village-immersif"
            replay={replay}
            onClose={() => setTutoDone(true)}
            targets={[undefined, undefined, '[data-tuto="menu"]']}
            steps={[
              `${UNIVERS[univers].bienvenue} Touche la Forêt des sons, sous la flèche jaune.`,
              'Sur chaque île, les bornes à panneau sont les missions : touche une borne pour jouer. Un losange jaune flotte au-dessus d’une mission à faire, des cubes d’or comptent tes étoiles. Chaque mission te donne des blocs pour construire l’île.',
              'Le bouton Menu (⏸), en haut à droite, ouvre le menu : missions, succès, réglages, accueil.',
            ]}
          />
          </div>
        <nav className="world-bar" data-couvre="scene" aria-label="Village">
          {island && !voyage && (
            <button
              type="button"
              className="button"
              aria-pressed={sheetOpen}
              aria-controls={sheetOpen ? `panneau-${island.id}` : undefined}
              onClick={() => montrerLePanneau(!sheetOpen)}
              aria-label={sheetOpen ? `Replier le panneau de ${island.name}` : `Ouvrir le panneau de ${island.name}`}
            >
              <Icon name={island.icon} /> <span className="world-bar-text">{island.name}</span>
            </button>
          )}
          <button
            type="button"
            className="button"
            data-tuto="carte"
            aria-pressed={mapOpen}
            onClick={() => navigate(mapOpen ? (panneauReplie() === at ? `/aventure/${at}` : '/aventure') : '/aventure/carte')}
          >
            <Icon name="map" /> <span className="world-bar-text">Carte</span>
          </button>
          {!voyage && (
            <button
              type="button"
              className="button"
              aria-pressed={blocsOpen}
              aria-label="Mes blocs"
              data-tuto="blocs"
              aria-controls={blocsOpen ? 'panneau-blocs' : undefined}
              onClick={() => (blocsOpen ? fermerLePanneau() : navigate('/aventure/blocs'))}
            >
              <Icon name="blocks" /> <span className="world-bar-text">Blocs </span>
              <span className="world-bar-count">({blocksTotal})</span>
            </button>
          )}
          {!voyage && (
            <button
              type="button"
              className="button"
              aria-pressed={schoolOpen}
              aria-label={SCHOOL_TITLE}
              data-tuto="ecole"
              aria-controls={schoolOpen ? 'panneau-ecole' : undefined}
              onClick={() => (schoolOpen ? fermerLePanneau() : navigate(SCHOOL_PATH))}
            >
              <Icon name="school" /> <span className="world-bar-text">École</span>
            </button>
          )}
          <button type="button" className="button" onClick={revoirAide} aria-label="Revoir l’aide">
            <Icon name="help" />
          </button>
        </nav>
      </div>
      {voyage?.mode === 'panel' ? (
        <div className="island-sheet voyage-sheet">
          <VoyagePanel to={voyage.to} back={voyage.back} onArrive={arrive} />
        </div>
      ) : voyage ? null : mondeOpen ? (
        <ArchipelsSheet onClose={() => navigate('/aventure')} onGo={openIsland} />
      ) : blocsOpen ? (
        <InventorySheet onClose={fermerLePanneau} />
      ) : schoolOpen ? (
        <SchoolSheet onClose={fermerLePanneau} />
      ) : trophiesOpen ? (
        <TrophySheet onClose={fermerLePanneau} />
      ) : monumentsOpen ? (
        <MonumentsSheet onClose={fermerLePanneau} />
      ) : monument ? (
        <MonumentSheet builder={monumentBuilder} onClose={fermerLePanneau} />
      ) : menuOpen ? (
        <MenuSheet onClose={() => navigate('/aventure')} />
      ) : (
        island &&
        sheetOpen && (
          <IslandSheet
            biome={island}
            builder={builder}
            ship={ship}
            onBoard={onBoard}
            in3d
            onClose={() => montrerLePanneau(false)}
            highlight={highlight}
            onBuilt={(to) => {
              // La fête, c'est la transformation : la caméra vole jusqu'à l'île qui s'ouvre, et sa créature accueille.
              window.setTimeout(() => navigate(`/aventure/${to}`), 900);
            }}
          />
        )
      )}
    </div>
  );
}

/** Le pli ouvert : son titre en haut du panneau qui le porte, sans faire défiler la page (DA-31). */
function titreDuPliEnHaut(pli: HTMLElement) {
  const panneau = pli.closest<HTMLElement>('.world-overlay-top');
  if (panneau) panneau.scrollTop += pli.getBoundingClientRect().top - panneau.getBoundingClientRect().top;
}
