// Les objets qu'on touche, dans la scène 3D (les règles : world/affordance.ts) : leurs zones de toucher.
// Une borne ou un Gardien plus petits que 48 pixels à l'écran se touchent aussi tout autour, dans un carré de 48 pixels ;
// les autres objets se touchent directement. Les bulles qui montrent ce qu'on peut faire sont dessinées avec les plaques
// des créatures (./signes.ts). Rien sur la Carte ni pendant le voyage. Les losanges (l'habillage, `signesDesObjets` ;
// plus aucun univers ne les prend depuis le 4 octobre 2026) n'en ont pas (./bornes.ts).
import * as THREE from 'three';
import { zoneDeToucher, SIGNE, type ObjetTouche, type SigneDObjet, type ZoneDObjet } from '../world/affordance';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';

export interface Affordance extends PartieDeLaScene {
  /** Les objets touchables (refaits quand le monde change). */
  poser(objets: readonly SigneDObjet[]): void;
  /**
   * Les zones de toucher des bornes et des Gardiens plus petits que 48 pixels à l'écran vu par `cam` (W × H pixels CSS),
   * élargies à 48 pixels autour de leur centre. Calculées au doigt levé seulement ; aucune sur la Carte ni en voyage.
   */
  zones(cam: THREE.PerspectiveCamera, W: number, H: number): { objet: ObjetTouche; zone: ZoneDObjet }[];
}

/** Une partie sans zones (Archipéo). */
function sansZones(): Affordance {
  return { poser: () => {}, zones: () => [], dispose: () => {} };
}

export function creerAffordance(monde: Monde, derniers: { current: Derniers }, instant: Instant): Affordance {
  if (monde.habillage.signesDesObjets !== 'bulles') return sansZones();
  let objets: readonly SigneDObjet[] = [];
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
    zones: (cam, W, H) => {
      if (!montres) return [];
      const out: { objet: ObjetTouche; zone: ZoneDObjet }[] = [];
      cam.updateMatrixWorld();
      for (const s of objets) {
        if (s.objet.genre !== 'borne' && s.objet.genre !== 'gardien') continue;
        boite.min.set(s.boite.min.x, s.boite.min.z, s.boite.min.y);
        boite.max.set(s.boite.max.x, s.boite.max.z, s.boite.max.y);
        const o = projeter(boite, cam, W, H);
        // La distance de l'objet à la caméra : le sol touché devant lui le cache.
        if (o && (o[2] - o[0] < SIGNE.zonePx || o[3] - o[1] < SIGNE.zonePx)) out.push({ objet: s.objet, zone: { ...zoneDeToucher(...o, boite.distanceToPoint(cam.position)), boite: s.boite } });
      }
      return out;
    },
    animer: () => {
      montres = objets.length > 0 && !derniers.current.carte && !instant.carte && !instant.navigue;
    },
    dispose: () => {},
  };
}
