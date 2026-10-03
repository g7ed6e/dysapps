// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra gérée que l'élève peut faire
// glisser à plat (bornée à l'archipel), eau autour des îles, vol vers une île, jour et nuit, créatures qui se
// promènent. Chargé à la demande (voir ./index.ts).
// La scène est faite de parties (cubes, navire, bornes, personnages, lumière, brume, étiquettes, le large, la caméra) :
// ce composant les crée, leur passe les props, écoute le toucher et le clavier, et sa boucle ne fait qu'itérer sur elles.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type BiomeId } from '../biomes';
import { worldBounds } from '../world/terrain';
import { ARROW_DIRS, cubeTags, enRoute, finishWalk, groundTap, islandInDirection, recentrerApres, toucheRetenue, walkPose, type Touche, type VoyageRun } from '../world/scene';
import { rappelsDeLaVue, type WorldViewProps } from '../world/view';
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
import { creerEtiquettes, type Etiquettes } from './etiquettes';
import { creerPersonnages, type Personnages } from './personnages';
import { creerSignes, type Signes } from './signes';
import { creerCubes, type Cubes } from './cubes';
import { creerNavire, type Amarre, type Navire } from './navire';
import { creerCamera, type Camera } from './camera';
import { creerRond } from './rond';
import { glisseCommence, pointDuPlan, SEUIL_DU_GLISSE } from './glisse';
import { lecteurDePlaceLibre } from '../placeLibre';

/** Le doigt posé sur le monde : son pointeur, où, et le point du sol saisi une fois le seuil passé (sinon `null`). */
interface Appui {
  id: number;
  x: number;
  y: number;
  ancre: THREE.Vector3 | null;
}

/** La scène en cours : le moteur de rendu, la caméra, et les parties que les props mettent à jour. */
interface Scene3D {
  camera: THREE.PerspectiveCamera;
  cadrage: Camera;
  bornes: Bornes;
  etiquettes: Etiquettes;
  personnages: Personnages;
  signes: Signes;
  cubes: Cubes;
  navire: Navire;
  /** Efface le décalage de l'élève et le dit à la page. */
  recentrer(): void;
}

export default function WorldCanvas({
  archipelago,
  cubes,
  focus: focusEnAncrages,
  reduceMotion = false,
  creatures = [],
  signes = [],
  forceDay = false,
  bridges = [],
  marker: markerEnAncrage = null,
  vehicle = null,
  voyage = null,
  avatar: avatarEnAncrages,
  map = false,
  home,
  trail: trailEnAncrages,
  quests: questsEnAncrages,
  islandLabels,
  whalePass = null,
  rallumage = null,
  burst: burstEnAncrage,
  pose = null,
  onPose,
  onVueDeplacee,
  recentrage = 0,
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
    tags.current = cubeTags(cubes);
  }, [cubes]);
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
  const derniers = useRef<Derniers>({ carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, onVoyageLegEnd });
  derniers.current = { carte: map, focus, home: home ?? null, forceDay, whalePass, sons: settings.sounds, onVoyageLegEnd };
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
    const etiquettes = creerEtiquettes(monde, el, camera, bornes.fleche, bornes.donneesDeLaFleche, () => personnages.avatar, instant, plaques);
    const personnages = creerPersonnages(monde, () => cubesDuMonde.champ(), instant, lumiere);
    const cubesDuMonde = creerCubes(monde, large, lumiere, instant);
    const navire = creerNavire(monde, personnages, cubesDuMonde, derniers, instant, vehicleRef, voyageRef);
    const rond = creerRond(monde, personnages, () => cubesDuMonde.champ(), lumiere, instant);
    const signesDesCreatures = creerSignes(monde, el, camera, personnages, derniers, instant);
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
    world.current = { camera, cadrage, bornes, etiquettes, personnages, signes: signesDesCreatures, cubes: cubesDuMonde, navire, recentrer: () => recentrer() };
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
    const parties: PartieDeLaScene[] = [personnages, cadrage, bornes, brume, lumiere, large, navire, cubesDuMonde, rond, signesDesCreatures, etiquettes];

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
      const dir = ARROW_DIRS[e.key];
      if (!dir || !pickRef.current) return;
      e.preventDefault();
      const next = islandInDirection(archRef.current, { x: cadrage.cible.x, y: cadrage.cible.z }, dir);
      if (next) pickRef.current(next);
    };
    el.addEventListener('keydown', onKey);

    // Toucher une île (son sol : le bonhomme y va), une face ou une créature : un tap, pas un glissé. Un glissé d'un
    // doigt (ou à la souris) fait glisser la vue à plat (./glisse.ts) ; un second doigt est ignoré (pas de pincer).
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
          const [biome, typeId] = (cur.userData.quest as string).split(':');
          return { biome: biome as BiomeId, typeId };
        }
        cur = cur.parent;
      }
      return null;
    };
    const creatureIdOf = (o: THREE.Object3D): { id: BiomeId; kind: 'creature' | 'guardian' } | null => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (typeof cur.userData.creature === 'string')
          return { id: cur.userData.creature as BiomeId, kind: cur.userData.kind === 'guardian' ? 'guardian' : 'creature' };
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
      // Un seul doigt : le second, posé pendant que le premier touche ou glisse, ne fait rien.
      if (down || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, ancre: null };
      // Le glissé continue même si le doigt sort du canvas (sur un bouton, un panneau).
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // Un pointeur déjà relâché : rien à capturer.
      }
    };
    /**
     * Le glissé est permis : la page montre « Recentrer », ni marche suivie par la caméra ni voyage en cours (le toucher
     * y change le but ou fait arriver ; une flânerie sur son île, que la caméra ne suit pas, n'empêche rien). Pas
     * sur la Carte : elle montre déjà l'archipel entier (DA-31), et son panneau tient la place de « Recentrer ».
     */
    const glissePermis = () => Boolean(vueDeplaceeRef.current) && !voyageRef.current && !instant.marche && !instant.navigue && !derniers.current.carte;
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
      cadrage.glissant = false;
      if (renderer.domElement.style.cursor === 'grabbing') renderer.domElement.style.cursor = 'grab';
    };
    const onCancel = (e: PointerEvent) => {
      if (down && e.pointerId === down.id) lacher(e);
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
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const glisse = down.ancre !== null;
      lacher(e);
      // Après un glissé (ou un doigt qui a bougé pendant une marche ou un voyage), lever le doigt n'ouvre rien.
      if (glisse || moved >= SEUIL_DU_GLISSE) return;
      // Pendant le voyage, un tap n'importe où fait arriver le navire tout de suite.
      if (voyageRef.current) return voyageSkipRef.current?.();
      const { creature, hit } = aim(e);
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
        if (v.ghosts.has(`${Math.floor(local.x)},${Math.floor(local.z)},${Math.floor(local.y)}`) && buildRef.current) return buildRef.current.onPickFace(cell, cell, { ile: v.port });
        return pickVehicleRef.current?.(v.port);
      }
      // Une cible touchée : l'application reprend la main, la vue revient à son cadrage. Pas sur le sol (world/scene.ts,
      // `recentrerApres`) : en chantier on pose bloc après bloc là où l'on regarde, et le bonhomme qui y va ne déplace
      // pas la vue.
      const tap = !creature && hit ? tapSur(hit) : null;
      if (recentrerApres(tap, Boolean(creature))) recentrer();
      if (creature) {
        const quest = questIdOf(creature.object);
        if (quest && pickQuestRef.current) return pickQuestRef.current(quest.biome, quest.typeId);
        const found = creatureIdOf(creature.object);
        if (found && creatureRef.current) return creatureRef.current(found.id, found.kind);
        if (found && !buildRef.current) return pickRef.current?.(found.id);
      }
      if (!tap) return;
      if (tap.kind === 'quest') pickQuestRef.current?.(tap.biome, tap.typeId);
      else if (tap.kind === 'place') pickPlaceRef.current?.(tap.place, tap.island);
      else if (tap.kind === 'bridge') pickBridgeRef.current?.(tap.id);
      // En chantier (une île ouverte), le sol touché est une face : une case d'un plan s'y pose, sinon le bonhomme y va.
      else if (tap.kind === 'face') buildRef.current?.onPickFace(tap.cell, tap.next, { terrain: { enRoute: enRouteIci } });
      // Le sol d'une île : la colonne touchée (celle où pousse un élément du décor touché), le bonhomme y va.
      else pickRef.current?.(tap.id, tap.cell, enRouteIci);
    };
    const onHover = (e: PointerEvent) => {
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
      for (const p of parties) p.dispose();
      meter?.dispose();
      if (window.__dysappsCamera === pourLesCaptures) delete window.__dysappsCamera;
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
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

  // ---- Les repères des bornes de mission : un losange jaune qui flotte (à faire), ou les étoiles gagnées en petits
  // cubes d'or empilés. Rien sur une île fermée.
  useEffect(() => {
    world.current?.bornes.poserLesMissions(quests);
  }, [quests]);

  // ---- Le chemin à construire (sur la Carte) : une balise toutes les trois cases, au-dessus du sol.
  useEffect(() => {
    world.current?.bornes.poserLeChemin(trail);
  }, [trail]);

  // ---- Caméra : l'île demandée (ou le bonhomme) est rejointe en douceur par la boucle ; au premier cadrage, d'un coup.
  useEffect(() => {
    const w = world.current;
    if (!w || focus.seq !== 0) return;
    w.cadrage.cadrer(focus, Boolean(map), home ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq]);

  return (
    <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} data-rendu={rendu} role="img" aria-label={`${label}. ${onVueDeplacee ? 'Faire glisser pour explorer. ' : ''}Au clavier : les flèches vont à l'île voisine.`} />
  );
}
