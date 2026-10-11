// Les objets qu'on touche, dans la scène 3D (les règles : world/affordance.ts) : leurs zones de toucher.
// Une borne, un Gardien ou une créature plus petits que 48 pixels à l'écran se touchent aussi tout autour, dans un carré
// de 48 pixels (là où ils se chevauchent, la borne gagne) ; les autres objets se touchent directement. Les bulles qui montrent
// ce qu'on peut faire sont dessinées avec les plaques des créatures (./signs.ts). Rien sur la Carte ni pendant le voyage.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { zoneDeToucher, SIGNE, type Boite, type CibleDeLaBulle, type SigneDObjet, type ZoneDObjet } from '../world/affordance';
import type { Derniers, Instant, PartieDeLaScene } from './scenePart';

export interface Affordance extends PartieDeLaScene {
  /** Les objets touchables (refaits quand le monde change). */
  poser(objets: readonly SigneDObjet[]): void;
  /** Les créatures et la boîte de leur dessin (refaites quand elles changent ; aucune pour des personnages en modèles). */
  poserLesCreatures(creatures: readonly { id: BiomeId; boite: Boite }[]): void;
  /**
   * Les zones de toucher des bornes, des Gardiens et des créatures plus petits que 48 pixels à l'écran vu par `cam` (W × H pixels CSS),
   * élargies à 48 pixels autour de leur centre. Calculées au doigt levé seulement ; aucune sur la Carte ni en voyage.
   */
  zones(cam: THREE.PerspectiveCamera, W: number, H: number): { objet: CibleDeLaBulle; zone: ZoneDObjet }[];
}

export function creerAffordance(derniers: { current: Derniers }, instant: Instant): Affordance {
  let objets: readonly SigneDObjet[] = [];
  let creatures: readonly { id: BiomeId; boite: Boite }[] = [];
  /** Ni Carte ni voyage : sinon, aucune zone de toucher. */
  let montres = false;
  const boite = new THREE.Box3();
  const coin = new THREE.Vector3();
  /** Le rectangle à l'écran d'une boîte du monde de la scène, ou `null` si un de ses coins est derrière la caméra. */
  const projeter = (b: THREE.Box3, cam: THREE.Camera, W: number, H: number): [number, number, number, number] | null => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let k = 0; k < 8; k++) {
      coin.set(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).project(cam);
      if (coin.z > 1) return null;
      const x = ((coin.x + 1) / 2) * W;
      const y = ((1 - coin.y) / 2) * H;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
    return [x0, y0, x1, y1];
  };

  return {
    poser: (liste) => {
      objets = liste;
    },
    poserLesCreatures: (liste) => {
      creatures = liste;
    },
    zones: (cam, W, H) => {
      if (!montres) return [];
      const out: { objet: CibleDeLaBulle; zone: ZoneDObjet }[] = [];
      cam.updateMatrixWorld();
      const zone = (objet: CibleDeLaBulle, b: Boite) => {
        boite.min.set(b.min.x, b.min.z, b.min.y);
        boite.max.set(b.max.x, b.max.z, b.max.y);
        const o = projeter(boite, cam, W, H);
        // La distance de l'objet à la caméra : le sol touché devant lui le cache. Une borne passe avant un Gardien ou
        // une créature là où leurs zones se chevauchent (`priorite`).
        if (o && (o[2] - o[0] < SIGNE.zonePx || o[3] - o[1] < SIGNE.zonePx))
          out.push({ objet, zone: { ...zoneDeToucher(...o, boite.distanceToPoint(cam.position)), boite: b, priorite: objet.genre === 'borne' ? 1 : 0 } });
      };
      for (const s of objets) if (s.objet.genre === 'borne' || s.objet.genre === 'gardien') zone(s.objet, s.boite);
      for (const c of creatures) zone({ genre: 'creature', id: c.id }, c.boite);
      return out;
    },
    animer: () => {
      montres = (objets.length > 0 || creatures.length > 0) && !derniers.current.carte && !instant.carte && !instant.navigue;
    },
    dispose: () => {},
  };
}
