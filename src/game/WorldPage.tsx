import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { thePlace, toPlace } from './world/placeArticle';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { useMoinsDAnimations } from '../core/motion';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome, type BiomeId } from './biomes';
import type { QuestMark } from './world/view';
import { useBlocland } from './BloclandContext';
import { ArchipelagosSheet } from './ArchipelagosSheet';
import { InventorySheet } from './Inventory';
import { IslandSheet } from './IslandSheet';
import { creaturesQuiFontSigne, signesDesCreatures, usePlusTard } from './reminders';
import { sansCommandes } from './world/requests';
import { SCHOOL_PATH, SchoolSheet } from './School';
import { MonumentSheet, MonumentsSheet } from './Monuments';
import { useJoinBuilder, useMonumentBuilder } from './useMonumentBuilder';
import { JoinSheet } from './Joins';
import { getJoin, SANS_REUNION } from './world/join';
import { getMonument, monumentsOf } from './world/monuments';
import { AvatarFace } from './AvatarFace';
import { visageDuJoueur } from './world/characters/face';
import { MenuSheet } from './MenuSheet';
import { ArchipelagoSwitcher } from './ArchipelagoSwitcher';
import { useBackOpensMenu } from './useBackOpensMenu';
import { mesuresDemandees } from './rendering';
import { TrophySheet } from './TrophySheet';
import { AssemblySheet } from './Assembly';
import { ASSEMBLAGE_PATH } from './world/assembly';
import { laDestinationEstLeNavire, lienDeLaDestination } from './world/destination';
import { nextGoalInfo } from './world/goals';
import { borneDe, cleDeLaCreature, cleDeLObjet, imageDeLaDestination } from './world/affordance';
import { getCommande } from './world/requests';
import { WorldCard, type FicheOuverte } from './WorldCard';
import { TROPHIES_PATH, trophies } from './trophies';
import { WorldCanvas } from './three';
import { Tutorial, hasSeenTutorial } from './Tutorial';
import { decouverteDeLIle } from './discoveries';
import { usePanneauDeLaCarte } from './useMapPanel';
import { usePlaceDesBulles } from './useBubblePlacement';
import { WhaleWordPanel, useWhaleWord } from './WhaleWord';
import { RenamingPanel, useRenaming } from './Renaming';
import { useAmbience } from './useAmbience';
import { VoyagePanel, voyageSentence } from './VoyagePanel';
import { useTraversee } from './useCrossing';
import { usePoseEnVague, type Vague } from './useWavePose';
import { playBell } from './sound';
import { RekindlingPanel, toucherQuiSaute, useRekindling } from './Rekindling';
import { DEROULE } from './world/rekindling';
import { habillageDuMonde } from './skin';
import { useTextes } from '../universes';
import {
  capVers,
  ileDeLOuvrage,
  ilesDuModele,
  modeleDuMonde,
  etatsDesObjets,
  voyageAJouer,
} from './world/model';
import { villageStage } from './world/villageStage';
import { dispositionEnGrille, type BoutsDuTrajet } from './world/grid';
import type { Entite, Intention, ObjetDeLaFiche, Point } from './world/layout';
import { resteDuTrajet } from './world/arrival';
import type { Bonhomme } from './world/view';
import { partiesDe, prochainePartie } from './world/parts';
import { Loading } from '../components/Loading';
import {
  creaturePlacements,
  guardianPlacements,
  statueDe,
  vehiclePlacement,
  worldCubes,
} from './world/terrain';
import {
  KIND_NAME,
  archipelagoOf,
  chosenDeparture,
  linkKind,
  type BridgeDef,
  getArchipelago,
  getBridge,
  isBiomeUnlocked,
  remainingPath,
  type ArchipelagoId,
} from './world/archipelago';
import type { Burst } from './cellByCellPose';
import { useVehicleBuilder } from './useVehicleBuilder';
import { UNIVERS } from '../core/universe';
import { useHoldCelebrations } from '../components/Celebrations';
import { useASuivre } from '../components/useNextUp';
import { chiffreDeLaPastille, nomDuBoutonBlocs, prendreLesBlocs, volALieu, VOL, type GainRetenu } from './blockFlight';
import { FlyingBlocks } from './FlyingBlocks';
import { useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeListOffer, ArrangeSentence, PROPOSITION_DE_LA_LISTE, useTelephone } from './ArrangeBar';
import { ArrangeList } from './ArrangeList';
import { Sheet } from './Sheet';
import { texteGrand } from '../core/settings';

const samePoint = (p: { x: number; y: number } | undefined, q: { x: number; y: number }) => Boolean(p) && p!.x === q.x && p!.y === q.y;

declare global {
  interface Window {
    /** Ouvrir la fiche d'un objet, pour les captures (en développement, ou avec `?mesures`). */
    __dysappsFiche?: (objet: ObjetDeLaFiche) => void;
    /** Un toucher dans le mode « Aménager », pour les captures (en développement, ou avec `?mesures`). */
    __dysappsAmenager?: (i: Intention) => void;
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
  const { state, disposition, moveTo, launch, arrange } = useBlocland();
  // La pose d'une partie en vague (GD-6, Blocland) : ses cases, absentes du monde jusqu'à ce que la vue les pose (useWavePose.ts).
  // La petite construction d'une commande livrée (GD-7, PR 3) se pose de la même vague : `commande`, sans partie.
  const [vague, setVague] = useState<Vague | null>(null);
  const { launchVoyage, progress } = useProgress();
  // La fiche de l'objet touché (lot 2 de « Toucher le monde ») : une seule à la fois, toujours à la même place.
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ficheSeq = useRef(0);
  // Les blocs gagnés qui volent jusqu'au compteur, au retour d'une mission (proposition P2, PR 2, blockFlight.ts) :
  // `attente` le temps que la caméra se pose, puis `vol`. Ce qui vient après (la pose de la partie, la fiche d'un
  // chantier) attend dans `apresLeVol` : un seul mouvement à la fois.
  const [vol, setVol] = useState<{ seq: number; gain: GainRetenu; phase: 'attente' | 'vol'; depart?: { x: number; y: number }; arrivee?: { x: number; y: number } } | null>(null);
  const apresLeVol = useRef<(() => void)[]>([]);
  /** Où se tient un objet à l'écran (la 3D y range sa fonction) ; la pastille du bouton Blocs. */
  const situer = useRef<((objet: ObjetDeLaFiche) => { x: number; y: number } | null) | null>(null);
  const pastilleRef = useRef<HTMLSpanElement>(null);
  // La pastille rebondit quand son chiffre change à l'arrivée du dernier bloc (`seq`, pour rejouer l'animation).
  const [rebond, setRebond] = useState(0);
  const mapOpen = biomeId === 'map';
  // Les quatre archipels (`/adventure/world`) : un panneau HTML à la place de celui d'une île, le monde derrière. Plus
  // aucun lien du monde n'y mène (lot 2 de « Toucher le monde ») ; l'adresse reste.
  const mondeOpen = biomeId === 'world';
  // « Mes blocs » : l'inventaire commenté, un panneau à la place de celui d'une île.
  const blocsOpen = biomeId === 'stock';
  // L'école du village : ses trois portes, un panneau à la place de celui d'une île.
  const schoolOpen = biomeId === 'school';
  // Le menu du village (menu pause), en plein écran : la dernière mission, les révisions, les commandes, l'école, Missions,
  // Succès, le Tutoriel, puis Réglages tout en bas ; la croix ou Échap le referment.
  const menuOpen = biomeId === 'menu';
  // Le menu refermé (la croix, Échap) : le focus revient au bouton Menu, d'où il était parti ; refermé par « Aide du
  // village », il va à la bulle qui s'ouvre (le tutoriel le prend).
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuEtaitOuvert = useRef(menuOpen);
  const aideDepuisLeMenu = useRef(false);
  useEffect(() => {
    if (menuEtaitOuvert.current && !menuOpen && !aideDepuisLeMenu.current) menuButtonRef.current?.focus();
    aideDepuisLeMenu.current = false;
    menuEtaitOuvert.current = menuOpen;
  }, [menuOpen]);
  // La salle des trophées : un trophée par succès gagné dans le monde, le profil dans son panneau.
  const trophiesOpen = biomeId === 'trophies';
  // Le lieu où l'on assemble les blocs (GD-2), à côté de l'école.
  const assemblageOpen = biomeId === 'assembly';
  // Le lieu du village ouvert (l'école, la salle des trophées ou le lieu où l'on assemble) : le bonhomme marche jusqu'à sa porte.
  const placeOpen = schoolOpen ? 'school' : trophiesOpen ? 'trophies' : assemblageOpen ? 'assembly' : null;
  // Les monuments : leur liste, ou un monument (son îlot au large, où la caméra va).
  const monumentsOpen = biomeId === 'landmarks';
  const monument = biomeId ? getMonument(biomeId) : undefined;
  // La construction qui réunit deux lieux (GD-9) : son panneau, la caméra sur elle.
  const reunion = biomeId ? getJoin(biomeId) : undefined;
  const panelOpen = mapOpen || mondeOpen || blocsOpen || schoolOpen || menuOpen || trophiesOpen || assemblageOpen || monumentsOpen || Boolean(monument) || Boolean(reunion);
  const island = biomeId && !panelOpen ? getBiome(biomeId) : undefined;
  // Le bonhomme : où il se tient ; l'archipel affiché est le sien.
  const at = state.world.place ?? 'french-6e-phonology';
  const archipelago = archipelagoOf(at);
  const a: ArchipelagoId = archipelago.classe;
  const trophyBlocks = useMemo(() => trophies(progress.badges), [progress.badges]);
  // Les Gardiens éteints (lot 6, GD-8) : dans un univers qui a leurs textes (les deux), chaque Gardien est là dès
  // l'ouverture de son île, et celui qu'on vient de rallumer au défi attend le retour au village, éteint, pour se
  // rallumer sous les yeux de l'élève.
  const textes = useTextes();
  const [habillage] = useState(habillageDuMonde);
  const sentinelles = textes.sentinelles !== null;
  const rallumage = useRekindling(state.progress, a, sentinelles);
  const eteints = rallumage.enAttente.join();
  // Les commandes des habitants (GD-7, PR 3) : seulement dans un univers qui les montre (Blocland, Archipéo) ;
  // ailleurs, le monde se lit sans elles (ni petite construction, ni suggestion), la sauvegarde restant la même.
  const vu = useMemo(() => (textes.commandes ? state : sansCommandes(state)), [state, textes.commandes]);
  // Un autre départ choisi pour une liaison vers un lieu fermé (GD-9, « Relier ») : le monde montre son fantôme.
  const ouvrageVu = fiche?.objet.genre === 'ouvrage' ? fiche.objet.id : null;
  const liaisonChoisie = useMemo(() => chosenDeparture(ouvrageVu, vu.world.links), [ouvrageVu, vu.world.links]);
  const cubes = useMemo(
    () => worldCubes(a, vu.progress, vu.world, false, trophyBlocks, sentinelles, habillage.atelier, liaisonChoisie),
    // La LV2 choisit les bornes de l'île de la LV2 (world/terrain.ts, `questStations`) ; l'habillage (le lieu
    // d'assemblage) ne change pas tant que la page est montée (useState).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, vu.progress, vu.world, trophyBlocks, sentinelles, settings.lv2, habillage.atelier, liaisonChoisie],
  );
  const creatures = useMemo(
    () => [
      ...creaturePlacements(a, state.world.links),
      ...guardianPlacements(a, state.progress, state.world.links, sentinelles).map((c) => (eteints.split(',').includes(c.id) ? { ...c, beaten: false, cubes: statueDe(c.cubes) } : c)),
    ],
    // La disposition (GD-9) : la place des créatures et des Gardiens suit leur lieu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, state.progress, state.world.links, sentinelles, eteints, disposition],
  );
  // La créature qui se souvient (GD-4, étape 1) : celles dont l'île a des révisions dues font signe, sauf après « Plus tard ».
  const { remises } = usePlusTard();
  const revisions = useMemo(
    () => creaturesQuiFontSigne(state.spaced, state.world.links, a, remises, settings.lv2),
    [state.spaced, state.world.links, a, remises, settings.lv2],
  );
  // La disposition en grille (world/grid.ts) : où sont les îles, les bornes, les ouvrages, et les trajets du bonhomme,
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
  // Le mode « Aménager » (GD-9), sur la Carte seulement, hors mission : il se ferme quand on quitte la Carte.
  const nomDuLieu = (id: BiomeId) => getBiome(id)?.name ?? id;
  const amenagement = useAmenagement({
    world: state.world,
    a,
    arrange,
    nom: nomDuLieu,
    reduceMotion,
    habillage,
    sons: settings.sounds,
    dire: (texte) => {
      if (settings.autoRead) speak(frenchTypography(texte));
    },
    versMonde: (p) => grille.versMonde(p),
    reunion: textes.reunion,
    liaisons: textes.liaisons,
    hautDuLieu: (id) => {
      let h = -Infinity;
      for (const c of cubes) if (c.tag === id && c.z > h) h = c.z;
      return Number.isFinite(h) ? h : undefined;
    },
  });
  const enAmenageant = mapOpen && amenagement.ouvert;
  // Au téléphone en grand texte, « Aménager » propose d'abord la liste (`offreDeLaListe`), qui s'ouvre dans un panneau
  // (`listeDAmenagement`) ; l'élève peut rester sur la Carte.
  const telephone = useTelephone();
  const [offreDeLaListe, setOffreDeLaListe] = useState(false);
  const [listeDAmenagement, setListeDAmenagement] = useState(false);
  const proposerLaListe =
    telephone && texteGrand(settings)
      ? () => {
          setOffreDeLaListe(!offreDeLaListe);
          if (!offreDeLaListe && settings.autoRead) speak(frenchTypography(PROPOSITION_DE_LA_LISTE));
        }
      : undefined;
  useEffect(() => {
    if (!mapOpen && amenagement.ouvert) amenagement.terminer();
    if (!mapOpen) {
      setOffreDeLaListe(false);
      setListeDAmenagement(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen]);
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
  // Le modèle du monde (world/model.ts) : les îles, les bornes et leur état, en identifiants ; la grille dit où elles sont.
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
  // La prochaine chose à faire, quand c'est un objet : sa bulle est mise en avant sur l'île où l'on est (proposition
  // P2, world/affordance.ts) ; sinon aucune (la bulle d'or ne dit jamais autre chose que la prochaine destination).
  const navirePret = useMemo(
    () => laDestinationEstLeNavire(destination, nextGoalInfo(state, archipelago.port, textes.archipels, textes.libelles)),
    [destination, state, archipelago.port, textes],
  );
  const prochaine = destination.commande
    ? cleDeLaCreature(destination.island)
    : destination.ouvrage
      ? cleDeLObjet({ genre: 'ouvrage', id: destination.ouvrage })
      : navirePret
        ? cleDeLObjet({ genre: 'navire', port: archipelago.port })
        : destination.mission
          ? cleDeLObjet({ genre: 'borne', id: `${destination.island}:${destination.mission}` })
          : null;
  // Un ouvrage à construire (GD-7) : sur la Carte, la flèche se pose sur lui, avec l'icône d'un ouvrage, pas sur l'île
  // d'où il part (quatre ouvrages peuvent en partir) ; sur sa liaison, du côté de cette île.
  const flecheDeLOuvrage = useMemo(
    () => (destination.ouvrage ? { ouvrage: destination.ouvrage, depuis: destination.island } : null),
    [destination.ouvrage, destination.island],
  );
  // Blocland, sur la Carte : la bulle d'or de la prochaine destination porte l'image de ce qu'on y fait (piste B,
  // choisie par le mainteneur le 4 octobre 2026) : le bloc d'une commande, l'icône des ouvrages, le navire ou l'étoile.
  const blocDeLaCommande = destination.commande ? signes.find((s) => s.id === destination.island)?.bloc : undefined;
  const imageDeLaCarte = useMemo(
    () => imageDeLaDestination(destination, { navire: navirePret, bloc: blocDeLaCommande }),
    [destination, navirePret, blocDeLaCommande],
  );
  // En grand texte, la phrase défile dans le panneau de la Carte : un repère dit qu'il y a une suite.
  // Le nom de chaque île ouverte de l'archipel, écrit au-dessus d'elle dans le monde ; sur la Carte, toutes les îles,
  // avec leur état en icône et en mot. Le bloc que l'île rapporte, avant son nom (ligne `blocDesIles` de l'habillage).
  const blocDesIles = habillage.blocDesIles === 'avant-le-nom';
  const lieuChoisi = enAmenageant && amenagement.choix?.genre === 'lieu' ? amenagement.choix.id : null;
  const islandLabels = useMemo(
    () =>
      ilesDuModele(state, a)
        .filter((i) => mapOpen || i.ouverte)
        .map((i) => {
          const bloc = blocDesIles ? getBiome(i.id)?.block : undefined;
          // Dans « Aménager », le lieu choisi porte « Choisi » et l'icône d'Aménager sous son nom (son fantôme porte son
          // nom) ; son état revient à la pose.
          const etat = i.id === lieuChoisi ? { id: 'choisi' as const, name: 'Choisi' } : { id: i.etat.id, name: textes.etatsDIle[i.etat.id] };
          return { id: i.id, text: i.nom, ...(bloc ? { bloc } : {}), ...(mapOpen ? { state: etat } : {}) };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, mapOpen, state.world.links, state.world.parts, state.progress, textes, blocDesIles, lieuChoisi],
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
  const renommage = useRenaming(tutoDone && rallumage.enAttente.length === 0 && !vague && !vol, 1200);
  const whale = useWhaleWord(state, a, tutoDone && rallumage.enAttente.length === 0 && !renommage.ouvert && !vague && !vol);
  const [whaleOpen, setWhaleOpen] = useState<string | null>(null);
  const [whaleSeq, setWhaleSeq] = useState(0);
  // Le village de l'archipel monte d'un état pendant la séance (un plan, un ouvrage, un monument) : une cloche, sans
  // phrase par-dessus le monde (mot du mainteneur, 4 octobre 2026) ; le village change sous les yeux et son état se lit
  // dans le panneau de l'île-port. Rien n'est enregistré : l'état se déduit de la progression.
  const stageHere = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  const stageRank = villageStage(state.world, stageHere).rank;
  const lastStage = useRef({ a: stageHere, rank: stageRank });
  useEffect(() => {
    const before = lastStage.current;
    lastStage.current = { a: stageHere, rank: stageRank };
    if (before.a !== stageHere || stageRank <= before.rank) return;
    // Après le carillon du plan ou de l'ouvrage qui vient de le faire monter.
    const timer = window.setTimeout(() => {
      if (settings.sounds) playBell();
    }, 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRank, stageHere]);
  // Le chantier mis en avant dans le panneau de l'île (« Voir le chantier », `?worksite=`).
  const [highlight, setHighlight] = useState<string | null>(null);
  // Sur la Carte, l'île fermée touchée : on montre le chemin d'ouvrages qui y mène (balises dans le monde, liste ici).
  const [mapTarget, setMapTarget] = useState<BiomeId | null>(null);
  const remaining = useMemo(() => (mapTarget ? remainingPath(mapTarget, state.world.links) : []), [mapTarget, state.world.links]);
  const trail = useMemo(() => (remaining.length ? remaining.flatMap((b) => grille.liaison(b.id).map((p) => grille.versIle(p))) : undefined), [remaining, grille]);
  const [replay, setReplay] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  // Revoir l'aide (la ligne « Aide du village » du menu, dans les deux univers depuis le 4 octobre 2026) rouvre le
  // tutoriel : comme la première fois, le reste attend qu'il soit fermé (DA-9).
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
  const reunionBuilder = useJoinBuilder(reunion?.plan ?? SANS_REUNION, reunion?.shape ?? null);
  // Les éclats : ceux du navire, du monument ou de la réunion, le dernier qui a bougé.
  const seqs = useRef({ ship: ship.burst.seq, monument: monumentBuilder.burst.seq, reunion: reunionBuilder.burst.seq, last: ship.burst as Burst });
  const now = { ship: ship.burst.seq, monument: monumentBuilder.burst.seq, reunion: reunionBuilder.burst.seq };
  if (ship.burst.seq !== seqs.current.ship) seqs.current = { ...now, last: ship.burst };
  else if (monumentBuilder.burst.seq !== seqs.current.monument) seqs.current = { ...now, last: monumentBuilder.burst };
  else if (reunionBuilder.burst.seq !== seqs.current.reunion) seqs.current = { ...now, last: reunionBuilder.burst };
  const burst = useMemo(
    () => ({ ...seqs.current.last, seq: ship.burst.seq + monumentBuilder.burst.seq + reunionBuilder.burst.seq }),
    [ship.burst, monumentBuilder.burst, reunionBuilder.burst],
  );

  // Le bonhomme : où il se tient, et son itinéraire quand on ouvre une autre île ouverte (il y marche).
  // La position fine ne se sauvegarde pas : à la reprise, il est à sa place.
  const [walk, setWalk] = useState<Bonhomme<Point>>(() => ({ route: [seTenir(at)], seq: 0 }));
  /** La case du sol où l'élève l'a envoyé sur son île (il y reste, sans revenir à sa place), ou `null`. */
  const flanee = useRef<Point | null>(null);
  /** Une autre île touchée sur le sol : la case touchée, que l'effet du changement d'île lit (et où il en était en route). */
  const arriveeDemandee = useRef<{ ile: BiomeId; sol: Point; enRoute?: Point } | null>(null);
  // Les vues reçoivent le trajet en ancrages : chaque point dans le repère de l'île la plus proche. Une disposition
  // à part, qui ne dépend que de l'archipel : `grille` change avec les cubes, et le bonhomme repartirait à chaque bloc posé.
  // Elle suit la disposition (GD-9) : un lieu déplacé emporte ses repères.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const repere = useMemo(() => dispositionEnGrille(a), [a, disposition]);
  const avatar = useMemo(() => ({ ...walk, route: walk.route.map((p) => repere.versIle(p)) }), [walk, repere]);
  // La disposition change (GD-9, un lieu déplacé ou tourné) : le bonhomme suit son lieu, à sa place, et reste à l'écran.
  const dispositionVue = useRef(disposition);
  useEffect(() => {
    if (dispositionVue.current === disposition) return;
    dispositionVue.current = disposition;
    flanee.current = null;
    setWalk((w) => ({ route: [seTenir(at)], seq: w.seq + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disposition]);
  // L'élève a fait glisser la vue (la 3D le dit) : « Recentrer » la ramène à son cadrage, d'un appui (`recentrage`).
  const [vueDeplacee, setVueDeplacee] = useState(false);
  const [recentrage, setRecentrage] = useState(0);
  // Le voyage du Bloc-Navire : un fondu court pour un voyage déjà fait, la cinématique pour le premier (useCrossing.ts).
  const { voyage, veil, arriveeLue, later, hop, onBoard, arrive, onLegEnd } = useTraversee({
    a,
    at,
    archipelago,
    biomeId,
    liens: state.world.links,
    reduceMotion,
    textes,
    settings,
    speak,
    navigate,
    moveTo,
    launch,
    launchVoyage,
    chemin,
    seTenir,
    setWalk,
    setFocus,
  });

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
    // La construction qui réunit deux lieux : la caméra sur le premier des deux, qui la cadre avec l'autre.
    if (reunion) {
      setFocus((f) => ({ island: reunion.plan.archipelago === a ? reunion.pair[0] : null, seq: f.seq + 1 }));
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
  }, [island?.id, mapOpen, placeOpen, monument?.id, reunion?.plan.id]);

  // Ce que le tutoriel ne dit plus, dit au moment où on le rencontre, une fois par appareil, par la créature de l'île :
  // les ouvrages au premier toucher d'une île pâle, le Bloc-Navire à la première arrivée au port (discoveries.ts).
  function decouvrir(id: BiomeId): boolean {
    const text = decouverteDeLIle(state, id, { port: archipelago.port, navire: Boolean(ship.stage), textes });
    if (!text) return false;
    setSaid({ id, text });
    if (settings.autoRead) speak(frenchTypography(text));
    return true;
  }

  // Le retour d'une mission qui a donné des blocs : le gain, pris une fois en arrivant sur l'île (avant la fiche du
  // chantier et la pose de la partie, qui l'attendent). « Réduire les animations », le tutoriel ou un voyage : pas de
  // vol, le chiffre a déjà changé.
  // Tenu à jour par cet effet et par `finirLeVol` (jamais pendant le rendu). Cet effet est déclaré AVANT ceux du chantier
  // et de la pose : React les lance dans cet ordre, si bien qu'ils trouvent le vol déjà retenu et l'attendent.
  const volEnCours = useRef(false);
  const volDeLIle = useRef<BiomeId | null>(null);
  useEffect(() => {
    if (!island) return;
    // Une autre île pendant le vol : il s'arrête, et ce qui l'attendait avec lui (la partie est posée, sans vague).
    if (volDeLIle.current && volDeLIle.current !== island.id) {
      volDeLIle.current = null;
      apresLeVol.current = [];
      volEnCours.current = false;
      setVol(null);
    }
    const gain = prendreLesBlocs(island.id);
    const empeche = { moinsDAnimations: reduceMotion, ficheOuverte: false, tutoriel: !tutoDone, motQuiAttend: false, voyage: Boolean(voyage), pleinEcran: false };
    if (!gain || !volALieu(gain, empeche)) return;
    setVol((v) => ({ seq: (v?.seq ?? 0) + 1, gain, phase: 'attente' }));
    apresLeVol.current = [];
    // Tout de suite : la fiche du chantier et la pose, plus bas dans le même passage, attendent déjà.
    volEnCours.current = true;
    volDeLIle.current = island.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id]);
  /** Ce qui attend la fin du vol (s'il y en a un en attente ou en cours), sinon tout de suite. */
  const apresLeVolSIlYEnA = (f: () => void) => {
    if (volEnCours.current) apresLeVol.current.push(f);
    else f();
  };

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
    if (objet) apresLeVolSIlYEnA(() => setFiche({ objet, seq: ++ficheSeq.current, saut: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, chantier]);

  // La pose d'une partie en vague (GD-6) et d'une petite construction livrée (GD-7), après le vol des blocs (useWavePose.ts).
  const { cubesVus, poseVue, partiesDites, onPose, poserToutDUnCoup, poserEnSilence, poserLaCommande } = usePoseEnVague({
    island,
    chantier,
    reduceMotion,
    settings,
    habillage,
    cubes,
    later,
    vague,
    setVague,
    apresLeVolSIlYEnA,
  });

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
  usePanneauDeLaCarte(stageRef, mapOpen && Boolean(mapTarget && remaining.length) && !whaleWord && !motRallume && !renommageOuvert, `${mapTarget ?? ''}|${remaining.length}`);
  const clocheDuRetour = useRef(false);
  const aRallumer = !voyage && tutoDone && !panelOpen ? (rallumage.enAttente[0] ?? null) : null;
  // Un bandeau de récompense attend que le panneau ouvert se ferme (le tutoriel, le mot de la baleine, un rallumage, un
  // voyage), et aussi pendant l'instant qui précède le mot ou le rallumage attendu : il ne tombe jamais sur la phrase que
  // l'élève lit, ni ne s'affiche pour être caché aussitôt (DA-9).
  useHoldCelebrations(!tutoDone || !!voyage || !!whaleNext || !!aRallumer || !!moment || !!motRallume || !!vague || !!vol);
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
  /** Menu, l'archipel, Recentrer ou la barre pendant le moment : la sentinelle allumée, sans cloche ni mot. */
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
  // Le vol, la caméra posée : de la borne de la mission (hors de l'écran : du centre de la scène) jusqu'à la pastille.
  // Jamais par-dessus une fiche, le tutoriel, un mot qui attend, un voyage ou un panneau : le chiffre change, sans vol.
  const empecheLeVol =
    Boolean(ficheVue) || !tutoDone || Boolean(whaleWord || motRallume || renommageOuvert || moment || voyage) || Boolean(island && sheetOpen) || panelOpen || mapOpen;
  /** Le vol fini (`arrive` : le dernier bloc est arrivé, la pastille rebondit) ou arrêté ; ce qui l'attendait suit. */
  const finirLeVol = (arrive: boolean) => {
    volEnCours.current = false;
    volDeLIle.current = null;
    setVol(null);
    if (arrive) setRebond((n) => n + 1);
    const suite = apresLeVol.current;
    apresLeVol.current = [];
    for (const f of suite) f();
  };
  useEffect(() => {
    if (!vol) return;
    if (empecheLeVol) return finirLeVol(false);
    if (vol.phase !== 'attente') return;
    const timer = window.setTimeout(() => {
      const pastille = pastilleRef.current?.getBoundingClientRect();
      const scene = stageRef.current?.getBoundingClientRect();
      if (!pastille || !scene) return finirLeVol(false);
      const arrivee = { x: pastille.left + pastille.width / 2, y: pastille.top + pastille.height / 2 };
      const { biome, mission } = vol.gain;
      const objet: ObjetDeLaFiche = borneDe(`${biome}:${mission}`) ? { genre: 'borne', id: `${biome}:${mission}` } : { genre: 'gardien', id: biome };
      const vu = situer.current?.(objet);
      const dansLaScene = vu && vu.x >= scene.left && vu.x <= scene.right && vu.y >= scene.top && vu.y <= scene.bottom;
      const depart = dansLaScene ? vu : { x: scene.left + scene.width / 2, y: scene.top + scene.height / 2 };
      setVol((v) => (v && v.seq === vol.seq ? { ...v, phase: 'vol', depart, arrivee } : v));
    }, VOL.attenteMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vol?.seq, vol?.phase, empecheLeVol]);
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

  // Pour les captures (en développement, ou avec `?mesures`) : un toucher dans le mode « Aménager », sans viser la scène.
  const intentionRef = useRef<(i: Intention) => void>(() => {});
  useEffect(() => {
    if (!(import.meta.env.DEV || mesuresDemandees())) return;
    const toucher = (i: Intention) => intentionRef.current(i);
    window.__dysappsAmenager = toucher;
    return () => {
      if (window.__dysappsAmenager === toucher) delete window.__dysappsAmenager;
    };
  }, []);

  // Le bouton retour, dans le village sans panneau, ouvre le menu du village.
  useBackOpensMenu(!biomeId && !voyage, '/adventure/menu');

  const blocksTotal = Object.values(state.stock).reduce((n, v) => n + (v ?? 0), 0);
  // Pendant le vol, la pastille garde le chiffre d'avant : il change une fois, à l'arrivée du dernier bloc.
  const pastille = chiffreDeLaPastille(blocksTotal, vol ? vol.gain.nombre : null);
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
    setFiche({ objet, seq: ++ficheSeq.current, saut: options.saut ?? false, ...(options.phrase ? { phrase: options.phrase } : {}), ...(options.decouverte ? { decouverte: options.decouverte } : {}), ...(options.cadrer ? { cadrer: true } : {}) });
  };
  /** Aller sur une île sans ouvrir son panneau, et y ouvrir la fiche d'un objet (« Y aller », « Relier »). */
  const allerALaFiche = (ile: BiomeId, objet: ObjetDeLaFiche) => {
    setSheetOpen(false);
    setFiche({ objet, seq: ++ficheSeq.current, saut: true });
    navigate(`/adventure/${ile}`);
  };
  /**
   * « Relier » (une île pâle, la Carte) : la fiche de cet ouvrage, depuis l'île ouverte qu'il touche ; `autreDepart` :
   * « Partir d'une autre île » (GD-9), la caméra tient la liaison au-dessus de la fiche.
   */
  const voirOuvrage = (id: string, autreDepart = false) => {
    const from = ileDeLOuvrage(id, state.world.links);
    if (!from) return;
    if (mapOpen) allerALaFiche(from, { genre: 'ouvrage', id });
    else ouvrirFiche({ genre: 'ouvrage', id }, { saut: true, ...(autreDepart ? { cadrer: true } : {}) });
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
    // Le mode « Aménager » prend les touchers : choisir, caler le fantôme ; aucune fiche ne s'ouvre.
    if (enAmenageant && amenagement.intention(i)) return;
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
  intentionRef.current = onIntent;
  const ouvrageLabel = (b: BridgeDef) =>
    `${KIND_NAME[linkKind(b, state.world.links)]} entre ${thePlace(getBiome(b.from)?.name ?? b.from)} et ${thePlace(getBiome(b.to)?.name ?? b.to)} (${b.cost} blocs)`;

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
  // Les bulles du haut (la Carte, les phrases du voyage, du village, d'une créature), une condition chacune.
  const ligneDuVoyage = voyage?.mode === 'cinema';
  // La Carte s'ouvre sans encart (mot du mainteneur, 4 octobre 2026 : « supprime l'encart qui dit prochaine destination ») :
  // la flèche jaune montre la suggestion. Seule une île pâle touchée dit le chemin d'ouvrages qui y mène. Une chose à la
  // fois : il attend que le mot de la baleine ou du rallumage soit fermé (DA-25).
  const panneauDeLaCarte = mapOpen && Boolean(mapTarget && remaining.length) && !whaleWord && !motRallume && !renommageOuvert;
  // Une chose à la fois : la phrase d'une créature attend que la fiche ouverte soit fermée.
  const phraseDeCreature = said && !ficheVue ? said : null;
  const bulleEnHaut = Boolean(ligneDuVoyage || panneauDeLaCarte || phraseDeCreature);
  // Un panneau en plein écran par-dessus le monde (l'île, un lieu, Blocs, le menu, le voyage sans animation).
  const pleinEcran = Boolean((island && sheetOpen) || (panelOpen && !mapOpen) || voyage?.mode === 'panel' || (mapOpen && listeDAmenagement));
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

  // Après tous les hooks : leur ordre ne change jamais d'un rendu à l'autre.
  if (biomeId && !panelOpen && !island) return <NotFoundPage />;
  return (
    <div
      className={`world-page${ficheVue ? ' fiche-ouverte' : ''}${whaleWord || motRallume || renommageOuvert ? ' bulle-ouverte' : ''}`}
    >
      <p className="visually-hidden" role="status" data-testid="arrivee-lue">
        {arriveeLue}
      </p>
      <div
        className="world-stage"
        // Un panneau en plein écran le couvre : le monde ne se touche ni ne se lit au clavier dessous.
        inert={pleinEcran}
        data-scene
        ref={stageRef}
        onPointerDownCapture={
          amenagement.geste
            ? () => amenagement.finirLeGeste()
            : moment
            ? toucherQuiSaute(sauterLeRallumage, finirLeRallumageEnSilence)
            : vague
              ? toucherQuiSaute(poserToutDUnCoup, poserEnSilence)
              : undefined
        }
      >
        <Suspense fallback={<Loading className="world-loading" text="Chargement du village…" />}>
          <WorldCanvas
            // La scène est refaite quand la disposition change (GD-9) : chaque partie relit la place des lieux, et
            // l'ancienne libère tout ce qu'elle tenait.
            key={disposition}
            archipelago={a}
            cubes={cubesVus}
            creatures={creatures}
            signes={voyage || enAmenageant ? undefined : signes}
            prochaine={prochaine}
            calme={Boolean(ficheVue) || panelOpen || panneauDeLIle || Boolean(whaleWord) || Boolean(motRallume) || enAmenageant}
            focus={focus}
            reduceMotion={reduceMotion}
            forceDay={forceDay}
            bridges={state.world.links}
            liaisonCadree={fiche?.cadrer && fiche.objet.genre === 'ouvrage' ? fiche.objet.id : null}
            // Dans le mode « Aménager », « Poser ici » ou ✓ Terminé est le seul élément mis en avant.
            marker={enAmenageant ? null : marker}
            amenager={enAmenageant ? { vue: amenagement.vue, cadre: amenagement.cadre } : null}
            geste={amenagement.geste}
            imageDeLaCarte={imageDeLaCarte}
            vehicle={vehicle}
            voyage={voyageAJouer(voyage)}
            avatar={avatar}
            map={mapOpen}
            home={at}
            trail={enAmenageant ? undefined : trail}
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
            situer={situer}
            chantier={Boolean(island)}
            className="voxel-canvas-stage"
            label={`${UNIVERS[univers].nom} en 3D : les ${textes.archipels[a]}, l’archipel de ${a}, ses îles reliées par des ouvrages à construire, et le Bloc-Navire au port`}
          />
        </Suspense>
        <div className={`world-veil${veil ? ' on' : ''}`} aria-hidden="true" />
        {/* Sous le bouton Menu : une classe par archipel atteint, la sienne marquée ; un toucher change de classe. */}
        {!voyage && !enAmenageant && <ArchipelagoSwitcher current={a} bridges={state.world.links} onGo={(to) => hop(getArchipelago(to).port)} />}
        {/* Le menu du village, toujours en haut à droite, comme la pause d'un jeu. */}
        {!voyage && (
          <button
            type="button"
            ref={menuButtonRef}
            className="button world-menu-button"
            data-tuto="menu"
            data-couvre="bouton"
            aria-label="Menu"
            aria-pressed={menuOpen}
            aria-controls={menuOpen ? 'panneau-menu' : undefined}
            onClick={() => navigate(menuOpen ? '/adventure' : '/adventure/menu')}
          >
            <Icon name="menu" />
          </button>
        )}
        {/* Après un glissé : sous la colonne de droite (Menu, l'archipel), sans animation. Jamais sur une bulle du haut :
            le temps qu'elle est ouverte, il attend (la vue reste déplacée), et aucun bouton Fermer n'est couvert. */}
        {vueDeplacee && !voyage && !bulleEnHaut && (
          // Un rond avec le visage du joueur, sans mot (mot du mainteneur, 4 octobre 2026, pour Blocland ; choix « 1a » du
          // même jour pour Archipéo) ; ses couleurs suivent l'univers (styles/global.css, `world-recentrer-tete`).
          <button type="button" className="button world-recentrer world-recentrer-tete" onClick={recentrer} aria-label="Recentrer">
            <AvatarFace visage={visageDuJoueur(habillage)} />
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
          {enAmenageant && <ArrangeSentence amenagement={amenagement} nom={nomDuLieu} />}
          {mapOpen && offreDeLaListe && !enAmenageant && !listeDAmenagement && (
            <ArrangeListOffer
              onListe={() => {
                setOffreDeLaListe(false);
                setListeDAmenagement(true);
              }}
              onCarte={() => {
                setOffreDeLaListe(false);
                if (amenagement.aReposer.length) amenagement.ouvrirLaListe();
                else amenagement.ouvrir();
              }}
            />
          )}
          {panneauDeLaCarte && !enAmenageant && mapTarget && (
            <div className="creature-line world-line world-map-line" role="status" aria-live="polite">
              <p>
                <strong>Pour aller {toPlace(getBiome(mapTarget)?.name ?? mapTarget)} :</strong> encore {remaining.length} ouvrage{remaining.length > 1 ? 's' : ''}.
              </p>
              <ol className="world-map-path">
                {remaining.map((b) => (
                  <li key={b.id}>{ouvrageLabel(b)}</li>
                ))}
              </ol>
              <button type="button" className="button" onClick={() => voirOuvrage(remaining[0].id)}>
                <Icon name="hammer" /> Relier
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
        {/* Les bulles d'aide en bas, au-dessus de la barre : elles ne cachent pas l'île et la bulle dont elles parlent. */}
        <div className="world-overlay-bottom" data-couvre="bulle" ref={bullesRef}>
          {/* « Passer » tant que le mot n'est pas là : ensuite, « J’ai compris » ferme le moment. */}
          {moment && !motRallume && (
            <button type="button" className="button rallumage-passer" onClick={passerLesRallumages}>
              <Icon name="play" /> Passer
            </button>
          )}
          {renommageOuvert ? (
            <RenamingPanel onClose={renommage.fermer} aSuivre={bullesSuite} />
          ) : motRallume ? (
            <RekindlingPanel id={motRallume} onClose={() => setMotRallume(null)} aSuivre={bullesSuite} />
          ) : (
            whaleWord && <WhaleWordPanel word={whaleWord} onClose={closeWhale} aSuivre={bullesSuite} />
          )}
          <Tutorial
            id="village-immersif"
            replay={replay}
            onClose={() => setTutoDone(true)}
            targets={[undefined, undefined, '[data-tuto="menu"]']}
            steps={[
              // Les bulles (les deux univers depuis le 4 octobre 2026) : plus de flèche jaune dans le monde, la bulle bordée
              // d'or montre ce qu'on peut faire.
              `${UNIVERS[univers].bienvenue} Touche la Forêt des sons pour commencer.`,
              'Sur chaque île, les bornes à panneau sont les missions : touche une borne, puis Jouer. La bulle bordée d’or montre la prochaine chose à faire. Chaque mission te donne des blocs pour construire l’île, et des cubes d’or pour tes étoiles.',
              'Le bouton Menu, en haut à droite, ouvre le menu : missions, succès, aide, réglages.',
            ]}
          />
          </div>
        {/* La fiche de l'objet touché : en bas, au-dessus de la barre (en paysage, à gauche), comptée sur la scène. */}
        {ficheVue && (
          <div className="world-fiche-place" data-couvre="scene">
            <WorldCard
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
        {enAmenageant ? (
          <ArrangeBar amenagement={amenagement} />
        ) : (
        <nav className="world-bar" data-couvre="scene" aria-label="Village">
          {island && !voyage && (
            <button
              type="button"
              className="button world-bar-ile"
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
          {/* Sur la Carte, hors voyage : « Aménager », à sa place fixe, après la Carte. */}
          {mapOpen && !voyage && <ArrangeButton amenagement={amenagement} proposer={proposerLaListe} />}
          {!voyage && (
            <button
              type="button"
              className="button world-bar-blocs"
              aria-pressed={blocsOpen}
              aria-label={nomDuBoutonBlocs(pastille)}
              data-tuto="blocs"
              aria-controls={blocsOpen ? 'panneau-blocs' : undefined}
              onClick={() => (blocsOpen ? fermerLePanneau() : navigate('/adventure/stock'))}
            >
              <Icon name="blocks" /> <span className="world-bar-text">Blocs </span>
              {/* Le compte : une pastille chiffrée (« 0 » compris), d'or dans Blocland, de sable dans Archipéo. */}
              <span key={rebond} ref={pastilleRef} className={`world-bar-count${rebond ? ' rebondit' : ''}`}>
                {pastille}
              </span>
            </button>
          )}
        </nav>
        )}
        {vol?.phase === 'vol' && vol.depart && vol.arrivee && (
          <FlyingBlocks key={vol.seq} bloc={vol.gain.bloc} nombre={vol.gain.nombre} depart={vol.depart} arrivee={vol.arrivee} onArrive={() => finirLeVol(true)} />
        )}
      </div>
      {voyage?.mode === 'panel' ? (
        <div className="island-sheet voyage-sheet">
          <VoyagePanel to={voyage.to} back={voyage.back} onArrive={arrive} />
        </div>
      ) : voyage ? null : mapOpen && listeDAmenagement ? (
        <Sheet id="panneau-amenager" className="arrange-sheet" titleId="amenager-titre" icon="amenager" title="Aménager la carte" onClose={() => setListeDAmenagement(false)}>
          <ArrangeList a={a} enPanneau onFin={() => setListeDAmenagement(false)} />
        </Sheet>
      ) : mondeOpen ? (
        <ArchipelagosSheet onClose={() => navigate('/adventure')} onGo={openIsland} />
      ) : blocsOpen ? (
        <InventorySheet onClose={fermerLePanneau} />
      ) : schoolOpen ? (
        <SchoolSheet onClose={fermerLePanneau} />
      ) : trophiesOpen ? (
        <TrophySheet onClose={fermerLePanneau} />
      ) : assemblageOpen ? (
        <AssemblySheet onClose={fermerLePanneau} />
      ) : monumentsOpen ? (
        <MonumentsSheet onClose={fermerLePanneau} />
      ) : monument ? (
        <MonumentSheet builder={monumentBuilder} onClose={fermerLePanneau} />
      ) : reunion ? (
        <JoinSheet builder={reunionBuilder} onClose={fermerLePanneau} />
      ) : menuOpen ? (
        <MenuSheet
          onClose={() => navigate('/adventure')}
          onAller={openIsland}
          onAide={() => {
            aideDepuisLeMenu.current = true;
            navigate('/adventure');
            revoirAide();
          }}
        />
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
