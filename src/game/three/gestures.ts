// Les gestes sur le monde en 3D (sortis de WorldCanvas.tsx, qualité du code, lot 7) : toucher une île, un objet, une
// créature ou une face en chantier ; faire glisser la vue ; la pincer ou la zoomer à la molette (la Carte comme le monde) ; le clavier. Les
// touchers deviennent les rappels de la vue (world/view.ts), lus au moment du geste.
import * as THREE from 'three';
import { estUnBiome, type BiomeId } from '../biomes';
import type { ArchipelagoId } from '../world/archipelago';
import { ARROW_DIRS, cubeTags, enRoute, finishWalk, groundTap, ileSurLaCarte, islandInDirection, recentrerApres, toucheRetenue, walkPose, type GroundTap, type Touche, type VoyageRun } from '../world/scene';
import { lirePlaceLibre } from '../freeSpace';
import type { RappelsDeLaVue } from '../world/view';
import { borneDe, cleDeLaCreature, SIGNE, zoneDuToucher, type ObjetTouche, type ToucherDirect } from '../world/affordance';
import type { Derniers, Monde } from './scenePart';
import type { Bornes } from './markers';
import type { Affordance } from './affordance';
import type { Etiquettes } from './labels';
import type { Personnages } from './characters';
import type { Signes } from './signs';
import type { Cubes } from './cubes';
import type { Amarre, Navire } from './ship';
import type { Camera } from './camera';
import { glisseCommence, pointDuPlan, quiGlisse, SEUIL_DU_CHOIX, SEUIL_DU_GLISSE } from './drag';

/** Le doigt posé sur le monde : son pointeur, où, et le point du sol saisi une fois le seuil passé (sinon `null`). */
interface Appui {
  id: number;
  x: number;
  y: number;
  ancre: THREE.Vector3 | null;
  /** Où il est maintenant (un second doigt peut se poser après qu'il a glissé). */
  cx: number;
  cy: number;
  /** Un second doigt s'est posé (la vue se pince) : lever les doigts n'ouvre rien. */
  pince?: boolean;
  /**
   * Le mode « Aménager », un choix en cours : au départ du glissé, le doigt est-il parti du choix (choix 3a du
   * mainteneur) ? `undefined` : pas encore décidé ; `null` : non, la vue glisse ; sinon la hauteur du plan où il le glisse.
   */
  tient?: { hauteur: number } | null;
  /** La case sous le doigt qui tient le choix : le choix ne suit que quand elle change. */
  place?: string;
  /** Parti du choix, ce que le doigt touchait, gardé jusqu'à `SEUIL_DU_CHOIX` (d'ici là, ni le choix ni la vue ne bougent). */
  depuis?: CibleDuChoix;
}

/** Ce que touchait le doigt au départ d'un glissé : le point (en cases du monde), sa hauteur, le lieu ou le Gardien. */
interface CibleDuChoix {
  point: { x: number; y: number };
  hauteur: number;
  touche: { lieu?: BiomeId; gardien?: BiomeId };
}

/** Ce que les gestes lisent de la scène : ses parties, les rappels de la vue, et ce que la vue permet. */
export interface ScenePourLesGestes {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  monde: Monde;
  derniers: { readonly current: Derniers };
  personnages: Personnages;
  bornes: Bornes;
  navire: Navire;
  cubes: Cubes;
  affordance: Affordance;
  signes: Signes;
  etiquettes: Etiquettes;
  cadrage: Camera;
  rappels: { readonly current: RappelsDeLaVue };
  voyage: { readonly current: VoyageRun | null };
  amarre: { readonly current: Amarre | null };
  archipel: { readonly current: ArchipelagoId };
  tags: { readonly current: ReturnType<typeof cubeTags> };
  reduceMotion: boolean;
  /** Le glissé est permis (voir WorldCanvas.tsx). */
  glissePermis(): boolean;
  /** Le zoom est permis : quand le glissé l'est, sur la Carte comme dans le monde. */
  zoomPermis(): boolean;
  recentrer(): void;
  /** Dit à la page que la vue est déplacée, ou ne l'est plus. */
  signaler(): void;
  /** Le signe de l'objet touché saute (s'il en porte un). */
  sauterLeSigne(objet: ObjetTouche): void;
}

/** L'objet d'un toucher sur une borne, un lieu ou un ouvrage ; `null` pour une face en chantier ou le sol d'une île. */
export function objetDuToucher(tap: GroundTap): ObjetTouche | null {
  if (tap.kind === 'quest') return { genre: 'borne', id: `${tap.biome}:${tap.typeId}` };
  if (tap.kind === 'place') return { genre: 'lieu', id: tap.place, ile: tap.island };
  if (tap.kind === 'bridge') return { genre: 'ouvrage', id: tap.id };
  return null;
}

type Ouvrir = { [G in ObjetTouche['genre']]: (objet: Extract<ObjetTouche, { genre: G }>, rappels: RappelsDeLaVue) => void };
/** Le rappel de la vue que touche chaque genre d'objet. */
const OUVRIR: Ouvrir = {
  borne: (objet, r) => {
    const borne = borneDe(objet.id);
    if (borne) r.onPickQuest?.(borne.ile, borne.mission);
  },
  gardien: (objet, r) => r.onPickCreature?.(objet.id, 'guardian'),
  navire: (objet, r) => r.onPickVehicle?.(objet.port),
  ouvrage: (objet, r) => r.onPickBridge?.(objet.id),
  lieu: (objet, r) => r.onPickPlace?.(objet.id, objet.ile),
};

/** Un objet touché ouvre sa fiche : le rappel de la vue de son genre. */
export function ouvrirLObjet(objet: ObjetTouche, rappels: RappelsDeLaVue): void {
  (OUVRIR[objet.genre] as (o: ObjetTouche, r: RappelsDeLaVue) => void)(objet, rappels);
}

/** Écoute les gestes sur le canvas ; rend de quoi arrêter d'écouter. */
export function ecouterLesGestes(scene: ScenePourLesGestes): () => void {
  const { canvas, camera, monde, derniers, personnages, bornes, navire, cubes: cubesDuMonde, affordance, signes: signesDesCreatures, etiquettes, cadrage } = scene;
  const { rappels, voyage: voyageRef, amarre: vehicleRef, archipel: archRef, tags, reduceMotion, glissePermis, zoomPermis, recentrer, signaler, sauterLeSigne } = scene;
  // Toucher une île (son sol : le bonhomme y va), une face ou une créature : un tap, pas un glissé. Un glissé d'un
  // doigt (ou à la souris) fait glisser la vue à plat (./drag.ts). Deux doigts qui se pincent la zooment, sur la
  // Carte comme dans le monde (la molette et les touches + et − aussi) ; pendant une marche ou un voyage, un second
  // doigt est ignoré.
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  /**
   * Le doigt posé : où, et, une fois le seuil passé, le point du sol saisi (`ancre`), qui reste sous le doigt tant
   * qu'il glisse. Sans ancre, ce n'est encore qu'un toucher.
   */
  let down: Appui | null = null;
  const viser = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
  };
  const aim = (e: { clientX: number; clientY: number }) => {
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
    // Un second doigt posé pendant que le premier touche ou glisse : on pince.
    if (down && !pince && e.pointerType === 'touch' && e.pointerId !== down.id && zoomPermis()) return pincer(e, down);
    // Un seul doigt : le second, posé pendant que le premier touche ou glisse, ne fait rien.
    if (down || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, ancre: null };
    // Le glissé continue même si le doigt sort du canvas (sur un bouton, un panneau).
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Un pointeur déjà relâché : rien à capturer.
    }
  };
  /** Un point de l'écran (pixels du client) en coordonnées normalisées de la vue (−1 à 1), pour la caméra. */
  const versDe = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect();
    return { x: ((x - rect.left) / Math.max(1, rect.width)) * 2 - 1, y: -((y - rect.top) / Math.max(1, rect.height)) * 2 + 1 };
  };
  /**
   * Les deux doigts qui pincent la vue : leurs identifiants et où ils sont, et leur écart et leur milieu au dernier
   * mouvement. Le milieu entraîne aussi la vue (deux doigts qui glissent ensemble la font glisser).
   */
  let pince: { a: { id: number; x: number; y: number }; b: { id: number; x: number; y: number }; ecart: number; mx: number; my: number } | null = null;
  const pincer = (e: PointerEvent, premier: Appui) => {
    // Un second doigt pendant que le premier glisse le choix : le choix reste là où il est, la vue se pince.
    lacherLeChoix(premier, false);
    const a = { id: premier.id, x: premier.cx, y: premier.cy };
    const b = { id: e.pointerId, x: e.clientX, y: e.clientY };
    pince = { a, b, ecart: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    premier.pince = true;
    cadrage.glissant = true;
    cubesDuMonde.viser(null);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Un pointeur déjà relâché : rien à capturer.
    }
  };
  /** Un des deux doigts bouge : la vue zoome autour de leur milieu, et glisse avec lui. */
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
  /** La molette (ou le pavé tactile qui pince) : la vue zoome autour du pointeur. */
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
  /** Le point de la mer sous le doigt (au niveau de l'eau), en cases du monde, ou rien (l'horizon). */
  const merSous = (x: number, y: number) => {
    const p = solSous(x, y, 0);
    return p ? { x: p.x, y: p.z } : null;
  };
  /**
   * Le mode « Aménager » : le doigt parti en (x, y) est-il parti du choix, ou d'un lieu ou d'un Gardien à prendre ?
   * Ce qu'il touchait (le Gardien, la terre d'un lieu, ou la mer) est demandé à la page, sans rien prendre encore.
   */
  const cibleDuChoix = (x: number, y: number): CibleDuChoix | null => {
    const g = derniers.current.glisserLeChoix;
    if (derniers.current.amenager === 'non' || !g) return null;
    const { creature, hit } = aim({ clientX: x, clientY: y });
    const found = creature ? creatureIdOf(creature.object) : null;
    let cible: CibleDuChoix | null = null;
    if (creature && found) cible = { point: { x: creature.point.x, y: creature.point.z }, hauteur: creature.point.y, touche: found.kind === 'guardian' ? { gardien: found.id } : { lieu: found.id } };
    else if (hit) {
      const tap = tapSur(hit);
      const lieu = tap.kind === 'island' ? tap.id : tap.kind === 'place' ? tap.island : undefined;
      cible = { point: { x: hit.point.x, y: hit.point.z }, hauteur: hit.point.y, touche: lieu ? { lieu } : {} };
    } else {
      const p = merSous(x, y);
      if (p) cible = { point: p, hauteur: 0, touche: {} };
    }
    return cible && g.partDuChoix(cible.point, cible.touche) ? cible : null;
  };
  /** Le doigt posé bouge : passé le seuil (et si c'est permis), la vue glisse avec lui ; ou le choix, s'il est parti de lui. */
  const glisser = (e: PointerEvent, appui: Appui) => {
    appui.cx = e.clientX;
    appui.cy = e.clientY;
    // Le mode « Aménager » (GD-9) : un glissé parti du choix, ou d'un autre lieu ou Gardien qu'il choisit alors, le glisse
    // au doigt (7 octobre 2026, choix 1b du mainteneur, puis « prendre directement ») ; parti de la mer, la vue glisse.
    if (appui.tient === undefined && derniers.current.amenager !== 'non') {
      if (!glisseCommence(e.clientX - appui.x, e.clientY - appui.y)) return;
      // Parti d'ailleurs que du choix : la Carte glisse dès `SEUIL_DU_GLISSE`. Parti du choix : il ne part qu'au-delà
      // d'un seuil plus grand (`SEUIL_DU_CHOIX`), et d'ici là la Carte non plus (`quiGlisse`).
      appui.depuis ??= cibleDuChoix(appui.x, appui.y) ?? undefined;
      const depuis = appui.depuis;
      if (quiGlisse(e.clientX - appui.x, e.clientY - appui.y, Boolean(depuis)) === 'attendre') return;
      appui.tient = depuis && derniers.current.glisserLeChoix?.prendre(depuis.point, depuis.touche) ? { hauteur: depuis.hauteur } : null;
      if (appui.tient) {
        appui.ancre = new THREE.Vector3();
        cubesDuMonde.viser(null);
        canvas.style.cursor = 'grabbing';
      }
    }
    if (appui.tient) {
      const p = solSous(e.clientX, e.clientY, appui.tient.hauteur);
      if (!p) return;
      // Une fois par case franchie, pas à chaque mouvement : la même case sous le doigt ne change rien. Pas par place de
      // la grille (4 cases) : le choix se cale sur la place la plus proche du doigt décalé de la prise, dont les bords
      // ne tombent pas sur ceux des places sous le doigt ; le choix y retarderait d'une place.
      const place = `${Math.floor(p.x)},${Math.floor(p.z)}`;
      if (place === appui.place) return;
      appui.place = place;
      derniers.current.glisserLeChoix?.suivre({ x: p.x, y: p.z });
      return;
    }
    let ancre = appui.ancre;
    if (!ancre) {
      if (!glisseCommence(e.clientX - appui.x, e.clientY - appui.y) || !glissePermis()) return;
      ancre = ancreSous(appui.x, appui.y);
      if (!ancre) return;
      appui.ancre = ancre;
      cadrage.glissant = true;
      canvas.style.cursor = 'grabbing';
      cubesDuMonde.viser(null);
    }
    const p = solSous(e.clientX, e.clientY, ancre.y);
    if (p) cadrage.glisser(ancre.x - p.x, ancre.z - p.z);
    signaler();
  };
  /** Le choix glissé est lâché : posé au lever du doigt (`poser`), laissé là si le geste est interrompu. */
  const lacherLeChoix = (appui: Appui, poser: boolean) => {
    if (!appui.tient) return;
    appui.tient = null;
    derniers.current.glisserLeChoix?.lacher(poser);
  };
  const lacher = (e: PointerEvent) => {
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (down) lacherLeChoix(down, false);
    down = null;
    pince = null;
    cadrage.glissant = false;
    if (canvas.style.cursor === 'grabbing') canvas.style.cursor = 'grab';
  };
  /** Un doigt pincé ? */
  const pinceAvec = (id: number) => pince !== null && (pince.a.id === id || pince.b.id === id);
  /**
   * Un des deux doigts qui pinçaient se lève : le pincement est fini, l'autre doigt reprend le glissé (sans rien ouvrir
   * en se levant) ; un second doigt reposé pince à nouveau.
   */
  const finDuPincement = (e: PointerEvent) => {
    if (!pince) return;
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
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
      { quest: Boolean(rappels.current.onPickQuest), bridge: Boolean(rappels.current.onPickBridge), build: Boolean(rappels.current.build), place: Boolean(rappels.current.onPickPlace) },
    );
  /** Un cube touché qui est une cible : borne, lieu, ouvrage, ou face à construire en chantier. */
  const estUneCible = (h: THREE.Intersection): boolean => tapSur(h).kind !== 'island';
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
    const rect = canvas.getBoundingClientRect();
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
    // Le signe saute avant que la vue revienne : après, les bulles seraient celles de l'île du cadrage.
    sauterLeSigne(objet);
    recentrer();
    ouvrirLObjet(objet, rappels.current);
  };
  const onUp = (e: PointerEvent) => {
    if (pinceAvec(e.pointerId)) return finDuPincement(e);
    if (!down || e.pointerId !== down.id) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const glisse = down.ancre !== null || Boolean(down.pince);
    // Parti d'un lieu ou d'un Gardien du mode « Aménager », un doigt qui a un peu bougé sans le prendre (sous
    // `SEUIL_DU_CHOIX`) : ni la Carte ni le choix n'ont bougé, c'est un toucher (un doigt peu précis le choisit quand même).
    const toucherQuiTremble = !glisse && down.depuis !== undefined && moved < SEUIL_DU_CHOIX;
    // Le choix glissé, lâché : posé tout de suite sur une place libre (choix 2a du mainteneur).
    lacherLeChoix(down, true);
    lacher(e);
    // Après un glissé (ou un doigt qui a bougé pendant une marche ou un voyage), lever le doigt n'ouvre rien.
    if (glisse || (moved >= SEUIL_DU_GLISSE && !toucherQuiTremble)) return;
    // Pendant le voyage, un tap n'importe où fait arriver le navire tout de suite.
    if (voyageRef.current) return rappels.current.onVoyageSkip?.();
    if (derniers.current.amenager !== 'non') return toucherEnAmenageant(e);
    if (derniers.current.carte) return toucherSurLaCarte(e);
    // Une bulle sous le doigt (sa plaque, pas les marges de sa case) passe d'abord : elle est dessinée par-dessus tout
    // (Blocland, world/affordance.ts).
    const vue = canvas.getBoundingClientRect();
    const bulle = signesDesCreatures.sous(e.clientX - vue.left, e.clientY - vue.top, vue.width, vue.height);
    if (bulle?.genre === 'creature') {
      if (!reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(bulle.id));
      recentrer();
      return rappels.current.onPickCreature?.(bulle.id, 'creature');
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
    if (!creature && !hit && finishWalk(marche, now)) return rappels.current.onArrive?.();
    const ici = enRoute(marche, now) ? walkPose(marche, now) : null;
    const enRouteIci = ici ? { x: ici.x, y: ici.y, z: ici.z } : undefined;
    if (creature && vehicleRef.current && isInside(creature.object, navire.groupe)) {
      // Une case du navire : en coordonnées locales (le navire tangue), puis dans le monde ; un fantôme se pose.
      const v = vehicleRef.current;
      const n = creature.face?.normal ?? new THREE.Vector3(0, 1, 0);
      const local = navire.groupe.worldToLocal(creature.point.clone().addScaledVector(n, -0.5));
      const cell = { x: v.origin.x + Math.floor(local.x), y: v.origin.y + Math.floor(local.z), z: v.origin.z + Math.floor(local.y) };
      sauterLeSigne({ genre: 'navire', port: v.port });
      if (v.ghosts.has(`${Math.floor(local.x)},${Math.floor(local.z)},${Math.floor(local.y)}`) && rappels.current.build) return rappels.current.build.onPickFace(cell, cell, { ile: v.port });
      return rappels.current.onPickVehicle?.(v.port);
    }
    // Une cible touchée : l'application reprend la main, la vue revient à son cadrage. Pas sur le sol (world/scene.ts,
    // `recentrerApres`) : en chantier on pose bloc après bloc là où l'on regarde, et le bonhomme qui y va ne déplace
    // pas la vue.
    const tap = !creature && hit ? tapSur(hit) : null;
    if (recentrerApres(tap, Boolean(creature))) recentrer();
    if (creature) {
      const quest = questIdOf(creature.object);
      if (quest) sauterLeSigne({ genre: 'borne', id: `${quest.biome}:${quest.typeId}` });
      if (quest && rappels.current.onPickQuest) return rappels.current.onPickQuest(quest.biome, quest.typeId);
      const found = creatureIdOf(creature.object);
      if (found?.kind === 'guardian') sauterLeSigne({ genre: 'gardien', id: found.id });
      if (found?.kind === 'creature' && !reduceMotion) signesDesCreatures.rebondir(cleDeLaCreature(found.id));
      if (found && rappels.current.onPickCreature) return rappels.current.onPickCreature(found.id, found.kind);
      if (found && !rappels.current.build) return rappels.current.onPickIsland?.(found.id);
    }
    if (!tap) return;
    // Une borne, un lieu ou un ouvrage : son signe saute, sa fiche s'ouvre.
    const objetTouche = objetDuToucher(tap);
    if (objetTouche) {
      sauterLeSigne(objetTouche);
      return ouvrirLObjet(objetTouche, rappels.current);
    }
    // En chantier (une île ouverte), le sol touché est une face : une case d'un plan s'y pose, sinon le bonhomme y va.
    if (tap.kind === 'face') rappels.current.build?.onPickFace(tap.cell, tap.next, { terrain: { enRoute: enRouteIci } });
    // Le sol d'une île : la colonne touchée (celle où pousse un élément du décor touché), le bonhomme y va.
    else if (tap.kind === 'island') rappels.current.onPickIsland?.(tap.id, tap.cell, enRouteIci);
  };
  /**
   * Un toucher sur la Carte (piste A du mainteneur, 7 octobre 2026) : la Carte sert à s'orienter, on n'y touche que des
   * îles. Une borne, une créature, un Gardien, le navire ou un lieu comptent pour leur île : ni fiche, ni signe qui
   * saute, ni zone de toucher, et on va sur l'île, pas jusqu'à la case touchée. Un ouvrage, la mer : rien. Le toucher
   * ramène la vue d'ensemble (le chemin d'une île pâle y est entier) ; sur la Carte glissée ou zoomée, la bulle d'or
   * tenue au bord la ramène aussi.
   */
  const toucherSurLaCarte = (e: PointerEvent) => {
    const vue = canvas.getBoundingClientRect();
    if (cadrage.decale() && etiquettes.bulleAuBordSous(e.clientX - vue.left, e.clientY - vue.top)) return recentrer();
    const ile = ileSousLeDoigt(e);
    if (!ile) return;
    recentrer();
    rappels.current.onPickIsland?.(ile);
  };
  /** L'île de ce qui est sous le doigt : celle d'une borne, d'une créature, d'un Gardien, du navire, ou son sol. */
  const ileSousLeDoigt = (e: PointerEvent): BiomeId | null => {
    const { creature, hit } = aim(e);
    if (creature) {
      if (vehicleRef.current && isInside(creature.object, navire.groupe)) return vehicleRef.current.port;
      return questIdOf(creature.object)?.biome ?? creatureIdOf(creature.object)?.id ?? null;
    }
    if (!hit) return null;
    return ileSurLaCarte(archRef.current, { ...cubesDuMonde.casesTouchees(hit), ground: { x: hit.point.x, y: hit.point.z } }, tags.current);
  };
  /**
   * Un toucher dans le mode « Aménager » (GD-9) : un Gardien, une borne, une liaison posée (son arrivée la plus proche),
   * un lieu (son sol, ou sa créature) ; sinon la mer, où le fantôme se cale. Aucune fiche ne s'ouvre, rien ne saute.
   */
  const toucherEnAmenageant = (e: PointerEvent) => {
    const r = rappels.current;
    const { creature, hit } = aim(e);
    if (creature) {
      const quest = questIdOf(creature.object);
      if (quest) return r.onPickQuest?.(quest.biome, quest.typeId);
      const found = creatureIdOf(creature.object);
      if (found?.kind === 'guardian') return r.onPickCreature?.(found.id, 'guardian');
      if (found) return r.onPickIsland?.(found.id);
    }
    if (hit) {
      const tap = tapSur(hit);
      if (tap.kind === 'quest') return r.onPickQuest?.(tap.biome, tap.typeId);
      if (tap.kind === 'bridge') return r.onPickBridge?.(tap.id, { x: hit.point.x, y: hit.point.z });
      if (tap.kind === 'island') return r.onPickIsland?.(tap.id, tap.cell);
      if (tap.kind === 'place') return r.onPickIsland?.(tap.island);
    }
    const p = merSous(e.clientX, e.clientY);
    if (p) r.onPickSea?.(p);
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
    if (e.pointerType === 'touch' || (!rappels.current.onPickIsland && !rappels.current.build && !rappels.current.onPickCreature)) return;
    const { creature, hit } = aim(e);
    canvas.style.cursor = creature || hit ? 'pointer' : 'grab';
    cubesDuMonde.viser(hit && rappels.current.build ? cubesDuMonde.casesTouchees(hit).next : null);
  };
  const onLeave = () => cubesDuMonde.viser(null);
  // Un appui long sur le monde, au doigt, est le début d'un glissé, jamais une sélection : iPadOS y montrerait sa loupe
  // et ne laisserait pas partir le glissé. Les gestes passent par les événements de pointeur, qui restent.
  const onTouchStart = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointermove', onHover);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointermove', onHover);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointercancel', onCancel);
    canvas.removeEventListener('wheel', onWheel);
  };
}

/** Ce que le clavier lit de la scène. */
type ScenePourLeClavier = Pick<ScenePourLesGestes, 'personnages' | 'cadrage' | 'rappels' | 'voyage' | 'archipel' | 'zoomPermis' | 'signaler' | 'derniers'>;

/** Écoute le clavier sur la vue (elle prend le focus) ; rend de quoi arrêter d'écouter. */
export function ecouterLeClavier(el: HTMLElement, scene: ScenePourLeClavier): () => void {
  const { personnages, cadrage, rappels, voyage: voyageRef, archipel: archRef, zoomPermis, signaler } = scene;
  // Le canvas prend le focus : les flèches vont à l'île voisine dans cette direction.
  el.tabIndex = 0;
  const onKey = (e: KeyboardEvent) => {
    // Pendant le voyage : Entrée, Espace ou Échap font arriver tout de suite ; les flèches attendent.
    if (voyageRef.current) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        rappels.current.onVoyageSkip?.();
      }
      return;
    }
    // Pendant une marche, les mêmes touches le font arriver tout de suite, comme un toucher dans le vide.
    if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && finishWalk(personnages.marche, performance.now())) {
      e.preventDefault();
      rappels.current.onArrive?.();
      return;
    }
    // + et − zooment autour du centre de la place libre ; avec Ctrl ou Cmd, ils restent au navigateur
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
    // Dans le mode « Aménager » (GD-9), les flèches sont celles de la barre du mode : la page les écoute.
    if (!dir || !rappels.current.onPickIsland || scene.derniers.current.amenager !== 'non') return;
    e.preventDefault();
    const next = islandInDirection(archRef.current, { x: cadrage.cible.x, y: cadrage.cible.z }, dir);
    if (next) rappels.current.onPickIsland(next);
  };
  el.addEventListener('keydown', onKey);
  return () => el.removeEventListener('keydown', onKey);
}
