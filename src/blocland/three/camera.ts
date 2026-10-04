// La caméra de la scène 3D : gérée par l'application (pas de rotation ; on touche une île pour y aller).
// Elle rejoint en douceur sa place : le navire en route, le bonhomme qui marche, l'île ouverte, sinon le bonhomme.
// L'élève peut faire glisser la vue à plat pour explorer (./glisse.ts) : un décalage s'ajoute à ce cadrage, borné à
// l'archipel, et s'efface dès que l'application reprend la main (une île touchée, la Carte, une marche, un voyage).
// Sur la Carte seulement, l'élève peut aussi zoomer (pincer, molette, touches + et −) : de l'archipel entier, son
// cadrage d'ouverture, jusqu'à une île en gros plan (`zoomer`).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { RESERVE_DU_BAS, type PlaceLue, type Rect } from '../placeLibre';
import type { ArchipelagoId } from '../world/archipelago';
import { CADRAGE_DU_REPERE, repereDeLaVue } from '../world/cadrage';
import { mapOf } from '../world/map';
import { type CadreDeCases, DISTANCE_DE_LA_VUE_DE_L_ILE, islandCenter, VISEE_AU_DESSUS_DU_SOL, VUE_DE_L_ILE, viewYaw, viewZone, worldBounds } from '../world/terrain';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';
import { bornerLeDecalage, estDecale, type Decalage } from './glisse';

/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.42 };
/** Vue d'une île : plus haute, pour voir le plan au fond (world/terrain.ts : les bornes y restent visibles). */
export const ISLAND_VIEW = VUE_DE_L_ILE;
const ISLAND_DISTANCE = DISTANCE_DE_LA_VUE_DE_L_ILE;
/** Vue autour du bonhomme : assez loin pour voir son île et les voisines (bornes du cadrage de zone). */
const FOLLOW_DISTANCE = 50;
const FOLLOW_MAX = 64;
/** Autour d'une longue traversée (GD-7), en cases : les deux îles du bout dépassent un peu du trajet. */
const MARGE_DE_LA_TRAVERSEE = 8;
/** La Carte : presque à la verticale, le même nord ; la distance se règle sur la place libre (`cadrageDeLaCarte`). */
const MAP_VIEW = { dx: 0.03, dy: -0.4, up: 1 };
const MAP_FOV = 40;
/**
 * Le plancher du zoom de la Carte, en pixels CSS par case : une île (22 cases de large environ) y fait encore 75 px,
 * elle se reconnaît et son nom (18 px) se pose près d'elle. Plus loin, la caméra ne recule pas (DA-31).
 */
export const PLANCHER_DE_LA_CARTE = 3.4;
/**
 * Autour de la destination, en pixels CSS, ce qui doit tenir dans la place libre avec elle : la flèche au-dessus (48 px,
 * son rebond et sa pointe), puis son nom et son état juste au-dessus de la flèche (deux lignes, près de 60 px en
 * OpenDyslexic), ou dessous, sous l'île, quand le dessus est pris par une île voisine. Au plancher, en grand texte sur
 * tablette, ce cadre déborde de la place libre : il s'aligne sur son haut, et le nom du dessus tient toujours (DA-31).
 */
export const AUTOUR_DE_LA_DESTINATION = { haut: 124, bas: 64, cote: 110 };
/**
 * Le zoom de la Carte, au plus près : une île (`LARGEUR_D_UNE_ILE` cases) y remplit les deux tiers du petit côté de la
 * place libre. Au plus loin, le cadrage d'ouverture (jamais sous le plancher).
 */
export const ZOOM_DE_LA_CARTE = { ile: 2 / 3 };
/** La largeur d'une île, en cases (environ, world/terrain.ts) : la mesure du zoom le plus proche. */
const LARGEUR_D_UNE_ILE = 22;
/** Entre l'archipel entier et le bord de la place libre. */
const MARGE_DE_LA_CARTE = 12;
/** Sans page autour (un aperçu, un test) : une vue de tablette, moins la bande des boutons du bas. */
const HAUTEUR_DE_TABLETTE = 688;
/** Le voyage : vue de côté, depuis l'ouest, la caméra qui s'écarte à mesure que le navire s'éloigne. */
const VOYAGE_VIEW = { dx: -0.85, dy: -0.4, up: 0.3 };
/**
 * Le pas de la caméra vers sa place, en secondes, le même à chaque image : c'est ce qu'elle faisait avant la découpe
 * de la scène (son pas se calculait après la mise à jour de l'horloge de l'image, donc valait toujours ce repli).
 */
const PAS = 0.016;

/** Le cadrage de la Carte (DA-31) : la place que l'interface laisse libre, et la prochaine destination. */
export interface LectureDeLaCarte {
  /** La place libre de la vue, relue quand `contexte` change (../placeLibre.ts, `lecteurDePlaceLibre`). */
  place(contexte: string): PlaceLue;
  /** L'île sous la flèche de la Carte, ou le point du monde où elle pose sa pointe (un ouvrage, GD-7), ou `null`. */
  destination(): DestinationDeLaCarte;
}

/** Ce que la flèche de la Carte désigne : une île, ou le point du monde (x, y au sol, z en hauteur) de sa pointe. */
export type DestinationDeLaCarte = BiomeId | { x: number; y: number; z: number } | null;

/** Une clé de la destination, pour savoir si elle a changé (un point se compare par ses coordonnées). */
const cleDeLaDestination = (d: DestinationDeLaCarte): string => (d === null ? '' : typeof d === 'string' ? d : `${d.x},${d.y},${d.z}`);

/**
 * Le cadrage de la Carte dans la place libre `libre` d'une vue `w` × `h` (pixels CSS) : la caméra recule assez pour que
 * l'archipel entier y tienne, avec la destination, sa flèche et son nom, jusqu'au plancher (`PLANCHER_DE_LA_CARTE`).
 * Au-delà, elle reste au plancher et la destination se pose au centre de la place libre : le bord de l'archipel sort.
 * `echelle` : les pixels par case au centre visé ; `auPlancher` : l'archipel ne tient pas entier.
 */
export function cadrageDeLaCarte(
  archipel: ArchipelagoId,
  destination: DestinationDeLaCarte,
  w: number,
  h: number,
  libre: Rect,
): { target: THREE.Vector3; pos: THREE.Vector3; echelle: number; auPlancher: boolean } {
  const u = new THREE.Vector3(MAP_VIEW.dx, MAP_VIEW.up, MAP_VIEW.dy).normalize();
  const tan = Math.tan((MAP_FOV / 2) * (Math.PI / 180));
  const cam = new THREE.PerspectiveCamera(MAP_FOV, w / h, 0.5, 1e5);
  // L'étendue de l'archipel (terres, îlots et port, world/terrain.ts), à l'altitude de ses îles.
  const altitude = mapOf(archipel)[0]?.altitude ?? 0;
  const e = worldBounds(archipel);
  const terres = [e.minX, e.maxX].flatMap((x) => [e.minY, e.maxY].map((y) => new THREE.Vector3(x, altitude, y)));
  // La pointe de la flèche se pose au centre de l'île (three/etiquettes.ts), ou sur le point donné (un ouvrage).
  const c = typeof destination === 'string' ? islandCenter(destination) : null;
  const point = typeof destination === 'string' ? null : destination;
  const dest = c ? new THREE.Vector3(c.x + 0.5, c.z, c.y + 0.5) : point ? new THREE.Vector3(point.x, point.z, point.y) : null;
  const sol = dest?.y ?? altitude;
  const v = new THREE.Vector3();
  const target = new THREE.Vector3();
  const placer = (d: number) => {
    cam.position.copy(target).addScaledVector(u, d);
    cam.lookAt(target);
    cam.updateMatrixWorld();
  };
  const A = AUTOUR_DE_LA_DESTINATION;
  /** Le cadre à l'écran de ce qui doit tenir : les terres (si `tout`), et la destination avec ce qui l'entoure. */
  const cadre = (tout: boolean) => {
    const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const ajouter = (x: number, y: number) => {
      r.x0 = Math.min(r.x0, x);
      r.x1 = Math.max(r.x1, x);
      r.y0 = Math.min(r.y0, y);
      r.y1 = Math.max(r.y1, y);
    };
    const ecran = (p: THREE.Vector3) => {
      v.copy(p).project(cam);
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
    };
    if (tout)
      for (const p of terres) {
        const q = ecran(p);
        ajouter(q.x, q.y);
      }
    if (dest) {
      const q = ecran(dest);
      ajouter(q.x - A.cote, q.y - A.haut);
      ajouter(q.x + A.cote, q.y + A.bas);
    }
    return r;
  };
  const lw = libre.x1 - libre.x0 - 2 * MARGE_DE_LA_CARTE;
  const lh = libre.y1 - libre.y0 - 2 * MARGE_DE_LA_CARTE;
  const centreDesTerres = () => target.set((e.minX + e.maxX) / 2, sol, (e.minY + e.maxY) / 2);
  const tient = (d: number) => {
    centreDesTerres();
    placer(d);
    const r = cadre(true);
    return r.x1 - r.x0 <= lw && r.y1 - r.y0 <= lh;
  };
  const plancher = h / (2 * tan * PLANCHER_DE_LA_CARTE);
  const auPlancher = !tient(plancher);
  let d = plancher;
  if (!auPlancher) {
    // Le plus près où tout tient : la taille à l'écran décroît avec la distance, une dichotomie suffit.
    let lo = plancher / 16;
    for (let i = 0; i < 24; i++) {
      const m = (lo + d) / 2;
      if (tient(m)) d = m;
      else lo = m;
    }
  }
  // Le centre de ce qui doit tenir (tout, ou au plancher la destination seule) au centre de la place libre : la cible
  // glisse sur le sol, par petits pas corrigés à l'écran (la vue est un peu inclinée, la perspective déforme).
  centreDesTerres();
  const tout = !auPlancher || !dest;
  const vise = { x: (libre.x0 + libre.x1) / 2, y: (libre.y0 + libre.y1) / 2 };
  const milieu = () => {
    placer(d);
    const r = cadre(tout);
    return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
  };
  if (!tout && dest) target.set(dest.x, sol, dest.z);
  // Au plancher, un cadre plus haut que la place s'aligne sur son haut : le nom au-dessus de la flèche reste entier.
  const r0 = (placer(d), cadre(tout));
  if (r0.y1 - r0.y0 > lh) vise.y = libre.y0 + MARGE_DE_LA_CARTE + (r0.y1 - r0.y0) / 2;
  for (let i = 0; i < 4; i++) {
    const m0 = milieu();
    target.x += 1;
    const mx = milieu();
    target.x -= 1;
    target.z += 1;
    const mz = milieu();
    target.z -= 1;
    // Le déplacement à l'écran d'une case vers l'est (x) et vers le nord (z), puis la case à viser.
    const a = mx.x - m0.x;
    const b = mz.x - m0.x;
    const cc = mx.y - m0.y;
    const dd = mz.y - m0.y;
    const det = a * dd - b * cc;
    if (Math.abs(det) < 1e-9) break;
    const ex = vise.x - m0.x;
    const ey = vise.y - m0.y;
    target.x += (dd * ex - b * ey) / det;
    target.z += (a * ey - cc * ex) / det;
  }
  placer(d);
  return { target: target.clone(), pos: cam.position.clone(), echelle: h / (2 * d * tan), auPlancher };
}

/** Entre le trajet d'une longue traversée et le bord de la place libre, en pixels CSS. */
const MARGE_DE_LA_TRAVERSEE_PX = 16;
/**
 * La taille à l'écran d'une case, au centre du trajet (pixels CSS), sous laquelle le cadre fixe d'une longue traversée
 * n'est plus lisible : la caméra suit alors le bonhomme, comme avant GD-7. À 5 px la case, le bonhomme (deux cases de
 * haut) fait encore 10 px et un bac d'une case 5 px. Mesuré sur la traversée du port de la 6e (la plus longue) : 8,8 px
 * en tablette 1024 × 768, 6,8 en portrait 800 × 1280, 9,3 sur le pont du Phare (3e) ; 3,1 au téléphone 390 × 844 et 3,6
 * au téléphone couché 844 × 390, où les îles sont minuscules.
 */
export const ECHELLE_MIN_DE_LA_TRAVERSEE = 5;

/**
 * Le cadre fixe d'une longue traversée (GD-7) dans la place libre `libre` d'une vue `w` × `h` (pixels CSS) : le trajet
 * (`cadre`, en cases, élargi de `MARGE_DE_LA_TRAVERSEE`) tient dans la place, hors du haut de l'interface, de la barre du
 * bas et de la colonne Pause, et s'y pose au centre. Même direction de vue qu'en suivant le bonhomme, sans pivot ; jamais
 * plus près qu'en le suivant (`FOLLOW_DISTANCE`). `fov` : le champ de vision vertical de la caméra (degrés) ; `echelle` :
 * la taille à l'écran d'une case au centre du trajet (pixels CSS).
 */
export function cadrageDeLaTraversee(
  cadre: CadreDeCases,
  altitude: number,
  w: number,
  h: number,
  libre: Rect,
  fov: number,
): { target: THREE.Vector3; pos: THREE.Vector3; echelle: number } {
  const u = new THREE.Vector3(VIEW.dx, VIEW.up, VIEW.dy).normalize();
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.5, 1e5);
  const m = MARGE_DE_LA_TRAVERSEE / 2;
  const sol = altitude + VISEE_AU_DESSUS_DU_SOL;
  // Les coins du trajet, au sol, et au-dessus de la tête du bonhomme (deux blocs).
  const coins = [cadre.minX - m, cadre.maxX + 1 + m].flatMap((x) =>
    [cadre.minY - m, cadre.maxY + 1 + m].flatMap((y) => [new THREE.Vector3(x, altitude, y), new THREE.Vector3(x, altitude + 3, y)]),
  );
  const target = new THREE.Vector3((cadre.minX + cadre.maxX + 1) / 2, sol, (cadre.minY + cadre.maxY + 1) / 2);
  const v = new THREE.Vector3();
  const placer = (d: number) => {
    cam.position.copy(target).addScaledVector(u, d);
    cam.lookAt(target);
    cam.updateMatrixWorld();
  };
  const ecran = () => {
    const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const p of coins) {
      v.copy(p).project(cam);
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h;
      r.x0 = Math.min(r.x0, x);
      r.x1 = Math.max(r.x1, x);
      r.y0 = Math.min(r.y0, y);
      r.y1 = Math.max(r.y1, y);
    }
    return r;
  };
  const lw = libre.x1 - libre.x0 - 2 * MARGE_DE_LA_TRAVERSEE_PX;
  const lh = libre.y1 - libre.y0 - 2 * MARGE_DE_LA_TRAVERSEE_PX;
  const vise = { x: (libre.x0 + libre.x1) / 2, y: (libre.y0 + libre.y1) / 2 };
  // Centrer le trajet dans la place à la distance `d` : la cible glisse sur le sol, par petits pas corrigés à l'écran.
  const centrer = (d: number) => {
    for (let i = 0; i < 4; i++) {
      placer(d);
      const r0 = ecran();
      const m0 = { x: (r0.x0 + r0.x1) / 2, y: (r0.y0 + r0.y1) / 2 };
      target.x += 1;
      placer(d);
      const rx = ecran();
      target.x -= 1;
      target.z += 1;
      placer(d);
      const rz = ecran();
      target.z -= 1;
      const a = (rx.x0 + rx.x1) / 2 - m0.x;
      const b = (rz.x0 + rz.x1) / 2 - m0.x;
      const c = (rx.y0 + rx.y1) / 2 - m0.y;
      const dd = (rz.y0 + rz.y1) / 2 - m0.y;
      const det = a * dd - b * c;
      if (Math.abs(det) < 1e-9) break;
      const ex = vise.x - m0.x;
      const ey = vise.y - m0.y;
      target.x += (dd * ex - b * ey) / det;
      target.z += (a * ey - c * ex) / det;
    }
    placer(d);
    const r = ecran();
    return r.x0 >= libre.x0 + MARGE_DE_LA_TRAVERSEE_PX - 0.5 && r.x1 <= libre.x1 - MARGE_DE_LA_TRAVERSEE_PX + 0.5 && r.y0 >= libre.y0 + MARGE_DE_LA_TRAVERSEE_PX - 0.5 && r.y1 <= libre.y1 - MARGE_DE_LA_TRAVERSEE_PX + 0.5;
  };
  // Le plus près où tout tient (la taille à l'écran décroît avec la distance) : une dichotomie, centrée à chaque pas.
  let d = FOLLOW_DISTANCE;
  if (lw > 0 && lh > 0 && !centrer(d)) {
    let lo = d;
    let hi = d * 2;
    for (let i = 0; i < 12 && !centrer(hi); i++) hi *= 2;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (centrer(mid)) hi = mid;
      else lo = mid;
    }
    d = hi;
  }
  centrer(d);
  return { target: target.clone(), pos: cam.position.clone(), echelle: h / (2 * d * Math.tan((fov * Math.PI) / 360)) };
}

declare global {
  interface Window {
    /** La caméra, pour les captures (en développement, ou avec `?mesures`) : voir `Camera.poser`. */
    __dysappsCamera?: { poser(): number };
  }
}

export interface Camera extends PartieDeLaScene {
  /** Là où la caméra regarde en ce moment (les flèches du clavier cherchent l'île voisine depuis ce point). */
  cible: THREE.Vector3;
  /** Au premier cadrage : la caméra y est d'un coup. */
  cadrer(focus: Derniers['focus'], carte: boolean, home: BiomeId | null): void;
  /**
   * Fait glisser la vue de (`dx`, `dz`) cases sur le plan horizontal, borné à l'archipel : la caméra y est tout de suite
   * (la vue suit le doigt), et sa place visée aussi. Le nord, la hauteur et la direction de vue ne changent pas.
   */
  glisser(dx: number, dz: number): void;
  /** Remet le décalage à zéro : la caméra revient en douceur à son cadrage (d'un coup, avec moins d'animations). */
  recentrer(): void;
  /** La vue a été déplacée (un décalage non nul) ou zoomée. */
  decale(): boolean;
  /** Le décalage de la vue glissée, en cases sur le plan horizontal (zéro : la vue à son cadrage). */
  decalage(): Readonly<{ x: number; z: number }>;
  /**
   * Sur la Carte seulement : rapproche (`facteur` > 1) ou éloigne la vue, borné entre le cadrage d'ouverture et une île
   * en gros plan (`ZOOM_DE_LA_CARTE`). Le point du sol vu en `vers` (coordonnées normalisées de l'écran, −1 à 1) reste
   * sous le doigt ; la caméra y est tout de suite. Ni le nord, ni la direction de vue ne changent. Rend vrai si la vue a
   * changé.
   */
  zoomer(facteur: number, vers: { x: number; y: number }): boolean;
  /**
   * Pour les captures : met la caméra d'un coup à son cadrage de la dernière image, sans attendre son pas, et rend
   * l'écart qu'il restait (infini avant la première image). Deux appels de suite qui rendent presque zéro : le cadrage
   * ne bouge plus.
   */
  poser(): number;
  /**
   * Un glissé est en cours : les étiquettes gardent l'écart calculé au début (pas de nouveau calcul à chaque image) ;
   * elles le refont une fois le doigt levé.
   */
  glissant: boolean;
  /**
   * Où ce point du monde se pose à l'écran (pixels CSS d'une vue `W` × `H`), la caméra à sa place visée (pas celle où
   * elle est en chemin) ; `null` avant la première image ou derrière la caméra.
   */
  auBut(point: THREE.Vector3, W: number, H: number): { x: number; y: number } | null;
  /**
   * La fiche d'un objet le cache (lot 2 de « Toucher le monde ») : le cadrage glisse à plat pour que ce point du monde se
   * pose en `vers` (coordonnées normalisées de l'écran, −1 à 1), sans changer de distance ni de direction. Effacé quand
   * l'application reprend la main (une île, la Carte, une marche, un voyage).
   */
  recadrer(point: THREE.Vector3, vers: { x: number; y: number }): void;
}

/** Le point visé de l'écran, réutilisé d'un appel à l'autre (le recadrage le demande à chaque image). */
const VISEE = new THREE.Vector2();

/**
 * Le glissement à plat (`out`, sur le plan horizontal) qui pose le point `point` du monde en `vers` (coordonnées
 * normalisées de l'écran) pour la caméra `cam` déjà placée : le point du plan de `point` vu en `vers` avant le glissement
 * devient `point`. Zéro si ce plan n'est pas devant la caméra en `vers` (l'horizon).
 */
export function decalagePourViser(cam: THREE.PerspectiveCamera, point: THREE.Vector3, vers: { x: number; y: number }, out: THREE.Vector3, ray = new THREE.Raycaster()): THREE.Vector3 {
  cam.updateMatrixWorld();
  ray.setFromCamera(VISEE.set(vers.x, vers.y), cam);
  const { origin: o, direction: d } = ray.ray;
  if (Math.abs(d.y) < 1e-6) return out.set(0, 0, 0);
  const t = (point.y - o.y) / d.y;
  if (t <= 0) return out.set(0, 0, 0);
  return out.set(point.x - (o.x + d.x * t), 0, point.z - (o.z + d.z * t));
}

/**
 * La caméra de la scène ; `carte` : ce qu'elle lit pour cadrer la Carte (la place libre, la destination). Sans elle (un
 * test), la vue d'une tablette moins la bande du bas, sans destination.
 */
export function creerCamera(
  monde: Monde,
  camera: THREE.PerspectiveCamera,
  avatar: THREE.Object3D,
  derniers: { readonly current: Derniers },
  instant: Instant,
  carte: LectureDeLaCarte | null = null,
): Camera {
  const reperes = monde.habillage.reperes === 'cadres';
  /** Combien de fois la Carte s'est ouverte : à chaque ouverture, la place libre est relue. */
  let ouvertures = 0;
  let surLaCarte = false;
  let contexte = { ouvertures: -1, destination: '', cle: '' };
  let cadrageCarte: { lue: PlaceLue | null; destination: string; aspect: number; target: THREE.Vector3; pos: THREE.Vector3; echelle: number; zoomMax: number } | null = null;
  /**
   * Le cadrage de la Carte, recalculé seulement quand la place libre lue (le même objet tant qu'elle ne change pas) ou
   * la destination changent (pas image par image). `saut` : sans mouvement.
   */
  const laCarte = (aspect: number) => {
    if (!surLaCarte) ouvertures++;
    surLaCarte = true;
    const destination = carte?.destination() ?? null;
    const cle = cleDeLaDestination(destination);
    if (contexte.ouvertures !== ouvertures || contexte.destination !== cle) contexte = { ouvertures, destination: cle, cle: `${ouvertures}|${cle}` };
    const lue = carte?.place(contexte.cle) ?? null;
    if (!cadrageCarte || cadrageCarte.lue !== lue || cadrageCarte.destination !== cle || (!lue && cadrageCarte.aspect !== aspect)) {
      // Sans lecture (un test) : une vue de tablette, moins la bande des boutons du bas.
      const w = lue ? Math.max(1, lue.w) : HAUTEUR_DE_TABLETTE * aspect;
      const h = lue ? Math.max(1, lue.h) : HAUTEUR_DE_TABLETTE;
      const libre = lue?.libre ?? { x0: 0, y0: 0, x1: w, y1: h - RESERVE_DU_BAS };
      const c = cadrageDeLaCarte(monde.archipel, destination, w, h, libre);
      // Au plus près, une île remplit les deux tiers du petit côté de la place libre (jamais moins près qu'à l'ouverture).
      const cote = Math.max(1, Math.min(libre.x1 - libre.x0, libre.y1 - libre.y0));
      const zoomMax = Math.max(1, (ZOOM_DE_LA_CARTE.ile * cote) / (LARGEUR_D_UNE_ILE * c.echelle));
      cadrageCarte = { lue, destination: cle, aspect, ...c, zoomMax };
    }
    return { target: cadrageCarte.target, pos: cadrageCarte.pos, saut: lue?.saut ?? false };
  };
  /**
   * Où la caméra veut être : sur l'île ouverte (vue rapprochée), sinon autour du bonhomme. La caméra est gérée par
   * l'application : pas de rotation ; on touche une île pour y aller, ou on fait glisser la vue (le décalage, et sur la
   * Carte le zoom, s'ajoutent après, dans `animer`). En portrait, un peu plus loin pour que tout tienne dans la largeur.
   */
  const framing = (
    island: BiomeId | null,
    avatarAt: THREE.Vector3,
    aspect: number,
    onMap = false,
    zone: BiomeId | null = null,
    spot: { x: number; y: number; z: number } | null = null,
  ) => {
    // La Carte : l'archipel entier dans la place libre, ou au plancher la destination en son centre (DA-31).
    if (onMap) return laCarte(aspect);
    surLaCarte = false;
    const portrait = aspect < 1 ? 1 / Math.sqrt(Math.max(0.4, aspect)) : 1;
    const avatar = { x: avatarAt.x, y: avatarAt.z, z: avatarAt.y };
    let c = spot ?? (island ? islandCenter(island) : avatar);
    let d = (island ? ISLAND_DISTANCE : FOLLOW_DISTANCE) * portrait;
    const v = island ? ISLAND_VIEW : VIEW;
    // Bonhomme posé sur son île : on cadre la zone (son île et ses voisines), le bonhomme restant au premier tiers.
    if (!island && zone) {
      const z = viewZone(zone);
      const zc = { x: (z.minX + z.maxX) / 2, y: (z.minY + z.maxY) / 2 };
      const home = islandCenter(zone);
      c = { x: (home.x * 2 + zc.x) / 3, y: (home.y * 2 + zc.y) / 3, z: home.z };
      const ex = z.maxX - z.minX;
      const ey = z.maxY - z.minY;
      const need = (Math.max(ex / Math.max(0.6, aspect), ey * 1.1) * 0.5) / Math.tan((20 * Math.PI) / 180);
      d = Math.min(FOLLOW_MAX, Math.max(FOLLOW_DISTANCE, need * 0.8)) * portrait;
    }
    // Archipéo : un grand repère de la vue (le grand phare des Îles du Ciel) reste dans le cadre : la cible glisse vers
    // lui et la caméra recule un peu (world/cadrage.ts). Pas sur une place précise de l'île (`spot`).
    const repere = reperes && !spot && (island || zone) ? repereDeLaVue(island, island ? null : zone) : null;
    let pivot = 0;
    if (repere) {
      // Depuis l'île même du repère, ou une île d'où la vue pivote pour lui (world/cadrage.ts), la cible ne glisse pas :
      // le pivot suffit, et l'île de la vue reste au premier plan.
      const pivote = zone !== null && (zone === repere.ile || repere.pivot?.[zone] !== undefined);
      const k = island ? CADRAGE_DU_REPERE.ile : pivote ? null : CADRAGE_DU_REPERE.zone;
      if (k) {
        c = { x: c.x + k.vers * (repere.x - c.x), y: c.y + k.vers * (repere.y - c.y), z: c.z };
        d *= k.recul;
      }
      if (!island && zone) pivot = repere.pivot?.[zone] ?? 0;
    }
    // Le pivot vers le cœur du continent : la direction de vue tourne autour de la verticale.
    // (pivot positif : la caméra passe à l'ouest et regarde vers l'est, d'où le signe).
    const yaw = -(island ? viewYaw(island) : zone ? viewYaw(zone) : 0) + pivot;
    const dx = v.dx * Math.cos(yaw) - v.dy * Math.sin(yaw);
    const dy = v.dx * Math.sin(yaw) + v.dy * Math.cos(yaw);
    const target = new THREE.Vector3(c.x, c.z + VISEE_AU_DESSUS_DU_SOL, c.y);
    const pos = new THREE.Vector3(c.x + d * dx, c.z + VISEE_AU_DESSUS_DU_SOL + d * v.up, c.y + d * dy);
    return { target, pos };
  };

  /**
   * Une longue traversée (GD-7) : la caméra se pose sur tout le trajet, du départ à l'arrivée, dans la place libre de la
   * vue (comme la Carte, DA-31), et ne bouge plus ; le bonhomme traverse le cadre. Calculé une fois par traversée : rien
   * n'est recalculé ni alloué tant que le cadre (le même objet), la place lue et l'aspect ne changent pas. Si le trajet
   * entier ne tient qu'en trop petit (`ECHELLE_MIN_DE_LA_TRAVERSEE`, un téléphone) : `null`, la caméra suit le bonhomme.
   */
  const altitude = mapOf(monde.archipel)[0]?.altitude ?? 0;
  let cadreFixe: { cadre: CadreDeCases; lue: PlaceLue | null; aspect: number; contexte: string; target: THREE.Vector3; pos: THREE.Vector3; echelle: number } | null = null;
  let traversees = 0;
  const traversee = (z: CadreDeCases, aspect: number) => {
    // Une nouvelle traversée : la place libre est relue (un autre contexte), une fois.
    const contexte = cadreFixe?.cadre === z ? cadreFixe.contexte : `traversee|${++traversees}`;
    const lue = carte?.place(contexte) ?? null;
    if (!cadreFixe || cadreFixe.cadre !== z || cadreFixe.lue !== lue || cadreFixe.aspect !== aspect) {
      const w = lue ? Math.max(1, lue.w) : HAUTEUR_DE_TABLETTE * aspect;
      const h = lue ? Math.max(1, lue.h) : HAUTEUR_DE_TABLETTE;
      const libre = lue?.libre ?? { x0: 0, y0: 0, x1: w, y1: h - RESERVE_DU_BAS };
      cadreFixe = { cadre: z, lue, aspect, contexte, ...cadrageDeLaTraversee(z, altitude, w, h, libre, camera.fov) };
    }
    return cadreFixe.echelle >= ECHELLE_MIN_DE_LA_TRAVERSEE ? cadreFixe : null;
  };

  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const { but } = instant;
  const etendue = worldBounds(monde.archipel);
  /** Le décalage de l'élève (glissé), et celui que voient les étiquettes (gelé pendant un glissé). */
  const decalage: Decalage = { x: 0, z: 0 };
  const decalageDuBut: Decalage = { x: 0, z: 0 };
  /** La cible du cadrage géré, sans décalage, à la dernière image : le bornage se fait autour d'elle. */
  const base: Decalage = { x: 0, z: 0 };
  /** La place visée à cette image, décalage compris (sans allocation : le cadrage de la Carte est gardé tel quel). */
  const vise = new THREE.Vector3();
  const place = new THREE.Vector3();
  /** Ce qui, en changeant, rend la main à l'application : la demande de cadrage, la Carte ouverte ou fermée. */
  const demande = { seq: -1, ile: null as BiomeId | null, carte: false };
  /** Le décalage voulu par un glissé, avant bornage (gardé d'un appel à l'autre : pas d'allocation). */
  const voulu: Decalage = { x: 0, z: 0 };
  /**
   * Le zoom de la Carte : 1 au cadrage d'ouverture, plus grand en se rapprochant (la distance à la cible est divisée
   * d'autant) ; et celui que voient les étiquettes (gelé pendant un geste, comme le décalage).
   */
  let zoom = 1;
  let zoomDuBut = 1;
  const zero = () => {
    decalage.x = 0;
    decalage.z = 0;
    zoom = 1;
  };
  /** Les points du sol sous le doigt, avant et après un zoom (alloués une fois). */
  const avantLeZoom = new THREE.Vector3();
  const apresLeZoom = new THREE.Vector3();
  /** Le point du plan horizontal de la cible vu en `vers` par la caméra, dans `out` ; faux à l'horizon. */
  const solVu = (vers: { x: number; y: number }, out: THREE.Vector3): boolean => {
    camera.updateMatrixWorld();
    rayon.setFromCamera(VISEE.set(vers.x, vers.y), camera);
    const { origin: o, direction: d } = rayon.ray;
    if (Math.abs(d.y) < 1e-6) return false;
    const t = (camTarget.y - o.y) / d.y;
    if (t <= 0) return false;
    out.set(o.x + d.x * t, camTarget.y, o.z + d.z * t);
    return true;
  };
  /** Le cadrage a été calculé au moins une fois (`vise` et `place` le tiennent). */
  let vu = false;
  /** Le recadrage d'une fiche (`recadrer`) : le point à poser, et où ; effacé quand l'application reprend la main. */
  let recadre: { point: THREE.Vector3; vers: { x: number; y: number } } | null = null;
  /** Une caméra et un rayon de travail, pour le recadrage d'une fiche (alloués une fois). */
  const essai = new THREE.PerspectiveCamera();
  const rayon = new THREE.Raycaster();
  const glissement = new THREE.Vector3();
  const projete = new THREE.Vector3();
  /** Place la caméra de travail en `pos`, regardant `target`, comme la vraie. */
  const placerLEssai = (target: THREE.Vector3, pos: THREE.Vector3) => {
    essai.fov = camera.fov;
    essai.aspect = camera.aspect;
    essai.near = camera.near;
    essai.far = camera.far;
    essai.updateProjectionMatrix();
    essai.position.copy(pos);
    essai.lookAt(target);
    essai.updateMatrixWorld();
  };

  const self: Camera = {
    cible: camTarget,
    glissant: false,
    cadrer: (focus, carteOuverte, home) => {
      const { target, pos } = framing(focus.island, avatar.position, camera.aspect, carteOuverte, home, focus.spot ?? null);
      zero();
      camTarget.copy(target);
      camPos.copy(pos);
      camera.position.copy(pos);
      camera.lookAt(target);
    },
    glisser: (dx, dz) => {
      voulu.x = decalage.x + dx;
      voulu.z = decalage.z + dz;
      bornerLeDecalage(base, voulu, etendue, voulu);
      const fait = { x: voulu.x - decalage.x, z: voulu.z - decalage.z };
      decalage.x = voulu.x;
      decalage.z = voulu.z;
      // La caméra suit le doigt tout de suite, sans attendre son pas : le point du sol saisi reste sous le doigt.
      camTarget.x += fait.x;
      camTarget.z += fait.z;
      camPos.x += fait.x;
      camPos.z += fait.z;
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      camera.updateMatrixWorld();
    },
    recentrer: zero,
    decale: () => estDecale(decalage) || zoom > 1 + 1e-6,
    decalage: () => decalage,
    zoomer: (facteur, vers) => {
      if (!instant.carte || !cadrageCarte || !(facteur > 0)) return false;
      const voulu = Math.min(cadrageCarte.zoomMax, Math.max(1, zoom * facteur));
      if (Math.abs(voulu - zoom) < 1e-9) return false;
      const saisi = solVu(vers, avantLeZoom);
      // La caméra avance (ou recule) vers sa cible tout de suite, sans attendre son pas : la vue suit les doigts.
      const k = zoom / voulu;
      camPos.sub(camTarget).multiplyScalar(k).add(camTarget);
      zoom = voulu;
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      // Le point saisi revient sous le doigt : la vue glisse à plat d'autant.
      if (saisi && solVu(vers, apresLeZoom)) self.glisser(avantLeZoom.x - apresLeZoom.x, avantLeZoom.z - apresLeZoom.z);
      else camera.updateMatrixWorld();
      return true;
    },
    auBut: (point, W, H) => {
      if (!vu) return null;
      placerLEssai(but.target, but.pos);
      projete.copy(point).project(essai);
      if (projete.z > 1) return null;
      return { x: ((projete.x + 1) / 2) * W, y: ((1 - projete.y) / 2) * H };
    },
    recadrer: (point, vers) => {
      recadre = { point: point.clone(), vers: { ...vers } };
    },
    poser: () => {
      if (!vu) return Infinity;
      const ecart = camTarget.distanceTo(vise) + camPos.distanceTo(place);
      camTarget.copy(vise);
      camPos.copy(place);
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      return ecart;
    },
    animer: (_t, _dt, reduit) => {
      if (!instant.carte) surLaCarte = false;
      const sailing = instant.navigue;
      const walking = instant.marche;
      const { focus, home, carte: carteDemandee } = derniers.current;
      // L'application reprend la main : une nouvelle demande de cadrage, la Carte ouverte ou fermée, une marche, un voyage.
      const ile = focus.island ?? null;
      if (focus.seq !== demande.seq || ile !== demande.ile || carteDemandee !== demande.carte || sailing || walking) {
        zero();
        recadre = null;
      }
      demande.seq = focus.seq;
      demande.ile = ile;
      demande.carte = carteDemandee;
      // Une longue traversée : le cadre fixe, s'il tient à une taille lisible ; sinon la caméra suit le bonhomme.
      const fixe = !sailing && walking && instant.traversee ? traversee(instant.traversee, camera.aspect) : null;
      // En mer (ou dans les airs) : vue de côté sur le navire, la caméra s'écarte à mesure qu'il s'éloigne.
      const frame = sailing
        ? (() => {
            const dist = sailing.stage === 1 ? 22 + 12 * sailing.k : sailing.stage === 2 ? 22 + 26 * sailing.k : 26;
            const target = new THREE.Vector3(sailing.at.x + 2.5, sailing.at.y + (sailing.stage === 3 ? 4 : 1), sailing.at.z + 5);
            const len = Math.hypot(VOYAGE_VIEW.dx, VOYAGE_VIEW.dy, VOYAGE_VIEW.up);
            const pos = new THREE.Vector3(target.x + (dist * VOYAGE_VIEW.dx) / len, target.y + (dist * VOYAGE_VIEW.up) / len, target.z + (dist * VOYAGE_VIEW.dy) / len);
            return { target, pos };
          })()
        : fixe ??
          framing(
            walking ? null : focus.island,
            avatar.position,
            camera.aspect,
            instant.carte,
            walking ? null : home,
            walking ? null : (focus.spot ?? null),
          );
      // Le cadrage de la Carte est gardé d'une image à l'autre : le décalage s'ajoute à une copie.
      const target = vise.copy(frame.target);
      const pos = place.copy(frame.pos);
      // Une fiche cachait son objet : le cadrage glisse à plat pour le poser dans la place libre.
      if (recadre && !sailing && !fixe && !instant.carte) {
        placerLEssai(target, pos);
        decalagePourViser(essai, recadre.point, recadre.vers, glissement, rayon);
        target.add(glissement);
        pos.add(glissement);
      }
      // Sur la Carte, le zoom rapproche la caméra de sa cible (la vue de l'élève, et celle que voient les étiquettes).
      const surLaCarteIci = instant.carte && !sailing && !fixe;
      // Hors de la Carte, pas de zoom ; sur la Carte, la borne de près suit la place libre (la taille du texte a changé).
      if (!surLaCarteIci) zoom = 1;
      else if (cadrageCarte && zoom > cadrageCarte.zoomMax) zoom = cadrageCarte.zoomMax;
      if (!self.glissant) zoomDuBut = zoom;
      const kDuBut = 1 / zoomDuBut;
      const kVu = 1 / zoom;
      base.x = target.x;
      base.z = target.z;
      // La place visée a pu bouger (la vue a changé de taille) : le décalage reste dans l'archipel.
      bornerLeDecalage(base, decalage, etendue, decalage);
      if (!self.glissant) {
        decalageDuBut.x = decalage.x;
        decalageDuBut.z = decalage.z;
      }
      but.target.set(target.x + decalageDuBut.x, target.y, target.z + decalageDuBut.z);
      but.pos.set(target.x + (pos.x - target.x) * kDuBut + decalageDuBut.x, target.y + (pos.y - target.y) * kDuBut, target.z + (pos.z - target.z) * kDuBut + decalageDuBut.z);
      pos.sub(target).multiplyScalar(kVu).add(target);
      target.x += decalage.x;
      target.z += decalage.z;
      pos.x += decalage.x;
      pos.z += decalage.z;
      vu = true;
      const k = reduit ? 1 : 1 - Math.exp(-PAS * 3.5);
      // La taille du texte a changé sur la Carte : la caméra se recadre d'un coup, sans mouvement.
      const saut = 'saut' in frame && frame.saut;
      if (saut || (camTarget.lengthSq() === 0 && camPos.lengthSq() === 0)) {
        camTarget.copy(target);
        camPos.copy(pos);
      } else {
        camTarget.lerp(target, k);
        camPos.lerp(pos, k);
      }
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
    },
    dispose: () => {},
  };
  return self;
}
