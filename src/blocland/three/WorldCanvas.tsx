// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra gérée que l'élève peut faire
// glisser à plat (bornée à l'archipel), eau autour des îles, vol vers une île, jour et nuit, créatures qui se
// promènent. Chargé à la demande (voir ./index.ts).
// La scène est faite de parties (cubes, navire, bornes, personnages, lumière, brume, étiquettes, le large, la caméra) :
// ce composant les crée, leur passe les props, écoute le toucher et le clavier, et sa boucle ne fait qu'itérer sur elles.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { estUnBiome, type BiomeId } from '../biomes';
import { islandCenter, worldBounds } from '../world/terrain';
import { ARROW_DIRS, cubeTags, enRoute, finishWalk, groundTap, islandInDirection, recentrerApres, toucheRetenue, walkPose, type Touche, type VoyageRun } from '../world/scene';
import { rappelsDeLaVue, type WorldViewProps } from '../world/view';
import { borneDe, centreDeLObjet, cleDeLaCreature, cleDeLObjet, SIGNE, signesDesObjets, sommetsDesBornes, zoneDuToucher, type ObjetDeLaFiche, type ObjetTouche, type ToucherDirect } from '../world/affordance';
import { useEnCasesDuMonde } from '../useEnCasesDuMonde';
import { createMeter } from './meter';
import { habillageDe } from '../habillage';
import { mesuresDemandees, renduDuMonde, styleDuMonde } from '../rendu';
import { useSettings } from '../../core/SettingsContext';
import { surfaceDe } from './surface';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';
import { creerLumiere } from './lumiere';
import { creerBrume } from './brume';
import { creerLarge } from './large';
import { creerBornes, type Bornes } from './bornes';
import { creerAffordance, type Affordance } from './affordance';
import { creerEtiquettes, type Etiquettes } from './etiquettes';
import { creerPersonnages, type Personnages } from './personnages';
import { creerSignes, type Signes } from './signes';
import { creerCubes, type Cubes } from './cubes';
import { creerNavire, type Amarre, type Navire } from './navire';
import { creerCamera, type Camera } from './camera';
import { creerRond } from './rond';
import { glisseCommence, pointDuPlan, SEUIL_DU_GLISSE } from './glisse';
import { lecteurDePlaceLibre, lirePlaceLibre, sousLaFiche } from '../placeLibre';

/** Le doigt posé sur le monde : son pointeur, où, et le point du sol saisi une fois le seuil passé (sinon `null`). */
interface Appui {
  id: number;
  x: number;
  y: number;
  ancre: THREE.Vector3 | null;
  /** Où il est maintenant (un second doigt peut se poser après qu'il a glissé). */
  cx: number;
  cy: number;
  /** Un second doigt s'est posé (la Carte se pince) : lever les doigts n'ouvre rien. */
  pince?: boolean;
}

/** La scène en cours : le moteur de rendu, la caméra, et les parties que les props mettent à jour. */
interface Scene3D {
  camera: THREE.PerspectiveCamera;
  cadrage: Camera;
  bornes: Bornes;
  /** Les signes des objets touchables (Blocland). */
  affordance: Affordance;
  etiquettes: Etiquettes;
  personnages: Personnages;
  signes: Signes;
  cubes: Cubes;
  navire: Navire;
  /** Efface le décalage de l'élève et le dit à la page. */
  recentrer(): void;
  /** Le signe de l'objet d'une fiche fait son petit saut (s'il en porte un). */
  sauter(objet: ObjetDeLaFiche): void;
  /** La fiche posée dans la page cache son objet : le cadrage glisse pour le poser dans la place libre. */
  garderHorsDeLaFiche(objet: ObjetDeLaFiche): void;
}

/** Pas de créatures : une seule liste vide, pour que les signes des objets ne se recalculent pas à chaque rendu. */
const SANS_CREATURES: NonNullable<WorldViewProps['creatures']> = [];

export default function WorldCanvas({
  archipelago,
  cubes,
  focus: focusEnAncrages,
  reduceMotion = false,
  creatures = SANS_CREATURES,
  signes = [],
  prochaine = null,
  calme = false,
  forceDay = false,
  bridges = [],
  marker: markerEnAncrage = null,
  imageDeLaCarte = null,
  vehicle = null,
  voyage = null,
  avatar: avatarEnAncrages,
  map = false,
  home,
  trail: trailEnAncrages,
  quests: questsEnAncrages,
  etatsDesObjets,
  islandLabels,
  whalePass = null,
  rallumage = null,
  burst: burstEnAncrage,
  pose = null,
  onPose,
  onVueDeplacee,
  recentrage = 0,
  fiche = null,
  situer,
  className,
  label,
  onIntent,
  chantier = false,
}: WorldViewProps) {
  // Les positions reçues en ancrages (une île, un point dans son repère), dessinées en cases du monde.
  const { focus, marker, avatar, trail, quests, burst } = useEnCasesDuMonde({
    archipelago,
    focus: focusEnAncrages,
    marker: markerEnAncrage,
    avatar: avatarEnAncrages,
    trail: trailEnAncrages,
    quests: questsEnAncrages,
    burst: burstEnAncrage,
  });
  // Les gestes deviennent des intentions (world/view.ts) : la vue garde ses rappels, tirés d'elles.
  const { onPickIsland, onPickBridge, onPickQuest, onPickPlace, onPickCreature, onPickVehicle, build, onVoyageLegEnd, onVoyageSkip, onArrive } = rappelsDeLaVue(
    onIntent,
    archipelago,
    chantier,
  );
  const host = useRef<HTMLDivElement>(null);
  // Le rendu du monde (celui de l'univers, voir rendu.ts), lu une fois pour la vie du composant.
  const rendu = useRef(renduDuMonde()).current;
  const world = useRef<Scene3D | null>(null);
  const pickRef = useRef(onPickIsland);
  pickRef.current = onPickIsland;
  const pickVehicleRef = useRef(onPickVehicle);
  pickVehicleRef.current = onPickVehicle;
  const voyageSkipRef = useRef(onVoyageSkip);
  voyageSkipRef.current = onVoyageSkip;
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  /** Le voyage en cours dans la scène : son temps (départ ou arrivée), son début, où l'on en est. */
  const voyageRef = useRef<VoyageRun | null>(null);
  /** Le navire amarré : son origine dans le monde et les cases fantômes que l'on peut poser. */
  const vehicleRef = useRef<Amarre | null>(null);
  const pickBridgeRef = useRef(onPickBridge);
  pickBridgeRef.current = onPickBridge;
  const pickQuestRef = useRef(onPickQuest);
  pickQuestRef.current = onPickQuest;
  const pickPlaceRef = useRef(onPickPlace);
  pickPlaceRef.current = onPickPlace;
  // Les cubes des bornes de mission et des ouvrages, par case : pour savoir ce qu'on touche.
  const tags = useRef(cubeTags([]));
  useEffect(() => {
    // Un ouvrage construit se touche comme le sol (lot 2 de « Toucher le monde ») : seuls ceux en fantôme sont des cibles.
    const t = cubeTags(cubes);
    for (const [cle, id] of t.bridges) if (bridges.includes(id)) t.bridges.delete(cle);
    tags.current = t;
  }, [cubes, bridges]);
  // Ce qu'il faut pour trouver l'objet d'une fiche dans le monde (lu au moment du recadrage, pas à chaque image).
  const objetsRef = useRef({ cubes, creatures, vehicle });
  objetsRef.current = { cubes, creatures, vehicle };
  const buildRef = useRef(build);
  buildRef.current = build;
  const creatureRef = useRef(onPickCreature);
  creatureRef.current = onPickCreature;
  const bridgesRef = useRef(bridges);
  bridgesRef.current = bridges;
  const archRef = useRef(archipelago);
  archRef.current = archipelago;
  const vueDeplaceeRef = useRef(onVueDeplacee);
  vueDeplaceeRef.current = onVueDeplacee;
  const { settings } = useSettings();
  // Les props que la scène lit à chaque image (elle n'est pas refaite quand elles changent).
  const derniers = useRef<Derniers>({ carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, calme, onVoyageLegEnd });
  derniers.current = { carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, calme, onVoyageLegEnd };
  // Le passage de la baleine : demandé par `whalePass`, joué une fois par `seq` (même si la scène est refaite).
  const passSeqRef = useRef<number | null>(null);

  // ---- Création de la scène (une fois par archipel)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    // Le compteur de mesures (lot R0) : visible avec `?mesures`, lisible par les scripts en développement.
    const meter = createMeter(el, rendu, mesuresDemandees(), import.meta.env.DEV || mesuresDemandees());

    const scene = new THREE.Scene();
    const bounds = worldBounds(archipelago);
    // Archipéo (lot R1) : l'option de style `?style=a|b|c` (seulement avec le drapeau), sinon les textures des blocs.
    const habillage = habillageDe(rendu);
    const style = habillage.sol === 'facettes' ? styleDuMonde() : null;
    const monde: Monde = {
      scene,
      archipel: archipelago,
      habillage,
      surface: style ? surfaceDe(style, archipelago) : null,
      etendue: bounds,
      centre: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
      largeur: Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY),
    };
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.5, monde.largeur * 10);
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };

    // Les parties, créées dans l'ordre d'avant la découpe, à quelques objets près (les nappes de brume avant l'eau, la
    // flèche de la Carte après les balises, les créatures avant le terrain, la case visée avant le navire) : sans effet
    // sur l'image, le rendu trie les objets par matériau et profondeur. `bornes`, `etiquettes` et `personnages` lisent le
    // bonhomme et le sol par des fonctions, appelées seulement une fois toutes les parties créées.
    const lumiere = creerLumiere(monde, camera, derniers);
    const brume = creerBrume(monde, lumiere, instant);
    const large = creerLarge(monde, camera, lumiere, derniers, passSeqRef);
    const bornes = creerBornes(monde, () => personnages.avatar, instant);
    // Les plaques des créatures (créées plus bas, lues seulement à l'animation) : les étiquettes s'en écartent.
    const plaques = { boites: (cam: THREE.Camera, W: number, H: number) => signesDesCreatures.boites(cam, W, H), get version() { return signesDesCreatures.version; } };
    const etiquettes = creerEtiquettes(monde, el, camera, bornes.fleche, bornes.donneesDeLaFleche, () => personnages.avatar, instant, plaques, lecteurDePlaceLibre(el));
    const personnages = creerPersonnages(monde, () => cubesDuMonde.champ(), instant, lumiere);
    const cubesDuMonde = creerCubes(monde, large, lumiere, instant);
    const navire = creerNavire(monde, personnages, cubesDuMonde, derniers, instant, vehicleRef, voyageRef);
    const rond = creerRond(monde, personnages, () => cubesDuMonde.champ(), lumiere, instant);
    // Les bulles se tiennent dans la place libre : leur propre lecteur, pour ne pas changer la clé de celui de la caméra.
    const signesDesCreatures = creerSignes(monde, el, camera, personnages, derniers, instant, lecteurDePlaceLibre(el));
    const affordance = creerAffordance(monde, derniers, instant);
    // La Carte se cadre dans la place que l'interface laisse libre, autour de la flèche de la destination (DA-31).
    const lecture = {
      place: lecteurDePlaceLibre(el),
      // L'île de la flèche, ou la case où elle se pose sur un ouvrage (GD-7) : le cadrage garde la flèche dans la vue.
      destination: () => {
        const { ouvrage, pointe, island } = bornes.donneesDeLaFleche();
        return ouvrage ? pointe : island;
      },
    };
    const cadrage = creerCamera(monde, camera, personnages.avatar, derniers, instant, lecture);
    world.current = {
      camera,
      cadrage,
      bornes,
      affordance,
      etiquettes,
      personnages,
      signes: signesDesCreatures,
      cubes: cubesDuMonde,
      navire,
      recentrer: () => recentrer(),
      sauter: (objet) => {
        if (objet.genre === 'creature') {
          if (!reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(objet.id));
        } else if (objet.genre !== 'ile') sauterLeSigne(objet);
      },
      garderHorsDeLaFiche: (objet) => garderHorsDeLaFiche(objet),
    };
    // Les captures (scripts/prise-de-vue.mjs) posent la caméra à son cadrage sans attendre son pas : lisible par les
    // scripts, comme le compteur de mesures.
    const pourLesCaptures = { poser: () => cadrage.poser() };
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsCamera = pourLesCaptures;
    /** La vue déplacée, telle que la page la connaît : on ne la prévient que quand cela change. */
    let deplacee = false;
    const signaler = () => {
      const d = cadrage.decale();
      if (d === deplacee) return;
      deplacee = d;
      vueDeplaceeRef.current?.(d);
    };
    const recentrer = () => {
      cadrage.recentrer();
      signaler();
    };
    /** Ce qui bouge dans le monde, avant la caméra : le bonhomme, puis le navire (qui le fait embarquer et débarquer). */
    const deplacements: PartieDeLaScene[] = [personnages, navire];
    /** Le reste de l'image, dans cet ordre : la caméra suit ce qui a bougé ; les étiquettes se placent pour elle, en dernier. */
    const parties: PartieDeLaScene[] = [personnages, cadrage, bornes, affordance, brume, lumiere, large, navire, cubesDuMonde, rond, signesDesCreatures, etiquettes];

    // Clavier (le canvas prend le focus) : les flèches vont à l'île voisine dans cette direction.
    el.tabIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      // Pendant le voyage : Entrée, Espace ou Échap font arriver tout de suite ; les flèches attendent.
      if (voyageRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          voyageSkipRef.current?.();
        }
        return;
      }
      // Pendant une marche, les mêmes touches le font arriver tout de suite, comme un toucher dans le vide.
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && finishWalk(personnages.marche, performance.now())) {
        e.preventDefault();
        arriveRef.current?.();
        return;
      }
      // Sur la Carte, + et − zooment autour du centre de la place libre ; avec Ctrl ou Cmd, ils restent au navigateur
      // (agrandir la page).
      const modifie = e.ctrlKey || e.metaKey || e.altKey;
      const zoomClavier = modifie ? 0 : e.key === '+' || e.key === '=' ? 1.25 : e.key === '-' || e.key === '_' ? 0.8 : 0;
      if (zoomClavier && zoomPermis()) {
        e.preventDefault();
        const { libre } = lirePlaceLibre(el);
        const w = Math.max(1, el.clientWidth);
        const h = Math.max(1, el.clientHeight);
        if (cadrage.zoomer(zoomClavier, { x: (libre.x0 + libre.x1) / w - 1, y: 1 - (libre.y0 + libre.y1) / h })) signaler();
        return;
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir || !pickRef.current) return;
      e.preventDefault();
      const next = islandInDirection(archRef.current, { x: cadrage.cible.x, y: cadrage.cible.z }, dir);
      if (next) pickRef.current(next);
    };
    el.addEventListener('keydown', onKey);

    // Toucher une île (son sol : le bonhomme y va), une face ou une créature : un tap, pas un glissé. Un glissé d'un
    // doigt (ou à la souris) fait glisser la vue à plat (./glisse.ts). Sur la Carte, deux doigts qui se pincent la
    // zooment (la molette et les touches + et − aussi) ; ailleurs, un second doigt est ignoré.
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    /**
     * Le doigt posé : où, et, une fois le seuil passé, le point du sol saisi (`ancre`), qui reste sous le doigt tant
     * qu'il glisse. Sans ancre, ce n'est encore qu'un toucher.
     */
    let down: Appui | null = null;
    const viser = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
    };
    const aim = (e: PointerEvent) => {
      viser(e.clientX, e.clientY);
      const creature = ray.intersectObjects([...personnages.creatures.children, ...bornes.missions.children, navire.groupe], true)[0];
      const grounds = ray.intersectObjects(cubesDuMonde.cibles(), false);
      // Le décor en primitives déborde de sa case (une couronne d'arbre) : une cible derrière lui, sous le doigt, gagne
      // (world/scene.ts, toucheRetenue). Les quelques premiers objets traversés suffisent.
      const candidats = grounds.slice(0, 8);
      const touches: Touche[] = candidats.map((h) => ({ decor: Boolean(h.object.userData.decor), distance: h.distance, cible: !h.object.userData.decor && estUneCible(h) }));
      if (creature) touches.push({ decor: false, distance: creature.distance, cible: true });
      const i = toucheRetenue(touches);
      if (i < 0) return { creature: undefined, hit: undefined };
      if (creature && i === touches.length - 1) return { creature, hit: undefined };
      return { creature: undefined, hit: candidats[i] };
    };
    const questIdOf = (o: THREE.Object3D): { biome: BiomeId; typeId: string } | null => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (typeof cur.userData.quest === 'string') {
          const borne = borneDe(cur.userData.quest);
          return borne && { biome: borne.ile, typeId: borne.mission };
        }
        cur = cur.parent;
      }
      return null;
    };
    const creatureIdOf = (o: THREE.Object3D): { id: BiomeId; kind: 'creature' | 'guardian' } | null => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        const id: unknown = cur.userData.creature;
        if (typeof id === 'string') return estUnBiome(id) ? { id, kind: cur.userData.kind === 'guardian' ? 'guardian' : 'creature' } : null;
        cur = cur.parent;
      }
      return null;
    };
    const isInside = (o: THREE.Object3D, root: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (cur === root) return true;
        cur = cur.parent;
      }
      return false;
    };
    const onDown = (e: PointerEvent) => {
      // Sur la Carte, un second doigt posé pendant que le premier touche ou glisse : on pince.
      if (down && !pince && e.pointerType === 'touch' && e.pointerId !== down.id && zoomPermis()) return pincer(e, down);
      // Un seul doigt : le second, posé pendant que le premier touche ou glisse, ne fait rien.
      if (down || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, ancre: null };
      // Le glissé continue même si le doigt sort du canvas (sur un bouton, un panneau).
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // Un pointeur déjà relâché : rien à capturer.
      }
    };
    /**
     * Le glissé est permis : la page montre « Recentrer », ni marche suivie par la caméra ni voyage en cours (le toucher
     * y change le but ou fait arriver ; une flânerie sur son île, que la caméra ne suit pas, n'empêche rien). La Carte
     * aussi se fait glisser, une fois zoomée ou à son plancher, pour l'explorer.
     */
    const glissePermis = () => Boolean(vueDeplaceeRef.current) && !voyageRef.current && !instant.marche && !instant.navigue;
    /** Le zoom est permis : sur la Carte seulement, quand le glissé l'est. */
    const zoomPermis = () => glissePermis() && derniers.current.carte && instant.carte;
    /** Un point de l'écran (pixels du client) en coordonnées normalisées de la vue (−1 à 1), pour la caméra. */
    const versDe = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return { x: ((x - rect.left) / Math.max(1, rect.width)) * 2 - 1, y: -((y - rect.top) / Math.max(1, rect.height)) * 2 + 1 };
    };
    /**
     * Les deux doigts qui pincent la Carte : leurs identifiants et où ils sont, et leur écart et leur milieu au dernier
     * mouvement. Le milieu entraîne aussi la vue (deux doigts qui glissent ensemble la font glisser).
     */
    let pince: { a: { id: number; x: number; y: number }; b: { id: number; x: number; y: number }; ecart: number; mx: number; my: number } | null = null;
    const pincer = (e: PointerEvent, premier: Appui) => {
      const a = { id: premier.id, x: premier.cx, y: premier.cy };
      const b = { id: e.pointerId, x: e.clientX, y: e.clientY };
      pince = { a, b, ecart: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      premier.pince = true;
      cadrage.glissant = true;
      cubesDuMonde.viser(null);
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // Un pointeur déjà relâché : rien à capturer.
      }
    };
    /** Un des deux doigts bouge : la Carte zoome autour de leur milieu, et glisse avec lui. */
    const pincement = (e: PointerEvent) => {
      if (!pince) return;
      const { a, b } = pince;
      const doigt = e.pointerId === a.id ? a : b;
      doigt.x = e.clientX;
      doigt.y = e.clientY;
      const ecart = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      cadrage.zoomer(ecart / pince.ecart, versDe(mx, my));
      const avant = solSous(pince.mx, pince.my, cadrage.cible.y);
      const apres = solSous(mx, my, cadrage.cible.y);
      if (avant && apres) cadrage.glisser(avant.x - apres.x, avant.z - apres.z);
      pince.ecart = ecart;
      pince.mx = mx;
      pince.my = my;
      signaler();
    };
    /** La molette (ou le pavé tactile qui pince) sur la Carte : elle zoome autour du pointeur. */
    const onWheel = (e: WheelEvent) => {
      if (!zoomPermis()) return;
      e.preventDefault();
      const pixels = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      // Un pavé tactile qui pince envoie la molette avec Ctrl, par petits pas : plus sensible.
      const facteur = Math.exp(-e.deltaY * pixels * (e.ctrlKey ? 0.01 : 0.002));
      if (cadrage.zoomer(facteur, versDe(e.clientX, e.clientY))) signaler();
    };
    /** Le point du sol sous le doigt, sur le plan horizontal de l'ancre (au ras de l'horizon : rien). */
    const loinMax = monde.largeur * 3;
    const solSous = (x: number, y: number, hauteur: number) => {
      viser(x, y);
      return pointDuPlan(ray.ray.origin, ray.ray.direction, hauteur, loinMax);
    };
    /** Le point saisi sous l'appui : le sol (ou le décor), sinon le plan de la cible de la caméra ; ou rien (le ciel). */
    const ancreSous = (x: number, y: number): THREE.Vector3 | null => {
      viser(x, y);
      const sol = ray.intersectObjects(cubesDuMonde.cibles(), false)[0]?.point;
      if (sol) return sol.clone();
      const plan = pointDuPlan(ray.ray.origin, ray.ray.direction, cadrage.cible.y, loinMax);
      return plan ? new THREE.Vector3(plan.x, cadrage.cible.y, plan.z) : null;
    };
    /** Le doigt posé bouge : passé le seuil (et si c'est permis), la vue glisse avec lui. */
    const glisser = (e: PointerEvent, appui: Appui) => {
      appui.cx = e.clientX;
      appui.cy = e.clientY;
      let ancre = appui.ancre;
      if (!ancre) {
        if (!glisseCommence(e.clientX - appui.x, e.clientY - appui.y) || !glissePermis()) return;
        ancre = ancreSous(appui.x, appui.y);
        if (!ancre) return;
        appui.ancre = ancre;
        cadrage.glissant = true;
        renderer.domElement.style.cursor = 'grabbing';
        cubesDuMonde.viser(null);
      }
      const p = solSous(e.clientX, e.clientY, ancre.y);
      if (p) cadrage.glisser(ancre.x - p.x, ancre.z - p.z);
      signaler();
    };
    const lacher = (e: PointerEvent) => {
      if (renderer.domElement.hasPointerCapture?.(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
      down = null;
      pince = null;
      cadrage.glissant = false;
      if (renderer.domElement.style.cursor === 'grabbing') renderer.domElement.style.cursor = 'grab';
    };
    /** Un doigt pincé ? */
    const pinceAvec = (id: number) => pince !== null && (pince.a.id === id || pince.b.id === id);
    /**
     * Un des deux doigts qui pinçaient se lève : le pincement est fini, l'autre doigt reprend le glissé (sans rien ouvrir
     * en se levant) ; un second doigt reposé pince à nouveau.
     */
    const finDuPincement = (e: PointerEvent) => {
      if (!pince) return;
      if (renderer.domElement.hasPointerCapture?.(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
      const reste = pince.a.id === e.pointerId ? pince.b : pince.a;
      pince = null;
      cadrage.glissant = false;
      down = { id: reste.id, x: reste.x, y: reste.y, cx: reste.x, cy: reste.y, ancre: null, pince: true };
    };
    const onCancel = (e: PointerEvent) => {
      if (pinceAvec(e.pointerId)) finDuPincement(e);
      else if (down && e.pointerId === down.id) lacher(e);
    };
    /** Ce que dit un tap sur un cube : borne, lieu, ouvrage, face à construire en chantier, ou l'île. */
    const tapSur = (h: THREE.Intersection) =>
      groundTap(
        archRef.current,
        { ...cubesDuMonde.casesTouchees(h), ground: { x: h.point.x, y: h.point.z } },
        tags.current,
        { quest: Boolean(pickQuestRef.current), bridge: Boolean(pickBridgeRef.current), build: Boolean(buildRef.current), place: Boolean(pickPlaceRef.current) },
      );
    /** Un cube touché qui est une cible : borne, lieu, ouvrage, ou face à construire en chantier. */
    const estUneCible = (h: THREE.Intersection): boolean => tapSur(h).kind !== 'island';
    /** Un objet touché répond : la pile d'étoiles d'une borne réussie saute, sinon sa bulle rebondit, s'il en a une. */
    const sauterLeSigne = (objet: ObjetTouche) => {
      if (reduceMotion) return;
      if (objet.genre === 'borne' && bornes.sauterLaPile(objet.id)) return;
      signesDesCreatures.rebondir(cleDeLObjet(objet));
    };
    const centre = new THREE.Vector3();
    const versLeCentre = new THREE.Vector3();
    /**
     * Le doigt hors de tout objet : l'objet dont la zone de toucher (48 pixels au moins autour d'une borne ou d'un
     * Gardien petits à l'écran, three/affordance.ts) le prend,
     * selon ce qu'il a touché directement (`direct` ; world/affordance.ts, `zoneDuToucher` : jamais une face en chantier,
     * le sol seulement tout près de l'objet). Dans le ciel, un objet dont le centre est caché par le relief est écarté.
     */
    const objetDansLaZone = (x: number, y: number, direct: ToucherDirect): ObjetTouche | null => {
      if (direct?.genre === 'objet' || direct?.genre === 'face') return null;
      const rect = renderer.domElement.getBoundingClientRect();
      const zones = affordance.zones(camera, rect.width, rect.height);
      if (!zones.length) return null;
      const estCache = (i: number) => {
        const { min, max } = zones[i].zone.boite;
        centre.set((min.x + max.x) / 2, (min.z + max.z) / 2, (min.y + max.y) / 2);
        const loin = versLeCentre.subVectors(centre, camera.position).length();
        ray.set(camera.position, versLeCentre.normalize());
        const h = ray.intersectObjects(cubesDuMonde.cibles(), false)[0];
        if (!h || h.distance >= loin - SIGNE.masque) return false;
        // Le premier cube traversé est celui de l'objet (une borne, un lieu) : il n'est pas caché.
        const c = cubesDuMonde.casesTouchees(h).cell;
        return !(c.x >= min.x && c.x < max.x && c.y >= min.y && c.y < max.y && c.z >= min.z && c.z < max.z);
      };
      const i = zoneDuToucher(
        direct,
        zones.map((z) => z.zone),
        { x: x - rect.left, y: y - rect.top },
        estCache,
      );
      return i < 0 ? null : zones[i].objet;
    };
    /** Un objet retenu par sa zone : comme s'il avait été touché (la vue revient à son cadrage, son signe saute). */
    const toucherLObjet = (objet: ObjetTouche) => {
      recentrer();
      sauterLeSigne(objet);
      if (objet.genre === 'borne') {
        const borne = borneDe(objet.id);
        return borne ? pickQuestRef.current?.(borne.ile, borne.mission) : undefined;
      }
      if (objet.genre === 'gardien') return creatureRef.current?.(objet.id, 'guardian');
      if (objet.genre === 'navire') return pickVehicleRef.current?.(objet.port);
      if (objet.genre === 'ouvrage') return pickBridgeRef.current?.(objet.id);
      return pickPlaceRef.current?.(objet.id, objet.ile);
    };
    /** Le point du monde de l'objet d'une fiche : une créature là où elle se promène, sinon le centre de ses cubes. */
    const pointDeLObjet = (objet: ObjetDeLaFiche): THREE.Vector3 | null => {
      if (objet.genre === 'creature') {
        const o = personnages.creatures.children.find((c) => c.userData.creature === objet.id && c.userData.kind !== 'guardian');
        if (o) return o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1, 0));
      }
      const c = centreDeLObjet(objet, { ...objetsRef.current, ile: islandCenter });
      return c ? new THREE.Vector3(c.x, c.z, c.y) : null;
    };
    /**
     * La fiche (`.world-fiche`, dans la scène de la page) cache-t-elle l'objet, la caméra à sa place visée, ou est-il
     * hors de la vue ? Alors le cadrage glisse pour le poser au centre de la place libre (la fiche y compte) ; sinon la
     * caméra ne bouge pas.
     */
    const garderHorsDeLaFiche = (objet: ObjetDeLaFiche) => {
      // Son cadre, médaillon compris (Blocland : le portrait déborde au-dessus d'elle).
      const feuille = el.closest('[data-scene]')?.querySelector('.world-fiche-cadre, .world-fiche');
      const point = pointDeLObjet(objet);
      if (!feuille || !point) return;
      const vue = el.getBoundingClientRect();
      const ecran = cadrage.auBut(point, vue.width, vue.height);
      const f = feuille.getBoundingClientRect();
      // Hors de la vue (« Voir le premier ouvrage », « Y aller »), il est aussi caché.
      const horsDeLaVue = !ecran || ecran.x < 0 || ecran.y < 0 || ecran.x > vue.width || ecran.y > vue.height;
      if (!horsDeLaVue && !sousLaFiche(ecran, { x0: f.left - vue.left, y0: f.top - vue.top, x1: f.right - vue.left, y1: f.bottom - vue.top })) return;
      const { libre } = lirePlaceLibre(el);
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      cadrage.recadrer(point, { x: ((libre.x0 + libre.x1) / w) - 1, y: 1 - (libre.y0 + libre.y1) / h });
    };
    const onUp = (e: PointerEvent) => {
      if (pinceAvec(e.pointerId)) return finDuPincement(e);
      if (!down || e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const glisse = down.ancre !== null || Boolean(down.pince);
      lacher(e);
      // Après un glissé (ou un doigt qui a bougé pendant une marche ou un voyage), lever le doigt n'ouvre rien.
      if (glisse || moved >= SEUIL_DU_GLISSE) return;
      // Pendant le voyage, un tap n'importe où fait arriver le navire tout de suite.
      if (voyageRef.current) return voyageSkipRef.current?.();
      // Une bulle sous le doigt (sa plaque, pas les marges de sa case) passe d'abord : elle est dessinée par-dessus tout
      // (Blocland, world/affordance.ts).
      const vue = renderer.domElement.getBoundingClientRect();
      // Sur la Carte glissée ou zoomée, la bulle d'or tenue au bord ramène la vue d'ensemble, où sa cible se voit.
      if (derniers.current.carte && etiquettes.bulleAuBordSous(e.clientX - vue.left, e.clientY - vue.top)) return recentrer();
      const bulle = signesDesCreatures.sous(e.clientX - vue.left, e.clientY - vue.top, vue.width, vue.height);
      if (bulle?.genre === 'creature') {
        recentrer();
        if (!reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(bulle.id));
        return creatureRef.current?.(bulle.id, 'creature');
      }
      if (bulle) return toucherLObjet(bulle);
      const { creature, hit } = aim(e);
      // Un toucher direct sur un objet passe d'abord, une face en chantier aussi (le bloc s'y pose) ; sinon, dans le vide
      // ou sur le sol tout près d'une borne ou d'un Gardien petits, leur zone les retient (world/affordance.ts,
      // `zoneDuToucher`).
      const touche = hit ? tapSur(hit).kind : null;
      const direct: ToucherDirect =
        creature || (touche && touche !== 'face' && touche !== 'island')
          ? { genre: 'objet' }
          : touche === 'face'
            ? { genre: 'face' }
            : hit
              ? { genre: 'sol', case: cubesDuMonde.casesTouchees(hit).cell, distance: hit.distance }
              : null;
      const objet = objetDansLaZone(e.clientX, e.clientY, direct);
      if (objet) return toucherLObjet(objet);
      // Pendant un trajet, un tap dans le vide le fait arriver tout de suite ; sur le sol, il change son but (la page
      // décide, depuis là où il en est : `enRoute`) ; une cible garde sa priorité.
      const now = performance.now();
      const marche = personnages.marche;
      if (!creature && !hit && finishWalk(marche, now)) return arriveRef.current?.();
      const ici = enRoute(marche, now) ? walkPose(marche, now) : null;
      const enRouteIci = ici ? { x: ici.x, y: ici.y, z: ici.z } : undefined;
      if (creature && vehicleRef.current && isInside(creature.object, navire.groupe)) {
        // Une case du navire : en coordonnées locales (le navire tangue), puis dans le monde ; un fantôme se pose.
        const v = vehicleRef.current;
        const n = creature.face?.normal ?? new THREE.Vector3(0, 1, 0);
        const local = navire.groupe.worldToLocal(creature.point.clone().addScaledVector(n, -0.5));
        const cell = { x: v.origin.x + Math.floor(local.x), y: v.origin.y + Math.floor(local.z), z: v.origin.z + Math.floor(local.y) };
        sauterLeSigne({ genre: 'navire', port: v.port });
        if (v.ghosts.has(`${Math.floor(local.x)},${Math.floor(local.z)},${Math.floor(local.y)}`) && buildRef.current) return buildRef.current.onPickFace(cell, cell, { ile: v.port });
        return pickVehicleRef.current?.(v.port);
      }
      // Une cible touchée : l'application reprend la main, la vue revient à son cadrage. Pas sur le sol (world/scene.ts,
      // `recentrerApres`) : en chantier on pose bloc après bloc là où l'on regarde, et le bonhomme qui y va ne déplace
      // pas la vue.
      const tap = !creature && hit ? tapSur(hit) : null;
      // Sur la Carte, tout toucher qui fait quelque chose ramène la vue d'ensemble (le chemin d'une île pâle y est entier).
      if (recentrerApres(tap, Boolean(creature)) || (derniers.current.carte && (tap || creature))) recentrer();
      if (creature) {
        const quest = questIdOf(creature.object);
        if (quest) sauterLeSigne({ genre: 'borne', id: `${quest.biome}:${quest.typeId}` });
        if (quest && pickQuestRef.current) return pickQuestRef.current(quest.biome, quest.typeId);
        const found = creatureIdOf(creature.object);
        if (found?.kind === 'guardian') sauterLeSigne({ genre: 'gardien', id: found.id });
        if (found?.kind === 'creature' && !reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(found.id));
        if (found && creatureRef.current) return creatureRef.current(found.id, found.kind);
        if (found && !buildRef.current) return pickRef.current?.(found.id);
      }
      if (!tap) return;
      if (tap.kind === 'quest') sauterLeSigne({ genre: 'borne', id: `${tap.biome}:${tap.typeId}` });
      else if (tap.kind === 'place') sauterLeSigne({ genre: 'lieu', id: tap.place, ile: tap.island });
      else if (tap.kind === 'bridge') sauterLeSigne({ genre: 'ouvrage', id: tap.id });
      if (tap.kind === 'quest') pickQuestRef.current?.(tap.biome, tap.typeId);
      else if (tap.kind === 'place') pickPlaceRef.current?.(tap.place, tap.island);
      else if (tap.kind === 'bridge') pickBridgeRef.current?.(tap.id);
      // En chantier (une île ouverte), le sol touché est une face : une case d'un plan s'y pose, sinon le bonhomme y va.
      else if (tap.kind === 'face') buildRef.current?.onPickFace(tap.cell, tap.next, { terrain: { enRoute: enRouteIci } });
      // Le sol d'une île : la colonne touchée (celle où pousse un élément du décor touché), le bonhomme y va.
      else pickRef.current?.(tap.id, tap.cell, enRouteIci);
    };
    const onHover = (e: PointerEvent) => {
      // Deux doigts posés sur la Carte : on pince.
      if (pince) {
        if (pinceAvec(e.pointerId)) pincement(e);
        return;
      }
      // Un doigt posé : c'est un geste (toucher ou glissé), pas un survol.
      if (down) {
        if (e.pointerId === down.id) glisser(e, down);
        return;
      }
      if (e.pointerType === 'touch' || (!pickRef.current && !buildRef.current && !creatureRef.current)) return;
      const { creature, hit } = aim(e);
      renderer.domElement.style.cursor = creature || hit ? 'pointer' : 'grab';
      cubesDuMonde.viser(hit && buildRef.current ? cubesDuMonde.casesTouchees(hit).next : null);
    };
    const onLeave = () => cubesDuMonde.viser(null);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onHover);
    renderer.domElement.addEventListener('pointerleave', onLeave);
    renderer.domElement.addEventListener('pointercancel', onCancel);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      signesDesCreatures.redimensionner(h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // Jour et nuit : la lumière suit l'heure réelle, ajustée chaque minute (figée avec « réduire les animations »).
    lumiere.allumer(reduceMotion);

    // Économie de batterie : on ne dessine que si le canvas est visible et l'onglet actif ;
    // et si l'appareil peine (images trop longues), on baisse la finesse du rendu.
    let visible = true;
    let running = true;
    let slowFrames = 0;
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) start();
    });
    seen.observe(el);
    const onVisibility = () => {
      if (!document.hidden && !running) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let frame = 0;
    const clock = new THREE.Clock();
    let lastFrame = performance.now();
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
      const nowMs = performance.now();
      if (nowMs - lastFrame > 45 && renderer.getPixelRatio() > 1) {
        if (++slowFrames > 30) renderer.setPixelRatio(1);
      } else slowFrames = 0;
      // Jamais négatif : une horloge qui recule (celle, figée, des captures de la documentation) ne remonte pas le temps.
      const dt = Math.max(0, Math.min(0.1, (nowMs - lastFrame) / 1000));
      lastFrame = nowMs;
      if (!world.current) return;
      instant.now = performance.now();
      const t = clock.getElapsedTime();
      for (const p of deplacements) p.deplacer?.(t, dt, reduceMotion);
      instant.carte = derniers.current.carte && !instant.marche && !instant.navigue;
      for (const p of parties) p.animer?.(t, dt, reduceMotion);
      // La caméra efface le décalage quand l'application reprend la main (Carte, marche, voyage, nouvelle île).
      signaler();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, nowMs);
    };
    const start = () => {
      lastFrame = performance.now();
      loop();
    };
    start();
    // Où se tient un objet à l'écran, la caméra posée (le vol des blocs part de la borne de la mission).
    // Rien sur la Carte ni pendant un voyage : la caméra n'est pas sur l'île, le vol part alors du centre de la scène.
    const ouEst = (objet: ObjetDeLaFiche) => {
      if (derniers.current.carte || voyageRef.current || instant.navigue) return null;
      const point = pointDeLObjet(objet);
      const vue = el.getBoundingClientRect();
      const ecran = point ? cadrage.auBut(point, vue.width, vue.height) : null;
      return ecran ? { x: vue.left + ecran.x, y: vue.top + ecran.y } : null;
    };
    if (situer) situer.current = ouEst;

    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('keydown', onKey);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onHover);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      renderer.domElement.removeEventListener('wheel', onWheel);
      for (const p of parties) p.dispose();
      meter?.dispose();
      if (window.__dysappsCamera === pourLesCaptures) delete window.__dysappsCamera;
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
      if (situer?.current === ouEst) situer.current = null;
      // La scène refaite (un autre archipel) part de son cadrage : « Recentrer » n'a plus lieu d'être.
      if (deplacee) vueDeplaceeRef.current?.(false);
    };
    // La scène est construite une fois par archipel (sa mer, sa brume, ses baleines) ; le terrain, les créatures et la
    // caméra sont mis à jour à part. Le changement d'archipel se fait derrière l'écran du voyage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, archipelago]);

  // ---- « Recentrer » : la vue efface son décalage, la caméra revient en douceur à son cadrage
  useEffect(() => {
    if (recentrage) world.current?.recentrer();
  }, [recentrage]);

  // ---- Le geste de pose (Blocland, world/pose.ts) : le dernier bloc d'un plan descend et s'enclenche dans sa case.
  // Avant le terrain : le terrain garde son maillage d'avant (le fantôme de la case) le temps de la descente.
  const geste = Boolean(burst?.pose) && habillageDe(rendu).pose === 'geste';
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || !geste || reduceMotion) return;
    const { x, y, z } = burst.cell;
    const cube = cubes.find((c) => c.x === x && c.y === y && c.z === z && !c.ghost);
    // Le cube pas encore là (la scène suit d'un rendu) : les poussières, pour que la pose se voie quand même.
    if (cube) w.cubes.enclencher(cube);
    else w.cubes.eclater(burst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- La pose d'une partie en vague (GD-6, Blocland, world/vague.ts) : lancée une fois par `seq`, arrêtée quand la page
  // la retire (finie ou touchée). Relancée si la scène est refaite (un autre archipel, « Réduire les animations ») : la
  // partie ne reste jamais cachée, et le terrain est reposé dans le même effet (la scène neuve n'a pas encore les cubes),
  // une seule fois, avec la vague. Sur la même scène, le terrain reçu suffit : la vague lancée ou arrêtée le refait.
  const poseRef = useRef(onPose);
  poseRef.current = onPose;
  /** La scène qui a reçu le terrain : une scène refaite le reçoit de nouveau. */
  const terrainDe = useRef<object | null>(null);
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    if (pose) w.cubes.lancerLaVague(pose.cubes, (moment) => poseRef.current?.(moment));
    else w.cubes.arreterLaVague();
    // Pendant la vague, une plaque nouvelle se montre, mais les étiquettes attendent sa fin pour se replacer.
    w.signes.suivreLaVague(Boolean(pose));
    if (terrainDe.current !== w.cubes) {
      w.cubes.poser(cubes);
      terrainDe.current = w.cubes;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose?.seq, reduceMotion, archipelago]);

  // ---- Terrain : une géométrie par matériau, faces visibles seulement
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.cubes.poser(cubes);
    terrainDe.current = w.cubes;
  }, [cubes]);

  // ---- Créatures : un groupe chacune, positionné sur son île, animé dans la boucle
  useEffect(() => {
    world.current?.personnages.poserLesCreatures(creatures);
  }, [creatures]);

  // ---- Les créatures qui font signe (GD-4, étape 1) : un geste à l'arrivée sur leur île, puis l'icône de la notion
  const signesKey = signes.map((x) => `${x.id}:${x.icone}:${x.bloc ?? ''}`).join('|');
  useEffect(() => {
    world.current?.signes.poser(signes);
    // La liste refaite à chaque rendu de la page : on ne repose que si elle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signesKey, reduceMotion, archipelago]);

  // ---- Le moment du rallumage (lot 6) : la sentinelle se rallume en fondu, d'un coup avec moins d'animations
  useEffect(() => {
    world.current?.personnages.rallumer(rallumage?.id ?? null, reduceMotion ? 0 : (rallumage?.dureeMs ?? 0));
    // Un moment par `seq`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rallumage?.id, rallumage?.seq]);

  // ---- Le Bloc-Navire : la coque (tout ce qui est sous le mât) et le ballon, qui pivote au sommet du mât
  useEffect(() => {
    world.current?.navire.poser(vehicle);
  }, [vehicle]);

  // ---- Le voyage : au départ, le bonhomme marche jusqu'au pont ; à l'arrivée, il est à bord et le navire accoste
  useEffect(() => {
    world.current?.navire.voyager(voyage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire)
  useEffect(() => {
    world.current?.bornes.poserLaFleche(marker);
  }, [marker]);

  // ---- Blocland, sur la Carte : l'image de la bulle d'or de la prochaine destination
  const cleDeLImageDeLaCarte = imageDeLaCarte ? JSON.stringify(imageDeLaCarte) : '';
  useEffect(() => {
    world.current?.etiquettes.poserLImageDeLaCarte(imageDeLaCarte);
    // La scène refaite (mouvement réduit, archipel) repart sur l'étoile : l'image s'y repose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleDeLImageDeLaCarte, reduceMotion, archipelago]);

  // ---- Le nom des îles ouvertes (une texture par étiquette, refaite quand la liste change) ; sur la Carte, leur état
  const labelsKey = (islandLabels ?? []).map((l) => `${l.id}:${l.text}:${l.state?.id ?? ''}`).join('|');
  useEffect(() => {
    const etiquettes = world.current?.etiquettes;
    if (!etiquettes) return;
    etiquettes.poser(islandLabels);
    return etiquettes.vider;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsKey]);

  // ---- Mode chantier : pas de case visée en dehors
  useEffect(() => {
    world.current?.cubes.viser(null);
  }, [Boolean(build)]);

  // ---- À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens (sauf au geste
  // de pose de Blocland, sans poussière)
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || reduceMotion || geste) return;
    w.cubes.eclater(burst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- Le bonhomme : ses cubes (une fois), puis chaque itinéraire
  useEffect(() => {
    world.current?.personnages.montrerLeBonhomme(Boolean(avatar));
  }, [Boolean(avatar)]);
  useEffect(() => {
    const w = world.current;
    if (!w || !avatar || !avatar.route.length) return;
    w.personnages.marcher(avatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.seq]);

  // ---- Les repères des bornes de mission : les étoiles gagnées en petits cubes d'or empilés (dans Archipéo, aussi le
  // losange jaune qui rebondit, à faire). Rien sur une île fermée.
  const sommets = useMemo(() => sommetsDesBornes(cubes), [cubes]);
  useEffect(() => {
    world.current?.bornes.poserLesMissions(quests, sommets);
    // Refaits aussi quand la scène l'est (un autre archipel, la préférence de mouvement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests, sommets, reduceMotion, archipelago]);

  // ---- Les objets touchables (Blocland, world/affordance.ts) : leurs zones de toucher, et une bulle au-dessus de ceux
  // qui sont à faire (trois au plus sur l'île où l'on est, la prochaine chose à faire mise en avant).
  const signesDuMonde = useMemo(
    () => signesDesObjets({ cubes, quests, creatures, vehicle, etats: etatsDesObjets }),
    [cubes, quests, creatures, vehicle, etatsDesObjets],
  );
  useEffect(() => {
    world.current?.affordance.poser(signesDuMonde);
    world.current?.signes.poserLesObjets(signesDuMonde, prochaine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signesDuMonde, prochaine, reduceMotion, archipelago]);

  // ---- Le chemin à construire (sur la Carte) : une balise toutes les trois cases, au-dessus du sol.
  useEffect(() => {
    world.current?.bornes.poserLeChemin(trail);
  }, [trail]);

  // ---- La fiche ouverte (lot 2 de « Toucher le monde ») : son signe saute s'il n'a pas été touché ; une fois la fiche
  // posée (deux images), l'objet qu'elle cacherait est recadré dans la place libre.
  useEffect(() => {
    const w = world.current;
    if (!w || !fiche) return;
    if (fiche.saut) w.sauter(fiche.objet);
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => world.current?.garderHorsDeLaFiche(fiche.objet));
    });
    return () => cancelAnimationFrame(image);
    // Une fois par fiche ouverte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiche?.seq]);

  // ---- Caméra : l'île demandée (ou le bonhomme) est rejointe en douceur par la boucle ; au premier cadrage, d'un coup.
  useEffect(() => {
    const w = world.current;
    if (!w || focus.seq !== 0) return;
    w.cadrage.cadrer(focus, Boolean(map), home ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq]);

  return (
    <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} data-rendu={rendu} role="img" aria-label={`${label}. ${onVueDeplacee ? 'Faire glisser pour explorer. ' : ''}Au clavier : les flèches vont à l'île voisine${map ? ' ; les touches plus et moins rapprochent ou éloignent la Carte' : ''}.`} />
  );
}
