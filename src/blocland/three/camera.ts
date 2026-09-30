// La caméra de la scène 3D : gérée par l'application (pas de zoom ni de rotation ; on touche une île pour y aller).
// Elle rejoint en douceur sa place : le navire en route, le bonhomme qui marche, l'île ouverte, sinon le bonhomme.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { RESERVE_DU_BAS, type PlaceLue, type Rect } from '../placeLibre';
import type { ArchipelagoId } from '../world/archipelago';
import { CADRAGE_DU_REPERE, repereDeLaVue } from '../world/cadrage';
import { mapOf } from '../world/map';
import { islandCenter, VUE_DE_L_ILE, viewYaw, viewZone, worldBounds } from '../world/terrain';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';

/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.42 };
/** Vue d'une île : plus haute, pour voir le plan au fond (world/terrain.ts : les bornes y restent visibles). */
export const ISLAND_VIEW = VUE_DE_L_ILE;
const ISLAND_DISTANCE = 30;
/** Vue autour du bonhomme : assez loin pour voir son île et les voisines (bornes du cadrage de zone). */
const FOLLOW_DISTANCE = 50;
const FOLLOW_MAX = 64;
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
  /** L'île sous la flèche de la Carte, ou `null`. */
  destination(): BiomeId | null;
}

/**
 * Le cadrage de la Carte dans la place libre `libre` d'une vue `w` × `h` (pixels CSS) : la caméra recule assez pour que
 * l'archipel entier y tienne, avec la destination, sa flèche et son nom, jusqu'au plancher (`PLANCHER_DE_LA_CARTE`).
 * Au-delà, elle reste au plancher et la destination se pose au centre de la place libre : le bord de l'archipel sort.
 * `echelle` : les pixels par case au centre visé ; `auPlancher` : l'archipel ne tient pas entier.
 */
export function cadrageDeLaCarte(
  archipel: ArchipelagoId,
  destination: BiomeId | null,
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
  const c = destination ? islandCenter(destination) : null;
  // La pointe de la flèche se pose au centre de l'île (three/etiquettes.ts).
  const dest = c ? new THREE.Vector3(c.x + 0.5, c.z, c.y + 0.5) : null;
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

export interface Camera extends PartieDeLaScene {
  /** Là où la caméra regarde en ce moment (les flèches du clavier cherchent l'île voisine depuis ce point). */
  cible: THREE.Vector3;
  /** Au premier cadrage : la caméra y est d'un coup. */
  cadrer(focus: Derniers['focus'], carte: boolean, home: BiomeId | null): void;
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
  let contexte = { ouvertures: -1, destination: null as BiomeId | null, cle: '' };
  let cadrageCarte: { lue: PlaceLue | null; destination: BiomeId | null; aspect: number; target: THREE.Vector3; pos: THREE.Vector3 } | null = null;
  /**
   * Le cadrage de la Carte, recalculé seulement quand la place libre lue (le même objet tant qu'elle ne change pas) ou
   * la destination changent (pas image par image). `saut` : sans mouvement.
   */
  const laCarte = (aspect: number) => {
    if (!surLaCarte) ouvertures++;
    surLaCarte = true;
    const destination = carte?.destination() ?? null;
    if (contexte.ouvertures !== ouvertures || contexte.destination !== destination) contexte = { ouvertures, destination, cle: `${ouvertures}|${destination ?? ''}` };
    const lue = carte?.place(contexte.cle) ?? null;
    if (!cadrageCarte || cadrageCarte.lue !== lue || cadrageCarte.destination !== destination || (!lue && cadrageCarte.aspect !== aspect)) {
      // Sans lecture (un test) : une vue de tablette, moins la bande des boutons du bas.
      const w = lue ? Math.max(1, lue.w) : HAUTEUR_DE_TABLETTE * aspect;
      const h = lue ? Math.max(1, lue.h) : HAUTEUR_DE_TABLETTE;
      const libre = lue?.libre ?? { x0: 0, y0: 0, x1: w, y1: h - RESERVE_DU_BAS };
      cadrageCarte = { lue, destination, aspect, ...cadrageDeLaCarte(monde.archipel, destination, w, h, libre) };
    }
    return { target: cadrageCarte.target, pos: cadrageCarte.pos, saut: lue?.saut ?? false };
  };
  /**
   * Où la caméra veut être : sur l'île ouverte (vue rapprochée), sinon autour du bonhomme. La caméra est gérée par
   * l'application : pas de zoom ni de rotation ; on touche une île pour y aller. En portrait, un peu plus loin pour
   * que tout tienne dans la largeur.
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
    const target = new THREE.Vector3(c.x, c.z + 1, c.y);
    const pos = new THREE.Vector3(c.x + d * dx, c.z + 1 + d * v.up, c.y + d * dy);
    return { target, pos };
  };

  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const { but } = instant;

  return {
    cible: camTarget,
    cadrer: (focus, carteOuverte, home) => {
      const { target, pos } = framing(focus.island, avatar.position, camera.aspect, carteOuverte, home, focus.spot ?? null);
      camTarget.copy(target);
      camPos.copy(pos);
      camera.position.copy(pos);
      camera.lookAt(target);
    },
    animer: (_t, _dt, reduit) => {
      if (!instant.carte) surLaCarte = false;
      const sailing = instant.navigue;
      const walking = instant.marche;
      const { focus, home } = derniers.current;
      // En mer (ou dans les airs) : vue de côté sur le navire, la caméra s'écarte à mesure qu'il s'éloigne.
      const frame = sailing
        ? (() => {
            const dist = sailing.stage === 1 ? 22 + 12 * sailing.k : sailing.stage === 2 ? 22 + 26 * sailing.k : 26;
            const target = new THREE.Vector3(sailing.at.x + 2.5, sailing.at.y + (sailing.stage === 3 ? 4 : 1), sailing.at.z + 5);
            const len = Math.hypot(VOYAGE_VIEW.dx, VOYAGE_VIEW.dy, VOYAGE_VIEW.up);
            const pos = new THREE.Vector3(target.x + (dist * VOYAGE_VIEW.dx) / len, target.y + (dist * VOYAGE_VIEW.up) / len, target.z + (dist * VOYAGE_VIEW.dy) / len);
            return { target, pos };
          })()
        : framing(
            walking ? null : focus.island,
            avatar.position,
            camera.aspect,
            instant.carte,
            walking ? null : home,
            walking ? null : (focus.spot ?? null),
          );
      const { target, pos } = frame;
      but.target.copy(target);
      but.pos.copy(pos);
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
}
