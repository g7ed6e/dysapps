// Les cadrages de la caméra : les vues (île, suivi, Carte, voyage), le cadrage de la Carte selon la place libre et la
// destination, celui de la traversée, et le décalage qui vise un point au-dessus du sol.
import * as THREE from 'three';
import { bornesDesLieux, type CadreDeCases, DISTANCE_DE_LA_VUE_DE_L_ILE, HAUTEUR_DES_NOMS, islandCenter, VISEE_AU_DESSUS_DU_SOL, VUE_DE_L_ILE, worldBounds } from '../../world/terrain';
import type { PlaceLue, Rect } from '../../freeSpace';
import type { BiomeId } from '../../biomes';
import type { ArchipelagoId } from '../../world/archipelago';
import { mapOf } from '../../world/map';

/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
export const VIEW = { dx: 0.3, dy: -0.95, up: 0.42 };

/** Vue d'une île : plus haute, pour voir le plan au fond (world/terrain.ts : les bornes y restent visibles). */
export const ISLAND_VIEW = VUE_DE_L_ILE;

export const ISLAND_DISTANCE = DISTANCE_DE_LA_VUE_DE_L_ILE;

/** Vue autour du bonhomme : assez loin pour voir son île et les voisines (bornes du cadrage de zone). */
export const FOLLOW_DISTANCE = 50;

export const FOLLOW_MAX = 64;

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
 * Le zoom de la Carte, au plus près : une île (`LARGEUR_D_UNE_ILE` cases) y remplit la moitié du petit côté de la place
 * libre, deux îles environ en vue : la Carte reste une vue de l'archipel, le gros plan est au monde (piste A du
 * mainteneur, 7 octobre 2026). Au plus loin, le cadrage d'ouverture (jamais sous le plancher).
 */
export const ZOOM_DE_LA_CARTE = { ile: 1 / 2 };

/**
 * Le zoom du monde (hors de la Carte), autour du cadrage géré (1) : au plus loin, la caméra recule un peu moins de
 * deux fois plus, l'île et ses voisines en vue, jamais l'archipel entier, qui est à la Carte (piste A du mainteneur,
 * 7 octobre 2026 : le monde pour jouer, la Carte pour s'orienter ; ×0,3 montrait presque tout l'archipel, comme la
 * Carte) ; au plus près, elle est deux fois et demie plus proche (le bonhomme et les blocs en gros plan, sans passer
 * sous la brume ni dans le sol).
 */
export const ZOOM_DU_MONDE = { loin: 0.6, pres: 2.5 };

/** La largeur d'une île, en cases (environ, world/terrain.ts) : la mesure du zoom le plus proche. */
export const LARGEUR_D_UNE_ILE = 22;

/** Entre l'archipel entier et le bord de la place libre. */
const MARGE_DE_LA_CARTE = 12;


/** La moitié de la hauteur de l'étiquette d'une île sur la Carte (le nom et l'état, 18 px, labelCanvas.ts), en pixels CSS. */
const DEMI_HAUTEUR_D_UN_NOM = 31;

/** Sans page autour (un aperçu, un test) : une vue de tablette, moins la bande des boutons du bas. */
export const HAUTEUR_DE_TABLETTE = 688;

/** Le voyage : vue de côté, depuis l'ouest, la caméra qui s'écarte à mesure que le navire s'éloigne. */
export const VOYAGE_VIEW = { dx: -0.85, dy: -0.4, up: 0.3 };

/**
 * Le pas de la caméra vers sa place, en secondes, le même à chaque image : c'est ce qu'elle faisait avant la découpe
 * de la scène (son pas se calculait après la mise à jour de l'horloge de l'image, donc valait toujours ce repli).
 */
export const PAS = 0.016;

/** Le cadrage de la Carte (DA-31) : la place que l'interface laisse libre, et la prochaine destination. */
export interface LectureDeLaCarte {
  /** La place libre de la vue, relue quand `contexte` change (../freeSpace.ts, `lecteurDePlaceLibre`). */
  place(contexte: string): PlaceLue;
  /** L'île sous la flèche de la Carte, ou le point du monde où elle pose sa pointe (un ouvrage, GD-7), ou `null`. */
  destination(): DestinationDeLaCarte;
}

/** Ce que la flèche de la Carte désigne : une île, ou le point du monde (x, y au sol, z en hauteur) de sa pointe. */
export type DestinationDeLaCarte = BiomeId | { x: number; y: number; z: number } | null;

/** Une clé de la destination, pour savoir si elle a changé (un point se compare par ses coordonnées). */
export const cleDeLaDestination = (d: DestinationDeLaCarte): string => (d === null ? '' : typeof d === 'string' ? d : `${d.x},${d.y},${d.z}`);

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
  // La pointe de la flèche se pose au centre de l'île (three/labels.ts), ou sur le point donné (un ouvrage).
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
  /** À l'écran, les lieux d'aujourd'hui (îlots et port compris) et leurs noms (`HAUTEUR_DES_NOMS` au-dessus de chaque île). */
  const lieux = () => {
    const b = bornesDesLieux(archipel);
    const r = { y0: Infinity, y1: -Infinity };
    for (const x of [b.minX, b.maxX])
      for (const y of [b.minY, b.maxY]) {
        v.set(x, altitude, y).project(cam);
        const q = ((1 - v.y) / 2) * h;
        r.y0 = Math.min(r.y0, q);
        r.y1 = Math.max(r.y1, q);
      }
    for (const def of mapOf(archipel)) {
      const p = islandCenter(def.id);
      v.set(p.x + 0.5, p.z + HAUTEUR_DES_NOMS, p.y + 0.5).project(cam);
      r.y0 = Math.min(r.y0, ((1 - v.y) / 2) * h - DEMI_HAUTEUR_D_UN_NOM);
    }
    return r;
  };
  /**
   * À l'écran, le cadre des îles : en largeur, leurs cœurs (le milieu de chaque île, sous son nom) ; en hauteur, les lieux
   * d'aujourd'hui et leurs noms (`lieux`).
   */
  const ilesALEcran = () => {
    const r = { x0: Infinity, x1: -Infinity, ...lieux() };
    for (const def of mapOf(archipel)) {
      const p = islandCenter(def.id);
      v.set(p.x + 0.5, p.z, p.y + 0.5).project(cam);
      const q = ((v.x + 1) / 2) * w;
      r.x0 = Math.min(r.x0, q);
      r.x1 = Math.max(r.x1, q);
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
  const glisser = () => {
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
  };
  glisser();
  if (!auPlancher && r0.y1 - r0.y0 <= lh) {
    // Les lieux occupent rarement tout le cadre de leur région : au 5e et au 4e, ils sont au nord, et le sud du cadre
    // laissait 250 px de mer vide sous eux sur la tablette, leurs noms à 5 px du haut (UX UI, HG-3). Les lieux et leurs
    // noms glissent au milieu de la place, haut et bas à égalité, tant que le cadre, la destination et ce qui l'entoure
    // restent dedans (GD-9 : on aménage partout dans la région, la vue d'ensemble la montre toute).
    placer(d);
    const r = cadre(true);
    const l = lieux();
    const voulu = (libre.y0 + libre.y1) / 2 - (l.y0 + l.y1) / 2;
    const ecart = Math.min(libre.y1 - MARGE_DE_LA_CARTE - r.y1, Math.max(libre.y0 + MARGE_DE_LA_CARTE - r.y0, voulu));
    if (Math.abs(ecart) > 0.5) {
      vise.y += ecart;
      glisser();
    }
  }
  if (auPlancher && dest && h > w) {
    // Au plancher, la destination au centre laissait sortir le bord de l'archipel alors qu'il tenait dans la place : en
    // portrait 800 × 1280, au 3e, la Ruche des réseaux et le Refuge des carnets sortaient à gauche, 450 px vides en haut
    // (référent dys, SC-3). En portrait, les îles et leurs noms glissent au milieu de la place, dans chaque sens où elles
    // y tiennent (en largeur, le milieu de chacune), tant que la destination et ce qui l'entoure restent dedans. En
    // paysage (la tablette, panneau ouvert), la destination reste au centre : les noms tus mesurés y restent ceux d'avant
    // (three/mapLabels.test.ts).
    placer(d);
    const l = ilesALEcran();
    const r = cadre(false);
    const M = MARGE_DE_LA_CARTE;
    const centrer = (tient: boolean, voulu: number, bas: number, haut: number) => (tient && bas <= haut ? Math.min(haut, Math.max(bas, voulu)) : 0);
    const ex = centrer(l.x1 - l.x0 <= lw, (libre.x0 + libre.x1) / 2 - (l.x0 + l.x1) / 2, libre.x0 + M - r.x0, libre.x1 - M - r.x1);
    const ey = centrer(l.y1 - l.y0 <= lh, (libre.y0 + libre.y1) / 2 - (l.y0 + l.y1) / 2, libre.y0 + M - r.y0, libre.y1 - M - r.y1);
    if (Math.abs(ex) > 0.5 || Math.abs(ey) > 0.5) {
      vise.x += ex;
      vise.y += ey;
      glisser();
    }
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

/** Le point visé de l'écran, réutilisé d'un appel à l'autre (le recadrage le demande à chaque image). */
export const VISEE = new THREE.Vector2();

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
