// La caméra de la scène 3D : gérée par l'application (pas de zoom ni de rotation ; on touche une île pour y aller).
// Elle rejoint en douceur sa place : le navire en route, le bonhomme qui marche, l'île ouverte, sinon le bonhomme.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { CADRAGE_DU_REPERE, repereDeLaVue } from '../world/cadrage';
import { islandCenter, viewYaw, viewZone } from '../world/terrain';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';

/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.42 };
/** Vue d'une île : plus haute, pour voir le plan au fond. */
export const ISLAND_VIEW = { dx: 0.7, dy: -0.7, up: 0.9 };
const ISLAND_DISTANCE = 30;
/** Vue autour du bonhomme : assez loin pour voir son île et les voisines (bornes du cadrage de zone). */
const FOLLOW_DISTANCE = 50;
const FOLLOW_MAX = 64;
/** La Carte : presque à la verticale, le même nord, assez loin pour tout le continent. */
const MAP_VIEW = { dx: 0.03, dy: -0.4, up: 1 };
const MAP_FOV = 40;
/** Le voyage : vue de côté, depuis l'ouest, la caméra qui s'écarte à mesure que le navire s'éloigne. */
const VOYAGE_VIEW = { dx: -0.85, dy: -0.4, up: 0.3 };
/**
 * Le pas de la caméra vers sa place, en secondes, le même à chaque image : c'est ce qu'elle faisait avant la découpe
 * de la scène (son pas se calculait après la mise à jour de l'horloge de l'image, donc valait toujours ce repli).
 */
const PAS = 0.016;

export interface Camera extends PartieDeLaScene {
  /** Là où la caméra regarde en ce moment (les flèches du clavier cherchent l'île voisine depuis ce point). */
  cible: THREE.Vector3;
  /** Au premier cadrage : la caméra y est d'un coup. */
  cadrer(focus: Derniers['focus'], carte: boolean, home: BiomeId | null): void;
}

export function creerCamera(monde: Monde, camera: THREE.PerspectiveCamera, avatar: THREE.Object3D, derniers: { readonly current: Derniers }, instant: Instant): Camera {
  const { etendue: bounds, centre: center } = monde;
  const reperes = monde.habillage.reperes === 'cadres';
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
    if (onMap) {
      // Tout le continent tient dans la vue, en largeur comme en profondeur (la vue est un peu inclinée).
      const ex = bounds.maxX - bounds.minX;
      const ey = bounds.maxY - bounds.minY;
      const need = Math.max(ey * 1.35, (ex * 1.2) / Math.max(0.3, aspect));
      const d = need / (2 * Math.tan((MAP_FOV / 2) * (Math.PI / 180)));
      const len = Math.hypot(MAP_VIEW.dx, MAP_VIEW.dy, MAP_VIEW.up);
      // Un peu au nord : le continent descend sur l'écran, sous la ligne d'aide.
      const target = new THREE.Vector3(center.x, 0, center.y + ey * 0.18);
      const pos = new THREE.Vector3(target.x + (d * MAP_VIEW.dx) / len, target.y + (d * MAP_VIEW.up) / len, target.z + (d * MAP_VIEW.dy) / len);
      return { target, pos };
    }
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
    cadrer: (focus, carte, home) => {
      const { target, pos } = framing(focus.island, avatar.position, camera.aspect, carte, home, focus.spot ?? null);
      camTarget.copy(target);
      camPos.copy(pos);
      camera.position.copy(pos);
      camera.lookAt(target);
    },
    animer: (_t, _dt, reduit) => {
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
      if (camTarget.lengthSq() === 0 && camPos.lengthSq() === 0) {
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
