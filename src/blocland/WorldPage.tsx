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
import { getBiome, type BiomeId } from './biomes';
import type { QuestMark } from './world/view';
import { useBlocland } from './BloclandContext';
import { ArchipelsSheet } from './ArchipelsSheet';
import { InventorySheet } from './Inventory';
import { IslandSheet } from './IslandSheet';
import { creaturesQuiFontSigne, signesDesCreatures, usePlusTard } from './rappels';
import { sansCommandes, type Commande } from './world/commandes';
import { SCHOOL_PATH, SchoolSheet } from './School';
import { MonumentSheet, MonumentsSheet } from './Monuments';
import { useMonumentBuilder } from './useMonumentBuilder';
import { getMonument, monumentsOf } from './world/monuments';
import { MenuSheet } from './MenuSheet';
import { ArchipelSwitcher } from './ArchipelSwitcher';
import { useBackOpensMenu } from './useBackOpensMenu';
import { mesuresDemandees } from './rendu';
import { TrophySheet } from './TrophySheet';
import { AssemblageSheet } from './Assemblage';
import { ASSEMBLAGE_PATH } from './world/assemblage';
import { laDestinationEstLeNavire, lienDeLaDestination } from './world/destination';
import { nextGoalInfo } from './world/goals';
import { getCommande } from './world/commandes';
import { FicheDuMonde, type FicheOuverte } from './FicheDuMonde';
import { TROPHIES_PATH, trophies } from './trophies';
import { WorldCanvas } from './three';
import { Tutorial, hasSeenTutorial } from './Tutorial';
import { decouverteDeLIle } from './decouvertes';
import { usePanneauDeLaCarte } from './usePanneauDeLaCarte';
import { usePlaceDesBulles } from './usePlaceDesBulles';
import { WhaleWordPanel, useWhaleWord } from './WhaleWord';
import { RenommagePanel, useRenommage } from './Renommage';
import { useAmbience } from './useAmbience';
import { VoyagePanel, voyageSentence } from './VoyagePanel';
import { playArrival, playBell, playBurner, playDone, playHorn, playReactor, playSail, sonDePose } from './sound';
import { RallumagePanel, toucherQuiSaute, useRallumage } from './Rallumage';
import { DEROULE } from './world/rallumage';
import { habillageDuMonde } from './habillage';
import { useTextes } from '../univers';
import {
  capVers,
  embarquer,
  etapeDuVoyage,
  finDuTemps,
  ileDeLOuvrage,
  ilesDuModele,
  modeleDuMonde,
  etatsDesObjets,
  nouveauVoyage,
  versLArrivee,
  voyageAJouer,
  type Voyage,
} from './world/modele';
import { VILLAGE_STAGES, villageStage } from './world/villageStage';
import { VEIL_MS, legTiming } from './world/voyage';
import { walkDuration } from './world/scene';
import { dispositionEnGrille, type BoutsDuTrajet } from './world/grille';
import type { Entite, Intention, ObjetDeLaFiche, Point } from './world/disposition';
import { resteDuTrajet } from './world/arrivee';
import type { Bonhomme } from './world/view';
import { partiesDe, phraseDesPartiesPosees, prochainePartie, type Partie } from './world/parties';
import { prendreLaPose } from './poseAMontrer';
import { VAGUE, cubesDeLaVague, sansLaPartie } from './world/vague';
import { Loading } from '../components/Loading';
import {
  casesDesPlansDansLeMonde,
  casesDeLaPetiteConstructionDansLeMonde,
  creaturePlacements,
  guardianPlacements,
  vehiclePlacement,
  worldCubes,
} from './world/terrain';
import {
  KIND_NAME,
  archipelagoOf,
  getArchipelago,
  getBridge,
  isBiomeUnlocked,
  remainingPath,
  type ArchipelagoId,
} from './world/archipelago';
import { stageTo } from './world/vehicle';
import type { Burst } from './poseCaseParCase';
import { useVehicleBuilder } from './useVehicleBuilder';
import { UNIVERS } from '../core/univers';
import { useHoldCelebrations } from '../components/Celebrations';
import { useASuivre } from '../components/useASuivre';

/** Le temps laissé à la phrase « Partie posée » avant qu’un bandeau de récompense ne tombe (DA-9). */
const LAISSER_LIRE_LA_POSE_MS = 4000;

const samePoint = (p: { x: number; y: number } | undefined, q: { x: number; y: number }) => Boolean(p) && p!.x === q.x && p!.y === q.y;

declare global {
  interface Window {
    /** Ouvrir la fiche d'un objet, pour les captures (en développement, ou avec `?mesures`). */
    __dysappsFiche?: (objet: ObjetDeLaFiche) => void;
  }
}

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran, un archipel à la fois (celui où se tient le bonhomme).
 * On touche une île : la caméra y vole et son panneau glisse depuis le bas (créature, missions, plan, Gardien, et sur le
 * port le Bloc-Navire) sans quitter le monde. On peut replier le panneau pour regarder l'île, puis le rouvrir, sans la
 * quitter. L'URL /adventure/:ile ouvre le panneau, pour revenir au même endroit après un exercice. /adventure/map est la
 * Carte : tout l'archipel vu du ciel, un fanion sur le bonhomme ; on touche une île pour y aller. Embarquer sur le
 * Bloc-Navire change d'archipel (et de scène).
 */
export function WorldPage() {
  const { biomeId } = useParams();
  // « Voir le chantier » (bilan d'une mission) : la section du panneau à mettre en avant (plan, navire ou un ouvrage).
  const chantier = useSearchParams()[0].get('worksite');
  const navigate = useNavigate();
  const { settings, speak, stop } = useSettings();
  const univers = useUnivers();
  const reduceMotion = useMoinsDAnimations();
  const { state, moveTo, launch } = useBlocland();
  // La pose d'une partie en vague (GD-6, Blocland) : ses cases, absentes du monde jusqu'à ce que la vue les pose ; puis
  // la phrase « Partie posée : … » du panneau, une fois le dernier cube posé (ou l'écran touché).
  // La petite construction d'une commande livrée (GD-7, PR 3) se pose de la même vague : `commande`, sans partie.
  const [vague, setVague] = useState<{ seq: number; biome: BiomeId; parties: Partie[]; cases: Set<string>; commande?: string } | null>(null);
  const [partiesDites, setPartiesDites] = useState<{ biome: BiomeId; parties: Partie[]; toc: boolean; muet: boolean; seq: number } | null>(null);
  const { launchVoyage, progress } = useProgress();
  // La fiche de l'objet touché (lot 2 de « Toucher le monde ») : une seule à la fois, toujours à la même place.
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ficheSeq = useRef(0);
  const mapOpen = biomeId === 'map';
  // Les quatre archipels (`/adventure/world`) : un panneau HTML à la place de celui d'une île, le monde derrière. Plus
  // aucun lien du monde n'y mène (lot 2 de « Toucher le monde ») ; l'adresse reste.
  const mondeOpen = biomeId === 'world';
  // « Mes blocs » : l'inventaire commenté, un panneau à la place de celui d'une île.
  const blocsOpen = biomeId === 'stock';
  // L'école du village : ses trois portes, un panneau à la place de celui d'une île.
  const schoolOpen = biomeId === 'school';
  // Le menu du village (menu pause) : Reprendre, Continuer, les révisions, l'école, Missions, Succès, Réglages, Aide.
  const menuOpen = biomeId === 'menu';
  // La salle des trophées : un trophée par succès gagné dans le monde, le profil dans son panneau.
  const trophiesOpen = biomeId === 'trophies';
  // Le lieu où l'on assemble les blocs (GD-2), à côté de l'école.
  const assemblageOpen = biomeId === 'assembly';
  // Le lieu du village ouvert (l'école, la salle des trophées ou le lieu où l'on assemble) : le bonhomme marche jusqu'à sa porte.
  const placeOpen = schoolOpen ? 'school' : trophiesOpen ? 'trophies' : assemblageOpen ? 'assembly' : null;
  // Les monuments : leur liste, ou un monument (son îlot au large, où la caméra va).
  const monumentsOpen = biomeId === 'landmarks';
  const monument = biomeId ? getMonument(biomeId) : undefined;
  const panelOpen = mapOpen || mondeOpen || blocsOpen || schoolOpen || menuOpen || trophiesOpen || assemblageOpen || monumentsOpen || Boolean(monument);
  const island = biomeId && !panelOpen ? getBiome(biomeId) : undefined;
  // Le bonhomme : où il se tient ; l'archipel affiché est le sien.
  const at = state.world.place ?? 'french-6e-phonology';
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
  // Les commandes des habitants (GD-7, PR 3) : seulement dans un univers qui les montre (Blocland) ; ailleurs, le monde
  // se lit sans elles (ni petite construction, ni suggestion), la sauvegarde restant la même.
  const vu = useMemo(() => (textes.commandes ? state : sansCommandes(state)), [state, textes.commandes]);
  const cubes = useMemo(
    () => worldCubes(a, vu.progress, vu.world, false, trophyBlocks, sentinelles, habillage.atelier),
    // La LV2 choisit les bornes de l'île de la LV2 (world/terrain.ts, `questStations`) ; l'habillage (le lieu
    // d'assemblage) ne change pas tant que la page est montée (useState).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, vu.progress, vu.world, trophyBlocks, sentinelles, settings.lv2, habillage.atelier],
  );
  const creatures = useMemo(
    () => [
      ...creaturePlacements(a, state.world.links),
      ...guardianPlacements(a, state.progress, state.world.links, sentinelles).map((c) => (eteints.split(',').includes(c.id) ? { ...c, beaten: false } : c)),
    ],
    [a, state.progress, state.world.links, sentinelles, eteints],
  );
  // La créature qui se souvient (GD-4, étape 1) : celles dont l'île a des révisions dues font signe, sauf après « Plus tard ».
  const { remises } = usePlusTard();
  const revisions = useMemo(
    () => creaturesQuiFontSigne(state.spaced, state.world.links, a, remises, settings.lv2),
    [state.spaced, state.world.links, a, remises, settings.lv2],
  );
  // La disposition en grille (world/grille.ts) : où sont les îles, les bornes, les ouvrages, et les trajets du bonhomme,
  // qui suit le sol et contourne arbres, bornes, maisons et créatures.
  const grille = useMemo(() => dispositionEnGrille(a, state.world.links, { cubes, creatures }), [a, state.world.links, cubes, creatures]);
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
  const vehicle = useMemo(() => vehiclePlacement(a, state.progress, state.world), [a, state.progress, state.world]);
  // Le panneau de l'île ouverte, en plein écran par-dessus le monde : il ne s'ouvre que par son bouton dans la barre,
  // jamais tout seul (ni à l'arrivée sur une île, ni au retour d'un exercice ou de la Carte).
  const [sheetOpen, setSheetOpen] = useState(false);
  // Aller sur une île (ou y revenir) : le monde reste en plein écran, son panneau ne s'ouvre que par son bouton (décision
  // du mainteneur, 4 octobre 2026). `ouvrage` : la prochaine destination est un ouvrage (GD-7), mise en avant
  // (`worksite`) quand le panneau s'ouvre.
  const openIsland = (id: BiomeId, ouvrage?: string) => {
    // Un ouvrage, ou une commande prête (GD-7, PR 3) : la même mise en avant (`worksite`), dans son pli.
    navigate(lienDeLaDestination({ island: id, ouvrage }));
  };
  // Fermer un panneau du village (Blocs, École, Trophées, Monuments) : retour au monde, sur l'île du bonhomme.
  const fermerLePanneau = () => {
    navigate(`/adventure/${at}`);
  };
  // Les bornes de mission des îles de l'archipel, avec leur état : à faire, étoiles gagnées, ou fermée.
  // Le modèle du monde (world/modele.ts) : les îles, les bornes et leur état, en identifiants ; la grille dit où elles sont.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(vu, a, textes.archipels, textes.libelles), [a, vu, settings.lv2, textes]);
  // Ce qui donne au Gardien, au Bloc-Navire et aux chantiers en fantôme leur signe (l'or ou la pierre, world/affordance.ts).
  const etats = useMemo(() => etatsDesObjets(vu, a), [vu, a]);
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
  // Un seul signe par créature : sa commande prête et suggérée (GD-7, PR 3), sinon ses révisions (GD-4, étape 1).
  const signes = useMemo(() => signesDesCreatures(vu, a, revisions, destination.commande), [vu, a, revisions, destination.commande]);
  const destinationText = `Prochaine destination : ${destination.name}. ${destination.text}`;
  // Un ouvrage à construire (GD-7) : sur la Carte, la flèche se pose sur lui, avec l'icône d'un ouvrage, pas sur l'île
  // d'où il part (quatre ouvrages peuvent en partir) ; sur sa liaison, du côté de cette île.
  const flecheDeLOuvrage = useMemo(
    () => (destination.ouvrage ? { ouvrage: destination.ouvrage, depuis: destination.island } : null),
    [destination.ouvrage, destination.island],
  );
  // En grand texte, la phrase défile dans le panneau de la Carte : un repère dit qu'il y a une suite.
  // Le nom de chaque île ouverte de l'archipel, écrit au-dessus d'elle dans le monde ; sur la Carte, toutes les îles,
  // avec leur état en icône et en mot.
  const islandLabels = useMemo(
    () =>
      ilesDuModele(state, a)
        .filter((i) => mapOpen || i.ouverte)
        .map((i) => ({ id: i.id, text: i.nom, ...(mapOpen ? { state: { id: i.etat.id, name: textes.etatsDIle[i.etat.id] } } : {}) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, mapOpen, state.world.links, state.world.parts, state.progress, textes],
  );
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: island?.id ?? null, seq: 0 });
  // Tant que le tutoriel n'est pas vu, c'est le jour : une première minute lisible, même à 20 h. Ensuite, le réglage
  // « Vue du monde » : l'heure réelle, ou toujours le jour.
  const [jourDuTutoriel] = useState(() => !hasSeenTutorial('village-immersif'));
  const forceDay = jourDuTutoriel || settings.worldLight === 'day';
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
  const ileDeLaBulle = useRef<BiomeId | null | undefined>(undefined);
  // Le mot de la baleine : aux grandes étapes de l'archipel, une fois le tutoriel fermé et hors voyage. Il attend un
  // instant (la fin d'une pose, d'une arrivée), puis la caméra cadre l'île concernée et la baleine passe au large.
  const [tutoDone, setTutoDone] = useState(() => hasSeenTutorial('village-immersif'));
  // Le mot de la baleine attend la fin des rallumages (« Tous les Gardiens… » vient après).
  // Les nouveaux noms des archipels (GD-1), une fois par appareil : avant le mot des grandes étapes, un panneau à la fois.
  const renommage = useRenommage(tutoDone && rallumage.enAttente.length === 0 && !vague, 1200);
  const whale = useWhaleWord(state, a, tutoDone && rallumage.enAttente.length === 0 && !renommage.ouvert && !vague);
  const [whaleOpen, setWhaleOpen] = useState<string | null>(null);
  const [whaleSeq, setWhaleSeq] = useState(0);
  // Le village de l'archipel monte d'un état pendant la séance (un plan, un ouvrage, un monument) : une phrase, lue à
  // voix haute, et une cloche. Rien n'est enregistré : l'état se déduit de la progression.
  const stageHere = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  const stageRank = villageStage(state.world, stageHere).rank;
  const lastStage = useRef({ a: stageHere, rank: stageRank });
  const [villageSaid, setVillageSaid] = useState<string | null>(null);
  useEffect(() => {
    const before = lastStage.current;
    lastStage.current = { a: stageHere, rank: stageRank };
    if (before.a !== stageHere || stageRank <= before.rank) return;
    const text = `Le village passe à l’état ${VILLAGE_STAGES[stageRank - 1].name} (${stageRank} sur 5). ${VILLAGE_STAGES[stageRank - 1].sight}`;
    // Après la phrase du plan ou de l'ouvrage qui vient de le faire monter.
    const timer = window.setTimeout(() => {
      // À la suite de la phrase de la pose, s'il y en a une : jamais à sa place.
      setVillageSaid((avant) => (avant ? `${avant} ${text}` : text));
      if (settings.sounds) playBell();
      if (settings.autoRead) speak(frenchTypography(text));
    }, 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRank, stageHere]);
  // Le chantier mis en avant dans le panneau de l'île (« Voir le chantier », `?worksite=`).
  const [highlight, setHighlight] = useState<string | null>(null);
  // Sur la Carte, l'île fermée touchée : on montre le chemin d'ouvrages qui y mène (balises dans le monde, liste ici).
  const [mapTarget, setMapTarget] = useState<BiomeId | null>(null);
  const remaining = useMemo(() => (mapTarget ? remainingPath(mapTarget, state.world.links) : []), [mapTarget, state.world.links]);
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
  // Le chantier du Bloc-Navire sur le port, et celui d'un monument : case par case (bouton du panneau ou case bleue
  // touchée dans le monde). Le bâtiment de l'île, lui, se pose tout seul, une partie par mission réussie (GD-6).
  // La fiche du Bloc-Navire a le chantier du port, d'où qu'on la touche.
  const ship = useVehicleBuilder(fiche?.objet.genre === 'navire' ? archipelago.port : (island?.id ?? archipelago.port));
  const monumentBuilder = useMonumentBuilder(monument ?? monumentsOf(a)[0]);
  // Les éclats : ceux du navire ou du monument, le dernier qui a bougé.
  const seqs = useRef({ ship: ship.burst.seq, monument: monumentBuilder.burst.seq, last: ship.burst as Burst });
  const now = { ship: ship.burst.seq, monument: monumentBuilder.burst.seq };
  if (ship.burst.seq !== seqs.current.ship) seqs.current = { ...now, last: ship.burst };
  else if (monumentBuilder.burst.seq !== seqs.current.monument) seqs.current = { ...now, last: monumentBuilder.burst };
  const burst = useMemo(
    () => ({ ...seqs.current.last, seq: ship.burst.seq + monumentBuilder.burst.seq }),
    [ship.burst, monumentBuilder.burst],
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
      if (biomeId !== dest) navigate(`/adventure/${dest}`);
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
    const trip = { to, from: a, back, dest, bridges: state.world.links, reduceMotion };
    if (reduceMotion) return setVoyage((v) => nouveauVoyage({ ...trip, approach: false }, v));
    const stage = etapeDuVoyage(to, back, state.world.links);
    const text = voyageSentence(to, back, textes.archipels, a);
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
    setFocus((f) => ({ island: dest, seq: f.seq + 1 }));
    if (biomeId !== dest) navigate(`/adventure/${dest}`);
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
    // Une autre île, la Carte, un lieu : le panneau se referme, le monde reste en plein écran.
    setSheetOpen(false);
    // La bulle de la créature s'efface quand l'île change, pas à chaque passage : sous StrictMode, l'effet joué deux
    // fois garde la découverte dite au premier (elle n'est dite qu'une fois par appareil).
    if (ileDeLaBulle.current !== (island?.id ?? null)) {
      ileDeLaBulle.current = island?.id ?? null;
      setSaid(null);
    }
    if (!island) setHighlight(null);
    if (!mapOpen) setMapTarget(null);
    const cap = island ? capVers(island.id, a, state.world.links) : 'archipel';
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
    if (island) decouvrir(island.id);
    // Il va sur l'île : à sa place, ou à la case du sol touchée (la plus proche où il peut aller, sinon sa place). Déjà
    // sur l'île, à sa place ou là où l'élève l'a envoyé, il ne bouge pas.
    const touchee = island && demande?.ile === island.id ? demande : null;
    const but = island && touchee ? (grille.arrivee(island.id, touchee.sol, seTenir(island.id))?.case ?? seTenir(island.id)) : null;
    const ici = walk.route[walk.route.length - 1];
    const enPlace = samePoint(ici, seTenir(at)) || (flanee.current !== null && samePoint(ici, flanee.current));
    if (island && (island.id !== at || !enPlace || but) && isBiomeUnlocked(island.id, state.world.links)) {
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
  function decouvrir(id: BiomeId): boolean {
    const text = decouverteDeLIle(state, id, { port: archipelago.port, navire: Boolean(ship.stage), textes });
    if (!text) return false;
    setSaid({ id, text });
    if (settings.autoRead) speak(frenchTypography(text));
    return true;
  }

  // Un lien vers un chantier (« Voir le chantier », une puce de Blocs, « Y aller ») : le panneau ne s'ouvre plus tout
  // seul, c'est la fiche de l'objet qui répond, par-dessus le monde (le Bloc-Navire, un ouvrage, la créature qui
  // commande) ; le chantier reste mis en avant si l'élève ouvre le panneau. Une partie (`part`) : la vague, plus bas.
  useEffect(() => {
    if (!island || !chantier) return;
    setHighlight(chantier);
    const commande = getCommande(chantier);
    const objet: ObjetDeLaFiche | null =
      chantier === 'vehicle'
        ? { genre: 'navire', port: island.id }
        : getBridge(chantier)
          ? { genre: 'ouvrage', id: chantier }
          : commande
            ? { genre: 'creature', id: commande.biome }
            : null;
    if (objet) setFiche({ objet, seq: ++ficheSeq.current, saut: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, chantier]);

  // ---- La pose d'une partie en vague (GD-6, Blocland) : « Voir le bâtiment » arrive ici avec la pose à montrer, une
  // fois (poseAMontrer.ts). La caméra ne bouge pas ; les cases de la partie restent vides jusqu'à ce que la vague les
  // pose, couche par couche, un « clac » par couche ; puis le carillon et la phrase du panneau, écrite, avec « Écouter »
  // (elle n'est pas lue d'office : l'écran de fin l'a déjà lue). Un toucher sur la scène pose tout d'un coup ; un appui
  // sur Pause, l'archipel, Recentrer ou la barre garde son effet et pose la partie en silence. « Réduire les animations » :
  // posée d'un coup, un seul « clac » et le carillon. Rien n'est enregistré ici : la partie l'est déjà, à l'écran de fin.
  const [sonDeLaPose] = useState(() => sonDePose(habillage.pose));
  useEffect(() => {
    if (!island || chantier !== 'part' || habillage.pose !== 'geste') return;
    const parties = prendreLaPose(island.id);
    if (!parties) return;
    if (reduceMotion) direLaPose(island.id, parties, true);
    else setVague((v) => ({ seq: (v?.seq ?? 0) + 1, biome: island.id, parties, cases: casesDesPlansDansLeMonde(parties.flatMap((p) => p.cases)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, chantier]);
  // Une autre île ouverte pendant la pose : la partie est posée tout de suite, sans rien dire.
  useEffect(() => {
    if (vague && vague.biome !== island?.id) setVague(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id]);
  /**
   * La pose finie (ou touchée) : la partie entière dans le monde, la phrase en haut (et dans le panneau), puis le carillon. `muet` :
   * l'élève a pris un contrôle de la scène (Pause…), la phrase est là sans un son.
   */
  function direLaPose(biome: BiomeId, parties: Partie[], toc = false, muet = false) {
    setVague(null);
    // Le panneau de l'île ne s'ouvre plus tout seul : la phrase s'écrit en haut, par-dessus le monde, avec « Écouter ».
    // Écrite, avec « Écouter », pas relue d'office : l'écran de fin l'a déjà lue.
    setVillageSaid(phraseDesPartiesPosees(parties));
    setPartiesDites((d) => ({ biome, parties, toc, muet, seq: (d?.seq ?? 0) + 1 }));
    setPhraseALire(true);
  }
  // Le temps de lire la phrase : un bandeau de récompense attend encore (un message à la fois, DA-9).
  const [phraseALire, setPhraseALire] = useState(false);
  useEffect(() => {
    if (!phraseALire) return;
    const timer = window.setTimeout(() => setPhraseALire(false), LAISSER_LIRE_LA_POSE_MS);
    return () => window.clearTimeout(timer);
  }, [phraseALire, partiesDites?.seq]);
  useEffect(() => {
    if (!partiesDites || partiesDites.muet) return;
    const dire = () => {
      if (settings.sounds) playDone();
    };
    if (!partiesDites.toc) return dire();
    // Moins d'animations : un seul « clac », puis le carillon, sans qu'ils se couvrent.
    if (settings.sounds) sonDeLaPose();
    const timer = window.setTimeout(dire, VAGUE.finApresMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partiesDites?.seq]);
  /**
   * La vague finie, touchée ou interrompue. Une partie : sa phrase dans le panneau (`direLaPose`). Une petite construction
   * (GD-7, PR 3) : la section Commandes écrit sa phrase à la place de la ligne livrée, avec le carillon (sauf `muet`).
   */
  const finirLaVague = (muet = false) => {
    if (!vague) return;
    if (vague.commande === undefined) return direLaPose(vague.biome, vague.parties, false, muet);
    setVague(null);
    if (!muet && settings.sounds) playDone();
  };
  const onPose = (moment: 'couche' | 'finie') => {
    if (!vague) return;
    if (moment === 'couche') {
      if (settings.sounds) sonDeLaPose();
    } else finirLaVague();
  };
  const poserToutDUnCoup = () => finirLaVague();
  const poserEnSilence = () => finirLaVague(true);
  /**
   * « Livrer » (GD-7, PR 3) : la petite construction se pose chez la créature avec le geste d'une partie (GD-6), la caméra
   * immobile, cube par cube et couche par couche, un « clac » par couche, puis le carillon et, au même moment, la phrase
   * « posée » dans le panneau, à la place de la ligne livrée (directeur artistique ; la fête ne passe jamais sur elle).
   * « Réduire les animations », ou la vague sautée : posée d'un coup, la phrase tout de suite, un « clac » puis le
   * carillon. Rend `true` : le son est pris ici, la section n'en joue pas.
   */
  const poserLaCommande = (c: Commande): boolean => {
    if (habillage.pose !== 'geste') return false;
    const cases = casesDeLaPetiteConstructionDansLeMonde(c.biome, c.fixture);
    if (reduceMotion || !cases.size) {
      if (settings.sounds) {
        sonDeLaPose();
        // Annulé si la page se démonte avant (`later`).
        later(playDone, VAGUE.finApresMs);
      }
      return true;
    }
    setVague((v) => ({ seq: (v?.seq ?? 0) + 1, biome: c.biome, parties: [], cases, commande: c.id }));
    return true;
  };
  const cubesVus = useMemo(() => (vague ? sansLaPartie(cubes, vague.cases) : cubes), [cubes, vague]);
  const poseVue = useMemo(() => (vague ? { seq: vague.seq, cubes: cubesDeLaVague(cubes, vague.cases) } : null), [cubes, vague]);

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
  // Les nouveaux noms, hors voyage.
  const renommageOuvert = renommage.ouvert && !voyage;
  const [bullesRef, bullesSuite] = useASuivre<HTMLDivElement>(renommageOuvert ? 'renommage' : (whaleWord?.id ?? motRallume));
  usePlaceDesBulles(stageRef, !!voyage);
  usePanneauDeLaCarte(stageRef, mapOpen && !whaleWord && !motRallume && !renommageOuvert, `${destinationText}|${mapTarget ?? ''}|${remaining.length}`);
  const clocheDuRetour = useRef(false);
  const aRallumer = !voyage && tutoDone && !panelOpen ? (rallumage.enAttente[0] ?? null) : null;
  // Un bandeau de récompense attend que le panneau ouvert se ferme (le tutoriel, le mot de la baleine, un rallumage, un
  // voyage), et aussi pendant l'instant qui précède le mot ou le rallumage attendu : il ne tombe jamais sur la phrase que
  // l'élève lit, ni ne s'affiche pour être caché aussitôt (DA-9).
  useHoldCelebrations(!tutoDone || !!voyage || !!whaleNext || !!aRallumer || !!moment || !!motRallume || !!vague || phraseALire);
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
  /** Pause, l'archipel, Recentrer ou la barre pendant le moment : la sentinelle allumée, sans cloche ni mot. */
  const finirLeRallumageEnSilence = () => {
    if (moment) finirLeRallumage(moment.id);
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

  /** La croix ou Échap : la fiche se ferme, le focus revient au monde. */
  const fermerLaFiche = () => {
    setFiche(null);
    stageRef.current?.querySelector<HTMLElement>('.voxel-canvas')?.focus();
  };
  // La fiche se ferme quand s'ouvre la Carte, le menu, Blocs, un lieu ou le panneau de l'île.
  const panneauDeLIle = Boolean(island) && sheetOpen;
  useEffect(() => {
    if (panelOpen || panneauDeLIle) setFiche(null);
  }, [panelOpen, panneauDeLIle]);
  // Elle attend la fin d'un voyage et la fermeture des bulles du bas (tutoriel, mot de la baleine, rallumage, renommage).
  const ficheVue = fiche && !voyage && !panelOpen && !panneauDeLIle && tutoDone && !whaleWord && !motRallume && !renommageOuvert && !moment ? fiche : null;
  // Échap la ferme ; le focus revient au monde.
  useEffect(() => {
    if (!ficheVue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      fermerLaFiche();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(ficheVue)]);
  // La commande prête de la créature de la fiche, celle que montre sa plaque (la prochaine destination).
  const commandeDeLaFiche = useMemo(() => {
    if (fiche?.objet.genre !== 'creature' || !destination.commande) return undefined;
    const id = fiche.objet.id;
    const c = getCommande(destination.commande);
    return c && c.biome === id && signes.some((x) => x.id === id && x.bloc) ? c : undefined;
  }, [fiche, destination.commande, signes]);
  const vueDeLaFiche = useMemo(() => (ficheVue ? { objet: ficheVue.objet, seq: ficheVue.seq, saut: ficheVue.saut } : null), [ficheVue]);
  // Pour les captures (scripts/rendu/mesures.mjs, option `fiche`), en développement ou avec `?mesures` : ouvrir la
  // fiche d'un objet comme un toucher, le panneau de l'île replié, sans avoir à viser l'objet dans la scène.
  useEffect(() => {
    if (!(import.meta.env.DEV || mesuresDemandees())) return;
    const ouvrir = (objet: ObjetDeLaFiche) => {
      // Une île pâle : comme un toucher, avec la découverte la première fois.
      if (objet.genre === 'ile') return ouvrirLIlePaleRef.current(objet.id);
      setSheetOpen(false);
      setFiche({ objet, seq: ++ficheSeq.current, saut: true });
    };
    window.__dysappsFiche = ouvrir;
    return () => {
      if (window.__dysappsFiche === ouvrir) delete window.__dysappsFiche;
    };
  }, []);

  // Le bouton retour, dans le village sans panneau, ouvre le menu du village.
  useBackOpensMenu(!biomeId && !voyage, '/adventure/menu');

  if (biomeId && !panelOpen && !island) return <NotFoundPage />;
  const blocksTotal = Object.values(state.stock).reduce((n, v) => n + (v ?? 0), 0);
  // La flèche « Commence ici » flotte sur la Forêt tant qu'aucune mission n'a été jouée ; sur le chantier du navire quand
  // le panneau du port est ouvert et qu'il reste des cases à poser.
  const shipyard = island && island.id === archipelago.port && ship.stage && ship.status && !ship.status.complete;
  // Sur la Carte, elle marque la prochaine destination : son île, ou l'ouvrage qu'elle propose de construire.
  const flecheDuNavire = useMemo(
    () => repere.versIle({ x: vehicle.origin.x + 2, y: vehicle.origin.y + 5, z: vehicle.origin.z + 12 }, vehicle.port),
    [repere, vehicle.origin.x, vehicle.origin.y, vehicle.origin.z, vehicle.port],
  );
  const marker = shipyard
    ? flecheDuNavire
    : mapOpen
      ? (flecheDeLOuvrage ?? destination.island)
      : !island && a === '6e' && Object.keys(state.progress).length === 0
        ? 'french-6e-phonology'
        : null;

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
  /**
   * La fiche d'un objet touché (lot 2 de « Toucher le monde ») : elle remplace la fiche ouverte (une seule à la fois) et
   * replie le panneau de l'île (une chose à la fois en bas). Aucune pendant un voyage ni sur la Carte. `saut` : ouverte
   * autrement que d'un toucher sur l'objet, son signe saute ; `phrase` : ce que dit une créature ; `decouverte` : la
   * découverte d'une île pâle, dite la première fois.
   */
  const ouvrirFiche = (objet: ObjetDeLaFiche, options: Omit<FicheOuverte, 'objet' | 'seq' | 'saut'> & { saut?: boolean } = {}) => {
    if (voyage || mapOpen) return;
    if (island && sheetOpen) setSheetOpen(false);
    setFiche({ objet, seq: ++ficheSeq.current, saut: options.saut ?? false, ...(options.phrase ? { phrase: options.phrase } : {}), ...(options.decouverte ? { decouverte: options.decouverte } : {}) });
  };
  /** Aller sur une île sans ouvrir son panneau, et y ouvrir la fiche d'un objet (« Y aller », « Voir le premier ouvrage »). */
  const allerALaFiche = (ile: BiomeId, objet: ObjetDeLaFiche) => {
    setSheetOpen(false);
    setFiche({ objet, seq: ++ficheSeq.current, saut: true });
    navigate(`/adventure/${ile}`);
  };
  /** « Voir le premier ouvrage » (une île pâle, la Carte) : la fiche de cet ouvrage, depuis l'île ouverte qu'il touche. */
  const voirOuvrage = (id: string) => {
    const from = ileDeLOuvrage(id, state.world.links);
    if (!from) return;
    if (mapOpen) allerALaFiche(from, { genre: 'ouvrage', id });
    else ouvrirFiche({ genre: 'ouvrage', id }, { saut: true });
  };
  /** Une île pâle touchée : sa fiche, et une fois par appareil, la découverte des ouvrages dans la fiche, après l'indice. */
  const ouvrirLIlePale = (id: BiomeId) => {
    const decouverte = decouverteDeLIle(state, id, { port: archipelago.port, navire: Boolean(ship.stage), textes });
    ouvrirFiche({ genre: 'ile', id }, decouverte ? { decouverte } : {});
  };
  const ouvrirLIlePaleRef = useRef(ouvrirLIlePale);
  ouvrirLIlePaleRef.current = ouvrirLIlePale;
  // Toucher une île : on y va (le bonhomme marche si un chemin y mène), jusqu'à la case du sol touchée s'il y en a une.
  // Sur la Carte, une île fermée montre son chemin ; dans le monde, elle ouvre sa fiche. Sur l'île où l'on est, toucher
  // le sol l'y fait marcher (`flaner`), et ferme la fiche ouverte ; l'île choisie au clavier, le panneau replié, ouvre
  // la fiche de sa créature ; le bouton de l'île, dans la barre du bas, rouvre le panneau.
  const onIsland = (id: BiomeId, sol?: Point, enRoute?: Point) => {
    const ouverte = isBiomeUnlocked(id, state.world.links);
    if (mapOpen && !ouverte) return setMapTarget(id);
    if (sol && !voyage && island?.id === id && at === id) {
      setFiche(null);
      return flaner(id, sol, enRoute);
    }
    if (!mapOpen && !voyage && !ouverte) return ouvrirLIlePale(id);
    if (island?.id === id && !sheetOpen) return onCreature(id, 'creature');
    setFiche(null);
    // Une autre île ouverte : l'effet du changement d'île l'y emmène, jusqu'à la case touchée.
    if (sol && island?.id !== id && ouverte) arriveeDemandee.current = { ile: id, sol, ...(enRoute ? { enRoute } : {}) };
    openIsland(id);
  };
  // Ce que l'élève fait dans le monde : la vue renvoie une intention, la page décide. Une borne, le Gardien, le navire,
  // un ouvrage en fantôme, une créature : leur fiche (lot 2 de « Toucher le monde ») ; un lieu : son panneau.
  const onIntent = (i: Intention) => {
    switch (i.genre) {
      case 'ile':
        return onIsland(i.id, i.sol && grille.versMonde(i.sol), i.enRoute && grille.versMonde(i.enRoute));
      case 'borne':
        return ouvrirFiche({ genre: 'borne', id: `${i.ile}:${i.mission}` });
      case 'lieu':
        return navigate(
          i.id === 'school' ? SCHOOL_PATH : i.id === 'trophies' ? TROPHIES_PATH : i.id === 'assembly' ? ASSEMBLAGE_PATH : `/adventure/${i.id.slice('monument:'.length)}`,
        );
      case 'ouvrage':
        // Un ouvrage construit se touche comme le sol (la 3D ne le rend plus comme un ouvrage) : pas de fiche.
        if (state.world.links.includes(i.id)) return;
        return ouvrirFiche({ genre: 'ouvrage', id: i.id });
      case 'creature':
        return onCreature(i.id, i.gardien ? 'guardian' : 'creature');
      case 'navire':
        return ouvrirFiche({ genre: 'navire', port: i.port });
      case 'face':
        // En chantier : la case du navire (sa fiche s'ouvre, qui dit où il en est), sinon le sol touché (le bonhomme y
        // va, comme pour une île touchée), sinon on ouvre l'île touchée. Une case du bâtiment de l'île ne se pose plus à
        // la main (GD-6) : on y marche, comme au sol.
        if (!island) return;
        if (ship.tryFill(i.ile, i.case)) return ouvrirFiche({ genre: 'navire', port: i.ile });
        onIsland(i.ile, i.sol && grille.versMonde(i.sol), i.enRoute && grille.versMonde(i.enRoute));
        return;
      case 'fin-du-voyage':
      case 'voyage-saute':
        return onLegEnd();
      case 'arrivee':
        // Le bonhomme arrive tout de suite (la vue s'en charge) : aucun panneau n'attendait son arrivée.
        return;
    }
  };
  const ouvrageLabel = (b: { kind: keyof typeof KIND_NAME; from: BiomeId; to: BiomeId; cost: number }) =>
    `${KIND_NAME[b.kind]} entre ${getBiome(b.from)?.name ?? b.from} et ${getBiome(b.to)?.name ?? b.to} (${b.cost} blocs)`;

  /** Une créature ou un Gardien touchés : leur fiche ; la créature y dit une phrase (plus de bulle en haut). */
  const onCreature = (id: BiomeId, kind: 'creature' | 'guardian') => {
    const biome = getBiome(id);
    if (!biome) return;
    if (kind === 'guardian') return ouvrirFiche({ genre: 'gardien', id });
    // Le bâtiment fini (toutes ses parties posées), la créature y habite : une fois sur deux, elle le dit.
    const home = partiesDe(id).length > 0 && prochainePartie(id, state.world.parts) === null;
    const lines = home && Math.random() < 0.5 ? [textes.creatures[id].home] : textes.creatures[id].lines;
    ouvrirFiche({ genre: 'creature', id }, { phrase: lines[Math.floor(Math.random() * lines.length)] });
  };
  /**
   * « Y aller » de la Carte : la fiche de la destination quand c'est un objet (un ouvrage, le Bloc-Navire), sur son île,
   * le panneau replié ; sinon le panneau de son île (une commande prête : sur sa ligne).
   */
  const allerALaDestination = () => {
    if (destination.ouvrage) return allerALaFiche(destination.island, { genre: 'ouvrage', id: destination.ouvrage });
    if (laDestinationEstLeNavire(destination, nextGoalInfo(state, archipelago.port, textes.archipels, textes.libelles)))
      return allerALaFiche(archipelago.port, { genre: 'navire', port: archipelago.port });
    openIsland(destination.island, destination.commande);
  };
  // Les bulles du haut (la Carte, les phrases du voyage, du village, d'une créature), une condition chacune.
  const ligneDuVoyage = voyage?.mode === 'cinema';
  // Une chose à la fois : le panneau de la Carte attend que le mot de la baleine ou du rallumage soit fermé (DA-25).
  const panneauDeLaCarte = mapOpen && !whaleWord && !motRallume && !renommageOuvert;
  // Une chose à la fois : la phrase du village et celle d'une créature attendent que la fiche ouverte soit fermée.
  const phraseDuVillage = villageSaid && !whaleWord && !renommageOuvert && !ficheVue;
  const phraseDeCreature = said && !ficheVue ? said : null;
  const bulleEnHaut = Boolean(ligneDuVoyage || panneauDeLaCarte || hopTo || phraseDuVillage || phraseDeCreature);
  // Un panneau en plein écran par-dessus le monde (l'île, un lieu, Blocs, le menu, le voyage sans animation).
  const pleinEcran = Boolean((island && sheetOpen) || (panelOpen && !mapOpen) || voyage?.mode === 'panel');
  // Le focus suit le plein écran : sur la croix du panneau qui s'ouvre (la barre du bas, dessous, devient inerte), puis
  // sur le premier bouton de la barre (le bouton de l'île) quand il se ferme, s'il n'est pas déjà ailleurs.
  const pleinEcranAvant = useRef(pleinEcran);
  useEffect(() => {
    const avant = pleinEcranAvant.current;
    pleinEcranAvant.current = pleinEcran;
    const page = stageRef.current?.parentElement;
    if (!page || avant === pleinEcran) return;
    const ici = document.activeElement;
    if (pleinEcran) {
      const panneau = page.querySelector<HTMLElement>(':scope > .island-sheet');
      if (panneau && !panneau.contains(ici)) panneau.querySelector<HTMLElement>('.island-sheet-close')?.focus({ preventScroll: true });
    } else if (!ici || ici === document.body) {
      (page.querySelector<HTMLElement>('.world-bar button') ?? page.querySelector<HTMLElement>('.voxel-canvas'))?.focus({ preventScroll: true });
    }
  }, [pleinEcran]);
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
      className={`world-page${ficheVue ? ' fiche-ouverte' : ''}${whaleWord || motRallume || renommageOuvert ? ' bulle-ouverte' : ''}`}
    >
      <div
        className="world-stage"
        // Un panneau en plein écran le couvre : le monde ne se touche ni ne se lit au clavier dessous.
        inert={pleinEcran}
        data-scene
        ref={stageRef}
        onPointerDownCapture={
          moment
            ? toucherQuiSaute(sauterLeRallumage, finirLeRallumageEnSilence)
            : vague
              ? toucherQuiSaute(poserToutDUnCoup, poserEnSilence)
              : undefined
        }
      >
        <Suspense fallback={<Loading className="world-loading" text="Chargement du village…" />}>
          <WorldCanvas
            archipelago={a}
            cubes={cubesVus}
            creatures={creatures}
            signes={voyage ? undefined : signes}
            focus={focus}
            reduceMotion={reduceMotion}
            forceDay={forceDay}
            bridges={state.world.links}
            marker={marker}
            vehicle={vehicle}
            voyage={voyageAJouer(voyage)}
            avatar={avatar}
            map={mapOpen}
            home={at}
            trail={trail}
            quests={quests}
            etatsDesObjets={etats}
            islandLabels={voyage ? undefined : islandLabels}
            whalePass={whaleWord && !reduceMotion ? { island: whaleWord.island, seq: whaleSeq } : null}
            rallumage={moment?.phase === 'fondu' ? { id: moment.id, seq: moment.seq, dureeMs: DEROULE.fondu } : null}
            burst={burst}
            pose={poseVue}
            onPose={onPose}
            onIntent={onIntent}
            onVueDeplacee={setVueDeplacee}
            recentrage={recentrage}
            fiche={vueDeLaFiche}
            chantier={Boolean(island)}
            className="voxel-canvas-stage"
            label={`${UNIVERS[univers].nom} en 3D : les ${textes.archipels[a]}, l’archipel de ${a}, ses îles reliées par des ouvrages à construire, et le Bloc-Navire au port`}
          />
        </Suspense>
        <div className={`world-veil${veil ? ' on' : ''}`} aria-hidden="true" />
        {/* Sous le bouton Menu : une classe par archipel atteint, la sienne marquée ; un toucher change de classe. */}
        {!voyage && <ArchipelSwitcher current={a} bridges={state.world.links} onGo={(to) => hop(to, getArchipelago(to).port)} />}
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
            onClick={() => navigate(menuOpen ? '/adventure' : '/adventure/menu')}
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
              <Syllabified text={voyageSentence(voyage.to, voyage.back, textes.archipels, voyage.from)} />
              <SpeakButton text={voyageSentence(voyage.to, voyage.back, textes.archipels, voyage.from)} compact />
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
                  <button type="button" className="button" onClick={() => voirOuvrage(remaining[0].id)}>
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
                    <button type="button" className="button primary" onClick={allerALaDestination}>
                      <Icon name="play" /> Y aller
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
              <Icon name="ship" /> Archipel de {hopTo} : les {textes.archipels[hopTo]}
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
          {phraseDeCreature && (
            <div className="creature-line world-line" role="status" aria-live="polite">
              <strong>{getBiome(phraseDeCreature.id)?.creature.name} :</strong> <Syllabified text={phraseDeCreature.text} />
              <SpeakButton text={phraseDeCreature.text} compact />
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
          {renommageOuvert ? (
            <RenommagePanel onClose={renommage.fermer} aSuivre={bullesSuite} />
          ) : motRallume ? (
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
              'Sur chaque île, les bornes à panneau sont les missions : touche une borne, puis Jouer. Un losange jaune flotte au-dessus d’une mission à faire, des cubes d’or comptent tes étoiles. Chaque mission te donne des blocs pour construire l’île.',
              'Le bouton Menu (⏸), en haut à droite, ouvre le menu : missions, succès, réglages, accueil.',
            ]}
          />
          </div>
        {/* La fiche de l'objet touché : en bas, au-dessus de la barre (en paysage, à gauche), comptée sur la scène. */}
        {ficheVue && (
          <div className="world-fiche-place" data-couvre="scene">
            <FicheDuMonde
              key={ficheVue.seq}
              fiche={ficheVue}
              onClose={fermerLaFiche}
              ship={ship}
              onBoard={onBoard}
              onBuilt={(to) => window.setTimeout(() => navigate(`/adventure/${to}`), 900)}
              commande={commandeDeLaFiche}
              onLivree={poserLaCommande}
              commandeEnCoursDePose={vague?.commande ?? null}
              onVoirOuvrage={voirOuvrage}
            />
          </div>
        )}
        <nav className="world-bar" data-couvre="scene" aria-label="Village">
          {island && !voyage && (
            <button
              type="button"
              className="button"
              aria-pressed={sheetOpen}
              aria-controls={sheetOpen ? `panneau-${island.id}` : undefined}
              onClick={() => setSheetOpen(!sheetOpen)}
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
            onClick={() => navigate(mapOpen ? `/adventure/${at}` : '/adventure/map')}
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
              onClick={() => (blocsOpen ? fermerLePanneau() : navigate('/adventure/stock'))}
            >
              <Icon name="blocks" /> <span className="world-bar-text">Blocs </span>
              <span className="world-bar-count">({blocksTotal})</span>
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
        <ArchipelsSheet onClose={() => navigate('/adventure')} onGo={openIsland} />
      ) : blocsOpen ? (
        <InventorySheet onClose={fermerLePanneau} />
      ) : schoolOpen ? (
        <SchoolSheet onClose={fermerLePanneau} />
      ) : trophiesOpen ? (
        <TrophySheet onClose={fermerLePanneau} />
      ) : assemblageOpen ? (
        <AssemblageSheet onClose={fermerLePanneau} />
      ) : monumentsOpen ? (
        <MonumentsSheet onClose={fermerLePanneau} />
      ) : monument ? (
        <MonumentSheet builder={monumentBuilder} onClose={fermerLePanneau} />
      ) : menuOpen ? (
        <MenuSheet onClose={() => navigate('/adventure')} onAller={openIsland} />
      ) : (
        island &&
        sheetOpen && (
          <IslandSheet
            biome={island}
            ship={ship}
            onBoard={onBoard}
            in3d
            onClose={() => setSheetOpen(false)}
            highlight={highlight}
            posees={partiesDites?.biome === island.id ? partiesDites.parties : null}
            enCoursDePose={vague?.biome === island.id && vague.commande === undefined ? vague.parties : null}
            onLivree={poserLaCommande}
            commandeEnCoursDePose={vague?.biome === island.id ? (vague.commande ?? null) : null}
            onBuilt={(to) => {
              // La fête, c'est la transformation : la caméra vole jusqu'à l'île qui s'ouvre, et sa créature accueille.
              window.setTimeout(() => navigate(`/adventure/${to}`), 900);
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
